# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for scripts/extract_issues_from_pull_request."""

from __future__ import annotations

import os
import shutil
import textwrap
 
from core.tests import test_utils

from . import extract_issues_from_pull_request


class ExtractIssuesFromPullRequestTests(test_utils.GenericTestBase):
    """Test the extract_issues_from_pull_request script."""

    def setUp(self) -> None:
        super().setUp()
        if os.path.isdir(os.path.join(os.getcwd(), 'dummy_dir')):
            shutil.rmtree('dummy_dir')
        os.mkdir('dummy_dir')
        with open('dummy_dir/pr_body.txt', 'w', encoding='utf-8') as file:
            content = (
                """
                1. This PR fixes the following issues:
                - Fixes #1234.
                """)
            file.write(textwrap.dedent(content))
        with open(
            'dummy_dir/pr_body_partial_fix.txt', 'w',
            encoding='utf-8'
        ) as file:
            content = (
                """
                1. This PR fixes the following issues:
                - Fixes part of #12345.
                """)
            file.write(textwrap.dedent(content))
        with open(
            'dummy_dir/pr_body_multiple_fixes.txt', 'w',
            encoding='utf-8'
        ) as file:
            content = (
                """
                1. This PR fixes the following issues:
                - Fixes #1234.
                - Fixes #12345.
                - Fixes part of #123456.
                """)
            file.write(textwrap.dedent(content))

    def tearDown(self) -> None:
        super().tearDown()
        shutil.rmtree('dummy_dir')

    def test_extract_issues_from_pull_request_with_one_issue(self) -> None:
        extract_issues_from_pull_request.main([
            '--repository_path=dummy_dir',
            '--pull_request_file=dummy_dir/pr_body.txt'])
        with open('dummy_dir/issue_list.txt', 'r', encoding='utf-8') as file:
            self.assertItemsEqual(
                file.read().splitlines(), ['1234'])

    def test_extract_issues_from_pull_request_with_partial_issue(self) -> None:
        extract_issues_from_pull_request.main([
            '--repository_path=dummy_dir',
            '--pull_request_file=dummy_dir/pr_body_partial_fix.txt'])
        with open('dummy_dir/issue_list.txt', 'r', encoding='utf-8') as file:
            self.assertItemsEqual(
                file.read().splitlines(), [])

    def test_extract_issues_from_pull_request_with_multiple_issues(
            self
    ) -> None:
        extract_issues_from_pull_request.main([
            '--repository_path=dummy_dir',
            '--pull_request_file=dummy_dir/pr_body_multiple_fixes.txt'])
        with open('dummy_dir/issue_list.txt', 'r', encoding='utf-8') as file:
            self.assertItemsEqual(
                file.read().splitlines(), ['1234', '12345'])
