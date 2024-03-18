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

"""Unit tests for jobs.batch_jobs.manual_voice_artist_name_job."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import manual_voice_artist_name_job
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

from typing import Dict, Sequence, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import voiceover_models

(voiceover_models, exp_models) = models.Registry.import_models([
    models.Names.VOICEOVER, models.Names.EXPLORATION])


class VoiceArtistMetadataModelsTestsBaseClass(
    job_test_utils.JobTestBase, test_utils.GenericTestBase):

    EDITOR_EMAIL_1 = 'editor1@example.com'
    EDITOR_EMAIL_2 = 'editor2@example.com'
    EDITOR_EMAIL_3 = 'editor3@example.com'
    EDITOR_EMAIL_4 = 'editor4@example.com'
    EDITOR_EMAIL_5 = 'editor5@example.com'
    EDITOR_USERNAME_1 = 'editor1'
    EDITOR_USERNAME_2 = 'editor2'
    EDITOR_USERNAME_3 = 'editor3'
    EDITOR_USERNAME_4 = 'editor4'

    CURATED_EXPLORATION_ID_1 = 'exploration_id_1'
    CURATED_EXPLORATION_ID_2 = 'exploration_id_2'
    NON_CURATED_EXPLORATION_ID_3 = 'exploration_id_3'

    TOPIC_ID_1 = 'topic_id_1'
    TOPIC_ID_2 = 'topic_id_2'
    STORY_ID_1 = 'story_id_1'
    STORY_ID_2 = 'story_id_2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL_1, self.EDITOR_USERNAME_1)
        self.signup(self.EDITOR_EMAIL_2, self.EDITOR_USERNAME_2)
        self.signup(self.EDITOR_EMAIL_3, self.EDITOR_USERNAME_3)
        self.signup(self.EDITOR_EMAIL_4, self.EDITOR_USERNAME_4)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.set_curriculum_admins([
            self.EDITOR_USERNAME_1,
            self.EDITOR_USERNAME_2,
            self.EDITOR_USERNAME_3,
            self.EDITOR_USERNAME_4,
            self.CURRICULUM_ADMIN_USERNAME])

        self.editor_id_1 = self.get_user_id_from_email(self.EDITOR_EMAIL_1)
        self.editor_id_2 = self.get_user_id_from_email(self.EDITOR_EMAIL_2)
        self.editor_id_3 = self.get_user_id_from_email(self.EDITOR_EMAIL_3)
        self.editor_id_4 = self.get_user_id_from_email(self.EDITOR_EMAIL_4)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.voiceover_dict_1: voiceover_models.VoiceoverDict = {
            'filename': 'filename1.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 42.43
        }
        self.voiceover_dict_2: voiceover_models.VoiceoverDict = {
            'filename': 'filename2.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 40
        }
        self.voiceover_dict_3: voiceover_models.VoiceoverDict = {
            'filename': 'filename3.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 20
        }
        self.voiceover_dict_4: voiceover_models.VoiceoverDict = {
            'filename': 'filename4.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 20
        }
        self.voiceover_dict_5: voiceover_models.VoiceoverDict = {
            'filename': 'filename5.mp3',
            'file_size_bytes': 5000,
            'needs_update': False,
            'duration_secs': 42.43
        }
        self.voiceover_dict_6: voiceover_models.VoiceoverDict = {
            'filename': 'filename6.mp3',
            'file_size_bytes': 1000,
            'needs_update': False,
            'duration_secs': 25
        }
        self.voiceover_dict_7: voiceover_models.VoiceoverDict = {
            'filename': 'filename7.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 42.43
        }

    def _create_curated_explorations(self) -> None:
        """The method generates two curated explorations and integrates them
        into the corresponding stories of two distinct topics.
        """
        exploration_1 = self.save_new_valid_exploration(
            self.CURATED_EXPLORATION_ID_1,
            self.owner_id,
            title='title1',
            category=constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        self.publish_exploration(self.owner_id, exploration_1.id)

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
            str, voiceover_models.VoiceoverDict]]] = {
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

        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_1,
                    'hi': self.voiceover_dict_2
                },
                'ca_placeholder_2': {},
                'default_outcome_1': {}
            }
        }
        old_voiceover_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_1
                },
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
            self.editor_id_2, self.CURATED_EXPLORATION_ID_1,
            change_list, 'Translation commits2')

        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_1,
                    'hi': self.voiceover_dict_2
                },
                'ca_placeholder_2': {
                    'en': self.voiceover_dict_3
                },
                'default_outcome_1': {}
            }
        }
        old_voiceover_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_1,
                    'hi': self.voiceover_dict_2
                },
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
            change_list, 'Translation commits3')

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

        exploration_2 = self.save_new_valid_exploration(
            self.CURATED_EXPLORATION_ID_2,
            self.owner_id,
            title='title2',
            category=constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        self.publish_exploration(self.owner_id, exploration_2.id)

        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {},
                'ca_placeholder_2': {
                    'en': self.voiceover_dict_4
                },
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
            self.editor_id_1, self.CURATED_EXPLORATION_ID_2,
            change_list, 'Translation commits')

        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_5
                },
                'ca_placeholder_2': {
                    'en': self.voiceover_dict_4
                },
                'default_outcome_1': {}
            }
        }
        old_voiceover_dict = {
            'voiceovers_mapping': {
                'content_0': {},
                'ca_placeholder_2': {
                    'en': self.voiceover_dict_4
                },
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
            self.editor_id_3, self.CURATED_EXPLORATION_ID_2,
            change_list, 'Translation commits')

        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_6,
                },
                'ca_placeholder_2': {
                    'en': self.voiceover_dict_4
                },
                'default_outcome_1': {}
            }
        }
        old_voiceover_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_6
                },
                'ca_placeholder_2': {
                    'en': self.voiceover_dict_4
                },
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
            self.editor_id_4, self.CURATED_EXPLORATION_ID_2,
            change_list, 'Translation commits2')

        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_6,
                },
                'ca_placeholder_2': {
                    'en': self.voiceover_dict_4
                },
                'default_outcome_1': {
                    'en': self.voiceover_dict_7,
                }
            }
        }
        old_voiceover_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_6,
                },
                'ca_placeholder_2': {
                    'en': self.voiceover_dict_4
                },
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
            self.editor_id_1, self.CURATED_EXPLORATION_ID_2,
            change_list, 'Translation commits2')

        topic_2 = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_2, 'topic2', 'abbrev-top', 'description', 'fragmem')
        topic_2.thumbnail_filename = 'thumbnail.svg'
        topic_2.thumbnail_bg_color = '#C6DCDA'
        topic_2.subtopics = [
            topic_domain.Subtopic(
                1, 'Title subtopic', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0], 21131,
                'dummy-subtopic-url-sub')]
        topic_2.next_subtopic_id = 2
        topic_2.skill_ids_for_diagnostic_test = ['skill_id_1']

        topic_services.save_new_topic(self.owner_id, topic_2)
        topic_services.publish_topic(self.TOPIC_ID_2, self.admin_id)

        story_2 = story_domain.Story.create_default_story(
            self.STORY_ID_2, 'The second story', 'Description second',
            self.TOPIC_ID_2, 'story-three')
        story_services.save_new_story(self.owner_id, story_2)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_2, self.STORY_ID_2)

        topic_services.publish_story(
            self.TOPIC_ID_2, self.STORY_ID_2, self.admin_id)

        story_services.update_story(
            self.owner_id, self.STORY_ID_2, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': self.CURATED_EXPLORATION_ID_2
            })], 'Changes.')

    def _create_non_curated_exploration(self) -> None:
        """The method generates a non curated exploration."""
        exploration_3 = self.save_new_valid_exploration(
            self.NON_CURATED_EXPLORATION_ID_3,
            self.owner_id,
            title='title1',
            category=constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        self.publish_exploration(self.owner_id, exploration_3.id)


class CreateExplorationVoiceArtistLinkModelsJobTests(
    VoiceArtistMetadataModelsTestsBaseClass):

    JOB_CLASS: Type[
        manual_voice_artist_name_job.CreateExplorationVoiceArtistLinkModelsJob
    ] = (
        manual_voice_artist_name_job.CreateExplorationVoiceArtistLinkModelsJob
    )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_version_is_added_after_running_job(self) -> None:
        self._create_curated_explorations()
        self._create_non_curated_exploration()

        job_result_template = (
            'Generated exploration voice artist link for '
            'exploration %s.'
        )
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_1,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_2,
                stderr='')
        ])

        expected_exp_id_to_content_id_to_voiceovers_mapping = {
            self.CURATED_EXPLORATION_ID_1: {
                'content_0': {
                    'en': (self.editor_id_1, self.voiceover_dict_1),
                    'hi': (self.editor_id_2, self.voiceover_dict_2)
                },
                'ca_placeholder_2': {
                    'en': (self.editor_id_1, self.voiceover_dict_3)
                },
                'default_outcome_1': {}
            },
            self.CURATED_EXPLORATION_ID_2: {
                'content_0': {
                    'en': (self.editor_id_4, self.voiceover_dict_6),
                },
                'ca_placeholder_2': {
                    'en': (self.editor_id_1, self.voiceover_dict_4)
                },
                'default_outcome_1': {
                    'en': (self.editor_id_1, self.voiceover_dict_7),
                }
            }
        }

        exploration_voice_artist_link_models: Sequence[
            voiceover_models.ExplorationVoiceArtistsLinkModel] = (
                voiceover_models.ExplorationVoiceArtistsLinkModel.
                get_all().fetch()
            )

        for exp_link_model in exploration_voice_artist_link_models:
            exp_id = exp_link_model.id
            content_id_to_voiceovers_mapping = (
                exp_link_model.content_id_to_voiceovers_mapping)

            expected_content_id_voiceovers_mapping = (
                expected_exp_id_to_content_id_to_voiceovers_mapping[exp_id])

            for content_id, lang_code_to_voiceover_mapping in (
                    content_id_to_voiceovers_mapping.items()):

                assert isinstance(expected_content_id_voiceovers_mapping, dict)

                self.assertIn(
                    content_id,
                    list(expected_content_id_voiceovers_mapping.keys())
                )

                for lang_code, voiceover_tuple in (
                        lang_code_to_voiceover_mapping.items()):

                    self.assertIn(
                        lang_code,
                        list(expected_content_id_voiceovers_mapping[
                            content_id].keys()
                        )
                    )

                    expected_voiceover_tuple = (
                        expected_content_id_voiceovers_mapping[
                            content_id][lang_code]
                    )

                    self.assertEqual(
                        voiceover_tuple[0],
                        expected_voiceover_tuple[0]
                    )

                    self.assertDictEqual(
                        voiceover_tuple[1],
                        expected_voiceover_tuple[1]
                    )

        self.assertEqual(len(exploration_voice_artist_link_models), 2)


class AuditVoiceArtistMetadataModelsJobTests(
    VoiceArtistMetadataModelsTestsBaseClass):

    JOB_CLASS: Type[
        manual_voice_artist_name_job.AuditExplorationVoiceArtistLinkModelsJob
    ] = (
        manual_voice_artist_name_job.AuditExplorationVoiceArtistLinkModelsJob
    )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_version_is_added_after_running_job(self) -> None:
        self._create_curated_explorations()
        self._create_non_curated_exploration()

        job_result_template = (
            'Generated exploration voice artist link for '
            'exploration %s.'
        )
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_1,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_2,
                stderr='')
        ])

        total_exploration_voice_artist_link_models = len(
            voiceover_models.ExplorationVoiceArtistsLinkModel.get_all().fetch())

        # No models are being saved in the datastore since this is an audit job.
        self.assertEqual(total_exploration_voice_artist_link_models, 0)

    def test_generate_exp_link_model_if_some_commit_log_models_are_missing(
        self
    ) -> None:

        self._create_curated_explorations()
        self._create_non_curated_exploration()

        job_result_template = (
            'Generated exploration voice artist link for '
            'exploration %s.'
        )

        # Deleting an exploration commit log entry model.
        snapshot_model_id: str = 'exploration_id_1-3'
        snapshot_model: exp_models.ExplorationSnapshotMetadataModel = (
            exp_models.ExplorationSnapshotMetadataModel.get(
                snapshot_model_id))
        snapshot_model.delete()

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_1,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_2,
                stderr='')
        ])


class HelperMethodsForExplorationVoiceArtistLinkJobTest(
    VoiceArtistMetadataModelsTestsBaseClass
):
    """Test class to validate helper methods."""

    def test_should_get_voiceover_difference_succssfully(self) -> None:
        new_voiceover_mapping: Dict[
            str, Dict[str, voiceover_models.VoiceoverDict]] = {
                'content_0': {
                    'en': self.voiceover_dict_1,
                    'hi': self.voiceover_dict_4
                },
                'content_1': {
                    'en': self.voiceover_dict_2,
                    'hi': self.voiceover_dict_5
                },
                'content_2': {
                    'en': self.voiceover_dict_7
                }
            }
        old_voiceover_mapping: Dict[
            str, Dict[str, voiceover_models.VoiceoverDict]] = {
                'content_0': {},
                'content_1': {
                    'en': self.voiceover_dict_3,
                    'hi': self.voiceover_dict_6
                },
                'content_2': {
                    'en': self.voiceover_dict_7
                }
            }

        expected_voiceover_mapping_diff = {
            'content_0': {
                'en': self.voiceover_dict_1,
                'hi': self.voiceover_dict_4
            },
            'content_1': {
                'en': self.voiceover_dict_2,
                'hi': self.voiceover_dict_5
            },

        }

        voiceover_mapping_diff = (
            manual_voice_artist_name_job.
            CreateExplorationVoiceArtistLinkModelsJob.
            get_voiceover_from_recorded_voiceover_diff(
                new_voiceover_mapping,
                old_voiceover_mapping
            )
        )
        self.assertDictEqual(
            expected_voiceover_mapping_diff, voiceover_mapping_diff)
