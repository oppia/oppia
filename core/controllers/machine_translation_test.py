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

from core import utils
from core.domain import (
    feature_flag_services,
    machine_translation_services,
    translation_services,
)
from core.tests import test_utils

from typing import Any, Dict, Optional


class MachineTranslationGenerateHandlerTests(test_utils.GenericTestBase):
    """Tests for the MachineTranslationGenerateHandler."""

    CONTRIBUTOR_EMAIL = 'contributor@example.com'
    CONTRIBUTOR_USERNAME = 'contributor'

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
        self.login(self.CONTRIBUTOR_EMAIL, is_super_admin=True)

        flag_swap = self.swap(
            feature_flag_services,
            'is_feature_flag_enabled',
            lambda *args, **kwargs: False,
        )

        with flag_swap, self.admin_toggle_swap:
            csrf_token = self.get_new_csrf_token()
            self.post_json(
                '/generate-translation',
                self.payload,
                csrf_token=csrf_token,
                expected_status_int=404,
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
            csrf_token = self.get_new_csrf_token()
            response = self.post_json(
                '/generate-translation',
                self.payload,
                csrf_token=csrf_token,
                expected_status_int=400,
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
            csrf_token = self.get_new_csrf_token()
            response = self.post_json(
                '/generate-translation',
                self.payload,
                csrf_token=csrf_token,
                expected_status_int=400,
            )
            self.assertEqual(
                response['error'],
                'No active translation provider is configured for hi.',
            )
        self.logout()

    def test_post_fails_gracefully_on_api_exception(self) -> None:
        self.login(self.CONTRIBUTOR_EMAIL)

        # Here we use type Any because this is a mock function that ignores
        # all inputs and simply exists to raise an exception.
        def mock_generate(*args: Any, **kwargs: Any) -> None:
            raise Exception('Azure Quota Exceeded')

        domain_swap = self.swap(
            machine_translation_services,
            'generate_and_cache_translation',
            mock_generate,
        )

        with self.feature_flag_swap, self.admin_toggle_swap, domain_swap:
            csrf_token = self.get_new_csrf_token()
            response = self.post_json(
                '/generate-translation',
                self.payload,
                csrf_token=csrf_token,
                expected_status_int=500,
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
            csrf_token = self.get_new_csrf_token()
            response = self.post_json(
                '/generate-translation', self.payload, csrf_token=csrf_token
            )

            self.assertEqual(response['translated_text'], 'नमस्ते दुनिया')
            self.assertEqual(response['translation_provider'], 'azure')

        self.logout()


class TranslationProviderMappingHandlerTests(test_utils.GenericTestBase):
    """Tests for the TranslationProviderMappingHandler."""

    ADMIN_EMAIL = 'admin@example.com'
    ADMIN_USERNAME = 'configuser'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.valid_payload = {
            'provider_mapping': {'hi': 'azure', 'es': 'google'}
        }

        self.feature_flag_swap = self.swap(
            feature_flag_services,
            'is_feature_flag_enabled',
            lambda *args, **kwargs: True,
        )

    def test_get_mapping_successfully(self) -> None:
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        domain_swap = self.swap(
            machine_translation_services,
            'get_translation_provider_mapping',
            lambda: {'hi': 'azure'},
        )
        is_enabled_swap = self.swap(
            machine_translation_services,
            'is_automatic_translation_enabled',
            lambda: True,
        )
        providers_swap = self.swap(
            machine_translation_services,
            'get_available_providers_for_ui',
            lambda: [{'id': 'azure', 'display_name': 'Azure Translator'}],
        )

        with self.feature_flag_swap, (
            domain_swap
        ), is_enabled_swap, providers_swap:
            response = self.get_json('/translation-provider-mapping')

        self.assertEqual(response['provider_mapping'], {'hi': 'azure'})
        self.assertEqual(response['automatic_translation_is_enabled'], True)
        self.assertEqual(
            response['available_providers'],
            [{'id': 'azure', 'display_name': 'Azure Translator'}],
        )
        self.logout()

    def test_get_fails_if_feature_flag_disabled(self) -> None:
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        flag_swap = self.swap(
            feature_flag_services,
            'is_feature_flag_enabled',
            lambda *args, **kwargs: False,
        )

        with flag_swap:
            self.get_json(
                '/translation-provider-mapping', expected_status_int=404
            )

        self.logout()

    def test_put_mapping_successfully(self) -> None:
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        saved_mapping = {}

        def mock_update_mapping(new_mapping: Dict[str, str]) -> None:
            saved_mapping.update(new_mapping)

        domain_swap = self.swap(
            machine_translation_services,
            'update_machine_translation_policy',
            lambda language_to_provider_mapping=None, automatic_translation_is_enabled=None: mock_update_mapping(
                language_to_provider_mapping
            ),
        )

        with self.feature_flag_swap, domain_swap:
            csrf_token = self.get_new_csrf_token()
            response = self.put_json(
                '/translation-provider-mapping',
                self.valid_payload,
                csrf_token=csrf_token,
            )

        self.assertEqual(response['status'], 'success')
        self.assertEqual(saved_mapping, self.valid_payload['provider_mapping'])
        self.logout()

    def test_put_fails_with_validation_error(self) -> None:
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        def mock_update_policy_fails(
            language_to_provider_mapping: Optional[Dict[str, str]] = None,
            automatic_translation_is_enabled: Optional[bool] = None,
        ) -> None:
            raise utils.ValidationError('Invalid provider specified.')

        domain_swap = self.swap(
            machine_translation_services,
            'update_machine_translation_policy',
            mock_update_policy_fails,
        )

        with self.feature_flag_swap, domain_swap:
            csrf_token = self.get_new_csrf_token()
            response = self.put_json(
                '/translation-provider-mapping',
                self.valid_payload,
                csrf_token=csrf_token,
                expected_status_int=400,
            )

        self.assertEqual(response['error'], 'Invalid provider specified.')
        self.logout()

    def test_put_fails_if_feature_flag_disabled(self) -> None:
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        flag_swap = self.swap(
            feature_flag_services,
            'is_feature_flag_enabled',
            lambda *args, **kwargs: False,
        )

        with flag_swap:
            csrf_token = self.get_new_csrf_token()
            self.put_json(
                '/translation-provider-mapping',
                self.valid_payload,
                csrf_token=csrf_token,
                expected_status_int=404,
            )

        self.logout()

    def test_put_updates_toggle_when_provided(self) -> None:
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        policy_calls = []

        def mock_update_policy(
            language_to_provider_mapping: Optional[Dict[str, str]] = None,
            automatic_translation_is_enabled: Optional[bool] = None,
        ) -> None:
            policy_calls.append(
                (language_to_provider_mapping, automatic_translation_is_enabled)
            )

        policy_swap = self.swap(
            machine_translation_services,
            'update_machine_translation_policy',
            mock_update_policy,
        )

        payload = {
            'provider_mapping': {'hi': 'azure'},
            'automatic_translation_is_enabled': True,
        }

        with self.feature_flag_swap, policy_swap:
            csrf_token = self.get_new_csrf_token()
            response = self.put_json(
                '/translation-provider-mapping',
                payload,
                csrf_token=csrf_token,
            )

        self.assertEqual(response['status'], 'success')
        self.assertEqual(policy_calls, [({'hi': 'azure'}, True)])
        self.logout()

    def test_put_does_not_update_toggle_when_not_provided(self) -> None:
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        policy_calls = []

        def mock_update_policy(
            language_to_provider_mapping: Optional[Dict[str, str]] = None,
            automatic_translation_is_enabled: Optional[bool] = None,
        ) -> None:
            policy_calls.append(
                (language_to_provider_mapping, automatic_translation_is_enabled)
            )

        policy_swap = self.swap(
            machine_translation_services,
            'update_machine_translation_policy',
            mock_update_policy,
        )

        with self.feature_flag_swap, policy_swap:
            csrf_token = self.get_new_csrf_token()
            response = self.put_json(
                '/translation-provider-mapping',
                self.valid_payload,
                csrf_token=csrf_token,
            )

        self.assertEqual(response['status'], 'success')
        self.assertEqual(
            policy_calls, [({'hi': 'azure', 'es': 'google'}, None)]
        )
        self.logout()

    def test_put_fails_gracefully_on_internal_exception(self) -> None:
        self.login(self.ADMIN_EMAIL, is_super_admin=True)

        def mock_update_policy_raises(
            language_to_provider_mapping: Optional[Dict[str, str]] = None,
            automatic_translation_is_enabled: Optional[bool] = None,
        ) -> None:
            raise Exception('Datastore write failed unexpectedly.')

        domain_swap = self.swap(
            machine_translation_services,
            'update_machine_translation_policy',
            mock_update_policy_raises,
        )

        with self.feature_flag_swap, domain_swap:
            csrf_token = self.get_new_csrf_token()
            response = self.put_json(
                '/translation-provider-mapping',
                self.valid_payload,
                csrf_token=csrf_token,
                expected_status_int=500,
            )

        self.assertEqual(
            response['error'], 'Datastore write failed unexpectedly.'
        )
        self.logout()
