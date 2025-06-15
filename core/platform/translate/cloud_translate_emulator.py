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

"""An emulator that mocks the core.platform.cloud_translate API. This emulator
models the Cloud Translate API.
"""

from __future__ import annotations

from core import utils


class CloudTranslateEmulator:
    """The emulator mocks the translate_text function from the Cloud Translate
    API. This emulator can be used in backend testing, or a local dev
    environment without access to the Cloud Translate API. Expected responses
    must be passed in before using this emulator for testing. See
    PREGENERATED_TRANSLATIONS below for some prepopulated responses.

    This class uses ISO 639-1 compliant language codes to specify languages.
    To learn more about ISO 639-1, see:
        https://www.w3schools.com/tags/ref_language_codes.asp
    """

    PREGENERATED_TRANSLATIONS = {
        ('en', 'pt', 'hello world'): 'Ol\xe1 Mundo',
        ('en', 'pt', 'CONTINUE'): 'PROSSEGUIR',
        ('en', 'es', 'Please continue.'): 'Por favor continua.',
        ('en', 'fr', 'CONTINUE'): 'CONTINUEZ',
        ('en', 'fr', 'Please continue.'): 'Continuez s&#39;il vous pla\xeet.',
        ('en', 'es', 'CONTINUE'): 'SEGUIR',
        ('en', 'zh', 'hello world'): '\u4f60\u597d\u4e16\u754c',
        ('en', 'es', 'Correct!'): '\xa1Correcto!',
        ('en', 'zh', 'Correct!'): '\u6b63\u786e\u7684\uff01',
        ('en', 'zh', 'CONTINUE'): '\u7ee7\u7eed',
        ('en', 'zh', 'Please continue.'): '\u8bf7\u7ee7\u7eed\u3002',
        ('en', 'fr', 'Correct!'): 'Correct!',
        ('en', 'pt', 'Correct!'): 'Correto!',
        ('en', 'es', 'hello world'): 'Hola Mundo',
        ('en', 'pt', 'Please continue.'): 'Por favor continue.',
        ('en', 'fr', 'hello world'): 'Bonjour le monde'
    }

    DEFAULT_RESPONSE = (
        'Default translation for emulator mode. (See core/platform/'
        'cloud_translate/cloud_translate_emulator.py for details)'
    )

    def __init__(self) -> None:
        """Initializes the emulator with pregenerated responses."""

        # Pre-generated translations for the following phrases:
        # ('hello world', 'CONTINUE', 'Please continue.', 'Correct!')
        self.expected_responses = self.PREGENERATED_TRANSLATIONS

    def translate(
            self,
            text: str,
            source_language_code: str,
            target_language_code: str
    ) -> str:
        """Returns the saved expected response for a given input. If no
        response exists for the given input, returns a default response.

        Args:
            text: str. The text to be translated.
            source_language_code: str. An allowlisted language code.
            target_language_code: str. An allowlisted language code.

        Raises:
            ValueError. Invalid source language code.
            ValueError. Invalid target language code.

        Returns:
            str. The translated text.
        """
        if not utils.is_valid_language_code(source_language_code):
            raise ValueError(
                'Invalid source language code: %s' % source_language_code)
        if not utils.is_valid_language_code(target_language_code):
            raise ValueError(
                'Invalid target language code: %s' % target_language_code)

        key = (source_language_code, target_language_code, text)
        return self.expected_responses.get(key, self.DEFAULT_RESPONSE)

    def add_expected_response(
            self,
            source_language_code: str,
            target_language_code: str,
            source_text: str,
            response: str
    ) -> None:
        """Adds an expected response for a given set of inputs.

        Args:
            source_language_code: str. An allowlisted language code.
            target_language_code: str. An allowlisted language code.
            source_text: str. The text to translate.
            response: str. The expected response for the given inputs.
        """
        inputs = (source_language_code, target_language_code, source_text)
        self.expected_responses[inputs] = response
