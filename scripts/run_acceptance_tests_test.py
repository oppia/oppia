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
import os
import shutil
import subprocess
import sys
from unittest import mock

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

        self.swap_mock_set_constants_to_default = mock.patch.object(
            common, 'set_constants_to_default', mock_constants
        )
        self.compile_test_ts_files_patch = mock.patch.object(
            run_acceptance_tests, 'compile_test_ts_files', lambda: None
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

        popen_error_patch = mock.patch.object(
            subprocess, 'Popen', mock_popen_error_call
        )
        with popen_error_patch:
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
        os_path_exists_patch = mock.patch.object(
            os.path, 'exists', mock_os_path_exists
        )
        shutil_rmtree_patch = mock.patch.object(
            shutil, 'rmtree', side_effect=mock_shutil_rmtree
        )
        shutil_copytree_patch = mock.patch.object(
            shutil, 'copytree', side_effect=mock_shutil_copytree
        )
        expected_cmd = (
            './node_modules/typescript/bin/tsc -p %s'
            % './tsconfig.puppeteer-acceptance-tests.json'
        )
        process_patch = mock.patch.object(
            subprocess, 'Popen', side_effect=mock_popen_call
        )
        communicate_patch = mock.patch.object(
            subprocess.Popen, 'communicate', mock_communicate
        )

        with (
            os_path_exists_patch
        ), shutil_rmtree_patch as rmtree_mock, process_patch as popen_mock:
            with shutil_copytree_patch as copytree_mock, communicate_patch:
                run_acceptance_tests.compile_test_ts_files()

        # Assertions for the mocks.
        rmtree_mock.assert_called_once_with(build_dir_path)
        copytree_mock.assert_called_once_with(
            os.path.join(puppeteer_acceptance_tests_dir_path, 'data'),
            os.path.join(build_dir_path, 'data'),
        )
        popen_mock.assert_called_once_with(
            expected_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True,
        )

    def test_start_tests_when_other_instances_not_stopped(self) -> None:
        is_running_mock = self.exit_stack.enter_context(
            mock.patch.object(
                common,
                'is_oppia_server_already_running',
                side_effect=lambda *_: True,
            )
        )
        portserver_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )

        with self.compile_test_ts_files_patch, self.assertRaisesRegex(
            SystemExit,
            """
            Oppia server is already running. Try shutting all the servers down
            before running the script.
        """,
        ):
            run_acceptance_tests.main(args=['--suite', 'testSuite'])

        is_running_mock.assert_called()
        portserver_mock.assert_called()

    def test_start_tests_when_no_other_instance_running(self) -> None:
        is_running_mock = self.exit_stack.enter_context(
            mock.patch.object(
                common,
                'is_oppia_server_already_running',
                side_effect=lambda *_: False,
            )
        )
        build_js_mock = self.exit_stack.enter_context(
            mock.patch.object(
                build, 'build_js_files', side_effect=lambda *_, **__: None
            )
        )
        elasticsearch_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        firebase_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        appserver_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        redis_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        portserver_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        datastore_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )
        acceptance_server_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_acceptance_tests_server',
                side_effect=mock_managed_process,
            )
        )
        sys_exit_mock = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit', side_effect=lambda _: None)
        )

        with self.swap_mock_set_constants_to_default:
            with self.compile_test_ts_files_patch:
                run_acceptance_tests.main(args=['--suite', 'testSuite'])

        is_running_mock.assert_called()
        build_js_mock.assert_called_once_with(True, source_maps=False)
        elasticsearch_mock.assert_called()
        firebase_mock.assert_called()
        appserver_mock.assert_called()
        redis_mock.assert_called()
        portserver_mock.assert_called()
        datastore_mock.assert_called()
        acceptance_server_mock.assert_called_once_with(
            suite_name='testSuite',
            headless=False,
            mobile=False,
            prod_env=False,
            stdout=subprocess.PIPE,
        )
        sys_exit_mock.assert_called_once_with(0)

    def test_work_with_non_ascii_chars(self) -> None:
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

        is_running_mock = self.exit_stack.enter_context(
            mock.patch.object(
                common,
                'is_oppia_server_already_running',
                side_effect=lambda *_: False,
            )
        )
        build_js_mock = self.exit_stack.enter_context(
            mock.patch.object(
                build, 'build_js_files', side_effect=lambda *_, **__: None
            )
        )
        elasticsearch_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        firebase_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        appserver_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        redis_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        datastore_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )
        acceptance_server_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_acceptance_tests_server',
                side_effect=mock_managed_acceptance_tests_server,
            )
        )
        args = run_acceptance_tests._PARSER.parse_args(  # pylint: disable=protected-access, line-too-long
            args=['--suite', 'testSuite']
        )

        with self.swap_mock_set_constants_to_default:
            with self.compile_test_ts_files_patch:
                lines, _ = run_acceptance_tests.run_tests(args)

        self.assertEqual(
            [line.decode('utf-8') for line in lines], ['sample', '✓', 'output']
        )

        is_running_mock.assert_called()
        build_js_mock.assert_called_once_with(True, source_maps=False)
        elasticsearch_mock.assert_called()
        firebase_mock.assert_called()
        appserver_mock.assert_called()
        redis_mock.assert_called()
        datastore_mock.assert_called()
        acceptance_server_mock.assert_called_once_with(
            suite_name='testSuite',
            headless=False,
            mobile=False,
            prod_env=False,
            stdout=subprocess.PIPE,
        )

    def test_start_tests_skip_build(self) -> None:
        is_running_mock = self.exit_stack.enter_context(
            mock.patch.object(
                common,
                'is_oppia_server_already_running',
                side_effect=lambda *_: False,
            )
        )
        modify_constants_mock = self.exit_stack.enter_context(
            mock.patch.object(
                common, 'modify_constants', side_effect=lambda *_, **__: None
            )
        )
        set_constants_mock = self.exit_stack.enter_context(
            mock.patch.object(
                common, 'set_constants_to_default', side_effect=lambda: None
            )
        )
        elasticsearch_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        firebase_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        appserver_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        redis_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        webpack_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_webpack_compiler',
                side_effect=mock_managed_process,
            )
        )
        portserver_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        datastore_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )
        acceptance_server_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_acceptance_tests_server',
                side_effect=mock_managed_process,
            )
        )
        sys_exit_mock = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit', side_effect=lambda _: None)
        )

        with self.compile_test_ts_files_patch:
            run_acceptance_tests.main(
                args=['--suite', 'testSuite', '--skip_build']
            )

        is_running_mock.assert_called()
        modify_constants_mock.assert_called_once_with(prod_env=False)
        set_constants_mock.assert_called()
        elasticsearch_mock.assert_called()
        firebase_mock.assert_called()
        appserver_mock.assert_called()
        redis_mock.assert_called()
        webpack_mock.assert_not_called()
        portserver_mock.assert_called()
        datastore_mock.assert_called()
        acceptance_server_mock.assert_called_once_with(
            suite_name='testSuite',
            headless=False,
            mobile=False,
            prod_env=False,
            stdout=subprocess.PIPE,
        )
        sys_exit_mock.assert_called_once_with(0)

    def test_start_tests_in_jasmine(self) -> None:
        is_running_mock = self.exit_stack.enter_context(
            mock.patch.object(
                common,
                'is_oppia_server_already_running',
                side_effect=lambda *_: False,
            )
        )
        build_js_mock = self.exit_stack.enter_context(
            mock.patch.object(
                build, 'build_js_files', side_effect=lambda *_, **__: None
            )
        )
        elasticsearch_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        firebase_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        appserver_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        redis_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        portserver_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers, 'managed_portserver', side_effect=mock_managed_process
            )
        )
        datastore_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )
        acceptance_server_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_acceptance_tests_server',
                side_effect=mock_managed_process,
            )
        )
        sys_exit_mock = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit', side_effect=lambda _: None)
        )

        with self.swap_mock_set_constants_to_default:
            with self.compile_test_ts_files_patch:
                run_acceptance_tests.main(args=['--suite', 'testSuite'])

        is_running_mock.assert_called()
        build_js_mock.assert_called_once_with(True, source_maps=False)
        elasticsearch_mock.assert_called()
        firebase_mock.assert_called()
        appserver_mock.assert_called()
        redis_mock.assert_called()
        portserver_mock.assert_called()
        datastore_mock.assert_called()
        acceptance_server_mock.assert_called_once_with(
            suite_name='testSuite',
            headless=False,
            mobile=False,
            prod_env=False,
            stdout=subprocess.PIPE,
        )
        sys_exit_mock.assert_called_once_with(0)

    def test_start_tests_for_long_lived_process(self) -> None:
        is_running_mock = self.exit_stack.enter_context(
            mock.patch.object(
                common,
                'is_oppia_server_already_running',
                side_effect=lambda *_: False,
            )
        )
        build_js_mock = self.exit_stack.enter_context(
            mock.patch.object(
                build, 'build_js_files', side_effect=lambda *_, **__: None
            )
        )
        elasticsearch_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_elasticsearch_dev_server',
                side_effect=mock_managed_process,
            )
        )
        firebase_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_firebase_auth_emulator',
                side_effect=mock_managed_process,
            )
        )
        appserver_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_dev_appserver',
                side_effect=mock_managed_process,
            )
        )
        redis_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_redis_server',
                side_effect=mock_managed_process,
            )
        )
        datastore_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_cloud_datastore_emulator',
                side_effect=mock_managed_process,
            )
        )
        acceptance_server_mock = self.exit_stack.enter_context(
            mock.patch.object(
                servers,
                'managed_acceptance_tests_server',
                side_effect=mock_managed_long_lived_process,
            )
        )
        sys_exit_mock = self.exit_stack.enter_context(
            mock.patch.object(sys, 'exit', side_effect=lambda _: None)
        )

        with self.swap_mock_set_constants_to_default:
            with self.compile_test_ts_files_patch:
                run_acceptance_tests.main(args=['--suite', 'testSuite'])

        is_running_mock.assert_called()
        build_js_mock.assert_called_once_with(True, source_maps=False)
        elasticsearch_mock.assert_called()
        firebase_mock.assert_called()
        appserver_mock.assert_called()
        redis_mock.assert_called()
        datastore_mock.assert_called()
        acceptance_server_mock.assert_called_once_with(
            suite_name='testSuite',
            headless=False,
            mobile=False,
            prod_env=False,
            stdout=subprocess.PIPE,
        )
        sys_exit_mock.assert_called_once_with(0)
