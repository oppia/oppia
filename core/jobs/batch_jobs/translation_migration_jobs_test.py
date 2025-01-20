# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for translation migration jobs."""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain
from core.domain import rights_manager
from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import translation_migration_jobs
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

from typing import Final, Sequence

MYPY = False
if MYPY:
    from mypy_imports import exp_models
    from mypy_imports import translation_models

(exp_models, translation_models) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.TRANSLATION
])

STATE_DICT_IN_V52 = {
    'content': {
        'content_id': 'content',
        'html': 'Content for the state'
    },
    'param_changes': [],
    'interaction': {
        'solution': None,
        'answer_groups': [{
            'outcome': {
                'feedback': {
                    'content_id': 'feedback_1',
                    'html': '<p>Feedback</p>'
                },
                'missing_prerequisite_skill_id': None,
                'dest': 'End',
                'dest_if_really_stuck': None,
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None
            },
            'training_data': [],
            'rule_specs': [{
                'inputs': {
                    'x': {
                        'normalizedStrSet': [
                            'Hello',
                            'Hola',
                            'Hi'],
                        'contentId': 'rule_input_2'
                    }
                },
                'rule_type': 'StartsWith'
            }],
            'tagged_skill_misconception_id': None
        }],
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
                    'unicode_str': 'Placeholder for the text...',
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
            'ca_placeholder_1': {},
            'feedback_1': {},
            'rule_input_2': {}
        }
    },
    'written_translations': {
        'translations_mapping': {
            'content': {
                'hi': {
                    'data_format': 'html',
                    'translation': 'Translated content in Hindi',
                    'needs_update': False
                },
                'bn': {
                    'data_format': 'html',
                    'translation': 'Translated content in Bangla',
                    'needs_update': False
                }
            },
            'default_outcome': {
                'hi': {
                    'data_format': 'html',
                    'translation': 'Translated outcome in Hindi',
                    'needs_update': False
                },
                'bn': {
                    'data_format': 'html',
                    'translation': 'Translated outcome in Bangla',
                    'needs_update': False
                }
            },
            'ca_placeholder_1': {
                'hi': {
                    'data_format': 'unicode',
                    'translation': 'Translated placeholder in Hindi',
                    'needs_update': False
                },
                'bn': {
                    'data_format': 'unicode',
                    'translation': 'Translated placeholder in Bangla',
                    'needs_update': False
                }
            },
            'feedback_1': {
                'hi': {
                    'data_format': 'html',
                    'translation': 'Translated feedback in Hindi',
                    'needs_update': False
                },
                'bn': {
                    'data_format': 'html',
                    'translation': 'Translated feedback in Bangla',
                    'needs_update': False
                }
            },
            'rule_input_2': {
                'hi': {
                    'data_format': 'set_of_normalized_string',
                    'translation': ['test1', 'test2', 'test3'],
                    'needs_update': False
                },
                'bn': {
                    'data_format': 'set_of_normalized_string',
                    'translation': ['test1', 'test2', 'test3'],
                    'needs_update': False
                }
            }
        }
    },
    'classifier_model_id': None,
    'card_is_checkpoint': False,
    'solicit_answer_details': False,
    'next_content_id_index': 2
}


class EntityTranslationsModelGenerationOneOffJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase):

    JOB_CLASS = (
        translation_migration_jobs.EntityTranslationsModelGenerationOneOffJob)

    AUTHOR_EMAIL: Final = 'author@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)

        rights_manager.create_new_exploration_rights('exp1', self.author_id)
        model = self.create_model(
            exp_models.ExplorationModel,
            id='exp1',
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
        commit_cmd = exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_CREATE_NEW,
            'title': 'title',
            'category': 'category',
        })
        commit_cmds_dict = [commit_cmd.to_dict()]
        model.commit(self.author_id, 'commit_message', commit_cmds_dict)

    def test_entity_translation_model_generated_from_old_exp(self) -> None:
        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 0)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='EXPLORATION MODELS TRAVERSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='GENERATED TRANSLATIONS SUCCESS: 2'),
        ])

        entity_translation_models = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 2)

    def test_job_raises_error_for_failing_exp_traversal_steps(self) -> None:
        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 0)
        raise_swap = self.swap_to_always_raise(
            state_domain.State,
            'generate_old_content_id_to_new_content_id_in_v54_states'
        )
        with raise_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stderr=(
                        'EXPLORATION MODELS TRAVERSED ERROR: "(\'exp1\', '
                        'Exception())": 1'))
            ])

        entity_translation_models = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 0)

    def test_job_raises_error_for_failing_model_creation_steps(self) -> None:
        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 0)
        raise_swap = self.swap_to_always_raise(
            translation_models.EntityTranslationsModel,
            'create_new'
        )
        with raise_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='EXPLORATION MODELS TRAVERSED SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stderr=(
                        'GENERATED TRANSLATIONS ERROR: "(\'exp1\', '
                        'Exception())": 2')),
            ])

        entity_translation_models = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 0)


class AuditEntityTranslationsModelGenerationOneOffJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase):

    JOB_CLASS = (
        translation_migration_jobs.
        AuditEntityTranslationsModelGenerationOneOffJob)

    AUTHOR_EMAIL: Final = 'author@example.com'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)

        rights_manager.create_new_exploration_rights('exp1', self.author_id)
        model = self.create_model(
            exp_models.ExplorationModel,
            id='exp1',
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
        commit_cmd = exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_CREATE_NEW,
            'title': 'title',
            'category': 'category',
        })
        commit_cmds_dict = [commit_cmd.to_dict()]
        model.commit(self.author_id, 'commit_message', commit_cmds_dict)

    def test_entity_translation_model_not_generated_from_old_exp(self) -> None:
        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 0)

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='EXPLORATION MODELS TRAVERSED SUCCESS: 1'),
            job_run_result.JobRunResult(
                stdout='GENERATED TRANSLATIONS SUCCESS: 2'),
        ])

        entity_translation_models = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 0)

    def test_job_raises_error_for_failing_exp_traversal_steps(self) -> None:
        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 0)
        raise_swap = self.swap_to_always_raise(
            state_domain.State,
            'generate_old_content_id_to_new_content_id_in_v54_states'
        )
        with raise_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stderr=(
                        'EXPLORATION MODELS TRAVERSED ERROR: "(\'exp1\', '
                        'Exception())": 1'))
            ])

        entity_translation_models = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 0)

    def test_job_raises_error_for_failing_model_creation_steps(self) -> None:
        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ] = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 0)
        raise_swap = self.swap_to_always_raise(
            translation_models.EntityTranslationsModel,
            'create_new'
        )
        with raise_swap:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='EXPLORATION MODELS TRAVERSED SUCCESS: 1'),
                job_run_result.JobRunResult(
                    stderr=(
                        'GENERATED TRANSLATIONS ERROR: "(\'exp1\', '
                        'Exception())": 2')),
            ])

        entity_translation_models = (
            translation_models.EntityTranslationsModel.get_all().fetch())

        self.assertEqual(len(entity_translation_models), 0)
