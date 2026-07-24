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

"""Tests for machine translation orchestration services."""

from __future__ import annotations

import json

from core import utils
from core.domain import (
    email_manager,
    machine_translation_services,
    translation_services,
)
from core.platform import models
from core.tests import test_utils

from typing import Dict, Optional

(translation_models,) = models.Registry.import_models(
    [models.Names.TRANSLATION]
)


class TranslationProviderRegistryTests(test_utils.GenericTestBase):
    """Tests for the TranslationProviderRegistry."""

    def setUp(self) -> None:
        super().setUp()
        self.registry = (
            machine_translation_services.TranslationProviderRegistry()
        )

    def test_get_provider_id_returns_configured_provider(self) -> None:
        mapping_swap = self.swap(
            translation_services,
            'get_machine_translation_provider_mapping',
            lambda: {'hi': 'azure'},
        )
        whitelist_swap = self.swap(
            self.registry, '_provider_whitelist', {'hi': ['azure', 'gcp']}
        )

        with mapping_swap, whitelist_swap:
            self.assertEqual(self.registry.get_provider_id('hi'), 'azure')

    def test_get_provider_id_returns_none_if_unconfigured(self) -> None:
        mapping_swap = self.swap(
            translation_services,
            'get_machine_translation_provider_mapping',
            lambda: {},
        )
        with mapping_swap:
            self.assertIsNone(self.registry.get_provider_id('hi'))

    def test_get_provider_id_returns_none_if_configured_but_unsupported(
        self,
    ) -> None:
        mapping_swap = self.swap(
            translation_services,
            'get_machine_translation_provider_mapping',
            lambda: {'hi': 'azure'},
        )
        whitelist_swap = self.swap(
            self.registry, '_provider_whitelist', {'hi': ['gcp']}
        )

        with mapping_swap, whitelist_swap:
            self.assertIsNone(self.registry.get_provider_id('hi'))

    def test_get_provider_instance_returns_instance_for_valid_id(
        self,
    ) -> None:
        instance = self.registry.get_provider_instance('azure')
        self.assertIsNotNone(instance)

    def test_get_provider_instance_returns_none_for_invalid_id(self) -> None:
        self.assertIsNone(self.registry.get_provider_instance('nonexistent'))


class GenerateAndCacheTranslationTests(test_utils.GenericTestBase):
    """Tests for the generate_and_cache_translation function."""

    def setUp(self) -> None:
        super().setUp()

        self.cached_model = translation_models.AutoTranslationCacheModel(
            id='en.hi.hash123',
            source_language_code='en',
            target_language_code='hi',
            source_text='Hello',
            translated_text='नमस्ते',
        )

        self.mock_provider_id_swap = self.swap(
            machine_translation_services._PROVIDER_REGISTRY,  # pylint: disable=protected-access
            'get_provider_id',
            lambda lang: 'azure' if lang == 'hi' else None,
        )

    def test_returns_cached_translation_on_exact_match(self) -> None:
        cache_swap = self.swap(
            translation_models.AutoTranslationCacheModel,
            'get_translation',
            lambda src_lang, tgt_lang, text: self.cached_model,
        )

        with cache_swap:
            result = (
                machine_translation_services.generate_and_cache_translation(
                    'en', 'hi', 'Hello'
                )
            )
            self.assertEqual(result, ('नमस्ते', 'cached'))

    def test_ignores_cache_on_hash_collision(self) -> None:
        collision_model = translation_models.AutoTranslationCacheModel(
            id='en.hi.hash123',
            source_language_code='en',
            target_language_code='hi',
            source_text='Different Text',
            translated_text='अलग पाठ',
        )

        cache_swap = self.swap(
            translation_models.AutoTranslationCacheModel,
            'get_translation',
            lambda src_lang, tgt_lang, text: collision_model,
        )

        class MockProvider:
            def generate_translation(
                self, _src: str, _tgt: str, _text: str
            ) -> str:
                """Mocks a successful translation generation."""
                return 'api_translated_text'

        provider_instance_swap = self.swap(
            machine_translation_services._PROVIDER_REGISTRY,  # pylint: disable=protected-access
            'get_provider_instance',
            lambda id: MockProvider(),
        )

        with cache_swap, self.mock_provider_id_swap, provider_instance_swap:
            result = (
                machine_translation_services.generate_and_cache_translation(
                    'en', 'hi', 'Hello'
                )
            )
            self.assertEqual(result, ('api_translated_text', 'azure'))

    def test_returns_none_if_no_provider_is_configured(self) -> None:
        with self.mock_provider_id_swap:
            result = (
                machine_translation_services.generate_and_cache_translation(
                    'en', 'es', 'Hello'
                )
            )
            self.assertIsNone(result)

    def test_returns_none_if_no_provider_instance_available(self) -> None:
        provider_instance_swap = self.swap(
            machine_translation_services._PROVIDER_REGISTRY,  # pylint: disable=protected-access
            'get_provider_instance',
            lambda id: None,
        )

        with self.mock_provider_id_swap, provider_instance_swap:
            result = (
                machine_translation_services.generate_and_cache_translation(
                    'en', 'hi', 'Hello'
                )
            )
            self.assertIsNone(result)

    def test_api_failure_sends_email_and_raises_exception(self) -> None:
        class MockFailingProvider:
            def generate_translation(
                self, _src: str, _tgt: str, _text: str
            ) -> str:
                """Mocks a failed translation generation."""
                raise Exception('Azure Timeout')

        provider_instance_swap = self.swap(
            machine_translation_services._PROVIDER_REGISTRY,  # pylint: disable=protected-access
            'get_provider_instance',
            lambda id: MockFailingProvider(),
        )

        email_messages = []

        def mock_send_email(provider_id: str, error: str) -> None:
            email_messages.append((provider_id, error))

        email_swap = self.swap(
            email_manager,
            'send_machine_translation_failure_email',
            mock_send_email,
        )

        with self.mock_provider_id_swap, provider_instance_swap, email_swap:
            with self.assertRaisesRegex(
                Exception, 'Failed to generate translation'
            ):
                machine_translation_services.generate_and_cache_translation(
                    'en', 'hi', 'Hello'
                )

        self.assertEqual(len(email_messages), 1)
        self.assertEqual(email_messages[0][0], 'azure')
        self.assertEqual(email_messages[0][1], 'Azure Timeout')


