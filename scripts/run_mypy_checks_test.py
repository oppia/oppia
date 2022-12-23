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

import os
import site
import subprocess

from core.tests import test_utils
from scripts import install_third_party_libs
from scripts import run_mypy_checks

from typing import Final, List, Optional, Tuple

PYTHON_CMD: Final = 'python3'
MYPY_SCRIPT_MODULE: Final = 'scripts.run_mypy_checks'


def mock_install_third_party_libs_main() -> None:
    """Mock for install_third_party_libs."""
    return


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

        self.install_swap = self.swap_with_checks(
            install_third_party_libs, 'main',
            mock_install_third_party_libs_main)

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

        self.install_mypy_prereq_swap_success = self.swap(
            run_mypy_checks,
            'install_mypy_prerequisites',
            lambda _: (0, 'exec')
        )
        self.install_mypy_prereq_swap_failure = self.swap(
            run_mypy_checks,
            'install_mypy_prerequisites',
            lambda _: (1, 'exec')
        )

        self.directories_swap = self.swap(
            run_mypy_checks, 'EXCLUDED_DIRECTORIES',
            ['dir1/', 'dir2/'])

        def mock_install_mypy_prerequisites_success(
            unused_ci: bool
        ) -> Tuple[int, str]:
            return (0, self.mypy_cmd_path)
        self.swap_install_success = self.swap(
            run_mypy_checks, 'install_mypy_prerequisites',
            mock_install_mypy_prerequisites_success)

        def mock_popen_user_prefix_error_call(
            cmd_tokens: List[str], *unused_args: str, **unused_kwargs: str
        ) -> Ret:
            return Ret(cmd_tokens)

        self.popen_swap_user_prefix_error = self.swap(
            subprocess, 'Popen', mock_popen_user_prefix_error_call)

        self.mypy_cmd_path = os.path.join(
            os.getcwd(), 'third_party', 'python3_libs', 'bin', 'mypy')

        def mock_install_mypy_prerequisites(unused_ci: bool) -> Tuple[int, str]:
            return (0, self.mypy_cmd_path)
        self.mypy_install_swap = self.swap_with_checks(
            run_mypy_checks, 'install_mypy_prerequisites',
            mock_install_mypy_prerequisites)

    def test_install_third_party_libraries_with_skip_install_as_true(
        self
    ) -> None:
        run_mypy_checks.install_third_party_libraries(True)

    def test_install_third_party_libraries_with_skip_install_as_false(
        self
    ) -> None:
        with self.install_swap:
            run_mypy_checks.install_third_party_libraries(False)

    def test_get_mypy_cmd_without_files(self) -> None:
        expected_cmd = [
            self.mypy_cmd_path, '--exclude', 'dir1/|dir2/',
            '--config-file', './mypy.ini', '.'
        ]
        with self.directories_swap:
            cmd = run_mypy_checks.get_mypy_cmd(
                None, self.mypy_cmd_path, False)
            self.assertEqual(cmd, expected_cmd)

    def test_get_mypy_cmd_for_ci(self) -> None:
        with self.directories_swap:
            cmd = run_mypy_checks.get_mypy_cmd(
                None, self.mypy_cmd_path, True)
            self.assertEqual(cmd[0], 'mypy')

    def test_get_mypy_cmd_with_files(self) -> None:
        expected_cmd = [
            self.mypy_cmd_path, '--config-file', './mypy.ini',
            'file1.py', 'file2.py'
        ]
        with self.directories_swap:
            cmd = run_mypy_checks.get_mypy_cmd(
                ['file1.py', 'file2.py'], self.mypy_cmd_path, False)
            self.assertEqual(cmd, expected_cmd)

    def test_install_mypy_prerequisites(self) -> None:
        with self.popen_swap_success:
            code, path = run_mypy_checks.install_mypy_prerequisites(False)
            self.assertEqual(code, 0)
            self.assertEqual(path, self.mypy_cmd_path)

    def test_install_mypy_prerequisites_for_ci(self) -> None:
        with self.popen_swap_success:
            code, _ = run_mypy_checks.install_mypy_prerequisites(True)
            self.assertEqual(code, 0)

    def test_install_mypy_prerequisites_with_user_prefix_error(self) -> None:
        with self.popen_swap_user_prefix_error:
            code, path = run_mypy_checks.install_mypy_prerequisites(False)
            self.assertEqual(code, 0)
            self.assertNotEqual(path, self.mypy_cmd_path)

    def test_error_is_raised_with_none_user_base(
        self
    ) -> None:
        with self.popen_swap_user_prefix_error:
            with self.swap(site, 'USER_BASE', None):
                with self.assertRaisesRegex(
                    Exception,
                    'No USER_BASE found for the user.'
                ):
                    run_mypy_checks.install_mypy_prerequisites(False)

    def test_install_mypy_prerequisites_with_wrong_script(self) -> None:
        with self.popen_swap_failure:
            with self.swap(
                run_mypy_checks, 'MYPY_REQUIREMENTS_FILE_PATH', 'scripts.wrong'
            ):
                code, _ = run_mypy_checks.install_mypy_prerequisites(False)
                self.assertEqual(code, 1)

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
        with self.popen_swap_success:
            with self.install_swap, self.install_mypy_prereq_swap_success:
                process = run_mypy_checks.main(args=['--files', 'file1.py'])
                self.assertEqual(process, 0)

    def test_main_without_mypy_errors(self) -> None:
        with self.popen_swap_success:
            with self.install_swap, self.install_mypy_prereq_swap_success:
                process = run_mypy_checks.main(args=[])
                self.assertEqual(process, 0)

    def test_main_with_files_with_mypy_errors(self) -> None:
        with self.install_mypy_prereq_swap_success:
            with self.install_swap, self.popen_swap_failure:
                with self.assertRaisesRegex(SystemExit, '2'):
                    run_mypy_checks.main(args=['--files', 'file1.py'])

    def test_main_failure_due_to_mypy_errors(self) -> None:
        with self.popen_swap_failure:
            with self.install_swap, self.install_mypy_prereq_swap_success:
                with self.assertRaisesRegex(SystemExit, '2'):
                    run_mypy_checks.main(args=[])

    def test_main_with_install_prerequisites_success(self) -> None:
        with self.popen_swap_success, self.install_swap:
            with self.mypy_install_swap:
                process = run_mypy_checks.main(args=[])
                self.assertEqual(process, 0)

    def test_main_with_install_prerequisites_failure(self) -> None:
        with self.popen_swap_failure, self.install_swap:
            with self.assertRaisesRegex(SystemExit, '1'):
                run_mypy_checks.main(args=[])
