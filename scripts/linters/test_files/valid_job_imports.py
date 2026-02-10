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

from core.jobs.batch_jobs import (  # pylint: disable=unused-import  # isort: skip
    blog_post_search_indexing_jobs,
    blog_validation_jobs,
    collection_info_jobs,
    contributor_admin_stats_jobs,
    dummy_jobs,
    email_deletion_jobs,
    exp_migration_jobs,
    exp_search_indexing_jobs,
    exploration_voiceover_sync_jobs,
    math_interactions_audit_jobs,
    model_validation_jobs,
    opportunity_management_jobs,
    question_migration_jobs,
    skill_inspection_jobs,
    skill_migration_jobs,
    story_migration_jobs,
    subtopic_migration_jobs,
    suggestion_migration_jobs,
    suggestion_stats_computation_jobs,
    topic_migration_jobs,
    translation_migration_jobs,
    user_bios_change_jobs,
    user_stats_computation_jobs,
    user_validation_jobs,
)

from core.jobs.batch_jobs import (  # pylint: disable=unused-import  # isort: skip
    exp_recommendation_computation_jobs,
)
from core.jobs.batch_jobs import (  # pylint: disable=unused-import  # isort: skip
    suggestion_edit_state_content_deletion_jobs,
)
from core.jobs.batch_jobs import (  # pylint: disable=unused-import  # isort: skip
    exp_version_history_computation_job,
)
from core.jobs.batch_jobs import (  # pylint: disable=unused-import  # isort: skip
    rejecting_suggestion_for_invalid_content_ids_jobs,
)
from core.jobs.batch_jobs import (  # pylint: disable=unused-import  # isort: skip
    remove_profile_picture_data_url_field_jobs,
)
from core.jobs.batch_jobs import (  # pylint: disable=unused-import  # isort: skip
    story_node_jobs,
)
from core.jobs.batch_jobs import (  # pylint: disable=unused-import  # isort: skip
    audit_topic_related_models_relation_jobs,
)
from core.jobs.batch_jobs import (  # pylint: disable=unused-import  # isort: skip
    reject_invalid_suggestion_and_delete_invalid_translation_jobs,
)
from core.jobs.batch_jobs import (  # pylint: disable=unused-import  # isort: skip
    missing_translation_images_repair_jobs,
)


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
