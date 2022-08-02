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
from core.domain import state_domain
from core.domain import translation_domain
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
    from mypy_imports import translation_models

(exp_models, translation_models) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.translation])

datastore_services = models.Registry.import_datastore_services()


class EntityTranslationsModelGenerationOneOffJob(base_jobs.JobBase):
    """Generate EntityTranslation models for explorations."""

    @staticmethod
    def _generate_validated_entity_translations_for_exploration(exploration):
        """Returns EntityTranslation
        Args:
            exploration: Exploration. The exploration.

        Returns:
            Tuple(str, Dict). Consists of a Tuple where the first element is
                the exploration id and the second element being the mapping
                of old content ids to new content ids.
        """
        try:
            language_code_to_translation = {}
            (old_content_id_to_new_content_id, _) = (
                state_domain.State
                .generate_old_content_id_to_new_content_id_in_v49_states(
                    exploration.states))
            for state_name in exploration.states:
                translations_mapping = exploration.states[state_name][
                    'written_translations']['translations_mapping']
                for content_id in translations_mapping:
                    new_content_id = (
                        old_content_id_to_new_content_id[state_name][
                            content_id])
                    for language_code in translations_mapping[content_id]:
                        if language_code not in language_code_to_translation:
                            language_code_to_translation[language_code] = (
                                translation_domain.EntityTranslation(
                                    exploration.id,
                                    feconf.TranslatableEntityType.EXPLORATION,
                                    exploration.version, language_code, {}))

                        translation_dict = translations_mapping[content_id][
                            language_code]
                        (
                            language_code_to_translation[language_code]
                            .add_translation(
                                new_content_id,
                                translation_dict['translation'],
                                translation_domain.TranslatableContentFormat(
                                    translation_dict['data_format']),
                                translation_dict['needs_update'])
                        )
            for entity_translation in language_code_to_translation.values():
                entity_translation.validate()
        except Exception as e:
            logging.exception('Got exception on main handler')
            return result.Err((exploration.id, e))

        return result.Ok(language_code_to_translation.values())

    @staticmethod
    def _create_entity_translation_model(
        entity_translation: translation_domain.EntityTranslation
    ):
        """Creates the EntityTranslationsModel from the given EntityTranslation
        object.

        Args:
            suggestion_model: GeneralSuggestionModel. The suggestion model.
            migrated_suggestion: Suggestion. The suggestion domain object.

        Returns:
            list(suggestion_model). List of suggestion models to update.
        """
        with datastore_services.get_ndb_context():
            translation_model = translation_models.EntityTranslationsModel.create_new(
                entity_translation.entity_type,
                entity_translation.entity_id,
                entity_translation.entity_version,
                entity_translation.language_code,
                entity_translation.to_dict()['translations']
            )
        translation_model.update_timestamps()
        return translation_model

    def run(self):

        entity_translations_result = (
            self.pipeline
            | 'Get all exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(
                    include_deleted=False))
            | 'Generate EntityTranslation objects for exploration' >> beam.Map(
                self._generate_validated_entity_translations_for_exploration)
        )

        unused_put_results = (
            entity_translations_result
            | 'Filter the results with OK status' >> beam.Filter(
                lambda result: result.is_ok())
            | 'Fetch the models to be put' >> beam.Map(
                lambda result: result.unwrap())
            | 'Flatten the list of lists of objects' >> beam.FlatMap(
                lambda x: x)
            | 'Create models from objects' >> beam.Map(
                self._create_entity_translation_model)
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            entity_translations_result
            | 'Transform Results to JobRunResults' >> (
                job_result_transforms.ResultsToJobRunResults())
        )
