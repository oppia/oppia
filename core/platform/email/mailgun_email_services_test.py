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

from __future__ import absolute_import
from __future__ import unicode_literals

import ast

from core.platform.email import mailgun_email_services
from core.tests import test_utils
import feconf
import python_utils

from typing import Dict, List, Tuple, Union

MailgunQueryType = Tuple[
    str,
    Dict[str, List[Union[str, Dict[str, Dict[str, Union[int, str]]]]]],
    Dict[str, str]
]


class EmailTests(test_utils.GenericTestBase):
    """Tests for sending emails."""

    class Response(python_utils.OBJECT):
        """Class to mock python_utils.url_open responses."""

        def __init__(
                self,
                url: MailgunQueryType,
                expected_url: MailgunQueryType
        ) -> None:
            self.url = url
            self.expected_url = expected_url

        def getcode(self) -> int:
            """Gets the status code of this url_open mock.

            Returns:
                int. 200 to signify status is OK. 500 otherwise.
            """
            self.url = (
                self.url[0],
                python_utils.parse_query_string(self.url[1]), # type: ignore[no-untyped-call]
                self.url[2],
            )
            recipient_variable_0 = self.url[1]['recipient_variables'][0]
            # Letting mypy know that the variable is of type str.
            assert isinstance(recipient_variable_0, str)
            self.url[1]['recipient_variables'] = [ast.literal_eval(
                recipient_variable_0)]
            return 200 if self.url == self.expected_url else 500

    def test_send_email_to_mailgun(self) -> None:
        """Test for sending HTTP POST request."""
        # Test sending email without bcc, reply_to or recipient_variables.
        expected_query_url: MailgunQueryType = (
            'https://api.mailgun.net/v3/domain/messages',
            {
                'from': ['a@a.com'],
                'text': ['plaintext_body 😂'],
                'recipient_variables': [{}],
                'to': ['b@b.com'],
                'html': ['Hi abc,<br> 😂'],
                'subject': ['Hola 😂 - invitation to collaborate']
            },
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
                'Hola 😂 - invitation to collaborate',
                'plaintext_body 😂',
                'Hi abc,<br> 😂')
            self.assertTrue(resp)

        # Test sending email with single bcc and single recipient email.
        expected_query_url = (
            'https://api.mailgun.net/v3/domain/messages',
            {
                'from': ['a@a.com'],
                'h:Reply-To': ['abc'],
                'text': ['plaintext_body 😂'],
                'bcc': ['c@c.com'],
                'recipient_variables': [
                    {'b@b.com': {'first': 'Bob', 'id': 1}}
                ],
                'to': ['b@b.com'],
                'html': ['Hi abc,<br> 😂'],
                'subject': ['Hola 😂 - invitation to collaborate']
            },
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
                'Hola 😂 - invitation to collaborate',
                'plaintext_body 😂',
                'Hi abc,<br> 😂',
                bcc=['c@c.com'],
                reply_to='abc',
                recipient_variables={'b@b.com': {'first': 'Bob', 'id': 1}})
            self.assertTrue(resp)

        # Test sending email with single bcc, and multiple recipient emails
        # differentiated by recipient_variables ids.
        expected_query_url = (
            'https://api.mailgun.net/v3/domain/messages',
            {
                'from': ['a@a.com'],
                'h:Reply-To': ['abc'],
                'text': ['plaintext_body 😂'],
                'bcc': ['[\'c@c.com\', \'d@d.com\']'],
                'recipient_variables': [
                    {'b@b.com': {'id': 1, 'first': 'Bob'}}
                ],
                'to': ['b@b.com'],
                'html': ['Hi abc,<br> 😂'],
                'subject': ['Hola 😂 - invitation to collaborate']
            },
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
                'Hola 😂 - invitation to collaborate',
                'plaintext_body 😂',
                'Hi abc,<br> 😂',
                bcc=['c@c.com', 'd@d.com'],
                reply_to='abc',
                recipient_variables=({'b@b.com': {'first': 'Bob', 'id': 1}}))
            self.assertTrue(resp)

    def test_batch_send_to_mailgun(self) -> None:
        """Test for sending HTTP POST request."""
        expected_query_url: MailgunQueryType = (
            'https://api.mailgun.net/v3/domain/messages',
            {
                'from': ['a@a.com'],
                'text': ['plaintext_body 😂'],
                'recipient_variables': [{}],
                'to': ['[\'b@b.com\', \'c@c.com\', \'d@d.com\']'],
                'html': ['Hi abc,<br> 😂'],
                'subject': ['Hola 😂 - invitation to collaborate']
            },
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
                'Hola 😂 - invitation to collaborate',
                'plaintext_body 😂',
                'Hi abc,<br> 😂')
            self.assertTrue(resp)

    def test_mailgun_key_or_domain_name_not_set_raises_exception(self) -> None:
        """Test that exceptions are raised when API key or domain name are
        unset.
        """
        # Testing no mailgun api key.
        mailgun_exception = self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'Mailgun API key is not available.')
        with mailgun_exception:
            mailgun_email_services.send_email_to_recipients(
                'a@a.com',
                ['b@b.com', 'c@c.com', 'd@d.com'],
                'Hola 😂 - invitation to collaborate',
                'plaintext_body 😂',
                'Hi abc,<br> 😂')

        # Testing no mailgun domain name.
        swap_api = self.swap(feconf, 'MAILGUN_API_KEY', 'key')
        mailgun_exception = self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            Exception, 'Mailgun domain name is not set.')
        with swap_api, mailgun_exception:
            mailgun_email_services.send_email_to_recipients(
                'a@a.com',
                ['b@b.com', 'c@c.com', 'd@d.com'],
                'Hola 😂 - invitation to collaborate',
                'plaintext_body 😂',
                'Hi abc,<br> 😂')

    def test_invalid_status_code_returns_false(self) -> None:
        expected_query_url: MailgunQueryType = (
            'https://api.mailgun.net/v3/domain/messages',
            {
                'from': ['a@a.com'],
                'h:Reply-To': ['abc'],
                'text': ['plaintext_body 😂'],
                'bcc': ['[\'c@c.com\', \'d@d.com\']'],
                'recipient_variables': [
                    {'b@b.com': {'id': 1, 'first': 'Bob'}}
                ],
                'to': ['b@b.com'],
                'html': ['Hi abc,<br> 😂'],
                'subject': ['Hola 😂 - invitation to collaborate']
            },
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
                'Hola 😂 - invitation to collaborate',
                'plaintext_body 😂',
                'Hi abc,<br> 😂',
                bcc=['c@c.com', 'd@d.com'],
                reply_to='abc',
                recipient_variables=({'b@b.com': {'first': 'Bob', 'id': 1}}))
            self.assertFalse(resp)
