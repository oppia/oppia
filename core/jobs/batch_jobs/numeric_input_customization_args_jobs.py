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

"""One-off jobs for NumericInput customization-arg backfills."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, question_models

(exp_models, question_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.QUESTION]
)


class BackfillNumericInputAllowExponentialNotationJob(base_jobs.JobBase):
    """Adds allowExponentialNotation to legacy NumericInput customization args.

    Existing NumericInput interactions historically allowed exponent notation.
    This job backfills that behavior explicitly by setting
    allowExponentialNotation=True where the field is missing.
    """

    @staticmethod
    def _backfill_exploration_model(
        exploration_model: exp_models.ExplorationModel,
    ) -> Tuple[exp_models.ExplorationModel, bool]:
        """Backfills missing allowExponentialNotation in exploration states."""
        was_updated = False
        states = exploration_model.states
        for state_dict in states.values():
            interaction = state_dict.get('interaction')
            if interaction is None or interaction.get('id') != 'NumericInput':
                continue
            if 'customization_args' not in interaction or not isinstance(
                interaction['customization_args'], dict
            ):
                interaction['customization_args'] = {}
            customization_args = interaction['customization_args']
            if 'allowExponentialNotation' in customization_args:
                continue
            customization_args['allowExponentialNotation'] = {'value': True}
            was_updated = True

        return exploration_model, was_updated

    @staticmethod
    def _backfill_question_model(
        question_model: question_models.QuestionModel,
    ) -> Tuple[question_models.QuestionModel, bool]:
        """Backfills missing allowExponentialNotation in question states."""
        was_updated = False
        question_state_data = question_model.question_state_data
        interaction = question_state_data.get('interaction')
        if interaction is not None and interaction.get('id') == 'NumericInput':
            if 'customization_args' not in interaction or not isinstance(
                interaction['customization_args'], dict
            ):
                interaction['customization_args'] = {}
            customization_args = interaction['customization_args']
            if 'allowExponentialNotation' not in customization_args:
                customization_args['allowExponentialNotation'] = {'value': True}
                was_updated = True

        return question_model, was_updated

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        exploration_models_to_update = (
            self.pipeline
            | 'Get all ExplorationModel'
            >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=True)
            )
            | 'Backfill exploration models'
            >> beam.Map(self._backfill_exploration_model)
            | 'Filter updated exploration models'
            >> beam.Filter(lambda model_and_updated: model_and_updated[1])
            | 'Get updated exploration model from tuple'
            >> beam.Map(lambda model_and_updated: model_and_updated[0])
        )

        question_models_to_update = (
            self.pipeline
            | 'Get all QuestionModel'
            >> ndb_io.GetModels(
                question_models.QuestionModel.get_all(include_deleted=True)
            )
            | 'Backfill question models'
            >> beam.Map(self._backfill_question_model)
            | 'Filter updated question models'
            >> beam.Filter(lambda model_and_updated: model_and_updated[1])
            | 'Get updated question model from tuple'
            >> beam.Map(lambda model_and_updated: model_and_updated[0])
        )

        count_updated_exploration_models = (
            exploration_models_to_update
            | 'Count updated exploration models'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'EXPLORATION MODELS UPDATED'
                )
            )
        )

        count_updated_question_models = (
            question_models_to_update
            | 'Count updated question models'
            >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'QUESTION MODELS UPDATED'
                )
            )
        )

        unused_exp_put_results = (
            exploration_models_to_update
            | 'Put updated exploration models' >> ndb_io.PutModels()
        )

        unused_question_put_results = (
            question_models_to_update
            | 'Put updated question models' >> ndb_io.PutModels()
        )

        return (
            count_updated_exploration_models,
            count_updated_question_models,
        ) | 'Merge count outputs' >> beam.Flatten()
