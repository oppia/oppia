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

"""Tests for domain objects related to translations."""

from __future__ import annotations

from core import feconf
from core import utils
from core.domain import exp_domain
from core.domain import translation_domain
from core.tests import test_utils


class DummyTranslatableObjectWithTwoParams(
        translation_domain.BaseTranslatableObject):
    """A dummy translatable object with a translatable field and a
    TranslatableObject as its properties.
    """

    def __init__(
        self,
        param1: str,
        param2: DummyTranslatableObjectWithSingleParam
    ) -> None:
        self.param1 = param1
        self.param2 = param2

    def get_translatable_contents_collection(
        self,
        **kwargs: Dict[str, str]
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            'content_id_1',
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            translation_domain.ContentType.CONTENT,
            self.param1)
        translatable_contents_collection.add_fields_from_translatable_object(
            self.param2)
        return translatable_contents_collection


class DummyTranslatableObjectWithSingleParam(
        translation_domain.BaseTranslatableObject):
    """A dummy translatable object with a translatable field as its
    properties.
    """

    def __init__(
        self,
        param3: str
    ) -> None:
        self.param3 = param3

    def get_translatable_contents_collection(
        self,
        **kwargs: Dict[str, str]
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            'content_id_2',
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            translation_domain.ContentType.CONTENT,
            self.param3)
        return translatable_contents_collection


class DummyTranslatableObjectWithDuplicateContentIdForParams(
        translation_domain.BaseTranslatableObject):
    """A dummy translatable object with two translatable fields and on
    registering with same content_id an error is raised.
    """

    def __init__(
        self,
        param1: str,
        param2: str
    ) -> None:
        self.param1 = param1
        self.param2 = param2

    def get_translatable_contents_collection(
        self,
        **kwargs: Dict[str, str]
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            'content_id_2',
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            translation_domain.ContentType.CONTENT,
            self.param1)
        translatable_contents_collection.add_translatable_field(
            'content_id_2',
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            translation_domain.ContentType.CONTENT,
            self.param2)
        return translatable_contents_collection


class DummyTranslatableObjectWithoutRegisterMethod(
        translation_domain.BaseTranslatableObject):
    """A dummy translatable object without
    get_translatable_contents_collection() method should raise an exception.
    """

    def __init__(
        self,
        param1: str,
        param2: str
    ) -> None:
        self.param1 = param1
        self.param2 = param2


class DummyTranslatableObjectWithFourParams(
        translation_domain.BaseTranslatableObject):
    """A dummy translatable object with four translatable fields as its
    properties.
    """

    def __init__(
        self,
        param1: str,
        param2: str,
        param3: str,
        param4: str
    ) -> None:
        self.param1 = param1
        self.param2 = param2
        self.param3 = param3
        self.param4 = param4

    def get_translatable_contents_collection(
        self,
        **kwargs: Dict[str, str]
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            'content_id_1',
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            translation_domain.ContentType.HINT,
            self.param1)
        translatable_contents_collection.add_translatable_field(
            'content_id_2',
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            translation_domain.ContentType.DEFAULT_OUTCOME,
            self.param2)
        translatable_contents_collection.add_translatable_field(
            'content_id_3',
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            translation_domain.ContentType.CONTENT,
            self.param3)
        translatable_contents_collection.add_translatable_field(
            'content_id_4',
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            translation_domain.ContentType.CONTENT,
            self.param4)
        return translatable_contents_collection


class BaseTranslatableObjectUnitTest(test_utils.GenericTestBase):
    """Test class for BaseTranslatableObject."""

    def setUp(self) -> None:
        super().setUp()
        self.translatable_object1 = DummyTranslatableObjectWithTwoParams(
            'My name is jhon.', DummyTranslatableObjectWithSingleParam(
                'My name is jack.'))

    def test_get_all_translatable_content_returns_correct_items(self) -> None:
        expected_contents = [
            'My name is jhon.',
            'My name is jack.'
        ]
        translatable_contents = (
            self.translatable_object1.get_translatable_contents_collection()
            .content_id_to_translatable_content.values())

        self.assertItemsEqual(expected_contents, [
            translatable_content.content_value
            for translatable_content in translatable_contents
        ])

    def test_unregistered_translatable_object_raises_exception(self) -> None:
        translatable_object = DummyTranslatableObjectWithoutRegisterMethod(
            'My name is jack.', 'My name is jhon.')

        with self.assertRaisesRegex(
            Exception, 'Must be implemented in subclasses.'):
            translatable_object.get_translatable_contents_collection()

    def test_registering_duplicate_content_id_raises_exception(self) -> None:
        translatable_object = (
            DummyTranslatableObjectWithDuplicateContentIdForParams(
                'My name is jack.', 'My name is jhon.')
        )

        with self.assertRaisesRegex(
            Exception,
            'Content_id content_id_2 already exists in the '
            'TranslatableContentsCollection.'):
            translatable_object.get_translatable_contents_collection()

    def test_get_all_contents_which_need_translations(self) -> None:
        translation_dict = {
            'content_id_3': translation_domain.TranslatedContent(
                'My name is Nikhil.', 'html', True)
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict)

        translatable_object = DummyTranslatableObjectWithFourParams(
            'My name is jack.', 'My name is jhon.', 'My name is Nikhil.', '')
        contents_which_need_translation = (
            translatable_object.get_all_contents_which_need_translations(
                entity_translations).values())

        expected_list_of_contents_which_need_translataion = [
            'My name is jack.',
            'My name is jhon.',
            'My name is Nikhil.'
        ]
        list_of_contents_which_need_translataion = [
            translatable_content.content_value
            for translatable_content in contents_which_need_translation
        ]
        self.assertItemsEqual(
            expected_list_of_contents_which_need_translataion,
            list_of_contents_which_need_translataion)


