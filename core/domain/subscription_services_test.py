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

from __future__ import annotations

import datetime

from core import feconf, utils
from core.domain import (
    collection_domain,
    collection_services,
    exp_domain,
    exp_services,
    feedback_services,
    rights_domain,
    rights_manager,
    subscription_services,
    user_domain,
    user_services,
)
from core.platform import models
from core.tests import test_utils

from typing import Final, List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, user_models

(base_models, user_models) = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.USER]
)

COLLECTION_ID: Final = 'col_id'
COLLECTION_ID_2: Final = 'col_id_2'
EXP_ID: Final = 'exp_id'
EXP_ID_2: Final = 'exp_id_2'
FEEDBACK_THREAD_ID: Final = 'fthread_id'
FEEDBACK_THREAD_ID_2: Final = 'fthread_id_2'
USER_ID: Final = 'user_id'
USER_ID_2: Final = 'user_id_2'


class SubscriptionsTest(test_utils.GenericTestBase):
    """Tests for subscription management."""

    OWNER_2_EMAIL: Final = 'owner2@example.com'
    OWNER2_USERNAME: Final = 'owner2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.OWNER_2_EMAIL, self.OWNER2_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.owner_2_id = self.get_user_id_from_email(self.OWNER_2_EMAIL)

        self.owner = user_services.get_user_actions_info(self.owner_id)

    def _get_thread_ids_subscribed_to(self, user_id: str) -> List[str]:
        """Returns the feedback thread ids to which the user corresponding to
        the given user id is subscribed to.

        Args:
            user_id: str. The user id.

        Returns:
            List(str). The list containing all the feedback thread ids to
            which the user is subscribed to.
        """
        return subscription_services.get_user_subscriptions(
            user_id
        ).general_feedback_thread_ids

    def _get_exploration_ids_subscribed_to(self, user_id: str) -> List[str]:
        """Returns all the exploration ids of the explorations to which the user
        has subscribed to.

        Args:
            user_id: str. The user id.

        Returns:
            List(str). The list containing all the exploration ids of the
            explorations to which the user has subscribed to.
        """
        return subscription_services.get_user_subscriptions(
            user_id
        ).exploration_ids

    def _get_collection_ids_subscribed_to(self, user_id: str) -> List[str]:
        """Returns all the collection ids of the collections to which the user
        has subscribed to.

        Args:
            user_id: str. The user id.

        Returns:
            List(str). The list containing all the collection ids of the
            collections to which the user has subscribed to.
        """
        return subscription_services.get_user_subscriptions(
            user_id
        ).collection_ids

    def test_subscribe_to_feedback_thread(self) -> None:
        self.assertEqual(self._get_thread_ids_subscribed_to(USER_ID), [])

        subscription_services.subscribe_to_thread(USER_ID, FEEDBACK_THREAD_ID)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(USER_ID), [FEEDBACK_THREAD_ID]
        )

        # Repeated subscriptions to the same thread have no effect.
        subscription_services.subscribe_to_thread(USER_ID, FEEDBACK_THREAD_ID)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(USER_ID), [FEEDBACK_THREAD_ID]
        )

        subscription_services.subscribe_to_thread(USER_ID, FEEDBACK_THREAD_ID_2)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(USER_ID),
            [FEEDBACK_THREAD_ID, FEEDBACK_THREAD_ID_2],
        )

    def test_subscribe_to_exploration(self) -> None:
        self.assertEqual(self._get_exploration_ids_subscribed_to(USER_ID), [])

        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(USER_ID), [EXP_ID]
        )

        # Repeated subscriptions to the same exploration have no effect.
        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(USER_ID), [EXP_ID]
        )

        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID_2)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(USER_ID), [EXP_ID, EXP_ID_2]
        )

    def test_get_exploration_ids_subscribed_to(self) -> None:
        self.assertEqual(
            subscription_services.get_exploration_ids_subscribed_to(USER_ID), []
        )

        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)
        self.assertEqual(
            subscription_services.get_exploration_ids_subscribed_to(USER_ID),
            [EXP_ID],
        )

        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID_2)
        self.assertEqual(
            subscription_services.get_exploration_ids_subscribed_to(USER_ID),
            [EXP_ID, EXP_ID_2],
        )

    def test_thread_and_exp_subscriptions_are_tracked_individually(
        self,
    ) -> None:
        self.assertEqual(self._get_thread_ids_subscribed_to(USER_ID), [])

        subscription_services.subscribe_to_thread(USER_ID, FEEDBACK_THREAD_ID)
        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)
        self.assertEqual(
            self._get_thread_ids_subscribed_to(USER_ID), [FEEDBACK_THREAD_ID]
        )
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(USER_ID), [EXP_ID]
        )

    def test_posting_to_feedback_thread_results_in_subscription(self) -> None:
        # The viewer posts a message to the thread.
        message_text = 'text'
        feedback_services.create_thread(
            feconf.ENTITY_TYPE_EXPLORATION,
            'exp_id',
            self.viewer_id,
            'subject',
            message_text,
        )

        thread_ids_subscribed_to = self._get_thread_ids_subscribed_to(
            self.viewer_id
        )
        self.assertEqual(len(thread_ids_subscribed_to), 1)
        thread_id = thread_ids_subscribed_to[0]

        self.assertEqual(
            feedback_services.get_messages(thread_id)[0].text, message_text
        )

        # The editor posts a follow-up message to the thread.
        new_message_text = 'new text'
        feedback_services.create_message(
            thread_id, self.editor_id, '', '', new_message_text
        )

        # The viewer and editor are now both subscribed to the thread.
        self.assertEqual(
            self._get_thread_ids_subscribed_to(self.viewer_id), [thread_id]
        )
        self.assertEqual(
            self._get_thread_ids_subscribed_to(self.editor_id), [thread_id]
        )

    def test_creating_exploration_results_in_subscription(self) -> None:
        self.assertEqual(self._get_exploration_ids_subscribed_to(USER_ID), [])
        exp_services.save_new_exploration(
            USER_ID, exp_domain.Exploration.create_default_exploration(EXP_ID)
        )
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(USER_ID), [EXP_ID]
        )

    def test_adding_new_exploration_owner_or_editor_role_results_in_subscription(  # pylint: disable=line-too-long
        self,
    ) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(EXP_ID)
        exp_services.save_new_exploration(self.owner_id, exploration)

        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_2_id), []
        )
        rights_manager.assign_role_for_exploration(
            self.owner, EXP_ID, self.owner_2_id, rights_domain.ROLE_OWNER
        )
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_2_id), [EXP_ID]
        )

        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.editor_id), []
        )
        rights_manager.assign_role_for_exploration(
            self.owner, EXP_ID, self.editor_id, rights_domain.ROLE_EDITOR
        )
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.editor_id), [EXP_ID]
        )

    def test_adding_new_exploration_viewer_role_does_not_result_in_subscription(
        self,
    ) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(EXP_ID)
        exp_services.save_new_exploration(self.owner_id, exploration)

        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.viewer_id), []
        )
        rights_manager.assign_role_for_exploration(
            self.owner, EXP_ID, self.viewer_id, rights_domain.ROLE_VIEWER
        )
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.viewer_id), []
        )

    def test_deleting_exploration_does_not_delete_subscription(self) -> None:
        exploration = exp_domain.Exploration.create_default_exploration(EXP_ID)
        exp_services.save_new_exploration(self.owner_id, exploration)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_id), [EXP_ID]
        )

        exp_services.delete_exploration(self.owner_id, EXP_ID)
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_id), [EXP_ID]
        )

    def test_subscribe_to_collection(self) -> None:
        self.assertEqual(self._get_collection_ids_subscribed_to(USER_ID), [])

        subscription_services.subscribe_to_collection(USER_ID, COLLECTION_ID)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(USER_ID), [COLLECTION_ID]
        )

        # Repeated subscriptions to the same collection have no effect.
        subscription_services.subscribe_to_collection(USER_ID, COLLECTION_ID)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(USER_ID), [COLLECTION_ID]
        )

        subscription_services.subscribe_to_collection(USER_ID, COLLECTION_ID_2)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(USER_ID),
            [COLLECTION_ID, COLLECTION_ID_2],
        )

    def test_get_collection_ids_subscribed_to(self) -> None:
        self.assertEqual(
            subscription_services.get_collection_ids_subscribed_to(USER_ID), []
        )

        subscription_services.subscribe_to_collection(USER_ID, COLLECTION_ID)
        self.assertEqual(
            subscription_services.get_collection_ids_subscribed_to(USER_ID),
            [COLLECTION_ID],
        )

        subscription_services.subscribe_to_collection(USER_ID, COLLECTION_ID_2)
        self.assertEqual(
            subscription_services.get_collection_ids_subscribed_to(USER_ID),
            [COLLECTION_ID, COLLECTION_ID_2],
        )

    def test_creating_collection_results_in_subscription(self) -> None:
        self.assertEqual(self._get_collection_ids_subscribed_to(USER_ID), [])
        self.save_new_default_collection(COLLECTION_ID, USER_ID)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(USER_ID), [COLLECTION_ID]
        )

    def test_adding_new_collection_owner_or_editor_role_results_in_subscription(
        self,
    ) -> None:
        self.save_new_default_collection(COLLECTION_ID, self.owner_id)

        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_2_id), []
        )
        rights_manager.assign_role_for_collection(
            self.owner, COLLECTION_ID, self.owner_2_id, rights_domain.ROLE_OWNER
        )
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_2_id),
            [COLLECTION_ID],
        )

        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.editor_id), []
        )
        rights_manager.assign_role_for_collection(
            self.owner, COLLECTION_ID, self.editor_id, rights_domain.ROLE_EDITOR
        )
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.editor_id),
            [COLLECTION_ID],
        )

    def test_adding_new_collection_viewer_role_does_not_result_in_subscription(
        self,
    ) -> None:
        self.save_new_default_collection(COLLECTION_ID, self.owner_id)

        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.viewer_id), []
        )
        rights_manager.assign_role_for_collection(
            self.owner, COLLECTION_ID, self.viewer_id, rights_domain.ROLE_VIEWER
        )
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.viewer_id), []
        )

    def test_deleting_collection_does_not_delete_subscription(self) -> None:
        self.save_new_default_collection(COLLECTION_ID, self.owner_id)
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_id),
            [COLLECTION_ID],
        )

        collection_services.delete_collection(self.owner_id, COLLECTION_ID)

        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_id),
            [COLLECTION_ID],
        )

    def test_adding_exploration_to_collection_does_not_create_subscription(
        self,
    ) -> None:
        self.save_new_default_collection(COLLECTION_ID, self.owner_id)

        # The author is subscribed to the collection but to no explorations.
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_id),
            [COLLECTION_ID],
        )
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_id), []
        )

        # Another author creates an exploration.
        self.save_new_valid_exploration(EXP_ID, self.owner_2_id)

        # If the collection author adds the exploration to his/her collection,
        # the collection author should not be subscribed to the exploration nor
        # should the exploration author be subscribed to the collection.
        collection_services.update_collection(
            self.owner_id,
            COLLECTION_ID,
            [
                {
                    'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                    'exploration_id': EXP_ID,
                }
            ],
            'Add new exploration to collection.',
        )

        # Ensure subscriptions are as expected.
        self.assertEqual(
            self._get_collection_ids_subscribed_to(self.owner_id),
            [COLLECTION_ID],
        )
        self.assertEqual(
            self._get_exploration_ids_subscribed_to(self.owner_2_id), [EXP_ID]
        )


