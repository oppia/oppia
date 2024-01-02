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
import os
import shutil
import subprocess
import tempfile
import zipfile

from core import feconf
from core import utils
from core.tests import test_utils

from typing import Final, List, Tuple

from . import common
from . import install_third_party
from . import install_third_party_libs
from . import pre_commit_hook
from . import pre_push_hook
from . import setup
from . import setup_gae

RELEASE_TEST_DIR: Final = os.path.join('core', 'tests', 'release_sources', '')


class InstallThirdPartyLibsTests(test_utils.GenericTestBase):
    """Test the methods for installing third party libs."""

    def setUp(self) -> None:
        super().setUp()

        self.check_function_calls = {
            'check_call_is_called': False,
        }
        self.print_arr: List[str] = []

        class Ret:
            """Return object with required attributes."""

            def __init__(
                self,
                returncode: int,
                communicate_val: Tuple[bytes, bytes]
            ) -> None:
                self.returncode = returncode
                self.communicate_val = communicate_val

            def communicate(self) -> Tuple[bytes, bytes]:
                """Return required method."""
                return self.communicate_val

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

    def test_install_third_party_main(self) -> None:
        with self.swap(feconf, 'OPPIA_IS_DOCKERIZED', False):
            with self.check_call_swap:
                install_third_party_libs.main()

    def test_tweak_yarn_executable(self) -> None:
        check_function_calls = {
            'mock_rename': False,
        }
        def mock_is_file(unused_filename: str) -> bool:
            return True

        def mock_rename(origin_name: str, new_name: str) -> None:
            self.assertEqual(origin_name + '.sh', new_name)
            check_function_calls['mock_rename'] = True
        check_function_calls['mock_rename'] = False
        isfile_swap = self.swap(os.path, 'isfile', mock_is_file)
        rename_swap = self.swap(os, 'rename', mock_rename)
        with isfile_swap, rename_swap:
            install_third_party_libs.tweak_yarn_executable()
        self.assertTrue(check_function_calls['mock_rename'])

    def test_tweak_yarn_executable_handles_yarn_file_not_found(self) -> None:
        # If the yarn file is not found, os.rename() is not called and the
        # method simply exits.
        check_function_calls = {
            'mock_rename': False,
        }
        def mock_is_file(unused_filename: str) -> bool:
            return False

        def mock_rename(origin_name: str, new_name: str) -> None:
            self.assertEqual(origin_name + '.sh', new_name)
            check_function_calls['mock_rename'] = True
        check_function_calls['mock_rename'] = False
        isfile_swap = self.swap(os.path, 'isfile', mock_is_file)
        rename_swap = self.swap(os, 'rename', mock_rename)
        with isfile_swap, rename_swap:
            install_third_party_libs.tweak_yarn_executable()
        self.assertFalse(check_function_calls['mock_rename'])

    def test_get_yarn_command_on_windows(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Windows')
        with os_name_swap:
            command = install_third_party_libs.get_yarn_command()
            self.assertEqual(command, 'yarn.cmd')

    def test_get_yarn_command_on_linux(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')
        with os_name_swap:
            command = install_third_party_libs.get_yarn_command()
            self.assertEqual(command, 'yarn')

    def test_get_yarn_command_on_mac(self) -> None:
        os_name_swap = self.swap(common, 'OS_NAME', 'Darwin')
        with os_name_swap:
            command = install_third_party_libs.get_yarn_command()
            self.assertEqual(command, 'yarn')

    def test_buf_installation_on_linux(self) -> None:
        check_mock_function_calls = {
            'url_retrieve_is_called': False,
            'recursive_chmod_is_called': False,
            'extractall_is_called': False,
        }

        class MockZipFile(zipfile.ZipFile):
            # Here we use MyPy ignore because the signature of this method
            # doesn't match with super class's __init__() method.
            def __init__(  # pylint: disable=super-init-not-called # type: ignore[override]
                self,
                path: str,  # pylint: disable=unused-argument
                mode: str  # pylint: disable=unused-argument
            ) -> None:
                pass

            # Here we use MyPy ignore because the signature of this method
            # doesn't match with super class's extractall() method.
            def extractall(self, path: str) -> None:  # type: ignore[override] # pylint: disable=unused-argument
                check_mock_function_calls['extractall_is_called'] = True

        def mock_url_retrieve(url: str, filename: str) -> None: # pylint: disable=unused-argument
            # Check that correct platform is used bufbuild.
            if 'bufbuild' in url:
                self.assertTrue('Linux-x86_64' in url.split('/')[-1])
                check_mock_function_calls['url_retrieve_is_called'] = True
            elif 'protocolbuffers' in url:
                self.assertTrue('linux' in url.split('/')[-1])
                check_mock_function_calls['url_retrieve_is_called'] = True
            else:
                return
        def mock_recursive_chmod(unused_fname: str, mode: str) -> None: # pylint: disable=unused-argument
            self.assertEqual(mode, 0o744)
            check_mock_function_calls['recursive_chmod_is_called'] = True
        def mock_isfile(unused_fname: str) -> bool:
            return False
        def mock_remove(unused_path: str) -> None:  # pylint: disable=unused-argument
            return

        url_retrieve_swap = self.swap(
            common, 'url_retrieve', mock_url_retrieve)
        recursive_chmod_swap = self.swap(
            common, 'recursive_chmod', mock_recursive_chmod)
        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')
        isfile_swap = self.swap(os.path, 'isfile', mock_isfile)
        zipfile_swap = self.swap(zipfile, 'ZipFile', MockZipFile)
        remove_swap = self.swap(os, 'remove', mock_remove)

        with os_name_swap, url_retrieve_swap, recursive_chmod_swap:
            with self.dir_exists_swap, isfile_swap, zipfile_swap, remove_swap:
                install_third_party_libs.install_buf_and_protoc()

        self.assertTrue(
            check_mock_function_calls['url_retrieve_is_called'])
        self.assertTrue(check_mock_function_calls['extractall_is_called'])
        self.assertTrue(
            check_mock_function_calls['recursive_chmod_is_called'])

    def test_buf_installation_on_mac(self) -> None:
        check_mock_function_calls = {
            'url_retrieve_is_called': False,
            'recursive_chmod_is_called': False,
            'extractall_is_called': False
        }

        class MockZipFile(zipfile.ZipFile):
            # Here we use MyPy ignore because the signature of this method
            # doesn't match with super class's __init__() method.
            def __init__(  # pylint: disable=super-init-not-called # type: ignore[override]
                self,
                path: str,  # pylint: disable=unused-argument
                mode: str  # pylint: disable=unused-argument
            ) -> None:
                pass

            # Here we use MyPy ignore because the signature of this method
            # doesn't match with super class's extractall() method.
            def extractall(self, path: str) -> None:  # type: ignore[override] # pylint: disable=unused-argument
                check_mock_function_calls['extractall_is_called'] = True

        def mock_url_retrieve(url: str, filename: str) -> None: # pylint: disable=unused-argument
            if 'bufbuild' in url:
                self.assertTrue('Darwin-x86_64' in url.split('/')[-1])
                check_mock_function_calls['url_retrieve_is_called'] = True
            elif 'protocolbuffers' in url:
                self.assertTrue('osx' in url.split('/')[-1])
                check_mock_function_calls['url_retrieve_is_called'] = True
            else:
                return
        def mock_recursive_chmod(unused_fname: str, mode: str) -> None: # pylint: disable=unused-argument
            self.assertEqual(mode, 0o744)
            check_mock_function_calls['recursive_chmod_is_called'] = True
        def mock_isfile(unused_fname: str) -> bool:
            return False
        def mock_remove(unused_path: str) -> None:  # pylint: disable=unused-argument
            return

        url_retrieve_swap = self.swap(
            common, 'url_retrieve', mock_url_retrieve)
        recursive_chmod_swap = self.swap(
            common, 'recursive_chmod', mock_recursive_chmod)
        os_name_swap = self.swap(common, 'OS_NAME', 'Darwin')
        isfile_swap = self.swap(os.path, 'isfile', mock_isfile)
        zipfile_swap = self.swap(zipfile, 'ZipFile', MockZipFile)
        remove_swap = self.swap(os, 'remove', mock_remove)

        with os_name_swap, url_retrieve_swap, recursive_chmod_swap:
            with self.dir_exists_swap, isfile_swap, zipfile_swap, remove_swap:
                install_third_party_libs.install_buf_and_protoc()

        self.assertTrue(
            check_mock_function_calls['url_retrieve_is_called'])
        self.assertTrue(check_mock_function_calls['extractall_is_called'])
        self.assertTrue(
            check_mock_function_calls['recursive_chmod_is_called'])

    def test_buf_is_not_reinstalled(self) -> None:
        check_mock_functions_are_not_called = {
            'url_retrieve_is_not_called': True,
            'recursive_chmod_is_not_called': True,
        }

        def mock_url_retrieve(url: str, filename: str) -> None: # pylint: disable=unused-argument
            check_mock_functions_are_not_called[
                'url_retrieve_is_not_called'] = False
        def mock_recursive_chmod(unused_fname: str, mode: str) -> None: # pylint: disable=unused-argument
            check_mock_functions_are_not_called[
                'recursive_chmod_is_not_called'] = False
        def mock_exists(unused_fname: str) -> bool:
            return True

        url_retrieve_swap = self.swap(
            common, 'url_retrieve', mock_url_retrieve)
        recursive_chmod_swap = self.swap(
            common, 'recursive_chmod', mock_recursive_chmod)
        exists_swap = self.swap(os.path, 'exists', mock_exists)

        with url_retrieve_swap, recursive_chmod_swap:
            with self.dir_exists_swap, exists_swap:
                install_third_party_libs.install_buf_and_protoc()

        self.assertTrue(
            check_mock_functions_are_not_called['url_retrieve_is_not_called'])
        self.assertTrue(
            check_mock_functions_are_not_called[
                'recursive_chmod_is_not_called'])

    def test_installing_protoc_raises_exception_if_fails_to_extract(
        self
    ) -> None:
        check_mock_function_calls = {
            'url_retrieve_is_called': False,
            'recursive_chmod_is_called': False,
            'extractall_is_called': False
        }

        class MockZipFile(zipfile.ZipFile):
            # Here we use MyPy ignore because the signature of this method
            # doesn't match with super class's __init__() method.
            def __init__(  # pylint: disable=super-init-not-called # type: ignore[override]
                self,
                path: str,  # pylint: disable=unused-argument
                mode: str  # pylint: disable=unused-argument
            ) -> None:
                pass

            # Here we use MyPy ignore because the signature of this method
            # doesn't match with super class's extractall() method.
            def extractall(self, path: str) -> None:  # type: ignore[override] # pylint: disable=unused-argument
                check_mock_function_calls['extractall_is_called'] = True
                raise Exception()

        def mock_url_retrieve(url: str, filename: str) -> None: # pylint: disable=unused-argument
            check_mock_function_calls['url_retrieve_is_called'] = True

        def mock_isfile(unused_fname: str) -> bool:
            return False

        url_retrieve_swap = self.swap(
            common, 'url_retrieve', mock_url_retrieve)
        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')
        isfile_swap = self.swap(os.path, 'isfile', mock_isfile)
        zipfile_swap = self.swap(zipfile, 'ZipFile', MockZipFile)

        with os_name_swap, url_retrieve_swap:
            with self.dir_exists_swap, isfile_swap, zipfile_swap:
                with self.assertRaisesRegex(
                        Exception, 'Error installing protoc binary'):
                    install_third_party_libs.install_buf_and_protoc()

        self.assertTrue(
            check_mock_function_calls['url_retrieve_is_called'])
        self.assertTrue(check_mock_function_calls['extractall_is_called'])

    def test_proto_file_compilation(self) -> None:
        self.check_function_calls['check_call_is_called'] = False
        with self.Popen_swap:
            install_third_party_libs.compile_protobuf_files(['mock_path'])
        self.assertTrue(self.check_function_calls['check_call_is_called'])

    def test_proto_file_compilation_raises_exception_on_compile_errors(
        self
    ) -> None:
        with self.Popen_error_swap:
            with self.assertRaisesRegex(
                    Exception, 'Error compiling proto files at mock_path'):
                install_third_party_libs.compile_protobuf_files(['mock_path'])

    def test_function_calls(self) -> None:
        check_function_calls = {
            'install_third_party_main_is_called': False,
            'setup_main_is_called': False,
            'setup_gae_main_is_called': False,
            'pre_commit_hook_main_is_called': False,
            'pre_push_hook_main_is_called': False,
            'tweak_yarn_executable_is_called': False
        }
        expected_check_function_calls = {
            'install_third_party_main_is_called': True,
            'setup_main_is_called': True,
            'setup_gae_main_is_called': True,
            'pre_commit_hook_main_is_called': True,
            'pre_push_hook_main_is_called': True,
            'tweak_yarn_executable_is_called': False
        }
        def mock_check_call(unused_cmd_tokens: List[str]) -> None:
            pass
        def mock_main_for_install_third_party(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['install_third_party_main_is_called'] = True
        def mock_main_for_setup(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['setup_main_is_called'] = True
        def mock_main_for_setup_gae(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['setup_gae_main_is_called'] = True
        def mock_main_for_pre_commit_hook(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['pre_commit_hook_main_is_called'] = True
        def mock_main_for_pre_push_hook(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['pre_push_hook_main_is_called'] = True
        def mock_tweak_yarn_executable() -> None:
            check_function_calls['tweak_yarn_executable_is_called'] = True

        correct_google_path = os.path.join(
            common.THIRD_PARTY_PYTHON_LIBS_DIR, 'google')
        def mock_isdir(path: str) -> bool:
            directories_that_do_not_exist = {
                os.path.join(correct_google_path, 'appengine'),
                os.path.join(correct_google_path, 'net'),
                os.path.join(correct_google_path, 'pyglib'),
                correct_google_path
            }
            if path in directories_that_do_not_exist:
                return False
            return True
        initialized_directories = []
        def mock_mkdir(path: str) -> None:
            initialized_directories.append(path)

        copied_src_dst_tuples = []
        def mock_copytree(src: str, dst: str) -> None:
            copied_src_dst_tuples.append((src, dst))

        correct_copied_src_dst_tuples = [
            (
                os.path.join(
                    common.GOOGLE_APP_ENGINE_SDK_HOME, 'google', 'appengine'),
                os.path.join(correct_google_path, 'appengine')),
            (
                os.path.join(
                    common.GOOGLE_APP_ENGINE_SDK_HOME, 'google', 'net'),
                os.path.join(correct_google_path, 'net')),
            (
                os.path.join(
                    common.GOOGLE_APP_ENGINE_SDK_HOME, 'google', 'pyglib'),
                os.path.join(correct_google_path, 'pyglib'))
        ]

        swap_isdir = self.swap(os.path, 'isdir', mock_isdir)
        swap_mkdir = self.swap(os, 'mkdir', mock_mkdir)
        swap_copytree = self.swap(shutil, 'copytree', mock_copytree)
        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)
        install_third_party_main_swap = self.swap(
            install_third_party, 'main', mock_main_for_install_third_party)
        setup_main_swap = self.swap(setup, 'main', mock_main_for_setup)
        setup_gae_main_swap = self.swap(
            setup_gae, 'main', mock_main_for_setup_gae)
        pre_commit_hook_main_swap = self.swap(
            pre_commit_hook, 'main', mock_main_for_pre_commit_hook)
        pre_push_hook_main_swap = self.swap(
            pre_push_hook, 'main', mock_main_for_pre_push_hook)
        tweak_yarn_executable_swap = self.swap(
            install_third_party_libs, 'tweak_yarn_executable',
            mock_tweak_yarn_executable)

        with check_call_swap, self.Popen_swap:
            with install_third_party_main_swap, setup_main_swap:
                with setup_gae_main_swap, pre_commit_hook_main_swap:
                    with pre_push_hook_main_swap, tweak_yarn_executable_swap:
                        with swap_isdir, swap_mkdir, swap_copytree:
                            install_third_party_libs.main()
        self.assertEqual(check_function_calls, expected_check_function_calls)

        self.assertEqual(
            copied_src_dst_tuples, correct_copied_src_dst_tuples)

        self.assertEqual(
            initialized_directories,
            [correct_google_path])

    def test_function_calls_on_windows(self) -> None:
        check_function_calls = {
            'install_third_party_main_is_called': False,
            'setup_main_is_called': False,
            'setup_gae_main_is_called': False,
            'pre_commit_hook_main_is_called': False,
            'pre_push_hook_main_is_called': False,
            'tweak_yarn_executable_is_called': False
        }
        expected_check_function_calls = {
            'install_third_party_main_is_called': True,
            'setup_main_is_called': True,
            'setup_gae_main_is_called': True,
            'pre_commit_hook_main_is_called': True,
            'pre_push_hook_main_is_called': False,
            'tweak_yarn_executable_is_called': True
        }
        def mock_check_call(unused_cmd_tokens: List[str]) -> None:
            pass
        def mock_main_for_install_third_party(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['install_third_party_main_is_called'] = True
        def mock_main_for_setup(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['setup_main_is_called'] = True
        def mock_main_for_setup_gae(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['setup_gae_main_is_called'] = True
        def mock_main_for_pre_commit_hook(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['pre_commit_hook_main_is_called'] = True
        def mock_main_for_pre_push_hook(args: List[str]) -> None:  # pylint: disable=unused-argument
            check_function_calls['pre_push_hook_main_is_called'] = True
        def mock_tweak_yarn_executable() -> None:
            check_function_calls['tweak_yarn_executable_is_called'] = True

        check_call_swap = self.swap(subprocess, 'check_call', mock_check_call)
        install_third_party_main_swap = self.swap(
            install_third_party, 'main', mock_main_for_install_third_party)
        setup_main_swap = self.swap(setup, 'main', mock_main_for_setup)
        setup_gae_main_swap = self.swap(
            setup_gae, 'main', mock_main_for_setup_gae)
        pre_commit_hook_main_swap = self.swap(
            pre_commit_hook, 'main', mock_main_for_pre_commit_hook)
        pre_push_hook_main_swap = self.swap(
            pre_push_hook, 'main', mock_main_for_pre_push_hook)
        tweak_yarn_executable_swap = self.swap(
            install_third_party_libs, 'tweak_yarn_executable',
            mock_tweak_yarn_executable)
        os_name_swap = self.swap(common, 'OS_NAME', 'Windows')

        py_actual_text = (
            'ConverterMapping,\nLine ending with '
            '"ConverterMapping",\nOther Line\n')
        temp_py_config_file = tempfile.NamedTemporaryFile(prefix='py').name
        with utils.open_file(temp_py_config_file, 'w') as f:
            f.write(py_actual_text)

        pq_actual_text = (
            'ConverterMapping,\n"ConverterMapping",\nOther Line\n')
        temp_pq_config_file = tempfile.NamedTemporaryFile(prefix='pq').name
        with utils.open_file(temp_pq_config_file, 'w') as f:
            f.write(pq_actual_text)

        with check_call_swap, self.Popen_swap:
            with install_third_party_main_swap, setup_main_swap:
                with setup_gae_main_swap, pre_commit_hook_main_swap:
                    with pre_push_hook_main_swap, tweak_yarn_executable_swap:
                        with os_name_swap:
                            install_third_party_libs.main()
        self.assertEqual(check_function_calls, expected_check_function_calls)
