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

import datetime
import logging

from constants import constants
from core.domain import auth_services
from core.domain import collection_services
from core.domain import exp_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_domain
from core.domain import user_services
from core.domain import wipeout_domain
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

(
    auth_models, collection_models, config_models,
    email_models, exp_models, feedback_models,
    improvements_models, question_models, skill_models,
    story_models, subtopic_models, suggestion_models,
    topic_models, user_models
) = models.Registry.import_models([
    models.NAMES.auth, models.NAMES.collection, models.NAMES.config,
    models.NAMES.email, models.NAMES.exploration, models.NAMES.feedback,
    models.NAMES.improvements, models.NAMES.question, models.NAMES.skill,
    models.NAMES.story, models.NAMES.subtopic, models.NAMES.suggestion,
    models.NAMES.topic, models.NAMES.user
])

datastore_services = models.Registry.import_datastore_services()


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
        self.user_1_role = user_services.get_user_settings(self.user_1_id).role
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.user_2_role = user_services.get_user_settings(self.user_2_id).role

    def test_gets_pending_deletion_request(self):
        wipeout_service.save_pending_deletion_requests(
            [
                wipeout_domain.PendingDeletionRequest.create_default(
                    self.user_1_id, self.USER_1_EMAIL, self.user_1_role)
            ]
        )

        pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertEqual(pending_deletion_request.user_id, self.user_1_id)
        self.assertEqual(pending_deletion_request.email, self.USER_1_EMAIL)
        self.assertEqual(pending_deletion_request.deletion_complete, False)
        self.assertEqual(
            pending_deletion_request.pseudonymizable_entity_mappings, {})

    def test_get_number_of_pending_deletion_requests_returns_correct_number(
            self):
        number_of_pending_deletion_requests = (
            wipeout_service.get_number_of_pending_deletion_requests())
        self.assertEqual(number_of_pending_deletion_requests, 0)

        wipeout_service.save_pending_deletion_requests(
            [
                wipeout_domain.PendingDeletionRequest.create_default(
                    self.user_1_id, self.USER_1_EMAIL, self.user_1_role),
                wipeout_domain.PendingDeletionRequest.create_default(
                    self.user_2_id, self.USER_2_EMAIL, self.user_2_role)
            ]
        )
        number_of_pending_deletion_requests = (
            wipeout_service.get_number_of_pending_deletion_requests())
        self.assertEqual(number_of_pending_deletion_requests, 2)

    def test_saves_pending_deletion_request_when_new(self):
        pending_deletion_request = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_1_id, self.USER_1_EMAIL, self.user_1_role))
        wipeout_service.save_pending_deletion_requests(
            [pending_deletion_request])

        pending_deletion_request_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        self.assertEqual(pending_deletion_request_model.id, self.user_1_id)
        self.assertEqual(
            pending_deletion_request_model.email, self.USER_1_EMAIL)
        self.assertEqual(
            pending_deletion_request_model.deletion_complete, False)
        self.assertEqual(
            pending_deletion_request_model.pseudonymizable_entity_mappings, {})

    def test_saves_pending_deletion_request_when_already_existing(self):
        pending_deletion_request_model_old = (
            user_models.PendingDeletionRequestModel(
                id=self.user_1_id,
                email=self.USER_1_EMAIL,
                role=self.user_1_role,
                deletion_complete=False,
                pseudonymizable_entity_mappings={}
            )
        )
        pending_deletion_request_model_old.put()

        pending_deletion_request = (
            wipeout_domain.PendingDeletionRequest.create_default(
                self.user_1_id, self.USER_1_EMAIL, self.user_1_role)
        )
        pending_deletion_request.deletion_complete = True
        pending_deletion_request.pseudonymizable_entity_mappings = {
            'story': {'story_id': 'user_id'}
        }
        wipeout_service.save_pending_deletion_requests(
            [pending_deletion_request])

        pending_deletion_request_model_new = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        self.assertEqual(pending_deletion_request_model_new.id, self.user_1_id)
        self.assertEqual(
            pending_deletion_request_model_new.email, self.USER_1_EMAIL)
        self.assertEqual(
            pending_deletion_request_model_new.deletion_complete, True)
        self.assertEqual(
            pending_deletion_request_model_new.pseudonymizable_entity_mappings,
            {'story': {'story_id': 'user_id'}})
        self.assertEqual(
            pending_deletion_request_model_old.created_on,
            pending_deletion_request_model_new.created_on)


