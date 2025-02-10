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
import socket
import subprocess
import sys
import tempfile
import threading

from core import feconf
from core import utils
from core.tests import test_utils
from scripts import common
from scripts import concurrent_task_utils
from scripts import git_changes_utils
from scripts import install_third_party_libs
from scripts import servers

from typing import Callable, Final, List, Set, Tuple

TEST_RUNNER_PATH: Final = os.path.join(
    os.getcwd(), 'core', 'tests', 'gae_suite.py'
)
SHARDS_SPEC_PATH: Final = os.path.join(
    os.getcwd(), 'scripts', 'backend_test_shards.json'
)
SHARDS_WIKI_LINK: Final = (
    'https://github.com/oppia/oppia/wiki/Writing-backend-tests#common-errors'
)
_LOAD_TESTS_DIR: Final = os.path.join(
    os.getcwd(), 'core', 'tests', 'load_tests'
)


def test_function(_: str) -> Callable[[], None]:
    def task_func() -> None:
        pass
    return task_func


class MockCompiler:
    def wait(self) -> None: # pylint: disable=missing-docstring
        pass


class MockCompilerContextManager():
    def __init__(self) -> None:
        pass

    def __enter__(self) -> MockCompiler:
        return MockCompiler()

    def __exit__(self, *unused_args: str) -> None:
        pass


class MockProcessOutput:
    returncode = 0
    stdout = ''


