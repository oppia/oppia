# coding: utf-8
#
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

"""Unit tests for scripts/run_backend_tests.py."""

from __future__ import annotations

import builtins
import json
import os
import servers
import subprocess
import sys

from core import utils
from core.tests import test_utils
from scripts import concurrent_task_utils
from scripts import common
from scripts import install_third_party_libs
from typing import Any


TEST_RUNNER_PATH = os.path.join(os.getcwd(), 'core', 'tests', 'gae_suite.py')
SHARDS_SPEC_PATH = os.path.join(
    os.getcwd(), 'scripts', 'backend_test_shards.json')
SHARDS_WIKI_LINK = (
    'https://github.com/oppia/oppia/wiki/Writing-backend-tests#common-errors')



class MockTask:
    finished = True
    exception = None
    task_results = []


class MockCompiler:
    def wait(self) -> None: # pylint: disable=missing-docstring
        pass


class MockCompilerContextManager():
    def __init__(self) -> None:
        pass

    def __enter__(self) -> MockCompiler:
        return MockCompiler()

    def __exit__(self, *unused_args: Any) -> None:
        pass


class RunBackendTestsTests(test_utils.GenericTestBase):
    """Test the methods for run_backend_tests script."""

    def setUp(self) -> None:
        super().setUp()

        self.print_arr: list[str] = []
        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)

        def mock_install_third_party_libs() -> None:
            pass
        self.swap_install_third_party_libs = self.swap(
            install_third_party_libs, 'main', mock_install_third_party_libs)
        def mock_fix_third_party_imports() -> None:
            pass
        self.swap_fix_third_party_imports = self.swap(
            common, 'fix_third_party_imports', mock_fix_third_party_imports)

        test_target_flag = '--test_target=random_test'
        self.coverage_exc_list = [
            sys.executable, '-m', 'coverage', 'run',
            '--branch', TEST_RUNNER_PATH, test_target_flag
        ]

        self.terminal_logs = []
        def mock_log(msg: str) -> None:
            self.terminal_logs.append(msg)
        self.swap_logs = self.swap(concurrent_task_utils, 'log', mock_log)
        def mock_context_manager() -> MockCompilerContextManager:
            return MockCompilerContextManager()
        self.swap_redis_server = self.swap(
            servers, 'managed_redis_server', mock_context_manager)
        self.swap_cloud_datastore_emulator = self.swap(
            servers, 'managed_cloud_datastore_emulator', mock_context_manager)

    def test_run_shell_command_successfully(self) -> None:
        class MockTask:
            returncode = 0
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (b'LOG_INFO_TEST: This is task output.\n', b'')

        def mock_popen(
            cmd_tokens: list[str], **unsued_kwargs: Any) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()

        swap_popen = self.swap_with_checks(
            subprocess, 'Popen', mock_popen,
            expected_args=((self.coverage_exc_list,),))

        expected_result = 'LOG_INFO_TEST: This is task output.\n'
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        with swap_popen, self.swap_logs:
            returned_result = run_backend_tests.run_shell_cmd(self.coverage_exc_list)

        self.assertIn('INFO: This is task output.', self.terminal_logs)
        self.assertEqual(expected_result, returned_result)

    def test_run_shell_command_failure_throws_error(self) -> None:
        class MockTask:
            returncode = 1
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (b'', b'Error XYZ occured.')

        def mock_popen(
            cmd_tokens: list[str], **unsued_kwargs: Any) -> MockTask:  # pylint: disable=unused-argument
            return MockTask()

        swap_popen = self.swap_with_checks(
            subprocess, 'Popen', mock_popen,
            expected_args=((self.coverage_exc_list,),))

        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        with swap_popen, self.swap_logs:
            with self.assertRaisesRegex(Exception, 'Error 1\nError XYZ occured.'):
                run_backend_tests.run_shell_cmd(self.coverage_exc_list)

    def test_duplicate_test_files_in_shards_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        with utils.open_file(SHARDS_SPEC_PATH, 'r') as shards_file:
            shards_spec = json.load(shards_file)

        shards_spec['1'].append(shards_spec['1'][0])
        swap_shard_modules = self.swap(
            json, 'loads', lambda *unused_args, **unused_kwargs: shards_spec)

        with swap_shard_modules:
            returned_error_msg = run_backend_tests._check_shards_match_tests()

        self.assertEqual(
            '%s duplicated in %s' % (shards_spec['1'][0], SHARDS_SPEC_PATH),
            returned_error_msg)

    def test_module_in_shards_not_found_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        with utils.open_file(SHARDS_SPEC_PATH, 'r') as shards_file:
            shards_spec = json.load(shards_file)

        shards_spec['1'].append('scripts.new_script_test')
        swap_shard_modules = self.swap(
            json, 'loads', lambda *unused_args, **unused_kwargs: shards_spec)

        with swap_shard_modules:
            returned_error_msg = run_backend_tests._check_shards_match_tests()

        self.assertEqual(
            'Modules %s in shards not found. See %s.' % (
            {'scripts.new_script_test'}, SHARDS_WIKI_LINK),
            returned_error_msg)

    def test_module_not_in_shards_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        test_modules = run_backend_tests._get_all_test_targets_from_path()
        test_modules.append('scripts.new_script_test')

        swap_test_modules = self.swap(
            run_backend_tests, '_get_all_test_targets_from_path',
            lambda *unused_args, **unused_kwargs: test_modules)

        with swap_test_modules:
            returned_error_msg = run_backend_tests._check_shards_match_tests()

        self.assertEqual(
            'Modules %s not in shards. See %s.' % (
            {'scripts.new_script_test'}, SHARDS_WIKI_LINK),
            returned_error_msg)
    
    def test_subprocess_error_while_execution_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        
        test_cmd = 'python -m scripts.run_backend_tests'
        task1 = MockTask()
        task1.exception = subprocess.CalledProcessError(
                returncode=1, cmd=test_cmd)

        tasks = [task1]
        task_to_taskspec = {}
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            'scripts.new_script.py', False)
        
        expected_error_msg = (
            'Command \'%s\' returned non-zero exit status 1.' % test_cmd)
        with self.assertRaisesRegex(
                subprocess.CalledProcessError, expected_error_msg):
            run_backend_tests._check_test_results(
                tasks, task_to_taskspec, False)

    def test_empty_test_files_show_no_tests_were_run(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        
        task1 = MockTask()
        task1.exception = Exception('No tests were run.')

        tasks = [task1]
        task_to_taskspec = {}
        test_target = 'scripts.new_script.py'
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            test_target, False)
        
        with self.print_swap:
            run_backend_tests._check_test_results(
                tasks, task_to_taskspec, False)
        
        self.assertIn(
            'ERROR     %s: No tests found.' % test_target, self.print_arr)
    
    def test_failed_test_suite_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        
        task1 = MockTask()
        task1.exception = Exception(
            'Test suite failed: 6 tests run, 0 errors, '
            '2 failures')

        tasks = [task1]
        task_to_taskspec = {}
        test_target = 'scripts.new_script.py'
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            test_target, False)
        
        with self.print_swap:
            run_backend_tests._check_test_results(
                tasks, task_to_taskspec, False)
        
        self.assertIn(
            'FAILED    %s: %s errors, %s failures' % (test_target, 0, 2),
            self.print_arr)

    def test_tests_failed_due_to_internal_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        
        task1 = MockTask()
        task1.exception = Exception('Some internal error.')

        tasks = [task1]
        task_to_taskspec = {}
        test_target = 'scripts.new_script.py'
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            test_target, False)
        
        with self.print_swap, self.assertRaisesRegex(
            Exception, 'Some internal error.'
        ):
            run_backend_tests._check_test_results(
                tasks, task_to_taskspec, False)
        
        self.assertIn(
            '    WARNING: FAILED TO RUN %s' % test_target, self.print_arr)
        self.assertIn(
            '    This is most likely due to an import error.', self.print_arr)
    
    def test_unfinished_tests_are_cancelled(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        
        task = MockTask()
        task.finished = False
        task_output = ['Ran 9 tests in 1.244s', '98']
        task_result = concurrent_task_utils.TaskResult(
            'task1', False, task_output, task_output)
        task.task_results.append(task_result)

        tasks = [task]
        task_to_taskspec = {}
        test_target = 'scripts.new_script.py'
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            test_target, False)

        with self.print_swap:
            run_backend_tests._check_test_results(
                tasks, task_to_taskspec, True)

        self.assertIn('CANCELED  %s' % test_target, self.print_arr)
    
    def test_incomplete_coverage_is_calculated_correctly(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        
        task = MockTask()
        task_output = ['Ran 9 tests in 1.244s', '98']
        task_result = concurrent_task_utils.TaskResult(
            'task1', False, task_output, task_output)
        task.task_results.append(task_result)

        tasks = [task]
        task_to_taskspec = {}
        test_target = 'scripts.new_script.py'
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            test_target, True)

        with self.print_swap:
            run_backend_tests._check_test_results(
                tasks, task_to_taskspec, True)

        self.assertIn(
            'INCOMPLETE COVERAGE (98%%): %s' % test_target, self.print_arr)
    
    def test_successfull_test_run_message_is_printed_correctly(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        
        task = MockTask()
        task_output = ['Ran 9 tests in 1.234s', '100']
        task_result = concurrent_task_utils.TaskResult(
            'task1', False, task_output, task_output)
        task.task_results.append(task_result)

        tasks = [task]
        task_to_taskspec = {}
        test_target = 'scripts.new_script.py'
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            test_target, True)

        with self.print_swap:
            run_backend_tests._check_test_results(
                tasks, task_to_taskspec, False)

        self.assertIn(
            'SUCCESS   %s: 9 tests (1.2 secs)' % test_target,
            self.print_arr)
    
    def test_test_failed_due_to_error_in_parsing_coverage_report(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        
        task = MockTask()
        task_output = ['XYZ', '100']
        task_result = concurrent_task_utils.TaskResult(
            'task1', False, task_output, task_output)
        task.task_results = [task_result]

        tasks = [task]
        task_to_taskspec = {}
        test_target = 'scripts.random_script.py'
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            test_target, True)

        with self.print_swap:
            run_backend_tests._check_test_results(
                tasks, task_to_taskspec, True)

        self.assertIn(
            'An unexpected error occurred. '
            'Task output:\nXYZ',
            self.print_arr)

    def test_invalid_directory_in_sys_path_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        def mock_path_exists(dirname: str) -> None:
            for directory in common.DIRS_TO_ADD_TO_SYS_PATH:
                if os.path.dirname(directory) == dirname:
                    return False
            return True
        swap_path_exists = self.swap(os.path, 'exists', mock_path_exists)

        with swap_path_exists, self.assertRaisesRegex(
            Exception,
            'Directory %s does not exist.' % common.DIRS_TO_ADD_TO_SYS_PATH[0]
        ):
            run_backend_tests.main(args=[])
    
    # def test_invalid_delimiter_in_test_path_argument_throws_error(self) -> None:
    #     with self.swap_install_third_party_libs:
    #         from scripts import run_backend_tests
        
    #     with self.swap_fix_third_party_imports, self.assertRaisesRegex(
    #         Exception,
    #         'The delimiter in test_path should be a slash (/).'
    #     ):
    #         run_backend_tests.main(
    #             args=['--test_path', 'scripts.run_backend_tests'])

    def test_invalid_delimiter_in_test_target_argument_throws_error(
            self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        
        with self.swap_fix_third_party_imports, self.assertRaisesRegex(
            Exception,
            'The delimiter in test_target should be a dot (.).'
        ):
            run_backend_tests.main(
                args=['--test_target', 'scripts/run_backend_tests'])
