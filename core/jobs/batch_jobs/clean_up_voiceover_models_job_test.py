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

"""Unit tests for jobs.batch_jobs.clean_up_voiceover_models_job."""

from __future__ import annotations

from core import feature_flag_list
from core import feconf
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import clean_up_voiceover_models_job
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

from typing import Dict, Sequence, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import voiceover_models

(voiceover_models,) = models.Registry.import_models([
    models.Names.VOICEOVER])


class CleanUpVoiceoverModelsTestsBaseClass(
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
        self.voiceover_dict_3: state_domain.VoiceoverDict = {
            'filename': 'filename3.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 20
        }
        self.voiceover_dict_4: state_domain.VoiceoverDict = {
            'filename': 'filename4.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 20
        }
        self.voiceover_dict_5: state_domain.VoiceoverDict = {
            'filename': 'filename5.mp3',
            'file_size_bytes': 5000,
            'needs_update': False,
            'duration_secs': 42.43
        }

    @test_utils.enable_feature_flags([
        feature_flag_list.FeatureNames.
        AUTO_UPDATE_EXP_VOICE_ARTIST_LINK])
    def _create_curated_exploration(self) -> None:
        """The method generates a curated explorations and integrates them
        into story of a topic.
        """
        exploration_1 = self.save_new_valid_exploration(
            self.CURATED_EXPLORATION_ID_1,
            self.owner_id,
            title='title1',
            category=constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        self.publish_exploration(self.owner_id, exploration_1.id)

        topic_1 = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_1, 'topic1', 'abbrev', 'description', 'fragm')
        topic_1.thumbnail_filename = 'thumbnail.svg'
        topic_1.thumbnail_bg_color = '#C6DCDA'
        topic_1.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url')]
        topic_1.next_subtopic_id = 2
        topic_1.skill_ids_for_diagnostic_test = ['skill_id_1']

        topic_services.save_new_topic(self.owner_id, topic_1)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        story_1 = story_domain.Story.create_default_story(
            self.STORY_ID_1, 'A story', 'Description', self.TOPIC_ID_1,
            'story-two')
        story_services.save_new_story(self.owner_id, story_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1)

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)

        story_services.update_story(
            self.owner_id, self.STORY_ID_1, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': self.CURATED_EXPLORATION_ID_1
            })], 'Changes.')

        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_1
                },
                'ca_placeholder_2': {},
                'default_outcome_1': {}
            }
        }
        old_voiceover_dict: Dict[str, Dict[str, Dict[
            str, state_domain.VoiceoverDict]]] = {
                'voiceovers_mapping': {
                    'content_0': {},
                    'ca_placeholder_2': {},
                    'default_outcome_1': {}
                }
            }
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': (
                exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'new_value': new_voiceovers_dict,
            'old_value': old_voiceover_dict
        })]
        exp_services.update_exploration(
            self.editor_id_1, self.CURATED_EXPLORATION_ID_1,
            change_list, 'Translation commits')

    @test_utils.enable_feature_flags([
        feature_flag_list.FeatureNames.
        AUTO_UPDATE_EXP_VOICE_ARTIST_LINK,
        feature_flag_list.FeatureNames.
        SHOW_VOICEOVER_TAB_FOR_NON_CURATED_EXPLORATIONS])
    def _create_non_curated_explorations(self) -> None:
        """The method generates two non curated exploration."""
        exploration_2 = self.save_new_valid_exploration(
            self.NON_CURATED_EXPLORATION_ID_2,
            self.editor_id_2,
            title='title2',
            category=constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        self.publish_exploration(self.editor_id_2, exploration_2.id)

        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_2
                },
                'ca_placeholder_2': {},
                'default_outcome_1': {}
            }
        }
        old_voiceover_dict: Dict[str, Dict[str, Dict[
            str, state_domain.VoiceoverDict]]] = {
                'voiceovers_mapping': {
                    'content_0': {},
                    'ca_placeholder_2': {},
                    'default_outcome_1': {}
                }
            }
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': (
                exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'new_value': new_voiceovers_dict,
            'old_value': old_voiceover_dict
        })]
        exp_services.update_exploration(
            self.editor_id_2, self.NON_CURATED_EXPLORATION_ID_2,
            change_list, 'Translation commits')

        exploration_3 = self.save_new_valid_exploration(
            self.NON_CURATED_EXPLORATION_ID_3,
            self.editor_id_3,
            title='title1',
            category=constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        self.publish_exploration(self.editor_id_3, exploration_3.id)
        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_3
                },
                'ca_placeholder_2': {},
                'default_outcome_1': {}
            }
        }
        old_voiceover_dict = {
                'voiceovers_mapping': {
                    'content_0': {},
                    'ca_placeholder_2': {},
                    'default_outcome_1': {}
                }
            }
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': (
                exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'new_value': new_voiceovers_dict,
            'old_value': old_voiceover_dict
        })]
        exp_services.update_exploration(
            self.editor_id_3, self.NON_CURATED_EXPLORATION_ID_3,
            change_list, 'Translation commits')

    def _create_entity_voiceover_models(self) -> None:
        """The method creates entity voiceover models for the explorations."""
        voiceover_models.EntityVoiceoversModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION, self.CURATED_EXPLORATION_ID_1, 1,
            'en-US', {
                'content_0': {
                    feconf.VoiceoverType.MANUAL.value: self.voiceover_dict_4,
                    feconf.VoiceoverType.AUTO.value: self.voiceover_dict_5
                }
            }, {}
        ).put()
        voiceover_models.EntityVoiceoversModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION, self.NON_CURATED_EXPLORATION_ID_2,
            1, 'en-US', {
                'content_0': {
                    feconf.VoiceoverType.MANUAL.value: self.voiceover_dict_4,
                    feconf.VoiceoverType.AUTO.value: self.voiceover_dict_5
                }
            }, {}
        ).put()
        voiceover_models.EntityVoiceoversModel.create_new(
            feconf.ENTITY_TYPE_EXPLORATION, self.NON_CURATED_EXPLORATION_ID_3,
            1, 'en-US', {
                'content_0': {
                    feconf.VoiceoverType.MANUAL.value: self.voiceover_dict_4,
                    feconf.VoiceoverType.AUTO.value: self.voiceover_dict_5
                }
            }, {}
        ).put()


