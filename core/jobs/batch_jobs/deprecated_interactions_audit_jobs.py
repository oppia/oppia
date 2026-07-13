# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Audit job for finding explorations using deprecated interactions."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Any, Dict, Iterable, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, stats_models

(exp_models, stats_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.STATISTICS]
)

DEPRECATED_INTERACTION_IDS = [
    'PencilCodeEditor',
    'MusicNotesInput',
    'CodeRepl',
    'GraphInput',
    'InteractiveMap',
]


class AuditDeprecatedInteractionsJob(base_jobs.JobBase):
    """Job that finds all explorations containing deprecated interactions.

    It outputs the exploration ID, interactions used, last updated time, and
    the timestamp of the last submitted learner answer for that exploration.
    """

    DATASTORE_UPDATES_ALLOWED = False

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        exp_models_pcoll = (
            self.pipeline
            | 'Get all ExplorationModels'
            >> ndb_io.GetModels(exp_models.ExplorationModel.get_all())
        )

        state_answers_models_pcoll = (
            self.pipeline
            | 'Get all StateAnswersModels'
            >> ndb_io.GetModels(stats_models.StateAnswersModel.get_all())
        )

        exp_data = (
            exp_models_pcoll
            | 'Filter and map Explorations'
            >> beam.FlatMap(self.extract_deprecated_interactions_info)
        )

        answers_data = (
            state_answers_models_pcoll
            | 'Map Answers by exploration'
            >> beam.Map(
                lambda model: (
                    model.exploration_id,
                    (
                        model.created_on.strftime('%Y-%m-%d %H:%M:%S')
                        if model.created_on
                        else ''
                    ),
                )
            )
        )

        # Output format from CoGroupByKey:
        # (exploration_id, {'exp_data': [{'interactions': [...], 'last_updated': ...}], 'answers_data': [timestamp1, timestamp2]})
        grouped_data = {
            'exp_data': exp_data,
            'answers_data': answers_data,
        } | 'Group by exploration id' >> beam.CoGroupByKey()

        output_results = grouped_data | 'Format output' >> beam.FlatMap(
            self.format_output
        )

        return output_results | 'Map to JobRunResult' >> beam.Map(
            job_run_result.JobRunResult.as_stdout
        )

    # Here we use type Any because the dict contains both string and list values.
    def extract_deprecated_interactions_info(
        self, model: exp_models.ExplorationModel
    ) -> Iterable[Tuple[str, Dict[str, Any]]]:
        """Extracts deprecated interactions used in an exploration.

        Args:
            model: ExplorationModel. The exploration model.

        Yields:
            Tuple[str, Dict[str, Any]]. A tuple of exploration_id and a dict
            containing the deprecated interactions used and the last_updated time.
        """
        used_deprecated_interactions = set()
        for state_dict in model.states.values():
            interaction_id = state_dict['interaction']['id']
            if interaction_id in DEPRECATED_INTERACTION_IDS:
                used_deprecated_interactions.add(interaction_id)

        if used_deprecated_interactions:
            yield (
                model.id,
                {
                    'interactions': sorted(list(used_deprecated_interactions)),
                    'last_updated': (
                        model.last_updated.strftime('%Y-%m-%d %H:%M:%S')
                        if model.last_updated
                        else ''
                    ),
                },
            )

    # Here we use type Any because the return type of beam.CoGroupByKey()
    # contains values of different types from multiple PCollections.
    def format_output(
        self,
        grouped_data: Tuple[str, Dict[str, Iterable[Any]]],
    ) -> Iterable[str]:
        """Formats the grouped data into a human-readable string.

        Args:
            grouped_data: Tuple[str, Dict[str, Iterable[Any]]].
                The CoGroupByKey output.

        Yields:
            str. Formatted string output for the exploration.
        """
        exp_id, data = grouped_data
        exp_data_list = list(data['exp_data'])
        if not exp_data_list:
            # Exploration does not have deprecated interactions.
            return

        exp_info = exp_data_list[0]
        interactions = exp_info['interactions']
        last_updated_str = exp_info['last_updated']

        answers_timestamps = list(data['answers_data'])
        last_answer_str = (
            max(answers_timestamps) if answers_timestamps else 'None'
        )

        output_str = (
            'Exp ID: %s, Interactions: %s, Last Edited: %s, '
            'Last Answer: %s'
            % (exp_id, interactions, last_updated_str, last_answer_str)
        )
        yield output_str
