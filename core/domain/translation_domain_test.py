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

import re

from core import feconf
from core import utils
from core.domain import translation_domain
from core.tests import test_utils

from typing import Optional

from core.domain import translatable_object_registry  # pylint: disable=invalid-import-from # isort:skip


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
        **kwargs: Optional[str]
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            'content_id_1',
            translation_domain.ContentType.CONTENT,
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
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
        **kwargs: Optional[str]
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            'content_id_2',
            translation_domain.ContentType.CONTENT,
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
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
        **kwargs: Optional[str]
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            'content_id_2',
            translation_domain.ContentType.CONTENT,
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            self.param1)
        translatable_contents_collection.add_translatable_field(
            'content_id_2',
            translation_domain.ContentType.CONTENT,
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
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
        **kwargs: Optional[str]
    ) -> translation_domain.TranslatableContentsCollection:
        translatable_contents_collection = (
            translation_domain.TranslatableContentsCollection())

        translatable_contents_collection.add_translatable_field(
            'content_id_1',
            translation_domain.ContentType.CUSTOMIZATION_ARG,
            translation_domain.TranslatableContentFormat.HTML,
            self.param1)
        translatable_contents_collection.add_translatable_field(
            'content_id_2',
            translation_domain.ContentType.DEFAULT_OUTCOME,
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            self.param2)
        translatable_contents_collection.add_translatable_field(
            'content_id_3',
            translation_domain.ContentType.RULE,
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
            self.param3)
        translatable_contents_collection.add_translatable_field(
            'content_id_4',
            translation_domain.ContentType.CONTENT,
            translation_domain.TranslatableContentFormat.UNICODE_STRING,
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
                'My name is Nikhil.',
                translation_domain.TranslatableContentFormat.HTML,
                True)
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

    def test_get_translatable_content_ids(self) -> None:
        translatable_object = DummyTranslatableObjectWithFourParams(
            'My name is jack.', 'My name is jhon.', 'My name is Nikhil.', '')
        content_ids = (
            translatable_object.get_translatable_content_ids())

        self.assertItemsEqual(
            content_ids,
            ['content_id_1', 'content_id_2', 'content_id_3', 'content_id_4']
        )

    def test_are_translations_displayable_with_all_translations(self) -> None:
        translation_dict = {
            'content_id_2': translation_domain.TranslatedContent(
                'Translation.',
                translation_domain.TranslatableContentFormat.HTML,
                True),
            'content_id_3': translation_domain.TranslatedContent(
                'Translation.',
                translation_domain.TranslatableContentFormat.HTML,
                True),
            'content_id_4': translation_domain.TranslatedContent(
                'Translation.',
                translation_domain.TranslatableContentFormat.HTML,
                True),
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict)

        translatable_object = DummyTranslatableObjectWithFourParams(
            'Content', 'My name is jhon.', 'My name is Nikhil.', '')
        self.assertTrue(
            translatable_object.are_translations_displayable(
                entity_translations))

    def test_are_translations_displayable_without_rule_translation(
        self
    ) -> None:
        translation_dict = {
            'content_id_1': translation_domain.TranslatedContent(
                'Translation.',
                translation_domain.TranslatableContentFormat.HTML,
                True),
            'content_id_2': translation_domain.TranslatedContent(
                'Translation.',
                translation_domain.TranslatableContentFormat.HTML,
                True),
            'content_id_4': translation_domain.TranslatedContent(
                'Translation.',
                translation_domain.TranslatableContentFormat.HTML,
                True),
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict)

        translatable_object = DummyTranslatableObjectWithFourParams(
            'Content', 'My name is jhon.', 'My name is Nikhil.', 'Content')
        self.assertFalse(
            translatable_object.are_translations_displayable(
                entity_translations))

    def test_are_translations_displayable_without_min_translation(
        self
    ) -> None:
        translation_dict = {
            'content_id_2': translation_domain.TranslatedContent(
                'Translation.',
                translation_domain.TranslatableContentFormat.HTML,
                True),
            'content_id_4': translation_domain.TranslatedContent(
                'Translation.',
                translation_domain.TranslatableContentFormat.HTML,
                True),
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict)
        min_value_swap = self.swap(
            feconf,
            'MIN_ALLOWED_MISSING_OR_UPDATE_NEEDED_WRITTEN_TRANSLATIONS',
            1)
        translatable_object = DummyTranslatableObjectWithFourParams(
            'Content', 'My name is jhon.', 'My name is Nikhil.', 'Content')
        with min_value_swap:
            self.assertFalse(
                translatable_object.are_translations_displayable(
                    entity_translations))

    def test_get_content_count(self) -> None:
        translatable_object = DummyTranslatableObjectWithFourParams(
            'My name is jack.',
            'My name is jhon.',
            'My name is Nikhil.',
            'Content'
        )

        self.assertEqual(translatable_object.get_content_count(), 4)

    def test_get_all_html_content_strings(self) -> None:
        translatable_object = DummyTranslatableObjectWithFourParams(
            '<p>HTML content</p>', 'My name is jhon.', 'My name is Nikhil.', '')
        html_contents = translatable_object.get_all_html_content_strings()

        self.assertItemsEqual(html_contents, ['<p>HTML content</p>'])

    def test_validate_translatable_contents_raise_error(self) -> None:
        translatable_object = DummyTranslatableObjectWithFourParams(
            '<p>HTML content</p>', 'My name is jhon.', 'My name is Nikhil.', '')

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected all content id indexes to be less than'
        ):
            translatable_object.validate_translatable_contents(2)


