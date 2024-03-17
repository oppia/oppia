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

"""Unit tests for scripts/check_for_unresolved_todos.py."""

from __future__ import annotations

import io
import os
import shutil
import sys
import textwrap

from core.tests import test_utils
from scripts import github_api

from typing import List

from . import check_for_unresolved_todos


# TODO(#19755): Testing
class CheckForUnresolvedTodosTests(test_utils.GenericTestBase):
    """Unit tests for testing the check_for_unresolved_todos script."""

    def setUp(self) -> None:
        super().setUp()
        if os.path.isdir(os.path.join(os.getcwd(), 'dummy_dir')):
            shutil.rmtree('dummy_dir')
        os.mkdir('dummy_dir', mode=0o777)
        with open('dummy_dir/file1.txt', 'w', encoding='utf-8') as file:
            content = (
                """
                Test Line 1
                Test Line 2
                Test Line 3
                # TODO(#4151): Description 1
                Test Line 4
                # TODO(#4156): Description 2
                # TODO(#4153): Description 3
                Test Line 5
                # This is a random todo line.
                Test Line 6
                # TODO(#4151): Description 4
                Test Line 7
                # TODO(#4151): Description 5
                Test Line 8
                # TODO(#4123): Description 6
                Test Line 9
                Test Line 10
                """).lstrip('\n')
            file.write(textwrap.dedent(content))
        with open('dummy_dir/file2.txt', 'w', encoding='utf-8') as file:
            content = (
                """
                Test Line 1
                Test Line 2
                # TODO(#4151): Description 7
                Test Line 3
                Test Line 4
                # This is a random todo line.
                Test Line 5
                # TODO(#4123): Description 8
                Test Line 6
                Test Line 7
                # TODO(#4123): Description 9
                # TODO(#4125): Description 10
                # TODO(#4122): Description 11
                """).lstrip('\n')
            file.write(textwrap.dedent(content))

    def tearDown(self) -> None:
        super().tearDown()
        if os.path.isdir(os.path.join(os.getcwd(), 'dummy_dir')):
            shutil.rmtree('dummy_dir')

    def test_get_unresolved_todos_no_generate_file_should_fail(self) -> None:
        mock_stdout = io.StringIO()

        swap_stdout_write = self.swap(sys, 'stdout', mock_stdout)

        with swap_stdout_write, self.assertRaisesRegex(
            Exception,
            check_for_unresolved_todos.UNRESOLVED_TODOS_PRESENT_INDICATOR
        ):
            check_for_unresolved_todos.main([
                '--repository_path=dummy_dir',
                '--issue=4151',
                '--commit_sha=abcdefg'])

        expected_failure_log_lines = [
            'The following TODOs are unresolved for this issue #4151:',
            '- file1.txt:L4',
            '- file1.txt:L11',
            '- file1.txt:L13',
            '- file2.txt:L3'
        ]
        self.assertEqual(
            mock_stdout.getvalue().splitlines(), expected_failure_log_lines)

        self.assertFalse(
            os.path.exists('dummy_dir/unresolved_todo_list.txt'))

    def test_get_unresolved_todos_should_fail(self) -> None:
        mock_stdout = io.StringIO()

        swap_stdout_write = self.swap(sys, 'stdout', mock_stdout)

        with swap_stdout_write, self.assertRaisesRegex(
            Exception,
            check_for_unresolved_todos.UNRESOLVED_TODOS_PRESENT_INDICATOR
        ):
            check_for_unresolved_todos.main([
                '--repository_path=dummy_dir',
                '--issue=4151',
                '--commit_sha=abcdefg',
                '--generate_file'])

        expected_failure_log_lines = [
            'The following TODOs are unresolved for this issue #4151:',
            '- file1.txt:L4',
            '- file1.txt:L11',
            '- file1.txt:L13',
            '- file2.txt:L3'
        ]
        self.assertEqual(
            mock_stdout.getvalue().splitlines(), expected_failure_log_lines)

        github_perma_link_url = (
            'https://github.com/oppia/oppia/blob/abcdefg')

        expected_unresolved_todo_list_lines = [
            'The following TODOs are unresolved for this issue #4151:',
            f'{github_perma_link_url}/file1.txt#L4',
            f'{github_perma_link_url}/file1.txt#L11',
            f'{github_perma_link_url}/file1.txt#L13',
            f'{github_perma_link_url}/file2.txt#L3'
        ]

        with open(
            'dummy_dir/unresolved_todo_list.txt', 'r',
            encoding='utf-8'
        ) as file:
            self.assertEqual(
                file.read().splitlines(), expected_unresolved_todo_list_lines)

    def test_get_unresolved_todos_should_succeed(self) -> None:
        mock_stdout = io.StringIO()

        swap_stdout_write = self.swap(sys, 'stdout', mock_stdout)

        with swap_stdout_write:
            check_for_unresolved_todos.main([
                '--repository_path=dummy_dir',
                '--issue=4157',
                '--commit_sha=abcdefg',
                '--generate_file'])
        self.assertEqual(
            mock_stdout.getvalue().strip(),
            check_for_unresolved_todos.UNRESOLVED_TODOS_NOT_PRESENT_INDICATOR)

    def test_get_unresolved_todos_by_pull_request_should_fail(self) -> None:
        mock_stdout = io.StringIO()

        def mock_fetch_linked_issues_for_pull_request(
            pull_request: int
        ) -> List[github_api.GithubIssueDict]:
            return [
                {
                    'body': 'Issue 4151',
                    'number': 4151,
                    'title': 'Issue 4151'
                },
                {
                    'body': 'Issue 4156',
                    'number': 4156,
                    'title': 'Issue 4156'
                },
                {
                    'body': 'Issue 4153',
                    'number': 4153,
                    'title': 'Issue 4153',
                }
            ] if pull_request == 1234 else []

        swap_stdout_write = self.swap(sys, 'stdout', mock_stdout)
        swap_fetch_linked_issues_for_pull_request = self.swap(
            github_api, 'fetch_linked_issues_for_pull_request',
            mock_fetch_linked_issues_for_pull_request)

        with swap_stdout_write, swap_fetch_linked_issues_for_pull_request:
            with self.assertRaisesRegex(
                Exception,
                check_for_unresolved_todos.UNRESOLVED_TODOS_PRESENT_INDICATOR
            ):
                check_for_unresolved_todos.main([
                    '--repository_path=dummy_dir',
                    '--pull_request=1234',
                    '--commit_sha=abcdefg',
                    '--generate_file'])

        expected_failure_log_lines = [
            'The following TODOs are unresolved for this issue #4151:',
            '- file1.txt:L4',
            '- file1.txt:L11',
            '- file1.txt:L13',
            '- file2.txt:L3',
            'The following TODOs are unresolved for this issue #4156:',
            '- file1.txt:L6',
            'The following TODOs are unresolved for this issue #4153:',
            '- file1.txt:L7'
        ]
        self.assertEqual(
            mock_stdout.getvalue().splitlines(), expected_failure_log_lines)

        github_perma_link_url = (
            'https://github.com/oppia/oppia/blob/abcdefg')

        expected_unresolved_todo_list_lines = [
            'The following TODOs are unresolved for this issue #4151:',
            f'{github_perma_link_url}/file1.txt#L4',
            f'{github_perma_link_url}/file1.txt#L11',
            f'{github_perma_link_url}/file1.txt#L13',
            f'{github_perma_link_url}/file2.txt#L3',
            'The following TODOs are unresolved for this issue #4156:',
            f'{github_perma_link_url}/file1.txt#L6',
            'The following TODOs are unresolved for this issue #4153:',
            f'{github_perma_link_url}/file1.txt#L7'
        ]

        with open(
            'dummy_dir/unresolved_todo_list.txt', 'r',
            encoding='utf-8'
        ) as file:
            self.assertEqual(
                file.read().splitlines(), expected_unresolved_todo_list_lines)
