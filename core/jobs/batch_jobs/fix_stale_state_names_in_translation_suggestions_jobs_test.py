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

"""Unit tests for jobs.batch_jobs.
fix_stale_state_names_in_translation_suggestions_jobs.
"""

from __future__ import annotations

import datetime

from core import feconf
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import (
    fix_stale_state_names_in_translation_suggestions_jobs,
)
from core.jobs.types import job_run_result
from core.platform import models

from typing import Dict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, suggestion_models

(exp_models, suggestion_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.SUGGESTION]
)

EXP_ID = 'exp1'

# After migration to the latest states schema, the content ID of the content
# of this state is 'content_0'.
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
                'html': 'Default outcome',
            },
            'dest': 'Introduction',
            'dest_if_really_stuck': None,
            'refresher_exploration_id': None,
            'missing_prerequisite_skill_id': None,
            'labelled_as_correct': False,
        },
        'customization_args': {
            'rows': {'value': 1},
            'placeholder': {
                'value': {'unicode_str': '', 'content_id': 'ca_placeholder_1'}
            },
        },
        'confirmed_unclassified_answers': [],
        'id': 'TextInput',
        'hints': [],
    },
    'linked_skill_id': None,
    'recorded_voiceovers': {
        'voiceovers_mapping': {
            'content': {},
            'default_outcome': {},
            'ca_placeholder_1': {},
        }
    },
    'written_translations': {
        'translations_mapping': {
            'content': {},
            'default_outcome': {},
            'ca_placeholder_1': {},
        }
    },
    'classifier_model_id': None,
    'card_is_checkpoint': False,
    'solicit_answer_details': False,
    'next_content_id_index': 2,
}

LAST_UPDATED = datetime.datetime(2026, 9, 1)


