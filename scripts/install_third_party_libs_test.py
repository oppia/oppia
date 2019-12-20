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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import fileinput
import os
import shutil
import subprocess
import sys
import tempfile

from core.tests import test_utils

import python_utils

from . import common
from . import install_third_party
from . import install_third_party_libs
from . import pre_commit_hook
from . import pre_push_hook
from . import setup
from . import setup_gae

RELEASE_TEST_DIR = os.path.join('core', 'tests', 'release_sources', '')


class InstallThirdPartyLibsTests(test_utils.GenericTestBase):
    """Test the methods for installing third party libs."""

    def setUp(self):
        super(InstallThirdPartyLibsTests, self).setUp()

        self.check_function_calls = {
            'check_call_is_called': False
        }
        self.print_arr = []
        def mock_check_call(unused_cmd_tokens):
            self.check_function_calls['check_call_is_called'] = True
        # pylint: disable=unused-argument
        def mock_print(msg, end=''):
            self.print_arr.append(msg)
        # pylint: enable=unused-argument

        self.check_call_swap = self.swap(
            subprocess, 'check_call', mock_check_call)
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

    def test_tweak_yarn_executable(self):
        def mock_is_file(unused_filename):
            return True

        def mock_rename(origin_name, new_name):
            self.assertEqual(origin_name + '.sh', new_name)
            mock_rename.called = True
        mock_rename.called = False
        isfile_swap = self.swap(os.path, 'isfile', mock_is_file)
        rename_swap = self.swap(os, 'rename', mock_rename)
        with isfile_swap, rename_swap:
            install_third_party_libs.tweak_yarn_executable()
        self.assertTrue(mock_rename.called)

    def test_get_yarn_command_on_windows(self):
        os_name_swap = self.swap(common, 'OS_NAME', 'Windows')
        with os_name_swap:
            command = install_third_party_libs.get_yarn_command()
            self.assertEqual(command, 'yarn.cmd')

    def test_get_yarn_command_on_linux(self):
        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')
        with os_name_swap:
            command = install_third_party_libs.get_yarn_command()
            self.assertEqual(command, 'yarn')

    def test_get_yarn_command_on_mac(self):
        os_name_swap = self.swap(common, 'OS_NAME', 'Darwin')
        with os_name_swap:
            command = install_third_party_libs.get_yarn_command()
            self.assertEqual(command, 'yarn')

    def test_pip_install_without_import_error(self):
        with self.check_call_swap:
            install_third_party_libs.pip_install('package', 'version', 'path')
        self.assertTrue(self.check_function_calls['check_call_is_called'])

    def test_pip_install_with_import_error_and_darwin_os(self):
        os_name_swap = self.swap(common, 'OS_NAME', 'Darwin')

        import pip
        try:
            sys.modules['pip'] = None
            with os_name_swap, self.print_swap, self.check_call_swap:
                with self.assertRaises(Exception):
                    install_third_party_libs.pip_install(
                        'package', 'version', 'path')
        finally:
            sys.modules['pip'] = pip
        self.assertTrue(
            'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Mac-'
            'OS%29' in self.print_arr)
        self.assertFalse(self.check_function_calls['check_call_is_called'])

    def test_pip_install_with_import_error_and_linux_os(self):
        os_name_swap = self.swap(common, 'OS_NAME', 'Linux')

        import pip
        try:
            sys.modules['pip'] = None
            with os_name_swap, self.print_swap, self.check_call_swap:
                with self.assertRaises(Exception):
                    install_third_party_libs.pip_install(
                        'package', 'version', 'path')
        finally:
            sys.modules['pip'] = pip
        self.assertTrue(
            'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Linux'
            '%29' in self.print_arr)
        self.assertFalse(self.check_function_calls['check_call_is_called'])

    def test_pip_install_with_import_error_and_windows_os(self):
        os_name_swap = self.swap(common, 'OS_NAME', 'Windows')
        import pip
        try:
            sys.modules['pip'] = None
            with os_name_swap, self.print_swap, self.check_call_swap:
                with self.assertRaises(Exception):
                    install_third_party_libs.pip_install(
                        'package', 'version', 'path')
        finally:
            sys.modules['pip'] = pip
        self.assertTrue(
            'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28'
            'Windows%29' in self.print_arr)
        self.assertFalse(self.check_function_calls['check_call_is_called'])

    def test_install_skulpt(self):
        check_function_calls = {
            'chdir_is_called': False,
            'mkdir_is_called': False,
            'call_is_called': False,
            'copytree_is_called': False
        }
        expected_check_function_calls = {
            'chdir_is_called': True,
            'mkdir_is_called': True,
            'call_is_called': True,
            'copytree_is_called': True
        }
        expected_lines_in_print_arr = [
            'Test line 1: ret = 0',
            'Test line 2:  pass#doc()',
            'Test line 3: ret = 0 #os.system(\'{0}',
            'Test line 4: ret = 0']
        def mock_exists(unused_path):
            return False
        def mock_chdir(unused_path):
            check_function_calls['chdir_is_called'] = True
        def mock_mkdir(unused_path):
            check_function_calls['mkdir_is_called'] = True
        def mock_call(unused_cmd_tokens):
            check_function_calls['call_is_called'] = True
        def mock_copytree(unused_path1, unused_path2):
            check_function_calls['copytree_is_called'] = True
        # pylint: disable=unused-argument
        def mock_input(files, inplace):
            return [
                'Test line 1: ret = test()',
                'Test line 2:  doc()',
                'Test line 3: ret = os.system(\'{0}',
                'Test line 4: ret = rununits(opt=True)']
        # pylint: enable=unused-argument

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        chdir_swap = self.swap(os, 'chdir', mock_chdir)
        mkdir_swap = self.swap(os, 'mkdir', mock_mkdir)
        call_swap = self.swap(subprocess, 'call', mock_call)
        copytree_swap = self.swap(shutil, 'copytree', mock_copytree)
        input_swap = self.swap(fileinput, 'input', mock_input)

        with exists_swap, chdir_swap, mkdir_swap, call_swap:
            with copytree_swap, input_swap, self.print_swap:
                install_third_party_libs.install_skulpt(
                    argparse.Namespace(nojsrepl=False, noskulpt=False))
        self.assertEqual(check_function_calls, expected_check_function_calls)

        for line in expected_lines_in_print_arr:
            self.assertTrue(line in self.print_arr)

    def test_ensure_pip_library_is_installed(self):
        check_function_calls = {
            'pip_install_is_called': False
        }
        def mock_exists(unused_path):
            return False
        def mock_pip_install(unused_package, unused_version, unused_path):
            check_function_calls['pip_install_is_called'] = True

        exists_swap = self.swap(os.path, 'exists', mock_exists)
        pip_install_swap = self.swap(
            install_third_party_libs, 'pip_install', mock_pip_install)

        with exists_swap, pip_install_swap:
            install_third_party_libs.ensure_pip_library_is_installed(
                'package', 'version', 'path')
        self.assertTrue(check_function_calls['pip_install_is_called'])

    def test_function_calls(self):
        check_function_calls = {
            'ensure_pip_library_is_installed_is_called': False,
            'install_skulpt_is_called': False,
            'install_third_party_main_is_called': False,
            'setup_main_is_called': False,
            'setup_gae_main_is_called': False,
            'pre_commit_hook_main_is_called': False,
            'pre_push_hook_main_is_called': False,
            'tweak_yarn_executable_is_called': False
        }
        expected_check_function_calls = {
            'ensure_pip_library_is_installed_is_called': True,
            'install_skulpt_is_called': True,
            'install_third_party_main_is_called': True,
            'setup_main_is_called': True,
            'setup_gae_main_is_called': True,
            'pre_commit_hook_main_is_called': True,
            'pre_push_hook_main_is_called': True,
            'tweak_yarn_executable_is_called': False
        }
        def mock_ensure_pip_library_is_installed(
                unused_package, unused_version, unused_path):
            check_function_calls[
                'ensure_pip_library_is_installed_is_called'] = True
        def mock_install_skulpt(unused_parsed_args):
            check_function_calls['install_skulpt_is_called'] = True
        def mock_check_call(unused_cmd_tokens):
            pass
        # pylint: disable=unused-argument
        def mock_main_for_install_third_party(args):
            check_function_calls['install_third_party_main_is_called'] = True
        def mock_main_for_setup(args):
            check_function_calls['setup_main_is_called'] = True
        def mock_main_for_setup_gae(args):
            check_function_calls['setup_gae_main_is_called'] = True
        def mock_main_for_pre_commit_hook(args):
            check_function_calls['pre_commit_hook_main_is_called'] = True
        def mock_main_for_pre_push_hook(args):
            check_function_calls['pre_push_hook_main_is_called'] = True
        # pylint: enable=unused-argument
        def mock_tweak_yarn_executable():
            check_function_calls['tweak_yarn_executable_is_called'] = True

        ensure_pip_install_swap = self.swap(
            install_third_party_libs, 'ensure_pip_library_is_installed',
            mock_ensure_pip_library_is_installed)
        install_skulpt_swap = self.swap(
            install_third_party_libs, 'install_skulpt', mock_install_skulpt)
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

        py_actual_text = (
            'ConverterMapping,\nLine ending with '
            '"ConverterMapping",\nOther Line\n')
        py_expected_text = ('Line ending with \nOther Line\n')
        temp_py_config_file = tempfile.NamedTemporaryFile(prefix='py').name
        with python_utils.open_file(temp_py_config_file, 'w') as f:
            f.write(py_actual_text)

        pq_actual_text = (
            'ConverterMapping,\n"ConverterMapping",\nOther Line\n')
        pq_expected_text = ('Other Line\n')
        temp_pq_config_file = tempfile.NamedTemporaryFile(prefix='pq').name
        with python_utils.open_file(temp_pq_config_file, 'w') as f:
            f.write(pq_actual_text)

        py_config_swap = self.swap(
            install_third_party_libs, 'PYLINT_CONFIGPARSER_FILEPATH',
            temp_py_config_file)
        pq_config_swap = self.swap(
            install_third_party_libs, 'PQ_CONFIGPARSER_FILEPATH',
            temp_pq_config_file)

        with ensure_pip_install_swap, install_skulpt_swap, check_call_swap:
            with install_third_party_main_swap, setup_main_swap:
                with setup_gae_main_swap, pre_commit_hook_main_swap:
                    with pre_push_hook_main_swap, py_config_swap:
                        with pq_config_swap, tweak_yarn_executable_swap:
                            install_third_party_libs.main(args=[])
        self.assertEqual(check_function_calls, expected_check_function_calls)
        with python_utils.open_file(temp_py_config_file, 'r') as f:
            self.assertEqual(f.read(), py_expected_text)
        with python_utils.open_file(temp_pq_config_file, 'r') as f:
            self.assertEqual(f.read(), pq_expected_text)


    def test_function_calls_on_windows(self):
        check_function_calls = {
            'ensure_pip_library_is_installed_is_called': False,
            'install_skulpt_is_called': False,
            'install_third_party_main_is_called': False,
            'setup_main_is_called': False,
            'setup_gae_main_is_called': False,
            'pre_commit_hook_main_is_called': False,
            'pre_push_hook_main_is_called': False,
            'tweak_yarn_executable_is_called': False
        }
        expected_check_function_calls = {
            'ensure_pip_library_is_installed_is_called': True,
            'install_skulpt_is_called': True,
            'install_third_party_main_is_called': True,
            'setup_main_is_called': True,
            'setup_gae_main_is_called': True,
            'pre_commit_hook_main_is_called': True,
            'pre_push_hook_main_is_called': False,
            'tweak_yarn_executable_is_called': True
        }
        def mock_ensure_pip_library_is_installed(
                unused_package, unused_version, unused_path):
            check_function_calls[
                'ensure_pip_library_is_installed_is_called'] = True
        def mock_install_skulpt(unused_parsed_args):
            check_function_calls['install_skulpt_is_called'] = True
        def mock_check_call(unused_cmd_tokens):
            pass
        # pylint: disable=unused-argument
        def mock_main_for_install_third_party(args):
            check_function_calls['install_third_party_main_is_called'] = True
        def mock_main_for_setup(args):
            check_function_calls['setup_main_is_called'] = True
        def mock_main_for_setup_gae(args):
            check_function_calls['setup_gae_main_is_called'] = True
        def mock_main_for_pre_commit_hook(args):
            check_function_calls['pre_commit_hook_main_is_called'] = True
        def mock_main_for_pre_push_hook(args):
            check_function_calls['pre_push_hook_main_is_called'] = True
        # pylint: enable=unused-argument
        def mock_tweak_yarn_executable():
            check_function_calls['tweak_yarn_executable_is_called'] = True

        ensure_pip_install_swap = self.swap(
            install_third_party_libs, 'ensure_pip_library_is_installed',
            mock_ensure_pip_library_is_installed)
        install_skulpt_swap = self.swap(
            install_third_party_libs, 'install_skulpt', mock_install_skulpt)
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
        py_expected_text = ('Line ending with \nOther Line\n')
        temp_py_config_file = tempfile.NamedTemporaryFile(prefix='py').name
        with python_utils.open_file(temp_py_config_file, 'w') as f:
            f.write(py_actual_text)

        pq_actual_text = (
            'ConverterMapping,\n"ConverterMapping",\nOther Line\n')
        pq_expected_text = ('Other Line\n')
        temp_pq_config_file = tempfile.NamedTemporaryFile(prefix='pq').name
        with python_utils.open_file(temp_pq_config_file, 'w') as f:
            f.write(pq_actual_text)

        py_config_swap = self.swap(
            install_third_party_libs, 'PYLINT_CONFIGPARSER_FILEPATH',
            temp_py_config_file)
        pq_config_swap = self.swap(
            install_third_party_libs, 'PQ_CONFIGPARSER_FILEPATH',
            temp_pq_config_file)

        with ensure_pip_install_swap, install_skulpt_swap, check_call_swap:
            with install_third_party_main_swap, setup_main_swap:
                with setup_gae_main_swap, pre_commit_hook_main_swap:
                    with pre_push_hook_main_swap, py_config_swap:
                        with pq_config_swap, tweak_yarn_executable_swap:
                            with os_name_swap:
                                install_third_party_libs.main(args=[])
        self.assertEqual(check_function_calls, expected_check_function_calls)
        with python_utils.open_file(temp_py_config_file, 'r') as f:
            self.assertEqual(f.read(), py_expected_text)
        with python_utils.open_file(temp_pq_config_file, 'r') as f:
            self.assertEqual(f.read(), pq_expected_text)
