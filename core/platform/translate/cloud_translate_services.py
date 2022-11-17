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

"""Provides translate_text functionality from Google Cloud Translate."""

from __future__ import annotations

from core.constants import constants

# To use cloud translate in a local dev environment, use
# cloud_translate_emulator.
from google import auth
from google.cloud import translate_v2 as translate

# The 'auth.default()' returns tuple of credentials and project ID. As we are
# only interested in credentials, we are using '[0]' to access it.
CLIENT = translate.Client(
    credentials=(
        auth.credentials.AnonymousCredentials()
        if constants.EMULATOR_MODE else auth.default()[0]))

# List of languages with adequate Google Translate accuracy.
LANGUAGE_CODE_ALLOWLIST = ('en', 'es', 'fr', 'zh', 'pt')


def translate_text(
        text: str, source_language: str, target_language: str
) -> str:
    """Translates text into the target language.

    This method uses ISO 639-1 compliant language codes to specify languages.
    To learn more about ISO 639-1, see:
        https://www.w3schools.com/tags/ref_language_codes.asp

    Args:
        text: str. The text to be translated. If text contains html tags, Cloud
            Translate only translates content between tags, leaving the tags
            themselves untouched.
        source_language: str. An allowlisted language code.
        target_language: str. An allowlisted language code.

    Raises:
        ValueError. Invalid source language code.
        ValueError. Invalid target language code.

    Returns:
        str. The translated text.
    """
    if source_language not in LANGUAGE_CODE_ALLOWLIST:
        raise ValueError('Invalid source language code: %s' % source_language)
    if target_language not in LANGUAGE_CODE_ALLOWLIST:
        raise ValueError('Invalid target language code: %s' % target_language)
    if source_language == target_language:
        return text

    result = (
        CLIENT.translate(
            text, target_language=target_language,
            source_language=source_language))
    # Letting mypy know that result is a dict.
    assert isinstance(result, dict)
    translated_text = result['translatedText']
    return translated_text
