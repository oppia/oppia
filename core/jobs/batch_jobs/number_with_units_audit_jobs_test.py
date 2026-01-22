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

from typing import Dict, Final, List, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, exp_models, question_models

exp_models, question_models = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.QUESTION]
)

datastore_services = models.Registry.import_datastore_services()


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
        ).to_dict()
        exp_state_3['interaction']['id'] = 'TextInput'

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
                'text_state': exp_state_3,
            },
            next_content_id_index=6,
        )
        exp_model_1.update_timestamps()

        exp_state_4 = state_domain.State.create_default_state(
            'state', 'content_0', 'default_outcome_1', is_initial_state=True
        ).to_dict()
        exp_state_4['interaction']['id'] = 'TextInput'

        exp_model_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_2_ID,
            title='exploration 2 title',
            category='category',
            objective='objective',
            language_code='cs',
            init_state_name='state',
            states_schema_version=48,
            states={'text_state': exp_state_4},
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

    def _create_state_with_units(
        self, units: List[Dict[str, object]]
    ) -> state_domain.StateDict:
        state_dict = state_domain.State.create_default_state(
            'state', 'content_0', 'default_outcome_1', is_initial_state=True
        ).to_dict()
        state_dict['interaction']['id'] = 'NumberWithUnits'
        state_dict['interaction']['answer_groups'] = [
            {
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
                                'units': units,
                            }
                        },
                    }
                ]
            }
        ]
        return state_dict
