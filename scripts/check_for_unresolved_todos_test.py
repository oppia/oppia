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
import json
import os
import shutil
import sys
import textwrap
import unittest
from unittest import mock

from core.tests import test_utils

from typing import Any, Dict, List

from . import check_for_unresolved_todos


class CheckForUnresolvedTodosTests(test_utils.GenericTestBase):
    """Unit tests for testing the check_for_unresolved_todos script."""

    def setUp(self) -> None:
        super().setUp()
        if os.path.isdir(os.path.join(os.getcwd(), 'check_todos_test_dir')):
            shutil.rmtree('check_todos_test_dir')
        os.mkdir('check_todos_test_dir', mode=0o777)
        with open(
            'check_todos_test_dir/file1.txt', 'w', encoding='utf-8'
        ) as file:
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
                """
            ).lstrip('\n')
            file.write(textwrap.dedent(content))
        with open(
            'check_todos_test_dir/file2.txt', 'w', encoding='utf-8'
        ) as file:
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
                """
            ).lstrip('\n')
            file.write(textwrap.dedent(content))

    def tearDown(self) -> None:
        super().tearDown()
        if os.path.isdir(os.path.join(os.getcwd(), 'check_todos_test_dir')):
            shutil.rmtree('check_todos_test_dir')

    def test_get_unresolved_todos_no_generate_github_file_should_fail(
        self,
    ) -> None:
        mock_stdout = io.StringIO()
        swap_stdout_write = self.swap(sys, 'stdout', mock_stdout)
        with swap_stdout_write, self.assertRaisesRegex(
            Exception,
            check_for_unresolved_todos.UNRESOLVED_TASKS_PRESENT_INDICATOR,
        ):
            check_for_unresolved_todos.main(
                [
                    '--repository_path=check_todos_test_dir',
                    '--issue=4151',
                    '--commit_sha=abcdefg',
                ]
            )
        expected_failure_log_lines = [
            check_for_unresolved_todos.UNRESOLVED_TASKS_HEADING_TEMPLATE.format(
                issue_number=4151
            ),
            '- file1.txt:L4',
            '- file1.txt:L11',
            '- file1.txt:L13',
            '- file2.txt:L3',
        ]
        self.assertEqual(
            mock_stdout.getvalue().splitlines(), expected_failure_log_lines
        )
        self.assertFalse(
            os.path.exists('check_todos_test_dir/unresolved_todo_list.txt')
        )

    def test_get_unresolved_todos_should_fail(self) -> None:
        mock_stdout = io.StringIO()
        swap_stdout_write = self.swap(sys, 'stdout', mock_stdout)
        with swap_stdout_write, self.assertRaisesRegex(
            Exception,
            check_for_unresolved_todos.UNRESOLVED_TASKS_PRESENT_INDICATOR,
        ):
            check_for_unresolved_todos.main(
                [
                    '--repository_path=check_todos_test_dir',
                    '--issue=4151',
                    '--commit_sha=abcdefg',
                    '--generate_github_file',
                ]
            )
        expected_failure_log_lines = [
            check_for_unresolved_todos.UNRESOLVED_TASKS_HEADING_TEMPLATE.format(
                issue_number=4151
            ),
            '- file1.txt:L4',
            '- file1.txt:L11',
            '- file1.txt:L13',
            '- file2.txt:L3',
        ]
        self.assertEqual(
            mock_stdout.getvalue().splitlines(), expected_failure_log_lines
        )
        expected_github_perma_link = (
            'https://github.com/oppia/oppia/blob/abcdefg'
        )
        expected_unresolved_todo_list_lines = [
            check_for_unresolved_todos.UNRESOLVED_TASKS_HEADING_TEMPLATE.format(
                issue_number=4151
            ),
            f'- {expected_github_perma_link}/file1.txt#L4',
            f'- {expected_github_perma_link}/file1.txt#L11',
            f'- {expected_github_perma_link}/file1.txt#L13',
            f'- {expected_github_perma_link}/file2.txt#L3',
        ]
        with open(
            'check_todos_test_dir/unresolved_todo_list.txt',
            'r',
            encoding='utf-8',
        ) as file:
            self.assertEqual(
                file.read().splitlines(), expected_unresolved_todo_list_lines
            )

    def test_get_unresolved_todos_should_succeed(self) -> None:
        mock_stdout = io.StringIO()
        swap_stdout_write = self.swap(sys, 'stdout', mock_stdout)
        with swap_stdout_write:
            check_for_unresolved_todos.main(
                [
                    '--repository_path=check_todos_test_dir',
                    '--issue=4157',
                    '--commit_sha=abcdefg',
                    '--generate_github_file',
                ]
            )
        self.assertEqual(
            mock_stdout.getvalue().strip(),
            check_for_unresolved_todos.UNRESOLVED_TASKS_NOT_PRESENT_INDICATOR,
        )

    def test_get_unresolved_todos_should_fail_without_github_output(
        self,
    ) -> None:
        """Test get_unresolved_todos with no GITHUB_OUTPUT env variable."""
        mock_stdout = io.StringIO()
        swap_stdout_write = self.swap(sys, 'stdout', mock_stdout)
        with mock.patch.dict(
            os.environ, {}, clear=True
        ), swap_stdout_write, self.assertRaisesRegex(
            Exception,
            check_for_unresolved_todos.UNRESOLVED_TASKS_PRESENT_INDICATOR,
        ):
            check_for_unresolved_todos.main(
                [
                    '--repository_path=check_todos_test_dir',
                    '--issue=4151',
                    '--commit_sha=abcdefg',
                ]
            )

        expected_failure_log_lines = [
            check_for_unresolved_todos.UNRESOLVED_TASKS_HEADING_TEMPLATE.format(
                issue_number=4151
            ),
            '- file1.txt:L4',
            '- file1.txt:L11',
            '- file1.txt:L13',
            '- file2.txt:L3',
        ]
        self.assertEqual(
            mock_stdout.getvalue().splitlines(), expected_failure_log_lines
        )

    def test_get_unresolved_todos_by_pull_request_should_fail(self) -> None:
        mock_stdout = io.StringIO()

        def mock_fetch_linked_issues_for_pull_request(
            pull_request: int,
        ) -> List[check_for_unresolved_todos.GitHubIssueDict]:
            return (
                [
                    {
                        'body': 'Issue 4151',
                        'number': 4151,
                        'title': 'Issue 4151',
                    },
                    {
                        'body': 'Issue 4156',
                        'number': 4156,
                        'title': 'Issue 4156',
                    },
                    {
                        'body': 'Issue 4153',
                        'number': 4153,
                        'title': 'Issue 4153',
                    },
                ]
                if pull_request == 1234
                else []
            )

        swap_stdout_write = self.swap(sys, 'stdout', mock_stdout)
        swap_fetch_linked_issues_for_pull_request = self.swap(
            check_for_unresolved_todos,
            'fetch_linked_issues_for_pull_request',
            mock_fetch_linked_issues_for_pull_request,
        )
        with swap_stdout_write, swap_fetch_linked_issues_for_pull_request:
            with self.assertRaisesRegex(
                Exception,
                check_for_unresolved_todos.UNRESOLVED_TASKS_PRESENT_INDICATOR,
            ):
                check_for_unresolved_todos.main(
                    [
                        '--repository_path=check_todos_test_dir',
                        '--pull_request=1234',
                        '--commit_sha=abcdefg',
                        '--generate_github_file',
                    ]
                )
        expected_failure_log_lines = [
            check_for_unresolved_todos.UNRESOLVED_TASKS_HEADING_TEMPLATE.format(
                issue_number=4151
            ),
            '- file1.txt:L4',
            '- file1.txt:L11',
            '- file1.txt:L13',
            '- file2.txt:L3',
            check_for_unresolved_todos.UNRESOLVED_TASKS_HEADING_TEMPLATE.format(
                issue_number=4156
            ),
            '- file1.txt:L6',
            check_for_unresolved_todos.UNRESOLVED_TASKS_HEADING_TEMPLATE.format(
                issue_number=4153
            ),
            '- file1.txt:L7',
        ]
        self.assertEqual(
            mock_stdout.getvalue().splitlines(), expected_failure_log_lines
        )
        expected_github_perma_link = (
            'https://github.com/oppia/oppia/blob/abcdefg'
        )
        expected_unresolved_todo_list_lines = [
            check_for_unresolved_todos.UNRESOLVED_TASKS_HEADING_TEMPLATE.format(
                issue_number=4151
            ),
            f'- {expected_github_perma_link}/file1.txt#L4',
            f'- {expected_github_perma_link}/file1.txt#L11',
            f'- {expected_github_perma_link}/file1.txt#L13',
            f'- {expected_github_perma_link}/file2.txt#L3',
            check_for_unresolved_todos.UNRESOLVED_TASKS_HEADING_TEMPLATE.format(
                issue_number=4156
            ),
            f'- {expected_github_perma_link}/file1.txt#L6',
            check_for_unresolved_todos.UNRESOLVED_TASKS_HEADING_TEMPLATE.format(
                issue_number=4153
            ),
            f'- {expected_github_perma_link}/file1.txt#L7',
        ]
        with open(
            'check_todos_test_dir/unresolved_todo_list.txt',
            'r',
            encoding='utf-8',
        ) as file:
            self.assertEqual(
                file.read().splitlines(), expected_unresolved_todo_list_lines
            )


