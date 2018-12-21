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

from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])

COLLECTION_ID = 'col_id'
COLLECTION_ID_2 = 'col_id_2'
EXP_ID = 'exp_id'
EXP_ID_2 = 'exp_id_2'
FEEDBACK_THREAD_ID = 'fthread_id'
FEEDBACK_THREAD_ID_2 = 'fthread_id_2'
USER_ID = 'user_id'
USER_ID_2 = 'user_id_2'


class SubscriptionsTest(test_utils.GenericTestBase):
    """Tests for subscription management."""

    OWNER_2_EMAIL = 'owner2@example.com'
    OWNER2_USERNAME = 'owner2'

    def setUp(self):
        super(SubscriptionsTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.OWNER_2_EMAIL, self.OWNER2_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.owner_2_id = self.get_user_id_from_email(self.OWNER_2_EMAIL)

        self.owner = user_services.UserActionsInfo(self.owner_id)

    def _get_thread_ids_subscribed_to(self, user_id):
        """Returns the feedback thread ids to which the user corresponding to
        the given user id is subscribed to.

        Args:
            user_id: str. The user id.

        Returns:
            tuple(str). The tuple containing all the feedback thread ids to
                which the user is subscribed to.
        """
        subscriptions_model = user_models.UserSubscriptionsModel.get(
            user_id, strict=False)
        return (
            subscriptions_model.general_feedback_thread_ids
            if subscriptions_model else [])

    def _get_exploration_ids_subscribed_to(self, user_id):
        """Returns all the exploration ids of the explorations to which the user
        has subscribed to.

        Args:
            user_id: str. The user id.

        Returns:
            tuple(str). The tuple containing all the exploration ids of the
                explorations to which the user has subscribed to.
        """
        subscriptions_model = user_models.UserSubscriptionsModel.get(
            user_id, strict=False)
        return (
            subscriptions_model.activity_ids
            if subscriptions_model else [])

    def _get_collection_ids_subscribed_to(self, user_id):
        """Returns all the collection ids of the collections to which the user
        has subscribed to.

        Args:
            user_id: str. The user id.

        Returns:
            tuple(str). The tuple containing all the collection ids of the
                collections to which the user has subscribed to.
        """
        subscriptions_model = user_models.UserSubscriptionsModel.get(
            user_id, strict=False)
        return (
            subscriptions_model.collection_ids
            if subscriptions_model else [])

    def test_subscribe_to_feedback_thread(self):
        self.assertEqual(self._get_thread_ids_subscribed_to(USER_ID), [])

        subscription_services.subscribe_to_thread(USER_ID, FEEDBACK_THREAD_ID)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(USER_ID), [FEEDBACK_THREAD_ID])

        # Repeated subscriptions to the same thread have no effect.
        subscription_services.subscribe_to_thread(USER_ID, FEEDBACK_THREAD_ID)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(USER_ID), [FEEDBACK_THREAD_ID])

        subscription_services.subscribe_to_thread(
            USER_ID, FEEDBACK_THREAD_ID_2)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(USER_ID),
            [FEEDBACK_THREAD_ID, FEEDBACK_THREAD_ID_2])

    def test_subscribe_to_exploration(self):
        self.assertEqual(self._get_exploration_ids_subscribed_to(USER_ID), [])

        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(USER_ID), [EXP_ID])

        # Repeated subscriptions to the same exploration have no effect.
        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(USER_ID), [EXP_ID])

        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID_2)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(USER_ID),
            [EXP_ID, EXP_ID_2])

    def test_get_exploration_ids_subscribed_to(self):
        self.assertEqual(
            subscription_services.get_exploration_ids_subscribed_to(
                USER_ID), [])

        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)
        self.assertEqual(
            subscription_services.get_exploration_ids_subscribed_to(USER_ID),
            [EXP_ID])

        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID_2)
        self.assertEqual(
            subscription_services.get_exploration_ids_subscribed_to(USER_ID),
            [EXP_ID, EXP_ID_2])

    def test_get_all_threads_subscribed_to(self):
        self.assertEqual(
            subscription_services.get_all_threads_subscribed_to(
                USER_ID), [])

        subscription_services.subscribe_to_thread(USER_ID, FEEDBACK_THREAD_ID)
        self.assertEqual(
            subscription_services.get_all_threads_subscribed_to(USER_ID),
            [FEEDBACK_THREAD_ID])

        subscription_services.subscribe_to_thread(USER_ID, FEEDBACK_THREAD_ID_2)
        self.assertEqual(
            subscription_services.get_all_threads_subscribed_to(USER_ID),
            [FEEDBACK_THREAD_ID, FEEDBACK_THREAD_ID_2])

    def test_thread_and_exp_subscriptions_are_tracked_individually(self):
        self.assertEqual(self._get_thread_ids_subscribed_to(USER_ID), [])

        subscription_services.subscribe_to_thread(USER_ID, FEEDBACK_THREAD_ID)
        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(USER_ID), [FEEDBACK_THREAD_ID])
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(USER_ID), [EXP_ID])

    def test_posting_to_feedback_thread_results_in_subscription(self):
        # The viewer posts a message to the thread.
        message_text = 'text'
        feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION, 'exp_id',
            self.viewer_id, 'subject', message_text)

        thread_ids_subscribed_to = self._get_thread_ids_subscribed_to(
            self.viewer_id)
        self.assertEqual(len(thread_ids_subscribed_to), 1)
        thread_id = thread_ids_subscribed_to[0]

        self.assertEqual(
            feedback_services.get_messages(thread_id)[0].text,
            message_text)

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
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(USER_ID), [])
        exp_services.save_new_exploration(
            USER_ID, exp_domain.Exploration.create_default_exploration(EXP_ID))
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(USER_ID), [EXP_ID])

    def test_adding_new_exploration_owner_or_editor_role_results_in_subscription(self): # pylint: disable=line-too-long
        exploration = exp_domain.Exploration.create_default_exploration(EXP_ID)
        exp_services.save_new_exploration(self.owner_id, exploration)

        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_2_id), [])
        rights_manager.assign_role_for_exploration(
            self.owner, EXP_ID, self.owner_2_id, rights_manager.ROLE_OWNER)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_2_id), [EXP_ID])

        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.editor_id), [])
        rights_manager.assign_role_for_exploration(
            self.owner, EXP_ID, self.editor_id, rights_manager.ROLE_EDITOR)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.editor_id), [EXP_ID])

    def test_adding_new_exploration_viewer_role_does_not_result_in_subscription(self): # pylint: disable=line-too-long
        exploration = exp_domain.Exploration.create_default_exploration(EXP_ID)
        exp_services.save_new_exploration(self.owner_id, exploration)

        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.viewer_id), [])
        rights_manager.assign_role_for_exploration(
            self.owner, EXP_ID, self.viewer_id, rights_manager.ROLE_VIEWER)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.viewer_id), [])

    def test_deleting_exploration_does_not_delete_subscription(self):
        exploration = exp_domain.Exploration.create_default_exploration(EXP_ID)
        exp_services.save_new_exploration(self.owner_id, exploration)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_id), [EXP_ID])

        exp_services.delete_exploration(self.owner_id, EXP_ID)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_id), [EXP_ID])

    def test_subscribe_to_collection(self):
        self.assertEqual(self._get_collection_ids_subscribed_to(USER_ID), [])

        subscription_services.subscribe_to_collection(USER_ID, COLLECTION_ID)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(USER_ID), [COLLECTION_ID])

        # Repeated subscriptions to the same collection have no effect.
        subscription_services.subscribe_to_collection(USER_ID, COLLECTION_ID)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(USER_ID), [COLLECTION_ID])

        subscription_services.subscribe_to_collection(USER_ID, COLLECTION_ID_2)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(USER_ID),
            [COLLECTION_ID, COLLECTION_ID_2])

    def test_get_collection_ids_subscribed_to(self):
        self.assertEqual(
            subscription_services.get_collection_ids_subscribed_to(
                USER_ID), [])

        subscription_services.subscribe_to_collection(USER_ID, COLLECTION_ID)
        self.assertEqual(
            subscription_services.get_collection_ids_subscribed_to(USER_ID),
            [COLLECTION_ID])

        subscription_services.subscribe_to_collection(USER_ID, COLLECTION_ID_2)
        self.assertEqual(
            subscription_services.get_collection_ids_subscribed_to(USER_ID),
            [COLLECTION_ID, COLLECTION_ID_2])

    def test_creating_collection_results_in_subscription(self):
        self.assertEqual(
            self._get_collection_ids_subscribed_to(USER_ID), [])
        self.save_new_default_collection(COLLECTION_ID, USER_ID)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(USER_ID), [COLLECTION_ID])

    def test_adding_new_collection_owner_or_editor_role_results_in_subscription(
            self):
        self.save_new_default_collection(COLLECTION_ID, self.owner_id)

        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_2_id), [])
        rights_manager.assign_role_for_collection(
            self.owner, COLLECTION_ID, self.owner_2_id,
            rights_manager.ROLE_OWNER)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_2_id),
            [COLLECTION_ID])

        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.editor_id), [])
        rights_manager.assign_role_for_collection(
            self.owner, COLLECTION_ID, self.editor_id,
            rights_manager.ROLE_EDITOR)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.editor_id),
            [COLLECTION_ID])

    def test_adding_new_collection_viewer_role_does_not_result_in_subscription(
            self):
        self.save_new_default_collection(COLLECTION_ID, self.owner_id)

        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.viewer_id), [])
        rights_manager.assign_role_for_collection(
            self.owner, COLLECTION_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.viewer_id), [])

    def test_deleting_collection_does_not_delete_subscription(self):
        self.save_new_default_collection(COLLECTION_ID, self.owner_id)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_id),
            [COLLECTION_ID])

        collection_services.delete_collection(self.owner_id, COLLECTION_ID)

        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_id),
            [COLLECTION_ID])

    def test_adding_exploration_to_collection_does_not_create_subscription(
            self):
        self.save_new_default_collection(COLLECTION_ID, self.owner_id)

        # The author is subscribed to the collection but to no explorations.
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_id),
            [COLLECTION_ID])
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_id), [])

        # Another author creates an exploration.
        self.save_new_valid_exploration(EXP_ID, self.owner_2_id)

        # If the collection author adds the exploration to his/her collection,
        # the collection author should not be subscribed to the exploration nor
        # should the exploration author be subscribed to the collection.
        collection_services.update_collection(
            self.owner_id, COLLECTION_ID, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': EXP_ID
            }], 'Add new exploration to collection.')

        # Ensure subscriptions are as expected.
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_id),
            [COLLECTION_ID])
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_2_id), [EXP_ID])


