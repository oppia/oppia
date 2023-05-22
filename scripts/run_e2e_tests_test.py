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

from core.tests import test_utils
from scripts import build
from scripts import common
from scripts import install_third_party_libs
from scripts import run_e2e_tests
from scripts import scripts_test_utils
from scripts import servers

from typing import ContextManager, Final, Tuple

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
        enter_result=scripts_test_utils.PopenStub(alive=False))


class RunE2ETestsTests(test_utils.GenericTestBase):
    """Test the run_e2e_tests methods."""

    def setUp(self) -> None:
        super().setUp()
        self.exit_stack = contextlib.ExitStack()

        def mock_constants() -> None:
            print('mock_set_constants_to_default')
        self.swap_mock_set_constants_to_default = self.swap(
            common, 'set_constants_to_default', mock_constants)

    def tearDown(self) -> None:
        try:
            self.exit_stack.close()
        finally:
            super().tearDown()

    def test_wait_for_port_to_be_in_use_when_port_successfully_opened(
        self
    ) -> None:
        num_var = 0

        def mock_is_port_in_use(unused_port: int) -> bool:
            nonlocal num_var
            num_var += 1
            return num_var > 10

        mock_sleep = self.exit_stack.enter_context(self.swap_with_call_counter(
            time, 'sleep'))
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'is_port_in_use', mock_is_port_in_use))

        common.wait_for_port_to_be_in_use(1)

        self.assertEqual(num_var, 11)
        self.assertEqual(mock_sleep.times_called, 10)

    def test_wait_for_port_to_be_in_use_when_port_failed_to_open(self) -> None:
        mock_sleep = self.exit_stack.enter_context(self.swap_with_call_counter(
            time, 'sleep'))
        self.exit_stack.enter_context(self.swap(
            common, 'is_port_in_use', lambda _: False))
        self.exit_stack.enter_context(self.swap_with_checks(
            sys, 'exit', lambda _: None))

        common.wait_for_port_to_be_in_use(1)

        self.assertEqual(
            mock_sleep.times_called, common.MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS)

    def test_install_third_party_libraries_without_skip(self) -> None:
        self.exit_stack.enter_context(self.swap_with_checks(
            install_third_party_libs, 'main', lambda *_, **__: None))

        run_e2e_tests.install_third_party_libraries(False)

    def test_install_third_party_libraries_with_skip(self) -> None:
        self.exit_stack.enter_context(self.swap_with_checks(
            install_third_party_libs, 'main', lambda *_, **__: None,
            called=False))

        run_e2e_tests.install_third_party_libraries(True)

    def test_start_tests_when_other_instances_not_stopped(self) -> None:
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'is_oppia_server_already_running', lambda *_: True))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))

        with self.assertRaisesRegex(SystemExit, '1'):
            run_e2e_tests.main(args=[])

    def test_start_tests_when_no_other_instance_running(self) -> None:
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'is_oppia_server_already_running', lambda *_: False))
        self.exit_stack.enter_context(self.swap_with_checks(
            run_e2e_tests, 'install_third_party_libraries', lambda _: None,
            expected_args=[(False,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            build, 'build_js_files', lambda *_, **__: None,
            expected_args=[(True,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_elasticsearch_dev_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_firebase_auth_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_dev_appserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_redis_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_cloud_datastore_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_webdriverio_server', mock_managed_process,
            expected_kwargs=[
                {
                    'suite_name': 'full',
                    'chrome_version': None,
                    'dev_mode': True,
                    'mobile': False,
                    'sharding_instances': 3,
                    'debug_mode': False,
                    'stdout': subprocess.PIPE,
                },
            ]))
        self.exit_stack.enter_context(self.swap_with_checks(
            sys, 'exit', lambda _: None, expected_args=[(0,)]))
        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(args=[])

    def test_work_with_non_ascii_chars(self) -> None:
        def mock_managed_webdriverio_server(
            **unused_kwargs: str
        ) -> ContextManager[scripts_test_utils.PopenStub]:  # pylint: disable=unused-argument
            return contextlib.nullcontext(
                enter_result=scripts_test_utils.PopenStub(
                    stdout='sample\n✓\noutput\n'.encode(encoding='utf-8'),
                    alive=False))

        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'is_oppia_server_already_running', lambda *_: False))
        self.exit_stack.enter_context(self.swap_with_checks(
            run_e2e_tests, 'install_third_party_libraries', lambda _: None,
            expected_args=[(False,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            build, 'build_js_files', lambda *_, **__: None,
            expected_args=[(True,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_elasticsearch_dev_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_firebase_auth_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_dev_appserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_redis_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_cloud_datastore_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_webdriverio_server',
            mock_managed_webdriverio_server,
            expected_kwargs=[
                {
                    'suite_name': 'full',
                    'chrome_version': None,
                    'dev_mode': True,
                    'sharding_instances': 3,
                    'debug_mode': False,
                    'mobile': False,
                    'stdout': subprocess.PIPE,
                },
            ]))
        args = run_e2e_tests._PARSER.parse_args(args=[])  # pylint: disable=protected-access

        with self.swap_mock_set_constants_to_default:
            lines, _ = run_e2e_tests.run_tests(args)

        self.assertEqual(
            [line.decode('utf-8') for line in lines],
            ['sample', u'✓', 'output']
        )

    def test_rerun_when_tests_fail_with_rerun_yes(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap(
            run_e2e_tests, 'run_tests', mock_run_tests))
        self.exit_stack.enter_context(self.swap_with_checks(
            sys, 'exit', lambda _: None, expected_args=[(1,)]))

        run_e2e_tests.main(args=['--suite', 'navigation'])

    def test_no_rerun_when_tests_flake_with_rerun_no(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        self.exit_stack.enter_context(self.swap(
            run_e2e_tests, 'run_tests', mock_run_tests))
        self.exit_stack.enter_context(self.swap_with_checks(
            sys, 'exit', lambda _: None, expected_args=[(1,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))

        run_e2e_tests.main(args=['--suite', 'navigation'])

    def test_no_rerun_when_tests_flake_with_rerun_unknown(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        self.exit_stack.enter_context(self.swap(
            run_e2e_tests, 'run_tests', mock_run_tests))
        self.exit_stack.enter_context(self.swap_with_checks(
            sys, 'exit', lambda _: None, expected_args=[(1,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))

        run_e2e_tests.main(args=['--suite', 'navigation'])

    def test_no_reruns_off_ci_fail(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap(
            run_e2e_tests, 'run_tests', mock_run_tests))
        self.exit_stack.enter_context(self.swap_with_checks(
            sys, 'exit', lambda _: None, expected_args=[(1,)]))

        run_e2e_tests.main(args=['--suite', 'navigation'])

    def test_no_reruns_off_ci_pass(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 0

        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap(
            run_e2e_tests, 'run_tests', mock_run_tests))
        self.exit_stack.enter_context(self.swap_with_checks(
            sys, 'exit', lambda _: None, expected_args=[(0,)]))

        run_e2e_tests.main(args=['--suite', 'navigation'])

    def test_start_tests_skip_build(self) -> None:
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'is_oppia_server_already_running', lambda *_: False))
        self.exit_stack.enter_context(self.swap_with_checks(
            run_e2e_tests, 'install_third_party_libraries', lambda _: None,
            expected_args=[(True,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'modify_constants', lambda *_, **__: None,
            expected_kwargs=[{'prod_env': False}]))
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'set_constants_to_default', lambda: None))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_elasticsearch_dev_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_firebase_auth_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_dev_appserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_redis_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_webpack_compiler', mock_managed_process,
            called=False))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_cloud_datastore_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_webdriverio_server', mock_managed_process,
            expected_kwargs=[
                {
                    'suite_name': 'full',
                    'chrome_version': None,
                    'dev_mode': True,
                    'mobile': False,
                    'sharding_instances': 3,
                    'debug_mode': False,
                    'stdout': subprocess.PIPE,
                },
            ]))
        self.exit_stack.enter_context(self.swap_with_checks(
            sys, 'exit', lambda _: None, expected_args=[(0,)]))

        run_e2e_tests.main(args=['--skip-install', '--skip-build'])

    def test_start_tests_in_debug_mode(self) -> None:
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'is_oppia_server_already_running', lambda *_: False))
        self.exit_stack.enter_context(self.swap_with_checks(
            run_e2e_tests, 'install_third_party_libraries', lambda _: None,
            expected_args=[(False,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            build, 'build_js_files', lambda *_, **__: None,
            expected_args=[(True,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_elasticsearch_dev_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_firebase_auth_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_dev_appserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_redis_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_cloud_datastore_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_webdriverio_server', mock_managed_process,
            expected_kwargs=[
                {
                    'suite_name': 'full',
                    'chrome_version': None,
                    'dev_mode': True,
                    'mobile': False,
                    'sharding_instances': 3,
                    'debug_mode': True,
                    'stdout': subprocess.PIPE,
                },
            ]))
        self.exit_stack.enter_context(self.swap_with_checks(
            sys, 'exit', lambda _: None, expected_args=[(0,)]))

        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(args=['--debug_mode'])

    def test_start_tests_in_with_chromedriver_flag(self) -> None:
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'is_oppia_server_already_running', lambda *_: False))
        self.exit_stack.enter_context(self.swap_with_checks(
            run_e2e_tests, 'install_third_party_libraries', lambda _: None,
            expected_args=[(False,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            build, 'build_js_files', lambda *_, **__: None,
            expected_args=[(True,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_elasticsearch_dev_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_firebase_auth_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_dev_appserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_redis_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_cloud_datastore_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_webdriverio_server', mock_managed_process,
            expected_kwargs=[
                {
                    'suite_name': 'full',
                    'chrome_version': CHROME_DRIVER_VERSION,
                    'dev_mode': True,
                    'mobile': False,
                    'sharding_instances': 3,
                    'debug_mode': False,
                    'stdout': subprocess.PIPE,
                },
            ]))
        self.exit_stack.enter_context(self.swap_with_checks(
            sys, 'exit', lambda _: None, expected_args=[(0,)]))

        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(
                args=['--chrome_driver_version', CHROME_DRIVER_VERSION])

    def test_start_tests_in_webdriverio(self) -> None:
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'is_oppia_server_already_running', lambda *_: False))
        self.exit_stack.enter_context(self.swap_with_checks(
            run_e2e_tests, 'install_third_party_libraries', lambda _: None,
            expected_args=[(False,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            build, 'build_js_files', lambda *_, **__: None,
            expected_args=[(True,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_elasticsearch_dev_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_firebase_auth_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_dev_appserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_redis_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_cloud_datastore_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_webdriverio_server', mock_managed_process,
            expected_kwargs=[
                {
                    'suite_name': 'collections',
                    'chrome_version': None,
                    'dev_mode': True,
                    'mobile': False,
                    'sharding_instances': 3,
                    'debug_mode': False,
                    'stdout': subprocess.PIPE,
                },
            ]))
        self.exit_stack.enter_context(self.swap_with_checks(
            sys, 'exit', lambda _: None, expected_args=[(0,)]))

        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(
                args=['--suite', 'collections'])

    def test_do_not_run_with_test_non_mobile_suite_in_mobile_mode(self) -> None:
        self.exit_stack.enter_context(self.swap_with_checks(
            common, 'is_oppia_server_already_running', lambda *_: False))
        self.exit_stack.enter_context(self.swap_with_checks(
            run_e2e_tests, 'install_third_party_libraries', lambda _: None,
            expected_args=[(False,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            build, 'build_js_files', lambda *_, **__: None,
            expected_args=[(True,)]))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_elasticsearch_dev_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_firebase_auth_emulator', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_dev_appserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_redis_server', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_portserver', mock_managed_process))
        self.exit_stack.enter_context(self.swap_with_checks(
            servers, 'managed_cloud_datastore_emulator', mock_managed_process))

        with self.assertRaisesRegex(SystemExit, '^1$'):
            with self.swap_mock_set_constants_to_default:
                run_e2e_tests.main(args=['--mobile', '--suite', 'collections'])
