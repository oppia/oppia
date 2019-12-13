# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for voiceover services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import rights_manager
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])


class WipeoutServiceTests(test_utils.GenericTestBase):
    """Provides testing of the wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)


    def tests_pre_delete_user_simple(self):
        user_models.UserSubscriptionsModel(
            id=self.user_1_id,
            activity_ids=[],
            collection_ids=[]
        ).put()

        wipeout_service.pre_delete_user(self.user_1_id)

        user_settings = user_services.get_user_settings(self.user_1_id)
        self.assertTrue(user_settings.to_be_deleted)

        email_preferences = user_services.get_email_preferences(self.user_1_id)
        self.assertFalse(email_preferences.can_receive_email_updates)
        self.assertFalse(email_preferences.can_receive_editor_role_email)
        self.assertFalse(email_preferences.can_receive_feedback_message_email)
        self.assertFalse(email_preferences.can_receive_subscription_email)

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertEqual(pending_deletion_model.exploration_ids, [])
        self.assertEqual(pending_deletion_model.collection_ids, [])
        self.assertEqual(pending_deletion_model.skill_ids, [])
        self.assertEqual(pending_deletion_model.topic_ids, [])

    def tests_pre_delete_user_with_activities(self):
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        self.save_new_valid_collection(
            'col_id', self.user_1_id, exploration_id='exp_id')
        self.save_new_skill('skill_id', self.user_1_id)

        wipeout_service.pre_delete_user(self.user_1_id)

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertEqual(
            pending_deletion_model.exploration_ids, ['exp_id'])
        self.assertEqual(pending_deletion_model.collection_ids, ['col_id'])
        self.assertEqual(pending_deletion_model.skill_ids, ['skill_id'])

    def tests_pre_delete_user_with_activities_multiple_owners(self):
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
        self.save_new_skill('skill_id', self.user_1_id)

        wipeout_service.pre_delete_user(self.user_1_id)

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertEqual(
            pending_deletion_model.exploration_ids, [])
        self.assertEqual(pending_deletion_model.collection_ids, [])
        self.assertEqual(pending_deletion_model.skill_ids, ['skill_id'])

    def tests_pre_delete_user_with_topic(self):
        user_services.update_user_role(
            self.user_1_id, feconf.ROLE_ID_TOPIC_MANAGER)
        user_actions = user_services.UserActionsInfo(self.user_1_id)
        self.save_new_topic('topic_id', self.user_1_id)
        topic_services.assign_role(
            user_services.get_system_user(), user_actions,
            topic_domain.ROLE_MANAGER, 'topic_id')

        wipeout_service.pre_delete_user(self.user_1_id)

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertEqual(pending_deletion_model.exploration_ids, [])
        self.assertEqual(pending_deletion_model.collection_ids, [])
        self.assertEqual(pending_deletion_model.skill_ids, [])
        self.assertEqual(pending_deletion_model.topic_ids, ['topic_id'])
