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

import collections
import logging

from core import feconf
from core.domain import opportunity_services
from core.domain import translation_fetchers
from core.platform import models

from typing import Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import translate_services
    from mypy_imports import translation_models


translate_services = models.Registry.import_translate_services()

(translation_models,) = models.Registry.import_models([
    models.NAMES.translation])


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
    entity_type,
    entity_id,
    entity_version,
    language_code,
    content_id,
    translated_content
):
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

def update_translation_related_change(
    exploration_id,
    exploration_version,
    content_ids_corresponding_translations_to_remove,
    content_ids_corresponding_translations_to_mark_needs_update,
    content_count
):
    old_translations = (
        translation_fetchers.get_all_entity_translations_for_entity(
            feconf.TranslatableEntityType.EXPLORATION,
            exploration_id,
            exploration_version
        ))

    # Create new_translation_models with updated id and entity version.
    new_translation_models = []
    translation_counts = {}
    for entity_translation in old_translations:
        entity_translation.remove_translations(
            content_ids_corresponding_translations_to_remove)
        entity_translation.mark_translations_needs_update(
            content_ids_corresponding_translations_to_mark_needs_update)

        translation_counts[entity_translation.language_code] = (
            entity_translation.get_translation_count())

        new_translation_models.append(
            translation_models.EntityTranslationsModel.create_new(
                entity_translation.entity_type,
                entity_translation.entity_id,
                entity_translation.entity_version + 1,
                entity_translation.language_code,
                entity_translation.to_dict()['translations']
            )
        )

    translation_models.EntityTranslationsModel.put_multi(
        new_translation_models)
    if opportunity_services.is_exploration_available_for_contribution(
            exploration_id):
        opportunity_services.update_opportunity_with_updated_exploration(
            exploration_id, content_count, translation_counts)


def get_languages_with_complete_translation(exploration):
    """Returns a list of language code in which the exploration translation
    is 100%.

    Returns:
        list(str). A list of language code in which the translation for the
        exploration is complete i.e, 100%.
    """
    content_count = exploration.get_content_count()
    language_code_list = []
    for language_code, count in get_translation_counts(
        feconf.TranslatableEntityType.EXPLORATION,
        exploration.id,
        exploration.version
    ).items():
        if count == content_count:
            language_code_list.append(language_code)

    return language_code_list


def get_displayable_translation_languages(entity_type, entity):
    """Returns a list of language code in which the exploration translation
    is 100%.

    Returns:
        list(str). A list of language code in which the translation for the
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


def get_translation_counts(entity_type, entity_id, entity_version):
    """Returns a dict representing the number of translations available in a
    language for which there exists at least one translation in the
    exploration.

    Returns:
        dict(str, int). A dict with language code as a key and number of
        translation available in that language as the value.
    """
    exploration_translation_counts = collections.defaultdict(int)
    entity_translations = (
        translation_fetchers.get_all_entity_translations_for_entity(
            entity_type,
            entity_id,
            entity_version)
    )
    for entity_translation in entity_translations:
        lang_code = entity_translation.language_code
        translation_count_in_a_lang_code = (
            len(entity_translation.translations.keys()))

        exploration_translation_counts[lang_code] += (
            translation_count_in_a_lang_code)

    return dict(exploration_translation_counts)


def get_translatable_text(exploration, language_code):
        """Returns all the contents which needs translation in the given
        language.

        Args:
            exp_id: Exploration. The Exploration object.
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
