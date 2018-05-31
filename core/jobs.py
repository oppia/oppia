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

import ast
import collections
import copy
import datetime
import json
import logging
import traceback

from core.platform import models
import utils

from google.appengine.api import app_identity
from google.appengine.ext import ndb
from mapreduce import base_handler
from mapreduce import context
from mapreduce import input_readers
from mapreduce import mapreduce_pipeline
from mapreduce import model as mapreduce_model
from mapreduce import output_writers
from mapreduce import util as mapreduce_util
from pipeline import pipeline

(base_models, job_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.job])
taskqueue_services = models.Registry.import_taskqueue_services()
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


class BaseJobManager(object):
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
        return cls in ABSTRACT_BASE_CLASSES

    @classmethod
    def create_new(cls):
        """Creates a new job of this class type.

        Returns:
            str. The unique id of this job.

        Raises:
            Exception: This method (instead of a subclass method) was directly
                used to create a new job.
        """
        if cls._is_abstract():
            raise Exception(
                'Tried to directly create a job using the abstract base '
                'manager class %s, which is not allowed.' % cls.__name__)

        def _create_new_job():
            job_id = job_models.JobModel.get_new_id(cls.__name__)
            job_models.JobModel(id=job_id, job_type=cls.__name__).put()
            return job_id

        return transaction_services.run_in_transaction(_create_new_job)

    @classmethod
    def enqueue(cls, job_id, queue_name, additional_job_params=None):
        """Marks a job as queued and adds it to a queue for processing.

        Args:
            job_id: str. The ID of the job to enqueue.
            queue_name: str. The queue name the job should be run in. See
                core.platform.taskqueue.gae_taskqueue_services for supported
                values.
            additional_job_params: dict(str : *) or None. Additional parameters
                for the job.
        """
        # Ensure that preconditions are met.
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_valid_transition(
            job_id, model.status_code, STATUS_CODE_QUEUED)
        cls._require_correct_job_type(model.job_type)

        # Enqueue the job.
        cls._pre_enqueue_hook(job_id)
        cls._real_enqueue(job_id, queue_name, additional_job_params)

        model.status_code = STATUS_CODE_QUEUED
        model.time_queued_msec = utils.get_current_time_in_millisecs()
        model.additional_job_params = additional_job_params
        model.put()

        cls._post_enqueue_hook(job_id)

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
        model.put()

        cls._post_start_hook(job_id)

    @classmethod
    def register_completion(cls, job_id, output_list):
        """Marks a job as completed.

        Args:
            job_id: str. The ID of the job to complete.
            output_list: list(object). The output produced by the job.
        """
        # Ensure that preconditions are met.
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_valid_transition(
            job_id, model.status_code, STATUS_CODE_COMPLETED)
        cls._require_correct_job_type(model.job_type)

        model.status_code = STATUS_CODE_COMPLETED
        model.time_finished_msec = utils.get_current_time_in_millisecs()
        model.output = cls._compress_output_list(output_list)
        model.put()

        cls._post_completed_hook(job_id)

    @classmethod
    def _compress_output_list(
            cls, output_list, test_only_max_output_len_chars=None):
        """Returns compressed list of strings within a max length of chars.

        Ensures that the payload (i.e., [str(output) for output in output_list])
        makes up at most max_output_chars of the final output data.

        Args:
            output_list: list(*). Collection of objects to be stringified.
            test_only_max_output_len_chars: int or None. Overrides the intended
                max output len limit when not None.

        Returns:
            list(str). The compressed stringified output values.
        """
        _MAX_OUTPUT_LEN_CHARS = 900000

        class _OrderedCounter(collections.Counter, collections.OrderedDict):
            """Counter that remembers the order elements are first encountered.

            We use this class so that our tests can rely on deterministic
            ordering, instead of simply using `collections.Counter` which has
            non-deterministic ordering.
            """
            pass

        # Consolidate the lines of output since repeating them isn't useful.
        counter = _OrderedCounter(str(output) for output in output_list)
        output_str_list = [
            output_str if count == 1 else '(%dx) %s' % (count, output_str)
            for (output_str, count) in counter.iteritems()
        ]

        # Truncate outputs to fit within given max length.
        remaining_len = (
            _MAX_OUTPUT_LEN_CHARS if test_only_max_output_len_chars is None else
            test_only_max_output_len_chars)
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
    def _real_enqueue(cls, job_id, queue_name, additional_job_params):
        """Does the actual work of enqueueing a job for deferred execution.

        Args:
            job_id: str. The ID of the job to enqueue.
            queue_name: str. The queue name the job should be run in. See
                core.platform.taskqueue.gae_taskqueue_services for supported
                values.
            additional_job_params: dict(str : *) or None. Additional parameters
                on jobs.
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
            Exception: The given status code change is invalid.
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
            Exception: The given job type is incorrect.
        """
        if job_type != cls.__name__:
            raise Exception(
                'Invalid job type %s for class %s' % (job_type, cls.__name__))

    @classmethod
    def _pre_enqueue_hook(cls, job_id):
        pass

    @classmethod
    def _post_enqueue_hook(cls, job_id):
        pass

    @classmethod
    def _pre_start_hook(cls, job_id):
        pass

    @classmethod
    def _post_start_hook(cls, job_id):
        pass

    @classmethod
    def _post_completed_hook(cls, job_id):
        pass

    @classmethod
    def _post_failure_hook(cls, job_id):
        pass

    @classmethod
    def _pre_cancel_hook(cls, job_id, cancel_message):
        pass

    @classmethod
    def _post_cancel_hook(cls, job_id, cancel_message):
        pass


