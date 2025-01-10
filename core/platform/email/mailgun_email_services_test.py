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

from __future__ import annotations

import os
import textwrap
from unittest import mock

from core import feconf
from core.platform import models
from core.platform.email import mailgun_email_services
from core.tests import test_utils

from typing import Dict, Tuple, Union

secrets_services = models.Registry.import_secrets_services()

MailgunQueryType = Tuple[str, bytes, Dict[str, str]]


class EmailTests(test_utils.GenericTestBase):
    """Tests for sending emails."""

    def setUp(self) -> None:
        super().setUp()
        self.swapped_request = lambda *args: args
        self.swap_api_key_secrets_return_none = self.swap_to_always_return(
            secrets_services, 'get_secret', None)
        self.swap_api_key_secrets_return_secret = self.swap_with_checks(
            secrets_services,
            'get_secret',
            lambda _: 'key',
            expected_args=[
                ('MAILGUN_API_KEY',),
            ]
        )

    @mock.patch('requests.post')
    def test_send_email_to_mailgun_without_bcc_reply_to_and_recipients(
        self, mock_post: mock.Mock
    ) -> None:
        """Test for sending HTTP POST request."""
        # Test sending email without bcc, reply_to or recipient_variables.
        mock_response = mock.Mock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        sender_email = 'a@a.com'
        recipient_emails = ['b@b.com']
        subject = 'Hola 😂 - invitation to collaborate'
        plaintext_body = 'plaintext_body 😂'
        html_body = 'Hi abc,<br> 😂'
        attachments = None

        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')

        with self.swap_api_key_secrets_return_secret, swap_domain:
            resp = mailgun_email_services.send_email_to_recipients(
                sender_email,
                recipient_emails,
                subject,
                plaintext_body,
                html_body
            )

        expected_data = {
            'from': sender_email,
            'subject': subject,
            'text': plaintext_body,
            'html': html_body,
            'to': recipient_emails[0],
            'recipient_variables': {}
        }

        mock_post.assert_called_once_with(
            'https://api.mailgun.net/v3/domain/messages',
            auth=('api', 'key'),
            data=expected_data,
            files=attachments,
            timeout=mailgun_email_services.TIMEOUT_SECS
        )
        self.assertTrue(resp)

    @mock.patch('requests.post')
    def test_send_email_to_mailgun_with_file_attachments(
            self, mock_post: mock.Mock) -> None:
        mock_response = mock.Mock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        sender_email = 'sender@example.com'
        recipient_emails = ['recipient@example.com']
        subject = 'Test Email with attachment'
        plaintext_body = 'This is a test email with an attachment.'
        html_body = 'Hi abc,<br> 😂'
        file_path = 'test_file.txt'
        attachments = [{'filename': 'test_file.txt', 'path': file_path}]

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('This is a test file.')

        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')

        with self.swap_api_key_secrets_return_secret, swap_domain:
            resp = mailgun_email_services.send_email_to_recipients(
                sender_email,
                recipient_emails,
                subject,
                plaintext_body,
                html_body,
                attachments=attachments
            )

        mock_post.assert_called_once()
        _, kwargs = mock_post.call_args

        os.remove(file_path)
        self.assertTrue(resp)
        self.assertEqual(kwargs['auth'], ('api', 'key'))
        self.assertEqual(kwargs['data']['from'], sender_email)
        self.assertEqual(kwargs['data']['to'], recipient_emails[0])
        self.assertEqual(kwargs['data']['subject'], subject)
        self.assertEqual(kwargs['data']['text'], plaintext_body)
        self.assertEqual(kwargs['data']['html'], html_body)
        self.assertIn('files', kwargs)
        self.assertEqual(kwargs['files'][0][1][0], 'test_file.txt')

    @mock.patch('requests.post')
    def test_send_email_to_mailgun_with_bcc_and_recipient(
            self, mock_post: mock.Mock) -> None:
        # Test sending email with single bcc and single recipient email.
        mock_response = mock.Mock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        sender_email = 'a@example.com'
        recipient_emails = ['b@example.com']
        subject = 'Hola 😂 - invitation to collaborate'
        plaintext_body = 'plaintext_body 😂'
        html_body = 'Hi abc,<br> 😂'
        recipient_variables: Dict[str, Dict[str, Union[str, float]]] = {
            'b@b.com': {'first': 'Bob', 'id': 1}}
        bcc = ['c@example.com']
        reply_to = 'abc'
        attachments = None

        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')

        with self.swap_api_key_secrets_return_secret, swap_domain:
            resp = mailgun_email_services.send_email_to_recipients(
                sender_email,
                recipient_emails,
                subject,
                plaintext_body,
                html_body,
                bcc,
                reply_to,
                recipient_variables)

        expected_data = {
            'from': sender_email,
            'subject': subject,
            'text': plaintext_body,
            'html': html_body,
            'to': recipient_emails[0],
            'recipient_variables': recipient_variables,
            'h:Reply-To': reply_to,
            'bcc': bcc[0],
        }

        mock_post.assert_called_once_with(
            'https://api.mailgun.net/v3/domain/messages',
            auth=('api', 'key'),
            data=expected_data,
            files=attachments,
            timeout=mailgun_email_services.TIMEOUT_SECS
        )
        self.assertTrue(resp)

    @mock.patch('requests.post')
    def test_send_email_to_mailgun_with_bcc_and_recipients(
            self, mock_post: mock.Mock) -> None:
        # Test sending email with single bcc, and multiple recipient emails
        # differentiated by recipient_variables ids.
        mock_response = mock.Mock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        sender_email = 'a@example.com'
        recipient_emails = ['b@example.com']
        subject = 'Hola 😂 - invitation to collaborate'
        plaintext_body = 'plaintext_body 😂'
        html_body = 'Hi abc,<br> 😂'
        recipient_variables: Dict[str, Dict[str, Union[str, float]]] = {
            'b@example.com': {'first': 'Bob', 'id': 1}}
        bcc = ['c@example.com', 'd@example.com']
        reply_to = 'abc'
        attachments = None

        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')

        with self.swap_api_key_secrets_return_secret, swap_domain:
            resp = mailgun_email_services.send_email_to_recipients(
                sender_email,
                recipient_emails,
                subject,
                plaintext_body,
                html_body,
                bcc,
                reply_to,
                recipient_variables
            )

        expected_data = {
            'from': sender_email,
            'subject': subject,
            'text': plaintext_body,
            'html': html_body,
            'to': recipient_emails[0],
            'recipient_variables': recipient_variables,
            'h:Reply-To': reply_to,
            'bcc': bcc,
        }

        mock_post.assert_called_once_with(
            'https://api.mailgun.net/v3/domain/messages',
            auth=('api', 'key'),
            data=expected_data,
            files=attachments,
            timeout=mailgun_email_services.TIMEOUT_SECS
        )
        self.assertTrue(resp)

    @mock.patch('requests.post')
    def test_batch_send_to_mailgun(self, mock_post: mock.Mock) -> None:
        """Test for sending HTTP POST request."""
        mock_response = mock.Mock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        sender_email = 'a@example.com'
        recipient_emails = ['b@example.com', 'c@example.com', 'd@example.com']
        subject = 'Hola 😂 - invitation to collaborate'
        plaintext_body = 'plaintext_body 😂'
        html_body = 'Hi abc,<br> 😂'
        attachments = None

        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')

        with self.swap_api_key_secrets_return_secret, swap_domain:
            resp = mailgun_email_services.send_email_to_recipients(
                sender_email,
                recipient_emails,
                subject,
                plaintext_body,
                html_body
            )

        expected_data = {
            'from': sender_email,
            'subject': subject,
            'text': plaintext_body,
            'html': html_body,
            'to': recipient_emails,
            'recipient_variables': {}
        }

        mock_post.assert_called_once_with(
            'https://api.mailgun.net/v3/domain/messages',
            auth=('api', 'key'),
            data=expected_data,
            files=attachments,
            timeout=mailgun_email_services.TIMEOUT_SECS
        )
        self.assertTrue(resp)

    def test_mailgun_key_not_set_raises_exception(self) -> None:
        """Test that exceptions are raised when API key or domain name are
        unset.
        """
        # Testing no mailgun api key.
        msg_body = textwrap.dedent(
            """
            EmailService.SendMail
            From: a@a.com
            To: b@b.com c@c.com d@d.com
            Subject: Hola 😂 - invitation to collaborate
            Body:
                Content-type: text/plain
                Data length: 16
            Body:
                Content-type: text/html
                Data length: 13

            Bcc: None
            Reply_to: None
            Recipient Variables:
                Length: 0
            """)
        mailgun_exception = self.assertRaisesRegex(
            Exception, (
                'Mailgun API key is not available. Here is the email that '
                'failed sending: %s' % msg_body)
        )
        with self.swap_api_key_secrets_return_none, mailgun_exception:
            with self.capture_logging() as logs:
                mailgun_email_services.send_email_to_recipients(
                    'a@a.com',
                    ['b@b.com', 'c@c.com', 'd@d.com'],
                    'Hola 😂 - invitation to collaborate',
                    'plaintext_body 😂',
                    'Hi abc,<br> 😂')
                self.assertIn(
                    'Cloud Secret Manager is not able to get MAILGUN_API_KEY.',
                    logs
                )

    def test_mailgun_domain_name_not_set_raises_exception(self) -> None:
        # Testing no mailgun domain name.
        msg_body = textwrap.dedent(
            """
            EmailService.SendMail
            From: a@a.com
            To: b@b.com c@c.com d@d.com
            Subject: Hola 😂 - invitation to collaborate
            Body:
                Content-type: text/plain
                Data length: 16
            Body:
                Content-type: text/html
                Data length: 13

            Bcc: None
            Reply_to: None
            Recipient Variables:
                Length: 0
            """)
        mailgun_exception = self.assertRaisesRegex(
            Exception, (
                'Mailgun domain name is not set. Here is the email that '
                'failed sending: %s' % msg_body)
        )
        with self.swap_api_key_secrets_return_secret, mailgun_exception:
            with self.capture_logging() as logs:
                mailgun_email_services.send_email_to_recipients(
                    'a@a.com',
                    ['b@b.com', 'c@c.com', 'd@d.com'],
                    'Hola 😂 - invitation to collaborate',
                    'plaintext_body 😂',
                    'Hi abc,<br> 😂')
                self.assertIn(
                    'Cloud Secret Manager is not able to get MAILGUN_API_KEY.',
                    logs
                )

    @mock.patch('requests.post')
    def test_invalid_status_code_returns_false(
            self, mock_post: mock.Mock) -> None:
        mock_response = mock.Mock()
        mock_response.status_code = 500
        mock_post.return_value = mock_response

        sender_email = 'a@example.com'
        recipient_emails = ['b@example.com', 'c@example.com', 'd@example.com']
        subject = 'Hola 😂 - invitation to collaborate'
        plaintext_body = 'plaintext_body 😂'
        html_body = 'Hi abc,<br> 😂'
        attachments = None

        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')

        with self.swap_api_key_secrets_return_secret, swap_domain:
            resp = mailgun_email_services.send_email_to_recipients(
                sender_email,
                recipient_emails,
                subject,
                plaintext_body,
                html_body
            )

        expected_data = {
            'from': sender_email,
            'subject': subject,
            'text': plaintext_body,
            'html': html_body,
            'to': recipient_emails,
            'recipient_variables': {}
        }

        mock_post.assert_called_once_with(
            'https://api.mailgun.net/v3/domain/messages',
            auth=('api', 'key'),
            data=expected_data,
            files=attachments,
            timeout=mailgun_email_services.TIMEOUT_SECS
        )
        self.assertFalse(resp)
