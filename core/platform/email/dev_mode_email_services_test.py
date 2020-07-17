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

"""Tests for the Mailgun API wrapper."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging
import textwrap

from core.platform.email import dev_mode_email_services
from core.tests import test_utils
import feconf


class EmailTests(test_utils.GenericTestBase):
    """Tests for sending emails."""

    @classmethod
    def setUpClass(cls):
        super(EmailTests, cls).setUpClass()
        cls._log_handler = test_utils.MockLoggingHandler()

    def setUp(self):
        super(EmailTests, self).setUp()
        self._log_handler.reset()

    def test_send_mail_logs_to_terminal(self):
        """In DEV Mode, email services logs email info to terminal."""
        # pylint: disable=division-operator-used
        msg_body = (
            """
            EmailService.SendMail
            From: %s
            To: %s
            Subject: %s
            Body:
                Content-type: text/plain
                Data length: %d
            Body
                Content-type: text/html
                Data length: %d
            """ % (
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 4, 4))
        # pylint: enable=division-operator-used
        logging_info_email_body = textwrap.dedent(msg_body)
        logging_info_notification = (
            'You are not currently sending out real email since this is a dev' +
            ' environment. Emails are sent out in the production environment.')

        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with allow_emailing, swap_api, swap_domain, (
            self.swap(logging, 'info', self._log_handler.info)):
            dev_mode_email_services.send_email_to_recipients(
                feconf.SYSTEM_EMAIL_ADDRESS, [feconf.ADMIN_EMAIL_ADDRESS],
                'subject', 'body', 'html')
        self.assertEqual(len(self._log_handler.messages['info']), 2)
        self.assertEqual(
            self._log_handler.messages['info'],
            [logging_info_email_body, logging_info_notification])

    def test_send_mail_to_multiple_recipients_logs_to_terminal(self):
        """In DEV Mode, email services logs email info to terminal."""
        recipient_email_list_str = 'a@a.com b@b.com c@c.com... Total: 4 emails.'
        # pylint: disable=division-operator-used
        msg_body = (
            """
            EmailService.SendMail
            From: %s
            To: %s
            Subject: %s
            Body:
                Content-type: text/plain
                Data length: %d
            Body
                Content-type: text/html
                Data length: %d
            """ % (
                feconf.SYSTEM_EMAIL_ADDRESS, recipient_email_list_str,
                'subject', 4, 4))
        # pylint: enable=division-operator-used
        logging_info_email_body = textwrap.dedent(msg_body)
        logging_info_notification = (
            'You are not currently sending out real email since this is a dev' +
            ' environment. Emails are sent out in the production environment.')

        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with allow_emailing, swap_api, swap_domain, (
            self.swap(logging, 'info', self._log_handler.info)):
            dev_mode_email_services.send_email_to_recipients(
                feconf.SYSTEM_EMAIL_ADDRESS,
                ['a@a.com', 'b@b.com', 'c@c.com', 'd@d.com'],
                'subject', 'body', 'html')
        self.assertEqual(len(self._log_handler.messages['info']), 2)
        self.assertEqual(
            self._log_handler.messages['info'],
            [logging_info_email_body, logging_info_notification])

    def test_mailgun_key_or_domain_name_not_set(self):
        """Test that exceptions are raised when API key or domain name are
        unset.
        """
        # Testing no mailgun api key.
        mailgun_exception = self.assertRaisesRegexp(
            Exception, 'Mailgun API key is not available.')
        with mailgun_exception:
            dev_mode_email_services.send_email_to_recipients(
                sender_email='a@a.com',
                recipient_emails=['b@b.com', 'c@c.com', 'd@d.com'],
                subject='Hola 😂 - invitation to collaborate'.encode(
                    encoding='utf-8'),
                plaintext_body='plaintext_body 😂'.encode(encoding='utf-8'),
                html_body='Hi abc,<br> 😂'.encode(encoding='utf-8'))

        # Testing no mailgun domain name.
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        mailgun_exception = self.assertRaisesRegexp(
            Exception, 'Mailgun domain name is not set.')
        with swap_api, mailgun_exception:
            dev_mode_email_services.send_email_to_recipients(
                sender_email='a@a.com',
                recipient_emails=['b@b.com', 'c@c.com', 'd@d.com'],
                subject='Hola 😂 - invitation to collaborate'.encode(
                    encoding='utf-8'),
                plaintext_body='plaintext_body 😂'.encode(encoding='utf-8'),
                html_body='Hi abc,<br> 😂'.encode(encoding='utf-8'))
