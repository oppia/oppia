# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for MyPy type check runner script."""

from __future__ import annotations

import subprocess

from core import feconf
from core.tests import test_utils
from scripts import run_mypy_checks

from typing import Final, List, Optional, Tuple

PYTHON_CMD: Final = 'python3'
MYPY_SCRIPT_MODULE: Final = 'scripts.run_mypy_checks'


class Ret:
    """Return object that gives user-prefix error."""

    def __init__(self, cmd_tokens: List[str]) -> None:
        if '--user' in cmd_tokens:
            self.returncode = 0
        else:
            self.returncode = 1

    def communicate(self) -> Tuple[bytes, bytes]:
        """Return user-prefix error as stderr."""
        return b'', b'can\'t combine user with prefix'


class MypyScriptChecks(test_utils.GenericTestBase):
    """Tests for MyPy type check runner script."""

    def setUp(self) -> None:
        super().setUp()

        self.oppia_is_dockerized_swap = self.swap(
            feconf, 'OPPIA_IS_DOCKERIZED', False)

        process_success = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def mock_popen_success(
            unused_cmd: str,
            stdout: Optional[str] = None,  # pylint: disable=unused-argument
            stdin: Optional[str] = None,  # pylint: disable=unused-argument
            stderr: Optional[str] = None,  # pylint: disable=unused-argument
            env: Optional[str] = None  # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process_success

        process_failure = subprocess.Popen(
            ['test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def mock_popen_failure(
            unused_cmd: str,
            stdout: Optional[str] = None,  # pylint: disable=unused-argument
            stdin: Optional[str] = None,  # pylint: disable=unused-argument
            stderr: Optional[str] = None,  # pylint: disable=unused-argument
            env: Optional[str] = None  # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process_failure

        self.popen_swap_success = self.swap(
            subprocess, 'Popen', mock_popen_success)
        self.popen_swap_failure = self.swap(
            subprocess, 'Popen', mock_popen_failure)

        self.directories_swap = self.swap(
            run_mypy_checks, 'EXCLUDED_DIRECTORIES',
            ['dir1/', 'dir2/'])

    def test_get_mypy_cmd_without_files(self) -> None:
        expected_cmd = [
            'mypy', '--exclude', 'dir1/|dir2/', '--config-file', './mypy.ini',
            '.'
        ]
        with self.directories_swap:
            cmd = run_mypy_checks.get_mypy_cmd(None)
            self.assertEqual(cmd, expected_cmd)

    def test_get_mypy_cmd_with_files(self) -> None:
        expected_cmd = [
            'mypy', '--config-file', './mypy.ini', 'file1.py', 'file2.py'
        ]
        with self.directories_swap:
            cmd = run_mypy_checks.get_mypy_cmd(['file1.py', 'file2.py'])
            self.assertEqual(cmd, expected_cmd)

    def test_running_script_without_mypy_errors(self) -> None:
        with self.popen_swap_success:
            process = subprocess.Popen(
                [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE], stdout=subprocess.PIPE)
            output = process.communicate()
            self.assertEqual(output[0], b'test\n')

    def test_running_script_with_mypy_errors(self) -> None:
        with self.popen_swap_failure:
            process = subprocess.Popen(
                [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE], stdout=subprocess.PIPE)
            output = process.communicate()
            self.assertEqual(output[0], b'')

    def test_main_with_files_without_mypy_errors(self) -> None:
        with self.oppia_is_dockerized_swap:
            with self.popen_swap_success:
                process = run_mypy_checks.main(args=[
                    '--files', 'file1.py'])
                self.assertEqual(process, 0)

    def test_main_without_mypy_errors(self) -> None:
        with self.swap(feconf, 'OPPIA_IS_DOCKERIZED', False):
            with self.popen_swap_success:
                process = run_mypy_checks.main(args=[])
                self.assertEqual(process, 0)

    def test_main_with_files_with_mypy_errors(self) -> None:
        with self.oppia_is_dockerized_swap:
            with self.assertRaisesRegex(SystemExit, '1'):
                run_mypy_checks.main(args=['--files', 'file1.py'])

    def test_main_failure_due_to_mypy_errors(self) -> None:
        with self.oppia_is_dockerized_swap:
            with self.popen_swap_failure:
                with self.assertRaisesRegex(SystemExit, '1'):
                    run_mypy_checks.main(args=[])
