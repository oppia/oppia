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

"""Unit tests for scripts/check_frontend_coverage.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import subprocess
import sys
from core.tests import test_utils
import python_utils

from . import check_frontend_coverage


class CheckFrontEndCoverageTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CheckFrontEndCoverageTests, self).setUp()
        self.lcov_items_list = None
        self.check_function_calls = {
            'open_file_is_called': False,
            'exists_is_called': False,
        }
        self.expected_check_function_calls = {
            'open_file_is_called': True,
            'exists_is_called': True,
        }
        self.printed_messages = []
        class MockFile(python_utils.OBJECT):
            def __init__(self, lcov_items_list):
                self.lcov_items_list = lcov_items_list
            def read(self): # pylint: disable=missing-docstring
                return self.lcov_items_list
        def mock_open_file(file_name, option): # pylint: disable=unused-argument
            self.check_function_calls['open_file_is_called'] = True
            return MockFile(self.lcov_items_list)
        def mock_exists(unused_path):
            self.check_function_calls['exists_is_called'] = True
            return True
        def mock_print(message):
            self.printed_messages.append(message)
        def mock_check_call(command): # pylint: disable=unused-argument
            self.check_function_calls['check_call_is_called'] = True
        self.open_file_swap = self.swap(
            python_utils, 'open_file', mock_open_file)
        self.exists_swap = self.swap(os.path, 'exists', mock_exists)
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)
        self.check_call_swap = self.swap(
            subprocess, 'check_call', mock_check_call)

    def test_get_stanzas_from_lcov_file(self):
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:5\n'
            'end_of_record\n'
            'SF:/opensource/oppia/file2.ts\n'
            'LF:10\n'
            'LH:5\n'
            'end_of_record\n'
            'SF:/opensource/oppia/file3.ts\n'
            'LF:10\n'
            'LH:5\n'
            'end_of_record\n'
        )
        with self.open_file_swap:
            stanzas = check_frontend_coverage.get_stanzas_from_lcov_file()
            self.assertEqual(stanzas[0].file_name, 'file.ts')
            self.assertEqual(stanzas[0].total_lines, 10)
            self.assertEqual(stanzas[0].covered_lines, 5)
            self.assertEqual(stanzas[1].file_name, 'file2.ts')
            self.assertEqual(stanzas[1].total_lines, 10)
            self.assertEqual(stanzas[1].covered_lines, 5)
            self.assertEqual(stanzas[2].file_name, 'file3.ts')
            self.assertEqual(stanzas[2].total_lines, 10)
            self.assertEqual(stanzas[2].covered_lines, 5)

    def test_get_stanzas_from_lcov_file_file_name_exception(self):
        self.lcov_items_list = (
            'SF:\n'
            'LF:10\n'
            'LH:5\n'
            'end_of_record\n'
        )
        with self.open_file_swap:
            with self.assertRaisesRegexp(
                Exception,
                'The test path is empty or null. '
                'It\'s not possible to diff the test coverage correctly.'):
                check_frontend_coverage.get_stanzas_from_lcov_file()

    def test_get_stanzas_from_lcov_file_total_lines_exception(self):
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:\n'
            'LH:5\n'
            'end_of_record\n'
        )
        with self.open_file_swap:
            with self.assertRaisesRegexp(
                Exception,
                'It wasn\'t possible to get the total lines of file.ts file.'
                'It\'s not possible to diff the test coverage correctly.'):
                check_frontend_coverage.get_stanzas_from_lcov_file()

    def test_get_stanzas_from_lcov_file_covered_lines_exception(self):
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:\n'
            'end_of_record\n'
        )
        with self.open_file_swap:
            with self.assertRaisesRegexp(
                Exception,
                'It wasn\'t possible to get the covered lines of file.ts file.'
                'It\'s not possible to diff the test coverage correctly.'):
                check_frontend_coverage.get_stanzas_from_lcov_file()

    def test_check_coverage_changes(self):
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
            'SF:/opensource/oppia/file2.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
        )
        fully_covered_tests_swap = self.swap(
            check_frontend_coverage,
            'FULLY_COVERED_FILENAMES', [
                'file.ts',
                'file2.ts'
            ]
        )

        check_function_calls = {
            'sys_exit_is_called': False,
        }
        expected_check_function_calls = {
            'sys_exit_is_called': False,
        }
        def mock_sys_exit(error_message): # pylint: disable=unused-argument
            check_function_calls['sys_exit_is_called'] = True
        sys_exit_swap = self.swap(sys, 'exit', mock_sys_exit)
        with sys_exit_swap, self.exists_swap, self.open_file_swap, self.print_swap: # pylint: disable=line-too-long
            with fully_covered_tests_swap:
                check_frontend_coverage.check_coverage_changes()
            self.assertEqual(
                check_function_calls,
                expected_check_function_calls)

    def test_check_coverage_changes_error(self):
        def mock_exists(unused_path):
            return False
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        with exists_swap:
            with self.assertRaisesRegexp(
                Exception,
                'Expected lcov file to be'
                r' available at [A-Za-z\._/]+, but the file does not exist.'):
                check_frontend_coverage.check_coverage_changes()

    def test_check_coverage_changes_insertion(self):
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
            'SF:/opensource/oppia/file2.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
        )

        fully_covered_tests_swap = self.swap(
            check_frontend_coverage,
            'FULLY_COVERED_FILENAMES', [
                'file.ts'
            ]
        )

        with self.exists_swap, self.open_file_swap, self.print_swap:
            with fully_covered_tests_swap:
                with self.assertRaisesRegexp(
                    SystemExit,
                    r'\033\[1mfile2.ts\033\[0m file is fully covered but it\'s'
                    ' not in the "100% coverage" whitelist. Please add the file'
                    ' name in the whitelist in the file'
                    ' scripts/check_frontend_test_coverage.py.\n'):
                    check_frontend_coverage.check_coverage_changes()

    def test_check_coverage_changes_decrease(self):
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:8\n'
            'end_of_record\n'
        )
        fully_covered_tests_swap = self.swap(
            check_frontend_coverage,
            'FULLY_COVERED_FILENAMES', [
                'file.ts'
            ]
        )

        with self.exists_swap, self.open_file_swap, self.print_swap:
            with fully_covered_tests_swap:
                with self.assertRaisesRegexp(
                    SystemExit,
                    r'\033\[1mfile.ts\033\[0m file is in the whitelist but its'
                    ' coverage decreased. Make sure it is fully covered'
                    ' by Karma unit tests.\n'):
                    check_frontend_coverage.check_coverage_changes()

    def test_check_coverage_changes_rename(self):
        self.lcov_items_list = (
            'SF:/opensource/oppia/newfilename.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
        )
        fully_covered_tests_swap = self.swap(
            check_frontend_coverage,
            'FULLY_COVERED_FILENAMES', [
                'file.ts'
            ]
        )

        with self.exists_swap, self.open_file_swap, self.print_swap:
            with fully_covered_tests_swap:
                with self.assertRaisesRegexp(
                    SystemExit,
                    r'\033\[1mnewfilename.ts\033\[0m file is'
                    ' fully covered but it\'s not in the "100% coverage"'
                    ' whitelist. Please add the file name in the whitelist in'
                    ' the file scripts/check_frontend_test_coverage.py.\n'
                    r'\033\[1mfile.ts\033\[0m is in the frontend test coverage'
                    ' whitelist but it doesn\'t exist anymore. If you have'
                    ' renamed it, please make sure to remove the old file name'
                    ' and add the new file name in the whitelist in the file'
                    ' scripts/check_frontend_test_coverage.py.\n'):
                    check_frontend_coverage.check_coverage_changes()

    def test_fully_covered_filenames_is_sorted(self):
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
            'SF:/opensource/oppia/anotherfile.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
        )
        fully_covered_tests_swap = self.swap(
            check_frontend_coverage,
            'FULLY_COVERED_FILENAMES', [
                'anotherfile.ts'
                'file.ts',
            ]
        )

        check_function_calls = {
            'sys_exit_is_called': False
        }
        expected_check_function_calls = {
            'sys_exit_is_called': False
        }
        def mock_sys_exit(error_message): # pylint: disable=unused-argument
            check_function_calls['sys_exit_is_called'] = True
        sys_exit_swap = self.swap(sys, 'exit', mock_sys_exit)
        with sys_exit_swap, self.exists_swap, self.open_file_swap, self.print_swap: # pylint: disable=line-too-long
            with fully_covered_tests_swap:
                (check_frontend_coverage
                 .check_fully_covered_filenames_list_is_sorted())
                self.assertEqual(
                    check_function_calls,
                    expected_check_function_calls)

    def test_fully_covered_filenames_is_not_sorted(self):
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
            'SF:/opensource/oppia/anotherfile.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
        )
        fully_covered_tests_swap = self.swap(
            check_frontend_coverage,
            'FULLY_COVERED_FILENAMES', [
                'file.ts',
                'anotherfile.ts'
            ]
        )

        with self.exists_swap, self.open_file_swap, self.print_swap:
            with fully_covered_tests_swap:
                with self.assertRaisesRegexp(
                    SystemExit,
                    r'The \033\[1mFULLY_COVERED_FILENAMES\033\[0m list must be'
                    ' kept in alphabetical order.'):
                    (check_frontend_coverage
                     .check_fully_covered_filenames_list_is_sorted())

    def test_function_calls(self):
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
        )
        fully_covered_tests_swap = self.swap(
            check_frontend_coverage,
            'FULLY_COVERED_FILENAMES', [
                'file.ts'
            ])
        with self.check_call_swap, self.exists_swap, self.open_file_swap:
            with fully_covered_tests_swap:
                check_frontend_coverage.main()
            self.assertEqual(
                self.check_function_calls, self.expected_check_function_calls)
