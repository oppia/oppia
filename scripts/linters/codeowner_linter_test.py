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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import multiprocessing
import os

from core.tests import test_utils
import python_utils

from . import codeowner_linter
from . import pre_commit_linter

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
VALID_CODEOWNER_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid_codeowners')
VALID_CODEOWNER_FILEPATH_WITH_DIRECTORY = os.path.join(
    LINTER_TESTS_DIR, 'valid_codeowner_file_with_directory')
INVALID_DUPLICATE_CODEOWNER_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_duplicate_pattern_codeowner')
INVALID_MISSING_IMPORTANT_PATTERN_CODEOWNER_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_missing_important_pattern_codeowner')
INVALID_MISSING_CODEOWNER_NAME_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_missing_codeowner_name')
INVALID_FULL_FILEPATH_CODEOWNER_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_path_codeowner')
INVALID_WILDCARD_IN_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_wildcard_used_codeowner')
INVALID_FILEPATH_MISSING_FROM_DIRECTORY = os.path.join(
    LINTER_TESTS_DIR, 'invalid_file_path_missing_codeowner')


CODEOWNER_IMPORTANT_PATHS = [
    '/manifest.json',
    '/package.json',
    '/yarn.lock',
    '/scripts/install_third_party_libs.py',
    '/.github/CODEOWNERS',
    '/.github/stale.yml']


class CodeOwnerLinterTests(test_utils.GenericTestBase):
    """Test the methods for codeowner linter script."""

    def setUp(self):
        super(CodeOwnerLinterTests, self).setUp()
        self.linter_stdout = []

        def mock_print(*args):
            """Mock for python_utils.PRINT. Append the values to print to
            linter_stdout list.

            Args:
                *args: str. Variable length argument list of values to print in
                    the same line of output.
            """
            self.linter_stdout.append(
                ' '.join(python_utils.UNICODE(arg) for arg in args))

        def mock_listdir(unused_arg):
            return [
                'manifest.json',
                'package.json',
                'yarn.lock',
                'scripts/install_third_party_libs.py',
                '.github/CODEOWNERS',
                '.github/stale.yml']

        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)
        self.listdir_swap = self.swap(os, 'listdir', mock_listdir)

    def test_missing_important_codeowner_path_from_list(self):
        # Remove '/.github/stale.yml' important path from the end of list
        # for testing purpose.
        mock_codeowner_important_paths = CODEOWNER_IMPORTANT_PATHS[:-1]

        codeowner_important_paths_swap = self.swap(
            codeowner_linter, 'CODEOWNER_IMPORTANT_PATHS',
            mock_codeowner_important_paths)

        codeowner_filepath_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            VALID_CODEOWNER_FILEPATH)

        with self.print_swap, self.listdir_swap, codeowner_important_paths_swap:
            with codeowner_filepath_swap:
                codeowner_linter.check_codeowner_file(FILE_CACHE, True)
        self.assert_same_list_elements([
            'Rule /.github/stale.yml is not present'
            ' in the CODEOWNER_IMPORTANT_PATHS list in scripts/linters/'
            'pre_commit_linter.py. Please add this rule in the '
            'mentioned list or remove this rule from the \'Critical files'
            '\' section.'], self.linter_stdout)

    def test_duplicate_important_patterns_at_the_bottom_of_codeowners(self):
        codeowner_path_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_DUPLICATE_CODEOWNER_FILEPATH)

        with self.print_swap, self.listdir_swap, codeowner_path_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, True)
        self.assert_same_list_elements([
            'Duplicate pattern(s) found in critical '
            'rules section.'], self.linter_stdout)

    def test_duplicate_important_patterns_in_list(self):
        mock_codeowner_important_paths = (
            CODEOWNER_IMPORTANT_PATHS + ['/.github/stale.yml'])
        codeowner_path_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', VALID_CODEOWNER_FILEPATH)

        codeowner_important_paths_swap = self.swap(
            codeowner_linter, 'CODEOWNER_IMPORTANT_PATHS',
            mock_codeowner_important_paths)

        with self.print_swap, self.listdir_swap, codeowner_important_paths_swap:
            with codeowner_path_swap:
                codeowner_linter.check_codeowner_file(FILE_CACHE, True)
        self.assert_same_list_elements([
            'Duplicate pattern(s) found '
            'in CODEOWNER_IMPORTANT_PATHS list.'], self.linter_stdout)

    def test_missing_important_codeowner_path_from_critical_section(self):
        codeowner_path_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_MISSING_IMPORTANT_PATTERN_CODEOWNER_FILEPATH)

        with self.print_swap, self.listdir_swap, codeowner_path_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, True)
        self.assert_same_list_elements([
            'Rule \'/.github/stale.yml\' is not present in '
            'the \'Critical files\' '
            'section. Please place it under the \'Critical files\' '
            'section since it is an important rule. Alternatively please '
            'remove it from the \'CODEOWNER_IMPORTANT_PATHS\' list in '
            'scripts/linters/pre_commit_linter.py if it is no longer an '
            'important rule.'], self.linter_stdout)

    def test_check_codeowner_file_with_success_message(self):
        codeowner_path_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', VALID_CODEOWNER_FILEPATH)

        codeowner_important_paths_swap = self.swap(
            codeowner_linter, 'CODEOWNER_IMPORTANT_PATHS',
            CODEOWNER_IMPORTANT_PATHS)

        with self.print_swap, self.listdir_swap, codeowner_important_paths_swap:
            with codeowner_path_swap:
                codeowner_linter.check_codeowner_file(FILE_CACHE, False)
        self.assert_same_list_elements(
            ['SUCCESS  CODEOWNERS file check passed'], self.linter_stdout)

    def test_check_codeowner_file_without_codeowner_name(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_MISSING_CODEOWNER_NAME_FILEPATH)

        with self.print_swap, self.listdir_swap, codeowner_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, False)
        self.assert_same_list_elements(
            ['Pattern on line 18 doesn\'t have codeowner'],
            self.linter_stdout)

    def test_check_codeowner_file_without_full_file_path(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_FULL_FILEPATH_CODEOWNER_FILEPATH)

        with self.print_swap, self.listdir_swap, codeowner_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, False)
        self.assert_same_list_elements([
            'Pattern on line 18 is invalid. Use full path '
            'relative to the root directory'], self.linter_stdout)

    def test_check_codeowner_file_with_wildcard(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_WILDCARD_IN_FILEPATH)

        with self.print_swap, codeowner_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, False)
        self.assert_same_list_elements([
            'Pattern on line 18 is invalid. '
            '\'**\' wildcard not allowed'], self.linter_stdout)

    def test_check_codeowner_file_with_no_valid_match(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH',
            INVALID_FILEPATH_MISSING_FROM_DIRECTORY)

        with self.print_swap, self.listdir_swap, codeowner_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, False)
        self.assert_same_list_elements([
            'Pattern on line 18 doesn\'t match '
            'any file or directory'], self.linter_stdout)
