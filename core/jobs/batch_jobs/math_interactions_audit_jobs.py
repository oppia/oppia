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

"""Audit jobs for math interactions: AlgebraicExpressionInput,
NumericExpressionInput, MathEquationInput.
"""

from __future__ import annotations

from core import feconf
from core.domain import expression_parser
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Iterable, List, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])

datastore_services = models.Registry.import_datastore_services()

# Most commonly used functions that are supported by the android app as well.
TRIVIAL_FUNCTIONS = ['abs', 'sqrt']


class Utils:
    """Utitlity functions for math interaction audit jobs."""

    @staticmethod
    def contains_math_interactions(model: exp_models.ExplorationModel) -> bool:
        """Checks if the exploration contains any state with any of the
        math interactions.

        Args:
            model: ExplorationModel. Model instance to be checked.

        Returns:
            bool. Whether the exploration contains math interactions.
        """
        return any(
            state_dict['interaction']['id'] in feconf.MATH_INTERACTION_IDS
            for state_dict in model.states.values())

    @staticmethod
    def flat_map_exp_with_states(
        model: exp_models.ExplorationModel
    ) -> List[Tuple[str, str, dict]]:
        """Maps exploration model with it's states data.

        Args:
            model: ExplorationModel. Model instance to be mapped.

        Returns:
            List[Tuple[str, str, dict]]. List of tuples
            (exp_id, state_name, state_dict).
        """
        return [
            (model.id, state_name, state_dict)
            for state_name, state_dict in model.states.items()
        ]

    @staticmethod
    def map_with_rule_types(
        tup: Tuple[str, str, dict]
    ) -> Tuple[str, str, List[str]]:
        """Maps state tuple with it's rule types.

        Args:
            tup: Tuple[str, str, dict]. State tuple to be modified.

        Returns:
            Tuple[str, str, List[str]]. Mapped tuple
            (exp_id, state_name, list of rules).
        """
        exp_id, state_name, state_dict = tup
        answer_groups = state_dict['interaction']['answer_groups']
        rule_types = []
        for answer_group in answer_groups:
            for rule_spec in answer_group['rule_specs']:
                rule_types.append(rule_spec['rule_type'])

        return (exp_id, state_name, rule_types)

    @staticmethod
    def map_with_rule_inputs(
        tup: Tuple[str, str, dict]
    ) -> Tuple[str, str, List[str]]:
        """Maps state tuple with it's rule inputs.

        Args:
            tup: Tuple[str, str, dict]. State tuple to be modified.

        Returns:
            Tuple[str, str, List[str]]. Mapped tuple
            (exp_id, state_name, list of rules).
        """
        exp_id, state_name, state_dict = tup
        answer_groups = state_dict['interaction']['answer_groups']
        rule_inputs = []
        for answer_group in answer_groups:
            for rule_spec in answer_group['rule_specs']:
                rule_inputs.append(rule_spec['inputs']['x'])

        return (exp_id, state_name, rule_inputs)

    @staticmethod
    def uses_non_trivial_functions(
        tup: Tuple[str, str, List[str]]
    ) -> bool:
        """Checks if the state contains any rule input that uses non-trivial
        functions.

        Args:
            tup: Tuple[str, str, List[str]]. Mapped tuple
                (exp_id, state_name, list of rule inputs).

        Returns:
            bool. Whether the state uses non trivial functions.
        """
        rule_inputs = tup[2]
        for rule_input in rule_inputs:
            tokens = []
            if '=' in rule_input:
                lhs, rhs = rule_input.split('=')
                lhs_tokens = expression_parser.tokenize(lhs)
                rhs_tokens = expression_parser.tokenize(rhs)
                tokens = lhs_tokens + rhs_tokens
            else:
                tokens = expression_parser.tokenize(rule_input)
            for token in tokens:
                if token.is_function(token.text) and (
                        token.text not in TRIVIAL_FUNCTIONS):
                    return True
        return False

    @staticmethod
    def fetch_math_explorations_with_states(
        exp_models_pcoll: datastore_services.Query
    ) -> Iterable[Tuple[str, str, dict]]:
        """Fetches all explorations that use math interactions along with their
        state dicts.

        Args:
            exp_models_pcoll: datastore_services.Query. All exploration models.

        Returns:
            Iterable[Tuple[str, str, dict]]. Math exploration state tuples.
        """
        exp_models_filtered = (
            exp_models_pcoll
            | 'Filter Math ExplorationModels' >> beam.Filter(
                Utils.contains_math_interactions
            )
        )

        exp_models_with_states = (
            exp_models_filtered
            | 'Mapping exp_ids with states' >> (
                beam.FlatMap(Utils.flat_map_exp_with_states)
            )
        )

        exp_models_with_states_filtered = (
            exp_models_with_states
            | 'Filtering out states without math interactions' >> (
                beam.Filter(
                    lambda tup: tup[2][
                        'interaction']['id'] in feconf.MATH_INTERACTION_IDS
                )
            )
        )

        return exp_models_with_states_filtered


class FindMathExplorationsWithRulesJob(base_jobs.JobBase):
    """Finds explorations that use at least one of the math interactions
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

        math_exp_models_with_states = Utils.fetch_math_explorations_with_states(
            exp_models_pcoll)

        exp_models_with_states_and_rules = (
            math_exp_models_with_states
            | 'Mapping with rule types list' >> (
                beam.Map(Utils.map_with_rule_types)
            )
        )

        return (
            exp_models_with_states_and_rules
            | 'Final output' >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )


class FindMathExplorationsWithNonTrivialFunctionsJob(base_jobs.JobBase):
    """Finds explorations that use at least one of the math interactions
    and uses functions other than sqrt and abs in the answer groups.

    Expected output:
    (exp_id_1, state_name_1, [rule_input_1, rule_input_2, ...])
    (exp_id_2, state_name_4, [rule_input_1, rule_input_2, ...])
    ...
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:

        exp_models_pcoll = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all()
            )
        )

        math_exp_models_with_states = Utils.fetch_math_explorations_with_states(
            exp_models_pcoll)

        exp_models_with_states_and_rules = (
            math_exp_models_with_states
            | 'Mapping with rule inputs list' >> (
                beam.Map(Utils.map_with_rule_inputs)
            )
        )

        exp_models_with_states_and_rules_filtered = (
            exp_models_with_states_and_rules
            | 'Keeping states with non-trivial function rule inputs' >> (
                beam.Filter(Utils.uses_non_trivial_functions)
            )
        )

        return (
            exp_models_with_states_and_rules_filtered
            | 'Final output' >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )
