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
import json
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
            self.backend_test_time_reports_directory.name, 'report_one.json')
        backend_test_time_report_two = os.path.join(
            self.backend_test_time_reports_directory.name, 'report_two.json')
        backend_test_time_report_three = os.path.join(
            self.backend_test_time_reports_directory.name, 'report_three.json')

        self.print_arr: list[str] = []
        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)

        with open(backend_test_time_report_one, 'w', encoding='utf-8') as f:
            f.write(json.dumps({
                'test_one': (1.8, 4.0),
                'test_two': (1.4, 4.0),
                'test_three': (1.7, 160.0),
                'test_four': (2.3, 4.0)
            }))

        with open(backend_test_time_report_two, 'w', encoding='utf-8') as f:
            f.write(json.dumps({
                'test_five': (1.2, 5.0),
                'test_six': (1.1, 5.0),
                'test_seven': (1.3, 5.0)
            }))

        with open(backend_test_time_report_three, 'w', encoding='utf-8') as f:
            f.write(json.dumps({
                'test_eight': (1.5, 6.0),
                'test_nine': (1.6, 170.0),
                'test_ten': (1.4, 6.0),
                'test_eleven': (164.4, 200.0)
            }))

        self.backend_test_time_reports_swap = self.swap(
            check_backend_test_times, 'BACKEND_TEST_TIME_REPORTS_DIRECTORY',
            self.backend_test_time_reports_directory.name
        )
        self.sorted_backend_test_times = [
            {
                'test_name': 'test_six',
                'test_time': 1.1,
                'test_time_by_average_test_case': 5.0
            },
            {
                'test_name': 'test_five',
                'test_time': 1.2,
                'test_time_by_average_test_case': 5.0
            },
            {
                'test_name': 'test_seven',
                'test_time': 1.3,
                'test_time_by_average_test_case': 5.0
            },
            {
                'test_name': 'test_ten',
                'test_time': 1.4,
                'test_time_by_average_test_case': 6.0
            },
            {
                'test_name': 'test_two',
                'test_time': 1.4,
                'test_time_by_average_test_case': 4.0
            },
            {
                'test_name': 'test_eight',
                'test_time': 1.5,
                'test_time_by_average_test_case': 6.0
            },
            {
                'test_name': 'test_nine',
                'test_time': 1.6,
                'test_time_by_average_test_case': 170.0
            },
            {
                'test_name': 'test_three',
                'test_time': 1.7,
                'test_time_by_average_test_case': 160.0
            },
            {
                'test_name': 'test_one',
                'test_time': 1.8,
                'test_time_by_average_test_case': 4.0
            },
            {
                'test_name': 'test_four',
                'test_time': 2.3,
                'test_time_by_average_test_case': 4.0
            },
            {
                'test_name': 'test_eleven',
                'test_time': 164.4,
                'test_time_by_average_test_case': 200.0
            }
        ]
        self.sorted_backend_test_times_by_avg_test_case = [
            {
                'test_name': 'test_four',
                'test_time': 2.3,
                'test_time_by_average_test_case': 4.0
            },
            {
                'test_name': 'test_one',
                'test_time': 1.8,
                'test_time_by_average_test_case': 4.0
            },
            {
                'test_name': 'test_two',
                'test_time': 1.4,
                'test_time_by_average_test_case': 4.0
            },
            {
                'test_name': 'test_five',
                'test_time': 1.2,
                'test_time_by_average_test_case': 5.0
            },
            {
                'test_name': 'test_seven',
                'test_time': 1.3,
                'test_time_by_average_test_case': 5.0
            },
            {
                'test_name': 'test_six',
                'test_time': 1.1,
                'test_time_by_average_test_case': 5.0
            },
            {
                'test_name': 'test_eight',
                'test_time': 1.5,
                'test_time_by_average_test_case': 6.0
            },
            {
                'test_name': 'test_ten',
                'test_time': 1.4,
                'test_time_by_average_test_case': 6.0
            },
            {
                'test_name': 'test_three',
                'test_time': 1.7,
                'test_time_by_average_test_case': 160.0
            },
            {
                'test_name': 'test_nine',
                'test_time': 1.6,
                'test_time_by_average_test_case': 170.0
            },
            {
                'test_name': 'test_eleven',
                'test_time': 164.4,
                'test_time_by_average_test_case': 200.0
            }
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
            sorted_backend_test_times, sorted_backend_test_times_by_avg_test_case = ( # pylint: disable=line-too-long
                check_backend_test_times.get_sorted_backend_test_times_from_reports() # pylint: disable=line-too-long
            )
        self.assertEqual(
            sorted_backend_test_times,
            self.sorted_backend_test_times
        )
        self.assertEqual(
            sorted_backend_test_times_by_avg_test_case,
            self.sorted_backend_test_times_by_avg_test_case
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
            test_name, test_time, test_time_by_average_test_case = (
                line.strip().split(':'))
            sorted_backend_test_times_from_file.append(
                {
                    'test_name': test_name,
                    'test_time': float(test_time),
                    'test_time_by_average_test_case': float(
                        test_time_by_average_test_case)
                }
            )
        self.assertEqual(
            sorted_backend_test_times_from_file,
            self.sorted_backend_test_times
        )
        sorted_backend_test_times_message = [
            '\033[1mBACKEND TEST TIMES SORTED BY TIME:\033[0m',
            'test_six: 1.1 SECONDS.',
            'test_five: 1.2 SECONDS.',
            'test_seven: 1.3 SECONDS.',
            'test_ten: 1.4 SECONDS.',
            'test_two: 1.4 SECONDS.',
            'test_eight: 1.5 SECONDS.',
            'test_nine: 1.6 SECONDS.',
            'test_three: 1.7 SECONDS.',
            'test_one: 1.8 SECONDS.',
            'test_four: 2.3 SECONDS.',
            'test_eleven: 164.4 SECONDS.',
            '\033[1mBACKEND TEST TIMES OVER 150.0 SECONDS:\033[0m',
            'test_eleven: 164.4 SECONDS.',
            '\033[1mBACKEND TEST TIMES WITH AVERAGE TEST CASE TIME '
            'OVER 150.0 SECONDS:\033[0m',
            'test_three: 160.0 SECONDS BY AVERAGE TEST CASE TIME.',
            'test_nine: 170.0 SECONDS BY AVERAGE TEST CASE TIME.',
            'test_eleven: 200.0 SECONDS BY AVERAGE TEST CASE TIME.'
        ]
        self.assertEqual(
            sorted_backend_test_times_message, self.print_arr)
        backend_test_times_temp_file.close()
