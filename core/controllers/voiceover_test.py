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

from core import feconf
from core.domain import state_domain
from core.domain import user_services
from core.domain import voiceover_domain
from core.domain import voiceover_services
from core.tests import test_utils

from typing import Dict


class VoiceoverAdminPageHandlerTests(test_utils.GenericTestBase):
    """Checks the voiceover admin page functionality."""

    def test_get_voiceover_admin_data(self) -> None:
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        self.login(self.VOICEOVER_ADMIN_EMAIL, is_super_admin=True)

        language_accent_master_list: Dict[str, Dict[str, str]] = (
            voiceover_services.get_language_accent_master_list())

        language_codes_mapping: Dict[str, Dict[str, bool]] = (
            voiceover_services.get_all_language_accent_codes_for_voiceovers())

        json_response = self.get_json(feconf.VOICEOVER_ADMIN_DATA_HANDLER_URL)

        self.assertDictEqual(
            json_response['language_accent_master_list'],
            language_accent_master_list)
        self.assertDictEqual(
            json_response['language_codes_mapping'],
            language_codes_mapping)

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
            voiceover_services.get_all_language_accent_codes_for_voiceovers())
        self.assertDictEqual(
            initial_language_codes_mapping, {})
        expected_language_codes_mapping = {
            'en': {
                'en-US': True
            },
            'hi': {
                'hi-IN': False
            }
        }
        payload = {
            'language_codes_mapping': expected_language_codes_mapping
        }

        self.put_json(
            feconf.VOICEOVER_LANGUAGE_CODES_MAPPING_HANDLER_URL,
            payload, csrf_token=csrf_token)

        language_codes_mapping: Dict[str, Dict[str, bool]] = (
            voiceover_services.get_all_language_accent_codes_for_voiceovers())
        self.assertDictEqual(
            language_codes_mapping, expected_language_codes_mapping)

        self.logout()

    def test_invalid_language_accent_codes_mapping_raise_error(self) -> None:
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        self.login(self.VOICEOVER_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        invalid_language_codes_mapping = {
            'en': 'en-US'
        }
        payload = {
            'language_codes_mapping': invalid_language_codes_mapping
        }

        response_dict = self.put_json(
            feconf.VOICEOVER_LANGUAGE_CODES_MAPPING_HANDLER_URL,
            payload, csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(
            response_dict['error'],
            'At \'http://localhost/voiceover_language_codes_mapping\' '
            'these errors are happening:\n'
            'Schema validation for \'language_codes_mapping\' failed: '
            'Expected dict, received en-US')

        self.logout()


class VoiceArtistMetadataHandlerTests(test_utils.GenericTestBase):
    """The class validates functionality related to voice artist metadata model.
    """

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)
        self.set_voiceover_admin([self.VOICEOVER_ADMIN_USERNAME])
        auth_id = 'someUser'
        self.voice_artist_username = 'username'
        user_settings = user_services.create_new_user(
            auth_id, 'user@example.com')
        self.voice_artist_id = user_settings.user_id
        user_services.set_username(
            self.voice_artist_id, self.voice_artist_username)

        self.voiceover1: state_domain.VoiceoverDict = {
            'filename': 'filename1.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 6.1
        }
        self.voiceover2: state_domain.VoiceoverDict = {
            'filename': 'filename2.mp3',
            'file_size_bytes': 3500,
            'needs_update': False,
            'duration_secs': 5.9
        }
        self.voiceover3: state_domain.VoiceoverDict = {
            'filename': 'filename3.mp3',
            'file_size_bytes': 3500,
            'needs_update': False,
            'duration_secs': 5.0
        }

        self.language_code_to_accent: Dict[str, str] = {
            'en': 'en-US',
            'hi': 'hi-IN'
        }

        self.content_id_to_voiceovers_mapping: (
            voiceover_domain.ContentIdToVoiceoverMappingType) = {
                'content_1': {
                    'en': (self.voice_artist_id, self.voiceover1)
                },
                'content_2': {
                    'hi': (self.voice_artist_id, self.voiceover2)
                },
                'content_3': {
                    'ar': (self.voice_artist_id, self.voiceover1)
                }
            }

        exploration_voice_artist_link_model = (
            voiceover_services.
            create_exploration_voice_artists_link_model_instance(
                exploration_id='exploration_id',
                content_id_to_voiceovers_mapping=(
                    self.content_id_to_voiceovers_mapping)
            )
        )
        exploration_voice_artist_link_model.put()

        voiceover_services.update_voice_artist_metadata(
            voice_artist_id=self.voice_artist_id,
            language_code_to_accent=(
                self.language_code_to_accent)
        )

    def test_get_voice_artist_data_for_voiceover_admin_page(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL, is_super_admin=True)

        expected_voice_artist_id_to_language_mapping = {
            self.voice_artist_id: {
                'en': 'en-US',
                'hi': 'hi-IN',
                'ar': ''
            }
        }
        expected_voice_artist_id_to_voice_artist_name = {
            self.voice_artist_id: self.voice_artist_username
        }
        json_response = self.get_json(feconf.VOICE_ARTIST_METADATA_HANDLER)

        self.assertDictEqual(
            json_response['voice_artist_id_to_language_mapping'],
            expected_voice_artist_id_to_language_mapping
        )
        self.assertDictEqual(
            json_response['voice_artist_id_to_voice_artist_name'],
            expected_voice_artist_id_to_voice_artist_name
        )
        self.logout()

    def test_should_update_voice_artist_language_mapping(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        initial_voice_artist_id_to_language_mapping = {
            self.voice_artist_id: {
                'en': 'en-US',
                'hi': 'hi-IN',
                'ar': ''
            }
        }
        voice_artist_id_to_language_mapping = (
            voiceover_services.get_all_voice_artist_language_accent_mapping())

        self.assertDictEqual(
            voice_artist_id_to_language_mapping,
            initial_voice_artist_id_to_language_mapping
        )

        payload = {
            'voice_artist_id': self.voice_artist_id,
            'language_code': 'ar',
            'language_accent_code': 'ar-EG'
        }
        self.put_json(
            feconf.VOICE_ARTIST_METADATA_HANDLER,
            payload, csrf_token=csrf_token)

        final_voice_artist_id_to_language_mapping = {
            self.voice_artist_id: {
                'en': 'en-US',
                'hi': 'hi-IN',
                'ar': 'ar-EG'
            }
        }
        voice_artist_id_to_language_mapping = (
            voiceover_services.get_all_voice_artist_language_accent_mapping())

        self.assertDictEqual(
            voice_artist_id_to_language_mapping,
            final_voice_artist_id_to_language_mapping
        )
        self.logout()

    def test_get_exp_id_to_filenames_for_given_voice_artist(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL, is_super_admin=True)

        handler_url = (
            '%s/%s/%s' % (
                feconf.GET_SAMPLE_VOICEOVERS_FOR_VOICE_ARTIST,
                self.voice_artist_id,
                'en')
        )

        expected_exp_id_to_filenames = {
            'exploration_id': ['filename1.mp3']
        }

        json_response = self.get_json(handler_url)

        self.assertDictEqual(
            json_response['exploration_id_to_filenames'],
            expected_exp_id_to_filenames
        )

        handler_url = (
            '%s/%s/%s' % (
                feconf.GET_SAMPLE_VOICEOVERS_FOR_VOICE_ARTIST,
                self.voice_artist_id,
                'hi')
        )

        expected_exp_id_to_filenames = {
            'exploration_id': ['filename2.mp3']
        }

        json_response = self.get_json(handler_url)

        self.assertDictEqual(
            json_response['exploration_id_to_filenames'],
            expected_exp_id_to_filenames
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
            'duration_secs': 6.1
        }
        self.autogenerated_voiceover_dict_1: state_domain.VoiceoverDict = {
            'filename': 'filename2.mp3',
            'file_size_bytes': 3500,
            'needs_update': False,
            'duration_secs': 5.9
        }
        self.manual_voiceover_dict_2: state_domain.VoiceoverDict = {
            'filename': 'filename1.mp3',
            'file_size_bytes': 3000,
            'needs_update': False,
            'duration_secs': 6.1
        }
        self.autogenerated_voiceover_dict_2: state_domain.VoiceoverDict = {
            'filename': 'filename2.mp3',
            'file_size_bytes': 3500,
            'needs_update': False,
            'duration_secs': 5.9
        }

        self.entity_voiceovers_1 = voiceover_domain.EntityVoiceovers(
            entity_id='exp_id',
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_version=1,
            language_accent_code='en-US',
            voiceovers_mapping={
                'content_id_0': {
                    feconf.VoiceoverType.MANUAL: (
                        state_domain.Voiceover.from_dict(
                            self.manual_voiceover_dict_1)),
                    feconf.VoiceoverType.AUTO: (
                        state_domain.Voiceover.from_dict(
                            self.autogenerated_voiceover_dict_1))
                }
            },
            automated_voiceovers_audio_offsets_msecs={}
        )
        self.entity_voiceovers_2 = voiceover_domain.EntityVoiceovers(
            entity_id='exp_id',
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_version=1,
            language_accent_code='en-IN',
            voiceovers_mapping={
                'content_id_0': {
                    feconf.VoiceoverType.MANUAL: (
                        state_domain.Voiceover.from_dict(
                            self.manual_voiceover_dict_1)),
                    feconf.VoiceoverType.AUTO: (
                        state_domain.Voiceover.from_dict(
                            self.autogenerated_voiceover_dict_2))
                }
            },
            automated_voiceovers_audio_offsets_msecs={}
        )

        entity_voiceover_model_1 = (
            voiceover_services.create_entity_voiceovers_model(
                self.entity_voiceovers_1))
        entity_voiceover_model_1.put()

        entity_voiceover_model_2 = (
            voiceover_services.create_entity_voiceovers_model(
                self.entity_voiceovers_2))
        entity_voiceover_model_2.put()

        language_codes_mapping: Dict[str, Dict[str, bool]] = {
            'en': {
                'en-US': True,
                'en-IN': True
            },
            'hi': {
                'hi-IN': False
            }
        }
        voiceover_services.save_language_accent_support(
            language_codes_mapping=language_codes_mapping)

    def test_should_fetch_entity_voiceovers_by_language_code(self) -> None:
        self.login(self.VOICEOVER_ADMIN_EMAIL, is_super_admin=True)

        handler_url = (
            '/entity_voiceovers_bulk_handler/%s/%s/%s/%s' % (
                feconf.ENTITY_TYPE_EXPLORATION, 'exp_id', 1, 'en')
        )
        json_response = self.get_json(handler_url)

        self.assertEqual(
            len(json_response['entity_voiceovers_list']), 2)
