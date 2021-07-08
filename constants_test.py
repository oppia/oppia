# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Tests for Constants object and cosntants.json file."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

import constants
from core.tests import test_utils
import feconf
import python_utils


class ConstantsTests(test_utils.GenericTestBase):

    def test_constants_file_is_existing(self):
        # type: () -> None
        """Test if the constants file is existing."""
        self.assertTrue(os.path.isfile(os.path.join(
            'assets', 'constants.ts')))

    def test_constants_file_contains_valid_json(self):
        # type: () -> None
        """Test if the constants file is valid json file."""
        with python_utils.open_file( # type: ignore[no-untyped-call]
            os.path.join('assets', 'constants.ts'), 'r') as f:
            json = constants.parse_json_from_js(f)
            self.assertTrue(isinstance(json, dict))
            self.assertEqual(json['TESTING_CONSTANT'], 'test')

    def test_difficulty_values_are_matched(self):
        # type: () -> None
        """Tests that the difficulty values and strings are matched in the
        various constants.
        """
        self.assertEqual(
            constants.constants.SKILL_DIFFICULTIES, [
                constants.constants.SKILL_DIFFICULTY_EASY,
                constants.constants.SKILL_DIFFICULTY_MEDIUM,
                constants.constants.SKILL_DIFFICULTY_HARD])
        self.assertItemsEqual(
            list(constants.constants.SKILL_DIFFICULTY_LABEL_TO_FLOAT.keys()),
            constants.constants.SKILL_DIFFICULTIES)
        self.assertEqual(
            constants.constants.DEFAULT_SKILL_DIFFICULTY,
            constants.constants.SKILL_DIFFICULTY_LABEL_TO_FLOAT[
                constants.constants.SKILL_DIFFICULTY_EASY])

    def test_constants_and_feconf_are_consistent(self):
        # type: () -> None
        """Test if constants that are related are consistent between feconf and
        constants.js.
        """
        self.assertIn(
            feconf.MIGRATION_BOT_USER_ID, constants.constants.SYSTEM_USER_IDS)
        self.assertIn(
            feconf.SYSTEM_COMMITTER_ID, constants.constants.SYSTEM_USER_IDS)
        self.assertEqual(len(constants.constants.SYSTEM_USER_IDS), 2)

    def test_all_comments_are_removed_from_json_text(self):
        # type: () -> None
        """Tests if comments are removed from json text."""
        dummy_constants_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'dummy_constants.js')
        with python_utils.open_file(dummy_constants_filepath, 'r') as f: # type: ignore[no-untyped-call]
            actual_text_without_comments = constants.remove_comments(f.read())
            expected_text_without_comments = (
                'var dummy_constants = {\n'
                '  "File_purpose": "This file is for testing comments '
                'removal",\n\n'
                '  "Dummy_constant": "Simple constant",\n\n'
                '  "Dummy_list_constant": ["List", "of", "dummy", '
                '"constants"],\n\n'
                '  "Dummy_constant_without_comment": '
                '"Dummy constant with no comment"\n'
                '};\n')

            self.assertEqual(
                actual_text_without_comments, expected_text_without_comments)

    def test_language_constants_are_in_sync(self):
        # type: () -> None
        """Test if SUPPORTED_CONTENT_LANGUAGES and SUPPORTED_AUDIO_LANGUAGES
        constants have any conflicting values.
        """
        # TODO(#11737): Remove this once language constants are consolidated.
        rtl_content_languages = [
            language[u'code']
            for language
            in constants.constants.SUPPORTED_CONTENT_LANGUAGES
            if language[u'direction'] == 'rtl'
        ]
        ltr_content_languages = [
            language[u'code']
            for language
            in constants.constants.SUPPORTED_CONTENT_LANGUAGES
            if language[u'direction'] == 'ltr'
        ]
        rtl_audio_languages = [
            language[u'id']
            for language
            in constants.constants.SUPPORTED_AUDIO_LANGUAGES
            if language[u'direction'] == 'rtl'
        ]
        ltr_audio_languages = [
            language[u'id']
            for language
            in constants.constants.SUPPORTED_AUDIO_LANGUAGES
            if language[u'direction'] == 'ltr'
        ]
        conflicts = list(
            set(rtl_content_languages) & set(ltr_audio_languages)
        ) + list(
            set(rtl_audio_languages) & set(ltr_content_languages)
        )
        self.assertFalse(conflicts)
