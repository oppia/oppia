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

"""Unit tests for jobs.batch_jobs.manual_voice_artist_names_job."""

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
from core.jobs.batch_jobs import manual_voice_artist_names_job
from core.jobs.types import job_run_result
from core.tests import test_utils

from typing import Type


class GetVoiceArtistNamesFromExplorationsJobTests(
    job_test_utils.JobTestBase, test_utils.GenericTestBase):

    JOB_CLASS: Type[
        manual_voice_artist_names_job.GetVoiceArtistNamesFromExplorationsJob
    ] = manual_voice_artist_names_job.GetVoiceArtistNamesFromExplorationsJob

    EDITOR_EMAIL_1 = 'editor1@example.com'
    EDITOR_EMAIL_2 = 'editor2@example.com'
    EDITOR_EMAIL_3 = 'editor3@example.com'
    EDITOR_EMAIL_4 = 'editor4@example.com'
    EDITOR_EMAIL_5 = 'editor5@example.com'
    EDITOR_USERNAME_1 = 'editor1'
    EDITOR_USERNAME_2 = 'editor2'
    EDITOR_USERNAME_3 = 'editor3'
    EDITOR_USERNAME_4 = 'editor4'
    EDITOR_USERNAME_5 = 'editor5'

    CURATED_EXPLORATION_ID_1 = 'explrotion_id_1'
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
        self.signup(self.EDITOR_EMAIL_5, self.EDITOR_USERNAME_5)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.set_curriculum_admins([
            self.EDITOR_USERNAME_1,
            self.EDITOR_USERNAME_2,
            self.EDITOR_USERNAME_3,
            self.EDITOR_USERNAME_4,
            self.EDITOR_USERNAME_5,
            self.CURRICULUM_ADMIN_USERNAME])

        self.editor_id_1 = self.get_user_id_from_email(self.EDITOR_EMAIL_1)
        self.editor_id_2 = self.get_user_id_from_email(self.EDITOR_EMAIL_2)
        self.editor_id_3 = self.get_user_id_from_email(self.EDITOR_EMAIL_3)
        self.editor_id_4 = self.get_user_id_from_email(self.EDITOR_EMAIL_4)
        self.editor_id_5 = self.get_user_id_from_email(self.EDITOR_EMAIL_5)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def create_curated_explorations(self) -> None:
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
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 42.43
                    }
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
            self.editor_id_1, self.CURATED_EXPLORATION_ID_1,
            change_list, 'Translation commits')

        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 42.43
                    },
                    'hi': {
                        'filename': 'filename4.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 40
                    }
                },
                'ca_placeholder_2': {},
                'default_outcome_1': {}
            }
        }
        old_voiceover_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 42.43
                    }
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
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 42.43
                    },
                    'hi': {
                        'filename': 'filename4.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 40
                    }
                },
                'ca_placeholder_2': {
                    'en': {
                        'filename': 'filename4.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 20
                    }
                },
                'default_outcome_1': {}
            }
        }
        old_voiceover_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': {
                        'filename': 'filename3.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 42.43
                    },
                    'hi': {
                        'filename': 'filename4.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 40
                    }
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
                'content_0': {
                    'en': {
                        'filename': 'filename5.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 20
                    }
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
            self.editor_id_3, self.CURATED_EXPLORATION_ID_2,
            change_list, 'Translation commits')

        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': {
                        'filename': 'filename6.mp3',
                        'file_size_bytes': 5000,
                        'needs_update': False,
                        'duration_secs': 42.43
                    },
                },
                'ca_placeholder_2': {},
                'default_outcome_1': {}
            }
        }
        old_voiceover_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': {
                        'filename': 'filename5.mp3',
                        'file_size_bytes': 3000,
                        'needs_update': False,
                        'duration_secs': 20
                    }
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
            self.editor_id_4, self.CURATED_EXPLORATION_ID_2,
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

    def test_version_is_added_after_running_job(self) -> None:
        self.create_curated_explorations()
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout='USER IDS WHOSE METADATA MODELS ARE CREATED SUCCESS: 2')
        ])
