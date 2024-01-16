# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for voiceover_lang_accent_constants.py"""

from __future__ import annotations

from core import voiceover_lang_accent_constants
from core.tests import test_utils


class VoiceoverLanguageAccentInfoListTests(test_utils.GenericTestBase):
    """Test to validate the information stored for language accent code."""

    def test_validate_all_auto_lang_accent_code_is_subset_of_master_list(
        self
    ) -> None:
        language_accent_master_list = []
        for accent_code_to_description in (
                voiceover_lang_accent_constants.
                VOICEOVER_LANGUAGE_CODES_AND_ACCENT_INFO_MASTER_LIST.values()):
            for lang_accent_code in accent_code_to_description.keys():
                language_accent_master_list.append(lang_accent_code)
        autogeneratable_langauge_accent_codes = list(
            voiceover_lang_accent_constants.
            AUTOGENERATABLE_VOICEOVER_LANGUAGE_ACCENT_INFO_LIST.keys())

        self.assertTrue(
            set(language_accent_master_list).issuperset(
                set(autogeneratable_langauge_accent_codes)))