class EntityTranslationsUnitTests(test_utils.GenericTestBase):
    """Test class for EntityTranslation."""

    def test_creation_of_object(self) -> None:
        translation_dict = {
            'content_id_1': translation_domain.TranslatedContent(
                'My name is Nikhil.',
                translation_domain.TranslatableContentFormat.HTML,
                False)
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

    def test_validate_entity_type(self) -> None:
        translation_dict = {
            'content_id_1': translation_domain.TranslatedContent(
                'My name is Nikhil.',
                translation_domain.TranslatableContentFormat.HTML,
                False)
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict
        )

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            utils.ValidationError,
            'entity_type must be a string'
        ):
            entity_translations.entity_type = 123  # type: ignore[assignment]
            entity_translations.validate()

    def test_validate_entity_id(self) -> None:
        translation_dict = {
            'content_id_1': translation_domain.TranslatedContent(
                'My name is Nikhil.',
                translation_domain.TranslatableContentFormat.HTML,
                False)
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict
        )

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            utils.ValidationError,
            'entity_id must be a string'
        ):
            entity_translations.entity_id = 123  # type: ignore[assignment]
            entity_translations.validate()

    def test_validate_language_code(self) -> None:
        translation_dict = {
            'content_id_1': translation_domain.TranslatedContent(
                'My name is Nikhil.',
                translation_domain.TranslatableContentFormat.HTML,
                False)
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict
        )

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            utils.ValidationError,
            'language_code must be a string'
        ):
            entity_translations.language_code = 123  # type: ignore[assignment]
            entity_translations.validate()

    def test_validate_entity_version(self) -> None:
        translation_dict = {
            'content_id_1': translation_domain.TranslatedContent(
                'My name is Nikhil.',
                translation_domain.TranslatableContentFormat.HTML,
                False)
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict
        )

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            utils.ValidationError,
            'entity_version must be an int'
        ):
            entity_translations.entity_version = '123'  # type: ignore[assignment]
            entity_translations.validate()

    def test_validate_content_id(self) -> None:
        translation_dict = {
            'content_id_1': translation_domain.TranslatedContent(
                'My name is Nikhil.',
                translation_domain.TranslatableContentFormat.HTML,
                False)
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict
        )

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            utils.ValidationError,
            'content_id must be a string'
        ):
            entity_translations.translations[1] = (   # type: ignore[index]
                translation_domain.TranslatedContent(
                    'My name is Nikhil.',
                    translation_domain.TranslatableContentFormat.HTML,
                    False
                )
            )
            entity_translations.validate()

    def test_validate_needs_update(self) -> None:
        translation_dict = {
            'content_id_1': translation_domain.TranslatedContent(
                'My name is Nikhil.',
                translation_domain.TranslatableContentFormat.HTML,
                False)
        }
        entity_translations = translation_domain.EntityTranslation(
            'exp_id', feconf.TranslatableEntityType.EXPLORATION, 1, 'en',
            translation_dict
        )

        # TODO(#13059): Here we use MyPy ignore because after we fully type
        # the codebase we plan to get rid of the tests that intentionally test
        # wrong inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            utils.ValidationError,
            'needs_update must be a bool'
        ):
            entity_translations.translations['content_id_1'].needs_update = 5  # type: ignore[assignment]
            entity_translations.validate()


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


