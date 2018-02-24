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

import random

from core.platform import models
import utils

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


# These are the possible status codes for a job.
STATUS_CODE_NEW = 'new'
STATUS_CODE_QUEUED = 'queued'
STATUS_CODE_STARTED = 'started'
STATUS_CODE_COMPLETED = 'completed'
STATUS_CODE_FAILED = 'failed'
STATUS_CODE_CANCELED = 'canceled'


class JobModel(base_models.BaseModel):
    """Class representing a datastore entity for a long-running job."""

    @classmethod
    def get_new_id(cls, entity_name):
        """Overwrites superclass method.

        Args:
            entity_name: str. The name of the entity to create a new job id for.

        Returns:
            str. A job id.
        """
        job_type = entity_name
        current_time_str = str(int(utils.get_current_time_in_millisecs()))
        random_int = random.randint(0, 1000)
        return '%s-%s-%s' % (job_type, current_time_str, random_int)

    # The job type.
    job_type = ndb.StringProperty(indexed=True)
    # The time at which the job was queued, in milliseconds since the epoch.
    time_queued_msec = ndb.FloatProperty(indexed=True)
    # The time at which the job was started, in milliseconds since the epoch.
    # This is never set if the job was canceled before it was started.
    time_started_msec = ndb.FloatProperty(indexed=True)
    # The time at which the job was completed, failed or canceled, in
    # milliseconds since the epoch.
    time_finished_msec = ndb.FloatProperty(indexed=True)
    # The current status code for the job.
    status_code = ndb.StringProperty(
        indexed=True,
        default=STATUS_CODE_NEW,
        choices=[
            STATUS_CODE_NEW, STATUS_CODE_QUEUED, STATUS_CODE_STARTED,
            STATUS_CODE_COMPLETED, STATUS_CODE_FAILED, STATUS_CODE_CANCELED
        ])
    # Any metadata for the job, such as the root pipeline id for mapreduce
    # jobs.
    metadata = ndb.JsonProperty(indexed=False)
    # The output of the job. This is only populated if the job has status code
    # STATUS_CODE_COMPLETED, and is None otherwise. If populated, this is
    # expected to be a list of strings.
    output = ndb.JsonProperty(indexed=False)
    # The error message, if applicable. Only populated if the job has status
    # code STATUS_CODE_FAILED or STATUS_CODE_CANCELED; None otherwise.
    error = ndb.TextProperty(indexed=False)
    # Whether the datastore models associated with this job have been cleaned
    # up (i.e., deleted).
    has_been_cleaned_up = ndb.BooleanProperty(default=False, indexed=True)
    # Store additional params passed with job.
    additional_job_params = ndb.JsonProperty(default=None)

    @property
    def is_cancelable(self):
        """Checks if the job is cancelable.

        Returns:
            bool. Whether the job's status_code is 'queued' or 'started'.
        """
        # Whether the job is currently in 'queued' or 'started' status.
        return self.status_code in [STATUS_CODE_QUEUED, STATUS_CODE_STARTED]

    @classmethod
    def get_recent_jobs(cls, limit, recency_msec):
        """Gets at most limit jobs with respect to a time after recency_msec.

        Args:
            limit: int. A limit on the number of jobs to return.
            recency_msec: int. The number of milliseconds earlier
                than the current time.

        Returns:
            list(JobModel) or None. A list of at most `limit` jobs
            that come after recency_msec time.
        """
        earliest_time_msec = (
            utils.get_current_time_in_millisecs() - recency_msec)
        return cls.query().filter(
            cls.time_queued_msec > earliest_time_msec
        ).order(-cls.time_queued_msec).fetch(limit)

    @classmethod
    def get_all_unfinished_jobs(cls, limit):
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
    def get_unfinished_jobs(cls, job_type):
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
    def do_unfinished_jobs_exist(cls, job_type):
        """Checks if unfinished jobs exist.

        Returns:
            bool. True if unfinished jobs exist, otherwise false.
        """
        return bool(cls.get_unfinished_jobs(job_type).count(limit=1))


# Allowed transitions: idle --> running --> stopping --> idle.
CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE = 'idle'
CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING = 'running'
CONTINUOUS_COMPUTATION_STATUS_CODE_STOPPING = 'stopping'


class ContinuousComputationModel(base_models.BaseModel):
    """Class representing a continuous computation.

    The id of each instance of this model is the name of the continuous
    computation manager class.
    """
    # The current status code for the computation.
    status_code = ndb.StringProperty(
        indexed=True,
        default=CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE,
        choices=[
            CONTINUOUS_COMPUTATION_STATUS_CODE_IDLE,
            CONTINUOUS_COMPUTATION_STATUS_CODE_RUNNING,
            CONTINUOUS_COMPUTATION_STATUS_CODE_STOPPING
        ])
    # The realtime layer that is currently 'active' (i.e., the one that is
    # going to be cleared immediately after the current batch job run
    # completes).
    active_realtime_layer_index = ndb.IntegerProperty(
        default=0,
        choices=[0, 1])

    # The time at which a batch job for this computation was last kicked off,
    # in milliseconds since the epoch.
    last_started_msec = ndb.FloatProperty(indexed=True)
    # The time at which a batch job for this computation was last completed or
    # failed, in milliseconds since the epoch.
    last_finished_msec = ndb.FloatProperty(indexed=True)
    # The time at which a halt signal was last sent to this batch job, in
    # milliseconds since the epoch.
    last_stopped_msec = ndb.FloatProperty(indexed=True)
