# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.
reject_invalid_translation_suggestion_and_delete_invalid_translation_jobs.
"""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import (
    reject_invalid_translation_suggestion_and_delete_invalid_translation_jobs)
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import suggestion_models

(
    exp_models,
    suggestion_models,
    translation_models) = models.Registry.import_models([
    models.Names.EXPLORATION,
    models.Names.SUGGESTION,
    models.Names.TRANSLATION
])

STATE_DICT_IN_V52 = {
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

TRANSLATION_HTML = (
    '<p>another translation</p>'
)

TRANSLATED_CONTENT_DICT = {
    'content_value': '<p>translated</p>',
    'content_format': 'html',
    'needs_update': False
}

CHANGE_DICT = {
    'cmd': 'add_translation',
    'content_id': 'content_0',
    'language_code': 'hi',
    'content_html': 'html',
    'state_name': 'Introduction',
    'translation_html': TRANSLATION_HTML
}


class RejectTranslationSuggestionsForTranslatedContentsJobTests(
    job_test_utils.JobTestBase
):

    JOB_CLASS = (
        reject_invalid_translation_suggestion_and_delete_invalid_translation_jobs
        .RejectTranslationSuggestionsForTranslatedContentsJob
    )
    TARGET_ID_1 = 'exp1'
    TARGET_ID_2 = 'exp2'

    def setUp(self) -> None:
        super().setUp()
        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.TARGET_ID_1,
            title='exp 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.TARGET_ID_2,
            title='exp 2',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.put_multi([self.exp_1, self.exp_2])

        self.entity_translation_1 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.TARGET_ID_1,
            self.exp_1.version,
            'hi',
            {'content_0': TRANSLATED_CONTENT_DICT}
        ))
        self.entity_translation_2 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.TARGET_ID_2,
            self.exp_1.version,
            'hi',
            {'content_0': TRANSLATED_CONTENT_DICT}
        ))
        self.put_multi([
            self.entity_translation_1, self.entity_translation_2])

    def test_no_suggestions_returns_empty_report(self) -> None:
        self.assert_job_output_is_empty()

    def test_obsolete_suggestion_is_rejected(self) -> None:
        CHANGE_DICT['content_id'] = 'content_0'
        suggestion = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.TARGET_ID_1,
            target_version_at_submission=0,
            language_code='hi'
        )
        suggestion.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([suggestion])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='REJECTED SUGGESTIONS COUNT SUCCESS: 1'
            )
        ])

        updated_suggestion = suggestion_models.GeneralSuggestionModel.get(
            suggestion.id)
        self.assertEqual(
            updated_suggestion.status,
            suggestion_models.STATUS_REJECTED
        )


class AuditTranslationSuggestionsForTranslatedContentsJobTests(
    job_test_utils.JobTestBase
):
    JOB_CLASS = (
        reject_invalid_translation_suggestion_and_delete_invalid_translation_jobs
        .AuditTranslationSuggestionsForTranslatedContentsJob
    )
    TARGET_ID_1 = 'exp1'
    TARGET_ID_2 = 'exp2'

    def setUp(self) -> None:
        super().setUp()
        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.TARGET_ID_1,
            title='exp 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.exp_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.TARGET_ID_2,
            title='exp 2',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.put_multi([self.exp_1, self.exp_2])

        self.entity_translation_1 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.TARGET_ID_1,
            self.exp_1.version,
            'hi',
            {'default_outcome_1': TRANSLATED_CONTENT_DICT}
        ))
        self.entity_translation_2 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.TARGET_ID_2,
            self.exp_1.version,
            'hi',
            {'default_outcome_1': TRANSLATED_CONTENT_DICT}
        ))
        self.put_multi([
            self.entity_translation_1, self.entity_translation_2])

    def test_no_suggestions_returns_empty_report(self) -> None:
        self.assert_job_output_is_empty()

    def test_non_obsolete_suggestions_are_not_reported(self) -> None:
        CHANGE_DICT['content_id'] = 'default_outcome_1'
        valid_suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.TARGET_ID_1,
            target_version_at_submission=0,
            language_code='hi'
        )
        valid_suggestion_model.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            valid_suggestion_model])

        errored_value = (
            '{\'entity_id\': \'exp1\', \'entity_version\': 0, '
            '\'entity_translation_model_id\': '
            f'\'{self.entity_translation_1.id}\', '
            '\'content_id\': \'default_outcome_1\', \'suggestion\': '
            f'{valid_suggestion_model.id}'
            '}'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                f'Results are - {errored_value}'
            ),
            job_run_result.JobRunResult(
                stdout='SUGGESTIONS TO BE REJECTED COUNT SUCCESS: 1'
            )
        ])

        suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get(
                valid_suggestion_model.id)
        )
        self.assertEqual(
            suggestion_model.status,
            suggestion_models.STATUS_IN_REVIEW
        )


class DeleteTranslationsForInvalidContentIDsJobTests(
    job_test_utils.JobTestBase
):

    JOB_CLASS = (
        reject_invalid_translation_suggestion_and_delete_invalid_translation_jobs
        .DeleteTranslationsForInvalidContentIDsJob
    )
    TARGET_ID_1 = 'exp1'

    def setUp(self) -> None:
        super().setUp()
        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.TARGET_ID_1,
            title='exp 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.put_multi([self.exp_1])

        self.entity_translation_1 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.TARGET_ID_1,
            self.exp_1.version,
            'hi',
            {'content_0': TRANSLATED_CONTENT_DICT}
        ))
        self.put_multi([self.entity_translation_1])

    def test_no_invalid_translation_returns_empty_report(self) -> None:
        self.assert_job_output_is_empty()

    def test_translations_with_invalid_content_id_is_deleted(self) -> None:
        self.entity_translation_1.translations[
            'invalid_content'] = TRANSLATED_CONTENT_DICT
        self.put_multi([self.entity_translation_1])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='UPDATED ENTITY TRANSLATION MODELS COUNT SUCCESS: 1'
            )
        ])

        updated_model = translation_models.EntityTranslationsModel.get(
            self.entity_translation_1.id)
        self.assertNotIn(
            'invalid_content',
            updated_model.translations.keys()
        )


class AuditTranslationsForInvalidContentIDsJobTests(
    job_test_utils.JobTestBase
):
    JOB_CLASS = (
        reject_invalid_translation_suggestion_and_delete_invalid_translation_jobs
        .AuditTranslationsForInvalidContentIDsJob
    )
    TARGET_ID_1 = 'exp1'

    def setUp(self) -> None:
        super().setUp()
        self.exp_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.TARGET_ID_1,
            title='exp 1',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category=feconf.DEFAULT_EXPLORATION_CATEGORY,
            objective=feconf.DEFAULT_EXPLORATION_OBJECTIVE,
            language_code='en',
            tags=['Topic'],
            blurb='blurb',
            author_notes='author notes',
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.put_multi([self.exp_1])

        self.entity_translation_1 = (
            translation_models.EntityTranslationsModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            self.TARGET_ID_1,
            self.exp_1.version,
            'hi',
            {'default_outcome_1': TRANSLATED_CONTENT_DICT}
        ))
        self.put_multi([self.entity_translation_1])

    def test_no_invalid_translation_returns_empty_report(self) -> None:
        self.assert_job_output_is_empty()

    def test_translations_with_invalid_content_id_is_deleted(self) -> None:
        self.entity_translation_1.translations[
            'invalid_content'] = TRANSLATED_CONTENT_DICT
        self.put_multi([self.entity_translation_1])

        errored_value = (
            '{\'entity_id\': \'exp1\', \'entity_version\': 0, '
            '\'entity_translation_model_id\': '
            f'\'{self.entity_translation_1.id}\', '
            '\'content_id\': \'invalid_content\'}'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult.as_stdout(
                f'Results are - {errored_value}'
            ),
            job_run_result.JobRunResult(
                stdout='TRANSLATIONS TO BE DELETED COUNT SUCCESS: 1'
            )
        ])

        updated_model = translation_models.EntityTranslationsModel.get(
            self.entity_translation_1.id)
        self.assertIn(
            'invalid_content',
            updated_model.translations.keys()
        )
