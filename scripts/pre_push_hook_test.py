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

from __future__ import annotations

import builtins
import os
import shutil
import subprocess
import sys
import tempfile

from core import utils
from core.tests import test_utils

from typing import Dict, List, Optional, Tuple

from . import common
from . import install_python_prod_dependencies
from . import pre_push_hook


class PrePushHookTests(test_utils.GenericTestBase):
    """Test the methods for pre push hook script."""

    def setUp(self) -> None:
        super().setUp()
        process = subprocess.Popen(
            ['echo', 'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def mock_popen(  # pylint: disable=unused-argument
            unused_cmd_tokens: List[str],
            stdout: int = subprocess.PIPE,
            stderr: int = subprocess.PIPE
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process
        def mock_get_remote_name() -> bytes:
            return b'remote'
        def mock_get_refs() -> List[str]:
            return ['ref1', 'ref2']
        def mock_collect_files_being_pushed(
            unused_refs: List[pre_push_hook.GitRef],
            unused_remote: str
        ) -> Dict[str, Tuple[List[bytes], List[bytes]]]:
            return {
                'branch1': ([b'A:file1', b'M:file2'], [b'file1', b'file2']),
                'branch2': ([], [])}
        def mock_has_uncommitted_files() -> bool:
            return False
        self.print_arr: List[str] = []
        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'Output'
        self.linter_code = 0
        def mock_start_linter(unused_files_to_lint: List[bytes]) -> int:
            return self.linter_code
        self.mypy_check_code = 0
        def mock_execute_mypy_checks() -> int:
            return self.mypy_check_code
        self.does_diff_include_js_or_ts_files = False
        def mock_does_diff_include_js_or_ts_files(
            unused_diff_files: List[pre_push_hook.FileDiff]
        ) -> bool:
            return self.does_diff_include_js_or_ts_files
        self.does_diff_include_ts_files = False
        def mock_does_diff_include_ts_files(
            unused_diff_files: List[pre_push_hook.FileDiff]
        ) -> bool:
            return self.does_diff_include_ts_files

        self.does_diff_include_ci_config_or_js_files = False
        def mock_does_diff_include_ci_config_or_js_files(
            unused_diff_files: List[pre_push_hook.FileDiff]
        ) -> bool:
            return self.does_diff_include_ci_config_or_js_files

        def mock_check_backend_python_library_for_inconsistencies() -> None:
            return

        self.swap_check_backend_python_libs = self.swap(
            pre_push_hook,
            'check_for_backend_python_library_inconsistencies',
            mock_check_backend_python_library_for_inconsistencies)
        self.popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        self.get_remote_name_swap = self.swap(
            pre_push_hook, 'get_remote_name', mock_get_remote_name)
        self.get_refs_swap = self.swap(pre_push_hook, 'get_refs', mock_get_refs)
        self.collect_files_swap = self.swap(
            pre_push_hook, 'collect_files_being_pushed',
            mock_collect_files_being_pushed)
        self.uncommitted_files_swap = self.swap(
            pre_push_hook, 'has_uncommitted_files', mock_has_uncommitted_files)
        self.print_swap = self.swap(builtins, 'print', mock_print)
        self.check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        self.start_linter_swap = self.swap(
            pre_push_hook, 'start_linter', mock_start_linter)
        self.execute_mypy_checks_swap = self.swap(
            pre_push_hook, 'execute_mypy_checks', mock_execute_mypy_checks)
        self.js_or_ts_swap = self.swap(
            pre_push_hook, 'does_diff_include_js_or_ts_files',
            mock_does_diff_include_js_or_ts_files)
        self.ts_swap = self.swap(
            pre_push_hook, 'does_diff_include_ts_files',
            mock_does_diff_include_ts_files)
        self.ci_config_or_js_files_swap = self.swap(
            pre_push_hook,
            'does_diff_include_ci_config_or_js_files',
            mock_does_diff_include_ci_config_or_js_files)

    def test_start_subprocess_for_result(self) -> None:
        with self.popen_swap:
            self.assertEqual(
                pre_push_hook.start_subprocess_for_result(['cmd']),
                (b'test\n', b''))

    def test_get_remote_name_without_errors(self) -> None:
        process_for_remote = subprocess.Popen(
            [b'echo', b'origin\nupstream'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_upstream_url = subprocess.Popen(
            [b'echo', b'url.oppia/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_origin_url = subprocess.Popen(
            [b'echo', b'url.other/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        def mock_popen(
            cmd_tokens: List[bytes], stdout: int, stderr: int  # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            if b'remote.origin.url' in cmd_tokens:
                return process_for_origin_url
            elif b'remote.upstream.url' in cmd_tokens:
                return process_for_upstream_url
            else:
                return process_for_remote
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        with popen_swap:
            self.assertEqual(pre_push_hook.get_remote_name(), b'upstream')

    def test_get_remote_name_with_error_in_obtaining_remote(self) -> None:
        def mock_communicate() -> Tuple[bytes, bytes]:
            return (b'test', b'test_oppia_error')
        process = subprocess.Popen(
            [b'echo', b'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # Here we use MyPy ignore because here we are assigning a value to the
        # 'communicate' method, and according to MyPy, assignment to a method
        # is not allowed.
        process.communicate = mock_communicate  # type: ignore[assignment]
        def mock_popen(
            unused_cmd_tokens: List[str], stdout: int, stderr: int  # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process

        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        with popen_swap, self.assertRaisesRegex(ValueError, 'test_oppia_error'):
            pre_push_hook.get_remote_name()

    def test_get_remote_name_with_error_in_obtaining_remote_url(self) -> None:
        def mock_communicate() -> Tuple[str, str]:
            return ('test', 'test_oppia_error')
        process_for_remote = subprocess.Popen(
            [b'echo', b'origin\nupstream'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_remote_url = subprocess.Popen(
            [b'echo', b'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def mock_popen(
            cmd_tokens: List[bytes], stdout: int, stderr: int  # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            if b'config' in cmd_tokens:
                return process_for_remote_url
            else:
                return process_for_remote

        communicate_swap = self.swap(
            process_for_remote_url, 'communicate', mock_communicate
        )
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        with communicate_swap:
            with popen_swap:
                with self.assertRaisesRegex(ValueError, 'test_oppia_error'):
                    pre_push_hook.get_remote_name()

    def test_get_remote_name_with_no_remote_set(self) -> None:
        process_for_remote = subprocess.Popen(
            [b'echo', b'origin\nupstream'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_upstream_url = subprocess.Popen(
            [b'echo', b'url.other/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_origin_url = subprocess.Popen(
            [b'echo', b'url.other/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        def mock_popen(
            cmd_tokens: List[bytes], stdout: int, stderr: int  # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            if b'remote.origin.url' in cmd_tokens:
                return process_for_origin_url
            elif b'remote.upstream.url' in cmd_tokens:
                return process_for_upstream_url
            else:
                return process_for_remote
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        with popen_swap, self.assertRaisesRegex(
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

    def test_get_remote_name_with_multiple_remotes_set(self) -> None:
        process_for_remote = subprocess.Popen(
            [b'echo', b'origin\nupstream'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_upstream_url = subprocess.Popen(
            [b'echo', b'url.oppia/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        process_for_origin_url = subprocess.Popen(
            [b'echo', b'url.oppia/oppia.git'], stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        def mock_popen(
            cmd_tokens: List[bytes], stdout: int, stderr: int  # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            if b'remote.origin.url' in cmd_tokens:
                return process_for_origin_url
            elif b'remote.upstream.url' in cmd_tokens:
                return process_for_upstream_url
            else:
                return process_for_remote
        popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        with popen_swap, self.print_swap:
            self.assertIsNone(pre_push_hook.get_remote_name())
        self.assertTrue(
            'Warning: Please keep only one remote branch for oppia:develop '
            'to run the lint checks efficiently.\n' in self.print_arr)

    def test_git_diff_name_status_without_error(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[bytes, None]:
            return (b'M\tfile1\nA\tfile2', None)
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with subprocess_swap:
            self.assertEqual(
                pre_push_hook.git_diff_name_status(
                    'left', 'right', diff_filter='filter'),
                [
                    pre_push_hook.FileDiff(status=b'M', name=b'file1'),
                    pre_push_hook.FileDiff(status=b'A', name=b'file2')])

    def test_git_diff_name_status_with_error(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[str, str]:
            return ('M\tfile1\nA\tfile2', 'test_oppia_error')
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with subprocess_swap, self.assertRaisesRegex(
            ValueError, 'test_oppia_error'
        ):
            pre_push_hook.git_diff_name_status(
                'left', 'right', diff_filter='filter')

    def test_compare_to_remote(self) -> None:
        check_function_calls = {
            'start_subprocess_for_result_is_called': False,
            'git_diff_name_status_is_called': False,
            'get_merge_base_is_called': False,
        }
        expected_check_function_calls = {
            'start_subprocess_for_result_is_called': True,
            'git_diff_name_status_is_called': True,
            'get_merge_base_is_called': True,
        }
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> None:
            check_function_calls['start_subprocess_for_result_is_called'] = True
        def mock_git_diff_name_status(
            unused_left: str, unused_right: str
        ) -> str:
            check_function_calls['git_diff_name_status_is_called'] = True
            return 'Test'
        def mock_get_merge_base(unused_left: str, unused_right: str) -> str:
            check_function_calls['get_merge_base_is_called'] = True
            return 'Merge Base'
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        git_diff_swap = self.swap(
            pre_push_hook, 'git_diff_name_status', mock_git_diff_name_status)
        get_merge_base_swap = self.swap(
            pre_push_hook, 'get_merge_base', mock_get_merge_base)

        with subprocess_swap, git_diff_swap, get_merge_base_swap:
            self.assertEqual(
                pre_push_hook.compare_to_remote('remote', 'local branch'),
                'Test'
            )
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_get_merge_base_reports_error(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[None, str]:
            return None, 'Test'
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with subprocess_swap, self.assertRaisesRegex(ValueError, 'Test'):
            pre_push_hook.get_merge_base('A', 'B')

    def test_get_merge_base_returns_merge_base(self) -> None:
        check_function_calls = {
            'start_subprocess_for_result_is_called': False,
        }
        expected_check_function_calls = {
            'start_subprocess_for_result_is_called': True,
        }
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[bytes, None]:
            check_function_calls['start_subprocess_for_result_is_called'] = True
            return b'Test', None
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with subprocess_swap:
            self.assertEqual(pre_push_hook.get_merge_base('A', 'B'), 'Test')

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_extract_files_to_lint_with_empty_file_diffs(self) -> None:
        self.assertEqual(pre_push_hook.extract_files_to_lint([]), [])

    def test_extract_files_to_lint_with_non_empty_file_diffs(self) -> None:
        self.assertEqual(
            pre_push_hook.extract_files_to_lint([
                pre_push_hook.FileDiff(status=b'M', name=b'file1'),
                pre_push_hook.FileDiff(status=b'A', name=b'file2'),
                pre_push_hook.FileDiff(status=b'W', name=b'file3')]),
            [b'file1', b'file2'])

    def test_get_parent_branch_name_for_diff_with_hotfix_branch(self) -> None:
        def mock_get_branch() -> str:
            return 'release-1.2.3-hotfix-1'
        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        with get_branch_swap:
            self.assertEqual(
                pre_push_hook.get_parent_branch_name_for_diff(),
                'release-1.2.3')

    def test_get_parent_branch_name_for_diff_with_release_branch(self) -> None:
        def mock_get_branch() -> str:
            return 'release-1.2.3'
        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        with get_branch_swap:
            self.assertEqual(
                pre_push_hook.get_parent_branch_name_for_diff(), 'develop')

    def test_get_parent_branch_name_for_diff_with_non_release_branch(
        self
    ) -> None:
        def mock_get_branch() -> str:
            return 'branch-1'
        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        with get_branch_swap:
            self.assertEqual(
                pre_push_hook.get_parent_branch_name_for_diff(), 'develop')

    def test_collect_files_being_pushed_with_empty_ref_list(self) -> None:
        def mock_get_branch() -> str:
            return 'branch-1'
        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        with get_branch_swap:
            self.assertEqual(
                pre_push_hook.collect_files_being_pushed([], 'remote'), {})

    def test_collect_files_being_pushed_with_non_empty_ref_list(self) -> None:
        def mock_get_branch() -> str:
            return 'branch-1'
        def mock_compare_to_remote(
            unused_remote: str,
            unused_local_branch: str,
            remote_branch: Optional[str] = None  # pylint: disable=unused-argument
        ) -> List[str]:
            return ['A:file1', 'M:file2']
        def mock_extract_files_to_lint(
            unused_file_diffs: List[pre_push_hook.FileDiff]
        ) -> List[str]:
            return ['file1', 'file2']

        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        compare_to_remote_swap = self.swap(
            pre_push_hook, 'compare_to_remote', mock_compare_to_remote)
        extract_files_swap = self.swap(
            pre_push_hook, 'extract_files_to_lint', mock_extract_files_to_lint)

        with compare_to_remote_swap, extract_files_swap, get_branch_swap:
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

    def test_get_refs(self) -> None:
        temp_stdin_file = tempfile.NamedTemporaryFile().name
        with utils.open_file(temp_stdin_file, 'w') as f:
            f.write('local_ref local_sha1 remote_ref remote_sha1')
        with utils.open_file(temp_stdin_file, 'r') as f:
            with self.swap(sys, 'stdin', f):
                self.assertEqual(
                    pre_push_hook.get_refs(),
                    [
                        pre_push_hook.GitRef(
                            local_ref='local_ref', local_sha1='local_sha1',
                            remote_ref='remote_ref', remote_sha1='remote_sha1'
                        )])

    def test_start_linter(self) -> None:
        with self.popen_swap:
            self.assertEqual(pre_push_hook.start_linter([b'files']), 0)

    def test_execute_mypy_checks(self) -> None:
        with self.popen_swap:
            self.assertEqual(pre_push_hook.execute_mypy_checks(), 0)

    def test_run_script_and_get_returncode(self) -> None:
        with self.popen_swap:
            self.assertEqual(
                pre_push_hook.run_script_and_get_returncode(['script']), 0)

    def test_has_uncommitted_files(self) -> None:
        def mock_check_output(
            unused_cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            return 'file1'
        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with check_output_swap:
            self.assertTrue(pre_push_hook.has_uncommitted_files())

    def test_install_hook_with_existing_symlink(self) -> None:
        def mock_islink(unused_file: str) -> bool:
            return True
        def mock_exists(unused_file: str) -> bool:
            return True
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[str, None]:
            return ('Output', None)

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with islink_swap, exists_swap, subprocess_swap, self.print_swap:
            pre_push_hook.install_hook()
        self.assertTrue('Symlink already exists' in self.print_arr)
        self.assertTrue(
            'pre-push hook file is now executable!' in self.print_arr)

    def test_install_hook_with_error_in_making_pre_push_executable(
        self
    ) -> None:

        def mock_islink(unused_file: str) -> bool:
            return True

        def mock_exists(unused_file: str) -> bool:
            return True

        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[str, str]:
            return ('Output', 'test_oppia_error')

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with islink_swap, exists_swap, subprocess_swap, self.print_swap:
            with self.assertRaisesRegex(ValueError, 'test_oppia_error'):
                pre_push_hook.install_hook()
        self.assertTrue('Symlink already exists' in self.print_arr)
        self.assertFalse(
            'pre-push hook file is now executable!' in self.print_arr)

    def test_install_hook_with_creation_of_symlink(self) -> None:
        check_function_calls = {
            'symlink_is_called': False
        }
        def mock_islink(unused_file: str) -> bool:
            return False
        def mock_exists(unused_file: str) -> bool:
            return False
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[str, None]:
            return ('Output', None)
        def mock_symlink(unused_path: str, unused_file: str) -> None:
            check_function_calls['symlink_is_called'] = True

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        symlink_swap = self.swap(os, 'symlink', mock_symlink)

        with islink_swap, exists_swap, subprocess_swap, symlink_swap, (
            self.print_swap):
            pre_push_hook.install_hook()
        self.assertTrue(check_function_calls['symlink_is_called'])
        self.assertTrue(
            'Created symlink in .git/hooks directory' in self.print_arr)
        self.assertTrue(
            'pre-push hook file is now executable!' in self.print_arr)

    def test_install_hook_with_error_in_creation_of_symlink(self) -> None:
        check_function_calls = {
            'symlink_is_called': False,
            'copy_is_called': False
        }
        expected_check_function_calls = {
            'symlink_is_called': True,
            'copy_is_called': True
        }
        def mock_islink(unused_file: str) -> bool:
            return False
        def mock_exists(unused_file: str) -> bool:
            return False
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[str, None]:
            return ('Output', None)
        def mock_symlink(unused_path: str, unused_file: str) -> None:
            check_function_calls['symlink_is_called'] = True
            raise OSError
        def mock_copy(unused_type: str, unused_file: str) -> None:
            check_function_calls['copy_is_called'] = True

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        symlink_swap = self.swap(os, 'symlink', mock_symlink)
        copy_swap = self.swap(shutil, 'copy', mock_copy)

        with islink_swap, exists_swap, subprocess_swap, symlink_swap, copy_swap:
            with self.print_swap:
                pre_push_hook.install_hook()
        self.assertEqual(check_function_calls, expected_check_function_calls)
        self.assertTrue('Copied file to .git/hooks directory' in self.print_arr)
        self.assertTrue(
            'pre-push hook file is now executable!' in self.print_arr)

    def test_install_hook_with_broken_symlink(self) -> None:
        check_function_calls = {
            'unlink_is_called': False,
            'symlink_is_called': False
        }
        def mock_islink(unused_file: str) -> bool:
            return True
        def mock_exists(unused_file: str) -> bool:
            return False
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[str, None]:
            return ('Output', None)
        def mock_unlink(unused_file: str) -> None:
            check_function_calls['unlink_is_called'] = True
        def mock_symlink(unused_path: str, unused_file: str) -> None:
            check_function_calls['symlink_is_called'] = True

        islink_swap = self.swap(os.path, 'islink', mock_islink)
        exists_swap = self.swap(os.path, 'exists', mock_exists)
        subprocess_swap = self.swap(
            pre_push_hook, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        unlink_swap = self.swap(os, 'unlink', mock_unlink)
        symlink_swap = self.swap(os, 'symlink', mock_symlink)

        with islink_swap, exists_swap, subprocess_swap, self.print_swap:
            with unlink_swap, symlink_swap:
                pre_push_hook.install_hook()
        self.assertTrue(check_function_calls['unlink_is_called'])
        self.assertTrue(check_function_calls['symlink_is_called'])
        self.assertTrue('Removing broken symlink' in self.print_arr)
        self.assertTrue(
            'pre-push hook file is now executable!' in self.print_arr)

    def test_does_diff_include_js_or_ts_files_with_js_file(self) -> None:
        self.assertTrue(
            pre_push_hook.does_diff_include_js_or_ts_files(
                [b'file1.js', b'file2.py']))

    def test_does_diff_include_js_or_ts_files_with_no_file(self) -> None:
        self.assertFalse(
            pre_push_hook.does_diff_include_js_or_ts_files(
                [b'file1.html', b'file2.py']))

    def test_does_diff_include_ts_files(self) -> None:
        self.assertTrue(
            pre_push_hook.does_diff_include_ts_files(
                [b'file1.ts', b'file2.ts', b'file3.js']))

    def test_does_diff_include_ts_files_fail(self) -> None:
        self.assertFalse(
            pre_push_hook.does_diff_include_ts_files(
                [b'file1.html', b'file2.yml', b'file3.js']))

    def test_does_diff_include_ci_config_or_js_files(self) -> None:
        self.assertTrue(
            pre_push_hook.does_diff_include_ci_config_or_js_files(
                [b'file1.js', b'protractor.conf.js', b'e2e_dummy.yml']))

    def test_does_diff_include_ci_config_or_js_files_fail(self) -> None:
        self.assertFalse(
            pre_push_hook.does_diff_include_ci_config_or_js_files(
                [b'file1.ts', b'file2.ts', b'file3.html']))

    def test_repo_in_dirty_state(self) -> None:
        def mock_has_uncommitted_files() -> bool:
            return True

        uncommitted_files_swap = self.swap(
            pre_push_hook, 'has_uncommitted_files', mock_has_uncommitted_files)
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, uncommitted_files_swap:
                with self.assertRaisesRegex(SystemExit, '1'):
                    with self.swap_check_backend_python_libs:
                        pre_push_hook.main(args=[])
        self.assertTrue(
            'Your repo is in a dirty state which prevents the linting from'
            ' working.\nStash your changes or commit them.\n' in self.print_arr)

    def test_error_while_branch_change(self) -> None:
        def mock_check_output(
            cmd_tokens: List[str], encoding: str = 'utf-8'  # pylint: disable=unused-argument
        ) -> str:
            if 'symbolic-ref' in cmd_tokens:
                return 'old-branch'
            raise subprocess.CalledProcessError(1, 'cmd', output='Output')

        check_output_swap = self.swap(
            subprocess, 'check_output', mock_check_output)
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with check_output_swap, self.assertRaisesRegex(
                    SystemExit, '1'
                ):
                    with self.swap_check_backend_python_libs:
                        pre_push_hook.main(args=[])
        self.assertIn(
            '\nCould not change branch to branch1. This is most probably '
            'because you are in a dirty state. Change manually to the branch '
            'that is being linted or stash your changes.',
            self.print_arr
        )

    def test_lint_failure(self) -> None:
        self.linter_code = 1
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with self.execute_mypy_checks_swap:
                        with self.assertRaisesRegex(SystemExit, '1'):
                            with self.swap_check_backend_python_libs:
                                pre_push_hook.main(args=[])
        self.assertTrue(
            'Push failed, please correct the linting issues above.'
            in self.print_arr)

    def test_mypy_check_failure(self) -> None:
        self.mypy_check_code = 1
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with self.execute_mypy_checks_swap:
                        with self.assertRaisesRegex(SystemExit, '1'):
                            with self.swap_check_backend_python_libs:
                                pre_push_hook.main(args=[])
        self.assertIn(
            'Push failed, please correct the mypy type annotation issues '
            'above.', self.print_arr)

    def test_typescript_check_failiure(self) -> None:
        self.does_diff_include_ts_files = True
        def mock_run_script_and_get_returncode(script: List[str]) -> int:
            if script == pre_push_hook.TYPESCRIPT_CHECKS_CMDS:
                return 1
            return 0
        run_script_and_get_returncode_swap = self.swap(
            pre_push_hook, 'run_script_and_get_returncode',
            mock_run_script_and_get_returncode)
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with self.ts_swap, run_script_and_get_returncode_swap:
                        with self.execute_mypy_checks_swap:
                            with self.assertRaisesRegex(SystemExit, '1'):
                                with self.swap_check_backend_python_libs:
                                    pre_push_hook.main(args=[])
        self.assertTrue(
            'Push aborted due to failing typescript checks.' in self.print_arr)

    def test_strict_typescript_check_failiure(self) -> None:
        self.does_diff_include_ts_files = True
        def mock_run_script_and_get_returncode(script: List[str]) -> int:
            if script == pre_push_hook.STRICT_TYPESCRIPT_CHECKS_CMDS:
                return 1
            return 0

        run_script_and_get_returncode_swap = self.swap(
            pre_push_hook, 'run_script_and_get_returncode',
            mock_run_script_and_get_returncode)
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with self.ts_swap, run_script_and_get_returncode_swap:
                        with self.execute_mypy_checks_swap:
                            with self.assertRaisesRegex(SystemExit, '1'):
                                with self.swap_check_backend_python_libs:
                                    pre_push_hook.main(args=[])
        self.assertTrue(
            'Push aborted due to failing typescript checks in '
            'strict mode.' in self.print_arr)

    def test_backend_associated_test_file_check_failure(self) -> None:
        def mock_run_script_and_get_returncode(script: List[str]) -> int:
            if script == pre_push_hook.BACKEND_ASSOCIATED_TEST_FILE_CHECK_CMD:
                return 1
            return 0
        run_script_and_get_returncode_swap = self.swap(
            pre_push_hook, 'run_script_and_get_returncode',
            mock_run_script_and_get_returncode)

        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with self.ts_swap, run_script_and_get_returncode_swap:
                        with self.execute_mypy_checks_swap:
                            with self.assertRaisesRegex(SystemExit, '1'):
                                with self.swap_check_backend_python_libs:
                                    pre_push_hook.main(args=[])
        self.assertTrue(
            'Push failed due to some backend files lacking an '
            'associated test file.' in self.print_arr)

    def test_frontend_test_failure(self) -> None:
        self.does_diff_include_js_or_ts_files = True
        def mock_run_script_and_get_returncode(script: List[str]) -> int:
            if script == pre_push_hook.FRONTEND_TEST_CMDS:
                return 1
            return 0
        run_script_and_get_returncode_swap = self.swap(
            pre_push_hook, 'run_script_and_get_returncode',
            mock_run_script_and_get_returncode)
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with self.js_or_ts_swap, run_script_and_get_returncode_swap:
                        with self.execute_mypy_checks_swap:
                            with self.assertRaisesRegex(SystemExit, '1'):
                                with self.swap_check_backend_python_libs:
                                    pre_push_hook.main(args=[])
        self.assertTrue(
            'Push aborted due to failing frontend tests.' in self.print_arr)

    def test_invalid_ci_e2e_test_suites_failure(self) -> None:
        self.does_diff_include_ci_config_or_js_files = True

        def mock_run_script_and_get_returncode(script: List[str]) -> int:
            if script == pre_push_hook.CI_PROTRACTOR_CHECK_CMDS:
                return 1
            return 0
        run_script_and_get_returncode_swap = self.swap(
            pre_push_hook, 'run_script_and_get_returncode',
            mock_run_script_and_get_returncode)
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with run_script_and_get_returncode_swap:
                        with self.ci_config_or_js_files_swap:
                            with self.execute_mypy_checks_swap:
                                with self.assertRaisesRegex(SystemExit, '1'):
                                    with self.swap_check_backend_python_libs:
                                        pre_push_hook.main(args=[])
        self.assertTrue(
            'Push aborted due to failing e2e test configuration check.'
            in self.print_arr)

    def test_main_with_install_arg(self) -> None:
        check_function_calls = {
            'install_hook_is_called': False
        }
        def mock_install_hook() -> None:
            check_function_calls['install_hook_is_called'] = True
        with self.swap(
            pre_push_hook, 'install_hook', mock_install_hook), (
                self.swap_check_backend_python_libs):
            pre_push_hook.main(args=['--install'])

    def test_main_without_install_arg_and_errors(self) -> None:
        def mock_run_script_and_get_returncode(unused_script: List[str]) -> int:
            return 0
        run_script_and_get_returncode_swap = self.swap(
            pre_push_hook, 'run_script_and_get_returncode',
            mock_run_script_and_get_returncode)
        with self.get_remote_name_swap, self.get_refs_swap, self.print_swap:
            with self.collect_files_swap, self.uncommitted_files_swap:
                with self.check_output_swap, self.start_linter_swap:
                    with run_script_and_get_returncode_swap:
                        with self.js_or_ts_swap:
                            with self.execute_mypy_checks_swap:
                                with self.swap_check_backend_python_libs:
                                    pre_push_hook.main(args=[])

    def test_main_exits_when_mismatches_exist_in_backend_python_libs(
        self
    ) -> None:
        """Test that main exits with correct error message when mismatches are
        found between the installed python libraries in
        `third_party/python_libs` and the compiled 'requirements.txt' file.
        """
        def mock_get_mismatches() -> Dict[str, Tuple[str, str]]:
            return {
                'library': ('version', 'version')
            }

        def mock_exit_error(error_code: int) -> None:
            self.assertEqual(error_code, 1)

        swap_get_mismatches = self.swap(
            install_python_prod_dependencies, 'get_mismatches',
            mock_get_mismatches)
        swap_sys_exit = self.swap(sys, 'exit', mock_exit_error)
        with self.print_swap, swap_sys_exit, swap_get_mismatches:
            pre_push_hook.check_for_backend_python_library_inconsistencies()

        self.assertEqual(
            self.print_arr,
            [
                'Your currently installed python libraries do not match the\n'
                'libraries listed in your "requirements.txt" file. Here is a\n'
                'full list of library/version discrepancies:\n',
                'Library                             |Requirements Version     '
                '|Currently Installed Version',
                'library                             |version                  '
                '|version                  ',
                '\n',
                'Please fix these discrepancies by editing the '
                '`requirements.in`\nfile or running '
                '`scripts.install_third_party` to regenerate\nthe '
                '`third_party/python_libs` directory.\n\n'
            ])

    def test_main_exits_when_missing_backend_python_lib(self) -> None:
        """Test that main exits with correct error message when a python
        library required in `requirements.txt` is missing in
        `third_party/python_libs`.
        """
        def mock_get_mismatches() -> Dict[str, Tuple[str, None]]:
            return {
                'library': ('version', None)
            }

        def mock_exit_error(error_code: int) -> None:
            self.assertEqual(error_code, 1)

        swap_get_mismatches = self.swap(
            install_python_prod_dependencies, 'get_mismatches',
            mock_get_mismatches)
        swap_sys_exit = self.swap(sys, 'exit', mock_exit_error)
        with self.print_swap, swap_sys_exit, swap_get_mismatches:
            pre_push_hook.check_for_backend_python_library_inconsistencies()

        self.assertEqual(
            self.print_arr,
            [
                'Your currently installed python libraries do not match the\n'
                'libraries listed in your "requirements.txt" file. Here is a\n'
                'full list of library/version discrepancies:\n',
                'Library                             |Requirements Version     '
                '|Currently Installed Version',
                'library                             |version                  '
                '|None                     ',
                '\n',
                'Please fix these discrepancies by editing the '
                '`requirements.in`\nfile or running '
                '`scripts.install_third_party` to regenerate\nthe '
                '`third_party/python_libs` directory.\n\n'
            ])

    def test_main_with_no_inconsistencies_in_backend_python_libs(self) -> None:
        def mock_get_mismatches() -> Dict[str, Tuple[str, str]]:
            return {}
        swap_get_mismatches = self.swap(
            install_python_prod_dependencies,
            'get_mismatches',
            mock_get_mismatches)

        with swap_get_mismatches, self.print_swap:
            pre_push_hook.check_for_backend_python_library_inconsistencies()

        self.assertEqual(
            self.print_arr,
            ['Python dependencies consistency check succeeded.'])
