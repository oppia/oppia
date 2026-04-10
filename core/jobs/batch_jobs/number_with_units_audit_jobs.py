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

"""Audit job that lists units used in NumberWithUnits rules."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Iterable, cast

MYPY = False
if MYPY:  # pragma: no cover
    from core.domain import state_domain
    from mypy_imports import exp_models, question_models

exp_models, question_models = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.QUESTION]
)


class FindNumberWithUnitsRuleUnitsJob(base_jobs.JobBase):
    """Finds all unit strings used in NumberWithUnits rules.

    Expected output:
    ['cm', 'hr', 'km', 'm', 's']
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        exp_models_pcoll = (
            self.pipeline
            | 'Get all ExplorationModels'
            >> ndb_io.GetModels(exp_models.ExplorationModel.get_all())
        )

        question_models_pcoll = (
            self.pipeline
            | 'Get all QuestionModels'
            >> ndb_io.GetModels(question_models.QuestionModel.get_all())
        )

        exp_units = (
            exp_models_pcoll
            | 'Extract units from explorations'
            >> beam.FlatMap(self._extract_units_from_exploration)
        )

        question_units = (
            question_models_pcoll
            | 'Extract units from questions'
            >> beam.FlatMap(self._extract_units_from_question)
        )

        all_units = (
            exp_units,
            question_units,
        ) | 'Merge NumberWithUnits units' >> beam.Flatten()

        unique_units = all_units | 'Deduplicate units' >> beam.combiners.ToSet()

        sorted_units = (
            unique_units
            | 'Sort units' >> beam.Map(sorted)
            | 'Filter empty unit lists'
            >> beam.Filter(lambda unit_list: len(unit_list) > 0)
        )

        return sorted_units | 'Final output' >> beam.Map(
            job_run_result.JobRunResult.as_stdout
        )

    def _extract_units_from_exploration(
        self, model: exp_models.ExplorationModel
    ) -> Iterable[str]:
        """Extracts NumberWithUnits unit strings from an exploration."""
        for state_dict in model.states.values():
            for unit in self._extract_units_from_state_dict(state_dict):
                yield unit

    def _extract_units_from_question(
        self, model: question_models.QuestionModel
    ) -> Iterable[str]:
        """Extracts NumberWithUnits unit strings from a question."""
        state_dict = model.question_state_data
        for unit in self._extract_units_from_state_dict(state_dict):
            yield unit

    def _extract_units_from_state_dict(
        self, state_dict: state_domain.StateDict
    ) -> Iterable[str]:
        """Extracts NumberWithUnits unit strings from a state dict."""
        interaction_dict = state_dict.get('interaction')
        if not isinstance(interaction_dict, dict):
            return

        if interaction_dict.get('id') != 'NumberWithUnits':
            return

        # Here we use object because this value comes from persisted JSON and
        # must be runtime-validated before treating it as a specific type.
        answer_groups: object = interaction_dict.get('answer_groups', [])
        if not isinstance(answer_groups, list):
            return

        for answer_group in answer_groups:
            # Here we use object because list entries from persisted JSON must
            # be treated as unknown until runtime checks pass.
            # Here we use cast because each list item must be treated as an
            # unknown value before runtime type checks are applied.
            answer_group = cast(object, answer_group)
            if not isinstance(answer_group, dict):
                continue
            # Here we use object because rule_specs can be malformed in
            # persisted payloads and are validated with isinstance checks.
            rule_specs: object = answer_group.get('rule_specs', [])
            if not isinstance(rule_specs, list):
                continue
            for rule_spec in rule_specs:
                # Here we use object because list entries from persisted JSON
                # must be treated as unknown until runtime checks pass.
                # Here we use cast because each rule spec is handled as unknown
                # until runtime validation confirms its structure.
                rule_spec = cast(object, rule_spec)
                if not isinstance(rule_spec, dict):
                    continue
                # Here we use object because inputs are loaded from storage
                # and need runtime validation before dict access.
                inputs: object = rule_spec.get('inputs', {})
                if not isinstance(inputs, dict):
                    continue
                # Here we use object because the "f" field can be malformed in
                # legacy payloads and must be validated first.
                number_with_units: object = inputs.get('f')
                if not isinstance(number_with_units, dict):
                    continue
                # Here we use object because units data comes from persisted
                # state and is validated at runtime before iteration.
                units: object = number_with_units.get('units', [])
                if not isinstance(units, list):
                    continue
                for unit_dict in units:
                    # Here we use object because list entries from persisted
                    # JSON must be treated as unknown until runtime checks pass.
                    # Here we use cast because each unit entry is treated as
                    # unknown before validating that it is a dict.
                    unit_dict = cast(object, unit_dict)
                    if not isinstance(unit_dict, dict):
                        continue
                    unit_name = unit_dict.get('unit')
                    if isinstance(unit_name, str):
                        yield unit_name
