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

"""Unit tests for jobs.batch_jobs.suggestion_migration_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain
from core.domain import question_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import suggestion_services
from core.domain import translation_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import suggestion_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

from typing import Dict, Union
from typing_extensions import Final

MYPY = False
if MYPY:
    from mypy_imports import datastore_services

(exp_models, suggestion_models) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.SUGGESTION
])
datastore_services = models.Registry.import_datastore_services()


class MigrateSuggestionJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = (
        suggestion_migration_jobs
        .RegenerateContentIdForTranslationSuggestionsInReviewJob
    )
    TARGET_ID = 'exp1'
    OLD_SCHEMA_VERSION = 50

    def setUp(self) -> None:
        super().setUp()
        self.STATE_1 = state_domain.State.create_default_state(
            feconf.DEFAULT_INIT_STATE_NAME, 'content_0', 'default_outcome_1',
            is_initial_state=True).to_dict()
        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.TARGET_ID,
            title='title',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            states_schema_version=self.OLD_SCHEMA_VERSION,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={feconf.DEFAULT_INIT_STATE_NAME: self.STATE_1},
            next_content_id_index=2,
        )
        self.put_multi([self.exp_1])

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_suggestion_is_migrated(self) -> None:
        change_dict = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Introduction',
            'new_value': {
                'content_id': 'default_outcome_1',
                'html': (
                    '<oppia-noninteractive-math raw_latex-with-value="&am'
                    'p;quot;(x - a_1)(x - a_2)(x - a_3)...(x - a_n)&amp;q'
                    'uot;"></oppia-noninteractive-math>')
            }
        }
        suggestion_1_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=change_dict,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.TARGET_ID,
            target_version_at_submission=0,
            language_code='bn'
        )
        suggestion_1_model.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            suggestion_1_model])
        unmigrated_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get(suggestion_1_model.id)
        )
        self.assertEqual(
            unmigrated_suggestion_model.change_cmd['new_value']['content_id'],
            'default_outcome_1'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SUGGESTION PROCESSED SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='SUGGESTION MIGRATED SUCCESS: 1'
            )
        ])

        migrated_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get(suggestion_1_model.id)
        )
        self.assertEqual(
            migrated_suggestion_model.change_cmd['new_value']['content_id'],
            'feedback_1'
        )


class MigrateQuestionSuggestionsJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase):

    JOB_CLASS = suggestion_migration_jobs.MigrateQuestionSuggestionsJob

    AUTHOR_EMAIL: Final = 'author@example.com'

    def setUp(self):
        super(MigrateQuestionSuggestionsJobTests, self).setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_migrated_question_is_not_migrated(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        state = self._create_valid_question_data(None, content_id_generator)
        suggestion_change: Dict[
            str, Union[str, float, question_domain.QuestionDict]
        ] = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'id': 'test_id',
                'version': 12,
                'question_state_data': state.to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['skill_1'],
                'inapplicable_skill_misconception_ids': ['skillid12345-1'],
                'next_content_id_index': (
                    content_id_generator.next_content_id_index)
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        suggestion_services.create_suggestion(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            self.author_id, suggestion_change, 'test description')

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='ALREADY MIGRATED SUCCESS: 1')
        ])

    def test_unmigrated_question_suggestion_is_migrated(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        self.save_new_question_suggestion_with_state_data_schema_v27(
            self.author_id, skill_id)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SUGGESTION MIGRATED SUCCESS: 1')
        ])