class BaseDeferredJobManager(BaseJobManager):
    """Base class to run a job/method as deferred task. These tasks will be
    pushed to the default taskqueue.
    """

    @classmethod
    def _run(cls, additional_job_params):
        """Function that performs the main business logic of the job.

        Args:
            additional_job_params: dict(str : *). Additional parameters on jobs.
        """
        raise NotImplementedError

    @classmethod
    def _run_job(cls, job_id, additional_job_params):
        """Starts the job.

        Args:
            job_id: str. The ID of the job to run.
            additional_job_params: dict(str : *). Additional parameters on job.

        Raises:
            PermanentTaskFailure: No further work can be scheduled.
        """
        logging.info(
            'Job %s started at %s' %
            (job_id, utils.get_current_time_in_millisecs()))
        cls.register_start(job_id)

        try:
            result = cls._run(additional_job_params)
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error(
                'Job %s failed at %s' %
                (job_id, utils.get_current_time_in_millisecs()))
            cls.register_failure(
                job_id, '%s\n%s' % (unicode(e), traceback.format_exc()))
            raise taskqueue_services.PermanentTaskFailure(
                'Task failed: %s\n%s' % (unicode(e), traceback.format_exc()))

        # Note that the job may have been canceled after it started and before
        # it reached this stage. This will result in an exception when the
        # validity of the status code transition is checked.
        cls.register_completion(job_id, [result])
        logging.info(
            'Job %s completed at %s' %
            (job_id, utils.get_current_time_in_millisecs()))

    @classmethod
    def _real_enqueue(cls, job_id, queue_name, additional_job_params):
        """Puts the job in the task queue.

        Args:
            job_id: str. The ID of the job to enqueue.
            queue_name: str. The queue name the job should be run in. See
                core.platform.taskqueue.gae_taskqueue_services for supported
                values.
            additional_job_params: dict(str : *) or None. Additional params to
                pass into the job's _run() method.
        """
        taskqueue_services.defer(
            cls._run_job, queue_name, job_id, additional_job_params)


