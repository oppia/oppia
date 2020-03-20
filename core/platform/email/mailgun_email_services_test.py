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

    def test_post_to_mailgun(self):
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
            result = mailgun_email_services.post_to_mailgun({
                'from': 'a@a.com',
                'to': 'b@b.com',
                'subject': 'Hola 😂 - invitation to collaborate'.encode(
                    encoding='utf-8'),
                'text': 'plaintext_body 😂'.encode(encoding='utf-8'),
                'html': 'Hi abc,<br> 😂'.encode(encoding='utf-8')
            })
            expected = (
                'https://api.mailgun.net/v3/domain/messages',
                ('to=b%40b.com&text=plaintext_body+%F0%9F%98%82&html=Hi+abc'
                 '%2C%3Cbr%3E+%F0%9F%98%82&from=a%40a.com&subject=Hola+%F0'
                 '%9F%98%82+-+invitation+to+collaborate'),
                {'Authorization': 'Basic YXBpOmtleQ=='})
            self.assertEqual(result, expected)

    def test_send_mail_raises_exception_for_missing_api_key(self):
        """Tests the missing Mailgun API key exception."""
        mailgun_api_exception = (
            self.assertRaisesRegexp(
                Exception, 'Mailgun API key is not available.'))

        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        with mailgun_api_exception, allow_emailing:
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
        with mailgun_api, mailgun_domain_name_exception, allow_emailing:
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
        with mailgun_api, mailgun_domain, send_email_exception:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)

    def test_send_mail_data_properly_sent(self):
        """Verifies that the data sent in send_mail is correct."""
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)

        # Data we expect to have been sent in the
        # mailgun_email_services.post_to_mailgun().
        expected = {'from': feconf.SYSTEM_EMAIL_ADDRESS,
                    'to': feconf.ADMIN_EMAIL_ADDRESS,
                    'subject': 'subject',
                    'text': 'body',
                    'html': 'html'}

        # Lambda function, will replace post_to_mailgun().
        req_post_lambda = (lambda data=None:
                           self.assertDictContainsSubset(expected, data))
        post_request = self.swap(
            mailgun_email_services, 'post_to_mailgun', req_post_lambda)

        with mailgun_api, mailgun_domain, post_request, allow_emailing:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)

    def test_bcc_admin_flag(self):
        """Verifies that the bcc admin flag is working properly in send_mail.

        Note that we replace the mailgun_email_services.post_to_mailgun()
        function in send_mail with an alternate lambda that asserts the correct
        values were placed in the data dictionary that is then passed to the
        mailgun api.
        """
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)

        # Lambda function, will replace post_to_mailgun().
        req_post_lambda = (lambda data=None:
                           self.assertEqual(
                               data['bcc'], feconf.ADMIN_EMAIL_ADDRESS))
        post_request = self.swap(
            mailgun_email_services, 'post_to_mailgun', req_post_lambda)

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

        # Lambda function, will replace post_to_mailgun().
        req_post_lambda = (
            lambda data=None:
            self.assertEqual(
                data['h:Reply-To'],
                'reply+' + python_utils.UNICODE(reply_id) + '@' +
                feconf.INCOMING_EMAILS_DOMAIN_NAME))
        post_request = self.swap(
            mailgun_email_services, 'post_to_mailgun', req_post_lambda)

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
        with mailgun_api_exception, allow_emailing:
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
        with mailgun_api, mailgun_domain_name_exception, allow_emailing:
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
        with mailgun_api, mailgun_domain, send_email_exception:
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

        # Data that we expect to have been sent in the post_to_mailgun().
        expected = ({'from': feconf.SYSTEM_EMAIL_ADDRESS, 'to': recipients,
                     'subject': 'subject', 'text': 'body', 'html': 'html',
                     'recipient-variables': '{}'})

        # Lambda function, will replace post_to_mailgun().
        req_post_lambda = (lambda data=None:
                           self.assertDictContainsSubset(expected, data))
        post_request = self.swap(
            mailgun_email_services, 'post_to_mailgun', req_post_lambda)

        with mailgun_api, mailgun_domain, post_request, allow_emailing:
            mailgun_email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, recipients,
                'subject', 'body', 'html')
