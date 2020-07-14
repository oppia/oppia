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
from textwrap import dedent # pylint: disable=import-only-modules

from constants import constants
from core.platform.email import mailgun_email_services
from core.tests import test_utils
import feconf
import python_utils


class EmailTests(test_utils.GenericTestBase):
    """Tests for sending emails."""

    @classmethod
    def setUpClass(cls):
        super(EmailTests, cls).setUpClass()
        cls._log_handler = test_utils.MockLoggingHandler()

    def setUp(self):
        super(EmailTests, self).setUp()
        self._log_handler.reset()

    def test_send_email_to_recipients(self):
        """Test for sending HTTP POST request."""

        swapped_urlopen = lambda x: x
        swapped_request = lambda *args: args
        swap_urlopen_context = self.swap(
            python_utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            python_utils, 'url_request', swapped_request)
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with swap_urlopen_context, swap_request_context, swap_api, swap_domain:
            result = mailgun_email_services.send_email_to_recipients(
                sender_email='a@a.com',
                recipient_emails=['b@b.com'],
                subject=(
                    'Hola 😂 - invitation to collaborate'
                    .encode(encoding='utf-8')),
                plaintext_body='plaintext_body 😂'.encode(encoding='utf-8'),
                html_body='Hi abc,<br> 😂'.encode(encoding='utf-8')
            )
            expected = (
                'https://api.mailgun.net/v3/domain/messages',
                ('text=plaintext_body+%F0%9F%98%82&html=Hi+abc%2C%3Cbr%3E+' +
                 '%F0%9F%98%82&from=a%40a.com&to=b%40b.com&subject=Hola+%F0'
                 '%9F%98%82+-+invitation+to+collaborate'),
                {'Authorization': 'Basic YXBpOmtleQ=='})
            self.assertEqual(result, expected)

    def test_post_batch_send_to_mailgun(self):
        """Test for sending HTTP POST request."""
        swapped_urlopen = lambda x: x
        swapped_request = lambda *args: args
        swap_urlopen_context = self.swap(
            python_utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            python_utils, 'url_request', swapped_request)
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with swap_urlopen_context, swap_request_context, swap_api, swap_domain:
            result = mailgun_email_services.send_email_to_recipients(
                sender_email='a@a.com',
                recipient_emails=['b@b.com', 'c@c.com', 'd@d.com'],
                subject='Hola 😂 - invitation to collaborate'.encode(
                    encoding='utf-8'),
                plaintext_body='plaintext_body 😂'.encode(encoding='utf-8'),
                html_body='Hi abc,<br> 😂'.encode(encoding='utf-8')
            )
            expected = (
                'https://api.mailgun.net/v3/domain/messages',
                ('text=plaintext_body+%F0%9F%98%82&html=Hi+abc%2C%3Cbr%3E+' +
                 '%F0%9F%98%82&from=a%40a.com&to=%5Bu%27b%40b.com%27%2C+u' +
                 '%27c%40c.com%27%2C+u%27d%40d.com%27%5D&subject=Hola+%F0'
                 '%9F%98%82+-+invitation+to+collaborate'),
                {'Authorization': 'Basic YXBpOmtleQ=='})
            self.assertEqual(result, expected)

    def test_send_mail_in_dev_mode_logs_to_terminal(self):
        """In DEV Mode, email services logs email info to terminal."""

        msg_title = 'MailgunService.SendMail'
        # pylint: disable=division-operator-used
        msg_body = (
            """
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
        logging_info_email_body = msg_title + dedent(msg_body)
        logging_info_notification = (
            'You are not currently sending out real email since this is a dev' +
            ' environment. Emails are sent out in the production environment.')

        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        with allow_emailing, self.swap(logging, 'info', self._log_handler.info):
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)
        self.assertEqual(len(self._log_handler.messages['info']), 2)
        self.assertEqual(
            self._log_handler.messages['info'],
            [logging_info_email_body, logging_info_notification])

    def test_send_bulk_mail_in_dev_mode_logs_to_terminal(self):
        """In DEV Mode, email services logs email info to terminal."""

        email_header = 'MailgunService.SendBulkMail'
        recipient_email_list_str = 'a@a.com b@b.com c@c.com... Total: 4 emails.'
        # pylint: disable=division-operator-used
        logging_info_email_body = (
            """
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
        logging_info_notification = (
            'You are not currently sending out real email since this is a dev' +
            ' environment. Emails are sent out in the production environment.')

        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        with allow_emailing, self.swap(logging, 'info', self._log_handler.info):
            mailgun_email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS,
                ['a@a.com', 'b@b.com', 'c@c.com', 'd@d.com'],
                'subject', 'body', 'html')
        self.assertEqual(len(self._log_handler.messages['info']), 3)
        self.assertEqual(
            self._log_handler.messages['info'],
            [email_header, dedent(logging_info_email_body),
             logging_info_notification])

    def test_send_mail_raises_exception_for_missing_api_key(self):
        """Tests the missing Mailgun API key exception."""
        mailgun_api_exception = (
            self.assertRaisesRegexp(
                Exception, 'Mailgun API key is not available.'))

        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        with mailgun_api_exception, allow_emailing, (
            self.swap(constants, 'DEV_MODE', False)):
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)

    def test_send_mail_raises_exception_for_missing_domain_name(self):
        """Tests the missing Mailgun domain name exception."""
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain_name_exception = (
            self.assertRaisesRegexp(
                Exception, 'Mailgun domain name is not set.'))
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        with mailgun_api, mailgun_domain_name_exception, allow_emailing, (
            self.swap(constants, 'DEV_MODE', False)):
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)

    def test_send_mail_raises_exception_for_invalid_permissions(self):
        """Tests the send_mail exception raised for invalid user permissions."""
        send_email_exception = (
            self.assertRaisesRegexp(
                Exception, 'This app cannot send emails to users.'))
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with mailgun_api, mailgun_domain, send_email_exception, (
            self.swap(constants, 'DEV_MODE', False)):
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)

    def test_send_mail_data_properly_sent(self):
        """Verifies that the data sent in send_mail is correct."""
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)

        # Data we expect to have been sent in the
        # mailgun_email_services.send_email_to_recipients().
        expected = {'from': feconf.SYSTEM_EMAIL_ADDRESS,
                    'to': feconf.ADMIN_EMAIL_ADDRESS,
                    'subject': 'subject',
                    'text': 'body',
                    'html': 'html'}

        # Lambda function, will replace send_email_to_recipients().
        req_post_lambda = (lambda data=None:
                           self.assertDictContainsSubset(expected, data))
        post_request = self.swap(
            mailgun_email_services, 'send_email_to_recipients', req_post_lambda)

        with mailgun_api, mailgun_domain, post_request, allow_emailing:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)

    def test_bcc_admin_flag(self):
        """Verifies that the bcc admin flag is working properly in send_mail.

        Note that we replace the
        mailgun_email_services.send_email_to_recipients() function in send_mail
        with an alternate lambda that asserts the correct
        values were placed in the data dictionary that is then passed to the
        mailgun api.
        """
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)

        # Lambda function, will replace send_email_to_recipients().
        req_post_lambda = (lambda data=None:
                           self.assertEqual(
                               data['bcc'], feconf.ADMIN_EMAIL_ADDRESS))
        post_request = self.swap(
            mailgun_email_services, 'send_email_to_recipients', req_post_lambda)

        with mailgun_api, mailgun_domain, post_request, allow_emailing:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=True)

    def test_reply_to_id_flag(self):
        """Verifies that the reply_to_id flag is working properly."""
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        reply_id = 123

        # Lambda function, will replace send_email_to_recipients().
        req_post_lambda = (
            lambda data=None:
            self.assertEqual(
                data['h:Reply-To'],
                'reply+' + python_utils.UNICODE(reply_id) + '@' +
                feconf.INCOMING_EMAILS_DOMAIN_NAME))
        post_request = self.swap(
            mailgun_email_services, 'send_email_to_recipients', req_post_lambda)

        with mailgun_api, mailgun_domain, post_request, allow_emailing:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html',
                bcc_admin=False, reply_to_id=reply_id)

    def test_send_bulk_mail_raises_exception_for_missing_api_key(self):
        """Test that send_bulk_mail raises exception for missing
            mailgun api key.
        """
        mailgun_api_exception = (
            self.assertRaisesRegexp(
                Exception, 'Mailgun API key is not available.'))
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        with mailgun_api_exception, allow_emailing, (
            self.swap(constants, 'DEV_MODE', False)):
            mailgun_email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, [feconf.ADMIN_EMAIL_ADDRESS],
                'subject', 'body', 'html')

    def test_send_bulk_mail_raises_exception_for_missing_domain_name(self):
        """Tests the missing Mailgun domain name exception for
            send_bulk_mail.
        """
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        mailgun_domain_name_exception = (
            self.assertRaisesRegexp(
                Exception, 'Mailgun domain name is not set.'))
        with mailgun_api, mailgun_domain_name_exception, allow_emailing, (
            self.swap(constants, 'DEV_MODE', False)):
            mailgun_email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, [feconf.ADMIN_EMAIL_ADDRESS],
                'subject', 'body', 'html')

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
            mailgun_email_services.send_bulk_mail(
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

        # Data that we expect to have been sent in the
        # send_email_to_recipients().
        expected = ({'from': feconf.SYSTEM_EMAIL_ADDRESS, 'to': recipients,
                     'subject': 'subject', 'text': 'body', 'html': 'html',
                     'recipient-variables': '{}'})

        # Lambda function, will replace send_email_to_recipients().
        req_post_lambda = (lambda data=None:
                           self.assertDictContainsSubset(expected, data))
        post_request = self.swap(
            mailgun_email_services, 'send_email_to_recipients', req_post_lambda)

        with mailgun_api, mailgun_domain, post_request, allow_emailing:
            mailgun_email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, recipients,
                'subject', 'body', 'html')
