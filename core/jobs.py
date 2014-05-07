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


class PermanentTaskFailure(Exception):
    pass


class BaseJob(object):
    """Base class for durable jobs.

    Each subclass of this class defines a different type of durable job.
    Instances of each subclass each define a single job.
    """
    # IMPORTANT! This should be set to True for classes which actually define
    # jobs (as opposed to abstract base superclasses).
    IS_VALID_JOB_CLASS = False

    def __init__(self, job_id):
        self._job_id = job_id
        self.execution_time_sec = None
        self.status_code = None
        self.output = None

    def _post_failure_hook(self):
        """Run after a job has failed. Can be overwritten by subclasses."""
        pass

    def _run_job(self):
        logging.info('Job started')
        time_started = time.time()

        result = ''
        try:
            self.mark_started()
            result = self.run()
            self.mark_completed(time.time() - time_started, result)
            logging.info('Job completed')
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error('Job failed')
            self.mark_failed(time.time() - time_started, unicode(e))
            self._failure_hook()
            raise PermanentTaskFailure(
                '%s\n%s' % (unicode(e), traceback.format_exc()))

    def enqueue(self):
        self.mark_queued()
        self._run_job()

    @classmethod
    def create_new(cls):
        if not cls.IS_VALID_JOB_CLASS:
            raise Exception(
                'Tried to directly initialize a job using the abstract base '
                'class %s, which is not allowed.' % cls.__name__)

        job_id = job_models.JobModel.get_new_id(cls.__name__)
        job_model = job_models.JobModel(id=job_id)
        job_model.put()

        return cls(job_id)

    def _reload_from_datastore(self):
        """Loads the last known state of this job from the datastore."""
        job_model = job_models.JobModel.get_by_id(self._job_id)
        if job_model:
            self.execution_time_sec = job_model.execution_time_sec
            self.status_code = job_model.status_code
            self.output = job_model.output

    def _update_status(self, strict=True):
        """Saves the current status of a job domain object to the datastore.

        If strict is True, raises an error if the job does not exist.
        """
        def _update_status_in_transaction(job_id):
            job_model = job_models.JobModel.get_by_id(self._job_id)
            if not job_model:
                if strict:
                    raise Exception(
                        'Job was not created or was deleted: %s' %
                        self._job_id)
                else:
                    job_model = job_models.JobModel(id=job_id)

            valid_new_status_codes = (
                VALID_STATUS_CODE_TRANSITIONS[job_model.status_code])
            if self.status_code not in valid_new_status_codes:
                raise Exception(
                    'Invalid status code change for job %s: from %s to %s.' %
                    (self._job_id, job_model.status_code, self.status_code))

            job_model.execution_time_sec = self.execution_time_sec
            job_model.status_code = self.status_code
            job_model.output = self.output
            job_model.put()

        transaction_services.run_in_transaction(
            _update_status_in_transaction, self._job_id)

    def mark_queued(self):
        """Mark the state of a job as enqueued in the datastore.

        Creates a new job model if one does not already exist.
        """
        self.execution_time_sec = 0
        self.status_code = STATUS_CODE_QUEUED
        self.output = None
        return self._update_status(strict=False)

    def mark_started(self, output=None):
        self.execution_time_sec = 0
        self.status_code = STATUS_CODE_STARTED
        self.output = output
        return self._update_status()

    def mark_completed(self, execution_time_sec, output):
        self.execution_time_sec = execution_time_sec
        self.status_code = STATUS_CODE_COMPLETED
        self.output = output
        return self._update_status()

    def mark_failed(self, execution_time_sec, output):
        self.execution_time_sec = execution_time_sec
        self.status_code = STATUS_CODE_FAILED
        self.output = output
        return self._update_status()

    def mark_canceled(self, execution_time_sec, message):
        self.execution_time_sec = execution_time_sec
        self.status_code = STATUS_CODE_CANCELED
        self.output = message
        return self._update_status()

    @property
    def is_active(self):
        self._reload_from_datastore()
        return self.status_code in [STATUS_CODE_QUEUED, STATUS_CODE_STARTED]

    @property
    def has_finished(self):
        self._reload_from_datastore()
        return self.status_code in [STATUS_CODE_COMPLETED, STATUS_CODE_FAILED]

    def cancel(self, user_id):
        message = 'Canceled by %s' % (user_id or 'system')
        # TODO(sll): Redo this.
        execution_time_sec = time.time() - 0
        # Do job-specific cancellation work outside the transaction.
        self._cancel_queued_work()
        # Update the job record.
        transaction_services.run_in_transaction(
            self.mark_canceled, execution_time_sec, message)

    def _cancel_queued_work(self, job_id, message):
        """Override in subclasses to cancel work outside the transaction."""
        pass
