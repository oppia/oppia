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

__author__ = 'Sean Lip'

import ast
import copy
import logging
import time
import traceback
import utils

from core.platform import models
(job_models,) = models.Registry.import_models([models.NAMES.job])
taskqueue_services = models.Registry.import_taskqueue_services()
transaction_services = models.Registry.import_transaction_services()

from google.appengine.ext import ndb

from mapreduce import base_handler
from mapreduce import context
from mapreduce import input_readers
from mapreduce import mapreduce_pipeline
from mapreduce.lib.pipeline import pipeline

MAPPER_PARAM_KEY_ENTITY_KINDS = 'entity_kinds'
MAPPER_PARAM_KEY_QUEUED_TIME_MSECS = 'queued_time_msecs'

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

# A list of mapreduce job managers. The class name of each job manager is
# stored with the job, and this means that when the MR job finishes, the
# original job class can be identified.
# NOTE TO DEVELOPERS: When a new MapReduce job is added, it should be
# registered here.
# TODO(sll): Move existing MapReduce jobs to this list.
ALL_MAPREDUCE_JOB_MANAGERS = []

# NOTE TO DEVELOPERS: When a new ContinuousComputation manager is defined,
# it should be registered here.
# TODO(sll): Do automatic discovery.
ALL_CONTINUOUS_COMPUTATION_MANAGERS = []


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
    operations: (a) pre- and post-hooks, (b) updating the status of the job in
    the datastore, and (c) actually performing the operation. Each entire batch
    is not run in a transaction, but subclasses can still perform (a) or (c)
    transactionally if they wish to.
    """
    @classmethod
    def _is_abstract(cls):
        return cls in ABSTRACT_BASE_CLASSES

    @classmethod
    def create_new(cls):
        """Creates a new job of this class type. Returns the id of this job."""
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
    def enqueue(cls, job_id):
        """Marks a job as queued and adds it to a queue for processing."""
        # Ensure that preconditions are met.
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_valid_transition(
            job_id, model.status_code, STATUS_CODE_QUEUED)
        cls._require_correct_job_type(model.job_type)

        # Enqueue the job.
        cls._pre_enqueue_hook(job_id)
        cls._real_enqueue(job_id)

        model.status_code = STATUS_CODE_QUEUED
        model.time_queued_msec = utils.get_current_time_in_millisecs()
        model.put()

        cls._post_enqueue_hook(job_id)

    @classmethod
    def register_start(cls, job_id, metadata=None):
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
    def register_completion(cls, job_id, output):
        """Marks a job as completed."""
        # Ensure that preconditions are met.
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_valid_transition(
            job_id, model.status_code, STATUS_CODE_COMPLETED)
        cls._require_correct_job_type(model.job_type)

        model.status_code = STATUS_CODE_COMPLETED
        model.time_finished_msec = utils.get_current_time_in_millisecs()
        model.output = output
        model.put()

        cls._post_completed_hook(job_id)

    @classmethod
    def register_failure(cls, job_id, error):
        """Marks a job as failed."""
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
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.status_code in [STATUS_CODE_QUEUED, STATUS_CODE_STARTED]

    @classmethod
    def has_finished(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.status_code in [STATUS_CODE_COMPLETED, STATUS_CODE_FAILED]

    @classmethod
    def cancel_all_unfinished_jobs(cls, user_id):
        """Cancel all queued or started jobs of this job type."""
        unfinished_job_models = job_models.JobModel.get_unfinished_jobs(
            cls.__name__)
        for model in unfinished_job_models:
            cls.cancel(model.id, user_id)

    @classmethod
    def _real_enqueue(cls, job_id):
        """Does the actual work of enqueueing a job for deferred execution.

        Must be implemented by subclasses.
        """
        raise NotImplementedError(
            'Subclasses of BaseJobManager should implement _real_enqueue().')

    @classmethod
    def get_status_code(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.status_code

    @classmethod
    def get_time_queued_msec(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.time_queued_msec

    @classmethod
    def get_time_started_msec(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.time_started_msec

    @classmethod
    def get_time_finished_msec(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.time_finished_msec

    @classmethod
    def get_metadata(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.metadata

    @classmethod
    def get_output(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.output

    @classmethod
    def get_error(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.error

    @classmethod
    def _require_valid_transition(
            cls, job_id, old_status_code, new_status_code):
        valid_new_status_codes = VALID_STATUS_CODE_TRANSITIONS[old_status_code]
        if new_status_code not in valid_new_status_codes:
            raise Exception(
                'Invalid status code change for job %s: from %s to %s' %
                (job_id, old_status_code, new_status_code))

    @classmethod
    def _require_correct_job_type(cls, job_type):
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

    @classmethod
    def _run(cls):
        """Function that performs the main business logic of the job.

        Needs to be implemented by subclasses.
        """
        raise NotImplementedError

    @classmethod
    def _run_job(cls, job_id):
        """Starts the job."""
        logging.info(
            'Job %s started at %s' %
            (job_id, utils.get_current_time_in_millisecs()))
        cls.register_start(job_id)

        try:
            result = cls._run()
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
        cls.register_completion(job_id, result)
        logging.info(
            'Job %s completed at %s' %
            (job_id, utils.get_current_time_in_millisecs()))

    @classmethod
    def _real_enqueue(cls, job_id):
        taskqueue_services.defer(cls._run_job, job_id)


class MapReduceJobPipeline(base_handler.PipelineBase):

    def run(self, job_id, kwargs):
        model = job_models.JobModel.get(job_id, strict=True)
        # TODO(sll): Remove the fallback to BaseMapReduceJobManager here once
        # all existing jobs have been specified in the registry.
        try:
            job_class = MapReduceJobManagerRegistry.get_job_class(
                model.job_type)
        except KeyError:
            job_class = BaseMapReduceJobManager

        job_class.register_start(job_id, {
            job_class._OUTPUT_KEY_ROOT_PIPELINE_ID: self.root_pipeline_id
        })
        output = yield mapreduce_pipeline.MapreducePipeline(**kwargs)
        yield StoreMapReduceResults(job_id, output)

    def finalized(self):
        # Suppress the default Pipeline behavior of sending email.
        pass


class StoreMapReduceResults(base_handler.PipelineBase):

    def run(self, job_id, output):
        # TODO(sll): Remove the fallback to BaseMapReduceJobManager here once
        # all existing jobs have been specified in the registry.
        model = job_models.JobModel.get(job_id, strict=True)
        try:
            job_class = MapReduceJobManagerRegistry.get_job_class(
                model.job_type)
        except KeyError:
            job_class = BaseMapReduceJobManager

        try:
            iterator = input_readers.RecordsReader(output, 0)
            results_list = []
            for item in iterator:
                # Map/reduce puts reducer output into blobstore files as a
                # string obtained via "str(result)".  Use AST as a safe
                # alternative to eval() to get the Python object back.
                results_list.append(ast.literal_eval(item))
            job_class.register_completion(job_id, results_list)
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error(
                'Job %s failed at %s' %
                (job_id, utils.get_current_time_in_millisecs()))
            job_class.register_failure(
                job_id,
                '%s\n%s' % (unicode(e), traceback.format_exc()))


class BaseMapReduceJobManager(BaseJobManager):
    # The output for this job is a list of individual results. Each item in
    # the list will be of whatever type is yielded from the 'reduce' method.
    #
    # The 'metadata' field in the BaseJob representing a MapReduceJob
    # is a dict with one key, _OUTPUT_KEY_ROOT_PIPELINE_ID. The corresponding
    # value is a string representing the ID of the MapReduceJobPipeline
    # as known to the mapreduce/lib/pipeline internals. This is used
    # to generate URLs pointing at the pipeline support UI.
    _OUTPUT_KEY_ROOT_PIPELINE_ID = 'root_pipeline_id'

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of reference to the datastore classes to map over."""
        raise NotImplementedError(
            'Classes derived from BaseMapReduceJobManager must implement '
            'entity_classes_to_map_over()')

    @staticmethod
    def map(item):
        """Implements the map function.  Must be declared @staticmethod.

        Args:
          item: The parameter passed to this function is a single element of
          the type given by entity_class(). This function may yield as many
          times as appropriate (including zero) to return key/value 2-tuples.
          For example, to get a count of all explorations, one might yield
          (exploration.id, 1).
        """
        raise NotImplementedError(
            'Classes derived from BaseMapReduceJobManager must implement map '
            'as a @staticmethod.')

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function.  Must be declared @staticmethod.

        This function should yield whatever it likes; the recommended thing to
        do is emit entities. All emitted outputs from all reducers will be
        collected in an array and set into the output value for the job, so
        don't pick anything huge. If you need something huge, persist it out
        into the datastore instead and return a reference (and dereference it
        later to load content as needed).

        Args:
          key: A key value as emitted from the map() function, above.
          values: A list of all values from all mappers that were tagged with
          the given key. This code can assume that it is the only process
          handling values for this key. (It can probably also assume that
          it will be called exactly once for each key with all of the output,
          but this needs to be verified.)
        """
        raise NotImplementedError(
            'Classes derived from BaseMapReduceJobManager must implement '
            'reduce as a @staticmethod.')

    @classmethod
    def _real_enqueue(cls, job_id):
        entity_class_types = cls.entity_classes_to_map_over()
        entity_class_names = [
            '%s.%s' % (
                entity_class_type.__module__, entity_class_type.__name__)
            for entity_class_type in entity_class_types]

        kwargs = {
            'job_name': job_id,
            'mapper_spec': '%s.%s.map' % (cls.__module__, cls.__name__),
            'reducer_spec': '%s.%s.reduce' % (cls.__module__, cls.__name__),
            'input_reader_spec': (
                'core.jobs.MultipleDatastoreEntitiesInputReader'),
            'output_writer_spec': (
                'mapreduce.output_writers.BlobstoreRecordsOutputWriter'),
            'mapper_params': {
                MAPPER_PARAM_KEY_ENTITY_KINDS: entity_class_names,
                # Note that all parameters passed to the mapper need to be
                # strings. Also note that the value for this key is determined
                # just before enqueue time, so it will be roughly equal to the
                # actual enqueue time.
                MAPPER_PARAM_KEY_QUEUED_TIME_MSECS: str(
                    utils.get_current_time_in_millisecs()),
            }
        }
        mr_pipeline = MapReduceJobPipeline(job_id, kwargs)
        mr_pipeline.start(base_path='/mapreduce/worker/pipeline')

    @classmethod
    def _pre_cancel_hook(cls, job_id, cancel_message):
        metadata = cls.get_metadata(job_id)
        if metadata:
            root_pipeline_id = metadata[cls._OUTPUT_KEY_ROOT_PIPELINE_ID]
            pipeline.Pipeline.from_id(root_pipeline_id).abort(cancel_message)

    @classmethod
    def _require_correct_job_type(cls, job_type):
        # Suppress check for correct job type since we cannot pass the specific
        # entity class in the kwargs.
        pass


ABSTRACT_BASE_CLASSES = frozenset([
    BaseJobManager, BaseDeferredJobManager, BaseMapReduceJobManager])


def get_data_for_recent_jobs(recency_msec=DEFAULT_RECENCY_MSEC):
    """Get a list containing data about all jobs.

    This list is arranged in descending order based on the time the job
    was enqueued.

    Args:
    - recency_secs: the threshold for a recent job, in seconds.

    Each element of this list is a dict that represents a job. The dict has the
    following keys:
    - 'id': the job id
    - 'time_started_msec': when the job was started, in milliseconds since the
          epoch
    - 'time_finished_msec': when the job was finished, in milliseconds since
          the epoch
    - 'status_code': the current status of the job
    - 'job_type': the type of this job
    - 'is_cancelable': whether the job can be canceled
    - 'error': any errors pertaining to this job
    """
    recent_job_models = job_models.JobModel.get_recent_jobs(
        recency_msec=recency_msec)
    result = [{
        'id': model.id,
        'time_started_msec': model.time_started_msec,
        'time_finished_msec': model.time_finished_msec,
        'status_code': model.status_code,
        'job_type': model.job_type,
        'is_cancelable': model.is_cancelable,
        'error': model.error,
    } for model in recent_job_models]
    return result


class MultipleDatastoreEntitiesInputReader(input_readers.InputReader):
    _ENTITY_KINDS_PARAM = 'entity_kinds'
    _READER_LIST_PARAM = 'readers'

    def __init__(self, reader_list):
        self._reader_list = reader_list

    def __iter__(self):
        for reader in self._reader_list:
            yield reader

    @classmethod
    def from_json(cls, input_shard_state):
        return cls(input_readers.DatastoreInputReader.from_json(
            input_shard_state[cls._READER_LIST_PARAM]))

    def to_json(self):
        return {
            self._READER_LIST_PARAM: self._reader_list.to_json()
        }

    @classmethod
    def split_input(cls, mapper_spec):
        params = mapper_spec.params
        entity_kinds = params.get(cls._ENTITY_KINDS_PARAM)

        splits = []
        for entity_kind in entity_kinds:
            new_mapper_spec = copy.deepcopy(mapper_spec)
            new_mapper_spec.params['entity_kind'] = entity_kind
            splits.append(
                input_readers.DatastoreInputReader.split_input(
                    new_mapper_spec))

        inputs = []
        for split in splits:
            for item in split:
                inputs.append(MultipleDatastoreEntitiesInputReader(item))
        return inputs

    @classmethod
    def validate(cls, mapper_spec):
        return True  # TODO


class BaseMapReduceJobManagerForContinuousComputations(BaseMapReduceJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        """Returns the ContinuousComputationManager class associated with this
        MapReduce job.
        """
        raise NotImplementedError(
            'Subclasses of BaseMapReduceJobManagerForContinuousComputations '
            'must implement the _get_continuous_computation_class() method.')

    @staticmethod
    def _entity_created_before_job_queued(entity):
        """Checks that the given entity was created before the MR job was queued.

        Mapper methods may want to use this as a precomputation check,
        especially if the datastore classes being iterated over are append-only
        event logs.
        """
        created_on_msecs = utils.get_time_in_millisecs(entity.created_on)
        job_queued_msecs = float(context.get().mapreduce_spec.mapper.params[
            MAPPER_PARAM_KEY_QUEUED_TIME_MSECS])
        return job_queued_msecs >= created_on_msecs

    @staticmethod
    def map(item):
        """Implements the map function.  Must be declared @staticmethod."""
        raise NotImplementedError(
            'Classes derived from BaseMapReduceJobManager must implement map '
            'as a @staticmethod.')

    @classmethod
    def _post_completed_hook(cls, job_id):
        cls._get_continuous_computation_class().on_batch_job_completion()

    @classmethod
    def _post_failure_hook(cls, job_id):
        cls._get_continuous_computation_class().on_batch_job_failure()


class BaseContinuousComputationManager(object):
    """This class represents a manager for a continuously-running computation.
    Such computations consist of two parts: a batch job to compute summary
    views, and a realtime layer to augment these batch views with additional
    data that has come in since the last batch job results were computed. The
    realtime layer may provide only approximate results, but the discrepancy
    should be small because the realtime layer handles a much smaller amount of
    data than the batch layer.

    The batch jobs are run continuously, with each batch job starting
    immediately after the previous run has finished. There are two realtime
    layers that are cleared alternatively after successive batch runs, just
    before a new batch job is enqueued. Events are recorded to all three
    layers.

    Here is a schematic showing how this works. The x-axis represents the
    progression of time. The arrowed intervals in the batch layer indicate how
    long the corresponding batch job takes to run, and the intervals in each
    realtime layer indicate spans between when the data in the realtime layer
    is cleared.

    Batch layer         <----->  <------->  <-------> <-------> <-------->
    Realtime layer 0    <----->  <------------------> <------------------>
    Realtime layer 1    <---------------->  <-----------------> <------ ...
                                 <-- A -->  <-- B -->

    For example, queries arising during the time interval A will use the
    results of the first batch run, plus data from the realtime layer R1.
    Queries arising during the time interval B will use the results of the
    second batch run, plus data from the realtime layer R0.
    """

    @classmethod
    def get_event_types_listened_to(cls):
        """Returns a list of event types that this class subscribes to."""
        raise NotImplementedError(
            'Subclasses of BaseContinuousComputationManager must implement '
            '_get_event_types_listened_to(). This method should return a list '
            'of event types that are subscribed to by this class.')

    @classmethod
    def _get_realtime_datastore_classes(cls):
        """Returns a 2-element list with datastore classes used by the
        realtime layers.
        """
        raise NotImplementedError(
            'Subclasses of BaseContinuousComputationManager must implement '
            '_get_realtime_datastore_classes(). This method should return '
            'a 2-element list specifying the datastore classes to be used by '
            'the realtime layers.')

    @classmethod
    def _get_batch_job_manager_class(cls):
        """Returns the manager class for the batch job."""
        raise NotImplementedError(
            'Subclasses of BaseContinuousComputationManager must implement '
            '_get_batch_job_manager_class(). This method should return the'
            'manager class for the continuously-running batch job.')

    @classmethod
    def _handle_incoming_event(
            cls, datastore_class, event_type, *args, **kwargs):
        """Records incoming events in the given realtime datastore_class.

        This method should be implemented by subclasses. The args are the
        same as those sent to the event handler corresponding to the event
        type. Note that there may be more than one event type.

        IMPORTANT: This method only gets called as part of the dequeue process
        from a deferred task queue. Thus, it should not refer to things like
        the user currently in session. In addition, if an exception is raised
        in this method, the task queue will usually retry calling it, so this
        method must be robust to multiple calls for the same event (or raise a
        taskqueue_services.PermanentTaskFailure exception on failure).
        """
        raise NotImplementedError(
            'Subclasses of BaseContinuousComputationManager must implement '
            '_handle_incoming_event(...). Please check the docstring of this '
            'method in jobs.BaseContinuousComputationManager for important '
            'developer information.')

    @classmethod
    def _get_active_realtime_index(cls):
        cc_model = job_models.ContinuousComputationModel.get(
            cls.__name__, strict=False)
        if cc_model is None:
            cc_model = job_models.ContinuousComputationModel(
                id=cls.__name__)
            cc_model.put()

        return cc_model.active_realtime_layer_index

    @classmethod
    def _get_active_realtime_datastore_class(cls):
        return cls._get_realtime_datastore_classes()[
            cls._get_active_realtime_index()]

    @classmethod
    def _get_inactive_realtime_datastore_class(cls):
        return cls._get_realtime_datastore_classes()[
            1 - cls._get_active_realtime_index()]

    @classmethod
    def _switch_active_realtime_class(cls):
        cc_model = job_models.ContinuousComputationModel.get(
            cls.__name__)
        cc_model.active_realtime_layer_index = (
            1 - cc_model.active_realtime_layer_index)
        cc_model.put()

    @classmethod
    def _clear_realtime_datastore_class(cls, datastore_class):
        """Deletes all entries in the given realtime datastore class."""
        ndb.delete_multi(datastore_class.query().iter(keys_only=True))

    @classmethod
    def _kickoff_batch_job(cls):
        """Create and enqueue a new batch job."""
        # TODO(sll): Make this job only process events before the current
        # timestamp.
        # TODO(sll): Ensure there is no other running job in the queue.
        job_manager = cls._get_batch_job_manager_class()
        job_id = job_manager.create_new()
        job_manager.enqueue(job_id)

    @classmethod
    def start_computation(cls):
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
        cc_model.put()

        # Clear the inactive realtime layer.
        cls._clear_realtime_datastore_class(
            cls._get_inactive_realtime_datastore_class())

        cls._kickoff_batch_job()

    @classmethod
    def stop_computation(cls):
        """Sends a halt signal to the computation.

        Any currently-running batch jobs will still run to completion, but no
        further batch runs will be kicked off.
        """
        cc_model = job_models.ContinuousComputationModel.get(cls.__name__)
        # TODO(sll): If there is no job currently running, go to IDLE
        # immediately.
        cc_model.status_code = (
            job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_STOPPING)
        cc_model.put()

    @classmethod
    def on_incoming_event(cls, event_type, *args, **kwargs):
        """Handle an incoming event.

        The *args and **kwargs match those passed to the _handle_event() method
        of the corresponding EventHandler subclass.
        """
        for datastore_class in cls._get_realtime_datastore_classes():
            cls._handle_incoming_event(
                datastore_class, event_type, *args, **kwargs)

    @classmethod
    def on_batch_job_completion(cls):
        """Delete all data in the currently-active realtime_datastore_class."""
        # TODO(sll): Investigate if it is possible for new data to get added
        # while the deletion is happening.
        cls._clear_realtime_datastore_class(
            cls._get_active_realtime_datastore_class())
        cls._switch_active_realtime_class()

        cc_model = job_models.ContinuousComputationModel.get(cls.__name__)
        if (cc_model.status_code ==
                job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_STOPPING):
            cc_model.status_code = (
                job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE)
            cc_model.put()
            return
        else:
            cls._kickoff_batch_job()

    @classmethod
    def on_batch_job_failure(cls):
        # TODO(sll): Alert the admin via email.
        logging.error('Job failed')
        cc_model = job_models.ContinuousComputationModel.get(cls.__name__)
        if (cc_model.status_code ==
                job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_STOPPING):
            cc_model.status_code = (
                job_models.CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE)
            cc_model.put()
            return
        else:
            cls._kickoff_batch_job()


class MapReduceJobManagerRegistry(object):
    """Registry of mapreduce job managers."""

    # Dict mapping mapreduce job manager names to their classes.
    _mr_job_manager_names_to_classes = {}

    @classmethod
    def _refresh_registry(cls):
        """Regenerates the job manager registry."""
        cls._mr_job_manager_names_to_classes = {}

        for klass in ALL_MAPREDUCE_JOB_MANAGERS:
            if klass.__name__ in cls._mr_job_manager_names_to_classes:
                raise Exception(
                    'Duplicate MR job manager class name: %s' %
                    klass.__name__)
            cls._mr_job_manager_names_to_classes[klass.__name__] = klass

    @classmethod
    def get_job_class(cls, job_manager_name):
        """Gets a MR job manager class by its name.

        Refreshes once if the name is not found; subsequently, throws an
        error.
        """
        if job_manager_name not in cls._mr_job_manager_names_to_classes:
            cls._refresh_registry()
        return cls._mr_job_manager_names_to_classes[job_manager_name]


class ContinuousComputationEventDispatcher(object):
    """Dispatches events to the relevant ContinuousComputation classes."""

    @classmethod
    def dispatch_event(cls, event_type, *args, **kwargs):
        """Dispatches an incoming event to the ContinuousComputation
        classes which listen to events of that type.
        """
        for klass in ALL_CONTINUOUS_COMPUTATION_MANAGERS:
            if event_type in klass.get_event_types_listened_to():
                klass.on_incoming_event(event_type, *args, **kwargs)
