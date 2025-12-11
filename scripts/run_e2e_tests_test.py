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
from unittest import mock

from core.tests import test_utils
from scripts import (
    build,
    common,
    install_third_party_libs,
    run_e2e_tests,
    scripts_test_utils,
    servers,
)

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
        enter_result=scripts_test_utils.PopenStub(alive=False)
    )


class RunE2ETestsTests(test_utils.GenericTestBase):
    """Test the run_e2e_tests methods."""

    def setUp(self) -> None:
        super().setUp()
        self.exit_stack = contextlib.ExitStack()

        def mock_constants() -> None:
            print('mock_set_constants_to_default')

        self.swap_mock_set_constants_to_default = mock.patch.object(
            common, 'set_constants_to_default', mock_constants
        )

    def tearDown(self) -> None:
        try:
            self.exit_stack.close()
        finally:
            super().tearDown()

    def test_wait_for_port_to_be_in_use_when_port_successfully_opened(
        self,
    ) -> None:
        num_var = 0

        def mock_is_port_in_use(unused_port: int) -> bool:
            nonlocal num_var
            num_var += 1
            return num_var > 10

        mock_sleep = self.exit_stack.enter_context(
            mock.patch.object(time, 'sleep')
        )
        self.exit_stack.enter_context(
            self.swap_with_checks(common, 'is_port_in_use', mock_is_port_in_use)
        )

        common.wait_for_port_to_be_in_use(1)

        self.assertEqual(num_var, 11)
        self.assertEqual(mock_sleep.call_count, 10)

    def test_wait_for_port_to_be_in_use_when_port_failed_to_open(self) -> None:
        mock_sleep = self.exit_stack.enter_context(
            mock.patch.object(time, 'sleep')
        )
        self.exit_stack.enter_context(
            mock.patch.object(common, 'is_port_in_use', lambda _: False)
        )
        mock_exit = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit')
        )

        common.wait_for_port_to_be_in_use(1)

        self.assertEqual(
            mock_sleep.call_count, common.MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS
        )
        mock_exit.assert_called()

    def test_install_third_party_libraries_without_skip(self) -> None:
        mock_main = self.exit_stack.enter_context(
            mock.patch.object(install_third_party_libs, 'main')
        )

        run_e2e_tests.install_third_party_libraries(False)

        mock_main.assert_called()

    def test_install_third_party_libraries_with_skip(self) -> None:
        mock_main = self.exit_stack.enter_context(
            mock.patch.object(install_third_party_libs, 'main')
        )

        run_e2e_tests.install_third_party_libraries(True)

        mock_main.assert_not_called()

    def test_start_tests_when_other_instances_not_stopped(self) -> None:
        mock_is_running = self.exit_stack.enter_context(
            mock.patch.object(
                common, 'is_oppia_server_already_running', return_value=True
            )
        )
        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )

        with self.assertRaisesRegex(SystemExit, '1'):
            run_e2e_tests.main(args=[])

        mock_is_running.assert_called()
        mock_portserver.assert_called()

    def test_start_tests_when_no_other_instance_running(self) -> None:
        mock_is_running = self.exit_stack.enter_context(
            mock.patch.object(
                common, 'is_oppia_server_already_running', return_value=False
            )
        )
        mock_install_libs = self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'install_third_party_libraries')
        )
        mock_build_js = self.exit_stack.enter_context(
            mock.patch.object(build, 'build_js_files')
        )
        mock_elasticsearch = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        mock_firebase = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_dev_appserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        mock_redis = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        mock_datastore = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_webdriverio = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_webdriverio_server',
                side_effect=mock_managed_process,
            )
        )
        mock_exit = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit')
        )
        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(args=[])

        mock_exit.assert_called_once_with(0)
        mock_install_libs.assert_called_once_with(False)
        mock_build_js.assert_called_once_with(True)
        mock_is_running.assert_called()
        mock_elasticsearch.assert_called()
        mock_firebase.assert_called()
        mock_dev_appserver.assert_called()
        mock_redis.assert_called()
        mock_portserver.assert_called()
        mock_datastore.assert_called()
        mock_webdriverio.assert_called_once_with(
            suite_name='full',
            chrome_version=None,
            dev_mode=True,
            mobile=False,
            sharding_instances=3,
            debug_mode=False,
            stdout=subprocess.PIPE,
        )

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

        mock_is_running = self.exit_stack.enter_context(
            mock.patch.object(
                common, 'is_oppia_server_already_running', return_value=False
            )
        )
        mock_install_libs = self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'install_third_party_libraries')
        )
        mock_build_js = self.exit_stack.enter_context(
            mock.patch.object(build, 'build_js_files')
        )
        mock_elasticsearch = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        mock_firebase = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_dev_appserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        mock_redis = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        mock_datastore = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_webdriverio = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_webdriverio_server',
                side_effect=mock_managed_webdriverio_server,
            )
        )
        args = run_e2e_tests._PARSER.parse_args(  # pylint: disable=protected-access
            args=[]
        )

        with self.swap_mock_set_constants_to_default:
            lines, _ = run_e2e_tests.run_tests(args)

        self.assertEqual(
            [line.decode('utf-8') for line in lines], ['sample', '✓', 'output']
        )

        mock_install_libs.assert_called_once_with(False)
        mock_build_js.assert_called_once_with(True)
        mock_is_running.assert_called()
        mock_elasticsearch.assert_called()
        mock_firebase.assert_called()
        mock_dev_appserver.assert_called()
        mock_redis.assert_called()
        mock_datastore.assert_called()
        mock_webdriverio.assert_called_once_with(
            suite_name='full',
            chrome_version=None,
            dev_mode=True,
            sharding_instances=3,
            debug_mode=False,
            mobile=False,
            stdout=subprocess.PIPE,
        )

    def test_rerun_when_tests_fail_with_rerun_yes(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'run_tests', mock_run_tests)
        )
        mock_exit = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit')
        )

        run_e2e_tests.main(args=['--suite', 'navigation'])

        mock_exit.assert_called_once_with(1)
        mock_portserver.assert_called()

    def test_no_rerun_when_tests_flake_with_rerun_no(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'run_tests', mock_run_tests)
        )
        mock_exit = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit')
        )
        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )

        run_e2e_tests.main(args=['--suite', 'navigation'])

        mock_exit.assert_called_once_with(1)
        mock_portserver.assert_called()

    def test_no_rerun_when_tests_flake_with_rerun_unknown(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'run_tests', mock_run_tests)
        )
        mock_exit = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit')
        )
        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )

        run_e2e_tests.main(args=['--suite', 'navigation'])

        mock_exit.assert_called_once_with(1)
        mock_portserver.assert_called()

    def test_no_reruns_off_ci_fail(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 1

        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'run_tests', mock_run_tests)
        )
        mock_exit = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit')
        )

        run_e2e_tests.main(args=['--suite', 'navigation'])

        mock_exit.assert_called_once_with(1)
        mock_portserver.assert_called()

    def test_no_reruns_off_ci_pass(self) -> None:
        def mock_run_tests(unused_args: str) -> Tuple[str, int]:
            return 'sample\noutput', 0

        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'run_tests', mock_run_tests)
        )
        mock_exit = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit')
        )

        run_e2e_tests.main(args=['--suite', 'navigation'])

        mock_exit.assert_called_once_with(0)
        mock_portserver.assert_called()

    def test_start_tests_skip_build(self) -> None:
        mock_is_running = self.exit_stack.enter_context(
            mock.patch.object(
                common, 'is_oppia_server_already_running', return_value=False
            )
        )
        mock_install_libs = self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'install_third_party_libraries')
        )
        mock_modify_constants = self.exit_stack.enter_context(
            mock.patch.object(common, 'modify_constants')
        )
        mock_set_constants = self.exit_stack.enter_context(
            mock.patch.object(common, 'set_constants_to_default')
        )
        mock_elasticsearch = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        mock_firebase = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_dev_appserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        mock_redis = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        mock_webpack_compiler = self.exit_stack.enter_context(
            mock.patch.object(servers, 'managed_webpack_compiler')
        )
        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        mock_datastore = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_webdriverio = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_webdriverio_server',
                side_effect=mock_managed_process,
            )
        )
        mock_exit = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit')
        )

        run_e2e_tests.main(args=['--skip_install', '--skip_build'])

        mock_install_libs.assert_called_once_with(True)
        mock_modify_constants.assert_called_once_with(prod_env=False)
        mock_set_constants.assert_called_once_with()
        mock_webpack_compiler.assert_not_called()
        mock_elasticsearch.assert_called()
        mock_firebase.assert_called()
        mock_dev_appserver.assert_called()
        mock_redis.assert_called()
        mock_portserver.assert_called()
        mock_datastore.assert_called()
        mock_webdriverio.assert_called_once_with(
            suite_name='full',
            chrome_version=None,
            dev_mode=True,
            mobile=False,
            sharding_instances=3,
            debug_mode=False,
            stdout=subprocess.PIPE,
        )
        mock_exit.assert_called_once_with(0)
        mock_is_running.assert_called()

    def test_start_tests_in_debug_mode(self) -> None:
        mock_is_running = self.exit_stack.enter_context(
            mock.patch.object(
                common, 'is_oppia_server_already_running', return_value=False
            )
        )
        mock_install_libs = self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'install_third_party_libraries')
        )
        mock_build_js = self.exit_stack.enter_context(
            mock.patch.object(build, 'build_js_files')
        )
        mock_elasticsearch = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        mock_firebase = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_dev_appserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        mock_redis = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        mock_datastore = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_webdriverio = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_webdriverio_server',
                side_effect=mock_managed_process,
            )
        )
        mock_exit = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit')
        )

        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(args=['--debug_mode'])

        mock_install_libs.assert_called_once_with(False)
        mock_build_js.assert_called_once_with(True)
        mock_elasticsearch.assert_called()
        mock_firebase.assert_called()
        mock_dev_appserver.assert_called()
        mock_redis.assert_called()
        mock_portserver.assert_called()
        mock_datastore.assert_called()
        mock_webdriverio.assert_called_once_with(
            suite_name='full',
            chrome_version=None,
            dev_mode=True,
            mobile=False,
            sharding_instances=3,
            debug_mode=True,
            stdout=subprocess.PIPE,
        )
        mock_exit.assert_called_once_with(0)
        mock_is_running.assert_called()

    def test_start_tests_in_with_chromedriver_flag(self) -> None:
        mock_is_running = self.exit_stack.enter_context(
            mock.patch.object(
                common, 'is_oppia_server_already_running', return_value=False
            )
        )
        mock_install_libs = self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'install_third_party_libraries')
        )
        mock_build_js = self.exit_stack.enter_context(
            mock.patch.object(build, 'build_js_files')
        )
        mock_elasticsearch = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        mock_firebase = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_dev_appserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        mock_redis = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        mock_datastore = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_webdriverio = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_webdriverio_server',
                side_effect=mock_managed_process,
            )
        )
        mock_exit = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit')
        )

        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(
                args=['--chrome_driver_version', CHROME_DRIVER_VERSION]
            )

        mock_install_libs.assert_called_once_with(False)
        mock_build_js.assert_called_once_with(True)
        mock_elasticsearch.assert_called()
        mock_firebase.assert_called()
        mock_dev_appserver.assert_called()
        mock_redis.assert_called()
        mock_portserver.assert_called()
        mock_datastore.assert_called()
        mock_webdriverio.assert_called_once_with(
            suite_name='full',
            chrome_version=CHROME_DRIVER_VERSION,
            dev_mode=True,
            mobile=False,
            sharding_instances=3,
            debug_mode=False,
            stdout=subprocess.PIPE,
        )
        mock_exit.assert_called_once_with(0)
        mock_is_running.assert_called()

    def test_start_tests_in_webdriverio(self) -> None:
        mock_is_running = self.exit_stack.enter_context(
            mock.patch.object(
                common, 'is_oppia_server_already_running', return_value=False
            )
        )
        mock_install_libs = self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'install_third_party_libraries')
        )
        mock_build_js = self.exit_stack.enter_context(
            mock.patch.object(build, 'build_js_files')
        )
        mock_elasticsearch = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        mock_firebase = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_dev_appserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        mock_redis = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        mock_datastore = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_webdriverio = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_webdriverio_server',
                side_effect=mock_managed_process,
            )
        )
        mock_exit = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit')
        )

        with self.swap_mock_set_constants_to_default:
            run_e2e_tests.main(args=['--suite', 'collections'])

        mock_install_libs.assert_called_once_with(False)
        mock_build_js.assert_called_once_with(True)
        mock_elasticsearch.assert_called()
        mock_firebase.assert_called()
        mock_dev_appserver.assert_called()
        mock_redis.assert_called()
        mock_portserver.assert_called()
        mock_datastore.assert_called()
        mock_webdriverio.assert_called_once_with(
            suite_name='collections',
            chrome_version=None,
            dev_mode=True,
            mobile=False,
            sharding_instances=3,
            debug_mode=False,
            stdout=subprocess.PIPE,
        )
        mock_exit.assert_called_once_with(0)
        mock_is_running.assert_called()

    def test_do_not_run_with_test_non_mobile_suite_in_mobile_mode(self) -> None:
        mock_is_running = self.exit_stack.enter_context(
            mock.patch.object(
                common, 'is_oppia_server_already_running', return_value=False
            )
        )
        mock_install_libs = self.exit_stack.enter_context(
            mock.patch.object(run_e2e_tests, 'install_third_party_libraries')
        )
        mock_build_js = self.exit_stack.enter_context(
            mock.patch.object(build, 'build_js_files')
        )
        mock_elasticsearch = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        mock_firebase = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        mock_dev_appserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        mock_redis = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        mock_portserver = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        mock_datastore = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )

        with self.assertRaisesRegex(SystemExit, '^1$'):
            with self.swap_mock_set_constants_to_default:
                run_e2e_tests.main(args=['--mobile', '--suite', 'collections'])

        mock_install_libs.assert_called_once_with(False)
        mock_build_js.assert_called_once_with(True)
        mock_elasticsearch.assert_called()
        mock_firebase.assert_called()
        mock_dev_appserver.assert_called()
        mock_redis.assert_called()
        mock_portserver.assert_called()
        mock_datastore.assert_called()
        mock_is_running.assert_called()
