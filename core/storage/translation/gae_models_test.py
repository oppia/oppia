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

"""Tests for MachineTranslation models."""

from __future__ import annotations

from core import feconf
from core.platform import models
from core.tests import test_utils

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, translation_models

(base_models, translation_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.TRANSLATION]
)


class EntityTranslationsModelTest(test_utils.GenericTestBase):
    """Unit tests for EntityTranslationsModel class."""

    def test_create_new_model(self) -> None:
        enitity_translation_model = (
            translation_models.EntityTranslationsModel.create_new(
                feconf.TranslatableEntityType.EXPLORATION.value,
                'exp_id',
                1,
                'hi',
                {
                    '123': {
                        'content_value': 'Hello world!',
                        'needs_update': False,
                        'content_format': 'html',
                    }
                },
            )
        )
        self.assertEqual(enitity_translation_model.entity_type, 'exploration')
        self.assertEqual(enitity_translation_model.entity_id, 'exp_id')
        self.assertEqual(enitity_translation_model.entity_version, 1)
        self.assertEqual(enitity_translation_model.language_code, 'hi')
        self.assertEqual(
            enitity_translation_model.translations['123']['content_value'],
            'Hello world!',
        )
        self.assertEqual(
            enitity_translation_model.translations['123']['needs_update'], False
        )

    def test_get_model_method_returns_correctly(self) -> None:
        translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id',
            1,
            'hi',
            {
                '123': {
                    'content_value': 'Hello world!',
                    'needs_update': False,
                    'content_format': 'html',
                }
            },
        ).put()
        enitity_translation_model = (
            translation_models.EntityTranslationsModel.get_model(
                feconf.TranslatableEntityType.EXPLORATION, 'exp_id', 1, 'hi'
            )
        )
        self.assertEqual(enitity_translation_model.entity_type, 'exploration')
        self.assertEqual(enitity_translation_model.entity_id, 'exp_id')
        self.assertEqual(enitity_translation_model.entity_version, 1)
        self.assertEqual(enitity_translation_model.language_code, 'hi')
        self.assertEqual(
            enitity_translation_model.translations['123']['content_value'],
            'Hello world!',
        )
        self.assertEqual(
            enitity_translation_model.translations['123']['needs_update'], False
        )

    def test_get_all_for_entity_returns_correctly(self) -> None:
        translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id',
            1,
            'en',
            {
                '123': {
                    'content_value': 'Hey I am Jhon.',
                    'needs_update': False,
                    'content_format': 'html',
                }
            },
        ).put()
        translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id2',
            2,
            'hi',
            {
                '123': {
                    'content_value': 'Hello world!',
                    'needs_update': False,
                    'content_format': 'html',
                }
            },
        ).put()
        translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id',
            1,
            'hi',
            {
                '123': {
                    'content_value': 'Hey I am Nikhil.',
                    'needs_update': False,
                    'content_format': 'html',
                }
            },
        ).put()

        enitity_translation_models = (
            translation_models.EntityTranslationsModel.get_all_for_entity(
                feconf.TranslatableEntityType.EXPLORATION, 'exp_id', 1
            )
        )
        self.assertEqual(len(enitity_translation_models), 2)

        enitity_translation_models = (
            translation_models.EntityTranslationsModel.get_all_for_entity(
                feconf.TranslatableEntityType.EXPLORATION, 'exp_id2', 2
            )
        )
        self.assertEqual(len(enitity_translation_models), 1)

    def test_get_export_policy_not_applicable(self) -> None:
        self.assertEqual(
            translation_models.EntityTranslationsModel.get_export_policy(),
            {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'entity_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'entity_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'entity_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'translations': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )

    def test_get_deletion_policy_not_applicable(self) -> None:
        self.assertEqual(
            translation_models.EntityTranslationsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE,
        )

    def test_get_model_association_to_user_not_corresponding_to_user(
        self,
    ) -> None:
        self.assertEqual(
            (
                translation_models.EntityTranslationsModel.get_model_association_to_user()
            ),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER,
        )

    def test_get_model_multi(self) -> None:
        """Test fetching multiple entity translations."""
        translation_1 = translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id1', 1, 'hi',
            {
                'content_1': {
                    'content_value': 'Translation 1',
                    'needs_update': False,
                    'content_format': 'html'
                }
            }
        )
        translation_1.put()

        translation_2 = translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id2', 1, 'hi',
            {
                'content_2': {
                    'content_value': 'Translation 2',
                    'needs_update': False,
                    'content_format': 'html'
                }
            }
        )
        translation_2.put()

        translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id1', 2, 'hi',
            {
                'content_1': {
                    'content_value': 'Updated Translation 1',
                    'needs_update': False,
                    'content_format': 'html'
                }
            }
        ).put()

        results = translation_models.EntityTranslationsModel.get_model_multi([
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': 'exp_id1',
                'entity_version': 1,
                'language_code': 'hi'
            },
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': 'exp_id1',
                'entity_version': 2,
                'language_code': 'hi'
            },
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': 'exp_id2',
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
        self.assertEqual(results[0].entity_id, 'exp_id1')
        self.assertEqual(results[0].entity_version, 1)
        self.assertEqual(
            results[0].translations['content_1']['content_value'],
            'Translation 1')

        self.assertIsNotNone(results[1])
        assert results[1] is not None
        self.assertEqual(results[1].entity_id, 'exp_id1')
        self.assertEqual(results[1].entity_version, 2)
        self.assertEqual(
            results[1].translations['content_1']['content_value'],
            'Updated Translation 1')

        self.assertIsNotNone(results[2])
        assert results[2] is not None
        self.assertEqual(results[2].entity_id, 'exp_id2')
        self.assertEqual(results[2].entity_version, 1)
        self.assertEqual(
            results[2].translations['content_2']['content_value'],
            'Translation 2')

        self.assertIsNone(results[3])

    def test_get_model_multi_with_enum_entity_type(self) -> None:
        translation = translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id', 1, 'en',
            {
                'content': {
                'content_value': 'Hello',
                'needs_update': False,
                'content_format': 'html'
                }
            }
        )
        translation.put()

        references: List[translation_models.EntityTranslationReferenceDict] = [{
            'entity_type': feconf.TranslatableEntityType.EXPLORATION,
            'entity_id': 'exp_id',
            'entity_version': 1,
            'language_code': 'en'
        }]

        entity_translations_models = (
            translation_models.EntityTranslationsModel.get_model_multi(
                references))
        assert entity_translations_models[0] is not None
        self.assertEqual(
            entity_translations_models[0].id, 'exploration-exp_id-1-en')

    def test_get_model_multi_with_invalid_language(self) -> None:
        """Test fetching translations with invalid language codes."""
        translation = translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id1', 1, 'hi',
            {
                'content': {
                    'content_value': 'Translation',
                    'needs_update': False,
                    'content_format': 'html'
                }
            }
        )
        translation.put()

        results = translation_models.EntityTranslationsModel.get_model_multi([
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': 'exp_id1',
                'entity_version': 1,
                'language_code': 'invalid' 
            }
        ])
        self.assertEqual(len(results), 1)
        self.assertIsNone(results[0])

    def test_get_model_multi_empty_list(self) -> None:
        """Test fetching with empty list of references."""
        results = translation_models.EntityTranslationsModel.get_model_multi([])
        self.assertEqual(results, [])

    def test_get_model_multi_different_entity_types(self) -> None:
        """Test fetching translations for different entity types."""
        exp_translation = translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id1', 1, 'hi',
            {
                'content_1': {
                    'content_value': 'Exploration Translation',
                    'needs_update': False,
                    'content_format': 'html'
                }
            }
        )
        exp_translation.put()

        translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.QUESTION.value,
            'question_id1', 1, 'hi',
            {
                'content_2': {
                    'content_value': 'Question Translation',
                    'needs_update': False,
                    'content_format': 'html'
                }
            }
        ).put()

        results = translation_models.EntityTranslationsModel.get_model_multi([
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': 'exp_id1',
                'entity_version': 1,
                'language_code': 'hi'
            },
            {
                'entity_type': feconf.TranslatableEntityType.QUESTION,
                'entity_id': 'question_id1',
                'entity_version': 1,
                'language_code': 'hi'
            }
        ])

        self.assertEqual(len(results), 2)
        self.assertIsNotNone(results[0])
        assert results[0] is not None
        self.assertEqual(results[0].entity_type, 'exploration')
        self.assertEqual(
            results[0].translations['content_1']['content_value'],
            'Exploration Translation')

        self.assertIsNotNone(results[1])
        assert results[1] is not None
        self.assertEqual(results[1].entity_type, 'question')
        self.assertEqual(
            results[1].translations['content_2']['content_value'],
            'Question Translation')

    def test_get_model_multi_with_same_entity_different_versions(self) -> None:
        """Test fetching multiple versions of the same entity."""
        translation_v1 = translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id1', 1, 'hi',
            {
                'content': {
                    'content_value': 'Original Translation',
                    'needs_update': False,
                    'content_format': 'html'
                }
            }
        )
        translation_v1.put()

        translation_v2 = translation_models.EntityTranslationsModel.create_new(
            feconf.TranslatableEntityType.EXPLORATION.value,
            'exp_id1', 2, 'hi',
            {
                'content': {
                    'content_value': 'Updated Translation',
                    'needs_update': False,
                    'content_format': 'html'
                }
            }
        )
        translation_v2.put()

        results = translation_models.EntityTranslationsModel.get_model_multi([
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': 'exp_id1',
                'entity_version': 1,
                'language_code': 'hi'
            },
            {
                'entity_type': feconf.TranslatableEntityType.EXPLORATION,
                'entity_id': 'exp_id1',
                'entity_version': 2,
                'language_code': 'hi'
            }
        ])

        self.assertEqual(len(results), 2)

        self.assertIsNotNone(results[0])
        assert results[0] is not None
        self.assertEqual(results[0].entity_version, 1)
        self.assertEqual(
            results[0].translations['content']['content_value'],
            'Original Translation')

        self.assertIsNotNone(results[1])
        assert results[1] is not None
        self.assertEqual(results[1].entity_version, 2)
        self.assertEqual(
            results[1].translations['content']['content_value'],
            'Updated Translation')


