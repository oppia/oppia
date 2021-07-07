# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Common classes and methods for managing long running jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import copy
import json
import logging
import traceback

from core.domain import taskqueue_services
from core.platform import models
import python_utils
import utils

from mapreduce import base_handler
from mapreduce import context
from mapreduce import input_readers
from mapreduce import mapreduce_pipeline
from mapreduce import output_writers
from mapreduce import util as mapreduce_util
from pipeline import pipeline

(base_models, job_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.job])

app_identity_services = models.Registry.import_app_identity_services()
datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()

MAPPER_PARAM_KEY_ENTITY_KINDS = 'entity_kinds'
MAPPER_PARAM_KEY_QUEUED_TIME_MSECS = 'queued_time_msecs'
# Name of an additional parameter to pass into the MR job for cleaning up
# old auxiliary job models.
MAPPER_PARAM_MAX_START_TIME_MSEC = 'max_start_time_msec'

STATUS_CODE_NEW = job_models.STATUS_CODE_NEW
STATUS_CODE_QUEUED = job_models.STATUS_CODE_QUEUED
STATUS_CODE_STARTED = job_models.STATUS_CODE_STARTED
STATUS_CODE_COMPLETED = job_models.STATUS_CODE_COMPLETED
STATUS_CODE_FAILED = job_models.STATUS_CODE_FAILED
STATUS_CODE_CANCELED = job_models.STATUS_CODE_CANCELED

VALID_STATUS_CODE_TRANSITIONS = {
    STATUS_CODE_NEW: [STATUS_CODE_QUEUED],
    STATUS_CODE_QUEUED: [STATUS_CODE_STARTED, STATUS_CODE_CANCELED],
    STATUS_CODE_STARTED: [
        STATUS_CODE_COMPLETED, STATUS_CODE_FAILED, STATUS_CODE_CANCELED],
    STATUS_CODE_COMPLETED: [],
    STATUS_CODE_FAILED: [],
    STATUS_CODE_CANCELED: [],
}

# The default amount of time that defines a 'recent' job. Jobs that were
# queued more recently than this number of milliseconds ago are considered
# 'recent'.
DEFAULT_RECENCY_MSEC = 14 * 24 * 60 * 60 * 1000
# The maximum number of previously-run jobs to show in the admin dashboard.
NUM_JOBS_IN_DASHBOARD_LIMIT = 100
# The default retention time is 2 days.
MAX_MAPREDUCE_METADATA_RETENTION_MSECS = 2 * 24 * 60 * 60 * 1000


