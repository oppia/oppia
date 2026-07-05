# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/run_acceptance_tests.py."""

from __future__ import annotations

import contextlib
import json
import os
import shutil
import subprocess
import sys

from core.tests import test_utils
from scripts import (
    build,
    common,
    run_acceptance_tests,
    scripts_test_utils,
    servers,
)

from typing import ContextManager, List, Optional, Tuple


class PopenErrorReturn:
    """Popen return object."""

    def __init__(self) -> None:
        self.returncode = 1

    def communicate(self) -> Tuple[str, bytes]:
        """Returns some error."""
        return '', 'Some error'.encode('utf-8')


def mock_managed_long_lived_process(
    *unused_args: str, **unused_kwargs: str
) -> ContextManager[scripts_test_utils.PopenStub]:
    """Mock method for replacing the managed_process() functions to simulate a
    long-lived process. This process stays alive for 10 poll() calls, and
    then terminates thereafter.

    Returns:
        Context manager. A context manager that always yields a mock
        process.
    """
    stub = scripts_test_utils.PopenStub(alive=True)

    def mock_poll(stub: scripts_test_utils.PopenStub) -> Optional[int]:
        stub.poll_count += 1
        if stub.poll_count >= 10:
            stub.alive = False
        return None if stub.alive else stub.returncode

    # Here we use MyPy ignore because we are assigning a None value
    # where instance of 'PlatformParameter' is expected, and this is
    # done to Replace the stored instance with None in order to
    # trigger the unexpected exception during update.
    stub.poll = lambda: mock_poll(stub)  # type: ignore[assignment]

    return contextlib.nullcontext(enter_result=stub)


def mock_managed_process(
    *unused_args: str, **unused_kwargs: str
) -> ContextManager[scripts_test_utils.PopenStub]:
    """Mock method for replacing the managed_process() functions.

    Returns:
        Context manager. A context manager that always yields a mock
        process.
    """
    return contextlib.nullcontext(
        enter_result=scripts_test_utils.PopenStub(alive=False)
    )


