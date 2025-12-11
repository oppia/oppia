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
from unittest import mock

from core.tests import test_utils
from scripts import check_backend_test_coverage, common


class CheckOverallBackendTestCoverageTests(test_utils.GenericTestBase):
    """Unit tests for scripts/check_backend_test_coverage.py."""

    def setUp(self) -> None:
        super().setUp()

        self.print_arr: list[str] = []

        def mock_print(  # pylint: disable=unused-argument
            msg: str, end: str = '\n'
        ) -> None:
            self.print_arr.append(msg)

        self.print_patch = mock.patch.object(builtins, 'print', mock_print)
        self.env = os.environ.copy()
        self.cmd = [
            sys.executable,
            '-m',
            'coverage',
            'report',
            '--omit="%s*","third_party/*","/usr/share/*"'
            % common.OPPIA_TOOLS_DIR,
            '--show-missing',
            '--skip-covered',
            '--skip-empty',
        ]

    def test_no_data_in_coverage_report_throws_error(self) -> None:
        class MockProcess:
            returncode = 0
            stdout = 'No data to report.'
            stderr = 'None'

        def mock_subprocess_run(  # pylint: disable=unused-argument
            *args: str, **kwargs: str
        ) -> MockProcess:
            return MockProcess()

        with mock.patch.object(
            subprocess, 'run', side_effect=mock_subprocess_run
        ) as mock_run, self.assertRaisesRegex(
            RuntimeError,
            'Run backend tests before running this script. '
            '\nOUTPUT: No data to report.\nERROR: None',
        ):
            check_backend_test_coverage.main()

        mock_run.assert_called_once_with(
            self.cmd,
            capture_output=True,
            encoding='utf-8',
            env=self.env,
            check=False,
        )

    def test_failure_to_execute_coverage_command_throws_error(self) -> None:
        class MockProcess:
            returncode = 1
            stdout = 'Some error occured.'
            stderr = 'Some error.'

        def mock_subprocess_run(  # pylint: disable=unused-argument
            *args: str, **kwargs: str
        ) -> MockProcess:
            return MockProcess()

        with mock.patch.object(
            subprocess, 'run', side_effect=mock_subprocess_run
        ) as mock_run, self.assertRaisesRegex(
            RuntimeError,
            'Failed to calculate coverage because subprocess failed. '
            '\nOUTPUT: Some error occured.\nERROR: Some error.',
        ):
            check_backend_test_coverage.main()

        mock_run.assert_called_once_with(
            self.cmd,
            capture_output=True,
            encoding='utf-8',
            env=self.env,
            check=False,
        )

    def test_error_in_parsing_coverage_report_throws_error(self) -> None:
        class MockProcess:
            returncode = 0
            stdout = 'TOTALL     40571  10682  13759   1161   70% '

        def mock_subprocess_run(  # pylint: disable=unused-argument
            *args: str, **kwargs: str
        ) -> MockProcess:
            return MockProcess()

        with mock.patch.object(
            subprocess, 'run', side_effect=mock_subprocess_run
        ) as mock_run, self.assertRaisesRegex(
            RuntimeError, 'Error in parsing coverage report.'
        ):
            check_backend_test_coverage.main()

        mock_run.assert_called_once_with(
            self.cmd,
            capture_output=True,
            encoding='utf-8',
            env=self.env,
            check=False,
        )

    def test_overall_backend_coverage_checks_failed(self) -> None:
        class MockProcess:
            returncode = 0
            stdout = 'TOTAL     40571  10682  13759   1161   70% '

        def mock_subprocess_run(  # pylint: disable=unused-argument
            *args: str, **kwargs: str
        ) -> MockProcess:
            return MockProcess()

        with mock.patch.object(
            subprocess, 'run', side_effect=mock_subprocess_run
        ) as mock_run, mock.patch.object(
            sys, 'exit', side_effect=lambda _: None
        ) as mock_exit:
            with self.print_patch, mock_exit, mock_run:
                check_backend_test_coverage.main()

        mock_run.assert_called_once_with(
            self.cmd,
            capture_output=True,
            encoding='utf-8',
            env=self.env,
            check=False,
        )
        mock_exit.assert_called_once_with(1)

        self.assertIn(
            'Backend overall line coverage checks failed.', self.print_arr
        )

    def test_overall_backend_coverage_checks_passed(self) -> None:
        class MockProcess:
            returncode = 0
            stdout = 'TOTAL     40571  0  13759   0   100% '

        def mock_subprocess_run(  # pylint: disable=unused-argument
            *args: str, **kwargs: str
        ) -> MockProcess:
            return MockProcess()

        with mock.patch.object(
            subprocess, 'run', side_effect=mock_subprocess_run
        ) as mock_run:
            with self.print_patch, mock_run:
                check_backend_test_coverage.main()

        mock_run.assert_called_once_with(
            self.cmd,
            capture_output=True,
            encoding='utf-8',
            env=self.env,
            check=False,
        )

        self.assertIn(
            'Backend overall line coverage checks passed.', self.print_arr
        )
