# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Functions for retrieving machine translations."""

from __future__ import annotations

import logging

from core import feconf
from core.domain import exp_domain
from core.domain import translation_domain
from core.domain import translation_fetchers
from core.platform import models

from typing import Dict, List, Optional, Tuple, cast

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import translate_services
    from mypy_imports import translation_models


translate_services = models.Registry.import_translate_services()

(translation_models,) = models.Registry.import_models([
    models.Names.TRANSLATION])


def get_and_cache_machine_translation(
    source_language_code: str,
    target_language_code: str,
    source_text: str
) -> Optional[str]:
    """Gets a machine translation of the source text for the given source and
    target languages. If no translation exists in the datastore for the given
    input, generates a machine translation using cloud_translate_services and
    saves the translation to the datastore.

    Args:
        source_language_code: str. The language code for the source text
            language. Must be different from target_language_code.
        target_language_code: str. The language code for the target
            translation language. Must be different from source_language_code.
        source_text: str. The untranslated source text.

    Returns:
        str|None. The translated text or None if no translation is found.
    """
    translation = translation_fetchers.get_machine_translation(
        source_language_code,
        target_language_code,
        source_text.strip()
    )
    if translation is not None:
        return translation.translated_text

    translated_text = None
    try:
        translated_text = translate_services.translate_text(
            source_text, source_language_code, target_language_code)
    # An error here indicates a valid, but not allowlisted language code, or an
    # error raised by the Google Cloud Translate API. The error is logged
    # instead of raised to provide an uninterrupted end user experience while
    # still providing error context on the back-end.
    except ValueError as e:
        logging.error(e)

    if translated_text is not None:
        translation_models.MachineTranslationModel.create(
            source_language_code,
            target_language_code,
            source_text,
            translated_text
        )

    return translated_text


def add_new_translation(
    entity_type: feconf.TranslatableEntityType,
    entity_id: str,
    entity_version: int,
    language_code: str,
    content_id: str,
    translated_content: translation_domain.TranslatedContent
) -> None:
    """Adds new translated content for the entity in the EntityTranslation
    model.

    Args:
        entity_type: TranslatableEntityType. The type of the entity.
        entity_id: str. The ID of the entity.
        entity_version: int. The version of the entity.
        language_code: str. The language code for the entity.
        content_id: str. The Id of the content.
        translated_content: TranslatedContent. The translated content object.
    """
    entity_translation = translation_fetchers.get_entity_translation(
        entity_type, entity_id, entity_version, language_code)
    entity_translation.translations[content_id] = translated_content
    entity_translation.validate()

    model = translation_models.EntityTranslationsModel.create_new(
        entity_type.value,
        entity_id,
        entity_version,
        language_code,
        entity_translation.to_dict()['translations']
    )
    model.update_timestamps()
    model.put()


def _apply_changes(
    entity_translation: translation_domain.EntityTranslation,
    translation_changes: List[exp_domain.ExplorationChange]
) -> None:
    """Applies the changes to the entity_translation object.

    Args:
        entity_translation: EntityTranslation. The entity translation object.
        translation_changes: list(ExplorationChange). The list of changes to be
            applied.

    Raises:
        Exception. Invalid translation change cmd.
    """
    for change in translation_changes:
        if change.cmd == exp_domain.CMD_EDIT_TRANSLATION:
            # Here we use cast because we are narrowing down the type of
            # 'change' from exp_domain.ExplorationChange to specific type of
            # change EditTranslationsChangesCmd.
            change = cast(
                exp_domain.EditTranslationsChangesCmd,
                change
            )

            if entity_translation.language_code != change.language_code:
                continue
            entity_translation.translations[change.content_id] = (
                translation_domain.TranslatedContent.from_dict(
                    change.translation
                )
            )
        elif change.cmd == exp_domain.CMD_REMOVE_TRANSLATIONS:
            entity_translation.remove_translations([change.content_id])
        elif change.cmd == exp_domain.CMD_MARK_TRANSLATIONS_NEEDS_UPDATE:
            entity_translation.mark_translations_needs_update(
                [change.content_id])
        elif change.cmd == (
            exp_domain.CMD_MARK_TRANSLATION_NEEDS_UPDATE_FOR_LANGUAGE):
            if entity_translation.language_code == change.language_code:
                entity_translation.mark_translations_needs_update(
                    [change.content_id])
        else:
            raise Exception(
                'Invalid translation change cmd: %s' % change.cmd)

    entity_translation.validate()


