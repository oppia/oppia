# -*- coding: UTF-8 -*-
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/run_e2e_tests.py."""

from __future__ import annotations

import contextlib
import subprocess
import sys
import time

from core.constants import constants
from core.tests import test_utils
from scripts import (
    build,
    common,
    install_third_party_libs,
    run_e2e_tests,
    scripts_test_utils,
    servers,
)

from typing import Any, Callable, ContextManager, Dict, Final, Optional, Tuple

CHROME_DRIVER_VERSION: Final = '77.0.3865.40'


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


class RunE2ETestsTests(test_utils.GenericTestBase):
    """Test the run_e2e_tests methods."""

    def setUp(self) -> None:
        super().setUp()
        self.exit_stack = contextlib.ExitStack()

        def mock_constants() -> None:
            print('mock_set_constants_to_default')

        self.swap_mock_set_constants_to_default = self.swap(
            common, 'set_constants_to_default', mock_constants
        )

    def tearDown(self) -> None:
        try:
            self.exit_stack.close()
        finally:
            super().tearDown()

    def _swap_servers(
        self,
        servers_list: list[str],
        *,
        default_fn: Callable[
            ..., ContextManager[scripts_test_utils.PopenStub]
        ] = (mock_managed_process),
        # Here we use type Any because special_overrides may contain tuples of
        # heterogeneous shapes used across tests (1-, 2- or 3-element tuples where
        # the second element can be a list/dict or None, and the third a bool).
        special_overrides: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Enter contexts for multiple managed_* server functions.

        Args:
            servers_list: list[str]. List of attribute names on the `servers`
                module to mock.
            default_fn: Callable[..., ContextManager[PopenStub]]. Default callable
                to swap in for each server.
            special_overrides: Optional[Dict[str, Any]]. Optional mapping from
                server name to a tuple whose first element is a callable
                (used instead of default_fn) and whose remaining elements (if any)
                are additional data such as expected_kwargs or called flags. The
                tuple may be length 1, 2 or 3 depending on the test usage.
        """
        special_overrides = special_overrides or {}
        for srv in servers_list:
            override = special_overrides.get(srv)
            if override is None:
                self.exit_stack.enter_context(
                    self.swap_with_checks(servers, srv, default_fn)
                )
                continue

            # Override is a tuple where:
            # override[0] is the callable to use
            # override[1] (if present) is expected_kwargs (often a list/dict)
            # override[2] (if present) is called (bool)
            override_fn: Callable[
                ..., ContextManager[scripts_test_utils.PopenStub]
            ] = override[0]

            # Here we use type Any because expected_kwargs can be a list, dict or
            # None depending on the test case.
            expected_kwargs: Optional[Any] = None

            called_flag: Optional[bool] = None
            if len(override) >= 2:
                expected_kwargs = override[1]
            if len(override) >= 3:
                called_flag = override[2]

            if expected_kwargs is not None or called_flag is not None:
                # Here we use type Any because the dict values (expected_kwargs)
                # have heterogeneous shapes (lists/dicts with different key/value
                # types) across tests.
                kwargs: Dict[str, Any] = {}
                if expected_kwargs is not None:
                    kwargs['expected_kwargs'] = expected_kwargs
                if called_flag is not None:
                    kwargs['called'] = called_flag
                self.exit_stack.enter_context(
                    self.swap_with_checks(servers, srv, override_fn, **kwargs)
                )
            else:
                self.exit_stack.enter_context(
                    self.swap_with_checks(servers, srv, override_fn)
                )

    def test_wait_for_port_to_be_in_use_when_port_successfully_opened(
        self,
    ) -> None:
        num_var = 0

        def mock_is_port_in_use(unused_port: int) -> bool:
            nonlocal num_var
            num_var += 1
            return num_var > 10

        mock_sleep = self.exit_stack.enter_context(
            self.swap_with_call_counter(time, 'sleep')
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(common, 'is_port_in_use', mock_is_port_in_use)
        )

        common.wait_for_port_to_be_in_use(1)

        self.assertEqual(num_var, 11)
        self.assertEqual(mock_sleep.times_called, 10)

    def test_wait_for_port_to_be_in_use_when_port_failed_to_open(self) -> None:
        mock_sleep = self.exit_stack.enter_context(
            self.swap_with_call_counter(time, 'sleep')
        )
        self.exit_stack.enter_context(
            self.swap(common, 'is_port_in_use', lambda _: False)
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(sys, 'exit', lambda _: None)
        )

        common.wait_for_port_to_be_in_use(1)

        self.assertEqual(
            mock_sleep.times_called, common.MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS
        )

    def test_install_third_party_libraries_without_skip(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                install_third_party_libs, 'main', lambda *_, **__: None
            )
        )

        run_e2e_tests.install_third_party_libraries(False)

    def test_install_third_party_libraries_with_skip(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                install_third_party_libs,
                'main',
                lambda *_, **__: None,
                called=False,
            )
        )

        run_e2e_tests.install_third_party_libraries(True)

    def test_start_tests_when_other_instances_not_stopped(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: True
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers, 'managed_portserver', mock_managed_process
            )
        )

        with self.assertRaisesRegex(SystemExit, '1'):
            run_e2e_tests.main(args=[])

    def test_start_tests_when_no_other_instance_running(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                run_e2e_tests,
                'install_third_party_libraries',
                lambda _: None,
                expected_args=[(False,)],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                build,
                'build_js_files',
                lambda *_, **__: None,
                expected_args=[(True,)],
            )
        )

        self._swap_servers(
            [
                'managed_elasticsearch_dev_server',
                'managed_firebase_auth_emulator',
                'managed_dev_appserver',
                'managed_redis_server',
                'managed_portserver',
                'managed_cloud_datastore_emulator',
            ]
        )

        self._swap_servers(
            ['managed_webdriverio_server'],
            special_overrides={
                'managed_webdriverio_server': (
                    mock_managed_process,
                    [
                        {
                            'suite_name': 'full',
                            'chrome_version': None,
                            'dev_mode': True,
                            'mobile': False,
                            'sharding_instances': 3,
                            'debug_mode': False,
                            'stdout': subprocess.PIPE,
                        },
                    ],
                )
            },
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )
        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(args=[])

    def test_work_with_non_ascii_chars(self) -> None:
        def mock_managed_webdriverio_server(
            **unused_kwargs: str,
        ) -> ContextManager[
            scripts_test_utils.PopenStub
        ]:  # pylint: disable=unused-argument
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
        self.exit_stack.enter_context(
            self.swap_with_checks(
                run_e2e_tests,
                'install_third_party_libraries',
                lambda _: None,
                expected_args=[(False,)],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                build,
                'build_js_files',
                lambda *_, **__: None,
                expected_args=[(True,)],
            )
        )

        self._swap_servers(
            [
                'managed_elasticsearch_dev_server',
                'managed_firebase_auth_emulator',
                'managed_dev_appserver',
                'managed_redis_server',
                'managed_cloud_datastore_emulator',
            ]
        )

        self._swap_servers(
            ['managed_webdriverio_server'],
            special_overrides={
                'managed_webdriverio_server': (mock_managed_webdriverio_server,)
            },
        )

        args = run_e2e_tests._PARSER.parse_args(  # pylint: disable=protected-access
            args=[]
        )

        with self.swap_mock_set_constants_to_default:
            lines, _ = run_e2e_tests.run_tests(args)

        self.assertEqual(
            [line.decode('utf-8') for line in lines], ['sample', '✓', 'output']
        )

    def test_rerun_when_tests_fail_with_rerun_yes(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers, 'managed_portserver', mock_managed_process
            )
        )
        self.exit_stack.enter_context(
            self.swap(run_e2e_tests, 'run_tests', mock_run_tests)
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(1,)]
            )
        )

        run_e2e_tests.main(args=['--suite', 'navigation'])

    def test_no_rerun_when_tests_flake_with_rerun_no(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        self.exit_stack.enter_context(
            self.swap(run_e2e_tests, 'run_tests', mock_run_tests)
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(1,)]
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers, 'managed_portserver', mock_managed_process
            )
        )

        run_e2e_tests.main(args=['--suite', 'navigation'])

    def test_no_rerun_when_tests_flake_with_rerun_unknown(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        self.exit_stack.enter_context(
            self.swap(run_e2e_tests, 'run_tests', mock_run_tests)
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(1,)]
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                servers, 'managed_portserver', mock_managed_process
            )
        )

        run_e2e_tests.main(args=['--suite', 'navigation'])

    def test_no_reruns_off_ci_fail(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        self._swap_servers(['managed_portserver'])

        self.exit_stack.enter_context(
            self.swap(run_e2e_tests, 'run_tests', mock_run_tests)
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(1,)]
            )
        )

        run_e2e_tests.main(args=['--suite', 'navigation'])

    def test_no_reruns_off_ci_pass(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 0

        self._swap_servers(['managed_portserver'])

        self.exit_stack.enter_context(
            self.swap(run_e2e_tests, 'run_tests', mock_run_tests)
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        run_e2e_tests.main(args=['--suite', 'navigation'])

    def test_start_tests_skip_build(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                run_e2e_tests,
                'install_third_party_libraries',
                lambda _: None,
                expected_args=[(True,)],
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

        self._swap_servers(
            [
                'managed_elasticsearch_dev_server',
                'managed_firebase_auth_emulator',
                'managed_dev_appserver',
                'managed_redis_server',
                'managed_portserver',
                'managed_cloud_datastore_emulator',
            ],
        )
        self._swap_servers(
            ['managed_webpack_compiler'],
            special_overrides={
                'managed_webpack_compiler': (mock_managed_process, None, False)
            },
        )

        self._swap_servers(
            ['managed_webdriverio_server'],
            special_overrides={
                'managed_webdriverio_server': (
                    mock_managed_process,
                    [
                        {
                            'suite_name': 'full',
                            'chrome_version': None,
                            'dev_mode': True,
                            'mobile': False,
                            'sharding_instances': 3,
                            'debug_mode': False,
                            'stdout': subprocess.PIPE,
                        },
                    ],
                )
            },
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        run_e2e_tests.main(args=['--skip_install', '--skip_build'])

    def test_start_tests_in_debug_mode(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                run_e2e_tests,
                'install_third_party_libraries',
                lambda _: None,
                expected_args=[(False,)],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                build,
                'build_js_files',
                lambda *_, **__: None,
                expected_args=[(True,)],
            )
        )

        self._swap_servers(
            [
                'managed_elasticsearch_dev_server',
                'managed_firebase_auth_emulator',
                'managed_dev_appserver',
                'managed_redis_server',
                'managed_portserver',
                'managed_cloud_datastore_emulator',
            ]
        )

        self._swap_servers(
            ['managed_webdriverio_server'],
            special_overrides={
                'managed_webdriverio_server': (
                    mock_managed_process,
                    [
                        {
                            'suite_name': 'full',
                            'chrome_version': None,
                            'dev_mode': True,
                            'mobile': False,
                            'sharding_instances': 3,
                            'debug_mode': True,
                            'stdout': subprocess.PIPE,
                        },
                    ],
                )
            },
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(args=['--debug_mode'])

    def test_start_tests_in_with_chromedriver_flag(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                run_e2e_tests,
                'install_third_party_libraries',
                lambda _: None,
                expected_args=[(False,)],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                build,
                'build_js_files',
                lambda *_, **__: None,
                expected_args=[(True,)],
            )
        )

        self._swap_servers(
            [
                'managed_elasticsearch_dev_server',
                'managed_firebase_auth_emulator',
                'managed_dev_appserver',
                'managed_redis_server',
                'managed_portserver',
                'managed_cloud_datastore_emulator',
            ]
        )
        self._swap_servers(
            ['managed_webdriverio_server'],
            special_overrides={
                'managed_webdriverio_server': (
                    mock_managed_process,
                    [
                        {
                            'suite_name': 'full',
                            'chrome_version': CHROME_DRIVER_VERSION,
                            'dev_mode': True,
                            'mobile': False,
                            'sharding_instances': 3,
                            'debug_mode': False,
                            'stdout': subprocess.PIPE,
                        },
                    ],
                )
            },
        )

        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(
                args=['--chrome_driver_version', CHROME_DRIVER_VERSION]
            )

    def test_start_tests_in_webdriverio(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                run_e2e_tests,
                'install_third_party_libraries',
                lambda _: None,
                expected_args=[(False,)],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                build,
                'build_js_files',
                lambda *_, **__: None,
                expected_args=[(True,)],
            )
        )

        self._swap_servers(
            [
                'managed_elasticsearch_dev_server',
                'managed_firebase_auth_emulator',
                'managed_dev_appserver',
                'managed_redis_server',
                'managed_portserver',
                'managed_cloud_datastore_emulator',
            ]
        )

        self._swap_servers(
            ['managed_webdriverio_server'],
            special_overrides={
                'managed_webdriverio_server': (
                    mock_managed_process,
                    [
                        {
                            'suite_name': 'collections',
                            'chrome_version': None,
                            'dev_mode': True,
                            'mobile': False,
                            'sharding_instances': 3,
                            'debug_mode': False,
                            'stdout': subprocess.PIPE,
                        },
                    ],
                )
            },
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                sys, 'exit', lambda _: None, expected_args=[(0,)]
            )
        )

        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(args=['--suite', 'collections'])

    def test_do_not_run_with_test_non_mobile_suite_in_mobile_mode(self) -> None:
        self.exit_stack.enter_context(
            self.swap_with_checks(
                common, 'is_oppia_server_already_running', lambda *_: False
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                run_e2e_tests,
                'install_third_party_libraries',
                lambda _: None,
                expected_args=[(False,)],
            )
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(
                build,
                'build_js_files',
                lambda *_, **__: None,
                expected_args=[(True,)],
            )
        )

        self._swap_servers(
            [
                'managed_elasticsearch_dev_server',
                'managed_firebase_auth_emulator',
                'managed_dev_appserver',
                'managed_redis_server',
                'managed_portserver',
                'managed_cloud_datastore_emulator',
            ]
        )

        with self.assertRaisesRegex(SystemExit, '^1$'):
            with self.swap_mock_set_constants_to_default:
                run_e2e_tests.main(args=['--mobile', '--suite', 'collections'])

    def test_run_tests_skips_emulator_block_when_not_in_emulator_mode(
        self,
    ) -> None:
        class FakeProc:
            """Fake process that exits immediately with no output."""

            def __init__(self) -> None:
                self.stdout = self
                self.returncode = 0

            def readline(self) -> bytes:  # pylint: disable=missing-docstring
                return b''

            def poll(self) -> int:  # pylint: disable=missing-docstring
                return self.returncode

        with self.swap(constants, 'EMULATOR_MODE', False):
            self.exit_stack.enter_context(
                self.swap(
                    common, 'is_oppia_server_already_running', lambda *_: False
                )
            )
            self.exit_stack.enter_context(
                self.swap(
                    run_e2e_tests,
                    'install_third_party_libraries',
                    lambda _: None,
                )
            )
            self.exit_stack.enter_context(
                self.swap(build, 'build_js_files', lambda *_, **__: None)
            )

            self._swap_servers(
                [
                    'managed_redis_server',
                    'managed_elasticsearch_dev_server',
                    'managed_dev_appserver',
                    'managed_webdriverio_server',
                    'managed_cloud_datastore_emulator',
                    'managed_firebase_auth_emulator',
                ],
                default_fn=lambda *a, **k: contextlib.nullcontext(FakeProc()),
                special_overrides={
                    'managed_firebase_auth_emulator': (
                        lambda *a, **k: contextlib.nullcontext(FakeProc()),
                        None,
                        False,
                    ),
                    'managed_cloud_datastore_emulator': (
                        lambda *a, **k: contextlib.nullcontext(FakeProc()),
                        None,
                        False,
                    ),
                },
            )

            args = run_e2e_tests._PARSER.parse_args(  # pylint: disable=protected-access
                args=[]
            )
            with self.swap_mock_set_constants_to_default:
                output_lines, return_code = run_e2e_tests.run_tests(args)

        self.assertEqual(output_lines, [])
        self.assertEqual(return_code, 0)

    def test_run_tests_loops_until_process_ends(self) -> None:
        class FakeStdout:
            """Fake stdout stream for simulating process output lines."""

            def __init__(self) -> None:
                self.lines = [b'line1\n', b'line2\n', b'']
                self.index = 0

            def readline(self) -> bytes:  # pylint: disable=missing-docstring
                if self.index < len(self.lines):
                    line = self.lines[self.index]
                    self.index += 1
                    return line
                return b''

        class FakeProc:
            """Fake process object to simulate polling behavior."""

            def __init__(self) -> None:
                self.stdout = FakeStdout()
                self.returncode = 0
                self.poll_call_count = 0

            def poll(self) -> int | None:  # pylint: disable=missing-docstring
                self.poll_call_count += 1
                return None if self.poll_call_count < 3 else 0

        fake_proc = FakeProc()

        with self.swap(constants, 'EMULATOR_MODE', False):
            self.exit_stack.enter_context(
                self.swap(
                    common, 'is_oppia_server_already_running', lambda *_: False
                )
            )
            self.exit_stack.enter_context(
                self.swap(
                    run_e2e_tests,
                    'install_third_party_libraries',
                    lambda _: None,
                )
            )
            self.exit_stack.enter_context(
                self.swap(build, 'build_js_files', lambda *_, **__: None)
            )

            self._swap_servers(
                [
                    'managed_redis_server',
                    'managed_elasticsearch_dev_server',
                    'managed_dev_appserver',
                    'managed_webdriverio_server',
                    'managed_cloud_datastore_emulator',
                ],
                default_fn=lambda *a, **k: contextlib.nullcontext(fake_proc),
                special_overrides={
                    'managed_cloud_datastore_emulator': (
                        lambda *a, **k: contextlib.nullcontext(fake_proc),
                        None,
                        False,
                    ),
                },
            )

            args = run_e2e_tests._PARSER.parse_args(  # pylint: disable=protected-access
                args=[]
            )
            with self.swap_mock_set_constants_to_default:
                output_lines, return_code = run_e2e_tests.run_tests(args)

        expected_lines = [b'line1', b'line2']
        self.assertEqual(output_lines, expected_lines)
        self.assertEqual(return_code, 0)
