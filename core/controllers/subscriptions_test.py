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

"""Tests for user subscriptions."""

from __future__ import annotations

from core import feconf
from core.domain import subscription_services
from core.tests import test_utils

from typing import Final


class SubscriptionTests(test_utils.GenericTestBase):

    USER_EMAIL: Final = 'user@example.com'
    USER_USERNAME: Final = 'user'
    USER2_EMAIL: Final = 'user2@example.com'
    USER2_USERNAME: Final = 'user2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)

        self.signup(self.USER2_EMAIL, self.USER2_USERNAME)
        self.user_id_2 = self.get_user_id_from_email(self.USER2_EMAIL)

    def test_cannot_subscribe_without_login(self) -> None:
        csrf_token = self.get_new_csrf_token()
        payload = {
            'creator_username': self.EDITOR_USERNAME
        }
        response = self.post_json(
            feconf.SUBSCRIBE_URL_PREFIX,
            payload,
            csrf_token=csrf_token,
            expected_status_int=401
        )
        self.assertEqual(
            response['error'],
            'You do not have credentials to manage subscriptions.'
        )

    def test_invalid_creator_username_raises_error_while_subscribing(
        self
    ) -> None:
        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'creator_username': 'invalid'
        }
        response = self.post_json(
            feconf.SUBSCRIBE_URL_PREFIX,
            payload,
            csrf_token=csrf_token,
            expected_status_int=500
        )
        self.assertEqual(
            response['error'],
            'No user_id found for the given username: invalid'
        )

    def test_invalid_creator_username_raises_error_while_unsubscribing(
        self
    ) -> None:
        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'creator_username': 'invalid'
        }
        response = self.post_json(
            feconf.UNSUBSCRIBE_URL_PREFIX,
            payload,
            csrf_token=csrf_token,
            expected_status_int=500
        )
        self.assertEqual(
            response['error'],
            'No creator user_id found for the given creator username: invalid'
        )

    def test_subscribe_handler(self) -> None:
        """Test handler for new subscriptions to creators."""

        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'creator_username': self.EDITOR_USERNAME
        }

        # Test that the subscriber ID is added to the list of subscribers
        # of the creator and the creator ID is added to the list of
        # subscriptions of the user.
        self.post_json(
            feconf.SUBSCRIBE_URL_PREFIX, payload,
            csrf_token=csrf_token)
        self.assertEqual(subscription_services.get_all_subscribers_of_creator(
            self.editor_id), [self.user_id])
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(
                self.user_id), [self.editor_id])

        # Subscribing again, has no effect.
        self.post_json(
            feconf.SUBSCRIBE_URL_PREFIX, payload,
            csrf_token=csrf_token)
        self.assertEqual(subscription_services.get_all_subscribers_of_creator(
            self.editor_id), [self.user_id])
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(
                self.user_id), [self.editor_id])

        self.logout()

        # Test another user subscription.
        self.login(self.USER2_EMAIL)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            feconf.SUBSCRIBE_URL_PREFIX, payload,
            csrf_token=csrf_token)
        self.assertEqual(subscription_services.get_all_subscribers_of_creator(
            self.editor_id), [self.user_id, self.user_id_2])
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(
                self.user_id_2), [self.editor_id])
        self.logout()

    def test_unsubscribe_handler(self) -> None:
        """Test handler for unsubscriptions."""

        payload = {
            'creator_username': self.EDITOR_USERNAME
        }

        # Add one subscription to editor.
        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.SUBSCRIBE_URL_PREFIX, payload,
            csrf_token=csrf_token)
        self.logout()

        # Add another subscription.
        self.login(self.USER2_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.SUBSCRIBE_URL_PREFIX, payload,
            csrf_token=csrf_token)

        # Test that on unsubscription, the learner ID is removed from the
        # list of subscriber IDs of the creator and the creator ID is
        # removed from the list of subscriptions of the learner.
        self.post_json(
            feconf.UNSUBSCRIBE_URL_PREFIX, payload,
            csrf_token=csrf_token)
        self.assertEqual(subscription_services.get_all_subscribers_of_creator(
            self.editor_id), [self.user_id])
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(
                self.user_id_2), [])

        # Unsubscribing the same user has no effect.
        self.post_json(
            feconf.UNSUBSCRIBE_URL_PREFIX, payload,
            csrf_token=csrf_token)
        self.assertEqual(subscription_services.get_all_subscribers_of_creator(
            self.editor_id), [self.user_id])
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(
                self.user_id_2), [])

        self.logout()

        # Unsubscribing another user.
        self.login(self.USER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.UNSUBSCRIBE_URL_PREFIX, payload,
            csrf_token=csrf_token)
        self.assertEqual(subscription_services.get_all_subscribers_of_creator(
            self.editor_id), [])
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(
                self.user_id), [])
