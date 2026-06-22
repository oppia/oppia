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

"""Service functions for orchestration of machine translation generation."""

from __future__ import annotations

import json
import logging

from core import utils
from core.constants import constants
from core.domain import email_manager
from core.domain import html_translation_services
from core.domain import translation_services
from core.platform import models
from core.platform.translate import azure_translate_services
from core.platform.translate import base_translate_services
from core.platform.translate import translate_emulator

from typing import Dict, Optional, Tuple

(translation_models,) = models.Registry.import_models(
    [models.Names.TRANSLATION]
)


class TranslationProviderRegistry:
    """Registry for managing and routing requests to translation service providers."""

    def __init__(self) -> None:
        """Initializes the TranslationProviderRegistry."""
        self._provider_whitelist: Dict[str, list[str]] = json.loads(
            utils.get_file_contents('assets/machine_translation_providers.json')
        )

        self._providers: Dict[
            str, base_translate_services.BaseTranslationService
        ] = {
            'azure': (
                translate_emulator.TranslateEmulator()
                if constants.EMULATOR_MODE
                else azure_translate_services.AzureTranslationService()
            )
        }

    def get_provider_id(self, target_language_code: str) -> Optional[str]:
        """Gets the configured translation provider ID for the given language.

        Args:
            target_language_code: str. The ISO 639-1 target language code.

        Returns:
            str|None. The ID of the translation service provider (e.g., 'azure'),
            or None if no provider is configured or supported.
        """
        admin_mapping = (
            translation_services.get_machine_translation_provider_mapping()
        )
        provider_id = admin_mapping.get(target_language_code)

        if not provider_id:
            return None

        supported_providers = self._provider_whitelist.get(
            target_language_code, []
        )
        if provider_id not in supported_providers:
            logging.error(
                'Admin configured provider %s for language %s, but it is not '
                'supported in machine_translation_providers.json.'
                % (provider_id, target_language_code)
            )
            return None

        return provider_id

    def get_provider_instance(
        self, provider_id: str
    ) -> Optional[base_translate_services.BaseTranslationService]:
        """Returns the service instance for the provider ID."""
        return self._providers.get(provider_id)


_PROVIDER_REGISTRY = TranslationProviderRegistry()


def generate_and_cache_translation(
    source_language_code: str, target_language_code: str, source_text: str
) -> Optional[Tuple[str, str]]:
    """Generates a translation, utilizing caching and HTML protection.

    Args:
        source_language_code: str. The language code of the original text.
        target_language_code: str. The language code to translate into.
        source_text: str. The untranslated HTML/text.

    Returns:
        tuple(str, str)|None. A tuple containing:
            - The sanitized, translated HTML string.
            - The name of the provider used (e.g., 'azure').
        Returns None if no provider is configured or supported.
    """

    cached_model = translation_models.AutoTranslationCacheModel.get_translation(
        source_language_code, target_language_code, source_text
    )

    if cached_model is not None and cached_model.source_text == source_text:
        return (cached_model.translated_text, 'cached')

    provider_id = _PROVIDER_REGISTRY.get_provider_id(target_language_code)
    if not provider_id:
        return None

    provider_instance = _PROVIDER_REGISTRY.get_provider_instance(provider_id)
    if not provider_instance:
        return None

    protected_html = html_translation_services.protect_html_for_translation(
        source_text
    )

    try:
        raw_translated_html = provider_instance.generate_translation(
            source_language_code, target_language_code, protected_html
        )
    except Exception as e:
        logging.error(
            'Machine translation failed for provider %s: %s'
            % (provider_id, str(e))
        )
        email_manager.send_machine_translation_failure_email(
            provider_id, str(e)
        )
        raise Exception('Failed to generate translation: %s' % e) from e

    clean_translated_html = (
        html_translation_services.postprocess_translated_html(
            raw_translated_html
        )
    )

    translation_models.AutoTranslationCacheModel.create(
        source_language_code=source_language_code,
        target_language_code=target_language_code,
        source_text=source_text,
        translated_text=clean_translated_html,
    )

    return (clean_translated_html, provider_id)
