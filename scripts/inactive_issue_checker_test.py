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
import unittest.mock

from scripts import inactive_issue_checker

import requests


class TestInactiveIssueChecker(unittest.TestCase):
    """Test the inactive issue checker script."""

    def setUp(self) -> None:
        self.current_time = datetime.datetime.now(datetime.timezone.utc)
        self.mock_get_patcher = unittest.mock.patch('requests.get')
        self.mock_delete_patcher = unittest.mock.patch('requests.delete')
        self.mock_post_patcher = unittest.mock.patch('requests.post')
        self.mock_get = self.mock_get_patcher.start()
        self.mock_delete = self.mock_delete_patcher.start()
        self.mock_post = self.mock_post_patcher.start()

    def tearDown(self) -> None:
        self.mock_get_patcher.stop()
        self.mock_delete_patcher.stop()
        self.mock_post_patcher.stop()

    def test_issue_without_assignee_is_skipped(self) -> None:
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [{
            'number': 1,
            'events_url': 'mock_events_url',
            'assignee': None
        }]

        mock_collaborators_response = unittest.mock.Mock()
        mock_collaborators_response.json.return_value = []

        mock_pulls_response = unittest.mock.Mock()
        mock_pulls_response.json.return_value = []

        self.mock_get.side_effect = [
            mock_issues_response,
            mock_collaborators_response,
            mock_pulls_response
        ]

        inactive_issues = inactive_issue_checker.get_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.assertEqual(len(inactive_issues), 0)
        self.assertEqual(self.mock_get.call_count, 3)

    def test_invalid_issue_format(self) -> None:
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [None, 'not_a_dict', {}]

        mock_collaborators_response = unittest.mock.Mock()
        mock_collaborators_response.json.return_value = []

        mock_pulls_response = unittest.mock.Mock()
        mock_pulls_response.json.return_value = []

        self.mock_get.side_effect = [
            mock_issues_response,
            mock_collaborators_response,
            mock_pulls_response
        ]

        inactive_issues = inactive_issue_checker.get_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.assertEqual(len(inactive_issues), 0)
        self.assertEqual(self.mock_get.call_count, 3)

    def test_empty_events(self) -> None:
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [{
            'number': 1,
            'assignee': {'login': 'user123'},
            'events_url': 'mock_events_url',
            'body': ''
        }]
        self.mock_get.side_effect = [
            mock_issues_response,
            unittest.mock.Mock(json=lambda: []),
            unittest.mock.Mock(json=lambda: []),
            unittest.mock.Mock(json=lambda: [])
        ]

        inactive_issues = inactive_issue_checker.get_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.assertEqual(len(inactive_issues), 0)
        self.assertEqual(self.mock_get.call_count, 4)

    def test_nested_assignee_login_access(self) -> None:
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [{
            'number': 1,
            'assignee': {'login': 'test_user'},
            'events_url': 'mock_events_url',
            'events': [{
                'created_at': (
                    self.current_time - datetime.timedelta(days=10))
                    .strftime('%Y-%m-%dT%H:%M:%SZ'),
                'event': 'assigned'
            }]
        }]

        mock_collaborators_response = unittest.mock.Mock()
        mock_collaborators_response.json.return_value = [
            {'login': 'other_user'}
        ]

        mock_pulls_response = unittest.mock.Mock()
        mock_pulls_response.json.return_value = []

        self.mock_get.side_effect = [
            mock_issues_response,
            mock_collaborators_response,
            mock_pulls_response,
            unittest.mock.Mock(json=lambda: [])
        ]

        inactive_issues = inactive_issue_checker.get_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.assertEqual(len(inactive_issues), 0)

    def test_error_during_unassignment(self) -> None:
        mock_delete_response = unittest.mock.Mock(status_code=500)
        self.mock_delete.return_value = mock_delete_response

        inactive_issues = [{
            'number': 1,
            'assignee': 'user123'
        }]

        inactive_issue_checker.unassign_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo', inactive_issues)

        self.mock_delete.assert_called_once()
        self.mock_post.assert_not_called()

    def test_issue_with_related_pr(self) -> None:
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [{
            'number': 3,
            'assignee': {'login': 'user789'},
            'events_url': 'mock_events_url',
            'events': [{
                'created_at': (
                    self.current_time - datetime.timedelta(days=10))
                    .strftime('%Y-%m-%dT%H:%M:%SZ'),
                'event': 'assigned'
            }]
        }]

        mock_collaborators_response = unittest.mock.Mock()
        mock_collaborators_response.json.return_value = []

        mock_pulls_response = unittest.mock.Mock()
        mock_pulls_response.json.return_value = [
            {'body': 'This fixes issue #3'}
        ]

        self.mock_get.side_effect = [
            mock_issues_response,
            mock_collaborators_response,
            mock_pulls_response,
            unittest.mock.Mock(json=lambda: [])
        ]

        inactive_issues = inactive_issue_checker.get_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.assertEqual(len(inactive_issues), 0)

    def test_exception_handling_in_unassignment(self) -> None:
        self.mock_delete.side_effect = requests.RequestException(
            'Connection error'
        )

        inactive_issues = [{
            'number': 1,
            'assignee': 'test_user'
        }]

        inactive_issue_checker.unassign_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo', inactive_issues)

        self.mock_delete.assert_called_once()
        self.mock_post.assert_not_called()


if __name__ == '__main__':
    unittest.main()
