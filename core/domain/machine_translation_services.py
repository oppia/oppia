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
    exp_domain,
    exp_fetchers,
    html_translation_services,
    taskqueue_services,
    translation_domain,
    translation_fetchers,
    translation_services,
)
from core.platform import models
from core.platform.translate import (
    base_translate_services,
    gcp_translate_services,
    translate_emulator,
)

from typing import Dict, Final, List, Optional, Set, Tuple, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import transaction_services

(translation_models,) = models.Registry.import_models(
    [models.Names.TRANSLATION]
)
transaction_services = models.Registry.import_transaction_services()

# The maximum number of contents that a single deferred task translates. Every
# content that is not cached needs a call to the translation provider, so the
# batches are kept small enough for a task to finish well within the 60-second
# request time limit.
AUTO_TRANSLATION_BATCH_SIZE: Final = 20

# The maximum size of the translations of an EntityTranslationsModel after
# automatic translations are added to it. This leaves some space below the
# 1 MB limit for datastore entities for the other fields of the model.
MAX_STORED_TRANSLATIONS_SIZE_IN_BYTES: Final = 900000


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
    gcp_translate_services.GcpTranslationService.PROVIDER_ID: (
        gcp_translate_services.GcpTranslationService
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


TRANSLATION_SOURCE_CACHE = 'cached'

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
        cached_translation = translation_domain.MachineTranslation(
            cached_model.source_language_code,
            cached_model.target_language_code,
            cached_model.source_text,
            cached_model.translated_text,
        )
        return (cached_translation.translated_text, TRANSLATION_SOURCE_CACHE)

    provider_id = _PROVIDER_REGISTRY.get_provider_id(target_language_code)
    if not provider_id:
        return None

    provider_instance = _PROVIDER_REGISTRY.get_provider_instance(provider_id)
    if not provider_instance:
        raise utils.ValidationError(
            'The mapped provider class for %s is not registered.' % provider_id
        )

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


def get_content_ids_needing_auto_translation(
    exploration: exp_domain.Exploration,
    entity_translation: translation_domain.EntityTranslation,
) -> List[str]:
    """Returns the IDs of the HTML contents of the given exploration that
    need a translation in the language of the given entity translation, but
    don't have an automatic translation yet.

    Args:
        exploration: Exploration. The exploration whose contents are checked.
        entity_translation: EntityTranslation. The existing translations of
            the exploration in the target language.

    Returns:
        list(str). The IDs of the contents that need an automatic
        translation.
    """
    contents_which_need_translations = (
        exploration.get_all_contents_which_need_translations(entity_translation)
    )
    # Only HTML contents are translated, since the Contributor Dashboard only
    # offers automatic translations for them.
    return [
        content_id
        for content_id, content in contents_which_need_translations.items()
        if content.content_format
        == translation_domain.TranslatableContentFormat.HTML
        and content_id not in entity_translation.auto_translations
    ]


def generate_auto_translations_for_exploration(exploration_id: str) -> None:
    """Splits the generation of automatic translations for the given
    exploration into smaller tasks, one for each batch of contents in each
    language that has a translation provider.

    NOTE: Always invoke this method from a deferred task, since it can enqueue
    many tasks.

    Args:
        exploration_id: str. The ID of the exploration.
    """
    if not translation_services.is_automatic_translation_enabled():
        logging.info(
            'Automatic translation is disabled, so no automatic translations '
            'were generated for exploration %s.' % exploration_id
        )
        return

    exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    target_language_codes = [
        language_code
        for language_code, provider_id in (
            translation_services.get_machine_translation_provider_mapping().items()
        )
        if provider_id and language_code != exploration.language_code
    ]
    entity_translations = translation_fetchers.get_multiple_entity_translations(
        [
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': exploration.id,
                'entity_version': exploration.version,
                'language_code': language_code,
            }
            for language_code in target_language_codes
        ]
    )

    for language_code, entity_translation in zip(
        target_language_codes, entity_translations
    ):
        if entity_translation is None:
            entity_translation = (
                translation_domain.EntityTranslation.create_empty(
                    feconf.TranslatableEntityType.EXPLORATION,
                    exploration.id,
                    language_code,
                    entity_version=exploration.version,
                )
            )
        content_ids = get_content_ids_needing_auto_translation(
            exploration, entity_translation
        )
        for index in range(0, len(content_ids), AUTO_TRANSLATION_BATCH_SIZE):
            taskqueue_services.defer(
                feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
                    'FUNCTION_ID_GENERATE_AUTO_TRANSLATIONS_FOR_BATCH'
                ],
                taskqueue_services.QUEUE_NAME_AUTO_TRANSLATION_GENERATION,
                exploration.id,
                exploration.version,
                language_code,
                content_ids[index : index + AUTO_TRANSLATION_BATCH_SIZE],
            )


