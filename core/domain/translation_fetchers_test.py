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

from core import feconf
from core.domain import translation_domain
from core.domain import translation_fetchers
from core.platform import models
from core.tests import test_utils


MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import translation_models


(translation_models,) = models.Registry.import_models([
    models.Names.TRANSLATION])


class MachineTranslationFetchersTests(test_utils.GenericTestBase):

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


class EntityTranslationFetchersTests(test_utils.GenericTestBase):

    def test_get_all_entity_translation_objects_for_entity_returns_correclty(
        self
    ) -> None:
        exp_id = 'exp1'

        entity_translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION, exp_id, 5
            )
        )
        self.assertEqual(len(entity_translations), 0)

        language_codes = ['hi', 'bn']
        for language_code in language_codes:
            translation_models.EntityTranslationsModel.create_new(
                'exploration', exp_id, 5, language_code, {}
            ).put()

        entity_translations = (
            translation_fetchers.get_all_entity_translations_for_entity(
                feconf.TranslatableEntityType.EXPLORATION, exp_id, 5
            )
        )
        self.assertEqual(len(entity_translations), 2)
        self.assertItemsEqual(
            [
                entity_translation.language_code
                for entity_translation in entity_translations
            ], language_codes
        )

    def test_get_entity_translation_returns_correctly(
        self
    ) -> None:
        exp_id = 'exp1'
        translation_models.EntityTranslationsModel.create_new(
            'exploration', exp_id, 5, 'hi', {}
        ).put()

        entity_translation = (
            translation_fetchers.get_entity_translation(
                feconf.TranslatableEntityType.EXPLORATION, exp_id, 5, 'hi'
            )
        )
        self.assertEqual(entity_translation.language_code, 'hi')

    def test_get_entity_translation_creates_empty_object(
        self
    ) -> None:
        exp_id = 'exp1'
        entity_translation = (
            translation_fetchers.get_entity_translation(
                feconf.TranslatableEntityType.EXPLORATION, exp_id, 5, 'hi'
            )
        )
        self.assertEqual(entity_translation.language_code, 'hi')
        self.assertEqual(entity_translation.translations, {})
