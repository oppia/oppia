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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import exp_fetchers
from core.domain import translation_fetchers
from core.platform import models

cloud_translate_services = models.Registry.import_cloud_translate_services()

(translation_models,) = models.Registry.import_models([
    models.NAMES.translation])


def get_machine_translation_for_content_id(
        exploration_id, state_name, content_id, target_language_code):
    """Gets a machine translation for the given exploration state content id,
    in the given language.

    Args:
        exploration_id: str. The id of the exploration being translated.
        state_name: str. The name of the state being translated.
        content_id: str. The content id of the state content being translated.
        target_language_code: str. The language code for the target
            translation language. Must be different from source_language_code.

    Returns:
        str. The translated text.
        None. No translation found.
    """
    exp = exp_fetchers.get_exploration_by_id(exploration_id, strict=False)
    if exp is None:
        return None
    state_names_to_content_id_mapping = exp.get_translatable_text(
        target_language_code)

    if state_name not in state_names_to_content_id_mapping:
        return None
    state = state_names_to_content_id_mapping[state_name]
    if content_id not in state:
        return None
    source_text = state[content_id]

    return get_machine_translation(
        exp.language_code, target_language_code, source_text)


def get_machine_translation(
        source_language_code, target_language_code, source_text):
    """Gets a machine translation of the source text for the given source and
    target languages.

    Args:
        source_language_code: str. The language code for the source text
            language. Must be different from target_language_code.
        target_language_code: str. The language code for the target
            translation language. Must be different from source_language_code.
        source_text: str. The untranslated source text.

    Raises:
        ValueError. Invalid language code.

    Returns:
        str. The translated text.
        None. No translation found.
    """

    translation = translation_fetchers.get_translation_for_text(
        source_language_code,
        target_language_code,
        source_text.strip()
    )
    if translation is not None:
        return translation.translated_text

    translated_text = cloud_translate_services.translate_text(
        source_text, source_language_code, target_language_code)

    translation_models.MachineTranslatedTextModel.create(
        source_language_code,
        target_language_code,
        source_text,
        translated_text
    )
    return translated_text