class BaseJobManager(python_utils.OBJECT):
    """Base class for managing long-running jobs.

    These jobs are not transaction-safe, and multiple jobs of the same kind
    may run at once and overlap. Individual jobs should account for this. In
    particular, if a job writes to some location, no other enqueued or running
    job should be writing to, or reading from, that location.

    This is expected to be the case for one-off migration jobs, as well as
    batch reporting jobs. One-off migration jobs are expected to be transient
    and will not be a permanent part of the codebase. Batch reporting jobs are
    expected to write to a particular datastore model that is optimized for
    fast querying; each batch reporting job should correspond to exactly one of
    these models. The reporting jobs are expected to be run as MapReduces; to
    find existing ones, search for subclasses of BaseMapReduceJobManager.

    Note that the enqueue(), register_start(), register_completion(),
    register_failure() and cancel() methods in this class batch the following
    operations:
        (a) Running pre- and post-hooks
        (b) Updating the status of the job in the datastore
        (c) Performing the operation.
    Each entire batch is not run in a transaction, but subclasses can still
    perform (a) or (c) transactionally if they wish to.
    """

    @classmethod
    def _is_abstract(cls):
        """Checks if the job is created using the abstract base manager class.

        Returns:
            bool. Whether the job is created using abstract base manager class.
        """
        return cls in ABSTRACT_BASE_CLASSES

    @classmethod
    def create_new(cls):
        """Creates a new job of this class type.

        Returns:
            str. The unique id of this job.

        Raises:
            Exception. This method (instead of a subclass method) was directly
                used to create a new job.
        """
        if cls._is_abstract():
            raise Exception(
                'Tried to directly create a job using the abstract base '
                'manager class %s, which is not allowed.' % cls.__name__)

        @transaction_services.run_in_transaction_wrapper
        def _create_new_job_transactional():
            """Creates a new job by generating a unique id and inserting
            it into the model.

            Returns:
                str. The unique job id.
            """
            job_id = job_models.JobModel.get_new_id(cls.__name__)
            model = job_models.JobModel(id=job_id, job_type=cls.__name__)
            model.update_timestamps()
            model.put()
            return job_id

        return _create_new_job_transactional()

    @classmethod
    def enqueue(
            cls, job_id, queue_name,
            additional_job_params=None, shard_count=None):
        """Marks a job as queued and adds it to a queue for processing.

        Args:
            job_id: str. The ID of the job to enqueue.
            queue_name: str. The queue name the job should be run in. See
                core.platform.taskqueue.gae_taskqueue_services for supported
                values.
            additional_job_params: dict(str : *) or None. Additional parameters
                for the job.
            shard_count: int. Number of shards used for the job.
        """
        # Ensure that preconditions are met.
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_valid_transition(
            job_id, model.status_code, STATUS_CODE_QUEUED)
        cls._require_correct_job_type(model.job_type)

        # Enqueue the job.
        cls._real_enqueue(
            job_id, queue_name, additional_job_params, shard_count)

        model.status_code = STATUS_CODE_QUEUED
        model.time_queued_msec = utils.get_current_time_in_millisecs()
        model.additional_job_params = additional_job_params
        model.update_timestamps()
        model.put()

    @classmethod
    def register_start(cls, job_id, metadata=None):
        """Marks a job as started.

        Args:
            job_id: str. The ID of the job to start.
            metadata: dict(str : *) or None. Additional metadata of the job.
        """
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_valid_transition(
            job_id, model.status_code, STATUS_CODE_STARTED)
        cls._require_correct_job_type(model.job_type)

        cls._pre_start_hook(job_id)

        model.metadata = metadata
        model.status_code = STATUS_CODE_STARTED
        model.time_started_msec = utils.get_current_time_in_millisecs()
        model.update_timestamps()
        model.put()

    @classmethod
    def register_completion(
            cls, job_id, output_list, max_output_len_chars=None):
        """Marks a job as completed.

        Args:
            job_id: str. The ID of the job to complete.
            output_list: list(object). The output produced by the job.
            max_output_len_chars: int or None. Max length of output_list.
                If None, the default maximum output length is used.
        """
        _default_max_len_chars = 900000
        _max_output_len_chars = (
            _default_max_len_chars if max_output_len_chars is None else
            max_output_len_chars)
        # Ensure that preconditions are met.
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_valid_transition(
            job_id, model.status_code, STATUS_CODE_COMPLETED)
        cls._require_correct_job_type(model.job_type)

        model.status_code = STATUS_CODE_COMPLETED
        model.time_finished_msec = utils.get_current_time_in_millisecs()
        model.output = cls._compress_output_list(
            output_list, _max_output_len_chars)
        model.update_timestamps()
        model.put()

        cls._post_completed_hook(job_id)

    @classmethod
    def _compress_output_list(
            cls, output_list, max_output_len_chars):
        """Returns compressed list of strings within a max length of chars.

        Ensures that the payload (i.e.,
        [python_utils.UNICODE(output) for output in output_list])
        makes up at most max_output_chars of the final output data.

        Args:
            output_list: list(*). Collection of objects to be stringified.
            max_output_len_chars: int. Maximum length of output_list.

        Returns:
            list(str). The compressed stringified output values.
        """

        class _OrderedCounter(collections.Counter, collections.OrderedDict):
            """Counter that remembers the order elements are first encountered.

            We use this class so that our tests can rely on deterministic
            ordering, instead of simply using `collections.Counter` which has
            non-deterministic ordering.
            """

            pass

        # Consolidate the lines of output since repeating them isn't useful.
        counter = _OrderedCounter(
            python_utils.UNICODE(output) for output in output_list)
        output_str_list = [
            output_str if count == 1 else '(%dx) %s' % (count, output_str)
            for (output_str, count) in counter.items()
        ]

        # Truncate outputs to fit within given max length.
        remaining_len = max_output_len_chars
        for idx, output_str in enumerate(output_str_list):
            remaining_len -= len(output_str)
            if remaining_len < 0:
                # Truncate all remaining output to fit in the limit.
                kept_str = output_str[:remaining_len]
                output_str_list[idx:] = [
                    ('%s <TRUNCATED>' % kept_str) if kept_str else '<TRUNCATED>'
                ]
                break

        return output_str_list

    @classmethod
    def register_failure(cls, job_id, error):
        """Marks a job as failed.

        Args:
            job_id: str. The ID of the job to fail.
            error: str. The error raised by the job.
        """
        # Ensure that preconditions are met.
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_valid_transition(
            job_id, model.status_code, STATUS_CODE_FAILED)
        cls._require_correct_job_type(model.job_type)

        model.status_code = STATUS_CODE_FAILED
        model.time_finished_msec = utils.get_current_time_in_millisecs()
        model.error = error
        model.update_timestamps()
        model.put()

        cls._post_failure_hook(job_id)

    @classmethod
    def cancel(cls, job_id, user_id):
        """Marks a job as canceled.

        Args:
            job_id: str. The ID of the job to cancel.
            user_id: str. The id of the user who cancelled the job.
        """
        # Ensure that preconditions are met.
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_valid_transition(
            job_id, model.status_code, STATUS_CODE_CANCELED)
        cls._require_correct_job_type(model.job_type)

        cancel_message = 'Canceled by %s' % (user_id or 'system')

        # Cancel the job.
        cls._pre_cancel_hook(job_id, cancel_message)

        model.status_code = STATUS_CODE_CANCELED
        model.time_finished_msec = utils.get_current_time_in_millisecs()
        model.error = cancel_message
        model.update_timestamps()
        model.put()

        cls._post_cancel_hook(job_id, cancel_message)

    @classmethod
    def is_active(cls, job_id):
        """Returns whether the job is still active.

        Args:
            job_id: str. The ID of the job to query.

        Returns:
            bool. Whether the job is active or not.
        """
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.status_code in [STATUS_CODE_QUEUED, STATUS_CODE_STARTED]

    @classmethod
    def has_finished(cls, job_id):
        """Returns whether the job has finished.

        Args:
            job_id: str. The ID of the job to query.

        Returns:
            bool. Whether the job has finished or not.
        """
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.status_code in [STATUS_CODE_COMPLETED, STATUS_CODE_FAILED]

    @classmethod
    def cancel_all_unfinished_jobs(cls, user_id):
        """Cancels all queued or started jobs of this job type.

        Args:
            user_id: str. The id of the user who is cancelling the jobs.
        """
        unfinished_job_models = job_models.JobModel.get_unfinished_jobs(
            cls.__name__)
        for model in unfinished_job_models:
            cls.cancel(model.id, user_id)

    @classmethod
    def _real_enqueue(
            cls, job_id, queue_name, additional_job_params, shard_count):
        """Does the actual work of enqueueing a job for deferred execution.

        Args:
            job_id: str. The ID of the job to enqueue.
            queue_name: str. The queue name the job should be run in. See
                core.platform.taskqueue.gae_taskqueue_services for supported
                values.
            additional_job_params: dict(str : *) or None. Additional parameters
                on jobs.
            shard_count: int. Number of shards used for the job.
        """
        raise NotImplementedError(
            'Subclasses of BaseJobManager should implement _real_enqueue().')

    @classmethod
    def get_status_code(cls, job_id):
        """Returns the status code of the job.

        Args:
            job_id: str. The ID of the job to query.

        Returns:
            str. Status code of the job.
        """
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.status_code

    @classmethod
    def get_time_queued_msec(cls, job_id):
        """Returns the time the job got queued.

        Args:
            job_id: str. The ID of the job to query.

        Returns:
            float. The time the job got queued in milliseconds after the Epoch.
        """
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.time_queued_msec

    @classmethod
    def get_time_started_msec(cls, job_id):
        """Returns the time the job got started.

        Args:
            job_id: str. The ID of the job to query.

        Returns:
            float. The time the job got started in milliseconds after the Epoch.
        """
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.time_started_msec

    @classmethod
    def get_time_finished_msec(cls, job_id):
        """Returns the time the job got finished.

        Args:
            job_id: str. The ID of the job to query.

        Returns:
            float. The time the job got finished in milliseconds after the
            Epoch.
        """
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.time_finished_msec

    @classmethod
    def get_metadata(cls, job_id):
        """Returns the metadata of the job.

        Args:
            job_id: str. The ID of the job to query.

        Returns:
            dict(str : *). The metadata of the job.
        """
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.metadata

    @classmethod
    def get_output(cls, job_id):
        """Returns the output of the job.

        Args:
            job_id: str. The ID of the job to query.

        Returns:
            *. The output of the job.
        """
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.output

    @classmethod
    def get_error(cls, job_id):
        """Returns the error encountered by the job.

        Args:
            job_id: str. The ID of the job to query.

        Returns:
            str. Describes the error encountered by the job.
        """
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.error

    @classmethod
    def _require_valid_transition(
            cls, job_id, old_status_code, new_status_code):
        """Asserts that the transition of the job status code is valid.

        Args:
            job_id: str. The ID of the job to query.
            old_status_code: str. Old status code.
            new_status_code: str. New status code.

        Raises:
            Exception. The given status code change is invalid.
        """
        valid_new_status_codes = VALID_STATUS_CODE_TRANSITIONS[old_status_code]
        if new_status_code not in valid_new_status_codes:
            raise Exception(
                'Invalid status code change for job %s: from %s to %s' %
                (job_id, old_status_code, new_status_code))

    @classmethod
    def _require_correct_job_type(cls, job_type):
        """Returns validity of given job type.

        Args:
            job_type: str. Name of a job class.

        Raises:
            Exception. The given job type is incorrect.
        """
        if job_type != cls.__name__:
            raise Exception(
                'Invalid job type %s for class %s' % (job_type, cls.__name__))

    @classmethod
    def _pre_start_hook(cls, job_id):
        """A hook or a callback function triggered before marking a job
        as started.

        Args:
            job_id: str. The unique ID of the job to be marked as started.
        """
        pass

    @classmethod
    def _post_completed_hook(cls, job_id):
        """A hook or a callback function triggered after marking a job as
        completed.

        Args:
            job_id: str. The unique ID of the job marked as completed.
        """
        pass

    @classmethod
    def _post_failure_hook(cls, job_id):
        """A hook or a callback function triggered after marking a job as
        failed.

        Args:
            job_id: str. The unique ID of the job marked as failed.
        """
        pass

    @classmethod
    def _pre_cancel_hook(cls, job_id, cancel_message):
        """A hook or a callback function triggered before marking a job as
        cancelled.

        Args:
            job_id: str. The unique ID of the job to be marked as cancelled.
            cancel_message: str. The message to be displayed before
                cancellation.
        """
        pass

    @classmethod
    def _post_cancel_hook(cls, job_id, cancel_message):
        """A hook or a callback function triggered after marking a job as
        cancelled.

        Args:
            job_id: str. The unique ID of the job marked as cancelled.
            cancel_message: str. The message to be displayed after cancellation.
        """
        pass


