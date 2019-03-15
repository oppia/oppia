# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for the GAE mail API wrapper."""

from core.platform.email import gae_email_services
from core.tests import test_utils
import feconf


class EmailTests(test_utils.GenericTestBase):
    """Tests for sending emails."""
    RECIPIENT_EMAIL = 'user@example.com'
    RECIPIENT_USERNAME = 'user'

    def setUp(self):
        super(EmailTests, self).setUp()
        self.signup(self.RECIPIENT_EMAIL, self.RECIPIENT_USERNAME)

    def test_sending_email(self):
        # Emails are not sent if the CAN_SEND_EMAILS setting is not turned on.
        email_exception = self.assertRaisesRegexp(
            Exception, 'This app cannot send emails.')
        messages = self.mail_stub.get_sent_messages(
            to=feconf.ADMIN_EMAIL_ADDRESS)
        self.assertEqual(0, len(messages))
        with self.swap(feconf, 'CAN_SEND_EMAILS', False), email_exception:
            gae_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)
        messages = self.mail_stub.get_sent_messages(
            to=feconf.ADMIN_EMAIL_ADDRESS)
        self.assertEqual(0, len(messages))

        messages = self.mail_stub.get_sent_messages(
            to=feconf.ADMIN_EMAIL_ADDRESS)
        self.assertEqual(0, len(messages))
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            gae_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS,
                feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)
        messages = self.mail_stub.get_sent_messages(
            to=feconf.ADMIN_EMAIL_ADDRESS)
        self.assertEqual(1, len(messages))

    def test_email_bcc_is_sent_if_bcc_admin_is_true(self):
        messages = self.mail_stub.get_sent_messages(to=self.RECIPIENT_EMAIL)
        self.assertEqual(0, len(messages))
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            gae_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, self.RECIPIENT_EMAIL,
                'subject', 'body', 'html', bcc_admin=True)
        messages = self.mail_stub.get_sent_messages(to=self.RECIPIENT_EMAIL)
        self.assertEqual(1, len(messages))
        self.assertEqual(messages[0].bcc, feconf.ADMIN_EMAIL_ADDRESS)

    def test_email_bcc_not_sent_if_bcc_admin_is_false(self):
        messages = self.mail_stub.get_sent_messages(to=self.RECIPIENT_EMAIL)
        self.assertEqual(0, len(messages))
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            gae_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, self.RECIPIENT_EMAIL,
                'subject', 'body', 'html', bcc_admin=False)
        messages = self.mail_stub.get_sent_messages(to=self.RECIPIENT_EMAIL)
        self.assertEqual(1, len(messages))
        self.assertFalse(hasattr(messages[0], 'bcc'))

    def test_sending_email_with_reply_to_id_adds_reply_to_email(self):
        reply_to_id = 'reply_to_id'

        # Tests that email has reply_to_id if passed.
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            gae_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, self.RECIPIENT_EMAIL,
                'subject', 'body', 'html', reply_to_id=reply_to_id)
        messages = self.mail_stub.get_sent_messages(
            to=self.RECIPIENT_EMAIL)
        expected_reply_to_address = 'reply+reply_to_id@example.com'
        self.assertEqual(messages[0].reply_to, expected_reply_to_address)

    def test_sending_email_without_reply_to_id_not_add_reply_to_email(self):
        """ Tests that email does not have reply_to_email
        if reply_to_id is not passed.
        """

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            gae_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html')
        messages = self.mail_stub.get_sent_messages(
            to=feconf.ADMIN_EMAIL_ADDRESS)
        self.assertFalse(hasattr(messages[0], 'reply_to'))

    def test_email_not_sent_if_sender_address_is_malformed(self):
        malformed_sender_email = ''
        email_exception = self.assertRaisesRegexp(
            ValueError, 'Malformed sender email address: %s'
            % malformed_sender_email)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True), email_exception:
            gae_email_services.send_mail(
                malformed_sender_email, self.RECIPIENT_EMAIL,
                'subject', 'body', 'html')
        messages = self.mail_stub.get_sent_messages(to=self.RECIPIENT_EMAIL)
        self.assertEqual(0, len(messages))

    def test_email_not_sent_if_recipient_address_is_malformed(self):
        malformed_recipient_email = ''
        email_exception = self.assertRaisesRegexp(
            ValueError, 'Malformed recipient email address: %s'
            % malformed_recipient_email)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True), email_exception:
            gae_email_services.send_mail(
                feconf.ADMIN_EMAIL_ADDRESS, malformed_recipient_email,
                'subject', 'body', 'html')