class UserSubscriptionsTest(test_utils.GenericTestBase):
    """Tests for subscription management."""

    OWNER_2_EMAIL: Final = 'owner2@example.com'
    OWNER2_USERNAME: Final = 'owner2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.OWNER_2_EMAIL, self.OWNER2_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner_2_id = self.get_user_id_from_email(self.OWNER_2_EMAIL)

    def _get_all_subscribers_of_creator(self, user_id: str) -> List[str]:
        """Returns all the ids of the subscribers that have subscribed to the
        creator.

        Args:
            user_id: str. The user id.

        Returns:
            List(str). The list containing all the ids of the subscribers that
            have subscribed to the creator.
        """
        subscribers_model = user_models.UserSubscribersModel.get(
            user_id, strict=False
        )
        # TODO(#15621): The explicit declaration of type for ndb properties
        # should be removed. Currently, these ndb properties are annotated with
        # Any return type. Once we have proper return type we can remove this.
        if subscribers_model:
            subscriber_ids: List[str] = subscribers_model.subscriber_ids
            return subscriber_ids
        else:
            return []

    def _get_all_creators_subscribed_to(self, user_id: str) -> List[str]:
        """Returns the ids of the creators the given user has subscribed to.

        Args:
            user_id: str. The user id.

        Returns:
            List(str). The list containing all the creator ids the given user
            has subscribed to.
        """
        return subscription_services.get_user_subscriptions(user_id).creator_ids

    def test_exception_is_raised_when_user_self_subscribes(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'User %s is not allowed to self subscribe.' % USER_ID
        ):
            subscription_services.subscribe_to_creator(USER_ID, USER_ID)

    def test_subscribe_to_creator(self) -> None:
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), []
        )

        # Subscribe a user to a creator.
        subscription_services.subscribe_to_creator(USER_ID, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), [USER_ID]
        )
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID), [self.owner_id]
        )

        # Repeated subscriptions to the same creator has no effect.
        subscription_services.subscribe_to_creator(USER_ID, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), [USER_ID]
        )
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID), [self.owner_id]
        )

        # Subscribe another creator.
        subscription_services.subscribe_to_creator(USER_ID_2, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id),
            [USER_ID, USER_ID_2],
        )
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID_2), [self.owner_id]
        )

    def test_unsubscribe_from_creator(self) -> None:
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), []
        )

        # Add subscribers to a creator.
        subscription_services.subscribe_to_creator(USER_ID, self.owner_id)
        subscription_services.subscribe_to_creator(USER_ID_2, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id),
            [USER_ID, USER_ID_2],
        )
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID), [self.owner_id]
        )
        self.assertEqual(
            self._get_all_creators_subscribed_to(USER_ID_2), [self.owner_id]
        )

        # Unsubscribing a user from a creator.
        subscription_services.unsubscribe_from_creator(USER_ID, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), [USER_ID_2]
        )
        self.assertEqual(self._get_all_creators_subscribed_to(USER_ID), [])

        # Unsubscribing the same user again has no effect.
        subscription_services.unsubscribe_from_creator(USER_ID, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), [USER_ID_2]
        )
        self.assertEqual(self._get_all_creators_subscribed_to(USER_ID), [])

        # Unsubscribing the second user.
        subscription_services.unsubscribe_from_creator(USER_ID_2, self.owner_id)
        self.assertEqual(
            self._get_all_subscribers_of_creator(self.owner_id), []
        )
        self.assertEqual(self._get_all_creators_subscribed_to(USER_ID_2), [])

    def test_get_all_subscribers_of_creator(self) -> None:
        self.assertEqual(
            subscription_services.get_all_subscribers_of_creator(self.owner_id),
            [],
        )

        subscription_services.subscribe_to_creator(USER_ID, self.owner_id)
        self.assertEqual(
            subscription_services.get_all_subscribers_of_creator(self.owner_id),
            [USER_ID],
        )

        subscription_services.subscribe_to_creator(USER_ID_2, self.owner_id)
        self.assertEqual(
            subscription_services.get_all_subscribers_of_creator(self.owner_id),
            [USER_ID, USER_ID_2],
        )

    def test_get_all_creators_subscribed_to(self) -> None:
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(USER_ID), []
        )

        subscription_services.subscribe_to_creator(USER_ID, self.owner_id)
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(USER_ID),
            [self.owner_id],
        )

        subscription_services.subscribe_to_creator(USER_ID, self.owner_2_id)
        self.assertEqual(
            subscription_services.get_all_creators_subscribed_to(USER_ID),
            [self.owner_id, self.owner_2_id],
        )


