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

"""Unit tests for jobs.batch_jobs.voiceover_migration_job."""

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
from core.domain import voiceover_services
from core.jobs import job_test_utils
from core.jobs.batch_jobs import voiceover_migration_job
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
    EDITOR_USERNAME_1 = 'editor1'
    EDITOR_USERNAME_2 = 'editor2'

    CURATED_EXPLORATION_ID_1 = 'exploration_id_1'
    CURATED_EXPLORATION_ID_2 = 'exploration_id_2'

    TOPIC_ID_1 = 'topic_id_1'
    TOPIC_ID_2 = 'topic_id_2'
    STORY_ID_1 = 'story_id_1'
    STORY_ID_2 = 'story_id_2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL_1, self.EDITOR_USERNAME_1)
        self.signup(self.EDITOR_EMAIL_2, self.EDITOR_USERNAME_2)
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.set_curriculum_admins([
            self.EDITOR_USERNAME_1,
            self.EDITOR_USERNAME_2,
            self.CURRICULUM_ADMIN_USERNAME])

        self.editor_id_1 = self.get_user_id_from_email(self.EDITOR_EMAIL_1)
        self.editor_id_2 = self.get_user_id_from_email(self.EDITOR_EMAIL_2)
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
            self.editor_id_1, self.CURATED_EXPLORATION_ID_2,
            change_list, 'Translation commits')

        new_voiceovers_dict = {
            'voiceovers_mapping': {
                'content_0': {
                    'en': self.voiceover_dict_5,
                    'hi': self.voiceover_dict_6
                },
                'ca_placeholder_2': {
                    'en': self.voiceover_dict_4,
                    'hi': self.voiceover_dict_7
                },
                'default_outcome_1': {}
            }
        }
        old_voiceover_dict = {
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
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': (
                exp_domain.STATE_PROPERTY_RECORDED_VOICEOVERS),
            'state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'new_value': new_voiceovers_dict,
            'old_value': old_voiceover_dict
        })]
        exp_services.update_exploration(
            self.editor_id_2, self.CURATED_EXPLORATION_ID_2,
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

    def _create_exp_voice_artists_link(self) -> None:
        """The method creates two instances of exploration voice artists link
        model.
        """
        content_id_to_voiceovers_mapping_1 = {
            'content_0': {
                'en': (self.editor_id_1, self.voiceover_dict_1),
                'hi': (self.editor_id_2, self.voiceover_dict_2)
            },
            'ca_placeholder_2': {
                'en': (self.editor_id_1, self.voiceover_dict_3)
            }
        }
        content_id_to_voiceovers_mapping_2 = {
            'content_0': {
                'en': (self.editor_id_1, self.voiceover_dict_5),
                'hi': (self.editor_id_2, self.voiceover_dict_6)
            },
            'ca_placeholder_2': {
                'en': (self.editor_id_1, self.voiceover_dict_4),
                'hi': (self.editor_id_2, self.voiceover_dict_7)
            }
        }
        exp_voice_artist_link_model_1 = (
            voiceover_services.
            create_exploration_voice_artists_link_model_instance(
                self.CURATED_EXPLORATION_ID_1,
                content_id_to_voiceovers_mapping_1
            )
        )
        exp_voice_artist_link_model_1.put()

        exp_voice_artist_link_model_2 = (
            voiceover_services.
            create_exploration_voice_artists_link_model_instance(
                self.CURATED_EXPLORATION_ID_2,
                content_id_to_voiceovers_mapping_2
            )
        )
        exp_voice_artist_link_model_2.put()

    def _create_voice_artist_metadata(self) -> None:
        """The method creates two instances of voice artists metadata model."""
        language_code_to_accent_1 = {
            'en': 'en-US'
        }
        language_code_to_accent_2 = {
            'hi': 'hi-IN'
        }
        voiceover_models.VoiceArtistMetadataModel.create_model(
            voice_artist_id=self.editor_id_1,
            language_code_to_accent=language_code_to_accent_1)
        voiceover_models.VoiceArtistMetadataModel.create_model(
            voice_artist_id=self.editor_id_2,
            language_code_to_accent=language_code_to_accent_2)

    def _create_voice_artist_metadata_with_missing_accent_code(self) -> None:
        """The method creates two instances of the voice artist metadata model,
        and one model contains a missing accent code.
        """
        language_code_to_accent_1 = {
            'en': 'en-US'
        }
        language_code_to_accent_2: Dict[str, str] = {}

        voiceover_models.VoiceArtistMetadataModel.create_model(
            voice_artist_id=self.editor_id_1,
            language_code_to_accent=language_code_to_accent_1)
        voiceover_models.VoiceArtistMetadataModel.create_model(
            voice_artist_id=self.editor_id_2,
            language_code_to_accent=language_code_to_accent_2)


class CreateExplorationVoiceArtistLinkModelsJobTests(
    VoiceArtistMetadataModelsTestsBaseClass):

    JOB_CLASS: Type[
        voiceover_migration_job.
        PopulateManualVoiceoversToEntityVoiceoversModelJob
    ] = (
        voiceover_migration_job.
        PopulateManualVoiceoversToEntityVoiceoversModelJob
    )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_version_is_added_after_running_job(self) -> None:
        self._create_curated_explorations()
        self._create_exp_voice_artists_link()
        self._create_voice_artist_metadata()

        job_result_template = (
            'Migrated %s voiceovers for exploration: %s, in language '
            'accent code %s.'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % (
                    str(2), self.CURATED_EXPLORATION_ID_1, 'en-US'), stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % (
                    str(1), self.CURATED_EXPLORATION_ID_1, 'hi-IN'), stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % (
                    str(2), self.CURATED_EXPLORATION_ID_2, 'en-US'), stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % (
                    str(2), self.CURATED_EXPLORATION_ID_2, 'hi-IN'), stderr=''),
        ])

        entity_voiceovers_models: Sequence[
            voiceover_models.EntityVoiceoversModel] = (
                voiceover_models.EntityVoiceoversModel.get_all().fetch())
        expected_entity_voiceover_id_to_model = {
            'exploration-exploration_id_1-5-en-US': {
                'content_0': {
                    'manual': self.voiceover_dict_1,
                    'auto': None
                },
                'ca_placeholder_2': {
                    'manual': self.voiceover_dict_3,
                    'auto': None
                }
            },
            'exploration-exploration_id_1-5-hi-IN': {
                'content_0': {
                    'manual': self.voiceover_dict_2,
                    'auto': None
                }
            },
            'exploration-exploration_id_2-4-en-US': {
                'content_0': {
                    'manual': self.voiceover_dict_5,
                    'auto': None
                },
                'ca_placeholder_2': {
                    'manual': self.voiceover_dict_4,
                    'auto': None
                }
            },
            'exploration-exploration_id_2-4-hi-IN': {
                'content_0': {
                    'manual': self.voiceover_dict_6,
                    'auto': None
                },
                'ca_placeholder_2': {
                    'manual': self.voiceover_dict_7,
                    'auto': None
                }
            }
        }

        self.assertEqual(len(entity_voiceovers_models), 4)

        for model in entity_voiceovers_models:
            self.assertDictEqual(
                expected_entity_voiceover_id_to_model[model.id],
                model.voiceovers_mapping
            )

    def test_should_raise_exception_for_empty_accent_code(self) -> None:
        self._create_curated_explorations()
        self._create_exp_voice_artists_link()
        self._create_voice_artist_metadata_with_missing_accent_code()

        error_message = (
            'Please assign all the accents for voice artists in '
            'language code hi.')

        with self.assertRaisesRegex(KeyError, error_message):
            self.assert_job_output_is([])


