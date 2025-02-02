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


class TestCheckInactiveIssues(unittest.TestCase):
    """Test suite for the inactive_issue_checker function."""

    def setUp(self) -> None:
        """Set up test cases."""
        self.current_time = datetime.datetime.now(datetime.timezone.utc)
        self.mock_get_patcher = unittest.mock.patch('requests.get')
        self.mock_delete_patcher = unittest.mock.patch('requests.delete')
        self.mock_post_patcher = unittest.mock.patch('requests.post')
        self.mock_get = self.mock_get_patcher.start()
        self.mock_delete = self.mock_delete_patcher.start()
        self.mock_post = self.mock_post_patcher.start()

    def tearDown(self) -> None:
        """Tear down test cases."""
        self.mock_get_patcher.stop()
        self.mock_delete_patcher.stop()
        self.mock_post_patcher.stop()

    def test_issue_without_assignee_is_skipped(self) -> None:
        """Test that issues without assignees are skipped."""
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [{
            'number': 1,
            'events_url': 'mock_events_url',
            'body': ''
        }]
        self.mock_get.return_value = mock_issues_response
        inactive_issue_checker.check_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.assertEqual(self.mock_get.call_count, 1)
        self.mock_delete.assert_not_called()
        self.mock_post.assert_not_called()

    def test_invalid_issue_format(self) -> None:
        """Test handling of invalid issue format."""
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [None, 'not_a_dict', {}]
        self.mock_get.return_value = mock_issues_response

        inactive_issue_checker.check_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')
        self.assertEqual(self.mock_get.call_count, 1)
        self.mock_delete.assert_not_called()
        self.mock_post.assert_not_called()

    def test_empty_events(self) -> None:
        """Test handling of empty events list."""
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
        ]

        inactive_issue_checker.check_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.assertEqual(self.mock_get.call_count, 2)
        self.mock_delete.assert_not_called()
        self.mock_post.assert_not_called()

    def test_nested_assignee_login_access(self) -> None:
        """Test access to nested assignee login field."""
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [{
            'number': 1,
            'assignee': {'login': 'test_user'},
            'events_url': 'mock_events_url',
            'body': ''
        }]
        self.mock_get.side_effect = [
            mock_issues_response,
            unittest.mock.Mock(json=lambda: [{
                'created_at': (
                    self.current_time - datetime.timedelta(days=10))
                    .strftime('%Y-%m-%dT%H:%M:%SZ'),
                'event': 'assigned'
            }]),
            unittest.mock.Mock(json=lambda: []),
            unittest.mock.Mock(json=lambda: [])
        ]
        inactive_issue_checker.check_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.assertTrue(self.mock_get.called)
        self.mock_delete.assert_called_once()

    def test_error_during_unassignment(self) -> None:
        """Test handling of errors during unassignment."""
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [{
            'number': 1,
            'assignee': {'login': 'user123'},
            'events_url': 'mock_events_url',
            'body': ''
        }]
        self.mock_get.side_effect = [
            mock_issues_response,
            unittest.mock.Mock(json=lambda: [{
                'created_at': (
                    self.current_time - datetime.timedelta(days=10))
                    .strftime('%Y-%m-%dT%H:%M:%SZ'),
                'event': 'assigned'
            }]),
            unittest.mock.Mock(json=lambda: []),
            unittest.mock.Mock(json=lambda: [])
        ]
        mock_delete_response = unittest.mock.Mock(status_code=500)
        self.mock_delete.return_value = mock_delete_response

        inactive_issue_checker.check_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.mock_delete.assert_called_once()
        self.mock_post.assert_not_called()

    def test_inactive_issue_unassigned(self) -> None:
        """Test that inactive issues are unassigned correctly."""
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [{
            'number': 1,
            'assignee': {'login': 'user123'},
            'events_url': 'mock_events_url',
            'body': ''
        }]
        self.mock_get.side_effect = [
            mock_issues_response,
            unittest.mock.Mock(json=lambda: [{
                'created_at': (
                    self.current_time - datetime.timedelta(days=10)).
                    strftime('%Y-%m-%dT%H:%M:%SZ'),
                'event': 'assigned'
            }]),
            # Collaborators response (empty)
            unittest.mock.Mock(json=lambda: []),
            # Pull requests response (empty)
            unittest.mock.Mock(json=lambda: [])
        ]

        mock_delete_response = unittest.mock.Mock(status_code=200)
        self.mock_delete.return_value = mock_delete_response
        self.mock_post.return_value = unittest.mock.Mock()

        inactive_issue_checker.check_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.mock_delete.assert_called_once()
        self.mock_post.assert_called_once()

    def test_issue_with_related_pr(self) -> None:
        """Test that issues with related open PRs are not unassigned."""
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [{
            'number': 3,
            'assignee': {'login': 'user789'},
            'events_url': 'mock_events_url',
            'body': ''
        }]
        self.mock_get.side_effect = [
            mock_issues_response,
            unittest.mock.Mock(json=lambda: [{
                'created_at': (
                    self.current_time - datetime.timedelta(days=10))
                    .strftime('%Y-%m-%dT%H:%M:%SZ'),
                'event': 'assigned'
            }]),
            unittest.mock.Mock(json=lambda: []),
            unittest.mock.Mock(json=lambda: [{'body': 'This fixes issue #3'}])
        ]

        inactive_issue_checker.check_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.mock_delete.assert_not_called()
        self.mock_post.assert_not_called()

    def test_collaborator_issue_not_unassigned(self) -> None:
        """Test that issues assigned to collaborators are not unassigned."""
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [{
            'number': 4,
            'assignee': {'login': 'collaborator123'},
            'events_url': 'mock_events_url',
            'body': ''
        }]
        self.mock_get.side_effect = [
            mock_issues_response,
            unittest.mock.Mock(json=lambda: [{
                'created_at': (
                    self.current_time - datetime.timedelta(days=10))
                    .strftime('%Y-%m-%dT%H:%M:%SZ'),
                'event': 'assigned'
            }]),
            unittest.mock.Mock(json=lambda: [{'login': 'collaborator123'}]),
            unittest.mock.Mock(json=lambda: [])
        ]

        inactive_issue_checker.check_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.mock_delete.assert_not_called()
        self.mock_post.assert_not_called()

    def test_exception_handling_in_process_issue(self) -> None:
        """Test exception handling during issue processing."""
        mock_issues_response = unittest.mock.Mock()
        mock_issues_response.json.return_value = [{
            'number': 1,
            'assignee': {'login': 'test_user'},
            'events_url': 'mock_events_url',
            'body': ''
        }]
        self.mock_get.side_effect = [
            mock_issues_response,
            unittest.mock.Mock(json=lambda: [{
                'created_at': (
                    self.current_time - datetime.timedelta(days=10))
                    .strftime('%Y-%m-%dT%H:%M:%SZ'),
                'event': 'assigned'
            }]),
            unittest.mock.Mock(json=lambda: []),
            unittest.mock.Mock(json=lambda: [])
        ]
        self.mock_delete.side_effect = requests.RequestException(
            'Connection error')
        inactive_issue_checker.check_inactive_issues(
            'mock_token', 'mock_owner', 'mock_repo')

        self.mock_delete.assert_called_once()
        self.mock_post.assert_not_called()


if __name__ == '__main__':
    unittest.main()
