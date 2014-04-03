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

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])

from google.appengine.ext import ndb


# These are the possible status codes for a job.
STATUS_CODE_NEW = 0
STATUS_CODE_QUEUED = 1
STATUS_CODE_STARTED = 2
STATUS_CODE_COMPLETED = 3
STATUS_CODE_FAILED = 4


class JobModel(base_models.BaseModel):
    """Class representing a datastore entity for a long-running job.

    The id of a job is, by default, its class name. Note that this means that,
    for each type of job, only one instance may run at a particular time.
    """

    # The execution time of the job, in seconds.
    execution_time_sec = ndb.IntegerProperty(indexed=False)
    # The current status code for the job.
    status_code = ndb.IntegerProperty(
        indexed=False,
        default=STATUS_CODE_NEW,
        choices=[
            STATUS_CODE_NEW, STATUS_CODE_QUEUED, STATUS_CODE_STARTED,
            STATUS_CODE_COMPLETED, STATUS_CODE_FAILED
        ])
    # The output of the job.
    output = ndb.TextProperty(indexed=False)
