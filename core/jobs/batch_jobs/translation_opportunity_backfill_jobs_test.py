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

"""Unit tests for translation_opportunity_backfill_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain, rights_manager
from core.jobs import job_test_utils
from core.jobs.batch_jobs import translation_opportunity_backfill_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:
    from mypy_imports import (
        exp_models,
        opportunity_models,
        story_models,
        translation_models,
    )

exp_models, opportunity_models, translation_models, story_models = (
    models.Registry.import_models(
        [
            models.Names.EXPLORATION,
            models.Names.OPPORTUNITY,
            models.Names.TRANSLATION,
            models.Names.STORY,
        ]
    )
)


class BackfillTranslationOpportunityModelJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):
    JOB_CLASS = (
        translation_opportunity_backfill_jobs.BackfillTranslationOpportunityModelJob
    )

    def setUp(self) -> None:
        super().setUp()
        self.signup('author@example.com', 'author')
        self.author_id = self.get_user_id_from_email('author@example.com')
        self.exp_id = 'exp_1'

        rights_manager.create_new_exploration_rights(
            self.exp_id, self.author_id
        )
        model = self.create_model(
            exp_models.ExplorationModel,
            id=self.exp_id,
            title='Test Exploration',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={
                feconf.DEFAULT_INIT_STATE_NAME: (
                    exp_domain.Exploration.create_default_exploration(
                        self.exp_id
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
        model.commit(self.author_id, 'commit_message', [commit_cmd.to_dict()])

        # Create StoryModel.
        story_model = self.create_model(
            story_models.StoryModel,
            id='story_id',
            title='story title',
            description='description',
            notes='notes',
            language_code='en',
            story_contents_schema_version=feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            corresponding_topic_id='topic_id',
            url_fragment='story-frag',
            story_contents={
                'initial_node_id': 'node_1',
                'nodes': [
                    {
                        'id': 'node_1',
                        'title': 'chapter title',
                        'exploration_id': self.exp_id,
                        'destination_node_ids': [],
                        'prerequisite_skill_ids': [],
                        'acquired_skill_ids': [],
                        'outline': '',
                        'outline_is_finalized': False,
                        'thumbnail_filename': None,
                        'thumbnail_bg_color': None,
                        'thumbnail_size_in_bytes': None,
                    }
                ],
                'next_node_id': 'node_2',
            },
        )
        story_model.update_timestamps()
        story_model.commit(
            self.author_id, 'commit_message', [{'cmd': 'test_command'}]
        )

        # Create EntityTranslationsModel.
        translation_model = (
            translation_models.EntityTranslationsModel.create_new(
                'exploration',
                self.exp_id,
                1,
                'hi',
                {
                    'content_0': {
                        'content_format': 'html',
                        'content_value': '<p>Hola</p>',
                        'needs_update': False,
                    },
                    'content_1': {
                        'content_format': 'html',
                        'content_value': '<p>Needs update</p>',
                        'needs_update': True,
                    },
                },
            )
        )
        translation_model.update_timestamps()
        translation_model.put()

    def test_creates_translation_opportunity_model(self) -> None:
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

        model = opportunity_models.TranslationOpportunityModel.get(
            opportunity_models.TranslationOpportunityModel._generate_id(  # pylint: disable=protected-access
                feconf.TranslatableEntityType.EXPLORATION.value, self.exp_id
            )
        )
        self.assertIsNotNone(model)
        self.assertEqual(model.entity_type, 'exploration')
        self.assertEqual(model.entity_id, self.exp_id)
        self.assertEqual(model.topic_ids, ['topic_id'])
        # Exploration currently has 0 content_count from create_default_exploration.
        self.assertEqual(model.content_count, 0)
        self.assertEqual(model.translation_counts, {'hi': 1})

    def test_creates_translation_opportunity_model_with_complete_native_language(
        self,
    ) -> None:
        translation_model_en = (
            translation_models.EntityTranslationsModel.create_new(
                'exploration', self.exp_id, 1, 'en', {}
            )
        )
        translation_model_en.update_timestamps()
        translation_model_en.put()

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='TRANSLATION OPPORTUNITY MODEL CREATION SUCCESS: 1'
                ),
            ]
        )

        model = opportunity_models.TranslationOpportunityModel.get(
            opportunity_models.TranslationOpportunityModel._generate_id(  # pylint: disable=protected-access
                feconf.TranslatableEntityType.EXPLORATION.value, self.exp_id
            )
        )
        self.assertEqual(model.translation_counts, {'hi': 1, 'en': 0})

    def test_fails_if_missing_story_model(self) -> None:
        story_model = story_models.StoryModel.get_by_id('story_id')
        story_model.delete(
            self.author_id, 'Deleting for test', force_deletion=True
        )
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr='TRANSLATION OPPORTUNITY MODEL CREATION ERROR: "Missing topic_id": 1'
                ),
            ]
        )

    def test_fails_if_missing_exploration_model(self) -> None:
        exp_model = exp_models.ExplorationModel.get_by_id(self.exp_id)
        exp_model.delete(self.author_id, 'Deleting for test')
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stderr='TRANSLATION OPPORTUNITY MODEL CREATION ERROR: "Missing ExplorationModel": 1'
                ),
            ]
        )


class AuditBackfillTranslationOpportunityModelJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase
):
    JOB_CLASS = (
        translation_opportunity_backfill_jobs.AuditBackfillTranslationOpportunityModelJob
    )

    def test_empty_job_output(self) -> None:
        self.assert_job_output_is_empty()