class MapReduceJobPipeline(base_handler.PipelineBase):
    """This class inherits from the PipelineBase class which are used to
    connect various workflows/functional procedures together. It implements
    a run method which is called when this job is started by using start()
    method on the object created from this class.
    """

    def run(self, job_id, job_class_str, kwargs):
        # Disabling 4 space indentation checker for this docstring because this
        # "Yields:" section yields 2 objects and the Yields/Returns are
        # generally supposed to only yield 1 object which messes up the
        # indentation checking. This is the only case of this happening.
        """Returns a coroutine which runs the job pipeline and stores results.

        Args:
            job_id: str. The ID of the job to run.
            job_class_str: str. Should uniquely identify each type of job.
            kwargs: dict(str : object). Extra arguments used to build the
                MapreducePipeline.

        Yields:
            MapreducePipeline. Ready to start processing. Expects the output of
            that pipeline to be sent back.
            StoreMapReduceResults. Will be constructed with whatever output the
            caller sends back to the coroutine.
        """

        job_class = mapreduce_util.for_name(job_class_str)
        job_class.register_start(job_id, metadata={
            job_class._OUTPUT_KEY_ROOT_PIPELINE_ID: self.root_pipeline_id  # pylint: disable=protected-access
        })

        # TODO(sll): Need try/except/mark-as-canceled here?
        output = yield mapreduce_pipeline.MapreducePipeline(**kwargs)
        yield StoreMapReduceResults(job_id, job_class_str, output)

    def finalized(self):
        """Suppresses the default pipeline behavior of sending email."""
        # TODO(sll): Should mark-as-done be here instead?
        pass


