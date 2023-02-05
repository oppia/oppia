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

import urllib

from core import feconf
from core import utils
from core.platform import models
from core.platform.email import mailgun_email_services
from core.tests import test_utils

from typing import Dict, Tuple

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

    class Response:
        """Class to mock utils.url_open responses."""

        def __init__(
            self, url: MailgunQueryType, expected_url: MailgunQueryType
        ) -> None:
            self.url = url
            self.expected_url = expected_url

        def getcode(self) -> int:
            """Gets the status code of this url_open mock.

            Returns:
                int. 200 to signify status is OK. 500 otherwise.
            """
            return 200 if self.url == self.expected_url else 500

    def test_send_email_to_mailgun_without_bcc_reply_to_and_recipients(
        self
    ) -> None:
        """Test for sending HTTP POST request."""
        # Test sending email without bcc, reply_to or recipient_variables.
        expected_query_url: MailgunQueryType = (
            'https://api.mailgun.net/v3/domain/messages',
            b'from=a%40a.com&'
            b'subject=Hola+%F0%9F%98%82+-+invitation+to+collaborate&'
            b'text=plaintext_body+%F0%9F%98%82&'
            b'html=Hi+abc%2C%3Cbr%3E+%F0%9F%98%82&'
            b'to=b%40b.com&'
            b'recipient_variables=%7B%7D',
            {'Authorization': 'Basic YXBpOmtleQ=='}
        )
        swapped_urlopen = lambda x: self.Response(x, expected_query_url)

        swap_urlopen_context = self.swap(
            utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            urllib.request, 'Request', self.swapped_request)
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with self.swap_api_key_secrets_return_secret, swap_urlopen_context:
            with swap_request_context, swap_domain:
                resp = mailgun_email_services.send_email_to_recipients(
                    'a@a.com',
                    ['b@b.com'],
                    'Hola 😂 - invitation to collaborate',
                    'plaintext_body 😂',
                    'Hi abc,<br> 😂')
                self.assertTrue(resp)

    def test_send_email_to_mailgun_with_bcc_and_recipient(self) -> None:
        # Test sending email with single bcc and single recipient email.
        expected_query_url = (
            'https://api.mailgun.net/v3/domain/messages',
            b'from=a%40a.com&'
            b'subject=Hola+%F0%9F%98%82+-+invitation+to+collaborate&'
            b'text=plaintext_body+%F0%9F%98%82&'
            b'html=Hi+abc%2C%3Cbr%3E+%F0%9F%98%82&'
            b'to=b%40b.com&'
            b'bcc=c%40c.com&'
            b'h%3AReply-To=abc&'
            b'recipient_variables=%7B%27b%40b.com'
            b'%27%3A+%7B%27first%27%3A+%27Bob%27%2C+%27id%27%3A+1%7D%7D',
            {'Authorization': 'Basic YXBpOmtleQ=='})
        swapped_urlopen = lambda x: self.Response(x, expected_query_url)
        swap_urlopen_context = self.swap(
            utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            urllib.request, 'Request', self.swapped_request)
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with self.swap_api_key_secrets_return_secret, swap_urlopen_context:
            with swap_request_context, swap_domain:
                resp = mailgun_email_services.send_email_to_recipients(
                    'a@a.com',
                    ['b@b.com'],
                    'Hola 😂 - invitation to collaborate',
                    'plaintext_body 😂',
                    'Hi abc,<br> 😂',
                    bcc=['c@c.com'],
                    reply_to='abc',
                    recipient_variables={'b@b.com': {'first': 'Bob', 'id': 1}})
                self.assertTrue(resp)

    def test_send_email_to_mailgun_with_bcc_and_recipients(self) -> None:
        # Test sending email with single bcc, and multiple recipient emails
        # differentiated by recipient_variables ids.
        expected_query_url = (
            'https://api.mailgun.net/v3/domain/messages',
            b'from=a%40a.com&'
            b'subject=Hola+%F0%9F%98%82+-+invitation+to+collaborate&'
            b'text=plaintext_body+%F0%9F%98%82&'
            b'html=Hi+abc%2C%3Cbr%3E+%F0%9F%98%82&'
            b'to=b%40b.com&'
            b'bcc=%5B%27c%40c.com%27%2C+%27d%40d.com%27%5D&'
            b'h%3AReply-To=abc&'
            b'recipient_variables=%7B%27b%40b.com'
            b'%27%3A+%7B%27first%27%3A+%27Bob%27%2C+%27id%27%3A+1%7D%7D',
            {'Authorization': 'Basic YXBpOmtleQ=='})
        swapped_urlopen = lambda x: self.Response(x, expected_query_url)
        swap_urlopen_context = self.swap(
            utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            urllib.request, 'Request', self.swapped_request)
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with self.swap_api_key_secrets_return_secret, swap_urlopen_context:
            with swap_request_context, swap_domain:
                resp = mailgun_email_services.send_email_to_recipients(
                    'a@a.com',
                    ['b@b.com'],
                    'Hola 😂 - invitation to collaborate',
                    'plaintext_body 😂',
                    'Hi abc,<br> 😂',
                    bcc=['c@c.com', 'd@d.com'],
                    reply_to='abc',
                    recipient_variables=({
                        'b@b.com': {'first': 'Bob', 'id': 1}
                    })
                )
                self.assertTrue(resp)

    def test_batch_send_to_mailgun(self) -> None:
        """Test for sending HTTP POST request."""
        expected_query_url: MailgunQueryType = (
            'https://api.mailgun.net/v3/domain/messages',
            b'from=a%40a.com&'
            b'subject=Hola+%F0%9F%98%82+-+invitation+to+collaborate&'
            b'text=plaintext_body+%F0%9F%98%82&'
            b'html=Hi+abc%2C%3Cbr%3E+%F0%9F%98%82&'
            b'to=%5B%27b%40b.com%27%2C+%27c%40c.com%27%2C+%27d%40d.com%27%5D&'
            b'recipient_variables=%7B%7D',
            {'Authorization': 'Basic YXBpOmtleQ=='})
        swapped_urlopen = lambda x: self.Response(x, expected_query_url)
        swapped_request = lambda *args: args
        swap_urlopen_context = self.swap(
            utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            urllib.request, 'Request', swapped_request)
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with self.swap_api_key_secrets_return_secret, swap_urlopen_context:
            with swap_request_context, swap_domain:
                resp = mailgun_email_services.send_email_to_recipients(
                    'a@a.com',
                    ['b@b.com', 'c@c.com', 'd@d.com'],
                    'Hola 😂 - invitation to collaborate',
                    'plaintext_body 😂',
                    'Hi abc,<br> 😂')
                self.assertTrue(resp)

    def test_mailgun_key_not_set_raises_exception(self) -> None:
        """Test that exceptions are raised when API key or domain name are
        unset.
        """
        # Testing no mailgun api key.
        mailgun_exception = self.assertRaisesRegex(
            Exception, 'Mailgun API key is not available.')
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
        mailgun_exception = self.assertRaisesRegex(
            Exception, 'Mailgun domain name is not set.')
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

    def test_invalid_status_code_returns_false(self) -> None:
        expected_query_url: MailgunQueryType = (
            'https://api.mailgun.net/v3/domain/messages',
            b'from=a%40a.com&'
            b'subject=Hola+%F0%9F%98%82+-+invitation+to+collaborate&'
            b'text=plaintext_body+%F0%9F%98%82&'
            b'html=Hi+abc%2C%3Cbr%3E+%F0%9F%98%82&'
            b'to=%5B%27b%40b.com%27%2C+%27c%40c.com%27%2C+%27d%40d.com%27%5D&'
            b'recipient_variables=%7B%7D',
            {'Authorization': 'Basic'})
        swapped_request = lambda *args: args
        swapped_urlopen = lambda x: self.Response(x, expected_query_url)
        swap_urlopen_context = self.swap(
            utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            urllib.request, 'Request', swapped_request)
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with self.swap_api_key_secrets_return_secret, swap_urlopen_context:
            with swap_request_context, swap_domain:
                resp = mailgun_email_services.send_email_to_recipients(
                    'a@a.com',
                    ['b@b.com'],
                    'Hola 😂 - invitation to collaborate',
                    'plaintext_body 😂',
                    'Hi abc,<br> 😂',
                    bcc=['c@c.com', 'd@d.com'],
                    reply_to='abc',
                    recipient_variables=({
                        'b@b.com': {'first': 'Bob', 'id': 1}
                    })
                )
                self.assertFalse(resp)
