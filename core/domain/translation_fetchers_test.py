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

"""Tests for translation fetchers."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import translation_domain
from core.platform import models
from core.tests import test_utils

(translation_models,) = models.Registry.import_models([
    models.NAMES.translation])


class TranslationFetchersTests(test_utils.GenericTestBase):

    def test_get_translation_from_model(self):
        model_id = (
            translation_models.MachineTranslatedTextModel.create(
                'en', 'es', 'hello world', 'hola mundo')
        )
        model_instance = translation_models.MachineTranslatedTextModel.get(
            model_id)
        self.assertEqual(
            translation_domain.MachineTranslatedText(
                model_instance.source_language_code,
                model_instance.target_language_code,
                model_instance.source_text,
                model_instance.translated_text
            ).to_dict(),
            translation_domain.MachineTranslatedText(
                'en', 'es', 'hello world', 'hola mundo').to_dict()
        )
