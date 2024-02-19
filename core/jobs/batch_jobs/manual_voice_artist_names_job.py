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
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import Dict, Iterable, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import voiceover_models

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])

MAX_SAMPLE_VOICEOVERS_IN_VOICE_ARTIST_MODEL = 5


class FilterByIds(beam.DoFn):
    def process(self, model, keys):
        if model.exploration_id in keys:
            yield model


class GetVoiceArtistNamesFromExplorationsJob(base_jobs.JobBase):
    """Jobs used for fetching and saving voice artist names from curated
    exploration models.
    """

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
            exploration_mapping = language_mapping.get(
                'exploration_id_to_content_ids', {})

            assert isinstance(exploration_mapping, dict)

            if exploration_id in exploration_mapping:
                content_ids = exploration_mapping.get(exploration_id, [])
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
    ) -> Dict[str, Dict[str, voiceover_models.VoiceoverDict]]:
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
            dict(str, dict(str, VoiceoverDict)). A dictionary
            representing the difference between the old and new values of
            the recorded voiceover.
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
                            GetVoiceArtistNamesFromExplorationsJob.
                            _delete_voice_artist_model_for_old_commits(
                                lang_code,
                                exploration_id,
                                content_id,
                                voice_artist_id_to_metadata_mapping)
                        )

        return voiceover_mapping_diff, voice_artist_id_to_metadata_mapping

    @staticmethod
    def _add_voiceover(
        voiceover_dicts: List[voiceover_models.VoiceoverDict],
        voiceover_dict: voiceover_models.VoiceoverDict
    ) -> List[voiceover_models.VoiceoverDict]:
        """Appends voiceovers to the existing list, ensuring that a maximum of
        five voiceovers with the longest duration are included.

        Args:
            voiceover_dicts: list(VoiceoverDict). A list of sample voiceovers
                for the given content in the given language.
            voiceover_dict: VoiceoverDict. A voiceover dict, which may be added
                to the voiceover dicts.

        Returns:
            list(VoiceoverDict). A list of sample voiceovers for the given
            content in the given language.
        """

        if len(voiceover_dicts) < MAX_SAMPLE_VOICEOVERS_IN_VOICE_ARTIST_MODEL:
            voiceover_dicts.append(voiceover_dict)
        elif (
            voiceover_dicts[0]['duration_secs'] <
            voiceover_dict['duration_secs']
        ):
            voiceover_dicts[0] = voiceover_dict

        sorted(
            voiceover_dicts, key=lambda voiceover: voiceover['duration_secs'])
        return voiceover_dicts

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
                    GetVoiceArtistNamesFromExplorationsJob.
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
                            voiceovers_and_contents_mapping[lang_code] = {
                                'language_accent_code': '',
                                'exploration_id_to_content_ids': {},
                                'voiceovers': []
                            }

                        exploration_id_to_content_ids = (
                            voiceovers_and_contents_mapping[lang_code][
                                'exploration_id_to_content_ids'])

                        assert isinstance(exploration_id_to_content_ids, dict)

                        if exploration_id not in exploration_id_to_content_ids:
                            exploration_id_to_content_ids[exploration_id] = []

                        assert isinstance(
                            exploration_id_to_content_ids[exploration_id],
                            list
                        )
                        exploration_id_to_content_ids[
                            exploration_id].append(content_id)

                        voiceovers = (
                            voiceovers_and_contents_mapping[
                                lang_code]['voiceovers']
                        )
                        assert isinstance(voiceovers, list)
                        voiceovers = (
                            GetVoiceArtistNamesFromExplorationsJob.
                            _add_voiceover(voiceovers, voiceover_dict)
                        )
                        voiceovers_and_contents_mapping[
                            lang_code]['voiceovers'] = voiceovers

                voice_artist_id_to_metadata_mapping[
                    voice_artist_id] = voiceovers_and_contents_mapping

        return voice_artist_id_to_metadata_mapping

    def _create_voice_artist_model_from_dict(self) -> int:
        """The method iterates on every entry of the voice artist metadata dict
        and creates a corresponding VoiceArtistMetadataModel instance.

        Returns:
            int. Returns the total number of models generated.
        """
        total_voice_artist_model_generated = 0
        for voice_artist_id, metadata_mapping in (
                self.voice_artist_id_to_metadata_mapping.items()):
            voiceover_services.update_voice_artist_metadata(
                voice_artist_id=voice_artist_id,
                voiceovers_and_contents_mapping=metadata_mapping
            )
            total_voice_artist_model_generated += 1

        return total_voice_artist_model_generated


    @staticmethod
    def temp(commit_models):
        return result.Ok(commit_models)


    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        curated_exploration_model_ids = (
            self.pipeline
            | 'Get explorations models' >> (
                ndb_io.GetModels(exp_models.ExplorationModel.get_all()))
            | 'Get curated explorations models' >> beam.Filter(
                lambda model: opportunity_services.
                is_exploration_available_for_contribution(model.id))
            | 'Get model ids' >> beam.Map(
                lambda exploration: exploration.id
            )
        )

        exp_commit_log_models = (
            self.pipeline
            | 'Get exploration commit log models' >> ndb_io.GetModels(
                exp_models.ExplorationCommitLogEntryModel.get_all())
            | 'Filter commit log models for curated explorations' >> beam.ParDo(
                FilterByIds(),
                keys=beam.pvalue.AsList(curated_exploration_model_ids)
            )
        )

        self.voice_artist_metadata_mapping = {}

        unused_model = (
            exp_commit_log_models
            | 'Update models' >> beam.Map(
                lambda model: (
                    GetVoiceArtistNamesFromExplorationsJob.
                    _get_voice_artist_metadata_info_from_exp_commit(
                        model, self.voice_artist_metadata_mapping)
                )
            )
        )

        unused_model_result = (
            unused_model
            | 'Getting result' >> beam.Map(self.temp)
        )

        voice_artist_metadata_job_result = (
            unused_model_result
            | job_result_transforms.ResultsToJobRunResults(
                'VOICE ARTIST METADATA MODELS ARE CREATED')
        )

        return voice_artist_metadata_job_result
