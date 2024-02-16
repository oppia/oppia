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

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        exploration_models = (
            self.pipeline
            | 'Get explorations' >> (
                ndb_io.GetModels(exp_models.ExplorationModel.get_all()))
            | 'Get curated explorations' >> beam.Filter(
                lambda model: opportunity_services.
                is_exploration_available_for_contribution(model.id))
        )

        voice_artist_metadata_models_result = (
            exploration_models
            | 'Get voice artist metadata models' >> beam.ParDo(
                GetVoiceArtistMetaDataModels(),
                beam.pvalue.AsList(exploration_models))
        )

        # unused_models = (
        #     voice_artist_metadata_models_result
        #     | 'Printing' >> beam.Map(
        #         lambda result: self.convert_list(result.unwrap()))
        # )
        # _ = (
        #     unused_models | ndb_io.PutModels()
        # )

        voice_artist_metadata_job_result = (
            voice_artist_metadata_models_result
            | job_result_transforms.ResultsToJobRunResults(
                'USER IDS WHOSE METADATA MODELS ARE CREATED')
        )

        return voice_artist_metadata_job_result


class GetVoiceArtistMetaDataModels(beam.DoFn): # type: ignore[misc]
    """DoFn to index blog post summaries."""

    @staticmethod
    def delete_voice_artist_model_for_old_commits(
        language_code, exploration_id, content_id,
        voice_artist_id_to_metadata_mapping
    ):
        voice_artist_id_to_metadata_mapping_iterable = copy.deepcopy(
            voice_artist_id_to_metadata_mapping)

        for voice_artist_id, voiceovers_and_contents_mapping in (
                voice_artist_id_to_metadata_mapping_iterable.items()):
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
                    del voice_artist_id_to_metadata_mapping[voice_artist_id]
            except Exception:
                continue
        return voice_artist_id_to_metadata_mapping

    @staticmethod
    def get_voiceover_from_recorded_voiceover_diff(
        new_voiceover_mapping,
        old_voiceover_mapping,
        voice_artist_id_to_metadata_mapping,
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
                        voice_artist_id_to_metadata_mapping = (
                            GetVoiceArtistMetaDataModels.
                            delete_voice_artist_model_for_old_commits(
                                lang_code,
                                exploration_id,
                                content_id,
                                voice_artist_id_to_metadata_mapping)
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
    def get_voice_artist_metadata_info_from_exp_commit(
        exp_commit_log_model,
        voice_artist_id_to_metadata_mapping
    ):
        exp_change_dicts = exp_commit_log_model.commit_cmds
        exploration_id = exp_commit_log_model.exploration_id

        content_ids = []
        for change_dict in exp_change_dicts:
            if (
                change_dict['cmd'] == 'edit_state_property' and
                change_dict['property_name'] == 'recorded_voiceovers'
            ):
                voice_artist_id = exp_commit_log_model.user_id
                voiceovers_and_contents_mapping = {}
                if voice_artist_id in voice_artist_id_to_metadata_mapping:
                    voiceovers_and_contents_mapping = copy.deepcopy(
                        voice_artist_id_to_metadata_mapping[voice_artist_id])


                voiceovers_mapping = (
                    GetVoiceArtistMetaDataModels.
                    get_voiceover_from_recorded_voiceover_diff(
                        change_dict['new_value']['voiceovers_mapping'],
                        change_dict['old_value']['voiceovers_mapping'],
                        voice_artist_id_to_metadata_mapping,
                        exploration_id)
                )

                for content_id, lang_code_to_voiceover_dict in (
                    voiceovers_mapping.items()):

                    # think about this.
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

                        if exploration_id not in exploration_id_to_content_ids:
                            exploration_id_to_content_ids[exploration_id] = []

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
                            GetVoiceArtistMetaDataModels.
                            add_voiceover(voiceovers, voiceover_dict)
                        )
                        voiceovers_and_contents_mapping[
                            lang_code]['voiceovers'] = voiceovers

                voice_artist_id_to_metadata_mapping[
                    voice_artist_id] = voiceovers_and_contents_mapping

        return voice_artist_id_to_metadata_mapping


    def setup(self):
        self.voice_artist_id_to_metadata_mapping = {}
        self.total_explorations_operated = 0
        self.total_number_of_explorations = 0

    def process(
        self, exploration_model, exploration_models
    ) -> Iterable[result.Result[None, Exception]]:
        """Index blog post summaries and catch any errors.

        Args:
            blog_post_summaries: list(BlogPostSummaries). List of Blog Post
                Summary domain objects to be indexed.

        Yields:
            JobRunResult. List containing one element, which is either SUCCESS,
            or FAILURE.
        """

        self.total_number_of_explorations = len(exploration_models)

        exploration_id = exploration_model.id
        exp_latest_version = exploration_model.version
        exp_version_list = list(range(1, exp_latest_version + 1))

        exp_commit_log_entry_models = (
            exp_models.ExplorationCommitLogEntryModel.get_multi(
                exploration_id, exp_version_list))

        for exp_commit_log_model in exp_commit_log_entry_models:
            voice_artist_id = exp_commit_log_model.user_id

            self.voice_artist_id_to_metadata_mapping = copy.deepcopy(
                GetVoiceArtistMetaDataModels.
                get_voice_artist_metadata_info_from_exp_commit(
                    exp_commit_log_model,
                    self.voice_artist_id_to_metadata_mapping)
            )
        self.total_explorations_operated += 1

        if (
            self.total_explorations_operated ==
            self.total_number_of_explorations
        ):
            yield result.Ok(self.create_voice_artist_model_from_dict())

    def create_voice_artist_model_from_dict(self):
        voice_artist_metadata_models = []
        for voice_artist_id, metadata_mapping in (
                self.voice_artist_id_to_metadata_mapping.items()):
            model = voiceover_services.create_voice_artist_metadata_model(
                voice_artist_id=voice_artist_id,
                voiceovers_and_contents_mapping=metadata_mapping
            )
            voice_artist_metadata_models.append(model)

        return voice_artist_metadata_models
