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

"""
Audit jobs for math interactions:
(AlgebraicExpressionInput, NumericExpressionInput, MathEquationInput)
"""

from __future__ import annotations
from typing import List, Tuple

from core.domain import exp_fetchers
from core.feconf import MATH_INTERACTION_IDS
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class FindMathExplorationsWithRulesJob(base_jobs.JobBase):
    """
    Finds explorations that use at least one of the math interactions
    and accumulates the output along with the rules.

    Expected output:
    (exp_id_1, state_name_1, [rule_type_1, rule_type_2, ...])
    (exp_id_2, state_name_4, [rule_type_1, rule_type_2, ...])
    ...
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:

        exp_models_pcoll = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all()
            )
        )

        exp_models_filtered = (
            exp_models_pcoll
            | 'Filter Math ExplorationModels' >> beam.Filter(
                self.filter_math_exploration_models
            )
        )

        exp_models_with_states = (
            exp_models_filtered
            | 'Mapping exp_ids with states' >> (
                beam.FlatMap(self.flat_map_exp_with_states)
            )
        )

        exp_models_with_states_filtered = (
            exp_models_with_states
            | 'Filtering out states without math interactions' >> (
                beam.Filter(self.filter_math_exploration_states)
            )
        )

        exp_models_with_states_and_rules = (
            exp_models_with_states_filtered
            | 'Mapping with rule types list' >> (
                beam.Map(self.map_with_rule_types)
            )
        )

        return (
            exp_models_with_states_and_rules
            | 'Final output' >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )

    def get_number_of_states(self, model: exp_models.ExplorationModel) -> int:
        exploration = exp_fetchers.get_exploration_from_model(model)
        return len(exploration.states)

    def filter_math_exploration_models(
            self, model: exp_models.ExplorationModel) -> bool:
        return any(
            state_dict['interaction']['id'] in MATH_INTERACTION_IDS
            for state_dict in model.states.values())

    def flat_map_exp_with_states(
            self,
            model: exp_models.ExplorationModel) -> List[Tuple[str, str, dict]]:
        return [
            (model.id, state_name, state_dict)
            for state_name, state_dict in model.states.items()
        ]

    def filter_math_exploration_states(
            self, tup: Tuple[str, str, dict]) -> bool:
        return tup[2]['interaction']['id'] in MATH_INTERACTION_IDS

    def map_with_rule_types(
            self, tup: Tuple[str, str, dict]) -> Tuple[str, str, List[str]]:
        answer_groups = tup[2]['interaction']['answer_groups']
        rule_types = []
        for answer_group in answer_groups:
            for rule_spec in answer_group['rule_specs']:
                rule_types.append(rule_spec['rule_type'])

        return (tup[0], tup[1], rule_types)