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
    from mypy_imports import opportunity_models, translation_models

(opportunity_models, translation_models) = models.Registry.import_models(
    [
        models.Names.OPPORTUNITY,
        models.Names.TRANSLATION,
    ]
)


class ValidateExplorationOpportunityCountsJob(base_jobs.JobBase):
    """Job that validates translation_counts in
    ExplorationOpportunitySummaryModel.

    This job computes the true translation counts by looking at
    EntityTranslationsModel and compares it to the translation_counts
    recorded in ExplorationOpportunitySummaryModel. It returns SUCCESS
    if all counts match, and logs the mismatches otherwise.
    """

    def _get_translation_counts(
        self, translation_model: translation_models.EntityTranslationsModel
    ) -> Tuple[str, Tuple[str, int]]:
        """Extracts translation counts from an EntityTranslationsModel.

        Args:
            translation_model: EntityTranslationsModel. The model
                to extract counts from.

        Returns:
            tuple(str, tuple(str, int)). A tuple of
            (exploration_id, (language_code, translation_count)).
        """
        translation_count = len(translation_model.translations)
        return (
            translation_model.entity_id,
            (translation_model.language_code, translation_count),
        )

    def _validate_counts(
        self,
        exploration_id: str,
        opportunity_summary_models_list: Iterable[
            opportunity_models.ExplorationOpportunitySummaryModel
        ],
        translation_counts_list: Iterable[Tuple[str, int]],
    ) -> Iterable[job_run_result.JobRunResult]:
        """Validates the translation counts for a given exploration.

        Args:
            exploration_id: str. The exploration ID.
            opportunity_summary_models_list:
                list(ExplorationOpportunitySummaryModel). The list
                of opportunity summary models for the exploration.
            translation_counts_list: list(tuple(str, int)). True
                counts from EntityTranslationsModel.

        Yields:
            JobRunResult. Results detailing whether counts match or
            describing the mismatches.
        """
        summary_models = list(opportunity_summary_models_list)
        actual_translations = list(translation_counts_list)

        if not summary_models:
            return

        summary_model = summary_models[0]
        stored_translation_counts = summary_model.translation_counts

        actual_translation_counts_dict: Dict[str, int] = {}
        for language_code, count in actual_translations:
            actual_translation_counts_dict[language_code] = count

        mismatch_found = False

        for lang_code, stored_count in stored_translation_counts.items():
            actual_count = actual_translation_counts_dict.get(lang_code, 0)
            if stored_count != actual_count:
                mismatch_found = True
                yield job_run_result.JobRunResult.as_stderr(
                    'Mismatch for exploration %s in %s: '
                    'stored=%s, actual=%s'
                    % (exploration_id, lang_code, stored_count, actual_count)
                )

        for lang_code, actual_count in actual_translation_counts_dict.items():
            if lang_code not in stored_translation_counts and actual_count > 0:
                mismatch_found = True
                yield job_run_result.JobRunResult.as_stderr(
                    'Mismatch for exploration %s in %s: '
                    'stored=0 (missing), actual=%s'
                    % (exploration_id, lang_code, actual_count)
                )

        if not mismatch_found:
            yield job_run_result.JobRunResult.as_stdout(
                'SUCCESS - Exploration %s counts are valid.' % exploration_id
            )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the translation
        count validation.

        Returns:
            PCollection. A PCollection of JobRunResult objects.
        """
        opportunity_summaries = (
            self.pipeline
            | 'Get all ExplorationOpportunitySummaryModels'
            >> ndb_io.GetModels(
                opportunity_models.ExplorationOpportunitySummaryModel.get_all()
            )
            | 'Key Opportunity by exploration_id'
            >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.id
            )
        )

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

        grouped_data = {
            'opportunity_summary': opportunity_summaries,
            'translation_counts': translation_counts,
        } | 'Group by exploration_id' >> beam.CoGroupByKey()

        return grouped_data | 'Process and Validate Counts' >> beam.FlatMap(
            lambda kv: self._validate_counts(
                exploration_id=kv[0],
                opportunity_summary_models_list=(kv[1]['opportunity_summary']),
                translation_counts_list=kv[1]['translation_counts'],
            )
        )
