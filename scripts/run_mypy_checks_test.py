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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import subprocess

from core.tests import test_utils
from scripts import run_mypy_checks

PYTHON_CMD = 'python3'
MYPY_SCRIPT_MODULE = 'scripts.run_mypy_checks'


class MypyScriptChecks(test_utils.GenericTestBase):
    """Tests for MyPy type check runner script."""

    def setUp(self):
        super(MypyScriptChecks, self).setUp()

        process_success = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE)
        def mock_popen_success(
                unused_cmd, stdout=None, stdin=None, stderr=None):  # pylint: disable=unused-argument
            return process_success

        process_failure = subprocess.Popen(['test'], stdout=subprocess.PIPE)
        def mock_popen_failure(
                unused_cmd, stdout=None, stdin=None, stderr=None):  # pylint: disable=unused-argument
            return process_failure

        self.popen_swap_success = self.swap(
            subprocess, 'Popen', mock_popen_success)
        self.popen_swap_failure = self.swap(
            subprocess, 'Popen', mock_popen_failure)

        self.files_swap = self.swap(
            run_mypy_checks, 'NOT_FULLY_COVERED_FILES',
            ['file1.py', 'file2.py'])

        self.directories_swap = self.swap(
            run_mypy_checks, 'EXCLUDED_DIRECTORIES',
            ['dir1/', 'dir2/'])

        def mock_install_mypy_prerequisites_success():
            return 0
        self.swap_install_success = self.swap(
            run_mypy_checks, 'install_mypy_prerequisites',
            mock_install_mypy_prerequisites_success)

    def test_get_mypy_cmd_without_files(self):
        expected_cmd = [
            'mypy', '--exclude', 'file1.py|file2.py|dir1/|dir2/',
            '--config-file', './mypy.ini', '.'
        ]
        with self.files_swap:
            with self.directories_swap:
                cmd = run_mypy_checks.get_mypy_cmd(None)
                self.assertEqual(cmd, expected_cmd)

    def test_get_mypy_cmd_with_files(self):
        expected_cmd = [
            'mypy', '--config-file', './mypy.ini', 'file1.py', 'file2.py'
        ]
        with self.files_swap:
            with self.directories_swap:
                cmd = run_mypy_checks.get_mypy_cmd(['file1.py', 'file2.py'])
                self.assertEqual(cmd, expected_cmd)

    def test_install_mypy_prerequisites_success(self):
        with self.popen_swap_success:
            code = run_mypy_checks.install_mypy_prerequisites()
            self.assertEqual(code, 0)

    def test_install_mypy_prerequisites_failure(self):
        with self.popen_swap_failure:
            with self.swap(
                run_mypy_checks, 'MYPY_REQUIREMENTS_PATH', 'scripts.wrong'):
                code = run_mypy_checks.install_mypy_prerequisites()
                self.assertEqual(code, 1)

    def test_running_script_with_success(self):
        with self.popen_swap_success:
            process = subprocess.Popen(
                [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE], stdout=subprocess.PIPE)
            output = process.communicate()
            self.assertEqual(output[0], 'test\n')

    def test_running_script_with_failure(self):
        with self.popen_swap_failure:
            process = subprocess.Popen(
                [PYTHON_CMD, '-m', MYPY_SCRIPT_MODULE], stdout=subprocess.PIPE)
            output = process.communicate()
            self.assertEqual(output[0], '')

    def test_main_with_files_success(self):
        with self.popen_swap_success:
            with self.swap_install_success:
                process = run_mypy_checks.main(args=['--files', 'file1.py'])
                self.assertEqual(process, 0)

    def test_main_success(self):
        with self.popen_swap_success:
            with self.swap_install_success:
                process = run_mypy_checks.main(args=[])
                self.assertEqual(process, 0)

    def test_main_with_files_failure(self):
        with self.popen_swap_failure:
            with self.swap_install_success:
                with self.assertRaisesRegexp(SystemExit, '1'):
                    run_mypy_checks.main(args=['--files', 'file1.py'])

    def test_main_failure(self):
        with self.popen_swap_failure:
            with self.swap_install_success:
                with self.assertRaisesRegexp(SystemExit, '1'):
                    run_mypy_checks.main(args=[])

    def test_main_install_prerequisites_success(self):
        with self.popen_swap_success:
            process = run_mypy_checks.main(args=[])
            self.assertEqual(process, 0)

    def test_main_install_prerequisites_failure(self):
        with self.popen_swap_failure:
            with self.assertRaisesRegexp(SystemExit, '1'):
                run_mypy_checks.main(args=[])
