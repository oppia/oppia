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

"""Tests for the voiceover admin page."""

from __future__ import annotations

import datetime
import uuid

from core import constants, feature_flag_list, feconf
from core.domain import (
    cloud_task_domain,
    exp_domain,
    exp_fetchers,
    exp_services,
    opportunity_services,
    rights_domain,
    rights_manager,
    state_domain,
    story_domain,
    story_services,
    taskqueue_services,
    topic_domain,
    topic_services,
    translation_domain,
    translation_fetchers,
    user_services,
    voiceover_cloud_task_services,
    voiceover_domain,
    voiceover_services,
)
from core.tests import test_utils

from typing import Dict


class VoiceoverAdminPageHandlerTests(test_utils.GenericTestBase):
    """Checks the voiceover admin page functionality."""

    def test_get_voiceover_admin_data(self) -> None:
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        self.login(self.VOICEOVER_ADMIN_EMAIL, is_super_admin=True)

        language_accent_master_list: Dict[str, Dict[str, str]] = (
            voiceover_services.get_language_accent_master_list()
        )

        language_codes_mapping: Dict[str, Dict[str, bool]] = (
            voiceover_services.get_all_language_accent_codes_for_voiceovers()
        )

        json_response = self.get_json(feconf.VOICEOVER_ADMIN_DATA_HANDLER_URL)

        self.assertDictEqual(
            json_response['language_accent_master_list'],
            language_accent_master_list,
        )
        self.assertDictEqual(
            json_response['language_codes_mapping'], language_codes_mapping
        )

        self.logout()


class VoiceoverLanguageCodesMappingHandlerTests(test_utils.GenericTestBase):
    """The class validates language accent codes mapping field should
    update correctly.
    """

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS]
    )
    def test_put_language_accent_codes_mapping_correctly(self) -> None:
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        self.login(self.VOICEOVER_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        initial_language_codes_mapping: Dict[str, Dict[str, bool]] = (
            voiceover_services.get_all_language_accent_codes_for_voiceovers()
        )
        self.assertDictEqual(initial_language_codes_mapping, {})
        expected_language_codes_mapping = {
            'en': {'en-US': True},
            'hi': {'hi-IN': False},
        }
        payload = {'language_codes_mapping': expected_language_codes_mapping}

        self.put_json(
            feconf.VOICEOVER_LANGUAGE_CODES_MAPPING_HANDLER_URL,
            payload,
            csrf_token=csrf_token,
        )

        language_codes_mapping: Dict[str, Dict[str, bool]] = (
            voiceover_services.get_all_language_accent_codes_for_voiceovers()
        )
        self.assertDictEqual(
            language_codes_mapping, expected_language_codes_mapping
        )

        self.logout()

    def test_invalid_language_accent_codes_mapping_raise_error(self) -> None:
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        self.login(self.VOICEOVER_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        invalid_language_codes_mapping = {'en': 'en-US'}
        payload = {'language_codes_mapping': invalid_language_codes_mapping}

        response_dict = self.put_json(
            feconf.VOICEOVER_LANGUAGE_CODES_MAPPING_HANDLER_URL,
            payload,
            csrf_token=csrf_token,
            expected_status_int=400,
        )
        self.assertEqual(
            response_dict['error'],
            'At \'http://localhost/voiceover_language_codes_mapping\' '
            'these errors are happening:\n'
            'Schema validation for \'language_codes_mapping\' failed: '
            'Expected dict, received en-US',
        )

        self.logout()


class EntityVoiceoversBulkHandlerTests(test_utils.GenericTestBase):
    """Test class to validate entity voiceovers bulk handler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        self.manual_voiceover_dict_1: state_domain.VoiceoverDict = {
            'filename': 'filename1.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 6.1,
        }
        self.autogenerated_voiceover_dict_1: state_domain.VoiceoverDict = {
            'filename': 'filename2.mp3',
            'file_size_bytes': 3500,
            'needs_update': False,
            'duration_secs': 5.9,
        }
        self.manual_voiceover_dict_2: state_domain.VoiceoverDict = {
            'filename': 'filename1.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 6.1,
        }
        self.autogenerated_voiceover_dict_2: state_domain.VoiceoverDict = {
            'filename': 'filename2.mp3',
            'file_size_bytes': 3500,
            'needs_update': False,
            'duration_secs': 5.9,
        }

        self.entity_voiceovers_1 = voiceover_domain.EntityVoiceovers(
            entity_id='exp_id',
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_version=1,
            language_accent_code='en-US',
            voiceovers_mapping={
                'content_id_0': {
                    feconf.VoiceoverType.MANUAL.value: (
                        state_domain.Voiceover.from_dict(
                            self.manual_voiceover_dict_1
                        )
                    ),
                    feconf.VoiceoverType.AUTO.value: (
                        state_domain.Voiceover.from_dict(
                            self.autogenerated_voiceover_dict_1
                        )
                    ),
                }
            },
            automated_voiceovers_audio_offsets_msecs={},
        )
        self.entity_voiceovers_2 = voiceover_domain.EntityVoiceovers(
            entity_id='exp_id',
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_version=1,
            language_accent_code='en-IN',
            voiceovers_mapping={
                'content_id_0': {
                    feconf.VoiceoverType.MANUAL.value: (
                        state_domain.Voiceover.from_dict(
                            self.manual_voiceover_dict_1
                        )
                    ),
                    feconf.VoiceoverType.AUTO.value: (
                        state_domain.Voiceover.from_dict(
                            self.autogenerated_voiceover_dict_2
                        )
                    ),
                }
            },
            automated_voiceovers_audio_offsets_msecs={},
        )

        entity_voiceover_model_1 = (
            voiceover_services.create_entity_voiceovers_model(
                self.entity_voiceovers_1
            )
        )
        entity_voiceover_model_1.put()

        entity_voiceover_model_2 = (
            voiceover_services.create_entity_voiceovers_model(
                self.entity_voiceovers_2
            )
        )
        entity_voiceover_model_2.put()

        language_codes_mapping: Dict[str, Dict[str, bool]] = {
            'en': {'en-US': True, 'en-IN': True},
            'hi': {'hi-IN': False},
        }
        voiceover_services.save_language_accent_support(
            language_codes_mapping=language_codes_mapping
        )

    def test_should_fetch_entity_voiceovers_by_language_code(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL, is_super_admin=True)

        handler_url = '/entity_voiceovers_bulk_handler/%s/%s/%s/%s' % (
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp_id',
            1,
            'en',
        )
        json_response = self.get_json(handler_url)

        self.assertEqual(len(json_response['entity_voiceovers_list']), 2)


class RegenerateAutomaticVoiceoverHandlerTests(test_utils.GenericTestBase):
    """Test to regenerate voiceover for the given exploration data."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        self.voiceover_admin_id = self.get_user_id_from_email(
            self.VOICEOVER_ADMIN_EMAIL
        )
        self.voiceover_admin = user_services.get_user_actions_info(
            self.voiceover_admin_id
        )

        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL
        )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        self.exploration = self.save_new_valid_exploration(
            'exp_id',
            self.owner_id,
            title='Exploration 1',
            category=constants.constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        rights_manager.publish_exploration(self.owner, self.exploration.id)
        rights_manager.assign_role_for_exploration(
            self.voiceover_admin,
            self.exploration.id,
            self.voice_artist_id,
            rights_domain.ROLE_VOICE_ARTIST,
        )
        exp_services.update_exploration(
            self.owner_id,
            self.exploration.id,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'Introduction',
                        'new_value': {
                            'content_id': 'content_0',
                            'html': '<p>This is the first card of the exploration.</p>',
                        },
                    }
                ),
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'End State',
                        'new_value': {
                            'content_id': 'content_3',
                            'html': '<p>This is the last card of the exploration.</p>',
                        },
                    }
                ),
            ],
            'Changes content.',
        )

    def test_should_be_able_to_regenerate_voiceovers(self) -> None:
        self.login(self.VOICE_ARTIST_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'language_accent_code': 'en-US',
            'state_name': 'Introduction',
            'content_id': 'content_0',
            'exploration_version': 2,
        }

        handler_url = '/regenerate_automatic_voiceover/%s' % self.exploration.id

        response_dict = self.put_json(
            handler_url, payload, csrf_token=csrf_token
        )

        expected_sentence_tokens_with_durations = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'a', 'audio_offset_msecs': 200.0},
            {'token': 'test', 'audio_offset_msecs': 300.0},
            {'token': 'text', 'audio_offset_msecs': 400.0},
        ]

        self.assertEqual(
            response_dict['sentence_tokens_with_durations'],
            expected_sentence_tokens_with_durations,
        )
        self.assertTrue(response_dict['filename'].startswith('content_0-en-US'))

        self.logout()


