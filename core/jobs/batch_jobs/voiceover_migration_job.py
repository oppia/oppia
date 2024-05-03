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

"""Job for migrating voiceovers from exploration model to entity
voiceovers model."""

from __future__ import annotations

from core import feconf

from core.domain import state_domain
from core.domain import voiceover_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import voiceover_models

datastore_services = models.Registry.import_datastore_services()

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])


class PopulateManualVoiceoversToEntityVoiceoversModelJob(base_jobs.JobBase):
    """Migrates voiceovers stored in the exploration model to the new
    EntityVoiceovers storage models.
    """

    DATASTORE_UPDATES_ALLOWED = True

    @classmethod
    def create_entity_voiceovers_model_instance(
        cls,
        entity_voiceovers_instance: voiceover_domain.EntityVoiceovers
    ) -> voiceover_models.EntityVoiceoversModel:
        """Creates an entity voiceovers model instance.

        Args:
            entity_voiceovers_instance: EntityVoiceovers. An instance of the
                entity voiceovers domain class.

        Returns:
            EntityVoiceoversModel. An instance of the entity voiceover model.
        """
        entity_voiceovers_dict = entity_voiceovers_instance.to_dict()

        entity_id = entity_voiceovers_dict['entity_id']
        entity_type = entity_voiceovers_dict['entity_type']
        entity_version = entity_voiceovers_dict['entity_version']
        language_accent_code = entity_voiceovers_dict['language_accent_code']
        voiceovers = entity_voiceovers_dict['voiceovers']

        with datastore_services.get_ndb_context():
            entity_voiceovers_model = (
                voiceover_models.EntityVoiceoversModel.create_new(
                    entity_type, entity_id, entity_version,
                    language_accent_code, voiceovers
                )
            )
        entity_voiceovers_model.update_timestamps()
        return entity_voiceovers_model

    @classmethod
    def create_entity_voiceovers_instances(
        cls,
        exploration_model: exp_models.ExplorationModel,
        exploration_voice_artists_link_model: (
            voiceover_models.ExplorationVoiceArtistsLinkModel),
        voice_artist_metadata_models_list: List[
            voiceover_models.VoiceArtistMetadataModel]
    ) -> List[voiceover_domain.EntityVoiceovers]:
        """Creates a list of EntityVoiceovers instances containing voiceovers
        from the given exploration data.

        Args:
            exploration_model: ExplorationModel. An instance of an
                exploration model.
            exploration_voice_artists_link_model:
                ExplorationVoiceArtistsLinkModel. An instance of an
                ExplorationVoiceArtistsLinkModel model.
            voice_artist_metadata_models_list: list(VoiceArtistMetadataModel). A
                list of VoiceArtistMetadataModel instances. Language accent code
                for a given voice artist should be fetched from this model.

        Returns:
            list(EntityVoiceovers). A list of EntityVoiceovers instances
            containing voiceovers from the given exploration data.

        Raises:
            Exception. All voice artists are not assigned accents in the
                VoiceArtistMetadataModel.
        """

        voice_artist_id_to_language_code_mapping = {}

        for voice_artist_metadata_model in voice_artist_metadata_models_list:
            voice_artist_id_to_language_code_mapping[
                voice_artist_metadata_model.id] = (
                    voice_artist_metadata_model.language_code_to_accent)

        entity_type = 'exploration'
        entity_id = exploration_model.id
        entity_version = exploration_model.version

        entity_voiceovers_id_to_entity_voiceovers: Dict[
            str, voiceover_domain.EntityVoiceovers] = {}

        content_id_to_voiceovers_mapping = (
            exploration_voice_artists_link_model.
            content_id_to_voiceovers_mapping)

        for content_id, language_code_to_voiceover_mapping in (
                content_id_to_voiceovers_mapping.items()):
            for language_code, voiceover_mapping in (
                    language_code_to_voiceover_mapping.items()):

                voice_artist_id = voiceover_mapping[0]
                voiceover_dict = voiceover_mapping[1]
                manual_voiceover_instance = state_domain.Voiceover.from_dict(
                    voiceover_dict)

                try:
                    language_accent_code = (
                        voice_artist_id_to_language_code_mapping[
                            voice_artist_id][language_code]
                    )
                except Exception as e:
                    raise Exception(
                        'Please assign all the accents for voice artists in '
                        'language code %s.' % language_code) from e

                entity_voiceovers_id = (
                    voiceover_models.EntityVoiceoversModel.generate_id(
                        entity_type,
                        entity_id,
                        entity_version,
                        language_accent_code
                    )
                )

                if (
                    entity_voiceovers_id not in
                    entity_voiceovers_id_to_entity_voiceovers
                ):
                    entity_voiceovers_object = (
                        voiceover_domain.EntityVoiceovers.create_empty(
                            entity_id, entity_type,
                            entity_version, language_accent_code)
                    )
                else:
                    entity_voiceovers_object = (
                        entity_voiceovers_id_to_entity_voiceovers[
                            entity_voiceovers_id]
                    )

                entity_voiceovers_object.add_new_content_for_voiceover(
                    content_id)
                entity_voiceovers_object.add_voiceover(
                    content_id,
                    feconf.VoiceoverType.MANUAL,
                    manual_voiceover_instance
                )

                entity_voiceovers_id_to_entity_voiceovers[
                    entity_voiceovers_id] = entity_voiceovers_object

        return list(entity_voiceovers_id_to_entity_voiceovers.values())

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results for the exploration for which an
        exploration voiceover migration has been done.

        Returns:
            PCollection. A PCollection of results for the exploration for which
            an exploration voiceover migration has been done.
        """
        exploration_models = (
            self.pipeline
            | 'Get exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
        )

        exploration_voice_artists_link_models = (
            self.pipeline
            | 'Get exploration voice artists link models' >> (
                ndb_io.GetModels(
                    voiceover_models.ExplorationVoiceArtistsLinkModel.get_all()
                )
            )
        )

        voice_artist_metadata_models = (
            self.pipeline
            | 'Get voice artist metadata model' >> (
                ndb_io.GetModels(
                    voiceover_models.VoiceArtistMetadataModel.get_all()
                )
            )
        )

        # Pair each exploration model with its exploration ID and create
        # key-value pairs.
        paired_exploration_models = (
            exploration_models
            | 'Pair Exploration ID to model' >> beam.Map(
                lambda model: (model.id, model))
        )

        # Pair each exploration voice artists link model with its exploration
        # ID and create key-value pairs.
        paired_exploration_voice_artists_link_models = (
            exploration_voice_artists_link_models
            | 'Pair Exploration ID to voice artist link model' >> beam.Map(
                lambda model: (model.id, model))
        )

        # Group the key-value pairs from both PCollections by the
        # Exploration ID.
        grouped_models = {
            'exploration_model': paired_exploration_models,
            'exploration_voice_artists_link_model': (
                paired_exploration_voice_artists_link_models),
        } | 'Group by Exploration ID' >> beam.CoGroupByKey()

        entity_voiceovers_instances = (
            grouped_models
            | 'Filter invalid exploration and voice artist link models' >> (
                beam.Filter(
                    lambda element: (
                        element[0] != '' and
                        len(element[1]['exploration_model']) > 0 and
                        len(element[1][
                            'exploration_voice_artists_link_model']) > 0
                    )
                )
            )
            | 'Get entity voiceovers instances' >> beam.Map(
                lambda element, voice_artist_metadata_models_list: (
                    PopulateManualVoiceoversToEntityVoiceoversModelJob.
                    create_entity_voiceovers_instances(
                        exploration_model=(
                            element[1]['exploration_model'][0]),
                        exploration_voice_artists_link_model=(
                            element[1][
                                'exploration_voice_artists_link_model'][0]),
                        voice_artist_metadata_models_list=(
                            voice_artist_metadata_models_list)
                    )
                ),
                beam.pvalue.AsList(voice_artist_metadata_models)
            )
            | 'Merge all entity voiceovers instances' >> beam.FlatMap(
                lambda entity_voiceovers: entity_voiceovers)
        )

        entity_voiceovers_models = (
            entity_voiceovers_instances
            | 'Create model instance' >> beam.Map(
                PopulateManualVoiceoversToEntityVoiceoversModelJob.
                create_entity_voiceovers_model_instance)
        )

        entity_voiceovers_models_result = (
            entity_voiceovers_models
            | 'Get result data from migrated models' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Migrated %s voiceovers for exploration: %s, in language '
                    'accent code %s.' % (
                        len(list(model.voiceovers.keys())),
                        model.entity_id,
                        model.language_accent_code
                    )
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                entity_voiceovers_models
                | 'Put models into datastore' >> ndb_io.PutModels()
            )
            pass

        return entity_voiceovers_models_result


class AuditEntityVoiceoverModelJob(
    PopulateManualVoiceoversToEntityVoiceoversModelJob
):
    """Audit PopulateManualVoiceoversToEntityVoiceoverModelJob."""

    DATASTORE_UPDATES_ALLOWED = False
