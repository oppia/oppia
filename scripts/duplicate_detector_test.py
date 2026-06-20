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

import unittest

import duplicate_detector  # pylint: disable=import-error
from typing import Set


class DuplicateDetectorTests(unittest.TestCase):
    """Tests for duplicate_detector.py."""

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