def generate_auto_translations_for_batch(
    exploration_id: str,
    exploration_version: int,
    language_code: str,
    content_ids: List[str],
) -> None:
    """Generates the automatic translations of the given contents of an
    exploration, and stores them in the latest version of the exploration's
    translations.

    NOTE: Always invoke this method from a deferred task, since it calls the
    translation provider once for every content that is not cached.

    Args:
        exploration_id: str. The ID of the exploration.
        exploration_version: int. The version of the exploration whose
            contents are translated.
        language_code: str. The language to translate the contents into.
        content_ids: list(str). The IDs of the contents to translate.
    """
    exploration = exp_fetchers.get_exploration_by_id(
        exploration_id, version=exploration_version
    )
    content_id_to_content = (
        exploration.get_translatable_contents_collection().content_id_to_translatable_content
    )

    content_id_to_source_and_translation: Dict[str, Tuple[str, str]] = {}
    cached_count = 0
    failed_count = 0
    for content_id in content_ids:
        content = content_id_to_content.get(content_id)
        if content is None or not isinstance(content.content_value, str):
            continue

        try:
            translation_result = generate_and_cache_translation(
                exploration.language_code,
                language_code,
                content.content_value,
            )
        except Exception as e:
            failed_count += 1
            logging.error(
                'Failed to generate the automatic translation of content %s '
                'of exploration %s in %s: %s'
                % (content_id, exploration_id, language_code, e)
            )
            continue

        # This happens if the provider for the language was removed after the
        # task was enqueued, in which case no other content can be translated
        # either.
        if translation_result is None:
            logging.info(
                'No translation provider is configured for %s, so no '
                'automatic translations were generated for exploration %s.'
                % (language_code, exploration_id)
            )
            break

        translated_text, provider_id = translation_result
        if provider_id == TRANSLATION_SOURCE_CACHE:
            cached_count += 1
        content_id_to_source_and_translation[content_id] = (
            content.content_value,
            translated_text,
        )

    saved_count = _save_auto_translations(
        exploration_id, language_code, content_id_to_source_and_translation
    )
    logging.info(
        'Automatic translations for exploration %s in %s: %d saved (%d from '
        'the cache), %d failed.'
        % (
            exploration_id,
            language_code,
            saved_count,
            cached_count,
            failed_count,
        )
    )


def _save_auto_translations(
    exploration_id: str,
    language_code: str,
    content_id_to_source_and_translation: Dict[str, Tuple[str, str]],
) -> int:
    """Stores the given automatic translations in the latest version of the
    exploration's translations. A translation is skipped if its source content
    has changed in the latest version, or if the content already has an
    automatic translation there.

    Args:
        exploration_id: str. The ID of the exploration.
        language_code: str. The language of the translations.
        content_id_to_source_and_translation: dict(str, tuple(str, str)). A
            dict mapping content IDs to tuples of the source HTML that was
            translated and its automatic translation.

    Returns:
        int. The number of automatic translations that were stored.
    """
    if not content_id_to_source_and_translation:
        return 0

    latest_exploration = exp_fetchers.get_exploration_by_id(exploration_id)
    latest_content_id_to_content = (
        latest_exploration.get_translatable_contents_collection().content_id_to_translatable_content
    )
    content_id_to_auto_translation = {
        content_id: translated_text
        for content_id, (source_text, translated_text) in (
            content_id_to_source_and_translation.items()
        )
        if content_id in latest_content_id_to_content
        and latest_content_id_to_content[content_id].content_value
        == source_text
    }
    if not content_id_to_auto_translation:
        return 0

    return _add_auto_translations_to_entity_translation(
        exploration_id,
        latest_exploration.version,
        language_code,
        content_id_to_auto_translation,
    )


@transaction_services.run_in_transaction_wrapper
def _add_auto_translations_to_entity_translation(
    exploration_id: str,
    exploration_version: int,
    language_code: str,
    content_id_to_auto_translation: Dict[str, str],
) -> int:
    """Adds the given automatic translations to the stored translations of an
    exploration. This is done in a transaction, so that a manual translation
    that is accepted at the same time is not overwritten.

    Args:
        exploration_id: str. The ID of the exploration.
        exploration_version: int. The version of the exploration.
        language_code: str. The language of the translations.
        content_id_to_auto_translation: dict(str, str). A dict mapping content
            IDs to their automatic translations.

    Returns:
        int. The number of automatic translations that were stored.
    """
    entity_translation = translation_fetchers.get_entity_translation(
        feconf.TranslatableEntityType.EXPLORATION,
        exploration_id,
        exploration_version,
        language_code,
    )
    added_content_ids = []
    for content_id, auto_translation in content_id_to_auto_translation.items():
        if content_id in entity_translation.auto_translations:
            continue
        entity_translation.add_auto_translation(
            content_id,
            auto_translation,
            translation_domain.TranslatableContentFormat.HTML,
        )
        added_content_ids.append(content_id)

    if not added_content_ids:
        return 0

    stored_translations = entity_translation.to_stored_translations_dict()
    stored_translations_size = len(
        json.dumps(stored_translations).encode('utf-8')
    )
    if stored_translations_size > MAX_STORED_TRANSLATIONS_SIZE_IN_BYTES:
        logging.error(
            'The automatic translations of exploration %s in %s were not '
            'stored, since they would make its translations %d bytes long.'
            % (exploration_id, language_code, stored_translations_size)
        )
        return 0

    entity_translation.validate()
    model = translation_models.EntityTranslationsModel.create_new(
        feconf.TranslatableEntityType.EXPLORATION.value,
        exploration_id,
        exploration_version,
        language_code,
        stored_translations,
    )
    model.update_timestamps()
    model.put()
    return len(added_content_ids)
