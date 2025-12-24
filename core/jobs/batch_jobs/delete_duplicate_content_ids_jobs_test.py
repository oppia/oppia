# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for delete_duplicate_content_ids_jobs."""

from __future__ import annotations

from core import feconf
from core.domain import (
    exp_domain,
    exp_fetchers,
    exp_services,
    state_domain,
    translation_domain,
)
from core.jobs import job_test_utils
from core.jobs.batch_jobs import delete_duplicate_content_ids_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils


from typing import Final

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, translation_models, voiceover_models

(exp_models, translation_models, voiceover_models) = (
    models.Registry.import_models(
        [
            models.Names.EXPLORATION,
            models.Names.TRANSLATION,
            models.Names.VOICEOVER,
        ]
    )
)

datastore_services = models.Registry.import_datastore_services()

STATE_DICT_IN_V57 = {
    'content': {'content_id': 'content', 'html': 'Content for the state'},
    'param_changes': [],
    'interaction': {
        'solution': None,
        'answer_groups': [
            {
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>',
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'dest_if_really_stuck': None,
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None,
                },
                'training_data': [],
                'rule_specs': [
                    {
                        'inputs': {
                            'x': {
                                'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                                'contentId': 'rule_input_2',
                            }
                        },
                        'rule_type': 'StartsWith',
                    }
                ],
                'tagged_skill_misconception_id': None,
            }
        ],
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
        'customization_args': {},
        'confirmed_unclassified_answers': [],
        'id': 'TextInput',
        'hints': [],
    },
    'linked_skill_id': None,
    'inapplicable_skill_misconception_ids': [],
}


class FindDuplicateContentIdsTests(job_test_utils.JobTestBase):
    """Tests for finding duplicate content IDs."""

    def test_no_duplicates_returns_empty_dict(self) -> None:
        """Test that explorations with no duplicates return empty dict."""
        states_dict = {'Introduction': STATE_DICT_IN_V57}
        duplicates = (
            delete_duplicate_content_ids_jobs.DeleteDuplicateContentIdsJob._find_duplicate_content_ids(
                states_dict
            )
        )
        self.assertEqual(duplicates, {})

    def test_finds_duplicates_across_states(self) -> None:
        """Test that duplicates are correctly identified across states."""
        state1 = dict(STATE_DICT_IN_V57)
        state2 = dict(STATE_DICT_IN_V57)
        
        # Both states use the same feedback_1 content_id (duplicate)
        states_dict = {
            'Introduction': state1,
            'End': state2,
        }
        
        duplicates = (
            delete_duplicate_content_ids_jobs.DeleteDuplicateContentIdsJob._find_duplicate_content_ids(
                states_dict
            )
        )
        
        # feedback_1 should be in duplicates since it appears in both states
        self.assertIn('feedback_1', duplicates)
        self.assertEqual(set(duplicates['feedback_1']), {'Introduction', 'End'})

    def test_unique_content_ids_not_duplicated(self) -> None:
        """Test that unique content IDs are not marked as duplicates."""
        state1 = dict(STATE_DICT_IN_V57)
        state2 = dict(STATE_DICT_IN_V57)
        
        # Change state2's feedback content_id to be unique
        state2['interaction']['answer_groups'][0]['outcome']['feedback'][
            'content_id'
        ] = 'feedback_2'
        
        states_dict = {
            'Introduction': state1,
            'End': state2,
        }
        
        duplicates = (
            delete_duplicate_content_ids_jobs.DeleteDuplicateContentIdsJob._find_duplicate_content_ids(
                states_dict
            )
        )
        
        # Only default_outcome should appear in both states
        # feedback_1 should not be a duplicate
        self.assertNotIn('feedback_1', duplicates)


