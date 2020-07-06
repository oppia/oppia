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
from core.domain import story_domain
from core.domain import story_services
from core.domain import user_services
from core.domain import wipeout_domain
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils
import feconf

(
    collection_models, exp_models, story_models,
    user_models) = models.Registry.import_models(
        [models.NAMES.collection, models.NAMES.exploration, models.NAMES.story,
         models.NAMES.user])


class WipeoutServiceHelpersTests(test_utils.GenericTestBase):
    """Provides testing of the pre-deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceHelpersTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)

    def test_get_pending_deletion_request(self):
        pending_deletion_request_model = (
            user_models.PendingDeletionRequestModel(
                id=self.user_1_id,
                email=self.USER_1_EMAIL,
                deletion_complete=False,
                exploration_ids=['exp1', 'exp2'],
                collection_ids=['col1'],
                story_mappings=None
            )
        )
        pending_deletion_request_model.put()

        pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertEqual(pending_deletion_request.user_id, self.user_1_id)
        self.assertEqual(pending_deletion_request.email, self.USER_1_EMAIL)
        self.assertEqual(pending_deletion_request.deletion_complete, False)
        self.assertEqual(
            pending_deletion_request.exploration_ids, ['exp1', 'exp2'])
        self.assertEqual(pending_deletion_request.collection_ids, ['col1'])
        self.assertEqual(pending_deletion_request.story_mappings, None)

    def test_save_pending_deletion_request_new(self):
        pending_deletion_request = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_1_id, self.USER_1_EMAIL, [], []))
        wipeout_service.save_pending_deletion_request(pending_deletion_request)

        pending_deletion_request_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        self.assertEqual(pending_deletion_request_model.id, self.user_1_id)
        self.assertEqual(
            pending_deletion_request_model.email, self.USER_1_EMAIL)
        self.assertEqual(
            pending_deletion_request_model.deletion_complete, False)
        self.assertEqual(pending_deletion_request_model.exploration_ids, [])
        self.assertEqual(pending_deletion_request_model.collection_ids, [])
        self.assertEqual(pending_deletion_request_model.story_mappings, None)

    def test_save_pending_deletion_request_existing(self):
        pending_deletion_request_model_old = (
            user_models.PendingDeletionRequestModel(
                id=self.user_1_id,
                email=self.USER_1_EMAIL,
                deletion_complete=False,
                exploration_ids=['exp1', 'exp2'],
                collection_ids=['col1'],
                story_mappings=None
            )
        )
        pending_deletion_request_model_old.put()

        pending_deletion_request = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_1_id, self.USER_1_EMAIL, ['exp1', 'exp2'], ['col1']))
        pending_deletion_request.deletion_complete = True
        pending_deletion_request.story_mappings = {'story_id': 'user_id'}
        wipeout_service.save_pending_deletion_request(pending_deletion_request)

        pending_deletion_request_model_new = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        self.assertEqual(pending_deletion_request_model_new.id, self.user_1_id)
        self.assertEqual(
            pending_deletion_request_model_new.email, self.USER_1_EMAIL)
        self.assertEqual(
            pending_deletion_request_model_new.deletion_complete, True)
        self.assertEqual(
            pending_deletion_request_model_new.exploration_ids,
            ['exp1', 'exp2'])
        self.assertEqual(
            pending_deletion_request_model_new.collection_ids, ['col1'])
        self.assertEqual(
            pending_deletion_request_model_new.story_mappings,
            {'story_id': 'user_id'})
        self.assertEqual(
            pending_deletion_request_model_old.created_on,
            pending_deletion_request_model_new.created_on)

    def test_delete_pending_deletion_request(self):
        pending_deletion_request_model = (
            user_models.PendingDeletionRequestModel(
                id=self.user_1_id,
                email=self.USER_1_EMAIL,
                deletion_complete=False,
                exploration_ids=['exp1', 'exp2'],
                collection_ids=['col1'],
                story_mappings=None
            )
        )
        pending_deletion_request_model.put()

        wipeout_service.delete_pending_deletion_request(self.user_1_id)

        self.assertIsNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))


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


class WipeoutServiceDeleteUserModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    COLLECTION_1_ID = 'col_1_id'
    COLLECTION_2_ID = 'col_2_id'
    EXPLORATION_1_ID = 'exp_1_id'
    EXPLORATION_2_ID = 'exp_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteUserModelsTests, self).setUp()
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

    def test_delete_user_simple(self):
        wipeout_service.pre_delete_user(self.user_1_id)

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

    def test_delete_user_collection_exploration_single(self):
        self.save_new_valid_exploration(
            self.EXPLORATION_1_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_1_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_1_ID)

        wipeout_service.pre_delete_user(self.user_1_id)

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNotNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))

    def test_delete_user_collection_exploration_multi(self):
        self.save_new_valid_exploration(
            self.EXPLORATION_1_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_1_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_1_ID)
        self.save_new_valid_exploration(
            self.EXPLORATION_2_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_2_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_2_ID)

        wipeout_service.pre_delete_user(self.user_1_id)

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNotNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))
        self.assertIsNotNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_2_ID))
        self.assertIsNotNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_2_ID))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_2_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_2_ID))

    def test_delete_user_multiple(self):
        wipeout_service.pre_delete_user(self.user_2_id)

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
            wipeout_service.get_pending_deletion_request(self.user_2_id))

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


class WipeoutServiceVerifyDeleteUserModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteUserModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)

    def test_delete_user_simple(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

    def test_delete_user_broken(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

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
            wipeout_service.get_pending_deletion_request(self.user_2_id)))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))


class WipeoutServiceDeleteStoryModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    TOPIC_1_ID = 'topic_1_id'
    STORY_1_ID = 'story_1_id'
    STORY_2_ID = 'story_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceDeleteStoryModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_topic(
            self.TOPIC_1_ID,
            self.user_1_id,
            canonical_story_ids=[self.STORY_1_ID])
        self.save_new_story(self.STORY_1_ID, self.user_1_id, self.TOPIC_1_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)

    def test_delete_story_simple(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])

    def test_delete_story_repeated(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        metadata_model.committer_id = self.user_1_id
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])

    def test_delete_story_multiple_stories(self):
        self.save_new_topic(self.TOPIC_1_ID, self.user_1_id, name='Topic 2')
        self.save_new_story(self.STORY_2_ID, self.user_1_id, self.TOPIC_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_2_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model.story_mappings[self.STORY_2_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model.story_mappings[self.STORY_2_ID])

    def test_delete_story_multiple_users_multiple_stories(self):
        self.save_new_topic(self.TOPIC_1_ID, self.user_2_id, name='Topic 2')
        self.save_new_story(
            self.STORY_2_ID,
            self.user_2_id,
            corresponding_topic_id=self.TOPIC_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_2_ID)
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_2_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model.story_mappings[self.STORY_2_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model.story_mappings[self.STORY_2_ID])

    def test_delete_story_multiple_users_one_story(self):
        story_services.update_story(
            self.user_2_id,
            self.STORY_1_ID,
            [story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 2'
            })],
            'Add node.'
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-2' % self.STORY_1_ID)
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-2' % self.STORY_1_ID)
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_2_id))
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-2' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-2' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id,
            pending_deletion_model.story_mappings[self.STORY_1_ID])


class WipeoutServiceVerifyDeleteStoryModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    TOPIC_1_ID = 'topic_1_id'
    TOPIC_2_ID = 'topic_2_id'
    STORY_1_ID = 'story_1_id'
    STORY_2_ID = 'story_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteStoryModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_topic(self.TOPIC_1_ID, self.user_1_id)
        self.save_new_story(self.STORY_1_ID, self.user_1_id, self.TOPIC_1_ID)
        self.save_new_topic(
            self.TOPIC_2_ID,
            self.user_2_id,
            name='Topic 2',
            canonical_story_ids=[self.STORY_2_ID])
        self.save_new_story(self.STORY_2_ID, self.user_2_id, self.TOPIC_2_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)

    def test_delete_story_simple(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_1_id)))

    def test_delete_story_broken(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        story_services.update_story(
            self.user_2_id,
            self.STORY_2_ID,
            [story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 2'
            })],
            'Add node.'
        )

        self.assertFalse(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(
            wipeout_service.get_pending_deletion_request(self.user_2_id)))
