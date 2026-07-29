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

from core import feconf, utils
from core.constants import constants
from core.domain import (
    email_manager,
    html_translation_services,
    translation_services,
)
from core.platform import models
from core.platform.translate import (
    azure_translate_services,
    base_translate_services,
    translate_emulator,
)

from typing import Dict, List, Optional, Set, Tuple, Type

(translation_models,) = models.Registry.import_models(
    [models.Names.TRANSLATION]
)


# Maps every known provider ID to its concrete service class.  The key is
# taken from the class's own PROVIDER_ID constant so that the string appears
# in exactly one place.  To onboard a new translation provider:
#   1. Add its supported languages to auto_translation_provider_mapping.json.
#   2. Implement a class inheriting BaseTranslationService in
#      core/platform/translate/ and set its PROVIDER_ID constant.
#   3. Import the class here and add it to this map.
# No other changes to this module are needed.
_PROVIDER_CLASS_MAP: Dict[
    str, Type[base_translate_services.BaseTranslationService]
] = {
    azure_translate_services.AzureTranslationService.PROVIDER_ID: (
        azure_translate_services.AzureTranslationService
    ),
}


class TranslationProviderRegistry:
    """Registry for managing and routing requests to translation service providers."""

    def __init__(self) -> None:
        """Initializes the TranslationProviderRegistry."""

        # assets/auto_translation_provider_mapping.json is the developer-controlled
        # whitelist defining which translation providers technically support
        # which language codes. It controls what the system is CAPABLE of
        # translating, not what is actively enabled at runtime. Runtime
        # enablement is managed separately via MachineTranslationPolicyModel
        # in the translation admin UI.
        #
        # Criteria for adding a language:
        #   1. The language must be supported by the listed provider.
        #      Verify against the provider's official supported languages
        #      docs (e.g. Azure: https://learn.microsoft.com/en-us/azure/
        #      ai-services/translator/language-support, GCP:
        #      https://cloud.google.com/translate/docs/languages). For any
        #      new provider, link its equivalent page here.
        #   2. There must be an active contributor base for that language
        #      on Oppia's Contributor Dashboard.
        #   3. A PR must be raised to add the entry; changes do not take
        #      effect until merged and deployed.
        #
        # Criteria for removing a language:
        #   1. All listed providers have deprecated support for the
        #      language, OR
        #   2. The language is being moved to a different provider entirely.
        #
        # Adding a new provider:
        #   1. Add the provider's supported languages to this file.
        #   2. Link its supported languages doc above in this comment.
        #
        # Maintenance: when any provider updates its supported languages,
        # verify against the links above and raise a PR to keep this file
        # in sync.

        self._provider_whitelist: Dict[str, list[str]] = json.loads(
            utils.get_file_contents(
                'assets/auto_translation_provider_mapping.json'
            )
        )

        self._providers: Dict[
            str, base_translate_services.BaseTranslationService
        ] = {}
        all_provider_ids: Set[str] = set()
        for providers in self._provider_whitelist.values():
            all_provider_ids.update(providers)

        for pid in all_provider_ids:
            if pid not in _PROVIDER_CLASS_MAP:
                logging.error(
                    'Provider \'%s\' appears in auto_translation_provider'
                    '_mapping.json but has no registered implementation in '
                    '_PROVIDER_CLASS_MAP. Skipping.' % pid
                )
                continue
            cls = _PROVIDER_CLASS_MAP[pid]
            self._providers[pid] = (
                translate_emulator.TranslateEmulator()
                if constants.EMULATOR_MODE
                else cls()
            )

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

    Raises:
        Exception. Failed to generate translation.

    Returns:
        tuple(str, str)|None. A tuple containing the sanitized, translated
        HTML string and the name of the provider used (e.g., 'azure').
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

    protected_html = html_translation_services.preprocess_html_for_translation(
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


def get_translation_provider_mapping() -> Dict[str, str]:
    """Gets the current language-to-provider mapping.

    Returns:
        dict. The language to translation provider mapping.
    """
    return translation_services.get_machine_translation_provider_mapping()


def save_translation_provider_mapping(new_mapping: Dict[str, str]) -> None:
    """Updates the language-to-provider mapping.

    Args:
        new_mapping: dict. The new mapping to save.
    """
    translation_services.save_machine_translation_provider_mapping(new_mapping)


def is_automatic_translation_enabled() -> bool:
    """Returns whether automatic translation is enabled.

    Returns:
        bool. Whether automatic translation is enabled.
    """
    return translation_services.is_automatic_translation_enabled()


def update_translation_automatic_status(is_enabled: bool) -> None:
    """Updates the automatic translation enabled/disabled flag.

    Args:
        is_enabled: bool. The new status.
    """
    translation_services.update_automatic_translation_status(is_enabled)


def get_available_providers_for_ui() -> List[Dict[str, str]]:
    """Returns available providers with human-readable display names.

    Returns:
        list(dict(str, str)). A list of dicts with provider ids and display names.
    """
    whitelist: Dict[str, List[str]] = json.loads(
        utils.get_file_contents('assets/auto_translation_provider_mapping.json')
    )
    all_provider_ids: Set[str] = set()
    for providers in whitelist.values():
        all_provider_ids.update(providers)
    return sorted(
        [
            {
                'id': pid,
                'display_name': feconf.MACHINE_TRANSLATION_PROVIDER_DISPLAY_NAMES.get(
                    pid, pid.capitalize()
                ),
            }
            for pid in all_provider_ids
        ],
        key=lambda p: p['id'],
    )


def update_machine_translation_policy(
    language_to_provider_mapping: Optional[Dict[str, str]] = None,
    automatic_translation_is_enabled: Optional[bool] = None,
) -> None:
    """Updates the machine translation policy settings.

    Args:
        language_to_provider_mapping: dict|None, optional. The new
            mapping from language codes to provider identifiers.
        automatic_translation_is_enabled: bool|None, optional. The new
            toggle status for automatic translation suggestions.
    """
    translation_services.update_machine_translation_policy(
        language_to_provider_mapping, automatic_translation_is_enabled
    )
