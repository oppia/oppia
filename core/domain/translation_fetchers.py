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

"""Functions for converting translation models into domain objects."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import translation_domain
from core.platform import models

(translation_models,) = models.Registry.import_models([
    models.NAMES.translation])


def get_translation_from_model(translation_model):
    """Returns a MachineTranslation object given a
    MachineTranslationModel loaded from the datastore.

    Args:
        translation_model: MachineTranslationModel. The
            MachineTranslationModel loaded from the datastore.

    Returns:
        MachineTranslation. A MachineTranslation object corresponding to
        the given MachineTranslationModel.
    """
    return translation_domain.MachineTranslation(
        translation_model.source_language_code,
        translation_model.target_language_code,
        translation_model.source_text,
        translation_model.translated_text)


def get_machine_translation(
        source_language_code, target_language_code, source_text):
    """Gets MachineTranslation by language codes and source text.
    Returns None if no translation exists for the given parameters.

    Args:
        source_language_code: str. The language code for the source text
            language. Must be different from target_language_code.
        target_language_code: str. The language code for the target translation
            language. Must be different from source_language_code.
        source_text: str. The untranslated source text.

    Returns:
        MachineTranslation|None. The MachineTranslation
        if a translation exists or None if no translation is found.
    """
    translation_model = (
        translation_models.MachineTranslationModel.get_machine_translation(
            source_language_code, target_language_code, source_text
        )
    )
    if translation_model is None:
        return None
    return get_translation_from_model(translation_model)
