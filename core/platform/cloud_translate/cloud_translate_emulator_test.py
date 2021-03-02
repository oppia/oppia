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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform.cloud_translate import cloud_translate_emulator
from core.tests import test_utils


class CloudTranslateEmulatorUnitTests(test_utils.TestBase):
    """Tests for cloud_translate_services."""

    def setUp(self):
        super(CloudTranslateEmulatorUnitTests, self).setUp()
        self.emulator = cloud_translate_emulator.TranslateEmulator()

    def test_translate_text_with_invalid_source_language_raises_error(self):
        with self.assertRaisesRegexp(ValueError, 'invalid language code: invalid'):
            self.emulator.translate_text(
                'hello world', 'invalid', 'es')

    def test_translate_text_with_invalid_target_language_raises_error(self):
        with self.assertRaisesRegexp(ValueError, 'invalid language code: invalid'):
            self.emulator.translate_text(
                'hello world', 'en', 'invalid')

    def test_translate_text_with_valid_input_returns_expected_output(self):
        self.emulator.add_expected_response(
            ('en', 'es', 'hello world'), 'hola mundo')
        translated_text = self.emulator.translate_text(
            'hello world', 'en', 'es')
        self.assertEquals('hola mundo', translated_text)

    def test_translate_text_without_translation_returns_empty_string(self):
      translated_text = self.emulator.translate_text('some text', 'en', 'es')
      self.assertEquals('', translated_text)
