# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Tests for validation_services."""

from __future__ import annotations

from core import utils
from core.domain import validation_services
from core.tests import test_utils


class ValidatorsTests(test_utils.GenericTestBase):

    def test_validate_email_with_valid_email(self) -> None:
        """Test that valid email passes validation."""
        valid_email = 'test@example.com'
        validation_services.validate_email(valid_email)  # Should not raise

    def test_validate_email_with_invalid_email_raises_error(self) -> None:
        """Test that invalid email raises ValidationError."""
        invalid_email = 'not-an-email'
        with self.assertRaisesRegex(utils.ValidationError, 'email'):
            validation_services.validate_email(invalid_email)

    def test_is_email_valid_returns_true_for_valid_email(self) -> None:
        """Test that is_email_valid returns True for valid email."""
        valid_email = 'user@domain.org'
        self.assertTrue(validation_services.is_email_valid(valid_email))

    def test_is_email_valid_returns_false_for_invalid_email(self) -> None:
        """Test that is_email_valid returns False for invalid email."""
        invalid_email = 'invalid'
        self.assertFalse(validation_services.is_email_valid(invalid_email))

    def test_validate_tags_with_valid_tags(self) -> None:
        """Test that valid tags pass validation."""
        valid_tags = ['math', 'science', 'computer science']
        validation_services.validate_tags(valid_tags)  # Should not raise

    def test_validate_tags_with_duplicate_tags_raises_error(self) -> None:
        """Test that duplicate tags raise ValidationError."""
        duplicate_tags = ['math', 'science', 'math']
        with self.assertRaisesRegex(utils.ValidationError, 'duplicate'):
            validation_services.validate_tags(duplicate_tags)

    def test_validate_html_content_with_valid_html(self) -> None:
        """Test that valid HTML passes validation."""
        valid_html = '<p>Hello World</p>'
        validation_services.validate_html_content(valid_html)  # Should not raise