class AuditExplorationVoiceArtistLinkModelsJobTests(
    CleanUpVoiceoverModelsTestsBaseClass):

    JOB_CLASS: Type[
        clean_up_voiceover_models_job.AuditExplorationVoiceArtistsLinkModelJob
    ] = (
        clean_up_voiceover_models_job.AuditExplorationVoiceArtistsLinkModelJob
    )

    def test_check_is_exploration_curated_for_invalid_id(self) -> None:
        is_exploration_curated = (
            clean_up_voiceover_models_job.
            AuditExplorationVoiceArtistsLinkModelJob.
            is_exploration_curated(exploration_id='')
        )
        self.assertFalse(is_exploration_curated)

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        is_exploration_curated = (
            clean_up_voiceover_models_job.
            AuditExplorationVoiceArtistsLinkModelJob.
            is_exploration_curated(exploration_id=None) # type: ignore[arg-type]
        )
        self.assertFalse(is_exploration_curated)

    def test_audit_exploration_voice_artist_link_models_successfully(
        self) -> None:
        self._create_curated_exploration()
        self._create_non_curated_explorations()

        exploration_voice_artist_link_models: Sequence[
            voiceover_models.ExplorationVoiceArtistsLinkModel] = (
                voiceover_models.ExplorationVoiceArtistsLinkModel.
                get_all().fetch()
            )
        self.assertEqual(len(exploration_voice_artist_link_models), 3)

        job_result_template = 'Deleted ExplorationVoiceArtistsLinkModel: %s'

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.NON_CURATED_EXPLORATION_ID_2,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.NON_CURATED_EXPLORATION_ID_3,
                stderr='')
        ])