def compute_translation_related_change(
    updated_exploration: exp_domain.Exploration,
    translation_changes: List[exp_domain.ExplorationChange]
) -> Tuple[List[translation_models.EntityTranslationsModel], Dict[str, int]]:
    """Create new EntityTranslation models corresponding to translation related
    changes.

    Args:
        updated_exploration: Exploration. The updated exploration object.
        translation_changes: list(ExplorationChange). The list of changes to be
            applied.

    Returns:
        Tuple(list(EntityTranslationsModel), dict(str, int)). A tuple containing
        list of new EntityTranslationsModel and a dict with count of translated
        contents as value and the languages as key.
    """
    language_code_to_entity_translation = {
        entity_translation.language_code: entity_translation
        for entity_translation in (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION,
                updated_exploration.id,
                updated_exploration.version - 1
            )
        )
    }

    # Create EntityTranslation object for new languages.
    for change in translation_changes:
        if change.cmd != exp_domain.CMD_EDIT_TRANSLATION:
            continue
        if change.language_code in language_code_to_entity_translation:
            continue

        language_code_to_entity_translation[change.language_code] = (
            translation_domain.EntityTranslation.create_empty(
                feconf.TranslatableEntityType.EXPLORATION,
                updated_exploration.id,
                change.language_code,
                updated_exploration.version - 1
            )
        )

    # Create entity_translation models for all languages.
    new_translation_models = []
    translation_counts = {}
    for entity_translation in language_code_to_entity_translation.values():
        _apply_changes(entity_translation, translation_changes)

        translation_counts[entity_translation.language_code] = (
            updated_exploration.get_translation_count(entity_translation))

        new_translation_models.append(
            translation_models.EntityTranslationsModel.create_new(
                entity_translation.entity_type,
                entity_translation.entity_id,
                entity_translation.entity_version + 1,
                entity_translation.language_code,
                entity_translation.to_dict()['translations']
            )
        )
    return new_translation_models, translation_counts


def compute_translation_related_changes_upon_revert(
    reverted_exploration: exp_domain.Exploration,
    revert_to_version: int
) -> Tuple[List[translation_models.EntityTranslationsModel], Dict[str, int]]:
    """Create new EntityTranslation models corresponding to translation related
    changes upon exploration revert.

    Args:
        reverted_exploration: Exploration. The reverted explortaion. Note that
            this object should already reflect the revert.
        revert_to_version: int. The version of the exploration to which the
            exploration is getting reverted to.

    Returns:
        Tuple(list(EntityTranslationsModel), dict(str, int)). A tuple containing
        list of new EntityTranslationsModel and a dict with count of translated
        contents as value and the languages as key.
    """
    language_code_to_entity_translation = {
        entity_translation.language_code: entity_translation
        for entity_translation in (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION,
                reverted_exploration.id,
                revert_to_version
            )
        )
    }

    # Create entity_translation models for all languages.
    new_translation_models = []
    translation_counts = {}
    for entity_translation in language_code_to_entity_translation.values():

        translation_counts[entity_translation.language_code] = (
            reverted_exploration.get_translation_count(entity_translation))

        new_translation_models.append(
            translation_models.EntityTranslationsModel.create_new(
                entity_translation.entity_type,
                entity_translation.entity_id,
                reverted_exploration.version,
                entity_translation.language_code,
                entity_translation.to_dict()['translations']
            )
        )
    return new_translation_models, translation_counts


def get_languages_with_complete_translation(
    exploration: exp_domain.Exploration
) -> List[str]:
    """Returns a list of language codes in which the exploration translation
    is 100%.

    Returns:
        list(str). A list of language codes in which the translation for the
        exploration is complete i.e, 100%.
    """
    content_count = exploration.get_content_count()
    language_code_list = []
    for language_code, count in get_translation_counts(
        feconf.TranslatableEntityType.EXPLORATION, exploration
    ).items():
        if count == content_count:
            language_code_list.append(language_code)

    return language_code_list


def get_displayable_translation_languages(
    entity_type: feconf.TranslatableEntityType,
    entity: exp_domain.Exploration
) -> List[str]:
    """Returns a list of language codes in which the exploration translation
    is 100%.

    Returns:
        list(str). A list of language codes in which the translation for the
        exploration is complete i.e, 100%.
    """
    language_code_list = []
    entity_translations = (
        translation_fetchers.get_all_entity_translations_for_entity(
            entity_type, entity.id, entity.version))

    for entity_translation in entity_translations:
        if entity.are_translations_displayable(entity_translation):
            language_code_list.append(entity_translation.language_code)

    return language_code_list


def get_translation_counts(
    entity_type: feconf.TranslatableEntityType,
    entity: exp_domain.Exploration
) -> Dict[str, int]:
    """Returns a dict representing the number of translations available in a
    language for which there exists at least one translation in the
    exploration.

    Returns:
        dict(str, int). A dict with language code as a key and number of
        translation available in that language as the value.
    """
    entity_translations = (
        translation_fetchers.get_all_entity_translations_for_entity(
            entity_type,
            entity.id,
            entity.version)
    )
    return {
        entity_translation.language_code: entity.get_translation_count(
            entity_translation
        ) for entity_translation in entity_translations
    }


def get_translatable_text(
    exploration: exp_domain.Exploration, language_code: str
) -> Dict[str, Dict[str, translation_domain.TranslatableContent]]:
    """Returns all the contents which needs translation in the given
    language.

    Args:
        exploration: Exploration. The Exploration object.
        language_code: str. The language code in which translation is
            required.

    Returns:
        dict(str, list(TranslatableContent)). A dict with state names
        as keys and a list of TranslatableContent as values.
    """
    entity_translations = (
        translation_fetchers.get_entity_translation(
            feconf.TranslatableEntityType.EXPLORATION,
            exploration.id,
            exploration.version,
            language_code)
    )
    state_names_to_content_id_mapping = {}
    for state_name, state in exploration.states.items():
        state_names_to_content_id_mapping[state_name] = (
            state.get_all_contents_which_need_translations(
                entity_translations))

    return state_names_to_content_id_mapping
