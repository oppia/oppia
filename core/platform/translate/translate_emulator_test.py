# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for the translation emulator."""

from __future__ import annotations

from core.platform.translate import translate_emulator
from core.tests import test_utils


class TranslateEmulatorTests(test_utils.GenericTestBase):
    """Tests for the TranslateEmulator."""

    def setUp(self) -> None:
        super().setUp()
        self.emulator = translate_emulator.TranslateEmulator()

    def test_hardcoded_responses_are_returned(self) -> None:
        result = self.emulator.generate_translation(
            'en', 'es', 'text to translate'
        )
        self.assertEqual(result, 'texto para traducir')

    def test_fallback_string_returned_for_unknown_inputs(self) -> None:
        result = self.emulator.generate_translation(
            'en', 'hi', 'unknown sentence'
        )
        self.assertEqual(result, 'Mock translation of: unknown sentence')

    def test_custom_response_can_be_injected(self) -> None:
        initial_result = self.emulator.generate_translation(
            'en', 'fr', 'custom test'
        )
        self.assertEqual(initial_result, 'Mock translation of: custom test')

        self.emulator.add_expected_response(
            'en', 'fr', 'custom test', 'le test custom'
        )

        new_result = self.emulator.generate_translation(
            'en', 'fr', 'custom test'
        )
        self.assertEqual(new_result, 'le test custom')
