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

"""Jobs used for migrating voiceovers from exploration models to entity
voiceover models."""

from __future__ import annotations

from core.domain import state_domain
from core.domain import voiceover_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, List, Tuple, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import voiceover_models

datastore_services = models.Registry.import_datastore_services()

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])

ExplorationAndVoiceArtistLinkType = Tuple[str, Dict[str, List[Union[
    voiceover_models.ExplorationVoiceArtistsLinkModel,
    exp_models.ExplorationModel]]]]


class PopulateManualVoiceoversToEntityVoiceoverModelJob(base_jobs.JobBase):
    """Migrates voiceovers stored in the exploration model to the new
    EntityVoiceovers storage models.
    """

    DATASTORE_UPDATES_ALLOWED = True

    @classmethod
    def update_entity_voiceover_for_given_id(
        cls,
        entity_type: str,
        entity_id: str,
        entity_version: int,
        accent_code: str,
        content_id: str,
        voiceover_dict: state_domain.VoiceoverDict,
        entity_voiceover_id_to_entity_voiceovers: Dict[
            str, voiceover_models.EntityVoiceoversModel]
    ) -> Dict[str, voiceover_models.EntityVoiceoversModel]:
        """Updates the entity voiceover model instance for the given language
        accent code for a specific content of an exploration.

        Args:
            entity_type: str. The entity type for the given entity voiceover
                instance.
            entity_id: str. The given entity ID.
            entity_version: int. The version number of the given exploration.
            accent_code: str. The language accent code for the given entity
                voiceover instance.
            content_id: str. The content ID for a specific content in an
                exploration.
            voiceover_dict: VoiceoverDict. A voiceover dict that should be
                added to the entity voiceover instance of the given language
                accent code of the content.
            entity_voiceover_id_to_entity_voiceovers:
                dict(str, EntityVoiceoversModel). A dict with entity voiceover
                ID as keys and its corresponding EntityVoiceoversModel as
                values.

        Returns:
            dict(str, EntityVoiceoversModel). The updated dict with entity
            voiceover ID as keys and its corresponding EntityVoiceoversModel as
            values.
        """
        entity_voiceover_id = (
            voiceover_models.EntityVoiceoversModel.generate_id(
                entity_type,
                entity_id,
                entity_version,
                accent_code
            )
        )

        if entity_voiceover_id not in entity_voiceover_id_to_entity_voiceovers:
            entity_voiceovers_object = (
                voiceover_services.create_entity_voiceovers_model_instance(
                    entity_id, entity_type, entity_version, accent_code))
        else:
            entity_voiceovers_object = (
                entity_voiceover_id_to_entity_voiceovers[entity_voiceover_id])

        entity_voiceovers_object.voiceovers[content_id] = {
            'manual': voiceover_dict
        }

        entity_voiceover_id_to_entity_voiceovers[entity_voiceover_id] = (
            entity_voiceovers_object)
        return entity_voiceover_id_to_entity_voiceovers

    @classmethod
    def generate_entity_voiceover_model(
        cls,
        element: ExplorationAndVoiceArtistLinkType,
        voice_artist_metadata_models_list: List[
            voiceover_models.VoiceArtistMetadataModel]
    ) -> List[voiceover_models.EntityVoiceoversModel]:
        """Generates an entity voiceovers model using the voiceover data stored
        in current exploration models.

        Args:
            element: ExplorationAndVoiceArtistLinkType.
                A 2-tuple with the following elements:
                a. A string value representing exploration ID.
                b. A dict with exploration_model and voice_artist_link as keys
                and their respective model instances as values. The models are
                used to fetch voiceover data that will be stored in new entity
                voiceovers model.
            voice_artist_metadata_models_list: list(VoiceArtistMetadataModel). A
                list of VoiceArtistMetadataModel instances. Language accent code
                for a given voice artist should be fetched from this model.

        Returns:
            list(EntityVoiceoversModel). A list of entity voiceovers models used
            for storing voiceovers from the given exploration data.

        Raises:
            Exception. All voice artists are not assigned accents in the
                VoiceArtistMetadataModel.
        """
        exploration_model = (
            element[1]['exploration_model'][0])
        assert isinstance(exploration_model, exp_models.ExplorationModel)

        voice_artist_link = (
            element[1]['voice_artist_link'][0])
        assert isinstance(
            voice_artist_link,
            voiceover_models.ExplorationVoiceArtistsLinkModel
        )

        voice_artist_id_to_language_code_mapping = {}

        content_id_to_voiceovers_mapping = (
            voice_artist_link.content_id_to_voiceovers_mapping)

        for voice_artist_metadata_model in voice_artist_metadata_models_list:
            for language_code, accent_code in (
                    voice_artist_metadata_model.language_code_to_accent.items()
            ):
                if accent_code in ('', None):
                    raise Exception(
                        'Please assign all the accents for voice artists in '
                        'language code %s.' % language_code)

            voice_artist_id_to_language_code_mapping[
                voice_artist_metadata_model.id] = (
                    voice_artist_metadata_model.language_code_to_accent)

        entity_id = voice_artist_link.id
        entity_type = 'exploration'
        entity_version = exploration_model.version

        entity_voiceover_id_to_entity_voiceovers: Dict[
            str, voiceover_models.EntityVoiceoversModel] = {}

        for content_id, lang_code_to_voiceover_mapping in (
                content_id_to_voiceovers_mapping.items()):
            for lang_code, voiceover_mapping in (
                    lang_code_to_voiceover_mapping.items()):
                voice_artist_id = voiceover_mapping[0]
                voiceover_dict = voiceover_mapping[1]

                accent_code = voice_artist_id_to_language_code_mapping[
                    voice_artist_id][lang_code]

                entity_voiceover_id_to_entity_voiceovers = (
                    cls.update_entity_voiceover_for_given_id(
                        entity_type,
                        entity_id,
                        entity_version,
                        accent_code,
                        content_id,
                        voiceover_dict,
                        entity_voiceover_id_to_entity_voiceovers
                    )
                )
        return list(entity_voiceover_id_to_entity_voiceovers.values())

    @classmethod
    def count_voiceovers(
        cls,
        entity_voiceovers_model: voiceover_models.EntityVoiceoversModel
    ) -> int:
        """Calculates the number of voiceovers for a given entity
        voiceover model.

        Args:
            entity_voiceovers_model: EntityVoiceoversModel. An instance of
                entity voiceover model from which number of voiceovers will be
                calculated.

        Returns:
            int. The number of voiceovers present in the given entity
            voiceovers model.
        """
        total_voiceovers: int = 0
        for voiceover_type_to_voiceovers in (
                entity_voiceovers_model.voiceovers.values()):
            if 'manual' in voiceover_type_to_voiceovers:
                total_voiceovers += 1
        return total_voiceovers

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

        # Pair each exploration model with its exploration ID and create
        # key-value pairs.
        paired_exploration_models = (
            exploration_models
            | 'Pair Exploration ID to model' >> beam.Map(
                lambda model: (model.id, model))
        )

        exploration_voice_artists_link_models = (
            self.pipeline
            | 'Get exploration voice artists link models' >> (
                ndb_io.GetModels(
                    voiceover_models.ExplorationVoiceArtistsLinkModel.get_all()
                )
            )
        )

        # Pair each exploration voice artist model with its exploration ID and
        # create key-value pairs.
        paired_exploration_voice_artists_link_models = (
            exploration_voice_artists_link_models
            | 'Pair Exploration ID to voice artist link model' >> beam.Map(
                lambda model: (model.id, model))
        )

        # Group the key-value pairs from both PCollections by the
        # Exploration ID.
        grouped_models = {
            'exploration_model': paired_exploration_models,
            'voice_artist_link': paired_exploration_voice_artists_link_models,
        } | 'Group by Exploration ID' >> beam.CoGroupByKey()

        voice_artist_metadata_models = (
            self.pipeline
            | 'Get voice artist metadata model' >> (
                ndb_io.GetModels(
                    voiceover_models.VoiceArtistMetadataModel.get_all()
                )
            )
        )

        entity_voiceover_models = (
            grouped_models
            | 'Filter invalid exploration and voice artist link models' >> (
                beam.Filter(
                    lambda element: (
                        element[0] != '' and
                        len(element[1]['exploration_model']) > 0 and
                        len(element[1]['voice_artist_link']) > 0
                    )
                )
            )
            | 'Get entity voiceover models' >> beam.Map(
                PopulateManualVoiceoversToEntityVoiceoverModelJob.
                generate_entity_voiceover_model,
                beam.pvalue.AsList(voice_artist_metadata_models)
            )
            | 'Merge all entity voiceovers model' >> beam.FlatMap(
                lambda entity_voiceovers_model: entity_voiceovers_model)
        )

        entity_voiceover_models_result = (
            entity_voiceover_models
            | 'Get the exploration IDs for generated models' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Migrated %s voiceovers for exploration: %s, in language '
                    'accent code %s.' % (
                        PopulateManualVoiceoversToEntityVoiceoverModelJob.
                        count_voiceovers(model), model.entity_id,
                        model.language_accent_code)
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                entity_voiceover_models
                | 'Put models into datastore' >> ndb_io.PutModels()
            )
            pass

        return entity_voiceover_models_result


class AuditEntityVoiceoverModelJob(
    PopulateManualVoiceoversToEntityVoiceoverModelJob
):
    """Audit PopulateManualVoiceoversToEntityVoiceoverModelJob."""

    DATASTORE_UPDATES_ALLOWED = False
