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

from __future__ import annotations

import os
import pkgutil
from unittest import mock

from core import constants, feconf
from core.tests import test_utils


class ConstantsTests(test_utils.GenericTestBase):

    def test_constants_file_is_existing(self) -> None:
        """Test if the constants file is existing."""
        self.assertTrue(os.path.isfile(os.path.join('assets', 'constants.ts')))

    def test_constants_file_contains_valid_json(self) -> None:
        """Test if the constants file is valid json file."""
        with open(
            os.path.join('assets', 'constants.ts'), 'r', encoding='utf-8'
        ) as f:
            json = constants.parse_json_from_ts(f.read())
            self.assertTrue(isinstance(json, dict))
            self.assertEqual(json['TESTING_CONSTANT'], 'test')

    def test_loading_non_existing_file_throws_error(self) -> None:
        """Test get_package_file_contents with imaginary file."""
        with mock.patch.object(
            pkgutil,
            'get_data',
            return_value=None,
        ):
            with self.assertRaisesRegex(
                FileNotFoundError,
                'No such file or directory: \'assets/non_exist.xy\'',
            ):
                constants.get_package_file_contents(
                    'assets', 'non_exist.xy', binary_mode=False
                )

    def test_loading_binary_file_in_package_returns_the_content(self) -> None:
        """Test get_package_file_contents with imaginary binary file."""
        with mock.patch.object(pkgutil, 'get_data', return_value='File data'):
            self.assertEqual(
                constants.get_package_file_contents(
                    'assets', 'non_exist.xy', binary_mode=True
                ),
                'File data',
            )

    def test_loading_binary_file_returns_the_content(self) -> None:
        """Test get_package_file_contents with binary file."""
        with open(
            os.path.join('assets', 'images', 'avatar', 'user_blue_150px.png'),
            'rb',
            encoding=None,
        ) as f:
            raw_image_png = f.read()
        default_image_path = os.path.join(
            'images', 'avatar', 'user_blue_150px.png'
        )
        self.assertEqual(
            constants.get_package_file_contents(
                'assets', default_image_path, binary_mode=True
            ),
            raw_image_png,
        )

    def test_loading_file_in_package_returns_the_content(self) -> None:
        """Test get_package_file_contents with imaginary file."""
        with mock.patch.object(pkgutil, 'get_data', return_value=b'File data'):
            self.assertEqual(
                constants.get_package_file_contents('assets', 'non_exist.xy'),
                'File data',
            )

    def test_loading_file_in_non_existent_package_throws_error(self) -> None:
        """Test get_package_file_contents with imaginary file."""
        with mock.patch.object(pkgutil, 'get_data', return_value=None):
            with self.assertRaisesRegex(
                FileNotFoundError,
                'No such file or directory: \'assets/non_exist.xy\'',
            ):
                constants.get_package_file_contents('assets', 'non_exist.xy')
                constants.get_package_file_contents(
                    'assets', 'non_exist.xy', binary_mode=True
                )

    def test_difficulty_values_are_matched(self) -> None:
        """Tests that the difficulty values and strings are matched in the
        various constants.
        """
        self.assertEqual(
            constants.constants.SKILL_DIFFICULTIES,
            [
                constants.constants.SKILL_DIFFICULTY_EASY,
                constants.constants.SKILL_DIFFICULTY_MEDIUM,
                constants.constants.SKILL_DIFFICULTY_HARD,
            ],
        )
        self.assertItemsEqual(
            list(constants.constants.SKILL_DIFFICULTY_LABEL_TO_FLOAT.keys()),
            constants.constants.SKILL_DIFFICULTIES,
        )
        self.assertEqual(
            constants.constants.DEFAULT_SKILL_DIFFICULTY,
            constants.constants.SKILL_DIFFICULTY_LABEL_TO_FLOAT[
                constants.constants.SKILL_DIFFICULTY_MEDIUM
            ],
        )

    def test_constants_and_feconf_are_consistent(self) -> None:
        """Test if constants that are related are consistent between feconf and
        constants.js.
        """
        self.assertIn(
            feconf.MIGRATION_BOT_USER_ID, constants.constants.SYSTEM_USER_IDS
        )
        self.assertIn(
            feconf.SYSTEM_COMMITTER_ID, constants.constants.SYSTEM_USER_IDS
        )
        self.assertEqual(len(constants.constants.SYSTEM_USER_IDS), 2)

    def test_all_comments_are_removed_from_json_text(self) -> None:
        """Tests if comments are removed from json text."""
        dummy_constants_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'dummy_constants.js'
        )
        with open(dummy_constants_filepath, 'r', encoding='utf-8') as f:
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
                '};\n'
            )

            self.assertEqual(
                actual_text_without_comments, expected_text_without_comments
            )

    def test_language_constants_are_in_sync(self) -> None:
        """Test if SUPPORTED_CONTENT_LANGUAGES and SUPPORTED_AUDIO_LANGUAGES
        constants have any conflicting values.
        """
        # TODO(#11737): Remove this once language constants are consolidated.
        rtl_content_languages = [
            language['code']
            for language in constants.constants.SUPPORTED_CONTENT_LANGUAGES
            if language['direction'] == 'rtl'
        ]
        ltr_content_languages = [
            language['code']
            for language in constants.constants.SUPPORTED_CONTENT_LANGUAGES
            if language['direction'] == 'ltr'
        ]
        rtl_audio_languages = [
            language['id']
            for language in constants.constants.SUPPORTED_AUDIO_LANGUAGES
            if language['direction'] == 'rtl'
        ]
        ltr_audio_languages = [
            language['id']
            for language in constants.constants.SUPPORTED_AUDIO_LANGUAGES
            if language['direction'] == 'ltr'
        ]
        conflicts = list(
            set(rtl_content_languages) & set(ltr_audio_languages)
        ) + list(set(rtl_audio_languages) & set(ltr_content_languages))
        self.assertFalse(conflicts)

    def test_constants_can_be_set(self) -> None:
        """Test __setattr__ to see if constants can be set as needed."""
        with mock.patch.dict(
            constants.constants, {'TESTING_CONSTANT': 'test_2'}
        ):
            self.assertEqual(constants.constants.TESTING_CONSTANT, 'test_2')

    def test_missing_attribute_behaves_like_attribute_error_and_patchable(
        self,
    ) -> None:
        """Test that accessing a missing attribute raises AttributeError and
        that patch.object can be used to temporarily set an attribute.
        """

        # Accessing a non-existent attribute should raise AttributeError.
        with self.assertRaisesRegex(AttributeError, 'NON_EXISTENT_CONSTANT'):
            _ = constants.constants.NON_EXISTENT_CONSTANT

        # Patch.object should be able to add an attribute temporarily.
        with mock.patch.object(constants.constants, 'DEV_MODE', True):
            self.assertTrue(constants.constants.DEV_MODE)

    def test_module_level_constants_are_patchable(self) -> None:
        """Ensure that module-level constants can be patched using
        mock.patch.object without raising KeyError.
        """
        # Patch the parsed constants mapping directly.
        with mock.patch.dict(
            constants.constants, {'OPPORTUNITIES_PAGE_SIZE': 1}
        ):
            self.assertEqual(constants.constants.OPPORTUNITIES_PAGE_SIZE, 1)