class WipeoutServicePreDeleteTests(test_utils.GenericTestBase):
    """Provides testing of the pre-deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    USER_3_EMAIL = 'other@email.com'
    USER_3_USERNAME = 'username3'

    def setUp(self):
        super(WipeoutServicePreDeleteTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.set_user_role(self.USER_1_USERNAME, feconf.ROLE_ID_TOPIC_MANAGER)
        self.user_1_auth_id = self.get_auth_id_from_email(self.USER_1_EMAIL)
        self.user_1_actions = user_services.UserActionsInfo(self.user_1_id)

        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.user_1_auth_id = self.get_auth_id_from_email(self.USER_1_EMAIL)
        user_data_dict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'user_id': self.user_1_id,
        }
        new_user_data_dict = {
            'schema_version': 1,
            'display_alias': 'display_alias3',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'user_id': None,
        }
        self.modifiable_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict))
        self.modifiable_new_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(new_user_data_dict))

        user_services.update_multiple_users_data(
            [self.modifiable_user_data])
        self.modifiable_user_data.display_alias = 'name'
        self.modifiable_user_data.pin = '123'
        self.profile_user_id = user_services.create_new_profiles(
            self.user_1_auth_id, self.USER_1_EMAIL,
            [self.modifiable_new_user_data]
        )[0].user_id

    def tearDown(self):
        pending_deletion_request_models = (
            user_models.PendingDeletionRequestModel.get_all())
        for pending_deletion_request_model in pending_deletion_request_models:
            pending_deletion_request = (
                wipeout_service.get_pending_deletion_request(
                    pending_deletion_request_model.id))
            self.assertEqual(
                wipeout_service.run_user_deletion(pending_deletion_request),
                wipeout_domain.USER_DELETION_SUCCESS)
            self.assertEqual(
                wipeout_service.run_user_deletion_completion(
                    pending_deletion_request),
                wipeout_domain.USER_VERIFICATION_SUCCESS)

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
        self.process_and_flush_pending_tasks()

        email_preferences = user_services.get_email_preferences(self.user_1_id)
        self.assertFalse(email_preferences.can_receive_email_updates)
        self.assertFalse(email_preferences.can_receive_editor_role_email)
        self.assertFalse(email_preferences.can_receive_feedback_message_email)
        self.assertFalse(email_preferences.can_receive_subscription_email)

    def test_pre_delete_profile_users_works_correctly(self):
        user_settings = user_services.get_user_settings(self.profile_user_id)
        self.assertFalse(user_settings.deleted)
        self.assertFalse(user_settings.deleted)

        wipeout_service.pre_delete_user(self.profile_user_id)
        self.process_and_flush_pending_tasks()
        user_settings = user_models.UserSettingsModel.get_by_id(
            self.profile_user_id)
        self.assertTrue(user_settings.deleted)

        user_auth_details = (
            auth_models.UserAuthDetailsModel.get_by_id(self.profile_user_id))
        self.assertTrue(user_auth_details.deleted)

    def test_pre_delete_user_for_full_user_also_deletes_all_profiles(self):
        user_settings = user_services.get_user_settings(self.user_1_id)
        self.assertFalse(user_settings.deleted)
        profile_user_settings = user_services.get_user_settings(
            self.profile_user_id)
        self.assertFalse(profile_user_settings.deleted)
        profile_auth_details = user_services.get_user_settings(
            self.profile_user_id)
        self.assertFalse(profile_auth_details.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        user_settings = user_models.UserSettingsModel.get_by_id(self.user_1_id)
        self.assertTrue(user_settings.deleted)
        user_auth_details = (
            auth_models.UserAuthDetailsModel.get_by_id(self.profile_user_id))
        self.assertTrue(user_auth_details.deleted)
        profile_user_settings = user_models.UserSettingsModel.get_by_id(
            self.profile_user_id)
        self.assertTrue(profile_user_settings.deleted)
        profile_auth_details = (
            auth_models.UserAuthDetailsModel.get_by_id(self.profile_user_id))
        self.assertTrue(profile_auth_details.deleted)

    def test_pre_delete_user_without_activities_works_correctly(self):
        user_models.UserSubscriptionsModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()

        user_settings = user_services.get_user_settings(self.user_1_id)
        self.assertFalse(user_settings.deleted)
        user_auth_details = auth_models.UserAuthDetailsModel.get(self.user_1_id)
        self.assertFalse(user_auth_details.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        user_settings = user_models.UserSettingsModel.get_by_id(self.user_1_id)
        self.assertTrue(user_settings.deleted)
        self.assertIsNone(
            auth_services.get_auth_id_from_user_id(self.user_1_id))
        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(pending_deletion_model)

    def test_pre_delete_username_is_not_saved_for_user_younger_than_week(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertIsNone(
            pending_deletion_request.normalized_long_term_username)

    def test_pre_delete_username_is_saved_for_user_older_than_week(self):
        date_10_days_ago = (
            datetime.datetime.utcnow() - datetime.timedelta(days=10))
        with self.mock_datetime_utcnow(date_10_days_ago):
            self.signup(self.USER_3_EMAIL, self.USER_3_USERNAME)
        user_3_id = self.get_user_id_from_email(self.USER_3_EMAIL)

        wipeout_service.pre_delete_user(user_3_id)
        self.process_and_flush_pending_tasks()

        pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(user_3_id))
        self.assertEqual(
            pending_deletion_request.normalized_long_term_username,
            self.USER_3_USERNAME)

    def test_pre_delete_user_with_activities_multiple_owners(self):
        user_services.update_user_role(
            self.user_1_id, feconf.ROLE_ID_COLLECTION_EDITOR)
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        rights_manager.assign_role_for_exploration(
            self.user_1_actions,
            'exp_id',
            self.user_2_id,
            rights_domain.ROLE_OWNER)
        self.save_new_valid_collection(
            'col_id', self.user_1_id, exploration_id='exp_id')
        rights_manager.assign_role_for_collection(
            self.user_1_actions,
            'col_id',
            self.user_2_id,
            rights_domain.ROLE_OWNER)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(pending_deletion_model)

    def test_pre_delete_user_collection_is_marked_deleted(self):
        self.save_new_valid_collection('col_id', self.user_1_id)

        collection_model = collection_models.CollectionModel.get_by_id('col_id')
        self.assertFalse(collection_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNone(collection_models.CollectionModel.get_by_id('col_id'))

    def test_pre_delete_user_exploration_is_marked_deleted(self):
        self.save_new_valid_exploration('exp_id', self.user_1_id)

        exp_model = exp_models.ExplorationModel.get_by_id('exp_id')
        self.assertFalse(exp_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNone(exp_models.ExplorationModel.get_by_id('exp_id'))

    def test_pre_delete_user_collection_ownership_is_released(self):
        self.save_new_valid_collection('col_id', self.user_1_id)
        self.publish_collection(self.user_1_id, 'col_id')
        rights_manager.assign_role_for_collection(
            user_services.get_system_user(),
            'col_id',
            self.user_2_id,
            feconf.ROLE_EDITOR)

        collection_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id('col_id'))
        self.assertFalse(collection_summary_model.community_owned)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        collection_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id('col_id'))
        self.assertTrue(collection_summary_model.community_owned)

    def test_pre_delete_user_exploration_ownership_is_released(self):
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        self.publish_exploration(self.user_1_id, 'exp_id')
        rights_manager.assign_role_for_exploration(
            user_services.get_system_user(),
            'exp_id',
            self.user_2_id,
            feconf.ROLE_EDITOR)

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertFalse(exp_summary_model.community_owned)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertTrue(exp_summary_model.community_owned)

    def test_pre_delete_user_collection_user_is_deassigned(self):
        self.save_new_valid_collection('col_id', self.user_1_id)
        rights_manager.assign_role_for_collection(
            user_services.get_system_user(),
            'col_id',
            self.user_2_id,
            feconf.ROLE_EDITOR)

        collection_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id('col_id'))
        self.assertEqual(collection_summary_model.editor_ids, [self.user_2_id])

        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

        collection_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id('col_id'))
        self.assertEqual(collection_summary_model.editor_ids, [])

    def test_pre_delete_user_exploration_user_is_deassigned(self):
        self.save_new_valid_exploration('exp_id', self.user_1_id)
        rights_manager.assign_role_for_exploration(
            user_services.get_system_user(),
            'exp_id',
            self.user_2_id,
            feconf.ROLE_EDITOR)

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertEqual(exp_summary_model.editor_ids, [self.user_2_id])

        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

        exp_summary_model = exp_models.ExpSummaryModel.get_by_id('exp_id')
        self.assertEqual(exp_summary_model.editor_ids, [])

    def test_pre_delete_user_user_is_deassigned_from_topics(self):
        self.save_new_topic('top_id', self.user_1_id)
        topic_services.assign_role(
            user_services.get_system_user(),
            self.user_1_actions,
            feconf.ROLE_MANAGER,
            'top_id')

        top_rights_model = topic_models.TopicRightsModel.get_by_id('top_id')
        self.assertEqual(top_rights_model.manager_ids, [self.user_1_id])

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        top_rights_model = topic_models.TopicRightsModel.get_by_id('top_id')
        self.assertEqual(top_rights_model.manager_ids, [])


class WipeoutServiceRunFunctionsTests(test_utils.GenericTestBase):
    """Provides testing of the pre-deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceRunFunctionsTests, self).setUp()
        date_10_days_ago = (
            datetime.datetime.utcnow() - datetime.timedelta(days=10))
        with self.mock_datetime_utcnow(date_10_days_ago):
            self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.set_user_role(self.USER_1_USERNAME, feconf.ROLE_ID_TOPIC_MANAGER)
        self.user_1_actions = user_services.UserActionsInfo(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        self.pending_deletion_request = (
            wipeout_service.get_pending_deletion_request(self.user_1_id))

    def test_run_user_deletion_with_user_not_deleted(self):
        self.assertEqual(
            wipeout_service.run_user_deletion(self.pending_deletion_request),
            wipeout_domain.USER_DELETION_SUCCESS
        )

    def test_run_user_deletion_with_user_already_deleted(self):
        wipeout_service.run_user_deletion(self.pending_deletion_request)
        self.assertEqual(
            wipeout_service.run_user_deletion(self.pending_deletion_request),
            wipeout_domain.USER_DELETION_ALREADY_DONE
        )

    def test_run_user_deletion_completion_with_user_not_yet_deleted(self):
        self.assertEqual(
            wipeout_service.run_user_deletion_completion(
                self.pending_deletion_request),
            wipeout_domain.USER_VERIFICATION_NOT_DELETED)

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

    def test_run_user_deletion_completion_with_user_properly_deleted(self):
        wipeout_service.run_user_deletion(self.pending_deletion_request)
        self.assertEqual(
            wipeout_service.run_user_deletion_completion(
                self.pending_deletion_request),
            wipeout_domain.USER_VERIFICATION_SUCCESS
        )
        self.assertIsNotNone(
            user_models.DeletedUserModel.get_by_id(self.user_1_id))
        self.assertTrue(user_services.is_username_taken(self.USER_1_USERNAME))
        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))

        # Pre-deleted auth associations will return None.
        self.assertIsNone(
            auth_services.get_auth_id_from_user_id(self.user_1_id))
        self.assertTrue(
            auth_services.verify_external_auth_associations_are_deleted(
                self.user_1_id))

    def test_run_user_deletion_completion_with_user_wrongly_deleted(self):
        wipeout_service.run_user_deletion(self.pending_deletion_request)

        user_models.CompletedActivitiesModel(
            id=self.user_1_id, exploration_ids=[], collection_ids=[]
        ).put()

        self.assertEqual(
            wipeout_service.run_user_deletion_completion(
                self.pending_deletion_request),
            wipeout_domain.USER_VERIFICATION_FAILURE)

        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            auth_models.UserAuthDetailsModel.get_by_id(self.user_1_id))
        self.assertIsNotNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.user_1_id))


class WipeoutServiceDeleteConfigModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    CONFIG_1_ID = 'config_1_id'
    CONFIG_2_ID = 'config_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteConfigModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        config_models.ConfigPropertyModel(
            id=self.CONFIG_1_ID, value='a'
        ).commit(self.user_1_id, [{'cmd': 'command'}])
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_config_property_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        config_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.config]
        )
        metadata_model = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_1_ID)
        )
        self.assertEqual(
            metadata_model.committer_id, config_mappings[self.CONFIG_1_ID])

    def test_one_config_property_when_the_deletion_is_repeated_is_pseudonymized(
            self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_1_ID)
        )
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        config_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.config]
        )
        self.assertEqual(
            metadata_model.committer_id, config_mappings[self.CONFIG_1_ID])

    def test_multiple_config_properties_are_pseudonymized(self):
        config_models.ConfigPropertyModel(
            id=self.CONFIG_2_ID, value='b'
        ).commit(self.user_1_id, [{'cmd': 'command'}])

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        config_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.config]
        )
        metadata_model_1 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_1_ID)
        )
        self.assertEqual(
            metadata_model_1.committer_id, config_mappings[self.CONFIG_1_ID])

        metadata_model_2 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_2_ID)
        )
        self.assertEqual(
            metadata_model_2.committer_id, config_mappings[self.CONFIG_2_ID])

    def test_multiple_config_properties_with_multiple_users_are_pseudonymized(
            self):
        config_models.ConfigPropertyModel(
            id=self.CONFIG_2_ID, value='b'
        ).commit(self.user_2_id, [{'cmd': 'command'}])

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        config_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.config]
        )
        metadata_model_1 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_1_ID)
        )
        self.assertEqual(
            metadata_model_1.committer_id, config_mappings_1[self.CONFIG_1_ID])

        # Verify second user is not yet deleted.
        metadata_model_2 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_2_ID)
        )
        self.assertEqual(
            metadata_model_2.committer_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        config_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.NAMES.config]
        )
        metadata_model_3 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_2_ID)
        )
        self.assertEqual(
            metadata_model_3.committer_id, config_mappings_2[self.CONFIG_2_ID])

    def test_one_config_property_with_multiple_users_is_pseudonymized(self):
        config_models.ConfigPropertyModel.get_by_id(
            self.CONFIG_1_ID
        ).commit(self.user_2_id, [{'cmd': 'command'}])

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        config_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.config]
        )
        metadata_model_1 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-1' % self.CONFIG_1_ID)
        )
        self.assertEqual(
            metadata_model_1.committer_id, config_mappings_1[self.CONFIG_1_ID])

        # Verify second user is not yet deleted.
        metadata_model_2 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-2' % self.CONFIG_1_ID)
        )
        self.assertEqual(metadata_model_2.committer_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        config_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.NAMES.config]
        )
        metadata_model_3 = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                '%s-2' % self.CONFIG_1_ID)
        )
        self.assertEqual(
            metadata_model_3.committer_id, config_mappings_2[self.CONFIG_1_ID])


class WipeoutServiceVerifyDeleteConfigModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    CONFIG_1_ID = 'config_1_id'
    CONFIG_2_ID = 'config_2_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteConfigModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        config_model = config_models.ConfigPropertyModel(
            id=self.CONFIG_2_ID, value='a'
        )
        config_model.commit(self.user_1_id, [{'cmd': 'command'}])
        config_model.commit(self.user_1_id, [{'cmd': 'command_2'}])
        config_models.ConfigPropertyModel(
            id=self.CONFIG_2_ID, value='a'
        ).commit(self.user_1_id, [{'cmd': 'command'}])
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        config_models.ConfigPropertyModel(
            id=self.CONFIG_2_ID, value='a'
        ).commit(self.user_1_id, [{'cmd': 'command'}])

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteCollectionModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    COL_1_ID = 'col_1_id'
    COL_2_ID = 'col_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteCollectionModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_valid_collection(self.COL_1_ID, self.user_1_id)
        self.publish_collection(self.user_1_id, self.COL_1_ID)
        rights_manager.assign_role_for_collection(
            user_services.UserActionsInfo(self.user_1_id),
            self.COL_1_ID,
            self.user_2_id,
            feconf.ROLE_OWNER)

    def test_one_collection_snapshot_metadata_is_pseudonymized(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.collection]
        )
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID)
        )
        self.assertEqual(
            metadata_model.committer_id,
            collection_mappings[self.COL_1_ID])
        rights_metadata_model_1 = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_1.committer_id,
            collection_mappings[self.COL_1_ID])
        self.assertEqual(
            rights_metadata_model_1.content_user_ids,
            [collection_mappings[self.COL_1_ID]])
        self.assertEqual(rights_metadata_model_1.commit_cmds_user_ids, [])
        rights_metadata_model_2 = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                '%s-2' % self.COL_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_2.committer_id,
            collection_mappings[self.COL_1_ID])
        self.assertEqual(
            rights_metadata_model_2.content_user_ids,
            [collection_mappings[self.COL_1_ID]])
        self.assertEqual(rights_metadata_model_2.commit_cmds_user_ids, [])

    def test_one_collection_snapshot_content_is_pseudonymized(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.collection]
        )
        rights_content_model_1 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                '%s-1' % self.COL_1_ID)
        )
        self.assertEqual(
            rights_content_model_1.content['owner_ids'],
            [collection_mappings[self.COL_1_ID]])
        rights_content_model_2 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                '%s-3' % self.COL_1_ID)
        )
        self.assertItemsEqual(
            rights_content_model_2.content['owner_ids'],
            [
                collection_mappings[self.COL_1_ID],
                self.user_2_id
            ])

    def test_one_collection_commit_log_is_pseudonymized(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.collection]
        )
        commit_log_model_1 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-%s-2' % self.COL_1_ID)
        )
        self.assertEqual(
            commit_log_model_1.user_id,
            collection_mappings[self.COL_1_ID])
        commit_log_model_2 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'rights-%s-3' % self.COL_1_ID)
        )
        self.assertEqual(
            commit_log_model_2.user_id,
            collection_mappings[self.COL_1_ID])

    def test_one_collection_with_missing_snapshot_is_pseudonymized(self):
        collection_models.CollectionCommitLogEntryModel(
            id='collection-%s-1' % self.COL_2_ID,
            collection_id=self.COL_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.pre_delete_user(self.user_1_id)
            self.process_and_flush_pending_tasks()
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertItemsEqual(
            log_messages,
            [
                '[WIPEOUT] The commit log model '
                '\'CollectionCommitLogEntryModel\' and '
                'snapshot models [\'CollectionSnapshotMetadataModel\', '
                '\'CollectionRightsSnapshotMetadataModel\'] IDs differ. '
                'Snapshots without commit logs: [], '
                'commit logs without snapshots: [u\'%s\'].' % self.COL_2_ID,
                '[WIPEOUT] The commit log model '
                '\'ExplorationCommitLogEntryModel\' and '
                'snapshot models [\'ExplorationSnapshotMetadataModel\', '
                '\'ExplorationRightsSnapshotMetadataModel\'] IDs differ. '
                'Snapshots without commit logs: [], '
                'commit logs without snapshots: [u\'an_exploration_id\'].'
            ]
        )

        # Verify user is deleted.
        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.collection]
        )
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            collection_mappings[self.COL_1_ID])
        commit_log_model_1 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-1' % self.COL_1_ID
            )
        )
        self.assertEqual(
            commit_log_model_1.user_id,
            collection_mappings[self.COL_1_ID])
        commit_log_model_2 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-1' % self.COL_2_ID
            )
        )
        self.assertEqual(
            commit_log_model_2.user_id,
            collection_mappings[self.COL_2_ID])

    def test_one_collection_when_the_deletion_is_repeated_is_pseudonymized(
            self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID
            )
        )
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.collection]
        )
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            collection_mappings[self.COL_1_ID])
        commit_log_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-1' % self.COL_1_ID)
        )
        self.assertEqual(
            commit_log_model.user_id,
            collection_mappings[self.COL_1_ID])

    def test_collection_user_is_removed_from_contributors(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        old_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id(self.COL_1_ID))

        self.assertNotIn(self.user_1_id, old_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, old_summary_model.contributors_summary)

        old_summary_model.contributor_ids = [self.user_1_id]
        old_summary_model.contributors_summary = {self.user_1_id: 2}
        old_summary_model.update_timestamps()
        old_summary_model.put()

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        new_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id(self.COL_1_ID))

        self.assertNotIn(self.user_1_id, new_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, new_summary_model.contributors_summary)

    def test_col_user_is_removed_from_contributor_ids_when_missing_from_summary(
            self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        old_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id(self.COL_1_ID))

        self.assertNotIn(self.user_1_id, old_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, old_summary_model.contributors_summary)

        old_summary_model.contributor_ids = [self.user_1_id]
        old_summary_model.contributors_summary = {}
        old_summary_model.update_timestamps()
        old_summary_model.put()

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        new_summary_model = (
            collection_models.CollectionSummaryModel.get_by_id(self.COL_1_ID))

        self.assertNotIn(self.user_1_id, new_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, new_summary_model.contributors_summary)

    def test_delete_exp_where_user_has_role_when_rights_model_marked_as_deleted(
            self):
        self.save_new_valid_collection(self.COL_2_ID, self.user_1_id)
        collection_services.delete_collection(self.user_1_id, self.COL_2_ID)

        collection_rights_model = (
            collection_models.CollectionRightsModel.get_by_id(self.COL_2_ID))
        self.assertTrue(collection_rights_model.deleted)
        collection_model = (
            collection_models.CollectionModel.get_by_id(self.COL_2_ID))
        self.assertTrue(collection_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            collection_models.CollectionRightsModel.get_by_id(self.COL_2_ID))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COL_2_ID))

    def test_multiple_collections_are_pseudonymized(self):
        self.save_new_valid_collection(self.COL_2_ID, self.user_1_id)
        self.publish_collection(self.user_1_id, self.COL_2_ID)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        collection_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.collection]
        )
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            collection_mappings[self.COL_1_ID])
        commit_log_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-1' % self.COL_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id,
            collection_mappings[self.COL_1_ID])
        metadata_model = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.COL_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            collection_mappings[self.COL_2_ID])
        commit_log_model = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-%s-1' % self.COL_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id,
            collection_mappings[self.COL_2_ID])


