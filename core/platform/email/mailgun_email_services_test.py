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

from core.platform.email import mailgun_email_services
from core.tests import test_utils
import feconf


class EmailTests(test_utils.GenericTestBase):
    """Tests for sending emails."""

    def test_sending_email(self):
        # Emails are not sent if the CAN_SEND_EMAILS setting is not turned on.
        # mailgun api key and domain name are required to use API.
        can_send_emails = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        mailgun_api_exception = (
            self.assertRaisesRegexp(
                Exception, 'Mailgun API key is not available.'))
        with can_send_emails, mailgun_api_exception:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)

        can_send_emails = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        mailgun_api = self.swap(feconf, 'MAILGUN_API_KEY', 'api')
        mailgun_domain_name_exception = (
            self.assertRaisesRegexp(
                Exception, 'Mailgun domain name is not set.'))
        with can_send_emails, mailgun_api, mailgun_domain_name_exception:
            mailgun_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)
