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

from . import check_for_unresolved_todos


class CheckForOpenTodosTests(test_utils.GenericTestBase):
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
        with open('dummy_dir/issue_list.txt', 'w', encoding='utf-8') as file:
            content = (
                """
                4151
                4156
                4153
                """).lstrip('\n')
            file.write(textwrap.dedent(content))

    def tearDown(self) -> None:
        super().tearDown()
        shutil.rmtree('dummy_dir')

    def test_get_open_todos_by_existing_issue_number(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            check_for_unresolved_todos.UNRESOLVED_TODOS_PRESENT_INDICATOR
        ):
            check_for_unresolved_todos.main([
                '--repository_path=dummy_dir',
                '--issue_number=4151',
                '--commit_sha=abcdefg'])

        github_perma_link_url = (
            'https://github.com/oppia/oppia/blob/abcdefg')

        expected_todo_list_lines = [
            'The following todos are associated with this issue #4151:',
            f'{github_perma_link_url}/file1.txt#L4',
            f'{github_perma_link_url}/file1.txt#L11',
            f'{github_perma_link_url}/file1.txt#L13',
            f'{github_perma_link_url}/file2.txt#L3'
        ]

        with open('dummy_dir/todo_list.txt', 'r', encoding='utf-8') as file:
            self.assertItemsEqual(
                file.read().splitlines(), expected_todo_list_lines)

    def test_get_open_todos_by_nonexisting_issue_number(self) -> None:
        mock_stdout = io.StringIO()

        stdout_write_swap = self.swap(sys, 'stdout', mock_stdout)

        with stdout_write_swap:
            check_for_unresolved_todos.main([
                '--repository_path=dummy_dir',
                '--issue_number=4157',
                '--commit_sha=abcdefg'])
        self.assertEqual(
            mock_stdout.getvalue(),
            check_for_unresolved_todos.UNRESOLVED_TODOS_NOT_PRESENT_INDICATOR)

    def test_get_open_todos_by_existing_issue_file(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            check_for_unresolved_todos.UNRESOLVED_TODOS_PRESENT_INDICATOR
        ):
            check_for_unresolved_todos.main([
                '--repository_path=dummy_dir',
                '--issue_file=issue_list.txt',
                '--commit_sha=abcdefg'])

        github_perma_link_url = (
            'https://github.com/oppia/oppia/blob/abcdefg')

        expected_todo_list_lines = [
            'The following todos are associated with this issue #4151:',
            f'{github_perma_link_url}/file1.txt#L4',
            f'{github_perma_link_url}/file1.txt#L11',
            f'{github_perma_link_url}/file1.txt#L13',
            f'{github_perma_link_url}/file2.txt#L3',
            'The following todos are associated with this issue #4156:',
            f'{github_perma_link_url}/file1.txt#L6',
            'The following todos are associated with this issue #4153:',
            f'{github_perma_link_url}/file1.txt#L7'
        ]

        with open('dummy_dir/todo_list.txt', 'r', encoding='utf-8') as file:
            self.assertListEqual(file.read().splitlines(), expected_todo_list_lines)
