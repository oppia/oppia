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

        language_accent_code_to_description: Dict[str, str] = {}
        for language_accent_code_mapping in (
                voiceover_services.get_language_accent_master_list().values()):
            language_accent_code_to_description.update(
                language_accent_code_mapping)

        language_codes_mapping: Dict[str, Dict[str, bool]] = (
            voiceover_services.get_all_language_accent_codes_for_voiceovers())

        json_response = self.get_json(feconf.VOICEOVER_ADMIN_DATA_HANDLER_URL)

        self.assertDictEqual(
            json_response['language_accent_code_to_description'],
            language_accent_code_to_description)
        self.assertDictEqual(
            json_response['language_codes_mapping'],
            language_codes_mapping)

        self.logout()
