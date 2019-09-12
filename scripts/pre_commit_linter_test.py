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
