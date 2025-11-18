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

from core import feature_flag_list, feconf
from core.domain import (
    opportunity_services,
    rights_domain,
    rights_manager,
    state_domain,
    taskqueue_services,
    user_services,
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
            'exp_id', self.owner_id, title='Exploration 1'
        )
        rights_manager.publish_exploration(self.owner, self.exploration.id)
        rights_manager.assign_role_for_exploration(
            self.voiceover_admin,
            self.exploration.id,
            self.voice_artist_id,
            rights_domain.ROLE_VOICE_ARTIST,
        )

    def test_should_be_able_to_regenerate_voiceovers(self) -> None:
        self.login(self.VOICE_ARTIST_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'language_accent_code': 'en-US',
            'state_name': 'Introduction',
            'content_id': 'content_0',
            'exploration_version': 1,
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
            exploration_title: str,
            exploration_version: int,
            committer_id: str,
            datetime_str: str,
        ) -> None:
            deferred_calls.append(
                {
                    'function_id': function_id,
                    'queue_name': queue_name,
                    'exploration_id': exploration_id,
                    'exploration_title': exploration_title,
                    'exploration_version': exploration_version,
                    'committer_id': committer_id,
                    'datetime_str': datetime_str,
                }
            )

        exploration_id = self.exploration.id
        exploration_version = self.exploration.version
        exploration_title = self.exploration.title

        handler_url = '/regenerate_voiceover_on_exp_update/%s/%s/%s' % (
            exploration_id,
            exploration_version,
            exploration_title,
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
        self.assertEqual(args['exploration_title'], exploration_title)
        self.assertEqual(args['exploration_version'], exploration_version)
        self.assertEqual(args['committer_id'], feconf.SYSTEM_COMMITTER_ID)
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
        function_id = 'delete_exps_from_user_models'

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
            [cloud_task_run.to_dict()],
        )
        self.logout()
