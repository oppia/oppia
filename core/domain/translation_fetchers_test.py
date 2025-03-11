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

    def test_get_multiple_entity_translations(self) -> None:
        """Test fetching multiple entity translations with specific versions."""
        exp_id_1 = 'exp1'
        exp_id_2 = 'exp2'

        translation_models.EntityTranslationsModel.create_new(
            'exploration', exp_id_1, 1, 'hi',
            {
                'content_1': {
                    'content_format': 'html',
                    'content_value': 'Translation 1',
                    'needs_update': False
                }
            }
        ).put()

        translation_models.EntityTranslationsModel.create_new(
            'exploration', exp_id_2, 1, 'hi',
            {
                'content_2': {
                    'content_format': 'html',
                    'content_value': 'Translation 2',
                    'needs_update': False
                }
            }
        ).put()

        translation_models.EntityTranslationsModel.create_new(
            'exploration', exp_id_1, 2, 'hi',
            {
                'content_1': {
                    'content_format': 'html',
                    'content_value': 'Updated Translation 1',
                    'needs_update': False
                }
            }
        ).put()

        results = translation_fetchers.get_multiple_entity_translations([
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': exp_id_1,
                'entity_version': 1,
                'language_code': 'hi'
            },
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': exp_id_1,
                'entity_version': 2,
                'language_code': 'hi'
            },
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': exp_id_2,
                'entity_version': 1,
                'language_code': 'hi'
            },
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': 'nonexistent',
                'entity_version': 1,
                'language_code': 'hi'
            }
        ])

        self.assertEqual(len(results), 4)

        self.assertIsNotNone(results[0])
        assert results[0] is not None
        self.assertEqual(results[0].entity_id, exp_id_1)
        self.assertEqual(results[0].entity_version, 1)
        translated_content = results[0].translations['content_1']
        self.assertEqual(translated_content.content_value, 'Translation 1')

        self.assertIsNotNone(results[1])
        assert results[1] is not None
        self.assertEqual(results[1].entity_id, exp_id_1)
        self.assertEqual(results[1].entity_version, 2)
        translated_content = results[1].translations['content_1']
        self.assertEqual(
            translated_content.content_value, 'Updated Translation 1')

        self.assertIsNotNone(results[2])
        assert results[2] is not None
        self.assertEqual(results[2].entity_id, exp_id_2)
        self.assertEqual(results[2].entity_version, 1)
        translated_content = results[2].translations['content_2']
        self.assertEqual(
            translated_content.content_value, 'Translation 2')

        self.assertIsNone(results[3])

    def test_get_multiple_entity_translations_different_entity_types(
        self
    ) -> None:
        """Test fetching translations for different entity types."""
        exp_id = 'exp1'
        question_id = 'question1'

        translation_models.EntityTranslationsModel.create_new(
            'exploration', exp_id, 1, 'hi',
            {
                'content_1': {
                    'content_format': 'html',
                    'content_value': 'Exploration Translation',
                    'needs_update': False
                }
            }
        ).put()

        translation_models.EntityTranslationsModel.create_new(
            'question', question_id, 1, 'hi',
            {
                'content_2': {
                    'content_format': 'html',
                    'content_value': 'Question Translation',
                    'needs_update': False
                }
            }
        ).put()

        results = translation_fetchers.get_multiple_entity_translations([
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': exp_id,
                'entity_version': 1,
                'language_code': 'hi'
            },
            {
                'entity_type': feconf.TranslatableEntityType.QUESTION,
                'entity_id': question_id,
                'entity_version': 1,
                'language_code': 'hi'
            }
        ])

        self.assertEqual(len(results), 2)

        self.assertIsNotNone(results[0])
        assert results[0] is not None
        self.assertEqual(results[0].entity_type, 'exploration')
        translated_content = results[0].translations['content_1']
        self.assertEqual(
            translated_content.content_value, 'Exploration Translation')

        self.assertIsNotNone(results[1])
        assert results[1] is not None
        self.assertEqual(results[1].entity_type, 'question')
        translated_content = results[1].translations['content_2']
        self.assertEqual(
            translated_content.content_value, 'Question Translation')

    def test_get_multiple_entity_translations_with_invalid_version(
        self
    ) -> None:
        """Test fetching translations with invalid version numbers."""
        exp_id = 'exp1'
        translation_models.EntityTranslationsModel.create_new(
            'exploration', exp_id, 1, 'hi',
            {
                'content': {
                    'content_format': 'html',
                    'content_value': 'Translation',
                    'needs_update': False
                }
            }
        ).put()

        results = translation_fetchers.get_multiple_entity_translations([
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': exp_id,
                'entity_version': 999,
                'language_code': 'hi'
            }
        ])
        self.assertEqual(len(results), 1)
        self.assertIsNone(results[0])

    def test_get_multiple_entity_translations_with_invalid_language(
        self
    ) -> None:
        """Test fetching translations with invalid language codes."""
        exp_id = 'exp1'
        translation_models.EntityTranslationsModel.create_new(
            'exploration', exp_id, 1, 'hi',
            {
                'content': {
                    'content_format': 'html',
                    'content_value': 'Translation',
                    'needs_update': False
                }
            }
        ).put()

        results = translation_fetchers.get_multiple_entity_translations([
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': exp_id,
                'entity_version': 1,
                'language_code': 'invalid' 
            }
        ])
        self.assertEqual(len(results), 1)
        self.assertIsNone(results[0])

    def test_get_multiple_entity_translations_empty_list(self) -> None:
        """Test fetching with empty list of references."""
        results = translation_fetchers.get_multiple_entity_translations([])
        self.assertEqual(results, [])
