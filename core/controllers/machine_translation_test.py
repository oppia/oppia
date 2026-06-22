# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for the machine translation controllers."""

from __future__ import annotations

from core.domain import feature_flag_services
from core.domain import machine_translation_services
from core.domain import translation_services
from core.tests import test_utils

from typing import Any


class MachineTranslationGenerateHandlerTests(test_utils.ControllerTestBase):
    """Tests for the MachineTranslationGenerateHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CONTRIBUTOR_EMAIL, self.CONTRIBUTOR_USERNAME)
        self.contributor_id = self.get_user_id_from_email(
            self.CONTRIBUTOR_EMAIL
        )

        self.payload = {
            'source_text': 'Hello world',
            'source_language_code': 'en',
            'target_language_code': 'hi',
        }

        # Swap the official feature flag service to return True
        self.feature_flag_swap = self.swap(
            feature_flag_services,
            'is_feature_flag_enabled',
            lambda *args, **kwargs: True,
        )

        self.admin_toggle_swap = self.swap(
            translation_services,
            'is_automatic_translation_enabled',
            lambda: True,
        )

    def test_post_fails_if_feature_flag_disabled(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # For this test, swap the flag to return False
        flag_swap = self.swap(
            feature_flag_services,
            'is_feature_flag_enabled',
            lambda *args, **kwargs: False,
        )

        with flag_swap, self.admin_toggle_swap:
            self.post_json(
                '/generate-translation', self.payload, expected_status_int=404
            )
        self.logout()

    def test_post_fails_if_admin_toggle_is_disabled(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        admin_toggle_swap = self.swap(
            translation_services,
            'is_automatic_translation_enabled',
            lambda: False,
        )

        with self.feature_flag_swap, admin_toggle_swap:
            response = self.post_json(
                '/generate-translation', self.payload, expected_status_int=400
            )
            self.assertEqual(
                response['error'],
                'Automatic translation is currently disabled by the site admin.',
            )
        self.logout()

    def test_post_fails_if_no_provider_configured(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        domain_swap = self.swap(
            machine_translation_services,
            'generate_and_cache_translation',
            lambda src, tgt, text: None,
        )

        with self.feature_flag_swap, self.admin_toggle_swap, domain_swap:
            response = self.post_json(
                '/generate-translation', self.payload, expected_status_int=400
            )
            self.assertEqual(
                response['error'],
                'No active translation provider is configured for hi.',
            )
        self.logout()

    def test_post_fails_gracefully_on_api_exception(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        def mock_generate(*args: Any, **kwargs: Any) -> None:
            raise Exception('Azure Quota Exceeded')

        domain_swap = self.swap(
            machine_translation_services,
            'generate_and_cache_translation',
            mock_generate,
        )

        with self.feature_flag_swap, self.admin_toggle_swap, domain_swap:
            response = self.post_json(
                '/generate-translation', self.payload, expected_status_int=500
            )
            self.assertEqual(response['error'], 'Azure Quota Exceeded')
        self.logout()

    def test_post_returns_translation_successfully(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        domain_swap = self.swap(
            machine_translation_services,
            'generate_and_cache_translation',
            lambda src, tgt, text: ('नमस्ते दुनिया', 'azure'),
        )

        with self.feature_flag_swap, self.admin_toggle_swap, domain_swap:
            response = self.post_json('/generate-translation', self.payload)

            self.assertEqual(response['translated_text'], 'नमस्ते दुनिया')
            self.assertEqual(response['translation_provider'], 'azure')

        self.logout()
