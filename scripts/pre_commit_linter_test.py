# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/pre_commit_linter.py."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from core.tests import test_utils
import python_utils

from . import pre_commit_linter

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'core', 'tests', 'linter_tests')

VALID_HTML_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.html')
INVALID_HTML_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid.html')

VALID_PYTHON_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.py')
INVALID_PYTHON_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid.py')


def mock_exit(unused_status):
    """Mock for sys.exit."""
    pass


def mock_check_codeowner_file(unused_verbose_mode_enabled):
    """Mock for check_codeowner_file."""
    return []


def mock_perform_all_lint_checks(unused_self):
    """Mock for perform_all_lint_checks."""
    return []


def all_checks_passed(linter_stdout):
    """Helper function to check if all checks have passed.

    Args:
        linter_stdout: list(str). List of output messages from
            pre_commit_linter.

    Returns:
        bool. Whether all checks have passed or not.
    """
    return 'All Checks Passed.' in linter_stdout

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


class LintTests(test_utils.GenericTestBase):
    """General class for all linter function tests."""
    def setUp(self):
        super(LintTests, self).setUp()
        self.linter_stdout = []
        def mock_print(val):
            """Mock for python_utils.PRINT. Append the values to print to
            linter_stdout list.

            Args:
                val: str. The value to print.
            """
            if isinstance(val, list):
                self.linter_stdout.extend(val)
            else:
                self.linter_stdout.append(val)
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)
        self.sys_swap = self.swap(sys, 'exit', mock_exit)


class HTMLLintTests(LintTests):
    """Test the HTML lint functions."""
    def setUp(self):
        super(HTMLLintTests, self).setUp()
        self.js_ts_lint_swap = self.swap(
            pre_commit_linter.JsTsLintChecksManager, 'perform_all_lint_checks',
            mock_perform_all_lint_checks)
        self.check_codeowner_swap = self.swap(
            pre_commit_linter, 'check_codeowner_file',
            mock_check_codeowner_file)

    def test_valid_html_file(self):
        with self.print_swap, self.js_ts_lint_swap, self.check_codeowner_swap:
            pre_commit_linter.main(args=['--path=%s' % VALID_HTML_FILEPATH])
        self.assertTrue(all_checks_passed(self.linter_stdout))
        self.assertTrue('SUCCESS   HTML linting passed' in self.linter_stdout)

    def test_invalid_html_file(self):
        with self.print_swap, self.sys_swap:
            with self.js_ts_lint_swap, self.check_codeowner_swap:
                pre_commit_linter.main(
                    args=['--path=%s' % INVALID_HTML_FILEPATH])
        self.assertFalse(all_checks_passed(self.linter_stdout))
        self.assertTrue((
            '%s: line 8, col 10, duplicate attribute: ng-controller\n\n'
            '[htmllint] found 1 errors out of 1 files\n' % INVALID_HTML_FILEPATH
            ) in self.linter_stdout)
        self.assertTrue('FAILED   HTML linting failed' in self.linter_stdout)


class PythonLintTests(LintTests):
    """Test the Python lint functions."""
    def setUp(self):
        super(PythonLintTests, self).setUp()
        self.js_ts_lint_swap = self.swap(
            pre_commit_linter.JsTsLintChecksManager, 'perform_all_lint_checks',
            mock_perform_all_lint_checks)
        self.check_codeowner_swap = self.swap(
            pre_commit_linter, 'check_codeowner_file',
            mock_check_codeowner_file)

    def test_valid_python_file(self):
        with self.print_swap, self.js_ts_lint_swap, self.check_codeowner_swap:
            pre_commit_linter.main(args=['--path=%s' % VALID_PYTHON_FILEPATH])
        self.assertTrue(all_checks_passed(self.linter_stdout))
        self.assertTrue(
            appears_in_linter_stdout(
                ['SUCCESS   1 Python files linted'],
                self.linter_stdout))

    def test_invalid_python_file(self):
        with self.print_swap, self.sys_swap:
            with self.js_ts_lint_swap, self.check_codeowner_swap:
                pre_commit_linter.main(
                    args=['--path=%s' % INVALID_PYTHON_FILEPATH])
        self.assertFalse(all_checks_passed(self.linter_stdout))
        self.assertTrue(appears_in_linter_stdout(
            ['C: 24, 0: Missing class docstring (missing-docstring)',
            'FAILED    Python linting failed'],
            self.linter_stdout))