class RunAcceptanceTestsTests(test_utils.GenericTestBase):
    """Test the run_acceptance_tests methods."""

    def setUp(self) -> None:
        super().setUp()
        self.exit_stack = contextlib.ExitStack()

        def mock_constants() -> None:
            print('mock_set_constants_to_default')

        self.swap_mock_set_constants_to_default = self.swap(
            common, 'set_constants_to_default', mock_constants
        )
        self.compile_test_ts_files_swap = self.swap(
            run_acceptance_tests, 'compile_test_ts_files', lambda: None
        )
        self.install_playwright_dependencies_swap = self.swap(
            run_acceptance_tests,
            'install_playwright_dependencies',
            lambda: None,
        )
        self.build_js_files_swap = self.swap_with_checks(
            build,
            'build_js_files',
            lambda *_, **__: None,
            expected_args=[(True,)],
        )
        self.managed_redis_server_swap = self.swap_with_checks(
            servers, 'managed_redis_server', mock_managed_process
        )
        self.managed_elasticsearch_dev_server_swap = self.swap_with_checks(
            servers, 'managed_elasticsearch_dev_server', mock_managed_process
        )
        self.managed_firebase_auth_emulator_swap = self.swap_with_checks(
            servers, 'managed_firebase_auth_emulator', mock_managed_process
        )
        self.managed_dev_appserver_swap = self.swap_with_checks(
            servers, 'managed_dev_appserver', mock_managed_process
        )
        self.managed_portserver_swap = self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process
        )
        self.managed_cloud_datastore_emulator_swap = self.swap_with_checks(
            servers, 'managed_cloud_datastore_emulator', mock_managed_process
        )

    def tearDown(self) -> None:
        try:
            self.exit_stack.close()
        finally:
            super().tearDown()

    def test_compile_test_ts_files_with_error(self) -> None:
        def mock_popen_error_call(  # pylint: disable=unused-argument
            unused_cmd_tokens: List[str], *args: str, **kwargs: str
        ) -> PopenErrorReturn:
            return PopenErrorReturn()

        popen_error_swap = self.swap(subprocess, 'Popen', mock_popen_error_call)
        with popen_error_swap:
            with self.assertRaisesRegex(Exception, 'Some error'):
                run_acceptance_tests.compile_test_ts_files()

    def test_compile_test_ts_files_success(self) -> None:
        process = subprocess.Popen(
            ['test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )

        def mock_os_path_exists(unused_path: str) -> bool:
            return True

        def mock_shutil_rmtree(unused_path: str) -> None:
            pass

        def mock_shutil_copytree(  # pylint: disable=unused-argument
            src: str, dst: str, *args: str, **kwargs: str
        ) -> None:
            pass

        def mock_popen_call(  # pylint: disable=unused-argument
            cmd_tokens: List[str], *args: str, **kwargs: str
        ) -> subprocess.Popen[bytes]:
            return process

        def mock_communicate(unused_self: str) -> Tuple[bytes, bytes]:
            return (b'', b'')

        puppeteer_acceptance_tests_dir_path = os.path.join(
            common.CURR_DIR, 'core', 'tests', 'puppeteer-acceptance-tests'
        )
        build_dir_path = os.path.join(
            puppeteer_acceptance_tests_dir_path,
            'build',
            'puppeteer-acceptance-tests',
        )
        os_path_exists_swap = self.swap(os.path, 'exists', mock_os_path_exists)
        shutil_rmtree_swap = self.swap_with_checks(
            shutil,
            'rmtree',
            mock_shutil_rmtree,
            expected_args=[(build_dir_path,)],
        )
        shutil_copytree_swap = self.swap_with_checks(
            shutil,
            'copytree',
            mock_shutil_copytree,
            expected_args=[
                (
                    os.path.join(puppeteer_acceptance_tests_dir_path, 'data'),
                    os.path.join(build_dir_path, 'data'),
                )
            ],
        )
        expected_cmd = (
            './node_modules/typescript/bin/tsc -p %s'
            % './tsconfig.puppeteer-acceptance-tests.json'
        )
        process_swap = self.swap_with_checks(
            subprocess,
            'Popen',
            mock_popen_call,
            expected_args=[(expected_cmd,)],
        )
        communicate_swap = self.swap(
            subprocess.Popen, 'communicate', mock_communicate
        )

        with os_path_exists_swap, shutil_rmtree_swap, process_swap:
            with shutil_copytree_swap, communicate_swap:
                run_acceptance_tests.compile_test_ts_files()

    def test_install_playwright_dependencies_success(self) -> None:
        playwright_dir = os.path.join(
            common.CURR_DIR, 'core', 'tests', 'playwright-acceptance-tests'
        )
        playwright_bin = os.path.join(
            playwright_dir, 'node_modules', '.bin', 'playwright'
        )
        expected_install_env = {
            **os.environ,
            'PATH': os.pathsep.join(
                [
                    os.path.join(common.PLAYWRIGHT_NODE_PATH, 'bin'),
                    os.environ['PATH'],
                ]
            ),
            'NODE': os.path.join(common.PLAYWRIGHT_NODE_PATH, 'bin', 'node'),
        }
        check_call_swap = self.swap_with_checks(
            subprocess,
            'check_call',
            lambda *_, **__: None,
            expected_args=[
                (
                    [
                        common.PLAYWRIGHT_NPM_BIN_PATH,
                        '--prefix',
                        playwright_dir,
                        'ci',
                    ],
                ),
                ([playwright_bin, 'install', 'chromium'],),
            ],
            expected_kwargs=[
                {'env': expected_install_env},
                {'env': expected_install_env},
            ],
        )
        os_path_exists_swap = self.swap(os.path, 'exists', lambda _: False)
        with check_call_swap, os_path_exists_swap:
            run_acceptance_tests.install_playwright_dependencies()

    def test_install_playwright_dependencies_skips_if_node_modules_exist(
        self,
    ) -> None:
        playwright_dir = os.path.join(
            common.CURR_DIR, 'core', 'tests', 'playwright-acceptance-tests'
        )
        playwright_node_modules = os.path.join(playwright_dir, 'node_modules')

        check_call_called = []

        def mock_check_call(*unused_args: str, **unused_kwargs: str) -> None:
            check_call_called.append(True)

        os_path_exists_swap = self.swap(
            os.path, 'exists', lambda path: path == playwright_node_modules
        )
        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)

        with os_path_exists_swap, check_call_swap:
            run_acceptance_tests.install_playwright_dependencies()

        self.assertEqual(check_call_called, [])

    def test_install_playwright_dependencies_failure(self) -> None:
        def mock_check_call_failure(
            *unused_args: str, **unused_kwargs: str
        ) -> None:
            raise subprocess.CalledProcessError(1, 'npm')

        check_call_swap = self.swap(
            subprocess, 'check_call', mock_check_call_failure
        )
        os_path_exists_swap = self.swap(os.path, 'exists', lambda _: False)
        with check_call_swap, os_path_exists_swap:
            with self.assertRaisesRegex(
                subprocess.CalledProcessError,
                'Command \'npm\' returned non-zero exit status 1.',
            ):
                run_acceptance_tests.install_playwright_dependencies()

    def test_run_tests_raises_error_when_suite_not_found(self) -> None:
        mock_config = {
            'suites': [
                {
                    'name': 'someOtherSuite',
                    'framework': 'puppeteer',
                    'module': 'some/module',
                }
            ]
        }

        json_load_swap = self.swap(json, 'load', lambda _: mock_config)

        with json_load_swap:
            with self.assertRaisesRegex(
                ValueError, 'Suite \'nonExistentSuite\' not found in config.'
            ):
                args = run_acceptance_tests._PARSER.parse_args(  # pylint: disable=protected-access
                    args=['--suite', 'nonExistentSuite']
                )
                run_acceptance_tests.run_tests(args)

    def test_compile_ts_called_for_puppeteer_suite(self) -> None:
        mock_config = {
            'suites': [
                {
                    'name': 'testSuite',
                    'framework': 'puppeteer',
                    'module': 'some/module',
                }
            ]
        }

        compile_called = []
        playwright_deps_called = []

        def mock_compile_test_ts_files() -> None:
            compile_called.append(True)

        def mock_install_playwright_dependencies() -> None:
            playwright_deps_called.append(True)

        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(self.build_js_files_swap)
        self.exit_stack.enter_context(self.managed_redis_server_swap)
        self.exit_stack.enter_context(
            self.managed_elasticsearch_dev_server_swap
        )
        self.exit_stack.enter_context(self.managed_firebase_auth_emulator_swap)
        self.exit_stack.enter_context(self.managed_dev_appserver_swap)
        self.exit_stack.enter_context(self.managed_portserver_swap)
        self.exit_stack.enter_context(
            self.managed_cloud_datastore_emulator_swap
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers,
                'managed_acceptance_tests_server',
                mock_managed_process,
                expected_kwargs=[
                    {
                        'suite_name': 'testSuite',
                        'headless': False,
                        'mobile': False,
                        'prod_env': False,
                        'update_snapshots': False,
                        'stdout': subprocess.PIPE,
                    }
                ],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        json_load_swap = self.swap(json, 'load', lambda _: mock_config)
        compile_swap = self.swap(
            run_acceptance_tests,
            'compile_test_ts_files',
            mock_compile_test_ts_files,
        )
        playwright_swap = self.swap(
            run_acceptance_tests,
            'install_playwright_dependencies',
            mock_install_playwright_dependencies,
        )

        with self.swap_mock_set_constants_to_default:
            with json_load_swap, compile_swap, playwright_swap:
                run_acceptance_tests.main(args=['--suite', 'testSuite'])

        self.assertEqual(compile_called, [True])
        self.assertEqual(playwright_deps_called, [])

    def test_playwright_deps_called_for_playwright_suite(self) -> None:
        mock_config = {
            'suites': [
                {
                    'name': 'testSuite',
                    'framework': 'playwright',
                    'module': 'some/module',
                }
            ]
        }

        compile_called = []
        playwright_deps_called = []

        def mock_compile_test_ts_files() -> None:
            compile_called.append(True)

        def mock_install_playwright_dependencies() -> None:
            playwright_deps_called.append(True)

        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(self.build_js_files_swap)
        self.exit_stack.enter_context(self.managed_redis_server_swap)
        self.exit_stack.enter_context(
            self.managed_elasticsearch_dev_server_swap
        )
        self.exit_stack.enter_context(self.managed_firebase_auth_emulator_swap)
        self.exit_stack.enter_context(self.managed_dev_appserver_swap)
        self.exit_stack.enter_context(self.managed_portserver_swap)
        self.exit_stack.enter_context(
            self.managed_cloud_datastore_emulator_swap
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers,
                'managed_acceptance_tests_server',
                mock_managed_process,
                expected_kwargs=[
                    {
                        'suite_name': 'testSuite',
                        'headless': False,
                        'mobile': False,
                        'prod_env': False,
                        'update_snapshots': False,
                        'stdout': subprocess.PIPE,
                    }
                ],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        json_load_swap = self.swap(json, 'load', lambda _: mock_config)
        compile_swap = self.swap(
            run_acceptance_tests,
            'compile_test_ts_files',
            mock_compile_test_ts_files,
        )
        playwright_swap = self.swap(
            run_acceptance_tests,
            'install_playwright_dependencies',
            mock_install_playwright_dependencies,
        )

        with self.swap_mock_set_constants_to_default:
            with json_load_swap, compile_swap, playwright_swap:
                run_acceptance_tests.main(args=['--suite', 'testSuite'])

        self.assertEqual(compile_called, [])
        self.assertEqual(playwright_deps_called, [True])

    def test_start_tests_when_other_instances_not_stopped(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: True
            )
        )

        self.exit_stack.enter_context(self.managed_portserver_swap)

        with self.compile_test_ts_files_swap, self.assertRaisesRegex(
            SystemExit,
            """
            Oppia server is already running. Try shutting all the servers down
            before running the script.
        """,
        ):
            run_acceptance_tests.main(args=['--suite', 'testSuite'])

    def test_start_tests_when_no_other_instance_running(self) -> None:
        mock_config = {
            'suites': [
                {
                    'name': 'testSuite',
                    'framework': 'puppeteer',
                    'module': 'some/module',
                }
            ]
        }
        json_load_swap = self.swap(json, 'load', lambda _: mock_config)
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(self.build_js_files_swap)
        self.exit_stack.enter_context(self.managed_redis_server_swap)
        self.exit_stack.enter_context(
            self.managed_elasticsearch_dev_server_swap
        )
        self.exit_stack.enter_context(self.managed_firebase_auth_emulator_swap)
        self.exit_stack.enter_context(self.managed_dev_appserver_swap)
        self.exit_stack.enter_context(self.managed_portserver_swap)
        self.exit_stack.enter_context(
            self.managed_cloud_datastore_emulator_swap
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers,
                'managed_acceptance_tests_server',
                mock_managed_process,
                expected_kwargs=[
                    {
                        'suite_name': 'testSuite',
                        'headless': False,
                        'mobile': False,
                        'prod_env': False,
                        'update_snapshots': False,
                        'stdout': subprocess.PIPE,
                    },
                ],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        with self.swap_mock_set_constants_to_default:
            with self.compile_test_ts_files_swap, self.install_playwright_dependencies_swap, (
                json_load_swap
            ):
                run_acceptance_tests.main(args=['--suite', 'testSuite'])

    def test_start_tests_with_update_snapshots_flag(self) -> None:
        mock_config = {
            'suites': [
                {
                    'name': 'testSuite',
                    'framework': 'puppeteer',
                    'module': 'some/module',
                }
            ]
        }
        json_load_swap = self.swap(json, 'load', lambda _: mock_config)
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(self.build_js_files_swap)
        self.exit_stack.enter_context(self.managed_redis_server_swap)
        self.exit_stack.enter_context(
            self.managed_elasticsearch_dev_server_swap
        )
        self.exit_stack.enter_context(self.managed_firebase_auth_emulator_swap)
        self.exit_stack.enter_context(self.managed_dev_appserver_swap)
        self.exit_stack.enter_context(self.managed_portserver_swap)
        self.exit_stack.enter_context(
            self.managed_cloud_datastore_emulator_swap
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers,
                'managed_acceptance_tests_server',
                mock_managed_process,
                expected_kwargs=[
                    {
                        'suite_name': 'testSuite',
                        'headless': False,
                        'mobile': False,
                        'prod_env': False,
                        'update_snapshots': True,
                        'stdout': subprocess.PIPE,
                    },
                ],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        with self.swap_mock_set_constants_to_default:
            with self.compile_test_ts_files_swap, self.install_playwright_dependencies_swap, (
                json_load_swap
            ):
                run_acceptance_tests.main(
                    args=['--suite', 'testSuite', '--update_snapshots']
                )

    def test_work_with_non_ascii_chars(self) -> None:
        mock_config = {
            'suites': [
                {
                    'name': 'testSuite',
                    'framework': 'puppeteer',
                    'module': 'some/module',
                }
            ]
        }
        json_load_swap = self.swap(json, 'load', lambda _: mock_config)

        def mock_managed_acceptance_tests_server(
            **unused_kwargs: str,
        ) -> ContextManager[
            scripts_test_utils.PopenStub
        ]:  # pylint: disable=unused-argument, line-too-long
            return contextlib.nullcontext(
                enter_result=scripts_test_utils.PopenStub(
                    stdout='sample\n✓\noutput\n'.encode(encoding='utf-8'),
                    alive=False,
                )
            )

        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(self.build_js_files_swap)
        self.exit_stack.enter_context(self.managed_redis_server_swap)
        self.exit_stack.enter_context(
            self.managed_elasticsearch_dev_server_swap
        )
        self.exit_stack.enter_context(self.managed_firebase_auth_emulator_swap)
        self.exit_stack.enter_context(self.managed_dev_appserver_swap)
        self.exit_stack.enter_context(
            self.managed_cloud_datastore_emulator_swap
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers,
                'managed_acceptance_tests_server',
                mock_managed_acceptance_tests_server,
                expected_kwargs=[
                    {
                        'suite_name': 'testSuite',
                        'headless': False,
                        'mobile': False,
                        'prod_env': False,
                        'update_snapshots': False,
                        'stdout': subprocess.PIPE,
                    },
                ],
            )
        )
        args = run_acceptance_tests._PARSER.parse_args(  # pylint: disable=protected-access, line-too-long
            args=['--suite', 'testSuite']
        )

        with self.swap_mock_set_constants_to_default:
            with self.compile_test_ts_files_swap, self.install_playwright_dependencies_swap, (
                json_load_swap
            ):
                lines, _ = run_acceptance_tests.run_tests(args)

        self.assertEqual(
            [line.decode('utf-8') for line in lines], ['sample', '✓', 'output']
        )

    def test_start_tests_skip_build(self) -> None:
        mock_config = {
            'suites': [
                {
                    'name': 'testSuite',
                    'framework': 'puppeteer',
                    'module': 'some/module',
                }
            ]
        }
        json_load_swap = self.swap(json, 'load', lambda _: mock_config)
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common,
                'modify_constants',
                lambda *_, **__: None,
                expected_kwargs=[{'prod_env': False}],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'set_constants_to_default', lambda: None
            )
        )
        self.exit_stack.enter_context(self.managed_redis_server_swap)
        self.exit_stack.enter_context(
            self.managed_elasticsearch_dev_server_swap
        )
        self.exit_stack.enter_context(self.managed_firebase_auth_emulator_swap)
        self.exit_stack.enter_context(self.managed_dev_appserver_swap)
        self.exit_stack.enter_context(self.managed_portserver_swap)
        self.exit_stack.enter_context(
            self.managed_cloud_datastore_emulator_swap
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers,
                'managed_webpack_compiler',
                mock_managed_process,
                called=False,
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers,
                'managed_acceptance_tests_server',
                mock_managed_process,
                expected_kwargs=[
                    {
                        'suite_name': 'testSuite',
                        'headless': False,
                        'mobile': False,
                        'prod_env': False,
                        'update_snapshots': False,
                        'stdout': subprocess.PIPE,
                    },
                ],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        with self.compile_test_ts_files_swap, self.install_playwright_dependencies_swap, (
            json_load_swap
        ):
            run_acceptance_tests.main(
                args=['--suite', 'testSuite', '--skip_build']
            )

    def test_start_tests_in_jasmine(self) -> None:
        mock_config = {
            'suites': [
                {
                    'name': 'testSuite',
                    'framework': 'puppeteer',
                    'module': 'some/module',
                }
            ]
        }
        json_load_swap = self.swap(json, 'load', lambda _: mock_config)
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(self.build_js_files_swap)
        self.exit_stack.enter_context(self.managed_redis_server_swap)
        self.exit_stack.enter_context(
            self.managed_elasticsearch_dev_server_swap
        )
        self.exit_stack.enter_context(self.managed_firebase_auth_emulator_swap)
        self.exit_stack.enter_context(self.managed_dev_appserver_swap)
        self.exit_stack.enter_context(self.managed_portserver_swap)
        self.exit_stack.enter_context(
            self.managed_cloud_datastore_emulator_swap
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers,
                'managed_acceptance_tests_server',
                mock_managed_process,
                expected_kwargs=[
                    {
                        'suite_name': 'testSuite',
                        'headless': False,
                        'mobile': False,
                        'prod_env': False,
                        'update_snapshots': False,
                        'stdout': subprocess.PIPE,
                    },
                ],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        with self.swap_mock_set_constants_to_default:
            with self.compile_test_ts_files_swap, self.install_playwright_dependencies_swap, (
                json_load_swap
            ):
                run_acceptance_tests.main(args=['--suite', 'testSuite'])

    def test_start_tests_for_long_lived_process(self) -> None:
        mock_config = {
            'suites': [
                {
                    'name': 'testSuite',
                    'framework': 'puppeteer',
                    'module': 'some/module',
                }
            ]
        }
        json_load_swap = self.swap(json, 'load', lambda _: mock_config)
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(self.build_js_files_swap)
        self.exit_stack.enter_context(self.managed_redis_server_swap)
        self.exit_stack.enter_context(
            self.managed_elasticsearch_dev_server_swap
        )
        self.exit_stack.enter_context(self.managed_firebase_auth_emulator_swap)
        self.exit_stack.enter_context(self.managed_dev_appserver_swap)
        self.exit_stack.enter_context(
            self.managed_cloud_datastore_emulator_swap
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers,
                'managed_acceptance_tests_server',
                mock_managed_long_lived_process,
                expected_kwargs=[
                    {
                        'suite_name': 'testSuite',
                        'headless': False,
                        'mobile': False,
                        'prod_env': False,
                        'update_snapshots': False,
                        'stdout': subprocess.PIPE,
                    },
                ],
            )
        )

        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        with self.swap_mock_set_constants_to_default:
            with self.compile_test_ts_files_swap, self.install_playwright_dependencies_swap, (
                json_load_swap
            ):
                run_acceptance_tests.main(args=['--suite', 'testSuite'])
