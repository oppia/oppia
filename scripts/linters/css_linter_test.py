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

"""Unit tests for scripts/linters/css_linter.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import subprocess

from core.tests import test_utils
import python_utils

from . import css_linter

PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
CONFIG_PATH = os.path.join(
    PARENT_DIR, 'oppia', 'core', 'templates', 'css', '.stylelintrc')

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
VALID_CSS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.css')
INVALID_CSS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid.css')


class MockProcessClass(python_utils.OBJECT):
    def __init__(self):
        pass

    kill_count = 0

    # pylint: disable=missing-docstring
    def kill(self):
        MockProcessClass.kill_count += 1
    # pylint: enable=missing-docstring


class ThirdPartyCSSLintChecksManagerTests(test_utils.GenericTestBase):
    """Tests for ThirdPartyCSSLintChecksManager class."""

    def setUp(self):
        super(ThirdPartyCSSLintChecksManagerTests, self).setUp()
        self.filepaths = [VALID_CSS_FILEPATH, INVALID_CSS_FILEPATH]
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

    def test_all_filepaths_with_success(self):
        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            CONFIG_PATH, self.filepaths, True)
        returned_filepaths = third_party_linter.all_filepaths
        self.assertEqual(returned_filepaths, self.filepaths)

    def test_perform_all_lint_checks_with_invalid_file(self):
        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            CONFIG_PATH, [INVALID_CSS_FILEPATH], True)
        with self.print_swap:
            third_party_linter.perform_all_lint_checks()
        self.assert_same_list_elements([
            '19:16',
            'Unexpected whitespace before \":\"   declaration-colon-space-'
            'before'], self.linter_stdout)

    def test_perform_all_lint_checks_with_invalid_stylelint_path(self):
        def mock_join(*unused_args):
            return 'node_modules/stylelint/bin/stylelinter.js'

        join_swap = self.swap(os.path, 'join', mock_join)

        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            CONFIG_PATH, [INVALID_CSS_FILEPATH], False)
        with self.print_swap, join_swap, self.assertRaises(SystemExit) as e:
            third_party_linter.perform_all_lint_checks()
        self.assertEqual(e.exception.code, 1)

    def test_perform_all_lint_checks_with_stderr(self):
        # pylint: disable=unused-argument
        def mock_popen(unused_commands, stdout, stderr):
            def mock_communicate():
                return ('True', 'True')
            result = MockProcessClass()
            result.communicate = mock_communicate # pylint: disable=attribute-defined-outside-init
            result.returncode = 0 # pylint: disable=attribute-defined-outside-init
            return result
        # pylint: enable=unused-argument

        popen_swap = self.swap_with_checks(
            subprocess, 'Popen', mock_popen)

        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            CONFIG_PATH, [VALID_CSS_FILEPATH], True)
        with self.print_swap, popen_swap, self.assertRaises(SystemExit) as e:
            third_party_linter.perform_all_lint_checks()
        self.assertEqual(e.exception.code, 1)

    def test_perform_all_lint_checks_with_no_files(self):
        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            CONFIG_PATH, [], False)
        with self.print_swap:
            third_party_linter.perform_all_lint_checks()
        self.assert_same_list_elements(
            ['There are no HTML or CSS files to lint.'],
            self.linter_stdout)

    def test_perform_all_lint_checks_with_valid_file(self):
        third_party_linter = css_linter.ThirdPartyCSSLintChecksManager(
            CONFIG_PATH, [VALID_CSS_FILEPATH], False)
        with self.print_swap:
            third_party_linter.perform_all_lint_checks()
        self.assert_same_list_elements(
            ['SUCCESS  1 CSS file linted'],
            self.linter_stdout)

    def test_get_linters(self):
        custom_linter, third_party_linter = css_linter.get_linters(
            CONFIG_PATH, self.filepaths, verbose_mode_enabled=True)
        self.assertEqual(custom_linter, None)
        self.assertTrue(
            isinstance(
                third_party_linter, css_linter.ThirdPartyCSSLintChecksManager))
