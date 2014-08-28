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

"""Tests for subscription management."""

__author__ = 'Sean Lip'

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import subscription_services
from core.platform import models
(user_models,) = models.Registry.import_models([
    models.NAMES.user
])
from core.tests import test_utils


class SubscriptionsTest(test_utils.GenericTestBase):
    """Tests for subscription management."""

    OWNER_EMAIL = 'owner@example.com'
    EDITOR_EMAIL = 'editor@example.com'
    VIEWER_EMAIL = 'editor@example.com'
    OWNER_2_EMAIL = 'owner2@example.com'

    def setUp(self):
        super(SubscriptionsTest, self).setUp()
        self.register_editor(self.OWNER_EMAIL, username='owner')
        self.register_editor(self.EDITOR_EMAIL, username='editor')
        self.register_editor(self.VIEWER_EMAIL, username='viewer')
        self.register_editor(self.OWNER_2_EMAIL, username='owner2')

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.owner_2_id = self.get_user_id_from_email(self.OWNER_2_EMAIL)

    def _get_thread_ids_subscribed_to(self, user_id):
        subscriptions_model = user_models.UserSubscriptionsModel.get(
            user_id, strict=False)
        return (
            subscriptions_model.feedback_thread_ids
            if subscriptions_model else [])

    def _get_activity_ids_subscribed_to(self, user_id):
        subscriptions_model = user_models.UserSubscriptionsModel.get(
            user_id, strict=False)
        return (
            subscriptions_model.activity_ids
            if subscriptions_model else [])

    def test_subscribe_to_feedback_thread(self):
        user_id = 'user_id'
        self.assertEqual(self._get_thread_ids_subscribed_to(user_id), [])

        feedback_thread_id = 'fthread_id'
        subscription_services.subscribe_to_thread(user_id, feedback_thread_id)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(user_id), [feedback_thread_id])

        # Repeated subscriptions to the same thread have no effect.
        subscription_services.subscribe_to_thread(user_id, feedback_thread_id)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(user_id), [feedback_thread_id])

        feedback_thread_2_id = 'fthread_id_2'
        subscription_services.subscribe_to_thread(
            user_id, feedback_thread_2_id)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(user_id),
            [feedback_thread_id, feedback_thread_2_id])

    def test_subscribe_to_activity(self):
        user_id = 'user_id'
        self.assertEqual(self._get_activity_ids_subscribed_to(user_id), [])

        activity_id = 'activity_id'
        subscription_services.subscribe_to_activity(user_id, activity_id)
        self.assertEqual(
            self._get_activity_ids_subscribed_to(user_id), [activity_id])

        # Repeated subscriptions to the same activity have no effect.
        subscription_services.subscribe_to_activity(user_id, activity_id)
        self.assertEqual(
            self._get_activity_ids_subscribed_to(user_id), [activity_id])

        activity_2_id = 'activity_id_2'
        subscription_services.subscribe_to_activity(user_id, activity_2_id)
        self.assertEqual(
            self._get_activity_ids_subscribed_to(user_id),
            [activity_id, activity_2_id])

    def test_subscriptions_to_threads_and_activities_are_independent(self):
        user_id = 'user_id'
        feedback_thread_id = 'fthread_id'
        activity_id = 'activity_id'
        self.assertEqual(self._get_thread_ids_subscribed_to(user_id), [])

        subscription_services.subscribe_to_thread(user_id, feedback_thread_id)
        subscription_services.subscribe_to_activity(user_id, activity_id)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(user_id), [feedback_thread_id])
        self.assertEqual(
            self._get_activity_ids_subscribed_to(user_id), [activity_id])

    def test_posting_to_feedback_thread_results_in_subscription(self):
        # The viewer posts a message to the thread.
        message_text = 'text'
        feedback_services.create_thread(
            'exp_id', 'state_name', self.viewer_id, 'subject', message_text)

        thread_ids_subscribed_to = self._get_thread_ids_subscribed_to(
            self.viewer_id)
        self.assertEqual(len(thread_ids_subscribed_to), 1)
        thread_id = thread_ids_subscribed_to[0]
        self.assertEqual(
            feedback_services.get_messages(thread_id)[0]['text'], message_text)

        # The editor posts a follow-up message to the thread.
        new_message_text = 'new text'
        feedback_services.create_message(
            thread_id, self.editor_id, '', '', new_message_text)

        # The viewer and editor are now both subscribed to the thread.
        self.assertEqual(
            self._get_thread_ids_subscribed_to(self.viewer_id), [thread_id])
        self.assertEqual(
            self._get_thread_ids_subscribed_to(self.editor_id), [thread_id])

    def test_creating_exploration_results_in_subscription(self):
        exp_id = 'exp_id'
        user_id = 'user_id'

        self.assertEqual(
            self._get_activity_ids_subscribed_to(user_id), [])
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, 'Title', 'Category')
        exp_services.save_new_exploration(user_id, exploration)
        self.assertEqual(
            self._get_activity_ids_subscribed_to(user_id), [exp_id])

    def test_adding_new_owner_or_editor_role_results_in_subscription(self):
        exp_id = 'exp_id'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, 'Title', 'Category')
        exp_services.save_new_exploration(self.owner_id, exploration)

        self.assertEqual(
            self._get_activity_ids_subscribed_to(self.owner_2_id), [])
        rights_manager.assign_role(
            self.owner_id, exp_id, self.owner_2_id, rights_manager.ROLE_OWNER)
        self.assertEqual(
            self._get_activity_ids_subscribed_to(self.owner_2_id), [exp_id])

        self.assertEqual(
            self._get_activity_ids_subscribed_to(self.editor_id), [])
        rights_manager.assign_role(
            self.owner_id, exp_id, self.editor_id, rights_manager.ROLE_EDITOR)
        self.assertEqual(
            self._get_activity_ids_subscribed_to(self.editor_id), [exp_id])

    def test_adding_new_viewer_role_does_not_result_in_subscription(self):
        exp_id = 'exp_id'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, 'Title', 'Category')
        exp_services.save_new_exploration(self.owner_id, exploration)

        self.assertEqual(
            self._get_activity_ids_subscribed_to(self.viewer_id), [])
        rights_manager.assign_role(
            self.owner_id, exp_id, self.viewer_id, rights_manager.ROLE_VIEWER)
        self.assertEqual(
            self._get_activity_ids_subscribed_to(self.viewer_id), [])

    def test_deleting_exploration_does_not_delete_subscription(self):
        exp_id = 'exp_id'
        exploration = exp_domain.Exploration.create_default_exploration(
            exp_id, 'Title', 'Category')
        exp_services.save_new_exploration(self.owner_id, exploration)
        self.assertEqual(
            self._get_activity_ids_subscribed_to(self.owner_id), [exp_id])

        exp_services.delete_exploration(self.owner_id, exp_id)
        self.assertEqual(
            self._get_activity_ids_subscribed_to(self.owner_id), [exp_id])
