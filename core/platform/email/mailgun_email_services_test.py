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

from core.platform.email import mailgun_email_services
from core.tests import test_utils
import feconf
import python_utils


class EmailTests(test_utils.GenericTestBase):
    """Tests for sending emails."""

    class Response(python_utils.OBJECT):
        """Class to mock python_utils.url_open responses."""

        def __init__(self, url, expected_url):
            self.url = url
            self.expected_url = expected_url

        def getcode(self):
            """Gets the status code of this url_open mock.

            Returns:
                int. 200 to signify status is OK. 500 otherwise.
            """
            return 200 if self.url == self.expected_url else 500

    def test_send_email_to_mailgun(self):
        """Test for sending HTTP POST request."""
        # Test sending email without bcc, reply_to or recipient_variables.
        expected_query_url = (
            'https://api.mailgun.net/v3/domain/messages',
            (
                'from=a%40a.com&text=plaintext_body+%F0%9F%98%82&recipient_vari'
                'ables=%7B%7D&to=b%40b.com&html=Hi+abc%2C%3Cbr%3E+%F0%9F%98%82&'
                'subject=Hola+%F0%9F%98%82+-+invitation+to+collaborate'),
            {'Authorization': 'Basic YXBpOmtleQ=='})
        swapped_urlopen = lambda x: self.Response(x, expected_query_url)
        swapped_request = lambda *args: args
        swap_urlopen_context = self.swap(
            python_utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            python_utils, 'url_request', swapped_request)
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with swap_urlopen_context, swap_request_context, swap_api, swap_domain:
            resp = mailgun_email_services.send_email_to_recipients(
                'a@a.com',
                ['b@b.com'],
                (
                    'Hola 😂 - invitation to collaborate'
                    .encode(encoding='utf-8')),
                'plaintext_body 😂'.encode(encoding='utf-8'),
                'Hi abc,<br> 😂'.encode(encoding='utf-8'))
            self.assertTrue(resp)

        # Test sending email with single bcc and single recipient email.
        expected_query_url = (
            'https://api.mailgun.net/v3/domain/messages',
            (
                'from=a%40a.com&h%3AReply-To=abc&text=plaintext_body' +
                '+%F0%9F%98%82&bcc=c%40c.com&recipient_variables=%7Bu' +
                '%27b%40b.com%27%3A+%7Bu%27id%27%3A+1%2C+u%27first%27%3A+u%' +
                '27Bob%27%7D%7D&to=b%40b.com&html=Hi+abc%2C%3Cbr%3E+%F0%9F%9' +
                '8%82&subject=Hola+%F0%9F%98%82+-+invitation+to+collaborate'),
            {'Authorization': 'Basic YXBpOmtleQ=='})
        swapped_urlopen = lambda x: self.Response(x, expected_query_url)
        swap_urlopen_context = self.swap(
            python_utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            python_utils, 'url_request', swapped_request)
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with swap_urlopen_context, swap_request_context, swap_api, swap_domain:
            resp = mailgun_email_services.send_email_to_recipients(
                'a@a.com',
                ['b@b.com'],
                (
                    'Hola 😂 - invitation to collaborate'
                    .encode(encoding='utf-8')),
                'plaintext_body 😂'.encode(encoding='utf-8'),
                'Hi abc,<br> 😂'.encode(encoding='utf-8'),
                bcc=['c@c.com'],
                reply_to='abc',
                recipient_variables={'b@b.com': {'first': 'Bob', 'id': 1}})
            self.assertTrue(resp)

        # Test sending email with single bcc, and multiple recipient emails
        # differentiated by recipient_variables ids.
        expected_query_url = (
            'https://api.mailgun.net/v3/domain/messages',
            (
                'from=a%40a.com&h%3AReply-To=abc&text=plaintext_body+%F0%9F' +
                '%98%82&bcc=%5Bu%27c%40c.com%27%2C+u%27d%40d.com%27%5D&' +
                'recipient_variables=%7Bu%27b%40b.com%27%3A+%7Bu%27id%27%3A+' +
                '1%2C+u%27first%27%3A+u%27Bob%27%7D%7D&to=b%40b.com&html=' +
                'Hi+abc%2C%3Cbr%3E+%F0%9F%98%82&subject=Hola+%F0%9F%98%82' +
                '+-+invitation+to+collaborate'),
            {'Authorization': 'Basic YXBpOmtleQ=='})
        swapped_urlopen = lambda x: self.Response(x, expected_query_url)
        swap_urlopen_context = self.swap(
            python_utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            python_utils, 'url_request', swapped_request)
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with swap_urlopen_context, swap_request_context, swap_api, swap_domain:
            resp = mailgun_email_services.send_email_to_recipients(
                'a@a.com',
                ['b@b.com'],
                (
                    'Hola 😂 - invitation to collaborate'
                    .encode(encoding='utf-8')),
                'plaintext_body 😂'.encode(encoding='utf-8'),
                'Hi abc,<br> 😂'.encode(encoding='utf-8'),
                bcc=['c@c.com', 'd@d.com'],
                reply_to='abc',
                recipient_variables=({'b@b.com': {'first': 'Bob', 'id': 1}}))
            self.assertTrue(resp)

    def test_batch_send_to_mailgun(self):
        """Test for sending HTTP POST request."""
        expected_query_url = (
            'https://api.mailgun.net/v3/domain/messages',
            (
                'from=a%40a.com&text=plaintext_body+%F0%9F%98%82&'
                'recipient_variables=%7B%7D&to=%5Bu%27b%40b.com%27%2C+u%27c%40c'
                '.com%27%2C+u%27d%40d.com%27%5D&html=Hi+abc%2C%3Cbr%3E+%F0%9F%'
                '98%82&subject=Hola+%F0%9F%98%82+-+invitation+to+collaborate'),
            {'Authorization': 'Basic YXBpOmtleQ=='})
        swapped_urlopen = lambda x: self.Response(x, expected_query_url)
        swapped_request = lambda *args: args
        swap_urlopen_context = self.swap(
            python_utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            python_utils, 'url_request', swapped_request)
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with swap_urlopen_context, swap_request_context, swap_api, swap_domain:
            resp = mailgun_email_services.send_email_to_recipients(
                'a@a.com',
                ['b@b.com', 'c@c.com', 'd@d.com'],
                'Hola 😂 - invitation to collaborate'.encode(
                    encoding='utf-8'),
                'plaintext_body 😂'.encode(encoding='utf-8'),
                'Hi abc,<br> 😂'.encode(encoding='utf-8'))
            self.assertTrue(resp)

    def test_mailgun_key_or_domain_name_not_set_raises_exception(self):
        """Test that exceptions are raised when API key or domain name are
        unset.
        """
        # Testing no mailgun api key.
        mailgun_exception = self.assertRaisesRegexp(
            Exception, 'Mailgun API key is not available.')
        with mailgun_exception:
            mailgun_email_services.send_email_to_recipients(
                'a@a.com',
                ['b@b.com', 'c@c.com', 'd@d.com'],
                'Hola 😂 - invitation to collaborate'.encode(
                    encoding='utf-8'),
                'plaintext_body 😂'.encode(encoding='utf-8'),
                'Hi abc,<br> 😂'.encode(encoding='utf-8'))

        # Testing no mailgun domain name.
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        mailgun_exception = self.assertRaisesRegexp(
            Exception, 'Mailgun domain name is not set.')
        with swap_api, mailgun_exception:
            mailgun_email_services.send_email_to_recipients(
                'a@a.com',
                ['b@b.com', 'c@c.com', 'd@d.com'],
                'Hola 😂 - invitation to collaborate'.encode(
                    encoding='utf-8'),
                'plaintext_body 😂'.encode(encoding='utf-8'),
                'Hi abc,<br> 😂'.encode(encoding='utf-8'))

    def test_invalid_status_code_returns_false(self):
        expected_query_url = (
            'https://api.mailgun.net/v3/domain/messages',
            (
                'from=a%40a.com&h%3AReply-To=abc&text=plaintext_body+%F0%9F' +
                '%98%82&bcc=%5Bu%27c%40c.com%27%2C+u%27d%40d.com%27%5D&' +
                'recipient_variables=%7Bu%27b%40b.com%27%3A+%7Bu%27id%27%3A+' +
                '1%2C+u%27first%27%3A+u%27Bob%27%7D%7D&to=b%40b.com&html=' +
                'Hi+abc%2C%3Cbr%3E+%F0%9F%98%82&subject=Hola+%F0%9F%98%82' +
                '+-+invitation+to+collaborate'),
            {'Authorization': 'Basic'})
        swapped_request = lambda *args: args
        swapped_urlopen = lambda x: self.Response(x, expected_query_url)
        swap_urlopen_context = self.swap(
            python_utils, 'url_open', swapped_urlopen)
        swap_request_context = self.swap(
            python_utils, 'url_request', swapped_request)
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        swap_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with swap_urlopen_context, swap_request_context, swap_api, swap_domain:
            resp = mailgun_email_services.send_email_to_recipients(
                'a@a.com',
                ['b@b.com'],
                (
                    'Hola 😂 - invitation to collaborate'
                    .encode(encoding='utf-8')),
                'plaintext_body 😂'.encode(encoding='utf-8'),
                'Hi abc,<br> 😂'.encode(encoding='utf-8'),
                bcc=['c@c.com', 'd@d.com'],
                reply_to='abc',
                recipient_variables=({'b@b.com': {'first': 'Bob', 'id': 1}}))
            self.assertFalse(resp)
