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

import copy

from core.domain import opportunity_services
from core.domain import voiceover_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, Iterable, List, Tuple, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import voiceover_models

datastore_services = models.Registry.import_datastore_services()

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])


MAX_SAMPLE_VOICEOVERS_IN_VOICE_ARTIST_MODEL = 5


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class FilterCommitLogModelByExplorationIds(beam.DoFn): # type: ignore[misc]
    """DoFn to filter exploration commit log entry models based on curated
    exploration IDs.
    """

    def process(
        self,
        exp_commit_log_model: exp_models.ExplorationCommitLogEntryModel,
        exploration_ids: List[str]
    ) -> Iterable[exp_models.ExplorationCommitLogEntryModel]:
        if exp_commit_log_model.exploration_id in exploration_ids:
            yield exp_commit_log_model


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class GetVoiceArtistMetadataModelsFromDict(beam.DoFn): # type: ignore[misc]
    """DoFn to convert voice artist metadata dicts to their corresponding
    model instances.
    """

    total_commit_log_models = 0
    processed_commit_log_models = 0

    @staticmethod
    def _convert_to_models(
        voice_artist_id_to_metadata_mapping: Dict[
            str, voiceover_models.VoiceoversAndContentsMappingType]
    ) -> List[voiceover_models.VoiceArtistMetadataModel]:
        """The method converts the voice artist metadata dicts to their
        corresponding model instances.

        Args:
            voice_artist_id_to_metadata_mapping:
                dict(str, VoiceoversAndContentsMappingType). A dictionary
                mapping voice artist IDs as keys and nested dicts as values.
                Each nested dict refers to the voiceovers_and_contents_mapping
                field in the VoiceArtistMetadataModel.

        Returns:
            list(VoiceArtistMetadataModel). A list of VoiceArtistMetadataModel
            instances.
        """

        voice_artist_metadata_models = []

        with datastore_services.get_ndb_context():
            for voice_artist_id, metadata_mapping in (
                    voice_artist_id_to_metadata_mapping.items()):
                voice_artist_model = (
                    voiceover_services.
                    create_voice_artist_metadata_model_instance(
                        voice_artist_id, metadata_mapping)
                )
                voice_artist_metadata_models.append(voice_artist_model)

        return voice_artist_metadata_models

    def process(
        self,
        voice_artist_id_to_metadata_mapping: Dict[
            str, voiceover_models.VoiceoversAndContentsMappingType],
        exp_commit_log_models: List[exp_models.ExplorationCommitLogEntryModel]
    ) -> Iterable[voiceover_models.VoiceArtistMetadataModel]:
        self.total_commit_log_models = len(exp_commit_log_models)
        self.processed_commit_log_models += 1

        if self.processed_commit_log_models == self.total_commit_log_models:
            voice_artist_metadata_models = self._convert_to_models(
                voice_artist_id_to_metadata_mapping)

            for voice_artist_metadata_model in voice_artist_metadata_models:
                yield voice_artist_metadata_model


