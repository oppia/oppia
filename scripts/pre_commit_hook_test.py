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

"""Unit tests for scripts/pre_commit_hook.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import shutil
import subprocess

from core.tests import test_utils

import python_utils

from . import pre_commit_hook


class PreCommitHookTests(test_utils.GenericTestBase):
    """Test the methods for pre commit hook script."""

    def setUp(self):
        super(PreCommitHookTests, self).setUp()
        self.print_arr = []
        def mock_print(msg):
            self.print_arr.append(msg)

        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

    def test_install_hook_with_existing_symlink(self):
        def mock_islink(unused_file):
            return True
        def mock_exists(unused_file):
            return True
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('Output', None)

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        subprocess_swap = self.swap(
            pre_commit_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with islink_swap, exists_swap, subprocess_swap, self.print_swap:
            pre_commit_hook.install_hook()
        self.assertTrue('Symlink already exists' in self.print_arr)
        self.assertTrue(
            'pre-commit hook file is now executable!'in self.print_arr)

    def test_install_hook_with_error_in_making_pre_push_executable(self):
        def mock_islink(unused_file):
            return True
        def mock_exists(unused_file):
            return True
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('Output', 'Error')

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        subprocess_swap = self.swap(
            pre_commit_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with islink_swap, exists_swap, subprocess_swap, self.print_swap:
            with self.assertRaisesRegexp(ValueError, 'Error'):
                pre_commit_hook.install_hook()
        self.assertTrue('Symlink already exists' in self.print_arr)
        self.assertFalse(
            'pre-commit hook file is now executable!' in self.print_arr)

    def test_install_hook_with_creation_of_symlink(self):
        check_function_calls = {
            'symlink_is_called': False
        }
        def mock_islink(unused_file):
            return False
        def mock_exists(unused_file):
            return False
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('Output', None)
        def mock_symlink(unused_path, unused_file):
            check_function_calls['symlink_is_called'] = True

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        subprocess_swap = self.swap(
            pre_commit_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        symlink_swap = self.swap(os, 'symlink', mock_symlink)

        with islink_swap, exists_swap, subprocess_swap, self.print_swap, (
            symlink_swap):
            pre_commit_hook.install_hook()
        self.assertTrue(check_function_calls['symlink_is_called'])
        self.assertTrue(
            'Created symlink in .git/hooks directory' in self.print_arr)
        self.assertTrue(
            'pre-commit hook file is now executable!' in self.print_arr)

    def test_install_hook_with_error_in_creation_of_symlink(self):
        check_function_calls = {
            'symlink_is_called': False,
            'copy_is_called': False
        }
        expected_check_function_calls = {
            'symlink_is_called': True,
            'copy_is_called': True
        }
        def mock_islink(unused_file):
            return False
        def mock_exists(unused_file):
            return False
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('Output', None)
        def mock_symlink(unused_path, unused_file):
            check_function_calls['symlink_is_called'] = True
            raise OSError
        def mock_copy(unused_type, unused_file):
            check_function_calls['copy_is_called'] = True

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        subprocess_swap = self.swap(
            pre_commit_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        symlink_swap = self.swap(os, 'symlink', mock_symlink)
        copy_swap = self.swap(shutil, 'copy', mock_copy)

        with islink_swap, exists_swap, subprocess_swap, symlink_swap, copy_swap:
            with self.print_swap:
                pre_commit_hook.install_hook()
        self.assertEqual(check_function_calls, expected_check_function_calls)
        self.assertTrue('Copied file to .git/hooks directory' in self.print_arr)
        self.assertTrue(
            'pre-commit hook file is now executable!' in self.print_arr)

    def test_install_hook_with_broken_symlink(self):
        check_function_calls = {
            'unlink_is_called': False,
            'symlink_is_called': False
        }
        def mock_islink(unused_file):
            return True
        def mock_exists(unused_file):
            return False
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('Output', None)
        def mock_unlink(unused_file):
            check_function_calls['unlink_is_called'] = True
        def mock_symlink(unused_path, unused_file):
            check_function_calls['symlink_is_called'] = True

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        subprocess_swap = self.swap(
            pre_commit_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        unlink_swap = self.swap(os, 'unlink', mock_unlink)
        symlink_swap = self.swap(os, 'symlink', mock_symlink)

        with islink_swap, exists_swap, subprocess_swap, self.print_swap:
            with unlink_swap, symlink_swap:
                pre_commit_hook.install_hook()
        self.assertTrue(check_function_calls['unlink_is_called'])
        self.assertTrue(check_function_calls['symlink_is_called'])
        self.assertTrue('Removing broken symlink' in self.print_arr)
        self.assertTrue(
            'pre-commit hook file is now executable!'in self.print_arr)

    def test_start_subprocess_for_result(self):
        process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def mock_popen(  # pylint: disable=unused-argument
                unused_cmd_tokens, stdout=subprocess.PIPE,
                stderr=subprocess.PIPE):
            return process

        with self.swap(subprocess, 'Popen', mock_popen):
            self.assertEqual(
                pre_commit_hook.start_subprocess_for_result('cmd'),
                ('test\n', ''))

    def test_does_diff_include_package_lock_file_with_package_lock_in_diff(
            self):
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('package-lock.json\nfile.1py\nfile2.ts', None)

        with self.swap(
            pre_commit_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result):
            self.assertTrue(
                pre_commit_hook.does_diff_include_package_lock_file())

    def test_does_diff_include_package_lock_file_with_no_package_lock_in_diff(
            self):
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('file.1py\nfile2.ts', None)

        with self.swap(
            pre_commit_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result):
            self.assertFalse(
                pre_commit_hook.does_diff_include_package_lock_file())

    def test_does_diff_include_package_lock_file_with_error(self):
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('file.1py\nfile2.ts', 'Error')

        subprocess_swap = self.swap(
            pre_commit_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        with subprocess_swap, self.assertRaisesRegexp(ValueError, 'Error'):
            pre_commit_hook.does_diff_include_package_lock_file()

    def test_does_current_folder_contain_have_package_lock_file(self):
        def mock_isfile(unused_path):
            return True
        with self.swap(os.path, 'isfile', mock_isfile):
            self.assertTrue(
                pre_commit_hook
                .does_current_folder_contain_have_package_lock_file())

    def test_check_changes_in_config_with_no_invalid_changes(self):
        def mock_check_output(cmd_tokens):
            if pre_commit_hook.FECONF_FILEPATH in cmd_tokens:
                return (
                    '-CLASSIFIERS_DIR = os.path.join(\'.\', \'dir1\')\n'
                    '+CLASSIFIERS_DIR = os.path.join(\'.\', \'dir2\')\n')
            return (
                '-  "DASHBOARD_TYPE_CREATOR": "creator",\n'
                '+  "DASHBOARD_TYPE_CREATOR": "creator-change",\n')
        with self.swap(subprocess, 'check_output', mock_check_output):
            pre_commit_hook.check_changes_in_config()

    def test_check_changes_with_no_config_file_changed(self):
        self.assertTrue(pre_commit_hook.check_changes('filetype'))

    def test_check_changes_in_config_with_invalid_feconf_changes(self):
        def mock_check_output(cmd_tokens):
            if pre_commit_hook.FECONF_FILEPATH in cmd_tokens:
                return (
                    '-SYSTEM_EMAIL_NAME = \'sys@email.com\'\n+'
                    '+SYSTEM_EMAIL_NAME = \'sys-change@email.com\'\n')
            return (
                '-  "DASHBOARD_TYPE_CREATOR": "creator",\n'
                '+  "DASHBOARD_TYPE_CREATOR": "creator-change",\n')
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegexp(
            Exception,
            'Changes to %s made for deployment cannot be committed.' % (
                pre_commit_hook.FECONF_FILEPATH)):
            pre_commit_hook.check_changes_in_config()

    def test_check_changes_in_config_with_invalid_constants_changes(self):
        def mock_check_output(cmd_tokens):
            if pre_commit_hook.FECONF_FILEPATH in cmd_tokens:
                return (
                    '-CLASSIFIERS_DIR = os.path.join(\'.\', \'dir1\')\n'
                    '+CLASSIFIERS_DIR = os.path.join(\'.\', \'dir2\')\n')
            return (
                '-  "ANALYTICS_ID": "",\n'
                '+  "ANALYTICS_ID": "change",\n')
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap, self.assertRaisesRegexp(
            Exception,
            'Changes to %s made for deployment cannot be committed.' % (
                pre_commit_hook.CONSTANTS_FILEPATH)):
            pre_commit_hook.check_changes_in_config()

    def test_main_with_errors(self):
        check_function_calls = {
            'check_changes_in_config_is_called': False
        }
        def mock_func():
            return True
        def mock_check_changes_in_config():
            check_function_calls['check_changes_in_config_is_called'] = True
        package_lock_swap = self.swap(
            pre_commit_hook, 'does_diff_include_package_lock_file', mock_func)
        package_lock_in_current_folder_swap = self.swap(
            pre_commit_hook,
            'does_current_folder_contain_have_package_lock_file',
            mock_func)
        check_config_swap = self.swap(
            pre_commit_hook, 'check_changes_in_config',
            mock_check_changes_in_config)
        with package_lock_swap, package_lock_in_current_folder_swap:
            with check_config_swap, self.print_swap, self.assertRaisesRegexp(
                SystemExit, '1'):
                pre_commit_hook.main(args=[])
        self.assertTrue(
            '-----------COMMIT ABORTED-----------' in self.print_arr)
        self.assertTrue(
            check_function_calls['check_changes_in_config_is_called'])

    def test_main_with_install_arg(self):
        check_function_calls = {
            'install_hook_is_called': False
        }
        def mock_install_hook():
            check_function_calls['install_hook_is_called'] = True
        with self.swap(
            pre_commit_hook, 'install_hook', mock_install_hook):
            pre_commit_hook.main(args=['--install'])

    def test_main_without_install_arg_and_errors(self):
        check_function_calls = {
            'check_changes_in_config_is_called': False
        }
        def mock_func():
            return False
        def mock_check_changes_in_config():
            check_function_calls['check_changes_in_config_is_called'] = True
        package_lock_swap = self.swap(
            pre_commit_hook, 'does_diff_include_package_lock_file', mock_func)
        package_lock_in_current_folder_swap = self.swap(
            pre_commit_hook,
            'does_current_folder_contain_have_package_lock_file',
            mock_func)
        check_config_swap = self.swap(
            pre_commit_hook, 'check_changes_in_config',
            mock_check_changes_in_config)
        with package_lock_swap, package_lock_in_current_folder_swap:
            with check_config_swap:
                pre_commit_hook.main(args=[])
        self.assertTrue(
            check_function_calls['check_changes_in_config_is_called'])
