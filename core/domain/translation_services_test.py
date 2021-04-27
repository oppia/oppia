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

"""Tests for translation service functions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import translation_fetchers
from core.domain import translation_services
from core.platform import models
from core.tests import test_utils

cloud_translate_services = models.Registry.import_cloud_translate_services()

(translation_models,) = models.Registry.import_models([
    models.NAMES.translation])


class TranslationServiceTests(test_utils.GenericTestBase):

    def setUp(self):
        super(TranslationServiceTests, self).setUp()
        translation_models.MachineTranslationModel.create(
            'en', 'es', 'text to translate', 'texto para traducir')

    def test_get_machine_translation_with_same_source_and_target_language_code(
            self):
        translated_text = (
            translation_services.get_and_cache_machine_translation(
                'en', 'en', 'text to translate')
        )
        self.assertEqual(translated_text, 'text to translate')
        translation = translation_fetchers.get_machine_translation(
            'en', 'en', 'text to translate')
        self.assertIsNone(translation)

    def test_machine_translation_with_non_allowlisted_language_returns_none(
            self):
        translated_text = (
            translation_services.get_and_cache_machine_translation(
                'en', 'hi', 'text to translate')
        )
        self.assertIsNone(translated_text)
        translated_text = (
            translation_services.get_and_cache_machine_translation(
                'hi', 'en', 'text to translate')
        )
        self.assertIsNone(translated_text)
        # Ensure that no translation is cached when returning none (no
        # translation found).
        self.assertIsNone(
            translation_models.MachineTranslationModel.get_machine_translation(
                'en', 'hi', 'text to translated'
            )
        )
        self.assertIsNone(
            translation_models.MachineTranslationModel.get_machine_translation(
                'hi', 'en', 'text to translated'
            )
        )

    def test_get_machine_translation_checks_datastore_first(self):
        with self.swap_to_always_raise(
            cloud_translate_services.CLIENT,
            'translate',
            error=AssertionError):
            self.assertEqual(
                translation_services.get_and_cache_machine_translation(
                    'en', 'es', 'text to translate'),
                'texto para traducir'
            )

    def test_get_machine_translation_with_new_translation_saves_translation(
            self):
        translated_text = (
            translation_services.get_and_cache_machine_translation(
                'en', 'fr', 'hello world')
        )
        self.assertEqual(translated_text, 'Bonjour le monde')
        translation = translation_fetchers.get_machine_translation(
            'en', 'fr', 'hello world')
        self.assertIsNotNone(translation)
        self.assertEqual(translation.translated_text, 'Bonjour le monde')
