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

import os
import sys
import io
import textwrap
import shutil

from core.tests import test_utils

from . import check_for_duplicate_todo_comment

DUMMY_SHA_ONE = '51ab6a0341cfb86d95a387438fc993b5eb977b83'
DUMMY_SHA_TWO = '74cd6a0341cfb86d95a387438fc993b5eb977b83'
GITHUB_PERMA_LINK_URL = 'https://github.com/oppia/oppia/blob'

NO_DUPLICATE_TODO_COMMENT_INDICATOR = 'New todo comment should be posted.'
DUPLICATE_TODO_COMMENT_INDICATOR = 'The latest comment is the same as the new todo comment.'

class CheckForDuplicateTodoCommentTest(test_utils.GenericTestBase):
    """Unit tests for testing the check_for_duplicate_todo_comment script."""

    def setUp(self) -> None:
        super().setUp()
        if os.path.isdir(os.path.join(os.getcwd(), 'dummy_dir')):
            shutil.rmtree('dummy_dir')
        os.mkdir('dummy_dir', mode=0o777)
        with open('dummy_dir/latest_comment_one.txt', 'w', encoding='utf-8') as file:
            file.write('')
        with open('dummy_dir/todo_list_one.txt', 'w', encoding='utf-8') as file:
            content = (
                f"""
                The following todos are associated with this issue #4175:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L39
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L40
                """).lstrip('\n')
            file.write(textwrap.dedent(content))
        with open('dummy_dir/latest_comment_two.txt', 'w', encoding='utf-8') as file:
            content = (
                f"""
                The following todos are associated with this issue #4176:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L39
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L40
                """).lstrip('\n')
            file.write(textwrap.dedent(content))
        with open('dummy_dir/todo_list_two.txt', 'w', encoding='utf-8') as file:
            content = (
                f"""
                The following todos are associated with this issue #4176:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L39
                """).lstrip('\n')
            file.write(textwrap.dedent(content))
        with open('dummy_dir/latest_comment_three.txt', 'w', encoding='utf-8') as file:
            content = (
                f"""
                The following todos are associated with this issue #4177:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L39
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L40
                """).lstrip('\n')
            file.write(textwrap.dedent(content))
        with open('dummy_dir/todo_list_three.txt', 'w', encoding='utf-8') as file:
            content = (
                f"""
                The following todos are associated with this issue #4177:
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L38
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L39
                {GITHUB_PERMA_LINK_URL}/{DUMMY_SHA_ONE}/scripts/common.py#L40
                """).lstrip('\n')
            file.write(textwrap.dedent(content))

    def tearDown(self) -> None:
        super().tearDown()
        shutil.rmtree('dummy_dir')
    
    def test_check_for_duplicate_todo_comment_with_no_duplicate(self) -> None:
        with self.assertRaisesRegex(Exception, NO_DUPLICATE_TODO_COMMENT_INDICATOR):
            check_for_duplicate_todo_comment.main([
                '--repository_path=dummy_dir',
                '--latest_comment_file=latest_comment_one.txt',
                '--new_comment_file=todo_list_one.txt'
            ])

    def test_check_for_duplicate_todo_comment_with_no_duplicate_two_shas(self) -> None:
        with self.assertRaisesRegex(Exception, NO_DUPLICATE_TODO_COMMENT_INDICATOR):
            check_for_duplicate_todo_comment.main([
                '--repository_path=dummy_dir',
                '--latest_comment_file=latest_comment_two.txt',
                '--new_comment_file=todo_list_two.txt'
            ])

    def test_check_for_duplicate_todo_comment_with_duplicate(self) -> None:
        mock_stdout = io.StringIO()

        stdout_write_swap = self.swap(sys, 'stdout', mock_stdout)

        with stdout_write_swap:
            check_for_duplicate_todo_comment.main([
                '--repository_path=dummy_dir',
                '--latest_comment_file=latest_comment_three.txt',
                '--new_comment_file=todo_list_three.txt'
            ])
        self.assertEqual(mock_stdout.getvalue(), DUPLICATE_TODO_COMMENT_INDICATOR)
