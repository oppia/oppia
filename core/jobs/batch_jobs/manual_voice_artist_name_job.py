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

from core.domain import opportunity_services
from core.domain import voiceover_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, List, Tuple, TypedDict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import voiceover_models

datastore_services = models.Registry.import_datastore_services()

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])


class ExplorationAndSnapshotModelDict(TypedDict):
    """Dict representation of grouped exploration and snapshot models."""

    exploration_models: List[exp_models.ExplorationModel]
    snapshot_models: List[exp_models.ExplorationSnapshotContentModel]


class CreateExplorationVoiceArtistLinkaModelsJob(base_jobs.JobBase):
    """Jobs used for fetching and saving voice artist names from curated
    exploration models.
    """

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def check_exploration_is_curated(exploration_id: str) -> bool:
        """The method verifies if the provided exploration ID has been
        curated or not.

        Args:
            exploration_id: str. The given exploration ID.

        Returns:
            bool. A boolean value indicating if the exploration has been
            curated or not.
        """
        with datastore_services.get_ndb_context():
            return (
                opportunity_services.
                is_exploration_available_for_contribution(exploration_id)
            )

    def get_user_id_for_given_snapshot(
        self, snapshot_model_id: str
    ) -> str:
        """The method returns the commiter ID for a given snapshot model using
        the snapshot metadata model.

        Args:
            snapshot_model_id: str. The exploration snapshot model ID.

        Returns:
            str. The commiter ID for the given snapshot model.
        """

        user_id = ''
        with datastore_services.get_ndb_context():
            exp_snapshot_metadata_model = (
                exp_models.ExplorationSnapshotMetadataModel.get(
                    snapshot_model_id, strict=False))

            if exp_snapshot_metadata_model:
                user_id = exp_snapshot_metadata_model.committer_id

        return user_id

    def get_voiceover_from_recorded_voiceover_diff(
        self,
        new_voiceover_mapping: Dict[
            str, Dict[str, voiceover_models.VoiceoverDict]],
        old_voiceover_mapping: Dict[
            str, Dict[str, voiceover_models.VoiceoverDict]]
    ) -> Dict[str, Dict[str, voiceover_models.VoiceoverDict]]:
        """The method calculates the difference between the old and new values
        of the recorded voiceover to isolate and retrieve only the updated
        voiceover values within a given commit.

        Args:
            new_voiceover_mapping: dict(str, dict(str, VoiceoverDict)). A dict
                representing new values of recorded voiceovers.
            old_voiceover_mapping: dict(str, dict(str, VoiceoverDict)). A dict
                representing old values of recorded voiceovers.

        Returns:
            dict(str, dict(str, VoiceoverDict)). A dictionary maps content
            IDs as keys and nested dicts as values. Each nested dict contains
            language codes as keys and voiceover dicts as values. The dictionary
            representing the difference between the old and new values of the
            recorded voiceover.
        """

        voiceover_mapping_diff: Dict[
            str, Dict[str, voiceover_models.VoiceoverDict]] = {}

        for content_id, lang_code_to_voiceover_dict in (
            new_voiceover_mapping.items()):

            for lang_code, voiceover_dict in (
                lang_code_to_voiceover_dict.items()):

                if lang_code not in old_voiceover_mapping[content_id]:

                    if content_id not in voiceover_mapping_diff:
                        voiceover_mapping_diff[content_id] = {}

                    voiceover_mapping_diff[content_id][lang_code] = (
                        voiceover_dict)
                else:
                    old_voiceover_dict = old_voiceover_mapping[
                        content_id][lang_code]
                    new_voiceover_dict = new_voiceover_mapping[
                        content_id][lang_code]

                    if old_voiceover_dict != new_voiceover_dict:
                        if content_id not in voiceover_mapping_diff:
                            voiceover_mapping_diff[content_id] = {}

                        voiceover_mapping_diff[content_id][lang_code] = (
                            voiceover_dict)

        return voiceover_mapping_diff

    def get_voiceover_diff(
        self,
        new_snapshot: exp_models.ExplorationSnapshotContentModel,
        old_snapshot: exp_models.ExplorationSnapshotContentModel
    ) -> Dict[str, Dict[str, voiceover_models.VoiceoverDict]]:
        """The method calculates the voiceover difference between two
        successive versions of the exploration snapshot model.

        Args:
            new_snapshot: ExplorationSnapshotContentModel. The new exploration
                snapshot model, let's say version n.
            old_snapshot: ExplorationSnapshotContentModel. The old exploration
                snapshot model, let's say version n-1.

        Returns:
            dict(str, dict(str, VoiceoverDict)). A dictionary maps
            content IDs as keys and nested dicts as values. Each nested dict
            contains language codes as keys and voiceover dicts as values. The
            dictionary representing the difference between the old and new
            values of the recorded voiceover.
        """

        new_voiceover_mapping = {}
        old_voiceover_mapping = {}

        for state in new_snapshot.content['states'].values():
            voiceover_mapping = (
                state['recorded_voiceovers']['voiceovers_mapping'])
            new_voiceover_mapping.update(voiceover_mapping)

        for state in old_snapshot.content['states'].values():
            voiceover_mapping = (
                state['recorded_voiceovers']['voiceovers_mapping'])
            old_voiceover_mapping.update(voiceover_mapping)

        voiceover_mapping_diff = (
            self.get_voiceover_from_recorded_voiceover_diff(
                new_voiceover_mapping=new_voiceover_mapping,
                old_voiceover_mapping=old_voiceover_mapping
            )
        )
        return voiceover_mapping_diff

    def get_content_id_to_voice_artist_mapping(
        self,
        exploration: exp_models.ExplorationModel
    ) -> voiceover_models.ContentIdToVoiceoverMappingType:
        """This function generates a dictionary based on the contents of the
        provided exploration and associates it with the relevant voice artist
        ID responsible for the voiceovers.

        Args:
            exploration: ExplorationModel. The exploration model from which the
                dict will be created.

        Returns:
            ContentIdToVoiceoverMappingType. A dictionary with content IDs as
            keys and nested dicts as values. Each nested dict contains language
            codes as keys and a 2-tuple as values. The 2-tuple contains voice
            artist ID as the first element and VoiceoverDict as the second
            element.
        """

        content_id_to_voiceovers_mapping: (
            voiceover_models.ContentIdToVoiceoverMappingType) = {}
        for state in exploration.states.values():
            voiceover_mapping = (
                state['recorded_voiceovers']['voiceovers_mapping']
            )
            for content_id, lang_code_to_voiceovers in (
                    voiceover_mapping.items()):

                content_id_to_voiceovers_mapping[content_id] = {}

                for lang_code, voiceover_dict in (
                        lang_code_to_voiceovers.items()):

                    # Empty strings will be assigned as the voice artist name is
                    # currently unknown, but it will be updated during iteration
                    # on snapshot models.
                    content_id_to_voiceovers_mapping[content_id][lang_code] = (
                        '', voiceover_dict
                    )
        return content_id_to_voiceovers_mapping

    def update_content_id_to_voiceovers_mapping(
        self,
        content_id_to_voiceovers_mapping: (
            voiceover_models.ContentIdToVoiceoverMappingType),
        voiceover_mapping: voiceover_models.VoiceoverMappingType,
        voice_artist_id: str
    ) -> voiceover_models.ContentIdToVoiceoverMappingType:
        """The method updates the dictionary associated with the latest content
        of the provided exploration and assigns it to the respective voice
        artists after iterating through exploration snapshot models.

        Args:
            content_id_to_voiceovers_mapping: ContentIdToVoiceoverMappingType.
                A dictionary with content IDs as keys and nested dicts as
                values. Each nested dict contains language codes as keys and
                a 2-tuple as values. The 2-tuple contains voice artist ID as
                the first element and VoiceoverDict as the second element.
            voiceover_mapping: VoiceoverMappingType. A dictionary maps content
                IDs as keys and nested dicts as values. Each nested dict
                contains language codes as keys and voiceover dicts as values.
                The dictionary representing the difference between the old and
                new values of the recorded voiceover.
            voice_artist_id: str. The voice artist ID for the given voiceover
                mapping.

        Returns:
            ContentIdToVoiceoverMappingType. A dictionary with content IDs as
            keys and nested dicts as values. Each nested dict contains language
            codes as keys and a 2-tuple as values. The 2-tuple contains voice
            artist ID as the first element and VoiceoverDict as the second
            element.
        """

        for content_id, lang_code_to_voiceovers in voiceover_mapping.items():

            # If some old commit models contain voiceovers for
            # contents that are not part of the current version,
            # then we should skip the content.
            if content_id not in content_id_to_voiceovers_mapping:
                continue

            for lang_code, voiceover_dict in lang_code_to_voiceovers.items():

                # If some old commit models contain voiceovers in
                # languages that are not part of the current version,
                # then we should skip the language.
                if lang_code not in (
                    content_id_to_voiceovers_mapping[content_id]
                ):
                    continue

                # If the voice artist ID for the specified language code is
                # non-empty, then we should skip it, as we are iterating through
                # snapshot models in reverse order, meaning that in earlier
                # versions, the voice artist ID would have already been added.
                user_id = (
                    content_id_to_voiceovers_mapping[content_id][lang_code][0])
                if user_id != '':
                    continue

                content_id_to_voiceovers_mapping[content_id][lang_code] = (
                    voice_artist_id, voiceover_dict)

        return content_id_to_voiceovers_mapping

    def exploration_voiceover_is_completely_filled(
        self,
        content_id_to_voiceovers_mapping: (
            voiceover_models.ContentIdToVoiceoverMappingType)
    ) -> bool:
        """The method is to check whether all the contents of the latest
        exploration are mapped to their corresponding voice artist IDs who have
        contributed to the respective voiceovers.

        Args:
            content_id_to_voiceovers_mapping: ContentIdToVoiceoverMappingType.
                A dictionary with content IDs as keys and nested dicts as
                values. Each nested dict contains language codes as keys and
                a 2-tuple as values. The 2-tuple contains voice artist ID as
                the first element and VoiceoverDict as the second element.

        Returns:
            bool. A boolean value representing whether all the contents are
            mapped with the corresponding voiceo artists.
        """
        for content_id, lang_code_to_voiceovers in (
            content_id_to_voiceovers_mapping.items()
        ):
            for lang_code in lang_code_to_voiceovers:

                user_id = (
                    content_id_to_voiceovers_mapping[content_id][lang_code][0])
                if user_id == '':
                    return False
        return True

    def get_exploration_voice_artists_link_model(
        self,
        elements: Tuple[str, ExplorationAndSnapshotModelDict]
    ) -> voiceover_models.ExplorationVoiceArtistsLinkModel:
        """The method creates an exploration voice artist link model using the
        exploration snapshot models for a given exploration model.

        Args:
            elements: *. A 2-tuple pairs the exploration ID with a dataset.
                The dataset is a dictionary containing the keys
                "exploration_models" and "exploration_snapshot_models", each
                corresponding to a list of exploration models and exploration
                snapshot models, respectively.

        Returns:
            ExplorationVoiceArtistsLinkModel. An instance of
            ExplorationVoiceArtistsLinkModel is created using exploration
            snapshot models for the given exploration.
        """

        exploration_id: str = elements[0]
        exploration_model = elements[1]['exploration_models'][0]
        snapshot_models = elements[1]['snapshot_models']

        # The key for sorting is defined separately because of a mypy bug.
        # A [no-any-return] is thrown if key is defined in the sort()
        # method instead.
        # https://github.com/python/mypy/issues/9590
        k = lambda model: model.id
        snapshot_models.sort(key=k, reverse=True)

        content_id_to_voiceovers_mapping = (
            self.get_content_id_to_voice_artist_mapping(exploration_model))

        for index, new_snapshot_model in enumerate(snapshot_models[:-1]):
            old_snapshot_model = snapshot_models[index + 1]

            voiceover_mapping_diff = self.get_voiceover_diff(
                new_snapshot_model, old_snapshot_model)

            # If the voiceover mapping difference dictionary is empty, it
            # indicates that no voiceover-related changes were made during the
            # commit, and thus this part can be skipped.
            if not bool(voiceover_mapping_diff):
                continue

            voice_artist_id = self.get_user_id_for_given_snapshot(
                new_snapshot_model.id)

            # If the voice artist ID is empty, this means the exploration
            # snapshot metadata model for the given commit does not exist.
            if voice_artist_id == '':
                continue

            # If all exploration voiceover data is present, we can avoid
            # iterating over the remaining unexplored snapshot models.
            if self.exploration_voiceover_is_completely_filled(
                content_id_to_voiceovers_mapping
            ):
                break

            content_id_to_voiceovers_mapping = (
                self.update_content_id_to_voiceovers_mapping(
                    content_id_to_voiceovers_mapping,
                    voiceover_mapping_diff,
                    voice_artist_id
                )
            )

        with datastore_services.get_ndb_context():
            exploration_voice_artists_link_model = (
                voiceover_services.
                create_exploration_voice_artists_link_model_instance(
                    exploration_id, content_id_to_voiceovers_mapping
                )
            )

            return exploration_voice_artists_link_model

    def extract_exploration_id_from_snapshot_id(
        self,
        snapshot_model_id: str
    ) -> str:
        """The function retrieves the substring of the snapshot model ID that
        matches the exploration ID. The snapshot model ID follows the pattern
        "<exploration_id>-<version>".

        Args:
            snapshot_model_id: str. The given snapshot model ID.

        Returns:
            str. The exploration ID extracted from the snapshot model ID.
        """

        return snapshot_model_id.split('-')[0]

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
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
                    self.extract_exploration_id_from_snapshot_id(
                        model.id), model
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
                lambda element: self.check_exploration_is_curated(
                    exploration_id=element[0])
                )
            | 'Get exploration voice artist link models' >> beam.Map(
                self.get_exploration_voice_artists_link_model)
        )

        exploration_voice_artist_link_result = (
            exploration_voice_artist_link_models
            | 'Get the result for models' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Generated exploration voice artist link for %s.' %
                    model.id
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                exploration_voice_artist_link_models
                | 'Put models into datastore' >> ndb_io.PutModels()
            )
        return exploration_voice_artist_link_result


class AuditExplorationVoiceArtistLinkaModelsJob(
    CreateExplorationVoiceArtistLinkaModelsJob
):
    """Audit CreateExplorationVoiceArtistLinkaModelsJob."""

    DATASTORE_UPDATES_ALLOWED = False
