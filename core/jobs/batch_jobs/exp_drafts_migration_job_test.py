# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for exp_drafts_migration_job."""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_drafts_migration_job
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, user_models

(exp_models, user_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.USER]
)


class MigrateExplorationDraftsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = exp_drafts_migration_job.MigrateExplorationDraftsJob

    EXP_ID = 'exp_1'
    USER_ID = 'user_1'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_migrates_draft_successfully(self) -> None:
        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_ID,
            title='title',
            category='category',
            language_code='en',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            init_state_name='Introduction',
            states={
                'Introduction': state_domain.State.create_default_state(
                    'Introduction',
                    content_id_for_state_content='content_0',
                    content_id_for_default_outcome='default_outcome_1',
                    is_initial_state=True,
                ).to_dict()
            },
        )
        exp_model.update_timestamps()
        exp_model.put()

        draft_id = '%s.%s' % (self.USER_ID, self.EXP_ID)
        user_data_model = self.create_model(
            user_models.ExplorationUserDataModel,
            id=draft_id,
            user_id=self.USER_ID,
            exploration_id=self.EXP_ID,
            draft_change_list=[
                {
                    'cmd': 'edit_state_property',
                    'state_name': 'Introduction',
                    'property_name': 'content',
                    'new_value': {'html': 'Old content format'},
                }
            ],
            draft_change_list_last_updated=None,
        )
        user_data_model.update_timestamps()
        user_data_model.put()

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout='DRAFT PROCESSED SUCCESS: 1')]
        )

        migrated_model = user_models.ExplorationUserDataModel.get(
            self.USER_ID, self.EXP_ID
        )

        assert migrated_model is not None
        self.assertIsNotNone(migrated_model.draft_change_list)

    def test_skips_users_without_drafts(self) -> None:
        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_ID,
            title='title',
            category='category',
            language_code='en',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            init_state_name='Introduction',
            states={
                'Introduction': state_domain.State.create_default_state(
                    'Introduction',
                    content_id_for_state_content='content_0',
                    content_id_for_default_outcome='default_outcome_1',
                    is_initial_state=True,
                ).to_dict()
            },
        )
        exp_model.update_timestamps()
        exp_model.put()

        no_draft_id = 'user_2.%s' % self.EXP_ID
        no_draft_model = self.create_model(
            user_models.ExplorationUserDataModel,
            id=no_draft_id,
            user_id='user_2',
            exploration_id=self.EXP_ID,
            draft_change_list=None,
        )
        no_draft_model.update_timestamps()
        no_draft_model.put()

        self.assert_job_output_is_empty()
