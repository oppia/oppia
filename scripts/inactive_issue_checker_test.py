# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for scripts/inactive_issue_checker.py."""

from __future__ import annotations

import datetime
import unittest
from unittest import mock

from scripts import inactive_issue_checker as checker

from typing import Dict, Optional, TypedDict

INACTIVE_DAYS_THRESHOLD = 7
UNASSIGN_DAYS_THRESHOLD = 10


class IssueDict(TypedDict, total=False):
    """Dict representation of a GitHub issue."""

    number: int
    assignee: Optional[Dict[str, str]]
    events_url: str


class TestIssue(unittest.TestCase):
    """Test Issue class."""

    def test_from_github_data(self) -> None:
        """Test Issue creation from GitHub data."""
        data: IssueDict = {
            'number': 123,
            'assignee': {'login': 'testuser'},
            'events_url': 'https://api.github.com/events'
        }

        issue = checker.Issue.from_github_data(data)
        self.assertEqual(issue.number, 123)
        self.assertEqual(issue.assignee_username, 'testuser')
        self.assertEqual(issue.events_url, 'https://api.github.com/events')

    def test_is_inactive(self) -> None:
        """Test issue inactivity check."""
        now = datetime.datetime.now(datetime.timezone.utc)
        active_date = now - datetime.timedelta(days=5)
        inactive_date = now - datetime.timedelta(days=10)

        active_issue = checker.Issue(1, 'user1', 'url', active_date)
        inactive_issue = checker.Issue(2, 'user2', 'url', inactive_date)
        no_date_issue = checker.Issue(3, 'user3', 'url')

        self.assertFalse(active_issue.is_inactive_for_seven_days())
        self.assertTrue(inactive_issue.is_inactive_for_seven_days())
        self.assertFalse(no_date_issue.is_inactive_for_seven_days())


