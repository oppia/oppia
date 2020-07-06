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

"""Unit tests for scripts/pre_commit_linter.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import subprocess
import sys

from core.tests import test_utils
import python_utils

from . import codeowner_linter
from . import pre_commit_linter
from . import third_party_typings_linter
from .. import concurrent_task_utils
from .. import install_third_party_libs

LINTER_TESTS_DIR = os.path.join(os.getcwd(), 'scripts', 'linters', 'test_files')
PYLINTRC_FILEPATH = os.path.join(os.getcwd(), '.pylintrc')

# HTML filepaths.
VALID_HTML_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.html')

# CSS filepaths.
VALID_CSS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.css')
INVALID_CSS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'invalid.css')

# Js and Ts filepaths.
VALID_JS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.js')
VALID_TS_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.ts')

# PY filepaths.
VALID_PY_FILEPATH = os.path.join(LINTER_TESTS_DIR, 'valid.py')


def mock_exit(unused_status):
    """Mock for sys.exit."""
    pass


def mock_check_codeowner_file(unused_file_cache, unused_verbose_mode_enabled):
    """Mock for check_codeowner_file."""
    return []


def mock_check_third_party_libs_type_defs(unused_verbose_mode_enabled):
    """Mock for check_third_party_libs_type_defs."""
    return []


def mock_install_third_party_libs_main():
    """Mock for install_third_party_libs."""
    return


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
        self.sys_swap = self.swap(sys, 'exit', mock_exit)
        self.install_swap = self.swap_with_checks(
            install_third_party_libs, 'main',
            mock_install_third_party_libs_main)


class PreCommitLinterTests(LintTests):
    """Tests for methods in pre_commit_linter module."""

    def setUp(self):
        super(PreCommitLinterTests, self).setUp()
        self.check_codeowner_swap = self.swap(
            codeowner_linter, 'check_codeowner_file', mock_check_codeowner_file)
        self.check_type_defs_swap = self.swap(
            third_party_typings_linter, 'check_third_party_libs_type_defs',
            mock_check_third_party_libs_type_defs)

    def test_main_with_no_files(self):
        def mock_get_all_filepaths(unused_path, unused_files):
            return []

        all_filepath_swap = self.swap(
            pre_commit_linter, '_get_all_filepaths', mock_get_all_filepaths)

        with self.print_swap, self.sys_swap, self.check_codeowner_swap:
            with self.install_swap, self.check_type_defs_swap:
                with all_filepath_swap:
                    pre_commit_linter.main()
        self.assert_same_list_elements(
            ['No files to check'], self.linter_stdout)

    def test_main_with_no_args(self):
        def mock_get_changed_filepaths():
            return []

        get_changed_filepaths_swap = self.swap(
            pre_commit_linter, '_get_changed_filepaths',
            mock_get_changed_filepaths)

        with self.print_swap, self.sys_swap, self.check_codeowner_swap:
            with self.install_swap, self.check_type_defs_swap:
                with get_changed_filepaths_swap:
                    pre_commit_linter.main()
        self.assert_same_list_elements(
            ['No files to check'], self.linter_stdout)

    def test_main_with_files_arg(self):
        with self.print_swap, self.sys_swap, self.check_codeowner_swap:
            with self.install_swap, self.check_type_defs_swap:
                pre_commit_linter.main(args=['--files=%s' % PYLINTRC_FILEPATH])
        self.assertTrue(all_checks_passed(self.linter_stdout))

    def test_main_with_error_message(self):
        all_errors_swap = self.swap(
            concurrent_task_utils, 'ALL_ERRORS', ['This is an error.'])

        with self.print_swap, self.sys_swap, self.check_codeowner_swap:
            with self.install_swap, self.check_type_defs_swap, all_errors_swap:
                pre_commit_linter.main(args=['--path=%s' % VALID_PY_FILEPATH])
        self.assertFalse(all_checks_passed(self.linter_stdout))
        self.assert_same_list_elements(
            ['This is an error.'], self.linter_stdout)

    def test_main_with_path_arg(self):
        with self.print_swap, self.sys_swap, self.check_codeowner_swap:
            with self.install_swap, self.check_type_defs_swap:
                pre_commit_linter.main(
                    args=['--path=%s' % INVALID_CSS_FILEPATH])
        self.assertFalse(all_checks_passed(self.linter_stdout))
        self.assert_same_list_elements([
            '19:16',
            'Unexpected whitespace before \":\"   declaration-colon-space-'
            'before'], self.linter_stdout)

    def test_main_with_invalid_filepath_with_path_arg(self):
        with self.print_swap, self.assertRaises(SystemExit) as e:
            pre_commit_linter.main(args=['--path=invalid_file.py'])
        self.assert_same_list_elements(
            ['Could not locate file or directory'], self.linter_stdout)
        self.assertEqual(e.exception.code, 1)

    def test_main_with_invalid_filepath_with_file_arg(self):
        with self.print_swap, self.assertRaises(SystemExit) as e:
            pre_commit_linter.main(args=['--files=invalid_file.py'])
        self.assert_same_list_elements(
            ['The following file(s) do not exist'], self.linter_stdout)
        self.assertEqual(e.exception.code, 1)

    def test_path_arg_with_directory_name(self):
        def mock_get_all_files_in_directory(
                unused_input_path, unused_excluded_glob_patterns):
            return [VALID_PY_FILEPATH]

        get_all_files_swap = self.swap(
            pre_commit_linter, '_get_all_files_in_directory',
            mock_get_all_files_in_directory)

        with self.print_swap, self.sys_swap, self.check_codeowner_swap:
            with self.install_swap, self.check_type_defs_swap:
                with get_all_files_swap:
                    pre_commit_linter.main(args=['--path=scripts/linters/'])
        self.assertTrue(all_checks_passed(self.linter_stdout))

    def test_main_with_only_check_file_extensions_arg(self):
        with self.print_swap, self.sys_swap, self.check_codeowner_swap:
            with self.install_swap, self.check_type_defs_swap:
                pre_commit_linter.main(
                    args=['--path=%s' % VALID_TS_FILEPATH,
                          '--only-check-file-extensions=ts'])
        self.assertTrue(all_checks_passed(self.linter_stdout))

    def test_main_with_only_check_file_extensions_arg_with_js_ts_options(self):
        with self.print_swap, self.assertRaises(SystemExit) as e:
            pre_commit_linter.main(
                args=['--path=%s' % VALID_TS_FILEPATH,
                      '--only-check-file-extensions', 'ts', 'js'])
        self.assert_same_list_elements([
            'Please use only one of "js" or "ts", as we do not have '
            'separate linters for JS and TS files. If both these options '
            'are used together, then the JS/TS linter will be run twice.'
            ], self.linter_stdout)
        self.assertEqual(e.exception.code, 1)

    def test_get_all_files_in_directory(self):
        with self.print_swap, self.sys_swap, self.check_codeowner_swap:
            with self.install_swap, self.check_type_defs_swap:
                pre_commit_linter.main(
                    args=['--path=scripts/linters/',
                          '--only-check-file-extensions=ts'])

    def test_get_changed_filepaths(self):
        def mock_check_output(unused_list):
            return ''

        subprocess_swap = self.swap(
            subprocess, 'check_output', mock_check_output)

        with self.print_swap, self.sys_swap, self.check_codeowner_swap:
            with self.install_swap, self.check_type_defs_swap, subprocess_swap:
                pre_commit_linter.main()
