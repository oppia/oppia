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
import logging

from core import feconf, utils
from core.domain import (
    email_manager,
    exp_domain,
    exp_services,
    machine_translation_services,
    taskqueue_services,
    translation_domain,
    translation_fetchers,
    translation_services,
)
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, Optional, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import translation_models

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
        instance = self.registry.get_provider_instance('gcp')
        self.assertIsNotNone(instance)

    def test_get_provider_instance_returns_none_for_invalid_id(self) -> None:
        self.assertIsNone(self.registry.get_provider_instance('nonexistent'))

    def test_init_logs_error_for_unregistered_provider_class(self) -> None:
        # Since the registry reads the file via utils.get_file_contents in its
        # __init__, we need to mock utils.get_file_contents to return JSON with
        # the unknown provider to trigger the initialization path correctly.
        mock_get_file_contents = self.swap(
            utils, 'get_file_contents', lambda _: '{"hi": ["unknown_provider"]}'
        )

        with mock_get_file_contents:
            with self.capture_logging(min_level=logging.ERROR) as logs:
                _ = machine_translation_services.TranslationProviderRegistry()

        self.assertIn(
            'Provider \'unknown_provider\' appears in auto_translation_provider'
            '_mapping.json but has no registered implementation in '
            '_PROVIDER_CLASS_MAP. Skipping.',
            logs,
        )


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
            self.assertEqual(
                result,
                ('नमस्ते', machine_translation_services.TRANSLATION_SOURCE_CACHE),
            )

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

    def test_raises_exception_if_no_provider_instance_available(self) -> None:
        provider_instance_swap = self.swap(
            machine_translation_services._PROVIDER_REGISTRY,  # pylint: disable=protected-access
            'get_provider_instance',
            lambda id: None,
        )

        with self.mock_provider_id_swap, provider_instance_swap:
            with self.assertRaisesRegex(
                utils.ValidationError,
                'The mapped provider class for azure is not registered.',
            ):
                machine_translation_services.generate_and_cache_translation(
                    'en', 'hi', 'Hello'
                )

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
        mock_display_names = {'azure': 'Azure', 'gcp': 'Google Cloud'}
        whitelist_json = json.dumps({'hi': ['azure', 'gcp'], 'es': ['gcp']})

        feconf_swap = self.swap(
            feconf,
            'MACHINE_TRANSLATION_PROVIDER_DISPLAY_NAMES',
            mock_display_names,
        )
        file_contents_swap = self.swap(
            utils, 'get_file_contents', lambda path: whitelist_json
        )
        with feconf_swap, file_contents_swap:
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


