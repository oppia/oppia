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

"""Unit tests for jobs.batch_jobs.numeric_input_customization_args_jobs."""

from __future__ import annotations

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import numeric_input_customization_args_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, question_models

(exp_models, question_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.QUESTION]
)


class BackfillNumericInputAllowExponentialNotationJobTests(
    job_test_utils.JobTestBase
):
    """Tests for BackfillNumericInputAllowExponentialNotationJob."""

    JOB_CLASS = (
        numeric_input_customization_args_jobs.BackfillNumericInputAllowExponentialNotationJob
    )

    def test_run_with_no_models(self) -> None:
        self.assert_job_output_is_empty()

    def test_backfill_of_missing_allow_exponential_notation(self) -> None:
        exp_missing_field = self.create_model(
            exp_models.ExplorationModel,
            id='exp_missing_field',
            title='Title',
            category='Math',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            init_state_name='Introduction',
            states={
                'Introduction': {
                    'interaction': {
                        'id': 'NumericInput',
                        'customization_args': {
                            'requireNonnegativeInput': {'value': False}
                        },
                    }
                }
            },
            next_content_id_index=0,
        )
        exp_existing_field = self.create_model(
            exp_models.ExplorationModel,
            id='exp_existing_field',
            title='Title',
            category='Math',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            init_state_name='Introduction',
            states={
                'Introduction': {
                    'interaction': {
                        'id': 'NumericInput',
                        'customization_args': {
                            'requireNonnegativeInput': {'value': False},
                            'allowExponentialNotation': {'value': False},
                        },
                    }
                }
            },
            next_content_id_index=0,
        )
        question_missing_field = self.create_model(
            question_models.QuestionModel,
            id='question_missing_field',
            question_state_data={
                'interaction': {
                    'id': 'NumericInput',
                    'customization_args': {
                        'requireNonnegativeInput': {'value': False}
                    },
                }
            },
            question_state_data_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            language_code='en',
            linked_skill_ids=[],
            inapplicable_skill_misconception_ids=[],
        )
        question_existing_field = self.create_model(
            question_models.QuestionModel,
            id='question_existing_field',
            question_state_data={
                'interaction': {
                    'id': 'NumericInput',
                    'customization_args': {
                        'requireNonnegativeInput': {'value': False},
                        'allowExponentialNotation': {'value': False},
                    },
                }
            },
            question_state_data_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            language_code='en',
            linked_skill_ids=[],
            inapplicable_skill_misconception_ids=[],
        )
        self.put_multi(
            [
                exp_missing_field,
                exp_existing_field,
                question_missing_field,
                question_existing_field,
            ]
        )

        self.assert_job_output_is(
            [
                job_run_result.JobRunResult(
                    stdout='EXPLORATION MODELS UPDATED SUCCESS: 1'
                ),
                job_run_result.JobRunResult(
                    stdout='QUESTION MODELS UPDATED SUCCESS: 1'
                ),
            ]
        )

        updated_exp_model = exp_models.ExplorationModel.get('exp_missing_field')
        self.assertEqual(
            updated_exp_model.states['Introduction']['interaction'][
                'customization_args'
            ]['allowExponentialNotation']['value'],
            True,
        )

        unchanged_exp_model = exp_models.ExplorationModel.get(
            'exp_existing_field'
        )
        self.assertEqual(
            unchanged_exp_model.states['Introduction']['interaction'][
                'customization_args'
            ]['allowExponentialNotation']['value'],
            False,
        )

        updated_question_model = question_models.QuestionModel.get(
            'question_missing_field'
        )
        self.assertEqual(
            updated_question_model.question_state_data['interaction'][
                'customization_args'
            ]['allowExponentialNotation']['value'],
            True,
        )

        unchanged_question_model = question_models.QuestionModel.get(
            'question_existing_field'
        )
        self.assertEqual(
            unchanged_question_model.question_state_data['interaction'][
                'customization_args'
            ]['allowExponentialNotation']['value'],
            False,
        )

    def test_backfill_handles_non_numeric_and_missing_customization_args(
        self,
    ) -> None:
        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id='exp_model',
            title='Title',
            category='Math',
            states_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            init_state_name='Introduction',
            states={
                'Introduction': {
                    'interaction': None,
                },
                'TextState': {
                    'interaction': {
                        'id': 'TextInput',
                    },
                },
                'NumericStateNoArgs': {
                    'interaction': {
                        'id': 'NumericInput',
                    },
                },
                'NumericStateInvalidArgs': {
                    'interaction': {
                        'id': 'NumericInput',
                        'customization_args': [],
                    },
                },
            },
            next_content_id_index=0,
        )

        updated_exp_model, was_exp_updated = (
            self.JOB_CLASS._backfill_exploration_model(exp_model)
        )
        self.assertTrue(was_exp_updated)
        self.assertEqual(
            updated_exp_model.states['NumericStateNoArgs']['interaction'][
                'customization_args'
            ]['allowExponentialNotation']['value'],
            True,
        )
        self.assertEqual(
            updated_exp_model.states['NumericStateInvalidArgs']['interaction'][
                'customization_args'
            ]['allowExponentialNotation']['value'],
            True,
        )

        question_non_numeric_model = self.create_model(
            question_models.QuestionModel,
            id='question_non_numeric_model',
            question_state_data={
                'interaction': {
                    'id': 'TextInput',
                }
            },
            question_state_data_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            language_code='en',
            linked_skill_ids=[],
            inapplicable_skill_misconception_ids=[],
        )
        question_numeric_model = self.create_model(
            question_models.QuestionModel,
            id='question_numeric_model',
            question_state_data={
                'interaction': {
                    'id': 'NumericInput',
                }
            },
            question_state_data_schema_version=feconf.CURRENT_STATE_SCHEMA_VERSION,
            language_code='en',
            linked_skill_ids=[],
            inapplicable_skill_misconception_ids=[],
        )

        updated_non_numeric_question_model, was_non_numeric_question_updated = (
            self.JOB_CLASS._backfill_question_model(question_non_numeric_model)
        )
        self.assertFalse(was_non_numeric_question_updated)
        self.assertNotIn(
            'allowExponentialNotation',
            updated_non_numeric_question_model.question_state_data[
                'interaction'
            ],
        )

        updated_numeric_question_model, was_numeric_question_updated = (
            self.JOB_CLASS._backfill_question_model(question_numeric_model)
        )
        self.assertTrue(was_numeric_question_updated)
        self.assertEqual(
            updated_numeric_question_model.question_state_data['interaction'][
                'customization_args'
            ]['allowExponentialNotation']['value'],
            True,
        )