class MapReduceJobPipeline(base_handler.PipelineBase):
    """This class inherits from the PipelineBase class which are used to
    connect various workflows/functional procedures together. It implements
    a run method which is called when this job is started by using start()
    method on the object created from this class.
    """

    def run(self, job_id, job_class_str, kwargs):
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
            logging.error(traceback.format_exc())
            logging.error(
                'Job %s failed at %s' %
                (job_id, utils.get_current_time_in_millisecs()))
            job_class.register_failure(
                job_id,
                '%s\n%s' % (unicode(e), traceback.format_exc()))


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
            '%s\n' % json.dumps(data))


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
            Exception: The parameter is not associated to this job type.
        """
        mapper_params = context.get().mapreduce_spec.mapper.params
        if param_name not in mapper_params:
            raise Exception(
                'Could not find %s in %s' % (param_name, mapper_params))
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
    def _real_enqueue(cls, job_id, queue_name, additional_job_params):
        """Configures, creates, and queues the pipeline for the given job and
        params.

        Args:
            job_id: str. The ID of the job to enqueue.
            queue_name: str. The queue name the job should be run in. See
                core.platform.taskqueue.gae_taskqueue_services for supported
                values.
            additional_job_params: dict(str : *) or None. Additional params to
                pass into the job's _run() method.

        Raises:
            Exception: Passed a value to a parameter in the mapper which has
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
                MAPPER_PARAM_KEY_QUEUED_TIME_MSECS: str(
                    utils.get_current_time_in_millisecs()),
            },
            'reducer_params': {
                'output_writer': {
                    'bucket_name': app_identity.get_default_gcs_bucket_name(),
                    'content_type': 'text/plain',
                    'naming_format': 'mrdata/$name/$id/output-$num',
                }
            }
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
        metadata = cls.get_metadata(job_id)
        root_pipeline_id = metadata[cls._OUTPUT_KEY_ROOT_PIPELINE_ID]
        pipeline.Pipeline.from_id(root_pipeline_id).abort(cancel_message)

    @staticmethod
    def _entity_created_before_job_queued(entity):
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
    def enqueue(cls, job_id, additional_job_params=None):
        """Marks a job as queued and adds it to a queue for processing.

        Args:
            job_id: str. The ID of the job to enqueue.
            additional_job_params: dict(str : *) or None. Additional parameters
                for the job.
        """
        super(BaseMapReduceOneOffJobManager, cls).enqueue(
            job_id, taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS,
            additional_job_params=additional_job_params)


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
            BadReaderParamsError: Required parameters are missing or invalid.

        Returns:
            bool. Whether mapper spec and all mapper patterns are valid.
        """
        return True  # TODO.


class BaseMapReduceJobManagerForContinuousComputations(BaseMapReduceJobManager):
    """Continuous computation jobs, which run continuously, are used to perform
    statistical, visualisation or other real time calculations. These jobs
    are used to perform background calculations that take place outside the
    usual client request/response cycle.
    """
    @classmethod
    def _get_continuous_computation_class(cls):
        """Returns the ContinuousComputationManager class associated with this
        MapReduce job.
        """
        raise NotImplementedError(
            'Subclasses of BaseMapReduceJobManagerForContinuousComputations '
            'must implement the _get_continuous_computation_class() method.')

    @staticmethod
    def _get_job_queued_msec():
        """Returns the time when the job got queued, in milliseconds past the
        Epoch.
        """
        return float(context.get().mapreduce_spec.mapper.params[
            MAPPER_PARAM_KEY_QUEUED_TIME_MSECS])

    @staticmethod
    def _entity_created_before_job_queued(entity):
        """Checks that the given entity was created before the MR job was
        queued.

        Mapper methods may want to use this as a precomputation check,
        especially if the datastore classes being iterated over are append-only
        event logs.

        Args:
            entity: BaseModel. An entity this job type is responsible for
                handling.

        Returns:
            bool. Whether the entity was created before the given MR job was
                queued.
        """
        created_on_msec = utils.get_time_in_millisecs(entity.created_on)
        job_queued_msec = float(context.get().mapreduce_spec.mapper.params[
            MAPPER_PARAM_KEY_QUEUED_TIME_MSECS])
        return job_queued_msec >= created_on_msec

    @classmethod
    def _post_completed_hook(cls, job_id):
        cls._get_continuous_computation_class().on_batch_job_completion()

    @classmethod
    def _post_cancel_hook(cls, job_id, cancel_message):
        cls._get_continuous_computation_class().on_batch_job_canceled()

    @classmethod
    def _post_failure_hook(cls, job_id):
        cls._get_continuous_computation_class().on_batch_job_failure()


class BaseRealtimeDatastoreClassForContinuousComputations(
        base_models.BaseModel):
    """Storage class for entities in the realtime layer.

    Instances of this class represent individual entities that are stored in
    the realtime datastore. Note that the realtime datastore may be formatted
    differently from the datastores that are iterated over by the MapReduce
    job.

    The IDs for instances of this class are of the form 0:... or 1:..., where
    the 0 or 1 indicates the realtime layer that the entity is in.

    NOTE TO DEVELOPERS: Ensure that you wrap the id with get_realtime_id()
    when doing creations, gets, puts, and queries. This ensures that the
    relevant layer prefix gets appended.
    """
    realtime_layer = ndb.IntegerProperty(required=True, choices=[0, 1])

    @classmethod
    def get_realtime_id(cls, layer_index, raw_entity_id):
        """Returns a valid id for the given (realtime layer, entity) pair.

        Args:
            layer_index: int. The realtime layer id, one of: 0, 1.
            raw_entity_id: int. The id of an entity that is to be stored in the
                given realtime layer.

        Returns:
            str. Uniquely identifies the (realtime layer, entity) pair.
        """
        return '%s:%s' % (layer_index, raw_entity_id)

    @classmethod
    def delete_layer(cls, layer_index, latest_created_on_datetime):
        """Deletes all entities in the given layer which were created before
        the given datetime.

        Args:
            layer_index: int. The realtime layer id, should be either 0 or 1.
            latest_created_on_datetime: datetime.datetime. All remaining
                entities after the deletion will have been created on or after
                this time.
        """
        query = cls.query().filter(cls.realtime_layer == layer_index).filter(
            cls.created_on < latest_created_on_datetime)
        ndb.delete_multi(query.iter(keys_only=True))

    @classmethod
    def _is_valid_realtime_id(cls, realtime_id):
        """Returns whether the realtime_id represents a valid (realtime layer,
        entity) pair.

        Args:
            realtime_id: str. The id to query.

        Returns:
            bool. Whether the realtime_id represents a valid (realtime layer,
                entity) pair.
        """
        return realtime_id.startswith('0:') or realtime_id.startswith('1:')

    @classmethod
    def get(cls, entity_id, strict=True):
        """Gets an entity by its id.

        Args:
            entity_id: str. Unique identifier for an entity.
            strict: bool. Whether to fail noisily if no entity with the given
                id exists in the datastore. Default is True.

        Returns:
            * or None. The entity instance that corresponds to the given id, or
                None if strict == False and no undeleted entity with the given
                id exists in the datastore.

        Raises:
            base_models.BaseModel.EntityNotFoundError: strict == True and no
                undeleted entity with the given id exists in the datastore.
        """
        if not cls._is_valid_realtime_id(entity_id):
            raise ValueError('Invalid realtime id: %s' % entity_id)

        return super(
            BaseRealtimeDatastoreClassForContinuousComputations, cls
        ).get(entity_id, strict=strict)

    def put(self):
        """Stores the current realtime layer entity into the database.

        Raises:
            Exception: The current instance has an invalid realtime layer id.

        Returns:
            realtime_layer. The realtime layer entity.
        """
        if (self.realtime_layer is None or
                str(self.realtime_layer) != self.id[0]):
            raise Exception(
                'Realtime layer %s does not match realtime id %s' %
                (self.realtime_layer, self.id))

        return super(
            BaseRealtimeDatastoreClassForContinuousComputations, self).put()


class BaseContinuousComputationManager(object):
    """This class represents a manager for a continuously-running computation.

    Such computations consist of two parts: a batch job to compute summary
    views, and a realtime layer to augment these batch views with additional
    data that has come in since the last batch job results were computed. The
    realtime layer may provide only approximate results, but the discrepancy
    should be small because the realtime layer is expected to handle a much
    smaller amount of data than the batch layer.

    The batch jobs are run continuously, with each batch job starting
    immediately after the previous run has finished. There are two realtime
    layers that are cleared alternatively after successive batch runs, just
    before a new batch job is enqueued. Events are recorded to all three
    layers.

    Here is a schematic showing how this works. The x-axis represents the
    progression of time. The arrowed intervals in the batch layer indicate how
    long the corresponding batch job takes to run, and the intervals in each
    realtime layer indicate spans between when the data in the realtime layer
    is cleared. Note that a realtime layer is cleared as part of the post-
    processing that happens when a batch job completes, which explains why the
    termination of each batch interval and one of the realtime intervals
    always coincides. Having two realtime layers allows the inactive layer to
    be cleared whilst not affecting incoming queries to the active layer.

    Batch layer         <----->  <------->  <-------> <-------> <-------->
    Realtime layer R0   <----->  <------------------> <------------------>
    Realtime layer R1   <---------------->  <-----------------> <------ ...
                                 <-- A -->  <-- B -->

    For example, queries arising during the time interval A will use the
    results of the first batch run, plus data from the realtime layer R1.
    Queries arising during the time interval B will use the results of the
    second batch run, plus data from the realtime layer R0.
    """
    # TODO(sll): In the previous docstring, quantify what 'small' means
    # once we have some experience with this running in production.

    @classmethod
    def get_event_types_listened_to(cls):
        """Returns a list of event types that this class subscribes to."""
        raise NotImplementedError(
            'Subclasses of BaseContinuousComputationManager must implement '
            'get_event_types_listened_to(). This method should return a list '
            'of strings, each representing an event type that this class '
            'subscribes to.')

    @classmethod
    def _get_realtime_datastore_class(cls):
        """Returns the datastore class used by the realtime layer, which should
        subclass BaseRealtimeDatastoreClassForContinuousComputations. See
        StartExplorationRealtimeModel in core/jobs_test.py for an example
        of how to do this.
        """
        raise NotImplementedError(
            'Subclasses of BaseContinuousComputationManager must implement '
            '_get_realtime_datastore_class(). This method should return '
            'the datastore class to be used by the realtime layer.')

    @classmethod
    def _get_batch_job_manager_class(cls):
        """Returns the manager class for the continuously-running batch job.

        See jobs_test.py for an example of how to do this.
        """
        raise NotImplementedError(
            'Subclasses of BaseContinuousComputationManager must implement '
            '_get_batch_job_manager_class(). This method should return the'
            'manager class for the continuously-running batch job.')

    @classmethod
    def _handle_incoming_event(
            cls, active_realtime_layer, event_type, *args, **kwargs):
        """Records incoming events in the given realtime layer.

        This method should be implemented by subclasses. The args are the
        same as those sent to the event handler corresponding to the event
        type, so check that for documentation. Note that there may be more than
        one event type.

        IMPORTANT: This method only gets called as part of the dequeue process
        from a deferred task queue. Developers should expect a delay to occur
        between when the incoming event arrives and when this method is called,
        and should resolve any arguments that depend on local session
        variables (such as the user currently in session) before enqueueing
        this method in the corresponding event handler.

        IMPORTANT: If an exception is raised here, the task queue will retry
        calling it and any mutations made will be redone -- unless the
        exception has type taskqueue_services.PermanentTaskFailure. Developers
        should therefore ensure that _handle_incoming_event() is robust to
        multiple calls for the same incoming event.

        Args:
            active_realtime_layer: int. The currently active realtime
                datastore layer.
            event_type: str. The event triggered by a student. For example, when
                a student starts an exploration, event of type `start` is
                triggered. If he/she completes an exploration, event of type
                `complete` is triggered.
            *args: list(*). Forwarded to the _handle_event() method.
            **kwargs: dict(* : *). Forwarded to the _handle_event() method.
        """
        raise NotImplementedError(
            'Subclasses of BaseContinuousComputationManager must implement '
            '_handle_incoming_event(...). Please check the docstring of this '
            'method in jobs.BaseContinuousComputationManager for important '
            'developer information.')

    @classmethod
    def _get_active_realtime_index(cls):
        """Returns the currently active realtime layer index for this class.

        Additionally, takes care to register the relevant
        ContinuousComputationModel, if it does not already exist.

        Returns:
            str. The active realtime layer index of this class.
        """
        def _get_active_realtime_index_transactional():
            cc_model = job_models.ContinuousComputationModel.get(
                cls.__name__, strict=False)
            if cc_model is None:
                cc_model = job_models.ContinuousComputationModel(
                    id=cls.__name__)
                cc_model.put()

            return cc_model.active_realtime_layer_index

        return transaction_services.run_in_transaction(
            _get_active_realtime_index_transactional)

    @classmethod
    def get_active_realtime_layer_id(cls, entity_id):
        """Returns an ID used to identify the element with the given entity id
        in the currently active realtime datastore layer.

        Args:
            entity_id: str. Unique identifier for an entity.

        Returns:
            str. Unique identifier for the given entity for storage in active
                realtime layer.
        """
        return cls._get_realtime_datastore_class().get_realtime_id(
            cls._get_active_realtime_index(), entity_id)

    @classmethod
    def get_multi_active_realtime_layer_ids(cls, entity_ids):
        """Returns a list of IDs of elements in the currently active realtime
        datastore layer corresponding to the given entity ids.

        Args:
            entity_ids: str. Collection of unique identifiers for entities.

        Returns:
            list(str). Unique identifiers for each given entity for storage in
                the currently active realtime layer.
        """
        realtime_datastore_class = cls._get_realtime_datastore_class()
        active_realtime_index = cls._get_active_realtime_index()
        return [
            realtime_datastore_class.get_realtime_id(
                active_realtime_index, entity_id
            ) for entity_id in entity_ids]

    @classmethod
    def _switch_active_realtime_class(cls):
        """Switches the currently-active realtime layer for this continuous
        computation.
        """
        def _switch_active_realtime_class_transactional():
            cc_model = job_models.ContinuousComputationModel.get(
                cls.__name__)
            cc_model.active_realtime_layer_index = (
                1 - cc_model.active_realtime_layer_index)
            cc_model.put()

        transaction_services.run_in_transaction(
            _switch_active_realtime_class_transactional)

    @classmethod
    def _clear_inactive_realtime_layer(cls, latest_created_on_datetime):
        """Deletes all entries in the inactive realtime datastore class whose
        created_on date is before latest_created_on_datetime.

        Args:
            latest_created_on_datetime: datetime.datetime. Entities created
                before this datetime will be removed.
        """
        inactive_realtime_index = 1 - cls._get_active_realtime_index()
        cls._get_realtime_datastore_class().delete_layer(
            inactive_realtime_index, latest_created_on_datetime)

    @classmethod
    def _kickoff_batch_job(cls):
        """Create and enqueue a new batch job."""
        if job_models.JobModel.do_unfinished_jobs_exist(cls.__name__):
            logging.error(
                'Tried to start a new batch job of type %s while an existing '
                'job was still running ' % cls.__name__)
            return
        job_manager = cls._get_batch_job_manager_class()
        job_id = job_manager.create_new()
        job_manager.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS)

    @classmethod
    def _register_end_of_batch_job_and_return_status(cls):
        """Processes a 'job finished' event and returns the job's updated status
        code.

        Note that 'finish' in this context might mean 'completed successfully'
        or 'failed'.

        Processing means the following: if the job is currently 'stopping', its
        status is set to 'idle'; otherwise, its status remains as 'running'.
        """
        def _register_end_of_batch_job_transactional():
            """Transactionally change the computation's status when a batch job
            ends.
            """
            cc_model = job_models.ContinuousComputationModel.get(cls.__name__)
            if (cc_model.status_code ==
                    job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_STOPPING):
                cc_model.status_code = (
                    job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE)
                cc_model.put()

            return cc_model.status_code

        return transaction_services.run_in_transaction(
            _register_end_of_batch_job_transactional)

    @classmethod
    def get_status_code(cls):
        """Returns the status code of the job."""
        return job_models.ContinuousComputationModel.get(
            cls.__name__).status_code

    @classmethod
    def start_computation(cls):
        """(Re)starts the continuous computation corresponding to this class.

        Raises:
            Exception: The computation wasn't idle before trying to start.
        """
        def _start_computation_transactional():
            """Transactional implementation for marking a continuous
            computation as started.
            """
            cc_model = job_models.ContinuousComputationModel.get(
                cls.__name__, strict=False)
            if cc_model is None:
                cc_model = job_models.ContinuousComputationModel(
                    id=cls.__name__)

            if (cc_model.status_code !=
                    job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE):
                raise Exception(
                    'Attempted to start computation %s, which is already '
                    'running.' % cls.__name__)

            cc_model.status_code = (
                job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING)
            cc_model.last_started_msec = utils.get_current_time_in_millisecs()
            cc_model.put()

        transaction_services.run_in_transaction(
            _start_computation_transactional)

        cls._clear_inactive_realtime_layer(datetime.datetime.utcnow())

        cls._kickoff_batch_job()

    @classmethod
    def stop_computation(cls, user_id):
        """Cancels the currently-running batch job.

        No further batch runs will be kicked off.

        Args:
            user_id: str. The id of the user stopping the job.
        """
        # This is not an ancestor query, so it must be run outside a
        # transaction.
        do_unfinished_jobs_exist = (
            job_models.JobModel.do_unfinished_jobs_exist(
                cls._get_batch_job_manager_class().__name__))

        def _stop_computation_transactional():
            """Transactional implementation for marking a continuous
            computation as stopping/idle.
            """
            cc_model = job_models.ContinuousComputationModel.get(cls.__name__)
            # If there is no job currently running, go to IDLE immediately.
            new_status_code = (
                job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_STOPPING if
                do_unfinished_jobs_exist else
                job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE)
            cc_model.status_code = new_status_code
            cc_model.last_stopped_msec = utils.get_current_time_in_millisecs()
            cc_model.put()

        transaction_services.run_in_transaction(
            _stop_computation_transactional)

        # The cancellation must be done after the continuous computation
        # status update.
        if do_unfinished_jobs_exist:
            unfinished_job_models = job_models.JobModel.get_unfinished_jobs(
                cls._get_batch_job_manager_class().__name__)
            for job_model in unfinished_job_models:
                cls._get_batch_job_manager_class().cancel(
                    job_model.id, user_id)

    @classmethod
    def on_incoming_event(cls, event_type, *args, **kwargs):
        """Handles an incoming event by recording it in both realtime datastore
        layers.

        The *args and **kwargs match those passed to the _handle_event() method
        of the corresponding EventHandler subclass.

        Args:
            event_type: str. The event triggered by a student. For example, when
                a student starts an exploration, event of type `start` is
                triggered. If he/she completes an exploration, event of type
                `complete` is triggered.
            *args: list(*). Forwarded to _handle_event() method.
            **kwargs: *. Forwarded to _handle_event() method.
        """
        realtime_layers = [0, 1]
        for layer in realtime_layers:
            cls._handle_incoming_event(layer, event_type, *args, **kwargs)

    @classmethod
    def _process_job_completion_and_return_status(cls):
        """Deletes all data in the currently-active realtime_datastore class,
        then switches the active class.

        This seam was created so that tests would be able to override
        on_batch_job_completion() to avoid kicking off the next job
        immediately.

        Returns:
            str. The final status of the job.
        """
        cls._switch_active_realtime_class()
        cls._clear_inactive_realtime_layer(datetime.datetime.utcnow())

        def _update_last_finished_time_transactional():
            cc_model = job_models.ContinuousComputationModel.get(cls.__name__)
            cc_model.last_finished_msec = utils.get_current_time_in_millisecs()
            cc_model.put()

        transaction_services.run_in_transaction(
            _update_last_finished_time_transactional)

        return cls._register_end_of_batch_job_and_return_status()

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        """Seam that can be overridden by tests."""
        cls._kickoff_batch_job()

    @classmethod
    def on_batch_job_completion(cls):
        """Marks the existing job as complete and kicks off a new batch job."""
        job_status = cls._process_job_completion_and_return_status()
        if job_status == job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING:
            cls._kickoff_batch_job_after_previous_one_ends()

    @classmethod
    def on_batch_job_canceled(cls):
        """Marks the batch job as cancelled and verifies that the continuous
        computation is now idle.
        """
        logging.info('Job %s canceled.' % cls.__name__)
        job_status = cls._register_end_of_batch_job_and_return_status()
        if job_status != job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE:
            logging.error(
                'Batch job for computation %s canceled but status code not set '
                'to idle.' % cls.__name__)

    @classmethod
    def on_batch_job_failure(cls):
        """Gives up on the existing batch job and kicks off a new one."""
        # TODO(sll): Alert the site admin via email.
        logging.error('Job %s failed.' % cls.__name__)
        job_status = cls._register_end_of_batch_job_and_return_status()
        if job_status == job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING:
            cls._kickoff_batch_job_after_previous_one_ends()


def _get_job_dict_from_job_model(model):
    """Converts an ndb.Model representing a job to a dict.

    Args:
        model: ndb.Model. The model to extract job info from.

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


