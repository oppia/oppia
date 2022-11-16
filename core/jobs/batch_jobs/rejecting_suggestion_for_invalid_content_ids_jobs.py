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

"""Rejecting suggestions whose content_id no longer exists and
updating the translation content.
"""

from __future__ import annotations

from core import feconf
from core.domain import exp_domain
from core.domain import html_cleaner
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

from typing import Dict, List, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import suggestion_models

(exp_models, suggestion_models) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.SUGGESTION
])

datastore_services = models.Registry.import_datastore_services()


class RejectSuggestionWithMissingContentIdMigrationJob(base_jobs.JobBase):
    """Job that rejects the suggestions for missing content ids and
    updates the RTE content.
    """

    @staticmethod
    def _update_suggestion_model(
        suggestions: List[suggestion_models.GeneralSuggestionModel],
        exp_model: exp_models.ExplorationModel
    ) -> List[suggestion_models.GeneralSuggestionModel]:
        """Updates the translation suggestion. The translation whose
        content_id no longer exists, the suggestion status will be marked
        as `rejected`. The RTE content of the suggestion will be updated
        in case invalid data is present.

        Args:
            suggestions: list(GeneralSuggestionModel). A list of translation
                suggestion models corresponding to the given exploration.
            exp_model: ExplorationModel. The exploration model.

        Returns:
            suggestions. List[GeneralSuggestionModel]. Result containing the
            list of updated suggestion models.
        """
        total_content_ids = []
        for state in exp_model.states.values():
            written_translations = (
                state['written_translations']['translations_mapping'])
            for content_id, _ in written_translations.items():
                total_content_ids.append(content_id)

        for suggestion in suggestions:
            suggestion_change = suggestion.change_cmd
            if not suggestion_change['content_id'] in total_content_ids:
                suggestion.status = suggestion_models.STATUS_REJECTED

            translation_html = suggestion_change['translation_html']
            resulting_translation = []
            if isinstance(translation_html, list):
                for translation in translation_html:
                    resulting_translation.append(
                        exp_domain.Exploration.fix_content(translation)
                    )
                suggestion_change['translation_html'] = (
                    [data for data in resulting_translation
                    if not html_cleaner.is_html_empty(data)])

            else:
                suggestion_change['translation_html'] = (
                    exp_domain.Exploration.fix_content(translation_html))

        return suggestions

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the suggestion updation.

        Returns:
            PCollection. A PCollection of results from the suggestion
            migration.
        """
        target_id_to_suggestion_models = (
            self.pipeline
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
            | 'Add target id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.target_id)
            | 'Group exploration suggestions' >> beam.GroupByKey()
        )

        exploration_models = (
            self.pipeline
            | 'Get all exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
            | 'Add exploration id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.id)
        )

        updated_suggestion_results = (
            {
                'suggestions': target_id_to_suggestion_models,
                'exploration': exploration_models
            }
            | 'Merge models' >> beam.CoGroupByKey()
            | 'Remove keys' >> beam.Values() # pylint: disable=no-value-for-parameter
            | 'Filter unwanted exploration' >> beam.Filter(
                lambda objects: len(objects['suggestions']) != 0)
            | 'Transform and migrate model' >> beam.Map(
                lambda objects: (
                    self._update_suggestion_model(
                        objects['suggestions'][0],
                        objects['exploration'][0]
                    )
                ))
            | 'Flatten suggestion models' >> beam.FlatMap(lambda x: x)
        )

        updated_suggestions_count_job_run_results = (
            updated_suggestion_results
            | 'Transform suggestion objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'SUGGESTION ITERATED'))
        )

        unused_put_results = (
            updated_suggestion_results
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return updated_suggestions_count_job_run_results


class AuditRejectSuggestionWithMissingContentIdMigrationJob(base_jobs.JobBase):
    """Audits the suggestions and returns the results."""

    @staticmethod
    def _report_errors_from_suggestion_models(
        suggestions: List[suggestion_models.GeneralSuggestionModel],
        exp_model: exp_models.ExplorationModel
    ) -> List[Dict[str, Union[str, List[Dict[str, Union[List[str], str]]]]]]:
        """Audits the translation suggestion. Reports the following
        - The info related to suggestion in case the content id is missing
        - Before and after content of the translation_html.

        Args:
            suggestions: list(GeneralSuggestionModel). A list of translation
                suggestion models corresponding to the given exploration.
            exp_model: ExplorationModel. The exploration model.

        Returns:
            result_after_migrations. list(dict). Result containing the info
            of missing content id and the translation before and after
            migration.
        """
        info_for_missing_content_id = []
        info_for_content_updation = []
        result_after_migrations: (
            List[Dict[str, Union[str, List[Dict[str,
            Union[List[str], str]]]]]]) = []
        total_content_ids = []

        for state in exp_model.states.values():
            written_translations = (
                state['written_translations']['translations_mapping'])
            for content_id, _ in written_translations.items():
                total_content_ids.append(content_id)

        for suggestion in suggestions:
            suggestion_change = suggestion.change_cmd
            if not suggestion_change['content_id'] in total_content_ids:
                info_for_missing_content_id.append(
                    {
                        'content_id': suggestion_change['content_id'],
                        'state_name': suggestion_change['state_name']
                    }
                )

            html_before: Union[List[str], str] = suggestion_change[
                'translation_html']
            if isinstance(html_before, list):
                # Ruling out the possibility of different types for
                # mypy type checking.
                assert isinstance(html_before, list)
                html_after: Union[List[str], str] = []
                assert isinstance(html_after, list)
                for translation in html_before:
                    html_after.append(
                        exp_domain.Exploration.fix_content(translation)
                    )

                html_after = (
                    [data for data in html_after
                    if not html_cleaner.is_html_empty(data)])

            else:
                # Ruling out the possibility of different types for mypy
                # type checking.
                assert isinstance(html_before, str)
                html_after = exp_domain.Exploration.fix_content(
                    html_before)
                assert isinstance(html_after, str)

            info_for_content_updation.append(
                {
                    'content_before': html_before,
                    'content_after': html_after
                }
            )
            suggestion_change['translation_html'] = html_after

        result_after_migrations.append(
            {
                'exp_id': exp_model.id,
                'missing_content_ids': info_for_missing_content_id,
                'content_translation': info_for_content_updation
            }
        )

        return result_after_migrations

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the suggestion updation.

        Returns:
            PCollection. A PCollection of results from the suggestion
            migration.
        """
        target_id_to_suggestion_models = (
            self.pipeline
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
            | 'Add target id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.target_id)
            | 'Group exploration suggestions' >> beam.GroupByKey()
        )

        exploration_models = (
            self.pipeline
            | 'Get all exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
            | 'Add exploration id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.id)
        )

        suggestion_results = (
            {
                'suggestions': target_id_to_suggestion_models,
                'exploration': exploration_models
            }
            | 'Merge models' >> beam.CoGroupByKey()
            | 'Remove keys' >> beam.Values() # pylint: disable=no-value-for-parameter
            | 'Filter unwanted exploration' >> beam.Filter(
                lambda objects: len(objects['suggestions']) != 0)
            | 'Transform and migrate model' >> beam.Map(
                lambda objects: (
                    self._report_errors_from_suggestion_models(
                        objects['suggestions'][0],
                        objects['exploration'][0]
                    )
                ))
            | 'Flatten suggestion models' >> beam.FlatMap(lambda x: x)
        )

        report_suggestions = (
            suggestion_results
            | 'Report the suggestions data' >> beam.Map(
                lambda result: (
                    job_run_result.JobRunResult.as_stdout(
                        f'Results are - {result}'
                    )
                )
            )
        )

        report_count_suggestion = (
            suggestion_results
            | 'Report count for suggestions' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'GROUP OF SUGGESTION PER EXP')
            )
        )

        return (
            (
                report_suggestions,
                report_count_suggestion
            )
            | 'Combine results' >> beam.Flatten()
        )
