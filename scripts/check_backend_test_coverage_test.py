# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/check_backend_test_coverage.py."""

from __future__ import annotations

import builtins
import os
import subprocess
import sys

from core.tests import test_utils
from scripts import check_backend_test_coverage
from scripts import common


class CheckOverallBackendTestCoverageTests(test_utils.GenericTestBase):
    """Unit tests for scripts/check_backend_test_coverage.py."""

    def setUp(self) -> None:
        super().setUp()

        self.print_arr: list[str] = []
        def mock_print(msg: str, end: str = '\n') -> None:  # pylint: disable=unused-argument
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)
        self.env = os.environ.copy()
        self.cmd = [
            sys.executable, '-m', 'coverage', 'report',
            '--omit="%s*","third_party/*","/usr/share/*"'
            % common.OPPIA_TOOLS_DIR, '--show-missing',
            '--skip-covered', '--skip-empty']

    def test_no_data_in_coverage_report_throws_error(self) -> None:
        class MockProcess:
            returncode = 0
            stdout = 'No data to report.'
            stderr = 'None'
        def mock_subprocess_run(*args: str, **kwargs: str) -> MockProcess: # pylint: disable=unused-argument
            return MockProcess()
        swap_subprocess_run = self.swap_with_checks(
            subprocess, 'run', mock_subprocess_run,
            expected_args=((self.cmd,),),
            expected_kwargs=[{
                'capture_output': True,
                'encoding': 'utf-8',
                'env': self.env,
                'check': False
            }])

        with swap_subprocess_run, self.assertRaisesRegex(
            RuntimeError,
            'Run backend tests before running this script. '
            '\nOUTPUT: No data to report.\nERROR: None'
        ):
            check_backend_test_coverage.main()

    def test_failure_to_execute_coverage_command_throws_error(self) -> None:
        class MockProcess:
            returncode = 1
            stdout = 'Some error occured.'
            stderr = 'Some error.'
        def mock_subprocess_run(*args: str, **kwargs: str) -> MockProcess: # pylint: disable=unused-argument
            return MockProcess()
        swap_subprocess_run = self.swap_with_checks(
            subprocess, 'run', mock_subprocess_run,
            expected_args=((self.cmd,),),
            expected_kwargs=[{
                'capture_output': True,
                'encoding': 'utf-8',
                'env': self.env,
                'check': False
            }])

        with swap_subprocess_run, self.assertRaisesRegex(
            RuntimeError,
            'Failed to calculate coverage because subprocess failed. '
            '\nOUTPUT: Some error occured.\nERROR: Some error.'
        ):
            check_backend_test_coverage.main()

    def test_error_in_parsing_coverage_report_throws_error(self) -> None:
        class MockProcess:
            returncode = 0
            stdout = 'TOTALL     40571  10682  13759   1161   70% '
        def mock_subprocess_run(*args: str, **kwargs: str) -> MockProcess: # pylint: disable=unused-argument
            return MockProcess()
        swap_subprocess_run = self.swap_with_checks(
            subprocess, 'run', mock_subprocess_run,
            expected_args=((self.cmd,),),
            expected_kwargs=[{
                'capture_output': True,
                'encoding': 'utf-8',
                'env': self.env,
                'check': False
            }])

        with swap_subprocess_run, self.assertRaisesRegex(
            RuntimeError, 'Error in parsing coverage report.'
        ):
            check_backend_test_coverage.main()

    def test_overall_backend_coverage_checks_failed(self) -> None:
        class MockProcess:
            returncode = 0
            stdout = 'TOTAL     40571  10682  13759   1161   70% '
        def mock_subprocess_run(*args: str, **kwargs: str) -> MockProcess: # pylint: disable=unused-argument
            return MockProcess()
        swap_subprocess_run = self.swap_with_checks(
            subprocess, 'run', mock_subprocess_run,
            expected_args=((self.cmd,),),
            expected_kwargs=[{
                'capture_output': True,
                'encoding': 'utf-8',
                'env': self.env,
                'check': False
            }])
        swap_sys_exit = self.swap_with_checks(
            sys, 'exit', lambda _: None,
            expected_args=((1,),))

        with self.print_swap, swap_sys_exit, swap_subprocess_run:
            check_backend_test_coverage.main()

        self.assertIn(
            'Backend overall line coverage checks failed.', self.print_arr)

    def test_overall_backend_coverage_checks_passed(self) -> None:
        class MockProcess:
            returncode = 0
            stdout = 'TOTAL     40571  0  13759   0   100% '
        def mock_subprocess_run(*args: str, **kwargs: str) -> MockProcess: # pylint: disable=unused-argument
            return MockProcess()
        swap_subprocess_run = self.swap_with_checks(
            subprocess, 'run', mock_subprocess_run,
            expected_args=((self.cmd,),),
            expected_kwargs=[{
                'capture_output': True,
                'encoding': 'utf-8',
                'env': self.env,
                'check': False
            }])

        with self.print_swap, swap_subprocess_run:
            check_backend_test_coverage.main()

        self.assertIn(
            'Backend overall line coverage checks passed.', self.print_arr)
