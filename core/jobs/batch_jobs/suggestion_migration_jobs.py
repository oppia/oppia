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

"""Jobs that migrate suggestion models."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import state_domain
from core.domain import suggestion_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import List, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import suggestion_models

(exp_models, suggestion_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.SUGGESTION])

datastore_services = models.Registry.import_datastore_services()


class RegenerateContentIdForTranslationSuggestionsInReviewJob(
    base_jobs.JobBase
):
    """Regenerate content_id field for suggestions in review."""

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def _update_content_id_in_translation_suggestions(
        suggestions: List[suggestion_models.GeneralSuggestionModel],
        exp_model: exp_models.ExplorationModel
    ) -> List[result.Result[
        suggestion_models.GeneralSuggestionModel,
        Tuple[str, Exception]
    ]]:
        """Updates content id in translation suggestion.

        Args:
            suggestions: list(GeneralSuggestionModel). A list of translation
                suggestion models corresponding to the given exploration.
            exp_model: ExplorationModel. The exploration model.

        Returns:
            Result(list(GeneralSuggestionModel), (str, Exception)). Result
            containing list of migrated suggestion models or Exception.
            Suggestion models are returned when the migration is
            successful and Exception is returned otherwise.
        """
        old_to_new_content_id_mapping, _ = (
            state_domain.State
            .generate_old_content_id_to_new_content_id_in_v54_states(
                exp_model.states
            )
        )

        results = []
        for suggestion in suggestions:
            suggestion_content_id = suggestion.change_cmd['content_id']
            state_name = suggestion.change_cmd['state_name']

            if not state_name in old_to_new_content_id_mapping:
                results.append(result.Err((
                    suggestion.id,
                    'State name %s does not exist in the exploration'
                    % state_name)))
                continue

            old_to_new_content_id_in_state = old_to_new_content_id_mapping[
                state_name]
            if suggestion_content_id not in old_to_new_content_id_in_state:
                results.append(result.Err(
                    (
                        suggestion.id,
                        'Content ID %s does not exist in the exploration'
                        % suggestion_content_id
                    )
                ))
                continue

            suggestion.change_cmd['content_id'] = (
                old_to_new_content_id_in_state[suggestion_content_id])
            results.append(result.Ok(suggestion))

        return results

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the suggestion migration.

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

        migrated_suggestion_results = (
            {
                'suggestion_models': target_id_to_suggestion_models,
                'exploration_model': exploration_models
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values() # pylint: disable=no-value-for-parameter
            | 'Filter unwanted exploration' >> beam.Filter(
                lambda objects: len(objects['suggestion_models']) != 0)
            | 'Transform and migrate model' >> beam.Map(
                lambda objects: (
                    self._update_content_id_in_translation_suggestions(
                        objects['suggestion_models'][0],
                        objects['exploration_model'][0]
                    )
                ))
            | 'Flatten results' >> beam.FlatMap(lambda x: x)
        )

        migrated_suggestion_models = (
            migrated_suggestion_results
            | 'Filter oks' >> beam.Filter(lambda item: item.is_ok())
            | 'Unwrap ok' >> beam.Map(lambda item: item.unwrap())
        )

        migrated_suggestion_job_run_results = (
            migrated_suggestion_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'SUGGESTION TARGET PROCESSED'))
        )

        migrated_suggestions_count_job_run_results = (
            migrated_suggestion_models
            | 'Transform suggestion objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'SUGGESTION MIGRATED'))
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                migrated_suggestion_models
                | 'Put models into the datastore' >> ndb_io.PutModels()
            )

        return (
            (
                migrated_suggestion_job_run_results,
                migrated_suggestions_count_job_run_results
            )
            | beam.Flatten()
        )


class AuditRegenerateContentIdForTranslationSuggestionsInReviewJob(
    RegenerateContentIdForTranslationSuggestionsInReviewJob
):
    """Audit RegenerateContentIdForTranslationSuggestionsInReviewJob."""

    DATASTORE_UPDATES_ALLOWED = False


class MigrateQuestionSuggestionsJob(base_jobs.JobBase):
    """Migrate question dict in question suggestion to the latest schema."""

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def _migrate_question_dict(
        question_suggestion_model: suggestion_models.GeneralSuggestionModel
    ) -> result.Result[
        suggestion_models.GeneralSuggestionModel,
        Tuple[str, Exception]
    ]:
        """Migrates question dict in the question suggestion model to the latest
        schema.
        """
        question_dict = question_suggestion_model.change_cmd['question_dict']
        versioned_question_state: question_domain.VersionedQuestionStateDict = {
            'state': question_dict['question_state_data'],
            'state_schema_version': question_dict[
                'question_state_data_schema_version']
        }

        try:
            next_content_id_index = question_fetchers.migrate_state_schema(
                versioned_question_state)

            question_dict['next_content_id_index'] = next_content_id_index
            question_dict['question_state_data_schema_version'] = (
                versioned_question_state['state_schema_version'])

            suggestion = suggestion_services.get_suggestion_from_model(
                question_suggestion_model)
            suggestion.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((question_suggestion_model.id, e))

        return result.Ok(question_suggestion_model)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        question_suggestions = (
            self.pipeline
            | 'Get all GeneralSuggestionModels' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False))
            | 'Filter question suggestions' >> (
                beam.Filter(
                    lambda model: (
                        model.suggestion_type ==
                        feconf.SUGGESTION_TYPE_ADD_QUESTION
                        and model.status == suggestion_models.STATUS_IN_REVIEW
                    ),
                ))
        )

        models_count_job_run_results = (
            question_suggestions
            | 'Transform suggestions into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'QUESTION MODELS COUNT'))
        )

        migrate_suggestion_results = (
            question_suggestions
            | 'Filter suggestions required migration' >> beam.Filter(
                lambda model: (
                    model.change_cmd['question_dict'][
                        'question_state_data_schema_version'] != (
                            feconf.CURRENT_STATE_SCHEMA_VERSION)
                ))
            | 'Migrate question_dict in change field' >> beam.Map(
                self._migrate_question_dict
            )
        )

        migrated_suggestions = (
            migrate_suggestion_results
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )

        migrated_exp_job_run_results = (
            migrate_suggestion_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'SUGGESTION MIGRATED'))
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                migrated_suggestions
                | 'Put models into the datastore' >> ndb_io.PutModels()
            )

        return (
            (
                models_count_job_run_results,
                migrated_exp_job_run_results
            )
            | beam.Flatten()
        )


class AuditMigrateQuestionSuggestionsJob(MigrateQuestionSuggestionsJob):
    """Audit MigrateQuestionSuggestionsJob."""

    DATASTORE_UPDATES_ALLOWED = False
