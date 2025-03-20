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
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import manual_voice_artist_name_job
from core.jobs.types import job_run_result
from core.platform import models
from core.tests import test_utils

from typing import Dict, List, Sequence, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
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
        self.voiceover_dict_6: state_domain.VoiceoverDict = {
            'filename': 'filename6.mp3',
            'file_size_bytes': 1000,
            'needs_update': False,
            'duration_secs': 25
        }
        self.voiceover_dict_7: state_domain.VoiceoverDict = {
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

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput'
        })]

        exp_services.update_exploration(
            self.owner_id, self.CURATED_EXPLORATION_ID_1,
            change_list, 'Added new interaction')

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
            'Generated exploration voice artist link model for '
            'exploration %s.'
        )

        debug_logs_1 = (
            'Exp ID: exploration_id_1.\nSnapshots: 5\n-\na. editor1\nb. '
            'exploration_id_1-4 & exploration_id_1-5\nc. 1, [filename3.mp3]\n-'
            '\na. editor2\nb. exploration_id_1-2 & exploration_id_1-3\nc. 1, '
            '[filename2.mp3]\n-\na. editor1\nb. exploration_id_1-1 & '
            'exploration_id_1-2\nc. 1, [filename1.mp3]\n\n'
        )
        debug_logs_2 = (
            'Exp ID: exploration_id_2.\nSnapshots: 5\n-\na. editor1\nb. '
            'exploration_id_2-4 & exploration_id_2-5\nc. 1, [filename7.mp3]\n-'
            '\na. editor4\nb. exploration_id_2-3 & exploration_id_2-4\nc. 1, '
            '[filename6.mp3]\n-\na. editor3\nb. exploration_id_2-2 & '
            'exploration_id_2-3\nc. 1, [filename5.mp3]\n-\na. editor1\nb. '
            'exploration_id_2-1 & exploration_id_2-2\nc. 1, [filename4.mp3]\n\n'
        )
        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_1,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_2,
                stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_1, stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_2, stderr='')
        ])

        expected_exp_id_to_content_id_to_voiceovers_mapping = {
            self.CURATED_EXPLORATION_ID_1: {
                'content_0': {
                    'en': [self.editor_id_1, self.voiceover_dict_1],
                    'hi': [self.editor_id_2, self.voiceover_dict_2]
                },
                'ca_placeholder_2': {
                    'en': [self.editor_id_1, self.voiceover_dict_3]
                }
            },
            self.CURATED_EXPLORATION_ID_2: {
                'content_0': {
                    'en': [self.editor_id_4, self.voiceover_dict_6],
                },
                'ca_placeholder_2': {
                    'en': [self.editor_id_1, self.voiceover_dict_4]
                },
                'default_outcome_1': {
                    'en': [self.editor_id_1, self.voiceover_dict_7],
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

            self.assertDictEqual(
                content_id_to_voiceovers_mapping,
                expected_content_id_voiceovers_mapping
            )

        self.assertEqual(len(exploration_voice_artist_link_models), 2)

    def test_should_skip_voiceover_if_specific_snapshot_model_is_invalid(
        self
    ) -> None:
        self._create_curated_explorations()
        self._create_non_curated_exploration()

        job_result_template = (
            'Generated exploration voice artist link model for '
            'exploration %s.'
        )

        snapshot_model_id: str = 'exploration_id_1-4'
        snapshot_model: exp_models.ExplorationSnapshotContentModel = (
            exp_models.ExplorationSnapshotContentModel.get_by_id(
                snapshot_model_id))
        # Deleting recorded voiceovers field to make this snapshot invalid.
        del snapshot_model.content['states'][
            'Introduction']['recorded_voiceovers']['voiceovers_mapping']
        snapshot_model.update_timestamps()
        snapshot_model.put()

        debug_logs_1 = (
            'Exp ID: exploration_id_1.\nSnapshots: 5\n-\na. editor2\nb. '
            'exploration_id_1-2 & exploration_id_1-3\nc. 1, [filename2.mp3]\n-'
            '\na. editor1\nb. exploration_id_1-1 & exploration_id_1-2\nc. 1, '
            '[filename1.mp3]\n\n'
        )
        debug_logs_2 = (
            'Exp ID: exploration_id_2.\nSnapshots: 5\n-\na. editor1\nb. '
            'exploration_id_2-4 & exploration_id_2-5\nc. 1, [filename7.mp3]'
            '\n-\na. editor4\nb. exploration_id_2-3 & exploration_id_2-4\nc. 1,'
            ' [filename6.mp3]\n-\na. editor3\nb. exploration_id_2-2 & '
            'exploration_id_2-3\nc. 1, [filename5.mp3]\n-\na. editor1\nb. '
            'exploration_id_2-1 & exploration_id_2-2\nc. 1, [filename4.mp3]\n\n'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_1,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_2,
                stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_1, stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_2, stderr='')
        ])

        expected_exp_id_to_content_id_to_voiceovers_mapping = {
            self.CURATED_EXPLORATION_ID_1: {
                'content_0': {
                    'en': [self.editor_id_1, self.voiceover_dict_1],
                    'hi': [self.editor_id_2, self.voiceover_dict_2]
                }
            },
            self.CURATED_EXPLORATION_ID_2: {
                'content_0': {
                    'en': [self.editor_id_4, self.voiceover_dict_6],
                },
                'ca_placeholder_2': {
                    'en': [self.editor_id_1, self.voiceover_dict_4]
                },
                'default_outcome_1': {
                    'en': [self.editor_id_1, self.voiceover_dict_7],
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

            self.assertDictEqual(
                content_id_to_voiceovers_mapping,
                expected_content_id_voiceovers_mapping
            )


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
            'Generated exploration voice artist link model for '
            'exploration %s.'
        )
        debug_logs_1 = (
            'Exp ID: exploration_id_1.\nSnapshots: 5\n-\na. editor1\nb. '
            'exploration_id_1-4 & exploration_id_1-5\nc. 1, [filename3.mp3]\n-'
            '\na. editor2\nb. exploration_id_1-2 & exploration_id_1-3\nc. 1, '
            '[filename2.mp3]\n-\na. editor1\nb. exploration_id_1-1 & '
            'exploration_id_1-2\nc. 1, [filename1.mp3]\n\n'
        )
        debug_logs_2 = (
            'Exp ID: exploration_id_2.\nSnapshots: 5\n-\na. editor1\nb. '
            'exploration_id_2-4 & exploration_id_2-5\nc. 1, [filename7.mp3]\n-'
            '\na. editor4\nb. exploration_id_2-3 & exploration_id_2-4\nc. 1, '
            '[filename6.mp3]\n-\na. editor3\nb. exploration_id_2-2 & '
            'exploration_id_2-3\nc. 1, [filename5.mp3]\n-\na. editor1\nb. '
            'exploration_id_2-1 & exploration_id_2-2\nc. 1, [filename4.mp3]\n\n'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_1,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_2,
                stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_1, stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_2, stderr='')
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
            'Generated exploration voice artist link model for '
            'exploration %s.'
        )

        # Deleting an exploration commit log entry model.
        snapshot_model_id: str = 'exploration_id_1-3'
        snapshot_model: exp_models.ExplorationSnapshotMetadataModel = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                snapshot_model_id))
        snapshot_model.delete()

        debug_logs_1 = (
            'Exp ID: exploration_id_1.\nSnapshots: 5\n-\na. editor1\nb. '
            'exploration_id_1-4 & exploration_id_1-5\nc. 1, [filename3.mp3]\n-'
            '\na. editor1\nb. exploration_id_1-1 & exploration_id_1-2\nc. 1, '
            '[filename1.mp3]\n\n'
        )
        debug_logs_2 = (
            'Exp ID: exploration_id_2.\nSnapshots: 5\n-\na. editor1\nb. '
            'exploration_id_2-4 & exploration_id_2-5\nc. 1, [filename7.mp3]\n-'
            '\na. editor4\nb. exploration_id_2-3 & exploration_id_2-4\nc. 1, '
            '[filename6.mp3]\n-\na. editor3\nb. exploration_id_2-2 & '
            'exploration_id_2-3\nc. 1, [filename5.mp3]\n-\na. editor1\nb. '
            'exploration_id_2-1 & exploration_id_2-2\nc. 1, [filename4.mp3]\n\n'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_1,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_2,
                stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_1, stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_2, stderr='')
        ])

    def test_generate_exp_link_model_if_some_snapshot_models_are_missing(
        self
    ) -> None:

        self._create_curated_explorations()
        self._create_non_curated_exploration()

        job_result_template = (
            'Generated exploration voice artist link model for '
            'exploration %s.'
        )

        # Deleting an exploration commit log entry model.
        snapshot_model_id: str = 'exploration_id_1-3'
        snapshot_model: exp_models.ExplorationSnapshotContentModel = (
            exp_models.ExplorationSnapshotContentModel.get_by_id(
                snapshot_model_id))
        snapshot_model.delete()

        debug_logs_1 = (
            'Exp ID: exploration_id_1.\nSnapshots: 4\n-\na. editor1\nb. '
            'exploration_id_1-4 & exploration_id_1-5\nc. 1, '
            '[filename3.mp3]\n-\na. editor1\nb. exploration_id_1-1 & '
            'exploration_id_1-2\nc. 1, [filename1.mp3]\n\n'
        )
        debug_logs_2 = (
            'Exp ID: exploration_id_2.\nSnapshots: 5\n-\na. editor1\nb. '
            'exploration_id_2-4 & exploration_id_2-5\nc. 1, [filename7.mp3]\n-'
            '\na. editor4\nb. exploration_id_2-3 & exploration_id_2-4\nc. 1, '
            '[filename6.mp3]\n-\na. editor3\nb. exploration_id_2-2 & '
            'exploration_id_2-3\nc. 1, [filename5.mp3]\n-\na. editor1\nb. '
            'exploration_id_2-1 & exploration_id_2-2\nc. 1, [filename4.mp3]\n\n'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_1,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_2,
                stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_1, stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_2, stderr='')
        ])

    def test_shoould_raise_error_for_non_existent_user(self) -> None:
        self._create_curated_explorations()

        # Updating committer ID.
        snapshot_model_id: str = 'exploration_id_1-3'
        snapshot_model: exp_models.ExplorationSnapshotMetadataModel = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                snapshot_model_id))
        snapshot_model.committer_id = 'non_existent_user'
        snapshot_model.update_timestamps()
        snapshot_model.put()

        job_result_template = (
            'Generated exploration voice artist link model for '
            'exploration %s.'
        )

        debug_logs_1 = (
            'Exp ID: exploration_id_1.\nSnapshots: 5\n-\na. editor1\nb. '
            'exploration_id_1-4 & exploration_id_1-5\nc. 1, [filename3.mp3]\n-'
            '\na. Not Found for user ID: non_existent_user.\nb. '
            'exploration_id_1-2 & exploration_id_1-3\nc. 1, [filename2.mp3]\n-'
            '\na. editor1\nb. exploration_id_1-1 & exploration_id_1-2\nc. 1, '
            '[filename1.mp3]\n\n'
        )
        debug_logs_2 = (
            'Exp ID: exploration_id_2.\nSnapshots: 5\n-\na. editor1\nb. '
            'exploration_id_2-4 & exploration_id_2-5\nc. 1, [filename7.mp3]\n-'
            '\na. editor4\nb. exploration_id_2-3 & exploration_id_2-4\nc. 1, '
            '[filename6.mp3]\n-\na. editor3\nb. exploration_id_2-2 & '
            'exploration_id_2-3\nc. 1, [filename5.mp3]\n-\na. editor1\nb. '
            'exploration_id_2-1 & exploration_id_2-2\nc. 1, [filename4.mp3]\n\n'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_1,
                stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % self.CURATED_EXPLORATION_ID_2,
                stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_1, stderr=''),
            job_run_result.JobRunResult(stdout=debug_logs_2, stderr='')
        ])


