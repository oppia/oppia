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
from core.jobs import job_test_utils
from core.jobs.batch_jobs import exp_drafts_migration_job
from core.jobs.types import job_run_result
from core.platform import models

(exp_models, user_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.USER]
)


class MigrateExplorationDraftsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = exp_drafts_migration_job.MigrateExplorationDraftsJob

    EXP_1_ID = 'exp_1_id'
    USER_1_ID = 'user_1_id'

    def setUp(self):
        super().setUp()
        self.exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='title',
            category='category',
            language_code='en',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            init_state_name='Introduction',
            states={
                'Introduction': exp_domain.State.create_default_state(
                    'Introduction', is_initial_state=True
                ).to_dict()
            },
        )
        self.exp_model.update_timestamps()
        self.exp_model.put()
        self.draft_id = '%s.%s' % (self.USER_1_ID, self.EXP_1_ID)
        self.user_data_model = self.create_model(
            user_models.ExplorationUserDataModel,
            id=self.draft_id,
            user_id=self.USER_1_ID,
            exploration_id=self.EXP_1_ID,
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
        self.user_data_model.update_timestamps()
        self.user_data_model.put()

    def test_job_migrates_draft_successfully(self):
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='DRAFT PROCESSED', stderr='', len_items=1
                )
            ]
        )

        migrated_model = user_models.ExplorationUserDataModel.get(self.draft_id)
        self.assertIsNotNone(migrated_model)
        self.assertIsNotNone(migrated_model.draft_change_list)

    def test_job_skips_users_without_drafts(self):
        no_draft_id = 'user_2.exp_1'
        no_draft_model = self.create_model(
            user_models.ExplorationUserDataModel,
            id=no_draft_id,
            user_id='user_2',
            exploration_id=self.EXP_1_ID,
            draft_change_list=None,
        )
        no_draft_model.update_timestamps()
        no_draft_model.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='DRAFT PROCESSED', stderr='', len_items=1
                )
            ]
        )
