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

"""Unit tests for scripts/linters/python_linter.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import multiprocessing
import os

from core.tests import test_utils
import python_utils

from . import pre_commit_linter
from . import python_linter

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
VALID_PY_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.py')
VALID_TEST_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid_test_file_test.py')
PYTHON_UTILS_FILEPATH = os.path.join(os.getcwd(), 'python_utils.py')
INVALID_IMPORT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_import_order.py')
INVALID_TEST_ONLY_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_test_only.py')
INVALID_PYCODESTYLE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_pycodestyle_error.py')

INVALID_JOBS_ONE_OFF_FILEPATHS = [
    'scripts/linters/test_files/invalid_duplicate_jobs_one_off.py']
VALID_JOBS_ONE_OFF_FILEPATHS = [
    'scripts/linters/test_files/valid_jobs_one_off.py']
INVALID_PROD_VALIDATION_JOBS_ONE_OFF_FILEPATHS = [
    'scripts/linters/test_files/invalid_duplicate_prod_validation_jobs_one_off'
    '.py', 'scripts/linters/test_files/invalid_prod_validation_jobs_one_off.py']

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files


class PythonLintChecksManagerTests(test_utils.GenericTestBase):
    """Test for python linter."""

    def setUp(self):
        super(PythonLintChecksManagerTests, self).setUp()
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

        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

    def test_unsorted_import_order(self):
        with self.print_swap:
            python_linter.ThirdPartyPythonLintChecksManager(
                [INVALID_IMPORT_FILEPATH], True).perform_all_lint_checks()
        self.assert_same_list_elements([
            'FAILED  Import order checks failed, file imports should be '
            'alphabetized, see affect files above.'], self.linter_stdout)

    def test_sorted_import_order(self):
        with self.print_swap:
            python_linter.ThirdPartyPythonLintChecksManager(
                [VALID_PY_FILEPATH], True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['SUCCESS  Import order checks passed'],
            self.linter_stdout)

    def test_all_jobs_are_listed_in_the_job_registry_file_with_duplicacy(self):
        with self.print_swap:
            python_linter.PythonLintChecksManager(
                INVALID_JOBS_ONE_OFF_FILEPATHS + VALID_JOBS_ONE_OFF_FILEPATHS,
                FILE_CACHE, True).perform_all_lint_checks()
        self.assert_same_list_elements([
            'Found one-off jobs with duplicate names: '
            'CollectionMigrationOneOffJob'], self.linter_stdout)
        self.assert_same_list_elements([
            'Found one-off jobs not listed in jobs_registry file: '
            'CollectionsMigrationOneOffJob'], self.linter_stdout)

    def test_all_jobs_are_listed_in_the_job_registry_file_with_success(self):
        with self.print_swap:
            python_linter.PythonLintChecksManager(
                VALID_JOBS_ONE_OFF_FILEPATHS, FILE_CACHE,
                True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['SUCCESS  Job registry check passed'], self.linter_stdout)

    def test_jobs_are_listed_in_job_registry_file_with_duplicate_prod_job(self):
        with self.print_swap:
            python_linter.PythonLintChecksManager(
                INVALID_PROD_VALIDATION_JOBS_ONE_OFF_FILEPATHS, FILE_CACHE,
                True).perform_all_lint_checks()
        self.assert_same_list_elements([
            'Found validation jobs with duplicate names: '
            'PendingDeletionRequestModelAuditOneOffJob'
            ], self.linter_stdout)
        self.assert_same_list_elements([
            'Found validation jobs not listed in jobs_registry file: '
            'PendingDeletionRequestModelAuditOneOffJobs'
            ], self.linter_stdout)

    def test_custom_linter_with_test_only_in_non_test_file(self):
        with self.print_swap:
            python_linter.PythonLintChecksManager(
                [INVALID_TEST_ONLY_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        self.assert_same_list_elements([
            'Line 35: Please do not use \'test_only\' in the non-test '
            'file.'], self.linter_stdout)

    def test_custom_linter_with_test_function_in_test_file(self):
        with self.print_swap:
            python_linter.PythonLintChecksManager(
                [VALID_TEST_FILEPATH], FILE_CACHE,
                True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['SUCCESS  Function definition checks passed'],
            self.linter_stdout)

    def test_valid_file_with_pylint(self):
        with self.print_swap:
            python_linter.ThirdPartyPythonLintChecksManager(
                [VALID_PY_FILEPATH], True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['SUCCESS  1 Python files linted'], self.linter_stdout)
        self.assert_same_list_elements(
            ['SUCCESS  1 Python files linted for Python 3 compatibility'],
            self.linter_stdout)

    def test_valid_file_with_pylint_error(self):
        with self.print_swap:
            python_linter.ThirdPartyPythonLintChecksManager(
                [INVALID_IMPORT_FILEPATH], True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['C: 33, 0: Missing function docstring (missing-docstring)'],
            self.linter_stdout)

    def test_python_utils_file_with_no_files(self):
        with self.print_swap:
            python_linter.ThirdPartyPythonLintChecksManager(
                [PYTHON_UTILS_FILEPATH], True).perform_all_lint_checks()
        self.assert_same_list_elements([
            'There are no Python files to lint for Python 3 '
            'compatibility.'], self.linter_stdout)

    def test_for_python_three_incompatibility(self):
        with self.print_swap:
            python_linter.ThirdPartyPythonLintChecksManager(
                [INVALID_IMPORT_FILEPATH], True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['E: 34, 4: print statement used (print-statement)'],
            self.linter_stdout)

    def test_custom_linter_with_no_files(self):
        with self.print_swap:
            python_linter.PythonLintChecksManager(
                [], FILE_CACHE, True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['There are no Python files to lint.'], self.linter_stdout)

    def test_third_party_linter_with_no_files(self):
        with self.print_swap:
            python_linter.ThirdPartyPythonLintChecksManager(
                [], True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['There are no Python files to lint.'],
            self.linter_stdout)

    def test_pycodestyle_with_error_message(self):
        summary_messages = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_PYCODESTYLE_FILEPATH], True).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['27:1: E302 expected 2 blank lines, found 1'],
            summary_messages)

    def test_get_linters_with_success(self):
        custom_linter, third_party_linter = python_linter.get_linters(
            [VALID_PY_FILEPATH], FILE_CACHE, verbose_mode_enabled=True)
        self.assertTrue(
            isinstance(custom_linter, python_linter.PythonLintChecksManager))
        self.assertTrue(
            isinstance(
                third_party_linter,
                python_linter.ThirdPartyPythonLintChecksManager))