class CreateVoiceArtistMetadataModelsFromExplorationsJob(base_jobs.JobBase):
    """Jobs used for fetching and saving voice artist names from curated
    exploration models.
    """

    DATASTORE_UPDATES_ALLOWED = True
    voice_artist_metadata_mapping: Dict[
        str, voiceover_models.VoiceoversAndContentsMappingType] = {}

    @staticmethod
    def _delete_voice_artist_model_for_old_commits(
        language_code: str,
        exploration_id: str,
        content_id: str,
        voice_artist_id_to_metadata_mapping: Dict[
            str, voiceover_models.VoiceoversAndContentsMappingType]
    ) -> Dict[str, voiceover_models.VoiceoversAndContentsMappingType]:
        """Remove the content ID association from the metadata of the previous
        voice artist when a new voiceover is recorded for the same content
        by another voice artist, necessitating the deletion of the
        previous record.

        Args:
            language_code: str. The language code in which the new voiceover
                is added.
            exploration_id: str. The exploration ID in which the new voiceover
                is added.
            content_id: str. The content ID in which the new voiceover is added.
            voice_artist_id_to_metadata_mapping:
                dict(str, VoiceoversAndContentsMappingType). A dictionary
                mapping voice artist IDs as keys and nested dicts as values.
                Each nested dict refers to the voiceovers_and_contents_mapping
                field in the VoiceArtistMetadataModel.

        Returns:
            dict(str, VoiceoversAndContentsMappingType). A dictionary
            mapping voice artist IDs as keys and nested dicts as values.
            Each nested dict refers to the voiceovers_and_contents_mapping
            field in the VoiceArtistMetadataModel.
        """
        voice_artist_id_to_metadata_mapping_iterable: Dict[
            str, voiceover_models.VoiceoversAndContentsMappingType] = (
                copy.deepcopy(voice_artist_id_to_metadata_mapping))

        for voice_artist_id, voiceovers_and_contents_mapping in (
                voice_artist_id_to_metadata_mapping_iterable.items()):
            language_mapping = voiceovers_and_contents_mapping.get(
                language_code, {})
            # Here we use cast because we are narrowing down the type from
            # Union[str, Dict[str, List[str]], Dict[str, List[VoiceoverDict]]
            # to Dict[str, List[str]].
            exploration_mapping = cast(
                Dict[str, List[str]],
                language_mapping.get('exploration_id_to_content_ids', {}))

            if exploration_id in exploration_mapping:
                content_ids: List[str] = exploration_mapping.get(
                    exploration_id, [])

                if content_id in content_ids:
                    content_ids.remove(content_id)

                if not content_ids:
                    del exploration_mapping[exploration_id]

                if not exploration_mapping:
                    del voiceovers_and_contents_mapping[language_code]

            if not voiceovers_and_contents_mapping:
                del voice_artist_id_to_metadata_mapping[voice_artist_id]

        return voice_artist_id_to_metadata_mapping

    @staticmethod
    def _get_voiceover_from_recorded_voiceover_diff(
        new_voiceover_mapping: Dict[
            str, Dict[str, voiceover_models.VoiceoverDict]],
        old_voiceover_mapping: Dict[
            str, Dict[str, voiceover_models.VoiceoverDict]],
        voice_artist_id_to_metadata_mapping: Dict[
            str, voiceover_models.VoiceoversAndContentsMappingType],
        exploration_id: str
    ) -> Tuple[
        Dict[str, Dict[str, voiceover_models.VoiceoverDict]],
        Dict[str, voiceover_models.VoiceoversAndContentsMappingType]
    ]:
        """The method calculates the difference between the old and new values
        of the recorded voiceover to isolate and retrieve only the updated
        voiceover values within a given commit.

        Args:
            new_voiceover_mapping: dict(str, dict(str, VoiceoverDict)). A dict
                representing new values of recorded voiceovers.
            old_voiceover_mapping: dict(str, dict(str, VoiceoverDict)). A dict
                representing old values of recorded voiceovers.
            voice_artist_id_to_metadata_mapping:
                dict(str, VoiceoversAndContentsMappingType). A dictionary
                mapping voice artist IDs as keys and nested dicts as values.
                Each nested dict refers to the voiceovers_and_contents_mapping
                field in the VoiceArtistMetadataModel.
            exploration_id: str. The ID of the given exploration.

        Returns:
            *. A 2-tuple consisting of:
            - A dictionary representing the difference between the old and new
            values of the recorded voiceover.
            - Another dictionary representing the updated metadata mapping for
            the voice artist.
        """
        voiceover_mapping_diff: Dict[
            str, Dict[str, voiceover_models.VoiceoverDict]] = {}

        for content_id, lang_code_to_voiceover_dict in (
            new_voiceover_mapping.items()):

            voiceover_mapping_diff[content_id] = {}

            for lang_code, voiceover_dict in (
                lang_code_to_voiceover_dict.items()):

                if lang_code not in old_voiceover_mapping[content_id]:
                    voiceover_mapping_diff[content_id][lang_code] = (
                        voiceover_dict)
                else:
                    old_voiceover_dict = old_voiceover_mapping[
                        content_id][lang_code]
                    new_voiceover_dict = new_voiceover_mapping[
                        content_id][lang_code]

                    if old_voiceover_dict != new_voiceover_dict:
                        voiceover_mapping_diff[content_id][lang_code] = (
                            voiceover_dict)
                        voice_artist_id_to_metadata_mapping = (
                            CreateVoiceArtistMetadataModelsFromExplorationsJob.
                            _delete_voice_artist_model_for_old_commits(
                                lang_code,
                                exploration_id,
                                content_id,
                                voice_artist_id_to_metadata_mapping)
                        )

        return voiceover_mapping_diff, voice_artist_id_to_metadata_mapping

    @staticmethod
    def _get_voice_artist_metadata_info_from_exp_commit(
        exp_commit_log_model: exp_models.ExplorationCommitLogEntryModel,
        voice_artist_id_to_metadata_mapping: Dict[
            str, voiceover_models.VoiceoversAndContentsMappingType]
    ) -> Dict[str, voiceover_models.VoiceoversAndContentsMappingType]:
        """The method adds a new entry to the voice artist metadata dictionary
        for a given user ID if the commit includes changes related to
        voiceovers.

        Args:
            exp_commit_log_model: ExplorationCommitLogEntryModel. An instance
                of ExplorationCommitLogEntryModel will be used to create a
                new entry for voice artist metadata.
            voice_artist_id_to_metadata_mapping:
                dict(str, VoiceoversAndContentsMappingType). A dictionary
                mapping voice artist IDs as keys and nested dicts as values.
                Each nested dict refers to the voiceovers_and_contents_mapping
                field in the VoiceArtistMetadataModel.

        Returns:
            dict(str, VoiceoversAndContentsMappingType). A dictionary
            mapping voice artist IDs as keys and nested dicts as values.
            Each nested dict refers to the voiceovers_and_contents_mapping
            field in the VoiceArtistMetadataModel.
        """

        exp_change_dicts = exp_commit_log_model.commit_cmds
        exploration_id = exp_commit_log_model.exploration_id

        for change_dict in exp_change_dicts:
            if (
                change_dict['cmd'] == 'edit_state_property' and
                change_dict['property_name'] == 'recorded_voiceovers'
            ):
                voiceovers_mapping, voice_artist_id_to_metadata_mapping = (
                    CreateVoiceArtistMetadataModelsFromExplorationsJob.
                    _get_voiceover_from_recorded_voiceover_diff(
                        change_dict['new_value']['voiceovers_mapping'],
                        change_dict['old_value']['voiceovers_mapping'],
                        voice_artist_id_to_metadata_mapping,
                        exploration_id)
                )

                voice_artist_id = exp_commit_log_model.user_id
                voiceovers_and_contents_mapping: (
                    voiceover_models.VoiceoversAndContentsMappingType) = {}

                if voice_artist_id in voice_artist_id_to_metadata_mapping:
                    voiceovers_and_contents_mapping = copy.deepcopy(
                        voice_artist_id_to_metadata_mapping[voice_artist_id])

                for content_id, lang_code_to_voiceover_dict in (
                    voiceovers_mapping.items()):

                    for lang_code, voiceover_dict in (
                        lang_code_to_voiceover_dict.items()):

                        if lang_code not in voiceovers_and_contents_mapping:
                            empty_exploration_id_to_content_ids: Dict[
                                str, List[str]] = {}
                            empty_exploration_id_to_voiceovers: Dict[str, List[
                                voiceover_models.VoiceoverDict]] = {}

                            voiceovers_and_contents_mapping[lang_code] = {
                                'language_accent_code': '',
                                'exploration_id_to_content_ids': (
                                    empty_exploration_id_to_content_ids),
                                'exploration_id_to_voiceovers': (
                                    empty_exploration_id_to_voiceovers)
                            }

                        # Here we use cast because we are narrowing down the
                        # type from Union[str, Dict[str, List[str]], Dict[
                        # str, List[VoiceoverDict]] to Dict[str, List[str]].
                        exploration_id_to_content_ids = cast(
                            Dict[str, List[str]],
                            voiceovers_and_contents_mapping[lang_code][
                                'exploration_id_to_content_ids'])

                        # Here we use cast because we are narrowing down the
                        # type from Union[str, Dict[str, List[str]], Dict[
                        # str, List[VoiceoverDict]] to Dict[str, List[
                        # VoiceoverDict]].
                        exploration_id_to_voiceovers = cast(
                            Dict[str, List[voiceover_models.VoiceoverDict]],
                            voiceovers_and_contents_mapping[lang_code][
                                'exploration_id_to_voiceovers'])

                        if exploration_id not in exploration_id_to_content_ids:
                            exploration_id_to_content_ids[exploration_id] = []

                        if exploration_id not in exploration_id_to_voiceovers:
                            exploration_id_to_voiceovers[exploration_id] = []

                        exploration_id_to_content_ids[exploration_id].append(
                            content_id)
                        exploration_id_to_voiceovers[exploration_id].append(
                            voiceover_dict)

                        voiceovers_and_contents_mapping[lang_code][
                            'exploration_id_to_content_ids'] = (
                                exploration_id_to_content_ids)
                        voiceovers_and_contents_mapping[lang_code][
                            'exploration_id_to_voiceovers'] = (
                                exploration_id_to_voiceovers)


                voice_artist_id_to_metadata_mapping[voice_artist_id] = (
                    voiceovers_and_contents_mapping)

        return voice_artist_id_to_metadata_mapping

    @staticmethod
    def _calculate_number_of_voiceovers(
        voiceovers_and_contents_mapping: (
            voiceover_models.VoiceoversAndContentsMappingType)
    ) -> int:
        """The method calculates the number of voiceovers given by a specific
        voice artist.

        Args:
            voiceovers_and_contents_mapping: VoiceoversAndContentsMappingType.
                A dict representing the metadata information for the given voice
                artist.

        Returns:
            int. The total number of voiceovers given by a voice artist.
        """
        total_voiceovers = 0
        for metadata_mapping in voiceovers_and_contents_mapping.values():
            exploration_mapping = (
                metadata_mapping['exploration_id_to_content_ids'])
            assert isinstance(exploration_mapping, dict)

            for content_ids in exploration_mapping.values():
                assert isinstance(content_ids, list)

                total_voiceovers += len(content_ids)

        return total_voiceovers

    @staticmethod
    def _check_exploration_is_curated(exp_id: str) -> bool:
        """The method verifies if the provided exploration ID has been
        curated or not.

        Args:
            exp_id: str. The given exploration ID.

        Returns:
            bool. A boolean value indicating if the exploration has been
            curated or not.
        """
        with datastore_services.get_ndb_context():
            return (
                opportunity_services.
                is_exploration_available_for_contribution(exp_id)
            )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        curated_exploration_model_ids = (
            self.pipeline
            | 'Get exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
            | 'Get curated exploration models' >> beam.Filter(
                lambda model: self._check_exploration_is_curated(model.id))
            | 'Get curated exploration model ids' >> beam.Map(
                lambda exploration: exploration.id
            )
        )

        exp_commit_log_models = (
            self.pipeline
            | 'Get exploration commit log models' >> ndb_io.GetModels(
                exp_models.ExplorationCommitLogEntryModel.get_all())
            | 'Filter commit log models for curated explorations' >> (
                beam.ParDo(
                    FilterCommitLogModelByExplorationIds(),
                    exploration_ids=beam.pvalue.AsList(
                        curated_exploration_model_ids)
                )
            )
        )

        self.voice_artist_metadata_mapping = {}

        voice_artist_metadata_models = (
            exp_commit_log_models
            | 'Update voice artist metadata mapping dict' >> beam.Map(
                lambda model: (
                    CreateVoiceArtistMetadataModelsFromExplorationsJob.
                    _get_voice_artist_metadata_info_from_exp_commit(
                        model, self.voice_artist_metadata_mapping)
                )
            )
            | 'Getting voice artist metadata models' >> beam.ParDo(
                GetVoiceArtistMetadataModelsFromDict(),
                exp_commit_log_models=beam.pvalue.AsList(exp_commit_log_models)
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_voice_artist_metadata_put_results = (
                voice_artist_metadata_models
                | 'Put VoiceArtistMetadataModel models' >> ndb_io.PutModels()
            )

        voice_artist_metadata_job_result = (
            voice_artist_metadata_models
            | 'Getting user IDs to number of provided voiceovers result' >> (
                beam.Map(
                    lambda model: job_run_result.JobRunResult.as_stdout(
                        'Voice artist with ID %s contributed %s voiceovers.'
                        % (model.id, str(self._calculate_number_of_voiceovers(
                            model.voiceovers_and_contents_mapping)))
                    )
                )
            )
        )

        return voice_artist_metadata_job_result


class AuditVoiceArtistNamesFromExplorationJob(
    CreateVoiceArtistMetadataModelsFromExplorationsJob
):
    """Audit CreateVoiceArtistMetadataModelsFromExplorationsJob."""

    DATASTORE_UPDATES_ALLOWED = False
