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
    """Class representing a datastore entity for a long-running job.

    Attributes:
        job_type: The job type.
        time_queued_msec: The time at which the job was queued, in milliseconds since the epoch.
        time_started_msec: The time at which the job was started, in milliseconds since the epoch.
            This is never set if the job was canceled before it was started.
        time_finished_msec: The time at which the job was completed, failed or canceled, in
            milliseconds since the epoch.
        status_code: The current status code for the job.
        metadata: Any metadata for the job, such as the root pipeline id for mapreduce
            jobs.
        output: The output of the job. This is only populated if the job has status code
            STATUS_CODE_COMPLETED, and is None otherwise.
        error: The error message, if applicable. Only populated if the job has status
            code STATUS_CODE_FAILED or STATUS_CODE_CANCELED; None otherwise.
        has_been_cleaned_up:  Whether the datastore models associated with this job have been cleaned
            up (i.e., deleted).
        additional_job_params: Store additional params passed with job.
    """

    @classmethod
    def get_new_id(cls, entity_name):
        """Overwrites superclass method.

        This method is used to generate a new id for the job.

        Args:
            entity_name: a name for the running job.
        Returns:
            A string representation of the new id. It consists of the 
            job type, current time, and a random integer.
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
    # STATUS_CODE_COMPLETED, and is None otherwise.
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
        """Determines if the running job can be canceled.

        If a job is in queued or started state, then it can be canceled.

        Returns:
            A boolean the indicates whether the job is currently in 'queued' or 
            'started' status.
        """

        # Whether the job is currently in 'queued' or 'started' status.
        return self.status_code in [STATUS_CODE_QUEUED, STATUS_CODE_STARTED]

    @classmethod
    def get_recent_jobs(cls, limit, recency_msec):
        """Get recently run jobs.

        Args:
            limit: The maximum number of jobs to return.
            recency_msec: the time range in milliseconds
                for resent jobs.
        Returns:
            A sequence of jobs.
        """

        earliest_time_msec = (
            utils.get_current_time_in_millisecs() - recency_msec)
        return cls.query().filter(
            cls.time_queued_msec > earliest_time_msec
        ).order(-cls.time_queued_msec).fetch(limit)

    @classmethod
    def get_all_unfinished_jobs(cls, limit):
        """Gets all unfinished jobs.

        Args:
            limit: The maximum number of jobs to return. 
        Returns:
            A sequence of unfinished jobs.
        """

        return cls.query().filter(
            JobModel.status_code.IN([STATUS_CODE_QUEUED, STATUS_CODE_STARTED])
        ).order(-cls.time_queued_msec).fetch(limit)

    @classmethod
    def get_unfinished_jobs(cls, job_type):
        """Gets all unifished job of a particular job_type.

        All unfished jobs whos type match the given job_type
        will be returned.
        Args:
            job_type: The job type.
        Returns:
            A sequence of jobs whose type match job_type.
        """

        return cls.query().filter(cls.job_type == job_type).filter(
            JobModel.status_code.IN([STATUS_CODE_QUEUED, STATUS_CODE_STARTED]))

    @classmethod
    def do_unfinished_jobs_exist(cls, job_type):
        """Checks for existence of unfinished jobs.

        Args:
            job_type: The job type.
        Returns:
            A boolean that indicates if there are unfinished jobs
            of the particular job_type.
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

    Attributes:
        status_code: The current status code for the computation.
        active_realtime_layer_index: The realtime layer that is currently 'active' 
            (i.e., the one that is going to be cleared immediately after the current batch job run
            completes).
        last_started_msec: The time at which a batch job for this computation was last kicked off,
            in milliseconds since the epoch.
        last_finished_msec: The time at which a batch job for this computation was last completed or
            failed, in milliseconds since the epoch.
        last_stopped_msec: The time at which a halt signal was last sent to this batch job, in
            milliseconds since the epoch.
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
