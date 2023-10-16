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

from __future__ import annotations

from core.jobs import base_jobs

from typing import List, Type

# IMPORTANT: These modules MUST be imported! DO NOT DELETE!
# We need each module to execute so that the class definitions trigger the
# metaclass logic. That is, the following code:
#
#     class FooJob(base_jobs.JobBase):
#         pass
#
# Will execute the following code:
#
#     JobMetaclass.__new__('FooJob', (base_jobs.JobBase,), {})
#
# We need this to happen for every job in this registry file, because the
# registry depends on JobMetaclass to handle the responsibility of keeping track
# of every job.
from core.jobs.batch_jobs import blog_post_search_indexing_jobs      # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import blog_validation_jobs                # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import collection_info_jobs                # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import email_deletion_jobs                 # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import exp_migration_jobs                  # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import (                                   # pylint: disable=unused-import  # isort: skip
    exp_recommendation_computation_jobs)
from core.jobs.batch_jobs import exp_search_indexing_jobs            # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import model_validation_jobs               # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import opportunity_management_jobs         # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import question_migration_jobs             # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import skill_migration_jobs                # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import story_migration_jobs                # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import subtopic_migration_jobs                # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import topic_migration_jobs                # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import suggestion_stats_computation_jobs   # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import suggestion_migration_jobs   # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import translation_migration_jobs         # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import user_stats_computation_jobs         # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import math_interactions_audit_jobs        # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import (                                   # pylint: disable=unused-import  # isort: skip
      exp_version_history_computation_job)
from core.jobs.batch_jobs import (                                   # pylint: disable=unused-import  # isort: skip
    rejecting_suggestion_for_invalid_content_ids_jobs)
from core.jobs.batch_jobs import (                                   # pylint: disable=unused-import  # isort: skip
    remove_profile_picture_data_url_field_jobs)
from core.jobs.batch_jobs import contributor_admin_stats_jobs        # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import (                                   # pylint: disable=unused-import  # isort: skip
    story_node_jobs)


def get_all_jobs() -> List[Type[base_jobs.JobBase]]:
    """Returns all jobs that have inherited from the JobBase class.

    Returns:
        list(class). The classes that have inherited from JobBase.
    """
    return base_jobs.JobMetaclass.get_all_jobs()


def get_all_job_names() -> List[str]:
    """Returns the names of all jobs that have inherited from the JobBase class.

    Returns:
        list(str). The names of all classes that hae inherited from JobBase.
    """
    return base_jobs.JobMetaclass.get_all_job_names()


def get_job_class_by_name(job_name: str) -> Type[base_jobs.JobBase]:
    """Returns the class associated with the given job name.

    Args:
        job_name: str. The name of the job to return.

    Returns:
        class. The class associated to the given job name.
    """
    return base_jobs.JobMetaclass.get_job_class_by_name(job_name)
