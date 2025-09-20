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

"""Jobs used for migrating the exploration models."""

from __future__ import annotations

import logging

from core.domain import (
    exp_fetchers,
    voiceover_services,
    opportunity_services
)
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms, results_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Dict, Iterable, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import (
        datastore_services,
        exp_models,
        translation_models,
        voiceover_models
    )

(exp_models, translation_models, voiceover_models) = (
    models.Registry.import_models(
        [
            models.Names.EXPLORATION,
            models.Names.TRANSLATION,
            models.Names.VOICEOVER
        ]
    )
)
datastore_services = models.Registry.import_datastore_services()



class VoiceoverSynthesisJob(base_jobs.JobBase):
    """A one-off job to generate voiceovers for all curated explorations in
    English and other supported translated languages.
    """

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def get_all_language_accent_codes_for_voiceovers():
        with datastore_services.get_ndb_context():
            language_codes_mapping = (
                voiceover_services.
                get_all_language_accent_codes_for_voiceovers()
            )
        return language_codes_mapping

    @staticmethod
    def is_exploration_curated(exploration_id: str) -> Optional[bool]:
        """Checks whether the provided exploration ID is curated or not.

        Args:
            exploration_id: str. The given exploration ID.

        Returns:
            bool. A boolean value indicating if the exploration is curated
            or not.
        """
        try:
            with datastore_services.get_ndb_context():
                return (
                    opportunity_services.
                    is_exploration_available_for_contribution(exploration_id)
                )
        except Exception:
            logging.exception(
                'Not able to check whether exploration is curated or not'
                ' for exploration ID %s.' % exploration_id)
            return False

    def generate_voiceovers_for_exploration(
        self,
        exploration_model: exp_models.ExplorationModel,
        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ],
        entity_voiceover_models: Sequence[
            voiceover_models.EntityVoiceoversModel
        ],
        language_codes_mapping: Dict[str, Dict[str, bool]]
    ) -> Iterable[Tuple[str, str]]:
        """Generates voiceovers for the given exploration.

        Args:
            exploration: The exploration model for which to generate voiceovers.
            entity_translation_models: The translation models for the
                exploration using which to generate voiceovers.
            entity_voiceover_models: The existing voiceover models related to
                the exploration.
            language_codes_mapping: A mapping of language codes to the
                corresponding accent codes supported for voiceovers.

        Returns:
            Iterable[EntityVoiceoversModel]. An iterable of
            EntityVoiceoversModels that were updated or created.
        """
        language_code_to_contents_mapping = {}
        entity_translations_list = []
        entity_voiceovers_list = []

        with datastore_services.get_ndb_context():
            exploration = exp_fetchers.get_exploration_from_model(
                exploration_model, False)

            for entity_translation_model in entity_translation_models:
                entity_translations_list.append(entity_translation_model)

            for entity_voiceover_model in entity_voiceover_models:
                entity_voiceovers_list.append(entity_voiceover_model)

        for state in exploration.states.values():
            content_id_to_translatable_content = (
                state.get_translatable_contents_collection()
            ).content_id_to_translatable_content
            for translatable_content in (
                    content_id_to_translatable_content.values()):
                content_id = translatable_content.content_id

                # Rule inputs are not considered for voiceover generation.
                if content_id.startswith('rule_input'):
                    continue

                content_value = translatable_content.content_value
                assert isinstance(content_value, str)

                language_code_to_contents_mapping.setdefault('en', {})[
                    content_id] = content_value

        for entity_translation in entity_translations_list:
            language_code = entity_translation.language_code
            translations = entity_translation.translations
            for content_id, translated_content in translations.items():
                # Voiceovers should only be regenerated if the translation is
                # updated.
                if translated_content.needs_update:
                    continue

                content_value = translated_content.content_value
                assert isinstance(content_value, str)

                language_code_to_contents_mapping.setdefault(language_code, {})[
                    content_id] = content_value

        # Get all language codes that need voiceover regeneration in this request.
        language_codes = list(language_code_to_contents_mapping.keys())

        language_code_to_autogeneratable_accent_codes = {}

        # Retrieve all Oppia-supported language accents, grouped by language code,
        # for which voiceovers need to be regenerated for the given contents.
        for language_code in language_codes:
            language_accent_codes = (
                voiceover_services.get_supported_autogeneratable_accents_by_language(
                    language_code))
            if not language_accent_codes:
                continue
            language_code_to_autogeneratable_accent_codes[
                language_code] = language_accent_codes


    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of job run results for EntityVoiceoversModels
        that were updated after voiceover synthesis.

        Returns:
            beam.PCollection[job_run_result.JobRunResult]. A PCollection
            containing job run results with the IDs of the
            EntityVoiceoversModels that were updated or created.
        """
        exploration_models = (
            self.pipeline
            | 'Get exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
            | 'Filter out curated explorations' >> beam.Filter(
                lambda model: self.is_exploration_curated(
                    exploration_id=model.id)
            )
        )

        entity_translation_models = (
            self.pipeline
            | 'Get all entity translation models' >> ndb_io.GetModels(
                translation_models.EntityTranslationsModel.get_all())
        )

        entity_voiceovers_models = (
            self.pipeline
            | 'Get all entity voiceover models' >> ndb_io.GetModels(
                voiceover_models.EntityVoiceoversModel.get_all())
        )

        exploration_id_to_exploration = (
            exploration_models
            | 'Map exploration ID to exploration model' >> beam.Map(
                lambda model: (model.id, model))
            | 'Group by exploration ID' >> beam.GroupByKey()
        )

        entity_id_to_translation_models = (
            entity_translation_models
            | 'Map entity ID to translation model' >> beam.Map(
                lambda model: (model.entity_id, model))
            | 'Group by entity ID' >> beam.GroupByKey()
        )

        entity_id_to_voiceover_models = (
            entity_voiceovers_models
            | 'Map entity ID to voiceover model' >> beam.Map(
                lambda model: (model.entity_id, model))
            | 'Group voiceover models by entity ID' >> beam.GroupByKey()
        )

        combined_models = (
            {
                'exploration': exploration_id_to_exploration,
                'translations': entity_id_to_translation_models,
                'voiceovers': entity_id_to_voiceover_models
            }
            | 'Join all by entity ID' >> beam.CoGroupByKey()
        )

        entity_voiceovers_models = (
            combined_models
            | 'Generate voiceovers for each exploration' >> beam.FlatMap(
                lambda kv: self.generate_voiceovers_for_exploration(
                    exploration=list(kv[1]['exploration']),
                    entity_translation_models=list(kv[1]['translations']),
                    entity_voiceover_models=list(kv[1]['voiceovers']),
                    language_code_to_contents_mapping=(
                        self.get_all_language_accent_codes_for_voiceovers()
                    )
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                entity_voiceovers_models
                | 'Put models into datastore' >> ndb_io.PutModels()
            )

        return (
            entity_voiceovers_models
            | 'Format results' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'EntityVoiceoversModel ID: %s.'
                    % model.id
                )
            )
        )



class VoiceoverSyncAuditJob(VoiceoverSynthesisJob):
    DATASTORE_UPDATES_ALLOWED = False