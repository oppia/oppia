
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

"""Tests for the incoming email handler."""

from core.domain import feedback_services
from core.platform import models
from core.tests import test_utils
import feconf

(feedback_models, email_models) = models.Registry.import_models([
    models.NAMES.feedback, models.NAMES.email])


class IncomingReplyEmailTests(test_utils.GenericTestBase):

    USER_A_EMAIL = 'a@example.com'
    USER_B_EMAIL = 'b@example.com'

    def setUp(self):
        super(IncomingReplyEmailTests, self).setUp()
        self.signup(self.USER_A_EMAIL, 'A')
        self.user_id_a = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, 'B')
        self.user_id_b = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_that_reply_emails_are_added_to_thread(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            # Create thread.
            feedback_services.create_thread(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id,
                'a_state_name', self.user_id_a, 'a subject', 'some text')

            threadlist = feedback_services.get_all_threads(
                feconf.ENTITY_TYPE_EXPLORATION, self.exploration.id, False)
            thread_id = threadlist[0].id

            # Create another message.
            feedback_services.create_message(
                thread_id, self.user_id_b, None, None, 'user b message')

            # Check that there are 2 messages in thread.
            messages = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messages), 2)

            # Check that received_via_email is set to False.
            self.assertFalse(messages[0].received_via_email)

            # Get reply_to id for user A.
            model = email_models.FeedbackEmailReplyToIdModel.get(
                self.user_id_a, thread_id)

            recipient_email = 'reply+%s@%s' % (
                model.reply_to_id, feconf.INCOMING_EMAILS_DOMAIN_NAME)
            # Send email to Oppia.
            self.post_email(
                str(recipient_email), self.USER_A_EMAIL, 'feedback email reply',
                'New reply')

            # Check that new message is added.
            messages = feedback_services.get_messages(thread_id)
            self.assertEqual(len(messages), 3)

            # Check content of message is correct.
            msg = messages[-1]
            self.assertEqual(msg.text, 'New reply')
            self.assertEqual(msg.author_id, self.user_id_a)
            self.assertTrue(msg.received_via_email)

    def test_that_assertion_is_raised_for_fake_reply_to_id(self):
        # Generate reply email.
        recipient_email = 'reply+%s@%s' % (
            'fake_id', feconf.INCOMING_EMAILS_DOMAIN_NAME)
        # Send email to Oppia.
        self.post_email(
            recipient_email, self.USER_A_EMAIL, 'feedback email reply',
            'New reply', expect_errors=True, expected_status_int=404)