class AuditExplorationVoiceArtistLinkModelsJobTests(
    VoiceArtistMetadataModelsTestsBaseClass):

    JOB_CLASS: Type[
        voiceover_migration_job.AuditEntityVoiceoverModelJob
    ] = (
        voiceover_migration_job.AuditEntityVoiceoverModelJob
    )

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_version_is_added_after_running_job(self) -> None:
        self._create_curated_explorations()
        self._create_exp_voice_artists_link()
        self._create_voice_artist_metadata()

        job_result_template = (
            'Migrated %s voiceovers for exploration: %s, in language '
            'accent code %s.'
        )

        self.assert_job_output_is([
            job_run_result.JobRunResult(
                stdout=job_result_template % (
                    str(2), self.CURATED_EXPLORATION_ID_1, 'en-US'), stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % (
                    str(1), self.CURATED_EXPLORATION_ID_1, 'hi-IN'), stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % (
                    str(2), self.CURATED_EXPLORATION_ID_2, 'en-US'), stderr=''),
            job_run_result.JobRunResult(
                stdout=job_result_template % (
                    str(2), self.CURATED_EXPLORATION_ID_2, 'hi-IN'), stderr=''),
        ])

        entity_voiceovers_models: Sequence[
            voiceover_models.EntityVoiceoversModel] = (
                voiceover_models.EntityVoiceoversModel.get_all().fetch())

        self.assertEqual(len(entity_voiceovers_models), 0)
