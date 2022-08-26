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

from core.domain import translation_fetchers
from core.platform import models

from typing import Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import translate_services
    from mypy_imports import translation_models


translate_services = models.Registry.import_translate_services()

(translation_models,) = models.Registry.import_models([
    models.NAMES.TRANSLATION])


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