class MachineTranslationModelTests(test_utils.GenericTestBase):
    def test_create_model(self) -> None:
        model_id = translation_models.MachineTranslationModel.create(
            source_language_code='en',
            target_language_code='es',
            source_text='hello world',
            translated_text='hola mundo',
        )
        # Ruling out the possibility of None for mypy type checking.
        assert model_id is not None
        translation_model = translation_models.MachineTranslationModel.get(
            model_id
        )
        self.assertEqual(translation_model.translated_text, 'hola mundo')

    def test_create_model_with_same_source_target_language_codes_returns_none(
        self,
    ) -> None:
        model_id = translation_models.MachineTranslationModel.create(
            source_language_code='en',
            target_language_code='en',
            source_text='hello world',
            translated_text='hello world',
        )
        self.assertIsNone(model_id)

    def test_get_machine_translation_with_existing_translation(self) -> None:
        translation_models.MachineTranslationModel.create(
            source_language_code='en',
            target_language_code='es',
            source_text='hello world',
            translated_text='hola mundo',
        )
        translation = (
            translation_models.MachineTranslationModel.get_machine_translation(
                source_language_code='en',
                target_language_code='es',
                source_text='hello world',
            )
        )
        self.assertIsNotNone(translation)
        # Ruling out the possibility of None for mypy type checking.
        assert translation is not None
        self.assertEqual(translation.translated_text, 'hola mundo')

    def test_get_machine_translation_with_no_existing_translation_returns_none(
        self,
    ) -> None:
        translation = (
            translation_models.MachineTranslationModel.get_machine_translation(
                source_language_code='en',
                target_language_code='fr',
                source_text='hello world',
            )
        )
        self.assertIsNone(translation)

    def test_get_deletion_policy_not_applicable(self) -> None:
        self.assertEqual(
            translation_models.MachineTranslationModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE,
        )

    def test_get_model_association_to_user_not_corresponding_to_user(
        self,
    ) -> None:
        self.assertEqual(
            (
                translation_models.MachineTranslationModel.get_model_association_to_user()
            ),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER,
        )

    def test_get_export_policy_not_applicable(self) -> None:
        self.assertEqual(
            translation_models.MachineTranslationModel.get_export_policy(),
            {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'hashed_source_text': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'source_text': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'source_language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'target_language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'translated_text': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            },
        )
