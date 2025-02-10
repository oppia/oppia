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

from __future__ import annotations

from core import feconf
from core.domain import email_subscription_services
from core.domain import platform_parameter_list
from core.domain import subscription_services
from core.platform import models
from core.tests import test_utils

from typing import Final, Sequence

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import email_models
    from mypy_imports import user_models

(email_models, user_models) = models.Registry.import_models([
    models.Names.EMAIL, models.Names.USER])


class InformSubscribersTest(test_utils.EmailTestBase):
    """Test for informing subscribers when an exploration is published by the
    creator.
    """

    USER_NAME: Final = 'user'
    USER_EMAIL: Final = 'user@test.com'

    USER_NAME_2: Final = 'user2'
    USER_EMAIL_2: Final = 'user2@test.com'

    def setUp(self) -> None:
        super().setUp()
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

        self.can_send_subscription_email_ctx = self.swap(
            feconf, 'CAN_SEND_TRANSACTIONAL_EMAILS', True)

    @test_utils.set_platform_parameters(
        [
            (platform_parameter_list.ParamName.SERVER_CAN_SEND_EMAILS, True),
            (platform_parameter_list.ParamName.EMAIL_FOOTER, 'EMAIL_FOOTER'),
            (platform_parameter_list.ParamName.EMAIL_SENDER_NAME, 'admin')
        ]
    )
    def test_inform_subscribers(self) -> None:
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
        email_preferences_model.update_timestamps()
        email_preferences_model.put()

        with self.can_send_subscription_email_ctx:
            email_subscription_services.inform_subscribers(
                self.editor_id, 'A', 'Title')

            # Make sure correct number of emails is sent and no email is sent
            # to the person who has unsubscribed from subscription emails.
            messages = (
                self._get_sent_email_messages(self.NEW_USER_EMAIL))
            self.assertEqual(len(messages), 1)
            messages = (
                self._get_sent_email_messages(self.NEW_USER_EMAIL))
            self.assertEqual(len(messages), 1)
            messages = (
                self._get_sent_email_messages(self.USER_EMAIL_2))
            self.assertEqual(len(messages), 0)

            # Make sure correct email models are stored.
            all_models: Sequence[email_models.SentEmailModel] = (
                email_models.SentEmailModel.get_all().fetch())
            self.assertEqual(True, any(
                model.recipient_id == self.user_id for model in all_models))
            self.assertEqual(True, any(
                model.recipient_email == self.USER_EMAIL for model in all_models)) # pylint: disable=line-too-long

            self.assertEqual(True, any(
                model.recipient_id == self.new_user_id for model in all_models)) # pylint: disable=line-too-long
            self.assertEqual(True, any(
                model.recipient_email == self.NEW_USER_EMAIL for model in all_models)) # pylint: disable=line-too-long

            # No email model is stored for the user who has unsubscribed from
            # subscription emails.
            self.assertEqual(False, any(
                model.recipient_id == self.user_id_2 for model in all_models))
            self.assertEqual(False, any(
                model.recipient_email == self.USER_EMAIL_2 for model in all_models)) # pylint: disable=line-too-long
