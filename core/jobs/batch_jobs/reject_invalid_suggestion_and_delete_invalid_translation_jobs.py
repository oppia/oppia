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

import datetime

from core import feconf
from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, Iterable, List, Optional, Sequence, Tuple, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
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
    """Job that rejects translation suggestions in review for the content with
    an accepted translation.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of suggestion update results.

        Returns:
            PCollection. A PCollection of the job run results.
        """
        entity_translation_models = _get_entity_translation_models(
            self.pipeline)
        updated_suggestion_dicts = (
            entity_translation_models
            | 'Get translation suggestion dicts' >> beam.ParDo(
                ComputeSuggestionsInReviewForTranslatedContents(
                    is_datastore_change=True))
            | 'Flatten the list' >> beam.FlatMap(lambda x: x)
        )

        suggestion_dicts = (
            updated_suggestion_dicts
            | 'Get updated suggestion dicts' >> beam.Map(
                lambda updated_suggestion_dict: updated_suggestion_dict[
                    'suggestion_dict'])
        )

        updated_suggestions = (
            updated_suggestion_dicts
            | 'Get updated suggestion models' >> beam.Map(
                lambda updated_suggestion_dict: updated_suggestion_dict[
                    'updated_suggestion'])
        )

        job_run_results = (
            suggestion_dicts
            | 'Report the suggestions to be rejected' >> beam.Map(
                lambda result: (
                    job_run_result.JobRunResult.as_stdout(
                        f'Results are - {result}')))
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
                job_run_results,
                updated_suggestions_count_job_run_results
            )
            | 'Combine results' >> beam.Flatten()
        )


