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

from __future__ import annotations

import multiprocessing
import os

from core.tests import test_utils
from typing import Dict, List

from . import python_linter
from . import run_lint_checks

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
VALID_PY_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.py')
VALID_PY_JOBS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid_job_imports.py')
INVALID_IMPORT_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_import_order.py')
INVALID_PYCODESTYLE_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_pycodestyle_error.py')
INVALID_PYTHON3_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_python_three.py')
INVALID_DOCSTRING_FILEPATH = os.path.join(
    LINTER_TESTS_DIR, 'invalid_docstring.py')

NAME_SPACE = multiprocessing.Manager().Namespace()
PROCESSES: Dict[str, List[str]] = multiprocessing.Manager().dict()
NAME_SPACE.files = run_lint_checks.FileCache()
FILE_CACHE = NAME_SPACE.files


class PythonLintChecksManagerTests(test_utils.LinterTestBase):
    """Test for python linter."""

    def test_unsorted_import_order(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_IMPORT_FILEPATH]).check_import_order()
        self.assert_same_list_elements([
            'FAILED  Import order check failed'], lint_task_report.get_report())
        self.assertEqual('Import order', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_sorted_import_order(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [VALID_PY_FILEPATH]).check_import_order()
        self.assertEqual(
            ['SUCCESS  Import order check passed'],
            lint_task_report.get_report())
        self.assertEqual('Import order', lint_task_report.name)
        self.assertFalse(lint_task_report.failed)

    def test_valid_job_imports(self) -> None:
        batch_jobs_dir: str = (
            os.path.join(os.getcwd(), 'core', 'jobs', 'batch_jobs')
        )
        lint_task_report = (
            python_linter.check_jobs_imports(
                batch_jobs_dir, VALID_PY_JOBS_FILEPATH)
        )
        self.assertEqual(
            'SUCCESS  Check jobs imports in jobs registry check passed',
            lint_task_report.get_report()[-1])
        self.assertEqual(
            'Check jobs imports in jobs registry', lint_task_report.name)
        self.assertFalse(lint_task_report.failed)

    def test_invalid_job_imports(self) -> None:
        batch_jobs_dir: str = (
            os.path.join(os.getcwd(), 'core', 'jobs', 'batch_jobs')
        )
        lint_task_report = (
            python_linter.check_jobs_imports(
                batch_jobs_dir, INVALID_IMPORT_FILEPATH)
        )
        self.assertEqual(
            'FAILED  Check jobs imports in jobs registry check failed',
            lint_task_report.get_report()[-1])
        self.assertEqual(
            'Check jobs imports in jobs registry', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_valid_file_with_pylint(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [VALID_PY_FILEPATH]).lint_py_files()
        self.assertEqual(
            ['SUCCESS  Pylint check passed'], lint_task_report.get_report())
        self.assertEqual('Pylint', lint_task_report.name)
        self.assertFalse(lint_task_report.failed)

    def test_invalid_file_with_pylint_error(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_DOCSTRING_FILEPATH]).lint_py_files()
        self.assert_same_list_elements(
            ['W9025: Period is not used at the end of the docstring.'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Pylint', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_get_trimmed_error_output(self) -> None:
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

    def test_third_party_linter_with_no_files(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            []).perform_all_lint_checks()
        self.assert_same_list_elements(
            ['There are no Python files to lint.'],
            lint_task_report[0].get_report())
        self.assertEqual('Python lint', lint_task_report[0].name)
        self.assertFalse(lint_task_report[0].failed)

    def test_third_party_perform_all_lint_checks(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_PYCODESTYLE_FILEPATH]).perform_all_lint_checks()
        self.assertTrue(isinstance(lint_task_report, list))

    def test_pycodestyle_with_error_message(self) -> None:
        lint_task_report = python_linter.ThirdPartyPythonLintChecksManager(
            [INVALID_PYCODESTYLE_FILEPATH]).lint_py_files()
        print(lint_task_report.trimmed_messages)
        self.assert_same_list_elements(
            ['24:1: E302 expected 2 blank lines, found 1'],
            lint_task_report.trimmed_messages)
        self.assertEqual('Pylint', lint_task_report.name)
        self.assertTrue(lint_task_report.failed)

    def test_get_linters_with_success(self) -> None:
        custom_linter, third_party_linter = python_linter.get_linters(
            [VALID_PY_FILEPATH])
        self.assertIsNone(custom_linter)
        self.assertIsInstance(
            third_party_linter,
            python_linter.ThirdPartyPythonLintChecksManager)
