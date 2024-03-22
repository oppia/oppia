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

from core.domain import opportunity_services
from core.domain import state_domain
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
    def is_exploration_curated(exploration_id: str) -> bool:
        """Verifies if the provided exploration ID is curated or not.

        Args:
            exploration_id: str. The given exploration ID.

        Returns:
            bool. A boolean value indicating if the exploration is curated
            or not.
        """
        with datastore_services.get_ndb_context():
            return (
                opportunity_services.
                is_exploration_available_for_contribution(exploration_id)
            )

    @classmethod
    def get_committer_id_for_given_snapshot_model_id(
        cls, snapshot_model_id: str
    ) -> Optional[str]:
        """Returns the committer ID for a given snapshot model ID
        using the snapshot metadata model.

        Args:
            snapshot_model_id: str. The exploration snapshot model ID.

        Returns:
            str. The committer ID for the given snapshot model ID.
        """
        with datastore_services.get_ndb_context():
            exp_snapshot_metadata_model = (
                exp_models.ExplorationSnapshotMetadataModel.get(
                    snapshot_model_id, strict=False))
        if exp_snapshot_metadata_model:
            assert isinstance(exp_snapshot_metadata_model.committer_id, str)
            return exp_snapshot_metadata_model.committer_id
        else:
            return None

    @classmethod
    def extract_added_voiceovers_between_successive_snapshots(
        cls,
        new_snapshot_model: exp_models.ExplorationSnapshotContentModel,
        old_snapshot_model: exp_models.ExplorationSnapshotContentModel
    ) -> Dict[str, Dict[str, state_domain.VoiceoverDict]]:
        """Compares two successive versions of snapshot models and
        extracts voiceovers that have been added in the later version of the
        exploration snapshot.

        Args:
            new_snapshot_model: ExplorationSnapshotContentModel. The new
                exploration snapshot model, let's say version n.
            old_snapshot_model: ExplorationSnapshotContentModel. The old
                exploration snapshot model, let's say version n-1.

        Returns:
            dict(str, dict(str, VoiceoverDict)). A dict with content IDs as keys
            and nested dicts as values. Each nested dict contains language codes
            as keys and voiceover dicts as values. Only voiceovers that exist in
            the new snapshot model but are absent in the old snapshot model are
            included in this dictionary.
        """

        # The voiceover mapping that is present in the new snapshot model.
        new_voiceover_mapping: Dict[str, Dict[
            str, state_domain.VoiceoverDict]] = {}

        # The voiceover mapping that is present in the old snapshot model.
        old_voiceover_mapping: Dict[str, Dict[
            str, state_domain.VoiceoverDict]] = {}

        for state in new_snapshot_model.content['states'].values():
            new_voiceover_mapping.update(
                state['recorded_voiceovers']['voiceovers_mapping'])

        for state in old_snapshot_model.content['states'].values():
            old_voiceover_mapping.update(
                state['recorded_voiceovers']['voiceovers_mapping'])

        # The voiceover mapping that has been added to this version of the
        # exploration snapshot.
        voiceovers_added_in_this_version: Dict[
            str, Dict[str, state_domain.VoiceoverDict]] = (
                collections.defaultdict(dict)
            )

        for content_id, lang_code_to_voiceover_dict in (
                new_voiceover_mapping.items()):
            for lang_code, voiceover_dict in (
                    lang_code_to_voiceover_dict.items()):
                if lang_code not in old_voiceover_mapping.get(content_id, {}):
                    voiceovers_added_in_this_version[content_id][lang_code] = (
                        voiceover_dict)
                else:
                    old_voiceover_dict = old_voiceover_mapping[
                        content_id][lang_code]
                    new_voiceover_dict = lang_code_to_voiceover_dict[lang_code]

                    if old_voiceover_dict != new_voiceover_dict:
                        voiceovers_added_in_this_version[
                            content_id][lang_code] = voiceover_dict

        return voiceovers_added_in_this_version

    @classmethod
    def get_content_id_mapping_and_voiceovers_count(
        cls,
        exploration: exp_models.ExplorationModel
    ) -> Tuple[Dict[str, Dict[str, state_domain.VoiceoverDict]], int]:
        """Retrieves and merges voiceover data from all the states within the
        specified exploration. Additionally, it calculates the total count of
        voiceovers present in the exploration.

        Args:
            exploration: ExplorationModel. The exploration model from which the
                content ID mapping dict and voiceover count will be generated.

        Returns:
            tuple(dict(str, dict(str, VoiceoverDict)), int). A 2-tuple with the
            following elements:
            - A dictionary mapping content IDs to nested dictionaries. Each
            nested dictionary maps language codes to voiceover dicts that are
            present in the exploration.
            - The number of existing voiceovers in the exploration.
        """
        number_of_voiceovers: int = 0
        content_id_to_voiceover_mapping: Dict[str, Dict[
            str, state_domain.VoiceoverDict]] = (
                collections.defaultdict(dict))

        for state in exploration.states.values():
            voiceover_mapping = (
                state['recorded_voiceovers']['voiceovers_mapping'])
            for content_id, lang_code_to_voiceovers in (
                    voiceover_mapping.items()):
                for lang_code, voiceover_dict in (
                        lang_code_to_voiceovers.items()):
                    content_id_to_voiceover_mapping[content_id][lang_code] = (
                        voiceover_dict)
                    number_of_voiceovers += 1

        return (content_id_to_voiceover_mapping, number_of_voiceovers)

    @classmethod
    def update_content_id_to_voiceovers_mapping(
        cls,
        voiceover_mapping_1: Dict[str, Dict[str, state_domain.VoiceoverDict]],
        voiceover_mapping_2: Dict[str, Dict[str, state_domain.VoiceoverDict]],
        voiceover_artist_and_voiceover_mapping: (
            voiceover_models.ContentIdToVoiceoverMappingType),
        voice_artist_id: str
    ) -> Tuple[voiceover_models.ContentIdToVoiceoverMappingType, int]:
        """Adds new voiceover entries to the
        `voiceover_artist_and_voiceover_mapping` dictionary with their
        respective voice artists. Only include voiceovers that are present in
        both the `voiceover_mapping_1` and `voiceover_mapping_2` dictionaries.

        Args:
            voiceover_mapping_1: dict(str, dict(str, VoiceoverDict)). The
                dictionary contains voiceover data for some version of
                exploration, say N. This dict maps content IDs as keys and
                nested dicts as values. Each nested dict contains language codes
                as keys and voiceover dicts as values.
            voiceover_mapping_2: dict(str, dict(str, VoiceoverDict)). The
                dictionary contains voiceover data for some other version of
                exploration, say M. This dict maps content IDs as keys and
                nested dicts as values. Each nested dict contains language
                codes as keys and voiceover dicts as values.
            voiceover_artist_and_voiceover_mapping:
                ContentIdToVoiceoverMappingType. The dictionary contains
                voiceovers and voice artists information about an exploration.
                The voiceovers that are present in both voiceover_mapping_1 and
                voiceover_mapping_2 get added to this dictionary. This
                dictionary maps content IDs to nested dicts. Each nested
                dict has language codes as keys and a 2-tuple as values. The
                2-tuple contains voice artist ID as the first element and
                VoiceoverDict as the second element.
            voice_artist_id: str. The voice artist ID for the given
                voiceover_mapping_2.

        Returns:
            tuple(ContentIdToVoiceoverMappingType, int). A 2-tuple with the
            following elements:
            - A dictionary in which new voiceovers and voice artists are being
            added. The newly added voiceovers are filtered from the
            voiceover_mapping_2 dict using the voiceover_mapping_1 dict.
            This dict contains content IDs as keys and nested dicts as values.
            Each nested dict contains language codes as keys and a 2-tuple as
            values. The 2-tuple contains voice artist ID as the first element
            and VoiceoverDict as the second element.
            - The number of voiceovers that are identified after iterating
            through the voiceover mapping input. Identifying a voiceover means
            finding the voice artist who contributed to that voiceover.
        """

        # Identifying a voiceover means finding the voice artist who contributed
        # to that voiceover.
        number_of_voiceovers_identified = 0

        updated_voiceover_artist_and_voiceover_mapping: (
            voiceover_models.ContentIdToVoiceoverMappingType) = (
                collections.defaultdict(dict))
        updated_voiceover_artist_and_voiceover_mapping.update(
            voiceover_artist_and_voiceover_mapping)

        for content_id, lang_code_to_voiceovers in voiceover_mapping_2.items():

            # If a content ID is not present in the voiceover_mapping_1 dict,
            # we should skip the iteration for that content.
            if content_id not in voiceover_mapping_1:
                continue

            for lang_code, voiceover_dict in lang_code_to_voiceovers.items():

                # If a language code is not present for the given content ID in
                # the voiceover_mapping_1 dict, then we should skip the
                # iteration for that language code.
                if lang_code not in voiceover_mapping_1[content_id]:
                    continue

                referred_voiceover_dict = (
                    voiceover_mapping_1[content_id][lang_code])

                # If a voiceover dictionary does not match the referenced
                # voiceover dictionary, then we should skip the iteration for
                # the language code.
                # This equality check is dependable for confirming whether the
                # two voiceovers are identical or distinct. Two distinct
                # voiceovers can never be identical because the filename
                # property of a voiceover dictionary contains three elements:
                # content_id, language_code, and a random hash. Because of the
                # random hash, two distinct voiceovers can never share the
                # same filename.
                if voiceover_dict != referred_voiceover_dict:
                    continue

                updated_voiceover_artist_and_voiceover_mapping[content_id][
                    lang_code] = (voice_artist_id, voiceover_dict)

                number_of_voiceovers_identified += 1

        return (
            updated_voiceover_artist_and_voiceover_mapping,
            number_of_voiceovers_identified
        )

    @classmethod
    def get_exploration_voice_artists_link_model(
        cls,
        exploration_model: exp_models.ExplorationModel,
        snapshot_models: List[exp_models.ExplorationSnapshotContentModel]
    ) -> voiceover_models.ExplorationVoiceArtistsLinkModel:
        """Creates an exploration voice artist link model using the
        exploration snapshot models for a given exploration model.

        Args:
            exploration_model: ExplorationModel. The latest version of a
                curated exploration.
            snapshot_models: list(ExplorationSnapshotContentModel). A list of
                exploration snapshot models for every version of the specified
                curated exploration.

        Returns:
            ExplorationVoiceArtistsLinkModel. An object containing voice artist
            IDs and their provided voiceovers for the given exploration.
        """

        # The key for sorting is defined separately because of a mypy bug.
        # A [no-any-return] is thrown if key is defined in the sort()
        # method instead.
        # https://github.com/python/mypy/issues/9590
        k = lambda model: model.id
        snapshot_models.sort(key=k, reverse=True)

        # Identifying a voiceover means finding the voice artist who contributed
        # to that voiceover, using the previous versions of exploration
        # snapshots.
        total_number_of_voiceovers_to_identify: int = 0
        total_number_of_voiceovers_identified: int = 0

        # A dictionary mapping all the content IDs and voiceovers of the latest
        # exploration.
        latest_content_id_to_voiceover_mapping: Dict[str, Dict[
            str, state_domain.VoiceoverDict]] = {}

        # The dictionary contains information about voice artists and their
        # provided voiceovers in the given exploration. This dict is built
        # iteratively using exploration snapshot models.
        voiceover_artist_and_voiceover_mapping: (
            voiceover_models.ContentIdToVoiceoverMappingType) = (
                collections.defaultdict(dict)
            )

        (
            latest_content_id_to_voiceover_mapping,
            total_number_of_voiceovers_to_identify
        ) = (
            cls.get_content_id_mapping_and_voiceovers_count(exploration_model))

        # Note that, in this code, we don't need to explicitly handle the case
        # where explorations were reverted to previous versions. This is
        # because voiceover filenames include a random hash, which makes those
        # filenames unique. So, if a voiceover that was introduced in any
        # earlier version has the same filename as a voiceover in the latest
        # version, we can be sure that those represent the exact same voiceover
        # and can thus uniquely attribute the voiceover to the user who
        # introduced it in the earlier version.
        for index, new_snapshot_model in enumerate(snapshot_models[:-1]):
            old_snapshot_model = snapshot_models[index + 1]

            newly_added_voiceover_mapping = (
                cls.extract_added_voiceovers_between_successive_snapshots(
                    new_snapshot_model, old_snapshot_model))

            # If no voiceover-related changes were made during the commit,
            # then the rest of the for loop body can be skipped.
            if not bool(newly_added_voiceover_mapping):
                continue

            voice_artist_id = (
                cls.get_committer_id_for_given_snapshot_model_id(
                    new_snapshot_model.id)
            )

            # If voice_artist_id is None, this means the exploration
            # snapshot metadata model for the given commit does not exist.
            if voice_artist_id is None:
                continue

            (
                voiceover_artist_and_voiceover_mapping,
                number_of_voiceovers_identified
            ) = (
                cls.update_content_id_to_voiceovers_mapping(
                    latest_content_id_to_voiceover_mapping,
                    newly_added_voiceover_mapping,
                    voiceover_artist_and_voiceover_mapping,
                    voice_artist_id
                )
            )

            total_number_of_voiceovers_identified += (
                number_of_voiceovers_identified)

            # Once all voice artists for the latest exploration version are
            # identified, further iteration over the remaining unexplored
            # snapshot models can be avoided.
            if (
                total_number_of_voiceovers_to_identify ==
                total_number_of_voiceovers_identified
            ):
                break

        with datastore_services.get_ndb_context():
            exploration_voice_artists_link_model = (
                voiceover_services.
                create_exploration_voice_artists_link_model_instance(
                    exploration_model.id,
                    voiceover_artist_and_voiceover_mapping
                )
            )

        return exploration_voice_artists_link_model

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

        # Group the key-value pairs from both PCollections by the
        # Exploration ID.
        grouped_models = {
            'exploration_models': paired_exploration_models,
            'snapshot_models': paired_snapshot_models
        } | 'Group by Exploration ID' >> beam.CoGroupByKey()

        exploration_voice_artist_link_models = (
            grouped_models
            | 'Get curated exploration models' >> beam.Filter(
                lambda element: self.is_exploration_curated(
                    exploration_id=element[0])
                )
            | 'Get exploration voice artist link models' >> beam.Map(
                lambda element: (
                    CreateExplorationVoiceArtistLinkModelsJob.
                    get_exploration_voice_artists_link_model(
                        exploration_model=element[1]['exploration_models'][0],
                        snapshot_models=element[1]['snapshot_models']
                    )
                )
            )
        )

        exploration_voice_artist_link_result = (
            exploration_voice_artist_link_models
            | 'Get the exploration IDs for generated models' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Generated exploration voice artist link model for '
                    'exploration %s.' % model.id
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                exploration_voice_artist_link_models
                | 'Put models into datastore' >> ndb_io.PutModels()
            )
        return exploration_voice_artist_link_result


class AuditExplorationVoiceArtistLinkModelsJob(
    CreateExplorationVoiceArtistLinkModelsJob
):
    """Audit CreateExplorationVoiceArtistLinkModelsJob."""

    DATASTORE_UPDATES_ALLOWED = False
