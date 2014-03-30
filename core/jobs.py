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


from core.platform import models
(job_models,) = models.Registry.import_models([models.NAMES.job])
transaction_services = models.Registry.import_transaction_services()


STATUS_CODE_NEW = job_models.STATUS_CODE_NEW
STATUS_CODE_QUEUED = job_models.STATUS_CODE_QUEUED
STATUS_CODE_STARTED = job_models.STATUS_CODE_STARTED
STATUS_CODE_COMPLETED = job_models.STATUS_CODE_COMPLETED
STATUS_CODE_FAILED = job_models.STATUS_CODE_FAILED

VALID_STATUS_CODE_TRANSITIONS = {
    STATUS_CODE_NEW: [STATUS_CODE_QUEUED],
    STATUS_CODE_QUEUED: [STATUS_CODE_QUEUED, STATUS_CODE_STARTED],
    STATUS_CODE_STARTED: [
        STATUS_CODE_QUEUED, STATUS_CODE_COMPLETED, STATUS_CODE_FAILED
    ],
    STATUS_CODE_COMPLETED: [STATUS_CODE_QUEUED],
    STATUS_CODE_FAILED: [STATUS_CODE_QUEUED],
}


class BaseJob(object):
    """A class that represents a durable job at runtime.

    Note that only one instance of a job should actually be running at a
    particular time.
    """
    # IMPORTANT! This should be set to True for classes which actually define
    # jobs (as opposed to abstract base superclasses).
    IS_VALID_JOB_CLASS = False

    _job_id = None
    execution_time_sec = None
    status_code = None
    output = None

    def __init__(self):
        if not self.IS_VALID_JOB_CLASS:
            raise Exception(
                'Tried to directly initialize a job using the abstract base '
                'class %s, which is not allowed.' % self.__class__.__name__)

        self._job_id = 'job-%s' % self.__class__.__name__
        self._reload_from_datastore()

    def _reload_from_datastore(self):
        """Loads the last known state of this job from the datastore."""
        job_model = job_models.JobModel.get_by_id(self._job_id)
        if job_model:
            self.execution_time_sec = job_model.execution_time_sec
            self.status_code = job_model.status_code
            self.output = job_model.output

    def _update_status(self, strict=True):
        """Updates the status of a job in the datastore.

        If strict is True, raises an error if the job does not exist.
        """
        def update_status_in_transaction(job_id):
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
            update_status_in_transaction, self._job_id)

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

    @property
    def is_active(self):
        self._reload_from_datastore()
        return self.status_code in [STATUS_CODE_QUEUED, STATUS_CODE_STARTED]
