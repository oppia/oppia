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
from core.domain import voiceover_services
from core.tests import test_utils

from typing import Dict


class VoiceoverAdminPageTests(test_utils.GenericTestBase):
    """Checks the voiceover admin page functionality and its rendering."""

    def test_voiceover_admin_page_access_without_logging_in(self) -> None:
        """Tests access to the Voiceover Admin page."""
        self.get_html_response('/voiceover-admin', expected_status_int=302)

    def test_voiceover_admin_page_access_without_being_curriculum_admin(
        self
    ) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        self.get_html_response('/voiceover-admin', expected_status_int=401)
        self.logout()

    def test_voiceover_admin_page_access_as_curriculum_admin(self) -> None:
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.get_html_response('/voiceover-admin')
        self.logout()

    def test_get_voiceover_admin_data(self) -> None:
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)

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
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
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
            'Schema validation for \'language_codes_mapping\' failed: '
            'Expected dict, received en-US')

        self.logout()
