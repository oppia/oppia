# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""ExplorationModel and EntityVoiceovesModel sync jobs."""

from __future__ import annotations

import logging

from core.domain import opportunity_services
from core.domain import state_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

from typing import Iterable, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import voiceover_models

datastore_services = models.Registry.import_datastore_services()

(voiceover_models, exp_models,) = models.Registry.import_models(
    [models.Names.VOICEOVER, models.Names.EXPLORATION])


def get_exploration_id_and_language_accent_code(
    entity_voiceovers_model: voiceover_models.EntityVoiceoversModel
) -> str:
    """Returns a string combining the exploration ID and language-accent code
    from the given EntityVoiceoversModel, separated by a hyphen.

    Args:
        entity_voiceovers_model: EntityVoiceoversModel. An instance of
            EntityVoiceoversModel.

    Returns:
        str. The exploration ID and language-accent code joined by a hyphen.
    """
    exploration_id = entity_voiceovers_model.entity_id
    language_accent_code = entity_voiceovers_model.language_accent_code

    return '%s-%s' % (exploration_id, language_accent_code)


def get_content_id_to_manual_voiceovers_mapping(
    entity_voiceovers_model: voiceover_models.EntityVoiceoversModel
) -> dict[str, state_domain.VoiceoverDict]:
    """Returns a dictionary mapping content IDs to their manual voiceovers
    from the given EntityVoiceoversModel.

    Args:
        entity_voiceovers_model: EntityVoiceoversModel. An instance of
            EntityVoiceoversModel.

    Returns:
        dict. A dictionary where keys are content IDs and values are the
        corresponding manual voiceovers.
    """
    content_id_to_manual_voiceovers = {}

    for content_id, manual_voiceover_mapping in (
            entity_voiceovers_model.voiceovers_mapping.items()):
        manual_voiceover = manual_voiceover_mapping['manual']
        content_id_to_manual_voiceovers[content_id] = manual_voiceover

    return content_id_to_manual_voiceovers


def update_entity_voiceovers_model(
    content_id_to_manual_voiceovers: dict[str, state_domain.VoiceoverDict],
    entity_voiceovers_model: voiceover_models.EntityVoiceoversModel
) -> voiceover_models.EntityVoiceoversModel:
    """Updates the EntityVoiceoversModel with the provided manual voiceovers.

    Args:
        content_id_to_manual_voiceovers: dict. A dictionary mapping content IDs
            to their corresponding manual voiceovers.
        entity_voiceovers_model: EntityVoiceoversModel. An instance of
            EntityVoiceoversModel to be updated.

    Returns:
        EntityVoiceoversModel. The updated EntityVoiceoversModel instance.
    """
    for content_id, manual_voiceover in (
            content_id_to_manual_voiceovers.items()):
        if content_id not in entity_voiceovers_model.voiceovers_mapping:
            entity_voiceovers_model.voiceovers_mapping[content_id] = {
                'manual': manual_voiceover,
                'auto': None
            }
        else:
            entity_voiceovers_model.voiceovers_mapping[content_id][
                'manual'] = manual_voiceover

    return entity_voiceovers_model


