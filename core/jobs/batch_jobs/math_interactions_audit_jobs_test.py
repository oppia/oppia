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

"""Unit tests for jobs.batch_jobs.math_interactions_audit_jobs."""

from __future__ import annotations

from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import math_interactions_audit_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])

datastore_services = models.Registry.import_datastore_services()


class FindMathExplorationsWithRulesJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = math_interactions_audit_jobs.FindMathExplorationsWithRulesJob

    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_job_finds_math_explorations_with_rules(self) -> None:
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
                'init_state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict(),
                'alg_state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict(),
                'eq_state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict(),
                'end_state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict(),
            }
        )
        exp_model_1.states['alg_state']['interaction']['id'] = (
            'AlgebraicExpressionInput')
        exp_model_1.states['alg_state']['interaction']['answer_groups'] = [
            {
                'rule_specs': [{
                    'inputs': {
                        'x': 'a + b'
                    },
                    'rule_type': 'IsEquivalentTo'
                }, {
                    'inputs': {
                        'x': 'a - b'
                    },
                    'rule_type': 'ContainsSomeOf'
                }]
            }
        ]
        exp_model_1.states['eq_state']['interaction']['id'] = (
            'MathEquationInput')
        exp_model_1.states['eq_state']['interaction']['answer_groups'] = [
            {
                'rule_specs': [{
                    'inputs': {
                        'x': 'x = y',
                        'y': 'both'
                    },
                    'rule_type': 'MatchesExactlyWith'
                }]
            }
        ]
        exp_model_1.update_timestamps()

        exp_model_2 = self.create_model(
            exp_models.ExplorationModel,
            id=self.EXP_2_ID,
            title='exploration 2 title',
            category='category',
            objective='objective',
            language_code='cs',
            init_state_name='state',
            states_schema_version=48,
            states={
                'init_state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict(),
                'num_state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict(),
                'end_state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict()
            }
        )
        exp_model_2.states['num_state']['interaction']['id'] = (
            'NumericExpressionInput')
        exp_model_2.states['num_state']['interaction']['answer_groups'] = [
            {
                'rule_specs': [{
                    'inputs': {
                        'x': '1.2 + 3'
                    },
                    'rule_type': 'MatchesExactlyWith'
                }, {
                    'inputs': {
                        'x': '1 - 2'
                    },
                    'rule_type': 'OmitsSomeOf'
                }]
            }
        ]
        exp_model_2.update_timestamps()

        datastore_services.put_multi([exp_model_1, exp_model_2])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=(
                    '(\'exp_1_id\', \'alg_state\', '
                    '[\'IsEquivalentTo\', \'ContainsSomeOf\'])'
                )
            ),
            job_run_result.JobRunResult(
                stdout=(
                    '(\'exp_1_id\', \'eq_state\', [\'MatchesExactlyWith\'])'
                )
            ),
            job_run_result.JobRunResult(
                stdout=(
                    '(\'exp_2_id\', \'num_state\', '
                    '[\'MatchesExactlyWith\', \'OmitsSomeOf\'])'
                )
            )
        ])


class FindMathExplorationsWithNonTrivialFunctionsJobTests(
        job_test_utils.JobTestBase):

    JOB_CLASS = (
        math_interactions_audit_jobs
        .FindMathExplorationsWithNonTrivialFunctionsJob)

    EXP_1_ID = 'exp_1_id'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_job_finds_math_explorations_with_non_trivial_functions(
            self) -> None:
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
                'init_state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict(),
                'trivial_state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict(),
                'non_trivial_state_1': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict(),
                'non_trivial_state_2': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict(),
                'end_state': state_domain.State.create_default_state( # type: ignore[no-untyped-call]
                    'state', is_initial_state=True
                ).to_dict(),
            }
        )
        exp_model_1.states['trivial_state']['interaction']['id'] = (
            'AlgebraicExpressionInput')
        exp_model_1.states['trivial_state']['interaction']['answer_groups'] = [
            {
                'rule_specs': [{
                    'inputs': {
                        'x': 'sqrt(a) + b'
                    },
                    'rule_type': 'IsEquivalentTo'
                }, {
                    'inputs': {
                        'x': 'a - abs(b)'
                    },
                    'rule_type': 'ContainsSomeOf'
                }]
            }
        ]
        exp_model_1.states['non_trivial_state_1']['interaction']['id'] = (
            'AlgebraicExpressionInput')
        exp_model_1.states['non_trivial_state_1']['interaction'][
                'answer_groups'] = [
            {
                'rule_specs': [{
                    'inputs': {
                        'x': 'log(x) - sin(y)'
                    },
                    'rule_type': 'MatchesExactlyWith'
                }, {
                    'inputs': {
                        'x': 'x - y'
                    },
                    'rule_type': 'MatchesExactlyWith'
                }]
            }
        ]
        exp_model_1.states['non_trivial_state_2']['interaction']['id'] = (
            'MathEquationInput')
        exp_model_1.states['non_trivial_state_2']['interaction'][
                'answer_groups'] = [
            {
                'rule_specs': [{
                    'inputs': {
                        'x': 'log(x) = 3 * tan(y)',
                        'y': 'both'
                    },
                    'rule_type': 'MatchesExactlyWith'
                }]
            }
        ]

        exp_model_1.update_timestamps()

        datastore_services.put_multi([exp_model_1, ])

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=(
                    '(\'exp_1_id\', \'non_trivial_state_1\', '
                    '[\'log(x) - sin(y)\', \'x - y\'])'
                )
            ), job_run_result.JobRunResult(
                stdout=(
                    '(\'exp_1_id\', \'non_trivial_state_2\', '
                    '[\'log(x) = 3 * tan(y)\'])'
                )
            )
        ])
