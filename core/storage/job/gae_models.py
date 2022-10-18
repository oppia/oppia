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

"""Models for long-running jobs."""

from __future__ import annotations

from core.platform import models

from typing import Dict, Final, Sequence

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()


# These are the possible status codes for a job.
STATUS_CODE_NEW: Final = 'new'
STATUS_CODE_QUEUED: Final = 'queued'
STATUS_CODE_STARTED: Final = 'started'
STATUS_CODE_COMPLETED: Final = 'completed'
STATUS_CODE_FAILED: Final = 'failed'
STATUS_CODE_CANCELED: Final = 'canceled'


class JobModel(base_models.BaseModel):
    """Class representing a datastore entity for a long-running job."""

    # The job type.
    job_type = datastore_services.StringProperty(indexed=True)
    # The time at which the job was queued, in milliseconds since the epoch.
    time_queued_msec = datastore_services.FloatProperty(indexed=True)
    # The time at which the job was started, in milliseconds since the epoch.
    # This is never set if the job was canceled before it was started.
    time_started_msec = datastore_services.FloatProperty(indexed=True)
    # The time at which the job was completed, failed or canceled, in
    # milliseconds since the epoch.
    time_finished_msec = datastore_services.FloatProperty(indexed=True)
    # The current status code for the job.
    status_code = datastore_services.StringProperty(
        indexed=True,
        default=STATUS_CODE_NEW,
        choices=[
            STATUS_CODE_NEW, STATUS_CODE_QUEUED, STATUS_CODE_STARTED,
            STATUS_CODE_COMPLETED, STATUS_CODE_FAILED, STATUS_CODE_CANCELED
        ])
    # Any metadata for the job, such as the root pipeline id for mapreduce
    # jobs.
    metadata = datastore_services.JsonProperty(indexed=False)
    # The output of the job. This is only populated if the job has status code
    # STATUS_CODE_COMPLETED, and is None otherwise. If populated, this is
    # expected to be a list of strings.
    output = datastore_services.JsonProperty(indexed=False)
    # The error message, if applicable. Only populated if the job has status
    # code STATUS_CODE_FAILED or STATUS_CODE_CANCELED; None otherwise.
    error = datastore_services.TextProperty(indexed=False)
    # Whether the datastore models associated with this job have been cleaned
    # up (i.e., deleted).
    has_been_cleaned_up = (
        datastore_services.BooleanProperty(default=False, indexed=True))
    # Store additional params passed with job.
    additional_job_params = datastore_services.JsonProperty(default=None)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'job_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_queued_msec': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_started_msec': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_finished_msec': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'status_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'metadata': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'output': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'error': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'has_been_cleaned_up': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'additional_job_params': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @property
    def is_cancelable(self) -> bool:
        """Checks if the job is cancelable.

        Returns:
            bool. Whether the job's status_code is 'queued' or 'started'.
        """
        # Whether the job is currently in 'queued' or 'started' status.
        return self.status_code in [STATUS_CODE_QUEUED, STATUS_CODE_STARTED]

    @classmethod
    def get_all_unfinished_jobs(cls, limit: int) -> Sequence[JobModel]:
        """Gets at most `limit` unfinished jobs.

        Args:
            limit: int. A limit on the number of jobs to return.

        Returns:
            list(JobModel) or None. A list of at most `limit` number
            of unfinished jobs.
        """
        return cls.query().filter(
            JobModel.status_code.IN([STATUS_CODE_QUEUED, STATUS_CODE_STARTED])
        ).order(-cls.time_queued_msec).fetch(limit)

    @classmethod
    def get_unfinished_jobs(cls, job_type: str) -> datastore_services.Query:
        """Gets jobs that are unfinished.

        Args:
            job_type: str. The type of jobs that may be unfinished.

        Returns:
            list(JobModel) or None. A list of all jobs that belong
            to the given job_type.
        """
        return cls.query().filter(cls.job_type == job_type).filter(
            JobModel.status_code.IN([STATUS_CODE_QUEUED, STATUS_CODE_STARTED]))

    @classmethod
    def do_unfinished_jobs_exist(cls, job_type: str) -> bool:
        """Checks if unfinished jobs exist.

        Args:
            job_type: str. Type of job for which to check.

        Returns:
            bool. True if unfinished jobs exist, otherwise false.
        """
        return bool(cls.get_unfinished_jobs(job_type).count(limit=1))
