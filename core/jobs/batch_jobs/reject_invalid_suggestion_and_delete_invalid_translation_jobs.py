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

"""Jobs for rejecting translation suggestions for already translated
content and deleting translations for invalid content ID."""

from __future__ import annotations

from core import feconf
from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, List, Optional, Tuple, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models
    from mypy_imports import translation_models

(
    exp_models,
    opportunity_models,
    suggestion_models,
    translation_models) = models.Registry.import_models([
        models.Names.EXPLORATION,
        models.Names.OPPORTUNITY,
        models.Names.SUGGESTION,
        models.Names.TRANSLATION])

datastore_services = models.Registry.import_datastore_services()


class RejectTranslationSuggestionsForTranslatedContentsJob(base_jobs.JobBase):
    """Job that rejects translation suggestions in review for the content
    with an accepted translation."""

    @staticmethod
    def _reject_suggestions_in_review_for_translated_contents(
        entity_translation_model: translation_models.EntityTranslationsModel
    ) -> List[suggestion_models.GeneralSuggestionModel]:
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
        content_ids = []
        for content_id in entity_translation_model.translations.keys():
            if entity_translation_model.translations[content_id][
                'needs_update'] is False:
                content_ids.append(content_id)

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
                suggestion_models.GeneralSuggestionModel
                .target_version_at_submission == (
                    entity_translation_model.entity_version
                )
            ).filter(
                suggestion_models.GeneralSuggestionModel
                .language_code == (
                    entity_translation_model.language_code
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
        entity_translation_models = _get_entity_translation_models(
            self.pipeline)
        updated_suggestions = (
            entity_translation_models
            | 'Update translation suggestion models' >> beam.Map(
                    self._reject_suggestions_in_review_for_translated_contents)
            | 'Flatten the list' >> beam.FlatMap(lambda x: x)
        )

        updated_suggestions_count_job_run_results = (
            updated_suggestions
            | 'Updated translation suggestion models count' >> (
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


class AuditTranslationSuggestionsForTranslatedContentsJob(base_jobs.JobBase):
    """Audits translation suggestions in review for the content with an
    accepted translation."""

    @staticmethod
    def _get_suggestions_in_review_for_translated_contents(
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
        content_ids = []
        for content_id in entity_translation_model.translations.keys():
            if entity_translation_model.translations[content_id][
                'needs_update'] is False:
                content_ids.append(content_id)

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
                suggestion_models.GeneralSuggestionModel
                .target_version_at_submission == (
                    entity_translation_model.entity_version
                )
            ).filter(
                suggestion_models.GeneralSuggestionModel
                .language_code == (
                    entity_translation_model.language_code
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
                    'suggestion_id': suggestion.id
                })

        return suggestion_dicts

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of audit job run results.

        Returns:
            PCollection. A PCollection of results.
        """
        entity_translation_models = _get_entity_translation_models(
            self.pipeline)
        suggestion_dicts = (
            entity_translation_models
            | 'Get suggestions to be rejected list' >> beam.Map(
                    self._get_suggestions_in_review_for_translated_contents)
            | 'Flatten the list' >> beam.FlatMap(lambda x: x)
        )

        job_run_results = (
            suggestion_dicts
            | 'Report the suggestions to be rejected' >> beam.Map(
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


class DeleteTranslationsForInvalidContentIDsJob(base_jobs.JobBase):
    """Job that deletes translations for invalid content id."""

    @staticmethod
    def _delete_translations_with_invalid_content_ids(
        entity_translation_model: translation_models.EntityTranslationsModel
    ) -> Optional[
            Dict[str, Union[
                translation_models.EntityTranslationsModel, int]]]:
        """Delete all invalid content ids for an entity translation model.

        Args:
            entity_translation_model: (EntityTranslationsModel). An entity 
                translation model.

        Returns:
            optional(dict(Union(EntityTranslationsModel, int)). An
            dict containing updated entity translation model and number on
            deleted translations from it, if any.
        """
        exp_model = exp_models.ExplorationModel.get(
                entity_translation_model.entity_id,
                strict=True,
                version=entity_translation_model.entity_version)
        exp = exp_fetchers.get_exploration_from_model(exp_model)

        exp_content_ids = exp.get_translatable_content_ids()
        translated_content_ids = list(
            entity_translation_model.translations.keys())

        deleted_translations_count = 0
        is_updated = False
        for content_id in translated_content_ids:
            if content_id not in exp_content_ids:
                entity_translation_model.translations.pop(content_id)
                deleted_translations_count += 1
                is_updated = True

        if is_updated:
            result: Dict[str, Union[
                translation_models.EntityTranslationsModel, int]] = {
                'entity_translation_model': entity_translation_model,
                'deleted_translations_count': deleted_translations_count
            }
            return result
        return None

    @staticmethod
    def _compute_updated_exp_opportunity_model(
        entity_translation_model: translation_models.EntityTranslationsModel
    ) -> opportunity_models.ExplorationOpportunitySummaryModel:
        """Compute exploration opportunity model with updated translation
        count for an updated entity translation model.

        Args:
            entity_translation_model: (EntityTranslationsModel). An entity 
                translation model.

        Returns:
            (ExplorationOpportunitySummaryModel). An exploration opportunity
            model with updated translation count.
        """
        exp_opportunity_model = (
            opportunity_models.ExplorationOpportunitySummaryModel.get(
                entity_translation_model.entity_id))

        new_translation_count = len(
            entity_translation_model.translations.keys())

        exp_opportunity_model.translation_counts[
            entity_translation_model.language_code] = new_translation_count

        return exp_opportunity_model

    @staticmethod
    def _get_latest_model(
        entity_id: str, entity_translation_models: List[
            translation_models.EntityTranslationsModel]) -> Tuple[
               str, translation_models.EntityTranslationsModel]:
        """Returns latest entity translation model from a list of entity
        translation models.

        Args:
            entity_id: str. Id of the entity for which the latest entity
                translation model has to be computed.
            entity_translation_models: list(EntityTranslationsModel). A
                list of entity translation models.

        Returns:
            (tuple(str, EntityTranslationsModel)). A tuple of entity id
            and latest entity translation model corresponding to it.
        """
        latest_model = entity_translation_models[0]
        for model in entity_translation_models:
            if model.entity_version > latest_model.entity_version:
                latest_model = model
        return entity_id, latest_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of entity translation model update results.

        Returns:
            PCollection. A PCollection of the job run results.
        """
        entity_translation_models = _get_entity_translation_models(
            self.pipeline)
        deletion_result_dicts = (
            entity_translation_models
            | 'Get deletion results' >> beam.Map(
                    self._delete_translations_with_invalid_content_ids)
            | 'Filter out None values' >> beam.Filter(lambda x: x is not None)
        )

        deleted_translations_count_job_run_results = (
            deletion_result_dicts
            | 'Deleted translations counts' >> beam.Map(
                    lambda x: x['deleted_translations_count'])
            | 'Total deleted translations count' >> (
                beam.CombineGlobally(sum))
            | 'Only create result for non-zero number of objects' >> (
                beam.Filter(lambda x: x > 0))
            | 'Report total deleted translations count' >> beam.Map(
                lambda result: (
                    job_run_result.JobRunResult.as_stdout(
                        f'DELETED TRANSLATIONS COUNT SUCCESS: {result}'
                    )))
        )

        updated_entity_translation_models = (
            deletion_result_dicts
            | 'Updated entity translation models' >> beam.Map(
                    lambda x: x['entity_translation_model'])
        )

        updated_entity_translation_models_count_job_run_results = (
            updated_entity_translation_models
            | 'Updated entity transltion models count' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'UPDATED ENTITY TRANSLATION MODELS COUNT'))
        )

        latest_version_updated_entity_translation_models = (
            updated_entity_translation_models
            # PCollection<entity_id: entity_translation_model>.
            | 'Add entity id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.entity_id)
            # PCollection<entity_id: list(entity_translation_model)>.
            | 'Group by entity id' >> beam.GroupByKey()
            # PCollection<entity_id: entity_translation_model>.
            | 'Filter model with latest entity version' >> beam.MapTuple(
                self._get_latest_model)
            # PCollection<entity_translation_model>.
            | 'Get list of latest entity transaltion model' >> beam.Values()  # pylint: disable=no-value-for-parameter
        )

        updated_exp_opportunity_models = (
            latest_version_updated_entity_translation_models
            | 'Get updated explortion opportunity models' >> beam.Map(
                    self._compute_updated_exp_opportunity_model)
        )

        unused_put_results = (
            (
                updated_entity_translation_models,
                updated_exp_opportunity_models
            )
            | 'Merge lists' >> beam.Flatten()
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            (
                deleted_translations_count_job_run_results,
                updated_entity_translation_models_count_job_run_results
            )
            | 'Combine results' >> beam.Flatten()
        )


class AuditTranslationsForInvalidContentIDsJob(base_jobs.JobBase):
    """Audits translations for invalid content id."""

    @staticmethod
    def _get_translations_with_invalid_content_ids(
        entity_translation_model: translation_models.EntityTranslationsModel
    ) -> List[Dict[str, Union[str, int]]]:
        """Finds the list of all invalid content ids for an entity
        translation model.

        Args:
            entity_translation_model: (EntityTranslationsModel). An entity 
                translation model.

        Returns:
            list(dict(str, union(str, int))). A list of dict containing all
            invalid entity_translation_model_id, entity_id, entity_version
            and content_id, for an entity translation model.
        """
        invalid_translation_dicts: List[Dict[str, Union[str, int]]] = []

        exp_model = exp_models.ExplorationModel.get(
                entity_translation_model.entity_id,
                strict=True,
                version=entity_translation_model.entity_version)
        exp = exp_fetchers.get_exploration_from_model(exp_model)

        exp_content_ids = exp.get_translatable_content_ids()
        translated_content_ids = entity_translation_model.translations.keys()

        for content_id in translated_content_ids:
            if content_id not in exp_content_ids:
                invalid_translation_dicts.append({
                    'entity_id': entity_translation_model.entity_id,
                    'entity_version': entity_translation_model.entity_version,
                    'entity_translation_model_id': entity_translation_model.id,
                    'content_id': content_id
                })

        return invalid_translation_dicts

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of audit job run results.

        Returns:
            PCollection. A PCollection of results.
        """
        entity_translation_models = _get_entity_translation_models(
            self.pipeline)
        invalid_translation_dicts = (
            entity_translation_models
            | 'Get invalid translation dicts' >> beam.Map(
                    self._get_translations_with_invalid_content_ids)
            | 'Flatten the list' >> beam.FlatMap(lambda x: x)
        )

        job_run_results = (
            invalid_translation_dicts
            | 'Report translations to be deleted' >> beam.Map(
                lambda result: (
                    job_run_result.JobRunResult.as_stdout(
                        f'Results are - {result}')))
        )

        invalid_translations_count_job_run_results = (
            invalid_translation_dicts
            | 'Report translations to be deleted count' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TRANSLATIONS TO BE DELETED COUNT'))
        )

        invalid_entity_translation_models_count_job_run_results = (
            invalid_translation_dicts
            | 'Invalid entity translation model ids' >> beam.Map(
                    lambda x: x['entity_translation_model_id'])
            | 'Create pair' >> beam.Map(lambda x: (x, None))
            | 'Group pairs' >> beam.GroupByKey()
            | 'Extract unique keys' >> beam.Map(lambda x: x[0])
            | 'Report entity translation models to be updated count' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'ENTITY TRANSLATION MODELS TO BE UPDATED COUNT'))
        )

        return (
            (
                job_run_results,
                invalid_translations_count_job_run_results,
                invalid_entity_translation_models_count_job_run_results
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
    )

    return entity_translation_models
