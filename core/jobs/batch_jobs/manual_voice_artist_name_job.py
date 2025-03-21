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
import logging
import threading

from core.domain import opportunity_services
from core.domain import state_domain
from core.domain import user_services
from core.domain import voiceover_domain
from core.domain import voiceover_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, List, Optional, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import voiceover_models

datastore_services = models.Registry.import_datastore_services()

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])


class CreateExplorationVoiceArtistLinkModelsJob(base_jobs.JobBase):
    """Jobs used for fetching and saving voice artist names from curated
    exploration models.
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

    @classmethod
    def is_voiceover_changes_made(
        cls, exp_snapshot_metadata_model: (
            exp_models.ExplorationSnapshotMetadataModel)
    ) -> bool:
        """Checks whether the given snapshot model contains voiceover-related
        changes.

        Args:
            exp_snapshot_metadata_model: ExplorationSnapshotMetadataModel.
                The exploration snapshot metadata model.

        Returns:
            bool. Whether the given snapshot model contains voiceover-related
            changes.
        """

        try:
            for change in exp_snapshot_metadata_model.commit_cmds:
                if (
                    change['cmd'] == 'edit_state_property' and
                    change['property_name'] == 'recorded_voiceovers'
                ):
                    return True
        except Exception:
            logging.exception(
                'Not able to check voiceover changes for snapshot model ID %s.'
                % exp_snapshot_metadata_model.id
            )
        return False

    @classmethod
    def extract_added_voiceovers_between_successive_snapshots(
        cls,
        new_snapshot_model: exp_models.ExplorationSnapshotContentModel,
        old_snapshot_model: exp_models.ExplorationSnapshotContentModel
    ) -> List[str]:
        """Compares two successive versions of snapshot models and
        extracts voiceovers that have been added in the later version of the
        exploration snapshot.

        Args:
            new_snapshot_model: ExplorationSnapshotContentModel. The new
                exploration snapshot model, let's say version n.
            old_snapshot_model: ExplorationSnapshotContentModel. The old
                exploration snapshot model, let's say version n-1.

        Returns:
            list(str). A list of filenames as values. Only voiceover
            filenames that exist in the new snapshot model but are absent in
            the old snapshot model are included in this dictionary.

        Raises:
            Exception. Failed to get newly added voiceovers between the given
                snapshot models.
        """
        # The voiceover filenames that are present in the new snapshot model.
        new_filenames: List[str] = []

        # The voiceover filenames that are present in the old snapshot model.
        old_filenames: List[str] = []

        # The voiceover filenames that has been added to this version of the
        # exploration snapshot.
        filenames_in_this_version: List[str] = []

        for state in new_snapshot_model.content['states'].values():
            voiceovers_mapping = (
                state['recorded_voiceovers']['voiceovers_mapping'])
            for lang_code_to_voiceover_dict in voiceovers_mapping.values():
                for voiceover_dict in lang_code_to_voiceover_dict.values():
                    new_filenames.append(voiceover_dict['filename'])

        for state in old_snapshot_model.content['states'].values():
            voiceovers_mapping = (
                state['recorded_voiceovers']['voiceovers_mapping'])
            for lang_code_to_voiceover_dict in voiceovers_mapping.values():
                for voiceover_dict in lang_code_to_voiceover_dict.values():
                    old_filenames.append(voiceover_dict['filename'])

        for filename in new_filenames:
            if filename not in old_filenames:
                filenames_in_this_version.append(filename)

        return filenames_in_this_version

    @classmethod
    def get_exploration_voice_artists_link_model(
        cls,
        exploration_model: exp_models.ExplorationModel,
        snapshot_models: List[exp_models.ExplorationSnapshotContentModel],
        metadata_models: List[exp_models.ExplorationSnapshotMetadataModel]
    ) -> Tuple[
        Optional[voiceover_models.ExplorationVoiceArtistsLinkModel], str]:
        """Creates an exploration voice artist link model using the
        exploration snapshot models for a given exploration model.

        Args:
            exploration_model: ExplorationModel. The latest version of a
                curated exploration.
            snapshot_models: list(ExplorationSnapshotContentModel). A list of
                exploration snapshot models for every version of the specified
                curated exploration.
            metadata_models: list(ExplorationSnapshotMetadataModel). A list of
                exploration snapshot metadata models for every version of the
                specified curated exploration.

        Returns:
            A 2-tuple with the following elements:
            - ExplorationVoiceArtistsLinkModel. An object containing voice
            artist IDs and their provided voiceovers for the given exploration.
            - The debug logs.
        """

        metadata_models_dict: Dict[
            str, exp_models.ExplorationSnapshotMetadataModel] = {}
        for metadata_model in metadata_models:
            metadata_models_dict[metadata_model.id] = metadata_model

        snapshot_models_dict = {}
        for snapshot_model in snapshot_models:
            snapshot_models_dict[snapshot_model.id] = snapshot_model

        # Identifying a voiceover means finding the voice artist who contributed
        # to that voiceover, using the previous versions of exploration
        # snapshots.
        total_number_of_voiceovers_to_identify: int = 0
        total_number_of_voiceovers_identified: int = 0

        # A dictionary mapping all the content IDs and voiceovers of the latest
        # exploration.
        latest_content_id_to_voiceover_mapping: Dict[str, Dict[
            str, state_domain.VoiceoverDict]] = collections.defaultdict(dict)

        # Collects all the debug logs.
        debug_logs: str = (
            'Exp ID: %s.\n' % exploration_model.id)
        debug_logs += ('Snapshots: %s\n' % len(snapshot_models))

        # The dictionary contains information about voice artists and their
        # provided voiceovers in the given exploration. This dict is built
        # iteratively using exploration snapshot models.
        voiceover_artist_and_voiceover_mapping: (
            voiceover_domain.ContentIdToVoiceoverMappingType) = (
                collections.defaultdict(dict)
            )

        for state in exploration_model.states.values():
            voiceovers_mapping = (
                state['recorded_voiceovers']['voiceovers_mapping'])
            for content_id, lang_code_to_voiceovers in (
                    voiceovers_mapping.items()):
                for lang_code, voiceover_dict in (
                        lang_code_to_voiceovers.items()):

                    latest_content_id_to_voiceover_mapping[
                        content_id][lang_code] = voiceover_dict
                    total_number_of_voiceovers_to_identify += 1

        current_version = exploration_model.version

        logging.info('Logs for exploration: %s.\n' % exploration_model.id)

        # Note that, in this code, we don't need to explicitly handle the case
        # where explorations were reverted to previous versions. This is
        # because voiceover filenames include a random hash, which makes those
        # filenames unique. So, if a voiceover that was introduced in any
        # earlier version has the same filename as a voiceover in the latest
        # version, we can be sure that those represent the exact same voiceover
        # and can thus uniquely attribute the voiceover to the user who
        # introduced it in the earlier version.
        for version in range(current_version, 0, -1):
            new_snapshot_id = exploration_model.id + '-' + str(version)
            old_snapshot_id = exploration_model.id + '-' + str(version - 1)

            logging.info(
                'Current iteration for snapshots: %s and %s\n' % (
                    old_snapshot_id, new_snapshot_id))
            logging.info('Thread ID: %s\n' % threading.get_native_id())

            if old_snapshot_id not in snapshot_models_dict:
                continue
            if new_snapshot_id not in snapshot_models_dict:
                continue
            if new_snapshot_id not in metadata_models_dict:
                continue

            new_snapshot_model = snapshot_models_dict[new_snapshot_id]
            old_snapshot_model = snapshot_models_dict[old_snapshot_id]

            # If the commit does not contain voiceover changes, then we should
            # skip the snapshot model.
            if not cls.is_voiceover_changes_made(
                    metadata_models_dict[new_snapshot_model.id]):
                continue

            try:
                filenames_in_this_version = (
                    cls.extract_added_voiceovers_between_successive_snapshots(
                        new_snapshot_model, old_snapshot_model))
            except Exception as e:
                logging.exception(
                    'Failed to get newly added voiceover between snapshot '
                    'versions %s and %s, with error: %s' % (
                        old_snapshot_model.id, new_snapshot_model.id, e)
                )
                # If the method does not successfully retrieve newly added
                # voiceovers in these versions of snapshot models, we should
                # bypass the iteration, as it indicates potential corruption or
                # outdated data within the snapshot model.
                continue

            # If no voiceover-related changes were made during the commit,
            # then the rest of the for loop body can be skipped.
            if len(filenames_in_this_version) == 0:
                continue

            voice_artist_id = (
                metadata_models_dict[new_snapshot_model.id].committer_id
            )

            try:
                with datastore_services.get_ndb_context():
                    voice_artist_username = (
                        user_services.get_username(voice_artist_id))
            except Exception:
                voice_artist_username = (
                    'Not Found for user ID: %s.' % voice_artist_id)

            debug_logs += ('-\n')
            debug_logs += ('a. %s\n' % voice_artist_username)
            debug_logs += ('b. %s & %s\n' % (
                old_snapshot_model.id, new_snapshot_model.id))
            debug_logs += ('c. %s, [%s]\n' % (
                len(filenames_in_this_version),
                ', '.join(filenames_in_this_version)
            ))

            logging.info('-\n')
            logging.info('a. %s\n' % voice_artist_username)
            logging.info('b. %s & %s\n' % (
                old_snapshot_model.id, new_snapshot_model.id))
            logging.info('c. %s, [%s]\n' % (
                len(filenames_in_this_version),
                ', '.join(filenames_in_this_version)
            ))

            for content_id, lang_code_to_voiceovers in (
                    latest_content_id_to_voiceover_mapping.items()):

                for lang_code, voiceover_dict in (
                        lang_code_to_voiceovers.items()):

                    referred_filename = voiceover_dict['filename']

                    # If a voiceover filename is not present in
                    # lang_code_to_filenames, then we should skip the iteration
                    # for the language code.
                    # This equality check is dependable for confirming whether
                    # the two voiceovers are identical or distinct. Two distinct
                    # voiceovers can never be identical because the filename
                    # property of a voiceover dictionary contains three
                    # elements: content_id, language_code, and a random hash.
                    # Because of the random hash, two distinct voiceovers can
                    # never share the same filename.
                    if referred_filename in filenames_in_this_version:
                        voiceover_artist_and_voiceover_mapping[content_id][
                            lang_code] = (voice_artist_id, voiceover_dict)

                        total_number_of_voiceovers_identified += 1

            # Once all voice artists for the latest exploration version are
            # identified, further iteration over the remaining unexplored
            # snapshot models can be avoided.
            if (
                total_number_of_voiceovers_to_identify ==
                total_number_of_voiceovers_identified
            ):
                break

        debug_logs += ('\n')

        with datastore_services.get_ndb_context():
            exploration_voice_artists_link_model = (
                voiceover_services.
                create_exploration_voice_artists_link_model_instance(
                    exploration_model.id,
                    voiceover_artist_and_voiceover_mapping
                )
            )

        return exploration_voice_artists_link_model, debug_logs

    def extract_exploration_id_from_snapshot_id(
        self,
        snapshot_model_id: str
    ) -> str:
        """Retrieves the substring of the snapshot model ID that
        matches the exploration ID. The snapshot model ID follows the pattern
        "<exploration_id>-<version>".

        Args:
            snapshot_model_id: str. The given snapshot model ID.

        Returns:
            str. The exploration ID extracted from the snapshot model ID.
        """

        return snapshot_model_id.split('-')[0]

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results for the exploration for which an
        exploration voice artist link model has been generated.

        Returns:
            PCollection. A PCollection of results for the exploration for
            which an exploration voice artist link model has been generated.
        """
        exploration_models = (
            self.pipeline
            | 'Get exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
        )

        exploration_snapshot_models = (
            self.pipeline
            | 'Get exploration snapshot models' >> ndb_io.GetModels(
                exp_models.ExplorationSnapshotContentModel.get_all())
        )

        exploration_snapshot_metadata_models = (
            self.pipeline
            | 'Get exploration snapshot metadata models' >> ndb_io.GetModels(
                exp_models.ExplorationSnapshotMetadataModel.get_all())
        )

        # Pair each exploration model with its exploration ID and create
        # key-value pairs.
        paired_exploration_models = (
            exploration_models
            | 'Pair Exploration ID to model' >> beam.Map(
                lambda model: (model.id, model))
        )

        # Pair each exploration snapshot model with its exploration ID and
        # create key-value pairs.
        paired_snapshot_models = (
            exploration_snapshot_models
            | 'Pair Exploration snapshot ID to model' >> beam.Map(
                lambda model: (
                    self.extract_exploration_id_from_snapshot_id(model.id),
                    model
                )
            )
        )

        # Pair each exploration snapshot metadata model with its exploration
        # ID and create key-value pairs.
        paired_snapshot_metadata_models = (
            exploration_snapshot_metadata_models
            | 'Pair Exploration snapshot metadata ID to model' >> beam.Map(
                lambda model: (
                    self.extract_exploration_id_from_snapshot_id(model.id),
                    model
                )
            )
        )

        # Group the key-value pairs from both PCollections by the
        # Exploration ID.
        grouped_models = {
            'exploration_models': paired_exploration_models,
            'snapshot_models': paired_snapshot_models,
            'metadata_models': paired_snapshot_metadata_models
        } | 'Group by Exploration ID' >> beam.CoGroupByKey()

        voice_artist_link_models_and_logs = (
            grouped_models
            | 'Get curated and valid exploration models' >> beam.Filter(
                lambda element: (
                    element[0] != '' and
                    self.is_exploration_curated(exploration_id=element[0]) and
                    len(element[1]['exploration_models']) > 0 and
                    len(element[1]['snapshot_models']) > 0 and
                    len(element[1]['metadata_models']) > 0
                )
            )
            | 'Get exploration voice artist link models' >> beam.Map(
                lambda element: (
                    CreateExplorationVoiceArtistLinkModelsJob.
                    get_exploration_voice_artists_link_model(
                        exploration_model=element[1]['exploration_models'][0],
                        snapshot_models=element[1]['snapshot_models'],
                        metadata_models=element[1]['metadata_models']
                    )
                )
            )
            | 'Filter None objects' >> beam.Filter(
                lambda model: model[0] is not None
            )
        )

        voice_artist_link_models = (
            voice_artist_link_models_and_logs
            | 'Unpack models' >> beam.Map(lambda element: element[0])
        )

        debug_logs = (
            voice_artist_link_models_and_logs
            | 'Unpack and get debug logs result' >> beam.Map(
                lambda element: (
                    job_run_result.JobRunResult.as_stdout(element[1])
                )
            )
        )

        exploration_voice_artist_link_result = (
            voice_artist_link_models
            | 'Get the exploration IDs for generated models' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Generated exploration voice artist link model for '
                    'exploration %s.' % model.id
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                voice_artist_link_models
                | 'Put models into datastore' >> ndb_io.PutModels()
            )
        return (
            (
                exploration_voice_artist_link_result,
                debug_logs
            ) | 'Flatten job run results' >> beam.Flatten()
        )


class AuditExplorationVoiceArtistLinkModelsJob(
    CreateExplorationVoiceArtistLinkModelsJob
):
    """Audit CreateExplorationVoiceArtistLinkModelsJob."""

    DATASTORE_UPDATES_ALLOWED = False