class StoreMapReduceResults(base_handler.PipelineBase):
    """MapreducePipeline class to store output results."""

    def run(self, job_id, job_class_str, output):
        """Extracts the results of a MR job and registers its completion.

        Args:
            job_id: str. The ID of the job to run.
            job_class_str: str. Should uniquely identify each type of job.
            output: str. The output produced by the job.
        """
        job_class = mapreduce_util.for_name(job_class_str)

        try:
            iterator = input_readers.GoogleCloudStorageInputReader(
                output, 0)
            results_list = []
            for item_reader in iterator:
                for item in item_reader:
                    results_list.append(json.loads(item))
            job_class.register_completion(job_id, results_list)
        except Exception as e:
            logging.exception(
                'Job %s failed at %s' % (
                    job_id, utils.get_current_time_in_millisecs()
                )
            )
            job_class.register_failure(
                job_id,
                '%s\n%s' % (python_utils.UNICODE(e), traceback.format_exc()))


class GoogleCloudStorageConsistentJsonOutputWriter(
        output_writers.GoogleCloudStorageConsistentOutputWriter):
    """This is an Output Writer which is used to consistently store MapReduce
    job's results in json format. GoogleCloudStorageConsistentOutputWriter is
    preferred as it's consistent. For more details please look here
    https://github.com/GoogleCloudPlatform/appengine-mapreduce/wiki/3.4-Readers-and-Writers#googlecloudstorageoutputwriter
    """

    def write(self, data):
        """Writes that data serialized in JSON format.

        Args:
            data: *. Data to be serialized in JSON format.
        """
        super(GoogleCloudStorageConsistentJsonOutputWriter, self).write(
            python_utils.convert_to_bytes('%s\n' % json.dumps(data)))


