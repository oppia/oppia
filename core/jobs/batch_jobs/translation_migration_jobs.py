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

"""Jobs that migrate translation models."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import state_domain
from core.domain import translation_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import translation_models

(exp_models, translation_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.TRANSLATION])

datastore_services = models.Registry.import_datastore_services()


class EntityTranslationsModelGenerationOneOffJob(base_jobs.JobBase):
    """Generate EntityTranslation models for explorations."""

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def _generate_validated_entity_translations_for_exploration(
        exploration: exp_models.ExplorationModel
    ) -> result.Result[
        Tuple[str, translation_domain.EntityTranslation],
        Tuple[str, Exception]
    ]:
        """Generates EntityTranslation object for the given exploration.

        Args:
            exploration: ExplorationModel. The exploration model.

        Returns:
            Result(list(EntityTranslation), (str, Exception)). Result containing
            list of EntityTranslation objects.
        """
        try:
            lang_code_to_translation = {}
            (old_content_id_to_new_content_id, _) = (
                state_domain.State
                .generate_old_content_id_to_new_content_id_in_v54_states(
                    exploration.states))
            for state_name in exploration.states:
                translations_mapping = exploration.states[state_name][
                    'written_translations']['translations_mapping']
                for content_id in translations_mapping:
                    new_content_id = (
                        old_content_id_to_new_content_id[state_name][content_id]
                    )
                    for lang_code in translations_mapping[content_id]:
                        if lang_code not in lang_code_to_translation:
                            lang_code_to_translation[lang_code] = (
                                translation_domain.EntityTranslation(
                                    exploration.id,
                                    feconf.TranslatableEntityType.EXPLORATION,
                                    exploration.version, lang_code, {}))

                        translation_dict = translations_mapping[content_id][
                            lang_code]
                        lang_code_to_translation[lang_code].add_translation(
                            new_content_id,
                            translation_dict['translation'],
                            translation_domain.TranslatableContentFormat(
                                translation_dict['data_format']),
                            translation_dict['needs_update']
                        )
            for entity_translation in lang_code_to_translation.values():
                entity_translation.validate()
        except Exception as e:
            logging.exception(e)
            return result.Err((exploration.id, e))

        return result.Ok(list(lang_code_to_translation.values()))

    @staticmethod
    def _create_entity_translation_model(
        entity_translation: translation_domain.EntityTranslation
    ) -> result.Result[
        translation_models.EntityTranslationsModel,
        Tuple[str, Exception]
    ]:
        """Creates the EntityTranslationsModel from the given EntityTranslation
        object.

        Args:
            entity_translation: EntityTranslation. The EntityTranslation object.

        Returns:
            Result(EntityTranslationModel, (str, Exception)). Result containing
            the EntityTranslationModel for the given EntityTranslation opbject.
        """
        try:
            with datastore_services.get_ndb_context():
                translation_model = (
                    translation_models.EntityTranslationsModel.create_new(
                    entity_translation.entity_type,
                    entity_translation.entity_id,
                    entity_translation.entity_version,
                    entity_translation.language_code,
                    entity_translation.to_dict()['translations']
                ))
            translation_model.update_timestamps()
        except Exception as e:
            logging.exception(e)
            return result.Err((entity_translation.entity_id, e))

        return result.Ok(translation_model)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        entity_translations_result = (
            self.pipeline
            | 'Get all exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(
                    include_deleted=False))
            | 'Generate EntityTranslation objects for exploration' >> beam.Map(
                self._generate_validated_entity_translations_for_exploration)
        )

        new_translation_models_results = (
            entity_translations_result
            | 'Filter the results with OK status' >> beam.Filter(
                lambda result: result.is_ok())
            | 'Fetch the translation objects' >> beam.FlatMap(
                lambda result: result.unwrap())
            | 'Create models from objects' >> beam.Map(
                self._create_entity_translation_model)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_data = (
                new_translation_models_results
                | 'Filter model results with OK status' >> beam.Filter(
                    lambda result: result.is_ok())
                | 'Fetch the models to be put' >> beam.Map(
                    lambda result: result.unwrap())
                | 'Put models into the datastore' >> ndb_io.PutModels()
            )

        traverse_exp_job_run_results = (
            entity_translations_result
            | 'Generate traverse results' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'EXPLORATION MODELS TRAVERSED'))
        )

        generate_translations_job_run_results = (
            new_translation_models_results
            | 'Generate translation results' >> (
                job_result_transforms.ResultsToJobRunResults(
                    'GENERATED TRANSLATIONS'))
        )

        return (
            (
                generate_translations_job_run_results,
                traverse_exp_job_run_results
            )
            | beam.Flatten()

        )


class AuditEntityTranslationsModelGenerationOneOffJob(
    EntityTranslationsModelGenerationOneOffJob
):
    """Audit EntityTranslationsModelGenerationOneOffJob."""

    DATASTORE_UPDATES_ALLOWED = False
