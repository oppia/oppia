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

from . import pre_commit_linter
from . import python_linter

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
VALID_PY_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.py')
PYTHON_UTILS_FILEPATH = os.path.join(os.getcwd(), 'python_utils.py')
INVALID_IMPORT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_import_order.py')
INVALID_PYCODESTYLE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_pycodestyle_error.py')
INVALID_PYTHON3_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_python_three.py')
INVALID_DOCSTRING_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_docstring.py')

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES = multiprocessing.Manager().dict()
NAME_SPACE.files = pre_commit_linter.FileCache()
FILE_CACHE = NAME_SPACE.files


class PythonLintChecksManagerTests(test_utils.LinterTestBase):
    """Test for python linter."""

    def test_unsorted_import_order(self):
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_IMPORT_FILEPATH]).check_import_order()
        self.assert_same_list_elements([
            'FAILED  Import order check failed'], lint_task_report.get_report())
        self.assertEqual('Import order', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_sorted_import_order(self):
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [VALID_PY_FILEPATH]).check_import_order()
        self.assertEqual(
            ['SUCCESS  Import order check passed'],
            lint_task_report.get_report())
        self.assertEqual('Import order', lint_task_report.name)
        self.assertFalse(lint_task_report.failed)

    def test_valid_file_with_pylint(self):
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [VALID_PY_FILEPATH]).lint_py_files()
        self.assertEqual(
            ['SUCCESS  Pylint check passed'], lint_task_report.get_report())
        self.assertEqual('Pylint', lint_task_report.name)
        self.assertFalse(lint_task_report.failed)

    def test_invalid_file_with_pylint_error(self):
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_DOCSTRING_FILEPATH]).lint_py_files()
        self.assert_same_list_elements(
            ['W: 27, 0: Period is not used at the end of the docstring.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Pylint', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_get_trimmed_error_output(self):
        lint_message = (
            '************* Module oppia.scripts.linters.test_files.invalid_'
            'docstring\n\n\n'
            'W: 27, 0: Period is not used at the end of the docstring. '
            '(no-period-used)\n\n\n\n'
            '---------------------------------------------------'
            '---------------\n\n'
            'Your code has been rated at 8.75/10 (previous run: 8.75/10, +0.00)'
            '\n\n\n')
        trimmed_messages = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_DOCSTRING_FILEPATH]).get_trimmed_error_output(
                lint_message)
        self.assertEqual(
            trimmed_messages,
            '************* Module oppia.scripts.linters.test_files.'
            'invalid_docstring\n\n\nW: 27, 0: Period is not used at '
            'the end of the docstring. \n')

    def test_python_utils_file_with_no_files(self):
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [PYTHON_UTILS_FILEPATH]
        ).lint_py_files_for_python3_compatibility()
        self.assert_same_list_elements([
            'There are no Python files to lint for Python 3 '
            'compatibility.'], lint_task_report[0].get_report())
        self.assertEqual(
            'Pylint for Python 3 compatibility', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_for_python_three_incompatibility(self):
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_PYTHON3_FILEPATH]
        ).lint_py_files_for_python3_compatibility()
        self.assert_same_list_elements(
            ['W: 21, 0: import missing `from __future__ import '
             'absolute_import` (no-absolute-import)'],
            lint_task_report.get_report())
        self.assertEqual(
            'Pylint for Python 3 compatibility', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_third_party_linter_with_no_files(self):
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            []).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['There are no Python files to lint.'],
            lint_task_report[0].get_report())
        self.assertEqual('Python lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_third_party_perform_all_lint_checks(self):
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_PYCODESTYLE_FILEPATH]).perform_all_lint_checks()
        self.assertTrue(isinstance(lint_task_report, list))

    def test_pycodestyle_with_error_message(self):
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_PYCODESTYLE_FILEPATH]).lint_py_files()
        self.assert_same_list_elements(
            ['27:1: E302 expected 2 blank lines, found 1'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Pylint', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_get_linters_with_success(self):
        custom_linter, third_party_linter = python_linter.get_linters(
            [VALID_PY_FILEPATH])
        self.assertIsNone(custom_linter)
        self.assertTrue(
            isinstance(
                third_party_linter,
                python_linter.ThirdPartyPythonLintChecksManager))
