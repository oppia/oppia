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


class CreateExplorationVoiceArtistLinkModelsJob(base_jobs.JobBase):
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

    @classmethod
    def get_user_id_for_given_snapshot(
        cls, snapshot_model_id: str
    ) -> str:
        """The method returns the commiter ID for a given snapshot model using
        the snapshot metadata model.

        Args:
            snapshot_model_id: str. The exploration snapshot model ID.

        Returns:
            str. The commiter ID for the given snapshot model.

        Raises:
            Exception. The exploration commit log entry model for the given ID
                does not exist.
        """
        user_id: str = ''
        try:
            with datastore_services.get_ndb_context():
                exp_snapshot_metadata_model = (
                    exp_models.ExplorationSnapshotMetadataModel.get(
                        snapshot_model_id))

                user_id = exp_snapshot_metadata_model.committer_id
        except Exception as e:
            raise Exception(
                'The exploration commit log entry model for the given ID: %s, '
                'does not exist' % snapshot_model_id
            ) from e
        return user_id

    @classmethod
    def get_voiceover_from_recorded_voiceover_diff(
        cls,
        new_voiceover_mapping: Dict[
            str, Dict[str, voiceover_models.VoiceoverDict]],
        old_voiceover_mapping: Dict[
            str, Dict[str, voiceover_models.VoiceoverDict]]
    ) -> Dict[str, Dict[str, voiceover_models.VoiceoverDict]]:
        """The method compares two voiceover mapping dictionaries and extracts
        voiceovers present in the new_voiceover_mapping but not in the
        old_voiceover_mapping.

        Args:
            new_voiceover_mapping: dict(str, dict(str, VoiceoverDict)). A
                dictionary maps content IDs as keys and nested dicts as values.
                Each nested dict contains language codes as keys and voiceover
                dicts as values. The dict represents the new values of recorded
                voiceovers in the current commit.
            old_voiceover_mapping: dict(str, dict(str, VoiceoverDict)). A
                dictionary maps content IDs as keys and nested dicts as values.
                Each nested dict contains language codes as keys and voiceover
                dicts as values. The dict represents the old values of recorded
                voiceovers in the previous commit.

        Returns:
            dict(str, dict(str, VoiceoverDict)). A dict with content IDs as keys
            and nested dicts as values. Each nested dict contains language codes
            as keys and voiceover dicts as values. Only voiceovers that exist in
            the new voiceover mapping but are absent in the old one are included
            in this dictionary.
        """

        voiceover_mapping_diff: Dict[
            str, Dict[str, voiceover_models.VoiceoverDict]] = {}

        for content_id, lang_code_to_voiceover_dict in (
            new_voiceover_mapping.items()):

            for lang_code, voiceover_dict in (
                lang_code_to_voiceover_dict.items()):

                if lang_code not in old_voiceover_mapping.get(content_id, {}):

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

    @classmethod
    def get_voiceover_diff(
        cls,
        new_snapshot: exp_models.ExplorationSnapshotContentModel,
        old_snapshot: exp_models.ExplorationSnapshotContentModel
    ) -> Dict[str, Dict[str, voiceover_models.VoiceoverDict]]:
        """The function compares two successive versions of snapshot models and
        extracts voiceovers that have been added in the later version of the
        exploration snapshot.

        Args:
            new_snapshot: ExplorationSnapshotContentModel. The new exploration
                snapshot model, let's say version n.
            old_snapshot: ExplorationSnapshotContentModel. The old exploration
                snapshot model, let's say version n-1.

        Returns:
            dict(str, dict(str, VoiceoverDict)). A dict with content IDs as keys
            and nested dicts as values. Each nested dict contains language codes
            as keys and voiceover dicts as values. Only voiceovers that exist in
            the new snapshot model but are absent in the old snapshot model are
            included in this dictionary.
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

        voiceover_mapping_diff: Dict[str, Dict[
                str, voiceover_models.VoiceoverDict]] = (
            CreateExplorationVoiceArtistLinkModelsJob.
            get_voiceover_from_recorded_voiceover_diff(
                new_voiceover_mapping=new_voiceover_mapping,
                old_voiceover_mapping=old_voiceover_mapping
            )
        )
        return voiceover_mapping_diff

    @classmethod
    def get_latest_content_ids_and_voice_artist_count(
        cls,
        exploration: exp_models.ExplorationModel
    ) -> Tuple[Dict[str, List[str]], int]:
        """This function generates a dictionary containing content IDs as keys
        and a list of language codes as values, representing the languages
        available in the latest version of the provided exploration.

        Args:
            exploration: ExplorationModel. The exploration model from which the
                dict will be created.

        Returns:
            *. A 2-tuple with the following elements:
            - dict(str, list(str)). A dictionary containing content IDs as keys
            and a list of language codes as values, representing the languages
            available in the latest version of the provided exploration.
            - int. The number of remaining voice artists that need to be
            identified for voiceovers in the latest version of exploration.
        """
        # The number of voice artists that need to be identified for voiceovers
        # in the latest version of exploration.
        voice_artist_for_identification = 0

        latest_content_id_to_language_codes: Dict[str, List[str]] = {}
        for state in exploration.states.values():
            voiceover_mapping = (
                state['recorded_voiceovers']['voiceovers_mapping']
            )
            for content_id, lang_code_to_voiceovers in (
                    voiceover_mapping.items()):

                for lang_code in lang_code_to_voiceovers:

                    if content_id not in latest_content_id_to_language_codes:
                        latest_content_id_to_language_codes[content_id] = []

                    latest_content_id_to_language_codes[content_id].append(
                        lang_code)
                    voice_artist_for_identification += 1

        return (
            latest_content_id_to_language_codes,
            voice_artist_for_identification
        )

    @classmethod
    def update_content_id_to_voiceovers_mapping(
        cls,
        latest_content_id_to_language_codes: Dict[str, List[str]],
        content_id_to_voiceovers_mapping: (
            voiceover_models.ContentIdToVoiceoverMappingType),
        remaining_voice_artist_for_identification: int,
        voiceover_mapping: voiceover_models.VoiceoverMappingType,
        voice_artist_id: str
    ) -> Tuple[voiceover_models.ContentIdToVoiceoverMappingType, int]:
        """The function iterates through voiceover mapping dictionaries, adding
        the voice artist ID and voiceover to the
        `content_id_to_voiceovers_mapping` if both the content ID and language
        code are found in the `latest_content_id_to_language_codes`.

        Args:
            latest_content_id_to_language_codes: dict(str, list(str)). A
                dictionary with content IDs as keys and a list of language codes
                as values, representing the languages available in the latest
                version of the provided exploration.
            content_id_to_voiceovers_mapping: ContentIdToVoiceoverMappingType.
                A dictionary with content IDs as keys and nested dicts as
                values. Each nested dict contains language codes as keys and
                a 2-tuple as values. The 2-tuple contains voice artist ID as
                the first element and VoiceoverDict as the second element.
            remaining_voice_artist_for_identification: int. The number of
                remaining voice artists that still need to be identified for
                voiceovers in the latest version of exploration.
            voiceover_mapping: VoiceoverMappingType. A dictionary maps content
                IDs as keys and nested dicts as values. Each nested dict
                contains language codes as keys and voiceover dicts as values.
            voice_artist_id: str. The voice artist ID for the given voiceover
                mapping.

        Returns:
            *. A 2-tuple with the following elements:
            - ContentIdToVoiceoverMappingType. A dictionary with content IDs as
            keys and nested dicts as values. Each nested dict contains language
            codes as keys and a 2-tuple as values. The 2-tuple contains voice
            artist ID as the first element and VoiceoverDict as the second
            element.
            - int. The number of remaining voice artists that still need to be
            identified for voiceovers in the latest version of exploration.
        """

        for content_id, lang_code_to_voiceovers in voiceover_mapping.items():

            # If some old exploration commit contain voiceovers for
            # contents that are not part of the current version,
            # then we should skip the content.
            if content_id not in latest_content_id_to_language_codes:
                continue

            if content_id not in content_id_to_voiceovers_mapping:
                content_id_to_voiceovers_mapping[content_id] = {}

            for lang_code, voiceover_dict in lang_code_to_voiceovers.items():

                # If some old exploration commit contain voiceovers in
                # languages that are not part of the current version,
                # then we should skip the language.
                if lang_code not in (
                    latest_content_id_to_language_codes[content_id]
                ):
                    continue

                # If a language code already exists in the
                # content_id_to_voiceovers_mapping, this indicates that the
                # voice artist for the respective content has already been
                # identified, and thus we can skip this step.
                if lang_code in content_id_to_voiceovers_mapping[content_id]:
                    continue

                content_id_to_voiceovers_mapping[content_id][lang_code] = (
                    voice_artist_id, voiceover_dict)

                # Decrementing the remaining voice artist count since a voice
                # artist has been identified in this step.
                remaining_voice_artist_for_identification -= 1

        return (
            content_id_to_voiceovers_mapping,
            remaining_voice_artist_for_identification)

    @classmethod
    def get_exploration_voice_artists_link_model(
        cls,
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

        # The number of remaining voice artists that still need to be
        # identified for voiceovers in the latest version of exploration.
        remaining_voice_artist_for_identification: int = 0
        latest_content_id_to_language_codes: Dict[str, List[str]] = {}

        (
            latest_content_id_to_language_codes,
            remaining_voice_artist_for_identification
        ) = (
            CreateExplorationVoiceArtistLinkModelsJob.
            get_latest_content_ids_and_voice_artist_count(
                exploration_model)
        )

        content_id_to_voiceovers_mapping: (
            voiceover_models.ContentIdToVoiceoverMappingType) = {}

        for index, new_snapshot_model in enumerate(snapshot_models[:-1]):
            old_snapshot_model = snapshot_models[index + 1]

            voiceover_mapping_diff = cls.get_voiceover_diff(
                new_snapshot_model, old_snapshot_model)

            # If the voiceover mapping difference dictionary is empty, this
            # indicates that no voiceover-related changes were made during the
            # commit, and thus this part can be skipped.
            if not bool(voiceover_mapping_diff):
                continue

            try:
                voice_artist_id = cls.get_user_id_for_given_snapshot(
                    new_snapshot_model.id)

                (
                    content_id_to_voiceovers_mapping,
                    remaining_voice_artist_for_identification
                ) = (
                    cls.update_content_id_to_voiceovers_mapping(
                        latest_content_id_to_language_codes,
                        content_id_to_voiceovers_mapping,
                        remaining_voice_artist_for_identification,
                        voiceover_mapping_diff,
                        voice_artist_id
                    )
                )

                # Once all voice artists for the latest exploration version are
                # identified, further iteration over the remaining unexplored
                # snapshot models can be avoided.
                if remaining_voice_artist_for_identification == 0:
                    break

            except Exception:
                # If exception is raised, this means the exploration
                # snapshot metadata model for the given commit does not exist.
                continue

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
                lambda element: self.check_exploration_is_curated(
                    exploration_id=element[0])
                )
            | 'Get exploration voice artist link models' >> beam.Map(
                CreateExplorationVoiceArtistLinkModelsJob.
                get_exploration_voice_artists_link_model)
        )

        exploration_voice_artist_link_result = (
            exploration_voice_artist_link_models
            | 'Get the result for models' >> beam.Map(
                lambda model: job_run_result.JobRunResult.as_stdout(
                    'Generated exploration voice artist link for '
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
