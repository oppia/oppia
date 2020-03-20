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

"""Unit tests for scripts/pre_push_hook.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import shutil
import subprocess
import sys
import tempfile

from core.tests import test_utils

import python_utils

from . import pre_push_hook


class PrePushHookTests(test_utils.GenericTestBase):
    """Test the methods for pre push hook script."""

    def setUp(self):
        super(PrePushHookTests, self).setUp()
        process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # pylint: disable=unused-argument
        def mock_popen(
                unused_cmd_tokens, stdout=subprocess.PIPE,
                stderr=subprocess.PIPE):
            return process
        # pylint: enable=unused-argument
        def mock_get_remote_name():
            return 'remote'
        def mock_get_refs():
            return ['ref1', 'ref2']
        def mock_collect_files_being_pushed(unused_refs, unused_remote):
            return {
                'branch1': (['A:file1', 'M:file2'], ['file1', 'file2']),
                'branch2': ([], [])}
        def mock_has_uncommitted_files():
            return False
        self.print_arr = []
        def mock_print(msg):
            self.print_arr.append(msg)
        def mock_check_output(unused_cmd_tokens):
            return 'Output'
        self.linter_code = 0
        def mock_start_linter(unused_files_to_lint):
            return self.linter_code
        self.does_diff_include_js_or_ts_files = False
        def mock_does_diff_include_js_or_ts_files(unused_files_to_lint):
            return self.does_diff_include_js_or_ts_files

        self.does_diff_include_travis_yml_or_js_files = False
        def mock_does_diff_include_travis_yml_or_js_files(
                unused_files_to_lint):
            return self.does_diff_include_travis_yml_or_js_files

        self.popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        self.get_remote_name_swap = self.swap(
            pre_push_hook, 'get_remote_name', mock_get_remote_name)
        self.get_refs_swap = self.swap(pre_push_hook, 'get_refs', mock_get_refs)
        self.collect_files_swap = self.swap(
            pre_push_hook, 'collect_files_being_pushed',
            mock_collect_files_being_pushed)
        self.uncommitted_files_swap = self.swap(
            pre_push_hook, 'has_uncommitted_files', mock_has_uncommitted_files)
        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)
        self.check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        self.start_linter_swap = self.swap(
            pre_push_hook, 'start_linter', mock_start_linter)
        self.js_or_ts_swap = self.swap(
            pre_push_hook, 'does_diff_include_js_or_ts_files',
            mock_does_diff_include_js_or_ts_files)
        self.travis_yml_or_js_files_swap = self.swap(
            pre_push_hook,
            'does_diff_include_travis_yml_or_js_files',
            mock_does_diff_include_travis_yml_or_js_files)

    def test_start_subprocess_for_result(self):
        with self.popen_swap:
            self.assertEqual(
                pre_push_hook.start_subprocess_for_result('cmd'),
                ('test\n', ''))

    def test_get_remote_name_without_errors(self):
        process_for_remote = subprocess.Popen(
            ['echo', 'origin\nupstream'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_upstream_url = subprocess.Popen(
            ['echo', 'url.oppia/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_origin_url = subprocess.Popen(
            ['echo', 'url.other/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        # pylint: disable=unused-argument
        def mock_popen(cmd_tokens, stdout, stderr):
            if 'remote.origin.url' in cmd_tokens:
                return process_for_origin_url
            elif 'remote.upstream.url' in cmd_tokens:
                return process_for_upstream_url
            else:
                return process_for_remote
        # pylint: enable=unused-argument
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        with popen_swap:
            self.assertEqual(pre_push_hook.get_remote_name(), 'upstream')

    def test_get_remote_name_with_error_in_obtaining_remote(self):
        def mock_communicate():
            return ('test', 'Error')
        process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        process.communicate = mock_communicate
        # pylint: disable=unused-argument
        def mock_popen(unused_cmd_tokens, stdout, stderr):
            return process
        # pylint: enable=unused-argument

        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        with popen_swap, self.assertRaisesRegexp(ValueError, 'Error'):
            pre_push_hook.get_remote_name()

    def test_get_remote_name_with_error_in_obtaining_remote_url(self):
        def mock_communicate():
            return ('test', 'Error')
        process_for_remote = subprocess.Popen(
            ['echo', 'origin\nupstream'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_remote_url = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        process_for_remote_url.communicate = mock_communicate
        # pylint: disable=unused-argument
        def mock_popen(cmd_tokens, stdout, stderr):
            if 'config' in cmd_tokens:
                return process_for_remote_url
            else:
                return process_for_remote
        # pylint: enable=unused-argument

        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        with popen_swap, self.assertRaisesRegexp(ValueError, 'Error'):
            pre_push_hook.get_remote_name()

    def test_get_remote_name_with_no_remote_set(self):
        process_for_remote = subprocess.Popen(
            ['echo', 'origin\nupstream'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_upstream_url = subprocess.Popen(
            ['echo', 'url.other/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_origin_url = subprocess.Popen(
            ['echo', 'url.other/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        # pylint: disable=unused-argument
        def mock_popen(cmd_tokens, stdout, stderr):
            if 'remote.origin.url' in cmd_tokens:
                return process_for_origin_url
            elif 'remote.upstream.url' in cmd_tokens:
                return process_for_upstream_url
            else:
                return process_for_remote
        # pylint: enable=unused-argument
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        with popen_swap, self.assertRaisesRegexp(
            Exception,
            'Error: Please set upstream for the lint checks to run '
            'efficiently. To do that follow these steps:\n'
            '1. Run the command \'git remote -v\'\n'
            '2a. If upstream is listed in the command output, then run the '
            'command \'git remote set-url upstream '
            'https://github.com/oppia/oppia.git\'\n'
            '2b. If upstream is not listed in the command output, then run the '
            'command \'git remote add upstream '
            'https://github.com/oppia/oppia.git\'\n'):
            pre_push_hook.get_remote_name()

    def test_get_remote_name_with_multiple_remotes_set(self):
        process_for_remote = subprocess.Popen(
            ['echo', 'origin\nupstream'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_upstream_url = subprocess.Popen(
            ['echo', 'url.oppia/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_origin_url = subprocess.Popen(
            ['echo', 'url.oppia/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        # pylint: disable=unused-argument
        def mock_popen(cmd_tokens, stdout, stderr):
            if 'remote.origin.url' in cmd_tokens:
                return process_for_origin_url
            elif 'remote.upstream.url' in cmd_tokens:
                return process_for_upstream_url
            else:
                return process_for_remote
        # pylint: enable=unused-argument
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        with popen_swap, self.print_swap:
            self.assertIsNone(pre_push_hook.get_remote_name())
        self.assertTrue(
            'Warning: Please keep only one remote branch for oppia:develop '
            'to run the lint checks efficiently.\n' in self.print_arr)

    def test_git_diff_name_status_without_error(self):
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('M\tfile1\nA\tfile2', None)
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with subprocess_swap:
            self.assertEqual(
                pre_push_hook.git_diff_name_status(
                    'left', 'right', diff_filter='filter'),
                [
                    pre_push_hook.FileDiff(status='M', name='file1'),
                    pre_push_hook.FileDiff(status='A', name='file2')])

    def test_git_diff_name_status_with_error(self):
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('M\tfile1\nA\tfile2', 'Error')
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with subprocess_swap, self.assertRaisesRegexp(ValueError, 'Error'):
            pre_push_hook.git_diff_name_status(
                'left', 'right', diff_filter='filter')

    def test_compare_to_remote(self):
        check_function_calls = {
            'start_subprocess_for_result_is_called': False,
            'git_diff_name_status_is_called': False
        }
        expected_check_function_calls = {
            'start_subprocess_for_result_is_called': True,
            'git_diff_name_status_is_called': True
        }
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            check_function_calls['start_subprocess_for_result_is_called'] = True
        def mock_git_diff_name_status(unused_left, unused_right):
            check_function_calls['git_diff_name_status_is_called'] = True
            return 'Test'
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        git_diff_swap = self.swap(
            pre_push_hook, 'git_diff_name_status', mock_git_diff_name_status)

        with subprocess_swap, git_diff_swap:
            self.assertEqual(
                pre_push_hook.compare_to_remote('remote', 'local branch'),
                'Test')
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_extract_files_to_lint_with_empty_file_diffs(self):
        self.assertEqual(pre_push_hook.extract_files_to_lint([]), [])

    def test_extract_files_to_lint_with_non_empty_file_diffs(self):
        self.assertEqual(
            pre_push_hook.extract_files_to_lint([
                pre_push_hook.FileDiff(status='M', name='file1'),
                pre_push_hook.FileDiff(status='A', name='file2'),
                pre_push_hook.FileDiff(status='W', name='file3')]),
            ['file1', 'file2'])

    def test_collect_files_being_pushed_with_empty_ref_list(self):
        self.assertEqual(
            pre_push_hook.collect_files_being_pushed([], 'remote'), {})

    def test_collect_files_being_pushed_with_non_empty_ref_list(self):
        # pylint: disable=unused-argument
        def mock_compare_to_remote(
                unused_remote, unused_local_branch, remote_branch=None):
            return ['A:file1', 'M:file2']
        # pylint: enable=unused-argument
        def mock_extract_files_to_lint(unused_file_diffs):
            return ['file1', 'file2']

        compare_to_remote_swap = self.swap(
            pre_push_hook, 'compare_to_remote', mock_compare_to_remote)
        extract_files_swap = self.swap(
            pre_push_hook, 'extract_files_to_lint', mock_extract_files_to_lint)

        with compare_to_remote_swap, extract_files_swap:
            self.assertEqual(
                pre_push_hook.collect_files_being_pushed([
                    pre_push_hook.GitRef(
                        local_ref='refs/heads/branch1', local_sha1='sha1',
                        remote_ref='remote/ref1', remote_sha1='rsha1'),
                    pre_push_hook.GitRef(
                        local_ref='refs/branch2', local_sha1='sha2',
                        remote_ref='remote/ref2', remote_sha1='rsha2')
                    ], 'remote'),
                {'branch1': (['A:file1', 'M:file2'], ['file1', 'file2'])})

    def test_get_refs(self):
        temp_stdin_file = tempfile.NamedTemporaryFile().name
        with python_utils.open_file(temp_stdin_file, 'w') as f:
            f.write('local_ref local_sha1 remote_ref remote_sha1')
        with python_utils.open_file(temp_stdin_file, 'r') as f:
            with self.swap(sys, 'stdin', f):
                self.assertEqual(
                    pre_push_hook.get_refs(),
                    [
                        pre_push_hook.GitRef(
                            local_ref='local_ref', local_sha1='local_sha1',
                            remote_ref='remote_ref', remote_sha1='remote_sha1'
                        )])

    def test_start_linter(self):
        with self.popen_swap:
            self.assertEqual(pre_push_hook.start_linter(['files']), 0)

    def test_start_python_script(self):
        with self.popen_swap:
            self.assertEqual(pre_push_hook.start_python_script('script'), 0)

    def test_has_uncommitted_files(self):
        def mock_check_output(unused_cmd_tokens):
            return 'file1'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap:
            self.assertTrue(pre_push_hook.has_uncommitted_files())

    def test_install_hook_with_existing_symlink(self):
        def mock_islink(unused_file):
            return True
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('Output', None)

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with islink_swap, subprocess_swap, self.print_swap:
            pre_push_hook.install_hook()
        self.assertTrue('Symlink already exists' in self.print_arr)
        self.assertTrue(
            'pre-push hook file is now executable!'in self.print_arr)

    def test_install_hook_with_error_in_making_pre_push_executable(self):
        def mock_islink(unused_file):
            return True
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('Output', 'Error')

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with islink_swap, subprocess_swap, self.print_swap:
            with self.assertRaisesRegexp(ValueError, 'Error'):
                pre_push_hook.install_hook()
        self.assertTrue('Symlink already exists' in self.print_arr)
        self.assertFalse(
            'pre-push hook file is now executable!' in self.print_arr)

    def test_install_hook_with_creation_of_symlink(self):
        check_function_calls = {
            'symlink_is_called': False
        }
        def mock_islink(unused_file):
            return False
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('Output', None)
        def mock_symlink(unused_path, unused_file):
            check_function_calls['symlink_is_called'] = True

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        symlink_swap = self.swap(os, 'symlink', mock_symlink)

        with islink_swap, subprocess_swap, symlink_swap, self.print_swap:
            pre_push_hook.install_hook()
        self.assertTrue(check_function_calls['symlink_is_called'])
        self.assertTrue(
            'Created symlink in .git/hooks directory' in self.print_arr)
        self.assertTrue(
            'pre-push hook file is now executable!' in self.print_arr)

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
        def mock_start_subprocess_for_result(unused_cmd_tokens):
            return ('Output', None)
        def mock_symlink(unused_path, unused_file):
            check_function_calls['symlink_is_called'] = True
            raise OSError
        def mock_copy(unused_type, unused_file):
            check_function_calls['copy_is_called'] = True

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        symlink_swap = self.swap(os, 'symlink', mock_symlink)
        copy_swap = self.swap(shutil, 'copy', mock_copy)

        with islink_swap, subprocess_swap, symlink_swap, copy_swap:
            with self.print_swap:
                pre_push_hook.install_hook()
        self.assertEqual(check_function_calls, expected_check_function_calls)
        self.assertTrue('Copied file to .git/hooks directory' in self.print_arr)
        self.assertTrue(
            'pre-push hook file is now executable!' in self.print_arr)

    def test_does_diff_include_js_or_ts_files_with_js_file(self):
        self.assertTrue(
            pre_push_hook.does_diff_include_js_or_ts_files(
                ['file1.js', 'file2.py']))

    def test_does_diff_include_js_or_ts_files_with_no_file(self):
        self.assertFalse(
            pre_push_hook.does_diff_include_js_or_ts_files(
                ['file1.html', 'file2.py']))

    def test_does_diff_include_travis_yml_or_js_files(self):
        self.assertTrue(
            pre_push_hook.does_diff_include_travis_yml_or_js_files(
                ['file1.js', 'protractor.conf.js', '.travis.yml']))

    def test_does_diff_include_travis_yml_or_js_files_fail(self):
        self.assertFalse(
            pre_push_hook.does_diff_include_travis_yml_or_js_files(
                ['file1.ts', 'file2.ts', 'file3.html']))

    def test_repo_in_dirty_state(self):
        def mock_has_uncommitted_files():
            return True

        uncommitted_files_swap = self.swap(
            pre_push_hook, 'has_uncommitted_files', mock_has_uncommitted_files)
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, uncommitted_files_swap:
                with self.assertRaises(SystemExit):
                    pre_push_hook.main(args=[])
        self.assertTrue(
            'Your repo is in a dirty state which prevents the linting from'
            ' working.\nStash your changes or commit them.\n' in self.print_arr)

    def test_error_while_branch_change(self):
        def mock_check_output(cmd_tokens):
            if 'symbolic-ref' in cmd_tokens:
                return 'old-branch'
            raise subprocess.CalledProcessError(1, 'cmd', output='Output')

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with check_output_swap, self.assertRaises(SystemExit):
                    pre_push_hook.main(args=[])
        self.assertTrue(
            '\nCould not change branch to branch2. This is most probably '
            'because you are in a dirty state. Change manually to the branch '
            'that is being linted or stash your changes.' in self.print_arr)

    def test_lint_failure(self):
        self.linter_code = 1
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with self.assertRaises(SystemExit):
                        pre_push_hook.main(args=[])
        self.assertTrue(
            'Push failed, please correct the linting issues above.'
            in self.print_arr)

    def test_frontend_test_failure(self):
        self.does_diff_include_js_or_ts_files = True
        def mock_start_python_script(unused_script):
            return 1
        start_python_script_swap = self.swap(
            pre_push_hook, 'start_python_script', mock_start_python_script)
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with self.js_or_ts_swap, start_python_script_swap:
                        with self.assertRaises(SystemExit):
                            pre_push_hook.main(args=[])
        self.assertTrue(
            'Push aborted due to failing frontend tests.' in self.print_arr)

    def test_invalid_travis_e2e_test_suites_failure(self):
        self.does_diff_include_travis_yml_or_js_files = True

        def mock_start_python_script(unused_script):
            return 1
        start_python_script_swap = self.swap(
            pre_push_hook, 'start_python_script', mock_start_python_script)
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with start_python_script_swap:
                        with self.travis_yml_or_js_files_swap:
                            with self.assertRaises(SystemExit):
                                pre_push_hook.main(args=[])
        self.assertTrue(
            'Push aborted due to failing e2e test configuration check.'
            in self.print_arr)

    def test_main_with_install_arg(self):
        check_function_calls = {
            'install_hook_is_called': False
        }
        def mock_install_hook():
            check_function_calls['install_hook_is_called'] = True
        with self.swap(
            pre_push_hook, 'install_hook', mock_install_hook):
            pre_push_hook.main(args=['--install'])

    def test_main_without_install_arg_and_errors(self):
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with self.js_or_ts_swap:
                        pre_push_hook.main(args=[])
