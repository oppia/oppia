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

"""Tests for email_subscription_services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import email_subscription_services
from core.domain import subscription_services
from core.platform import models
from core.tests import test_utils
import feconf

(email_models, user_models) = models.Registry.import_models([
    models.NAMES.email, models.NAMES.user])
email_services = models.Registry.import_email_services()


class InformSubscribersTest(test_utils.GenericTestBase):
    """Test for informing subscribers when an exploration is published by the
    creator.
    """

    USER_NAME = 'user'
    USER_EMAIL = 'user@test.com'

    USER_NAME_2 = 'user2'
    USER_EMAIL_2 = 'user2@test.com'
    emails_dict = {}

    def mock_send_mail(
            self, sender_email, recipient_email, subject, plaintext_body,
            html_body, bcc_admin, reply_to_id, *_):
        bcc = []
        reply_to = ''
        if not feconf.CAN_SEND_EMAILS:
            raise Exception('This app cannot send emails.')

        if not email_services.is_email_valid(recipient_email):
            raise ValueError(
                'Malformed recipient email address: %s' % recipient_email)

        if not email_services.is_sender_email_valid(sender_email):
            raise ValueError(
                'Malformed sender email address: %s' % sender_email)

        if bcc_admin:
            bcc = [feconf.ADMIN_EMAIL_ADDRESS]
        if reply_to_id:
            reply_to = (
                email_services.get_incoming_email_address(reply_to_id))
        if recipient_email not in self.emails_dict:
            self.emails_dict[recipient_email] = []
        self.emails_dict[recipient_email].append(
            {
                'sender_email': sender_email,
                'subject': subject,
                'body': plaintext_body,
                'html': html_body,
                'bcc': bcc,
                'reply_to': reply_to
            }
        )

    def mock_get_sent_messages(self, to, *_):
        return self.emails_dict[to] if to in self.emails_dict else []

    def setUp(self):
        super(InformSubscribersTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.USER_EMAIL, self.USER_NAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.signup(self.USER_EMAIL_2, self.USER_NAME_2)

        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.user_id_2 = self.get_user_id_from_email(self.USER_EMAIL_2)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, title='Title')

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_subscription_email_ctx = self.swap(
            feconf, 'CAN_SEND_SUBSCRIPTION_EMAILS', True)

    def test_inform_subscribers(self):
        subscription_services.subscribe_to_creator(
            self.user_id_2, self.editor_id)
        subscription_services.subscribe_to_creator(
            self.new_user_id, self.editor_id)
        subscription_services.subscribe_to_creator(
            self.user_id, self.editor_id)

        email_preferences_model = user_models.UserEmailPreferencesModel.get(
            self.user_id_2, strict=False)
        if email_preferences_model is None:
            email_preferences_model = user_models.UserEmailPreferencesModel(
                id=self.user_id_2)

        email_preferences_model.subscription_notifications = False
        email_preferences_model.put()
        with self.swap(email_services, 'send_mail', self.mock_send_mail):
            with self.can_send_emails_ctx, self.can_send_subscription_email_ctx:
                email_subscription_services.inform_subscribers(
                    self.editor_id, 'A', 'Title')

                # Make sure correct number of emails is sent and no email is
                # sent to the person who has unsubscribed from subscription
                # emails.
                messages = self.mock_get_sent_messages(to=self.NEW_USER_EMAIL)
                self.assertEqual(len(messages), 1)
                messages = self.mock_get_sent_messages(to=self.NEW_USER_EMAIL)
                self.assertEqual(len(messages), 1)
                messages = self.mock_get_sent_messages(to=self.USER_EMAIL_2)
                self.assertEqual(len(messages), 0)

                # Make sure correct email models are stored.
                all_models = email_models.SentEmailModel.get_all().fetch()
                self.assertEqual(True, any(
                    model.recipient_id == self.user_id for model in all_models))
                self.assertEqual(True, any(
                    model.recipient_email == self.USER_EMAIL for model in all_models)) # pylint: disable=line-too-long

                self.assertEqual(True, any(
                    model.recipient_id == self.new_user_id for model in all_models)) # pylint: disable=line-too-long
                self.assertEqual(True, any(
                    model.recipient_email == self.NEW_USER_EMAIL for model in all_models)) # pylint: disable=line-too-long

                # No email model is stored for the user who has unsubscribed
                # from subscription emails.
                self.assertEqual(False, any(
                    model.recipient_id == self.user_id_2 for model in all_models)) # pylint: disable=line-too-long
                self.assertEqual(False, any(
                    model.recipient_email == self.USER_EMAIL_2 for model in all_models)) # pylint: disable=line-too-long
