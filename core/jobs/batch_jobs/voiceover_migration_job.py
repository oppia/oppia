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

"""Jobs used for fetching and saving voice artist names from curated
exploration models."""

from __future__ import annotations

import collections

from core.domain import exp_fetchers
from core.domain import voiceover_domain
from core.domain import voiceover_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import voiceover_models

datastore_services = models.Registry.import_datastore_services()

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])


class PopulateManualVoiceoversToEntityVoiceoverModelJob(base_jobs.JobBase):
    """Migrates voiceovers stored in the exploration model to the new
    EntityVoiceovers storage models.
    """

    DATASTORE_UPDATES_ALLOWED = True

    @classmethod
    def get_accent_code_for_given_voice_artist(
        cls,
        voice_artist_id: str,
        language_code: str
    ) -> str:
        with datastore_services.get_ndb_context():
            accent_code = voiceover_services.get_voice_artist_metadata_model(
                voice_artist_id, language_code)
        return accent_code

    @classmethod
    def update_entity_voiceover_for_given_id(
        cls,
        entity_type,
        entity_id,
        entity_version,
        accent_code,
        content_id,
        voiceover_dict,
        entity_voiceover_id_to_entity_voiceovers
    ):
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
                voiceover_domain.EntityVoiceovers.create_empty(
                    entity_id, entity_type, entity_version, accent_code))
        else:
            entity_voiceovers_object = (
                entity_voiceover_id_to_entity_voiceovers[entity_voiceover_id])

        entity_voiceovers_object.voiceovers = {
            content_id: {
                'manual': voiceover_dict
            }
        }

        entity_voiceover_id_to_entity_voiceovers[entity_voiceover_id] = (
            entity_voiceovers_object)
        return entity_voiceover_id_to_entity_voiceovers

    @classmethod
    def generate_entity_voiceover_model(
        cls,
        entity_voice_artists_link_model
    ):
        content_id_to_voiceovers_mapping = (
            entity_voice_artists_link_model.content_id_to_voiceovers_mapping)

        entity_type = 'exploration'
        entity_version = 0 # get latest exploration version
        entity_id = entity_voice_artists_link_model.id

        entity_voiceover_id_to_entity_voiceovers = (
            collections.defaultdict(dict))

        for content_id, lang_code_to_voiceover_mapping in (
                content_id_to_voiceovers_mapping.items()):
            for lang_code, voiceover_mapping in (
                    lang_code_to_voiceover_mapping.items()):
                voice_artist_id = voiceover_mapping[0]
                voiceover_dict = voiceover_mapping[1]

                accent_code = cls.get_accent_code_for_given_voice_artist(
                    voice_artist_id, lang_code)

                entity_voiceover_id_to_entity_voiceovers = (
                    cls.update_entity_voiceover_for_given_id(
                        entity_type,
                        entity_id,
                        entity_version,
                        accent_code,
                        content_id,
                        voiceover_dict
                    )
                )
        # Either return this or yield each item of the list.
        return entity_voiceover_id_to_entity_voiceovers.values()

    def get_exploration_from_model(
        self, exploration_model: exp_models.ExplorationModel
    ) -> Optional[exp_domain.Exploration]:
        """Gets Exploration domain object from exploration model.

        Args:
            exploration_model: ExplorationModel. The exploration model which is
                to be converted into Exploration domain object.

        Returns:
            Optional[exp_domain.Exploration]. The Exploration domain object
            for the given exploration model.
        """
        try:
            exploration = exp_fetchers.get_exploration_from_model(
                exploration_model
            )
            return exploration
        except Exception:
            return None

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results for the exploration for which an
        exploration voiceover migration has been done.

        Returns:
            PCollection. A PCollection of results for the exploration for which
            an exploration voiceover migration has been done.
        """

        exploration_voice_artists_link_models = (
            self.pipeline
            | 'Get exploration voice artists link models' >> (
                ndb_io.GetModels(
                    voiceover_models.ExplorationVoiceArtistsLinkModel.get_all()
                )
            )
        )

        entity_voiceover_models = (
            exploration_voice_artists_link_models
            | 'Get entity voiceover models' >> beam.Map(
                PopulateManualVoiceoversToEntityVoiceoverModelJob.
                generate_entity_voiceover_model
            )
        )


class AuditEntityVoiceoverModelJob(
    PopulateManualVoiceoversToEntityVoiceoverModelJob
):
    """Audit PopulateManualVoiceoversToEntityVoiceoverModelJob."""

    DATASTORE_UPDATES_ALLOWED = False
