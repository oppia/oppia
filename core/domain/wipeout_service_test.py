# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for wipeout service."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import rights_manager
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils
import feconf

(collection_models, exp_models, user_models,) = (
    models.Registry.import_models([
        models.NAMES.collection, models.NAMES.exploration, models.NAMES.user]))


class WipeoutServicePreDeleteTests(test_utils.GenericTestBase):
    """Provides testing of the pre-deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServicePreDeleteTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.user_1_gae_id = self.get_gae_id_from_email(self.USER_1_EMAIL)

    def test_pre_delete_user_email_subscriptions(self):
        email_preferences = user_services.get_email_preferences(self.user_1_id)
        self.assertEqual(
            email_preferences.can_receive_email_updates,
            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE)
        self.assertEqual(
            email_preferences.can_receive_editor_role_email,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
        self.assertEqual(
            email_preferences.can_receive_feedback_message_email,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)
        self.assertEqual(
            email_preferences.can_receive_subscription_email,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

        wipeout_service.pre_delete_user(self.user_1_id)

        email_preferences = user_services.get_email_preferences(self.user_1_id)
        self.assertFalse(email_preferences.can_receive_email_updates)
        self.assertFalse(email_preferences.can_receive_editor_role_email)
        self.assertFalse(email_preferences.can_receive_feedback_message_email)
        self.assertFalse(email_preferences.can_receive_subscription_email)

    def test_pre_delete_user_without_activities(self):
        user_models.UserSubscriptionsModel(
            id=self.user_1_id,
            activity_ids=[],
            collection_ids=[]
        ).put()

        user_settings = user_services.get_user_settings(self.user_1_id)
        self.assertFalse(user_settings.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)

        user_settings = user_services.get_user_settings_by_gae_id(
            self.user_1_gae_id)
        self.assertTrue(user_settings.deleted)

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertEqual(pending_deletion_model.exploration_ids, [])
        self.assertEqual(pending_deletion_model.collection_ids, [])

    def test_pre_delete_user_with_activities(self):
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        self.save_new_valid_collection(
            'col_id', self.user_1_id, exploration_id='exp_id')

        wipeout_service.pre_delete_user(self.user_1_id)

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertEqual(
            pending_deletion_model.exploration_ids, ['exp_id'])
        self.assertEqual(pending_deletion_model.collection_ids, ['col_id'])

    def test_pre_delete_user_with_activities_multiple_owners(self):
        user_services.update_user_role(
            self.user_1_id, feconf.ROLE_ID_COLLECTION_EDITOR)
        user_1_actions = user_services.UserActionsInfo(self.user_1_id)
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        rights_manager.assign_role_for_exploration(
            user_1_actions, 'exp_id', self.user_2_id, rights_manager.ROLE_OWNER)
        self.save_new_valid_collection(
            'col_id', self.user_1_id, exploration_id='exp_id')
        rights_manager.assign_role_for_collection(
            user_1_actions, 'col_id', self.user_2_id, rights_manager.ROLE_OWNER)

        wipeout_service.pre_delete_user(self.user_1_id)

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertEqual(
            pending_deletion_model.exploration_ids, [])
        self.assertEqual(pending_deletion_model.collection_ids, [])

    def test_pre_delete_user_collection_is_marked_deleted(self):
        self.save_new_valid_collection(
            'col_id', self.user_1_id)

        collection_model = collection_models.CollectionModel.get_by_id('col_id')
        self.assertFalse(collection_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)

        collection_model = collection_models.CollectionModel.get_by_id('col_id')
        self.assertTrue(collection_model.deleted)

    def test_pre_delete_user_exploration_is_marked_deleted(self):
        self.save_new_valid_exploration('exp_id', self.user_1_id)

        exp_model = exp_models.ExplorationModel.get_by_id('exp_id')
        self.assertFalse(exp_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)

        exp_model = exp_models.ExplorationModel.get_by_id('exp_id')
        self.assertTrue(exp_model.deleted)


class WipeoutServiceDeleteTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceDeleteTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        user_models.CompletedActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)

    def test_delete_user_simple(self):
        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

        wipeout_service.delete_user(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertTrue(pending_deletion_model.deletion_complete)

    def test_delete_user_multiple(self):
        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(
            user_models.LearnerPlaylistModel.get_by_id(self.user_2_id))

        wipeout_service.delete_user(
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id))

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.user_2_id))

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))
        self.assertTrue(pending_deletion_model.deletion_complete)


class WipeoutServiceVerifyDeleteTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)

    def test_delete_user_simple(self):
        wipeout_service.delete_user(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        self.assertTrue(wipeout_service.verify_user_deleted(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id)))

        self.assertIsNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

    def test_delete_user_broken(self):
        wipeout_service.delete_user(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))

        user_models.CompletedActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id)))
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))
        self.assertIsNotNone(pending_deletion_model)
        self.assertFalse(pending_deletion_model.deletion_complete)

        wipeout_service.delete_user(pending_deletion_model)
        self.assertTrue(wipeout_service.verify_user_deleted(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id)))
        self.assertIsNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))
