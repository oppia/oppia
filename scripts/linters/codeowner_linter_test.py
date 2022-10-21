# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/linters/codeowner_linter.py."""

from __future__ import annotations

import multiprocessing
import os

from core.tests import test_utils

from typing import Final, List

from . import codeowner_linter
from . import pre_commit_linter

NAME_SPACE: Final = multiprocessing.Manager().Namespace()
NAME_SPACE.files = pre_commit_linter.FileCache()  # type: ignore[no-untyped-call]
FILE_CACHE: Final = NAME_SPACE.files

LINTER_TESTS_DIR: Final = os.path.join(
    os.getcwd(), 'scripts', 'linters', 'test_files'
)
VALID_CODEOWNER_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'valid_codeowners'
)
VALID_CODEOWNER_FILEPATH_WITH_DIRECTORY: Final = os.path.join(
    LINTER_TESTS_DIR, 'valid_codeowner_file_with_directory')
INVALID_DUPLICATE_CODEOWNER_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_duplicate_pattern_codeowner')
INVALID_MISSING_IMPORTANT_PATTERN_CODEOWNER_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_missing_important_pattern_codeowner')
INVALID_MISSING_CODEOWNER_NAME_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_missing_codeowner_name')
INVALID_INLINE_COMMENT_CODEOWNER_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_inline_comment_codeowner_filepath')
INVALID_FULL_FILEPATH_CODEOWNER_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_path_codeowner')
INVALID_WILDCARD_IN_FILEPATH: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_wildcard_used_codeowner')
INVALID_FILEPATH_MISSING_FROM_DIRECTORY: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_file_path_missing_codeowner')
INVALID_FILEPATH_WITH_BLANKET_CODEOWNER_ONLY: Final = os.path.join(
    LINTER_TESTS_DIR, 'invalid_file_path_with_blanket_codeowner_only')


CODEOWNER_IMPORTANT_PATHS: Final = [
    '/dependencies.json',
    '/package.json',
    '/yarn.lock',
    '/scripts/install_third_party_libs.py',
    '/.github/CODEOWNERS',
    '/.github/stale.yml']


