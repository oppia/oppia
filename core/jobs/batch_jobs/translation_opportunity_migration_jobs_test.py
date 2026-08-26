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

"""Unit tests for translation_opportunity_migration_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain, rights_manager
from core.jobs import job_test_utils
from core.jobs.batch_jobs import translation_opportunity_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models

(exp_models, opportunity_models, translation_models) = (
    models.Registry.import_models(
        [
            models.Names.EXPLORATION,
            models.Names.OPPORTUNITY,
            models.Names.TRANSLATION,
        ]
    )
)


class BackfillTranslationMissingReasonsJobTests(job_test_utils.JobTestBase):
    """Tests for BackfillTranslationMissingReasonsJob."""

    JOB_CLASS = (
        translation_opportunity_migration_jobs.BackfillTranslationMissingReasonsJob
    )

    EXP_1_ID = 'exp_1'

    def setUp(self) -> None:
        super().setUp()
        self.signup('author@example.com', 'author')
        self.author_id = self.get_user_id_from_email('author@example.com')

        rights_manager.create_new_exploration_rights(
            self.EXP_1_ID, self.author_id
        )
        self.exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='title',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category='category',
            objective='objective',
            language_code='en',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: (
                    exp_domain.Exploration.create_default_exploration(
                        self.EXP_1_ID
                    )
                    .states[feconf.DEFAULT_INIT_STATE_NAME]
                    .to_dict()
                )
            },
        )
        commit_cmd = exp_domain.ExplorationChange(
            {
                'cmd': exp_domain.CMD_CREATE_NEW,
                'title': 'title',
                'category': 'category',
            }
        )
        self.exp_model.commit(
            self.author_id, 'commit_message', [commit_cmd.to_dict()]
        )

        self.translation_model = self.create_model(
            translation_models.EntityTranslationsModel,
            id='exploration.exp_1.1.hi',
            entity_type='exploration',
            entity_id=self.EXP_1_ID,
            entity_version=1,
            language_code='hi',
            translations={
                'content_0': {
                    'content_format': 'html',
                    'content_value': '<p>Hola</p>',
                    'needs_update': False,
                }
            },
        )
        self.translation_model.update_timestamps()
        self.translation_model.put()

        self.opp_model = self.create_model(
            opportunity_models.TranslationOpportunityModel,
            id='exploration.exp_1',
            entity_type='exploration',
            entity_id=self.EXP_1_ID,
            topic_ids=['topic_id'],
            content_count=1,
            incomplete_translation_language_codes=[],
            translation_counts={'hi': 1},
            translation_missing_reasons={},
        )
        self.opp_model.update_timestamps()
        self.opp_model.put()

        self.summary_model = self.create_model(
            opportunity_models.ExplorationOpportunitySummaryModel,
            id=self.EXP_1_ID,
            topic_id='topic_id',
            topic_name='topic title',
            story_id='story_id',
            story_title='story title',
            chapter_title='chapter title',
            content_count=1,
            incomplete_translation_language_codes=[],
            translation_counts={'hi': 1},
            translation_missing_reasons={},
        )
        self.summary_model.update_timestamps()
        self.summary_model.put()

    def test_empty_storage(self) -> None:
        self.exp_model.delete()
        self.assert_job_output_is([])

    def test_job_migrates_models(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='BACKFILL_TRANSLATION_MISSING_REASONS SUCCESS: 1'
                )
            ]
        )

        migrated_opp = opportunity_models.TranslationOpportunityModel.get(
            'exploration.exp_1'
        )
        self.assertEqual(
            migrated_opp.translation_missing_reasons, {'hi': ['new']}
        )

        migrated_summary = (
            opportunity_models.ExplorationOpportunitySummaryModel.get('exp_1')
        )
        self.assertEqual(
            migrated_summary.translation_missing_reasons, {'hi': ['new']}
        )
