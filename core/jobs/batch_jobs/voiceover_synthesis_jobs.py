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
import time

from core.domain import (
    exp_fetchers,
    voiceover_regeneration_services,
    voiceover_services,
    opportunity_services,
    voiceover_domain,
    translation_fetchers,
)
from core import feconf
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms, results_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Dict, Iterable, Sequence, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        datastore_services,
        exp_models,
        translation_models,
        voiceover_models,
    )

(exp_models, translation_models, voiceover_models) = (
    models.Registry.import_models(
        [
            models.Names.EXPLORATION,
            models.Names.TRANSLATION,
            models.Names.VOICEOVER,
        ]
    )
)
datastore_services = models.Registry.import_datastore_services()

WAIT_TIME_FOR_VOICEOVER_REGENERATION_IN_SECONDS = 3


class VoiceoverSynthesisJob(base_jobs.JobBase):
    """A one-off job to generate voiceovers for all curated explorations in
    English and other supported translated languages.
    """

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def get_all_language_accent_codes_for_voiceovers():
        with datastore_services.get_ndb_context():
            language_codes_mapping = (
                voiceover_services.get_all_language_accent_codes_for_voiceovers()
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
                return opportunity_services.is_exploration_available_for_contribution(
                    exploration_id
                )
        except Exception:
            logging.exception(
                'Not able to check whether exploration is curated or not'
                ' for exploration ID %s.' % exploration_id
            )
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
        voiceover_policy_model: voiceover_models.VoiceoverAutogenerationPolicyModel,
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

        logging.info(
            'Generating voiceovers for exploration %s' % (exploration_model.id)
        )

        with datastore_services.get_ndb_context():
            exploration = exp_fetchers.get_exploration_from_model(
                exploration_model, False
            )

            for entity_translation_model in list(entity_translation_models):
                entity_translations_list.append(
                    translation_fetchers.get_entity_translation_from_model(
                        entity_translation_model
                    )
                )

            for entity_voiceover_model in list(entity_voiceover_models):
                if entity_voiceover_model.entity_version != exploration.version:
                    continue
                entity_voiceovers_list.append(
                    voiceover_services.get_entity_voiceovers_from_model(
                        entity_voiceover_model
                    )
                )

            language_codes_mapping = (
                voiceover_policy_model.language_codes_mapping
            )

        entity_voiceovers_id_to_domain_object = {}

        entity_type = feconf.ENTITY_TYPE_EXPLORATION
        entity_id = exploration.id
        entity_version = exploration.version

        for entity_voiceovers in entity_voiceovers_list:
            entity_voiceovers_id = '%s-%s-%s-%s' % (
                entity_voiceovers.entity_type,
                entity_voiceovers.entity_id,
                entity_voiceovers.entity_version,
                entity_voiceovers.language_accent_code,
            )

            entity_voiceovers_id_to_domain_object[entity_voiceovers_id] = (
                entity_voiceovers
            )

        autogeneratable_language_codes_mapping = {}
        for language_code, accent_mapping in language_codes_mapping.items():
            autogeneratable_language_codes_mapping[language_code] = []
            for accent_code, is_autogeneratable in accent_mapping.items():
                if is_autogeneratable:
                    autogeneratable_language_codes_mapping[
                        language_code
                    ].append(accent_code)

        language_code_to_contents_mapping.update(
            voiceover_services.extract_english_voiceover_texts_from_exploration(
                exploration
            )
        )
        language_code_to_contents_mapping.update(
            voiceover_services.extract_translated_voiceover_texts_from_entity_translations(
                entity_translations_list
            )
        )

        # Get all language codes that need voiceover regeneration in this request.
        language_codes = list(language_code_to_contents_mapping.keys())

        error_logs = []

        for language_code in language_codes:
            language_accent_codes = autogeneratable_language_codes_mapping.get(
                language_code
            )
            content_ids_to_content_values = (
                language_code_to_contents_mapping.get(language_code, {})
            )

            for language_accent_code in language_accent_codes:
                for (
                    content_id,
                    content_html,
                ) in content_ids_to_content_values.items():
                    entity_voiceovers_id = '%s-%s-%s-%s' % (
                        entity_type,
                        entity_id,
                        str(entity_version),
                        language_accent_code,
                    )

                    default_entity_voiceovers = (
                        voiceover_domain.EntityVoiceovers.create_empty(
                            entity_id,
                            entity_type,
                            entity_version,
                            language_accent_code,
                        )
                    )

                    entity_voiceovers: voiceover_domain.EntityVoiceovers = (
                        entity_voiceovers_id_to_domain_object.get(
                            entity_voiceovers_id, default_entity_voiceovers
                        )
                    )

                    try:

                        time.sleep(
                            WAIT_TIME_FOR_VOICEOVER_REGENERATION_IN_SECONDS
                        )

                        voiceover_filename = voiceover_regeneration_services.generate_new_voiceover_filename(
                            content_id, language_accent_code
                        )

                        with datastore_services.get_ndb_context():
                            sentence_tokens_with_durations = voiceover_regeneration_services.synthesize_voiceover_for_html_string(
                                entity_id,
                                content_html,
                                language_accent_code,
                                voiceover_filename,
                            )

                            voiceover = voiceover_regeneration_services.fetch_voiceover_by_filename(
                                entity_id, voiceover_filename
                            )

                        entity_voiceovers.add_voiceover(
                            content_id, feconf.VoiceoverType.AUTO, voiceover
                        )
                        entity_voiceovers.add_automated_voiceovers_audio_offsets(
                            content_id, sentence_tokens_with_durations
                        )
                        entity_voiceovers.validate()

                        entity_voiceovers_id_to_domain_object[
                            entity_voiceovers_id
                        ] = entity_voiceovers
                        logging.info(
                            'Generated voiceover for content_id: %s, '
                            'language_accent_code: %s.'
                            % (
                                content_id,
                                language_accent_code,
                            )
                        )
                    except Exception as e:
                        error_logs.append(
                            VoiceoverSynthesisJob.generate_error_log(
                                entity_id,
                                content_id,
                                language_accent_code,
                                e,
                            )
                        )
                        logging.exception(
                            'Error generating voiceover for exploration_id: %s, '
                            'content_id: %s, language_accent_code: %s'
                            % (entity_id, content_id, language_accent_code)
                        )

        entity_voiceover_models_to_put = []
        for entity_voiceovers in entity_voiceovers_id_to_domain_object.values():
            with datastore_services.get_ndb_context():
                entity_voiceover_models_to_put.append(
                    voiceover_services.create_entity_voiceovers_model(
                        entity_voiceovers
                    )
                )

        return entity_voiceover_models_to_put

    @staticmethod
    def generate_error_log(
        exploration_id, content_id, language_accent_code, error
    ):
        return (
            'Error for exploration_id: %s, content_id: %s, '
            'language_accent_code: %s: %s'
            % (exploration_id, content_id, language_accent_code, error)
        )

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
            | 'Get exploration models'
            >> ndb_io.GetModels(exp_models.ExplorationModel.get_all())
            | 'Filter out curated explorations'
            >> beam.Filter(
                lambda model: self.is_exploration_curated(
                    exploration_id=model.id
                )
            )
        )

        entity_translation_models = (
            self.pipeline
            | 'Get all entity translation models'
            >> ndb_io.GetModels(
                translation_models.EntityTranslationsModel.get_all()
            )
        )

        entity_voiceovers_models = (
            self.pipeline
            | 'Get all entity voiceover models'
            >> ndb_io.GetModels(
                voiceover_models.EntityVoiceoversModel.get_all()
            )
        )

        exploration_id_to_exploration = (
            exploration_models
            | 'Map exploration ID to exploration model'
            >> beam.Map(lambda model: (model.id, model))
        )

        entity_id_to_translation_models = (
            entity_translation_models
            | 'Map entity ID to translation model'
            >> beam.Map(lambda model: (model.entity_id, model))
        )

        entity_id_to_voiceover_models = (
            entity_voiceovers_models
            | 'Map entity ID to voiceover model'
            >> beam.Map(lambda model: (model.entity_id, model))
        )

        combined_models = {
            'exploration': exploration_id_to_exploration,
            'translations': entity_id_to_translation_models,
            'voiceovers': entity_id_to_voiceover_models,
        } | 'Join all by entity ID' >> beam.CoGroupByKey()

        voiceover_policy_model = (
            self.pipeline
            | 'Get all voiceover autogeneration policy models'
            >> ndb_io.GetModels(
                voiceover_models.VoiceoverAutogenerationPolicyModel.get_all()
            )
        )

        entity_voiceovers_models = (
            combined_models
            | 'Generate voiceovers for each exploration'
            >> beam.FlatMap(
                lambda kv, policies: self.generate_voiceovers_for_exploration(
                    exploration_model=kv[1]['exploration'][0],
                    entity_translation_models=list(kv[1]['translations']),
                    entity_voiceover_models=list(kv[1]['voiceovers']),
                    voiceover_policy_model=policies,
                ),
                beam.pvalue.AsSingleton(voiceover_policy_model),
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                entity_voiceovers_models
                | 'Put models into datastore' >> ndb_io.PutModels()
            )

        return entity_voiceovers_models | 'Format results' >> beam.Map(
            lambda model: job_run_result.JobRunResult.as_stdout(
                'EntityVoiceoversModel ID: %s' % model.id
            )
        )


class VoiceoverSynthesisJobAuditJob(VoiceoverSynthesisJob):
    """Audit job for VoiceoverSynthesisJob."""

    DATASTORE_UPDATES_ALLOWED = False
