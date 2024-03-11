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
from core.jobs.transforms import job_result_transforms
from core.jobs.transforms import results_transforms
from core.platform import models

import apache_beam as beam
import result
from typing import Dict, Iterable, List, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import exp_models
    from mypy_imports import voiceover_models

datastore_services = models.Registry.import_datastore_services()

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])


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


class UpdateVoiceArtistMetadata(beam.DoFn): # type: ignore[misc]
    """DoFn to update exploration voice artist link and voice artist metdata.
    """
    exploration_id_to_voiceover_mapping = {}
    voice_artist_id_to_voiceovers_data = {}

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

    def update_voice_artist_data(
        self,
        voice_artist_id: str,
        exploration_id: str,
        language_code: str,
        voiceover: voiceover_models.VoiceoverDict
    ) -> None:
        """The method updates the voice artist metadata information based on
        the given data for a specific commit log model.
        """

        if voice_artist_id not in self.voice_artist_id_to_voiceovers_data:
            self.voice_artist_id_to_voiceovers_data[voice_artist_id] = {
                'language_code_to_voiceovers': {},
                'language_code_to_accent': {}
            }

        language_code_to_voiceovers = (
            self.voice_artist_id_to_voiceovers_data[
                voice_artist_id]['language_code_to_voiceovers'])
        language_code_to_accent = (
            self.voice_artist_id_to_voiceovers_data[
                voice_artist_id]['language_code_to_accent'])

        if language_code not in language_code_to_voiceovers:
            language_code_to_voiceovers[language_code] = {}
            # Assigning empty string, since accent will be filled manually
            # using voiceover-admin page.
            language_code_to_accent[language_code] = ''

        if exploration_id not in language_code_to_voiceovers[language_code]:
            language_code_to_voiceovers[language_code][exploration_id] = []

        language_code_to_voiceovers[language_code][exploration_id].append(
            voiceover)

    def update_exp_id_to_voicever_mapping(
        self, exp_commit_log_model
    ):
        """The method updates the exploration voice artist link information for
        a specific commit log model.
        """

        exploration_id = exp_commit_log_model.exploration_id
        voice_artist_id = exp_commit_log_model.user_id
        exp_change_dicts = exp_commit_log_model.commit_cmds

        exploration_mapping = (
            self.exploration_id_to_voiceover_mapping[exploration_id])

        for change_dict in exp_change_dicts:
            if (
                change_dict.get('cmd') == 'edit_state_property' and
                change_dict.get('property_name') == 'recorded_voiceovers'
            ):
                new_recorded_voiceovers = change_dict.get('new_value')
                new_voiceovers_mapping = new_recorded_voiceovers.get(
                    'voiceovers_mapping')

                old_recorded_voiceovers = change_dict.get('old_value')
                old_voiceovers_mapping = old_recorded_voiceovers.get(
                    'voiceovers_mapping')

                # Getting the difference between old and new commit changes.
                voiceovers_mapping = (
                    self.get_voiceover_from_recorded_voiceover_diff(
                        new_voiceovers_mapping, old_voiceovers_mapping))

                for content_id, lang_code_to_voiceover_dict in (
                    voiceovers_mapping.items()):

                    # If some old commit models contain voiceovers for
                    # contents that are not part of the current version,
                    # then we should skip the content.
                    if content_id not in exploration_mapping:
                        continue

                    for lang_code, voiceover_dict in (
                        lang_code_to_voiceover_dict.items()):

                        # Updating voice artist metadata information for the
                        # given voice artist.
                        self.update_voice_artist_data(
                            voice_artist_id,
                            exploration_id,
                            lang_code,
                            voiceover_dict
                        )

                        # If some old commit models contain voiceovers for
                        # contents in some languages that are not part of the
                        # current version, then we should skip the language
                        # code.
                        if lang_code not in exploration_mapping.get(content_id):
                            continue

                        # If the exploration mapping already includes the voice
                        # artist ID for the specified language code, we should
                        # skip it, as we are iterating through commit log models
                        # in reverse order, meaning that in earlier versions,
                        # the voice artist ID would have already been added.
                        if exploration_mapping[content_id][lang_code] != '':
                            continue

                        exploration_mapping[content_id][lang_code] = (
                            voice_artist_id)

    def get_voice_artist_metadata_models(self):
        """The method creates a list of voice artist metadata models.

        Returns:
            list(VoiceArtistMetadataModel). A list of voice artist
            metadata models.
        """
        voice_artist_data_models = []

        with datastore_services.get_ndb_context():
            for voice_artist_id, voiceover_mapping in (
                    self.voice_artist_id_to_voiceovers_data.items()):

                language_code_to_voiceovers = (
                    voiceover_mapping['language_code_to_voiceovers'])
                language_code_to_accent = (
                    voiceover_mapping['language_code_to_accent'])

                voice_artist_model = (
                    voiceover_services.
                    create_voice_artist_metadata_model_instance(
                        voice_artist_id,
                        language_code_to_accent,
                        language_code_to_voiceovers
                    )
                )
                voice_artist_data_models.append(voice_artist_model)

        return voice_artist_data_models


    def get_exploration_voice_artists_link_models(self):
        """The method creates a list of exploration voice artist link models.

        Returns:
            list(ExplorationVoiceArtistsLinkModel). A list of exploration voice
            artist link models.
        """
        exploration_voice_artists_link_models = []

        with datastore_services.get_ndb_context():
            for exploration_id, content_id_to_voice_artists in (
                    self.exploration_id_to_voiceover_mapping.items()):

                exploration_voice_artists_link_model = (
                    voiceover_services.
                    create_exploration_voice_artists_link_model_instance(
                        exploration_id, content_id_to_voice_artists
                    )
                )
                exploration_voice_artists_link_models.append(
                    exploration_voice_artists_link_model
                )
        return exploration_voice_artists_link_models

    def process(
        self,
        exploration_id_to_voiceover_mapping,
        exp_commit_log_models
    ) -> Iterable[exp_models.ExplorationCommitLogEntryModel]:

        self.exploration_id_to_voiceover_mapping = (
            exploration_id_to_voiceover_mapping)


        # By sorting the commit log models in reverse order, we ensure that
        # while iterating backwards, we exclusively update voice artists for
        # the most recent voiceover. If we come across voice artists associated
        # with an older version, we skip them as they have already been updated.
        exp_commit_log_models.sort(key=lambda model: model.id, reverse=True)

        for exp_commit_log_model in exp_commit_log_models:
            self.update_exp_id_to_voicever_mapping(exp_commit_log_model)

        exploration_voice_artists_link_models = (
            self.get_exploration_voice_artists_link_models())
        voice_artist_data_models = (
            self.get_voice_artist_metadata_models())

        models_to_put = []
        models_to_put.extend(exploration_voice_artists_link_models)
        models_to_put.extend(voice_artist_data_models)

        for model in models_to_put:
            yield model


