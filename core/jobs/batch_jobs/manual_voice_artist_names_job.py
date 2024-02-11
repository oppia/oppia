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

import logging

from core import utils
from core.domain import voiceover_services
from core.domain import opportunity_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.transforms import results_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import result
from typing import List, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import voiceover_models
    from mypy_imports import exp_models

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])
datastore_services = models.Registry.import_datastore_services()


class GetVoiceArtistNamesFromExplorationsJob(base_jobs.JobBase):
    """Jobs used for fetching voice artist names from curated explorations."""

    @staticmethod
    def _printing(exp_id):
        print(exp_id)
        return result.Ok(exp_id)

    @staticmethod
    def get_voiceover_from_recorded_voiceover_diff(
        new_voiceover_mapping,
        old_voiceover_mapping
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

        return voiceover_mapping_diff


    @staticmethod
    def add_voiceover(voiceover_dicts, voiceover_dict):

        if len(voiceover_dicts) < 5:
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
    def get_voice_artist_name_from_exploration_model(exp_model):
        exploration_id = exp_model.id
        exp_latest_version = exp_model.version
        exp_version_list = [
            exp_version for exp_version in range(1, exp_latest_version + 1)]
        exp_commit_log_entry_models = (
            exp_models.ExplorationCommitLogEntryModel.get_multi(
                exploration_id, exp_version_list))

        # same state diff fields.
        # different state same field
        is_voiceover_changed_in_this_commit = False
        i = 0
        for exp_commit_log_model in exp_commit_log_entry_models:
            print('Commit # %s' %i)
            i+=1
            exp_change_dicts = exp_commit_log_model.commit_cmds
            user_id = exp_commit_log_model.user_id
            print('UserID - ', user_id)
            print(exp_change_dicts)

            voiceover_and_contents_mapping = (
                voiceover_services.get_voice_artist_metadata(user_id))

            content_ids = []
            for change_dict in exp_change_dicts:
                if (
                    change_dict['cmd'] == 'edit_state_property' and
                    change_dict['property_name'] == 'recorded_voiceovers'
                ):
                    print('Commit is voiceover change')
                    is_voiceover_changed_in_this_commit = True

                    voiceovers_mapping = (
                        GetVoiceArtistNamesFromExplorationsJob.
                        get_voiceover_from_recorded_voiceover_diff(
                            change_dict['new_value']['voiceovers_mapping'],
                            change_dict['old_value']['voiceovers_mapping'])
                    )

                    print(voiceovers_mapping)

                    for content_id, lang_code_to_voiceover_dict in (
                        voiceovers_mapping.items()):
                        if bool(lang_code_to_voiceover_dict):
                            content_ids.append(content_id)

                        for lang_code, voiceover_dict in (
                            lang_code_to_voiceover_dict.items()):

                            if lang_code not in voiceover_and_contents_mapping:
                                voiceover_and_contents_mapping[lang_code] = {
                                    'language_accent_code': None,
                                    'exploration_id_to_content_ids': {},
                                    'voiceovers': []
                                }

                            exploration_id_to_content_ids = (
                                voiceover_and_contents_mapping[lang_code][
                                    'exploration_id_to_content_ids'])

                            if exploration_id not in (
                                exploration_id_to_content_ids):

                                exploration_id_to_content_ids[
                                    exploration_id] = []

                            # Adding a list of content IDs for which the
                            # voice artist had provided voiceovers in a
                            # given exploration.
                            voiceover_and_contents_mapping[lang_code][
                                'exploration_id_to_content_ids'][
                                    exploration_id].extend(content_ids)

                            # Collecting Sample voiceovers.
                            voiceovers = (
                                voiceover_and_contents_mapping[
                                    lang_code]['voiceovers'])
                            voiceovers = (
                                GetVoiceArtistNamesFromExplorationsJob.
                                add_voiceover(voiceovers, voiceover_dict)
                            )
                            voiceover_and_contents_mapping[
                                lang_code]['voiceovers'] = voiceovers

            if is_voiceover_changed_in_this_commit:
                print('-----------')
                print(voiceover_and_contents_mapping)
                voiceover_services.update_voice_artist_metadata(
                    voice_artist_id=user_id,
                    voiceovers_and_contents_mapping=
                    voiceover_and_contents_mapping
                )
                pass


        return result.Ok(exploration_id)



    def run(self):
        print('Hello')
        # -> beam.PCollection[job_run_result.JobRunResult]
        curated_exploration_models = (
            self.pipeline
            | 'Get Explorations' >> (
                ndb_io.GetModels(exp_models.ExplorationModel.get_all()))
            | 'Curated Explorations'  >> beam.Filter(
                lambda model: opportunity_services.
                is_exploration_available_for_contribution(model.id))
            | 'Print userID' >> beam.Map(
                lambda model: self.get_voice_artist_name_from_exploration_model(
                    model)
            )
        )

        print(curated_exploration_models)
