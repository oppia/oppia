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

ERRORED_TRANSLATION_VALUE = (
    '<p><oppia-noninteractive-image filepath-with-value='
    '"&amp;quot;img.svg&amp;quot;"></oppia-noninteractive-image>'
    '</p>'
)

CHANGE_DICT = {
    'cmd': 'add_translation',
    'content_id': 'invalid_content_id',
    'language_code': 'hi',
    'content_html': 'Content',
    'state_name': 'Introduction',
    'translation_html': ERRORED_TRANSLATION_VALUE
}

CHANGE_DICT_WITH_LIST_TRANSLATION = {
    'cmd': 'add_translation',
    'content_id': 'invalid_content_id',
    'language_code': 'hi',
    'content_html': 'Content',
    'state_name': 'Introduction',
    'translation_html': [ERRORED_TRANSLATION_VALUE, '']
}


class RejectSuggestionWithMissingContentIdMigrationJobTests(
    job_test_utils.JobTestBase
):

    JOB_CLASS = (
        rejecting_suggestion_for_invalid_content_ids_jobs
        .RejectSuggestionWithMissingContentIdMigrationJob
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
            states_schema_version=52,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=feconf.DEFAULT_AUTO_TTS_ENABLED,
            correctness_feedback_enabled=False,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.put_multi([self.exp_1])

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_invalid_suggestion_is_migrated(self) -> None:
        CHANGE_DICT['translation_html'] = ERRORED_TRANSLATION_VALUE
        CHANGE_DICT['content_id'] = 'invalid_content_id'
        suggestion_1_invalid_model = self.create_model(
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
        suggestion_1_invalid_model.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            suggestion_1_invalid_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SUGGESTION ITERATED SUCCESS: 1'
            )
        ])

        migrated_suggestion_invalid_model = (
            suggestion_models.GeneralSuggestionModel.get(
                suggestion_1_invalid_model.id)
        )
        self.assertEqual(
            migrated_suggestion_invalid_model.status,
            suggestion_models.STATUS_REJECTED
        )
        self.assertEqual(
            migrated_suggestion_invalid_model.change_cmd['translation_html'], (
                '<p><oppia-noninteractive-image alt-with-value="&amp;quot;'
                '&amp;quot;" caption-with-value="&amp;quot;&amp;quot;" '
                'filepath-with-value="&amp;quot;img.svg&amp;quot;">'
                '</oppia-noninteractive-image></p>'
            )
        )

    def test_valid_suggestion_is_unchanged(self) -> None:
        CHANGE_DICT['content_id'] = 'default_outcome'
        CHANGE_DICT['translation_html'] = '<p>Translation for content.</p>'
        suggestion_2_valid_model = self.create_model(
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
        suggestion_2_valid_model.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            suggestion_2_valid_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SUGGESTION ITERATED SUCCESS: 1'
            )
        ])

        migrated_suggestion_2_model = (
            suggestion_models.GeneralSuggestionModel.get(
                suggestion_2_valid_model.id)
        )
        self.assertEqual(
            migrated_suggestion_2_model.status,
            suggestion_models.STATUS_IN_REVIEW
        )
        self.assertEqual(
            migrated_suggestion_2_model.change_cmd['translation_html'],
            '<p>Translation for content.</p>')

    def test_invalid_suggestion_with_list_translation_is_migrated(self) -> None:
        CHANGE_DICT_WITH_LIST_TRANSLATION['translation_html'] = [
            ERRORED_TRANSLATION_VALUE, '']
        CHANGE_DICT_WITH_LIST_TRANSLATION['content_id'] = 'invalid_content_id'
        suggestion_3_invalid_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT_WITH_LIST_TRANSLATION,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.TARGET_ID,
            target_version_at_submission=0,
            language_code='bn'
        )
        suggestion_3_invalid_model.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            suggestion_3_invalid_model])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='SUGGESTION ITERATED SUCCESS: 1'
            )
        ])

        migrated_suggestion_invalid_model = (
            suggestion_models.GeneralSuggestionModel.get(
                suggestion_3_invalid_model.id)
        )
        self.assertEqual(
            migrated_suggestion_invalid_model.status,
            suggestion_models.STATUS_REJECTED
        )
        self.assertEqual(
            migrated_suggestion_invalid_model.change_cmd['translation_html'], [
                '<p><oppia-noninteractive-image alt-with-value="&amp;quot;'
                '&amp;quot;" caption-with-value="&amp;quot;&amp;quot;" '
                'filepath-with-value="&amp;quot;img.svg&amp;quot;">'
                '</oppia-noninteractive-image></p>'
            ]
        )


