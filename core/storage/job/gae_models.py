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

__author__ = 'Sean Lip'

import random

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])
import utils

from google.appengine.ext import ndb


# These are the possible status codes for a job.
STATUS_CODE_NEW = 0
STATUS_CODE_QUEUED = 1
STATUS_CODE_STARTED = 2
STATUS_CODE_COMPLETED = 3
STATUS_CODE_FAILED = 4
STATUS_CODE_CANCELED = 5


class JobModel(base_models.BaseModel):
    """Class representing a datastore entity for a long-running job."""

    @classmethod
    def get_new_id(cls, entity_name):
        """Overwrites superclass method."""
        job_type = entity_name
        current_time_str = str(int(utils.get_current_time_in_millisecs()))
        random_int = random.randint(0, 1000)
        return '%s-%s-%s' % (job_type, current_time_str, random_int)

    # The job type.
    job_type = ndb.StringProperty(indexed=True)
    # The time at which the job was queued.
    time_queued = ndb.FloatProperty(indexed=True)
    # The time at which the job was started. This is never set if the job was
    # canceled before it was started.
    time_started = ndb.FloatProperty(indexed=True)
    # The time at which the job was completed, failed or canceled.
    time_finished = ndb.FloatProperty(indexed=True)
    # The current status code for the job.
    status_code = ndb.IntegerProperty(
        indexed=True,
        default=STATUS_CODE_NEW,
        choices=[
            STATUS_CODE_NEW, STATUS_CODE_QUEUED, STATUS_CODE_STARTED,
            STATUS_CODE_COMPLETED, STATUS_CODE_FAILED, STATUS_CODE_CANCELED
        ])
    # The output of the job. This is only populated if the job has status code
    # STATUS_CODE_COMPLETED, and is None otherwise.
    output = ndb.TextProperty(indexed=False)
    # The error message, if applicable. Only populated if the job has status
    # code STATUS_CODE_FAILED or STATUS_CODE_CANCELED; None otherwise.
    error = ndb.TextProperty(indexed=False)

    def is_status_queued_or_started(self):
        return self.status_code in [STATUS_CODE_QUEUED, STATUS_CODE_STARTED]

    # A computed property stating whether the job is currently in queued or
    # started status.
    is_unfinished = ndb.ComputedProperty(is_status_queued_or_started)

    @classmethod
    def get_jobs(cls, job_type):
        return cls.query().filter(cls.job_type == job_type)

    @classmethod
    def get_unfinished_jobs(cls, job_type):
        return cls.query().filter(cls.job_type == job_type).filter(
            cls.is_unfinished == True)
