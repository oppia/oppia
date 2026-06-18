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

    def setUp(self) -> None:
        super().setUp()
        self.service = ConcreteTranslationService()

    def test_concrete_subclass_can_be_instantiated(self) -> None:
        self.assertIsInstance(
            self.service, base_translate_services.BaseTranslationService
        )

    def test_generate_translation_returns_string(self) -> None:
        result = self.service.generate_translation('en', 'es', 'hello')
        self.assertIsInstance(result, str)

    def test_generate_translation_uses_source_text(self) -> None:
        result = self.service.generate_translation('en', 'es', 'hello')
        self.assertEqual(result, 'translated: hello')