class UserSubscriptionsGetAndSaveTests(test_utils.GenericTestBase):
    """Tests for the functions that convert between UserSubscriptionsModel
    and the UserSubscriptions domain object.
    """

    def test_get_user_subscriptions_returns_empty_object_for_new_user(
        self,
    ) -> None:
        user_subscriptions = subscription_services.get_user_subscriptions(
            USER_ID
        )

        self.assertEqual(user_subscriptions.user_id, USER_ID)
        self.assertEqual(user_subscriptions.exploration_ids, [])
        self.assertEqual(user_subscriptions.collection_ids, [])
        self.assertEqual(user_subscriptions.general_feedback_thread_ids, [])
        self.assertEqual(user_subscriptions.creator_ids, [])
        self.assertIsNone(user_subscriptions.last_checked)
        self.assertIsNone(
            user_models.UserSubscriptionsModel.get(USER_ID, strict=False)
        )

    def test_get_user_subscriptions_strict_raises_for_new_user(self) -> None:
        with self.assertRaisesRegex(
            base_models.BaseModel.EntityNotFoundError,
            'Entity for class UserSubscriptionsModel with id %s not found'
            % USER_ID,
        ):
            subscription_services.get_user_subscriptions(USER_ID, strict=True)

    def test_save_and_get_user_subscriptions(self) -> None:
        last_checked = datetime.datetime(2026, 11, 28)
        subscription_services.save_user_subscriptions(
            user_domain.UserSubscriptions(
                USER_ID,
                [EXP_ID],
                [COLLECTION_ID],
                [FEEDBACK_THREAD_ID],
                [USER_ID_2],
                last_checked,
            )
        )

        user_subscriptions_model = user_models.UserSubscriptionsModel.get(
            USER_ID
        )
        self.assertEqual(user_subscriptions_model.exploration_ids, [EXP_ID])
        self.assertEqual(
            user_subscriptions_model.collection_ids, [COLLECTION_ID]
        )
        self.assertEqual(
            user_subscriptions_model.general_feedback_thread_ids,
            [FEEDBACK_THREAD_ID],
        )
        self.assertEqual(user_subscriptions_model.creator_ids, [USER_ID_2])
        self.assertEqual(user_subscriptions_model.last_checked, last_checked)

        user_subscriptions = subscription_services.get_user_subscriptions(
            USER_ID, strict=True
        )
        self.assertEqual(
            user_subscriptions.to_dict(),
            {
                'exploration_ids': [EXP_ID],
                'collection_ids': [COLLECTION_ID],
                'general_feedback_thread_ids': [FEEDBACK_THREAD_ID],
                'creator_ids': [USER_ID_2],
                'last_checked': last_checked,
            },
        )

    def test_saving_updates_existing_model(self) -> None:
        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)
        user_subscriptions = subscription_services.get_user_subscriptions(
            USER_ID
        )

        user_subscriptions.add_exploration_id(EXP_ID_2)
        subscription_services.save_user_subscriptions(user_subscriptions)

        self.assertEqual(
            user_models.UserSubscriptionsModel.get(USER_ID).exploration_ids,
            [EXP_ID, EXP_ID_2],
        )

    def test_changing_domain_object_does_not_change_model(self) -> None:
        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)
        user_subscriptions_model = user_models.UserSubscriptionsModel.get(
            USER_ID
        )
        user_subscriptions = (
            subscription_services.get_user_subscriptions_from_model(
                user_subscriptions_model
            )
        )

        user_subscriptions.add_exploration_id(EXP_ID_2)

        self.assertEqual(user_subscriptions_model.exploration_ids, [EXP_ID])

    def test_saving_invalid_subscriptions_raises_and_saves_nothing(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError,
            'User %s is not allowed to self subscribe.' % USER_ID,
        ):
            subscription_services.save_user_subscriptions(
                user_domain.UserSubscriptions(
                    USER_ID, [], [], [], [USER_ID], None
                )
            )

        self.assertIsNone(
            user_models.UserSubscriptionsModel.get(USER_ID, strict=False)
        )

    def test_save_multiple_user_subscriptions(self) -> None:
        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)

        subscription_services.save_multiple_user_subscriptions(
            [
                user_domain.UserSubscriptions(
                    USER_ID, [EXP_ID_2], [], [], [], None
                ),
                user_domain.UserSubscriptions(
                    USER_ID_2, [EXP_ID], [], [], [], None
                ),
            ]
        )

        self.assertEqual(
            user_models.UserSubscriptionsModel.get(USER_ID).exploration_ids,
            [EXP_ID_2],
        )
        self.assertEqual(
            user_models.UserSubscriptionsModel.get(USER_ID_2).exploration_ids,
            [EXP_ID],
        )

    def test_get_user_subscriptions_with_exploration_ids(self) -> None:
        subscription_services.subscribe_to_exploration(USER_ID, EXP_ID)
        subscription_services.subscribe_to_exploration(USER_ID_2, EXP_ID_2)
        subscription_services.subscribe_to_collection('user_id_3', 'col_id')

        user_subscriptions_list = (
            subscription_services.get_user_subscriptions_with_exploration_ids(
                [EXP_ID, EXP_ID_2]
            )
        )

        self.assertItemsEqual(
            [
                user_subscriptions.user_id
                for user_subscriptions in user_subscriptions_list
            ],
            [USER_ID, USER_ID_2],
        )