class RegenerateVoiceoverOnExpUpdateHandlerTests(test_utils.GenericTestBase):
    """Test to regenerate voiceover on exploration update."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        self.voiceover_admin_id = self.get_user_id_from_email(
            self.VOICEOVER_ADMIN_EMAIL
        )
        self.voiceover_admin = user_services.get_user_actions_info(
            self.voiceover_admin_id
        )

        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL
        )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        self.exploration = self.save_new_valid_exploration(
            'exp_id', self.owner_id, title='Exploration 1'
        )
        rights_manager.publish_exploration(self.owner, self.exploration.id)
        rights_manager.assign_role_for_exploration(
            self.voiceover_admin,
            self.exploration.id,
            self.voice_artist_id,
            rights_domain.ROLE_VOICE_ARTIST,
        )

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS]
    )
    def test_should_be_able_to_regenerate_voiceovers(self) -> None:
        self.login(self.VOICE_ARTIST_EMAIL)
        csrf_token = self.get_new_csrf_token()
        deferred_calls = []

        def mock_defer(
            function_id: str,
            queue_name: str,
            exploration_id: str,
            exploration_version: int,
        ) -> None:
            deferred_calls.append(
                {
                    'function_id': function_id,
                    'queue_name': queue_name,
                    'exploration_id': exploration_id,
                    'exploration_version': exploration_version,
                }
            )

        exploration_id = self.exploration.id
        exploration_version = self.exploration.version

        handler_url = '/regenerate_voiceover_on_exp_update/%s/%s' % (
            exploration_id,
            exploration_version,
        )

        with (
            self.swap(
                opportunity_services,
                'is_exploration_available_for_contribution',
                lambda _: True,
            ),
            self.swap(taskqueue_services, 'defer', mock_defer),
        ):
            self.post_json(handler_url, {}, csrf_token=csrf_token)

        self.assertEqual(len(deferred_calls), 1)
        args = deferred_calls[0]

        expected_func_name = (
            feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                'FUNCTION_ID_REGENERATE_VOICEOVERS_ON_EXP_UPDATE'
            ]
        )

        self.assertEqual(args['function_id'], expected_func_name)
        self.assertEqual(args['queue_name'], 'voiceover-regeneration')
        self.assertEqual(args['exploration_id'], exploration_id)
        self.assertEqual(args['exploration_version'], exploration_version)
        self.logout()


class AutomaticVoiceoverRegenerationRecordHandlerTests(
    test_utils.GenericTestBase
):
    """Test to validate automatic voiceover regeneration record handler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        self.voiceover_admin_id = self.get_user_id_from_email(
            self.VOICEOVER_ADMIN_EMAIL
        )

    def test_get_automatic_voiceover_regeneration_records(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL, is_super_admin=True)

        new_model_id = 'random_model_id'
        project_id = 'dev-project-id'
        location_id = 'us-central'
        task_id = uuid.uuid4().hex
        queue_name = 'voiceover-regeneration'

        task_name = 'projects/%s/locations/%s/queues/%s/tasks/%s' % (
            project_id,
            location_id,
            queue_name,
            task_id,
        )
        function_id = 'regenerate_voiceovers_on_exploration_update'

        taskqueue_services.create_new_cloud_task_model(
            new_model_id, task_name, function_id
        )

        cloud_task_run = taskqueue_services.get_cloud_task_run_by_model_id(
            new_model_id
        )
        assert cloud_task_run is not None
        start_date = cloud_task_run.created_on.replace(
            tzinfo=datetime.timezone.utc
        ).isoformat()
        end_date = (
            (cloud_task_run.created_on + datetime.timedelta(days=1))
            .replace(tzinfo=datetime.timezone.utc)
            .isoformat()
        )

        json_response = self.get_json(
            '/automatic_voiceover_regeneration_record',
            params={'start_date': start_date, 'end_date': end_date},
        )
        self.assertEqual(
            json_response['automatic_voiceover_regeneration_records'],
            [cloud_task_run.to_dict_with_timezone_info()],
        )
        self.logout()


