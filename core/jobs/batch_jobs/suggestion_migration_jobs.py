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

"""Jobs that migrate suggestion models."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import state_domain
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.platform import models

import apache_beam as beam
import result

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import suggestion_models

(exp_models, suggestion_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.suggestion])

datastore_services = models.Registry.import_datastore_services()


class RegenerateContentIdForTranslationSuggestionsInReviewJob(
    base_jobs.JobBase
):
    """Regenerate content_id field for suggestions in review."""

    @staticmethod
    def _update_content_id_in_translation_suggestion(
        suggestion, exp_id_to_content_id_mapping
    ):
        """Updates content id in translation suggestion.

        Args:
            suggestion: Suggestion. The suggestion to update.
            exp_id_to_content_id_mapping: Dict. The mapping of exploration id
                to the content id mapping.

        Returns:
            Result((str, Suggestion), (str, Exception)). Result containing
            tuple consists of suggestion ID and either suggestion object or
            Exception. Suggestion object is returned when the migration was
            successful and Exception is returned otherwise.
        """
        if suggestion.target_id not in exp_id_to_content_id_mapping:
            return result.Err(
                (suggestion.suggestion_id, 'Exploration ID is invalid')
            )
        old_to_new_content_id_mapping = (
            exp_id_to_content_id_mapping[suggestion.target_id]
        )

        suggestion_content_id = suggestion.change.new_value['content_id']
        old_to_new_content_ids_in_state = old_to_new_content_id_mapping[
            suggestion.change.state_name
        ]
        if suggestion_content_id not in old_to_new_content_ids_in_state:
            return result.Err(
                (
                    suggestion.suggestion_id,
                    'Content ID %s does not exist in the exploration'
                    % suggestion_content_id
                )
            )
        suggestion.change.new_value['content_id'] = (
            old_to_new_content_ids_in_state[
                suggestion_content_id
            ]
        )
        return result.Ok((suggestion.suggestion_id, suggestion))

    @staticmethod
    def _get_old_content_id_to_new_content_id_mapping(exploration):
        """Returns the mapping of old content id to new content id.

        Args:
            exploration: Exploration. The exploration.

        Returns:
            Tuple(str, Dict). Consists of a Tuple where the first element is
                the exploration id and the second element being the mapping
                of old content ids to new content ids.
        """
        states_dict = {}
        for state_name in exploration.states:
            states_dict[state_name] = exploration.states[state_name]
        (old_content_id_to_new_content_id, _) = (
            state_domain.State
            .generate_old_content_id_to_new_content_id_in_v52_states(
                states_dict))
        return (exploration.id, old_content_id_to_new_content_id)

    @staticmethod
    def _update_suggestion(
        suggestion_model: suggestion_models.GeneralSuggestionModel,
        migrated_suggestion: suggestion_registry.BaseSuggestion,
    ):
        """Updates the suggestion model with the new content id.

        Args:
            suggestion_model: GeneralSuggestionModel. The suggestion model.
            migrated_suggestion: Suggestion. The suggestion domain object.

        Returns:
            list(suggestion_model). List of suggestion models to update.
        """
        suggestion_model.change_cmd = migrated_suggestion.change.to_dict()
        datastore_services.update_timestamps_multi([suggestion_model])
        return [suggestion_model]

    def run(self):
        unmigrated_translation_suggestion_models = (
            self.pipeline
            | 'Get all GeneralSuggestionModels' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False))
            | 'Filter translation suggestions in review' >> (
                beam.Filter(
                    lambda model: (
                        model.suggestion_type ==
                        feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                        and model.status == suggestion_models.STATUS_IN_REVIEW
                    ),
                ))
        )

        explorations = (
            self.pipeline
            | 'Get all exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(
                    include_deleted=False))
            | 'Fetch old to new content id mapping' >> beam.Map(
                self._get_old_content_id_to_new_content_id_mapping)
        )
        exp_id_to_content_id_mapping = beam.pvalue.AsDict(explorations)

        migrated_suggestion_results = (
            unmigrated_translation_suggestion_models
            | 'Transform to suggestion domain object' >> beam.Map(
                suggestion_services.get_suggestion_from_model)
            | 'Transform and migrate model' >> beam.Map(
                self._update_content_id_in_translation_suggestion,
                exp_id_to_content_id_mapping=exp_id_to_content_id_mapping)
        )
        migrated_suggestions = (
            migrated_suggestion_results
            | 'Filter oks' >> beam.Filter(
                lambda result_item: result_item.is_ok())
            | 'Unwrap ok' >> beam.Map(
                lambda result_item: result_item.unwrap())
        )
        migrated_suggestion_job_run_results = (
            migrated_suggestion_results
            | 'Generate results for migration' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'SUGGESTION PROCESSED'))
        )

        unmigrated_translation_suggestion_models_with_ids = (
            unmigrated_translation_suggestion_models
            | 'Add keys to unmigrated models' >> beam.WithKeys( # pylint: disable=no-value-for-parameter
                lambda suggestion_model: suggestion_model.id)
        )

        suggestion_objects_list = (
            {
                'suggestion_model': (
                    unmigrated_translation_suggestion_models_with_ids
                ),
                'suggestion': migrated_suggestions,
            }
            | 'Merge objects' >> beam.CoGroupByKey()
            | 'Get rid of ID' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Reorganize the suggestion objects' >> beam.Map(lambda objects: {
                'suggestion_model': objects['suggestion_model'][0],
                'suggestion': objects['suggestion'][0]
            })
        )

        suggestion_objects_list_job_run_results = (
            suggestion_objects_list
            | 'Transform suggestion objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'SUGGESTION MIGRATED'))
        )

        suggestion_models_to_put = (
            suggestion_objects_list
            | 'Generate suggestion models to put' >> beam.FlatMap(
                lambda suggestion_objects: self._update_suggestion(
                    suggestion_objects['suggestion_model'],
                    suggestion_objects['suggestion']
                ))
        )

        unused_put_results = (
            suggestion_models_to_put
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            (
                migrated_suggestion_job_run_results,
                suggestion_objects_list_job_run_results
            )
            | beam.Flatten()
        )


class MigrateQuestionSuggestionsJob(base_jobs.JobBase):
    """Migrate question dict in question suggestion to latest schema."""
    @staticmethod
    def _migrate_question_dict(question_suggestion_model):
        """
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

            if next_content_id_index is not None:
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

    def run(self):
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

        already_migrated_suggestions = (
            question_suggestions
            | 'Filter already migrated suggestions' >> beam.Filter(
                lambda model: (
                    model.change_cmd['question_dict'][
                        'question_state_data_schema_version'] == (
                            feconf.CURRENT_STATE_SCHEMA_VERSION)
                ))
        )

        already_migrated_job_run_results = (
            already_migrated_suggestions
            | 'Transform suggestions into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'ALREADY MIGRATED'))
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

        unused_put_results = (
            migrated_suggestions
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            (
                already_migrated_job_run_results,
                migrated_exp_job_run_results
            )
            | beam.Flatten()
        )
