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

"""Checks the backend test times by combining all backend time reports."""

from __future__ import annotations

import json
import os

from typing import Final, List, Tuple, TypedDict

BACKEND_TEST_TIME_REPORTS_DIRECTORY: Final = os.path.join(
    os.getcwd(), 'backend_test_time_reports'
)
BACKEND_TEST_TIMES_FILE: Final = os.path.join(
    os.getcwd(), 'backend_test_times.txt'
)
LONG_BACKEND_TEST_TIME_THRESHOLD: Final = 150.0


class BackendTestDict(TypedDict):
    """A dict representing a backend test with its name and time."""

    test_name: str
    test_time: float
    test_time_by_average_test_case: float


def get_sorted_backend_test_times_from_reports(
) -> Tuple[List[BackendTestDict], List[BackendTestDict]]:
    """Returns a list of sorted backend test times from all backend time
    reports.

    Returns:
        tuple(list(dict), list(dict)). A tuple of two lists of backend test
        times sorted by time and by average test case time respectively.

    Raises:
        RuntimeError. No backend test time reports found in the directory.
    """
    backend_test_time_report_files = [
        file for file in
        os.listdir(BACKEND_TEST_TIME_REPORTS_DIRECTORY)
        if os.path.isfile(
            os.path.join(BACKEND_TEST_TIME_REPORTS_DIRECTORY, file)
        )
    ]
    backend_test_times: List[BackendTestDict] = []
    if not backend_test_time_report_files:
        raise RuntimeError(
            'No backend test time reports found in %s. Please run the backend '
            'tests before running this script.' % (
                BACKEND_TEST_TIME_REPORTS_DIRECTORY)
        )
    for backend_test_time_report_file in backend_test_time_report_files:
        with open(
            os.path.join(
                BACKEND_TEST_TIME_REPORTS_DIRECTORY,
                backend_test_time_report_file
            ), 'r', encoding='utf-8'
        ) as backend_test_time_report:
            loaded_backend_test_times = json.loads(
                backend_test_time_report.read()
            )
            for test_name, (
                test_time,
                test_time_by_average_test_case
            ) in loaded_backend_test_times.items():
                backend_test_times.append(
                    {
                        'test_name': test_name,
                        'test_time': float(test_time),
                        'test_time_by_average_test_case': (
                            float(test_time_by_average_test_case)
                        )
                    }
                )
    return sorted(
        backend_test_times,
        key=lambda test: (test['test_time'], test['test_name'])
    ), sorted(
        backend_test_times,
        key=lambda test: (
            test['test_time_by_average_test_case'], test['test_name']
        )
    )


def main() -> None:
    """Checks the backend test times by combining all backend time reports."""
    sorted_backend_test_times, sorted_backend_test_times_by_avg_test_case = (
        get_sorted_backend_test_times_from_reports())

    print('\033[1mBACKEND TEST TIMES SORTED BY TIME:\033[0m')
    for backend_test in sorted_backend_test_times:
        print('%s: %s SECONDS.' % (
            backend_test['test_name'], backend_test['test_time']))
    print('\033[1mBACKEND TEST TIMES OVER %s SECONDS:\033[0m' % (
        LONG_BACKEND_TEST_TIME_THRESHOLD))
    for backend_test in sorted_backend_test_times:
        if backend_test['test_time'] > LONG_BACKEND_TEST_TIME_THRESHOLD:
            print('%s: %s SECONDS.' % (
                backend_test['test_name'], backend_test['test_time']))
    print(
        '\033[1mBACKEND TEST TIMES WITH AVERAGE TEST CASE TIME OVER %s '
        'SECONDS:\033[0m' % LONG_BACKEND_TEST_TIME_THRESHOLD)
    for backend_test in sorted_backend_test_times_by_avg_test_case:
        if (
            backend_test['test_time_by_average_test_case'] >
            LONG_BACKEND_TEST_TIME_THRESHOLD
        ):
            print(
                '%s: %s SECONDS BY AVERAGE TEST CASE TIME.' % (
                    backend_test['test_name'],
                    backend_test['test_time_by_average_test_case']
                ))

    with open(
        BACKEND_TEST_TIMES_FILE, 'w', encoding='utf-8'
    ) as backend_test_times_file:
        for backend_test in sorted_backend_test_times:
            backend_test_times_file.write(
                '%s:%s:%s\n' % (
                    backend_test['test_name'],
                    backend_test['test_time'],
                    backend_test['test_time_by_average_test_case']
                )
            )


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when check_backend_associated_test_file.py
# is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