class AutomaticVoiceoverRegenerationStatusHandlerTests(
    test_utils.GenericTestBase
):
    """Test to validate automatic voiceover regeneration status handler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

    def test_get_automatic_voiceover_regeneration_status(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL)
        task_run_id = 'task_run_id'
        exploration_id = 'exploration_id'
        language_accent_to_content_status_map = {
            'en-US': {'content_0': 'SUCCEEDED', 'content_1': 'SUCCEEDED'}
        }
        voiceover_regeneration_task_mapping = (
            cloud_task_domain.VoiceoverRegenerationJob(
                exploration_id,
                task_run_id,
                language_accent_to_content_status_map,
            )
        )

        voiceover_cloud_task_services.save_voiceover_regeneration_job(
            voiceover_regeneration_task_mapping
        )
        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id
        )
        exp_services.save_new_exploration(self.owner_id, exploration)
        rights_manager.publish_exploration(self.owner, exploration_id)

        json_response = self.get_json(
            '/exploration_voiceover_regeneration_status_url/%s' % exploration_id
        )
        self.assertEqual(
            json_response['language_accent_to_content_status_map'],
            {'en-US': {'content_0': 'SUCCEEDED', 'content_1': 'SUCCEEDED'}},
        )
        self.logout()


class AutomaticVoiceoverRegenerationIntegrationTests(
    test_utils.GenericTestBase
):
    """Test to validate automatic voiceover regeneration integration."""

    def setUp(self) -> None:
        super().setUp()
        self.AUTHOR_EMAIL = 'author@example.com'
        self.AUTHOR_EMAIL_2 = 'author2@example.com'
        self.REVIEWER_EMAIL = 'reviewer@example.com'

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.AUTHOR_EMAIL_2, 'author2')
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])

        self.voiceover_admin_id = self.get_user_id_from_email(
            self.VOICEOVER_ADMIN_EMAIL
        )
        self.voiceover_admin = user_services.get_user_actions_info(
            self.voiceover_admin_id
        )

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.author_id_2 = self.get_user_id_from_email(self.AUTHOR_EMAIL_2)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)

        self.exploration_id = 'W50hotX4h_Up'
        self.TOPIC_ID_1 = 'topic_id_1'
        self.STORY_ID_1 = 'story_id_1'

        # Creating an exploration and assigning roles.
        self._create_and_publish_exploration()
        rights_manager.assign_role_for_exploration(
            self.voiceover_admin,
            self.exploration.id,
            self.voiceover_admin_id,
            rights_domain.ROLE_VOICE_ARTIST,
        )
        rights_manager.assign_role_for_exploration(
            self.admin,
            self.exploration.id,
            self.author_id,
            rights_domain.ROLE_EDITOR,
        )

    def _create_and_publish_exploration(self) -> None:
        """Creates and publishes a new exploration."""
        self.exploration = self.save_new_valid_exploration(
            self.exploration_id,
            self.owner_id,
            title='title1',
            category=constants.constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        rights_manager.publish_exploration(self.owner, self.exploration.id)
        exp_services.update_exploration(
            self.owner_id,
            self.exploration_id,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'Introduction',
                        'new_value': {
                            'content_id': 'content_0',
                            'html': '<p>This is the first card of the exploration.</p>',
                        },
                    }
                ),
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'End State',
                        'new_value': {
                            'content_id': 'content_3',
                            'html': '<p>This is the last card of the exploration.</p>',
                        },
                    }
                ),
            ],
            'Changes content.',
        )

    def _add_exploration_to_published_topic(self) -> None:
        """Adds the exploration to a published topic i.e., making it curated."""
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_1, 'topic1', 'abbrev', 'description', 'fragm'
        )
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1,
                'Title',
                ['skill_id_1'],
                'image.svg',
                constants.constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'dummy-subtopic-url',
            )
        ]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']

        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        story = story_domain.Story.create_default_story(
            self.STORY_ID_1,
            'A story',
            'Description',
            self.TOPIC_ID_1,
            'story-two',
        )
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1
        )

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id
        )

        story_services.update_story(
            self.owner_id,
            self.STORY_ID_1,
            [
                story_domain.StoryChange(
                    {
                        'cmd': 'add_story_node',
                        'node_id': 'node_1',
                        'title': 'Node1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': 'update_story_node_property',
                        'property_name': 'exploration_id',
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': self.exploration_id,
                    }
                ),
            ],
            'Changes.',
        )

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS,
            feature_flag_list.FeatureNames.AUTOMATIC_VOICEOVER_REGENERATION_FROM_EXP,
        ]
    )
    def test_regenerate_voiceovers_on_exploration_added_to_topic(self) -> None:
        entity_voiceovers = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 2
            )
        )

        # At the outset, there are no entity voiceovers for the newly created
        # exploration.
        self.assertEqual(len(entity_voiceovers), 0)

        # Adding the exploration to a published topic.
        self._add_exploration_to_published_topic()

        # Adding the exploration to a published topic triggers voiceover
        # regeneration through the Cloud Task service, confirming that a
        # deferred request exists in the model.
        cloud_task_runs = taskqueue_services.get_all_cloud_task_runs()
        function_id = cloud_task_runs[0].function_id
        task_run_id = cloud_task_runs[0].task_run_id

        # Verifying that a Cloud Task run is created to regenerate the
        # voiceovers.
        self.assertEqual(len(cloud_task_runs), 1)
        self.assertEqual(
            function_id,
            feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                'FUNCTION_ID_REGENERATE_VOICEOVERS_ON_EXP_CURATION'
            ],
        )

        # Adding language accent support for Oppia's voiceovers.
        language_codes_mapping: Dict[str, Dict[str, bool]] = {
            'en': {'en-US': True},
            'hi': {'hi-IN': False},
        }
        voiceover_services.save_language_accent_support(
            language_codes_mapping=language_codes_mapping
        )

        # Explicitly invoking the function here to simulate its usual execution
        # via a deferred job.
        voiceover_services.regenerate_voiceovers_on_exploration_added_to_topic(
            self.exploration_id,
            task_run_id,
        )

        updated_cloud_task_runs = taskqueue_services.get_all_cloud_task_runs()

        for cloud_run in updated_cloud_task_runs:
            if (
                cloud_run.function_id
                == 'regenerate_voiceovers_for_batch_contents'
            ):
                child_task_run_id = cloud_run.task_run_id

        voiceover_services.regenerate_voiceovers_for_batch_contents(
            self.exploration_id, task_run_id, child_task_run_id
        )

        entity_voiceovers = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 2
            )
        )

        # Verifying that a single entity voiceovers model is created in the
        # en-US accent.
        self.assertEqual(len(entity_voiceovers), 1)
        self.assertEqual(entity_voiceovers[0].entity_id, self.exploration_id)
        self.assertEqual(entity_voiceovers[0].language_accent_code, 'en-US')

        self.assertListEqual(
            ['content_0', 'default_outcome_1', 'ca_placeholder_2', 'content_3'],
            list(entity_voiceovers[0].voiceovers_mapping.keys()),
        )

        # The audio offset here is a dummy value generated in the local
        # environment.
        dummy_audio_offset = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'a', 'audio_offset_msecs': 200.0},
            {'token': 'test', 'audio_offset_msecs': 300.0},
            {'token': 'text', 'audio_offset_msecs': 400.0},
        ]
        automated_voiceovers_audio_offsets_msecs = {
            'content_0': dummy_audio_offset,
            'default_outcome_1': dummy_audio_offset,
            'ca_placeholder_2': dummy_audio_offset,
            'content_3': dummy_audio_offset,
        }

        self.assertDictEqual(
            entity_voiceovers[0].automated_voiceovers_audio_offsets_msecs,
            automated_voiceovers_audio_offsets_msecs,
        )

        automatic_voiceover_1 = entity_voiceovers[0].voiceovers_mapping[
            'content_0'
        ]['auto']
        manual_voiceover_1 = entity_voiceovers[0].voiceovers_mapping[
            'content_0'
        ]['manual']
        automatic_voiceover_2 = entity_voiceovers[0].voiceovers_mapping[
            'content_3'
        ]['auto']
        manual_voiceover_2 = entity_voiceovers[0].voiceovers_mapping[
            'content_3'
        ]['manual']

        self.assertIsNotNone(automatic_voiceover_1)
        self.assertIsNone(manual_voiceover_1)
        self.assertIsNotNone(automatic_voiceover_2)
        self.assertIsNone(manual_voiceover_2)

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS,
            feature_flag_list.FeatureNames.AUTOMATIC_VOICEOVER_REGENERATION_FROM_EXP,
        ]
    )
    def test_regenerate_voiceovers_on_exploration_update(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)

        entity_voiceovers = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 2
            )
        )

        # At the outset, there are no entity voiceovers for the newly created
        # exploration.
        self.assertEqual(len(entity_voiceovers), 0)

        # Adding the exploration to a published topic.
        self._add_exploration_to_published_topic()

        # Adding the exploration to a published topic triggers voiceover
        # regeneration through the Cloud Task service, confirming that a
        # deferred request exists in the model.
        cloud_task_runs = taskqueue_services.get_all_cloud_task_runs()
        function_id = cloud_task_runs[0].function_id
        task_run_id = cloud_task_runs[0].task_run_id

        # Verifying that a Cloud Task run is created to regenerate the
        # voiceovers.
        self.assertEqual(len(cloud_task_runs), 1)
        self.assertEqual(
            function_id,
            feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                'FUNCTION_ID_REGENERATE_VOICEOVERS_ON_EXP_CURATION'
            ],
        )

        # Adding language accent support for Oppia's voiceovers.
        language_codes_mapping: Dict[str, Dict[str, bool]] = {
            'en': {'en-US': True},
            'hi': {'hi-IN': False},
        }
        voiceover_services.save_language_accent_support(
            language_codes_mapping=language_codes_mapping
        )

        # Explicitly invoking the function here to simulate its usual execution
        # via a deferred job.
        voiceover_services.regenerate_voiceovers_on_exploration_added_to_topic(
            self.exploration_id,
            task_run_id,
        )

        updated_cloud_task_runs = taskqueue_services.get_all_cloud_task_runs()

        for cloud_run in updated_cloud_task_runs:
            if (
                cloud_run.function_id
                == 'regenerate_voiceovers_for_batch_contents'
            ):
                child_task_run_id = cloud_run.task_run_id

        voiceover_services.regenerate_voiceovers_for_batch_contents(
            self.exploration_id, task_run_id, child_task_run_id
        )

        entity_voiceovers = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 2
            )
        )

        # Verifying that a single entity voiceovers model is created in the
        # en-US accent.
        self.assertEqual(len(entity_voiceovers), 1)
        self.assertEqual(entity_voiceovers[0].entity_id, self.exploration_id)
        self.assertEqual(entity_voiceovers[0].language_accent_code, 'en-US')
        self.assertEqual(entity_voiceovers[0].entity_version, 2)

        # Updating the exploration to version 3 by modifying a content.
        exp_services.update_exploration(
            self.owner_id,
            self.exploration_id,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'Introduction',
                        'new_value': {
                            'content_id': 'content_0',
                            'html': '<p>This is the updated first card of the exploration.</p>',
                        },
                    }
                )
            ],
            'Updated content of the first card.',
        )

        updated_exp = exp_fetchers.get_exploration_by_id(self.exploration_id)
        self.assertEqual(updated_exp.version, 3)

        # Simulating the frontend request that triggers voiceover regeneration
        # after an exploration update via a deferred job.
        handler_url = '/regenerate_voiceover_on_exp_update/%s/%s' % (
            self.exploration_id,
            updated_exp.version,
        )
        csrf_token = self.get_new_csrf_token()
        self.post_json(handler_url, {}, csrf_token=csrf_token)

        cloud_task_runs = sorted(
            taskqueue_services.get_all_cloud_task_runs(),
            key=lambda task_run: task_run.created_on,
        )

        # Updating a curated exploration triggers voiceover regeneration via
        # the Cloud Task service, confirming that a deferred request exists in
        # the model.
        cloud_task_run = cloud_task_runs[2]
        function_id = cloud_task_run.function_id
        task_run_id = cloud_task_run.task_run_id
        self.assertEqual(
            function_id,
            feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                'FUNCTION_ID_REGENERATE_VOICEOVERS_ON_EXP_UPDATE'
            ],
        )

        # Explicitly calling the function here to simulate its usual invocation
        # via a deferred job.
        voiceover_services.regenerate_voiceovers_on_exploration_update(
            self.exploration_id,
            updated_exp.version,
            task_run_id,
        )

        entity_voiceovers = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 3
            )
        )

        # Verifying that a single entity voiceovers model is created in the
        # en-US accent.
        self.assertEqual(len(entity_voiceovers), 1)
        self.assertEqual(entity_voiceovers[0].entity_id, self.exploration_id)
        self.assertEqual(entity_voiceovers[0].language_accent_code, 'en-US')
        self.assertEqual(entity_voiceovers[0].entity_version, 3)

        # The audio offset here is dummy which is generated in local environment.
        dummy_audio_offset = [
            {'token': 'This', 'audio_offset_msecs': 0.0},
            {'token': 'is', 'audio_offset_msecs': 100.0},
            {'token': 'a', 'audio_offset_msecs': 200.0},
            {'token': 'test', 'audio_offset_msecs': 300.0},
            {'token': 'text', 'audio_offset_msecs': 400.0},
        ]
        automated_voiceovers_audio_offsets_msecs = {
            'content_0': dummy_audio_offset,
            'content_3': dummy_audio_offset,
            'default_outcome_1': dummy_audio_offset,
            'ca_placeholder_2': dummy_audio_offset,
        }
        self.assertDictEqual(
            entity_voiceovers[0].automated_voiceovers_audio_offsets_msecs,
            automated_voiceovers_audio_offsets_msecs,
        )

        self.assertListEqual(
            ['content_0', 'default_outcome_1', 'ca_placeholder_2', 'content_3'],
            list(entity_voiceovers[0].voiceovers_mapping.keys()),
        )

        automatic_voiceover_1 = entity_voiceovers[0].voiceovers_mapping[
            'content_0'
        ]['auto']
        manual_voiceover_1 = entity_voiceovers[0].voiceovers_mapping[
            'content_0'
        ]['manual']
        automatic_voiceover_2 = entity_voiceovers[0].voiceovers_mapping[
            'content_3'
        ]['auto']
        manual_voiceover_2 = entity_voiceovers[0].voiceovers_mapping[
            'content_3'
        ]['manual']

        self.assertIsNotNone(automatic_voiceover_1)
        self.assertIsNone(manual_voiceover_1)
        self.assertIsNotNone(automatic_voiceover_2)
        self.assertIsNone(manual_voiceover_2)

        self.logout()

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS,
            feature_flag_list.FeatureNames.AUTOMATIC_VOICEOVER_REGENERATION_FROM_EXP,
        ]
    )
    def test_regenerate_voiceovers_on_translation_addition(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)

        entity_voiceovers = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 2
            )
        )

        # At the outset, there are no entity voiceovers for the newly created
        # exploration.
        self.assertEqual(len(entity_voiceovers), 0)

        # Adding the exploration to a published topic.
        self._add_exploration_to_published_topic()

        # Adding the exploration to a published topic triggers voiceover
        # regeneration through the Cloud Task service, confirming that a
        # deferred request exists in the model.
        cloud_task_runs = taskqueue_services.get_all_cloud_task_runs()
        function_id = cloud_task_runs[0].function_id
        task_run_id = cloud_task_runs[0].task_run_id

        # Verifying that a Cloud Task run is created to regenerate the
        # voiceovers.
        self.assertEqual(len(cloud_task_runs), 1)
        self.assertEqual(
            function_id,
            feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                'FUNCTION_ID_REGENERATE_VOICEOVERS_ON_EXP_CURATION'
            ],
        )

        # Adding language accent support for Oppia's voiceovers.
        language_codes_mapping: Dict[str, Dict[str, bool]] = {
            'en': {'en-US': True},
            'hi': {'hi-IN': True},
        }
        voiceover_services.save_language_accent_support(
            language_codes_mapping=language_codes_mapping
        )

        # Explicitly invoking the function here to simulate its usual execution
        # via a deferred job.
        voiceover_services.regenerate_voiceovers_on_exploration_added_to_topic(
            self.exploration_id,
            task_run_id,
        )

        updated_cloud_task_runs = taskqueue_services.get_all_cloud_task_runs()
        child_task_run_ids = []
        for cloud_run in updated_cloud_task_runs:
            if (
                cloud_run.function_id
                == 'regenerate_voiceovers_for_batch_contents'
            ):
                child_task_run_ids.append(cloud_run.task_run_id)

        for child_task_run_id in child_task_run_ids:
            voiceover_services.regenerate_voiceovers_for_batch_contents(
                self.exploration_id, task_run_id, child_task_run_id
            )

        entity_voiceovers = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 2
            )
        )

        # Verifying that a single entity voiceovers model is created in the
        # en-US accent.
        self.assertEqual(len(entity_voiceovers), 1)
        self.assertEqual(entity_voiceovers[0].entity_id, self.exploration_id)
        self.assertEqual(entity_voiceovers[0].language_accent_code, 'en-US')
        self.assertEqual(entity_voiceovers[0].entity_version, 2)

        # Updating the exploration to version 3 by translating content.
        exp_services.update_exploration(
            self.owner_id,
            self.exploration_id,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_TRANSLATION,
                        'content_id': 'content_0',
                        'language_code': 'hi',
                        'translation': translation_domain.TranslatedContent(
                            'यह पहला कार्ड है',
                            translation_domain.TranslatableContentFormat.HTML,
                            False,
                        ).to_dict(),
                    }
                )
            ],
            'Added translations',
            False,
        )

        updated_exp = exp_fetchers.get_exploration_by_id(self.exploration_id)
        self.assertEqual(updated_exp.version, 3)

        # An entity translation is created after the exploration is updated.
        entity_translation = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION,
                self.exploration_id,
                3,
            )
        )[0].to_dict()

        self.assertEqual(entity_translation['language_code'], 'hi')
        self.assertEqual(entity_translation['entity_version'], 3)
        self.assertEqual(entity_translation['entity_id'], self.exploration_id)
        self.assertEqual(
            entity_translation['translations']['content_0']['content_value'],
            'यह पहला कार्ड है',
        )

        # Simulating the frontend request that triggers voiceover regeneration
        # after an exploration update via a deferred job.
        handler_url = '/regenerate_voiceover_on_exp_update/%s/%s' % (
            self.exploration_id,
            updated_exp.version,
        )
        csrf_token = self.get_new_csrf_token()
        self.post_json(handler_url, {}, csrf_token=csrf_token)

        cloud_task_runs = sorted(
            taskqueue_services.get_all_cloud_task_runs(),
            key=lambda task_run: task_run.created_on,
        )

        # Updating a curated exploration triggers voiceover regeneration via
        # the Cloud Task service, confirming that a deferred request exists in
        # the model.
        cloud_task_run = cloud_task_runs[2]
        function_id = cloud_task_run.function_id
        task_run_id = cloud_task_run.task_run_id
        self.assertEqual(
            function_id,
            feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                'FUNCTION_ID_REGENERATE_VOICEOVERS_ON_EXP_UPDATE'
            ],
        )

        # Explicitly calling the function here to simulate its usual invocation
        # via a deferred job.
        voiceover_services.regenerate_voiceovers_on_exploration_update(
            self.exploration_id,
            updated_exp.version,
            task_run_id,
        )

        updated_cloud_task_runs = sorted(
            taskqueue_services.get_all_cloud_task_runs(),
            key=lambda task_run: task_run.created_on,
        )
        second_iter_child_task_run_ids = []
        for cloud_run in updated_cloud_task_runs:
            if (
                cloud_run.function_id
                == 'regenerate_voiceovers_for_batch_contents'
                and cloud_run.task_run_id not in child_task_run_ids
            ):
                second_iter_child_task_run_ids.append(cloud_run.task_run_id)

            if (
                cloud_run.function_id
                == 'regenerate_voiceovers_on_exploration_update'
            ):
                second_iter_parent_task_run_id = cloud_run.task_run_id

        for child_task_run_id in second_iter_child_task_run_ids:
            voiceover_services.regenerate_voiceovers_for_batch_contents(
                self.exploration_id,
                second_iter_parent_task_run_id,
                child_task_run_id,
            )

        entity_voiceovers = sorted(
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 3
            ),
            key=lambda ev: ev.language_accent_code,
        )

        # Verifying that two entity voiceovers models are created for the en-US
        # and hi-IN accents.
        self.assertEqual(len(entity_voiceovers), 2)

        english_entity_voiceover = entity_voiceovers[0]
        hindi_entity_voiceover = entity_voiceovers[1]

        self.assertEqual(english_entity_voiceover.entity_version, 3)
        self.assertEqual(hindi_entity_voiceover.entity_version, 3)

        self.assertEqual(english_entity_voiceover.language_accent_code, 'en-US')
        self.assertEqual(hindi_entity_voiceover.language_accent_code, 'hi-IN')

        self.assertListEqual(
            ['content_0', 'default_outcome_1', 'ca_placeholder_2', 'content_3'],
            list(english_entity_voiceover.voiceovers_mapping.keys()),
        )
        # Hindi translation was added only for the first content.
        self.assertListEqual(
            ['content_0'],
            list(hindi_entity_voiceover.voiceovers_mapping.keys()),
        )

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS,
            feature_flag_list.FeatureNames.AUTOMATIC_VOICEOVER_REGENERATION_FROM_EXP,
        ]
    )
    def test_regenerate_voiceovers_on_translation_suggestion_acceptance(
        self,
    ) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)

        entity_voiceovers_list = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 2
            )
        )

        # At the outset, there are no entity voiceovers for the newly created
        # exploration.
        self.assertEqual(len(entity_voiceovers_list), 0)

        # Adding the exploration to a published topic.
        self._add_exploration_to_published_topic()

        # Adding language accent support for Oppia's voiceovers.
        language_codes_mapping: Dict[str, Dict[str, bool]] = {
            'en': {'en-US': True},
            'hi': {'hi-IN': True},
        }
        voiceover_services.save_language_accent_support(
            language_codes_mapping=language_codes_mapping
        )

        csrf_token_1 = self.get_new_csrf_token()
        updated_exp = exp_fetchers.get_exploration_by_id(self.exploration_id)

        # Simulating the submission of a translation suggestion from the
        # frontend.
        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX,
            {
                'suggestion_type': (feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': self.exploration_id,
                'target_version_at_submission': updated_exp.version,
                'change_cmd': {
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'Introduction',
                    'content_id': 'content_0',
                    'language_code': 'hi',
                    'content_html': '<p>This is the first card of the exploration.</p>',
                    'translation_html': '<p>यह पहला कार्ड है</p>',
                    'data_format': 'html',
                },
                'description': 'test',
                'files': {},
            },
            csrf_token=csrf_token_1,
        )

        suggestion_to_accept = self.get_json(
            '%s?author_id=%s'
            % (feconf.SUGGESTION_LIST_URL_PREFIX, self.voiceover_admin_id)
        )['suggestions'][0]

        self.logout()

        self.login(self.AUTHOR_EMAIL)
        csrf_token_2 = self.get_new_csrf_token()

        # Accepting the translation suggestion triggers voiceover regeneration.
        self.put_json(
            '%s/exploration/%s/%s'
            % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion_to_accept['target_id'],
                suggestion_to_accept['suggestion_id'],
            ),
            {
                'action': 'accept',
                'commit_message': 'commit message',
                'review_message': 'Accepted',
            },
            csrf_token=csrf_token_2,
        )
        cloud_task_runs = taskqueue_services.get_all_cloud_task_runs()

        voiceover_services.regenerate_voiceovers_after_accepting_suggestion(
            suggestion_to_accept['suggestion_id'],
            cloud_task_runs[1].task_run_id,
        )

        updated_cloud_task_runs = sorted(
            taskqueue_services.get_all_cloud_task_runs(),
            key=lambda task_run: task_run.created_on,
        )
        child_task_run_ids = []
        for cloud_run in updated_cloud_task_runs:
            if (
                cloud_run.function_id
                == 'regenerate_voiceovers_for_batch_contents'
            ):
                child_task_run_ids.append(cloud_run.task_run_id)
        for child_task_run_id in child_task_run_ids:
            voiceover_services.regenerate_voiceovers_for_batch_contents(
                self.exploration_id,
                cloud_task_runs[1].task_run_id,
                child_task_run_id,
            )

        self.logout()

        entity_voiceovers = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 2
            )[0]
        )

        self.assertEqual(entity_voiceovers.language_accent_code, 'hi-IN')
        self.assertEqual(entity_voiceovers.entity_version, 2)
        self.assertListEqual(
            ['content_0'], list(entity_voiceovers.voiceovers_mapping.keys())
        )

    @test_utils.enable_feature_flags(
        [
            feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS,
            feature_flag_list.FeatureNames.AUTOMATIC_VOICEOVER_REGENERATION_FROM_EXP,
        ]
    )
    def test_should_not_regenerate_voiceovers_on_translation_suggestion_rejection(
        self,
    ) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)

        entity_voiceovers = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 2
            )
        )

        # At the outset, there are no entity voiceovers for the newly created
        # exploration.
        self.assertEqual(len(entity_voiceovers), 0)

        # Adding the exploration to a published topic.
        self._add_exploration_to_published_topic()

        # Adding language accent support for Oppia's voiceovers.
        language_codes_mapping: Dict[str, Dict[str, bool]] = {
            'en': {'en-US': True},
            'hi': {'hi-IN': True},
        }
        voiceover_services.save_language_accent_support(
            language_codes_mapping=language_codes_mapping
        )

        csrf_token_1 = self.get_new_csrf_token()
        updated_exp = exp_fetchers.get_exploration_by_id(self.exploration_id)

        # Simulating the submission of a translation suggestion from the
        # frontend.
        self.post_json(
            '%s/' % feconf.SUGGESTION_URL_PREFIX,
            {
                'suggestion_type': (feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT),
                'target_type': feconf.ENTITY_TYPE_EXPLORATION,
                'target_id': self.exploration_id,
                'target_version_at_submission': updated_exp.version,
                'change_cmd': {
                    'cmd': exp_domain.CMD_ADD_WRITTEN_TRANSLATION,
                    'state_name': 'Introduction',
                    'content_id': 'content_0',
                    'language_code': 'hi',
                    'content_html': '<p>This is the first card of the exploration.</p>',
                    'translation_html': '<p>यह पहला कार्ड है</p>',
                    'data_format': 'html',
                },
                'description': 'test',
                'files': {},
            },
            csrf_token=csrf_token_1,
        )

        suggestion_to_reject = self.get_json(
            '%s?author_id=%s'
            % (feconf.SUGGESTION_LIST_URL_PREFIX, self.voiceover_admin_id)
        )['suggestions'][0]

        self.logout()

        self.login(self.AUTHOR_EMAIL)
        csrf_token_2 = self.get_new_csrf_token()

        # Rejecting the translation suggestion does not trigger voiceover
        # regeneration.
        self.put_json(
            '%s/exploration/%s/%s'
            % (
                feconf.SUGGESTION_ACTION_URL_PREFIX,
                suggestion_to_reject['target_id'],
                suggestion_to_reject['suggestion_id'],
            ),
            {
                'action': 'reject',
                'commit_message': 'commit message',
                'review_message': 'Rejected',
            },
            csrf_token=csrf_token_2,
        )

        self.logout()

        entity_voiceovers = (
            voiceover_services.get_entity_voiceovers_for_given_exploration(
                self.exploration_id, 'exploration', 2
            )
        )
        self.assertEqual(len(entity_voiceovers), 0)


class ExplorationDataForVoiceoverRegenerationHandlerTests(
    test_utils.GenericTestBase
):
    """Test to validate exploration data for voiceover regeneration handler."""

    def setUp(self) -> None:
        super().setUp()
        self.AUTHOR_EMAIL = 'author@example.com'
        self.AUTHOR_EMAIL_2 = 'author2@example.com'
        self.REVIEWER_EMAIL = 'reviewer@example.com'

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.signup(self.AUTHOR_EMAIL_2, 'author2')
        self.signup(self.REVIEWER_EMAIL, 'reviewer')
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])

        self.voiceover_admin_id = self.get_user_id_from_email(
            self.VOICEOVER_ADMIN_EMAIL
        )
        self.voiceover_admin = user_services.get_user_actions_info(
            self.voiceover_admin_id
        )

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)
        self.author_id_2 = self.get_user_id_from_email(self.AUTHOR_EMAIL_2)
        self.reviewer_id = self.get_user_id_from_email(self.REVIEWER_EMAIL)

        self.curated_exp_id = 'W50hotX4h_Up'
        curated_exp_title = 'Curated Exploration'

        self._create_and_publish_exploration(
            self.curated_exp_id, curated_exp_title
        )

        self.non_curated_exp_id = 'W50hotX4h_00'
        non_curated_exp_title = 'Non-Curated Exploration'

        self.TOPIC_ID_1 = 'topic_id_1'
        self.STORY_ID_1 = 'story_id_1'

        # Creating an exploration and assigning roles.
        self._create_and_publish_exploration(
            self.non_curated_exp_id, non_curated_exp_title
        )
        rights_manager.assign_role_for_exploration(
            self.voiceover_admin,
            self.curated_exp_id,
            self.voiceover_admin_id,
            rights_domain.ROLE_VOICE_ARTIST,
        )
        rights_manager.assign_role_for_exploration(
            self.admin,
            self.curated_exp_id,
            self.author_id,
            rights_domain.ROLE_EDITOR,
        )
        self._add_exploration_to_published_topic()

    def _create_and_publish_exploration(
        self, exploration_id: str, title: str
    ) -> None:
        """Creates and publishes a new exploration."""
        self.exploration = self.save_new_valid_exploration(
            exploration_id,
            self.owner_id,
            title=title,
            category=constants.constants.ALL_CATEGORIES[0],
            end_state_name='End State',
        )
        rights_manager.publish_exploration(self.owner, self.exploration.id)
        exp_services.update_exploration(
            self.owner_id,
            exploration_id,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'Introduction',
                        'new_value': {
                            'content_id': 'content_0',
                            'html': '<p>This is the first card of the exploration.</p>',
                        },
                    }
                ),
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'End State',
                        'new_value': {
                            'content_id': 'content_3',
                            'html': '<p>This is the last card of the exploration.</p>',
                        },
                    }
                ),
            ],
            'Changes content.',
        )

    def _add_exploration_to_published_topic(self) -> None:
        """Adds the exploration to a published topic i.e., making it curated."""
        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_1, 'topic1', 'abbrev', 'description', 'fragm'
        )
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1,
                'Title',
                ['skill_id_1'],
                'image.svg',
                constants.constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                21131,
                'dummy-subtopic-url',
            )
        ]
        topic.next_subtopic_id = 2
        topic.skill_ids_for_diagnostic_test = ['skill_id_1']

        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        story = story_domain.Story.create_default_story(
            self.STORY_ID_1,
            'A story',
            'Description',
            self.TOPIC_ID_1,
            'story-two',
        )
        story_services.save_new_story(self.owner_id, story)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1
        )

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id
        )

        story_services.update_story(
            self.owner_id,
            self.STORY_ID_1,
            [
                story_domain.StoryChange(
                    {
                        'cmd': 'add_story_node',
                        'node_id': 'node_1',
                        'title': 'Node1',
                    }
                ),
                story_domain.StoryChange(
                    {
                        'cmd': 'update_story_node_property',
                        'property_name': 'exploration_id',
                        'node_id': 'node_1',
                        'old_value': None,
                        'new_value': self.curated_exp_id,
                    }
                ),
            ],
            'Changes.',
        )

    def test_invalid_exp_id_should_return_correct_error_response(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        json_response = self.get_json(
            '/exploration_voiceovers_data/%s' % 'invalid_exp_id',
        )

        self.assertIsNone(json_response['exploration_data'])
        self.assertEqual(
            json_response['response_message'],
            'Exploration with the given id does not exist.',
        )
        self.logout()

    def test_non_curated_exp_should_return_correct_error_response(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        json_response = self.get_json(
            '/exploration_voiceovers_data/%s' % self.non_curated_exp_id,
        )

        self.assertIsNone(json_response['exploration_data'])
        self.assertEqual(
            json_response['response_message'],
            'The Exploration is not linked to any published story, hence not available for voiceover regeneration.',
        )
        self.logout()

    def test_curated_exp_should_return_exploration_data(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL)

        exp_services.update_exploration(
            self.owner_id,
            self.curated_exp_id,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_TRANSLATION,
                        'content_id': 'content_0',
                        'language_code': 'hi',
                        'translation': translation_domain.TranslatedContent(
                            'यह पहला कार्ड है',
                            translation_domain.TranslatableContentFormat.HTML,
                            False,
                        ).to_dict(),
                    }
                )
            ],
            'Added translations',
            False,
        )

        # Adding language accent support for Oppia's voiceovers.
        language_codes_mapping: Dict[str, Dict[str, bool]] = {
            'en': {'en-US': True, 'en-IN': False},
            'hi': {'hi-IN': True},
        }
        voiceover_services.save_language_accent_support(
            language_codes_mapping=language_codes_mapping
        )
        json_response = self.get_json(
            '/exploration_voiceovers_data/%s' % self.curated_exp_id,
        )

        self.assertEqual(
            json_response['exploration_data'],
            {
                'exploration_title': 'Curated Exploration',
                'autogeneratable_language_accent_codes': ['en-US', 'hi-IN'],
            },
        )
        self.assertIsNone(json_response['response_message'])
        self.logout()


class RegenerateVoiceoversForExplorationHandlerTests(
    test_utils.GenericTestBase
):
    def mock_defer(
        self,
        _function_id: str,
        _queue_name: str,
        _exploration_id: str,
        _language_accent_code: str,
    ) -> None:
        pass

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.ENABLE_BACKGROUND_VOICEOVER_SYNTHESIS]
    )
    def test_regenerate_voiceovers_for_exploration(self) -> None:
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        csrf_token = self.get_new_csrf_token()
        exploration_id = 'exploration_id'
        language_accent_code = 'en-US'
        handler_url = '/regenerate_voiceovers_for_exploration/%s/%s' % (
            exploration_id,
            language_accent_code,
        )

        with (
            self.swap(
                opportunity_services,
                'is_exploration_available_for_contribution',
                lambda _: True,
            ),
            self.swap(taskqueue_services, 'defer', self.mock_defer),
        ):
            self.post_json(handler_url, {}, csrf_token=csrf_token)