class FixStaleStateNamesJobTestBase(job_test_utils.JobTestBase):
    """Base class with helpers for the tests of the jobs in
    fix_stale_state_names_in_translation_suggestions_jobs.
    """

    def setUp(self) -> None:
        super().setUp()
        exploration_model = self.create_model(
            exp_models.ExplorationModel,
            id=EXP_ID,
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
        self.put_multi([exploration_model])

    def _put_translation_suggestion(
        self,
        suggestion_id: str,
        state_name: str,
        content_id: str,
        target_id: str = EXP_ID,
        target_type: str = feconf.ENTITY_TYPE_EXPLORATION,
    ) -> None:
        """Puts an in-review translation suggestion into the datastore.

        Args:
            suggestion_id: str. The ID of the suggestion.
            state_name: str. The state name in the change_cmd.
            content_id: str. The content ID in the change_cmd.
            target_id: str. The ID of the target entity.
            target_type: str. The type of the target entity.
        """
        change_cmd: Dict[str, str] = {
            'cmd': 'add_written_translation',
            'state_name': state_name,
            'content_id': content_id,
            'language_code': 'hi',
            'content_html': '',
            'translation_html': '<p>Translation</p>',
            'data_format': 'html',
        }
        suggestion_model = self.create_model(
            suggestion_models.GeneralSuggestionModel,
            id=suggestion_id,
            suggestion_type=feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT,
            author_id='user1',
            change_cmd=change_cmd,
            score_category='translation.Algebra',
            status=suggestion_models.STATUS_IN_REVIEW,
            target_type=target_type,
            target_id=target_id,
            target_version_at_submission=1,
            language_code='hi',
            last_updated=LAST_UPDATED,
        )
        suggestion_model.update_timestamps(update_last_updated_time=False)
        suggestion_models.GeneralSuggestionModel.put_multi([suggestion_model])

    def _get_state_name(self, suggestion_id: str) -> str:
        """Returns the state name of the suggestion in the datastore.

        Args:
            suggestion_id: str. The ID of the suggestion.

        Returns:
            str. The state name in the change_cmd of the suggestion.
        """
        state_name = suggestion_models.GeneralSuggestionModel.get(
            suggestion_id
        ).change_cmd['state_name']
        assert isinstance(state_name, str)
        return state_name


class AuditStaleStateNamesInTranslationSuggestionsJobTests(
    FixStaleStateNamesJobTestBase
):

    JOB_CLASS = (
        fix_stale_state_names_in_translation_suggestions_jobs.AuditStaleStateNamesInTranslationSuggestionsJob
    )

    def test_empty_datastore_returns_empty_report(self) -> None:
        self.assert_job_output_is_empty()

    def test_valid_and_ignored_suggestions_are_not_reported(self) -> None:
        # Valid state name.
        self._put_translation_suggestion(
            'suggestion1', feconf.DEFAULT_INIT_STATE_NAME, 'content_0'
        )
        # Exploration metadata suggestion.
        self._put_translation_suggestion(
            'suggestion2',
            constants.DEFAULT_SUGGESTION_STATE_NAME,
            'exploration_title',
        )
        # Suggestion for an exploration that does not exist.
        self._put_translation_suggestion(
            'suggestion3', 'Old state name', 'content_0', target_id='exp2'
        )
        # Suggestion for a skill.
        self._put_translation_suggestion(
            'suggestion4',
            'Old state name',
            'content_0',
            target_id=EXP_ID,
            target_type=feconf.ENTITY_TYPE_SKILL,
        )

        self.assert_job_output_is_empty()

    def test_stale_suggestions_are_reported_but_not_updated(self) -> None:
        self._put_translation_suggestion(
            'suggestion1', 'Old state name', 'content_0'
        )
        self._put_translation_suggestion(
            'suggestion2', 'Old state name', 'deleted_content_id'
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Suggestion suggestion1 (exploration exp1, content_id '
                    'content_0) has stale state name "Old state name", '
                    'current state name is "Introduction".'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Suggestion suggestion2 (exploration exp1, content_id '
                    'deleted_content_id) has stale state name "Old state '
                    'name" and its content no longer exists.'
                ),
                job_run_result.JobRunResult(
                    stdout='STALE STATE NAME SUGGESTIONS COUNT SUCCESS: 2'
                ),
                job_run_result.JobRunResult(
                    stdout='UNRESOLVABLE SUGGESTIONS COUNT SUCCESS: 1'
                ),
            ]
        )

        self.assertEqual(self._get_state_name('suggestion1'), 'Old state name')
        self.assertEqual(self._get_state_name('suggestion2'), 'Old state name')


class FixStaleStateNamesInTranslationSuggestionsJobTests(
    FixStaleStateNamesJobTestBase
):

    JOB_CLASS = (
        fix_stale_state_names_in_translation_suggestions_jobs.FixStaleStateNamesInTranslationSuggestionsJob
    )

    def test_empty_datastore_returns_empty_report(self) -> None:
        self.assert_job_output_is_empty()

    def test_valid_suggestions_are_not_updated(self) -> None:
        self._put_translation_suggestion(
            'suggestion1', feconf.DEFAULT_INIT_STATE_NAME, 'content_0'
        )

        self.assert_job_output_is_empty()

        self.assertEqual(
            self._get_state_name('suggestion1'), feconf.DEFAULT_INIT_STATE_NAME
        )

    def test_stale_suggestions_are_updated(self) -> None:
        self._put_translation_suggestion(
            'suggestion1', 'Old state name', 'content_0'
        )
        self._put_translation_suggestion(
            'suggestion2', 'Old state name', 'deleted_content_id'
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stdout(
                    'Suggestion suggestion1 (exploration exp1, content_id '
                    'content_0) has stale state name "Old state name", '
                    'current state name is "Introduction".'
                ),
                job_run_result.JobRunResult.as_stdout(
                    'Suggestion suggestion2 (exploration exp1, content_id '
                    'deleted_content_id) has stale state name "Old state '
                    'name" and its content no longer exists.'
                ),
                job_run_result.JobRunResult(
                    stdout='STALE STATE NAME SUGGESTIONS COUNT SUCCESS: 2'
                ),
                job_run_result.JobRunResult(
                    stdout='UNRESOLVABLE SUGGESTIONS COUNT SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='UPDATED SUGGESTIONS COUNT SUCCESS: 1'
                ),
            ]
        )

        # The resolvable suggestion now points to the current state name, and
        # its last_updated time is unchanged.
        updated_suggestion = suggestion_models.GeneralSuggestionModel.get(
            'suggestion1'
        )
        self.assertEqual(
            updated_suggestion.change_cmd['state_name'],
            feconf.DEFAULT_INIT_STATE_NAME,
        )
        self.assertEqual(updated_suggestion.last_updated, LAST_UPDATED)
        self.assertEqual(
            updated_suggestion.status, suggestion_models.STATUS_IN_REVIEW
        )
        # The unresolvable suggestion is left unchanged.
        self.assertEqual(self._get_state_name('suggestion2'), 'Old state name')
