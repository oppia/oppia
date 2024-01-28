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

"""Unit tests for scripts/common.py."""

from __future__ import annotations

import builtins
import contextlib
import errno
import getpass
import http.server
import io
import os
import re
import shutil
import socketserver
import ssl
import stat
import subprocess
import sys
import tempfile
import time
from urllib import request as urlrequest

from core import feconf
from core import utils
from core.tests import test_utils
from scripts import install_python_dev_dependencies
from scripts import servers

from typing import Generator, List, Literal, NoReturn

from . import common


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


def mock_context_manager() -> MockCompilerContextManager:
    return MockCompilerContextManager()


class CommonTests(test_utils.GenericTestBase):
    """Test the methods which handle common functionalities."""

    def setUp(self) -> None:
        super().setUp()
        self.print_arr: list[str] = []
        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)

    def test_run_ng_compilation_successfully(self) -> None:
        swap_isdir = self.swap_with_checks(
            os.path, 'isdir', lambda _: True, expected_kwargs=[])
        swap_ng_build = self.swap_with_checks(
            servers, 'managed_ng_build', mock_context_manager, expected_args=[])
        with self.print_swap, swap_ng_build, swap_isdir:
            common.run_ng_compilation()

        self.assertNotIn(
            'Failed to complete ng build compilation, exiting...',
            self.print_arr
        )

    def test_run_ng_compilation_failed(self) -> None:
        swap_isdir = self.swap_with_checks(
            os.path, 'isdir', lambda _: False, expected_kwargs=[])
        swap_ng_build = self.swap_with_checks(
            servers, 'managed_ng_build', mock_context_manager, expected_args=[])
        swap_sys_exit = self.swap_with_checks(
            sys,
            'exit',
            lambda _: None,
            expected_args=[(1,)]
        )
        with self.print_swap, swap_ng_build, swap_isdir, swap_sys_exit:
            common.run_ng_compilation()

        self.assertIn(
            'Failed to complete ng build compilation, exiting...',
            self.print_arr
        )

    def test_subprocess_error_results_in_failed_ng_build(self) -> None:
        class MockFailedCompiler:
            def wait(self) -> None: # pylint: disable=missing-docstring
                raise subprocess.CalledProcessError(
                    returncode=1, cmd='', output='Subprocess execution failed.')

        class MockFailedCompilerContextManager:
            def __init__(self) -> None:
                pass

            def __enter__(self) -> MockFailedCompiler:
                return MockFailedCompiler()

            def __exit__(self, *unused_args: str) -> None:
                pass

        def mock_failed_context_manager() -> MockFailedCompilerContextManager:
            return MockFailedCompilerContextManager()

        swap_ng_build = self.swap_with_checks(
            servers,
            'managed_ng_build',
            mock_failed_context_manager,
            expected_args=[]
        )
        swap_isdir = self.swap_with_checks(
            os.path,
            'isdir',
            lambda _: False,
            expected_args=[
                ('dist/oppia-angular',),
                ('dist/oppia-angular',),
                ('dist/oppia-angular',)
            ]
        )
        swap_sys_exit = self.swap_with_checks(
            sys,
            'exit',
            lambda _: None,
            expected_args=[(1,), (1,), (1,)]
        )
        with self.print_swap, swap_ng_build, swap_isdir, swap_sys_exit:
            common.run_ng_compilation()

    @contextlib.contextmanager
    def open_tcp_server_port(self) -> Generator[int, None, None]:
        """Context manager for starting and stoping an HTTP TCP server.

        Yields:
            int. The port number of the server.
        """
        handler = http.server.SimpleHTTPRequestHandler
        # NOTE: Binding to port 0 causes the OS to select a random free port
        # between 1024 to 65535.
        server = socketserver.TCPServer(('localhost', 0), handler)
        try:
            yield server.server_address[1]
        finally:
            server.server_close()

    def test_protoc_version_matches_protobuf(self) -> None:
        """Check that common.PROTOC_VERSION matches the version of protobuf in
        requirements.in.
        """
        with open(
            install_python_dev_dependencies.REQUIREMENTS_DEV_FILE_PATH,
            'r',
            encoding='utf-8',
        ) as f:
            for line in f:
                if line.startswith('protobuf'):
                    line = line.strip()
                    protobuf_version = line.split('==')[1]
                    break
        self.assertEqual(common.PROTOC_VERSION, protobuf_version)

    def test_is_x64_architecture_in_x86(self) -> None:
        maxsize_swap = self.swap(sys, 'maxsize', 1)
        with maxsize_swap:
            self.assertFalse(common.is_x64_architecture())

    def test_is_x64_architecture_in_x64(self) -> None:
        maxsize_swap = self.swap(sys, 'maxsize', 2**32 + 1)
        with maxsize_swap:
            self.assertTrue(common.is_x64_architecture())

    def test_is_mac_os(self) -> None:
        with self.swap(common, 'OS_NAME', 'Darwin'):
            self.assertTrue(common.is_mac_os())
        with self.swap(common, 'OS_NAME', 'Linux'):
            self.assertFalse(common.is_mac_os())

    def test_is_linux_os(self) -> None:
        with self.swap(common, 'OS_NAME', 'Linux'):
            self.assertTrue(common.is_linux_os())
        with self.swap(common, 'OS_NAME', 'Windows'):
            self.assertFalse(common.is_linux_os())

    def test_run_cmd(self) -> None:
        self.assertEqual(
            common.run_cmd(('echo Test for common.py ').split(' ')),
            'Test for common.py')

    def test_ensure_directory_exists_with_existing_dir(self) -> None:
        check_function_calls = {
            'makedirs_gets_called': False
        }
        def mock_makedirs(unused_dirpath: str) -> None:
            check_function_calls['makedirs_gets_called'] = True
        with self.swap(os, 'makedirs', mock_makedirs):
            common.ensure_directory_exists('assets')
        self.assertEqual(check_function_calls, {'makedirs_gets_called': False})

    def test_ensure_directory_exists_with_non_existing_dir(self) -> None:
        check_function_calls = {
            'makedirs_gets_called': False
        }
        def mock_makedirs(unused_dirpath: str) -> None:
            check_function_calls['makedirs_gets_called'] = True
        with self.swap(os, 'makedirs', mock_makedirs):
            common.ensure_directory_exists('test-dir')
        self.assertEqual(check_function_calls, {'makedirs_gets_called': True})

    def test_require_cwd_to_be_oppia_with_correct_cwd_and_unallowed_deploy_dir(
        self
    ) -> None:
        common.require_cwd_to_be_oppia()

    def test_require_cwd_to_be_oppia_with_correct_cwd_and_allowed_deploy_dir(
        self
    ) -> None:
        common.require_cwd_to_be_oppia(allow_deploy_dir=True)

    def test_require_cwd_to_be_oppia_with_wrong_cwd_and_unallowed_deploy_dir(
        self
    ) -> None:
        def mock_getcwd() -> str:
            return 'invalid'
        getcwd_swap = self.swap(os, 'getcwd', mock_getcwd)
        with getcwd_swap, self.assertRaisesRegex(
            Exception, 'Please run this script from the oppia/ directory.'):
            common.require_cwd_to_be_oppia()

    def test_require_cwd_to_be_oppia_with_wrong_cwd_and_allowed_deploy_dir(
        self
    ) -> None:
        def mock_getcwd() -> str:
            return 'invalid'

        def mock_basename(unused_dirpath: str) -> str:
            return 'deploy-dir'

        def mock_isdir(unused_dirpath: str) -> Literal[True]:
            return True
        getcwd_swap = self.swap(os, 'getcwd', mock_getcwd)
        basename_swap = self.swap(os.path, 'basename', mock_basename)
        isdir_swap = self.swap(os.path, 'isdir', mock_isdir)
        with getcwd_swap, basename_swap, isdir_swap:
            common.require_cwd_to_be_oppia(allow_deploy_dir=True)

    def test_open_new_tab_in_browser_if_possible_with_user_manually_opening_url(
        self
    ) -> None:
        try:
            check_function_calls = {
                'input_gets_called': 0,
                'check_call_gets_called': False
            }
            expected_check_function_calls = {
                'input_gets_called': 1,
                'check_call_gets_called': False
            }

            def mock_call(unused_cmd_tokens: List[str]) -> int:
                return 0

            def mock_check_call(unused_cmd_tokens: List[str]) -> None:
                check_function_calls['check_call_gets_called'] = True

            def mock_input() -> str:
                check_function_calls['input_gets_called'] += 1
                return 'n'
            call_swap = self.swap(subprocess, 'call', mock_call)
            check_call_swap = self.swap(
                subprocess, 'check_call', mock_check_call)
            input_swap = self.swap(builtins, 'input', mock_input)
            with call_swap, check_call_swap, input_swap:
                common.open_new_tab_in_browser_if_possible('test-url')
            self.assertEqual(
                check_function_calls, expected_check_function_calls)
        finally:
            common.USER_PREFERENCES['open_new_tab_in_browser'] = None

    def test_open_new_tab_in_browser_if_possible_with_url_opening_correctly(
        self
    ) -> None:
        try:
            check_function_calls = {
                'input_gets_called': 0,
                'check_call_gets_called': False
            }
            expected_check_function_calls = {
                'input_gets_called': 2,
                'check_call_gets_called': True
            }

            def mock_call(unused_cmd_tokens: List[str]) -> int:
                return 0

            def mock_check_call(unused_cmd_tokens: List[str]) -> None:
                check_function_calls['check_call_gets_called'] = True

            def mock_input() -> str:
                check_function_calls['input_gets_called'] += 1
                if check_function_calls['input_gets_called'] == 2:
                    return '1'
                return 'y'
            call_swap = self.swap(subprocess, 'call', mock_call)
            check_call_swap = self.swap(
                subprocess, 'check_call', mock_check_call)
            input_swap = self.swap(builtins, 'input', mock_input)
            with call_swap, check_call_swap, input_swap:
                common.open_new_tab_in_browser_if_possible('test-url')
            self.assertEqual(
                check_function_calls, expected_check_function_calls)
        finally:
            common.USER_PREFERENCES['open_new_tab_in_browser'] = None

    def test_open_new_tab_in_browser_if_possible_with_url_not_opening_correctly(
        self
    ) -> None:
        try:
            check_function_calls = {
                'input_gets_called': 0,
                'check_call_gets_called': False
            }
            expected_check_function_calls = {
                'input_gets_called': 3,
                'check_call_gets_called': False
            }

            def mock_call(unused_cmd_tokens: List[str]) -> int:
                return 1

            def mock_check_call(unused_cmd_tokens: List[str]) -> None:
                check_function_calls['check_call_gets_called'] = True

            def mock_input() -> str:
                check_function_calls['input_gets_called'] += 1
                if check_function_calls['input_gets_called'] == 2:
                    return '1'
                return 'y'
            call_swap = self.swap(subprocess, 'call', mock_call)
            check_call_swap = self.swap(
                subprocess, 'check_call', mock_check_call)
            input_swap = self.swap(builtins, 'input', mock_input)
            with call_swap, check_call_swap, input_swap:
                common.open_new_tab_in_browser_if_possible('test-url')
            self.assertEqual(
                check_function_calls, expected_check_function_calls)
        finally:
            common.USER_PREFERENCES['open_new_tab_in_browser'] = None

    def test_open_new_tab_in_browser_if_possible_no_new_tab(
        self
    ) -> None:
        try:
            check_function_calls = {
                'input_gets_called': 0,
                'check_call_gets_called': False
            }
            expected_check_function_calls = {
                'input_gets_called': 0,
                'check_call_gets_called': False
            }

            def mock_call(unused_cmd_tokens: List[str]) -> int:
                return 0

            def mock_check_call(unused_cmd_tokens: List[str]) -> None:
                check_function_calls['check_call_gets_called'] = True

            def mock_input() -> str:
                check_function_calls['input_gets_called'] += 1
                if check_function_calls['input_gets_called'] == 2:
                    return '1'
                return 'no'
            call_swap = self.swap(subprocess, 'call', mock_call)
            check_call_swap = self.swap(
                subprocess, 'check_call', mock_check_call)
            input_swap = self.swap(builtins, 'input', mock_input)
            with call_swap, check_call_swap, input_swap:
                # Make it so the program asks the user to
                # Open the link in their browser.
                common.USER_PREFERENCES['open_new_tab_in_browser'] = 'no'
                common.open_new_tab_in_browser_if_possible('test-url')
            self.assertEqual(
                check_function_calls, expected_check_function_calls)
        finally:
            common.USER_PREFERENCES['open_new_tab_in_browser'] = None

    def test_get_remote_alias_with_correct_alias(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'remote1 url1\nremote2 url2'
        with self.swap(
            subprocess, 'check_output', mock_check_output
        ):
            self.assertEqual(common.get_remote_alias(['url1']), 'remote1')

    def test_get_remote_alias_with_incorrect_alias(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'remote1 url1\nremote2 url2'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegex(
            Exception,
            'ERROR: There is no existing remote alias for the url3, url4 repo.'
        ):
            common.get_remote_alias(['url3', 'url4'])

    def test_verify_local_repo_is_clean_with_clean_repo(self) -> None:
        def mock_check_output(unused_cmd_tokens: List[str]) -> bytes:
            return b'nothing to commit, working directory clean'
        with self.swap(
            subprocess, 'check_output', mock_check_output
        ):
            common.verify_local_repo_is_clean()

    def test_verify_local_repo_is_clean_with_unclean_repo(self) -> None:
        def mock_check_output(unused_cmd_tokens: List[str]) -> bytes:
            return b'invalid'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegex(
            Exception, 'ERROR: This script should be run from a clean branch.'
        ):
            common.verify_local_repo_is_clean()

    def test_get_current_branch_name(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch test'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.get_current_branch_name(), 'test')

    def test_update_branch_with_upstream(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch test'

        def mock_run_cmd(cmd: str) -> str:
            return cmd

        with self.swap(subprocess, 'check_output', mock_check_output):
            with self.swap(common, 'run_cmd', mock_run_cmd):
                common.update_branch_with_upstream()

    def test_get_current_release_version_number_with_non_hotfix_branch(
        self
    ) -> None:
        self.assertEqual(
            common.get_current_release_version_number('release-1.2.3'), '1.2.3')

    def test_get_current_release_version_number_with_hotfix_branch(
        self
    ) -> None:
        self.assertEqual(
            common.get_current_release_version_number('release-1.2.3-hotfix-1'),
            '1.2.3')

    def test_get_current_release_version_number_with_maintenance_branch(
        self
    ) -> None:
        self.assertEqual(
            common.get_current_release_version_number(
                'release-maintenance-1.2.3'), '1.2.3')

    def test_get_current_release_version_number_with_invalid_branch(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Invalid branch name: invalid-branch.'):
            common.get_current_release_version_number('invalid-branch')

    def test_is_current_branch_a_hotfix_branch_with_non_hotfix_branch(
        self
    ) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch release-1.2.3'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_hotfix_branch(), False)

    def test_is_current_branch_a_hotfix_branch_with_hotfix_branch(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch release-1.2.3-hotfix-1'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_hotfix_branch(), True)

    def test_is_current_branch_a_release_branch_with_release_branch(
        self
    ) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch release-1.2.3'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_release_branch(), True)

    def test_is_current_branch_a_release_branch_with_hotfix_branch(
        self
    ) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch release-1.2.3-hotfix-1'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_release_branch(), True)

    def test_is_current_branch_a_release_branch_with_maintenance_branch(
        self
    ) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch release-maintenance-1.2.3'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_release_branch(), True)

    def test_is_current_branch_a_release_branch_with_non_release_branch(
        self
    ) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch test'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_release_branch(), False)

    def test_is_current_branch_a_test_branch_with_test_branch(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch test-common'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_test_branch(), True)

    def test_is_current_branch_a_test_branch_with_non_test_branch(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch invalid-test'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            self.assertEqual(common.is_current_branch_a_test_branch(), False)

    def test_verify_current_branch_name_with_correct_branch(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch test'
        with self.swap(
            subprocess, 'check_output', mock_check_output):
            common.verify_current_branch_name('test')

    def test_verify_current_branch_name_with_incorrect_branch(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'On branch invalid'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegex(
            Exception,
            'ERROR: This script can only be run from the "test" branch.'
        ):
            common.verify_current_branch_name('test')

    def test_is_port_in_use(self) -> None:
        with self.open_tcp_server_port() as port:
            self.assertTrue(common.is_port_in_use(port))
        self.assertFalse(common.is_port_in_use(port))

    def test_wait_for_port_to_not_be_in_use_port_never_closes(self) -> None:
        def mock_sleep(unused_seconds: int) -> None:
            return
        def mock_is_port_in_use(unused_port_number: int) -> Literal[True]:
            return True

        sleep_swap = self.swap_with_checks(
            time, 'sleep', mock_sleep, expected_args=[(1,)] * 60)
        is_port_in_use_swap = self.swap(
            common, 'is_port_in_use', mock_is_port_in_use)

        with sleep_swap, is_port_in_use_swap:
            success = common.wait_for_port_to_not_be_in_use(9999)
        self.assertFalse(success)

    def test_wait_for_port_to_not_be_in_use_port_closes(self) -> None:
        def mock_sleep(unused_seconds: int) -> NoReturn:
            raise AssertionError('mock_sleep should not be called.')
        def mock_is_port_in_use(unused_port_number: int) -> Literal[False]:
            return False

        sleep_swap = self.swap(
            time, 'sleep', mock_sleep)
        is_port_in_use_swap = self.swap(
            common, 'is_port_in_use', mock_is_port_in_use)

        with sleep_swap, is_port_in_use_swap:
            success = common.wait_for_port_to_not_be_in_use(9999)
        self.assertTrue(success)

    def test_wait_for_port_to_be_in_use_port_never_opens(self) -> None:
        def mock_sleep(unused_seconds: int) -> None:
            return
        def mock_is_port_in_use(unused_port_number: int) -> Literal[False]:
            return False
        def mock_exit(unused_code: str) -> None:
            pass

        sleep_swap = self.swap_with_checks(
            time, 'sleep', mock_sleep, expected_args=[(1,)] * 60 * 5)
        is_port_in_use_swap = self.swap(
            common, 'is_port_in_use', mock_is_port_in_use)
        exit_swap = self.swap_with_checks(
            sys, 'exit', mock_exit, expected_args=[(1,)])

        with sleep_swap, is_port_in_use_swap, exit_swap:
            common.wait_for_port_to_be_in_use(9999)

    def test_wait_for_port_to_be_in_use_port_opens(self) -> None:
        def mock_sleep(unused_seconds: int) -> NoReturn:
            raise AssertionError('mock_sleep should not be called.')
        def mock_is_port_in_use(unused_port_number: int) -> Literal[True]:
            return True
        def mock_exit(unused_code: str) -> NoReturn:
            raise AssertionError('mock_exit should not be called.')

        sleep_swap = self.swap(time, 'sleep', mock_sleep)
        is_port_in_use_swap = self.swap(
            common, 'is_port_in_use', mock_is_port_in_use)
        exit_swap = self.swap(sys, 'exit', mock_exit)

        with sleep_swap, is_port_in_use_swap, exit_swap:
            common.wait_for_port_to_be_in_use(9999)

    def test_permissions_of_file(self) -> None:
        root_temp_dir = tempfile.mkdtemp()
        temp_dirpath = tempfile.mkdtemp(dir=root_temp_dir)
        temp_file = tempfile.NamedTemporaryFile(dir=temp_dirpath)
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(temp_file, 'name', 'temp_file')
        temp_file_path = os.path.join(temp_dirpath, 'temp_file')
        with utils.open_file(temp_file_path, 'w') as f:
            f.write('content')

        common.recursive_chown(root_temp_dir, os.getuid(), -1)
        common.recursive_chmod(root_temp_dir, 0o744)

        for root, directories, filenames in os.walk(root_temp_dir):
            for directory in directories:
                self.assertEqual(
                    oct(stat.S_IMODE(
                        os.stat(os.path.join(root, directory)).st_mode)),
                    '0o744')
                self.assertEqual(
                    os.stat(os.path.join(root, directory)).st_uid, os.getuid())

            for filename in filenames:
                self.assertEqual(
                    oct(
                        stat.S_IMODE(
                            os.stat(os.path.join(root, filename)).st_mode
                        )
                    ),
                    '0o744'
                )
                self.assertEqual(
                    os.stat(os.path.join(root, filename)).st_uid, os.getuid())

        temp_file.close()
        shutil.rmtree(root_temp_dir)

    def test_print_each_string_after_two_new_lines(self) -> None:
        @contextlib.contextmanager
        def _redirect_stdout(
            new_target: io.TextIOWrapper
        ) -> Generator[io.TextIOWrapper, None, None]:
            """Redirect stdout to the new target.

            Args:
                new_target: TextIOWrapper. The new target to which stdout is
                    redirected.

            Yields:
                TextIOWrapper. The new target.
            """
            old_target = sys.stdout
            sys.stdout = new_target
            try:
                yield new_target
            finally:
                sys.stdout = old_target

        target_stdout = io.StringIO()
        with _redirect_stdout(target_stdout):
            common.print_each_string_after_two_new_lines([
                'These', 'are', 'sample', 'strings.'])

        self.assertEqual(
            target_stdout.getvalue(), 'These\n\nare\n\nsample\n\nstrings.\n\n')

    def test_install_npm_library(self) -> None:
        def _mock_subprocess_check_call(unused_command: str) -> None:
            """Mocks subprocess.check_call() to create a temporary file instead
            of the actual npm library.
            """
            temp_file = tempfile.NamedTemporaryFile()
            # Here MyPy assumes that the 'name' attribute is read-only.
            # In order to silence the MyPy complaints `setattr` is used to set
            # the attribute.
            setattr(temp_file, 'name', 'temp_file')
            with utils.open_file('temp_file', 'w') as f:
                f.write('content')

            self.assertTrue(os.path.exists('temp_file'))
            temp_file.close()
            if os.path.isfile('temp_file'):
                # Occasionally this temp file is not deleted.
                os.remove('temp_file')

        self.assertFalse(os.path.exists('temp_file'))

        with self.swap(subprocess, 'check_call', _mock_subprocess_check_call):
            common.install_npm_library('library_name', 'version', 'path')

        self.assertFalse(os.path.exists('temp_file'))

    def test_install_npm_library_path_exists(self) -> None:
        """Install an npm library that already exists."""
        def mock_exists(unused_file: str) -> bool:
            return True

        with self.swap(os.path, 'exists', mock_exists):
            common.install_npm_library(
                'moment', '2.29.4', common.OPPIA_TOOLS_DIR)

    def test_ask_user_to_confirm(self) -> None:
        def mock_input() -> str:
            return 'Y'
        with self.swap(builtins, 'input', mock_input):
            common.ask_user_to_confirm('Testing')

    def test_ask_user_to_confirm_n_then_y(self) -> None:
        check_function_calls = {
            'input_gets_called': 0,
        }

        def mock_input() -> str:
            check_function_calls['input_gets_called'] += 1
            if check_function_calls['input_gets_called'] == 1:
                return 'N'
            return 'Y'
        with self.swap(builtins, 'input', mock_input):
            common.ask_user_to_confirm('Testing')

    def test_get_personal_access_token_with_valid_token(self) -> None:
        def mock_getpass(prompt: str) -> str:  # pylint: disable=unused-argument
            return 'token'
        with self.swap(getpass, 'getpass', mock_getpass):
            self.assertEqual(common.get_personal_access_token(), 'token')

    def test_get_personal_access_token_with_token_as_none(self) -> None:
        def mock_getpass(prompt: str) -> None:  # pylint: disable=unused-argument
            return None
        getpass_swap = self.swap(getpass, 'getpass', mock_getpass)
        with getpass_swap, self.assertRaisesRegex(
            Exception,
            'No personal access token provided, please set up a personal '
            'access token at https://github.com/settings/tokens and re-run '
            'the script'):
            common.get_personal_access_token()

    def test_inplace_replace_file(self) -> None:
        origin_filepath = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json')

        backup_filepath = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json.bak')
        shutil.copyfile(origin_filepath, backup_filepath)

        expected_lines = [
            '{\n',
            '    "RANDMON1" : "randomValue1",\n',
            '    "312RANDOM" : "ValueRanDom2",\n',
            '    "DEV_MODE": true,\n',
            '    "RAN213DOM" : "raNdoVaLue3"\n',
            '}\n'
        ]

        common.inplace_replace_file(
            origin_filepath,
            '"DEV_MODE": .*',
            '"DEV_MODE": true,',
            expected_number_of_replacements=1
        )

        with utils.open_file(origin_filepath, 'r') as f:
            self.assertEqual(expected_lines, f.readlines())
        # Revert the file.
        shutil.move(backup_filepath, origin_filepath)

    def test_inplace_replace_file_with_expected_number_of_replacements_raises(
        self
    ) -> None:
        origin_filepath = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json')
        new_filepath = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json.new')

        backup_filepath = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json.bak')
        shutil.copyfile(origin_filepath, backup_filepath)

        with utils.open_file(origin_filepath, 'r') as f:
            origin_content = f.readlines()

        with self.assertRaisesRegex(
            ValueError, 'Wrong number of replacements. Expected 1. Performed 0.'
        ):
            common.inplace_replace_file(
                origin_filepath,
                '"DEV_MODEa": .*',
                '"DEV_MODE": true,',
                expected_number_of_replacements=1
            )
        self.assertFalse(os.path.isfile(new_filepath))
        with utils.open_file(origin_filepath, 'r') as f:
            new_content = f.readlines()
        self.assertEqual(origin_content, new_content)
        # Revert the file.
        shutil.move(backup_filepath, origin_filepath)

    def test_inplace_replace_file_with_exception_raised(self) -> None:
        origin_filepath = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json')
        new_filepath = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json.new')

        backup_filepath = os.path.join(
            'core', 'tests', 'data', 'inplace_replace_test.json.bak')
        shutil.copyfile(origin_filepath, backup_filepath)

        with utils.open_file(origin_filepath, 'r') as f:
            origin_content = f.readlines()

        def mock_compile(unused_arg: str) -> NoReturn:
            raise ValueError('Exception raised from compile()')

        compile_swap = self.swap_with_checks(re, 'compile', mock_compile)
        with self.assertRaisesRegex(
            ValueError,
            re.escape('Exception raised from compile()')
        ), compile_swap:
            common.inplace_replace_file(
                origin_filepath, '"DEV_MODE": .*', '"DEV_MODE": true,')
        self.assertFalse(os.path.isfile(new_filepath))
        with utils.open_file(origin_filepath, 'r') as f:
            new_content = f.readlines()
        self.assertEqual(origin_content, new_content)
        # Revert the file.
        shutil.move(backup_filepath, origin_filepath)

    def test_convert_to_posixpath_on_windows(self) -> None:
        def mock_is_windows() -> Literal[True]:
            return True

        is_windows_swap = self.swap(common, 'is_windows_os', mock_is_windows)
        original_filepath = 'c:\\path\\to\\a\\file.js'
        with is_windows_swap:
            actual_file_path = common.convert_to_posixpath(original_filepath)
        self.assertEqual(actual_file_path, 'c:/path/to/a/file.js')

    def test_convert_to_posixpath_on_platform_other_than_windows(self) -> None:
        def mock_is_windows() -> Literal[False]:
            return False

        is_windows_swap = self.swap(common, 'is_windows_os', mock_is_windows)
        original_filepath = 'c:\\path\\to\\a\\file.js'
        with is_windows_swap:
            actual_file_path = common.convert_to_posixpath(original_filepath)
        self.assertEqual(actual_file_path, original_filepath)

    def test_create_readme(self) -> None:
        try:
            os.makedirs('readme_test_dir')
            common.create_readme('readme_test_dir', 'Testing readme.')
            with utils.open_file('readme_test_dir/README.md', 'r') as f:
                self.assertEqual(f.read(), 'Testing readme.')
        finally:
            if os.path.exists('readme_test_dir'):
                shutil.rmtree('readme_test_dir')

    def test_cd(self) -> None:
        def mock_chdir(unused_path: str) -> None:
            pass
        def mock_getcwd() -> str:
            return '/old/path'

        chdir_swap = self.swap_with_checks(
            os, 'chdir', mock_chdir, expected_args=[
                ('/new/path',),
                ('/old/path',),
            ])
        getcwd_swap = self.swap(os, 'getcwd', mock_getcwd)

        with chdir_swap, getcwd_swap:
            with common.CD('/new/path'):
                pass

    def test_swap_env_when_var_had_a_value(self) -> None:
        os.environ['ABC'] = 'Hard as Rocket Science'
        with common.swap_env('ABC', 'Easy as 123') as old_value:
            self.assertEqual(old_value, 'Hard as Rocket Science')
            self.assertEqual(os.environ['ABC'], 'Easy as 123')
        self.assertEqual(os.environ['ABC'], 'Hard as Rocket Science')

    def test_swap_env_when_var_did_not_exist(self) -> None:
        self.assertNotIn('DEF', os.environ)
        with common.swap_env('DEF', 'Easy as 123') as old_value:
            self.assertIsNone(old_value)
            self.assertEqual(os.environ['DEF'], 'Easy as 123')
        self.assertNotIn('DEF', os.environ)

    def test_write_stdout_safe_with_repeat_oserror_repeats_call_to_write(
        self
    ) -> None:
        raised_once = False

        def write_raise_oserror(
            unused_fileno: int, bytes_to_write: bytes
        ) -> int:
            self.assertEqual(bytes_to_write, 'test'.encode('utf-8'))

            nonlocal raised_once
            if not raised_once:
                raised_once = True
                raise OSError(errno.EAGAIN, 'OS error that should be repeated')

            return 4

        write_swap = self.swap_with_checks(
            os,
            'write',
            write_raise_oserror,
            expected_args=(
                (sys.stdout.fileno(), b'test'),
                (sys.stdout.fileno(), b'test')
            )
        )
        with write_swap:
            # This test makes sure that when write fails (with errno.EAGAIN)
            # the call is repeated.
            common.write_stdout_safe('test')

        self.assertTrue(raised_once)

    def test_write_stdout_safe_with_oserror(self) -> None:
        write_swap = self.swap_to_always_raise(os, 'write', OSError('OS error'))
        with write_swap, self.assertRaisesRegex(OSError, 'OS error'):
            common.write_stdout_safe('test')

    def test_write_stdout_safe_with_unsupportedoperation(self) -> None:
        mock_stdout = io.StringIO()

        write_swap = self.swap_to_always_raise(
            os, 'write',
            io.UnsupportedOperation('unsupported operation'))
        stdout_write_swap = self.swap(sys, 'stdout', mock_stdout)

        with write_swap, stdout_write_swap:
            common.write_stdout_safe('test')
        self.assertEqual(mock_stdout.getvalue(), 'test')

    def _assert_ssl_context_matches_default(
        self, context: ssl.SSLContext
    ) -> None:
        """Assert that an SSL context matches the default one.

        If we create two default SSL contexts, they will evaluate as unequal
        even though they are the same for our purposes. Therefore, this function
        checks that the provided context has the same important security
        properties as the default.

        Args:
            context: SSLContext. The context to compare.

        Raises:
            AssertionError. Raised if the contexts differ in any of their
                important attributes or behaviors.
        """
        default_context = ssl.create_default_context()
        for attribute in (
            'verify_flags', 'verify_mode', 'protocol',
            'hostname_checks_common_name', 'options', 'minimum_version',
            'maximum_version', 'check_hostname'
        ):
            self.assertEqual(
                getattr(context, attribute),
                getattr(default_context, attribute)
            )
        for method in ('get_ca_certs', 'get_ciphers'):
            self.assertEqual(
                getattr(context, method)(),
                getattr(default_context, method)()
            )

    def test_url_retrieve_with_successful_https_works(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            output_path = os.path.join(tempdir, 'buffer')
            attempts = []
            def mock_urlopen(
                url: str, context: ssl.SSLContext
            ) -> io.BufferedIOBase:
                attempts.append(url)
                self.assertLessEqual(len(attempts), 1)
                self.assertEqual(url, 'https://example.com')
                self._assert_ssl_context_matches_default(context)
                return io.BytesIO(b'content')

            urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

            with urlopen_swap:
                common.url_retrieve('https://example.com', output_path)
            with open(output_path, 'rb') as buffer:
                self.assertEqual(buffer.read(), b'content')

    def test_url_retrieve_with_successful_https_works_on_retry(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            output_path = os.path.join(tempdir, 'output')
            attempts = []
            def mock_urlopen(
                url: str, context: ssl.SSLContext
            ) -> io.BufferedIOBase:
                attempts.append(url)
                self.assertLessEqual(len(attempts), 2)
                self.assertEqual(url, 'https://example.com')
                self._assert_ssl_context_matches_default(context)
                if len(attempts) == 1:
                    raise ssl.SSLError()
                return io.BytesIO(b'content')

            urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

            with urlopen_swap:
                common.url_retrieve('https://example.com', output_path)
            with open(output_path, 'rb') as buffer:
                self.assertEqual(buffer.read(), b'content')

    def test_url_retrieve_runs_out_of_attempts(self) -> None:
        attempts = []
        def mock_open(_path: str, _options: str) -> NoReturn:
            raise AssertionError('open() should not be called')
        def mock_urlopen(
            url: str, context: ssl.SSLContext
        ) -> io.BufferedIOBase:
            attempts.append(url)
            self.assertLessEqual(len(attempts), 2)
            self.assertEqual(url, 'https://example.com')
            self._assert_ssl_context_matches_default(context)
            raise ssl.SSLError('test_error')

        open_swap = self.swap(builtins, 'open', mock_open)
        urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

        with open_swap, urlopen_swap:
            with self.assertRaisesRegex(ssl.SSLError, 'test_error'):
                common.url_retrieve('https://example.com', 'test_path')

    def test_url_retrieve_https_check_fails(self) -> None:
        def mock_open(_path: str, _options: str) -> NoReturn:
            raise AssertionError('open() should not be called')
        def mock_urlopen(url: str, context: ssl.SSLContext) -> NoReturn:  # pylint: disable=unused-argument
            raise AssertionError('urlopen() should not be called')

        open_swap = self.swap(builtins, 'open', mock_open)
        urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

        with open_swap, urlopen_swap:
            with self.assertRaisesRegex(
                Exception, 'The URL http://example.com should use HTTPS.'
            ):
                common.url_retrieve('http://example.com', 'test_path')

    def test_url_retrieve_with_successful_http_works(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            output_path = os.path.join(tempdir, 'output')
            attempts = []
            def mock_urlopen(
                url: str, context: ssl.SSLContext
            ) -> io.BufferedIOBase:
                attempts.append(url)
                self.assertLessEqual(len(attempts), 1)
                self.assertEqual(url, 'https://example.com')
                self._assert_ssl_context_matches_default(context)
                return io.BytesIO(b'content')

            urlopen_swap = self.swap(urlrequest, 'urlopen', mock_urlopen)

            with urlopen_swap:
                common.url_retrieve(
                    'https://example.com', output_path, enforce_https=False)
            with open(output_path, 'rb') as buffer:
                self.assertEqual(buffer.read(), b'content')

    def test_chrome_bin_setup_with_google_chrome(self) -> None:
        isfile_swap = self.swap(
            os.path, 'isfile', lambda path: path == '/usr/bin/google-chrome'
        )
        with isfile_swap:
            common.setup_chrome_bin_env_variable()
        self.assertEqual(os.environ['CHROME_BIN'], '/usr/bin/google-chrome')

    def test_chrome_bin_setup_with_wsl_chrome_browser(self) -> None:
        isfile_swap = self.swap(
            os.path,
            'isfile',
            lambda path: path == (
                '/mnt/c/Program Files (x86)/Google/'
                'Chrome/Application/chrome.exe'
            )
        )
        with isfile_swap:
            common.setup_chrome_bin_env_variable()
        self.assertEqual(
            os.environ['CHROME_BIN'],
            '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe'
        )

    def test_chrome_bin_setup_with_error(self) -> None:
        print_arr = []

        def mock_print(msg: str) -> None:
            print_arr.append(msg)

        isfile_swap = self.swap(os.path, 'isfile', lambda _: False)
        print_swap = self.swap(builtins, 'print', mock_print)

        with print_swap, isfile_swap, self.assertRaisesRegex(
            Exception, 'Chrome not found.'
        ):
            common.setup_chrome_bin_env_variable()
        self.assertIn('Chrome is not found, stopping...', print_arr)

    def test_modify_constants_under_docker_env(self) -> None:
        mock_constants_path = 'mock_app_dev.yaml'
        mock_feconf_path = 'mock_app.yaml'
        constants_path_swap = self.swap(
            common, 'CONSTANTS_FILE_PATH', mock_constants_path)
        feconf_path_swap = self.swap(common, 'FECONF_PATH', mock_feconf_path)

        with self.swap(feconf, 'OPPIA_IS_DOCKERIZED', True):
            def mock_check_output(
                unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
            ) -> str:
                return 'test'
            check_output_swap = self.swap(
                subprocess, 'check_output', mock_check_output
            )

            constants_temp_file = tempfile.NamedTemporaryFile()
            # Here MyPy assumes that the 'name' attribute is
            # read-only. In order to silence the MyPy complaints
            # `setattr` is used to set the attribute.
            setattr(
                constants_temp_file, 'name', mock_constants_path)
            with utils.open_file(mock_constants_path, 'w') as tmp:
                tmp.write('export = {\n')
                tmp.write('  "DEV_MODE": true,\n')
                tmp.write('  "EMULATOR_MODE": false,\n')
                tmp.write('};')

            feconf_temp_file = tempfile.NamedTemporaryFile()
            # Here MyPy assumes that the 'name' attribute is
            # read-only. In order to silence the MyPy complaints
            # `setattr` is used to set the attribute.
            setattr(feconf_temp_file, 'name', mock_feconf_path)
            with utils.open_file(mock_feconf_path, 'w') as tmp:
                tmp.write(u'ENABLE_MAINTENANCE_MODE = False')

            with constants_path_swap, feconf_path_swap, check_output_swap:
                common.modify_constants(prod_env=True, maintenance_mode=False)
                with utils.open_file(
                    mock_constants_path, 'r') as constants_file:
                    self.assertEqual(
                        constants_file.read(),
                        'export = {\n'
                        '  "DEV_MODE": false,\n'
                        '  "EMULATOR_MODE": true,\n'
                        '};')
                with utils.open_file(mock_feconf_path, 'r') as feconf_file:
                    self.assertEqual(
                        feconf_file.read(), 'ENABLE_MAINTENANCE_MODE = False')

                common.modify_constants(prod_env=False, maintenance_mode=True)
                with utils.open_file(
                    mock_constants_path, 'r') as constants_file:
                    self.assertEqual(
                        constants_file.read(),
                        'export = {\n'
                        '  "DEV_MODE": true,\n'
                        '  "EMULATOR_MODE": true,\n'
                        '};')
                with utils.open_file(mock_feconf_path, 'r') as feconf_file:
                    self.assertEqual(
                        feconf_file.read(), 'ENABLE_MAINTENANCE_MODE = True')

            constants_temp_file.close()
            feconf_temp_file.close()

        # Clean up spare files.
        os.remove(mock_constants_path)
        os.remove(mock_feconf_path)

    def test_modify_constants(self) -> None:
        mock_constants_path = 'mock_app_dev.yaml'
        mock_feconf_path = 'mock_app.yaml'
        constants_path_swap = self.swap(
            common, 'CONSTANTS_FILE_PATH', mock_constants_path)
        feconf_path_swap = self.swap(common, 'FECONF_PATH', mock_feconf_path)

        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'test'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output
        )

        constants_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(
            constants_temp_file, 'name', mock_constants_path)
        with utils.open_file(mock_constants_path, 'w') as tmp:
            tmp.write('export = {\n')
            tmp.write('  "DEV_MODE": true,\n')
            tmp.write('  "EMULATOR_MODE": false,\n')
            tmp.write('  "BRANCH_NAME": "",\n')
            tmp.write('  "SHORT_COMMIT_HASH": ""\n')
            tmp.write('};')

        feconf_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(feconf_temp_file, 'name', mock_feconf_path)
        with utils.open_file(mock_feconf_path, 'w') as tmp:
            tmp.write(u'ENABLE_MAINTENANCE_MODE = False')

        with constants_path_swap, feconf_path_swap, check_output_swap:
            common.modify_constants(prod_env=True, maintenance_mode=False)
            with utils.open_file(
                mock_constants_path, 'r') as constants_file:
                self.assertEqual(
                    constants_file.read(),
                    'export = {\n'
                    '  "DEV_MODE": false,\n'
                    '  "EMULATOR_MODE": true,\n'
                    '  "BRANCH_NAME": "test",\n'
                    '  "SHORT_COMMIT_HASH": "test"\n'
                    '};')
            with utils.open_file(mock_feconf_path, 'r') as feconf_file:
                self.assertEqual(
                    feconf_file.read(), 'ENABLE_MAINTENANCE_MODE = False')

            common.modify_constants(prod_env=False, maintenance_mode=True)
            with utils.open_file(
                mock_constants_path, 'r') as constants_file:
                self.assertEqual(
                    constants_file.read(),
                    'export = {\n'
                    '  "DEV_MODE": true,\n'
                    '  "EMULATOR_MODE": true,\n'
                    '  "BRANCH_NAME": "test",\n'
                    '  "SHORT_COMMIT_HASH": "test"\n'
                    '};')
            with utils.open_file(mock_feconf_path, 'r') as feconf_file:
                self.assertEqual(
                    feconf_file.read(), 'ENABLE_MAINTENANCE_MODE = True')

        constants_temp_file.close()
        feconf_temp_file.close()

        # Clean up spare files.
        os.remove(mock_constants_path)
        os.remove(mock_feconf_path)

    def test_set_constants_to_default(self) -> None:
        mock_constants_path = 'mock_app_dev.yaml'
        mock_feconf_path = 'mock_app.yaml'
        constants_path_swap = self.swap(
            common, 'CONSTANTS_FILE_PATH', mock_constants_path)
        feconf_path_swap = self.swap(common, 'FECONF_PATH', mock_feconf_path)

        constants_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(
            constants_temp_file, 'name', mock_constants_path)
        with utils.open_file(mock_constants_path, 'w') as tmp:
            tmp.write('export = {\n')
            tmp.write('  "DEV_MODE": false,\n')
            tmp.write('  "EMULATOR_MODE": false,\n')
            tmp.write('  "BRANCH_NAME": "test",\n')
            tmp.write('  "SHORT_COMMIT_HASH": "test"\n')
            tmp.write('};')

        feconf_temp_file = tempfile.NamedTemporaryFile()
        # Here MyPy assumes that the 'name' attribute is read-only. In order to
        # silence the MyPy complaints `setattr` is used to set the attribute.
        setattr(feconf_temp_file, 'name', mock_feconf_path)
        with utils.open_file(mock_feconf_path, 'w') as tmp:
            tmp.write(u'ENABLE_MAINTENANCE_MODE = True')
        self.contextManager.__exit__(None, None, None)
        with constants_path_swap, feconf_path_swap:
            common.set_constants_to_default()
            with utils.open_file(
                mock_constants_path, 'r') as constants_file:
                self.assertEqual(
                    constants_file.read(),
                    'export = {\n'
                    '  "DEV_MODE": true,\n'
                    '  "EMULATOR_MODE": true,\n'
                    '  "BRANCH_NAME": "",\n'
                    '  "SHORT_COMMIT_HASH": ""\n'
                    '};')
            with utils.open_file(mock_feconf_path, 'r') as feconf_file:
                self.assertEqual(
                    feconf_file.read(), 'ENABLE_MAINTENANCE_MODE = False')
        constants_temp_file.close()
        feconf_temp_file.close()

        # Clean up spare files.
        os.remove(mock_constants_path)
        os.remove(mock_feconf_path)

    def test_is_oppia_server_already_running_when_ports_closed(self) -> None:
        with contextlib.ExitStack() as stack:
            stack.enter_context(self.swap_to_always_return(
                common, 'is_port_in_use', value=False))

            self.assertFalse(common.is_oppia_server_already_running())

    def test_is_oppia_server_already_running_when_a_port_is_open(
        self
    ) -> None:
        with contextlib.ExitStack() as stack:
            stack.enter_context(self.swap_with_checks(
                common, 'is_port_in_use',
                lambda port: port == common.GAE_PORT_FOR_E2E_TESTING))

            self.assertTrue(common.is_oppia_server_already_running())
