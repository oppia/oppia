# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for the base translation service."""

from __future__ import annotations

from core.platform.translate import base_translate_services
from core.tests import test_utils


class ConcreteTranslationService(
    base_translate_services.BaseTranslationService
):
    """Concrete implementation of BaseTranslationService for testing."""

    def generate_translation(
        self,
        source_language_code: str,
        target_language_code: str,
        source_text: str,
    ) -> str:
        return 'translated: %s' % source_text


class BaseTranslationServiceTests(test_utils.GenericTestBase):
    """Tests for the BaseTranslationService abstract base class."""

    def test_cannot_instantiate_abstract_class_directly(self) -> None:
        try:
            base_translate_services.BaseTranslationService()  # type: ignore[abstract]
            raise AssertionError('Expected TypeError was not raised.')
        except TypeError:
            pass

    def test_concrete_subclass_can_be_instantiated(self) -> None:
        service = ConcreteTranslationService()
        self.assertIsInstance(
            service, base_translate_services.BaseTranslationService
        )

    def test_generate_translation_returns_string(self) -> None:
        service = ConcreteTranslationService()
        result = service.generate_translation('en', 'es', 'hello')
        self.assertIsInstance(result, str)

    def test_generate_translation_uses_source_text(self) -> None:
        service = ConcreteTranslationService()
        result = service.generate_translation('en', 'es', 'hello')
        self.assertEqual(result, 'translated: hello')

    def test_subclass_missing_generate_translation_raises_type_error(
        self,
    ) -> None:
        class IncompleteTranslationService(
            base_translate_services.BaseTranslationService
        ):
            pass

        try:
            IncompleteTranslationService()  # type: ignore[abstract]
            raise AssertionError('Expected TypeError was not raised.')
        except TypeError:
            pass