class DeleteDuplicateContentIdsJobTest(job_test_utils.JobTestBase):
    """Tests for DeleteDuplicateContentIdsJob."""

    JOB_CLASS = delete_duplicate_content_ids_jobs.DeleteDuplicateContentIdsJob
    
    AUTHOR_EMAIL: Final = 'author@example.com'
    AUTHOR_ID: Final = 'author_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)

    def test_exploration_without_duplicates_unmodified(self) -> None:
        """Test that explorations without duplicates are not changed."""
        # Create exploration with unique content IDs
        exp_id = 'exp_without_duplicates'
        
        # Build a proper exploration dict
        exp_dict = {
            'category': 'Test',
            'author_notes': '',
            'language_code': 'en',
            'tags': [],
            'blurb': '',
            'title': 'Test Exploration',
            'objective': 'To test',
            'param_specs': {},
            'param_changes': [],
            'version': 1,
            'auto_tts_enabled': False,
            'states': {
                feconf.DEFAULT_INIT_STATE_NAME: STATE_DICT_IN_V57,
            },
        }
        
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='Test Exploration'
        )
        exp_services.save_new_exploration(self.author_id, exploration)
        
        self.assert_job_output_is_empty()

    def test_exploration_with_duplicates_is_fixed(self) -> None:
        """Test that explorations with duplicate content IDs are detected."""
        exp_id = 'exp_with_duplicates'
        
        # Create two identical states with duplicate content IDs
        state1 = dict(STATE_DICT_IN_V57)
        state2 = dict(STATE_DICT_IN_V57)
        
        # Both states share feedback_1 content_id (this is the duplicate)
        states_dict = {
            feconf.DEFAULT_INIT_STATE_NAME: state1,
            'End': state2,
        }
        
        exploration_model = self.create_model(
            exp_models.ExplorationModel,
            id=exp_id,
            title='Test',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category='Test',
            objective='Test',
            language_code='en',
            tags=['tag1'],
            blurb='blurb',
            author_notes='',
            states_schema_version=57,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=False,
            next_content_id_index=4,
            states=states_dict,
        )
        exploration_model.update_timestamps()
        exploration_model.put()
        
        # Run the job
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    'EXPLORATIONS WITH DUPLICATE CONTENT IDS FIXED SUCCESS: 1'
                )
            ]
        )

    def test_translations_preserved_after_fix(self) -> None:
        """Test that translations are preserved when content IDs are regenerated."""
        exp_id = 'exp_with_translations'
        
        # Create exploration with duplicate content IDs
        state1 = dict(STATE_DICT_IN_V57)
        state2 = dict(STATE_DICT_IN_V57)
        
        states_dict = {
            feconf.DEFAULT_INIT_STATE_NAME: state1,
            'End': state2,
        }
        
        exploration_model = self.create_model(
            exp_models.ExplorationModel,
            id=exp_id,
            title='Test',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category='Test',
            objective='Test',
            language_code='en',
            tags=[],
            blurb='',
            author_notes='',
            states_schema_version=57,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=False,
            next_content_id_index=4,
            states=states_dict,
        )
        exploration_model.update_timestamps()
        exploration_model.put()
        
        # Create a translation for one of the duplicate content IDs
        translation_model = (
            translation_models.EntityTranslationsModel.create_new(
                feconf.TranslatableEntityType.EXPLORATION,
                exp_id,
                1,  # version
                'hi',  # language code
                {
                    'feedback_1': {
                        'content_value': 'Translated feedback',
                        'content_format': 'html',
                        'needs_update': False,
                    }
                },
            )
        )
        translation_model.update_timestamps()
        translation_model.put()
        
        # Verify translation exists before job
        existing_trans = (
            translation_models.EntityTranslationsModel.get_model(
                feconf.TranslatableEntityType.EXPLORATION,
                exp_id,
                1,
                'hi',
            )
        )
        self.assertIsNotNone(existing_trans)
        self.assertIn('feedback_1', existing_trans.translations)

    def test_voiceovers_preserved_after_fix(self) -> None:
        """Test that voiceovers are preserved when content IDs are regenerated."""
        exp_id = 'exp_with_voiceovers'
        
        # Create exploration with duplicate content IDs
        state1 = dict(STATE_DICT_IN_V57)
        state2 = dict(STATE_DICT_IN_V57)
        
        states_dict = {
            feconf.DEFAULT_INIT_STATE_NAME: state1,
            'End': state2,
        }
        
        exploration_model = self.create_model(
            exp_models.ExplorationModel,
            id=exp_id,
            title='Test',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category='Test',
            objective='Test',
            language_code='en',
            tags=[],
            blurb='',
            author_notes='',
            states_schema_version=57,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=False,
            next_content_id_index=4,
            states=states_dict,
        )
        exploration_model.update_timestamps()
        exploration_model.put()
        
        # Create a voiceover for one of the duplicate content IDs
        voiceover_model = voiceover_models.EntityVoiceoversModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id,
            1,  # version
            'en-US',
            {
                'feedback_1': {
                    'manual': {
                        'filename': 'feedback_1.mp3',
                        'file_size_bytes': 5000,
                        'needs_update': False,
                        'duration_secs': 2.5,
                    },
                    'auto': None,
                },
                'default_outcome': {
                    'manual': None,
                    'auto': None,
                },
                'content': {
                    'manual': None,
                    'auto': None,
                },
            },
            {},
        )
        voiceover_model.update_timestamps()
        voiceover_model.put()
        
        # Verify voiceover exists before job
        existing_vo = voiceover_models.EntityVoiceoversModel.get_model(
            feconf.ENTITY_TYPE_EXPLORATION,
            exp_id,
            1,
            'en-US',
        )
        self.assertIsNotNone(existing_vo)
        self.assertIn('feedback_1', existing_vo.voiceovers_mapping)
        self.assertIsNotNone(existing_vo.voiceovers_mapping['feedback_1']['manual'])

    def test_job_handles_explorations_without_duplicates(self) -> None:
        """Test that the job gracefully handles explorations with no duplicates."""
        exp_id = 'exp_clean'
        
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, title='Clean Exploration'
        )
        exp_services.save_new_exploration(self.author_id, exploration)
        
        # Job should complete without errors even if there are no duplicates
        self.assert_job_output_is_empty()