class RunBackendTestsTests(test_utils.GenericTestBase):
    """Test the methods for run_backend_tests script."""

    def setUp(self) -> None:
        super().setUp()
        self.semaphore = threading.Semaphore(1)
        self.print_arr: list[str] = []

        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)

        def mock_install_third_party_libs() -> None:
            pass
        # We need to create a swap for install_third_party_libs because
        # run_backend_tests.py script installs third party libraries whenever
        # it is imported.
        self.swap_install_third_party_libs = self.swap(
            install_third_party_libs, 'main', mock_install_third_party_libs)

        test_target_flag = '--test_target=random_test'
        self.coverage_exc_list = [
            sys.executable, '-m', 'coverage', 'run',
            '--branch', TEST_RUNNER_PATH, test_target_flag
        ]
        self.coverage_combine_cmd = [
            sys.executable, '-m', 'coverage', 'combine']
        self.coverage_check_cmd = [
            sys.executable, '-m', 'coverage', 'report',
            '--omit="%s*","third_party/*","/usr/share/*"'
            % common.OPPIA_TOOLS_DIR, '--show-missing',
            '--skip-covered']
        self.call_count = 0

        self.terminal_logs: List[str] = []

        def mock_log(msg: str) -> None:
            self.terminal_logs.append(msg)
        self.swap_logs = self.swap(concurrent_task_utils, 'log', mock_log)

        def mock_context_manager(**_: str) -> MockCompilerContextManager:
            return MockCompilerContextManager()
        self.swap_redis_server = self.swap(
            servers, 'managed_redis_server', mock_context_manager)
        self.swap_cloud_datastore_emulator = self.swap(
            servers, 'managed_cloud_datastore_emulator', mock_context_manager)
        self.swap_execute_task = self.swap(
            concurrent_task_utils, 'execute_tasks', lambda *unused_args: None)

    def test_run_shell_command_successfully(self) -> None:
        class MockProcess:
            returncode = 0
            def communicate(self) -> tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (b'LOG_INFO_TEST: This is task output.\n', b'')

        def mock_popen(
            cmd_tokens: list[str], **unsued_kwargs: str  # pylint: disable=unused-argument
        ) -> MockProcess:
            return MockProcess()

        swap_popen = self.swap_with_checks(
            subprocess, 'Popen', mock_popen,
            expected_args=((self.coverage_exc_list,),))

        expected_result = 'LOG_INFO_TEST: This is task output.\n'
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        with swap_popen, self.swap_logs:
            returned_result = run_backend_tests.run_shell_cmd(
                self.coverage_exc_list)

        self.assertIn('INFO: This is task output.', self.terminal_logs)
        self.assertEqual(expected_result, returned_result)

    def test_run_shell_command_failure_throws_error(self) -> None:
        class MockProcess:
            returncode = 1
            def communicate(self) -> Tuple[bytes, bytes]:   # pylint: disable=missing-docstring
                return (b'', b'Error XYZ occured.')

        def mock_popen(
            cmd_tokens: List[str], **unsued_kwargs: str  # pylint: disable=unused-argument
        ) -> MockProcess:
            return MockProcess()

        swap_popen = self.swap_with_checks(
            subprocess, 'Popen', mock_popen,
            expected_args=((self.coverage_exc_list,),))

        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        with swap_popen, self.swap_logs:
            with self.assertRaisesRegex(
                    Exception, 'Error 1\nError XYZ occured.'):
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
            returned_error_msg = run_backend_tests.check_shards_match_tests()

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
            returned_error_msg = run_backend_tests.check_shards_match_tests()

        self.assertEqual(
            'Modules %s are in the backend test shards but missing from the '
            'filesystem. See %s.' % (
            {'scripts.new_script_test'}, SHARDS_WIKI_LINK),
            returned_error_msg)

    def test_module_not_in_shards_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        test_modules = run_backend_tests.get_all_test_targets_from_path()
        test_modules.append('scripts.new_script_test')

        swap_test_modules = self.swap(
            run_backend_tests, 'get_all_test_targets_from_path',
            lambda *unused_args, **unused_kwargs: test_modules)

        with swap_test_modules:
            returned_error_msg = run_backend_tests.check_shards_match_tests()

        self.assertEqual(
            'Modules %s are present on the filesystem but are not listed in '
            'the backend test shards. See %s.' % (
            {'scripts.new_script_test'}, SHARDS_WIKI_LINK),
            returned_error_msg)

    def test_tests_in_load_tests_dir_are_not_included_when_flag_is_passed(
            self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        test_modules = run_backend_tests.get_all_test_targets_from_path(
            include_load_tests=False)
        self.assertNotIn(os.path.join(
            _LOAD_TESTS_DIR, 'new_test.py'), test_modules)

    def test_subprocess_error_while_execution_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        test_cmd = 'python -m scripts.run_backend_tests'
        task1 = concurrent_task_utils.create_task(
            test_function('unused_arg'), False, self.semaphore, name='test')
        task1.exception = subprocess.CalledProcessError(
            returncode=1, cmd=test_cmd
        )
        task1.finished = True

        tasks = [task1]
        task_to_taskspec = {}
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            'scripts.new_script.py', False)

        expected_error_msg = (
            'Command \'%s\' returned non-zero exit status 1.' % test_cmd)
        with self.assertRaisesRegex(
                subprocess.CalledProcessError, expected_error_msg):
            run_backend_tests.check_test_results(
                tasks, task_to_taskspec)

    def test_empty_test_files_show_no_tests_were_run(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        task1 = concurrent_task_utils.create_task(
            test_function, False, self.semaphore, name='test'
        )
        task1.exception = Exception('No tests were run.')
        task1.finished = True

        tasks = [task1]
        task_to_taskspec = {}
        test_target = 'scripts.new_script.py'
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            test_target, False)

        with self.print_swap:
            run_backend_tests.check_test_results(
                tasks, task_to_taskspec)

        self.assertIn(
            'ERROR     %s: No tests found.' % test_target, self.print_arr)

    def test_failed_test_suite_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        task1 = concurrent_task_utils.create_task(
            test_function, False, self.semaphore, name='test'
        )
        task1.exception = Exception(
            'Test suite failed: 6 tests run, 0 errors, '
            '2 failures')
        task1.finished = True

        tasks = [task1]
        task_to_taskspec = {}
        test_target = 'scripts.new_script.py'
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            test_target, False)

        with self.print_swap:
            run_backend_tests.check_test_results(
                tasks, task_to_taskspec)

        self.assertIn(
            'FAILED    %s: %s errors, %s failures' % (test_target, 0, 2),
            self.print_arr)

    def test_tests_failed_due_to_internal_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        task1 = concurrent_task_utils.create_task(
            test_function, False, self.semaphore, name='test'
        )
        task1.exception = Exception('Some internal error.')
        task1.finished = True

        tasks = [task1]
        task_to_taskspec = {}
        test_target = 'scripts.new_script.py'
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            test_target, False)

        with self.print_swap, self.assertRaisesRegex(
            Exception, 'Some internal error.'
        ):
            run_backend_tests.check_test_results(
                tasks, task_to_taskspec)

        self.assertIn(
            '    WARNING: FAILED TO RUN %s' % test_target, self.print_arr)
        self.assertIn(
            '    This is most likely due to an import error.', self.print_arr)

    def test_unfinished_tests_are_cancelled(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        task = concurrent_task_utils.create_task(
            test_function, False, self.semaphore, name='test'
        )
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
            run_backend_tests.check_test_results(
                tasks, task_to_taskspec)

        self.assertIn('CANCELED  %s' % test_target, self.print_arr)

    def test_successfull_test_run_message_is_printed_correctly(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        task1 = concurrent_task_utils.create_task(
            test_function, False, self.semaphore, name='test'
        )
        task1.finished = True
        task1_output = ['Ran 9 tests in 1.234s', '100']
        task1_result = concurrent_task_utils.TaskResult(
            'task1', False, task1_output, task1_output)
        task1.task_results.append(task1_result)

        task2 = concurrent_task_utils.create_task(
            test_function, False, self.semaphore, name='test'
        )
        task2.finished = True
        task2_output = ['Ran 9 tests in 2.542s', '100']
        task2_result = concurrent_task_utils.TaskResult(
            'task2', False, task2_output, task2_output)
        task2.task_results.append(task2_result)

        tasks = [task1, task2]
        task_to_taskspec = {}
        test1_target = 'scripts.new_script_one_test.py'
        task2_target = 'scripts.new_script_two_test.py'
        task_to_taskspec[tasks[0]] = run_backend_tests.TestingTaskSpec(
            test1_target, True)
        task_to_taskspec[tasks[1]] = run_backend_tests.TestingTaskSpec(
            task2_target, True)

        with self.print_swap, self.swap(
            run_backend_tests, 'AVERAGE_TEST_CASE_TIME', 1
        ):
            _, _, _, time_report = run_backend_tests.check_test_results(
                tasks, task_to_taskspec)

        self.assertEqual(
            time_report,
            {
                'scripts.new_script_one_test.py': (1.234, 9),
                'scripts.new_script_two_test.py': (2.542, 9)
            }
        )
        self.assertIn(
            'SUCCESS   %s: 9 tests (1.2 secs)' % test1_target,
            self.print_arr)
        self.assertIn(
            'SUCCESS   %s: 9 tests (2.5 secs)' % task2_target,
            self.print_arr)

    def test_successful_test_run_with_generate_time_report_flag(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        expected_time_report = {
            'scripts.new_script_one_test.py': [1.234, 9],
            'scripts.new_script_two_test.py': [2.542, 9]
        }
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (
                100, 0, 0, expected_time_report)
        )
        swap_check_coverage = self.swap(
            run_backend_tests, 'check_coverage',
            lambda *unused_args, **unused_kwargs: ('Coverage report', 100.00)
        )
        time_report_temp_file = tempfile.NamedTemporaryFile('w+')
        time_report_path = time_report_temp_file.name
        swap_time_report_path = self.swap(
            run_backend_tests, 'TIME_REPORT_PATH', time_report_path)

        with self.swap_execute_task, swap_check_coverage:
            with self.swap_cloud_datastore_emulator, swap_check_results:
                with swap_time_report_path, self.swap_redis_server:
                    with self.swap(
                        run_backend_tests, 'AVERAGE_TEST_CASE_TIME', 1
                    ), self.print_swap:
                        run_backend_tests.main(
                            args=['--generate_time_report'])
        loaded_time_report = json.loads(time_report_temp_file.read())
        self.assertEqual(loaded_time_report, expected_time_report)
        time_report_temp_file.close()

    def test_test_failed_due_to_error_in_parsing_coverage_report(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        task = concurrent_task_utils.create_task(
            test_function, False, self.semaphore, name='test'
        )
        task.finished = True
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
            run_backend_tests.check_test_results(
                tasks, task_to_taskspec)

        self.assertIn(
            'An unexpected error occurred. '
            'Task output:\nXYZ',
            self.print_arr)

    def test_invalid_directory_in_sys_path_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        def mock_path_exists(dirname: str) -> bool:
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

    def test_invalid_delimiter_in_test_path_argument_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        with self.assertRaisesRegex(
            Exception, r'The delimiter in test_path should be a slash \(/\)'
        ):
            run_backend_tests.main(
                args=['--test_path', 'scripts.run_backend_tests'])

    def test_invalid_delimiter_in_test_targets_argument_throws_error(
            self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        with self.swap_redis_server, self.swap_cloud_datastore_emulator:
            with self.assertRaisesRegex(
                Exception,
                r'The delimiter in each test_target should be a dot \(\.\)'
            ):
                run_backend_tests.main(
                    args=['--test_targets', 'scripts/run_backend_tests'])

    def test_invalid_test_targets_message_is_displayed_correctly(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (100, 0, 0, {}))
        swapcheck_coverage = self.swap(
            run_backend_tests, 'check_coverage',
            lambda *unused_args, **unused_kwargs: ('', 100.00))
        with self.swap_execute_task, swapcheck_coverage, self.swap_redis_server:
            with self.swap_cloud_datastore_emulator, swap_check_results:
                with self.print_swap:
                    run_backend_tests.main(
                        args=['--test_targets', 'scripts.run_backend_tests.py'])

        self.assertIn(
            'WARNING : each test_target should point to the test file.',
            self.print_arr)
        self.assertIn(
            'Redirecting to its corresponding test file...', self.print_arr)

    def test_invalid_test_targets_message_is_displayed_docker(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (100, 0, 0, {}))
        swapcheck_coverage = self.swap(
            run_backend_tests, 'check_coverage',
            lambda *unused_args, **unused_kwargs: ('', 100.00))
        with self.swap(feconf, 'OPPIA_IS_DOCKERIZED', True):
            with self.swap_execute_task, swapcheck_coverage:
                with self.swap_cloud_datastore_emulator, swap_check_results:
                    with self.print_swap, self.swap_redis_server:
                        run_backend_tests.main(
                            args=['--test_targets',
                                  'scripts.run_backend_tests.py'])

        self.assertIn(
            'WARNING : each test_target should point to the test file.',
            self.print_arr)
        self.assertIn(
            'Redirecting to its corresponding test file...', self.print_arr)

    def test_error_in_matching_shards_with_tests_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (100, 0, 0, {}))
        swapcheck_coverage = self.swap(
            run_backend_tests, 'check_coverage',
            lambda *unused_args, **unused_kwargs: ('', 100.00))

        error_msg = 'Some error in matching shards with tests.'
        def mockcheck_shards_match_tests(**unused_kwargs: str) -> str:
            return error_msg
        swapcheck_shards_match_tests = self.swap_with_checks(
            run_backend_tests, 'check_shards_match_tests',
            mockcheck_shards_match_tests,
            expected_kwargs=[{'include_load_tests': True}])
        with self.swap_execute_task, swapcheck_coverage, self.swap_redis_server:
            with self.swap_cloud_datastore_emulator, swap_check_results:
                with self.print_swap, swapcheck_shards_match_tests:
                    with self.assertRaisesRegex(Exception, error_msg):
                        run_backend_tests.main(args=['--test_shard', '1'])

    def test_no_tests_run_raises_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (0, 0, 0, {}))
        swapcheck_coverage = self.swap(
            run_backend_tests, 'check_coverage',
            lambda *unused_args, **unused_kwargs: ('', 100.00))

        with swapcheck_coverage, self.swap_cloud_datastore_emulator:
            with self.swap_redis_server, swap_check_results:
                with self.swap_execute_task, self.assertRaisesRegex(
                    Exception, 'WARNING: No tests were run.'
                ):
                    run_backend_tests.main(
                        args=[
                            '--test_targets',
                            'scripts.run_backend_tests_test'
                        ]
                    )

    def test_incomplete_overall_backend_coverage_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (100, 0, 0, {}))
        swapcheck_coverage = self.swap(
            run_backend_tests, 'check_coverage',
            lambda *unused_args, **unused_kwargs: ('Coverage report', 98.00))

        with swapcheck_coverage, self.swap_redis_server, self.print_swap:
            with self.swap_cloud_datastore_emulator, swap_check_results:
                with self.swap_execute_task:
                    with self.assertRaisesRegex(
                        Exception, 'Backend test coverage is not 100%'
                    ):
                        run_backend_tests.main(
                            args=['--generate_coverage_report'])

        self.assertIn('Coverage report', self.print_arr)

    def test_failure_in_test_execution_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        def mock_execute_tasks(*_: str) -> None:
            raise Exception('XYZ error occured.')
        self.swap_execute_task = self.swap(
            concurrent_task_utils, 'execute_tasks', mock_execute_tasks)
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (100, 0, 0, {}))

        with self.swap_execute_task, self.swap_redis_server, swap_check_results:
            with self.swap_cloud_datastore_emulator, self.assertRaisesRegex(
                Exception, 'Task execution failed.'
            ):
                run_backend_tests.main(args=[])

    def test_errors_in_test_suite_throw_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (100, 2, 0, {}))

        with self.swap_execute_task, self.swap_redis_server, swap_check_results:
            with self.swap_cloud_datastore_emulator, self.print_swap:
                with self.assertRaisesRegex(Exception, '2 errors, 0 failures'):
                    run_backend_tests.main(args=['--test_shard', '1'])

        self.assertIn('(2 ERRORS, 0 FAILURES)', self.print_arr)

    def test_individual_test_in_test_file_is_run_successfully(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        executed_tasks = []
        test_target = (
            'scripts.new_test_file_test.NewTestFileTests.test_for_something')

        def mock_execute(
            tasks: List[concurrent_task_utils.TaskThread], *_: str
        ) -> None:
            for task in tasks:
                executed_tasks.append(task)

        swap_execute_task = self.swap(
            concurrent_task_utils, 'execute_tasks', mock_execute)
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (100, 0, 0, {}))
        swap_check_coverage = self.swap(
            run_backend_tests, 'check_coverage',
            lambda *unused_args, **unused_kwargs: ('Coverage report', 100.00))

        args = ['--test_targets', test_target, '--generate_coverage_report']
        with self.print_swap:
            with swap_check_coverage, self.swap_redis_server, swap_execute_task:
                with self.swap_cloud_datastore_emulator, swap_check_results:
                    run_backend_tests.main(args=args)

        self.assertEqual(len(executed_tasks), 1)
        self.assertEqual(executed_tasks[0].name, test_target)
        self.assertIn('All tests passed.', self.print_arr)
        self.assertIn('Done!', self.print_arr)

    def test_multiple_tests_in_test_targets_argument_is_run_successfully(
        self
    ) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        executed_tasks = []
        test_targets = (
            'scripts.test_file_test,'
            'scripts.another_test_file_test'
        )

        def mock_execute(
            tasks: List[concurrent_task_utils.TaskThread], *_: str
        ) -> None:
            for task in tasks:
                executed_tasks.append(task)

        swap_execute_task = self.swap(
            concurrent_task_utils, 'execute_tasks', mock_execute)
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (100, 0, 0, {}))

        args = ['--test_targets', test_targets]
        with self.print_swap, self.swap_redis_server, swap_execute_task:
            with self.swap_cloud_datastore_emulator, swap_check_results:
                run_backend_tests.main(args=args)

        self.assertEqual(len(executed_tasks), 2)
        self.assertEqual(
            executed_tasks[0].name, test_targets.split(',', maxsplit=1)[0])
        self.assertEqual(executed_tasks[1].name, test_targets.split(',')[1])
        self.assertIn('All tests passed.', self.print_arr)
        self.assertIn('Done!', self.print_arr)

    def test_successful_test_run_with_run_on_changed_files_in_branch_flag(
        self
    ) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        def mock_get_changed_python_test_files() -> Set[str]:
            return {
                'test.file1_test',
                'test.file2_test',
                'test.file3_test'
            }

        executed_tasks = []

        def mock_execute(
            tasks: List[concurrent_task_utils.TaskThread], *_: str
        ) -> None:
            for task in tasks:
                executed_tasks.append(task)

        swap_execute_task = self.swap(
            concurrent_task_utils, 'execute_tasks', mock_execute)
        get_changed_python_test_files_swap = self.swap(
            git_changes_utils, 'get_changed_python_test_files',
            mock_get_changed_python_test_files)
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (
                100, 0, 0, {})
        )

        with swap_execute_task, self.print_swap:
            with self.swap_cloud_datastore_emulator, swap_check_results:
                with self.swap_redis_server, get_changed_python_test_files_swap:
                    run_backend_tests.main(
                        args=['--run_on_changed_files_in_branch'])

        self.assertEqual(len(executed_tasks), 3)
        self.assertIn('All tests passed.', self.print_arr)
        self.assertIn('Done!', self.print_arr)

    def test_backend_tests_with_run_on_changed_files_in_branch_no_remote(
        self
    ) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        def mock_get_remote_name() -> str:
            return ''

        get_remote_name_swap = self.swap(
            git_changes_utils, 'get_local_git_repository_remote_name',
            mock_get_remote_name)

        with get_remote_name_swap, self.swap_redis_server:
            with self.swap_cloud_datastore_emulator, self.assertRaisesRegex(
                SystemExit, 'Error: No remote repository found.'
            ):
                run_backend_tests.main(
                    args=['--run_on_changed_files_in_branch'])

    def test_all_test_pass_successfully_with_full_coverage(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        swap_check_results = self.swap(
            run_backend_tests, 'check_test_results',
            lambda *unused_args, **unused_kwargs: (100, 0, 0, {}))
        swap_check_coverage = self.swap(
            run_backend_tests, 'check_coverage',
            lambda *unused_args, **unused_kwargs: ('Coverage report', 100.00))

        with self.swap_execute_task, swap_check_results:
            with swap_check_coverage, self.swap_redis_server, self.print_swap:
                with self.swap_cloud_datastore_emulator:
                    run_backend_tests.main(
                        args=['--generate_coverage_report'])

        self.assertIn('Coverage report', self.print_arr)
        self.assertIn('All tests passed.', self.print_arr)
        self.assertIn('Done!', self.print_arr)

    def test_failure_to_combine_coverage_report_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        failed_process_output = MockProcessOutput()
        failed_process_output.returncode = 1

        def mock_subprocess_run(cmd: List[str], **_: str) -> MockProcessOutput:
            if cmd == self.coverage_combine_cmd:
                return failed_process_output
            elif cmd == self.coverage_check_cmd:
                return MockProcessOutput()
            else:
                raise Exception(
                    'Invalid command passed to subprocess.run() method')

        swap_subprocess_run = self.swap(subprocess, 'run', mock_subprocess_run)
        error_msg = (
            'Failed to combine coverage because subprocess failed.'
            '\n%s' % failed_process_output)
        with swap_subprocess_run, self.assertRaisesRegex(
                RuntimeError, error_msg):
            run_backend_tests.check_coverage(True)

    def test_failure_to_calculate_coverage_report_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        failed_process_output = MockProcessOutput()
        failed_process_output.returncode = 1

        def mock_subprocess_run(cmd: List[str], **_: str) -> MockProcessOutput:
            if cmd == self.coverage_combine_cmd:
                return MockProcessOutput()
            elif cmd == self.coverage_check_cmd:
                return failed_process_output
            else:
                raise Exception(
                    'Invalid command passed to subprocess.run() method')

        swap_subprocess_run = self.swap(subprocess, 'run', mock_subprocess_run)
        error_msg = (
            'Failed to calculate coverage because subprocess failed. '
            '%s' % failed_process_output)
        with swap_subprocess_run, self.assertRaisesRegex(
                RuntimeError, error_msg):
            run_backend_tests.check_coverage(True)

    def test_coverage_is_calculated_correctly_for_specific_files(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        include_files = (
            'scripts/run_backend_tests.py', 'core/domain/exp_domain.py')
        self.coverage_check_cmd.append('--include=%s' % ','.join(include_files))
        coverage_report_output = 'TOTAL       283     36    112     10    86% '
        process = MockProcessOutput()
        process.stdout = coverage_report_output

        def mock_subprocess_run(cmd: List[str], **_: str) -> MockProcessOutput:
            if cmd == self.coverage_combine_cmd:
                return MockProcessOutput()
            elif cmd == self.coverage_check_cmd:
                return process
            else:
                raise Exception(
                    'Invalid command passed to subprocess.run() method')

        swap_subprocess_run = self.swap(subprocess, 'run', mock_subprocess_run)
        with swap_subprocess_run:
            returned_output, coverage = run_backend_tests.check_coverage(
                True, include=include_files)

        self.assertEqual(returned_output, coverage_report_output)
        self.assertEqual(coverage, 86)

    def test_coverage_is_calculated_correctly_for_a_single_file(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        data_file = '.coverage.hostname.12345.987654321'
        coverage_report_output = (
            'Name                                                       '
            '                    Stmts   Miss Branch BrPart  Cover   Missing\n'
            'core/constants.py                         '
            '                         '
            '               37      8      6      1    70%   108-112, 119-123\n'
            'TOTAL                                                         '
            '                 53906  17509  16917   1191    62%\n'
        )
        process = MockProcessOutput()
        process.stdout = coverage_report_output

        def mock_subprocess_run(cmd: List[str], **_: str) -> MockProcessOutput:
            if cmd == self.coverage_combine_cmd:
                return MockProcessOutput()
            elif cmd == self.coverage_check_cmd:
                return process
            else:
                raise Exception(
                    'Invalid command passed to subprocess.run() method')

        swap_subprocess_run = self.swap(subprocess, 'run', mock_subprocess_run)
        with swap_subprocess_run:
            returned_output, coverage = run_backend_tests.check_coverage(
                False, data_file=data_file)

        self.assertEqual(coverage_report_output, returned_output)
        self.assertEqual(coverage, 62.0)

    def test_no_data_to_report_returns_full_coverage(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests
        coverage_report_output = 'No data to report.'
        process = MockProcessOutput()
        process.stdout = coverage_report_output

        def mock_subprocess_run(cmd: List[str], **_: str) -> MockProcessOutput:
            if cmd == self.coverage_combine_cmd:
                return MockProcessOutput()
            elif cmd == self.coverage_check_cmd:
                return process
            else:
                raise Exception(
                    'Invalid command passed to subprocess.run() method')

        swap_subprocess_run = self.swap(subprocess, 'run', mock_subprocess_run)
        with swap_subprocess_run:
            returned_output, coverage = run_backend_tests.check_coverage(
                True)

        self.assertEqual(returned_output, coverage_report_output)
        self.assertEqual(coverage, 100)

    def test_failure_to_run_test_tasks_throws_error(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        def mock_run_shell_cmd(*_: str, **__: str) -> None:
            raise Exception('XYZ error.')
        swap_run_shell_cmd = self.swap(
            run_backend_tests, 'run_shell_cmd', mock_run_shell_cmd)
        swap_hostname = self.swap(socket, 'gethostname', lambda: 'IamEzio')
        swap_getpid = self.swap(os, 'getpid', lambda: 12345)

        task = run_backend_tests.TestingTaskSpec(
            'scripts.run_backend_tests_test', False)
        with swap_run_shell_cmd, swap_hostname, swap_getpid:
            with self.assertRaisesRegex(Exception, 'XYZ error.'):
                task.run()

    def test_tasks_run_again_if_race_condition_occurs(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        def mock_run_shell_cmd(*_: str, **__: str) -> str:
            if self.call_count == 1:
                return 'Task result'
            self.call_count = 1
            raise Exception('ev_epollex_linux.cc')
        swap_run_shell_cmd = self.swap(
            run_backend_tests, 'run_shell_cmd', mock_run_shell_cmd)
        swapcheck_coverage = self.swap(
            run_backend_tests, 'check_coverage',
            lambda *unused_args, **unused_kwargs: ('Coverage report', 100.00))

        task = run_backend_tests.TestingTaskSpec(
            'scripts.run_backend_tests_test', True)
        with swap_run_shell_cmd, swapcheck_coverage:
            results = task.run()

        self.assertIn('Task result', results[0].messages)

    def test_coverage_is_not_calculated_when_flag_is_not_passed(self) -> None:
        with self.swap_install_third_party_libs:
            from scripts import run_backend_tests

        def mock_run_shell_cmd(*_: str, **__: str) -> str:
            if self.call_count == 1:
                return 'Task result'
            self.call_count = 1
            raise Exception('ev_epollex_linux.cc')
        swap_run_shell_cmd = self.swap(
            run_backend_tests, 'run_shell_cmd', mock_run_shell_cmd)
        swap_hostname = self.swap(socket, 'gethostname', lambda: 'IamEzio')
        swap_getpid = self.swap(os, 'getpid', lambda: 12345)

        task = run_backend_tests.TestingTaskSpec(
            'scripts.random_test', False)
        with swap_run_shell_cmd, swap_hostname, swap_getpid:
            results = task.run()

        self.assertIn('Task result', results[0].messages)
        self.assertEqual(len(results[0].messages), 1)
