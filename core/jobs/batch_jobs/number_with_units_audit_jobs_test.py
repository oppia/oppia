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

"""Unit tests for jobs.batch_jobs.number_with_units_audit_jobs."""

from __future__ import annotations

from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import number_with_units_audit_jobs
from core.jobs.types import job_run_result
from core.platform import models

from typing import Dict, Final, List, Type, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, exp_models, question_models

exp_models, question_models = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.QUESTION]
)

datastore_services = models.Registry.import_datastore_services()


# Here we use object because we need to test edge cases where state data is
# malformed with unexpected types (e.g., a string where a dict is expected).
# The job's defensive type checks handle such corrupted datastore data.
MalformedStateDict = Dict[str, object]


class FindNumberWithUnitsRuleUnitsJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        number_with_units_audit_jobs.FindNumberWithUnitsRuleUnitsJob
    ] = number_with_units_audit_jobs.FindNumberWithUnitsRuleUnitsJob

    EXP_1_ID: Final = 'exp_1_id'
    EXP_2_ID: Final = 'exp_2_id'
    QUESTION_1_ID: Final = 'question_1_id'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_job_finds_units_used_in_rules(self) -> None:
        exp_state_1 = self._create_state_with_units(
            [
                {'unit': 'km', 'exponent': 1},
                {'unit': 'hr', 'exponent': -1},
            ]
        )
        exp_state_2 = self._create_state_with_units(
            [
                {'unit': 'm', 'exponent': 1},
            ]
        )
        exp_state_3 = state_domain.State.create_default_state(
            'state', 'content_4', 'default_outcome_5', is_initial_state=True
        )
        exp_state_3.update_interaction_id('TextInput')

        exp_model_1 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration 1 title',
            category='category',
            objective='objective',
            language_code='cs',
            init_state_name='state',
            states_schema_version=48,
            states={
                'num_with_units_1': exp_state_1,
                'num_with_units_2': exp_state_2,
                'text_state': exp_state_3.to_dict(),
            },
            next_content_id_index=6,
        )
        exp_model_1.update_timestamps()

        exp_state_4 = state_domain.State.create_default_state(
            'state', 'content_0', 'default_outcome_1', is_initial_state=True
        )
        exp_state_4.update_interaction_id('TextInput')

        exp_model_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_2_ID,
            title='exploration 2 title',
            category='category',
            objective='objective',
            language_code='cs',
            init_state_name='state',
            states_schema_version=48,
            states={'text_state': exp_state_4.to_dict()},
            next_content_id_index=2,
        )
        exp_model_2.update_timestamps()

        question_state = self._create_state_with_units(
            [
                {'unit': 's', 'exponent': 1},
                {'unit': 'm', 'exponent': 1},
            ]
        )

        question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=question_state,
            question_state_data_schema_version=48,
            language_code='en',
            linked_skill_ids=['skill_id'],
            version=1,
            next_content_id_index=2,
        )
        question_model.update_timestamps()

        datastore_services.put_multi([exp_model_1, exp_model_2, question_model])

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout=str(['hr', 'km', 'm', 's']))]
        )

    def test_job_deduplicates_units_across_models_with_variations(self) -> None:
        exp_state_1 = self._create_state_with_units(
            [
                {'unit': 'm', 'exponent': 1},
                {'unit': 's', 'exponent': -1},
            ]
        )

        exp_state_2 = state_domain.State.create_default_state(
            'state', 'content_6', 'default_outcome_7', is_initial_state=True
        )
        exp_state_2.update_interaction_id('NumberWithUnits')
        default_outcome = exp_state_2.interaction.default_outcome
        assert default_outcome is not None
        exp_state_2.update_interaction_answer_groups(
            [
                state_domain.AnswerGroup(
                    state_domain.Outcome(
                        default_outcome.dest,
                        default_outcome.dest_if_really_stuck,
                        state_domain.SubtitledHtml('feedback_8', ''),
                        default_outcome.labelled_as_correct,
                        default_outcome.param_changes,
                        default_outcome.refresher_exploration_id,
                        default_outcome.missing_prerequisite_skill_id,
                    ),
                    [
                        state_domain.RuleSpec(
                            'IsEquivalentTo',
                            {
                                'f': {
                                    'type': 'real',
                                    'real': 3,
                                    'fraction': {
                                        'isNegative': False,
                                        'wholeNumber': 0,
                                        'numerator': 0,
                                        'denominator': 1,
                                    },
                                    'units': [
                                        {'unit': 'kg', 'exponent': 1},
                                        {'unit': 'm', 'exponent': 2},
                                    ],
                                }
                            },
                        ),
                        state_domain.RuleSpec(
                            'IsEquivalentTo',
                            {
                                'f': {
                                    'type': 'real',
                                    'real': 4,
                                    'fraction': {
                                        'isNegative': False,
                                        'wholeNumber': 0,
                                        'numerator': 0,
                                        'denominator': 1,
                                    },
                                    'units': [
                                        {'unit': 'N', 'exponent': 1},
                                        {'unit': 's', 'exponent': -2},
                                    ],
                                }
                            },
                        ),
                    ],
                    [],
                    None,
                ),
                state_domain.AnswerGroup(
                    state_domain.Outcome(
                        default_outcome.dest,
                        default_outcome.dest_if_really_stuck,
                        state_domain.SubtitledHtml('feedback_9', ''),
                        default_outcome.labelled_as_correct,
                        default_outcome.param_changes,
                        default_outcome.refresher_exploration_id,
                        default_outcome.missing_prerequisite_skill_id,
                    ),
                    [
                        state_domain.RuleSpec(
                            'IsEquivalentTo',
                            {
                                'f': {
                                    'type': 'real',
                                    'real': 5,
                                    'fraction': {
                                        'isNegative': False,
                                        'wholeNumber': 0,
                                        'numerator': 0,
                                        'denominator': 1,
                                    },
                                    'units': [
                                        {'unit': 'kg', 'exponent': 1},
                                        {'unit': 'm', 'exponent': 1},
                                        {'unit': 's', 'exponent': -2},
                                    ],
                                }
                            },
                        ),
                    ],
                    [],
                    None,
                ),
            ]
        )

        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration title',
            category='category',
            objective='objective',
            language_code='cs',
            init_state_name='state',
            states_schema_version=48,
            states={
                'num_with_units_1': exp_state_1,
                'num_with_units_2': exp_state_2.to_dict(),
            },
            next_content_id_index=10,
        )
        exp_model.update_timestamps()

        question_state_1 = self._create_state_with_units(
            [
                {'unit': 'kg', 'exponent': 1},
                {'unit': 'm', 'exponent': 2},
                {'unit': 's', 'exponent': -2},
            ]
        )

        question_model = self.create_model(
            question_models.QuestionModel,
            id=self.QUESTION_1_ID,
            question_state_data=question_state_1,
            question_state_data_schema_version=48,
            language_code='en',
            linked_skill_ids=['skill_id'],
            version=1,
            next_content_id_index=2,
        )
        question_model.update_timestamps()

        datastore_services.put_multi([exp_model, question_model])

        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout=str(['N', 'kg', 'm', 's']))]
        )

    def test_job_handles_malformed_state_data(self) -> None:
        # State with interaction that is not a dict.
        malformed_state_1 = self._create_base_malformed_state_dict(
            'content_0', 'default_outcome_1'
        )
        malformed_state_1['interaction'] = 'not_a_dict'

        # State with answer_groups that is not a list.
        malformed_state_2 = self._create_base_malformed_state_dict(
            'content_2', 'default_outcome_3'
        )
        interaction_2 = malformed_state_2['interaction']
        assert isinstance(interaction_2, dict)
        interaction_2['id'] = 'NumberWithUnits'
        interaction_2['answer_groups'] = 'not_a_list'

        # State with answer_group that is not a dict.
        malformed_state_3 = self._create_base_malformed_state_dict(
            'content_4', 'default_outcome_5'
        )
        interaction_3 = malformed_state_3['interaction']
        assert isinstance(interaction_3, dict)
        interaction_3['id'] = 'NumberWithUnits'
        interaction_3['answer_groups'] = ['not_a_dict']

        # State with rule_spec that is not a dict.
        malformed_state_4 = self._create_base_malformed_state_dict(
            'content_6', 'default_outcome_7'
        )
        interaction_4 = malformed_state_4['interaction']
        assert isinstance(interaction_4, dict)
        default_outcome_4 = interaction_4['default_outcome']
        interaction_4['id'] = 'NumberWithUnits'
        interaction_4['answer_groups'] = [
            {
                'outcome': default_outcome_4,
                'rule_specs': ['not_a_dict'],
                'training_data': [],
                'tagged_skill_misconception_id': None,
            }
        ]

        # State with inputs that is not a dict.
        malformed_state_5 = self._create_base_malformed_state_dict(
            'content_8', 'default_outcome_9'
        )
        interaction_5 = malformed_state_5['interaction']
        assert isinstance(interaction_5, dict)
        default_outcome_5 = interaction_5['default_outcome']
        interaction_5['id'] = 'NumberWithUnits'
        interaction_5['answer_groups'] = [
            {
                'outcome': default_outcome_5,
                'rule_specs': [
                    {
                        'rule_type': 'IsEquivalentTo',
                        'inputs': 'not_a_dict',
                    }
                ],
                'training_data': [],
                'tagged_skill_misconception_id': None,
            }
        ]

        # State with number_with_units (f) that is not a dict.
        malformed_state_6 = self._create_base_malformed_state_dict(
            'content_10', 'default_outcome_11'
        )
        interaction_6 = malformed_state_6['interaction']
        assert isinstance(interaction_6, dict)
        default_outcome_6 = interaction_6['default_outcome']
        interaction_6['id'] = 'NumberWithUnits'
        interaction_6['answer_groups'] = [
            {
                'outcome': default_outcome_6,
                'rule_specs': [
                    {
                        'rule_type': 'IsEquivalentTo',
                        'inputs': {
                            'f': 'not_a_dict',
                        },
                    }
                ],
                'training_data': [],
                'tagged_skill_misconception_id': None,
            }
        ]

        # State with unit_dict that is not a dict followed by a valid one.
        malformed_state_7 = self._create_base_malformed_state_dict(
            'content_12', 'default_outcome_13'
        )
        interaction_7 = malformed_state_7['interaction']
        assert isinstance(interaction_7, dict)
        default_outcome_7 = interaction_7['default_outcome']
        interaction_7['id'] = 'NumberWithUnits'
        interaction_7['answer_groups'] = [
            {
                'outcome': default_outcome_7,
                'rule_specs': [
                    {
                        'rule_type': 'IsEquivalentTo',
                        'inputs': {
                            'f': {
                                'type': 'real',
                                'real': 2,
                                'fraction': {
                                    'isNegative': False,
                                    'wholeNumber': 0,
                                    'numerator': 0,
                                    'denominator': 1,
                                },
                                'units': [
                                    'not_a_dict',
                                    {'unit': 'g', 'exponent': 1},
                                ],
                            }
                        },
                    }
                ],
                'training_data': [],
                'tagged_skill_misconception_id': None,
            }
        ]

        # State with unit_dict where 'unit' is not a string followed by a valid unit.
        malformed_state_8 = self._create_base_malformed_state_dict(
            'content_14', 'default_outcome_15'
        )
        interaction_8 = malformed_state_8['interaction']
        assert isinstance(interaction_8, dict)
        default_outcome_8 = interaction_8['default_outcome']
        interaction_8['id'] = 'NumberWithUnits'
        interaction_8['answer_groups'] = [
            {
                'outcome': default_outcome_8,
                'rule_specs': [
                    {
                        'rule_type': 'IsEquivalentTo',
                        'inputs': {
                            'f': {
                                'type': 'real',
                                'real': 2,
                                'fraction': {
                                    'isNegative': False,
                                    'wholeNumber': 0,
                                    'numerator': 0,
                                    'denominator': 1,
                                },
                                'units': [
                                    {'unit': 123, 'exponent': 1},
                                    {'unit': 'mg', 'exponent': 1},
                                ],
                            }
                        },
                    }
                ],
                'training_data': [],
                'tagged_skill_misconception_id': None,
            }
        ]

        # Valid state with actual units to ensure job runs and produces output.
        valid_state = self._create_state_with_units(
            [{'unit': 'cm', 'exponent': 1}]
        )

        exp_model = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_1_ID,
            title='exploration title',
            category='category',
            objective='objective',
            language_code='cs',
            init_state_name='state',
            states_schema_version=48,
            states={
                'malformed_1': malformed_state_1,
                'malformed_2': malformed_state_2,
                'malformed_3': malformed_state_3,
                'malformed_4': malformed_state_4,
                'malformed_5': malformed_state_5,
                'malformed_6': malformed_state_6,
                'malformed_7': malformed_state_7,
                'malformed_8': malformed_state_8,
                'valid_state': valid_state,
            },
            next_content_id_index=16,
        )
        exp_model.update_timestamps()

        datastore_services.put_multi([exp_model])

        # Valid state produces 'cm', malformed_state_7 produces 'g', and
        # malformed_state_8 produces 'mg' (both have valid units after invalid
        # ones that get skipped).
        self.assert_job_output_is(
            [job_run_result.JobRunResult(stdout=str(['cm', 'g', 'mg']))]
        )

    def _create_state_with_units(
        self, units: List[Dict[str, Union[str, int]]]
    ) -> state_domain.StateDict:
        """Creates a NumberWithUnits state dict with the provided units."""
        state = state_domain.State.create_default_state(
            'state', 'content_0', 'default_outcome_1', is_initial_state=True
        )
        state.update_interaction_id('NumberWithUnits')
        default_outcome = state.interaction.default_outcome
        assert default_outcome is not None
        state.update_interaction_answer_groups(
            [
                state_domain.AnswerGroup(
                    state_domain.Outcome(
                        default_outcome.dest,
                        default_outcome.dest_if_really_stuck,
                        state_domain.SubtitledHtml('feedback_2', ''),
                        default_outcome.labelled_as_correct,
                        default_outcome.param_changes,
                        default_outcome.refresher_exploration_id,
                        default_outcome.missing_prerequisite_skill_id,
                    ),
                    [
                        state_domain.RuleSpec(
                            'IsEquivalentTo',
                            {
                                'f': {
                                    'type': 'real',
                                    'real': 2,
                                    'fraction': {
                                        'isNegative': False,
                                        'wholeNumber': 0,
                                        'numerator': 0,
                                        'denominator': 1,
                                    },
                                    'units': units,
                                }
                            },
                        ),
                    ],
                    [],
                    None,
                ),
            ]
        )
        return state.to_dict()

    def _create_base_malformed_state_dict(
        self, content_id: str, default_outcome_id: str
    ) -> MalformedStateDict:
        """Creates a base state dict that can be modified for malformed tests.

        This function returns a plain Dict[str, object] rather than a TypedDict
        to allow testing edge cases where state data is malformed.

        Args:
            content_id: str. The content ID for the state.
            default_outcome_id: str. The default outcome ID for the state.

        Returns:
            MalformedStateDict. A base state dict as a plain dictionary.
        """
        state_dict = state_domain.State.create_default_state(
            'state', content_id, default_outcome_id, is_initial_state=True
        ).to_dict()
        return dict(state_dict)
