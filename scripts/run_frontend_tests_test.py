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

"""Unit tests for scripts/run_frontend_tests.py."""

from __future__ import annotations

import builtins
import os
import subprocess
import sys

from core.tests import test_utils

from . import build
from . import check_frontend_test_coverage
from . import common
from . import install_third_party_libs
from . import run_frontend_tests


class RunFrontendTestsTests(test_utils.GenericTestBase):
    """Unit tests for scripts/run_frontend_tests.py."""

    def setUp(self) -> None:
        super().setUp()

        self.print_arr: list[str] = []
        def mock_print(msg: str, end: str = '\n') -> None:  # pylint: disable=unused-argument
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)

        class MockFile:
            counter = 0
            def readline(self) -> bytes: # pylint: disable=missing-docstring
                self.counter += 1
                if self.counter > 1:
                    self.counter = 0
                    return b''
                return b'Executed tests. Trying to get the Angular injector..'

        class MockTask:
            returncode = 0
            stdout = MockFile()
            def poll(self) -> int: # pylint: disable=missing-docstring
                return 1
            def wait(self) -> None: # pylint: disable=missing-docstring
                return None

        class MockFailedTask:
            returncode = 1
            stdout = MockFile()
            def poll(self) -> int: # pylint: disable=missing-docstring
                return 1
            def wait(self) -> None: # pylint: disable=missing-docstring
                return None

        self.cmd_token_list: list[list[str]] = []
        def mock_success_check_call(
            cmd_tokens: list[str], **unused_kwargs: str) -> MockTask:  # pylint: disable=unused-argument
            self.cmd_token_list.append(cmd_tokens)
            return MockTask()
        def mock_failed_check_call(
            cmd_tokens: list[str], **unused_kwargs: str) -> MockFailedTask:  # pylint: disable=unused-argument
            self.cmd_token_list.append(cmd_tokens)
            return MockFailedTask()

        self.sys_exit_message: list[str] = []
        def mock_sys_exit(error_message: str) -> None:
            self.sys_exit_message.append(error_message)

        self.build_args: list[list[str]] = []
        def mock_build(args: list[str]) -> None:
            self.build_args.append(args)

        self.frontend_coverage_checks_called = False
        def mock_check_frontend_coverage() -> None:
            self.frontend_coverage_checks_called = True

        self.swap_success_Popen = self.swap(
            subprocess, 'Popen', mock_success_check_call)
        self.swap_failed_Popen = self.swap(
            subprocess, 'Popen', mock_failed_check_call)
        self.swap_sys_exit = self.swap(sys, 'exit', mock_sys_exit)
        self.swap_build = self.swap(build, 'main', mock_build)
        self.swap_common = self.swap(
            common, 'print_each_string_after_two_new_lines', lambda _: None)
        self.swap_install_third_party_libs = self.swap(
            install_third_party_libs, 'main', lambda: None)
        self.swap_check_frontend_coverage = self.swap(
            check_frontend_test_coverage, 'main', mock_check_frontend_coverage)

    def test_run_dtslint_type_tests_passed(self) -> None:
        with self.swap_success_Popen, self.print_swap:
            run_frontend_tests.run_dtslint_type_tests()
        cmd = ['./node_modules/dtslint/bin/index.js',
           run_frontend_tests.DTSLINT_TYPE_TESTS_DIR_RELATIVE_PATH,
           '--localTs',
           run_frontend_tests.TYPESCRIPT_DIR_RELATIVE_PATH]
        self.assertIn(cmd, self.cmd_token_list)
        self.assertIn('Running dtslint type tests.', self.print_arr)
        self.assertNotIn(
            'The dtslint (type tests) failed.', self.sys_exit_message)

    def test_run_dtslint_type_tests_failed(self) -> None:
        with self.swap_failed_Popen, self.print_swap:
            with self.swap_sys_exit:
                run_frontend_tests.run_dtslint_type_tests()
        cmd = ['./node_modules/dtslint/bin/index.js',
           run_frontend_tests.DTSLINT_TYPE_TESTS_DIR_RELATIVE_PATH,
           '--localTs',
           run_frontend_tests.TYPESCRIPT_DIR_RELATIVE_PATH]
        self.assertIn(cmd, self.cmd_token_list)
        self.assertIn('Running dtslint type tests.', self.print_arr)
        self.assertIn(
            'The dtslint (type tests) failed.', self.sys_exit_message)

    def test_no_tests_are_run_when_dtslint_flag_passed(self) -> None:
        with self.swap_success_Popen, self.print_swap:
            run_frontend_tests.main(args=['--dtslint_only'])
        self.assertIn('Running dtslint type tests.', self.print_arr)
        self.assertIn('Done!', self.print_arr)
        self.assertEqual(len(self.cmd_token_list), 1)

    def test_frontend_tests_passed(self) -> None:
        with self.swap_success_Popen, self.print_swap, self.swap_build:
            with self.swap_install_third_party_libs, self.swap_common:
                with self.swap_check_frontend_coverage:
                    run_frontend_tests.main(args=['--check_coverage'])

        cmd = [
            common.NODE_BIN_PATH, '--max-old-space-size=4096',
            os.path.join(common.NODE_MODULES_PATH, 'karma', 'bin', 'karma'),
            'start', os.path.join('core', 'tests', 'karma.conf.ts')]
        self.assertIn(cmd, self.cmd_token_list)
        self.assertIn(
            'If you run into the error "Trying to get the Angular injector",'
            ' please see https://github.com/oppia/oppia/wiki/'
            'Frontend-unit-tests-guide#how-to-handle-common-errors'
            ' for details on how to fix it.', self.print_arr)
        self.assertTrue(self.frontend_coverage_checks_called)
        self.assertEqual(len(self.sys_exit_message), 0)

    def test_frontend_tests_failed(self) -> None:
        with self.swap_failed_Popen, self.print_swap, self.swap_build:
            with self.swap_install_third_party_libs, self.swap_common:
                with self.swap_check_frontend_coverage, self.swap_sys_exit:
                    run_frontend_tests.main(args=['--verbose'])

        cmd = [
            common.NODE_BIN_PATH, '--max-old-space-size=4096',
            os.path.join(common.NODE_MODULES_PATH, 'karma', 'bin', 'karma'),
            'start', os.path.join('core', 'tests', 'karma.conf.ts'),
            '--terminalEnabled']
        self.assertIn(cmd, self.cmd_token_list)
        self.assertFalse(self.frontend_coverage_checks_called)
        self.assertIn(1, self.sys_exit_message)

    def test_frontend_tests_are_run_correctly_on_production(self) -> None:
        with self.swap_success_Popen, self.print_swap, self.swap_build:
            with self.swap_install_third_party_libs, self.swap_common:
                with self.swap_check_frontend_coverage:
                    run_frontend_tests.main(args=['--run_minified_tests'])

        cmd = [
            common.NODE_BIN_PATH, '--max-old-space-size=4096',
            os.path.join(common.NODE_MODULES_PATH, 'karma', 'bin', 'karma'),
            'start', os.path.join('core', 'tests', 'karma.conf.ts'),
            '--prodEnv']
        self.assertIn(cmd, self.cmd_token_list)
        self.assertIn('Running test in production environment', self.print_arr)
        self.assertIn(
            ['--prod_env', '--minify_third_party_libs_only'], self.build_args)

    def test_coverage_checks_are_not_run_when_frontend_tests_fail(
        self) -> None:
        with self.swap_failed_Popen, self.print_swap, self.swap_build:
            with self.swap_install_third_party_libs, self.swap_common:
                with self.swap_check_frontend_coverage, self.swap_sys_exit:
                    run_frontend_tests.main(args=['--check_coverage'])

        cmd = [
            common.NODE_BIN_PATH, '--max-old-space-size=4096',
            os.path.join(common.NODE_MODULES_PATH, 'karma', 'bin', 'karma'),
            'start', os.path.join('core', 'tests', 'karma.conf.ts')]
        self.assertIn(cmd, self.cmd_token_list)
        self.assertFalse(self.frontend_coverage_checks_called)
        self.assertIn(
            'The frontend tests failed. Please fix it before running'
            ' the test coverage check.', self.sys_exit_message)

    def test_combined_frontend_spec_file_download_failed(self) -> None:
        with self.swap_failed_Popen, self.print_swap, self.swap_build:
            with self.swap_install_third_party_libs, self.swap_common:
                with self.swap_check_frontend_coverage, self.swap_sys_exit:
                    run_frontend_tests.main(
                        args=['--download_combined_frontend_spec_file'])

        combined_spec_download_cmd = [
            'wget',
            'http://localhost:9876/base/core/templates/' +
            'combined-tests.spec.js',
            '-P',
            os.path.join('../karma_coverage_reports')]
        self.assertIn(combined_spec_download_cmd, self.cmd_token_list)
        self.assertIn(
            'Failed to download the combined-tests.spec.js file.',
            self.print_arr)

    def test_combined_frontend_spec_file_is_downloaded_correctly(self) -> None:
        with self.swap_success_Popen, self.print_swap, self.swap_build:
            with self.swap_install_third_party_libs, self.swap_common:
                with self.swap_check_frontend_coverage, self.swap_sys_exit:
                    run_frontend_tests.main(
                        args=['--download_combined_frontend_spec_file'])

        combined_spec_download_cmd = [
            'wget',
            'http://localhost:9876/base/core/templates/' +
            'combined-tests.spec.js',
            '-P',
            os.path.join('../karma_coverage_reports')]
        self.assertIn(combined_spec_download_cmd, self.cmd_token_list)
        self.assertIn(
            'Downloaded the combined-tests.spec.js file and stored'
            'in ../karma_coverage_reports', self.print_arr)
