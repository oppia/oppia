# coding: utf-8
#
# Copyright 202 The Oppia Authors. All Rights Reserved.
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

from google.cloud import translate_v2 as translate

import utils

CLIENT = translate.Client()

def translate_text(text, source_language, target_language):
    """Translates text into the target language.

    Target must be an ISO 639-1 language code.
    See https://g.co/cloud/translate/v2/translate-reference#supported_languages
    """
    if (not utils.is_valid_language_code(source_language)):
        raise ValueError('invalid language code: %s' % source_language)
    if (not utils.is_valid_language_code(target_language)):
        raise ValueError('invalid language code: %s' % target_language)

    result = CLIENT.translate(text, target_language=target_language, source_language=source_language)
    translated_text = result.get('translatedText')
    return translated_text