class WrittenTranslationsDomainUnitTests(test_utils.GenericTestBase):
    """Test methods operating on written transcripts."""

    def test_data_formats_are_correct_and_complete(self) -> None:
        translatable_class_names_in_data_formats = sorted(
            translation_domain.WrittenTranslation.
            DATA_FORMAT_TO_TRANSLATABLE_OBJ_TYPE.values())
        self.assertEqual(
            translatable_class_names_in_data_formats,
            translatable_object_registry.Registry.get_all_class_names())

    def test_from_and_to_dict_works_correctly(self) -> None:
        written_translations_dict: (
            translation_domain.WrittenTranslationsDict
        ) = {
            'translations_mapping': {
                'content1': {
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello',
                        'needs_update': True
                    },
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Hey!',
                        'needs_update': False
                    },
                    'fr': {
                        'data_format': 'set_of_normalized_string',
                        'translation': ['test1', 'test2'],
                        'needs_update': False
                    },
                },
                'feedback_1': {
                    'hi': {
                        'data_format': 'html',
                        'translation': 'Testing!',
                        'needs_update': False
                    },
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    },
                    'fr': {
                        'data_format': 'set_of_normalized_string',
                        'translation': ['test1', 'test2'],
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = translation_domain.WrittenTranslations.from_dict(
            written_translations_dict)
        written_translations.validate(['content1', 'feedback_1'])
        self.assertEqual(
            written_translations.to_dict(), written_translations_dict)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_add_content_id_for_translation_with_invalid_content_id_raise_error(
        self
    ) -> None:
        written_translations = (
            translation_domain.WrittenTranslations.from_dict({
            'translations_mapping': {}
        }))
        invalid_content_id = 123
        with self.assertRaisesRegex(
            Exception, 'Expected content_id to be a string, received 123'):
            written_translations.add_content_id_for_translation(
                invalid_content_id)  # type: ignore[arg-type]

    def test_add_content_id_for_translation_with_existing_content_id_raise_error( # pylint: disable=line-too-long
        self
    ) -> None:
        written_translations_dict: translation_domain.WrittenTranslationsDict = {
            'translations_mapping': {
                'feedback_1': {
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = translation_domain.WrittenTranslations.from_dict(
            written_translations_dict)
        existing_content_id = 'feedback_1'
        with self.assertRaisesRegex(
            Exception, 'The content_id feedback_1 already exist.'):
            written_translations.add_content_id_for_translation(
                existing_content_id)

    def test_delete_content_id_for_translations_deletes_content_id(
        self
    ) -> None:
        old_written_translations_dict: (
            translation_domain.WrittenTranslationsDict
        ) = {
            'translations_mapping': {
                'content': {
                    'en': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = translation_domain.WrittenTranslations.from_dict(
            old_written_translations_dict)
        self.assertEqual(
            len(written_translations.translations_mapping.keys()), 1)

        written_translations.delete_content_id_for_translation('content')

        self.assertEqual(
            len(written_translations.translations_mapping.keys()), 0)

    def test_delete_content_id_for_translation_with_nonexisting_content_id_raise_error(  # pylint: disable=line-too-long
        self
    ) -> None:
        written_translations_dict: (
            translation_domain.WrittenTranslationsDict
        ) = {
            'translations_mapping': {
                'content': {}
            }
        }
        written_translations = translation_domain.WrittenTranslations.from_dict(
            written_translations_dict)
        nonexisting_content_id_to_delete = 'feedback_1'
        with self.assertRaisesRegex(
            Exception, 'The content_id feedback_1 does not exist.'):
            written_translations.delete_content_id_for_translation(
                nonexisting_content_id_to_delete)

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_delete_content_id_for_translation_with_invalid_content_id_raise_error(  # pylint: disable=line-too-long
        self
    ) -> None:
        written_translations = (
            translation_domain.WrittenTranslations.from_dict({
            'translations_mapping': {}
        }))
        invalid_content_id_to_delete = 123
        with self.assertRaisesRegex(
            Exception, 'Expected content_id to be a string, '):
            written_translations.delete_content_id_for_translation(
                invalid_content_id_to_delete)  # type: ignore[arg-type]

    def test_validation_with_invalid_content_id_raise_error(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        written_translations_dict: (
            translation_domain.WrittenTranslationsDict
        ) = {
            'translations_mapping': {
                123: {}  # type: ignore[dict-item]
            }
        }

        written_translations = translation_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        with self.assertRaisesRegex(
            Exception, 'Expected content_id to be a string, '):
            written_translations.validate([123])  # type: ignore[list-item]

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_dict_language_code_to_written_translation(
        self
    ) -> None:
        written_translations = translation_domain.WrittenTranslations({
            'en': []  # type: ignore[dict-item]
        })

        with self.assertRaisesRegex(
            Exception,
            re.escape('Expected content_id value to be a dict, received []')):
            written_translations.validate(None)

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_with_invalid_type_language_code_raise_error(
        self
    ) -> None:
        written_translations_dict: (
            translation_domain.WrittenTranslationsDict
        ) = {
            'translations_mapping': {
                'content': {
                    123: {  # type: ignore[dict-item]
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = translation_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        with self.assertRaisesRegex(
            Exception, 'Expected language_code to be a string, '):
            written_translations.validate(['content'])

    def test_validation_with_unknown_language_code_raise_error(self) -> None:
        written_translations_dict: (
            translation_domain.WrittenTranslationsDict
        ) = {
            'translations_mapping': {
                'content': {
                    'ed': {
                        'data_format': 'html',
                        'translation': 'hello!',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = translation_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        with self.assertRaisesRegex(Exception, 'Invalid language_code: ed'):
            written_translations.validate(['content'])

    def test_validation_with_invalid_content_id_list(self) -> None:
        written_translations_dict: (
            translation_domain.WrittenTranslationsDict
        ) = {
            'translations_mapping': {
                'content': {
                    'en': {
                        'data_format': 'html',
                        'translation': '<p>hello!</p>',
                        'needs_update': False
                    }
                }
            }
        }

        written_translations = translation_domain.WrittenTranslations.from_dict(
            written_translations_dict)

        with self.assertRaisesRegex(
            Exception,
            re.escape(
                'Expected state written_translations to match the listed '
                'content ids [\'invalid_content\']')):
            written_translations.validate(['invalid_content'])

    def test_written_translation_validation(self) -> None:
        """Test validation of translation script."""
        written_translation = translation_domain.WrittenTranslation(
            'html', 'Test.', True)
        written_translation.validate()

        with self.assertRaisesRegex(
            AssertionError, 'Expected unicode HTML string, received 30'):
            with self.swap(written_translation, 'translation', 30):
                written_translation.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected needs_update to be a bool'
        ):
            with self.swap(written_translation, 'needs_update', 20):
                written_translation.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid data_format'
        ):
            with self.swap(written_translation, 'data_format', 'int'):
                written_translation.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid data_format'
        ):
            with self.swap(written_translation, 'data_format', 2):
                written_translation.validate()