class CreateVoiceArtistMetadataModelsFromExplorationsJob(base_jobs.JobBase):
    """Jobs used for fetching and saving voice artist names from curated
    exploration models.
    """

    DATASTORE_UPDATES_ALLOWED = True
    voice_artist_metadata_mapping = {}
    exploration_id_to_voiceover_mapping = {}

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


    def _get_exploration_id_to_voiceover_mapping(self, exploration):
        """The function generates a dictionary for explorations containing the
        most recent content ID and language code details, allowing for the
        assignment of the respective voice artist IDs who contributed to the
        voiceovers.
        """
        content_id_to_voiceovers_mapping = {}
        for state in exploration.states.values():
            voiceover_mapping = (
                state['recorded_voiceovers']['voiceovers_mapping']
            )
            for content_id, lang_code_to_voiceovers in (
                    voiceover_mapping.items()):

                content_id_to_voiceovers_mapping[content_id] = {}

                for lang_code in lang_code_to_voiceovers:

                    # Empty strings will be assigned as the voice artist name is
                    # currently unknown, but it will be updated during iteration
                    # on commit log models.
                    content_id_to_voiceovers_mapping[content_id][lang_code] = ''

        self.exploration_id_to_voiceover_mapping[exploration.id] = (
            content_id_to_voiceovers_mapping)

        return self.exploration_id_to_voiceover_mapping


    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:

        curated_exploration_models = (
            self.pipeline
            | 'Get exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
            | 'Get curated exploration models' >> beam.Filter(
                lambda model: self._check_exploration_is_curated(model.id))
        )

        curated_exploration_model_ids = (
            curated_exploration_models
            | 'Get curated exploration model ids' >> beam.Map(
                lambda exploration: exploration.id
            )
        )

        exp_id_to_voiceover_mapping = (
            curated_exploration_models
            | 'Get exploration wise data' >> beam.Map(
                lambda exploration: (
                    self._get_exploration_id_to_voiceover_mapping(exploration))
            )
            | 'Collect all exploration mapping dicts' >> (
                beam.combiners.ToList())
            | 'Extract final exploration mapping dict' >> beam.Map(
                lambda elements: elements[-1] if elements else {}
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

        models_to_put = (
            exp_id_to_voiceover_mapping
            | 'Update voice artist metadata mapping dict' >> beam.ParDo(
                UpdateVoiceArtistMetadata(),
                beam.pvalue.AsList(exp_commit_log_models)
            )
        )


        updated_voice_artist_data_result = (
            models_to_put
            | 'Get the result for models' >> beam.Map(
                lambda model: (
                    job_run_result.JobRunResult.as_stdout(
                        'Generated voice artist data for %s.' % model.id)
                    if isinstance(
                        model, voiceover_models.VoiceArtistMetadataModel)
                    else job_run_result.JobRunResult.as_stdout(
                        'Generated exploration voice artist link for %s.' %
                        model.id)
                )
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                models_to_put
                | 'Put models into datastore' >> ndb_io.PutModels()
            )

        return updated_voice_artist_data_result

class AuditVoiceArtistNamesFromExplorationJob(
    CreateVoiceArtistMetadataModelsFromExplorationsJob
):
    """Audit CreateVoiceArtistMetadataModelsFromExplorationsJob."""

    DATASTORE_UPDATES_ALLOWED = False
