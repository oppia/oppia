# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Provides translate_text functionality from the cloud translate emulator.
Responses are prepopulated, to add additional translations, use:
    CLIENT.add_expected_response(
        source_language_code, target_language_code, source_text, response)
See cloud_translate_emulator.py for more details"""

from __future__ import annotations

from core.platform.translate import cloud_translate_emulator
from core.platform.translate import cloud_translate_services

CLIENT = cloud_translate_emulator.CloudTranslateEmulator()


def translate_text(
        text: str, source_language: str, target_language: str
) -> str:
    """Translates text into the target language.

    For more information on ISO 639-1 see:
        https://www.w3schools.com/tags/ref_language_codes.asp

    Args:
        text: str. The text to be translated.
        source_language: str. An allowlisted ISO 639-1 language code.
        target_language: str. An allowlisted ISO 639-1 language code.

    Raises:
        ValueError. Invalid source language code.
        ValueError. Invalid target language code.

    Returns:
        str. The translated text.
    """
    if source_language not in cloud_translate_services.LANGUAGE_CODE_ALLOWLIST:
        raise ValueError('Invalid source language code: %s' % source_language)
    if target_language not in cloud_translate_services.LANGUAGE_CODE_ALLOWLIST:
        raise ValueError('Invalid target language code: %s' % target_language)
    if source_language == target_language:
        return text

    return CLIENT.translate(text, source_language, target_language)
