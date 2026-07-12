# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for duplicate_detector.py."""

from __future__ import annotations

import sys
import unittest
from unittest import mock

from typing import Set

# Mock sentence_transformers since it is not installed in the local Oppia environment.
sys.modules['sentence_transformers'] = mock.MagicMock()

from scripts import duplicate_detector  # pylint: disable=wrong-import-position


class CleanTextTests(unittest.TestCase):
    """Tests for the clean_text function."""

    def test_clean_text_removes_markdown_headers(self) -> None:
        """Test that clean_text removes markdown headers."""
        text = '### Describe the bug\nThis is a real issue.'
        template_lines: Set[str] = set()
        cleaned_text = duplicate_detector.clean_text(text, template_lines)
        self.assertEqual(cleaned_text, '\nThis is a real issue.')

    def test_clean_text_removes_template_lines(self) -> None:
        """Test that clean_text removes boilerplate template lines."""
        text = 'Steps to reproduce:\n1. Do this\n2. Do that\nExpected behavior'
        template_lines: Set[str] = {'steps to reproduce:', 'expected behavior'}
        cleaned_text = duplicate_detector.clean_text(text, template_lines)
        self.assertEqual(cleaned_text, '1. Do this\n2. Do that')

    def test_clean_text_with_empty_string(self) -> None:
        """Test that clean_text handles empty strings."""
        template_lines: Set[str] = set()
        cleaned_text = duplicate_detector.clean_text('', template_lines)
        self.assertEqual(cleaned_text, '')

    def test_clean_text_preserves_non_template_lines(self) -> None:
        """Test that clean_text preserves lines not in template."""
        text = 'This is a real bug.\nIt crashes on startup.'
        template_lines: Set[str] = {'some other template line'}
        cleaned_text = duplicate_detector.clean_text(text, template_lines)
        self.assertEqual(
            cleaned_text, 'This is a real bug.\nIt crashes on startup.'
        )

    def test_clean_text_removes_multiple_headers(self) -> None:
        """Test that clean_text removes all markdown headers."""
        text = '### Header 1\nContent 1\n### Header 2\nContent 2'
        template_lines: Set[str] = set()
        cleaned_text = duplicate_detector.clean_text(text, template_lines)
        self.assertEqual(cleaned_text, '\nContent 1\n\nContent 2')


class GetAllOpenIssuesTests(unittest.TestCase):
    """Tests for the get_all_open_issues function."""

    @mock.patch('scripts.duplicate_detector.urllib.request.urlopen')
    @mock.patch('scripts.duplicate_detector.urllib.request.Request')
    def test_get_all_open_issues_returns_issues(
        self, mock_request: mock.MagicMock, mock_urlopen: mock.MagicMock
    ) -> None:
        """Test that get_all_open_issues fetches and returns issues."""
        mock_response = mock.MagicMock()
        mock_response.__enter__ = mock.Mock(return_value=mock_response)
        mock_response.__exit__ = mock.Mock(return_value=False)
        mock_response.read.return_value = b'[{"number": 1, "title": "Bug"}, {"number": 2, "pull_request": {}}]'

        empty_response = mock.MagicMock()
        empty_response.__enter__ = mock.Mock(return_value=empty_response)
        empty_response.__exit__ = mock.Mock(return_value=False)
        empty_response.read.return_value = b'[]'

        mock_urlopen.side_effect = [mock_response, empty_response]

        issues = duplicate_detector.get_all_open_issues(
            'oppia/oppia', {'Authorization': 'token fake'}
        )

        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]['number'], 1)
        mock_request.assert_called()

    @mock.patch('scripts.duplicate_detector.urllib.request.urlopen')
    @mock.patch('scripts.duplicate_detector.urllib.request.Request')
    def test_get_all_open_issues_handles_error(
        self, mock_request: mock.MagicMock, mock_urlopen: mock.MagicMock
    ) -> None:
        """Test that get_all_open_issues handles API errors gracefully."""
        mock_urlopen.side_effect = Exception('Network error')

        issues = duplicate_detector.get_all_open_issues(
            'oppia/oppia', {'Authorization': 'token fake'}
        )

        self.assertEqual(issues, [])
        mock_request.assert_called()


