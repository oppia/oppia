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
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError, expected_error_message):
            self.translation.validate()

    def test_validate_with_invalid_target_language_code_raises(self) -> None:
        self.translation.target_language_code = 'ABC'
        expected_error_message = (
            'Invalid target language code: ABC')
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
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
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
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
