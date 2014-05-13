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
import logging
import time
import traceback

from core.platform import models
(job_models,) = models.Registry.import_models([models.NAMES.job])
taskqueue_services = models.Registry.import_taskqueue_services()
transaction_services = models.Registry.import_transaction_services()

from mapreduce import base_handler
from mapreduce import input_readers
from mapreduce import mapreduce_pipeline
from mapreduce.lib.pipeline import pipeline

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


ABSTRACT_BASE_CLASSES = frozenset([
    'BaseJobManager', 'BaseDeferredJobManager', 'BaseMapReduceJobManager'])


class BaseJobManager(object):
    """Base class for managing long-running jobs.

    These jobs are not transaction-safe, and multiple jobs of the same kind
    may run at once and overlap. Individual jobs should account for this. In
    particular, if a job writes to some location, no other enqueued or running
    job should be writing to, or reading from, that location.
    """
    @classmethod
    def create_new(cls):
        """Creates a new job of this class type. Returns the id of this job."""
        if cls.__name__ in ABSTRACT_BASE_CLASSES:
            raise Exception(
                'Tried to directly create a job using the abstract base '
                'manager class %s, which is not allowed.' % cls.__name__)

        job_id = job_models.JobModel.get_new_id(cls.__name__)
        job_models.JobModel(id=job_id, job_type=cls.__name__).put()
        return job_id

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
        model.time_queued = time.time()
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
        model.time_started = time.time()
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
        model.time_finished = time.time()
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
        model.time_finished = time.time()
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
        model.time_finished = time.time()
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
    def get_time_queued(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.time_queued

    @classmethod
    def get_time_started(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.time_started

    @classmethod
    def get_time_finished(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        cls._require_correct_job_type(model.job_type)
        return model.time_finished

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
        logging.info('Job %s started at %s' % (job_id, time.time()))
        cls.register_start(job_id)

        try:
            result = cls._run()
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error('Job %s failed at %s' % (job_id, time.time()))
            cls.register_failure(
                job_id, '%s\n%s' % (unicode(e), traceback.format_exc()))
            raise taskqueue_services.PermanentTaskFailure(
                'Task failed: %s\n%s' % (unicode(e), traceback.format_exc()))

        # Note that the job may have been canceled after it started and before
        # it reached this stage. This will result in an exception when the
        # validity of the status code transition is checked.
        cls.register_completion(job_id, result)
        logging.info('Job %s completed at %s' % (job_id, time.time()))

    @classmethod
    def _real_enqueue(cls, job_id):
        taskqueue_services.defer(cls._run_job, job_id)


class MapReduceJobPipeline(base_handler.PipelineBase):

    def run(self, job_id, kwargs):
        BaseMapReduceJobManager.register_start(job_id, {
            BaseMapReduceJobManager._OUTPUT_KEY_ROOT_PIPELINE_ID: (
                self.root_pipeline_id)
        })
        output = yield mapreduce_pipeline.MapreducePipeline(**kwargs)
        yield StoreMapReduceResults(job_id, output)

    def finalized(self):
        # Suppress the default Pipeline behavior of sending email.
        pass


class StoreMapReduceResults(base_handler.PipelineBase):

    def run(self, job_id, output):
        try:
            iterator = input_readers.RecordsReader(output, 0)
            results_list = []
            for item in iterator:
                # Map/reduce puts reducer output into blobstore files as a
                # string obtained via "str(result)".  Use AST as a safe
                # alternative to eval() to get the Python object back.
                results_list.append(ast.literal_eval(item))
            transaction_services.run_in_transaction(
                BaseMapReduceJobManager.register_completion,
                job_id, results_list)
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error('Job %s failed at %s' % (job_id, time.time()))
            transaction_services.run_in_transaction(
                BaseMapReduceJobManager.register_failure, job_id,
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
    def entity_class_to_map_over(cls):
        """Return a reference to the datastore class to map over."""
        raise NotImplementedError(
            'Classes derived from BaseMapReduceJobManager must implement '
            'entity_class()')

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
        entity_class_type = cls.entity_class_to_map_over()
        entity_class_name = '%s.%s' % (entity_class_type.__module__,
                                       entity_class_type.__name__)
        kwargs = {
            'job_name': job_id,
            'mapper_spec': '%s.%s.map' % (cls.__module__, cls.__name__),
            'reducer_spec': '%s.%s.reduce' % (cls.__module__, cls.__name__),
            'input_reader_spec': (
                'mapreduce.input_readers.DatastoreInputReader'),
            'output_writer_spec': (
                'mapreduce.output_writers.BlobstoreRecordsOutputWriter'),
            'mapper_params': {
                'entity_kind': entity_class_name,
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