class ExplorationVoiceoverSyncJob(base_jobs.JobBase):
    """Job updates the EntityVoiceoversModel and logs the model IDs and versions
    which went out of sync during Exploration update.
    """

    DATASTORE_UPDATES_ALLOWED = True

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

    @staticmethod
    def sync_entity_voiceovers_models(
        entity_voiceovers_models: Iterable[
            voiceover_models.EntityVoiceoversModel],
        exploration_id_to_version: dict[str, int]
    ) -> Optional[voiceover_models.EntityVoiceoversModel]:
        """Checks for and resolves out-of-sync issues among
        EntityVoiceoversModels. If any gaps are found between successive model
        versions, updates are made and the most recent updated
        EntityVoiceoversModel is returned. If all models are already in sync,
        returns None.

        Args:
            entity_voiceovers_models: List[EntityVoiceoversModel]. A list of
                EntityVoiceoversModel instances to synchronize.
            exploration_id_to_version: dict. A dictionary mapping exploration
                IDs to their latest version numbers.

        Returns:
            Optional[EntityVoiceoversModel]. The latest updated
            EntityVoiceoversModel if any out-of-sync issues were fixed,
            otherwise None.
        """
        fixes_out_of_sync_issue = False

        with datastore_services.get_ndb_context():
            entity_voiceovers_models = list(entity_voiceovers_models)
            previous_model = entity_voiceovers_models[0]
            exploration_id = previous_model.entity_id
            latest_exploration_version = exploration_id_to_version.get(
                exploration_id)
            assert isinstance(latest_exploration_version, int)

            logging.info(
                'Syncing EntityVoiceoversModels for exploration ID: %s, '
                'language-accent code: %s.\n' % (
                    previous_model.entity_id,
                    previous_model.language_accent_code
                )
            )

        for current_model in entity_voiceovers_models:
            if previous_model.entity_version == current_model.entity_version:
                continue

            if (
                previous_model.entity_version + 1 ==
                current_model.entity_version
            ):
                previous_model = current_model
                continue

            # If the above condition is not met, it means that the
            # EntityVoiceoversModel has gone out of sync.

            logging.info(
                'Version out of sync: %s -> %s.' % (
                    previous_model.entity_version,
                    current_model.entity_version
                )
            )

            prev_content_id_to_manual_voiceovers = (
                get_content_id_to_manual_voiceovers_mapping(previous_model))

            current_content_id_to_manual_voiceovers = (
                get_content_id_to_manual_voiceovers_mapping(current_model))

            for content_id, manual_voiceover in (
                    prev_content_id_to_manual_voiceovers.items()):
                if content_id not in current_content_id_to_manual_voiceovers:
                    current_content_id_to_manual_voiceovers[
                        content_id] = manual_voiceover

            updated_entity_voiceovers_model = update_entity_voiceovers_model(
                current_content_id_to_manual_voiceovers, current_model)

            previous_model = updated_entity_voiceovers_model
            fixes_out_of_sync_issue = True

        if previous_model.entity_version != latest_exploration_version:
            # If the latest EntityVoiceoversModel version is not equal to the
            # latest ExplorationModel version, then we need to update it.
            logging.info(
                'Version out of sync: %s -> %s.' % (
                previous_model.entity_version, latest_exploration_version))
            with datastore_services.get_ndb_context():
                previous_model = (
                    voiceover_models.EntityVoiceoversModel.create_new(
                        previous_model.entity_type,
                        previous_model.entity_id,
                        latest_exploration_version,
                        previous_model.language_accent_code,
                        previous_model.voiceovers_mapping,
                        {}
                    )
                )
                previous_model.update_timestamps()
            fixes_out_of_sync_issue = True

        logging.info('\n')

        if fixes_out_of_sync_issue:
            return previous_model
        else:
            return None

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of job run results for EntityVoiceoversModels
        that were updated due to being out-of-sync.

        Returns:
            beam.PCollection[job_run_result.JobRunResult]. A PCollection
            containing job run results with the IDs and versions of updated
            EntityVoiceoversModels.
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

        exploration_id_to_version_dict = (
            exploration_models
            | 'Map exploration ID to version' >> beam.Map(
                lambda model: (model.id, model.version))
            | 'Convert to version dict' >> beam.combiners.ToDict()
        )

        entity_voiceovers_models = (
            self.pipeline
            | 'Get all EntityVoiceoversModels' >> ndb_io.GetModels(
                voiceover_models.EntityVoiceoversModel.get_all()
            )
            | 'Filter EntityVoiceoversModels for curated explorations' >> (
                beam.Filter(
                    lambda model: self.is_exploration_curated(
                    exploration_id=model.entity_id)
                )
            )
        )

        paired_entity_voiceovers_models = (
            entity_voiceovers_models
            | 'Pair EntityVoiceoversModels' >> beam.Map(
                lambda model: (
                    get_exploration_id_and_language_accent_code(model),
                    model
                )
            )
        )

        updated_entity_voiceovers_models = (
            paired_entity_voiceovers_models
            | 'Group by exploration ID and language-accent code' >> (
                beam.GroupByKey())
            | 'Sync EntityVoiceoversModels with latest version' >> beam.Map(
                lambda kv, version_dict: self.sync_entity_voiceovers_models(
                    kv[1], version_dict),
                beam.pvalue.AsSingleton(
                    exploration_id_to_version_dict))
            | 'Filter out None results' >> beam.Filter(
                lambda model: model is not None
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                updated_entity_voiceovers_models
                | 'Put models into datastore' >> ndb_io.PutModels()
            )

        return (
            updated_entity_voiceovers_models
            | 'Format results' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Fixes out-of-sync issue for EntityVoiceoversModel ID: %s.'
                    % model.id
                )
            )
        )


class ExplorationVoiceoverSyncAuditJob(ExplorationVoiceoverSyncJob):
    """Audit Job that syncs EntityVoiceoversModel."""

    DATASTORE_UPDATES_ALLOWED = False
