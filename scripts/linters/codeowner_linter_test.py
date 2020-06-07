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

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'core', 'tests', 'linter_tests')
MOCK_CODEOWNER_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid_codeowners')

CODEOWNER_IMPORTANT_PATHS = [
    '/core/controllers/acl_decorators*.py',
    '/core/controllers/base*.py',
    '/core/domain/html*.py',
    '/core/domain/rights_manager*.py',
    '/core/domain/role_services*.py',
    '/core/domain/user*.py',
    '/core/storage/',
    '/export/',
    '/manifest.json',
    '/package.json',
    '/yarn.lock',
    '/scripts/install_third_party_libs.py',
    '/.github/',
    '/.github/CODEOWNERS',
    '/.github/stale.yml']


def appears_in_linter_stdout(phrases, linter_stdout):
    """Checks to see if all of the phrases appear in at least one of the
    linter_stdout outputs.

    Args:
        phrases: list(str). A list of phrases we are trying to find in
        one of the linter_stdout outputs. For example, python linting
        outputs a success string that includes data we don't have easy
        access to, like how long the test took, so we may want to search
        for a substring of that success string in linter_stdout.

        linter_stdout: list(str). A list of the output results from the
        linter's execution. Note that anything placed into the "result"
        queue in pre_commit_linter will be in the same index.

    Returns:
        bool. True if and only if all of the phrases appear in at least
        one of the results stored in linter_stdout.
    """
    for output in linter_stdout:
        if all(phrase in output for phrase in phrases):
            return True
    return False


class CodeOwnerLinterTests(test_utils.GenericTestBase):
    """Test the methods for codeowner linter script."""

    def setUp(self):
        super(CodeOwnerLinterTests, self).setUp()
        self.linter_stdout = []
        def mock_print(*args):
            """Mock for python_utils.PRINT. Append the values to print to
            linter_stdout list.

            Args:
                *args: Variable length argument list of values to print in
                the same line of output.
            """
            self.linter_stdout.append(
                ' '.join(python_utils.UNICODE(arg) for arg in args))
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

    def test_extra_important_patterns_in_the_codeowner_file(self):
        mock_codeowner_important_paths = CODEOWNER_IMPORTANT_PATHS[:-1]
        codeowner_important_paths_swap = self.swap(
            codeowner_linter, 'CODEOWNER_IMPORTANT_PATHS',
            mock_codeowner_important_paths)
        with self.print_swap, codeowner_important_paths_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, True)
        self.assertTrue(
            appears_in_linter_stdout(
                ['.github/CODEOWNERS --> Rule /.github/stale.yml is not present'
                 ' in the CODEOWNER_IMPORTANT_PATHS list in scripts/linters/'
                 'pre_commit_linter.py. Please add this rule in the '
                 'mentioned list or remove this rule from the \'Critical files'
                 '\' section.'], self.linter_stdout))

    def test_duplicate_important_patterns_at_the_bottom_of_codeowners(self):
        codeowner_path_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)
        with self.print_swap, codeowner_path_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, True)
        self.assertTrue(
            appears_in_linter_stdout(
                ['Duplicate pattern(s) found in critical '
                 'rules section.'], self.linter_stdout))

    def test_duplicate_important_patterns_in_list(self):
        mock_codeowner_important_paths = (
            CODEOWNER_IMPORTANT_PATHS + [CODEOWNER_IMPORTANT_PATHS[-1]])
        codeowner_important_paths_swap = self.swap(
            codeowner_linter, 'CODEOWNER_IMPORTANT_PATHS',
            mock_codeowner_important_paths)
        with self.print_swap, codeowner_important_paths_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, True)
        self.assertTrue(
            appears_in_linter_stdout(
                ['Duplicate pattern(s) '
                 'found in CODEOWNER_IMPORTANT_PATHS list.'],
                self.linter_stdout))

    def test_extra_important_patterns_in_important_pattern_list(self):
        codeowner_path_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)
        with self.print_swap, codeowner_path_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, True)
        self.assertTrue(
            appears_in_linter_stdout(
                ['Rule \'/.github/stale.yml\' is not present in '
                 'the \'Critical files\' '
                 'section. Please place it under the \'Critical files\' '
                 'section since it is an important rule. Alternatively please '
                 'remove it from the \'CODEOWNER_IMPORTANT_PATHS\' list in '
                 'scripts/linters/pre_commit_linter.py if it is no longer an '
                 'important rule.'], self.linter_stdout))

    def test_check_codeowner_file_with_success_message(self):
        with self.print_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, False)
        self.assertTrue(
            appears_in_linter_stdout(
                ['SUCCESS  CODEOWNERS file check passed'], self.linter_stdout))

    def test_check_codeowner_file_without_codeowner(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)
        with self.print_swap, codeowner_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, False)
            self.assertTrue(
                appears_in_linter_stdout(
                    ['Pattern on line 41 doesn\'t have codeowner'],
                    self.linter_stdout))

    def test_check_codeowner_file_without_full_file_path(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)
        with self.print_swap, codeowner_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, False)
        self.assertTrue(
            appears_in_linter_stdout(
                ['Pattern on line 40 is invalid. Use '
                 'full path relative to the root directory'],
                self.linter_stdout))

    def test_check_codeowner_file_with_wildcard(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)
        with self.print_swap, codeowner_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, False)
        self.assertTrue(
            appears_in_linter_stdout(
                ['Pattern on line 39 is invalid. '
                 '\'**\' wildcard not allowed'], self.linter_stdout))

    def test_check_codeowner_file_with_no_valid_match(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)
        with self.print_swap, codeowner_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, False)
        self.assertTrue(
            appears_in_linter_stdout(
                ['Pattern on line 17 doesn\'t match '
                 'any file or directory'], self.linter_stdout))

    def test_check_codeowner_file_with_no_match_in_codeowners_file(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)
        with self.print_swap, codeowner_swap:
            codeowner_linter.check_codeowner_file(FILE_CACHE, True)
        self.assertTrue(
            appears_in_linter_stdout(
                ['./.circleci/config.yml is not listed in the '
                 '.github/CODEOWNERS file.'], self.linter_stdout))
