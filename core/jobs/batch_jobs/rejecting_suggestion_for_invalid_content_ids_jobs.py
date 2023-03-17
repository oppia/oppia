# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Jobs for translation suggestions with invalid content IDs."""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

from typing import Dict, Iterable, List, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import suggestion_models

(exp_models, suggestion_models) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.SUGGESTION
])

datastore_services = models.Registry.import_datastore_services()


class RejectTranslationSuggestionsWithMissingContentIdJob(base_jobs.JobBase):
    """Job that rejects translation suggestions with missing content ids."""

    @staticmethod
    def _reject_obsolete_suggestions(
        suggestions: List[suggestion_models.GeneralSuggestionModel],
        exploration: exp_domain.Exploration
    ) -> List[suggestion_models.GeneralSuggestionModel]:
        """Marks translation suggestion models as 'rejected' if the content ID
        for the suggestion no longer exists. The final_reviewer_id will be set
        to feconf.SUGGESTION_BOT_USER_ID.

        Args:
            suggestions: list(GeneralSuggestionModel). A list of translation
                suggestion models corresponding to the given exploration.
            exploration: Exploration. The exploration domain object
                associated with the suggestions.

        Returns:
            list(GeneralSuggestionModel). List of updated suggestion models.
        """
        translatable_content_ids = exploration.get_translatable_content_ids()
        updated_suggestions = []
        for suggestion in suggestions:
            if suggestion.change_cmd['content_id'] in translatable_content_ids:
                continue
            suggestion.status = suggestion_models.STATUS_REJECTED
            suggestion.final_reviewer_id = feconf.SUGGESTION_BOT_USER_ID
            updated_suggestions.append(suggestion)
        return updated_suggestions

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of suggestion update results.

        Returns:
            PCollection. A PCollection of the job run results.
        """
        suggestion_dicts = _get_suggestion_dicts(self.pipeline)
        total_processed_suggestions_count_job_run_results = (
            suggestion_dicts
            | 'Get suggestions' >> beam.FlatMap(
                lambda suggestions_dict: suggestions_dict['suggestions']
            )
            | 'Total processed suggestion count' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL PROCESSED SUGGESTIONS COUNT'))
        )

        updated_suggestions = (
            suggestion_dicts
            | 'Update suggestion models' >> beam.Map(
                lambda suggestions_dict: self._reject_obsolete_suggestions(
                    suggestions_dict['suggestions'],
                    suggestions_dict['exploration'])
                )
            | 'Flatten suggestion models' >> beam.FlatMap(lambda x: x)
        )

        updated_suggestions_count_job_run_results = (
            updated_suggestions
            | 'Rejected translation suggestion count' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'REJECTED SUGGESTIONS COUNT'))
        )

        unused_put_results = (
            updated_suggestions
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            (
                total_processed_suggestions_count_job_run_results,
                updated_suggestions_count_job_run_results
            )
            | 'Combine results' >> beam.Flatten()
        )


class AuditTranslationSuggestionsWithMissingContentIdJob(base_jobs.JobBase):
    """Audits translation suggestions for missing content IDs."""

    @staticmethod
    def _report_suggestions_with_missing_content_ids(
        suggestions: List[suggestion_models.GeneralSuggestionModel],
        exploration: exp_domain.Exploration
    ) -> List[Dict[str, Union[str, List[Dict[str, str]]]]]:
        """Audits translation suggestion models for missing content IDs. Reports
        the following for each exploration:
            - exploration ID
            - list of missing content IDs and corresponding state names.

        Args:
            suggestions: list(GeneralSuggestionModel). A list of translation
                suggestion models corresponding to the given exploration.
            exploration: Exploration. The corresponding exploration domain
                object.

        Returns:
            list(dict). Audit report result.
        """
        obsolete_content = []
        obsolete_translation_suggestion_error_report: List[
            Dict[str, Union[
                # Exploration ID.
                str,
                # Obsolete content dict.
                List[Dict[str, str]]
            ]]
        ] = []

        translatable_content_ids = exploration.get_translatable_content_ids()
        for suggestion in suggestions:
            suggestion_change = suggestion.change_cmd
            if not suggestion_change['content_id'] in translatable_content_ids:
                obsolete_content.append(
                    {
                        'content_id': suggestion_change['content_id'],
                        'state_name': suggestion_change['state_name']
                    }
                )

        obsolete_translation_suggestion_error_report.append(
            {
                'exp_id': exploration.id,
                'obsolete_content': obsolete_content,
            }
        )

        return obsolete_translation_suggestion_error_report

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of audit job run results.

        Returns:
            PCollection. A PCollection of results.
        """
        suggestion_dicts = _get_suggestion_dicts(self.pipeline)
        total_processed_suggestions_count_job_run_results = (
            suggestion_dicts
            | 'Get suggestions' >> beam.FlatMap(
                lambda suggestions_dict: suggestions_dict['suggestions']
            )
            | 'Total processed suggestion count' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL PROCESSED SUGGESTIONS COUNT'))
        )

        suggestion_results = (
            suggestion_dicts
            | 'Report obsolete suggestions' >> beam.Map(
                lambda suggestions_dict: (
                    self._report_suggestions_with_missing_content_ids(
                        suggestions_dict['suggestions'],
                        suggestions_dict['exploration']
                    )
                ))
            | 'Flatten reports' >> beam.FlatMap(lambda x: x)
            | 'Filter out reports with no obsolete suggestions' >> (
                beam.Filter(
                    lambda report: len(report['obsolete_content']) > 0))
        )

        job_run_results = (
            suggestion_results
            | 'Report the obsolete suggestions' >> beam.Map(
                lambda result: (
                    job_run_result.JobRunResult.as_stdout(
                        f'Results are - {result}'
                    )
                )
            )
        )

        obsolete_suggestions_count_job_run_results = (
            suggestion_results
            | 'Flatten obsolete suggestions' >> (
                beam.FlatMap(lambda report: report['obsolete_content']))
            | 'Report the obsolete suggestions count' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'OBSOLETE SUGGESTIONS COUNT')
            )
        )

        return (
            (
                job_run_results,
                total_processed_suggestions_count_job_run_results,
                obsolete_suggestions_count_job_run_results
            )
            | 'Combine results' >> beam.Flatten()
        )