class BulkEmailsTests(test_utils.GenericTestBase):
    SENDER_EMAIL = 'sender@example.com'
    SENDER_USERNAME = 'sender'
    RECIPIENT_A_EMAIL = 'a@example.com'
    RECIPIENT_A_USERNAME = 'usera'
    RECIPIENT_B_EMAIL = 'b@example.com'
    RECIPIENT_B_USERNAME = 'userb'
    RECIPIENT_EMAILS = [RECIPIENT_A_EMAIL, RECIPIENT_B_EMAIL]

    def setUp(self):
        super(BulkEmailsTests, self).setUp()
        # SENDER is authorised sender.
        # A and B are recipients.
        self.signup(self.SENDER_EMAIL, self.SENDER_USERNAME)
        self.signup(self.RECIPIENT_A_EMAIL, self.RECIPIENT_A_USERNAME)
        self.signup(self.RECIPIENT_B_EMAIL, self.RECIPIENT_B_USERNAME)
        self.recipient_emails = [self.RECIPIENT_A_EMAIL, self.RECIPIENT_B_EMAIL]

    def test_correct_bulk_emails_sent(self):
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            gae_email_services.send_bulk_mail(
                self.SENDER_EMAIL, self.RECIPIENT_EMAILS,
                'subject', 'body', 'html')
        message_a = self.mail_stub.get_sent_messages(
            to=self.RECIPIENT_EMAILS[0])
        self.assertEqual(len(message_a), 1)
        message_b = self.mail_stub.get_sent_messages(
            to=self.RECIPIENT_EMAILS[1])
        self.assertEqual(len(message_b), 1)

    def test_bulk_emails_not_sent_if_can_send_emails_is_false(self):
        # Emails are not sent if the CAN_SEND_EMAILS setting is not turned on.
        email_exception = self.assertRaisesRegexp(
            Exception, 'This app cannot send emails.')
        with email_exception:
            gae_email_services.send_bulk_mail(
                self.SENDER_EMAIL, self.recipient_emails,
                'subject', 'body', 'html')
        message_a = self.mail_stub.get_sent_messages(
            to=self.RECIPIENT_EMAILS[0])
        self.assertEqual(len(message_a), 0)

        message_b = self.mail_stub.get_sent_messages(
            to=self.RECIPIENT_EMAILS[1])
        self.assertEqual(len(message_b), 0)

    def test_bulk_mails_not_sent_if_sender_email_is_malformed(self):
        malformed_sender_email = ''
        email_exception = self.assertRaisesRegexp(
            ValueError, 'Malformed sender email address: %s'
            % malformed_sender_email)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True), email_exception:
            gae_email_services.send_bulk_mail(
                malformed_sender_email, self.recipient_emails,
                'subject', 'body', 'html')
        message_a = self.mail_stub.get_sent_messages(
            to=self.RECIPIENT_EMAILS[0])
        self.assertEqual(0, len(message_a))
        message_b = self.mail_stub.get_sent_messages(
            to=self.RECIPIENT_EMAILS[1])
        self.assertEqual(0, len(message_b))

    def test_bulk_mails_not_sent_if_recipient_email_is_malformed(self):
        malformed_recipient_emails = ['', '']
        email_exception = self.assertRaisesRegexp(
            ValueError, 'Malformed recipient email address: %s'
            % malformed_recipient_emails[0])
        with self.swap(feconf, 'CAN_SEND_EMAILS', True), email_exception:
            gae_email_services.send_bulk_mail(
                self.SENDER_EMAIL, malformed_recipient_emails,
                'subject', 'body', 'html')
        messages_a = self.mail_stub.get_sent_messages(
            to=malformed_recipient_emails[0])
        self.assertEqual(len(messages_a), 0)
        messages_b = self.mail_stub.get_sent_messages(
            to=malformed_recipient_emails[1])
        self.assertEqual(len(messages_b), 0)

        malformed_recipient_emails = [self.RECIPIENT_A_EMAIL, '']
        with self.swap(feconf, 'CAN_SEND_EMAILS', True), email_exception:
            gae_email_services.send_bulk_mail(
                self.SENDER_EMAIL, malformed_recipient_emails,
                'subject', 'body', 'html')
        messages_a = self.mail_stub.get_sent_messages(
            to=malformed_recipient_emails[0])
        self.assertEqual(len(messages_a), 0)
        messages_b = self.mail_stub.get_sent_messages(
            to=malformed_recipient_emails[1])
        self.assertEqual(len(messages_b), 0)