class HelperMethodsForExplorationVoiceArtistLinkJobTest(
    VoiceArtistMetadataModelsTestsBaseClass
):
    """Test class to validate helper methods."""

    def test_should_create_exploration_link_for_voice_artist(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.CURATED_EXPLORATION_ID_1,
            self.owner_id,
            title='title1',
            category=constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        self.publish_exploration(self.owner_id, exploration.id)

        exp_services.update_exploration(
            self.owner_id, self.CURATED_EXPLORATION_ID_1,
            [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'Introduction',
                'new_value': {
                    'content_id': 'content_0',
                    'html': '<p>A content to translate.</p>'
                }
            })],
            'Changes content.'
        )

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

        exploration_models: List[exp_models.ExplorationModel] = list(
            exp_models.ExplorationModel.get_all().fetch())
        snapshot_models: List[
            exp_models.ExplorationSnapshotContentModel] = list(
                exp_models.ExplorationSnapshotContentModel.get_all().fetch())
        metadata_models: List[
            exp_models.ExplorationSnapshotMetadataModel] = list(
                exp_models.ExplorationSnapshotMetadataModel.get_all().fetch())

        expected_content_id_to_voiceovers_mapping = {
            'content_0': {
                'en': (self.editor_id_1, self.voiceover_dict_1)
            }
        }

        exp_link_model, _ = (
            manual_voice_artist_name_job.
            CreateExplorationVoiceArtistLinkModelsJob.
            get_exploration_voice_artists_link_model(
                exploration_models[0], snapshot_models, metadata_models))
        assert exp_link_model is not None

        self.assertEqual(exp_link_model.id, self.CURATED_EXPLORATION_ID_1)
        self.assertDictEqual(
            exp_link_model.content_id_to_voiceovers_mapping,
            expected_content_id_to_voiceovers_mapping
        )

    def test_check_is_exploration_curated_for_invalid_id(self) -> None:
        is_exploration_curated = (
            manual_voice_artist_name_job.
            CreateExplorationVoiceArtistLinkModelsJob.
            is_exploration_curated(exploration_id='')
        )
        self.assertFalse(is_exploration_curated)

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        is_exploration_curated = (
            manual_voice_artist_name_job.
            CreateExplorationVoiceArtistLinkModelsJob.
            is_exploration_curated(exploration_id=None) # type: ignore[arg-type]
        )
        self.assertFalse(is_exploration_curated)

    def test_should_get_empty_filenames_successfully(self) -> None:
        exploration = self.save_new_valid_exploration(
            self.CURATED_EXPLORATION_ID_1,
            self.owner_id,
            title='title1',
            category=constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        self.publish_exploration(self.owner_id, exploration.id)

        exp_services.update_exploration(
            self.owner_id, self.CURATED_EXPLORATION_ID_1,
            [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'Introduction',
                'new_value': {
                    'content_id': 'content_0',
                    'html': '<p>A content to translate.</p>'
                }
            })],
            'Changes content.'
        )

        new_voiceovers_dict_1: Dict[str, Dict[str, Dict[
            str, state_domain.VoiceoverDict]]] = {
                'voiceovers_mapping': {
                    'content_0': {
                        'en': self.voiceover_dict_1
                    },
                    'ca_placeholder_2': {},
                    'default_outcome_1': {}
                }
            }
        old_voiceover_dict_1: Dict[str, Dict[str, Dict[
            str, state_domain.VoiceoverDict]]] = {
                'voiceovers_mapping': {
                    'content_0': {},
                    'ca_placeholder_2': {},
                    'default_outcome_1': {}
                }
            }

        new_voiceovers_dict_2: Dict[str, Dict[str, Dict[
            str, state_domain.VoiceoverDict]]] = {
                'voiceovers_mapping': {
                    'content_0': {},
                    'ca_placeholder_2': {},
                    'default_outcome_1': {}
                }
            }
        old_voiceover_dict_2: Dict[str, Dict[str, Dict[
            str, state_domain.VoiceoverDict]]] = {
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
            'new_value': new_voiceovers_dict_1,
            'old_value': old_voiceover_dict_1
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': (
                exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'new_value': new_voiceovers_dict_2,
            'old_value': old_voiceover_dict_2
        })]
        exp_services.update_exploration(
            self.editor_id_1, self.CURATED_EXPLORATION_ID_1,
            change_list, 'Translation commits')

        exploration_models: List[exp_models.ExplorationModel] = list(
            exp_models.ExplorationModel.get_all().fetch())

        snapshot_models: List[
            exp_models.ExplorationSnapshotContentModel] = list(
                exp_models.ExplorationSnapshotContentModel.get_all().fetch())

        metadata_models: List[
            exp_models.ExplorationSnapshotMetadataModel] = list(
                exp_models.ExplorationSnapshotMetadataModel.get_all().fetch())

        exp_link_model, _ = (
            manual_voice_artist_name_job.
            CreateExplorationVoiceArtistLinkModelsJob.
            get_exploration_voice_artists_link_model(
                exploration_models[0], snapshot_models, metadata_models
            ))
        assert exp_link_model is not None
        self.assertEqual(exp_link_model.id, self.CURATED_EXPLORATION_ID_1)
        self.assertEqual(exp_link_model.content_id_to_voiceovers_mapping, {})

    def test_should_create_empty_exploration_voice_artist_link_model(
        self
    ) -> None:
        exploration = self.save_new_valid_exploration(
            self.CURATED_EXPLORATION_ID_1,
            self.owner_id,
            title='title1',
            category=constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        self.publish_exploration(self.owner_id, exploration.id)

        exp_services.update_exploration(
            self.owner_id, self.CURATED_EXPLORATION_ID_1,
            [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'state_name': 'Introduction',
                'new_value': {
                    'content_id': 'content_0',
                    'html': '<p>A content to translate.</p>'
                }
            })],
            'Changes content.'
        )

        exploration_models: List[exp_models.ExplorationModel] = list(
            exp_models.ExplorationModel.get_all().fetch())

        snapshot_models: List[
            exp_models.ExplorationSnapshotContentModel] = list(
                exp_models.ExplorationSnapshotContentModel.get_all().fetch())
        metadata_models: List[
            exp_models.ExplorationSnapshotMetadataModel] = list(
                exp_models.ExplorationSnapshotMetadataModel.get_all().fetch())

        snapshot_metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get(
                'exploration_id_1-2'))
        del snapshot_metadata_model.commit_cmds[0]['cmd']
        snapshot_metadata_model.update_timestamps()
        snapshot_metadata_model.put()

        exp_link_model, _ = (
            manual_voice_artist_name_job.
            CreateExplorationVoiceArtistLinkModelsJob.
            get_exploration_voice_artists_link_model(
                exploration_models[0], snapshot_models, metadata_models
            ))
        assert exp_link_model is not None

        self.assertEqual(exp_link_model.id, self.CURATED_EXPLORATION_ID_1)
        self.assertDictEqual(
            exp_link_model.content_id_to_voiceovers_mapping, {})
