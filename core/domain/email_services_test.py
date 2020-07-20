# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

""" Tests for services relating to emails."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import email_services
from core.platform import models
from core.tests import test_utils

import feconf
import python_utils

(email_models,) = models.Registry.import_models([models.NAMES.email])
platform_email_services = models.Registry.import_email_services()


class EmailServicesTest(test_utils.EmailTestBase):
    """Tests for email_services functions."""

    def test_reply_info_email_objects_are_created_and_queried_correctly(self):
        model = email_models.GeneralFeedbackEmailReplyToIdModel.create(
            'user1', 'exploration.exp1.1')
        reply_to_id = model.reply_to_id
        queried_object = (
            email_services.get_feedback_thread_reply_info_by_reply_to_id(
                reply_to_id))

        self.assertEqual(queried_object.reply_to_id, reply_to_id)
        self.assertEqual(queried_object.id, 'user1.exploration.exp1.1')

        queried_object = (
            email_services.get_feedback_thread_reply_info_by_reply_to_id(
                'unknown.reply.to.id'))
        self.assertEqual(queried_object, None)

        queried_object = (
            email_services
            .get_feedback_thread_reply_info_by_user_and_thread_ids(
                'user1', 'exploration.exp1.1'))

        self.assertEqual(queried_object.reply_to_id, reply_to_id)
        self.assertEqual(queried_object.id, 'user1.exploration.exp1.1')

        queried_object = (
            email_services
            .get_feedback_thread_reply_info_by_user_and_thread_ids(
                'user_unknown', 'invalid_thread_id'))

        self.assertEqual(queried_object, None)

    def test_send_mail_raises_exception_for_invalid_permissions(self):
        """Tests the send_mail exception raised for invalid user permissions."""
        send_email_exception = (
            self.assertRaisesRegexp(
                Exception, 'This app cannot send emails to users.'))
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with mailgun_api, mailgun_domain, send_email_exception, (
            self.swap(constants, 'DEV_MODE', False)):
            email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)

    def test_send_mail_data_properly_sent(self):
        """Verifies that the data sent in send_mail is correct."""
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)

        with mailgun_api, mailgun_domain, allow_emailing:
            email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)
            messages = self._get_sent_email_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].subject, 'subject')
            self.assertEqual(messages[0].body, 'body')
            self.assertEqual(messages[0].html, 'html')

    def test_bcc_admin_flag(self):
        """Verifies that the bcc admin flag is working properly in send_mail.

        Note that we replace the
        platform_email_services.send_email_to_recipients() function in send_mail
        with an alternate lambda that asserts the correct
        values were placed in the data dictionary that is then passed to the
        platform api.
        """
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)

        with mailgun_api, mailgun_domain, allow_emailing:
            email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=True)
            messages = self._get_sent_email_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].bcc, feconf.ADMIN_EMAIL_ADDRESS)

    def test_reply_to_id_flag(self):
        """Verifies that the reply_to_id flag is working properly."""
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        reply_id = 123

        with mailgun_api, mailgun_domain, allow_emailing:
            email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html',
                bcc_admin=False, reply_to_id=reply_id)
            messages = self._get_sent_email_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].reply_to,
                'reply+' + python_utils.UNICODE(reply_id) + '@' +
                feconf.INCOMING_EMAILS_DOMAIN_NAME)

    def test_send_bulk_mail_exception_for_invalid_permissions(self):
        """Tests the send_bulk_mail exception raised for invalid user
           permissions.
        """
        send_email_exception = (
            self.assertRaisesRegexp(
                Exception, 'This app cannot send emails to users.'))
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with mailgun_api, mailgun_domain, send_email_exception, (
            self.swap(constants, 'DEV_MODE', False)):
            email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, [feconf.ADMIN_EMAIL_ADDRESS],
                'subject', 'body', 'html')

    def test_send_bulk_mail_data_properly_sent(self):
        """Verifies that the data sent in send_bulk_mail is correct
           for each user in the recipient list.
        """
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        recipients = [feconf.ADMIN_EMAIL_ADDRESS]

        with mailgun_api, mailgun_domain, allow_emailing:
            email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, recipients,
                'subject', 'body', 'html')
            messages = self._get_sent_email_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(messages[0].to, recipients)

    def test_email_not_sent_if_email_addresses_are_malformed(self):
        """Tests that email is not sent if recipient email address is
        malformed.
        """
        # Case when malformed_recipient_email is None for send_mail.
        malformed_recipient_email = None
        email_exception = self.assertRaisesRegexp(
            ValueError, 'Malformed recipient email address: %s'
            % malformed_recipient_email)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True), email_exception:
            email_services.send_mail(
                'sender@example.com', malformed_recipient_email,
                'subject', 'body', 'html')

        # Case when malformed_recipient_email is an empty string for send_mail.
        malformed_recipient_email = ''
        email_exception = self.assertRaisesRegexp(
            ValueError, 'Malformed recipient email address: %s'
            % malformed_recipient_email)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True), email_exception:
            email_services.send_mail(
                'sender@example.com', malformed_recipient_email,
                'subject', 'body', 'html')

        # Case when sender is malformed for send_mail.
        malformed_sender_email = 'x@x@x'
        email_exception = self.assertRaisesRegexp(
            ValueError, 'Malformed sender email address: %s'
            % malformed_sender_email)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True), email_exception:
            email_services.send_mail(
                malformed_sender_email, 'recipient@example.com',
                'subject', 'body', 'html')

        # Case when sender is malformed for send_bulk_mail.
        malformed_sender_email = 'email'
        email_exception = self.assertRaisesRegexp(
            ValueError, 'Malformed sender email address: %s'
            % malformed_sender_email)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True), email_exception:
            email_services.send_bulk_mail(
                malformed_sender_email, ['recipient@example.com'],
                'subject', 'body', 'html')

        # Case when sender is malformed for send_bulk_mail.
        malformed_recipient_emails = ['a@a.com', 'email.com']
        email_exception = self.assertRaisesRegexp(
            ValueError, 'Malformed recipient email address: %s'
            % malformed_recipient_emails[1])
        with self.swap(feconf, 'CAN_SEND_EMAILS', True), email_exception:
            email_services.send_bulk_mail(
                'sender@example.com', malformed_recipient_emails,
                'subject', 'body', 'html')

    def test_unsuccessful_status_codes_raises_exception(self):
        """Test that unsuccessful status codes raises an exception."""

        email_exception = self.assertRaisesRegexp(
            Exception, 'Bulk email failed to send. Please check your ' +
            'email service provider.')
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        recipients = [feconf.ADMIN_EMAIL_ADDRESS]

        with mailgun_api, mailgun_domain, allow_emailing, email_exception, (
            self.swap(
                platform_email_services, 'send_email_to_recipients',
                lambda *_: False)):
            email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, recipients,
                'subject', 'body', 'html')

        email_exception = self.assertRaisesRegexp(
            Exception, (
                'Email to %s failed to send. Please check your ' +
                'email service provider.') % feconf.ADMIN_EMAIL_ADDRESS)
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)

        with mailgun_api, mailgun_domain, allow_emailing, email_exception, (
            self.swap(
                platform_email_services, 'send_email_to_recipients',
                lambda *_: False)):
            email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=True)
