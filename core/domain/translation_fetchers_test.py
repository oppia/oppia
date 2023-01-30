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

from __future__ import annotations

from core.domain import translation_domain
from core.domain import translation_fetchers
from core.platform import models
from core.tests import test_utils


MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import translation_models


(translation_models,) = models.Registry.import_models([
    models.Names.TRANSLATION])


class TranslationFetchersTests(test_utils.GenericTestBase):

    def test_get_translation_from_model(self) -> None:
        model_id = (
            translation_models.MachineTranslationModel.create(
                'en', 'es', 'hello world', 'hola mundo')
        )
        # Ruling out the possibility of None for mypy type checking.
        assert model_id is not None
        model_instance = translation_models.MachineTranslationModel.get(
            model_id)
        # Ruling out the possibility of None for mypy type checking.
        assert model_instance is not None
        self.assertEqual(
            translation_fetchers.get_translation_from_model(
                model_instance).to_dict(),
            translation_domain.MachineTranslation(
                'en', 'es', 'hello world', 'hola mundo').to_dict()
        )

    def test_get_machine_translation_with_no_translation_returns_none(
        self
    ) -> None:
        translation = translation_fetchers.get_machine_translation(
            'en', 'es', 'untranslated_text')
        self.assertIsNone(translation)

    def test_get_machine_translation_for_cached_translation_returns_from_cache(
        self
    ) -> None:
        translation_models.MachineTranslationModel.create(
            'en', 'es', 'hello world', 'hola mundo')
        translation = translation_fetchers.get_machine_translation(
            'en', 'es', 'hello world'
        )
        # Ruling out the possibility of None for mypy type checking.
        assert translation is not None
        self.assertEqual(translation.translated_text, 'hola mundo')
