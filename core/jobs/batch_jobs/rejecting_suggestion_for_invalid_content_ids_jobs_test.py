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

"""Unit tests for jobs.batch_jobs.
rejecting_suggestion_for_invalid_content_ids_jobs.
"""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import (
    rejecting_suggestion_for_invalid_content_ids_jobs)
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import suggestion_models

(exp_models, suggestion_models) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.SUGGESTION
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
    '<p><oppia-noninteractive-image alt-with-value="&amp;quot;'
    '&amp;quot;" caption-with-value="&amp;quot;&amp;quot;" '
    'filepath-with-value="&amp;quot;img.svg&amp;quot;">'
    '</oppia-noninteractive-image></p>'
)

CHANGE_DICT = {
    'cmd': 'add_translation',
    'content_id': 'content_0',
    'language_code': 'hi',
    'content_html': 'html',
    'state_name': 'Introduction',
    'translation_html': TRANSLATION_HTML
}


class RejectTranslationSuggestionsWithMissingContentIdJobTests(
    job_test_utils.JobTestBase
):

    JOB_CLASS = (
        rejecting_suggestion_for_invalid_content_ids_jobs
        .RejectTranslationSuggestionsWithMissingContentIdJob
    )
    TARGET_ID = 'exp1'

    def setUp(self) -> None:
        super().setUp()
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
            # The exact schema version isn't too important here; we just
            # conveniently had the test data set up for this version already.
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.put_multi([self.exp_1])

    def test_no_suggestions_returns_empty_report(self) -> None:
        self.assert_job_output_is_empty()

    def test_valid_suggestions_are_not_rejected(self) -> None:
        CHANGE_DICT['content_id'] = 'content_0'
        suggestion = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.TARGET_ID,
            target_version_at_submission=0,
            language_code='bn'
        )
        suggestion.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([suggestion])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED SUGGESTIONS COUNT SUCCESS: 1'
            )
        ])

    def test_obsolete_suggestion_is_rejected(self) -> None:
        CHANGE_DICT['content_id'] = 'non_existent_content_id'
        suggestion = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.TARGET_ID,
            target_version_at_submission=0,
            language_code='bn'
        )
        suggestion.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([suggestion])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED SUGGESTIONS COUNT SUCCESS: 1'
            ),
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


class AuditTranslationSuggestionsWithMissingContentIdJobTests(
    job_test_utils.JobTestBase
):
    JOB_CLASS = (
        rejecting_suggestion_for_invalid_content_ids_jobs
        .AuditTranslationSuggestionsWithMissingContentIdJob
    )
    TARGET_ID = 'exp2'

    def setUp(self) -> None:
        super().setUp()
        self.exp_2 = self.create_model(
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
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.put_multi([self.exp_2])

    def test_no_suggestions_returns_empty_report(self) -> None:
        self.assert_job_output_is_empty()

    def test_obsolete_suggestions_are_reported(self) -> None:
        CHANGE_DICT['content_id'] = 'invalid_id'
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.TARGET_ID,
            target_version_at_submission=0,
            language_code='bn'
        )
        suggestion_model.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            suggestion_model])

        errored_value = (
            '{\'exp_id\': \'exp2\', \'obsolete_content\': '
            '[{\'content_id\': \'invalid_id\', \'state_name\': '
            '\'Introduction\'}]}'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED SUGGESTIONS COUNT SUCCESS: 1'
            ),
            job_run_result.JobRunResult(
                stdout='OBSOLETE SUGGESTIONS COUNT SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                f'Results are - {errored_value}'
            )
        ])

        obsolete_suggestion_model = (
            suggestion_models.GeneralSuggestionModel.get(suggestion_model.id)
        )
        self.assertEqual(
            obsolete_suggestion_model.status,
            suggestion_models.STATUS_IN_REVIEW
        )

    def test_non_obsolete_suggestions_are_not_reported(self) -> None:
        CHANGE_DICT['content_id'] = 'default_outcome_1'
        CHANGE_DICT['translation_html'] = '<p>Translation for content.</p>'
        valid_suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.TARGET_ID,
            target_version_at_submission=0,
            language_code='bn'
        )
        valid_suggestion_model.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            valid_suggestion_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='TOTAL PROCESSED SUGGESTIONS COUNT SUCCESS: 1'
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