class AuditRejectTranslationSuggestionsForTranslatedContentsJob(
    base_jobs.JobBase):
    """Audits translation suggestions in review for the content with an
    accepted translation.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of audit job run results.

        Returns:
            PCollection. A PCollection of results.
        """
        entity_translation_models = _get_entity_translation_models(
            self.pipeline)
        suggestion_dicts = (
            entity_translation_models
            | 'Get suggestions to be rejected list' >> beam.ParDo(
                ComputeSuggestionsInReviewForTranslatedContents(
                    is_datastore_change=False))
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

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of entity translation model update results.

        Returns:
            PCollection. A PCollection of the job run results.
        """
        entity_translation_models = _get_entity_translation_models(
            self.pipeline)
        deletion_result_dicts = (
            entity_translation_models
            | 'Get deletion results' >> beam.ParDo(
                    ComputeTranslationsWithInvalidContentIds(
                        is_datastore_change=True))
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

        invalid_translation_dicts = (
            deletion_result_dicts
            | 'Get invalid translation dicts' >> beam.Map(
                    lambda x: x['invalid_translation_dicts'])
            | 'Flatten the list' >> beam.FlatMap(lambda x: x)
        )

        job_run_results = (
            invalid_translation_dicts
            | 'Report translations to be deleted' >> beam.Map(
                lambda result: (
                    job_run_result.JobRunResult.as_stdout(
                        f'Results are - {result}')))
        )

        latest_version_updated_entity_translation_models = (
            updated_entity_translation_models
            # PCollection<entity_id: entity_translation_model>.
            | 'Add entity id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.entity_id)
            # PCollection<entity_id: list(entity_translation_model)>.
            | 'Group by entity id' >> beam.GroupByKey()
            # PCollection<entity_id: entity_translation_model>.
            | 'Filter model with latest entity version' >> beam.ParDo(
                GetLatestModel())
            # PCollection<entity_translation_model>.
            | 'Get list of latest entity translation model' >> beam.Values()  # pylint: disable=no-value-for-parameter
        )

        updated_exp_opportunity_models = (
            latest_version_updated_entity_translation_models
            | 'Get updated exploration opportunity models' >> beam.ParDo(
                    ComputeUpdatedExpOpportunityModel())
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
                job_run_results,
                deleted_translations_count_job_run_results,
                updated_entity_translation_models_count_job_run_results
            )
            | 'Combine results' >> beam.Flatten()
        )


class AuditDeleteTranslationsForInvalidContentIDsJob(base_jobs.JobBase):
    """Audits translations for invalid content id."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of audit job run results.

        Returns:
            PCollection. A PCollection of results.
        """
        entity_translation_models = _get_entity_translation_models(
            self.pipeline)
        invalid_translation_dicts = (
            entity_translation_models
            | 'Get invalid translation dicts' >> beam.ParDo(
                    ComputeTranslationsWithInvalidContentIds(
                        is_datastore_change=False))
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


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class ComputeSuggestionsInReviewForTranslatedContents(beam.DoFn):  # type: ignore[misc]
    """DoFn to compute translation suggestions in review for the content
    with an accepted translation.
    """

    def __init__(self, is_datastore_change: bool) -> None:
        """Initializes a variable which controls the datastore updation.

        Args:
            is_datastore_change: bool. Whether to update datastore or not.
        """
        super().__init__()
        self.is_datastore_change = is_datastore_change

    def process(
        self,
        entity_translation_model: translation_models.EntityTranslationsModel
    ) -> Union[
            Iterable[List[Dict[str, Union[
                str, int, suggestion_models.GeneralSuggestionModel]]]],
            Iterable[List[Dict[
                str, Union[suggestion_models.GeneralSuggestionModel, Dict[
                    str, Union[
                        str, int, suggestion_models.GeneralSuggestionModel]]]]]
            ]]:
        """Finds the list of all translation suggestions in review for the
        content with an accepted translation, for an entity translation
        model and reject them if needed.

        Args:
            entity_translation_model: EntityTranslationsModel. An entity
                translation model.

        Yields:
            union(list(dict(str, union(str, int, GeneralSuggestionModel))),
            list(dict(str, union(GeneralSuggestionModel, dict(str, union(
            str, int, GeneralSuggestionModel))))). Either a list of dicts
            containing all entity_translation_model_id, entity_id,
            entity_version, content_id and corresponding suggestions in review,
            for an entity translation model or a list of dicts containing
            updated suggestion model and updated suggestion dict, which contain
            entity_translation_model_id, entity_id, entity_version, content_id
            and corresponding suggestion id.
        """
        with datastore_services.get_ndb_context():
            content_ids_not_needing_update = []
            for content_id in entity_translation_model.translations.keys():
                if entity_translation_model.translations[content_id][
                    'needs_update'] is False:
                    content_ids_not_needing_update.append(content_id)

            suggestions: Sequence[
                suggestion_models.GeneralSuggestionModel
            ] = (
                suggestion_models.GeneralSuggestionModel.query(
                    suggestion_models.GeneralSuggestionModel
                        .suggestion_type == (
                            feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                    suggestion_models.GeneralSuggestionModel
                        .target_id == entity_translation_model.entity_id,
                    suggestion_models.GeneralSuggestionModel
                        .target_version_at_submission == (
                            entity_translation_model.entity_version),
                    suggestion_models.GeneralSuggestionModel
                        .language_code == (
                            entity_translation_model.language_code),
                    suggestion_models.GeneralSuggestionModel
                        .status == suggestion_models.STATUS_IN_REVIEW
            ).fetch())

            if self.is_datastore_change:
                updated_suggestion_dicts: List[Dict[str, Union[
                    suggestion_models.GeneralSuggestionModel, Dict[str, Union[
                        str, int, suggestion_models.GeneralSuggestionModel]]]]
                ] = []
                for suggestion in suggestions:
                    if suggestion.change_cmd[
                        'content_id'] in content_ids_not_needing_update:
                        suggestion.status = suggestion_models.STATUS_REJECTED
                        suggestion.final_reviewer_id = (
                            feconf.SUGGESTION_BOT_USER_ID)
                        suggestion.last_updated = datetime.datetime.utcnow()
                        updated_suggestion_dicts.append({
                            'updated_suggestion': suggestion,
                            'suggestion_dict': {
                                'entity_id': entity_translation_model.entity_id,
                                'entity_version': (
                                    entity_translation_model.entity_version),
                                'entity_translation_model_id': (
                                    entity_translation_model.id),
                                'content_id': suggestion.change_cmd[
                                    'content_id'],
                                'suggestion_id': suggestion.id
                                }})
                yield updated_suggestion_dicts
            else:
                suggestion_dicts: List[Dict[str, Union[
                    str, int, suggestion_models.GeneralSuggestionModel]]] = []
                for suggestion in suggestions:
                    if suggestion.change_cmd[
                        'content_id'] in content_ids_not_needing_update:
                        suggestion_dicts.append({
                            'entity_id': entity_translation_model.entity_id,
                            'entity_version': (
                                entity_translation_model.entity_version),
                            'entity_translation_model_id': (
                                entity_translation_model.id),
                            'content_id': suggestion.change_cmd['content_id'],
                            'suggestion_id': suggestion.id
                        })
                yield suggestion_dicts


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class ComputeTranslationsWithInvalidContentIds(beam.DoFn):  # type: ignore[misc]
    """DoFn to compute translations with invalid content ids."""

    def __init__(self, is_datastore_change: bool) -> None:
        """Initializes a variable which controls the datastore updation.

        Args:
            is_datastore_change: bool. Whether to update datastore or not.
        """
        super().__init__()
        self.is_datastore_change = is_datastore_change

    def process(
        self,
        entity_translation_model: translation_models.EntityTranslationsModel
    ) -> Union[
            Iterable[Optional[Dict[str, Union[
                translation_models.EntityTranslationsModel, int, List[Dict[
                    str, Union[str, int]]]]]]],
            Iterable[List[Dict[str, Union[str, int]]]]]:
        """Find all translations with invalid content ids for an entity
        translation model and reject them if needed.

        Args:
            entity_translation_model: EntityTranslationsModel. An entity 
                translation model.

        Yields:
            union(optional(dict(Union(EntityTranslationsModel, int,
            list(dict(str, union(str, int))))), list(dict(str, union(str,
            int)))). Either a dict containing updated entity translation model,
            number of deleted translations from it and list of dicts containing
            all invalid entity_translation_model_id, entity_id, entity_version
            and content_id, for an entity translation model, if any or a list
            of dict containing all invalid entity_translation_model_id,
            entity_id, entity_version and content_id, for an entity translation
            model.
        """
        with datastore_services.get_ndb_context():
            exp_model = exp_models.ExplorationModel.get(
                entity_translation_model.entity_id,
                strict=True,
                version=entity_translation_model.entity_version)
            exp = exp_fetchers.get_exploration_from_model(exp_model)

            exp_content_ids = exp.get_translatable_content_ids()
            translated_content_ids = list(
                entity_translation_model.translations.keys())

            invalid_translation_dicts: List[Dict[str, Union[
                str, int]]] = []

            if self.is_datastore_change:
                deleted_translations_count = 0
                is_updated = False
                for content_id in translated_content_ids:
                    if content_id not in exp_content_ids:
                        invalid_translation_dicts.append({
                            'entity_id': entity_translation_model.entity_id,
                            'entity_version': (
                                entity_translation_model.entity_version),
                            'entity_translation_model_id': (
                                entity_translation_model.id),
                            'content_id': content_id
                        })
                        entity_translation_model.translations.pop(content_id)
                        deleted_translations_count += 1
                        is_updated = True

                if is_updated:
                    result: Dict[str, Union[
                        translation_models.EntityTranslationsModel, int, List[
                            Dict[str, Union[str, int]]]]] = {
                        'entity_translation_model': entity_translation_model,
                        'deleted_translations_count': (
                            deleted_translations_count),
                        'invalid_translation_dicts': invalid_translation_dicts
                    }
                    yield result
                yield None
            else:
                for content_id in translated_content_ids:
                    if content_id not in exp_content_ids:
                        invalid_translation_dicts.append({
                            'entity_id': entity_translation_model.entity_id,
                            'entity_version': (
                                entity_translation_model.entity_version),
                            'entity_translation_model_id': (
                                entity_translation_model.id),
                            'content_id': content_id
                        })
                yield invalid_translation_dicts


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class ComputeUpdatedExpOpportunityModel(beam.DoFn):  # type: ignore[misc]
    """DoFn to compute updated exp opportunity model."""

    def process(
        self,
        entity_translation_model: translation_models.EntityTranslationsModel
    ) -> Iterable[opportunity_models.ExplorationOpportunitySummaryModel]:
        """Compute exploration opportunity model with updated translation
        count for an updated entity translation model.

        Args:
            entity_translation_model: EntityTranslationsModel. An entity 
                translation model.

        Yields:
            ExplorationOpportunitySummaryModel. An exploration opportunity
            model with updated translation count.
        """
        with datastore_services.get_ndb_context():
            exp_opportunity_model = (
                opportunity_models.ExplorationOpportunitySummaryModel.get(
                    entity_translation_model.entity_id))

            new_translation_count = len(
                entity_translation_model.translations.keys())

            exp_opportunity_model.translation_counts[
                entity_translation_model.language_code] = (
                    new_translation_count)

            yield exp_opportunity_model


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class GetLatestModel(beam.DoFn):  # type: ignore[misc]
    """DoFn to compute latest entity translation model."""

    def process(
        self,
        element: Tuple[str, List[
            translation_models.EntityTranslationsModel]]
    ) -> Iterable[Tuple[
           str, translation_models.EntityTranslationsModel]]:
        """Returns latest entity translation model from a list of entity
        translation models.

        Args:
            element: Tuple[str, List[EntityTranslationsModel]]. A tuple of
                id of the entity for which the latest entity translation
                model has to be computed and A list of entity translation
                models.

        Yields:
            tuple(str, EntityTranslationsModel). A tuple of entity id
            and latest entity translation model corresponding to it.
        """
        with datastore_services.get_ndb_context():
            entity_id, entity_translation_models = element
            version_list = list(
                model.entity_version for model in entity_translation_models)
            latest_version = max(version_list)
            latest_model = entity_translation_models[0]
            for model in entity_translation_models:
                if model.entity_version == latest_version:
                    latest_model = model
                    break

            yield (entity_id, latest_model)


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
