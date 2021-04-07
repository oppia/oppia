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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import utils

# To use cloud translate in a local dev environment, either use
# cloud_translate_emulator, or follow the setup instructions here:
# https://cloud.google.com/translate/docs/setup#python
# Once you have completed the "Using the service account key file in your
# environment" instructions, google.cloud.translate_v2 can be used by the local
# server with no further setup.
from google.cloud import translate_v2 as translate

CLIENT = translate.Client()

LANGUAGE_CODE_WHITELIST = ('en', 'es', 'fr', 'zh')

def translate_text(text, source_language, target_language):
    """Translates text into the target language.

    Args:
        text: str. The text to be translated.
        source_language: str. A whitelisted ISO 639-1 language code.
        target_language: str. A whitelisted ISO 639-1 language code.

    For more information on ISO 639-1 see:
    https://www.w3schools.com/tags/ref_language_codes.asp

    Returns:
        str. The translated text.
    """
    if source_language not in LANGUAGE_CODE_WHITELIST:
        raise ValueError('Invalid language code: %s' % source_language)
    if target_language not in LANGUAGE_CODE_WHITELIST:
        raise ValueError('Invalid language code: %s' % target_language)
    if source_language == target_language:
        return text

    result = CLIENT.translate(
        text, target_language=target_language, source_language=source_language)
    translated_text = result['translatedText']
    return translated_text
