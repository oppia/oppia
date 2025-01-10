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

"""Unit tests for scripts/install_third_party_libs.py."""

from __future__ import annotations

import builtins
import collections
import os
import shutil
import subprocess
import sys
import tarfile

from core import feconf
from core.tests import test_utils

from typing import Final, List, Tuple

from . import clean
from . import common
from . import install_dependencies_json_packages
from . import install_python_prod_dependencies
from . import install_third_party_libs
from . import pre_commit_hook
from . import pre_push_hook

RELEASE_TEST_DIR: Final = os.path.join('core', 'tests', 'release_sources', '')
MOCK_TMP_UNZIP_PATH: Final = os.path.join(RELEASE_TEST_DIR, 'tmp_unzip.zip')
MOCK_TMP_UNTAR_PATH: Final = os.path.join(RELEASE_TEST_DIR, 'tmp_unzip.tar.gz')
TEST_DATA_DIR: Final = os.path.join('core', 'tests', 'data', '')
MOCK_YARN_PATH: Final = os.path.join(
    TEST_DATA_DIR, 'yarn-v%s' % common.YARN_VERSION
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


class Ret:
    """Return object with required attributes."""

    def __init__(
           self, returncode: int = 0,
           communicate_val: Tuple[bytes, bytes] = (b'', b'')
        ) -> None:
        self.returncode = returncode
        self.communicate_val = communicate_val

    def communicate(self) -> Tuple[bytes, bytes]:
        """Return required method."""
        return self.communicate_val


class InstallThirdPartyLibsTests(test_utils.GenericTestBase):
    """Test the methods for installing third party libs."""

    def setUp(self) -> None:
        super().setUp()

        self.check_function_calls = {
            'check_call_is_called': False,
        }
        self.print_arr: List[str] = []

        def mock_check_call(
            unused_cmd_tokens: List[str],
            **_kwargs: str
        ) -> Ret:
            self.check_function_calls['check_call_is_called'] = True
            return Ret(0, (b'', b''))

        def mock_check_call_error(*args: str) -> None:
            """Raise the Exception resulting from a failed check_call()"""
            self.check_function_calls['check_call_is_called'] = True
            raise subprocess.CalledProcessError(-1, args[0])

        def mock_popen_error_call(
            unused_cmd_tokens: List[str],
            *_args: str,
            **_kwargs: str
        ) -> Ret:
            return Ret(1, (b'', b'can\'t combine user with prefix'))

        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)

        self.check_call_swap = self.swap(
            subprocess, 'check_call', mock_check_call)
        self.Popen_swap = self.swap(
            subprocess, 'Popen', mock_check_call)
        self.check_call_error_swap = self.swap(
            subprocess, 'check_call', mock_check_call_error)
        self.Popen_error_swap = self.swap(
            subprocess, 'Popen', mock_popen_error_call)
        self.print_swap = self.swap(builtins, 'print', mock_print)

        def mock_ensure_directory_exists(unused_path: str) -> None:
            pass

        self.dir_exists_swap = self.swap(
            common, 'ensure_directory_exists', mock_ensure_directory_exists)

    def test_install_third_party_main_under_docker(self) -> None:
        with self.swap(feconf, 'OPPIA_IS_DOCKERIZED', True):
            with self.check_call_swap:
                install_third_party_libs.main()

    def test_install_third_party_main_also_installs_hooks(self) -> None:
        check_function_calls = {
            'pre_commit_hook_main_is_called': False,
            'pre_push_hook_main_is_called': False,
        }
        expected_check_function_calls = {
            'pre_commit_hook_main_is_called': True,
            'pre_push_hook_main_is_called': True,
        }

        def mock_install_gcloud_sdk() -> None:
            pass
        def mock_install_redis_cli() -> None:
            pass
        def mock_install_elasticsearch_dev_server() -> None:
            pass
        def mock_external_script_call() -> None:
            pass
        def mock_mkdir(unused_path: str) -> None:
            pass
        def mock_copytree(unused_src: str, unused_dst: str) -> None:
            pass
        def mock_main_for_pre_commit_hook(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['pre_commit_hook_main_is_called'] = True
        def mock_main_for_pre_push_hook(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['pre_push_hook_main_is_called'] = True
        def mock_isdir(path: str) -> bool:
            correct_google_path = os.path.join(
                common.THIRD_PARTY_PYTHON_LIBS_DIR, 'google')
            directories_that_do_not_exist = {
                os.path.join(correct_google_path, 'appengine'),
                os.path.join(correct_google_path, 'pyglib'),
                correct_google_path
            }
            if path in directories_that_do_not_exist:
                return False
            return True

        swap_install_gcloud_sdk = self.swap(
            install_third_party_libs, 'install_gcloud_sdk',
            mock_install_gcloud_sdk)
        swap_install_redis_cli = self.swap(
            install_third_party_libs, 'install_redis_cli',
            mock_install_redis_cli)
        swap_install_elasticsearch_dev_server = self.swap(
            install_third_party_libs, 'install_elasticsearch_dev_server',
            mock_install_elasticsearch_dev_server)
        swap_install_python_prod_main = self.swap(
            install_python_prod_dependencies, 'main',
            mock_external_script_call)
        swap_install_json_deps_main = self.swap(
            install_dependencies_json_packages, 'main',
            mock_external_script_call)
        swap_isdir = self.swap(os.path, 'isdir', mock_isdir)
        swap_mkdir = self.swap(os, 'mkdir', mock_mkdir)
        swap_copytree = self.swap(shutil, 'copytree', mock_copytree)
        pre_commit_hook_main_swap = self.swap(
            pre_commit_hook, 'main', mock_main_for_pre_commit_hook)
        pre_push_hook_main_swap = self.swap(
            pre_push_hook, 'main', mock_main_for_pre_push_hook)

        with self.swap(feconf, 'OPPIA_IS_DOCKERIZED', False):
            with self.check_call_swap, self.Popen_swap, swap_install_redis_cli:
                with swap_install_gcloud_sdk, swap_install_python_prod_main:
                    with pre_commit_hook_main_swap, pre_push_hook_main_swap:
                        with swap_isdir, swap_mkdir, swap_copytree:
                            with swap_install_elasticsearch_dev_server:
                                with swap_install_json_deps_main:
                                    install_third_party_libs.main()

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_clean_pyc_files_removes_pyc_files(self) -> None:
        check_file_removals = {
            'root/file1.js': False,
            'root/file2.pyc': False
        }
        expected_check_file_removals = {
            'root/file1.js': False,
            'root/file2.pyc': True
        }
        def mock_walk(
            unused_path: str
        ) -> List[Tuple[str, List[str], List[str]]]:
            return [('root', ['dir1'], ['file1.js', 'file2.pyc'])]
        def mock_remove(path: str) -> None:
            check_file_removals[path] = True
        def mock_exists(unused_path: str) -> bool:
            return True

        walk_swap = self.swap(os, 'walk', mock_walk)
        remove_swap = self.swap(os, 'remove', mock_remove)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        with walk_swap, remove_swap, exists_swap:
            install_third_party_libs.clean_pyc_files()
        self.assertEqual(check_file_removals, expected_check_file_removals)


class InstallRedisAndElasticSearchTests(test_utils.GenericTestBase):
    """Test the methods for installing Redis and Elasticsearch."""

    def test_install_redis_cli_function_calls(self) -> None:
        check_function_calls = {
            'subprocess_call_is_called': False,
            'download_and_untar_files_is_called': False
        }
        expected_check_function_calls = {
            'subprocess_call_is_called': True,
            'download_and_untar_files_is_called': True
        }
        def mock_download_and_untar_files(
            unused_source_url: str,
            unused_target_parent_dir: str,
            unused_tar_root_name: str,
            unused_target_root_name: str
        ) -> None:
            check_function_calls['download_and_untar_files_is_called'] = True

        def mock_call(unused_cmd_tokens: List[str], **kwargs: str) -> Ret:  # pylint: disable=unused-argument
            check_function_calls['subprocess_call_is_called'] = True

            # The first subprocess.call() in install_redis_cli needs to throw an
            # exception so that the script can execute the installation pathway.
            if unused_cmd_tokens == [common.REDIS_SERVER_PATH, '--version']:
                raise OSError('redis-server: command not found')

            return Ret()

        swap_call = self.swap(subprocess, 'call', mock_call)
        untar_files_swap = self.swap(
            install_third_party_libs, 'download_and_untar_files',
            mock_download_and_untar_files)
        with swap_call, untar_files_swap:
            install_third_party_libs.install_redis_cli()

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_install_elasticsearch_dev_server_unix(self) -> None:
        check_function_calls = {
            'subprocess_call_is_called': False,
            'download_and_untar_files_is_called': False,
            'download_and_unzip_files_is_called': False
        }
        def mock_is_linux_os() -> bool:
            return False
        def mock_is_mac_os() -> bool:
            return True
        def mock_download_and_untar_files(
            unused_source_url: str,
            unused_target_parent_dir: str,
            unused_tar_root_name: str,
            unused_target_root_name: str
        ) -> None:
            check_function_calls['download_and_untar_files_is_called'] = True

        def mock_call(
            unused_cmd_tokens: List[str],
            *_args: str,
            **_kwargs: str
        ) -> Ret:
            check_function_calls['subprocess_call_is_called'] = True
            # The first subprocess.call() needs to throw an
            # exception so that the script can execute the installation pathway.
            if unused_cmd_tokens == [
                    '%s/bin/elasticsearch' % common.ES_PATH, '--version']:
                raise OSError('elasticsearch: command not found')

            return Ret()

        swap_call = self.swap(subprocess, 'call', mock_call)
        untar_files_swap = self.swap(
            install_third_party_libs, 'download_and_untar_files',
            mock_download_and_untar_files)

        expected_check_function_calls = {
            'subprocess_call_is_called': True,
            'download_and_untar_files_is_called': True,
            'download_and_unzip_files_is_called': False
        }

        mac_os_swap = self.swap(common, 'is_mac_os', mock_is_mac_os)
        linux_os_swap = self.swap(common, 'is_linux_os', mock_is_linux_os)
        with swap_call, untar_files_swap, mac_os_swap, linux_os_swap:
            install_third_party_libs.install_elasticsearch_dev_server()
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_install_elasticsearch_unrecognized_os(self) -> None:

        def mock_is_mac_os() -> bool:
            return False
        def mock_is_linux_os() -> bool:
            return False

        def mock_call(
            unused_cmd_tokens: List[str],
            *_args: str,
            **_kwargs: str
        ) -> Ret:
            # The first subprocess.call() needs to throw an
            # exception so that the script can execute the installation pathway.
            if unused_cmd_tokens == [
                    '%s/bin/elasticsearch' % common.ES_PATH, '--version']:
                raise OSError('elasticsearch: command not found')

            return Ret()

        swap_call = self.swap(subprocess, 'call', mock_call)
        mac_swap = self.swap(common, 'is_mac_os', mock_is_mac_os)
        linux_swap = self.swap(common, 'is_linux_os', mock_is_linux_os)
        os_not_supported_exception = self.assertRaisesRegex(
            Exception, 'Unrecognized or unsupported operating system.')
        with mac_swap, linux_swap, swap_call, (
            os_not_supported_exception):
            install_third_party_libs.install_elasticsearch_dev_server()

    def test_elasticsearch_already_installed(self) -> None:
        check_function_calls = {
            'subprocess_call_is_called': False,
            'download_and_untar_files_is_called': False,
            'download_and_unzip_files_is_called': False
        }

        def mock_call(
            unused_cmd_tokens: List[str],
            *_args: str,
            **_kwargs: str
        ) -> Ret:
            check_function_calls['subprocess_call_is_called'] = True

            return Ret()

        swap_call = self.swap(subprocess, 'call', mock_call)
        expected_check_function_calls = {
            'subprocess_call_is_called': True,
            'download_and_untar_files_is_called': False,
            'download_and_unzip_files_is_called': False
        }

        with swap_call:
            install_third_party_libs.install_elasticsearch_dev_server()
        self.assertEqual(check_function_calls, expected_check_function_calls)


class SetupTests(test_utils.GenericTestBase):
    """Test the methods for setup script."""

    def setUp(self) -> None:
        super().setUp()
        self.check_function_calls = {
            'rename_is_called': False,
        }
        self.urls: List[str] = []
        def mock_test_python_version() -> None:
            self.check_function_calls['test_python_version_is_called'] = True
        def mock_download_and_install_package(
            url: str, unused_filename: str
        ) -> None:
            self.urls.append(url)
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

        self.test_py_swap = self.swap(
            install_third_party_libs, 'test_python_version',
            mock_test_python_version)
        self.download_swap = self.swap(
            install_third_party_libs, 'download_and_install_package',
            mock_download_and_install_package)
        self.exists_true_swap = self.swap_to_always_return(
            os.path, 'exists', True)
        self.exists_false_swap = self.swap_to_always_return(
            os.path, 'exists', False)
        self.is_x64_architecture_true_swap = self.swap_to_always_return(
            common, 'is_x64_architecture', True)
        self.is_x64_architecture_false_swap = self.swap_to_always_return(
            common, 'is_x64_architecture', False)
        self.uname_swap = self.swap(os, 'uname', mock_uname)
        self.rename_swap = self.swap(os, 'rename', mock_rename)
        self.isfile_swap = self.swap(os.path, 'isfile', mock_isfile)
        self.delete_swap = self.swap(clean, 'delete_file', mock_delete_file)
        self.get_swap = self.swap(os.environ, 'get', mock_get)
        self.cd_swap = self.swap(common, 'CD', MockCD)
        version_info = collections.namedtuple(
            'version_info', ['major', 'minor', 'micro'])
        self.version_info_py39_swap = self.swap(
            sys, 'version_info', version_info(major=3, minor=9, micro=20)
        )

    def test_python_version_testing_with_correct_version(self) -> None:
        with self.version_info_py39_swap:
            install_third_party_libs.test_python_version()

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
            install_third_party_libs.test_python_version()
        self.assertEqual(print_arr, [])

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
                install_third_party_libs.download_and_install_package(
                    'url', 'filename')
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_rename_yarn_folder(self) -> None:
        # Creates a dummy yarn folder and then checks if `v` was removed
        # upon function call.
        os.mkdir(MOCK_YARN_PATH)
        install_third_party_libs.rename_yarn_folder(
            'yarn-v%s' % common.YARN_VERSION, TEST_DATA_DIR
        )
        target = os.path.join(
            TEST_DATA_DIR, 'yarn-%s' % common.YARN_VERSION)
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
            with self.assertRaisesRegex(
                    Exception,
                    'Please run this script from the oppia/ directory.'):
                install_third_party_libs.main()
        self.assertFalse(
            'WARNING   This script should be run from the oppia/ '
            'root folder.' in print_arr)

    def test_install_on_windows_os_gives_failure(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Windows')

        with os_name_swap:
            with self.assertRaisesRegex(
                    Exception,
                    'Installation of Oppia is not supported on Windows OS.'):
                install_third_party_libs.main()

    def test_package_install_with_darwin_x64(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Darwin')

        with self.test_py_swap, os_name_swap:
            with self.download_swap, self.rename_swap, self.exists_false_swap:
                with self.delete_swap, self.isfile_swap:
                    with self.is_x64_architecture_true_swap:
                        install_third_party_libs.install_node()

        for item, status in self.check_function_calls.items():
            self.assertTrue(status, msg='Failed check for %s' % item)
        self.assertEqual(
            self.urls, [
                'https://nodejs.org/dist/v%s/node-v%s-darwin-x64.tar.gz' % (
                    common.NODE_VERSION, common.NODE_VERSION)])

    def test_package_install_with_darwin_x86(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Darwin')
        all_cmd_tokens: List[str] = []
        def mock_check_call(cmd_tokens: List[str]) -> None:
            all_cmd_tokens.extend(cmd_tokens)
        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)

        with self.test_py_swap, os_name_swap:
            with self.download_swap, self.rename_swap, self.exists_false_swap:
                with self.delete_swap, self.isfile_swap:
                    with self.is_x64_architecture_false_swap, self.cd_swap:
                        with check_call_swap:
                            install_third_party_libs.install_node()
        for item, status in self.check_function_calls.items():
            self.assertTrue(status, msg='Failed check for %s' % item)
        self.assertEqual(
            self.urls, [
                'https://nodejs.org/dist/v%s/node-v%s.tar.gz' % (
                    common.NODE_VERSION, common.NODE_VERSION)])
        self.assertEqual(all_cmd_tokens, ['./configure', 'make'])

    def test_package_install_with_linux_x64(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')

        with self.test_py_swap, os_name_swap:
            with self.download_swap, self.rename_swap, self.exists_false_swap:
                with self.delete_swap, self.isfile_swap:
                    with self.is_x64_architecture_true_swap:
                        install_third_party_libs.install_node()

        for item, status in self.check_function_calls.items():
            self.assertTrue(status, msg='Failed check for %s' % item)
        self.assertEqual(
            self.urls, [
                'https://nodejs.org/dist/v%s/node-v%s-linux-x64.tar.gz' % (
                    common.NODE_VERSION, common.NODE_VERSION)])

    def test_package_install_with_linux_x86(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')

        all_cmd_tokens: List[str] = []
        def mock_check_call(cmd_tokens: List[str]) -> None:
            all_cmd_tokens.extend(cmd_tokens)
        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)

        with self.test_py_swap, os_name_swap, check_call_swap:
            with self.download_swap, self.rename_swap, self.cd_swap:
                with self.delete_swap, self.isfile_swap:
                    with self.is_x64_architecture_false_swap:
                        with self.exists_false_swap:
                            install_third_party_libs.install_node()

        for item, status in self.check_function_calls.items():
            self.assertTrue(status, msg='Failed check for %s' % item)
        self.assertEqual(
            self.urls, [
                'https://nodejs.org/dist/v%s/node-v%s.tar.gz' % (
                    common.NODE_VERSION, common.NODE_VERSION)])
        self.assertEqual(all_cmd_tokens, ['./configure', 'make'])

    def test_package_install_with_incompatible_system_raises_error(
        self
    ) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Solaris')

        with self.test_py_swap, os_name_swap:
            with self.rename_swap, self.exists_false_swap:
                with self.assertRaisesRegex(
                    Exception, 'System\'s Operating System is not compatible.'
                ), self.is_x64_architecture_true_swap:
                    install_third_party_libs.main()

    def test_if_node_is_already_installed_then_skip_installation(self) -> None:

        print_list = []
        def mock_print(arg: str) -> None:
            print_list.append(arg)

        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')
        print_swap = self.swap(builtins, 'print', mock_print)

        with self.test_py_swap, print_swap:
            with self.rename_swap, self.exists_true_swap, os_name_swap:
                install_third_party_libs.install_node()

        print(print_list)
        self.assertIn('Node is installed.', print_list)
        self.assertNotIn('Installing Node.js', print_list)
        self.assertNotIn('Removing package-lock.json', print_list)


class GoogleCloudSdkInstallationTests(test_utils.GenericTestBase):
    """Test the methods for installing the Google Cloud SDK."""

    def setUp(self) -> None:
        super().setUp()
        self.check_function_calls = {
            'remove_is_called': False,
            'makedirs_is_called': False,
            'url_retrieve_is_called': False
        }
        self.expected_check_function_calls = {
            'remove_is_called': True,
            'makedirs_is_called': True,
            'url_retrieve_is_called': True
        }
        self.raise_error = False
        def mock_remove(unused_path: str) -> None:
            self.check_function_calls['remove_is_called'] = True
        def mock_makedirs(unused_path: str, exist_ok: bool = False) -> None:  # pylint: disable=unused-argument
            self.check_function_calls['makedirs_is_called'] = True
        self.print_arr: List[str] = []
        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        def mock_url_retrieve(unused_url: str, filename: str) -> None:  # pylint: disable=unused-argument
            self.check_function_calls['url_retrieve_is_called'] = True
            if self.raise_error:
                raise Exception
        self.remove_swap = self.swap(os, 'remove', mock_remove)
        self.makedirs_swap = self.swap(os, 'makedirs', mock_makedirs)
        self.print_swap = self.swap(builtins, 'print', mock_print)
        self.url_retrieve_swap = self.swap(
            common, 'url_retrieve', mock_url_retrieve)

    def test_gcloud_install_without_errors(self) -> None:
        self.check_function_calls['open_is_called'] = False
        self.check_function_calls['extractall_is_called'] = False
        self.check_function_calls['close_is_called'] = False
        self.check_function_calls['copytree_is_called'] = False
        self.expected_check_function_calls['open_is_called'] = True
        self.expected_check_function_calls['extractall_is_called'] = True
        self.expected_check_function_calls['close_is_called'] = True
        self.expected_check_function_calls['copytree_is_called'] = True
        def mock_exists(path: str) -> bool:
            if path == common.GOOGLE_CLOUD_SDK_HOME:
                return False
            return True
        temp_file = tarfile.open(name=MOCK_TMP_UNTAR_PATH)
        def mock_open(name: str) -> tarfile.TarFile:  # pylint: disable=unused-argument
            self.check_function_calls['open_is_called'] = True
            return temp_file
        def mock_extractall(unused_self: str, path: str) -> None:  # pylint: disable=unused-argument
            self.check_function_calls['extractall_is_called'] = True
        def mock_close(unused_self: str) -> None:
            self.check_function_calls['close_is_called'] = True
        def mock_copytree(unused_src: str, unused_dst: str) -> None:  # pylint: disable=unused-argument
            self.check_function_calls['copytree_is_called'] = True
        def mock_isdir(path: str) -> bool:
            if path.endswith(('google/appengine', 'google/pyglib')):
                return False
            return True

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        open_swap = self.swap(tarfile, 'open', mock_open)
        extractall_swap = self.swap(
            tarfile.TarFile, 'extractall', mock_extractall)
        close_swap = self.swap(tarfile.TarFile, 'close', mock_close)
        copytree_swap = self.swap(shutil, 'copytree', mock_copytree)
        isdir_swap = self.swap(os.path, 'isdir', mock_isdir)

        with self.remove_swap, self.makedirs_swap, self.print_swap:
            with self.url_retrieve_swap, exists_swap, isdir_swap:
                with open_swap, extractall_swap, close_swap, copytree_swap:
                    install_third_party_libs.install_gcloud_sdk()
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
        self.assertTrue(
            'Download complete. Installing Google Cloud SDK...'
            in self.print_arr)

    def test_gcloud_install_with_errors(self) -> None:
        self.expected_check_function_calls['remove_is_called'] = False
        self.raise_error = True
        def mock_exists(path: str) -> bool:
            if path == common.GOOGLE_CLOUD_SDK_HOME:
                return False
            return True
        exists_swap = self.swap(os.path, 'exists', mock_exists)

        with self.remove_swap, self.makedirs_swap:
            with self.print_swap, self.url_retrieve_swap, exists_swap:
                with self.assertRaisesRegex(
                    Exception, 'Error downloading Google Cloud SDK.'):
                    install_third_party_libs.install_gcloud_sdk()
        self.assertEqual(
            self.check_function_calls, self.expected_check_function_calls)
        self.assertTrue(
            'Error downloading Google Cloud SDK. Exiting.'
            in self.print_arr)

    def test_directory_copying(self) -> None:
        correct_google_path = os.path.join(
            common.THIRD_PARTY_PYTHON_LIBS_DIR, 'google')
        def mock_check_call(unused_cmd_tokens: List[str]) -> None:
            pass
        def mock_isdir(path: str) -> bool:
            directories_that_do_not_exist = {
                os.path.join(correct_google_path, 'appengine'),
                os.path.join(correct_google_path, 'pyglib'),
                correct_google_path
            }
            if path in directories_that_do_not_exist:
                return False
            return True
        def mock_exists(path: str) -> bool:
            if path == common.GOOGLE_CLOUD_SDK_HOME:
                return False
            return True

        class MockProcess:
            returncode = 0
            stdout = 'No data to report.'
            stderr = 'None'
        def mock_subprocess_run(*args: str, **kwargs: str) -> MockProcess: # pylint: disable=unused-argument
            return MockProcess()

        temp_file = tarfile.open(name=MOCK_TMP_UNTAR_PATH)
        def mock_open(name: str) -> tarfile.TarFile:  # pylint: disable=unused-argument
            self.check_function_calls['open_is_called'] = True
            return temp_file
        def mock_extractall(unused_self: str, path: str) -> None:  # pylint: disable=unused-argument
            self.check_function_calls['extractall_is_called'] = True
        def mock_close(unused_self: str) -> None:
            self.check_function_calls['close_is_called'] = True
        def mock_remove(unused_self: str) -> None:
            pass
        open_swap = self.swap(tarfile, 'open', mock_open)
        extractall_swap = self.swap(
            tarfile.TarFile, 'extractall', mock_extractall)
        close_swap = self.swap(tarfile.TarFile, 'close', mock_close)

        initialized_directories = []
        def mock_mkdir(path: str, unused_mode: int = 0o777) -> None:
            initialized_directories.append(path)

        copied_src_dst_tuples = []
        def mock_copytree(src: str, dst: str) -> None:
            copied_src_dst_tuples.append((src, dst))

        correct_copied_src_dst_tuples = [(
            os.path.join(
                common.GOOGLE_APP_ENGINE_SDK_HOME, 'google', 'appengine'),
            os.path.join(correct_google_path, 'appengine')
        ), (
            os.path.join(
                common.GOOGLE_APP_ENGINE_SDK_HOME, 'google', 'pyglib'),
            os.path.join(correct_google_path, 'pyglib')
        )]

        swap_exists = self.swap(os.path, 'exists', mock_exists)
        swap_isdir = self.swap(os.path, 'isdir', mock_isdir)
        swap_mkdir = self.swap(os, 'mkdir', mock_mkdir)
        swap_copytree = self.swap(shutil, 'copytree', mock_copytree)
        swap_remove = self.swap(os, 'remove', mock_remove)
        popen_swap = self.swap(subprocess, 'Popen', mock_check_call)
        run_swap = self.swap(subprocess, 'run', mock_subprocess_run)
        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)

        with check_call_swap, popen_swap, close_swap, run_swap, swap_remove:
            with swap_isdir, swap_mkdir, swap_copytree, swap_exists:
                with self.url_retrieve_swap, open_swap, extractall_swap:
                    install_third_party_libs.install_gcloud_sdk()

        self.assertEqual(copied_src_dst_tuples, correct_copied_src_dst_tuples)
        self.assertEqual(
            initialized_directories,
            [common.GOOGLE_CLOUD_SDK_HOME, correct_google_path])