class GetTemplateLinesTests(unittest.TestCase):
    """Tests for the get_template_lines function."""

    @mock.patch('os.path.isfile', return_value=False)
    @mock.patch('os.path.isdir', return_value=False)
    def test_get_template_lines_no_templates(
        self, mock_isdir: mock.MagicMock, mock_isfile: mock.MagicMock
    ) -> None:
        """Test that get_template_lines returns empty set when no templates."""
        result = duplicate_detector.get_template_lines('/fake/path')
        self.assertEqual(result, set())
        mock_isdir.assert_called()
        mock_isfile.assert_called()

    @mock.patch('os.listdir')
    @mock.patch('os.path.isdir')
    @mock.patch('os.path.isfile')
    def test_get_template_lines_with_dir(
        self,
        mock_isfile: mock.MagicMock,
        mock_isdir: mock.MagicMock,
        mock_listdir: mock.MagicMock,
    ) -> None:
        """Test that get_template_lines parses directory."""

        def isdir_side_effect(path: str) -> bool:
            return (
                'ISSUE_TEMPLATE' in path
                and not path.endswith('.md')
                and not path.endswith('.yml')
                and not path.endswith('.txt')
            )

        def isfile_side_effect(path: str) -> bool:
            return (
                path.endswith('.md')
                or path.endswith('.yml')
                or path.endswith('.txt')
            )

        mock_isdir.side_effect = isdir_side_effect
        mock_isfile.side_effect = isfile_side_effect
        mock_listdir.return_value = ['bug.md', 'feature.yml', 'ignore.txt']

        file_contents = 'name: bug\ntitle: bug\n\n### Description\nThis is a template line that is very long.'
        m = mock.mock_open(read_data=file_contents)
        with mock.patch('builtins.open', m):
            result = duplicate_detector.get_template_lines('/fake')
            self.assertIn('this is a template line that is very long.', result)
        mock_isfile.assert_called()

    @mock.patch('os.path.isfile')
    @mock.patch('os.path.isdir', return_value=False)
    def test_get_template_lines_with_file(
        self, mock_isdir: mock.MagicMock, mock_isfile: mock.MagicMock
    ) -> None:
        """Test that get_template_lines parses file."""
        mock_isfile.side_effect = lambda path: 'PULL_REQUEST_TEMPLATE' in path
        file_contents = (
            'name: bug\nThis is another template line that is very long.'
        )
        m = mock.mock_open(read_data=file_contents)
        with mock.patch('builtins.open', m):
            result = duplicate_detector.get_template_lines('/fake')
            self.assertIn(
                'this is another template line that is very long.', result
            )
        mock_isdir.assert_called()


class LoadEventTests(unittest.TestCase):
    """Tests for _load_event."""

    @mock.patch('os.path.exists', return_value=True)
    def test_load_event_success(
        self, unused_mock_exists: mock.MagicMock
    ) -> None:
        """Test successful event load."""
        m = mock.mock_open(read_data='{"issue": {"number": 1}}')
        with mock.patch('builtins.open', m):
            result = duplicate_detector.load_event('/fake/path.json')
            self.assertEqual(result, {'issue': {'number': 1}})

    @mock.patch('os.path.exists', return_value=False)
    def test_load_event_no_file(
        self, unused_mock_exists: mock.MagicMock
    ) -> None:
        """Test event load when file missing."""
        result = duplicate_detector.load_event('/fake/path.json')
        self.assertEqual(result, {})

    def test_load_event_empty_path(self) -> None:
        """Test event load with empty path."""
        result = duplicate_detector.load_event('')
        self.assertEqual(result, {})


