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
import os
import subprocess
import sys
import tempfile
from unittest import mock

from core.tests import test_utils
from scripts import common, git_changes_utils

from typing import Dict, List, Set, Tuple


class GitChangesUtilsTests(test_utils.GenericTestBase):
    """Tests the git changes utilities."""

    def setUp(self) -> None:
        super().setUp()
        self.print_arr: List[str] = []

        def mock_print(msg: str) -> None:
            self.print_arr.append(msg)

        self.print_patch = mock.patch.object(builtins, 'print', mock_print)

        def mock_get_js_or_ts_files_from_diff(
            unused_diff_files: List[git_changes_utils.FileDiff],
        ) -> List[str]:
            return ['file1.js', 'file2.ts']

        self.get_js_or_ts_files_from_diff_patch = mock.patch.object(
            git_changes_utils,
            'get_js_or_ts_files_from_diff',
            mock_get_js_or_ts_files_from_diff,
        )

    def test_get_upstream_remote_name_without_errors(self) -> None:
        process_for_remote = subprocess.Popen(
            [b'echo', b'origin\nupstream'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        process_for_upstream_url = subprocess.Popen(
            [b'echo', b'https://github.com/oppia/oppia.git'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        process_for_origin_url = subprocess.Popen(
            [b'echo', b'https://github.com/testuser/oppia.git'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        def mock_popen(  # pylint: disable=unused-argument
            cmd_tokens: List[str], stdout: int, stderr: int
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            if 'remote.origin.url' in cmd_tokens:
                return process_for_origin_url
            elif 'remote.upstream.url' in cmd_tokens:
                return process_for_upstream_url
            else:
                return process_for_remote

        with mock.patch.object(
            subprocess,
            'Popen',
            side_effect=mock_popen,
        ) as popen_mock:
            self.assertEqual(
                git_changes_utils.get_upstream_git_repository_remote_name(),
                'upstream',
            )
            popen_mock.assert_any_call(['git', 'remote'])
            popen_mock.assert_any_call(
                ['git', 'config', '--get', 'remote.origin.url']
            )
            popen_mock.assert_any_call(
                ['git', 'config', '--get', 'remote.upstream.url']
            )

    def test_get_upstream_remote_name_with_error_in_obtaining_remote(
        self,
    ) -> None:
        def mock_communicate() -> Tuple[bytes, bytes]:
            return (b'test', b'test_oppia_error')

        process = subprocess.Popen(
            [b'echo', b'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        communicate_patch = mock.patch.object(
            process, 'communicate', mock_communicate
        )

        def mock_popen(  # pylint: disable=unused-argument
            cmd_tokens: List[str], stdout: int, stderr: int
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process

        with mock.patch.object(
            subprocess,
            'Popen',
            side_effect=mock_popen,
        ) as popen_mock:
            with communicate_patch:
                with self.assertRaisesRegex(ValueError, 'test_oppia_error'):
                    git_changes_utils.get_upstream_git_repository_remote_name()
                popen_mock.assert_called_once_with(['git', 'remote'])

    def test_get_upstream_remote_name_with_error_in_obtaining_remote_url(
        self,
    ) -> None:
        def mock_communicate() -> Tuple[str, str]:
            return ('test', 'test_oppia_error')

        process_for_remote = subprocess.Popen(
            [b'echo', b'origin\nupstream'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        process_for_remote_url = subprocess.Popen(
            [b'echo', b'https://github.com/testuser/oppia.git'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        def mock_popen(
            cmd_tokens: List[str],  # pylint: disable=unused-argument
            stdout: int,  # pylint: disable=unused-argument
            stderr: int,  # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            if 'config' in cmd_tokens:
                return process_for_remote_url
            else:
                return process_for_remote

        communicate_patch = mock.patch.object(
            process_for_remote_url, 'communicate', mock_communicate
        )

        popen_patch = mock.patch.object(
            subprocess,
            'Popen',
            side_effect=mock_popen,
        )

        with communicate_patch:
            with popen_patch as popen_mock:
                with self.assertRaisesRegex(ValueError, 'test_oppia_error'):
                    git_changes_utils.get_upstream_git_repository_remote_name()
                popen_mock.assert_any_call(['git', 'remote'])
                popen_mock.assert_any_call(
                    ['git', 'config', '--get', 'remote.origin.url']
                )

    def test_get_upstream_remote_name_with_no_remote_set(self) -> None:
        process_for_remote = subprocess.Popen(
            [b'echo', b''], stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )

        def mock_popen(  # pylint: disable=unused-argument
            cmd_tokens: List[bytes], stdout: int, stderr: int
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process_for_remote

        with mock.patch.object(
            subprocess,
            'Popen',
            side_effect=mock_popen,
        ) as popen_mock:
            with self.assertRaisesRegex(
                Exception,
                'Error: Please set the git \'upstream\' repository.\n'
                'To do that follow these steps:\n'
                '1. Run the command \'git remote -v\'\n'
                '2a. If \'upstream\' is listed in the command output, then run the '
                'command \'git remote set-url upstream '
                'https://github.com/oppia/oppia.git\'\n'
                '2b. If \'upstream\' is not listed in the command output, then run '
                'the command \'git remote add upstream '
                'https://github.com/oppia/oppia.git\'\n',
            ):
                git_changes_utils.get_upstream_git_repository_remote_name()
            popen_mock.assert_any_call(['git', 'remote'])
            popen_mock.assert_any_call(
                ['git', 'config', '--get', 'remote..url']
            )

    def test_get_upstream_remote_name_with_multiple_remotes(self) -> None:
        process_for_remote = subprocess.Popen(
            [b'echo', b'origin\norigintwo'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        process_for_origin_url = subprocess.Popen(
            [b'echo', b'https://github.com/oppia/oppia.git'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        process_for_origintwo_url = subprocess.Popen(
            [b'echo', b'https://github.com/oppia/oppia.git'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        def mock_popen(  # pylint: disable=unused-argument
            cmd_tokens: List[str], stdout: int, stderr: int
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            if 'remote.origin.url' in cmd_tokens:
                return process_for_origin_url
            elif 'remote.origintwo.url' in cmd_tokens:
                return process_for_origintwo_url
            else:
                return process_for_remote

        with mock.patch.object(
            subprocess,
            'Popen',
            side_effect=mock_popen,
        ) as popen_mock:
            with self.assertRaisesRegex(
                Exception,
                'Error: Please keep only one remote branch for oppia:develop.\n'
                'To do that follow these steps:\n'
                '1. Run the command \'git remote -v\'\n'
                '2. This command will list the remote references. There will be '
                'multiple remotes with the main oppia github reopsitory url, but we'
                ' want to make sure that there is only one main \'upstream\' remote'
                ' that uses the url https://github.com/oppia/oppia.git. Please use '
                'the command, \'git remote remove <remote_name>\' on all remotes '
                'that have the url https://github.com/oppia/oppia.git except for '
                'the main \'upstream\' remote.\n',
            ):
                git_changes_utils.get_upstream_git_repository_remote_name()
            popen_mock.assert_any_call(['git', 'remote'])
            popen_mock.assert_any_call(
                ['git', 'config', '--get', 'remote.origin.url']
            )
            popen_mock.assert_any_call(
                ['git', 'config', '--get', 'remote.origintwo.url']
            )

    def test_get_local_remote_name_without_errors(self) -> None:
        process_for_remote = subprocess.Popen(
            [b'echo', b'origin\nupstream'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        process_for_upstream_url = subprocess.Popen(
            [b'echo', b'https://github.com/oppia/oppia.git'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        process_for_origin_url = subprocess.Popen(
            [b'echo', b'https://github.com/testuser/oppia.git'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        def mock_popen(  # pylint: disable=unused-argument
            cmd_tokens: List[str], stdout: int, stderr: int
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            if 'remote.origin.url' in cmd_tokens:
                return process_for_origin_url
            elif 'remote.upstream.url' in cmd_tokens:
                return process_for_upstream_url
            else:
                return process_for_remote

        with mock.patch.object(
            subprocess,
            'Popen',
            side_effect=mock_popen,
        ) as popen_mock:
            self.assertEqual(
                git_changes_utils.get_local_git_repository_remote_name(),
                'origin',
            )
            popen_mock.assert_any_call(['git', 'remote'])
            popen_mock.assert_any_call(
                ['git', 'config', '--get', 'remote.origin.url']
            )
            popen_mock.assert_any_call(
                ['git', 'config', '--get', 'remote.upstream.url']
            )

    def test_get_local_remote_name_with_error_in_obtaining_remote(self) -> None:
        def mock_communicate() -> Tuple[bytes, bytes]:
            return (b'test', b'test_oppia_error')

        process = subprocess.Popen(
            [b'echo', b'test'], stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        communicate_patch = mock.patch.object(
            process, 'communicate', mock_communicate
        )

        def mock_popen(
            cmd_tokens: List[str],  # pylint: disable=unused-argument
            stdout: int,  # pylint: disable=unused-argument
            stderr: int,  # pylint: disable=unused-argument
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process

        popen_patch = mock.patch.object(
            subprocess,
            'Popen',
            side_effect=mock_popen,
        )
        with popen_patch as popen_mock:
            with communicate_patch:
                with self.assertRaisesRegex(ValueError, 'test_oppia_error'):
                    git_changes_utils.get_local_git_repository_remote_name()
                popen_mock.assert_called_once_with(['git', 'remote'])

    def test_get_local_remote_name_with_error_in_obtaining_remote_url(
        self,
    ) -> None:
        def mock_communicate() -> Tuple[str, str]:
            return ('test', 'test_oppia_error')

        process_for_remote = subprocess.Popen(
            [b'echo', b'origin\nupstream'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        process_for_remote_url = subprocess.Popen(
            [b'echo', b'https://github.com/testuser/oppia.git'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        def mock_popen(  # pylint: disable=unused-argument
            cmd_tokens: List[str], stdout: int, stderr: int
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            if 'config' in cmd_tokens:
                return process_for_remote_url
            else:
                return process_for_remote

        communicate_patch = mock.patch.object(
            process_for_remote_url, 'communicate', mock_communicate
        )

        with communicate_patch:
            with mock.patch.object(
                subprocess,
                'Popen',
                side_effect=mock_popen,
            ) as popen_mock:
                with self.assertRaisesRegex(ValueError, 'test_oppia_error'):
                    git_changes_utils.get_local_git_repository_remote_name()
                popen_mock.assert_any_call(['git', 'remote'])
                popen_mock.assert_any_call(
                    ['git', 'config', '--get', 'remote.origin.url']
                )

    def test_get_local_remote_name_with_no_remote_set(self) -> None:
        process_for_remote = subprocess.Popen(
            [b'echo', b''], stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )

        def mock_popen(  # pylint: disable=unused-argument
            cmd_tokens: List[bytes], stdout: int, stderr: int
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            return process_for_remote

        popen_patch = mock.patch.object(
            subprocess,
            'Popen',
            side_effect=mock_popen,
        )
        with popen_patch as popen_mock:
            with self.assertRaisesRegex(
                Exception,
                'Error: Please set the git \'origin\' repository.\n'
                'To do that follow these steps:\n'
                '1. Run the command \'git remote -v\'\n'
                '2a. If \'origin\' is listed in the command output, then run the '
                'command \'git remote set-url origin '
                '\"The URL of your fork of Oppia GitHub repository\"\'\n'
                '2b. If \'origin\' is not listed in the command output, then run '
                'the command \'git remote add origin '
                '\"The URL of your fork of Oppia GitHub repository\"\'\n',
            ):
                git_changes_utils.get_local_git_repository_remote_name()
            popen_mock.assert_any_call(['git', 'remote'])
            popen_mock.assert_any_call(
                ['git', 'config', '--get', 'remote..url']
            )

    def test_get_local_remote_name_with_multiple_remotes(self) -> None:
        process_for_remote = subprocess.Popen(
            [b'echo', b'origin\norigintwo'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        process_for_origin_url = subprocess.Popen(
            [b'echo', b'https://github.com/testuser/oppia.git'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        process_for_origintwo_url = subprocess.Popen(
            [b'echo', b'https://github.com/testusertwo/oppia.git'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        def mock_popen(  # pylint: disable=unused-argument
            cmd_tokens: List[str], stdout: int, stderr: int
        ) -> subprocess.Popen[bytes]:  # pylint: disable=unsubscriptable-object
            if 'remote.origin.url' in cmd_tokens:
                return process_for_origin_url
            elif 'remote.origintwo.url' in cmd_tokens:
                return process_for_origintwo_url
            else:
                return process_for_remote

        with mock.patch.object(
            subprocess,
            'Popen',
            side_effect=mock_popen,
        ) as popen_mock:
            with self.assertRaisesRegex(
                Exception,
                'Error: Please keep only one remote branch for your Oppia fork.'
                '\nTo do that follow these steps:\n'
                '1. Run the command \'git remote -v\'\n'
                '2. This command will list the remote references. There will be '
                'multiple remotes for an Oppia fork, but we'
                ' want to make sure that there is only one main \'origin\' remote'
                ' that uses an Oppia fork URL. Please use '
                'the command, \'git remote remove <remote_name>\' on all remotes '
                'that have an Oppia fork URL except for '
                'the main \'origin\' remote.\n',
            ):
                git_changes_utils.get_local_git_repository_remote_name()
            popen_mock.assert_any_call(['git', 'remote'])
            popen_mock.assert_any_call(
                ['git', 'config', '--get', 'remote.origin.url']
            )
            popen_mock.assert_any_call(
                ['git', 'config', '--get', 'remote.origintwo.url']
            )

    def test_git_diff_name_status_without_error(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str],
        ) -> Tuple[bytes, None]:
            return (b'M\tfile1\nA\tfile2', None)

        subprocess_patch = mock.patch.object(
            common,
            'start_subprocess_for_result',
            side_effect=mock_start_subprocess_for_result,
        )

        with subprocess_patch as subprocess_mock:
            self.assertEqual(
                git_changes_utils.git_diff_name_status('left', 'right'),
                [
                    git_changes_utils.FileDiff(status=b'M', name=b'file1'),
                    git_changes_utils.FileDiff(status=b'A', name=b'file2'),
                ],
            )
            subprocess_mock.assert_called_once_with(
                ['git', 'diff', '--name-status', 'left', 'right', '--']
            )

    def test_git_diff_name_status_with_error(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str],
        ) -> Tuple[str, str]:
            return ('M\tfile1\nA\tfile2', 'test_oppia_error')

        subprocess_patch = mock.patch.object(
            common,
            'start_subprocess_for_result',
            side_effect=mock_start_subprocess_for_result,
        )

        with subprocess_patch as subprocess_mock:
            with self.assertRaisesRegex(ValueError, 'test_oppia_error'):
                git_changes_utils.git_diff_name_status('left', 'right')
            subprocess_mock.assert_called_once_with(
                ['git', 'diff', '--name-status', 'left', 'right', '--']
            )

    def test_git_diff_name_status_with_no_left_and_right(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str],
        ) -> Tuple[bytes, None]:
            return (b'M\tfile1\nA\tfile2', None)

        subprocess_patch = mock.patch.object(
            common,
            'start_subprocess_for_result',
            side_effect=mock_start_subprocess_for_result,
        )

        with subprocess_patch as subprocess_mock:
            self.assertEqual(
                git_changes_utils.git_diff_name_status(),
                [
                    git_changes_utils.FileDiff(status=b'M', name=b'file1'),
                    git_changes_utils.FileDiff(status=b'A', name=b'file2'),
                ],
            )
            subprocess_mock.assert_called_once_with(
                ['git', 'diff', '--name-status']
            )

    def test_git_diff_name_status_with_diff_filter(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str],
        ) -> Tuple[bytes, None]:
            return (b'M\tfile1\nA\tfile2', None)

        subprocess_patch = mock.patch.object(
            common,
            'start_subprocess_for_result',
            side_effect=mock_start_subprocess_for_result,
        )

        with subprocess_patch as subprocess_mock:
            self.assertEqual(
                git_changes_utils.git_diff_name_status(
                    'left', 'right', 'filter'
                ),
                [
                    git_changes_utils.FileDiff(status=b'M', name=b'file1'),
                    git_changes_utils.FileDiff(status=b'A', name=b'file2'),
                ],
            )
            subprocess_mock.assert_called_once_with(
                [
                    'git',
                    'diff',
                    '--name-status',
                    '--diff-filter=filter',
                    'left',
                    'right',
                    '--',
                ]
            )

    def test_git_diff_name_status_with_empty_left_should_error(self) -> None:
        with self.assertRaisesRegex(
            ValueError, 'Error: left should not be an empty string.'
        ):
            git_changes_utils.git_diff_name_status(left='')

    def test_git_diff_name_status_with_empty_right_should_error(self) -> None:
        with self.assertRaisesRegex(
            ValueError, 'Error: right should not be an empty string.'
        ):
            git_changes_utils.git_diff_name_status(right='')

    def test_git_diff_name_status_with_empty_filter_should_error(self) -> None:
        with self.assertRaisesRegex(
            ValueError, 'Error: diff_filter should not be an empty string.'
        ):
            git_changes_utils.git_diff_name_status(diff_filter='')

    def test_check_file_inside_directory_should_be_false(self) -> None:
        self.assertFalse(
            git_changes_utils.check_file_inside_directory(
                '/usr/directory/test.py', '/usr/opensource/oppia'
            )
        )

    def test_check_file_inside_directory_should_be_true(self) -> None:
        self.assertTrue(
            git_changes_utils.check_file_inside_directory(
                '/usr/opensource/oppia/test.py', '/usr/opensource/oppia'
            )
        )

    def test_compare_to_remote(self) -> None:
        expected_file_diffs = [
            git_changes_utils.FileDiff(
                status=b'M', name=b'/usr/opensource/oppia/file1.py'
            ),
            git_changes_utils.FileDiff(
                status=b'A', name=b'/usr/opensource/oppia/file2.py'
            ),
        ]

        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str],
        ) -> None:
            pass

        def mock_git_diff_name_status(
            unused_left: str, unused_right: str
        ) -> List[git_changes_utils.FileDiff]:
            return expected_file_diffs

        def mock_get_merge_base(unused_left: str, unused_right: str) -> str:
            return 'Merge Base'

        subprocess_patch = mock.patch.object(
            common,
            'start_subprocess_for_result',
            side_effect=mock_start_subprocess_for_result,
        )
        git_diff_patch = mock.patch.object(
            git_changes_utils,
            'git_diff_name_status',
            side_effect=mock_git_diff_name_status,
        )
        get_merge_base_patch = mock.patch.object(
            git_changes_utils,
            'get_merge_base',
            side_effect=mock_get_merge_base,
        )
        curr_dir_patch = mock.patch.object(
            common, 'CURR_DIR', '/usr/opensource/oppia'
        )

        with (
            subprocess_patch as subprocess_mock,
            git_diff_patch as git_diff_mock,
            get_merge_base_patch as merge_base_mock,
        ):
            with curr_dir_patch:
                self.assertEqual(
                    git_changes_utils.compare_to_remote(
                        'remote', 'local branch', 'remote/local branch'
                    ),
                    expected_file_diffs,
                )
            subprocess_mock.assert_called_once_with(['git', 'pull', 'remote'])
            git_diff_mock.assert_called_once_with('Merge Base', 'local branch')
            merge_base_mock.assert_called_once_with(
                'remote/local branch', 'local branch'
            )

    def test_compare_to_remote_with_file_not_in_oppia_directory_should_error(
        self,
    ) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str],
        ) -> None:
            pass

        def mock_git_diff_name_status(
            unused_left: str, unused_right: str
        ) -> List[git_changes_utils.FileDiff]:
            return [
                git_changes_utils.FileDiff(
                    status=b'A', name=b'/usr/opensource/oppia/file3.py'
                ),
                git_changes_utils.FileDiff(
                    status=b'M', name=b'/usr/directory/file2.py'
                ),
            ]

        def mock_get_merge_base(unused_left: str, unused_right: str) -> str:
            return 'Merge Base'

        subprocess_patch = mock.patch.object(
            common,
            'start_subprocess_for_result',
            side_effect=mock_start_subprocess_for_result,
        )
        git_diff_patch = mock.patch.object(
            git_changes_utils,
            'git_diff_name_status',
            side_effect=mock_git_diff_name_status,
        )
        get_merge_base_patch = mock.patch.object(
            git_changes_utils,
            'get_merge_base',
            side_effect=mock_get_merge_base,
        )
        curr_dir_patch = mock.patch.object(
            common, 'CURR_DIR', '/usr/opensource/oppia'
        )

        with (
            subprocess_patch as subprocess_mock,
            git_diff_patch as git_diff_mock,
            get_merge_base_patch as merge_base_mock,
        ):
            with (
                curr_dir_patch,
                self.assertRaisesRegex(
                    ValueError,
                    'Error: The file /usr/directory/file2.py is not inside the '
                    'oppia directory.',
                ),
            ):
                git_changes_utils.compare_to_remote(
                    'remote', 'local branch', 'remote/local branch'
                )
            subprocess_mock.assert_called_once_with(['git', 'pull', 'remote'])
            git_diff_mock.assert_called_once_with('Merge Base', 'local branch')
            merge_base_mock.assert_called_once_with(
                'remote/local branch', 'local branch'
            )

    def test_get_merge_base_reports_error(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str],
        ) -> Tuple[None, str]:
            return None, 'Test'

        subprocess_patch = mock.patch.object(
            common,
            'start_subprocess_for_result',
            side_effect=mock_start_subprocess_for_result,
        )

        with (
            subprocess_patch as subprocess_mock,
            self.assertRaisesRegex(ValueError, 'Test'),
        ):
            git_changes_utils.get_merge_base('A', 'B')
            subprocess_mock.assert_called_once_with(
                ['git', 'merge-base', 'A', 'B']
            )

    def test_get_merge_base_returns_merge_base(self) -> None:
        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str],
        ) -> Tuple[bytes, None]:
            return b'Test', None

        subprocess_patch = mock.patch.object(
            common,
            'start_subprocess_for_result',
            side_effect=mock_start_subprocess_for_result,
        )

        with subprocess_patch as subprocess_mock:
            self.assertEqual(git_changes_utils.get_merge_base('A', 'B'), 'Test')
            subprocess_mock.assert_called_once_with(
                ['git', 'merge-base', 'A', 'B']
            )

    def test_extract_acmrt_files_with_empty_file_diffs(self) -> None:
        self.assertEqual(
            git_changes_utils.extract_acmrt_files_from_diff([]), []
        )

    def test_extract_acmrt_files_with_non_empty_file_diffs(self) -> None:
        self.assertEqual(
            git_changes_utils.extract_acmrt_files_from_diff(
                [
                    git_changes_utils.FileDiff(status=b'M', name=b'file1'),
                    git_changes_utils.FileDiff(status=b'A', name=b'file2'),
                    git_changes_utils.FileDiff(status=b'W', name=b'file3'),
                ]
            ),
            [b'file1', b'file2'],
        )

    def test_get_parent_branch_name_for_diff_with_hotfix_branch(self) -> None:
        def mock_get_branch() -> str:
            return 'release-1.2.3-hotfix-1'

        get_branch_patch = mock.patch.object(
            common, 'get_current_branch_name', mock_get_branch
        )
        with get_branch_patch:
            self.assertEqual(
                git_changes_utils.get_parent_branch_name_for_diff(),
                'release-1.2.3',
            )

    def test_get_parent_branch_name_for_diff_with_release_branch(self) -> None:
        def mock_get_branch() -> str:
            return 'release-1.2.3'

        get_branch_patch = mock.patch.object(
            common, 'get_current_branch_name', mock_get_branch
        )
        with get_branch_patch:
            self.assertEqual(
                git_changes_utils.get_parent_branch_name_for_diff(), 'develop'
            )

    def test_get_parent_branch_name_for_diff_with_non_release_branch(
        self,
    ) -> None:
        def mock_get_branch() -> str:
            return 'branch-1'

        get_branch_patch = mock.patch.object(
            common, 'get_current_branch_name', mock_get_branch
        )
        with get_branch_patch:
            self.assertEqual(
                git_changes_utils.get_parent_branch_name_for_diff(), 'develop'
            )

    def test_get_changed_files_with_empty_ref_list(self) -> None:
        def mock_get_branch() -> str:
            return 'branch-1'

        get_branch_patch = mock.patch.object(
            common, 'get_current_branch_name', mock_get_branch
        )
        with get_branch_patch:
            self.assertEqual(
                git_changes_utils.get_changed_files([], 'remote'), {}
            )

    def test_get_changed_files_with_non_empty_ref_list(self) -> None:
        def mock_get_branch() -> str:
            return 'branch-1'

        def mock_compare_to_remote(
            unused_remote: str,
            unused_local_branch: str,
            unused_remote_branch: str,
        ) -> List[str]:
            return ['A:file1', 'M:file2']

        def mock_extract_acmrt_files_from_diff(
            unused_file_diffs: List[git_changes_utils.FileDiff],
        ) -> List[str]:
            return ['file1', 'file2']

        get_branch_patch = mock.patch.object(
            common, 'get_current_branch_name', mock_get_branch
        )
        compare_to_remote_patch = mock.patch.object(
            git_changes_utils,
            'compare_to_remote',
            side_effect=mock_compare_to_remote,
        )
        extract_files_patch = mock.patch.object(
            git_changes_utils,
            'extract_acmrt_files_from_diff',
            mock_extract_acmrt_files_from_diff,
        )

        with compare_to_remote_patch as compare_mock:
            with extract_files_patch:
                with get_branch_patch:
                    self.assertEqual(
                        git_changes_utils.get_changed_files(
                            [
                                git_changes_utils.GitRef(
                                    local_ref='refs/heads/branch-1',
                                    local_sha1='sha1',
                                    remote_ref='refs/remotes/remote/branch-1',
                                    remote_sha1='rsha1',
                                ),
                                git_changes_utils.GitRef(
                                    local_ref='refs/branch-2',
                                    local_sha1='sha2',
                                    remote_ref='remote/branch-2',
                                    remote_sha1='rsha2',
                                ),
                            ],
                            'remote',
                        ),
                        {
                            'branch-1': (
                                ['A:file1', 'M:file2'],
                                ['file1', 'file2'],
                            )
                        },
                    )
                    compare_mock.assert_called_once_with(
                        'remote', 'branch-1', 'remote/branch-1'
                    )

    def test_get_changed_files_with_no_remote_branch(self) -> None:
        def mock_get_branch() -> str:
            return 'branch-1'

        def mock_compare_to_remote(
            unused_remote: str,
            unused_local_branch: str,
            unused_remote_branch: str,
        ) -> List[str]:
            return ['A:file1', 'M:file2']

        def mock_extract_acmrt_files_from_diff(
            unused_file_diffs: List[git_changes_utils.FileDiff],
        ) -> List[str]:
            return ['file1', 'file2']

        def mock_get_upstream_remote_name() -> str:
            return 'upstream'

        get_branch_patch = mock.patch.object(
            common, 'get_current_branch_name', mock_get_branch
        )
        compare_to_remote_patch = mock.patch.object(
            git_changes_utils,
            'compare_to_remote',
            side_effect=mock_compare_to_remote,
        )
        extract_files_patch = mock.patch.object(
            git_changes_utils,
            'extract_acmrt_files_from_diff',
            mock_extract_acmrt_files_from_diff,
        )
        get_upstream_remote_name_patch = mock.patch.object(
            git_changes_utils,
            'get_upstream_git_repository_remote_name',
            mock_get_upstream_remote_name,
        )
        get_parent_branch_name_for_diff_patch = mock.patch.object(
            git_changes_utils,
            'get_parent_branch_name_for_diff',
            lambda: 'develop',
        )

        with compare_to_remote_patch as compare_mock:
            with extract_files_patch:
                with get_branch_patch:
                    with get_upstream_remote_name_patch:
                        with get_parent_branch_name_for_diff_patch:
                            self.assertEqual(
                                git_changes_utils.get_changed_files(
                                    [
                                        git_changes_utils.GitRef(
                                            local_ref='refs/heads/branch-1',
                                            local_sha1='sha1',
                                            remote_ref=None,
                                            remote_sha1=None,
                                        )
                                    ],
                                    'remote',
                                ),
                                {
                                    'branch-1': (
                                        ['A:file1', 'M:file2'],
                                        ['file1', 'file2'],
                                    )
                                },
                            )
                            compare_mock.assert_called_once_with(
                                'upstream', 'branch-1', 'upstream/develop'
                            )

    def test_get_staged_acmrt_files(self) -> None:
        def mock_git_diff_name_status() -> List[git_changes_utils.FileDiff]:
            return [
                git_changes_utils.FileDiff(status=b'M', name=b'file1'),
                git_changes_utils.FileDiff(status=b'A', name=b'file2'),
            ]

        git_diff_patch = mock.patch.object(
            git_changes_utils, 'git_diff_name_status', mock_git_diff_name_status
        )
        with git_diff_patch:
            self.assertEqual(
                git_changes_utils.get_staged_acmrt_files(), [b'file1', b'file2']
            )

    def test_get_staged_acmrt_files_with_no_files(self) -> None:
        def mock_git_diff_name_status() -> List[git_changes_utils.FileDiff]:
            return []

        git_diff_patch = mock.patch.object(
            git_changes_utils, 'git_diff_name_status', mock_git_diff_name_status
        )
        with git_diff_patch:
            self.assertEqual(git_changes_utils.get_staged_acmrt_files(), [])

    def test_get_refs_with_stdin(self) -> None:
        with tempfile.NamedTemporaryFile() as temp_stdin_file:
            with open(temp_stdin_file.name, 'w', encoding='utf-8') as f:
                f.write('local_ref local_sha1 remote_ref remote_sha1')
            with open(temp_stdin_file.name, 'r', encoding='utf-8') as f:
                with mock.patch.object(sys, 'stdin', f):
                    self.assertEqual(
                        git_changes_utils.get_refs(),
                        [
                            git_changes_utils.GitRef(
                                local_ref='local_ref',
                                local_sha1='local_sha1',
                                remote_ref='remote_ref',
                                remote_sha1='remote_sha1',
                            )
                        ],
                    )

    def test_get_refs_with_empty_remote_sha(self) -> None:
        with tempfile.NamedTemporaryFile() as temp_stdin_file:
            with open(temp_stdin_file.name, 'w', encoding='utf-8') as f:
                f.write(
                    'local_ref local_sha1 remote_ref %s'
                    % git_changes_utils.EMPTY_SHA1
                )
            with open(temp_stdin_file.name, 'r', encoding='utf-8') as f:
                with mock.patch.object(sys, 'stdin', f):
                    self.assertEqual(
                        git_changes_utils.get_refs(),
                        [
                            git_changes_utils.GitRef(
                                local_ref='local_ref',
                                local_sha1='local_sha1',
                                remote_ref=None,
                                remote_sha1=None,
                            )
                        ],
                    )

    def test_get_refs_without_stdin_should_use_current_branch(self) -> None:
        def mock_get_branch() -> str:
            return 'branch1'

        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str],
        ) -> Tuple[bytes, bytes]:
            return (b'local_sha1 local_ref\nremote_sha1 remote_ref', b'')

        get_branch_patch = mock.patch.object(
            common, 'get_current_branch_name', mock_get_branch
        )
        start_subprocess_for_result_patch = mock.patch.object(
            common,
            'start_subprocess_for_result',
            side_effect=mock_start_subprocess_for_result,
        )

        with (
            get_branch_patch,
            start_subprocess_for_result_patch as subprocess_mock,
        ):
            self.assertEqual(
                git_changes_utils.get_refs(),
                [
                    git_changes_utils.GitRef(
                        local_ref='local_ref',
                        local_sha1='local_sha1',
                        remote_ref='remote_ref',
                        remote_sha1='remote_sha1',
                    )
                ],
            )
            subprocess_mock.assert_called_once_with(
                ['git', 'show-ref', 'branch1']
            )

    def test_get_refs_without_stdin_should_use_current_branch_raises_error(
        self,
    ) -> None:  # pylint: disable=line-too-long
        def mock_get_branch() -> str:
            return 'branch1'

        def mock_start_subprocess_for_result(
            unused_cmd_tokens: List[str],
        ) -> Tuple[bytes, bytes]:
            return (b'', b'Error')

        get_branch_patch = mock.patch.object(
            common, 'get_current_branch_name', mock_get_branch
        )
        start_subprocess_for_result_patch = mock.patch.object(
            common,
            'start_subprocess_for_result',
            side_effect=mock_start_subprocess_for_result,
        )

        with (
            get_branch_patch,
            start_subprocess_for_result_patch as subprocess_mock,
        ):
            with self.assertRaisesRegex(ValueError, 'Error'):
                git_changes_utils.get_refs()
            subprocess_mock.assert_called_once_with(
                ['git', 'show-ref', 'branch1']
            )

    def test_get_js_or_ts_files_from_diff_with_js_file(self) -> None:
        self.assertEqual(
            git_changes_utils.get_js_or_ts_files_from_diff(
                [b'file1.js', b'file2.ts', b'file3.py']
            ),
            ['file1.js', 'file2.ts'],
        )

    def test_get_js_or_ts_files_from_diff_with_no_file(self) -> None:
        self.assertEqual(
            git_changes_utils.get_js_or_ts_files_from_diff(
                [b'file1.html', b'file2.py', b'file3.py']
            ),
            [],
        )

    def test_get_python_dot_test_files_from_diff_with_test_file(self) -> None:
        def mock_os_path_exists(path: str) -> bool:
            if path in ['test/file1_test.py']:
                return True
            return False

        os_path_exists_patch = mock.patch.object(
            os.path,
            'exists',
            side_effect=mock_os_path_exists,
        )
        with os_path_exists_patch as exists_mock:
            self.assertEqual(
                git_changes_utils.get_python_dot_test_files_from_diff(
                    [b'test/file1_test.py', b'test/file2.py', b'test/file3.py']
                ),
                set(['test.file1_test']),
            )
            exists_mock.assert_any_call('test/file1_test.py')
            exists_mock.assert_any_call('test/file2_test.py')
            exists_mock.assert_any_call('test/file3_test.py')

    def test_get_python_dot_test_files_from_diff_with_no_test_file(
        self,
    ) -> None:
        os_path_exists_patch = mock.patch.object(
            os.path, 'exists', lambda _: False
        )
        with os_path_exists_patch:
            self.assertEqual(
                git_changes_utils.get_python_dot_test_files_from_diff(
                    [b'test/file1.py', b'test/file2.py', b'test/file3.py']
                ),
                set(),
            )

    def test_get_python_dot_test_files_from_diff_with_existing_test_file(
        self,
    ) -> None:
        def mock_os_path_exists(path: str) -> bool:
            if path in ['test/file1_test.py', 'test/file2_test.py']:
                return True
            return False

        os_path_exists_patch = mock.patch.object(
            os.path,
            'exists',
            side_effect=mock_os_path_exists,
        )

        with os_path_exists_patch as exists_mock:
            self.assertEqual(
                git_changes_utils.get_python_dot_test_files_from_diff(
                    [b'test/file1.py', b'test/file2.py', b'test/file3.py']
                ),
                set(['test.file1_test', 'test.file2_test']),
            )
            exists_mock.assert_any_call('test/file1_test.py')
            exists_mock.assert_any_call('test/file2_test.py')
            exists_mock.assert_any_call('test/file3_test.py')

    def test_get_python_dot_test_files_from_diff_with_non_existing_test_file(
        self,
    ) -> None:
        os_path_exists_patch = mock.patch.object(
            os.path,
            'exists',
            side_effect=lambda _: False,
        )

        with os_path_exists_patch as exists_mock:
            self.assertEqual(
                git_changes_utils.get_python_dot_test_files_from_diff(
                    [b'test/file1.py', b'test/file2.py', b'test/file3.py']
                ),
                set(),
            )
            exists_mock.assert_any_call('test/file1_test.py')
            exists_mock.assert_any_call('test/file2_test.py')
            exists_mock.assert_any_call('test/file3_test.py')

    def test_get_changed_python_test_files(self) -> None:
        git_refs = [
            git_changes_utils.GitRef(
                'local_ref', 'local_sha1', 'remote_ref', 'remote_sha1'
            )
        ]

        def mock_get_remote_name() -> str:
            return 'remote'

        def mock_get_refs() -> List[git_changes_utils.GitRef]:
            return git_refs

        def mock_get_changed_files(
            unused_refs: List[git_changes_utils.GitRef], unused_remote_name: str
        ) -> Dict[str, Tuple[List[git_changes_utils.FileDiff], List[bytes]]]:
            return {
                'branch1': (
                    [
                        git_changes_utils.FileDiff('M', b'test/file1.py'),
                        git_changes_utils.FileDiff('M', b'file2.ts'),
                        git_changes_utils.FileDiff('M', b'test/file3.py'),
                    ],
                    [b'test/file1.py', b'file2.ts', b'test/file3.py'],
                ),
                'branch2': ([], []),
            }

        def mock_get_staged_acmrt_files() -> List[bytes]:
            return [
                b'test/file1.py',
                b'file2.ts',
                b'test/file3.py',
                b'test/file4.py',
            ]

        def mock_get_python_dot_test_files_from_diff(
            diff_files: List[bytes],
        ) -> Set[str]:
            if diff_files == [b'test/file1.py', b'file2.ts', b'test/file3.py']:
                return {'test.file1_test.py', 'test.file3_test.py'}
            elif diff_files == [
                b'test/file1.py',
                b'file2.ts',
                b'test/file3.py',
                b'test/file4.py',
            ]:
                return {
                    'test.file1_test.py',
                    'test.file3_test.py',
                    'test.file4_test.py',
                }
            return set()

        def mock_get_parent_branch_name_for_diff() -> str:
            return 'develop'

        get_remote_name_patch = mock.patch.object(
            git_changes_utils,
            'get_local_git_repository_remote_name',
            mock_get_remote_name,
        )
        get_refs_patch = mock.patch.object(
            git_changes_utils, 'get_refs', mock_get_refs
        )
        get_changed_files_patch = mock.patch.object(
            git_changes_utils,
            'get_changed_files',
            side_effect=mock_get_changed_files,
        )
        get_staged_acmrt_files_patch = mock.patch.object(
            git_changes_utils,
            'get_staged_acmrt_files',
            mock_get_staged_acmrt_files,
        )
        get_python_dot_test_files_from_diff_patch = mock.patch.object(
            git_changes_utils,
            'get_python_dot_test_files_from_diff',
            side_effect=mock_get_python_dot_test_files_from_diff,
        )
        get_parent_branch_name_for_diff_patch = mock.patch.object(
            git_changes_utils,
            'get_parent_branch_name_for_diff',
            mock_get_parent_branch_name_for_diff,
        )

        with (
            get_remote_name_patch,
            get_refs_patch,
            get_changed_files_patch as changed_mock,
        ):
            with get_staged_acmrt_files_patch:
                with (
                    get_python_dot_test_files_from_diff_patch as python_test_mock
                ):
                    with get_parent_branch_name_for_diff_patch:
                        self.assertEqual(
                            git_changes_utils.get_changed_python_test_files(),
                            {
                                'test.file1_test.py',
                                'test.file3_test.py',
                                'test.file4_test.py',
                            },
                        )
                        changed_mock.assert_called_once_with(git_refs, 'remote')
                        python_test_mock.assert_any_call(
                            [b'test/file1.py', b'file2.ts', b'test/file3.py']
                        )
                        python_test_mock.assert_any_call(
                            [
                                b'test/file1.py',
                                b'file2.ts',
                                b'test/file3.py',
                                b'test/file4.py',
                            ]
                        )

    def test_get_changed_python_test_files_without_remote(self) -> None:
        def mock_get_remote_name() -> str:
            return ''

        get_remote_name_patch = mock.patch.object(
            git_changes_utils,
            'get_local_git_repository_remote_name',
            mock_get_remote_name,
        )

        with (
            get_remote_name_patch,
            self.assertRaisesRegex(
                SystemExit, 'Error: No remote repository found.'
            ),
        ):
            git_changes_utils.get_changed_python_test_files()
