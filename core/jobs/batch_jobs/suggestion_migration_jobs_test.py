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
from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import skill_services
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
    from mypy_imports import exp_models
    from mypy_imports import suggestion_models

(exp_models, suggestion_models) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.SUGGESTION
])


class MigrateSuggestionJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = (
        suggestion_migration_jobs
        .RegenerateContentIdForTranslationSuggestionsInReviewJob
    )
    TARGET_ID = 'exp1'

    def setUp(self) -> None:
        super().setUp()
        self.STATE_DICT_IN_V52 = {
            'content': {'content_id': 'content', 'html': ''},
            'param_changes': [],
            'interaction': {
                'solution': None,
                'answer_groups': [],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': 'Default outcome'
                    },
                    'dest': 'Introduction',
                    'dest_if_really_stuck': None,
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': {
                    'catchMisspellings': {
                        'value': False
                    },
                    'rows': {
                        'value': 1
                    },
                    'placeholder': {
                        'value': {
                            'unicode_str': '',
                            'content_id': 'ca_placeholder_1'
                        }
                    }
                },
                'confirmed_unclassified_answers': [],
                'id': 'TextInput',
                'hints': []
            },
            'linked_skill_id': None,
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'ca_placeholder_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'ca_placeholder_1': {}
                }
            },
            'classifier_model_id': None,
            'card_is_checkpoint': False,
            'solicit_answer_details': False,
            'next_content_id_index': 2
        }
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
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: self.STATE_DICT_IN_V52},
        )
        self.put_multi([self.exp_1])

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_suggestion_is_migrated(self) -> None:
        change_dict = {
            'cmd': 'add_translation',
            'content_id': 'default_outcome',
            'language_code': 'hi',
            'content_html': 'Content',
            'state_name': 'Introduction',
            'translation_html': '<p>Translation for content.</p>'
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
            unmigrated_suggestion_model.change_cmd['content_id'],
            'default_outcome'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SUGGESTION TARGET PROCESSED SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='SUGGESTION MIGRATED SUCCESS: 1'
            )
        ])

        migrated_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get(suggestion_1_model.id)
        )
        self.assertEqual(
            migrated_suggestion_model.change_cmd['content_id'],
            'default_outcome_1'
        )

    def test_unmigrated_invalid_suggestion_raises_error(self) -> None:
        change_dict = {
            'cmd': 'add_translation',
            'content_id': 'default_outcome',
            'language_code': 'hi',
            'content_html': 'Content',
            'state_name': 'invalid_state_name',
            'translation_html': '<p>Translation for content.</p>'
        }

        suggestion_1_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=16,
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

        change_dict = {
            'cmd': 'add_translation',
            'content_id': 'invalid',
            'language_code': 'hi',
            'content_html': 'Content',
            'state_name': 'Introduction',
            'translation_html': '<p>Translation for content.</p>'
        }

        suggestion_2_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=17,
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
        suggestion_2_model.update_timestamps()

        change_dict = {
            'cmd': 'add_translation',
            'content_id': 'default_outcome',
            'language_code': 'hi',
            'content_html': 'Content',
            'state_name': 'Introduction',
            'translation_html': '<p>Translation for content.</p>'
        }

        suggestion_3_model = self.create_model(
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
        suggestion_3_model.update_timestamps()

        suggestion_models.GeneralSuggestionModel.put_multi([
            suggestion_1_model, suggestion_2_model, suggestion_3_model])
        unmigrated_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get(suggestion_1_model.id)
        )
        self.assertEqual(
            unmigrated_suggestion_model.change_cmd['content_id'],
            'default_outcome'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SUGGESTION TARGET PROCESSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='SUGGESTION MIGRATED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stderr=(
                    'SUGGESTION TARGET PROCESSED ERROR: \"(16, '
                    '\'State name invalid_state_name does not exist in the '
                    'exploration\')\": 1')
            ), job_run_result.JobRunResult(
                stderr=(
                    'SUGGESTION TARGET PROCESSED ERROR: '
                    '\"(17, \'Content ID invalid does not exist in the '
                    'exploration\')\": 1')
            ),
        ])

    def test_suggestion_with_invalid_content_id_raise_error(self) -> None:
        change_dict = {
            'cmd': 'add_translation',
            'content_id': 'invalid_id',
            'language_code': 'hi',
            'content_html': 'Content',
            'state_name': 'Introduction',
            'translation_html': '<p>Translation for content.</p>'
        }

        suggestion_1_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id='111',
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

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'SUGGESTION TARGET PROCESSED ERROR: "(\'111\', '
                    '\'Content ID invalid_id does not exist in the exploration'
                    '\')": 1')),
        ])

        unmigrated_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get(suggestion_1_model.id)
        )
        self.assertEqual(
            unmigrated_suggestion_model.change_cmd['content_id'], 'invalid_id')


class AuditMigrateSuggestionJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = (
        suggestion_migration_jobs
        .AuditRegenerateContentIdForTranslationSuggestionsInReviewJob
    )
    TARGET_ID = 'exp1'

    def setUp(self) -> None:
        super().setUp()
        self.STATE_DICT_IN_V52 = {
            'content': {'content_id': 'content', 'html': ''},
            'param_changes': [],
            'interaction': {
                'solution': None,
                'answer_groups': [],
                'default_outcome': {
                    'param_changes': [],
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': 'Default outcome'
                    },
                    'dest': 'Introduction',
                    'dest_if_really_stuck': None,
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'labelled_as_correct': False
                },
                'customization_args': {
                    'catchMisspellings': {
                        'value': False
                    },
                    'rows': {
                        'value': 1
                    },
                    'placeholder': {
                        'value': {
                            'unicode_str': '',
                            'content_id': 'ca_placeholder_1'
                        }
                    }
                },
                'confirmed_unclassified_answers': [],
                'id': 'TextInput',
                'hints': []
            },
            'linked_skill_id': None,
            'recorded_voiceovers': {
                'voiceovers_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'ca_placeholder_1': {}
                }
            },
            'written_translations': {
                'translations_mapping': {
                    'content': {},
                    'default_outcome': {},
                    'ca_placeholder_1': {}
                }
            },
            'classifier_model_id': None,
            'card_is_checkpoint': False,
            'solicit_answer_details': False,
            'next_content_id_index': 2
        }
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
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: self.STATE_DICT_IN_V52},
        )
        self.put_multi([self.exp_1])

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_suggestion_is_not_migrated(self) -> None:
        change_dict = {
            'cmd': 'add_translation',
            'content_id': 'default_outcome',
            'language_code': 'hi',
            'content_html': 'Content',
            'state_name': 'Introduction',
            'translation_html': '<p>Translation for content.</p>'
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
            unmigrated_suggestion_model.change_cmd['content_id'],
            'default_outcome'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SUGGESTION TARGET PROCESSED SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='SUGGESTION MIGRATED SUCCESS: 1'
            )
        ])

        migrated_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get(suggestion_1_model.id)
        )
        self.assertEqual(
            migrated_suggestion_model.change_cmd['content_id'],
            'default_outcome'
        )

    def test_suggestion_with_invalid_content_id_raise_error(self) -> None:
        change_dict = {
            'cmd': 'add_translation',
            'content_id': 'invalid_id',
            'language_code': 'hi',
            'content_html': 'Content',
            'state_name': 'Introduction',
            'translation_html': '<p>Translation for content.</p>'
        }

        suggestion_1_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=15,
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

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stderr=(
                    'SUGGESTION TARGET PROCESSED ERROR: "(15, '
                    '\'Content ID invalid_id does not exist in the exploration'
                    '\')": 1')),
        ])

        unmigrated_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get(suggestion_1_model.id)
        )
        self.assertEqual(
            unmigrated_suggestion_model.change_cmd['content_id'], 'invalid_id')


class MigrateQuestionSuggestionsJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase):

    JOB_CLASS = suggestion_migration_jobs.MigrateQuestionSuggestionsJob

    AUTHOR_EMAIL: Final = 'author@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_migrated_question_is_not_migrated(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        content_id_generator = translation_domain.ContentIdGenerator()
        state = self._create_valid_question_data(
            'default-state', content_id_generator)
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
                stdout='QUESTION MODELS COUNT SUCCESS: 1')
        ])

    def test_unmigrated_question_suggestion_is_migrated(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        suggestion_id = (
            self.save_new_question_suggestion_with_state_data_schema_v27(
                self.author_id, skill_id
            )
        )

        suggestion = suggestion_models.GeneralSuggestionModel.get_by_id(
            suggestion_id)

        self.assertEqual(
            suggestion.change_cmd['question_dict'][
                'question_state_data_schema_version'],
            27
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='QUESTION MODELS COUNT SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='SUGGESTION MIGRATED SUCCESS: 1')
        ])

        suggestion = suggestion_models.GeneralSuggestionModel.get_by_id(
            suggestion_id)

        self.assertEqual(
            suggestion.change_cmd['question_dict'][
                'question_state_data_schema_version'],
            feconf.CURRENT_STATE_SCHEMA_VERSION
        )

    def test_migration_errors_are_reported_in_job_result(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        suggestion_id = (
            self.save_new_question_suggestion_with_state_data_schema_v27(
            self.author_id, skill_id)
        )
        migrate_state_schema_raise = self.swap_to_always_raise(
            question_fetchers, 'migrate_state_schema')
        with migrate_state_schema_raise:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stderr=(
                        'SUGGESTION MIGRATED ERROR: "(\'%s\', '
                        'Exception())": 1' % suggestion_id)
                ),
                job_run_result.JobRunResult(
                    stdout='QUESTION MODELS COUNT SUCCESS: 1'),
            ])


class AuditMigrateQuestionSuggestionsJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase):

    JOB_CLASS = suggestion_migration_jobs.AuditMigrateQuestionSuggestionsJob

    AUTHOR_EMAIL: Final = 'author@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_unmigrated_question_suggestion_is_not_migrated(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        suggestion_id = (
            self.save_new_question_suggestion_with_state_data_schema_v27(
                self.author_id, skill_id
            )
        )
        suggestion = suggestion_models.GeneralSuggestionModel.get_by_id(
            suggestion_id)

        self.assertEqual(
            suggestion.change_cmd['question_dict'][
                'question_state_data_schema_version'],
            27
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='QUESTION MODELS COUNT SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='SUGGESTION MIGRATED SUCCESS: 1')
        ])

        suggestion = suggestion_models.GeneralSuggestionModel.get_by_id(
            suggestion_id)

        self.assertEqual(
            suggestion.change_cmd['question_dict'][
                'question_state_data_schema_version'],
            27
        )

    def test_audit_errors_are_reported_in_job_result(self) -> None:
        skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            skill_id, self.author_id, description='description')
        suggestion_id = (
            self.save_new_question_suggestion_with_state_data_schema_v27(
            self.author_id, skill_id)
        )
        migrate_state_schema_raise = self.swap_to_always_raise(
            question_fetchers, 'migrate_state_schema')
        with migrate_state_schema_raise:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stderr=(
                        'SUGGESTION MIGRATED ERROR: "(\'%s\', '
                        'Exception())": 1' % suggestion_id)
                ),
                job_run_result.JobRunResult(
                    stdout='QUESTION MODELS COUNT SUCCESS: 1'),
            ])