class GetIssuesToClassifyTests(unittest.TestCase):
    """Tests for _get_issues_to_classify."""

    def test_manual_trigger_with_valid_range(self) -> None:
        """Test manual trigger correctly filters issues by range."""
        open_issues = [{'number': 1}, {'number': 2}, {'number': 3}]
        result = duplicate_detector.get_issues_to_classify(
            open_issues, {}, True, '1', '2'
        )
        self.assertEqual(result, [{'number': 1}, {'number': 2}])

    def test_manual_trigger_no_start_issue(self) -> None:
        """Test manual trigger fails without start issue."""
        open_issues = [{'number': 1}]
        with self.assertRaisesRegex(
            ValueError, 'start_issue_number is required'
        ):
            duplicate_detector.get_issues_to_classify(
                open_issues, {}, True, '', ''
            )

    def test_automatic_trigger_with_issue(self) -> None:
        """Test automatic trigger returns issue from payload."""
        result = duplicate_detector.get_issues_to_classify(
            [], {'issue': {'number': 5}}, False, '', ''
        )
        self.assertEqual(result, [{'number': 5}])

    def test_automatic_trigger_no_issue(self) -> None:
        """Test automatic trigger returns empty list when no issue."""
        result = duplicate_detector.get_issues_to_classify(
            [], {}, False, '', ''
        )
        self.assertEqual(result, [])


class GenerateEmbeddingsTests(unittest.TestCase):
    """Tests for _generate_embeddings."""

    @mock.patch('scripts.duplicate_detector.clean_text')
    def test_generate_embeddings(self, mock_clean_text: mock.MagicMock) -> None:
        """Test embeddings are generated correctly."""
        mock_clean_text.side_effect = lambda text, tmpl: text.strip()
        mock_model = mock.MagicMock()
        mock_model.encode.return_value = 'embedding_tensor'

        issues = [{'number': 1, 'title': 'T', 'body': 'B'}]
        result = duplicate_detector.generate_embeddings(
            issues, mock_model, set()
        )

        self.assertIn(1, result)
        self.assertEqual(result[1], 'embedding_tensor')
        mock_model.encode.assert_called_once_with('T B', convert_to_tensor=True)


class FindBestMatchTests(unittest.TestCase):
    """Tests for _find_best_match."""

    @mock.patch('scripts.duplicate_detector.sentence_transformers.util.cos_sim')
    def test_find_best_match(self, mock_cos_sim: mock.MagicMock) -> None:
        """Test best match is found correctly."""
        mock_tensor = mock.MagicMock()
        mock_tensor.item.return_value = 0.9
        mock_cos_sim.return_value = mock_tensor

        target_issue = {'number': 5}
        open_issues = [{'number': 1}, {'number': 6}]
        embeddings = {1: 'emb1', 5: 'emb5', 6: 'emb6'}

        best_num, best_score = duplicate_detector.find_best_match(
            target_issue, open_issues, embeddings
        )
        self.assertEqual(best_num, 1)
        self.assertEqual(best_score, 0.9)


class LabelAndCommentTests(unittest.TestCase):
    """Tests for _label_and_comment."""

    @mock.patch('scripts.duplicate_detector.urllib.request.urlopen')
    def test_label_and_comment_success(
        self, mock_urlopen: mock.MagicMock
    ) -> None:
        """Test labels and comments are posted successfully."""
        target_issue = {'user': {'login': 'testuser'}}
        duplicate_detector.label_and_comment(
            'oppia/repo', {}, 5, 1, target_issue
        )
        self.assertEqual(mock_urlopen.call_count, 2)

    @mock.patch('scripts.duplicate_detector.urllib.request.urlopen')
    def test_label_and_comment_error(
        self, mock_urlopen: mock.MagicMock
    ) -> None:
        """Test label and comment handles exceptions."""
        mock_urlopen.side_effect = Exception('API Error')
        target_issue = {'user': {'login': 'testuser'}}
        # Should not raise an exception.
        duplicate_detector.label_and_comment(
            'oppia/repo', {}, 5, 1, target_issue
        )
        self.assertEqual(mock_urlopen.call_count, 2)


