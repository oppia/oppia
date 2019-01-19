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

from core.platform.email import mailgun_email_services
from core.tests import test_utils
import feconf
import requests


class EmailTests(test_utils.GenericTestBase):
    """Tests for sending emails."""

    def test_sending_email_exceptions(self):
        """Will test the possible exceptions in the send_mail function.

        1) Emails are not sent if the CAN_SEND_EMAILS setting is not turned on.
        2) Mailgun API key and/or domain name are not supplied (required for API).
        """
        mailgun_api_exception = (
            self.assertRaisesRegexp(
                Exception, 'Mailgun API key is not available.'))
        with mailgun_api_exception:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)

        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain_name_exception = (
            self.assertRaisesRegexp(
                Exception, 'Mailgun domain name is not set.'))
        with mailgun_api, mailgun_domain_name_exception:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)

        send_email_exception = (
            self.assertRaisesRegexp(
                Exception, 'This app cannot send emails to users.'))
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with mailgun_api, mailgun_domain, send_email_exception:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)


    def test_sending_email_data(self):
        """Verifies that the data sent in send_mail is correct."""
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_email_sending = self.swap(feconf, 'CAN_SEND_EMAILS', True)

        # This data should have been sent in the requests.post().
        expected = {'from':feconf.SYSTEM_EMAIL_ADDRESS, 'to': feconf.ADMIN_EMAIL_ADDRESS, \
                    'subject':'subject', 'text':'body', 'html':'html'}

        # Lambda function, will replace requests.post() in send_mail.
        requests_post_lambda = lambda domain_name, auth=None, data=None: \
                                self.assertDictContainsSubset(expected, data)
        modified_post_request = self.swap(requests, 'post', requests_post_lambda)

        with mailgun_api, mailgun_domain, modified_post_request, allow_email_sending:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)


    def test_bcc_admin_flag(self):
        """Verifies that the bcc admin flag is working properly in send_mail.

        Note that we replace the requests.post() function in send_mail with 
        an alternate lambda that asserts the correct values were placed in 
        the data dictionary that is then passed to the mailgun api.
        """
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_email_sending = self.swap(feconf, 'CAN_SEND_EMAILS', True)

        # Lambda function, will replace requests.post() in send_mail.
        requests_post_lambda = lambda domain_name, auth=None, data=None: \
                        self.assertEqual(data['bcc'], feconf.ADMIN_EMAIL_ADDRESS)
        modified_post_request = self.swap(requests, 'post', requests_post_lambda)

        with mailgun_api, mailgun_domain, modified_post_request, allow_email_sending:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=True)


    def test_reply_to_id_flag(self):
        """Verifies that the reply_to_id flag is working properly."""
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_email_sending = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        reply_id = 123

        # Lambda function, will replace requests.post() in send_mail.
        requests_post_lambda = lambda domain_name, auth=None, data=None: \
                        self.assertEqual(data['h:Reply-To'], \
                            "reply+" + str(reply_id) + "@" + feconf.INCOMING_EMAILS_DOMAIN_NAME)
        modified_post_request = self.swap(requests, 'post', requests_post_lambda)

        with mailgun_api, mailgun_domain, modified_post_request, allow_email_sending:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False, reply_to_id=reply_id)


    def test_sending_bulk_email_exceptions(self):
        """Will test the same exceptions as those in test_sending_email_exceptions,
        but for the send bulk mail function.
        """
        mailgun_api_exception = (
            self.assertRaisesRegexp(
                Exception, 'Mailgun API key is not available.'))
        with mailgun_api_exception:
            mailgun_email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, [feconf.ADMIN_EMAIL_ADDRESS],
                'subject', 'body', 'html')

        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain_name_exception = (
            self.assertRaisesRegexp(
                Exception, 'Mailgun domain name is not set.'))
        with mailgun_api, mailgun_domain_name_exception:
            mailgun_email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, [feconf.ADMIN_EMAIL_ADDRESS],
                'subject', 'body', 'html')

        send_email_exception = (
            self.assertRaisesRegexp(
                Exception, 'This app cannot send emails to users.'))
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        with mailgun_api, mailgun_domain, send_email_exception:
            mailgun_email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, [feconf.ADMIN_EMAIL_ADDRESS],
                'subject', 'body', 'html')


    def test_sending_bulk_email_data(self):
        """Verifies that the data sent in send_bulk_mail is correct
        for each user in the recipient list.
        """
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain = self.swap(feconf, 'MAILGUN_DOMAIN_NAME', 'domain')
        allow_email_sending = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        recipients = [feconf.ADMIN_EMAIL_ADDRESS]

        # This data should have been sent in the requests.post().
        expected = {'from':feconf.SYSTEM_EMAIL_ADDRESS, 'to': [feconf.ADMIN_EMAIL_ADDRESS], \
                    'subject':'subject', 'text':'body', 'html':'html', 'recipient-variables': '{}'}

        # Lambda function, will replace requests.post() in send_mail.
        requests_post_lambda = lambda domain_name, auth=None, data=None: \
                        self.assertDictContainsSubset(expected, data)

        modified_post_request = self.swap(requests, 'post', requests_post_lambda)

        with mailgun_api, mailgun_domain, modified_post_request, allow_email_sending:
            mailgun_email_services.send_bulk_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, [feconf.ADMIN_EMAIL_ADDRESS],
                'subject', 'body', 'html')