class CodeownerLinterTests(test_utils.LinterTestBase):
    """Unit test for the CodeownerLintChecksManager class."""

    def setUp(self) -> None:
        super().setUp()

        def mock_listdir(unused_arg: str) -> List[str]:
            return [
                'dependencies.json',
                'package.json',
                'yarn.lock',
                'scripts/install_third_party_libs.py',
                '.github/CODEOWNERS',
                '.github/stale.yml']

        def mock_listdir_with_blanket_codeowner_only_file(
            unused_arg: str
        ) -> List[str]:
            return [
                'dependencies.json',
                'package.json',
                'yarn.lock',
                'scripts/install_third_party_libs.py',
                '.github/CODEOWNERS',
                '.github/stale.yml',
                'core/domain/new_file.py']

        self.listdir_swap = self.swap(os, 'listdir', mock_listdir)
        self.listdir_swap_file_with_blanket_codeowner_only = (
            self.swap(
                os, 'listdir', mock_listdir_with_blanket_codeowner_only_file)
        )

    def test_missing_important_codeowner_path_from_list(self) -> None:
        # Remove '/.github/stale.yml' important path from the end of list
        # for testing purpose.
        mock_codeowner_important_paths = CODEOWNER_IMPORTANT_PATHS[:-1]

        codeowner_important_paths_swap = self.swap(
            codeowner_linter, 'CODEOWNER_IMPORTANT_PATHS',
            mock_codeowner_important_paths)

        codeowner_filepath_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            VALID_CODEOWNER_FILEPATH)

        with self.listdir_swap, codeowner_important_paths_swap:
            with codeowner_filepath_swap:
                linter = codeowner_linter.CodeownerLintChecksManager(FILE_CACHE)
                lint_task_report = linter.check_codeowner_file()
        self.assert_same_list_elements([
            'Rule /.github/stale.yml is not present'
            ' in the CODEOWNER_IMPORTANT_PATHS list in scripts/linters/'
            'codeowner_linter.py. Please add this rule in the '
            'mentioned list or remove this rule from the \'Critical files'
            '\' section.'], lint_task_report.trimmed_messages)
        self.assertEqual('CODEOWNERS', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_duplicate_important_patterns_at_the_bottom_of_codeowners(
        self
    ) -> None:
        codeowner_path_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_DUPLICATE_CODEOWNER_FILEPATH)

        with self.listdir_swap, codeowner_path_swap:
            linter = codeowner_linter.CodeownerLintChecksManager(FILE_CACHE)
            lint_task_report = linter.check_codeowner_file()
        self.assert_same_list_elements([
            'Duplicate pattern(s) found in critical '
            'rules section.'], lint_task_report.trimmed_messages)
        self.assertEqual('CODEOWNERS', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_duplicate_important_patterns_in_list(self) -> None:
        mock_codeowner_important_paths = (
            CODEOWNER_IMPORTANT_PATHS + ['/.github/stale.yml'])
        codeowner_path_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', VALID_CODEOWNER_FILEPATH)

        codeowner_important_paths_swap = self.swap(
            codeowner_linter, 'CODEOWNER_IMPORTANT_PATHS',
            mock_codeowner_important_paths)

        with self.listdir_swap, codeowner_important_paths_swap:
            with codeowner_path_swap:
                linter = codeowner_linter.CodeownerLintChecksManager(FILE_CACHE)
                lint_task_report = linter.check_codeowner_file()
        self.assert_same_list_elements([
            'Duplicate pattern(s) found '
            'in CODEOWNER_IMPORTANT_PATHS list.'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('CODEOWNERS', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_missing_important_codeowner_path_from_critical_section(
        self
    ) -> None:
        codeowner_path_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_MISSING_IMPORTANT_PATTERN_CODEOWNER_FILEPATH)

        with self.listdir_swap, codeowner_path_swap:
            linter = codeowner_linter.CodeownerLintChecksManager(FILE_CACHE)
            lint_task_report = linter.check_codeowner_file()
        self.assert_same_list_elements([
            'Rule \'/.github/stale.yml\' is not present in '
            'the \'Critical files\' '
            'section. Please place it under the \'Critical files\' '
            'section since it is an important rule. Alternatively please '
            'remove it from the \'CODEOWNER_IMPORTANT_PATHS\' list in '
            'scripts/linters/codeowner_linter.py if it is no longer an '
            'important rule.'], lint_task_report.trimmed_messages)
        self.assertEqual('CODEOWNERS', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_check_codeowner_file_with_success_message(self) -> None:
        codeowner_path_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', VALID_CODEOWNER_FILEPATH)

        codeowner_important_paths_swap = self.swap(
            codeowner_linter, 'CODEOWNER_IMPORTANT_PATHS',
            CODEOWNER_IMPORTANT_PATHS)

        with self.listdir_swap, codeowner_important_paths_swap:
            with codeowner_path_swap:
                linter = codeowner_linter.CodeownerLintChecksManager(FILE_CACHE)
                lint_task_report = linter.check_codeowner_file()
        self.assertEqual(
            ['SUCCESS  CODEOWNERS check passed'], lint_task_report.get_report())
        self.assertEqual('CODEOWNERS', lint_task_report.name)
        self.assertFalse(lint_task_report.failed)

    def test_check_file_with_only_blanket_codeowner_defined_fails(self) -> None:
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_FILEPATH_WITH_BLANKET_CODEOWNER_ONLY)

        with self.listdir_swap_file_with_blanket_codeowner_only, codeowner_swap:
            linter = codeowner_linter.CodeownerLintChecksManager(FILE_CACHE)
            lint_task_report = linter.check_codeowner_file()

        error_message = (
            './core/domain/new_file.py is not listed in the .github/CODEOWNERS '
            'file.')
        self.assert_same_list_elements(
            [error_message],
            lint_task_report.trimmed_messages)
        self.assertEqual('CODEOWNERS', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_check_invalid_inline_comment_codeowner_filepath(self) -> None:
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_INLINE_COMMENT_CODEOWNER_FILEPATH)

        with self.listdir_swap, codeowner_swap:
            linter = codeowner_linter.CodeownerLintChecksManager(FILE_CACHE)
            lint_task_report = linter.check_codeowner_file()
        self.assert_same_list_elements(
            ['Please remove inline comment from line 17'],
            lint_task_report.trimmed_messages)
        self.assertEqual('CODEOWNERS', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_check_codeowner_file_without_codeowner_name(self) -> None:
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_MISSING_CODEOWNER_NAME_FILEPATH)

        with self.listdir_swap, codeowner_swap:
            linter = codeowner_linter.CodeownerLintChecksManager(FILE_CACHE)
            lint_task_report = linter.check_codeowner_file()
        self.assert_same_list_elements(
            ['Pattern on line 18 doesn\'t have codeowner'],
            lint_task_report.trimmed_messages)
        self.assertEqual('CODEOWNERS', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_check_codeowner_file_without_full_file_path(self) -> None:
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_FULL_FILEPATH_CODEOWNER_FILEPATH)

        with self.listdir_swap, codeowner_swap:
            linter = codeowner_linter.CodeownerLintChecksManager(FILE_CACHE)
            lint_task_report = linter.check_codeowner_file()
        self.assert_same_list_elements([
            'Pattern on line 18 is invalid. Use full path '
            'relative to the root directory'
            ], lint_task_report.trimmed_messages)
        self.assertEqual('CODEOWNERS', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_check_codeowner_file_with_wildcard(self) -> None:
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_WILDCARD_IN_FILEPATH)

        with codeowner_swap:
            linter = codeowner_linter.CodeownerLintChecksManager(FILE_CACHE)
            lint_task_report = linter.check_codeowner_file()
        self.assert_same_list_elements([
            'Pattern on line 18 is invalid. '
            '\'**\' wildcard not allowed'], lint_task_report.trimmed_messages)
        self.assertEqual('CODEOWNERS', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_check_codeowner_file_with_no_valid_match(self) -> None:
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_FILEPATH_MISSING_FROM_DIRECTORY)

        with self.listdir_swap, codeowner_swap:
            linter = codeowner_linter.CodeownerLintChecksManager(FILE_CACHE)
            lint_task_report = linter.check_codeowner_file()
        self.assert_same_list_elements([
            'Pattern on line 18 doesn\'t match '
            'any file or directory'], lint_task_report.trimmed_messages)
        self.assertEqual('CODEOWNERS', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_perform_all_lint_checks_with_valid_file(self) -> None:
        custom_linter = codeowner_linter.CodeownerLintChecksManager(
            FILE_CACHE)
        self.assertTrue(
            isinstance(custom_linter.perform_all_lint_checks(), list))

    def test_get_linters(self) -> None:
        custom_linter, third_party_linter = codeowner_linter.get_linters(
            FILE_CACHE)
        self.assertTrue(
            isinstance(
                custom_linter, codeowner_linter.CodeownerLintChecksManager))
        self.assertEqual(third_party_linter, None)