class MainTests(unittest.TestCase):
    """Tests for the main function."""

    @mock.patch('scripts.duplicate_detector.get_all_open_issues')
    @mock.patch('scripts.duplicate_detector.get_template_lines')
    @mock.patch('os.environ.get')
    def test_main_manual_trigger_missing_start_issue(
        self,
        mock_environ_get: mock.MagicMock,
        mock_get_template_lines: mock.MagicMock,
        mock_get_all_open_issues: mock.MagicMock,
    ) -> None:
        """Test main raises error when start_issue_number is missing."""

        def env_mock(k: str, d: str = '') -> str:
            env_vars = {
                'GITHUB_EVENT_NAME': 'workflow_dispatch',
            }
            return env_vars.get(k, d)

        mock_environ_get.side_effect = env_mock
        mock_get_template_lines.return_value = set()
        mock_get_all_open_issues.return_value = []

        with self.assertRaisesRegex(
            ValueError, 'start_issue_number is required for manual trigger.'
        ):
            duplicate_detector.main()

    @mock.patch('scripts.duplicate_detector.get_all_open_issues')
    @mock.patch('scripts.duplicate_detector.get_template_lines')
    @mock.patch('os.environ.get')
    def test_main_manual_trigger_no_issues_found(
        self,
        mock_environ_get: mock.MagicMock,
        mock_get_template_lines: mock.MagicMock,
        mock_get_all_open_issues: mock.MagicMock,
    ) -> None:
        """Test main gracefully returning when no issues found."""

        def env_mock(k: str, d: str = '') -> str:
            env_vars = {
                'GITHUB_EVENT_NAME': 'workflow_dispatch',
                'START_ISSUE_NUMBER': '1',
            }
            return env_vars.get(k, d)

        mock_environ_get.side_effect = env_mock
        mock_get_template_lines.return_value = set()
        mock_get_all_open_issues.return_value = []

        duplicate_detector.main()
        mock_get_all_open_issues.assert_called()

    @mock.patch('scripts.duplicate_detector.sentence_transformers.util.cos_sim')
    @mock.patch('scripts.duplicate_detector.urllib.request.urlopen')
    @mock.patch('scripts.duplicate_detector.get_all_open_issues')
    @mock.patch('scripts.duplicate_detector.get_template_lines')
    @mock.patch('os.environ.get')
    def test_main_manual_trigger_with_duplicate(
        self,
        mock_environ_get: mock.MagicMock,
        mock_get_template_lines: mock.MagicMock,
        mock_get_all_open_issues: mock.MagicMock,
        mock_urlopen: mock.MagicMock,
        mock_cos_sim: mock.MagicMock,
    ) -> None:
        """Test main identifies duplicates via manual trigger."""

        def env_mock(k: str, d: str = '') -> str:
            env_vars = {
                'GITHUB_EVENT_NAME': 'workflow_dispatch',
                'START_ISSUE_NUMBER': '1',
                'END_ISSUE_NUMBER': '10',
                'THRESHOLD_SCORE': '0.8',
            }
            return env_vars.get(k, d)

        mock_environ_get.side_effect = env_mock
        mock_get_template_lines.return_value = set()
        mock_get_all_open_issues.return_value = [
            {
                'number': 0,
                'title': 'issue 0',
                'body': 'body 0',
                'user': {'login': 'user0'},
            },
            {
                'number': 1,
                'title': 'issue 1',
                'body': 'body 1',
                'user': {'login': 'user1'},
            },
            {
                'number': 2,
                'title': 'issue 2',
                'body': 'body 2',
                'user': {'login': 'user2'},
            },
            # Hits branch 169->168.
            {
                'number': 11,
                'title': 'issue 11',
                'body': 'body 11',
                'user': {'login': 'user11'},
            },
        ]

        # Mock cos_sim to return a tensor with an item() method.
        # Return 0.9 for the first comparison, then 0.5 for the second to hit branch 218->211.
        mock_tensor1 = mock.MagicMock()
        mock_tensor1.item.return_value = 0.9
        mock_tensor2 = mock.MagicMock()
        mock_tensor2.item.return_value = 0.5
        mock_cos_sim.side_effect = [
            mock_tensor1,
            mock_tensor1,
            mock_tensor2,
            mock_tensor1,
            mock_tensor2,
        ]

        duplicate_detector.main()
        self.assertEqual(mock_urlopen.call_count, 4)

    @mock.patch('scripts.duplicate_detector.sentence_transformers.util.cos_sim')
    @mock.patch('scripts.duplicate_detector.urllib.request.urlopen')
    @mock.patch('scripts.duplicate_detector.get_all_open_issues')
    @mock.patch('scripts.duplicate_detector.get_template_lines')
    @mock.patch('os.environ.get')
    def test_main_manual_trigger_no_duplicate(
        self,
        mock_environ_get: mock.MagicMock,
        mock_get_template_lines: mock.MagicMock,
        mock_get_all_open_issues: mock.MagicMock,
        mock_urlopen: mock.MagicMock,
        mock_cos_sim: mock.MagicMock,
    ) -> None:
        """Test main when there are no duplicates."""

        def env_mock(k: str, d: str = '') -> str:
            env_vars = {
                'GITHUB_EVENT_NAME': 'workflow_dispatch',
                'START_ISSUE_NUMBER': '1',
                'END_ISSUE_NUMBER': '10',
                'THRESHOLD_SCORE': '0.8',
            }
            return env_vars.get(k, d)

        mock_environ_get.side_effect = env_mock
        mock_get_template_lines.return_value = set()
        mock_get_all_open_issues.return_value = [
            {
                'number': 1,
                'title': 'issue 1',
                'body': 'body 1',
                'user': {'login': 'user1'},
            },
            {
                'number': 2,
                'title': 'issue 2',
                'body': 'body 2',
                'user': {'login': 'user2'},
            },
            # Hits branch 169->168.
            {
                'number': 15,
                'title': 'issue 15',
                'body': 'body 15',
                'user': {'login': 'user15'},
            },
        ]

        mock_tensor = mock.MagicMock()
        mock_tensor.item.return_value = 0.5
        mock_cos_sim.return_value = mock_tensor

        duplicate_detector.main()
        mock_urlopen.assert_not_called()

    @mock.patch('builtins.open')
    @mock.patch('os.path.exists')
    @mock.patch('scripts.duplicate_detector.get_all_open_issues')
    @mock.patch('scripts.duplicate_detector.get_template_lines')
    @mock.patch('os.environ.get')
    def test_main_automatic_trigger_no_issue_in_event(
        self,
        mock_environ_get: mock.MagicMock,
        mock_get_template_lines: mock.MagicMock,
        mock_get_all_open_issues: mock.MagicMock,
        mock_exists: mock.MagicMock,
        mock_open: mock.MagicMock,
    ) -> None:
        """Test main automatic trigger exits when no issue is present."""

        def env_mock(k: str, d: str = '') -> str:
            env_vars = {
                'GITHUB_EVENT_NAME': 'issues',
                'GITHUB_EVENT_PATH': '/fake/path.json',
            }
            return env_vars.get(k, d)

        mock_environ_get.side_effect = env_mock
        mock_exists.return_value = True
        m = mock.mock_open(read_data='{}')
        mock_open.side_effect = m

        duplicate_detector.main()
        mock_get_all_open_issues.assert_called_once()
        mock_get_template_lines.assert_called_once()

    @mock.patch('builtins.open')
    @mock.patch('os.path.exists')
    @mock.patch('scripts.duplicate_detector.sentence_transformers.util.cos_sim')
    @mock.patch('scripts.duplicate_detector.urllib.request.urlopen')
    @mock.patch('scripts.duplicate_detector.get_all_open_issues')
    @mock.patch('scripts.duplicate_detector.get_template_lines')
    @mock.patch('os.environ.get')
    def test_main_automatic_trigger_with_duplicate(
        self,
        mock_environ_get: mock.MagicMock,
        mock_get_template_lines: mock.MagicMock,
        mock_get_all_open_issues: mock.MagicMock,
        mock_urlopen: mock.MagicMock,
        mock_cos_sim: mock.MagicMock,
        mock_exists: mock.MagicMock,
        mock_open: mock.MagicMock,
    ) -> None:
        """Test main automatic trigger finds duplicates."""

        def env_mock(k: str, d: str = '') -> str:
            env_vars = {
                'GITHUB_EVENT_NAME': 'issues',
                'GITHUB_EVENT_PATH': '/fake/path.json',
                'THRESHOLD_SCORE': '0.8',
            }
            return env_vars.get(k, d)

        mock_environ_get.side_effect = env_mock
        mock_exists.side_effect = lambda p: p == '/fake/path.json'
        m = mock.mock_open(
            read_data='{"issue": {"number": 2, "title": "t", "body": "b"}}'
        )
        mock_open.side_effect = m

        mock_get_template_lines.return_value = set()
        mock_get_all_open_issues.return_value = [
            {'number': 1, 'title': 'issue 1', 'body': 'body 1'}
        ]

        mock_tensor = mock.MagicMock()
        mock_tensor.item.return_value = 0.9
        mock_cos_sim.return_value = mock_tensor

        duplicate_detector.main()
        self.assertEqual(mock_urlopen.call_count, 2)

    @mock.patch('builtins.open')
    @mock.patch('os.path.exists')
    @mock.patch('scripts.duplicate_detector.sentence_transformers.util.cos_sim')
    @mock.patch('scripts.duplicate_detector.urllib.request.urlopen')
    @mock.patch('scripts.duplicate_detector.get_all_open_issues')
    @mock.patch('scripts.duplicate_detector.get_template_lines')
    @mock.patch('os.environ.get')
    def test_main_automatic_trigger_urllib_error(
        self,
        mock_environ_get: mock.MagicMock,
        mock_get_template_lines: mock.MagicMock,
        mock_get_all_open_issues: mock.MagicMock,
        mock_urlopen: mock.MagicMock,
        mock_cos_sim: mock.MagicMock,
        mock_exists: mock.MagicMock,
        mock_open: mock.MagicMock,
    ) -> None:
        """Test main catches urllib errors gracefully."""

        def env_mock(k: str, d: str = '') -> str:
            env_vars = {
                'GITHUB_EVENT_NAME': 'issues',
                'GITHUB_EVENT_PATH': '/fake/path.json',
                'THRESHOLD_SCORE': '0.8',
            }
            return env_vars.get(k, d)

        mock_environ_get.side_effect = env_mock
        mock_exists.side_effect = lambda p: p == '/fake/path.json'
        m = mock.mock_open(
            read_data='{"issue": {"number": 2, "title": "t", "body": "b"}}'
        )
        mock_open.side_effect = m

        mock_get_template_lines.return_value = set()
        mock_get_all_open_issues.return_value = [
            {'number': 1, 'title': 'issue 1', 'body': 'body 1'}
        ]

        mock_tensor = mock.MagicMock()
        mock_tensor.item.return_value = 0.9
        mock_cos_sim.return_value = mock_tensor

        mock_urlopen.side_effect = Exception('API error')

        duplicate_detector.main()
        self.assertEqual(mock_urlopen.call_count, 2)
