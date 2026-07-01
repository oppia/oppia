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

from core.domain import (
    email_manager,
    machine_translation_services,
    translation_services,
)
from core.platform import models
from core.tests import test_utils

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
