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

from core import utils
from core.domain import translation_domain
from core.tests import test_utils


class TranslatableObject1(translation_domain.BaseTranslatableObject):
    def __init__(
        self,
        param1: translation_domain.TranslatableContent,
        param2: TranslatableObject2
    ) -> None:
        self.param1 = param1
        self.param2 = param2

    def _register_all_translatable_fields(self) -> None:
        self._register_translatable_field(
            translation_domain.TRANSLATABLE_CONTENT_FORMAT_UNICODE_STRING,
            self.param1)
        self._register_translatable_field(
            translation_domain.TRANSLATABLE_CONTENT_FORMAT_OBJECT, self.param2)


class TranslatableObject2(translation_domain.BaseTranslatableObject):
    def __init__(
        self,
        param3: translation_domain.TranslatableContent
    ) -> None:
        self.param3 = param3

    def _register_all_translatable_fields(self) -> None:
        self._register_translatable_field(
            translation_domain.TRANSLATABLE_CONTENT_FORMAT_UNICODE_STRING,
            self.param3)

class BaseTranslatableObjectUnitTest(test_utils.GenericTestBase):
    def setUp(self):
        super(BaseTranslatableObjectUnitTest, self).setUp()
        self.translatable_content1 = (
            translation_domain.TranslatableContent.from_dict({
                'content_id': 'content_id_1',
                'content': 'My name is jhon.',
                'content_type': translation_domain.
                TRANSLATABLE_CONTENT_FORMAT_UNICODE_STRING,
            })
        )
        self.translatable_content2 = (
            translation_domain.TranslatableContent.from_dict({
                'content_id': 'content_id_2',
                'content': 'My name is jack.',
                'content_type': translation_domain.
                TRANSLATABLE_CONTENT_FORMAT_UNICODE_STRING,
            })
        )
        self.translated_object1 = TranslatableObject1(
            self.translatable_content1,
            TranslatableObject2(self.translatable_content2)
        )


    def test_get_all_translatable_content_returns_correct_items(self):
        expected_contents = [
            'My name is jhon.',
            'My name is jack.'
        ]
        translatable_contents = (
            self.translated_object1.get_translatable_fields())

        self.assertItemsEqual(expected_contents, [
            translatable_content.content
            for translatable_content in translatable_contents
        ])


    def test_mismatching_field_type_while_register_raise_exception(self):
        translatable_content3 = (
            translation_domain.TranslatableContent.create_new(
                translation_domain.TRANSLATABLE_CONTENT_FORMAT_HTML,
                'My name is jhon.'))
        self.translated_object1.param1 = translatable_content3
        with self.assertRaisesRegexp(
            Exception, 'Expected field type to be unicode but found html'):
            self.translated_object1.get_translatable_fields()


class MachineTranslationTests(test_utils.GenericTestBase):
    """Tests for the MachineTranslation domain object."""

    translation: translation_domain.MachineTranslation

    def setUp(self) -> None:
        """Setup for MachineTranslation domain object tests."""
        super(MachineTranslationTests, self).setUp()
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
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_message):
            self.translation.validate()

    def test_validate_with_invalid_target_language_code_raises(self) -> None:
        self.translation.target_language_code = 'ABC'
        expected_error_message = (
            'Invalid target language code: ABC')
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
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
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
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
