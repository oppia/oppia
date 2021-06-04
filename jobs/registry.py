# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Entry point for accessing the full collection of Apache Beam jobs.

This module imports all of the "jobs.*_jobs" modules so that they can be fetched
from the JobMetaclass which keeps track of them all.

TODO(#11475): Add lint checks that ensure all "jobs.*_jobs" modules are imported
into this file.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from jobs import base_jobs
from jobs import base_validation_jobs  # pylint: disable=unused-import


def get_all_jobs():
    """Returns all jobs that have inherited from the JobBase class.

    Returns:
        list(class). The classes that have inherited from JobBase.
    """
    return base_jobs.JobMetaclass.get_all_jobs()


def get_all_job_names():
    """Returns the names of all jobs that have inherited from the JobBase class.

    Returns:
        list(str). The names of all classes that hae inherited from JobBase.
    """
    return base_jobs.JobMetaclass.get_all_job_names()