def _get_suggestion_dicts(
    pipeline: beam.Pipeline
) -> beam.PCollection[Dict[str, Iterable[str]]]:
    """Returns a PCollection of dicts where each dict corresponds to a unique
    exploration ID and the following key-value pairs:
        - suggestions: Iterable of translation suggestion models corresponding
            to the exploration ID.
        - exploration: The corresponding exploration domain object.

    Args:
        pipeline: beam.Pipeline. A job pipeline.

    Returns:
        PCollection(dict(str, Iterable(str)). The PCollection of dicts.
    """
    target_id_to_suggestion_model = (
        pipeline
        | 'Get translation suggestion models in review' >> ndb_io.GetModels(
            suggestion_models.GeneralSuggestionModel.get_all(
                include_deleted=False).filter(
                    (
                        suggestion_models
                        .GeneralSuggestionModel.suggestion_type
                    ) == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                ).filter(
                    suggestion_models.GeneralSuggestionModel.status == (
                        suggestion_models.STATUS_IN_REVIEW
                    )
                )
        )
        # PCollection<exp_id: suggestion>.
        | 'Add target id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
            lambda model: model.target_id)
    )

    exp_id_to_exploration = (
        pipeline
        | 'Get all exploration models' >> ndb_io.GetModels(
            exp_models.ExplorationModel.get_all())
        | 'Map exploration model to domain class' >> beam.Map(
            exp_fetchers.get_exploration_from_model)
        # PCollection<exp_id: exploration>.
        | 'Key explorations by ID' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
            lambda exploration: exploration.id)
    )

    suggestion_dicts = (
        {
            'suggestions': target_id_to_suggestion_model,
            'explorations': exp_id_to_exploration
        }
        # PCollection<exp_id: {
        #   suggestions: [suggestions],
        #   exploration: [exploration]
        # }>.
        | 'Group by exploration ID' >> beam.CoGroupByKey()
        | 'Remove keys' >> beam.Values() # pylint: disable=no-value-for-parameter
        | 'Filter out explorations with no suggestions' >> beam.Filter(
            lambda exp_id_dict: len(exp_id_dict['suggestions']) != 0)
        | 'Get single exploration for exploration key' >> beam.Map(
            lambda suggestions_dict: {
                'suggestions': suggestions_dict['suggestions'],
                # There should only be 1 exploration per exp_id.
                'exploration': suggestions_dict['explorations'][0]
            })
    )

    return suggestion_dicts
