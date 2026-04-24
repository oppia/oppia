# coding: utf-8
#
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

"""Tests for email domain objects."""

from __future__ import annotations

import datetime

from core import feconf, utils
from core.domain import email_domain
from core.tests import test_utils


class SentEmailDomainTest(test_utils.GenericTestBase):
    """Tests for the SentEmail domain object."""

    def setUp(self) -> None:
        """Set up a valid SentEmail object for use in tests."""
        super().setUp()
        self.valid_recipient_id = 'uid_%s' % ('a' * 32)
        self.valid_sender_id = 'uid_%s' % ('b' * 32)
        self.valid_sent_datetime = datetime.datetime.utcnow()
        self.sent_email = email_domain.SentEmail(
            recipient_id=self.valid_recipient_id,
            recipient_email='recipient@example.com',
            sender_id=self.valid_sender_id,
            sender_email=feconf.NOREPLY_EMAIL_ADDRESS,
            intent=feconf.EMAIL_INTENT_SIGNUP,
            subject='Email Subject',
            html_body='<p>Email Body</p>',
            sent_datetime=self.valid_sent_datetime,
            email_hash='valid_hash',
        )

    def test_valid_sent_email_does_not_raise(self) -> None:
        """Test that a valid SentEmail does not raise."""
        # Should not raise.
        self.sent_email.validate()

    def test_to_dict(self) -> None:
        """Test to verify to_dict method of the SentEmail domain object."""
        expected_dict = {
            'recipient_id': self.valid_recipient_id,
            'recipient_email': 'recipient@example.com',
            'sender_id': self.valid_sender_id,
            'sender_email': feconf.NOREPLY_EMAIL_ADDRESS,
            'intent': feconf.EMAIL_INTENT_SIGNUP,
            'subject': 'Email Subject',
            'html_body': '<p>Email Body</p>',
            'sent_datetime': self.valid_sent_datetime,
            'email_hash': 'valid_hash',
        }
        self.assertEqual(expected_dict, self.sent_email.to_dict())

    def test_valid_sent_email_with_system_committer_id_does_not_raise(
        self,
    ) -> None:
        """Test that a SentEmail with SYSTEM_COMMITTER_ID as sender_id
        does not raise.
        """
        self.sent_email.sender_id = feconf.SYSTEM_COMMITTER_ID
        # Should not raise.
        self.sent_email.validate()

    def test_valid_sent_email_with_system_email_address_does_not_raise(
        self,
    ) -> None:
        """Test that a SentEmail with SYSTEM_EMAIL_ADDRESS as sender_email
        does not raise.
        """
        self.sent_email.sender_email = feconf.SYSTEM_EMAIL_ADDRESS
        # Should not raise.
        self.sent_email.validate()

    def test_valid_sent_email_with_no_email_hash_does_not_raise(
        self,
    ) -> None:
        """Test that a SentEmail with no email_hash does not raise."""
        self.sent_email.email_hash = None
        # Should not raise.
        self.sent_email.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_with_non_string_recipient_id_raises_error(
        self,
    ) -> None:
        """Test that a non-string recipient_id raises a ValidationError."""
        self.sent_email.recipient_id = 123  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected recipient_id to be a string, received 123',
        ):
            self.sent_email.validate()

    def test_validation_with_invalid_format_recipient_id_raises_error(
        self,
    ) -> None:
        """Test that a recipient_id with invalid format raises a
        ValidationError.
        """
        self.sent_email.recipient_id = 'invalid_id'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected recipient_id to match the user ID format, '
            'received invalid_id',
        ):
            self.sent_email.validate()

    def test_validation_with_empty_recipient_email_raises_error(
        self,
    ) -> None:
        """Test that an empty recipient_email raises a ValidationError."""
        self.sent_email.recipient_email = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected recipient_email to be a non-empty string, received ',
        ):
            self.sent_email.validate()

    def test_validation_with_invalid_recipient_email_raises_error(
        self,
    ) -> None:
        """Test that an invalid recipient_email raises a ValidationError."""
        self.sent_email.recipient_email = 'not_an_email'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected recipient_email to be a valid email address, '
            'received not_an_email',
        ):
            self.sent_email.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_with_non_string_sender_id_raises_error(
        self,
    ) -> None:
        """Test that a non-string sender_id raises a ValidationError."""
        self.sent_email.sender_id = 123  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected sender_id to be a string, received 123',
        ):
            self.sent_email.validate()

    def test_validation_with_invalid_format_sender_id_raises_error(
        self,
    ) -> None:
        """Test that a sender_id with invalid format raises a
        ValidationError.
        """
        self.sent_email.sender_id = 'invalid_id'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected sender_id to match the user ID format or be '
            'the system committer ID, received invalid_id',
        ):
            self.sent_email.validate()

    def test_validation_with_empty_sender_email_raises_error(self) -> None:
        """Test that an empty sender_email raises a ValidationError."""
        self.sent_email.sender_email = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected sender_email to be a non-empty string, received ',
        ):
            self.sent_email.validate()

    def test_validation_with_invalid_sender_email_raises_error(self) -> None:
        """Test that an invalid sender_email raises a ValidationError."""
        self.sent_email.sender_email = 'not_an_email'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected sender_email to be a valid email address, '
            'received not_an_email',
        ):
            self.sent_email.validate()

    def test_validation_with_non_system_sender_email_raises_error(
        self,
    ) -> None:
        """Test that a sender_email that is not the system or noreply
        address raises a ValidationError.
        """
        self.sent_email.sender_email = 'other@example.com'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected sender_email to be either the system email '
            'address or the noreply email address, received '
            'other@example.com',
        ):
            self.sent_email.validate()

    def test_validation_with_empty_intent_raises_error(self) -> None:
        """Test that an empty intent raises a ValidationError."""
        self.sent_email.intent = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected intent to be a non-empty string, received ',
        ):
            self.sent_email.validate()

    def test_validation_with_invalid_intent_raises_error(self) -> None:
        """Test that an invalid intent raises a ValidationError."""
        self.sent_email.intent = 'invalid_intent'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected intent to be a valid email intent, '
            'received invalid_intent',
        ):
            self.sent_email.validate()

    def test_validation_with_empty_subject_raises_error(self) -> None:
        """Test that an empty subject raises a ValidationError."""
        self.sent_email.subject = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected subject to be a non-empty string, received ',
        ):
            self.sent_email.validate()

    def test_validation_with_empty_html_body_raises_error(self) -> None:
        """Test that an empty html_body raises a ValidationError."""
        self.sent_email.html_body = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected html_body to be a non-empty string, received ',
        ):
            self.sent_email.validate()

    def test_validation_with_invalid_html_body_raises_error(self) -> None:
        """Test that an html_body with invalid HTML raises a
        ValidationError.
        """
        self.sent_email.html_body = '<script>alert("xss")</script>'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected html_body to be valid HTML',
        ):
            self.sent_email.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_with_non_datetime_sent_datetime_raises_error(
        self,
    ) -> None:
        """Test that a non-datetime sent_datetime raises a
        ValidationError.
        """
        self.sent_email.sent_datetime = 'not_a_datetime'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected sent_datetime to be a datetime object, '
            'received not_a_datetime',
        ):
            self.sent_email.validate()

    def test_validation_with_future_sent_datetime_raises_error(self) -> None:
        """Test that a sent_datetime in the future raises a
        ValidationError.
        """
        self.sent_email.sent_datetime = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1)
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected sent_datetime to not be in the future',
        ):
            self.sent_email.validate()

    def test_validation_with_empty_email_hash_raises_error(self) -> None:
        """Test that an empty email_hash raises a ValidationError."""
        self.sent_email.email_hash = ''
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected email_hash to be a non-empty string, received ',
        ):
            self.sent_email.validate()
            