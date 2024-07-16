# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/check_backend_test_times.py."""

from __future__ import annotations

import builtins
import os
import tempfile

from core.tests import test_utils
from scripts import check_backend_test_times


class CheckBackendTestTimesTests(test_utils.GenericTestBase):
    """Unit tests for scripts/check_backend_test_times.py."""

    def setUp(self) -> None:
        super().setUp()
        self.backend_test_time_reports_directory = (
            tempfile.TemporaryDirectory())
        backend_test_time_report_one = os.path.join(
            self.backend_test_time_reports_directory.name, 'report_one.txt')
        backend_test_time_report_two = os.path.join(
            self.backend_test_time_reports_directory.name, 'report_two.txt')
        backend_test_time_report_three = os.path.join(
            self.backend_test_time_reports_directory.name, 'report_three.txt')

        self.print_arr: list[str] = []
        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)

        with open(backend_test_time_report_one, 'w', encoding='utf-8') as f:
            f.write('test_one:1.8\n')
            f.write('test_two:1.4\n')
            f.write('test_three:1.7\n')
            f.write('test_four:2.3')

        with open(backend_test_time_report_two, 'w', encoding='utf-8') as f:
            f.write('test_five:1.2\n')
            f.write('test_six:1.1\n')
            f.write('test_seven:1.3')

        with open(backend_test_time_report_three, 'w', encoding='utf-8') as f:
            f.write('test_eight:1.5\n')
            f.write('test_nine:1.6\n')
            f.write('test_ten:1.4\n')
            f.write('test_eleven:164.4')

        self.backend_test_time_reports_swap = self.swap(
            check_backend_test_times, 'BACKEND_TEST_TIME_REPORTS_DIRECTORY',
            self.backend_test_time_reports_directory.name
        )
        self.sorted_backend_test_times = [
            {'test_name': 'test_six', 'test_time': 1.1},
            {'test_name': 'test_five', 'test_time': 1.2},
            {'test_name': 'test_seven', 'test_time': 1.3},
            {'test_name': 'test_ten', 'test_time': 1.4},
            {'test_name': 'test_two', 'test_time': 1.4},
            {'test_name': 'test_eight', 'test_time': 1.5},
            {'test_name': 'test_nine', 'test_time': 1.6},
            {'test_name': 'test_three', 'test_time': 1.7},
            {'test_name': 'test_one', 'test_time': 1.8},
            {'test_name': 'test_four', 'test_time': 2.3},
            {'test_name': 'test_eleven', 'test_time': 164.4}
        ]

    def tearDown(self) -> None:
        super().tearDown()
        self.backend_test_time_reports_directory.cleanup()

    def test_get_sorted_backend_test_times_from_reports_no_reports(
        self
    ) -> None:
        backend_test_time_reports_directory = tempfile.TemporaryDirectory()
        backend_test_time_reports_swap = self.swap(
            check_backend_test_times, 'BACKEND_TEST_TIME_REPORTS_DIRECTORY',
            backend_test_time_reports_directory.name
        )
        with backend_test_time_reports_swap:
            with self.assertRaisesRegex(
                RuntimeError,
                'No backend test time reports found in %s. Please run '
                'the backend tests before running this script.'
                % backend_test_time_reports_directory.name
            ):
                check_backend_test_times.get_sorted_backend_test_times_from_reports() # pylint: disable=line-too-long
        backend_test_time_reports_directory.cleanup()

    def test_get_sorted_backend_test_times_from_reports(self) -> None:
        with self.backend_test_time_reports_swap:
            sorted_backend_test_times = (
                check_backend_test_times.get_sorted_backend_test_times_from_reports() # pylint: disable=line-too-long
            )
        self.assertEqual(
            sorted_backend_test_times,
            self.sorted_backend_test_times
        )

    def test_check_backend_test_times_creates_correct_file(self) -> None:
        backend_test_times_temp_file = tempfile.NamedTemporaryFile('w+')
        backend_test_times_file_swap = self.swap(
            check_backend_test_times, 'BACKEND_TEST_TIMES_FILE',
            backend_test_times_temp_file.name
        )
        with self.backend_test_time_reports_swap, backend_test_times_file_swap:
            with self.print_swap:
                check_backend_test_times.main()
        sorted_backend_test_times_from_file = []
        for line in backend_test_times_temp_file.readlines():
            test_name, test_time = line.strip().split(':')
            print(test_time)
            sorted_backend_test_times_from_file.append(
                {'test_name': test_name, 'test_time': float(test_time)}
            )
        self.assertEqual(
            sorted_backend_test_times_from_file,
            self.sorted_backend_test_times
        )
        sorted_backend_test_times_message = (
            'BACKEND TEST TIMES SORTED BY TIME:\n'
            'test_six: 1.1\ntest_five: 1.2\ntest_seven: 1.3\ntest_ten: 1.4\n'
            'test_two: 1.4\ntest_eight: 1.5\ntest_nine: 1.6\ntest_three: 1.7\n'
            'test_one: 1.8\ntest_four: 2.3\ntest_eleven: 164.4\n'
            'BACKEND TEST TIMES OVER 150.0 seconds:\n'
            'test_eleven: 164.4\n'
        )
        self.assertEqual(
            sorted_backend_test_times_message, ''.join(self.print_arr))
        backend_test_times_temp_file.close()