class AuditRejectSuggestionWithMissingContentIdMigrationJobTests(
    job_test_utils.JobTestBase
):

    JOB_CLASS = (
        rejecting_suggestion_for_invalid_content_ids_jobs
        .AuditRejectSuggestionWithMissingContentIdMigrationJob
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
            correctness_feedback_enabled=False,
            states={feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V52},
        )
        self.put_multi([self.exp_2])

    def test_empty_storage_fo_audit(self) -> None:
        self.assert_job_output_is_empty()

    def test_invalid_suggestion_is_reported_with_expected_data(self) -> None:
        CHANGE_DICT['content_id'] = 'invalid_id'
        CHANGE_DICT['translation_html'] = ERRORED_TRANSLATION_VALUE
        suggestion_1_model = self.create_model(
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
        suggestion_1_model.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            suggestion_1_model])

        errored_value = (
            '{\'exp_id\': \'exp2\', \'missing_content_ids\': '
            '[{\'content_id\': \'invalid_id\', \'state_name\': '
            '\'Introduction\'}], \'content_translation\': '
            '[{\'content_before\': \'<p><oppia-noninteractive-image '
            'filepath-with-value=\"&amp;quot;img.svg&amp;quot;\">'
            '</oppia-noninteractive-image></p>\', \'content_after\': \'<p>'
            '<oppia-noninteractive-image alt-with-value=\"&amp;quot;&amp;'
            'quot;\" caption-with-value=\"&amp;quot;&amp;quot;\" '
            'filepath-with-value=\"&amp;quot;img.svg&amp;quot;\">'
            '</oppia-noninteractive-image></p>\'}]}'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='GROUP OF SUGGESTION PER EXP SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                f'Results are - {errored_value}'
            )
        ])

        migrated_suggestion_1_model = (
            suggestion_models.GeneralSuggestionModel.get(suggestion_1_model.id)
        )
        self.assertEqual(
            migrated_suggestion_1_model.status,
            suggestion_models.STATUS_IN_REVIEW
        )
        self.assertEqual(
            migrated_suggestion_1_model.change_cmd['translation_html'],
            ERRORED_TRANSLATION_VALUE)

    def test_valid_suggestion_is_reported_with_expected_data(self) -> None:
        CHANGE_DICT['content_id'] = 'default_outcome'
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

        errored_value = (
            '{\'exp_id\': \'exp2\', \'missing_content_ids\': [], '
            '\'content_translation\': [{\'content_before\': \'<p>'
            'Translation for content.</p>\', \'content_after\': '
            '\'<p>Translation for content.</p>\'}]}'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='GROUP OF SUGGESTION PER EXP SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                f'Results are - {errored_value}'
            )
        ])

        migrated_suggestion_2_model = (
            suggestion_models.GeneralSuggestionModel.get(
                valid_suggestion_model.id)
        )
        self.assertEqual(
            migrated_suggestion_2_model.status,
            suggestion_models.STATUS_IN_REVIEW
        )
        self.assertEqual(
            migrated_suggestion_2_model.change_cmd['translation_html'],
            '<p>Translation for content.</p>')

    def test_invalid_suggestion_list_type_is_reported_with_expected_data(
        self
    ) -> None:
        CHANGE_DICT_WITH_LIST_TRANSLATION['content_id'] = 'invalid_id'
        CHANGE_DICT_WITH_LIST_TRANSLATION[
            'translation_html'] = [ERRORED_TRANSLATION_VALUE, '']
        suggestion_3_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=CHANGE_DICT_WITH_LIST_TRANSLATION,
            score_category='irrelevant',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type='exploration',
            target_id=self.TARGET_ID,
            target_version_at_submission=0,
            language_code='bn'
        )
        suggestion_3_model.update_timestamps()
        suggestion_models.GeneralSuggestionModel.put_multi([
            suggestion_3_model])

        errored_value = (
            '{\'exp_id\': \'exp2\', \'missing_content_ids\': '
            '[{\'content_id\': \'invalid_id\', \'state_name\': '
            '\'Introduction\'}], \'content_translation\': '
            '[{\'content_before\': [\'<p><oppia-noninteractive-image '
            'filepath-with-value=\"&amp;quot;img.svg&amp;quot;\">'
            '</oppia-noninteractive-image></p>\', \'\'], \'content_after\': '
            '[\'<p><oppia-noninteractive-image alt-with-value=\"&amp;quot;&amp;'
            'quot;\" caption-with-value=\"&amp;quot;&amp;quot;\" '
            'filepath-with-value=\"&amp;quot;img.svg&amp;quot;\">'
            '</oppia-noninteractive-image></p>\']}]}'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='GROUP OF SUGGESTION PER EXP SUCCESS: 1'
            ),
            job_run_result.JobRunResult.as_stdout(
                f'Results are - {errored_value}'
            )
        ])

        migrated_suggestion_3_model = (
            suggestion_models.GeneralSuggestionModel.get(suggestion_3_model.id)
        )
        self.assertEqual(
            migrated_suggestion_3_model.status,
            suggestion_models.STATUS_IN_REVIEW
        )
        self.assertEqual(
            migrated_suggestion_3_model.change_cmd['translation_html'],
            [ERRORED_TRANSLATION_VALUE, ''])
