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

from core.platform.cloud_translate import cloud_translate_services
from core.tests import test_utils

class CloudTranslateServicesUnitTests(test_utils.TestBase):
    """Tests for cloud_translate_services."""

    def setUp(self):
        super(CloudTranslateServicesUnitTests, self).setUp()


    def test_translate_text_with_invalid_source_language_raises_error(self):
        with self.assertRaisesRegexp(ValueError, 'invalid language code: invalid'):
            cloud_translate_services.translate_text(
                'hello world', 'invalid', 'es')

    def test_translate_text_with_invalid_target_language_raises_error(self):
        with self.assertRaisesRegexp(ValueError, 'invalid language code: invalid'):
            cloud_translate_services.translate_text(
                'hello world', 'en', 'invalid')

    def test_translate_text_with_valid_input_calls_translate_api(self):
        self.mock_response = 'hola mundo'

        def mock_translate_call(text, source_language, target_language):
            return {
              'translatedText': self.mock_response
            }

        with self.swap(
            cloud_translate_services.CLIENT, 'translate', mock_translate_call):

            translated_text = cloud_translate_services.translate_text(
                'hello world', 'en', 'es')
            self.assertEqual(translated_text, 'hola mundo')