def get_job_output(job_id):
    """Returns the output of a job.

    Args:
        job_id: str. The ID of the job to query.

    Returns:
        str. The result of the job.
    """
    return job_models.JobModel.get_by_id(job_id).output


def get_continuous_computations_info(cc_classes):
    """Returns data about the given computations.

    Args:
        cc_classes: list(BaseContinuousComputationManager). List of continuous
            computation subclasses.

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
    cc_models = job_models.ContinuousComputationModel.get_multi(
        [cc_class.__name__ for cc_class in cc_classes])

    result = []
    for ind, model in enumerate(cc_models):
        if model is None:
            cc_dict = {
                'computation_type': cc_classes[ind].__name__,
                'status_code': 'never_started',
                'last_started_msec': None,
                'last_finished_msec': None,
                'last_stopped_msec': None,
                'active_realtime_layer_index': None,
                'is_startable': True,
                'is_stoppable': False,
            }
        else:
            cc_dict = {
                'computation_type': cc_classes[ind].__name__,
                'status_code': model.status_code,
                'last_started_msec': model.last_started_msec,
                'last_finished_msec': model.last_finished_msec,
                'last_stopped_msec': model.last_stopped_msec,
                'active_realtime_layer_index': (
                    model.active_realtime_layer_index),
                # TODO(sll): If a job is stopping, can it be started while it
                # is in the process of stopping?
                'is_startable': model.status_code == (
                    job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE),
                'is_stoppable': model.status_code == (
                    job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING),
            }

        result.append(cc_dict)

    return result


def get_stuck_jobs(recency_msecs):
    """Returns a list of jobs which were last updated at most recency_msecs
    milliseconds ago and have experienced more than one retry.

    Returns:
        list(job_models.JobModel). Jobs which have retried at least once and
            haven't finished yet.
    """
    threshold_time = (
        datetime.datetime.utcnow() -
        datetime.timedelta(0, 0, 0, recency_msecs))
    shard_state_model_class = mapreduce_model.ShardState

    # TODO(sll): Clean up old jobs so that this query does not have to iterate
    # over so many elements in a full table scan.
    recent_job_models = shard_state_model_class.all()

    stuck_jobs = []
    for job_model in recent_job_models:
        if job_model.update_time > threshold_time and job_model.retries > 0:
            stuck_jobs.append(job_model)

    return stuck_jobs


class JobCleanupManager(BaseMapReduceOneOffJobManager):
    """One-off job for cleaning up old auxiliary entities for MR jobs."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """The entity types this job will handle."""
        return [
            mapreduce_model.MapreduceState,
            mapreduce_model.ShardState
        ]

    @staticmethod
    def map(item):
        """Implements the map function which will clean up jobs that have not
        finished.

        Args:
            item: mapreduce_model.MapreduceState or mapreduce_model.ShardState.
                A shard or job which may still be running.
        Yields:
            tuple(str, int). Describes the action taken for the item, and the
                number of items this action was applied to.
        """
        max_start_time_msec = JobCleanupManager.get_mapper_param(
            MAPPER_PARAM_MAX_START_TIME_MSEC)

        if isinstance(item, mapreduce_model.MapreduceState):
            if (item.result_status == 'success' and
                    utils.get_time_in_millisecs(item.start_time) <
                    max_start_time_msec):
                item.delete()
                yield ('mr_state_deleted', 1)
            else:
                yield ('mr_state_remaining', 1)

        if isinstance(item, mapreduce_model.ShardState):
            if (item.result_status == 'success' and
                    utils.get_time_in_millisecs(item.update_time) <
                    max_start_time_msec):
                item.delete()
                yield ('shard_state_deleted', 1)
            else:
                yield ('shard_state_remaining', 1)

    @staticmethod
    def reduce(key, stringified_values):
        """Implements the reduce function which logs the results of the mapping
        function.

        Args:
            key: str. Describes the action taken by a map call. One of:
                'mr_state_deleted', 'mr_state_remaining', 'shard_state_deleted',
                'shard_state_remaining'.
            stringified_values: list(str). A list where each element is a
                stringified number, counting the mapped items sharing the key.
        """
        values = [ast.literal_eval(v) for v in stringified_values]
        if key.endswith('_deleted'):
            logging.warning(
                'Delete count: %s entities (%s)' % (sum(values), key))
        else:
            logging.warning(
                'Entities remaining count: %s entities (%s)' %
                (sum(values), key))


ABSTRACT_BASE_CLASSES = frozenset([
    BaseJobManager, BaseDeferredJobManager, BaseMapReduceJobManager,
    BaseMapReduceOneOffJobManager,
    BaseMapReduceJobManagerForContinuousComputations])
