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

"""Unit tests for scripts/check_for_duplicate_todo_comment.py."""

from __future__ import annotations

import io
import os
import shutil
import sys
import textwrap

from core.tests import test_utils
from scripts import github_api

from typing import Optional

from . import check_for_duplicate_todo_comment

DUMMY_SHA_ONE = '51ab6a0341cfb86d95a387438fc993b5eb977b83'
DUMMY_SHA_TWO = '74cd6a0341cfb86d95a387438fc993b5eb977b83'
GITHUB_PERMA_LINK_URL = 'https://github.com/oppia/oppia/blob'


class CheckForDuplicateTodoCommentTest(test_utils.GenericTestBase):
    """Unit tests for testing the check_for_duplicate_todo_comment script."""

    def setUp(self) -> None:
        super().setUp()
        if os.path.isdir(os.path.join(os.getcwd(), 'dummy_dir')):
            shutil.rmtree('dummy_dir')
        os.mkdir('dummy_dir', mode=0o777)
        with open(
            'dummy_dir/unresolved_todo_list_one.txt', 'w',
            encoding='utf-8'
        ) as file:
            content = (
                f"""
                The following TODOs are unresolved for this issue #4175:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L39
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L40
                """).lstrip('\n')
            file.write(textwrap.dedent(content))
        with open(
            'dummy_dir/unresolved_todo_list_two.txt', 'w', 
            encoding='utf-8'
        ) as file:
            content = (
                f"""
                The following TODOs are unresolved for this issue #4176:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L39
                """).lstrip('\n')
            file.write(textwrap.dedent(content))
        with open(
            'dummy_dir/unresolved_todo_list_three.txt', 'w',
            encoding='utf-8'
        ) as file:
            content = (
                f"""
                The following TODOs are unresolved for this issue #4177:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L39
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L41
                """).lstrip('\n')
            file.write(textwrap.dedent(content))
        with open(
            'dummy_dir/unresolved_todo_list_four.txt', 'w',
            encoding='utf-8'
        ) as file:
            content = (
                f"""
                The following TODOs are unresolved for this issue #4177:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L39
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L40
                """).lstrip('\n')
            file.write(textwrap.dedent(content))

    def tearDown(self) -> None:
        super().tearDown()
        if os.path.isdir(os.path.join(os.getcwd(), 'dummy_dir')):
            shutil.rmtree('dummy_dir')

    def test_check_for_duplicate_todo_comment_with_no_duplicate_error(
        self
    ) -> None:
        def mock_fetch_latest_comment_from_issue(
            issue: int
        ) -> Optional[github_api.GithubCommentDict]:
            return {
                'body': ''
            } if issue == 4175 else None

        fetch_latest_comment_swap = self.swap(
            github_api, 'fetch_latest_comment_from_issue',
            mock_fetch_latest_comment_from_issue)
        with fetch_latest_comment_swap, self.assertRaisesRegex(
            Exception,
            check_for_duplicate_todo_comment.NEW_COMMENT_SHOULD_BE_POSTED
        ):
            check_for_duplicate_todo_comment.main([
                '--repository_path=dummy_dir',
                '--issue=4175',
                '--new_comment_file=unresolved_todo_list_one.txt'
            ])

    def test_check_for_duplicate_todo_comment_two_shas_with_no_duplicate_error(
        self
    ) -> None:
        def mock_fetch_latest_comment_from_issue(
            issue: int
        ) -> Optional[github_api.GithubCommentDict]:
            body = textwrap.dedent(
                f"""
                The following TODOs are unresolved for this issue #4176:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_TWO}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_TWO}/scripts/common.py#L39
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_TWO}/scripts/common.py#L40
                """).lstrip('\n')
            return {
                'body': body
            } if issue == 4176 else None

        fetch_latest_comment_swap = self.swap(
            github_api, 'fetch_latest_comment_from_issue',
            mock_fetch_latest_comment_from_issue)
        with fetch_latest_comment_swap, self.assertRaisesRegex(
            Exception,
            check_for_duplicate_todo_comment.NEW_COMMENT_SHOULD_BE_POSTED
        ):
            check_for_duplicate_todo_comment.main([
                '--repository_path=dummy_dir',
                '--issue=4176',
                '--new_comment_file=unresolved_todo_list_two.txt'
            ])

    def test_check_for_duplicate_todo_comment_lines_with_no_duplicate_error(
        self
    ) -> None:
        def mock_fetch_latest_comment_from_pull_request(
            pull_request: int
        ) -> Optional[github_api.GithubCommentDict]:
            body = textwrap.dedent(
                f"""
                The following TODOs are unresolved for this issue #4177:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L39
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L40
                """).lstrip('\n')
            return {
                'body': body
            } if pull_request == 1234 else None

        fetch_latest_comment_swap = self.swap(
            github_api, 'fetch_latest_comment_from_pull_request',
            mock_fetch_latest_comment_from_pull_request)

        with fetch_latest_comment_swap, self.assertRaisesRegex(
            Exception,
            check_for_duplicate_todo_comment.NEW_COMMENT_SHOULD_BE_POSTED
        ):
            check_for_duplicate_todo_comment.main([
                '--repository_path=dummy_dir',
                '--pull_request=1234',
                '--new_comment_file=unresolved_todo_list_three.txt'
            ])

    def test_check_for_duplicate_todo_comment_with_duplicate_success(
        self
    ) -> None:
        mock_stdout = io.StringIO()

        def mock_fetch_latest_comment_from_pull_request(
            pull_request: int
        ) -> Optional[github_api.GithubCommentDict]:
            body = textwrap.dedent(
                f"""
                The following TODOs are unresolved for this issue #4177:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L39
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L40
                """).lstrip('\n')
            return {
                'body': body
            } if pull_request == 1234 else None

        stdout_write_swap = self.swap(sys, 'stdout', mock_stdout)
        fetch_latest_comment_swap = self.swap(
            github_api, 'fetch_latest_comment_from_pull_request',
            mock_fetch_latest_comment_from_pull_request)

        with fetch_latest_comment_swap, stdout_write_swap:
            check_for_duplicate_todo_comment.main([
                '--repository_path=dummy_dir',
                '--pull_request=1234',
                '--new_comment_file=unresolved_todo_list_four.txt'
            ])
        self.assertEqual(
            mock_stdout.getvalue().strip(),
            check_for_duplicate_todo_comment.NEW_COMMENT_SHOULD_NOT_BE_POSTED)

    def test_check_for_duplicate_todo_comment_no_comment_error(self) -> None:
        def mock_fetch_latest_comment_from_pull_request(
            _: int
        ) -> Optional[github_api.GithubCommentDict]:
            return None

        fetch_latest_comment_swap = self.swap(
            github_api, 'fetch_latest_comment_from_pull_request',
            mock_fetch_latest_comment_from_pull_request)
        with fetch_latest_comment_swap, self.assertRaisesRegex(
            Exception,
            check_for_duplicate_todo_comment.NEW_COMMENT_SHOULD_BE_POSTED
        ):
            check_for_duplicate_todo_comment.main([
                '--repository_path=dummy_dir',
                '--pull_request=1234',
                '--new_comment_file=unresolved_todo_list_four.txt'
            ])

    def test_check_for_duplicate_todo_comment_no_issue_or_pull_request_error(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'No issue or pull request number provided.'):
            check_for_duplicate_todo_comment.main([
                '--repository_path=dummy_dir',
                '--new_comment_file=unresolved_todo_list_one.txt'
            ])