class AutoTranslationGenerationTests(test_utils.GenericTestBase):
    """Tests for the background generation of automatic translations."""

    EXP_ID: Final = 'exp_id'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        # The exploration has two HTML contents that need a translation:
        # content_0 (in the first state) and content_3 (in the end state).
        self.exploration = self.save_new_valid_exploration(
            self.EXP_ID,
            self.owner_id,
            end_state_name='End',
            content_html='<p>Content</p>',
        )
        self.mapping_swap = self.swap(
            translation_services,
            'get_machine_translation_provider_mapping',
            lambda: {'hi': 'gcp', 'ar': '', 'en': 'gcp'},
        )
        self.translate_swap = self.swap(
            machine_translation_services,
            'generate_and_cache_translation',
            lambda source_language_code, target_language_code, source_text: (
                '%s in %s' % (source_text, target_language_code),
                'gcp',
            ),
        )

    def _get_entity_translation(
        self, version: int = 1
    ) -> translation_domain.EntityTranslation:
        """Returns the Hindi translations of the given exploration version.

        Args:
            version: int. The version of the exploration.

        Returns:
            EntityTranslation. The Hindi translations of the exploration.
        """
        return translation_fetchers.get_entity_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            self.EXP_ID,
            version,
            'hi',
        )

    def _update_first_state_content(self, html: str) -> None:
        """Updates the content of the first state of the exploration.

        Args:
            html: str. The new content.
        """
        exp_services.update_exploration(
            self.owner_id,
            self.EXP_ID,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': self.exploration.init_state_name,
                        'new_value': {'content_id': 'content_0', 'html': html},
                    }
                )
            ],
            'Update content.',
        )

    def test_content_ids_needing_auto_translation(self) -> None:
        entity_translation = self._get_entity_translation()

        self.assertEqual(
            machine_translation_services.get_content_ids_needing_auto_translation(
                self.exploration, entity_translation
            ),
            ['content_0', 'content_3'],
        )

    def test_contents_with_translations_do_not_need_auto_translation(
        self,
    ) -> None:
        entity_translation = self._get_entity_translation()
        entity_translation.add_translation(
            'content_0',
            '<p>Manual</p>',
            translation_domain.TranslatableContentFormat.HTML,
            False,
        )
        entity_translation.add_auto_translation(
            'content_3',
            '<p>Auto</p>',
            translation_domain.TranslatableContentFormat.HTML,
        )

        self.assertEqual(
            machine_translation_services.get_content_ids_needing_auto_translation(
                self.exploration, entity_translation
            ),
            [],
        )

        entity_translation.mark_translations_needs_update(['content_0'])
        self.assertEqual(
            machine_translation_services.get_content_ids_needing_auto_translation(
                self.exploration, entity_translation
            ),
            ['content_0'],
        )

    def test_no_tasks_are_deferred_if_automatic_translation_is_disabled(
        self,
    ) -> None:
        translation_services.update_automatic_translation_status(False)

        with self.mapping_swap, self.capture_logging() as logs:
            machine_translation_services.generate_auto_translations_for_exploration(
                self.EXP_ID
            )

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_AUTO_TRANSLATION_GENERATION
            ),
            0,
        )
        self.assertEqual(
            logs,
            [
                'Automatic translation is disabled, so no automatic '
                'translations were generated for exploration exp_id.'
            ],
        )

    def test_batch_tasks_are_deferred_for_languages_with_providers(
        self,
    ) -> None:
        translation_services.update_automatic_translation_status(True)
        batch_size_swap = self.swap(
            machine_translation_services, 'AUTO_TRANSLATION_BATCH_SIZE', 1
        )

        with self.mapping_swap, batch_size_swap:
            machine_translation_services.generate_auto_translations_for_exploration(
                self.EXP_ID
            )

        tasks = self.get_pending_tasks(
            queue_name=taskqueue_services.QUEUE_NAME_AUTO_TRANSLATION_GENERATION
        )
        task_args = []
        for task in tasks:
            # Ruling out the possibility of None for mypy type checking.
            assert task.payload is not None
            task_args.append(list(task.payload['args']))
        # Arabic has no provider and English is the language of the
        # exploration, so only Hindi translations are generated.
        self.assertEqual(
            task_args,
            [
                [self.EXP_ID, 1, 'hi', ['content_0']],
                [self.EXP_ID, 1, 'hi', ['content_3']],
            ],
        )

    def test_no_batch_tasks_are_deferred_for_translated_contents(
        self,
    ) -> None:
        translation_services.update_automatic_translation_status(True)
        entity_translation = self._get_entity_translation()
        entity_translation.add_translation(
            'content_0',
            '<p>Manual</p>',
            translation_domain.TranslatableContentFormat.HTML,
            False,
        )
        entity_translation.add_auto_translation(
            'content_3',
            '<p>Auto</p>',
            translation_domain.TranslatableContentFormat.HTML,
        )
        translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            self.EXP_ID,
            1,
            'hi',
            entity_translation.to_stored_translations_dict(),
        ).put()

        with self.mapping_swap:
            machine_translation_services.generate_auto_translations_for_exploration(
                self.EXP_ID
            )

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_AUTO_TRANSLATION_GENERATION
            ),
            0,
        )

    def test_deferred_tasks_store_auto_translations(self) -> None:
        translation_services.update_automatic_translation_status(True)

        with self.mapping_swap, self.translate_swap:
            machine_translation_services.generate_auto_translations_for_exploration(
                self.EXP_ID
            )
            self.process_and_flush_pending_tasks()

        entity_translation = self._get_entity_translation()
        self.assertEqual(entity_translation.translations, {})
        self.assertEqual(
            {
                content_id: translation.content_value
                for content_id, translation in (
                    entity_translation.auto_translations.items()
                )
            },
            {
                'content_0': '<p>Content</p> in hi',
                'content_3': '<p>Content</p> in hi',
            },
        )

    def test_batch_logs_failures_and_stores_other_translations(self) -> None:
        def mock_generate_and_cache_translation(
            unused_source_language_code: str,
            unused_target_language_code: str,
            source_text: str,
        ) -> Optional[Tuple[str, str]]:
            """Fails to translate everything except the end state content.

            Returns:
                tuple(str, str). The translation and the source it came from.

            Raises:
                Exception. The source text is not the end state content.
            """
            if source_text != '<p>End</p>':
                raise Exception('Provider error')
            return (
                '<p>Translated end</p>',
                machine_translation_services.TRANSLATION_SOURCE_CACHE,
            )

        exp_services.update_exploration(
            self.owner_id,
            self.EXP_ID,
            [
                exp_domain.ExplorationChange(
                    {
                        'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                        'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                        'state_name': 'End',
                        'new_value': {
                            'content_id': 'content_3',
                            'html': '<p>End</p>',
                        },
                    }
                )
            ],
            'Update end content.',
        )
        translate_swap = self.swap(
            machine_translation_services,
            'generate_and_cache_translation',
            mock_generate_and_cache_translation,
        )

        with translate_swap, self.capture_logging() as logs:
            machine_translation_services.generate_auto_translations_for_batch(
                self.EXP_ID, 2, 'hi', ['content_0', 'content_3']
            )

        self.assertEqual(
            logs,
            [
                'Failed to generate the automatic translation of content '
                'content_0 of exploration exp_id in hi: Provider error',
                'Automatic translations for exploration exp_id in hi: 1 saved '
                '(1 from the cache), 1 failed.',
            ],
        )
        self.assertEqual(
            list(self._get_entity_translation(2).auto_translations.keys()),
            ['content_3'],
        )

    def test_batch_stops_if_language_has_no_provider(self) -> None:
        no_provider_swap = self.swap(
            machine_translation_services,
            'generate_and_cache_translation',
            lambda source_language_code, target_language_code, source_text: (
                None
            ),
        )

        with no_provider_swap, self.capture_logging() as logs:
            machine_translation_services.generate_auto_translations_for_batch(
                self.EXP_ID, 1, 'hi', ['content_0', 'content_3']
            )

        self.assertEqual(
            logs,
            [
                'No translation provider is configured for hi, so no '
                'automatic translations were generated for exploration exp_id.',
                'Automatic translations for exploration exp_id in hi: 0 saved '
                '(0 from the cache), 0 failed.',
            ],
        )
        self.assertEqual(self._get_entity_translation().auto_translations, {})

    def test_batch_skips_unknown_and_changed_contents(self) -> None:
        self._update_first_state_content('<p>Updated content</p>')

        with self.translate_swap:
            machine_translation_services.generate_auto_translations_for_batch(
                self.EXP_ID, 1, 'hi', ['content_0', 'content_3', 'invalid_id']
            )

        # content_0 changed after the task was enqueued, so its translation
        # is out of date and is not stored. invalid_id is not a content of
        # the exploration, so it is skipped.
        self.assertEqual(
            list(self._get_entity_translation(2).auto_translations.keys()),
            ['content_3'],
        )

    def test_batch_stores_nothing_if_all_contents_changed(self) -> None:
        self._update_first_state_content('<p>Updated content</p>')

        with self.translate_swap, self.capture_logging() as logs:
            machine_translation_services.generate_auto_translations_for_batch(
                self.EXP_ID, 1, 'hi', ['content_0']
            )

        self.assertEqual(self._get_entity_translation(2).auto_translations, {})
        self.assertEqual(
            logs,
            [
                'Automatic translations for exploration exp_id in hi: 0 saved '
                '(0 from the cache), 0 failed.'
            ],
        )

    def test_batch_does_not_replace_existing_auto_translations(self) -> None:
        entity_translation = self._get_entity_translation()
        entity_translation.add_auto_translation(
            'content_0',
            '<p>Existing</p>',
            translation_domain.TranslatableContentFormat.HTML,
        )
        translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            self.EXP_ID,
            1,
            'hi',
            entity_translation.to_stored_translations_dict(),
        ).put()

        with self.translate_swap, self.capture_logging() as logs:
            machine_translation_services.generate_auto_translations_for_batch(
                self.EXP_ID, 1, 'hi', ['content_0']
            )

        self.assertEqual(
            self._get_entity_translation()
            .auto_translations['content_0']
            .content_value,
            '<p>Existing</p>',
        )
        self.assertEqual(
            logs,
            [
                'Automatic translations for exploration exp_id in hi: 0 saved '
                '(0 from the cache), 0 failed.'
            ],
        )

    def test_batch_does_not_store_translations_that_are_too_large(
        self,
    ) -> None:
        size_swap = self.swap(
            machine_translation_services,
            'MAX_STORED_TRANSLATIONS_SIZE_IN_BYTES',
            10,
        )

        with self.translate_swap, size_swap, self.capture_logging() as logs:
            machine_translation_services.generate_auto_translations_for_batch(
                self.EXP_ID, 1, 'hi', ['content_0']
            )

        self.assertEqual(self._get_entity_translation().auto_translations, {})
        self.assertEqual(len(logs), 2)
        self.assertIn(
            'The automatic translations of exploration exp_id in hi were not '
            'stored',
            logs[0],
        )