class HelperFunctionsTests(unittest.TestCase):
    """Unit tests for helper functions in check_for_unresolved_todos.py."""  # pylint: disable=too-many-public-methods

    def test_deep_get_with_valid_keys(self) -> None:
        """Test deep_get function with valid nested keys."""
        test_data = {'level1': {'level2': {'level3': 'value'}}}
        result = check_for_unresolved_todos.deep_get(
            test_data, ['level1', 'level2', 'level3']
        )
        self.assertEqual(result, 'value')

    def test_deep_get_with_missing_keys(self) -> None:
        """Test deep_get function with missing keys."""
        test_data = {'level1': {'level2': 'value'}}
        result = check_for_unresolved_todos.deep_get(
            test_data, ['level1', 'missing', 'level3']
        )
        self.assertIsNone(result)

    def test_deep_get_with_empty_keys(self) -> None:
        """Test deep_get function with empty keys list."""
        test_data = {'key': 'value'}
        result = check_for_unresolved_todos.deep_get(test_data, [])
        self.assertEqual(result, test_data)

    def test_deep_get_with_none_data(self) -> None:
        """Test deep_get function with None data."""
        result = check_for_unresolved_todos.deep_get(None, ['key1', 'key2'])
        self.assertIsNone(result)

    def test_get_github_api_authorization_header(self) -> None:
        """Test get_github_api_authorization_header function."""
        with mock.patch.object(
            check_for_unresolved_todos,
            'get_github_auth_token',
            return_value='test_token_value',
        ):
            header = (
                check_for_unresolved_todos.get_github_api_authorization_header()
            )
            self.assertEqual(header, 'Bearer test_token_value')

    def test_run_graphql_query_success(self) -> None:
        """Test run_graphql_query function with successful response."""
        expected_response = {
            'repository': {
                'pullRequest': {
                    'closingIssuesReferences': {
                        'nodes': [{'number': 123, 'title': 'Issue'}]
                    }
                }
            }
        }

        mock_response = mock.MagicMock()
        mock_response.__enter__.return_value.getcode.return_value = 200
        mock_response.__enter__.return_value.read.return_value = json.dumps(
            {'data': expected_response}
        ).encode('utf-8')

        with mock.patch(
            'urllib.request.urlopen', return_value=mock_response
        ), mock.patch(
            'scripts.check_for_unresolved_todos.get_github_api_authorization_header',
            return_value='Bearer test_token',
        ):
            result = check_for_unresolved_todos.run_graphql_query('test query')
            self.assertEqual(result, expected_response)

    def test_fetch_linked_issues_for_pull_request(self) -> None:
        """Test fetch_linked_issues_for_pull_request function."""
        expected_issues = [
            {'body': 'Issue body', 'number': 123, 'title': 'Issue title'}
        ]
        expected_response = {
            'repository': {
                'pullRequest': {
                    'closingIssuesReferences': {'nodes': expected_issues}
                }
            }
        }

        with mock.patch.object(
            check_for_unresolved_todos,
            'run_graphql_query',
            return_value=expected_response,
        ):
            issues = (
                check_for_unresolved_todos.fetch_linked_issues_for_pull_request(
                    123
                )
            )
            self.assertEqual(issues, expected_issues)

    def test_fetch_linked_issues_for_nonexistent_pull_request(self) -> None:
        """Test fetch_linked_issues_for_pull_request with non-existent PR."""
        response_data = {'repository': {'pullRequest': None}}

        with mock.patch.object(
            check_for_unresolved_todos,
            'run_graphql_query',
            return_value=response_data,
        ):
            with self.assertRaisesRegex(
                Exception, 'The pull request \\(#999\\) does not exist.'
            ):
                check_for_unresolved_todos.fetch_linked_issues_for_pull_request(
                    999
                )

    def test_fetch_latest_comment_for_issue(self) -> None:
        """Test fetch_latest_comment_for_issue function."""
        expected_comment = {'body': 'Latest comment'}
        expected_response = {
            'repository': {'issue': {'comments': {'nodes': [expected_comment]}}}
        }

        with mock.patch.object(
            check_for_unresolved_todos,
            'run_graphql_query',
            return_value=expected_response,
        ):
            comment = check_for_unresolved_todos.fetch_latest_comment_for_issue(
                123
            )
            self.assertEqual(comment, expected_comment)

    def test_fetch_latest_comment_for_nonexistent_issue(self) -> None:
        """Test fetch_latest_comment_for_issue with non-existent issue."""
        response_data = {'repository': {'issue': None}}

        with mock.patch.object(
            check_for_unresolved_todos,
            'run_graphql_query',
            return_value=response_data,
        ):
            with self.assertRaisesRegex(
                Exception, 'The issue \\(#888\\) does not exist.'
            ):
                check_for_unresolved_todos.fetch_latest_comment_for_issue(888)

    def test_fetch_latest_comment_from_pull_request(self) -> None:
        """Test fetch_latest_comment_from_pull_request function."""
        expected_comment = {'body': 'PR comment'}
        expected_response = {
            'repository': {
                'pullRequest': {'comments': {'nodes': [expected_comment]}}
            }
        }

        with mock.patch.object(
            check_for_unresolved_todos,
            'run_graphql_query',
            return_value=expected_response,
        ):
            comment = check_for_unresolved_todos.fetch_latest_comment_from_pull_request(
                456
            )
            self.assertEqual(comment, expected_comment)

    def test_fetch_latest_comment_from_nonexistent_pull_request(self) -> None:
        """Test fetch_latest_comment_from_pull_request with non-existent PR."""
        response_data = {'repository': {'pullRequest': None}}

        with mock.patch.object(
            check_for_unresolved_todos,
            'run_graphql_query',
            return_value=response_data,
        ):
            with self.assertRaisesRegex(
                Exception, 'The pull request \\(#555\\) does not exist.'
            ):
                check_for_unresolved_todos.fetch_latest_comment_from_pull_request(
                    555
                )

    def test_fetch_latest_comment_for_issue_no_comments(self) -> None:
        """Test fetch_latest_comment_for_issue when issue has no comments."""
        # Here we use type Any because GraphQL responses contain nested dictionaries
        # with dynamic structures and values of various types (strings, ints, lists).
        expected_response: Dict[str, Any] = {
            'repository': {'issue': {'comments': {'nodes': []}}}
        }

        with mock.patch.object(
            check_for_unresolved_todos,
            'run_graphql_query',
            return_value=expected_response,
        ):
            comment = check_for_unresolved_todos.fetch_latest_comment_for_issue(
                123
            )
            self.assertIsNone(comment)

    def test_fetch_latest_comment_from_pull_request_no_comments(self) -> None:
        """Test fetch_latest_comment_from_pull_request when PR has no comments."""
        # Here we use type Any because GraphQL responses contain nested dictionaries
        # with dynamic structures and values of various types (strings, ints, lists).
        expected_response: Dict[str, Any] = {
            'repository': {'pullRequest': {'comments': {'nodes': []}}}
        }

        with mock.patch.object(
            check_for_unresolved_todos,
            'run_graphql_query',
            return_value=expected_response,
        ):
            comment = check_for_unresolved_todos.fetch_latest_comment_from_pull_request(
                456
            )
            self.assertIsNone(comment)

    def test_get_github_auth_token_with_gh_cli_fallback(self) -> None:
        """Test get_github_auth_token with GitHub CLI fallback."""

        def mock_subprocess_run(  # pylint: disable=unused-argument
            cmd: List[str], *args: str, **kwargs: str
        ) -> mock.MagicMock:
            """Mock subprocess.run for GitHub CLI commands."""
            mock_process = mock.MagicMock()
            if 'help' in cmd:
                mock_process.returncode = 0
            elif 'auth' in cmd and 'token' in cmd:
                mock_process.stdout = 'cli_test_token'
                mock_process.returncode = 0
            return mock_process

        with mock.patch.dict(os.environ, {}, clear=True), mock.patch(
            'scripts.check_for_unresolved_todos.subprocess.run',
            side_effect=mock_subprocess_run,
        ):
            token = check_for_unresolved_todos.get_github_auth_token()
            self.assertEqual(token, 'cli_test_token')

    def test_get_github_auth_token_from_environment_variable(self) -> None:
        """Test get_github_auth_token with token from environment variables."""
        with mock.patch.dict(os.environ, {'GH_TOKEN': 'env_test_token'}):
            token = check_for_unresolved_todos.get_github_auth_token()
            self.assertEqual(token, 'env_test_token')

    def test_get_github_auth_token_gh_cli_not_installed(self) -> None:
        """Test get_github_auth_token when GitHub CLI is not installed."""

        def mock_subprocess_run(  # pylint: disable=unused-argument
            cmd: List[str], *args: str, **kwargs: str
        ) -> mock.MagicMock:
            """Mock subprocess.run with gh CLI not installed."""
            mock_process = mock.MagicMock()
            mock_process.returncode = 1
            return mock_process

        with mock.patch.dict(os.environ, {}, clear=True), mock.patch(
            'scripts.check_for_unresolved_todos.subprocess.run',
            side_effect=mock_subprocess_run,
        ):
            with self.assertRaisesRegex(
                RuntimeError, 'GitHub CLI is not installed'
            ):
                check_for_unresolved_todos.get_github_auth_token()

    def test_get_github_auth_token_gh_cli_auth_failed(self) -> None:
        """Test get_github_auth_token when GitHub CLI auth fails."""

        def mock_subprocess_run(  # pylint: disable=unused-argument
            cmd: List[str], *args: str, **kwargs: str
        ) -> mock.MagicMock:
            """Mock subprocess.run for GitHub CLI."""
            mock_process = mock.MagicMock()
            if 'help' in cmd:
                mock_process.returncode = 0
            elif 'auth' in cmd and 'token' in cmd:
                mock_process.returncode = 1
            return mock_process

        with mock.patch.dict(os.environ, {}, clear=True), mock.patch(
            'scripts.check_for_unresolved_todos.subprocess.run',
            side_effect=mock_subprocess_run,
        ):
            with self.assertRaisesRegex(
                RuntimeError, 'Failed to get GitHub auth token'
            ):
                check_for_unresolved_todos.get_github_auth_token()

    def test_run_graphql_query_non_200_status(self) -> None:
        """Test run_graphql_query with non-200 HTTP status."""
        mock_response = mock.MagicMock()
        mock_response.__enter__.return_value.getcode.return_value = 400
        mock_response.__enter__.return_value.read.return_value = json.dumps(
            {'errors': 'Invalid query'}
        ).encode('utf-8')

        with mock.patch(
            'urllib.request.urlopen', return_value=mock_response
        ), mock.patch(
            'scripts.check_for_unresolved_todos.get_github_api_authorization_header',
            return_value='Bearer test_token',
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                'Failed to run the GraphQL query due to an API error',
            ):
                check_for_unresolved_todos.run_graphql_query('test query')

    def test_run_graphql_query_request_exception(self) -> None:
        """Test run_graphql_query with network request exception."""
        with mock.patch(
            'urllib.request.urlopen', side_effect=Exception('Network error')
        ), mock.patch(
            'scripts.check_for_unresolved_todos.get_github_api_authorization_header',
            return_value='Bearer test_token',
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                'Failed to run the GraphQL query due to a request error',
            ):
                check_for_unresolved_todos.run_graphql_query('test query')