class WipeoutServiceVerifyDeleteCollectionModelsTests(
        test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    COL_1_ID = 'col_1_id'
    COL_2_ID = 'col_2_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteCollectionModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.save_new_valid_collection(self.COL_1_ID, self.user_1_id)
        self.save_new_valid_collection(self.COL_2_ID, self.user_1_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        collection_models.CollectionSnapshotMetadataModel(
            id='%s-1' % self.COL_1_ID,
            committer_id=self.user_1_id,
            commit_message='123',
            commit_type='create',
            commit_cmds={}
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteExplorationModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteExplorationModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_valid_exploration(self.EXP_1_ID, self.user_1_id)
        self.publish_exploration(self.user_1_id, self.EXP_1_ID)
        rights_manager.assign_role_for_exploration(
            user_services.UserActionsInfo(self.user_1_id),
            self.EXP_1_ID,
            self.user_2_id,
            feconf.ROLE_OWNER)

    def test_one_exploration_snapshot_metadata_is_pseudonymized(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.exploration]
        )
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID)
        )
        self.assertEqual(
            metadata_model.committer_id,
            exploration_mappings[self.EXP_1_ID])
        rights_metadata_model_1 = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_1.committer_id,
            exploration_mappings[self.EXP_1_ID])
        self.assertEqual(
            rights_metadata_model_1.content_user_ids,
            [exploration_mappings[self.EXP_1_ID]])
        self.assertEqual(rights_metadata_model_1.commit_cmds_user_ids, [])
        rights_metadata_model_2 = (
            exp_models.ExplorationRightsSnapshotMetadataModel.get_by_id(
                '%s-2' % self.EXP_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_2.committer_id,
            exploration_mappings[self.EXP_1_ID])
        self.assertEqual(
            rights_metadata_model_2.content_user_ids,
            [exploration_mappings[self.EXP_1_ID]])
        self.assertEqual(rights_metadata_model_2.commit_cmds_user_ids, [])

    def test_one_exploration_snapshot_content_is_pseudonymized(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.exploration]
        )
        rights_content_model_1 = (
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                '%s-1' % self.EXP_1_ID)
        )
        self.assertEqual(
            rights_content_model_1.content['owner_ids'],
            [exploration_mappings[self.EXP_1_ID]])
        rights_content_model_2 = (
            exp_models.ExplorationRightsSnapshotContentModel.get_by_id(
                '%s-3' % self.EXP_1_ID)
        )
        self.assertItemsEqual(
            rights_content_model_2.content['owner_ids'],
            [
                exploration_mappings[self.EXP_1_ID],
                self.user_2_id
            ])

    def test_one_exploration_commit_log_is_pseudonymized(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.exploration]
        )
        commit_log_model_1 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'rights-%s-2' % self.EXP_1_ID)
        )
        self.assertEqual(
            commit_log_model_1.user_id, exploration_mappings[self.EXP_1_ID])

        commit_log_model_2 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'rights-%s-3' % self.EXP_1_ID)
        )
        self.assertEqual(
            commit_log_model_2.user_id, exploration_mappings[self.EXP_1_ID])

    def test_one_exploration_with_missing_snapshot_is_pseudonymized(self):
        exp_models.ExplorationCommitLogEntryModel(
            id='exploration-%s-1' % self.EXP_2_ID,
            exploration_id=self.EXP_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.pre_delete_user(self.user_1_id)
            self.process_and_flush_pending_tasks()
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertItemsEqual(
            log_messages,
            [
                '[WIPEOUT] The commit log model '
                '\'ExplorationCommitLogEntryModel\' and '
                'snapshot models [\'ExplorationSnapshotMetadataModel\', '
                '\'ExplorationRightsSnapshotMetadataModel\'] IDs differ. '
                'Snapshots without commit logs: [], '
                'commit logs without snapshots: [u\'%s\'].' % self.EXP_2_ID
            ]
        )

        # Verify user is deleted.
        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.exploration]
        )
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, exploration_mappings[self.EXP_1_ID])
        commit_log_model_1 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.EXP_1_ID
            )
        )
        self.assertEqual(
            commit_log_model_1.user_id, exploration_mappings[self.EXP_1_ID])
        commit_log_model_2 = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.EXP_2_ID
            )
        )
        self.assertEqual(
            commit_log_model_2.user_id, exploration_mappings[self.EXP_2_ID])

    def test_one_exploration_when_the_deletion_is_repeated_is_pseudonymized(
            self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID
            )
        )
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.exploration]
        )
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, exploration_mappings[self.EXP_1_ID])
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.EXP_1_ID)
        )
        self.assertEqual(
            commit_log_model.user_id, exploration_mappings[self.EXP_1_ID])

    def test_exploration_user_is_removed_from_contributors(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        old_summary_model = exp_models.ExpSummaryModel.get_by_id(self.EXP_1_ID)

        self.assertNotIn(self.user_1_id, old_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, old_summary_model.contributors_summary)

        old_summary_model.contributor_ids = [self.user_1_id]
        old_summary_model.contributors_summary = {self.user_1_id: 2}
        old_summary_model.update_timestamps()
        old_summary_model.put()

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        new_summary_model = exp_models.ExpSummaryModel.get_by_id(self.EXP_1_ID)

        self.assertNotIn(self.user_1_id, new_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, new_summary_model.contributors_summary)

    def test_exp_user_is_removed_from_contributor_ids_when_missing_from_summary(
            self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        old_summary_model = exp_models.ExpSummaryModel.get_by_id(self.EXP_1_ID)

        self.assertNotIn(self.user_1_id, old_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, old_summary_model.contributors_summary)

        old_summary_model.contributor_ids = [self.user_1_id]
        old_summary_model.contributors_summary = {}
        old_summary_model.update_timestamps()
        old_summary_model.put()

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        new_summary_model = exp_models.ExpSummaryModel.get_by_id(self.EXP_1_ID)

        self.assertNotIn(self.user_1_id, new_summary_model.contributor_ids)
        self.assertNotIn(self.user_1_id, new_summary_model.contributors_summary)

    def test_delete_exp_where_user_has_role_when_rights_model_marked_as_deleted(
            self):
        self.save_new_valid_exploration(self.EXP_2_ID, self.user_1_id)
        exp_services.delete_exploration(self.user_1_id, self.EXP_2_ID)

        exp_rights_model = (
            exp_models.ExplorationRightsModel.get_by_id(self.EXP_2_ID))
        self.assertTrue(exp_rights_model.deleted)
        exp_model = (
            exp_models.ExplorationRightsModel.get_by_id(self.EXP_2_ID))
        self.assertTrue(exp_model.deleted)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            exp_models.ExplorationRightsModel.get_by_id(self.EXP_2_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXP_2_ID))

    def test_multiple_explorations_are_pseudonymized(self):
        self.save_new_valid_exploration(self.EXP_2_ID, self.user_1_id)
        self.publish_exploration(self.user_1_id, self.EXP_2_ID)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        exploration_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.exploration]
        )
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, exploration_mappings[self.EXP_1_ID])
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.EXP_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, exploration_mappings[self.EXP_1_ID])
        metadata_model = (
            exp_models.ExplorationSnapshotMetadataModel.get_by_id(
                '%s-1' % self.EXP_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, exploration_mappings[self.EXP_2_ID])
        commit_log_model = (
            exp_models.ExplorationCommitLogEntryModel.get_by_id(
                'exploration-%s-1' % self.EXP_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, exploration_mappings[self.EXP_2_ID])


class WipeoutServiceVerifyDeleteExplorationModelsTests(
        test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteExplorationModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.save_new_valid_exploration(self.EXP_1_ID, self.user_1_id)
        self.save_new_valid_exploration(self.EXP_2_ID, self.user_1_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        exp_models.ExplorationSnapshotMetadataModel(
            id='%s-1' % self.EXP_1_ID,
            committer_id=self.user_1_id,
            commit_message='123',
            commit_type='create',
            commit_cmds={}
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteEmailModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    THREAD_1_ID = 'thread_1_id'
    THREAD_2_ID = 'thread_2_id'
    REPLY_1_ID = 'reply_1_id'
    REPLY_2_ID = 'reply_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteEmailModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        email_models.GeneralFeedbackEmailReplyToIdModel(
            id='%s.%s' % (self.user_1_id, self.THREAD_1_ID),
            user_id=self.user_1_id,
            thread_id=self.THREAD_1_ID,
            reply_to_id=self.REPLY_1_ID
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_email_is_deleted(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            email_models.GeneralFeedbackEmailReplyToIdModel.get_by_id(
                '%s.%s' % (self.user_1_id, self.THREAD_1_ID)))

    def test_multiple_emails_are_deleted(self):
        email_models.GeneralFeedbackEmailReplyToIdModel(
            id='%s.%s' % (self.user_1_id, self.THREAD_2_ID),
            user_id=self.user_1_id,
            thread_id=self.THREAD_2_ID,
            reply_to_id=self.REPLY_2_ID
        ).put()

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            email_models.GeneralFeedbackEmailReplyToIdModel.get_by_id(
                '%s.%s' % (self.user_1_id, self.THREAD_1_ID)))
        self.assertIsNone(
            email_models.GeneralFeedbackEmailReplyToIdModel.get_by_id(
                '%s.%s' % (self.user_1_id, self.THREAD_2_ID)))

    def test_multiple_emails_from_multiple_users_are_deleted(self):
        email_models.GeneralFeedbackEmailReplyToIdModel(
            id='%s.%s' % (self.user_2_id, self.THREAD_2_ID),
            user_id=self.user_2_id,
            thread_id=self.THREAD_2_ID,
            reply_to_id=self.REPLY_2_ID
        ).put()

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            email_models.GeneralFeedbackEmailReplyToIdModel.get_by_id(
                '%s.%s' % (self.user_1_id, self.THREAD_1_ID)))
        self.assertIsNotNone(
            email_models.GeneralFeedbackEmailReplyToIdModel.get_by_id(
                '%s.%s' % (self.user_2_id, self.THREAD_2_ID)))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertIsNone(
            email_models.GeneralFeedbackEmailReplyToIdModel.get_by_id(
                '%s.%s' % (self.user_2_id, self.THREAD_2_ID)))


class WipeoutServiceVerifyDeleteEmailModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    THREAD_1_ID = 'thread_1_id'
    THREAD_2_ID = 'thread_2_id'
    REPLY_1_ID = 'reply_1_id'
    REPLY_2_ID = 'reply_2_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteEmailModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        email_models.GeneralFeedbackEmailReplyToIdModel(
            id='%s.%s' % (self.user_1_id, self.THREAD_1_ID),
            user_id=self.user_1_id,
            thread_id=self.THREAD_1_ID,
            reply_to_id=self.REPLY_1_ID
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        email_models.GeneralFeedbackEmailReplyToIdModel(
            id='%s.%s' % (self.user_1_id, self.THREAD_1_ID),
            user_id=self.user_1_id,
            thread_id=self.THREAD_1_ID,
            reply_to_id=self.REPLY_1_ID
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteFeedbackModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    FEEDBACK_1_ID = 'feedback_1_id'
    FEEDBACK_2_ID = 'feedback_2_id'
    MESSAGE_1_ID = 'message_1_id'
    MESSAGE_2_ID = 'message_2_id'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    NUMBER_OF_MODELS = 150

    def setUp(self):
        super(WipeoutServiceDeleteFeedbackModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        feedback_models.GeneralFeedbackThreadModel(
            id=self.FEEDBACK_1_ID,
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_1_ID,
            original_author_id=self.user_1_id,
            subject='Wrong state name',
            has_suggestion=True,
            last_nonempty_message_text='Some text',
            last_nonempty_message_author_id=self.user_2_id
        ).put()
        feedback_models.GeneralFeedbackMessageModel(
            id=self.MESSAGE_1_ID,
            thread_id=self.FEEDBACK_1_ID,
            message_id=0,
            author_id=self.user_2_id,
            text='Some text'
        ).put()
        suggestion_models.GeneralSuggestionModel(
            id=self.FEEDBACK_1_ID,
            suggestion_type=(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.EXP_1_ID,
            target_version_at_submission=1,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id=self.user_1_id,
            final_reviewer_id=self.user_2_id,
            change_cmd={},
            score_category=suggestion_models.SCORE_TYPE_CONTENT
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_feedback_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is pseudonymized.
        feedback_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.feedback]
        )
        feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            feedback_thread_model.original_author_id,
            feedback_mappings[self.FEEDBACK_1_ID]
        )
        suggestion_model_model = (
            suggestion_models.GeneralSuggestionModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            suggestion_model_model.author_id,
            feedback_mappings[self.FEEDBACK_1_ID]
        )

    def test_one_feedback_when_the_deletion_is_repeated_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return feedback thread model to the original user ID.
        feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        feedback_thread_model.original_author_id = self.user_1_id
        feedback_thread_model.update_timestamps()
        feedback_thread_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the feedback thread and the suggestion have the same
        # pseudonymous user ID.
        feedback_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.feedback]
        )
        new_feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            new_feedback_thread_model.original_author_id,
            feedback_mappings[self.FEEDBACK_1_ID]
        )

    def test_multiple_feedbacks_are_pseudonymized(self):
        feedback_thread_models = []
        for i in python_utils.RANGE(self.NUMBER_OF_MODELS):
            feedback_thread_models.append(
                feedback_models.GeneralFeedbackThreadModel(
                    id='feedback-%s' % i,
                    entity_type=feconf.ENTITY_TYPE_EXPLORATION,
                    entity_id=self.EXP_1_ID,
                    original_author_id=self.user_1_id,
                    subject='Too short exploration',
                    last_nonempty_message_text='Some text',
                    last_nonempty_message_author_id=self.user_2_id
                )
            )
            feedback_models.GeneralFeedbackThreadModel.update_timestamps_multi(
                feedback_thread_models)
        feedback_message_models = []
        for i in python_utils.RANGE(self.NUMBER_OF_MODELS):
            feedback_message_models.append(
                feedback_models.GeneralFeedbackMessageModel(
                    id='message-%s' % i,
                    thread_id='feedback-%s' % i,
                    message_id=i,
                    author_id=self.user_1_id,
                    text='Some text'
                )
            )
            feedback_models.GeneralFeedbackMessageModel.update_timestamps_multi(
                feedback_message_models)
        datastore_services.put_multi(
            feedback_thread_models + feedback_message_models)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        feedback_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.feedback]
        )

        pseudonymized_feedback_thread_models = (
            feedback_models.GeneralFeedbackThreadModel.get_multi(
                [model.id for model in feedback_thread_models]
            )
        )
        for feedback_thread_model in pseudonymized_feedback_thread_models:
            self.assertEqual(
                feedback_thread_model.original_author_id,
                feedback_mappings[feedback_thread_model.id]
            )

        pseudonymized_feedback_message_models = (
            feedback_models.GeneralFeedbackMessageModel.get_multi(
                [model.id for model in feedback_message_models]
            )
        )
        for feedback_message_model in pseudonymized_feedback_message_models:
            self.assertEqual(
                feedback_message_model.author_id,
                feedback_mappings[feedback_message_model.thread_id]
            )

    def test_one_feedback_with_multiple_users_is_pseudonymized(self):

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        feedback_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.feedback]
        )

        # Verify first user is pseudonymized.
        feedback_thread_model = (
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                self.FEEDBACK_1_ID)
        )
        self.assertEqual(
            feedback_thread_model.original_author_id,
            feedback_mappings_1[self.FEEDBACK_1_ID]
        )

        # Verify second user is not yet pseudonymized.
        self.assertEqual(
            feedback_thread_model.last_nonempty_message_author_id,
            self.user_2_id
        )

        # Delete second user.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        feedback_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.NAMES.feedback]
        )

        # Verify second user is pseudonymized.
        self.assertEqual(
            feedback_thread_model.last_nonempty_message_author_id,
            feedback_mappings_2[self.FEEDBACK_1_ID]
        )


