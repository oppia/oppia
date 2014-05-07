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

import logging
import time
import traceback

from core.platform import models
(job_models,) = models.Registry.import_models([models.NAMES.job])
taskqueue_services = models.Registry.import_taskqueue_services()
transaction_services = models.Registry.import_transaction_services()


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


class BaseJob(object):
    """Base class for durable jobs.

    Each subclass of this class defines a different type of durable job.
    Instances of each subclass each define a single job.
    """
    # IMPORTANT! This should be set to True for classes which actually define
    # jobs (as opposed to abstract base superclasses).
    IS_VALID_JOB_CLASS = False

    def __init__(self, job_id, status_code, time_queued, time_started,
                 time_finished, output, error):
        self._job_id = job_id
        self.status_code = status_code
        self.time_queued = time_queued
        self.time_started = time_started
        self.time_finished = time_finished
        self.output = output
        self.error = error

    @classmethod
    def load_from_datastore_model(cls, job_id):
        model = job_models.JobModel.get(job_id, strict=True)
        return cls(
            model.id, model.status_code, model.time_queued, model.time_started,
            model.time_finished, model.output, model.error)

    @classmethod
    def create_new(cls):
        """Creates a new job of this class type."""
        if not cls.IS_VALID_JOB_CLASS:
            raise Exception(
                'Tried to directly initialize a job using the abstract base '
                'class %s, which is not allowed.' % cls.__name__)

        job_id = job_models.JobModel.get_new_id(cls.__name__)
        job_model = job_models.JobModel(id=job_id, job_type=cls.__name__)
        job_model.put()

        return cls(
            job_id, job_model.status_code, job_model.time_queued,
            job_model.time_started, job_model.time_finished, job_model.output,
            job_model.error)

    def enqueue(self):
        """Adds the job to the default task queue."""
        self._mark_queued()
        taskqueue_services.defer(self._run_job)

    def cancel(self, user_id):
        cancel_message = 'Canceled by %s' % (user_id or 'system')
        # Do job-specific cancellation work outside the transaction.
        self._pre_cancel_hook(self._job_id)
        self._mark_canceled(cancel_message)

    @classmethod
    def cancel_all_unfinished_jobs(cls):
        """Cancel all queued or started jobs of this job type."""
        unfinished_job_models = job_models.JobModel.get_unfinished_jobs(
            cls.__name__)
        for job_model in unfinished_job_models:
            job = cls(
                job_model.id, job_model.status_code, job_model.time_queued,
                job_model.time_started, job_model.time_finished,
                job_model.output, job_model.error)
            job.cancel()

    def _run(self):
        """Function that performs the main business logic of the job.

        Needs to be implemented by subclasses.
        """
        raise NotImplementedError

    def _pre_cancel_hook(self, job_id):
        """Run before a job is canceled. Can be overwritten by subclasses."""
        pass

    def _post_failure_hook(self):
        """Run after a job has failed. Can be overwritten by subclasses."""
        pass

    def _run_job(self):
        """Starts the job."""
        logging.info('Job %s started at %s' % (self._job_id, time.time()))
        self._mark_started()

        try:
            result = self._run()
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error('Job %s failed at %s' % (self._job_id, time.time()))
            self._mark_failed('%s\n%s' % (unicode(e), traceback.format_exc()))
            self._post_failure_hook()
            raise Exception(
                'Task failed: %s\n%s' % (unicode(e), traceback.format_exc()))

        # Note that the job may have been canceled after it started and before
        # it reached this stage. This will result in an exception when the
        # validity of the status code transition is checked.
        self._mark_completed(result)
        logging.info('Job %s completed at %s' % (self._job_id, time.time()))

    def _require_valid_transition(self, old_status_code, new_status_code):
        valid_new_status_codes = VALID_STATUS_CODE_TRANSITIONS[old_status_code]
        if new_status_code not in valid_new_status_codes:
            raise Exception(
                'Invalid status code change for job %s: from %s to %s.' %
                (self._job_id, old_status_code, new_status_code))

    def _update_status(self):
        """Saves the current status of a job domain object to the datastore."""
        def _update_status_in_transaction(job_id):
            job_model = job_models.JobModel.get(self._job_id, strict=True)
            job_model.status_code = self.status_code
            job_model.time_queued = self.time_queued
            job_model.time_started = self.time_started
            job_model.time_finished = self.time_finished
            job_model.output = self.output
            job_model.error = self.error
            job_model.put()

        transaction_services.run_in_transaction(
            _update_status_in_transaction, self._job_id)

    def _mark_queued(self):
        """Mark the state of a job as enqueued in the datastore."""
        self._require_valid_transition(self.status_code, STATUS_CODE_QUEUED)
        self.status_code = STATUS_CODE_QUEUED
        self.time_queued = time.time()
        self._update_status()

    def _mark_started(self):
        self._require_valid_transition(self.status_code, STATUS_CODE_STARTED)
        self.status_code = STATUS_CODE_STARTED
        self.time_started = time.time()
        self._update_status()

    def _mark_completed(self, output):
        self._require_valid_transition(self.status_code, STATUS_CODE_COMPLETED)
        self.status_code = STATUS_CODE_COMPLETED
        self.time_finished = time.time()
        self.output = output
        self._update_status()

    def _mark_failed(self, error):
        self._require_valid_transition(self.status_code, STATUS_CODE_FAILED)
        self.status_code = STATUS_CODE_FAILED
        self.time_finished = time.time()
        self.error = error
        self._update_status()

    def _mark_canceled(self, cancel_message):
        self._require_valid_transition(self.status_code, STATUS_CODE_CANCELED)
        self.status_code = STATUS_CODE_CANCELED
        self.time_finished = time.time()
        self.error = cancel_message
        self._update_status()

    @property
    def is_active(self):
        return self.status_code in [STATUS_CODE_QUEUED, STATUS_CODE_STARTED]

    @property
    def has_finished(self):
        return self.status_code in [STATUS_CODE_COMPLETED, STATUS_CODE_FAILED]

    @property
    def execution_time_sec(self):
        if self.time_started is None or self.time_finished is None:
            return None
        else:
            return self.time_finished - self.time_started
