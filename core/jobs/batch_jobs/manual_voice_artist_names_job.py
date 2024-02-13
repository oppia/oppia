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

"""Jobs used for fetching voice artist names from curated explorations."""

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
from typing import List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import voiceover_models

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])

MAX_SAMPLE_VOICEOVERS_IN_VOICE_ARTIST_MODEL = 5


class GetVoiceArtistNamesFromExplorationsJob(base_jobs.JobBase):
    """Jobs used for fetching voice artist names from curated explorations."""

    @staticmethod
    def delete_voice_artist_model_for_old_commits(
        language_code, exploration_id, content_id
    ):
        voice_artist_metadata_models = (
            voiceover_models.VoiceArtistMetadataModel.get_all())
        for model in voice_artist_metadata_models:
            voiceovers_and_contents_mapping = (
                model.voiceovers_and_contents_mapping)
            try:
                voiceovers_and_contents_mapping[language_code][
                    'exploration_id_to_content_ids'][exploration_id].remove(
                        content_id)
                if (
                    len(voiceovers_and_contents_mapping[language_code][
                        'exploration_id_to_content_ids'][exploration_id]) == 0
                ):
                    del voiceovers_and_contents_mapping[language_code][
                        'exploration_id_to_content_ids'][exploration_id]

                if not bool(voiceovers_and_contents_mapping[language_code][
                    'exploration_id_to_content_ids']
                ):
                    del voiceovers_and_contents_mapping[language_code]

                if not bool(voiceovers_and_contents_mapping):
                    model.delete()
            except Exception:
                continue

    @staticmethod
    def get_voiceover_from_recorded_voiceover_diff(
        new_voiceover_mapping,
        old_voiceover_mapping,
        exploration_id
    ):
        voiceover_mapping_diff = {}
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
                        (
                            GetVoiceArtistNamesFromExplorationsJob.
                            delete_voice_artist_model_for_old_commits(
                                lang_code,
                                exploration_id,
                                content_id)
                        )

        return voiceover_mapping_diff

    @staticmethod
    def add_voiceover(
        voiceover_dicts: List[voiceover_models.VoiceoverDict],
        voiceover_dict: voiceover_models.VoiceoverDict
    ) -> List[voiceover_models.VoiceoverDict]:

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
    def save_voice_artist_model_from_exploration_model(exp_model):
        exploration_id = exp_model.id
        exp_latest_version = exp_model.version
        exp_version_list = list(range(1, exp_latest_version + 1))
        exp_commit_log_entry_models = (
            exp_models.ExplorationCommitLogEntryModel.get_multi(
                exploration_id, exp_version_list))

        voice_artist_metadata_models = []
        exploration_id_to_user_ids = {}
        voice_artist_ids = []

        is_voiceover_changed_in_this_commit = False
        for exp_commit_log_model in exp_commit_log_entry_models:
            exp_change_dicts = exp_commit_log_model.commit_cmds
            user_id = exp_commit_log_model.user_id

            voice_artist_metadata_model = None
            is_voice_artist_metadata_model_fetched = False

            content_ids = []
            for change_dict in exp_change_dicts:
                if (
                    change_dict['cmd'] == 'edit_state_property' and
                    change_dict['property_name'] == 'recorded_voiceovers'
                ):

                    if not is_voice_artist_metadata_model_fetched:
                        voice_artist_metadata_model = (
                            voiceover_services.get_voice_artist_metadata(
                                user_id))
                        voiceovers_and_contents_mapping = copy.deepcopy(
                            voice_artist_metadata_model.
                            voiceovers_and_contents_mapping)
                        voice_artist_ids.append(user_id)
                    is_voiceover_changed_in_this_commit = True

                    voiceovers_mapping = (
                        GetVoiceArtistNamesFromExplorationsJob.
                        get_voiceover_from_recorded_voiceover_diff(
                            change_dict['new_value']['voiceovers_mapping'],
                            change_dict['old_value']['voiceovers_mapping'],
                            exploration_id)
                    )

                    for content_id, lang_code_to_voiceover_dict in (
                        voiceovers_mapping.items()):
                        if bool(lang_code_to_voiceover_dict):
                            content_ids.append(content_id)

                        for lang_code, voiceover_dict in (
                            lang_code_to_voiceover_dict.items()):

                            if lang_code not in voiceovers_and_contents_mapping:
                                voiceovers_and_contents_mapping[lang_code] = {
                                    'language_accent_code': None,
                                    'exploration_id_to_content_ids': {},
                                    'voiceovers': []
                                }

                            exploration_id_to_content_ids = (
                                voiceovers_and_contents_mapping[lang_code][
                                    'exploration_id_to_content_ids'])

                            if exploration_id not in (
                                exploration_id_to_content_ids):

                                exploration_id_to_content_ids[
                                    exploration_id] = []

                            # Adding a list of content IDs for which the
                            # voice artist had provided voiceovers in a
                            # given exploration.
                            voiceovers_and_contents_mapping[lang_code][
                                'exploration_id_to_content_ids'][
                                    exploration_id].extend(content_ids)

                            # Collecting Sample voiceovers.
                            voiceovers = (
                                voiceovers_and_contents_mapping[
                                    lang_code]['voiceovers'])
                            voiceovers = (
                                GetVoiceArtistNamesFromExplorationsJob.
                                add_voiceover(voiceovers, voiceover_dict)
                            )
                            voiceovers_and_contents_mapping[
                                lang_code]['voiceovers'] = voiceovers

            if is_voiceover_changed_in_this_commit:
                voice_artist_metadata_model.voiceovers_and_contents_mapping = (
                    voiceovers_and_contents_mapping)
                voice_artist_metadata_models.append(voice_artist_metadata_model)
                exploration_id_to_user_ids[exploration_id] = voice_artist_ids

        return result.Ok((exploration_id, voice_artist_ids))

    @staticmethod
    def count_voice_artist_id(key_value):
        key, voice_artist_ids_iterables = key_value
        voice_artist_ids_len = len(voice_artist_ids_iterables)
        print(key, voice_artist_ids_len)
        return key, voice_artist_ids_len

    @staticmethod
    def printing(a):
        print(a)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        curated_exploration_models = (
            self.pipeline
            | 'Get explorations' >> (
                ndb_io.GetModels(exp_models.ExplorationModel.get_all()))
            | 'Get curated explorations' >> beam.Filter(
                lambda model: opportunity_services.
                is_exploration_available_for_contribution(model.id))
        )

        exploration_id_to_voice_artist_ids_result = (
            curated_exploration_models
            | 'Save voice artist metadata models' >> beam.Map(
                    self.save_voice_artist_model_from_exploration_model)
        )

        unused_put_result = (
            exploration_id_to_voice_artist_ids_result
            | 'Filter the results with OK status' >> beam.Filter(
                lambda result: result.is_ok())
            | 'Fetch the models to be put' >> beam.Map(
                lambda result: self.count_voice_artist_id(result.unwrap()))
        )


        voice_artist_metadata_job_result = (
            exploration_id_to_voice_artist_ids_result
            | job_result_transforms.ResultsToJobRunResults(
                'USER IDS WHOSE METADATA MODELS ARE CREATED')
        )

        return voice_artist_metadata_job_result
