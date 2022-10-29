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

"""Unit tests for scripts/check_frontend_test_coverage.py."""

from __future__ import annotations

import builtins
import os
import subprocess
import sys

from core import utils
from core.tests import test_utils

from typing import Dict, List, Literal, Optional

from . import check_frontend_test_coverage


class CheckFrontendCoverageTests(test_utils.GenericTestBase):
    def setUp(self) -> None:
        super().setUp()
        self.lcov_items_list: Optional[str] = None
        self.check_function_calls = {
            'open_file_is_called': False,
            'exists_is_called': False,
        }
        self.expected_check_function_calls = {
            'open_file_is_called': True,
            'exists_is_called': True,
        }
        self.printed_messages: List[str] = []

        class MockFile:
            def __init__(self, lcov_items_list: Optional[str]):
                self.lcov_items_list = lcov_items_list

            def read(self) -> Optional[str]:  # pylint: disable=missing-docstring
                return self.lcov_items_list

        def mock_open_file(
            file_name: str, option: Dict[str, str]  # pylint: disable=unused-argument
        ) -> MockFile:  # pylint: disable=unused-argument
            self.check_function_calls['open_file_is_called'] = True
            return MockFile(self.lcov_items_list)

        def mock_exists(unused_path: str) -> Literal[True]:
            self.check_function_calls['exists_is_called'] = True
            return True

        def mock_print(message: str) -> None:
            self.printed_messages.append(message)

        def mock_check_call(command: str) -> None:  # pylint: disable=unused-argument
            self.check_function_calls['check_call_is_called'] = True

        self.open_file_swap = self.swap(
            utils, 'open_file', mock_open_file
        )
        self.exists_swap = self.swap(os.path, 'exists', mock_exists)
        self.print_swap = self.swap(builtins, 'print', mock_print)
        self.check_call_swap = self.swap(
            subprocess, 'check_call', mock_check_call
        )

    def test_get_stanzas_from_lcov_file(self) -> None:
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
            stanzas = check_frontend_test_coverage.get_stanzas_from_lcov_file()
            self.assertEqual(stanzas[0].file_name, 'file.ts')
            self.assertEqual(stanzas[0].total_lines, 10)
            self.assertEqual(stanzas[0].covered_lines, 5)
            self.assertEqual(stanzas[1].file_name, 'file2.ts')
            self.assertEqual(stanzas[1].total_lines, 10)
            self.assertEqual(stanzas[1].covered_lines, 5)
            self.assertEqual(stanzas[2].file_name, 'file3.ts')
            self.assertEqual(stanzas[2].total_lines, 10)
            self.assertEqual(stanzas[2].covered_lines, 5)

    def test_get_stanzas_from_lcov_file_file_name_exception(self) -> None:
        self.lcov_items_list = (
            'SF:\n'
            'LF:10\n'
            'LH:5\n'
            'end_of_record\n'
        )
        with self.open_file_swap:
            with self.assertRaisesRegex(
                Exception,
                'The test path is empty or null. '
                'It\'s not possible to diff the test coverage correctly.',
            ):
                check_frontend_test_coverage.get_stanzas_from_lcov_file()

    def test_get_stanzas_from_lcov_file_total_lines_exception(self) -> None:
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:\n'
            'LH:5\n'
            'end_of_record\n'
        )
        with self.open_file_swap:
            with self.assertRaisesRegex(
                Exception,
                'It wasn\'t possible to get the total lines of file.ts file.'
                'It\'s not possible to diff the test coverage correctly.',
            ):
                check_frontend_test_coverage.get_stanzas_from_lcov_file()

    def test_get_stanzas_from_lcov_file_covered_lines_exception(self) -> None:
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:\n'
            'end_of_record\n'
        )
        with self.open_file_swap:
            with self.assertRaisesRegex(
                Exception,
                'It wasn\'t possible to get the covered lines of file.ts file.'
                'It\'s not possible to diff the test coverage correctly.',
            ):
                check_frontend_test_coverage.get_stanzas_from_lcov_file()

    def test_check_coverage_changes(self) -> None:
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:9\n'
            'end_of_record\n'
            'SF:/opensource/oppia/file2.ts\n'
            'LF:10\n'
            'LH:9\n'
            'end_of_record\n'
        )
        not_fully_covered_files_swap = self.swap(
            check_frontend_test_coverage,
            'NOT_FULLY_COVERED_FILENAMES',
            ['file.ts', 'file2.ts'],
        )

        check_function_calls = {'sys_exit_is_called': False}
        expected_check_function_calls = {'sys_exit_is_called': False}

        def mock_sys_exit(error_message: str) -> None:  # pylint: disable=unused-argument
            check_function_calls['sys_exit_is_called'] = True

        sys_exit_swap = self.swap(sys, 'exit', mock_sys_exit)
        with sys_exit_swap, self.exists_swap, self.open_file_swap, self.print_swap:  # pylint: disable=line-too-long
            with not_fully_covered_files_swap:
                check_frontend_test_coverage.check_coverage_changes()
            self.assertEqual(
                check_function_calls, expected_check_function_calls
            )

    def test_check_coverage_changes_error(self) -> None:
        def mock_exists(unused_path: str) -> Literal[False]:
            return False

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        with exists_swap:
            with self.assertRaisesRegex(
                Exception,
                'Expected lcov file to be'
                r' available at [A-Za-z\._/]+, but the file does not exist.',
            ):
                check_frontend_test_coverage.check_coverage_changes()

    def test_check_coverage_changes_for_covered_files(self) -> None:
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:9\n'
            'end_of_record\n'
            'SF:/opensource/oppia/file2.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
            'SF:node_modules/oppia/anotherfile.ts\n'
            'LF:10\n'
            'LH:9\n'
            'end_of_record\n'
        )
        not_fully_covered_files_swap = self.swap(
            check_frontend_test_coverage, 'NOT_FULLY_COVERED_FILENAMES', []
        )

        with self.exists_swap, self.open_file_swap, self.print_swap:
            with not_fully_covered_files_swap, self.capture_logging() as logs:
                with self.assertRaisesRegex(SystemExit, '1'):
                    check_frontend_test_coverage.check_coverage_changes()
                self.assertEqual(
                    logs,
                    [
                        '\033[1mfile.ts\033[0m seems to be not completely '
                        'tested. Make sure it\'s fully covered.'
                    ],
                )

    def test_check_coverage_changes_remove_file(self) -> None:
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:10\n'
            'end_of_record\n'
        )
        not_fully_covered_files_swap = self.swap(
            check_frontend_test_coverage,
            'NOT_FULLY_COVERED_FILENAMES',
            ['file.ts'],
        )

        with self.exists_swap, self.open_file_swap, self.print_swap:
            with not_fully_covered_files_swap, self.capture_logging() as logs:
                with self.assertRaisesRegex(SystemExit, '1'):
                    check_frontend_test_coverage.check_coverage_changes()
                self.assertEqual(
                    logs,
                    [
                        '\033[1mfile.ts\033[0m seems to be fully covered! '
                        'Before removing it manually from the denylist '
                        'in the file '
                        'scripts/check_frontend_test_coverage.py, please '
                        'make sure you\'ve followed the unit tests rules '
                        'correctly on: '
                        'https://github.com/oppia/oppia/wiki/Frontend-unit'
                        '-tests-guide#rules'
                    ],
                )

    def test_check_coverage_changes_when_renaming_file(self) -> None:
        self.lcov_items_list = (
            'SF:/opensource/oppia/newfilename.ts\n'
            'LF:10\n'
            'LH:9\n'
            'end_of_record\n'
        )
        not_fully_covered_files_swap = self.swap(
            check_frontend_test_coverage,
            'NOT_FULLY_COVERED_FILENAMES',
            ['file.ts'],
        )

        with self.exists_swap, self.open_file_swap, self.print_swap:
            with not_fully_covered_files_swap, self.capture_logging() as logs:
                with self.assertRaisesRegex(SystemExit, '1'):
                    check_frontend_test_coverage.check_coverage_changes()
                self.assertEqual(
                    logs,
                    [
                        '\033[1mnewfilename.ts\033[0m seems to be not '
                        'completely tested. Make sure it\'s fully covered.\n'
                        '\033[1mfile.ts\033[0m is in the frontend test '
                        'coverage denylist but it doesn\'t exist anymore. If '
                        'you have renamed it, please make sure to remove the '
                        'old file name and add the new file name in the '
                        'denylist in the file scripts/'
                        'check_frontend_test_coverage.py.'
                    ],
                )

    def test_fully_covered_filenames_is_sorted(self) -> None:
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:9\n'
            'end_of_record\n'
            'SF:/opensource/oppia/anotherfile.ts\n'
            'LF:10\n'
            'LH:9\n'
            'end_of_record\n'
            'SF:node_modules/oppia/thirdfile.ts\n'
            'LF:10\n'
            'LH:9\n'
            'end_of_record\n'
        )
        not_fully_covered_files_swap = self.swap(
            check_frontend_test_coverage,
            'NOT_FULLY_COVERED_FILENAMES',
            ['anotherfile.tsfile.ts'],
        )

        check_function_calls = {'sys_exit_is_called': False}
        expected_check_function_calls = {'sys_exit_is_called': False}

        def mock_sys_exit(error_message: str) -> None:  # pylint: disable=unused-argument
            check_function_calls['sys_exit_is_called'] = True

        sys_exit_swap = self.swap(sys, 'exit', mock_sys_exit)
        with sys_exit_swap, self.exists_swap, self.open_file_swap:
            with self.print_swap, not_fully_covered_files_swap:
                (
                    check_frontend_test_coverage
                    .check_not_fully_covered_filenames_list_is_sorted()
                )
                self.assertEqual(
                    check_function_calls, expected_check_function_calls
                )

    def test_fully_covered_filenames_is_not_sorted(self) -> None:
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:9\n'
            'end_of_record\n'
            'SF:/opensource/oppia/anotherfile.ts\n'
            'LF:10\n'
            'LH:9\n'
            'end_of_record\n'
        )
        not_fully_covered_files_swap = self.swap(
            check_frontend_test_coverage,
            'NOT_FULLY_COVERED_FILENAMES',
            ['file.ts', 'anotherfile.ts'],
        )

        with self.exists_swap, self.open_file_swap, self.print_swap:
            with not_fully_covered_files_swap, self.capture_logging() as logs:
                with self.assertRaisesRegex(SystemExit, '1'):
                    (
                        check_frontend_test_coverage
                        .check_not_fully_covered_filenames_list_is_sorted()
                    )
                self.assertEqual(
                    logs,
                    [
                        'The \033[1mNOT_FULLY_COVERED_FILENAMES\033[0m list '
                        'must be kept in alphabetical order.'
                    ],
                )

    def test_function_calls(self) -> None:
        self.lcov_items_list = (
            'SF:/opensource/oppia/file.ts\n'
            'LF:10\n'
            'LH:9\n'
            'end_of_record\n'
        )
        not_fully_covered_files_swap = self.swap(
            check_frontend_test_coverage,
            'NOT_FULLY_COVERED_FILENAMES',
            ['file.ts'],
        )
        with self.check_call_swap, self.exists_swap, self.open_file_swap:
            with not_fully_covered_files_swap:
                check_frontend_test_coverage.main()
            self.assertEqual(
                self.check_function_calls, self.expected_check_function_calls
            )
