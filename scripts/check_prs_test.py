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

"""Unit tests for PR monitoring script."""

from __future__ import annotations

import datetime
import unittest
from unittest import mock
from datetime import timedelta, timezone
from typing import Any

import requests

from scripts import check_prs as pr_monitor


class PullRequestMonitorTests(unittest.TestCase):
    """Test cases for PR monitoring functionality."""

    def setUp(self) -> None:
        super().setUp()
        self.mock_headers = {
            'Authorization': 'Bearer test_token',
            'Accept': 'application/vnd.github.v3+json'
        }
        self.mock_pr = {
            'number': 123,
            'user': {'login': 'test_user'},
            'body': 'Fixes #456',
            'updated_at': '2024-01-01T00:00:00Z',
            'assignees': [],
            'html_url': 'http://github.com/pr/123'
        }
        self.mock_commit = {
            'commit': {
                'committer': {'date': '2024-01-01T00:00:00Z'}
            },
            'html_url': 'http://github.com/commit/abc'
        }
        self.mock_issue = {
            'number': 456,
            'assignees': [{'login': 'test_user'}],
            'state': 'open'
        }

        patcher = mock.patch('scripts.check_prs.requests')
        self.mock_requests = patcher.start()
        self.addCleanup(patcher.stop)

        env_patcher = mock.patch.dict(
            'os.environ',
            {'GITHUB_REPOSITORY': 'test/repo', 'GITHUB_TOKEN': 'test_token'}
        )
        env_patcher.start()
        self.addCleanup(env_patcher.stop)

    def test_get_prs_success(self) -> None:
        self.mock_requests.get.return_value.json.return_value = [self.mock_pr]
        self.mock_requests.get.return_value.raise_for_status.return_value = None

        result = pr_monitor.get_prs()
        self.assertEqual(len(result), 1)
        self.mock_requests.get.assert_called_once_with(
            f'{pr_monitor.GITHUB_API_URL}/repos/test/repo/pulls',
            headers=self.mock_headers
        )

    def test_get_prs_http_error(self) -> None:
        self.mock_requests.get.return_value.raise_for_status.side_effect = (
            requests.HTTPError('Error')
        )

        with self.assertRaises(requests.HTTPError):
            pr_monitor.get_prs()

    def test_get_pr_commits_success(self) -> None:
        self.mock_requests.get.return_value.json.return_value = [self.mock_commit]
        commits = pr_monitor.get_pr_commits(123)
        self.assertEqual(len(commits), 1)
        self.mock_requests.get.assert_called_once_with(
            f'{pr_monitor.GITHUB_API_URL}/repos/test/repo/pulls/123/commits',
            headers=self.mock_headers
        )

    def test_comment_on_pr_success(self) -> None:
        pr_monitor.comment_on_pr(123, 'test message')
        self.mock_requests.post.assert_called_once_with(
            f'{pr_monitor.GITHUB_API_URL}/repos/test/repo/issues/123/comments',
            headers=self.mock_headers,
            json={'body': 'test message'}
        )

    def test_close_pr_success(self) -> None:
        pr_monitor.close_pr(123)
        self.mock_requests.patch.assert_called_once_with(
            f'{pr_monitor.GITHUB_API_URL}/repos/test/repo/pulls/123',
            headers=self.mock_headers,
            json={'state': 'closed'}
        )

    def test_get_issue_success(self) -> None:
        self.mock_requests.get.return_value.json.return_value = self.mock_issue
        issue = pr_monitor.get_issue(456)
        self.assertEqual(issue['number'], 456)
        self.mock_requests.get.assert_called_once_with(
            f'{pr_monitor.GITHUB_API_URL}/repos/test/repo/issues/456',
            headers=self.mock_headers
        )

    def test_unassign_author_success(self) -> None:
        pr_monitor.unassign_author(456, 'test_user')
        self.mock_requests.delete.assert_called_once_with(
            f'{pr_monitor.GITHUB_API_URL}/repos/test/repo/issues/456/assignees',
            headers=self.mock_headers,
            json={'assignees': ['test_user']}
        )

    def test_extract_issue_numbers(self) -> None:
        test_cases = [
            ('Fixes #123', [123]),
            ('Closes issue #456 and resolves #789', [456, 789]),
            ('No issues mentioned', []),
            ('FixES #123 and CLOSES #456', [123, 456]),
        ]

        for body, expected in test_cases:
            with self.subTest(body=body):
                result = pr_monitor.extract_issue_numbers(body)
                self.assertEqual(result, expected)

    @mock.patch('scripts.check_prs.datetime')
    def test_main_workflow(self, mock_datetime: Any) -> None:
        # Setup test data
        mock_now = datetime.datetime(2024, 1, 15, tzinfo=timezone.utc)
        mock_datetime.now.return_value = mock_now
        mock_datetime.side_effect = lambda *args, **kw: datetime.datetime(*args, **kw)
        mock_datetime.strptime.side_effect = datetime.datetime.strptime

        # Create test PRs with different activity states
        active_pr = dict(
            self.mock_pr,
            number=1,
            updated_at='2024-01-14T00:00:00Z',
            assignees=[{'login': 'reviewer'}]
        )
        warning_pr = dict(
            self.mock_pr,
            number=2,
            updated_at='2024-01-07T00:00:00Z'
        )
        stale_pr = dict(
            self.mock_pr,
            number=3,
            updated_at='2024-01-01T00:00:00Z'
        )

        # Mock external calls
        pr_monitor.get_prs = mock.Mock(return_value=[active_pr, warning_pr, stale_pr])
        pr_monitor.get_pr_commits = mock.Mock(return_value=[])
        pr_monitor.comment_on_pr = mock.Mock()
        pr_monitor.close_pr = mock.Mock()
        pr_monitor.get_issue = mock.Mock(return_value=self.mock_issue)
        pr_monitor.unassign_author = mock.Mock()

        pr_monitor.main()

        # active PR handling
        pr_monitor.comment_on_pr.assert_not_called()

        # warning PR handling
        pr_monitor.comment_on_pr.assert_any_call(
            2, '@test_user Please assign a reviewer to this pull request.'
        )
        pr_monitor.comment_on_pr.assert_any_call(
            2, 'This pull request has been inactive for over 7 days. Please update.'
        )

        # stale PR handling
        pr_monitor.close_pr.assert_called_once_with(3)
        pr_monitor.unassign_author.assert_called_once_with(456, 'test_user')

    def test_missing_environment_variables(self) -> None:
        with mock.patch.dict('os.environ', clear=True):
            with self.assertRaises(SystemExit):
                pr_monitor.main()

    @mock.patch('scripts.check_prs.get_prs')
    def test_empty_repository_state(self, mock_get_prs: Any) -> None:
        mock_get_prs.return_value = []
        pr_monitor.main()

    @mock.patch('scripts.check_prs.get_pr_commits')
    def test_pr_with_multiple_commits(self, mock_get_commits: Any) -> None:
        mock_get_commits.return_value = [
            {'commit': {'committer': {'date': '2024-01-05T00:00:00Z'}}},
            {'commit': {'committer': {'date': '2024-01-10T00:00:00Z'}}}
        ]
        pr = dict(self.mock_pr, updated_at='2024-01-01T00:00:00Z')
        pr_monitor.handle_inactive_pr(pr)
        pr_monitor.comment_on_pr.assert_not_called()

    @mock.patch('scripts.check_prs.close_pr')
    def test_pr_closing_failure(self, mock_close_pr: Any) -> None:
        mock_close_pr.side_effect = requests.HTTPError('Error')
        pr = dict(
            self.mock_pr,
            updated_at='2024-01-01T00:00:00Z',
            body='Fixes #456'
        )
        with self.assertRaises(requests.HTTPError):
            pr_monitor.handle_inactive_pr(pr)
        pr_monitor.unassign_author.assert_not_called()
