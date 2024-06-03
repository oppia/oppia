# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/git_changes_utils.py."""

from __future__ import annotations

import builtins
import subprocess

import sys
import tempfile

from core import utils
from core.tests import test_utils
from scripts import common
from scripts import git_changes_utils

from typing import List, Optional, Tuple


class GitChangesUtilsTests(test_utils.GenericTestBase):
    """Tests the git changes utilities."""

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
        self.print_arr: List[str] = []
        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)
        self.print_swap = self.swap(builtins, 'print', mock_print)
        self.popen_swap = self.swap(subprocess, 'Popen', mock_popen)
        def mock_get_js_or_ts_files_from_diff(
            unused_diff_files: List[git_changes_utils.FileDiff]
        ) -> List[str]:
            return ['file1.js', 'file2.ts']
        self.get_js_or_ts_files_from_diff_swap = self.swap(
            git_changes_utils, 'get_js_or_ts_files_from_diff',
            mock_get_js_or_ts_files_from_diff)

    def test_start_subprocess_for_result(self) -> None:
        with self.popen_swap:
            self.assertEqual(
                git_changes_utils.start_subprocess_for_result(['cmd']),
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
            self.assertEqual(git_changes_utils.get_remote_name(), b'upstream')

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
            git_changes_utils.get_remote_name()

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
                    git_changes_utils.get_remote_name()

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
            'Error: Please set the git upstream.\n'
            'To do that follow these steps:\n'
            '1. Run the command \'git remote -v\'\n'
            '2a. If upstream is listed in the command output, then run the '
            'command \'git remote set-url upstream '
            'https://github.com/oppia/oppia.git\'\n'
            '2b. If upstream is not listed in the command output, then run the '
            'command \'git remote add upstream '
            'https://github.com/oppia/oppia.git\'\n'):
            git_changes_utils.get_remote_name()

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
            self.assertIsNone(git_changes_utils.get_remote_name())
        self.assertTrue(
            'Warning: Please keep only one remote branch for '
            'oppia:develop.\n' in self.print_arr)

    def test_git_diff_name_status_without_error(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[bytes, None]:
            return (b'M\tfile1\nA\tfile2', None)
        subprocess_swap = self.swap(
            git_changes_utils, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with subprocess_swap:
            self.assertEqual(
                git_changes_utils.git_diff_name_status(
                    'left', 'right', diff_filter='filter'),
                [
                    git_changes_utils.FileDiff(status=b'M', name=b'file1'),
                    git_changes_utils.FileDiff(status=b'A', name=b'file2')])

    def test_git_diff_name_status_with_error(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[str, str]:
            return ('M\tfile1\nA\tfile2', 'test_oppia_error')
        subprocess_swap = self.swap(
            git_changes_utils, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with subprocess_swap, self.assertRaisesRegex(
            ValueError, 'test_oppia_error'
        ):
            git_changes_utils.git_diff_name_status(
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
            git_changes_utils, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)
        git_diff_swap = self.swap(
            git_changes_utils, 'git_diff_name_status',
            mock_git_diff_name_status)
        get_merge_base_swap = self.swap(
            git_changes_utils, 'get_merge_base', mock_get_merge_base)

        with subprocess_swap, git_diff_swap, get_merge_base_swap:
            self.assertEqual(
                git_changes_utils.compare_to_remote('remote', 'local branch'),
                'Test'
            )
        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_get_merge_base_reports_error(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[None, str]:
            return None, 'Test'
        subprocess_swap = self.swap(
            git_changes_utils, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with subprocess_swap, self.assertRaisesRegex(ValueError, 'Test'):
            git_changes_utils.get_merge_base('A', 'B')

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
            git_changes_utils, 'start_subprocess_for_result',
            mock_start_subprocess_for_result)

        with subprocess_swap:
            self.assertEqual(git_changes_utils.get_merge_base('A', 'B'), 'Test')

        self.assertEqual(check_function_calls, expected_check_function_calls)

    def test_extract_acmrt_files_with_empty_file_diffs(self) -> None:
        self.assertEqual(
            git_changes_utils.extract_acmrt_files_from_diffs([]), [])

    def test_extract_acmrt_files_with_non_empty_file_diffs(self) -> None:
        self.assertEqual(
            git_changes_utils.extract_acmrt_files_from_diffs([
                git_changes_utils.FileDiff(status=b'M', name=b'file1'),
                git_changes_utils.FileDiff(status=b'A', name=b'file2'),
                git_changes_utils.FileDiff(status=b'W', name=b'file3')]),
            [b'file1', b'file2'])

    def test_get_parent_branch_name_for_diff_with_hotfix_branch(self) -> None:
        def mock_get_branch() -> str:
            return 'release-1.2.3-hotfix-1'
        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        with get_branch_swap:
            self.assertEqual(
                git_changes_utils.get_parent_branch_name_for_diff(),
                'release-1.2.3')

    def test_get_parent_branch_name_for_diff_with_release_branch(self) -> None:
        def mock_get_branch() -> str:
            return 'release-1.2.3'
        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        with get_branch_swap:
            self.assertEqual(
                git_changes_utils.get_parent_branch_name_for_diff(), 'develop')

    def test_get_parent_branch_name_for_diff_with_non_release_branch(
        self
    ) -> None:
        def mock_get_branch() -> str:
            return 'branch-1'
        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        with get_branch_swap:
            self.assertEqual(
                git_changes_utils.get_parent_branch_name_for_diff(), 'develop')

    def test__files_being_pushed_with_empty_ref_list(self) -> None:
        def mock_get_branch() -> str:
            return 'branch-1'
        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        with get_branch_swap:
            self.assertEqual(
                git_changes_utils.get_changed_files([], 'remote'), {})

    def test__files_being_pushed_with_non_empty_ref_list(self) -> None:
        def mock_get_branch() -> str:
            return 'branch-1'
        def mock_compare_to_remote(
            unused_remote: str,
            unused_local_branch: str,
            remote_branch: Optional[str] = None  # pylint: disable=unused-argument
        ) -> List[str]:
            return ['A:file1', 'M:file2']
        def mock_extract_acmrt_files_from_diffs(
            unused_file_diffs: List[git_changes_utils.FileDiff]
        ) -> List[str]:
            return ['file1', 'file2']

        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        compare_to_remote_swap = self.swap(
            git_changes_utils, 'compare_to_remote', mock_compare_to_remote)
        extract_files_swap = self.swap(
            git_changes_utils, 'extract_acmrt_files_from_diffs',
            mock_extract_acmrt_files_from_diffs)

        with compare_to_remote_swap, extract_files_swap, get_branch_swap:
            self.assertEqual(
                git_changes_utils.get_changed_files([
                    git_changes_utils.GitRef(
                        local_ref='refs/heads/branch1', local_sha1='sha1',
                        remote_ref='remote/ref1', remote_sha1='rsha1'),
                    git_changes_utils.GitRef(
                        local_ref='refs/branch2', local_sha1='sha2',
                        remote_ref='remote/ref2', remote_sha1='rsha2')
                    ], 'remote'),
                {'branch1': (['A:file1', 'M:file2'], ['file1', 'file2'])})

    def test_get_refs_with_stdin(self) -> None:
        temp_stdin_file = tempfile.NamedTemporaryFile().name
        with utils.open_file(temp_stdin_file, 'w') as f:
            f.write('local_ref local_sha1 remote_ref remote_sha1')
        with utils.open_file(temp_stdin_file, 'r') as f:
            with self.swap(sys, 'stdin', f):
                self.assertEqual(
                    git_changes_utils.get_refs(),
                    [
                        git_changes_utils.GitRef(
                            local_ref='local_ref', local_sha1='local_sha1',
                            remote_ref='remote_ref', remote_sha1='remote_sha1'
                        )])

    def test_get_refs_without_stdin_should_use_current_branch(self) -> None:
        def mock_get_branch() -> str:
            return 'branch1'
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[bytes, bytes]:
            return (b'local_sha1 local_ref\nremote_sha1 remote_ref', b'')
        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        start_subprocess_for_result_swap = self.swap_with_checks(
            git_changes_utils, 'start_subprocess_for_result',
            mock_start_subprocess_for_result,
            expected_args=[(['git', 'show-ref', 'branch1'],)])

        with get_branch_swap, start_subprocess_for_result_swap:
            self.assertEqual(
                git_changes_utils.get_refs(),
                [
                    git_changes_utils.GitRef(
                        local_ref='local_ref', local_sha1='local_sha1',
                        remote_ref='remote_ref', remote_sha1='remote_sha1'
                    )])

    def test_get_refs_without_stdin_should_use_current_branch_raises_error(self) -> None: # pylint: disable=line-too-long
        def mock_get_branch() -> str:
            return 'branch1'
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str]
        ) -> Tuple[bytes, bytes]:
            return (b'', b'Error')
        get_branch_swap = self.swap(
            common, 'get_current_branch_name', mock_get_branch)
        start_subprocess_for_result_swap = self.swap_with_checks(
            git_changes_utils, 'start_subprocess_for_result',
            mock_start_subprocess_for_result,
            expected_args=[(['git', 'show-ref', 'branch1'],)])

        with get_branch_swap, start_subprocess_for_result_swap:
            with self.assertRaisesRegex(ValueError, 'Error'):
                git_changes_utils.get_refs()

    def test_get_js_or_ts_files_from_diff_with_js_file(self) -> None:
        self.assertEqual(
            git_changes_utils.get_js_or_ts_files_from_diff(
                [b'file1.js', b'file2.ts', b'file3.py']),
            ['file1.js', 'file2.ts'])

    def test_get_js_or_ts_files_from_diff_with_no_file(self) -> None:
        self.assertEqual(
            git_changes_utils.get_js_or_ts_files_from_diff(
                [b'file1.html', b'file2.py', b'file3.py']),
            [])
