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

from core.domain import translation_fetchers
from core.domain import translation_domain
from core.domain import opportunity_services
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


def update_translation_related_change(
    exploration_id,
    exploration_version,
    changes_related_to_translation,
    content_count
):
    old_translation_models = (
        translation_models.EntityTranslationsModel.get_all_for_entity(
            feconf.TranslatableEntityType.EXPLORATION,
            exploration_id,
            exploration_version)
    )
    # Create new_translation_models with updated id and entity version.
    new_translation_models = []
    translation_counts = {}
    for entity_translation_model in old_translation_models:
        new_translation_model = (
            translation_models.EntityTranslationsModel.create_new(
                entity_translation_model.entity_type,
                entity_translation_model.entity_id,
                entity_translation_model.exploration_version + 1,
                entity_translation_model.language_code,
                entity_translation_model.translations
            )
        )
        translation_counts[new_translation_model.language_code] = (
            len(new_translation_model.translation))
        for change in changes_related_to_translation:
            if change.content_id not in new_translation_model.translation:
                continue

            if change.cmd == exp_domain.CMD_MARK_TRANSLATION_NEEDS_UPDATE:
                new_translation_model.translations[
                    change.content_id].needs_update = True
            else:
                # CMD_REMOVE_TRANSLATION:
                del new_translation_model.translations[change.content_id]
            translation_counts[new_translation_model.language_code] -= 1

        new_translation_models.append(new_translation_model)

    translation_models.EntityTranslationsModel.put_multi(
        new_translation_models)
    if opportunity_services.is_exploration_available_for_contribution(
            exploration_id):
        opportunity_services.update_opportunity_with_updated_exploration(
            exploration_id)


def get_languages_with_complete_translation(exploration):
    """Returns a list of language code in which the exploration translation
    is 100%.

    Returns:
        list(str). A list of language code in which the translation for the
        exploration is complete i.e, 100%.
    """
    content_count = get_content_count(exploration)
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
        if entity_translation.are_translations_displayable(entity_translation):
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


def get_content_count(base_translatable_object):
    """Returns the total number of distinct content fields available in the
    exploration which are user facing and can be translated into
    different languages.

    (The content field includes state content, feedback, hints, solutions.)

    Returns:
        int. The total number of distinct content fields available inside
        the exploration.
    """
    content_count = (
        len(
            base_translatable_object.get_all_contents_which_need_translations(
                translation_domain.EntityTranslation.create_empty(
                    entity_id='',
                    entity_type=feconf.TranslatableEntityType.EXPLORATION,
                    language_code='')
                )
        )
    )
    return content_count


def get_translatable_text(exploration, language_code):
        """Returns all the contents which needs translation in the given
        language.
        Args:
            exploration: Exploration. An instance of Exploration class.
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
        if entity_translations is None:
            entity_translations = (
                translation_domain.EntityTranslation.create_empty(
                    exploration.id,
                    feconf.TranslatableEntityType.EXPLORATION,
                    language_code
                )
            )
        state_names_to_content_id_mapping = {}
        for state_name, state in exploration.states.items():
            state_names_to_content_id_mapping[state_name] = (
                state.get_all_contents_which_need_translations(
                    entity_translations))

        return state_names_to_content_id_mapping

