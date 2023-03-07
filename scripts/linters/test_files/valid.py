# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Python file with valid syntax, used by scripts/linters/
python_linter_test.py. This file contain valid python syntax.
"""

from __future__ import annotations
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
from core.jobs.batch_jobs import skill_migration_jobs                # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import story_migration_jobs                # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import topic_migration_jobs                # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import suggestion_stats_computation_jobs   # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import suggestion_migration_jobs   # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import translation_migration_jobs         # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import user_stats_computation_jobs         # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import math_interactions_audit_jobs        # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import mailchimp_population_jobs           # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import (                                   # pylint: disable=unused-import  # isort: skip
      exp_version_history_computation_job)
from core.jobs.batch_jobs import (                                   # pylint: disable=unused-import  # isort: skip
    rejecting_suggestion_for_invalid_content_ids_jobs)
from core.jobs.batch_jobs import user_settings_profile_picture_jobs  # pylint: disable=unused-import  # isort: skip
from core.jobs.batch_jobs import store_profile_images_to_gcs_jobs    # pylint: disable=unused-import  # isort: skip


class FakeClass:
    """This is a fake docstring for valid syntax purposes."""

    def __init__(self, fake_arg):
        self.fake_arg = fake_arg

    def fake_method(self, name):
        """This doesn't do anything.

        Args:
            name: str. Means nothing.

        Yields:
            tuple(str, str). The argument passed in but twice in a tuple.
        """
        yield (name, name)