class TestGitHubService(unittest.TestCase):
    """Test GitHubService class."""

    def setUp(self) -> None:
        self.service = checker.GitHubService('test_token', 'owner', 'repo')
        self.base_url = 'https://api.github.com/repos/owner/repo'

    @mock.patch('requests.get')
    def test_get_open_issues(self, mock_get: mock.MagicMock) -> None:
        """Test fetching open issues."""
        mock_response = mock.Mock()
        mock_response.json.return_value = [
            {
                'number': 1,
                'assignee': {'login': 'user1'},
                'events_url': f'{self.base_url}/issues/1/events'
            },
            {
                'number': 2,
                'assignee': None,
                'events_url': f'{self.base_url}/issues/2/events'
            }
        ]
        mock_get.return_value = mock_response

        issues = self.service.get_open_issues()

        self.assertEqual(len(issues), 2)
        self.assertEqual(issues[0].number, 1)
        self.assertEqual(issues[0].assignee_username, 'user1')
        self.assertIsNone(issues[1].assignee_username)

        mock_get.assert_called_once_with(
            f'{self.base_url}/issues?state=open',
            headers=self.service.rest_headers,
            timeout=10
        )

    @mock.patch('requests.get')
    def test_get_collaborators(self, mock_get: mock.MagicMock) -> None:
        """Test fetching repository collaborators."""
        mock_response = mock.Mock()
        mock_response.json.return_value = [
            {'login': 'collab1'},
            {'login': 'collab2'}
        ]
        mock_get.return_value = mock_response

        collaborators = self.service.get_collaborators()

        self.assertEqual(collaborators, {'collab1', 'collab2'})
        mock_get.assert_called_once_with(
            f'{self.base_url}/collaborators',
            headers=self.service.rest_headers,
            timeout=10
        )

    @mock.patch('requests.get')
    def test_get_issue_events(self, mock_get: mock.MagicMock) -> None:
        """Test fetching issue events."""
        mock_response = mock.Mock()
        mock_response.json.return_value = [
            {'created_at': '2024-01-01T10:00:00Z'},
            {'created_at': '2024-01-02T10:00:00Z'}
        ]
        mock_get.return_value = mock_response

        issue = checker.Issue(1, 'user1', 'events_url')
        latest_date = self.service.get_issue_events(issue)

        expected_date = datetime.datetime(
            2024, 1, 2, 10, 0, tzinfo=datetime.timezone.utc
        )
        self.assertEqual(latest_date, expected_date)

        mock_get.assert_called_once_with(
            issue.events_url,
            headers=self.service.rest_headers,
            timeout=10
        )

    @mock.patch('requests.post')
    def test_get_issues_with_prs(self, mock_post: mock.MagicMock) -> None:
        """Test fetching issues with PRs using GraphQL."""
        mock_responses = [
            {
                'data': {
                    'repository': {
                        'pullRequests': {
                            'pageInfo': {
                                'hasNextPage': False,
                                'endCursor': None
                            },
                            'nodes': [
                                {
                                    'number': 100,
                                    'closingIssuesReferences': {
                                        'nodes': [{'number': 1}]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        ]

        mock_objects = []
        for resp in mock_responses:
            mock_object = mock.Mock()
            mock_object.json = lambda resp=resp: resp
            mock_objects.append(mock_object)

        mock_post.side_effect = mock_objects
        issues_with_prs = self.service.get_issues_with_prs()

        self.assertEqual(issues_with_prs, {1: 100})
        self.assertEqual(mock_post.call_count, 1)

    @mock.patch('requests.delete')
    def test_unassign_issue(self, mock_delete: mock.MagicMock) -> None:
        """Test unassigning an issue."""
        mock_delete.return_value = mock.Mock(status_code=200)

        issue = checker.Issue(1, 'user1', 'events_url')
        success = self.service.unassign_issue(issue)

        self.assertTrue(success)
        mock_delete.assert_called_once_with(
            f'{self.base_url}/issues/1/assignees',
            headers=self.service.rest_headers,
            json={'assignees': ['user1']},
            timeout=10
        )

    @mock.patch('requests.post')
    def test_comment_on_issue(self, mock_post: mock.MagicMock) -> None:
        """Test commenting on an issue."""
        issue = checker.Issue(1, 'user1', 'events_url')
        self.service.alerting_comment_on_issue(issue)

        expected_comment = (
            f'Hi @user1 this PR is inactive '
            f'for {INACTIVE_DAYS_THRESHOLD} and you will be '
            f'unassigned soon if no activity is done. '
            f'If you are still working on this PR, '
            f'please make a follow-up commit within'
            f'{UNASSIGN_DAYS_THRESHOLD-INACTIVE_DAYS_THRESHOLD} '
            f'(and submit it for review, if applicable). '
            f'Please also let us know if you are stuck so we can help you!'
        )

        mock_post.assert_called_once_with(
            f'{self.base_url}/issues/1/comments',
            headers=self.service.rest_headers,
            json={'body': expected_comment},
            timeout=10
        )

    @mock.patch('requests.get')
    def test_get_issue_events_empty(self, mock_get: mock.MagicMock) -> None:
        """Test fetching issue events when there are no events."""
        mock_response = mock.Mock()
        mock_response.json.return_value = []
        mock_get.return_value = mock_response

        issue = checker.Issue(1, 'user1', 'events_url')
        latest_date = self.service.get_issue_events(issue)

        self.assertIsNone(latest_date)
        mock_get.assert_called_once_with(
            issue.events_url,
            headers=self.service.rest_headers,
            timeout=10
        )


class TestIssueManager(unittest.TestCase):
    """Test IssueManager class."""

    def setUp(self) -> None:
        self.github_service = mock.Mock()
        self.manager = checker.IssueManager(self.github_service)

    def test_get_inactive_issues(self) -> None:
        """Test identifying inactive issues."""
        now = datetime.datetime.now(datetime.timezone.utc)

        active_issue = checker.Issue(1, 'user1', 'url1')
        active_issue.last_active_date = now - datetime.timedelta(days=5)

        inactive_issue = checker.Issue(2, 'user2', 'url2')
        inactive_issue.last_active_date = now - datetime.timedelta(days=10)

        collaborator_issue = checker.Issue(3, 'collab1', 'url3')
        pr_linked_issue = checker.Issue(4, 'user3', 'url4')

        self.github_service.get_open_issues.return_value = [
            active_issue, inactive_issue, collaborator_issue, pr_linked_issue
        ]
        self.github_service.get_collaborators.return_value = {'collab1'}
        self.github_service.get_issues_with_prs.return_value = {4: 100}
        self.github_service.get_issue_events.side_effect = [
            active_issue.last_active_date,
            inactive_issue.last_active_date
        ]
        inactive_issues = self.manager.get_inactive_issues()
        self.assertEqual(len(inactive_issues), 1)
        self.assertEqual(inactive_issues[0], inactive_issue)

    def test_unassign_issues(self) -> None:
        """Test unassigning multiple issues."""
        issues = [
            checker.Issue(1, 'user1', 'url1'),
            checker.Issue(2, 'user2', 'url2')
        ]

        self.github_service.unassign_issue.side_effect = [True, False]
        self.manager.unassign_issues(issues)
        self.assertEqual(self.github_service.unassign_issue.call_count, 2)
        # self.assertEqual(self.github_service.comment_on_issue.call_count, 1)

    def test_get_inactive_issues_no_assignee(self) -> None:
        """Test handling issues with no assignee."""
        unassigned_issue = checker.Issue(1, None, 'url1')

        self.github_service.get_open_issues.return_value = [unassigned_issue]
        self.github_service.get_collaborators.return_value = set()
        self.github_service.get_issues_with_prs.return_value = {}

        inactive_issues = self.manager.get_inactive_issues()

        self.assertEqual(len(inactive_issues), 0)
        self.github_service.get_issue_events.assert_not_called()


if __name__ == '__main__':
    unittest.main()
