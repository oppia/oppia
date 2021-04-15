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

"""Domain objects related to translations."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import python_utils
import utils


class MachineTranslatedText(python_utils.OBJECT):
    """Domain object for machine translation of exploration content."""

    def __init__(
            self, source_language_code, target_language_code, origin_text,
            translated_text):
        """Initializes a MachineTranslatedText domain object.

        Args:
            source_language_code: str. The code that represents the language of
                the original text.
            target_language_code: str. The code that represents the language of
                the translated text.
            origin_text: str. The original text to be translated.
            translated_text: str. The machine generated translation of the
                original text.
        """
        self.source_language_code = source_language_code
        self.target_language_code = target_language_code
        self.origin_text = origin_text
        self.translated_text = translated_text

    def validate(self):
        """Validates properties of the MachineTranslatedText.

        Raises:
            ValidationError. One or more attributes of the MachineTranslatedText
                are invalid.
        """
        if not isinstance(self.source_language_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected source_language_code to be a string, received %s' %
                self.source_language_code
            )
        # TODO(#12341): Tidy up this logic once we have a canonical list of
        # language codes.
        if not utils.is_supported_audio_language_code(
                self.source_language_code
            ) and not utils.is_valid_language_code(
                self.source_language_code
            ):
            raise utils.ValidationError(
                'Invalid source language code: %s' % self.source_language_code)

        if not isinstance(self.target_language_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected target_language_code to be a string, received %s' %
                self.target_language_code
            )
        # TODO(#12341): Tidy up this logic once we have a canonical list of
        # language codes.
        if not utils.is_supported_audio_language_code(
                self.target_language_code
            ) and not utils.is_valid_language_code(
                self.target_language_code
            ):
            raise utils.ValidationError(
                'Invalid target language code: %s' % self.target_language_code)

        if not isinstance(self.origin_text, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected origin_text to be a string, received %s' %
                self.origin_text
            )

        if not isinstance(self.translated_text, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected translated_text to be a string, received %s' %
                self.translated_text
            )

    def to_dict(self):
        """Converts the MachineTranslatedText domain instance into a dictionary
        form with its keys as the attributes of this class.

        Returns:
            dict. A dictionary containing the MachineTranslatedText class
            information in a dictionary form.
        """
        return {
            'source_language_code': self.source_language_code,
            'target_language_code': self.target_language_code,
            'origin_text': self.origin_text,
            'translated_text': self.translated_text
        }