class WipeoutServiceVerifyDeleteFeedbackModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    FEEDBACK_1_ID = 'feedback_1_id'
    MESSAGE_1_ID = 'message_1_id'
    EXP_1_ID = 'exp_1_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteFeedbackModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        feedback_models.GeneralFeedbackThreadModel(
            id=self.FEEDBACK_1_ID,
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_1_ID,
            original_author_id=self.user_1_id,
            subject='Wrong state name',
            has_suggestion=True,
            last_nonempty_message_text='Some text',
            last_nonempty_message_author_id=self.user_1_id
        ).put()
        feedback_models.GeneralFeedbackMessageModel(
            id=self.MESSAGE_1_ID,
            thread_id=self.FEEDBACK_1_ID,
            message_id=0,
            author_id=self.user_1_id,
            text='Some text'
        ).put()
        suggestion_models.GeneralSuggestionModel(
            id=self.FEEDBACK_1_ID,
            suggestion_type=(
                feconf.SUGGESTION_TYPE_EDIT_STATE_CONTENT),
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.EXP_1_ID,
            target_version_at_submission=1,
            status=suggestion_models.STATUS_IN_REVIEW,
            author_id=self.user_1_id,
            final_reviewer_id=self.user_1_id,
            change_cmd={},
            score_category=suggestion_models.SCORE_TYPE_CONTENT
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        feedback_models.GeneralFeedbackThreadModel(
            id=self.FEEDBACK_1_ID,
            entity_type=feconf.ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_1_ID,
            original_author_id=self.user_1_id,
            subject='Wrong state name',
            has_suggestion=True,
            last_nonempty_message_text='Some text',
            last_nonempty_message_author_id=self.user_1_id
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteImprovementsModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteImprovementsModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.improvements_model_1_id = (
            improvements_models.TaskEntryModel.create(
                entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
                entity_id=self.EXP_1_ID,
                entity_version=1,
                task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
                target_type=constants.TASK_TARGET_TYPE_STATE,
                target_id='State',
                issue_description=None,
                status=constants.TASK_STATUS_RESOLVED,
                resolver_id=self.user_1_id
            )
        )
        self.improvements_model_2_id = (
            improvements_models.TaskEntryModel.create(
                entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
                entity_id=self.EXP_2_ID,
                entity_version=1,
                task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
                target_type=constants.TASK_TARGET_TYPE_STATE,
                target_id='State',
                issue_description=None,
                status=constants.TASK_STATUS_RESOLVED,
                resolver_id=self.user_1_id
            )
        )

    def test_delete_user_is_successful(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNotNone(
            improvements_models.TaskEntryModel.get_by_id(
                self.improvements_model_1_id))
        self.assertIsNotNone(
            improvements_models.TaskEntryModel.get_by_id(
                self.improvements_model_2_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            improvements_models.TaskEntryModel.get_by_id(
                self.improvements_model_1_id))
        self.assertIsNone(
            improvements_models.TaskEntryModel.get_by_id(
                self.improvements_model_2_id))


class WipeoutServiceVerifyDeleteImprovementsModelsTests(
        test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    EXP_3_ID = 'exp_3_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteImprovementsModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        improvements_models.TaskEntryModel.create(
            entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_1_ID,
            entity_version=1,
            task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            target_type=constants.TASK_TARGET_TYPE_STATE,
            target_id='State',
            issue_description=None,
            status=constants.TASK_STATUS_RESOLVED,
            resolver_id=self.user_1_id
        )
        improvements_models.TaskEntryModel.create(
            entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_2_ID,
            entity_version=1,
            task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            target_type=constants.TASK_TARGET_TYPE_STATE,
            target_id='State',
            issue_description=None,
            status=constants.TASK_STATUS_RESOLVED,
            resolver_id=self.user_1_id
        )
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        improvements_models.TaskEntryModel.create(
            entity_type=constants.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id=self.EXP_3_ID,
            entity_version=1,
            task_type=constants.TASK_TYPE_HIGH_BOUNCE_RATE,
            target_type=constants.TASK_TARGET_TYPE_STATE,
            target_id='State',
            issue_description=None,
            status=constants.TASK_STATUS_RESOLVED,
            resolver_id=self.user_1_id
        )

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteQuestionModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    SKILL_1_ID = 'skill_1_id'
    QUESTION_1_ID = 'question_1_id'
    QUESTION_2_ID = 'question_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceDeleteQuestionModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_admins((self.USER_1_USERNAME, self.USER_2_USERNAME))
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        self.save_new_question(
            self.QUESTION_1_ID,
            self.user_1_id,
            self._create_valid_question_data('ABC'),
            [self.SKILL_1_ID]
        )
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_question_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        question_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.question]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID)
        )
        self.assertEqual(
            metadata_model.committer_id, question_mappings[self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID)
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings[self.QUESTION_1_ID])

    def test_one_question_with_missing_snapshot_is_pseudonymized(self):
        question_models.QuestionCommitLogEntryModel(
            id='question-%s-1' % self.QUESTION_2_ID,
            question_id=self.QUESTION_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertEqual(
            log_messages,
            ['[WIPEOUT] The commit log model \'QuestionCommitLogEntryModel\' '
             'and snapshot models [\'QuestionSnapshotMetadataModel\'] IDs '
             'differ. Snapshots without commit logs: [], '
             'commit logs without snapshots: [u\'%s\'].' % self.QUESTION_2_ID])

        # Verify user is deleted.
        question_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.question]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, question_mappings[self.QUESTION_1_ID])
        commit_log_model_1 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model_1.user_id, question_mappings[self.QUESTION_1_ID])
        commit_log_model_2 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            commit_log_model_2.user_id, question_mappings[self.QUESTION_2_ID])

    def test_one_question_when_the_deletion_is_repeated_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        question_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.question]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, question_mappings[self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings[self.QUESTION_1_ID])

    def test_multiple_questions_are_pseudonymized(self):
        self.save_new_question(
            self.QUESTION_2_ID,
            self.user_1_id,
            self._create_valid_question_data('ABC'),
            [self.SKILL_1_ID]
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        question_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.question]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, question_mappings[self.QUESTION_1_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings[self.QUESTION_1_ID])
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, question_mappings[self.QUESTION_2_ID])
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings[self.QUESTION_2_ID])

    def test_multiple_questions_with_multiple_users_are_pseudonymized(self):
        self.save_new_question(
            self.QUESTION_2_ID,
            self.user_2_id,
            self._create_valid_question_data('ABC'),
            [self.SKILL_1_ID]
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        question_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.question]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            question_mappings_1[self.QUESTION_1_ID]
        )
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings_1[self.QUESTION_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        question_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.NAMES.question]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            question_mappings_2[self.QUESTION_2_ID]
        )
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings_2[self.QUESTION_2_ID])

    def test_one_question_with_multiple_users_is_pseudonymized(self):
        question_services.update_question(
            self.user_2_id,
            self.QUESTION_1_ID,
            [question_domain.QuestionChange({
                'cmd': question_domain.CMD_UPDATE_QUESTION_PROPERTY,
                'property_name': (
                    question_domain.QUESTION_PROPERTY_LANGUAGE_CODE),
                'new_value': 'cs',
                'old_value': 'en'
            })],
            'Change language.'
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        question_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.question]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            question_mappings_1[self.QUESTION_1_ID]
        )
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-1' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings_1[self.QUESTION_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-2' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-2' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        question_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.NAMES.question]
        )
        metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '%s-2' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id,
            question_mappings_2[self.QUESTION_1_ID]
        )
        commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-%s-2' % self.QUESTION_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, question_mappings_2[self.QUESTION_1_ID])


