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

from core.platform.email import gae_email_services
from core.tests import test_utils
import feconf


class EmailTests(test_utils.GenericTestBase):
    """Tests for sending emails."""

    def test_sending_email(self):
        # Emails are not sent if the CAN_SEND_EMAILS setting is not turned on.
        email_exception = (
            self.assertRaisesRegexp(Exception, 'This app cannot send emails.'))
        with self.swap(feconf, 'CAN_SEND_EMAILS', False), email_exception:
            gae_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)
        messages = self.mail_stub.get_sent_messages(
            to=feconf.ADMIN_EMAIL_ADDRESS)
        self.assertEqual(0, len(messages))

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            gae_email_services.send_mail(
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 'body', 'html', bcc_admin=False)
        messages = self.mail_stub.get_sent_messages(
            to=feconf.ADMIN_EMAIL_ADDRESS)
        self.assertEqual(1, len(messages))