class EntityTranslationsUnitTests(test_utils.GenericTestBase):
    """Test class for EntityTranslation."""

    def test_creation_of_object(self) -> None:
        translation_dict = {
            'content_id_1': translation_domain.TranslatedContent(
                'My name is Nikhil.', 'html', False)
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict)

        self.assertEqual(entity_translations.entity_id, 'exp_id')
        self.assertEqual(entity_translations.entity_type, 'exploration')
        self.assertEqual(entity_translations.entity_version, 1)
        self.assertEqual(entity_translations.language_code, 'en')
        self.assertEqual(
            entity_translations.translations['content_id_1'].content_value,
            'My name is Nikhil.')
        self.assertEqual(
            entity_translations.translations['content_id_1'].needs_update,
            False)


class TranslatableContentUnitTests(test_utils.GenericTestBase):
    """Test class for TranslatableContent."""

    def test_creation_of_object(self) -> None:
        translatable_content = translation_domain.TranslatableContent(
            'content_id_1',
            translation_domain.ContentType.CONTENT,
            translation_domain.TranslatableContentFormat.HTML,
            'My name is Jhon.',
        )

        self.assertEqual(translatable_content.content_id, 'content_id_1')
        self.assertEqual(translatable_content.content_value, 'My name is Jhon.')

        self.assertEqual(
            translatable_content.content_format,
            translation_domain.TranslatableContentFormat.HTML)
        self.assertEqual(
            translatable_content.content_type,
            translation_domain.ContentType.CONTENT)

    def test_to_dict_method_of_translatable_content_class(self) -> None:
        translatable_content_dict = {
            'content_id': 'content_id_1',
            'content_value': 'My name is Jhon.',
            'content_type': 'content',
            'content_format': 'html',
            'interaction_id': None,
            'rule_type': None
        }
        translatable_content = translation_domain.TranslatableContent(
            'content_id_1',
            translation_domain.ContentType.CONTENT,
            translation_domain.TranslatableContentFormat.HTML,
            'My name is Jhon.'
        )

        self.assertEqual(
            translatable_content.to_dict(),
            translatable_content_dict
        )


class TranslatedContentUnitTests(test_utils.GenericTestBase):
    """Test class for TranslatedContent."""

    def test_creation_of_object(self) -> None:
        translated_content = translation_domain.TranslatedContent(
            'My name is Nikhil.',
            translation_domain.TranslatableContentFormat.HTML,
            False)

        self.assertEqual(translated_content.content_value, 'My name is Nikhil.')
        self.assertEqual(translated_content.needs_update, False)

    def test_to_dict_method_of_translated_content_class(self) -> None:
        translated_content = translation_domain.TranslatedContent(
            'My name is Nikhil.',
            translation_domain.TranslatableContentFormat.HTML,
            False)
        translated_content_dict = {
            'content_value': 'My name is Nikhil.',
            'content_format': 'html',
            'needs_update': False
        }

        self.assertEqual(translated_content.to_dict(), translated_content_dict)


class MachineTranslationTests(test_utils.GenericTestBase):
    """Tests for the MachineTranslation domain object."""

    translation: translation_domain.MachineTranslation

    def setUp(self) -> None:
        """Setup for MachineTranslation domain object tests."""
        super().setUp()
        self._init_translation()

    def _init_translation(self) -> None:
        """Initialize self.translation with valid default values."""
        self.translation = translation_domain.MachineTranslation(
            'en', 'es', 'hello world', 'hola mundo')
        self.translation.validate()

    def test_validate_with_invalid_source_language_code_raises(self) -> None:
        self.translation.source_language_code = 'ABC'
        expected_error_message = (
            'Invalid source language code: ABC')
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_message):
            self.translation.validate()

    def test_validate_with_invalid_target_language_code_raises(self) -> None:
        self.translation.target_language_code = 'ABC'
        expected_error_message = (
            'Invalid target language code: ABC')
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_message):
            self.translation.validate()

    def test_validate_with_same_source_target_language_codes_raises(
        self
    ) -> None:
        self.translation.target_language_code = 'en'
        self.translation.source_language_code = 'en'
        expected_error_message = (
            'Expected source_language_code to be different from '
            'target_language_code: "en" = "en"')
        with self.assertRaisesRegex(
            utils.ValidationError, expected_error_message):
            self.translation.validate()

    def test_to_dict(self) -> None:
        self.assertEqual(
            self.translation.to_dict(),
            {
                'source_language_code': 'en',
                'target_language_code': 'es',
                'source_text': 'hello world',
                'translated_text': 'hola mundo'
            }
        )
