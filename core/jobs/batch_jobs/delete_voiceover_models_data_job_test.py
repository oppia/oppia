# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.batch_jobs.delete_voiceover_models_data_job."""

from __future__ import annotations

from core.domain import state_domain
from core.jobs import job_test_utils
from core.jobs.batch_jobs import delete_voiceover_models_data_job
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

from typing import Sequence, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import voiceover_models

(voiceover_models,) = models.Registry.import_models([
    models.Names.VOICEOVER])


class DeleteVoiceoverModelsTestsBaseClass(
    job_test_utils.JobTestBase, test_utils.GenericTestBase):

    EDITOR_EMAIL_1 = 'editor1@example.com'
    EDITOR_EMAIL_2 = 'editor2@example.com'
    EDITOR_EMAIL_3 = 'editor3@example.com'
    EDITOR_USERNAME_1 = 'editor1'
    EDITOR_USERNAME_2 = 'editor2'
    EDITOR_USERNAME_3 = 'editor3'

    CURATED_EXPLORATION_ID_1 = 'exploration_id_1'
    NON_CURATED_EXPLORATION_ID_2 = 'exploration_id_2'
    NON_CURATED_EXPLORATION_ID_3 = 'exploration_id_3'

    TOPIC_ID_1 = 'topic_id_1'
    STORY_ID_1 = 'story_id_1'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL_1, self.EDITOR_USERNAME_1)
        self.signup(self.EDITOR_EMAIL_2, self.EDITOR_USERNAME_2)
        self.signup(self.EDITOR_EMAIL_3, self.EDITOR_USERNAME_3)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.set_curriculum_admins([
            self.EDITOR_USERNAME_1,
            self.EDITOR_USERNAME_2,
            self.EDITOR_USERNAME_3,
            self.CURRICULUM_ADMIN_USERNAME])

        self.editor_id_1 = self.get_user_id_from_email(self.EDITOR_EMAIL_1)
        self.editor_id_2 = self.get_user_id_from_email(self.EDITOR_EMAIL_2)
        self.editor_id_3 = self.get_user_id_from_email(self.EDITOR_EMAIL_3)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.voiceover_dict_1: state_domain.VoiceoverDict = {
            'filename': 'filename1.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 42.43
        }
        self.voiceover_dict_2: state_domain.VoiceoverDict = {
            'filename': 'filename2.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 40
        }


class DeleteExplorationVoiceArtistLinkModelsJobTests(
    DeleteVoiceoverModelsTestsBaseClass):

    JOB_CLASS: Type[
        delete_voiceover_models_data_job.
        DeleteInstanceofExplorationVoiceArtistsLinkModelJob
    ] = (
        delete_voiceover_models_data_job.
        DeleteInstanceofExplorationVoiceArtistsLinkModelJob
    )

    def test_exploration_voice_artist_link_models_successfully(
        self) -> None:
        content_id_to_voiceovers_mapping = {
            'content_1': {
                'en': ('voice_artist_id_1', self.voiceover_dict_1)
            },
            'content_2': {
                'hi': ('voice_artist_id_2', self.voiceover_dict_2)
            }
        }

        voiceover_models.ExplorationVoiceArtistsLinkModel.create_model(
            exploration_id=self.CURATED_EXPLORATION_ID_1,
            content_id_to_voiceovers_mapping=(
                content_id_to_voiceovers_mapping)
        )
        voiceover_models.ExplorationVoiceArtistsLinkModel.create_model(
            exploration_id=self.NON_CURATED_EXPLORATION_ID_2,
            content_id_to_voiceovers_mapping=(
                content_id_to_voiceovers_mapping)
        )
        voiceover_models.ExplorationVoiceArtistsLinkModel.create_model(
            exploration_id=self.NON_CURATED_EXPLORATION_ID_3,
            content_id_to_voiceovers_mapping=(
                content_id_to_voiceovers_mapping)
        )

        exploration_voice_artist_link_models: Sequence[
            voiceover_models.ExplorationVoiceArtistsLinkModel] = (
                voiceover_models.ExplorationVoiceArtistsLinkModel.
                get_all().fetch()
            )
        self.assertEqual(len(exploration_voice_artist_link_models), 3)

        job_result_template = 'Deleted ExplorationVoiceArtistsLinkModel: %s'

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_1,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.NON_CURATED_EXPLORATION_ID_2,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.NON_CURATED_EXPLORATION_ID_3,
                stderr='')
        ])


class DeleteVoiceArtistMetadataModelJobTests(
    DeleteVoiceoverModelsTestsBaseClass):
    JOB_CLASS: Type[
        delete_voiceover_models_data_job.
        DeleteInstanceOfVoiceArtistMetadataModelJob
    ] = (
        delete_voiceover_models_data_job.
        DeleteInstanceOfVoiceArtistMetadataModelJob
    )

    def test_delete_entity_voiceovers_model_successfully(self) -> None:
        language_code_to_accent_1 = {
            'en': 'en-US'
        }
        language_code_to_accent_2 = {
            'hi': 'hi-IN'
        }
        voice_artist_metadata_model_1 = (
            voiceover_models.VoiceArtistMetadataModel.create_model(
                voice_artist_id=self.editor_id_1,
                language_code_to_accent=language_code_to_accent_1))
        voice_artist_metadata_model_2 = (
            voiceover_models.VoiceArtistMetadataModel.create_model(
                voice_artist_id=self.editor_id_2,
                language_code_to_accent=language_code_to_accent_2))

        voice_artist_metadata_models: Sequence[
            voiceover_models.VoiceArtistMetadataModel] = (
                voiceover_models.VoiceArtistMetadataModel.get_all().fetch()
            )
        self.assertEqual(len(voice_artist_metadata_models), 2)

        job_result_template = (
            'Deleted VoiceArtistMetadataModel: %s')

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % voice_artist_metadata_model_1.id,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % voice_artist_metadata_model_2.id,
                stderr='')
        ])
        self.process_and_flush_pending_tasks()
