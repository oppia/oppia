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

"""Tests for the email services API wrapper in DEV_MODE."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging
import textwrap

from core.platform.email import dev_mode_email_services
from core.tests import test_utils
import feconf


class EmailTests(test_utils.GenericTestBase):
    """Tests for sending emails."""

    def test_send_mail_logs_to_terminal(self):
        """In DEV Mode, platforms email_service API that sends a singular email
        logs the correct email info to terminal.
        """
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        msg_body = (
            """
            EmailService.SendMail
            From: %s
            To: %s
            Subject: %s
            Body:
                Content-type: text/plain
                Data length: %d
            Body:
                Content-type: text/html
                Data length: %d

            Bcc: None
            Reply_to: None
            Recipient Variables:
                Length: 0
            """ % (
                feconf.SYSTEM_EMAIL_ADDRESS, feconf.ADMIN_EMAIL_ADDRESS,
                'subject', 4, 4))
        logging_info_email_body = textwrap.dedent(msg_body)
        logging_info_notification = (
            'You are not currently sending out real emails since this is a ' +
            'dev environment. Emails are sent out in the production' +
            ' environment.')

        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        with allow_emailing, (
            self.swap(logging, 'info', _mock_logging_function)):
            dev_mode_email_services.send_email_to_recipients(
                feconf.SYSTEM_EMAIL_ADDRESS, [feconf.ADMIN_EMAIL_ADDRESS],
                'subject', 'body', 'html')
        self.assertEqual(len(observed_log_messages), 2)
        self.assertEqual(
            observed_log_messages,
            [logging_info_email_body, logging_info_notification])

    def test_send_mail_to_multiple_recipients_logs_to_terminal(self):
        """In DEV Mode, platform email_services that sends mail to multiple
        recipients logs the correct info to terminal.
        """
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        recipient_email_list_str = 'a@a.com b@b.com c@c.com... Total: 4 emails.'
        bcc_email_list_str = 'e@e.com f@f.com g@g.com... Total: 4 emails.'
        recipient_variables = (
            {
                'a@a.com': {'first': 'Bob', 'id': 1},
                'b@b.com': {'first': 'Jane', 'id': 2},
                'c@c.com': {'first': 'Rob', 'id': 3},
                'd@d.com': {'first': 'Emily', 'id': 4},
            })
        msg_body = (
            """
            EmailService.SendMail
            From: %s
            To: %s
            Subject: %s
            Body:
                Content-type: text/plain
                Data length: %d
            Body:
                Content-type: text/html
                Data length: %d

            Bcc: %s
            Reply_to: %s
            Recipient Variables:
                Length: %d
            """ % (
                feconf.SYSTEM_EMAIL_ADDRESS, recipient_email_list_str,
                'subject', 4, 4, bcc_email_list_str, '123',
                len(recipient_variables)))
        logging_info_email_body = textwrap.dedent(msg_body)
        logging_info_notification = (
            'You are not currently sending out real emails since this is a ' +
            'dev environment. Emails are sent out in the production' +
            ' environment.')

        allow_emailing = self.swap(feconf, 'CAN_SEND_EMAILS', True)
        with allow_emailing, (
            self.swap(logging, 'info', _mock_logging_function)):
            dev_mode_email_services.send_email_to_recipients(
                feconf.SYSTEM_EMAIL_ADDRESS,
                ['a@a.com', 'b@b.com', 'c@c.com', 'd@d.com'],
                'subject', 'body', 'html',
                bcc=['e@e.com', 'f@f.com', 'g@g.com', 'h@h.com'],
                reply_to='123',
                recipient_variables=recipient_variables)
        self.assertEqual(len(observed_log_messages), 2)
        self.assertEqual(
            observed_log_messages,
            [logging_info_email_body, logging_info_notification])