class UserSubscriptionsTest(test_utils.GenericTestBase):
    """Tests for subscription management."""

    OWNER_2_EMAIL = 'owner2@example.com'
    OWNER2_USERNAME = 'owner2'

    def setUp(self):
        super(UserSubscriptionsTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.OWNER_2_EMAIL, self.OWNER2_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner_2_id = self.get_user_id_from_email(self.OWNER_2_EMAIL)

    def _get_all_subscribers_of_creator(self, user_id):
        """Returns all the ids of the subscribers that have subscribed to the
        creator.

        Args:
            user_id: str. The user id.

        Returns:
            tuple(str). The tuple containing all the ids of the subscribers that
                have subscribed to the creator.
        """
        subscribers_model = user_models.UserSubscribersModel.get(
            user_id, strict=False)
        return (
            subscribers_model.subscriber_ids
            if subscribers_model else [])

    def _get_all_creators_subscribed_to(self, user_id):
        """Returns the ids of the creators the given user has subscribed to.

        Args:
            user_id: str. The user id.

        Returns:
            tuple(str). The tuple containing all the creator ids the given user
                has subscribed to.
        """
        subscriptions_model = user_models.UserSubscriptionsModel.get(
            user_id, strict=False)
        return (
            subscriptions_model.creator_ids
            if subscriptions_model else [])

    def test_subscribe_to_creator(self):
        self.assertEqual(self._get_all_subscribers_of_creator(
            self.owner_id), [])

        # Subscribe a user to a creator.
        subscription_services.subscribe_to_creator(USER_ID, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), [USER_ID])
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID),
            [self.owner_id])

        # Repeated subscriptions to the same creator has no effect.
        subscription_services.subscribe_to_creator(USER_ID, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), [USER_ID])
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID),
            [self.owner_id])

        # Subscribe another creator.
        subscription_services.subscribe_to_creator(
            USER_ID_2, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id),
            [USER_ID, USER_ID_2])
        self.assertEqual(
            self._get_all_creators_subscribed_to(
                USER_ID_2), [self.owner_id])

    def test_unsubscribe_from_creator(self):
        self.assertEqual(self._get_all_subscribers_of_creator(
            self.owner_id), [])

        # Add subscribers to a creator.
        subscription_services.subscribe_to_creator(USER_ID, self.owner_id)
        subscription_services.subscribe_to_creator(USER_ID_2, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), [
                USER_ID, USER_ID_2])
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID),
            [self.owner_id])
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID_2),
            [self.owner_id])

        # Unsubscribing a user from a creator.
        subscription_services.unsubscribe_from_creator(USER_ID, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), [USER_ID_2])
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID), [])

        # Unsubscribing the same user again has no effect.
        subscription_services.unsubscribe_from_creator(USER_ID, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), [USER_ID_2])
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID), [])

        # Unsubscribing the second user.
        subscription_services.unsubscribe_from_creator(
            USER_ID_2, self.owner_id)
        self.assertEqual(self._get_all_subscribers_of_creator(
            self.owner_id), [])
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID_2),
            [])

    def test_get_all_subscribers_of_creator(self):
        self.assertEqual(
            subscription_services.get_all_subscribers_of_creator(
                self.owner_id), [])

        subscription_services.subscribe_to_creator(USER_ID, self.owner_id)
        self.assertEqual(
            subscription_services.get_all_subscribers_of_creator(self.owner_id),
            [USER_ID])

        subscription_services.subscribe_to_creator(USER_ID_2, self.owner_id)
        self.assertEqual(
            subscription_services.get_all_subscribers_of_creator(self.owner_id),
            [USER_ID, USER_ID_2])

    def test_get_all_creators_subscribed_to(self):
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(
                USER_ID), [])

        subscription_services.subscribe_to_creator(USER_ID, self.owner_id)
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(
                USER_ID), [self.owner_id])

        subscription_services.subscribe_to_creator(USER_ID, self.owner_2_id)
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(
                USER_ID), [self.owner_id, self.owner_2_id])
