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
import subprocess

from core.tests import test_utils
from scripts import install_third_party_libs
from scripts import run_mypy_checks

PYTHON_CMD = 'python3'
MYPY_SCRIPT_MODULE = 'scripts.run_mypy_checks'


def mock_install_third_party_libs_main():
    """Mock for install_third_party_libs."""
    return


class MypyScriptChecks(test_utils.GenericTestBase):
    """Tests for MyPy type check runner script."""

    def setUp(self):
        super().setUp()

        self.install_swap = self.swap_with_checks(
            install_third_party_libs, 'main',
            mock_install_third_party_libs_main)

        process_success = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def mock_popen_success(
                unused_cmd, stdout=None, stdin=None, stderr=None, env=None):  # pylint: disable=unused-argument
            return process_success

        process_failure = subprocess.Popen(
            ['test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def mock_popen_failure(
                unused_cmd, stdout=None, stdin=None, stderr=None, env=None):  # pylint: disable=unused-argument
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

        self.files_swap = self.swap(
            run_mypy_checks, 'NOT_FULLY_COVERED_FILES',
            ['file1.py', 'file2.py'])

        self.directories_swap = self.swap(
            run_mypy_checks, 'EXCLUDED_DIRECTORIES',
            ['dir1/', 'dir2/'])

        def mock_install_mypy_prerequisites_success(unused_ci):
            return (0, self.mypy_cmd_path)
        self.swap_install_success = self.swap(
            run_mypy_checks, 'install_mypy_prerequisites',
            mock_install_mypy_prerequisites_success)

        def mock_popen_user_prefix_error_call(
                cmd_tokens, *unused_args, **unused_kwargs):
            class Ret:
                """Return object that gives user-prefix error."""

                def __init__(self):
                    if '--user' in cmd_tokens:
                        self.returncode = 0
                    else:
                        self.returncode = 1
                def communicate(self):
                    """Return user-prefix error as stderr."""
                    return b'', b'can\'t combine user with prefix'
            return Ret()

        self.popen_swap_user_prefix_error = self.swap(
            subprocess, 'Popen', mock_popen_user_prefix_error_call)

        self.mypy_cmd_path = os.path.join(
            os.getcwd(), 'third_party', 'python3_libs', 'bin', 'mypy')

        def mock_install_mypy_prerequisites(unused_ci):
            return (0, self.mypy_cmd_path)
        self.mypy_install_swap = self.swap_with_checks(
            run_mypy_checks, 'install_mypy_prerequisites',
            mock_install_mypy_prerequisites)

    def test_all_files_and_folders_in_not_fully_covered_files_exist(
        self
    ) -> None:
        for path in run_mypy_checks.NOT_FULLY_COVERED_FILES:
            self.assertTrue(
                os.path.exists(path), msg='"%s" does not exist' % path)

    def test_install_third_party_libraries_with_skip_install_as_true(self):
        run_mypy_checks.install_third_party_libraries(True)

    def test_install_third_party_libraries_with_skip_install_as_false(self):
        with self.install_swap:
            run_mypy_checks.install_third_party_libraries(False)

    def test_get_mypy_cmd_without_files(self):
        expected_cmd = [
            self.mypy_cmd_path, '--exclude', 'file1.py|file2.py|dir1/|dir2/',
            '--config-file', './mypy.ini', '.'
        ]
        with self.files_swap:
            with self.directories_swap:
                cmd = run_mypy_checks.get_mypy_cmd(
                    None, self.mypy_cmd_path, False)
                self.assertEqual(cmd, expected_cmd)

    def test_get_mypy_cmd_for_ci(self):
        with self.files_swap:
            with self.directories_swap:
                cmd = run_mypy_checks.get_mypy_cmd(
                    None, self.mypy_cmd_path, True)
                self.assertEqual(cmd[0], 'mypy')

    def test_get_mypy_cmd_with_files(self):
        expected_cmd = [
            self.mypy_cmd_path, '--config-file', './mypy.ini',
            'file1.py', 'file2.py'
        ]
        with self.files_swap:
            with self.directories_swap:
                cmd = run_mypy_checks.get_mypy_cmd(
                    ['file1.py', 'file2.py'], self.mypy_cmd_path, False)
                self.assertEqual(cmd, expected_cmd)

    def test_install_mypy_prerequisites(self):
        with self.popen_swap_success:
            code, path = run_mypy_checks.install_mypy_prerequisites(False)
            self.assertEqual(code, 0)
            self.assertEqual(path, self.mypy_cmd_path)

    def test_install_mypy_prerequisites_for_ci(self):
        with self.popen_swap_success:
            code, _ = run_mypy_checks.install_mypy_prerequisites(True)
            self.assertEqual(code, 0)

    def test_install_mypy_prerequisites_with_user_prefix_error(self):
        with self.popen_swap_user_prefix_error:
            code, path = run_mypy_checks.install_mypy_prerequisites(False)
            self.assertEqual(code, 0)
            self.assertNotEqual(path, self.mypy_cmd_path)

    def test_install_mypy_prerequisites_with_wrong_script(self):
        with self.popen_swap_failure:
            with self.swap(
                run_mypy_checks, 'MYPY_REQUIREMENTS_FILE_PATH', 'scripts.wrong'
            ):
                code, _ = run_mypy_checks.install_mypy_prerequisites(False)
                self.assertEqual(code, 1)

    def test_running_script_without_mypy_errors(self):
        with self.popen_swap_success:
            process = subprocess.Popen(
                [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE], stdout=subprocess.PIPE)
            output = process.communicate()
            self.assertEqual(output[0], b'test\n')

    def test_running_script_with_mypy_errors(self):
        with self.popen_swap_failure:
            process = subprocess.Popen(
                [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE], stdout=subprocess.PIPE)
            output = process.communicate()
            self.assertEqual(output[0], b'')

    def test_main_with_files_without_mypy_errors(self):
        with self.popen_swap_success:
            with self.install_swap, self.install_mypy_prereq_swap_success:
                process = run_mypy_checks.main(args=['--files', 'file1.py'])
                self.assertEqual(process, 0)

    def test_main_without_mypy_errors(self):
        with self.popen_swap_success:
            with self.install_swap, self.install_mypy_prereq_swap_success:
                process = run_mypy_checks.main(args=[])
                self.assertEqual(process, 0)

    def test_main_with_files_with_mypy_errors(self):
        with self.install_mypy_prereq_swap_success:
            with self.install_swap, self.popen_swap_failure:
                with self.assertRaisesRegex(SystemExit, '2'):
                    run_mypy_checks.main(args=['--files', 'file1.py'])

    def test_main_failure_due_to_mypy_errors(self):
        with self.popen_swap_failure:
            with self.install_swap, self.install_mypy_prereq_swap_success:
                with self.assertRaisesRegex(SystemExit, '2'):
                    run_mypy_checks.main(args=[])

    def test_main_with_install_prerequisites_success(self):
        with self.popen_swap_success, self.install_swap:
            with self.mypy_install_swap:
                process = run_mypy_checks.main(args=[])
                self.assertEqual(process, 0)

    def test_main_with_install_prerequisites_failure(self):
        with self.popen_swap_failure, self.install_swap:
            with self.assertRaisesRegex(SystemExit, '1'):
                run_mypy_checks.main(args=[])