class WipeoutServiceVerifyDeleteQuestionModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    SKILL_1_ID = 'SKILL_1_ID'
    QUESTION_1_ID = 'QUESTION_1_ID'
    QUESTION_2_ID = 'QUESTION_2_ID'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteQuestionModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_admins((self.USER_1_USERNAME, self.USER_2_USERNAME))
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        self.save_new_question(
            self.QUESTION_1_ID,
            self.user_1_id,
            self._create_valid_question_data('ABC'),
            [self.SKILL_1_ID]
        )
        self.save_new_question(
            self.QUESTION_2_ID,
            self.user_2_id,
            self._create_valid_question_data('ABC'),
            [self.SKILL_1_ID]
        )
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_verification_is_successful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verification_when_deletion_failed_is_unsuccessful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))

        question_services.update_question(
            self.user_2_id,
            self.QUESTION_2_ID,
            [question_domain.QuestionChange({
                'cmd': question_domain.CMD_UPDATE_QUESTION_PROPERTY,
                'property_name': (
                    question_domain.QUESTION_PROPERTY_LANGUAGE_CODE),
                'new_value': 'cs',
                'old_value': 'en'
            })],
            'Change language.'
        )


class WipeoutServiceDeleteSkillModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    SKILL_1_ID = 'skill_1_id'
    SKILL_2_ID = 'skill_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceDeleteSkillModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_admins((self.USER_1_USERNAME, self.USER_2_USERNAME))
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_skill_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        skill_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.skill]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings[self.SKILL_1_ID])

    def test_one_skill_with_missing_snapshot_is_pseudonymized(self):
        skill_models.SkillCommitLogEntryModel(
            id='skill-%s-1' % self.SKILL_2_ID,
            skill_id=self.SKILL_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertEqual(
            log_messages,
            ['[WIPEOUT] The commit log model \'SkillCommitLogEntryModel\' and '
             'snapshot models [\'SkillSnapshotMetadataModel\'] IDs differ. '
             'Snapshots without commit logs: [], '
             'commit logs without snapshots: [u\'%s\'].' % self.SKILL_2_ID])

        # Verify user is deleted.
        skill_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.skill]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings[self.SKILL_1_ID])
        commit_log_model_1 = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model_1.user_id, skill_mappings[self.SKILL_1_ID])
        commit_log_model_2 = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            commit_log_model_2.user_id, skill_mappings[self.SKILL_2_ID])

    def test_one_skill_when_the_deletion_is_repeated_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        skill_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.skill]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings[self.SKILL_1_ID])

    def test_multiple_skills_are_pseudonymized(self):
        self.save_new_skill(self.SKILL_2_ID, self.user_1_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        skill_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.skill]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings[self.SKILL_1_ID])
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings[self.SKILL_2_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings[self.SKILL_2_ID])

    def test_multiple_skills_with_multiple_users_are_pseudonymized(self):
        self.save_new_skill(self.SKILL_2_ID, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        skill_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.skill]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings_1[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings_1[self.SKILL_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_2_ID)
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_2_ID)
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        skill_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.NAMES.skill]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings_2[self.SKILL_2_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_2_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings_2[self.SKILL_2_ID])

    def test_one_skill_with_multiple_users_is_pseudonymized(self):
        skill_services.update_skill(
            self.user_2_id,
            self.SKILL_1_ID,
            [skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': skill_domain.SKILL_PROPERTY_LANGUAGE_CODE,
                'new_value': 'cs',
                'old_value': 'en'
            })],
            'Change language.'
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        skill_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.skill]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings_1[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-1' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings_1[self.SKILL_1_ID])

        # Verify second user is not yet deleted.
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-2' % self.SKILL_1_ID)
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-2' % self.SKILL_1_ID)
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        skill_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.NAMES.skill]
        )
        metadata_model = skill_models.SkillSnapshotMetadataModel.get_by_id(
            '%s-2' % self.SKILL_1_ID)
        self.assertEqual(
            metadata_model.committer_id, skill_mappings_2[self.SKILL_1_ID])
        commit_log_model = skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-%s-2' % self.SKILL_1_ID)
        self.assertEqual(
            commit_log_model.user_id, skill_mappings_2[self.SKILL_1_ID])


class WipeoutServiceVerifyDeleteSkillModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    SKILL_1_ID = 'skill_1_id'
    SKILL_2_ID = 'skill_2_id'
    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteSkillModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.set_admins((self.USER_1_USERNAME, self.USER_2_USERNAME))
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_skill(self.SKILL_1_ID, self.user_1_id)
        self.save_new_skill(self.SKILL_2_ID, self.user_2_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_verification_is_successful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verification_when_deletion_failed_is_unsuccessful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))

        skill_services.update_skill(
            self.user_2_id,
            self.SKILL_2_ID,
            [skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': skill_domain.SKILL_PROPERTY_LANGUAGE_CODE,
                'new_value': 'cs',
                'old_value': 'en'
            })],
            'Change language.'
        )

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_2_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))


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
            abbreviated_name='abbrev-one',
            url_fragment='frag-one',
            canonical_story_ids=[self.STORY_1_ID])
        self.save_new_story(self.STORY_1_ID, self.user_1_id, self.TOPIC_1_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_story_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        story_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.story]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings[self.STORY_1_ID])

    def test_one_story_with_missing_snapshot_is_pseudonymized(self):
        story_models.StoryCommitLogEntryModel(
            id='story-%s-1' % self.STORY_2_ID,
            story_id=self.STORY_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertEqual(
            log_messages,
            ['[WIPEOUT] The commit log model \'StoryCommitLogEntryModel\' and '
             'snapshot models [\'StorySnapshotMetadataModel\'] IDs differ. '
             'Snapshots without commit logs: [], '
             'commit logs without snapshots: [u\'%s\'].' % self.STORY_2_ID])

        # Verify user is deleted.
        story_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.story]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings[self.STORY_1_ID])
        commit_log_model_1 = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model_1.user_id, story_mappings[self.STORY_1_ID])
        commit_log_model_2 = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(
            commit_log_model_2.user_id, story_mappings[self.STORY_2_ID])

    def test_one_story_when_the_deletion_is_repeated_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        story_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.story]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings[self.STORY_1_ID])

    def test_multiple_stories_are_pseudonymized(self):
        self.save_new_topic(
            self.TOPIC_1_ID, self.user_1_id, name='Topic 2',
            abbreviated_name='abbrev-two', url_fragment='frag-two')
        self.save_new_story(self.STORY_2_ID, self.user_1_id, self.TOPIC_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        story_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.story]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings[self.STORY_1_ID])
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_2_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings[self.STORY_2_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings[self.STORY_2_ID])

    def test_multiple_stories_with_multiple_users_are_pseudonymized(self):
        self.save_new_topic(
            self.TOPIC_1_ID, self.user_2_id, name='Topic 2',
            abbreviated_name='abbrev-three', url_fragment='frag-three')
        self.save_new_story(self.STORY_2_ID, self.user_2_id, self.TOPIC_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        story_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.story]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings_1[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings_1[self.STORY_1_ID])

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
        story_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.NAMES.story]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_2_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings_2[self.STORY_2_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_2_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings_2[self.STORY_2_ID])

    def test_one_story_with_multiple_users_is_pseudonymized(self):
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
        story_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.story]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-1' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings_1[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-1' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings_1[self.STORY_1_ID])

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
        story_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.NAMES.story]
        )
        metadata_model = story_models.StorySnapshotMetadataModel.get_by_id(
            '%s-2' % self.STORY_1_ID)
        self.assertEqual(
            metadata_model.committer_id, story_mappings_2[self.STORY_1_ID])
        commit_log_model = story_models.StoryCommitLogEntryModel.get_by_id(
            'story-%s-2' % self.STORY_1_ID)
        self.assertEqual(
            commit_log_model.user_id, story_mappings_2[self.STORY_1_ID])


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
        self.save_new_topic(
            self.TOPIC_1_ID, self.user_1_id, abbreviated_name='abbrev-four',
            url_fragment='frag-four')
        self.save_new_story(self.STORY_1_ID, self.user_1_id, self.TOPIC_1_ID)
        self.save_new_topic(
            self.TOPIC_2_ID,
            self.user_2_id,
            name='Topic 2',
            abbreviated_name='abbrev-five',
            url_fragment='frag-five',
            canonical_story_ids=[self.STORY_2_ID])
        self.save_new_story(self.STORY_2_ID, self.user_2_id, self.TOPIC_2_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_verification_is_successful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verification_when_deletion_failed_is_unsuccessful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))

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

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_2_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))


class WipeoutServiceDeleteSubtopicModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    TOP_1_ID = 'top_1_id'
    SUBTOP_1_ID = 'subtop_1_id'
    SUBTOP_2_ID = 'subtop_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteSubtopicModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        self.save_new_topic(self.TOP_1_ID, self.user_1_id)
        self.subtopic_page = self.save_new_subtopic(
            self.SUBTOP_1_ID, self.user_1_id, self.TOP_1_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_one_subtopic_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        subtopic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.subtopic]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])

    def test_one_subtopic_with_missing_snapshot_is_pseudonymized(self):
        subtopic_models.SubtopicPageCommitLogEntryModel(
            id='%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID),
            subtopic_page_id=self.SUBTOP_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertEqual(
            log_messages,
            ['[WIPEOUT] The commit log model '
             '\'SubtopicPageCommitLogEntryModel\' and snapshot models '
             '[\'SubtopicPageSnapshotMetadataModel\'] IDs differ. '
             'Snapshots without commit logs: [], '
             'commit logs without snapshots: [u\'%s\'].' % self.SUBTOP_2_ID])

        # Verify user is deleted.
        subtopic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.subtopic]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])

    def test_one_subtopic_when_the_deletion_is_repeated_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        subtopic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.subtopic]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])

    def test_multiple_subtopics_are_pseudonymized(self):
        self.save_new_subtopic(self.SUBTOP_2_ID, self.user_1_id, self.TOP_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        subtopic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.subtopic]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_2_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings['%s-%s' % (self.TOP_1_ID, self.SUBTOP_2_ID)])

    def test_multiple_subtopics_with_multiple_users_are_pseudonymized(self):
        self.save_new_subtopic(self.SUBTOP_2_ID, self.user_2_id, self.TOP_1_ID)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        subtopic_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.subtopic]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings_1['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings_1['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])

        # Verify second user is not yet deleted.
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        subtopic_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.NAMES.subtopic]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings_2['%s-%s' % (self.TOP_1_ID, self.SUBTOP_2_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_2_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings_2['%s-%s' % (self.TOP_1_ID, self.SUBTOP_2_ID)])

    def test_one_subtopic_with_multiple_users_is_pseudonymized(self):
        subtopic_page_services.save_subtopic_page(
            self.user_2_id,
            self.subtopic_page,
            'Change subtopic',
            [
                subtopic_page_domain.SubtopicPageChange({
                    'cmd': (
                        subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY),
                    'property_name': (
                        subtopic_page_domain
                        .SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML),
                    'new_value': 'new value',
                    'old_value': 'old value',
                    'subtopic_id': self.SUBTOP_1_ID
                })
            ]
        )

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify first user is deleted.
        subtopic_mappings_1 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.subtopic]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings_1['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings_1['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])

        # Verify second user is not yet deleted.
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-2' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(metadata_model.committer_id, self.user_2_id)
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-2' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(commit_log_model.user_id, self.user_2_id)

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))

        # Verify second user is deleted.
        subtopic_mappings_2 = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_2_id
            ).pseudonymizable_entity_mappings[models.NAMES.subtopic]
        )
        metadata_model = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '%s-%s-2' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            metadata_model.committer_id,
            subtopic_mappings_2['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])
        commit_log_model = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-%s-%s-2' % (self.TOP_1_ID, self.SUBTOP_1_ID)))
        self.assertEqual(
            commit_log_model.user_id,
            subtopic_mappings_2['%s-%s' % (self.TOP_1_ID, self.SUBTOP_1_ID)])


class WipeoutServiceVerifyDeleteSubtopicModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    TOP_1_ID = 'top_1_id'
    SUBTOP_1_ID = 'subtop_1_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteSubtopicModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.save_new_topic(self.TOP_1_ID, self.user_1_id)
        self.save_new_subtopic(self.SUBTOP_1_ID, self.user_1_id, self.TOP_1_ID)
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verification_is_successful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verification_when_deletion_failed_is_unsuccessful(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        subtopic_models.SubtopicPageSnapshotMetadataModel(
            id='%s-%s-1' % (self.TOP_1_ID, self.SUBTOP_1_ID),
            committer_id=self.user_1_id,
            commit_message='123',
            commit_type='create',
            commit_cmds={}
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteSuggestionModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    VOICEOVER_1_ID = 'voiceover_1_id'
    VOICEOVER_2_ID = 'voiceover_2_id'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteSuggestionModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        suggestion_models.GeneralVoiceoverApplicationModel(
            id=self.VOICEOVER_1_ID,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.EXP_1_ID,
            language_code='en',
            status=suggestion_models.STATUS_IN_REVIEW,
            content='Text',
            filename='filename.txt',
            author_id=self.user_1_id,
            final_reviewer_id=self.user_2_id,
        ).put()
        suggestion_models.GeneralVoiceoverApplicationModel(
            id=self.VOICEOVER_2_ID,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.EXP_2_ID,
            language_code='en',
            status=suggestion_models.STATUS_IN_REVIEW,
            content='Text',
            filename='filename.txt',
            author_id=self.user_2_id,
            final_reviewer_id=self.user_1_id,
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_voiceover_application_is_pseudonymized(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        suggestion_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.suggestion]
        )

        # Verify user is pseudonymized.
        voiceover_application_model_1 = (
            suggestion_models.GeneralVoiceoverApplicationModel.get_by_id(
                self.VOICEOVER_1_ID)
        )
        self.assertEqual(
            voiceover_application_model_1.author_id,
            suggestion_mappings[self.VOICEOVER_1_ID]
        )
        voiceover_application_model_2 = (
            suggestion_models.GeneralVoiceoverApplicationModel.get_by_id(
                self.VOICEOVER_2_ID)
        )
        self.assertEqual(
            voiceover_application_model_2.final_reviewer_id,
            suggestion_mappings[self.VOICEOVER_2_ID]
        )


class WipeoutServiceVerifyDeleteSuggestionModelsTests(
        test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    VOICEOVER_1_ID = 'voiceover_1_id'
    VOICEOVER_2_ID = 'voiceover_2_id'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteSuggestionModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        suggestion_models.GeneralVoiceoverApplicationModel(
            id=self.VOICEOVER_1_ID,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.EXP_1_ID,
            language_code='en',
            status=suggestion_models.STATUS_IN_REVIEW,
            content='Text',
            filename='filename.txt',
            author_id=self.user_1_id,
            final_reviewer_id=self.user_2_id,
        ).put()
        suggestion_models.GeneralVoiceoverApplicationModel(
            id=self.VOICEOVER_2_ID,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.EXP_2_ID,
            language_code='en',
            status=suggestion_models.STATUS_IN_REVIEW,
            content='Text',
            filename='filename.txt',
            author_id=self.user_2_id,
            final_reviewer_id=self.user_1_id,
        ).put()
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        suggestion_models.GeneralVoiceoverApplicationModel(
            id=self.VOICEOVER_1_ID,
            target_type=feconf.ENTITY_TYPE_EXPLORATION,
            target_id=self.EXP_1_ID,
            language_code='en',
            status=suggestion_models.STATUS_IN_REVIEW,
            content='Text',
            filename='filename.txt',
            author_id=self.user_1_id,
            final_reviewer_id=self.user_2_id,
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


class WipeoutServiceDeleteTopicModelsTests(test_utils.GenericTestBase):
    """Provides testing of the deletion part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    USER_2_EMAIL = 'some-other@email.com'
    USER_2_USERNAME = 'username2'
    TOP_1_ID = 'top_1_id'
    TOP_2_ID = 'top_2_id'

    def setUp(self):
        super(WipeoutServiceDeleteTopicModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.user_2_id = self.get_user_id_from_email(self.USER_2_EMAIL)
        user_services.update_user_role(
            self.user_1_id, feconf.ROLE_ID_ADMIN)
        user_services.update_user_role(
            self.user_2_id, feconf.ROLE_ID_TOPIC_MANAGER)
        self.user_1_actions = user_services.UserActionsInfo(self.user_1_id)
        self.user_2_actions = user_services.UserActionsInfo(self.user_2_id)
        self.save_new_topic(self.TOP_1_ID, self.user_1_id)
        topic_services.assign_role(
            self.user_1_actions,
            self.user_1_actions,
            topic_domain.ROLE_MANAGER,
            self.TOP_1_ID)
        topic_services.assign_role(
            self.user_1_actions,
            self.user_2_actions,
            topic_domain.ROLE_MANAGER,
            self.TOP_1_ID)

    def test_one_topic_snapshot_metadata_is_pseudonymized(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.topic]
        )
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID)
        )
        self.assertEqual(
            metadata_model.committer_id, topic_mappings[self.TOP_1_ID])
        rights_metadata_model_1 = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_1.committer_id, topic_mappings[self.TOP_1_ID])
        self.assertEqual(
            rights_metadata_model_1.content_user_ids, [])
        self.assertEqual(rights_metadata_model_1.commit_cmds_user_ids, [])
        rights_metadata_model_2 = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                '%s-2' % self.TOP_1_ID)
        )
        self.assertEqual(
            rights_metadata_model_2.committer_id, topic_mappings[self.TOP_1_ID])
        self.assertEqual(
            rights_metadata_model_2.content_user_ids,
            [topic_mappings[self.TOP_1_ID]])
        self.assertEqual(
            rights_metadata_model_2.commit_cmds_user_ids,
            [topic_mappings[self.TOP_1_ID]])

    def test_one_topic_snapshot_content_is_pseudonymized(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.topic]
        )
        rights_content_model_1 = (
            topic_models.TopicRightsSnapshotContentModel.get_by_id(
                '%s-1' % self.TOP_1_ID)
        )
        self.assertEqual(
            rights_content_model_1.content['manager_ids'], [])
        rights_content_model_2 = (
            topic_models.TopicRightsSnapshotContentModel.get_by_id(
                '%s-3' % self.TOP_1_ID)
        )
        self.assertItemsEqual(
            rights_content_model_2.content['manager_ids'],
            [
                topic_mappings[self.TOP_1_ID],
                self.user_2_id
            ])

    def test_one_topic_commit_log_is_pseudonymized(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify user is deleted.
        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.topic]
        )
        commit_log_model_1 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'rights-%s-2' % self.TOP_1_ID)
        )
        self.assertEqual(
            commit_log_model_1.user_id, topic_mappings[self.TOP_1_ID])

    def test_one_topic_with_missing_snapshot_is_pseudonymized(self):
        topic_models.TopicCommitLogEntryModel(
            id='topic-%s-1' % self.TOP_2_ID,
            topic_id=self.TOP_2_ID,
            user_id=self.user_1_id,
            commit_type='create_new',
            commit_cmds=[{}],
            post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
            version=1
        ).put()

        with self.capture_logging(min_level=logging.ERROR) as log_messages:
            wipeout_service.pre_delete_user(self.user_1_id)
            self.process_and_flush_pending_tasks()
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertItemsEqual(
            log_messages,
            [
                '[WIPEOUT] The commit log model \'TopicCommitLogEntryModel\' '
                'and snapshot models [\'TopicSnapshotMetadataModel\', '
                '\'TopicRightsSnapshotMetadataModel\'] IDs differ. '
                'Snapshots without commit logs: [], '
                'commit logs without snapshots: [u\'%s\'].' % self.TOP_2_ID
            ]
        )

        # Verify user is deleted.
        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.topic]
        )
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, topic_mappings[self.TOP_1_ID])
        commit_log_model_1 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-%s-1' % self.TOP_1_ID
            )
        )
        self.assertEqual(
            commit_log_model_1.user_id, topic_mappings[self.TOP_1_ID])
        commit_log_model_2 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-%s-1' % self.TOP_2_ID
            )
        )
        self.assertEqual(
            commit_log_model_2.user_id, topic_mappings[self.TOP_2_ID])

    def test_one_topic_when_the_deletion_is_repeated_is_pseudonymized(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Return metadata model to the original user ID.
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID
            )
        )
        metadata_model.committer_id = self.user_1_id
        metadata_model.update_timestamps()
        metadata_model.put()

        # Run the user deletion again.
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        # Verify that both the commit and the metadata have the same
        # pseudonymous user ID.
        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.topic]
        )
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, topic_mappings[self.TOP_1_ID])
        commit_log_model = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-%s-1' % self.TOP_1_ID)
        )
        self.assertEqual(
            commit_log_model.user_id, topic_mappings[self.TOP_1_ID])

    def test_multiple_topics_are_pseudonymized(self):
        self.save_new_topic(
            self.TOP_2_ID,
            self.user_1_id,
            name='topic2',
            url_fragment='topic-two')

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        topic_mappings = (
            user_models.PendingDeletionRequestModel.get_by_id(
                self.user_1_id
            ).pseudonymizable_entity_mappings[models.NAMES.topic]
        )
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_1_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, topic_mappings[self.TOP_1_ID])
        commit_log_model = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-%s-1' % self.TOP_1_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, topic_mappings[self.TOP_1_ID])
        metadata_model = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '%s-1' % self.TOP_2_ID
            )
        )
        self.assertEqual(
            metadata_model.committer_id, topic_mappings[self.TOP_2_ID])
        commit_log_model = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-%s-1' % self.TOP_2_ID
            )
        )
        self.assertEqual(
            commit_log_model.user_id, topic_mappings[self.TOP_2_ID])


class WipeoutServiceVerifyDeleteTopicModelsTests(test_utils.GenericTestBase):
    """Provides testing of the verification part of wipeout service."""

    USER_1_EMAIL = 'some@email.com'
    USER_1_USERNAME = 'username1'
    TOP_1_ID = 'top_1_id'
    TOP_2_ID = 'top_2_id'
    SUBTOP_1_ID = 'subtop_1_id'

    def setUp(self):
        super(WipeoutServiceVerifyDeleteTopicModelsTests, self).setUp()
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.user_1_id = self.get_user_id_from_email(self.USER_1_EMAIL)
        self.save_new_topic(self.TOP_1_ID, self.user_1_id)
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))

        topic_models.TopicSnapshotMetadataModel(
            id='%s-1' % self.TOP_1_ID,
            committer_id=self.user_1_id,
            commit_message='123',
            commit_type='create',
            commit_cmds={}
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))


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
        self.user_1_auth_id = self.get_auth_id_from_email(self.USER_1_EMAIL)
        user_data_dict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'user_id': self.user_1_id,
        }
        new_user_data_dict = {
            'schema_version': 1,
            'display_alias': 'display_alias3',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'user_id': None,
        }
        self.modifiable_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict))
        self.modifiable_new_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(new_user_data_dict))

        user_services.update_multiple_users_data(
            [self.modifiable_user_data])

        self.modifiable_new_user_data.display_alias = 'name'
        self.modifiable_new_user_data.pin = '123'
        self.profile_user_id = user_services.create_new_profiles(
            self.user_1_auth_id, self.USER_1_EMAIL,
            [self.modifiable_new_user_data]
        )[0].user_id

        user_models.CompletedActivitiesModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[]
        ).put()

    def test_delete_user_for_profile_user_is_successful(self):
        wipeout_service.pre_delete_user(self.profile_user_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNone(
            auth_services.get_auth_id_from_user_id(self.profile_user_id))
        self.assertTrue(
            auth_services.verify_external_auth_associations_are_deleted(
                self.profile_user_id))

        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(
                self.profile_user_id)
        )
        self.assertIsNotNone(
            user_models.IncompleteActivitiesModel.get_by_id(
                self.profile_user_id)
        )
        self.assertIsNotNone(
            user_models.LearnerPlaylistModel.get_by_id(self.profile_user_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(
                self.profile_user_id)
        )
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(
                self.profile_user_id)
        )
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.profile_user_id))

    def test_delete_user_for_full_user_and_its_profiles_is_successful(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNone(
            auth_services.get_auth_id_from_user_id(self.user_1_id))
        # External auth associations should not have been deleted yet.
        self.assertFalse(
            auth_services.verify_external_auth_associations_are_deleted(
                self.user_1_id))

        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(
                self.profile_user_id))
        self.assertIsNotNone(
            user_models.IncompleteActivitiesModel.get_by_id(
                self.profile_user_id))
        self.assertIsNotNone(
            user_models.LearnerPlaylistModel.get_by_id(self.profile_user_id))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(
                self.profile_user_id))
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(
                self.profile_user_id))
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.profile_user_id))
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

    def test_delete_user_with_collection_and_exploration_is_successful(self):
        self.save_new_valid_exploration(
            self.EXPLORATION_1_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_1_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_1_ID)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))
        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))

        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

    def test_delete_user_with_collections_and_explorations_is_successful(self):
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
        self.process_and_flush_pending_tasks()

        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_2_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_2_ID))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))

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

    def test_delete_user_with_collection_and_exploration_repeated_is_successful(
            self):
        self.save_new_valid_exploration(
            self.EXPLORATION_1_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_1_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_1_ID)

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()

        self.assertIsNotNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))
        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.user_1_id))

        self.save_new_valid_exploration(
            self.EXPLORATION_1_ID,
            self.user_1_id)
        self.save_new_valid_collection(
            self.COLLECTION_1_ID,
            self.user_1_id,
            exploration_id=self.EXPLORATION_1_ID)

        self.assertIsNotNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNotNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertIsNone(
            collection_models.CollectionModel.get_by_id(self.COLLECTION_1_ID))
        self.assertIsNone(
            exp_models.ExplorationModel.get_by_id(self.EXPLORATION_1_ID))

    def test_delete_user_with_multiple_users_is_successful(self):
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

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
            user_models.UserEmailPreferencesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.user_2_id))
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.user_2_id))

    def test_after_deletion_user_and_its_profiles_cannot_do_anything(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))

        self.assertIsNone(user_services.get_user_settings(self.user_1_id))
        self.assertIsNone(user_services.get_user_settings(self.profile_user_id))
        with self.assertRaisesRegexp(Exception, 'User not found.'):
            # Try to do some action with the deleted user.
            user_services.update_preferred_language_codes(
                self.user_1_id, ['en'])
        with self.assertRaisesRegexp(Exception, 'User not found.'):
            # Try to do some action with the deleted user.
            user_services.update_preferred_language_codes(
                self.profile_user_id, ['en'])


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
        self.user_1_auth_id = self.get_auth_id_from_email(self.USER_1_EMAIL)
        user_data_dict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'user_id': self.user_1_id,
        }
        new_user_data_dict = {
            'schema_version': 1,
            'display_alias': 'display_alias3',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'user_id': None,
        }
        self.modifiable_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict))
        self.modifiable_new_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(new_user_data_dict))

        user_services.update_multiple_users_data(
            [self.modifiable_user_data])

        self.modifiable_new_user_data.display_alias = 'name'
        self.modifiable_new_user_data.pin = '123'
        self.profile_user_id = user_services.create_new_profiles(
            self.user_1_auth_id, self.USER_1_EMAIL,
            [self.modifiable_new_user_data]
        )[0].user_id
        wipeout_service.pre_delete_user(self.user_2_id)
        self.process_and_flush_pending_tasks()

    def test_verify_user_delete_when_profile_user_deleted_returns_true(self):
        wipeout_service.pre_delete_user(self.profile_user_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))
        self.assertTrue(
            wipeout_service.verify_user_deleted(self.profile_user_id))

    def test_verify_user_delete_when_user_is_deleted_returns_true(self):
        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_1_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_1_id))
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id)
        )
        self.assertTrue(
            wipeout_service.verify_user_deleted(self.profile_user_id))

    def test_verify_user_delete_when_user_is_not_deleted_returns_false(self):
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))

        user_models.CompletedActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.user_2_id, exploration_ids=[], collection_ids=[]
        ).put()

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_2_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.user_2_id))
        self.assertTrue(wipeout_service.verify_user_deleted(self.user_2_id))

    def test_verify_user_delete_when_profile_user_not_deleted_is_false(self):
        wipeout_service.pre_delete_user(self.profile_user_id)
        self.process_and_flush_pending_tasks()
        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))
        self.assertTrue(
            wipeout_service.verify_user_deleted(self.profile_user_id))

        user_models.CompletedActivitiesModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[]
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.profile_user_id, exploration_ids=[], collection_ids=[]
        ).put()

        self.assertFalse(
            wipeout_service.verify_user_deleted(self.profile_user_id))

        wipeout_service.delete_user(
            wipeout_service.get_pending_deletion_request(self.profile_user_id))
        self.assertTrue(
            wipeout_service.verify_user_deleted(self.profile_user_id))

    def test_verify_user_delete_when_external_auth_associations_are_not_deleted(
            self):
        self.assertFalse(
            auth_services.verify_external_auth_associations_are_deleted(
                self.user_1_id))

        wipeout_service.pre_delete_user(self.user_1_id)
        self.process_and_flush_pending_tasks()
        delete_external_auth_associations_swap = self.swap_to_always_return(
            auth_services, 'delete_external_auth_associations')

        with delete_external_auth_associations_swap:
            wipeout_service.delete_user(
                wipeout_service.get_pending_deletion_request(self.user_1_id))

        self.assertFalse(wipeout_service.verify_user_deleted(self.user_1_id))
