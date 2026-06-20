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
        mock_response.read.return_value = b'[{"number": 1, "title": "Bug"}]'

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
