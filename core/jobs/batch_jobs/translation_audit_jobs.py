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

"""Beam jobs for auditing translation counts."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, Iterable, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import translation_models

(exp_models, opportunity_models, translation_models) = (
    models.Registry.import_models(
        [
            models.Names.EXPLORATION,
            models.Names.OPPORTUNITY,
            models.Names.TRANSLATION,
        ]
    )
)


class ValidateExplorationOpportunityCountsJob(base_jobs.JobBase):
    """Job that validates translation_counts in ExplorationOpportunitySummaryModel.

    This job computes the true translation counts by looking at EntityTranslationsModel
    and compares it to the translation_counts recorded in ExplorationOpportunitySummaryModel.
    It returns SUCCESS if all counts match, and logs the mismatches otherwise.
    """

    def _get_translation_counts(
        self, translation_model: translation_models.EntityTranslationsModel
    ) -> Tuple[str, Tuple[str, int]]:
        """Extracts the number of translations for an entity from EntityTranslationsModel.

        Args:
            translation_model: EntityTranslationsModel. The translation model.

        Returns:
            Tuple[str, Tuple[str, int]]. A tuple structured as
            (exploration_id, (language_code, translation_count)).
        """
        # translations field is a JSON property mapping content_id to translation
        translation_count = len(translation_model.translations)
        return (
            translation_model.entity_id,
            (translation_model.language_code, translation_count),
        )

    def _validate_counts(
        self,
        exploration_id: str,
        opportunity_summary_models: Iterable[
            opportunity_models.ExplorationOpportunitySummaryModel
        ],
        translation_counts: Iterable[Tuple[str, int]],
        exploration_models: Iterable[exp_models.ExplorationModel],
    ) -> Iterable[job_run_result.JobRunResult]:
        """Validates the translation counts for a given exploration.

        Args:
            exploration_id: str. The exploration ID.
            opportunity_summary_models: Iterable[ExplorationOpportunitySummaryModel].
            translation_counts: Iterable[Tuple[language_code, count]]. True counts from EntityTranslationsModel.
            exploration_models: Iterable[ExplorationModel].

        Yields:
            JobRunResult. Results detailing whether counts match or describing the mismatches.
        """
        summary_models = list(opportunity_summary_models)
        actual_translations = list(translation_counts)
        exps = list(exploration_models)

        if not summary_models:
            return

        summary_model = summary_models[0]
        stored_translation_counts = summary_model.translation_counts

        # Convert actual translations to dict
        actual_translation_counts_dict: Dict[str, int] = {}
        for language_code, count in actual_translations:
            actual_translation_counts_dict[language_code] = count

        mismatch_found = False

        # Compare recorded vs actual for each language in record
        for lang_code, stored_count in stored_translation_counts.items():
            actual_count = actual_translation_counts_dict.get(lang_code, 0)
            if stored_count != actual_count:
                mismatch_found = True
                yield job_run_result.JobRunResult.as_stderr(
                    f'Mismatch for exploration {exploration_id} in {lang_code}: '
                    f'stored={stored_count}, actual={actual_count}'
                )

        # Check for languages that have translations but aren't in the opportunity model
        for lang_code, actual_count in actual_translation_counts_dict.items():
            if lang_code not in stored_translation_counts and actual_count > 0:
                mismatch_found = True
                yield job_run_result.JobRunResult.as_stderr(
                    f'Mismatch for exploration {exploration_id} in {lang_code}: '
                    f'stored=0 (missing), actual={actual_count}'
                )

        if not mismatch_found:
            yield job_run_result.JobRunResult.as_stdout(
                f'SUCCESS - Exploration {exploration_id} counts are valid.'
            )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the translation count validation.

        Returns:
            PCollection. A PCollection of JobRunResult objects.
        """
        # Fetch ExplorationOpportunitySummaryModel and key by exploration_id
        opportunity_summary_models = (
            self.pipeline
            | 'Get all ExplorationOpportunitySummaryModels'
            >> ndb_io.GetModels(
                opportunity_models.ExplorationOpportunitySummaryModel.get_all()
            )
            | 'Key Opportunity by exploration_id'
            >> beam.WithKeys(lambda model: model.id)
        )

        # Fetch EntityTranslationsModel for explorations and key by entity_id
        translation_counts = (
            self.pipeline
            | 'Get all Exploration EntityTranslationsModels'
            >> ndb_io.GetModels(
                translation_models.EntityTranslationsModel.query(
                    translation_models.EntityTranslationsModel.entity_type
                    == 'exploration'
                )
            )
            | 'Extract translation counts'
            >> beam.Map(self._get_translation_counts)
        )

        exploration_models = (
            self.pipeline
            | 'Get all ExplorationModels'
            >> ndb_io.GetModels(exp_models.ExplorationModel.get_all())
            | 'Key Exploration by id' >> beam.WithKeys(lambda model: model.id)
        )

        # CoGroupByKey to join the models by exploration_id
        grouped_data = {
            'opportunity_summary': opportunity_summary_models,
            'translation_counts': translation_counts,
            'exploration': exploration_models,
        } | 'Group by exploration_id' >> beam.CoGroupByKey()

        return grouped_data | 'Process and Validate Counts' >> beam.FlatMap(
            lambda kv: self._validate_counts(
                exploration_id=kv[0],
                opportunity_summary_models=kv[1]['opportunity_summary'],
                translation_counts=kv[1]['translation_counts'],
                exploration_models=kv[1]['exploration'],
            )
        )