class MachineTranslationServicesWrapperTests(test_utils.GenericTestBase):
    """Tests for thin wrapper functions delegating to translation_services."""

    def test_get_translation_provider_mapping_delegates_correctly(
        self,
    ) -> None:
        mapping_swap = self.swap(
            translation_services,
            'get_machine_translation_provider_mapping',
            lambda: {'hi': 'azure'},
        )
        with mapping_swap:
            self.assertEqual(
                machine_translation_services.get_translation_provider_mapping(),
                {'hi': 'azure'},
            )

    def test_save_translation_provider_mapping_delegates_correctly(
        self,
    ) -> None:
        calls = []

        def mock_save(mapping: Dict[str, str]) -> None:
            calls.append(mapping)

        save_swap = self.swap(
            translation_services,
            'save_machine_translation_provider_mapping',
            mock_save,
        )
        with save_swap:
            machine_translation_services.save_translation_provider_mapping(
                {'hi': 'azure'}
            )
        self.assertEqual(calls, [{'hi': 'azure'}])

    def test_is_automatic_translation_enabled_delegates_correctly(
        self,
    ) -> None:
        enabled_swap = self.swap(
            translation_services,
            'is_automatic_translation_enabled',
            lambda: True,
        )
        with enabled_swap:
            self.assertTrue(
                machine_translation_services.is_automatic_translation_enabled()
            )

    def test_update_translation_automatic_status_delegates_correctly(
        self,
    ) -> None:
        calls = []

        def mock_update(is_enabled: bool) -> None:
            calls.append(is_enabled)

        update_swap = self.swap(
            translation_services,
            'update_automatic_translation_status',
            mock_update,
        )
        with update_swap:
            machine_translation_services.update_translation_automatic_status(
                True
            )
        self.assertEqual(calls, [True])

    def test_update_machine_translation_policy_delegates_correctly(
        self,
    ) -> None:
        calls = []

        def mock_update_policy(
            mapping: Optional[Dict[str, str]],
            is_enabled: Optional[bool],
        ) -> None:
            calls.append((mapping, is_enabled))

        update_swap = self.swap(
            translation_services,
            'update_machine_translation_policy',
            mock_update_policy,
        )
        with update_swap:
            machine_translation_services.update_machine_translation_policy(
                {'hi': 'azure'}, True
            )
        self.assertEqual(calls, [({'hi': 'azure'}, True)])

    def test_get_available_providers_for_ui_returns_sorted_list(self) -> None:
        display_names_json = json.dumps(
            {'azure': 'Azure', 'gcp': 'Google Cloud'}
        )
        whitelist_json = json.dumps({'hi': ['azure', 'gcp'], 'es': ['gcp']})

        def mock_get_file_contents(path: str) -> str:
            if 'display_names' in path:
                return display_names_json
            return whitelist_json

        file_contents_swap = self.swap(
            utils, 'get_file_contents', mock_get_file_contents
        )
        with file_contents_swap:
            result = (
                machine_translation_services.get_available_providers_for_ui()
            )
        self.assertEqual(
            result,
            [
                {'id': 'azure', 'display_name': 'Azure'},
                {'id': 'gcp', 'display_name': 'Google Cloud'},
            ],
        )
