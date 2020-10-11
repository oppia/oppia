# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for domain objects for models relating to emails."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import email_domain
from core.tests import test_utils


class EmailDomainTest(test_utils.GenericTestBase):
    """Tests for email_domain classes."""

    recipient_id = 'sample_recipient_id'
    sender_id = 'sample_sender_id'
    intent = 'sample_intent'
    email_subject = 'sample_email_subject'
    email_html_body = '<p>sample_email_html_body</p>'
    sender_email = 'sample_sender_email'
    recipient_email = 'sample_recipient_email'
    sender_name = 'sample_sender_name'
    bcc_admin = True
    reply_to_id = 'sample_reply_to_id'
    default_sender_name = None
    default_bcc_admin = False
    default_reply_to_id = None

    def test_that_general_feedback_thread_reply_info_objects_are_created(self):
        obj = email_domain.FeedbackThreadReplyInfo(
            'user1.exploration.exp1.1', 'reply_to_id1')
        self.assertEqual(obj.id, 'user1.exploration.exp1.1')
        self.assertEqual(obj.reply_to_id, 'reply_to_id1')
        self.assertEqual(obj.user_id, 'user1')
        self.assertEqual(obj.entity_type, 'exploration')
        self.assertEqual(obj.entity_id, 'exp1')
        self.assertEqual(obj.thread_id, 'exploration.exp1.1')

    def test_send_email_info_with_valid_default_arguments_has_correct_values(
            self):
        send_email_info = email_domain.SendEmailInfo(
            self.recipient_id, self.sender_id, self.intent, self.email_subject,
            self.email_html_body, self.sender_email, self.recipient_email
        )

        self.assertEqual(send_email_info.recipient_id, self.recipient_id)
        self.assertEqual(send_email_info.sender_id, self.sender_id)
        self.assertEqual(send_email_info.intent, self.intent)
        self.assertEqual(send_email_info.email_subject, self.email_subject)
        self.assertEqual(send_email_info.email_html_body, self.email_html_body)
        self.assertEqual(send_email_info.sender_name, self.default_sender_name)
        self.assertEqual(send_email_info.bcc_admin, self.default_bcc_admin)
        self.assertEqual(send_email_info.reply_to_id, self.default_reply_to_id)

    def test_send_email_info_with_valid_arguments_has_correct_properties(self):
        send_email_info = email_domain.SendEmailInfo(
            self.recipient_id, self.sender_id, self.intent, self.email_subject,
            self.email_html_body, self.sender_email, self.recipient_email,
            self.sender_name, self.bcc_admin, self.reply_to_id
        )

        self.assertEqual(send_email_info.recipient_id, self.recipient_id)
        self.assertEqual(send_email_info.sender_id, self.sender_id)
        self.assertEqual(send_email_info.intent, self.intent)
        self.assertEqual(send_email_info.email_subject, self.email_subject)
        self.assertEqual(send_email_info.email_html_body, self.email_html_body)
        self.assertEqual(send_email_info.sender_name, self.sender_name)
        self.assertEqual(send_email_info.bcc_admin, self.bcc_admin)
        self.assertEqual(send_email_info.reply_to_id, self.reply_to_id)
