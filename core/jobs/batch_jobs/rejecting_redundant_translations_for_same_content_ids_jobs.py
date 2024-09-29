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

"""Jobs for translation suggestions with invalid content IDs."""

from __future__ import annotations

from core import feconf
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

from typing import Dict, Iterable, List, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import suggestion_models
    from mypy_imports import translation_models

(suggestion_models, translation_models) = models.Registry.import_models([
    models.Names.SUGGESTION, models.Names.TRANSLATION])

datastore_services = models.Registry.import_datastore_services()

class RejectTranslationSuggestionsOfTranslatedContentJob(base_jobs.JobBase):
    """Job that rejects translation suggestions in review for the content
    with an accepted translation."""

    @staticmethod
    def _reject_suggestions_in_review_for_content_with_accepted_translation(
        entity_translation_model: translation_models.EntityTranslationsModel
    ) -> List[Dict[str, Union[
        str, int, suggestion_models.GeneralSuggestionModel]]]:
        """Rejects all translation suggestions in review for the content
        with an accepted translation, for an entity translation model.

        Args:
            entity_translation_model: (EntityTranslationsModel). An entity 
            translation model.

        Returns:
            list(GeneralSuggestionModel). A list of rejected suggestions
            for an entity translation model.
        """
        updated_suggestions: List[
            suggestion_models.GeneralSuggestionModel] = []
        content_ids=entity_translation_model.translations.keys()
        suggestions = suggestion_models.GeneralSuggestionModel.get_all(
            include_deleted=False).filter(
                (
                    suggestion_models
                    .GeneralSuggestionModel.suggestion_type
                ) == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
            ).filter(
                suggestion_models.GeneralSuggestionModel.target_id == (
                    entity_translation_model.entity_id
                )
            ).filter(
                suggestion_models.GeneralSuggestionModel.target_version_at_submission == (
                    entity_translation_model.entity_version
                )
            ).filter(
                suggestion_models.GeneralSuggestionModel.status == (
                    suggestion_models.STATUS_IN_REVIEW
                )
            )

        for suggestion in suggestions:
            if suggestion.change_cmd['content_id'] in content_ids:
                suggestion.status = suggestion_models.STATUS_REJECTED
                suggestion.final_reviewer_id = feconf.SUGGESTION_BOT_USER_ID
                updated_suggestions.append(suggestion)

        return updated_suggestions

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of suggestion update results.

        Returns:
            PCollection. A PCollection of the job run results.
        """
        entity_translation_models = _get_entity_translation_models(self.pipeline)
        updated_suggestions = (
            entity_translation_models
            | 'Update suggestion models' >> beam.Map(
                    lambda entity_translation_model: (
                        self._reject_suggestions_in_review_for_content_with_accepted_translation(
                            entity_translation_model)))
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
                updated_suggestions_count_job_run_results
            )
        )


class AuditTranslationSuggestionsOfTranslatedContentJob(base_jobs.JobBase):
    """Audits translation suggestions in review for the content with an
    accepted translation."""

    @staticmethod
    def _get_suggestions_in_review_for_content_with_accepted_translation(
        entity_translation_model: translation_models.EntityTranslationsModel
    ) -> List[Dict[str, Union[
        str, int, suggestion_models.GeneralSuggestionModel]]]:
        """Finds the list of all translation suggestions in review for the 
        content with an accepted translation, for an entity translation model.

        Args:
            entity_translation_model: (EntityTranslationsModel). An entity 
            translation model.

        Returns:
            list(dict(str, union(str, int, GeneralSuggestionModel))).
            A list of dict containing all entity_translation_model_id,
            entity_id, entity_version, content_id and corresponding
            suggestions in review, for an entity translation model.
        """
        suggestion_dicts: List[Dict[str, Union[
            str, int, suggestion_models.GeneralSuggestionModel]]] = []
        content_ids=entity_translation_model.translations.keys()
        suggestions = suggestion_models.GeneralSuggestionModel.get_all(
            include_deleted=False).filter(
                (
                    suggestion_models
                    .GeneralSuggestionModel.suggestion_type
                ) == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
            ).filter(
                suggestion_models.GeneralSuggestionModel.target_id == (
                    entity_translation_model.entity_id
                )
            ).filter(
                suggestion_models.GeneralSuggestionModel.target_version_at_submission == (
                    entity_translation_model.entity_version
                )
            ).filter(
                suggestion_models.GeneralSuggestionModel.status == (
                    suggestion_models.STATUS_IN_REVIEW
                )
            )

        for suggestion in suggestions:
            if suggestion.change_cmd['content_id'] in content_ids:
                suggestion_dicts.append({
                    'entity_id': entity_translation_model.entity_id,
                    'entity_version': entity_translation_model.entity_version,
                    'entity_translation_model_id': entity_translation_model.id,
                    'content_id': suggestion.change_cmd['content_id'],
                    'suggestion': suggestion.id
                })

        return suggestion_dicts

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of audit job run results.

        Returns:
            PCollection. A PCollection of results.
        """
        entity_translation_models = _get_entity_translation_models(self.pipeline)
        suggestion_dicts = (
            entity_translation_models
            | 'Get suggestions list' >> beam.Map(
                    lambda entity_translation_model: (
                        self._get_suggestions_in_review_for_content_with_accepted_translation(
                            entity_translation_model)))
            | 'Flatten suggestions list' >> beam.FlatMap(lambda x: x)
        )

        job_run_results = (
            suggestion_dicts
            | 'Report the obsolete suggestions' >> beam.Map(
                lambda result: (
                    job_run_result.JobRunResult.as_stdout(
                        f'Results are - {result}')))
        )

        suggestions_to_be_rejected_count_job_run_results = (
            suggestion_dicts
            | 'Report the suggestions to be rejected count' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'SUGGESTIONS TO BE REJECTED COUNT'))
        )

        return (
            (
                job_run_results,
                suggestions_to_be_rejected_count_job_run_results
            )
            | 'Combine results' >> beam.Flatten()
        )

def _get_entity_translation_models(
    pipeline: beam.Pipeline
) -> beam.PCollection[translation_models.EntityTranslationsModel]:
    """Returns a PCollection of EntityTranslationsModel.

    Args:
        pipeline: beam.Pipeline. A job pipeline.

    Returns:
        PCollection(EntityTranslationsModel). The PCollection of
        EntityTranslationsModel.
    """
    entity_translation_models = (
        pipeline
        | 'Get all entity translation models' >> ndb_io.GetModels(
            translation_models.EntityTranslationsModel.get_all(
                include_deleted=False))

        # PCollection<entity_id: entity_translation_model>.
        | 'Add entity id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
            lambda model: model.entity_id)
        
        # PCollection<entity_id: list(entity_translation_model)>.
        | 'Group by entity id' >> beam.GroupByKey()

        # PCollection<entity_id: entity_translation_model>.
        | 'Filter entity model with latest entity version' >> beam.MapTuple(  # pylint: disable=no-value-for-parameter
            lambda entity_id, models: (entity_id, max(
                models, key=lambda model: model.entity_version)))
        
        # PCollection<entity_translation_model>.
        | 'Get list of latest entity transaltion model' >> beam.Values()
    )

    return entity_translation_models