class BaseMapReduceJobManager(BaseJobManager):
    """The output for this job is a list of individual results. Each item in the
    list will be of whatever type is yielded from the 'reduce' method.

    The 'metadata' field in the BaseJob representing a MapReduceJob is a dict
    with one key, _OUTPUT_KEY_ROOT_PIPELINE_ID. The corresponding value is a
    string representing the ID of the MapReduceJobPipeline as known to the
    mapreduce/lib/pipeline internals. This is used to generate URLs pointing at
    the pipeline support UI.
    """

    _OUTPUT_KEY_ROOT_PIPELINE_ID = 'root_pipeline_id'

    @staticmethod
    def get_mapper_param(param_name):
        """Returns current value of given param_name for this job.

        Args:
            param_name: str. One of the configurable parameters of this
                particular mapreduce job.

        Returns:
            *. The current value of the parameter.

        Raises:
            Exception. The parameter is not associated to this job type.
        """
        return context.get().mapreduce_spec.mapper.params[param_name]

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        raise NotImplementedError(
            'Classes derived from BaseMapReduceJobManager must implement '
            'entity_classes_to_map_over()')

    @staticmethod
    def map(item):
        """Implements the map function. Must be declared @staticmethod.

        This function may yield as many times as appropriate (including zero)
        to return key/value 2-tuples. For example, to get a count of all
        explorations, one might yield (exploration.id, 1).

        WARNING: The OutputWriter converts mapper output keys to type str. So,
        if you have keys that are of type unicode, you must yield
        "key.encode('utf-8')", rather than "key".

        Args:
            item: *. A single element of the type given by entity_class().
        """
        raise NotImplementedError(
            'Classes derived from BaseMapReduceJobManager must implement map '
            'as a @staticmethod.')

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function. Must be declared @staticmethod.

        This function should yield a JSON string. All emitted outputs from all
        reducers will be collected in an array and set into the output value
        for the job, so don't pick anything huge. If you need something huge,
        persist it out into the datastore instead and return a reference (and
        dereference it later to load content as needed).

        This code can assume that it is the only process handling values for the
        given key.

        TODO(brianrodri): Verify whether it can also assume that it will be
        called exactly once for each key with all of the output.

        Args:
            key: *. A key value as emitted from the map() function, above.
            values: list(*). A list of all values from all mappers that were
                tagged with the given key.
        """
        raise NotImplementedError(
            'Classes derived from BaseMapReduceJobManager must implement '
            'reduce as a @staticmethod.')

    @classmethod
    def _real_enqueue(
            cls, job_id, queue_name, additional_job_params, shard_count):
        """Configures, creates, and queues the pipeline for the given job and
        params.

        Args:
            job_id: str. The ID of the job to enqueue.
            queue_name: str. The queue name the job should be run in. See
                core.platform.taskqueue.gae_taskqueue_services for supported
                values.
            additional_job_params: dict(str : *) or None. Additional params to
                pass into the job's _run() method.
            shard_count: int. Number of shards used for the job.

        Raises:
            Exception. Passed a value to a parameter in the mapper which has
                already been given a value.
        """
        entity_class_types = cls.entity_classes_to_map_over()
        entity_class_names = [
            '%s.%s' % (entity_class_type.__module__, entity_class_type.__name__)
            for entity_class_type in entity_class_types]

        kwargs = {
            'job_name': job_id,
            'mapper_spec': '%s.%s.map' % (cls.__module__, cls.__name__),
            'reducer_spec': '%s.%s.reduce' % (cls.__module__, cls.__name__),
            'input_reader_spec': (
                'core.jobs.MultipleDatastoreEntitiesInputReader'),
            'output_writer_spec': (
                'core.jobs.GoogleCloudStorageConsistentJsonOutputWriter'),
            'mapper_params': {
                MAPPER_PARAM_KEY_ENTITY_KINDS: entity_class_names,
                # Note that all parameters passed to the mapper need to be
                # strings. Also note that the value for this key is determined
                # just before enqueue time, so it will be roughly equal to the
                # actual enqueue time.
                MAPPER_PARAM_KEY_QUEUED_TIME_MSECS: python_utils.UNICODE(
                    utils.get_current_time_in_millisecs()),
            },
            'reducer_params': {
                'output_writer': {
                    'bucket_name': (
                        app_identity_services.get_default_gcs_bucket_name()),
                    'content_type': 'text/plain',
                    'naming_format': 'mrdata/$name/$id/output-$num',
                }
            },
            'shards': shard_count
        }

        if additional_job_params is not None:
            for param_name in additional_job_params:
                if param_name in kwargs['mapper_params']:
                    raise Exception(
                        'Additional job param %s shadows an existing mapper '
                        'param' % param_name)
                kwargs['mapper_params'][param_name] = copy.deepcopy(
                    additional_job_params[param_name])

        mr_pipeline = MapReduceJobPipeline(
            job_id, '%s.%s' % (cls.__module__, cls.__name__), kwargs)
        mr_pipeline.start(
            base_path='/mapreduce/worker/pipeline', queue_name=queue_name)

    @classmethod
    def _pre_cancel_hook(cls, job_id, cancel_message):
        """A hook or a callback function triggered before marking a job as
        cancelled.

        Args:
            job_id: str. The unique ID of the job to be marked as cancelled.
            cancel_message: str. The message to be displayed before
                cancellation.
        """
        super(BaseMapReduceJobManager, cls)._pre_cancel_hook(
            job_id, cancel_message)
        metadata = cls.get_metadata(job_id)
        if metadata is None:
            # This indicates that the job has been queued but not started by the
            # MapReduceJobPipeline.
            return
        root_pipeline_id = metadata[cls._OUTPUT_KEY_ROOT_PIPELINE_ID]
        pipeline.Pipeline.from_id(root_pipeline_id).abort(cancel_message)

    @staticmethod
    def entity_created_before_job_queued(entity):
        """Checks that the given entity was created before the MR job was
        queued.

        Mapper methods may want to use this as a precomputation check,
        especially if the datastore classes being iterated over are append-only
        event logs.

        Args:
            entity: BaseModel. An entity this job type is responsible for
                handling.

        Returns:
            bool. Whether the entity was queued before the job was created.
        """
        created_on_msec = utils.get_time_in_millisecs(entity.created_on)
        job_queued_msec = float(context.get().mapreduce_spec.mapper.params[
            MAPPER_PARAM_KEY_QUEUED_TIME_MSECS])
        return job_queued_msec >= created_on_msec


class BaseMapReduceOneOffJobManager(BaseMapReduceJobManager):
    """Overriden to force subclass jobs into the one-off jobs queue."""

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None, shard_count=8):
        """Marks a job as queued and adds it to a queue for processing.

        Args:
            job_id: str. The ID of the job to enqueue.
            additional_job_params: dict(str : *) or None. Additional parameters
                for the job.
            shard_count: int. Number of shards used for the job.
                Default count is 8.
        """
        super(BaseMapReduceOneOffJobManager, cls).enqueue(
            job_id,
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS,
            additional_job_params=additional_job_params,
            shard_count=shard_count)


class MultipleDatastoreEntitiesInputReader(input_readers.InputReader):
    """This Input Reader is used to read values from multiple
    classes in the datastore and pass them to mapper functions in MapReduce
    jobs.
    """

    _ENTITY_KINDS_PARAM = MAPPER_PARAM_KEY_ENTITY_KINDS
    _READER_LIST_PARAM = 'readers'

    def __init__(self, reader_list):
        self._reader_list = reader_list

    def __iter__(self):
        for reader in self._reader_list:
            yield reader

    @classmethod
    def from_json(cls, input_shard_state):
        """Creates an instance of the InputReader for the given input shard
        state.

        Args:
            input_shard_state: dict(str : *). The InputReader state as a
                dict-like object.

        Returns:
            *. An instance of the InputReader configured using the input shard
            state.
        """
        return cls(input_readers.DatastoreInputReader.from_json(
            input_shard_state[cls._READER_LIST_PARAM]))

    def to_json(self):
        """Returns an input shard state for the remaining inputs.

        Returns:
            dict(str : *). A json-izable version of the remaining InputReader.
        """
        return {
            self._READER_LIST_PARAM: self._reader_list.to_json()
        }

    @classmethod
    def split_input(cls, mapper_spec):
        """Returns a list of input readers.

        This method creates a list of input readers, each for one shard. It
        attempts to split inputs among readers evenly.

        Args:
            mapper_spec: model.MapperSpec. Specifies the inputs and additional
                parameters to define the behavior of input readers.

        Returns:
            list(InputReaders). None or [] when no input data can be found.
        """
        params = mapper_spec.params
        entity_kinds = params.get(cls._ENTITY_KINDS_PARAM)

        readers_list = []
        for entity_kind in entity_kinds:
            new_mapper_spec = copy.deepcopy(mapper_spec)
            new_mapper_spec.params['entity_kind'] = entity_kind
            readers_list.append(
                input_readers.DatastoreInputReader.split_input(
                    new_mapper_spec))

        inputs = []
        for reader_list in readers_list:
            for reader in reader_list:
                inputs.append(MultipleDatastoreEntitiesInputReader(reader))
        return inputs

    @classmethod
    def validate(cls, unused_mapper_spec):
        """Validates mapper spec and all mapper parameters.

        Input reader parameters are expected to be passed as "input_reader"
        subdictionary in mapper_spec.params.

        Pre 1.6.4 API mixes input reader parameters with all other parameters.
        Thus to be compatible, input reader check mapper_spec.params as well and
        issue a warning if "input_reader" subdicationary is not present.

        Args:
            unused_mapper_spec: model.MapperSpec. The MapperSpec
                for this InputReader.

        Raises:
            BadReaderParamsError. Required parameters are missing or invalid.

        Returns:
            bool. Whether mapper spec and all mapper patterns are valid.
        """
        # TODO(seanlip): Actually implement the validation.
        return True


def _get_job_dict_from_job_model(model):
    """Converts a Model representing a job to a dict.

    Args:
        model: datastore_services.Model. The model to extract job info from.

    Returns:
        dict. The dict contains the following keys:
            id: str. The ID of the job.
            time_started_msec: float. When the job was started, in milliseconds
                since the epoch.
            time_finished_msec: float. When the job was finished, in
                milliseconds since the epoch.
            status_code: str. The current status of the job.
            job_type: str. The type of this job.
            is_cancelable: bool. Whether the job can be canceled.
            error: str. Any errors pertaining to this job.
            human_readable_time_started: str or None. A human-readable string
                representing the time the job started, or None if
                time_started_msec is None.
            human_readable_time_finished: str or None. A human-readable string
                representing the time the job finished, or None if
                time_finished_msec is None.
    """
    return {
        'id': model.id,
        'time_started_msec': model.time_started_msec,
        'time_finished_msec': model.time_finished_msec,
        'status_code': model.status_code,
        'job_type': model.job_type,
        'is_cancelable': model.is_cancelable,
        'error': model.error,
        'human_readable_time_started': (
            '' if model.time_started_msec is None
            else utils.get_human_readable_time_string(model.time_started_msec)),
        'human_readable_time_finished': (
            '' if model.time_finished_msec is None
            else utils.get_human_readable_time_string(
                model.time_finished_msec)),
    }


def get_data_for_recent_jobs(recency_msec=DEFAULT_RECENCY_MSEC):
    """Get a list containing data about recent jobs.

    This list is arranged in descending order based on the time the job
    was enqueued. At most NUM_JOBS_IN_DASHBOARD_LIMIT job descriptions are
    returned.

    Args:
        recency_msec: int. The threshold for a recent job, in milliseconds.

    Returns:
        list(dict). Each dict contains the following keys:
            id: str. The ID of the job.
            time_started_msec: float. When the job was started, in milliseconds
                since the epoch.
            time_finished_msec: float. When the job was finished, in
                milliseconds since the epoch.
            status_code: str. The current status of the job.
            job_type: str. The type of this job.
            is_cancelable: bool. Whether the job can be canceled.
            error: str. Any errors pertaining to this job.
            human_readable_time_started: str or None. A human-readable string
                representing the time the job started, or None if
                time_started_msec is None.
            human_readable_time_finished: str or None. A human-readable string
                representing the time the job finished, or None if
                time_finished_msec is None.
    """
    recent_job_models = job_models.JobModel.get_recent_jobs(
        NUM_JOBS_IN_DASHBOARD_LIMIT, recency_msec)
    return [_get_job_dict_from_job_model(model) for model in recent_job_models]


def get_data_for_unfinished_jobs():
    """Returns a list of dicts containing data about all unfinished jobs.

    Returns:
        list(dict). Each dict represents a continuous computation and contains
        the following keys:
            computation_type: str. The type of the computation.
            status_code: str. The current status of the computation.
            last_started_msec: float or None. When a batch job for the
                computation was last started, in milliseconds since the
                epoch.
            last_finished_msec: float or None. When a batch job for the
                computation last finished, in milliseconds since the epoch.
            last_stopped_msec: float or None. When a batch job for the
                computation was last stopped, in milliseconds since the
                epoch.
            active_realtime_layer_index: int or None. The index of the
                active realtime layer.
            is_startable: bool. Whether an admin should be allowed to start
                this computation.
            is_stoppable: bool. Whether an admin should be allowed to stop
                this computation.
    """
    unfinished_job_models = job_models.JobModel.get_all_unfinished_jobs(
        NUM_JOBS_IN_DASHBOARD_LIMIT)
    return [_get_job_dict_from_job_model(model)
            for model in unfinished_job_models]


def cleanup_old_jobs_pipelines():
    """Clean the pipelines of old jobs."""
    num_cleaned = 0
    max_age_msec = (
        MAX_MAPREDUCE_METADATA_RETENTION_MSECS + 7 * 24 * 60 * 60 * 1000)
    # Only consider jobs that started at most 1 week before recency_msec.
    # The latest start time that a job scheduled for cleanup may have.
    max_start_time_msec = (
        utils.get_current_time_in_millisecs() -
        MAX_MAPREDUCE_METADATA_RETENTION_MSECS
    )
    # Get all pipeline ids from jobs that started between max_age_msecs
    # and max_age_msecs + 1 week, before now.
    pipeline_id_to_job_instance = {}

    job_instances = job_models.JobModel.get_recent_jobs(1000, max_age_msec)
    for job_instance in job_instances:
        if (
                job_instance.time_started_msec < max_start_time_msec and
                not job_instance.has_been_cleaned_up
        ):
            if 'root_pipeline_id' in job_instance.metadata:
                pipeline_id = job_instance.metadata['root_pipeline_id']
                pipeline_id_to_job_instance[pipeline_id] = job_instance

    # Clean up pipelines.
    for pline in pipeline.get_root_list()['pipelines']:
        pipeline_id = pline['pipelineId']
        job_definitely_terminated = (
            pline['status'] == 'done' or
            pline['status'] == 'aborted' or
            pline['currentAttempt'] > pline['maxAttempts']
        )
        have_start_time = 'startTimeMs' in pline
        job_started_too_long_ago = (
            have_start_time and
            pline['startTimeMs'] < max_start_time_msec
        )

        if (job_started_too_long_ago or
                (not have_start_time and job_definitely_terminated)):
            # At this point, the map/reduce pipeline is either in a
            # terminal state, or has taken so long that there's no
            # realistic possibility that there might be a race condition
            # between this and the job actually completing.
            if pipeline_id in pipeline_id_to_job_instance:
                job_instance = pipeline_id_to_job_instance[pipeline_id]
                job_instance.has_been_cleaned_up = True
                job_instance.update_timestamps()
                job_instance.put()

            # This enqueues a deferred cleanup item.
            p = pipeline.Pipeline.from_id(pipeline_id)
            if p:
                p.cleanup()
                num_cleaned += 1

    logging.warning('%s MR jobs cleaned up.' % num_cleaned)


def do_unfinished_jobs_exist(job_type):
    """Checks if unfinished jobs exist.

    Args:
        job_type: str. Type of job for which to check.

    Returns:
        bool. True if unfinished jobs exist, otherwise false.
    """
    return job_models.JobModel.do_unfinished_jobs_exist(job_type)


def get_job_output(job_id):
    """Returns the output of a job.

    Args:
        job_id: str. The ID of the job to query.

    Returns:
        str. The result of the job.
    """
    return job_models.JobModel.get_by_id(job_id).output


ABSTRACT_BASE_CLASSES = frozenset([
    BaseJobManager, BaseMapReduceJobManager,
    BaseMapReduceOneOffJobManager])