class DeleteExplorationVoiceArtistLinkModelsJobTests(
    CleanUpVoiceoverModelsTestsBaseClass):

    JOB_CLASS: Type[
        clean_up_voiceover_models_job.
        DeleteNonCuratedInstanceofExplorationVoiceArtistsLinkModelJob
    ] = (
        clean_up_voiceover_models_job.
        DeleteNonCuratedInstanceofExplorationVoiceArtistsLinkModelJob
    )

    def test_exploration_voice_artist_link_models_successfully(
        self) -> None:
        self._create_curated_exploration()
        self._create_non_curated_explorations()

        exploration_voice_artist_link_models: Sequence[
            voiceover_models.ExplorationVoiceArtistsLinkModel] = (
                voiceover_models.ExplorationVoiceArtistsLinkModel.
                get_all().fetch()
            )
        self.assertEqual(len(exploration_voice_artist_link_models), 3)

        job_result_template = 'Deleted ExplorationVoiceArtistsLinkModel: %s'

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.NON_CURATED_EXPLORATION_ID_2,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.NON_CURATED_EXPLORATION_ID_3,
                stderr='')
        ])


class AuditEntityVoiceoversModelJobTests(CleanUpVoiceoverModelsTestsBaseClass):
    JOB_CLASS: Type[
        clean_up_voiceover_models_job.AuditEntityVoiceoversModelJob
    ] = (
        clean_up_voiceover_models_job.AuditEntityVoiceoversModelJob
    )

    def test_check_is_exploration_curated_for_invalid_id(self) -> None:
        is_exploration_curated = (
            clean_up_voiceover_models_job.
            AuditEntityVoiceoversModelJob.
            is_exploration_curated(exploration_id='')
        )
        self.assertFalse(is_exploration_curated)

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        is_exploration_curated = (
            clean_up_voiceover_models_job.
            AuditEntityVoiceoversModelJob.
            is_exploration_curated(exploration_id=None) # type: ignore[arg-type]
        )
        self.assertFalse(is_exploration_curated)

    def test_audit_entity_voiceovers_model_successfully(self) -> None:
        self._create_curated_exploration()
        self._create_non_curated_explorations()
        self._create_entity_voiceover_models()

        entity_voiceovers_models: Sequence[
            voiceover_models.EntityVoiceoversModel] = (
                voiceover_models.EntityVoiceoversModel.get_all().fetch()
            )
        self.assertEqual(len(entity_voiceovers_models), 3)

        job_result_template = (
            'Deleted EntityVoiceoversModel: exploration-%s-1-en-US')

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.NON_CURATED_EXPLORATION_ID_2,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.NON_CURATED_EXPLORATION_ID_3,
                stderr='')
        ])


class DeleteEntityVoiceoversModelsJobTests(
    CleanUpVoiceoverModelsTestsBaseClass):
    JOB_CLASS: Type[
        clean_up_voiceover_models_job.
        DeleteNonCuratedInstanceofEntityVoiceoversModelJob
    ] = (
        clean_up_voiceover_models_job.
        DeleteNonCuratedInstanceofEntityVoiceoversModelJob
    )

    def test_delete_entity_voiceovers_model_successfully(self) -> None:
        self._create_curated_exploration()
        self._create_non_curated_explorations()
        self._create_entity_voiceover_models()

        entity_voiceovers_models: Sequence[
            voiceover_models.EntityVoiceoversModel] = (
                voiceover_models.EntityVoiceoversModel.get_all().fetch()
            )
        self.assertEqual(len(entity_voiceovers_models), 3)

        job_result_template = (
            'Deleted EntityVoiceoversModel: exploration-%s-1-en-US')

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.NON_CURATED_EXPLORATION_ID_2,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.NON_CURATED_EXPLORATION_ID_3,
                stderr='')
        ])
        self.process_and_flush_pending_tasks()
