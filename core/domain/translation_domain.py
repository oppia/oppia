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

class MachineTranslatedText(python_utils.OBJECT):
    """Domain object for machine translation of exploration content."""

    def __init__(
            self, source_language_code, target_langage_code, origin_text,
            translated_text):
        """Initializes a MachineTranslatedText domain object.

        Args:
            source_language_code: str. The code that represents the language of
                the original text.
            target_langage_code: str. The code that represents the language of
                the translated text.
            origin_text: str. The original text to be translated.
            translated_text: str. The machine generated translation of the
                original text.
        """
        self.source_language_code = source_language_code
        self.target_langage_code = target_langage_code
        self.origin_text = origin_text
        self.translated_text = translated_text

    def validate(self):
        """Validates properties of the MachineTranslatedText.

        Raises:
            ValidationError. One or more attributes of the MachineTranslatedText
                are invalid.
        """
        # TODO: validate source_language_code
        # TODO: validate target_langage_code
        # TODO: validate origin_text
        # TODO: validate translated_text