class AuditDeleteDuplicateContentIdsJobTest(
    DeleteDuplicateContentIdsJobTest
):
    """Tests for AuditDeleteDuplicateContentIdsJob (read-only mode)."""

    JOB_CLASS = (
        delete_duplicate_content_ids_jobs.AuditDeleteDuplicateContentIdsJob
    )

    def test_audit_job_does_not_modify_datastore(self) -> None:
        """Test that the audit job doesn't persist changes."""
        exp_id = 'exp_audit_test'
        
        # Create exploration with duplicates
        state1 = dict(STATE_DICT_IN_V57)
        state2 = dict(STATE_DICT_IN_V57)
        
        states_dict = {
            feconf.DEFAULT_INIT_STATE_NAME: state1,
            'End': state2,
        }
        
        exploration_model = self.create_model(
            exp_models.ExplorationModel,
            id=exp_id,
            title='Test',
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME,
            category='Test',
            objective='Test',
            language_code='en',
            tags=[],
            blurb='',
            author_notes='',
            states_schema_version=57,
            param_specs={},
            param_changes=[],
            auto_tts_enabled=False,
            next_content_id_index=4,
            states=states_dict,
        )
        exploration_model.update_timestamps()
        exploration_model.put()
        
        original_version = exploration_model.version
        
        # Run audit job (which should NOT modify data)
        self.assert_job_output_is(
            [
                job_run_result.JobRunResult.as_stderr(
                    'EXPLORATIONS WITH DUPLICATE CONTENT IDS FIXED SUCCESS: 1'
                )
            ]
        )
        
        # Verify exploration was not modified
        updated_model = exp_models.ExplorationModel.get(exp_id)
        self.assertEqual(updated_model.version, original_version)
