# coding: utf-8
#
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

"""Unit tests for scripts/setup.py."""

from __future__ import annotations

import builtins
import collections
import os
import subprocess
import sys
import tarfile

from core.tests import test_utils

from typing import Final, List

from . import clean
from . import common
from . import setup

RELEASE_TEST_DIR: Final = os.path.join('core', 'tests', 'release_sources', '')
MOCK_TMP_UNTAR_PATH: Final = os.path.join(RELEASE_TEST_DIR, 'tmp_unzip.tar.gz')
TEST_DATA_DIR: Final = os.path.join('core', 'tests', 'data', '')
MOCK_YARN_PATH: Final = os.path.join(
    TEST_DATA_DIR, 'yarn-v' + common.YARN_VERSION
)


class MockCD:
    """Mock for context manager for changing the current working directory."""

    def __init__(self, unused_new_path: str) -> None:
        pass

    def __enter__(self) -> None:
        pass

    def __exit__(
        self, unused_arg1: str, unused_arg2: str, unused_arg3: str
    ) -> None:
        pass


class SetupTests(test_utils.GenericTestBase):
    """Test the methods for setup script."""

    def setUp(self) -> None:
        super().setUp()
        self.check_function_calls = {
            'create_directory_is_called': False,
            'test_python_version_is_called': False,
            'recursive_chown_is_called': False,
            'recursive_chmod_is_called': False,
            'rename_is_called': False,
            'delete_file_is_called': False
        }
        self.urls: List[str] = []
        def mock_create_directory(unused_path: str) -> None:
            self.check_function_calls['create_directory_is_called'] = True
        def mock_test_python_version() -> None:
            self.check_function_calls['test_python_version_is_called'] = True
        def mock_download_and_install_package(
            url: str, unused_filename: str
        ) -> None:
            self.urls.append(url)
        def mock_recursive_chown(
            unused_path: str, unused_uid: str, unused_gid: str
        ) -> None:
            self.check_function_calls['recursive_chown_is_called'] = True
        def mock_recursive_chmod(unused_path: str, unused_mode: str) -> None:
            self.check_function_calls['recursive_chmod_is_called'] = True
        def mock_uname() -> List[str]:
            return ['Linux']
        def mock_rename(unused_path1: str, unused_path2: str) -> None:
            self.check_function_calls['rename_is_called'] = True
        def mock_isfile(unused_path: str) -> bool:
            return True
        def mock_delete_file(unused_path: str) -> None:
            self.check_function_calls['delete_file_is_called'] = True
        def mock_get(unused_var: str) -> None:
            return None

        self.create_swap = self.swap(
            setup, 'create_directory', mock_create_directory)
        self.test_py_swap = self.swap(
            setup, 'test_python_version', mock_test_python_version)
        self.download_swap = self.swap(
            setup, 'download_and_install_package',
            mock_download_and_install_package)
        self.exists_true_swap = self.swap_to_always_return(
            os.path, 'exists', True)
        self.exists_false_swap = self.swap_to_always_return(
            os.path, 'exists', False)
        self.is_x64_architecture_true_swap = self.swap_to_always_return(
            common, 'is_x64_architecture', True)
        self.is_x64_architecture_false_swap = self.swap_to_always_return(
            common, 'is_x64_architecture', False)
        self.chown_swap = self.swap(
            common, 'recursive_chown', mock_recursive_chown)
        self.chmod_swap = self.swap(
            common, 'recursive_chmod', mock_recursive_chmod)
        self.uname_swap = self.swap(os, 'uname', mock_uname)
        self.rename_swap = self.swap(os, 'rename', mock_rename)
        self.isfile_swap = self.swap(os.path, 'isfile', mock_isfile)
        self.delete_swap = self.swap(clean, 'delete_file', mock_delete_file)
        self.get_swap = self.swap(os.environ, 'get', mock_get)
        self.cd_swap = self.swap(common, 'CD', MockCD)
        version_info = collections.namedtuple(
            'version_info', ['major', 'minor', 'micro'])
        self.version_info_py38_swap = self.swap(
            sys, 'version_info', version_info(major=3, minor=8, micro=15)
        )
        self.python2_print_swap = self.swap_with_checks(
            builtins,
            'print',
            lambda *x: None,
            expected_args=[(
                '\033[91mThe Oppia server needs Python 2 to be installed. '
                'Please follow the instructions at https://github.com/oppia/'
                'oppia/wiki/Troubleshooting#python-2-is-not-available to fix '
                'this.\033[0m',
            )]
        )

    def test_create_directory_tree_with_missing_dir(self) -> None:
        check_function_calls = {
            'makedirs_is_called': False
        }
        def mock_makedirs(unused_path: str) -> None:
            check_function_calls['makedirs_is_called'] = True

        makedirs_swap = self.swap(os, 'makedirs', mock_makedirs)
        with makedirs_swap, self.exists_false_swap:
            setup.create_directory('dir')
        self.assertTrue(check_function_calls['makedirs_is_called'])

    def test_create_directory_tree_with_existing_dir(self) -> None:
        check_function_calls = {
            'makedirs_is_called': False
        }
        def mock_makedirs(unused_path: str) -> None:
            check_function_calls['makedirs_is_called'] = True
        makedirs_swap = self.swap(os, 'makedirs', mock_makedirs)
        with makedirs_swap, self.exists_true_swap:
            setup.create_directory('dir')
        self.assertFalse(check_function_calls['makedirs_is_called'])

    def test_python_version_testing_with_correct_version(self) -> None:
        with self.version_info_py38_swap:
            setup.test_python_version()

    def test_python_version_testing_with_incorrect_version_and_linux_os(
        self
    ) -> None:
        print_arr: List[str] = []

        def mock_print(msg_list: List[str]) -> None:
            print_arr.extend(msg_list)

        def mock_uname() -> List[str]:
            return ['Linux']

        print_swap = self.swap(
            common, 'print_each_string_after_two_new_lines', mock_print)
        uname_swap = self.swap(os, 'uname', mock_uname)
        version_info = collections.namedtuple(
            'version_info', ['major', 'minor', 'micro'])
        version_swap = self.swap(
            sys, 'version_info', version_info(major=3, minor=4, micro=12))
        with print_swap, uname_swap, version_swap, self.assertRaisesRegex(
            Exception, 'No suitable python version found.'
        ):
            setup.test_python_version()
        self.assertEqual(print_arr, [])

    def test_python_version_testing_with_incorrect_version_and_windows_os(
        self
    ) -> None:
        print_arr: List[str] = []

        def mock_print(msg_list: List[str]) -> None:
            print_arr.extend(msg_list)

        print_swap = self.swap(
            common, 'print_each_string_after_two_new_lines', mock_print)
        os_name_swap = self.swap(common, 'OS_NAME', 'Windows')
        version_info = collections.namedtuple(
            'version_info', ['major', 'minor', 'micro'])
        version_swap = self.swap(
            sys, 'version_info', version_info(major=3, minor=4, micro=12))
        with print_swap, os_name_swap, version_swap:
            with self.assertRaisesRegex(
                Exception, 'No suitable python version found.'
            ):
                setup.test_python_version()
        self.assertEqual(
            print_arr, [
                'It looks like you are using Windows. If you have Python '
                'installed,',
                'make sure it is in your PATH and that PYTHONPATH is set.',
                'If you have two versions of Python (ie, Python 2.7 and 3), '
                'specify 2.7 before other versions of Python when setting the '
                'PATH.',
                'Here are some helpful articles:',
                'http://docs.python-guide.org/en/latest/starting/install/win/',
                'https://stackoverflow.com/questions/3701646/how-to-add-to-the-'
                'pythonpath-in-windows-7'])

    def test_python_version_testing_with_python2_wrong_code(self) -> None:
        check_call_swap = self.swap_to_always_return(subprocess, 'call', 1)

        with self.python2_print_swap, self.version_info_py38_swap:
            with check_call_swap, self.assertRaisesRegex(SystemExit, '1'):
                setup.test_python_version()

    def test_download_and_install_package(self) -> None:
        check_function_calls = {
            'url_retrieve_is_called': False,
            'open_is_called': False,
            'extractall_is_called': False,
            'close_is_called': False,
            'remove_is_called': False
        }
        expected_check_function_calls = {
            'url_retrieve_is_called': True,
            'open_is_called': True,
            'extractall_is_called': True,
            'close_is_called': True,
            'remove_is_called': True
        }
        def mock_url_retrieve(unused_url: str, filename: str) -> None:  # pylint: disable=unused-argument
            check_function_calls['url_retrieve_is_called'] = True
        temp_file = tarfile.open(name=MOCK_TMP_UNTAR_PATH)
        def mock_open(name: str) -> tarfile.TarFile:  # pylint: disable=unused-argument
            check_function_calls['open_is_called'] = True
            return temp_file
        def mock_extractall(unused_self: str, path: str) -> None:  # pylint: disable=unused-argument
            check_function_calls['extractall_is_called'] = True
        def mock_close(unused_self: str) -> None:
            check_function_calls['close_is_called'] = True
        def mock_remove(unused_path: str) -> None:
            check_function_calls['remove_is_called'] = True

        url_retrieve_swap = self.swap(
            common, 'url_retrieve', mock_url_retrieve)
        open_swap = self.swap(tarfile, 'open', mock_open)
        extract_swap = self.swap(tarfile.TarFile, 'extractall', mock_extractall)
        close_swap = self.swap(tarfile.TarFile, 'close', mock_close)
        remove_swap = self.swap(os, 'remove', mock_remove)

        with url_retrieve_swap, open_swap, extract_swap, close_swap:
            with remove_swap:
                setup.download_and_install_package('url', 'filename')
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_rename_yarn_folder(self) -> None:
        # Creates a dummy yarn folder and then checks if `v` was removed
        # upon function call.
        os.mkdir(MOCK_YARN_PATH)
        setup.rename_yarn_folder('yarn-v' + common.YARN_VERSION, TEST_DATA_DIR)
        target = os.path.join(
            TEST_DATA_DIR, 'yarn-' + common.YARN_VERSION)
        self.assertTrue(os.path.exists(target))
        os.rmdir(target)

    def test_invalid_dir(self) -> None:
        def mock_getcwd() -> str:
            return 'invalid'
        print_arr: List[str] = []
        def mock_print(msg: str) -> None:
            print_arr.append(msg)

        getcwd_swap = self.swap(os, 'getcwd', mock_getcwd)
        print_swap = self.swap(builtins, 'print', mock_print)
        with self.test_py_swap, getcwd_swap, print_swap:
            with self.assertRaisesRegex(Exception, 'Invalid root directory.'):
                setup.main(args=[])
        self.assertFalse(
            'WARNING   This script should be run from the oppia/ '
            'root folder.' in print_arr)
        self.assertTrue(
            self.check_function_calls['test_python_version_is_called'])

    def test_package_install_with_darwin_x64(self) -> None:

        os_name_swap = self.swap(common, 'OS_NAME', 'Darwin')

        with self.test_py_swap, self.create_swap, os_name_swap:
            with self.download_swap, self.rename_swap, self.exists_false_swap:
                with self.chmod_swap, self.delete_swap, self.isfile_swap:
                    with self.is_x64_architecture_true_swap, self.chown_swap:
                        setup.main(args=[])

        for item in self.check_function_calls.values():
            self.assertTrue(item)
        self.assertEqual(
            self.urls, [
                'https://nodejs.org/dist/v%s/node-v%s-darwin-x64.tar.gz' % (
                    common.NODE_VERSION, common.NODE_VERSION),
                'https://github.com/yarnpkg/yarn/releases/download/'
                'v%s/yarn-v%s.tar.gz' % (
                    common.YARN_VERSION, common.YARN_VERSION)])

    def test_package_install_with_darwin_x86(self) -> None:

        os_name_swap = self.swap(common, 'OS_NAME', 'Darwin')
        all_cmd_tokens: List[str] = []
        def mock_check_call(cmd_tokens: List[str]) -> None:
            all_cmd_tokens.extend(cmd_tokens)
        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)

        with self.test_py_swap, self.create_swap, os_name_swap, self.chown_swap:
            with self.download_swap, self.rename_swap, self.exists_false_swap:
                with self.chmod_swap, self.delete_swap, self.isfile_swap:
                    with self.is_x64_architecture_false_swap, self.cd_swap:
                        with check_call_swap:
                            setup.main(args=[])
        for _, item in self.check_function_calls.items():
            self.assertTrue(item)
        self.assertEqual(
            self.urls, [
                'https://nodejs.org/dist/v%s/node-v%s.tar.gz' % (
                    common.NODE_VERSION, common.NODE_VERSION),
                'https://github.com/yarnpkg/yarn/releases/download/'
                'v%s/yarn-v%s.tar.gz' % (
                    common.YARN_VERSION, common.YARN_VERSION)])
        self.assertEqual(all_cmd_tokens, ['./configure', 'make'])

    def test_package_install_with_linux_x64(self) -> None:

        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')

        with self.test_py_swap, self.create_swap, os_name_swap, self.chown_swap:
            with self.download_swap, self.rename_swap, self.exists_false_swap:
                with self.chmod_swap, self.delete_swap, self.isfile_swap:
                    with self.is_x64_architecture_true_swap:
                        setup.main(args=[])

        for item in self.check_function_calls.values():
            self.assertTrue(item)
        self.assertEqual(
            self.urls, [
                'https://nodejs.org/dist/v%s/node-v%s' % (
                    common.NODE_VERSION, common.NODE_VERSION) +
                '-linux-x64.tar.gz',
                'https://github.com/yarnpkg/yarn/releases/download/'
                'v%s/yarn-v%s.tar.gz' % (
                    common.YARN_VERSION, common.YARN_VERSION)])

    def test_package_install_with_linux_x86(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')

        all_cmd_tokens: List[str] = []
        def mock_check_call(cmd_tokens: List[str]) -> None:
            all_cmd_tokens.extend(cmd_tokens)
        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)

        with self.test_py_swap, self.create_swap, os_name_swap, check_call_swap:
            with self.download_swap, self.rename_swap, self.cd_swap:
                with self.chmod_swap, self.delete_swap, self.isfile_swap:
                    with self.is_x64_architecture_false_swap, self.chown_swap:
                        with self.exists_false_swap:
                            setup.main(args=[])

        for item in self.check_function_calls.values():
            self.assertTrue(item)
        self.assertEqual(
            self.urls, [
                'https://nodejs.org/dist/v%s/node-v%s.tar.gz' % (
                    common.NODE_VERSION, common.NODE_VERSION),
                'https://github.com/yarnpkg/yarn/releases/download/'
                'v%s/yarn-v%s.tar.gz' % (
                    common.YARN_VERSION, common.YARN_VERSION)])
        self.assertEqual(all_cmd_tokens, ['./configure', 'make'])

    def test_package_install_with_windows_x86(self) -> None:

        def mock_url_retrieve(url: str, filename: str) -> None: # pylint: disable=unused-argument
            self.urls.append(url)

        check_call_commands: List[str] = []
        def mock_check_call(commands: List[str]) -> None:
            nonlocal check_call_commands
            check_call_commands = commands

        os_name_swap = self.swap(common, 'OS_NAME', 'Windows')
        url_retrieve_swap = self.swap(
            common, 'url_retrieve', mock_url_retrieve)
        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)

        with self.test_py_swap, self.create_swap, os_name_swap, check_call_swap:
            with self.download_swap, self.rename_swap, self.delete_swap:
                with self.isfile_swap, self.is_x64_architecture_false_swap:
                    with url_retrieve_swap, self.exists_false_swap:
                        setup.main(args=[])

        check_function_calls = self.check_function_calls.copy()
        del check_function_calls['recursive_chown_is_called']
        del check_function_calls['recursive_chmod_is_called']
        for item in check_function_calls.values():
            self.assertTrue(item)
        self.assertEqual(
            check_call_commands,
            ['powershell.exe', '-c', 'expand-archive',
             'node-download', '-DestinationPath',
             common.OPPIA_TOOLS_DIR])
        self.assertEqual(
            self.urls, [
                'https://nodejs.org/dist/v%s/node-v%s-win-x86.zip' % (
                    common.NODE_VERSION, common.NODE_VERSION),
                'https://github.com/yarnpkg/yarn/releases/download/'
                'v%s/yarn-v%s.tar.gz' % (
                    common.YARN_VERSION, common.YARN_VERSION)])

    def test_package_install_with_windows_x64(self) -> None:

        def mock_url_retrieve(url: str, filename: str) -> None: # pylint: disable=unused-argument
            self.urls.append(url)

        check_call_commands: List[str] = []
        def mock_check_call(commands: List[str]) -> None:
            nonlocal check_call_commands
            check_call_commands = commands

        os_name_swap = self.swap(common, 'OS_NAME', 'Windows')
        url_retrieve_swap = self.swap(
            common, 'url_retrieve', mock_url_retrieve)
        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)

        with self.test_py_swap, self.create_swap, os_name_swap, check_call_swap:
            with self.download_swap, self.rename_swap, self.delete_swap:
                with self.isfile_swap, self.is_x64_architecture_true_swap:
                    with url_retrieve_swap, self.exists_false_swap:
                        setup.main(args=[])
        check_function_calls = self.check_function_calls.copy()
        del check_function_calls['recursive_chown_is_called']
        del check_function_calls['recursive_chmod_is_called']
        for item in check_function_calls.values():
            self.assertTrue(item)
        self.assertEqual(
            check_call_commands,
            ['powershell.exe', '-c', 'expand-archive',
             'node-download', '-DestinationPath',
             common.OPPIA_TOOLS_DIR])
        self.assertEqual(
            self.urls, [
                'https://nodejs.org/dist/v%s/node-v%s-win-x64.zip' % (
                    common.NODE_VERSION, common.NODE_VERSION),
                'https://github.com/yarnpkg/yarn/releases/download/'
                'v%s/yarn-v%s.tar.gz' % (
                    common.YARN_VERSION, common.YARN_VERSION)])

    def test_package_install_with_incompatible_system_raises_error(
        self
    ) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Solaris')

        with self.test_py_swap, self.create_swap, os_name_swap, self.chown_swap:
            with self.rename_swap, self.exists_false_swap:
                with self.assertRaisesRegex(
                    Exception, 'System\'s Operating System is not compatible.'
                ), self.is_x64_architecture_true_swap:
                    setup.main(args=[])

    def test_if_node_is_already_installed_then_skip_installation(self) -> None:

        print_list = []
        def mock_print(arg: str) -> None:
            print_list.append(arg)

        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')
        print_swap = self.swap(builtins, 'print', mock_print)

        with self.test_py_swap, self.create_swap, self.chown_swap, print_swap:
            with self.rename_swap, self.exists_true_swap, os_name_swap:
                setup.main(args=[])

        print(print_list)
        self.assertIn('Environment setup completed.', print_list)
        self.assertNotIn('Installing Node.js', print_list)
        self.assertNotIn('Removing package-lock.json', print_list)
