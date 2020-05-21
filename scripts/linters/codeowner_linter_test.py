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


def all_checks_passed(linter_stdout):
    """Helper function to check if all checks have passed.

    Args:
        linter_stdout: list(str). List of output messages from
            codeowner_linter.

    Returns:
        bool. Whether all checks have passed or not.
    """
    return 'SUCCESS' in linter_stdout


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
        self.print_arr = []
        def mock_print(msg):
            self.print_arr.append(msg)

        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

    def test_walk_with_gitignore(self):
        def mock_listdir(unused_root):
            return [
                'scripts', 'core', '.coverage', 'linters',
                'pre_commit_linter.py']

        listdir_swap = self.swap(os, 'listdir', mock_listdir)

        with listdir_swap:
            filepaths = codeowner_linter.walk_with_gitignore(
                '.', ['third_party/*'])
            filepaths_list = list(filepaths)
            self.assertFalse(appears_in_linter_stdout(
                ['./.coverage'], filepaths_list))
            self.assertTrue(appears_in_linter_stdout(
                ['./scripts/linters/pre_commit_linter.py'], filepaths_list))

    def test_is_path_ignored(self):
        path_to_check = '.coverage'
        is_ignored = codeowner_linter.is_path_ignored(path_to_check)
        self.assertTrue(is_ignored)

    def test_path_is_not_ignored(self):
        path_to_check = 'scripts/linters'
        is_ignored = codeowner_linter.is_path_ignored(path_to_check)
        self.assertFalse(is_ignored)

    def test_check_for_important_patterns_at_the_bottom_of_codeowner(self):
        with self.print_swap:
            failed, _ = (
                codeowner_linter.check_for_important_patterns_at_bottom_of_codeowners( # pylint: disable=line-too-long
                    codeowner_linter.CODEOWNER_IMPORTANT_PATHS))
            self.assertFalse(failed)

    def test_extra_important_patterns_in_the_codeowner_file(self):
        with self.print_swap:
            failed, summary_messages = (
                codeowner_linter.check_for_important_patterns_at_bottom_of_codeowners( # pylint: disable=line-too-long
                    codeowner_linter.CODEOWNER_IMPORTANT_PATHS +
                    ['.coverage']))
            self.assertTrue(failed)
            error_messages = [
                '.github/CODEOWNERS --> Rule .coverage is not present in the '
                'CODEOWNER_IMPORTANT_PATHS list in scripts/linters/'
                'pre_commit_linter.py. Please add this rule in the '
                'mentioned list or remove this rule from the \'Critical files'
                '\' section.']
            self.assertEqual(error_messages, summary_messages)

    def test_duplicate_important_patterns_at_the_bottom_of_codeowners(self):
        with self.print_swap:
            failed, summary_messages = (
                codeowner_linter.check_for_important_patterns_at_bottom_of_codeowners( # pylint: disable=line-too-long
                    codeowner_linter.CODEOWNER_IMPORTANT_PATHS +
                    ['/.github/']))
            self.assertTrue(failed)
            error_messages = [
                '.github/CODEOWNERS --> Duplicate pattern(s) found in critical '
                'rules section.']
            self.assertEqual(error_messages, summary_messages)

    def test_duplicate_important_patterns_in_list(self):
        mock_codeowner_important_paths = [
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
            '/.github/']

        codeowner_important_paths_swap = self.swap(
            codeowner_linter, 'CODEOWNER_IMPORTANT_PATHS',
            mock_codeowner_important_paths)

        with self.print_swap, codeowner_important_paths_swap:
            failed, summary_messages = (
                codeowner_linter.check_for_important_patterns_at_bottom_of_codeowners( # pylint: disable=line-too-long
                    mock_codeowner_important_paths[:-1]))
            self.assertTrue(failed)
            error_messages = [
                'scripts/linters/pre_commit_linter.py --> Duplicate pattern(s) '
                'found in CODEOWNER_IMPORTANT_PATHS list.']
            self.assertEqual(error_messages, summary_messages)

    def test_extra_important_patterns_in_important_pattern_list(self):
        mock_codeowner_important_paths = [
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
            '/.github/']

        codeowner_important_paths_swap = self.swap(
            codeowner_linter, 'CODEOWNER_IMPORTANT_PATHS',
            mock_codeowner_important_paths)

        with self.print_swap, codeowner_important_paths_swap:
            failed, summary_messages = (
                codeowner_linter.check_for_important_patterns_at_bottom_of_codeowners( # pylint: disable=line-too-long
                    mock_codeowner_important_paths[:-1]))
            self.assertTrue(failed)
            error_messages = [
                '.github/CODEOWNERS --> Rule \'/.github/\' is not present in '
                'the \'Critical files\' '
                'section. Please place it under the \'Critical files\' '
                'section since it is an important rule. Alternatively please '
                'remove it from the \'CODEOWNER_IMPORTANT_PATHS\' list in '
                'scripts/linters/pre_commit_linter.py if it is no longer an '
                'important rule.']
            self.assertEqual(error_messages, summary_messages)

    def test_check_codeowner_file(self):
        with self.print_swap:
            summary_message = (
                codeowner_linter.check_codeowner_file(FILE_CACHE, False))
            success_message = ['SUCCESS  CODEOWNERS file check passed']
            self.assertEqual(success_message, summary_message)

    def test_check_codeowner_file_without_codeowner(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)

        with self.print_swap, codeowner_swap:
            summary_messages = (
                codeowner_linter.check_codeowner_file(FILE_CACHE, False))
            self.assertFalse(all_checks_passed(summary_messages))
            self.assertTrue(
                appears_in_linter_stdout(
                    ['Pattern on line 544 doesn\'t have codeowner'],
                    summary_messages))

    def test_check_codeowner_file_without_full_file_path(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)

        with self.print_swap, codeowner_swap:
            summary_messages = (
                codeowner_linter.check_codeowner_file(FILE_CACHE, False))
            self.assertFalse(all_checks_passed(summary_messages))
            self.assertTrue(
                appears_in_linter_stdout(
                    ['Pattern on line 543 is invalid. Use '
                     'full path relative to the root directory'],
                    summary_messages))

    def test_check_codeowner_file_with_wildcard(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)

        with self.print_swap, codeowner_swap:
            summary_messages = (
                codeowner_linter.check_codeowner_file(FILE_CACHE, False))
            self.assertFalse(all_checks_passed(summary_messages))
            self.assertTrue(
                appears_in_linter_stdout(
                    ['Pattern on line 542 is invalid. '
                     '\'**\' wildcard not allowed'],
                    summary_messages))

    def test_check_codeowner_file_with_no_valid_match(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)

        with self.print_swap, codeowner_swap:
            summary_messages = (
                codeowner_linter.check_codeowner_file(FILE_CACHE, False))
            self.assertFalse(all_checks_passed(summary_messages))
            self.assertTrue(
                appears_in_linter_stdout(
                    ['Pattern on line 436 doesn\'t match '
                     'any file or directory'],
                    summary_messages))

    def test_check_codeowner_file_with_no_match_in_codeowners_file(self):
        codeowner_swap = self.swap(
            codeowner_linter, 'CODEOWNER_FILEPATH', MOCK_CODEOWNER_FILEPATH)

        with self.print_swap, codeowner_swap:
            summary_messages = (
                codeowner_linter.check_codeowner_file(FILE_CACHE, False))
            self.assertFalse(all_checks_passed(summary_messages))
            self.assertTrue(
                appears_in_linter_stdout(
                    ['./.circleci/config.yml is not listed in the '
                     '.github/CODEOWNERS file.'],
                    summary_messages))
