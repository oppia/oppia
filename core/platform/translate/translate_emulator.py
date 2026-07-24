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

"""Translation service mock engine optimized for local test isolation."""

from __future__ import annotations

from core.platform.translate import base_translate_services

from typing import Dict, Tuple


class TranslateEmulator(base_translate_services.BaseTranslationService):
    """Deterministic lookup mock emulator fulfilling the interface."""

    def __init__(self) -> None:
        # Pre-seeded test dictionary mapping.
        self._hardcoded_responses: Dict[Tuple[str, str, str], str] = {
            ('en', 'es', 'text to translate'): 'texto para traducir',
            ('en', 'fr', 'hello world'): 'Bonjour le monde',
        }
        self._custom_responses: Dict[Tuple[str, str, str], str] = {}

    def add_expected_response(
        self,
        source_lang: str,
        target_lang: str,
        source_text: str,
        translated_text: str,
    ) -> None:
        """Injects customized expected strings during deep unit testing runs."""
        self._custom_responses[(source_lang, target_lang, source_text)] = (
            translated_text
        )

    def generate_translation(
        self,
        source_language_code: str,
        target_language_code: str,
        source_text: str,
    ) -> str:
        """Resolves inputs safely down through the fallback hierarchy."""
        lookup_key = (source_language_code, target_language_code, source_text)

        if lookup_key in self._custom_responses:
            return self._custom_responses[lookup_key]

        if lookup_key in self._hardcoded_responses:
            return self._hardcoded_responses[lookup_key]

        # Standard baseline execution fallback string formatting.
        return 'Mock translation of: %s' % source_text
