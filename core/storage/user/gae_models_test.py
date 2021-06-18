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

"""Tests for core.storage.user.gae_models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import types

from core.domain import exp_domain
from core.domain import exp_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])


class UserSettingsModelTest(test_utils.GenericTestBase):
    """Tests for UserSettingsModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_1_ID = 'user_id'
    USER_1_EMAIL = 'user@example.com'
    USER_1_ROLE = feconf.ROLE_ID_ADMIN
    USER_2_ID = 'user2_id'
    USER_2_EMAIL = 'user2@example.com'
    USER_2_ROLE = feconf.ROLE_ID_BANNED_USER
    USER_3_ID = 'user3_id'
    USER_3_EMAIL = 'user3@example.com'
    USER_3_ROLE = feconf.ROLE_ID_ADMIN
    GENERIC_PIN = '12345'
    PROFILE_1_ID = 'profile_id'
    PROFILE_1_EMAIL = 'user@example.com'
    PROFILE_1_ROLE = feconf.ROLE_ID_LEARNER
    GENERIC_USERNAME = 'user'
    GENERIC_DATE = datetime.datetime(2019, 5, 20)
    GENERIC_EPOCH = utils.get_time_in_millisecs(datetime.datetime(2019, 5, 20))
    GENERIC_IMAGE_URL = 'www.example.com/example.png'
    GENERIC_USER_BIO = 'I am a user of Oppia!'
    GENERIC_SUBJECT_INTERESTS = ['Math', 'Science']
    GENERIC_LANGUAGE_CODES = ['en', 'es']
    GENERIC_DISPLAY_ALIAS = 'display_alias'

    def setUp(self):
        super(UserSettingsModelTest, self).setUp()
        user_models.UserSettingsModel(
            id=self.USER_1_ID,
            email=self.USER_1_EMAIL,
            role=self.USER_1_ROLE
        ).put()
        user_models.UserSettingsModel(
            id=self.PROFILE_1_ID,
            email=self.PROFILE_1_EMAIL,
            role=self.PROFILE_1_ROLE
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_2_ID,
            email=self.USER_2_EMAIL,
            role=self.USER_2_ROLE,
            deleted=True
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_3_ID,
            email=self.USER_3_EMAIL,
            role=self.USER_3_ROLE,
            username=self.GENERIC_USERNAME,
            normalized_username=self.GENERIC_USERNAME,
            last_agreed_to_terms=self.GENERIC_DATE,
            last_started_state_editor_tutorial=self.GENERIC_DATE,
            last_started_state_translation_tutorial=self.GENERIC_DATE,
            last_logged_in=self.GENERIC_DATE,
            last_created_an_exploration=self.GENERIC_DATE,
            last_edited_an_exploration=self.GENERIC_DATE,
            profile_picture_data_url=self.GENERIC_IMAGE_URL,
            default_dashboard='learner',
            creator_dashboard_display_pref='card',
            user_bio=self.GENERIC_USER_BIO,
            subject_interests=self.GENERIC_SUBJECT_INTERESTS,
            first_contribution_msec=1,
            preferred_language_codes=self.GENERIC_LANGUAGE_CODES,
            preferred_site_language_code=self.GENERIC_LANGUAGE_CODES[0],
            preferred_audio_language_code=self.GENERIC_LANGUAGE_CODES[0],
            display_alias=self.GENERIC_DISPLAY_ALIAS,
            pin=self.GENERIC_PIN
        ).put()

    def test_get_deletion_policy_is_delete(self):
        self.assertEqual(
            user_models.UserSettingsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE_AT_END)

    def test_apply_deletion_policy_for_registered_users_deletes_them(self):
        # Case for a full user.
        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.USER_1_ID))
        user_models.UserSettingsModel.apply_deletion_policy(self.USER_1_ID)
        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.USER_1_ID))

        # Case for a profile user.
        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.PROFILE_1_ID))
        user_models.UserSettingsModel.apply_deletion_policy(self.PROFILE_1_ID)
        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.PROFILE_1_ID))

    def test_apply_deletion_policy_for_banned_user_deletes_them(self):
        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.USER_2_ID))
        user_models.UserSettingsModel.apply_deletion_policy(self.USER_2_ID)
        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.USER_2_ID))

    def test_apply_deletion_policy_nonexistent_user_raises_no_exception(self):
        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.NONEXISTENT_USER_ID))
        user_models.UserSettingsModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_registered_user_id_is_true(self):
        # Case for a full user.
        self.assertTrue(
            user_models.UserSettingsModel.has_reference_to_user_id(
                self.USER_1_ID)
        )

        # Case for a profile user.
        self.assertTrue(
            user_models.UserSettingsModel.has_reference_to_user_id(
                self.PROFILE_1_ID)
        )

        # Case for a banned full user.
        self.assertTrue(
            user_models.UserSettingsModel.has_reference_to_user_id(
                self.USER_2_ID)
        )

    def test_has_reference_to_non_existing_user_id_is_false(self):
        self.assertFalse(
            user_models.UserSettingsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_get_by_role_for_admin_returns_admin_users(self):
        actual_users = [
            user_models.UserSettingsModel.get_by_id(self.USER_1_ID),
            user_models.UserSettingsModel.get_by_id(self.USER_3_ID)
        ]
        self.assertItemsEqual(
            user_models.UserSettingsModel.get_by_role(feconf.ROLE_ID_ADMIN),
            actual_users
        )

    def test_export_data_for_nonexistent_user_raises_exception(self):
        with self.assertRaisesRegexp(
            user_models.UserSettingsModel.EntityNotFoundError,
            'Entity for class UserSettingsModel with id fake_user not found'):
            user_models.UserSettingsModel.export_data('fake_user')

    def test_export_data_for_trivial_case_returns_data_correctly(self):
        user = user_models.UserSettingsModel.get_by_id(self.USER_1_ID)
        user_data = user.export_data(user.id)
        expected_user_data = {
            'email': 'user@example.com',
            'role': feconf.ROLE_ID_ADMIN,
            'username': None,
            'normalized_username': None,
            'last_agreed_to_terms_msec': None,
            'last_started_state_editor_tutorial_msec': None,
            'last_started_state_translation_tutorial_msec': None,
            'last_logged_in_msec': None,
            'last_edited_an_exploration_msec': None,
            'last_created_an_exploration_msec': None,
            'profile_picture_data_url': None,
            'default_dashboard': 'learner',
            'creator_dashboard_display_pref': 'card',
            'user_bio': None,
            'subject_interests': [],
            'first_contribution_msec': None,
            'preferred_language_codes': [],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'display_alias': None
        }
        self.assertEqual(expected_user_data, user_data)

    def test_export_data_for_nontrivial_case_returns_data_correctly(self):
        user = user_models.UserSettingsModel.get_by_id(self.USER_3_ID)
        user_data = user.export_data(user.id)
        expected_user_data = {
            'email': self.USER_3_EMAIL,
            'role': feconf.ROLE_ID_ADMIN,
            'username': self.GENERIC_USERNAME,
            'normalized_username': self.GENERIC_USERNAME,
            'last_agreed_to_terms_msec': self.GENERIC_EPOCH,
            'last_started_state_editor_tutorial_msec': self.GENERIC_EPOCH,
            'last_started_state_translation_tutorial_msec': self.GENERIC_EPOCH,
            'last_logged_in_msec': self.GENERIC_EPOCH,
            'last_edited_an_exploration_msec': self.GENERIC_EPOCH,
            'last_created_an_exploration_msec': self.GENERIC_EPOCH,
            'profile_picture_data_url': self.GENERIC_IMAGE_URL,
            'default_dashboard': 'learner',
            'creator_dashboard_display_pref': 'card',
            'user_bio': self.GENERIC_USER_BIO,
            'subject_interests': self.GENERIC_SUBJECT_INTERESTS,
            'first_contribution_msec': 1.0,
            'preferred_language_codes': self.GENERIC_LANGUAGE_CODES,
            'preferred_site_language_code': self.GENERIC_LANGUAGE_CODES[0],
            'preferred_audio_language_code': self.GENERIC_LANGUAGE_CODES[0],
            'display_alias': self.GENERIC_DISPLAY_ALIAS
        }
        self.assertEqual(expected_user_data, user_data)

    def test_get_new_id_under_normal_behaviour_returns_unique_ids(self):
        ids = set([])
        for _ in python_utils.RANGE(100):
            new_id = user_models.UserSettingsModel.get_new_id('')
            self.assertNotIn(new_id, ids)
            user_models.UserSettingsModel(
                id=new_id, email='some@email.com').put()
            ids.add(new_id)

    def test_get_new_id_with_deleted_user_model(self):
        # Swap dependent method get_by_id to simulate collision every time.
        get_by_id_swap = self.swap(
            user_models.DeletedUserModel, 'get_by_id', types.MethodType(
                lambda _, __: True, user_models.DeletedUserModel))

        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'New id generator is producing too many collisions.')

        with assert_raises_regexp_context_manager, get_by_id_swap:
            user_models.UserSettingsModel.get_new_id('exploration')

    def test_get_new_id_for_too_many_collisions_raises_error(self):
        # Swap dependent method get_by_id to simulate collision every time.
        get_by_id_swap = self.swap(
            user_models.UserSettingsModel, 'get_by_id', types.MethodType(
                lambda _, __: True, user_models.UserSettingsModel))

        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'New id generator is producing too many collisions.')

        with assert_raises_regexp_context_manager, get_by_id_swap:
            user_models.UserSettingsModel.get_new_id('exploration')


class CompletedActivitiesModelTests(test_utils.GenericTestBase):
    """Tests for the CompletedActivitiesModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_1_ID = 'id_1'
    USER_2_ID = 'id_2'
    EXPLORATION_IDS_1 = ['exp_1', 'exp_2', 'exp_3']
    COLLECTION_IDS_1 = ['col_1', 'col_2', 'col_3']
    STORY_IDS_1 = ['story_1', 'story_2', 'story_3']
    TOPIC_IDS_1 = ['topic_1', 'topic_2', 'topic_3']

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(CompletedActivitiesModelTests, self).setUp()

        user_models.CompletedActivitiesModel(
            id=self.USER_1_ID,
            exploration_ids=self.EXPLORATION_IDS_1,
            collection_ids=self.COLLECTION_IDS_1,
            story_ids=self.STORY_IDS_1,
            learnt_topic_ids=self.TOPIC_IDS_1
        ).put()
        user_models.CompletedActivitiesModel(
            id=self.USER_2_ID,
            exploration_ids=self.EXPLORATION_IDS_1,
            collection_ids=self.COLLECTION_IDS_1,
            story_ids=self.STORY_IDS_1,
            learnt_topic_ids=self.TOPIC_IDS_1,
            deleted=True
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.CompletedActivitiesModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.CompletedActivitiesModel.apply_deletion_policy(
            self.USER_1_ID)
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_1_ID))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.CompletedActivitiesModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.CompletedActivitiesModel
            .has_reference_to_user_id(self.USER_1_ID)
        )
        self.assertTrue(
            user_models.CompletedActivitiesModel
            .has_reference_to_user_id(self.USER_2_ID)
        )
        self.assertFalse(
            user_models.CompletedActivitiesModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_on_nonexistent_user(self):
        """Test if export_data returns None when user is not in datastore."""
        user_data = user_models.CompletedActivitiesModel.export_data(
            self.NONEXISTENT_USER_ID)
        self.assertEqual({}, user_data)

    def test_export_data_on_existent_user(self):
        """Test if export_data works as intended on a user in datastore."""
        user_data = (
            user_models.CompletedActivitiesModel.export_data(self.USER_1_ID))
        expected_data = {
            'exploration_ids': self.EXPLORATION_IDS_1,
            'collection_ids': self.COLLECTION_IDS_1,
            'story_ids': self.STORY_IDS_1,
            'learnt_topic_ids': self.TOPIC_IDS_1
        }
        self.assertEqual(expected_data, user_data)


class IncompleteActivitiesModelTests(test_utils.GenericTestBase):
    """Tests for the IncompleteActivitiesModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_1_ID = 'id_1'
    USER_2_ID = 'id_2'
    EXPLORATION_IDS_1 = ['exp_1', 'exp_2', 'exp_3']
    COLLECTION_IDS_1 = ['col_1', 'col_2', 'col_3']
    STORY_IDS_1 = ['story_1', 'story_2', 'story_3']
    TOPIC_IDS_1 = ['topic_1', 'topic_2', 'topic_3']

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(IncompleteActivitiesModelTests, self).setUp()

        user_models.IncompleteActivitiesModel(
            id=self.USER_1_ID,
            exploration_ids=self.EXPLORATION_IDS_1,
            collection_ids=self.COLLECTION_IDS_1,
            story_ids=self.STORY_IDS_1,
            partially_learnt_topic_ids=self.TOPIC_IDS_1
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.USER_2_ID,
            exploration_ids=self.EXPLORATION_IDS_1,
            collection_ids=self.COLLECTION_IDS_1,
            story_ids=self.STORY_IDS_1,
            partially_learnt_topic_ids=self.TOPIC_IDS_1,
            deleted=True
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.IncompleteActivitiesModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.IncompleteActivitiesModel.apply_deletion_policy(
            self.USER_1_ID)
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.USER_1_ID))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.IncompleteActivitiesModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.IncompleteActivitiesModel
            .has_reference_to_user_id(self.USER_1_ID)
        )
        self.assertTrue(
            user_models.IncompleteActivitiesModel
            .has_reference_to_user_id(self.USER_2_ID)
        )
        self.assertFalse(
            user_models.IncompleteActivitiesModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_on_nonexistent_user(self):
        """Test if export_data returns None when user is not in datastore."""
        user_data = user_models.IncompleteActivitiesModel.export_data(
            self.NONEXISTENT_USER_ID)
        self.assertEqual({}, user_data)

    def test_export_data_on_existent_user(self):
        """Test if export_data works as intended on a user in datastore."""
        user_data = (
            user_models.IncompleteActivitiesModel.export_data(self.USER_1_ID))
        expected_data = {
            'exploration_ids': self.EXPLORATION_IDS_1,
            'collection_ids': self.COLLECTION_IDS_1,
            'story_ids': self.STORY_IDS_1,
            'partially_learnt_topic_ids': self.TOPIC_IDS_1
        }
        self.assertEqual(expected_data, user_data)


class ExpUserLastPlaythroughModelTest(test_utils.GenericTestBase):
    """Tests for ExpUserLastPlaythroughModel class."""

    NONEXISTENT_USER_ID = 'user_id_0'
    USER_ID_1 = 'user_id_1'
    USER_ID_2 = 'user_id_2'
    USER_ID_3 = 'user_id_3'
    EXP_ID_0 = 'exp_id_0'
    EXP_ID_1 = 'exp_id_1'
    STATE_NAME_1 = 'state_name_1'
    STATE_NAME_2 = 'state_name_2'
    EXP_VERSION = 1

    def setUp(self):
        super(ExpUserLastPlaythroughModelTest, self).setUp()

        user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_ID_1, self.EXP_ID_0),
            user_id=self.USER_ID_1,
            exploration_id=self.EXP_ID_0,
            last_played_exp_version=self.EXP_VERSION,
            last_played_state_name=self.STATE_NAME_1
        ).put()
        user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_ID_2, self.EXP_ID_0),
            user_id=self.USER_ID_2,
            exploration_id=self.EXP_ID_0,
            last_played_exp_version=self.EXP_VERSION,
            last_played_state_name=self.STATE_NAME_2
        ).put()
        user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_ID_2, self.EXP_ID_1),
            user_id=self.USER_ID_2,
            exploration_id=self.EXP_ID_1,
            last_played_exp_version=self.EXP_VERSION,
            last_played_state_name=self.STATE_NAME_2
        ).put()
        user_models.ExpUserLastPlaythroughModel(
            id='%s.%s' % (self.USER_ID_3, self.EXP_ID_1),
            user_id=self.USER_ID_3,
            exploration_id=self.EXP_ID_1,
            last_played_exp_version=self.EXP_VERSION,
            last_played_state_name=self.STATE_NAME_2,
            deleted=True
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.ExpUserLastPlaythroughModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.ExpUserLastPlaythroughModel.apply_deletion_policy(
            self.USER_ID_1)
        self.assertIsNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.ExpUserLastPlaythroughModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.ExpUserLastPlaythroughModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.ExpUserLastPlaythroughModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertTrue(
            user_models.ExpUserLastPlaythroughModel
            .has_reference_to_user_id(self.USER_ID_3)
        )
        self.assertFalse(
            user_models.ExpUserLastPlaythroughModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_create_success(self):
        user_models.ExpUserLastPlaythroughModel.create(
            self.USER_ID_1, self.EXP_ID_1).put()
        retrieved_object = user_models.ExpUserLastPlaythroughModel.get_by_id(
            '%s.%s' % (self.USER_ID_1, self.EXP_ID_1))

        self.assertEqual(retrieved_object.user_id, self.USER_ID_1)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_1)

    def test_get_success(self):
        retrieved_object = user_models.ExpUserLastPlaythroughModel.get(
            self.USER_ID_1, self.EXP_ID_0)

        self.assertEqual(retrieved_object.user_id, self.USER_ID_1)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_0)
        self.assertEqual(
            retrieved_object.last_played_exp_version, self.EXP_VERSION)
        self.assertEqual(
            retrieved_object.last_played_state_name, self.STATE_NAME_1)

    def test_get_failure(self):
        retrieved_object = user_models.ExpUserLastPlaythroughModel.get(
            self.USER_ID_1, 'unknown_exp_id')

        self.assertEqual(retrieved_object, None)

    def test_export_data_none(self):
        """Test export data on a user with no explorations."""
        user_data = user_models.ExpUserLastPlaythroughModel.export_data(
            self.NONEXISTENT_USER_ID)
        expected_data = {}
        self.assertEqual(expected_data, user_data)

    def test_export_data_single(self):
        """Test export data on a user with a single exploration."""
        user_data = user_models.ExpUserLastPlaythroughModel.export_data(
            self.USER_ID_1)
        expected_data = {
            self.EXP_ID_0: {
                'last_played_exp_version': self.EXP_VERSION,
                'last_played_state_name': self.STATE_NAME_1
            }
        }
        self.assertEqual(expected_data, user_data)

    def test_export_data_multi(self):
        """Test export data on a user with multiple explorations."""
        user_data = user_models.ExpUserLastPlaythroughModel.export_data(
            self.USER_ID_2)
        expected_data = {
            self.EXP_ID_0: {
                'last_played_exp_version': self.EXP_VERSION,
                'last_played_state_name': self.STATE_NAME_2
            },
            self.EXP_ID_1: {
                'last_played_exp_version': self.EXP_VERSION,
                'last_played_state_name': self.STATE_NAME_2
            }
        }
        self.assertEqual(expected_data, user_data)


class LearnerPlaylistModelTests(test_utils.GenericTestBase):
    """Tests for the LearnerPlaylistModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'
    EXPLORATION_IDS_1 = ['exp_1', 'exp_2', 'exp_3']
    COLLECTION_IDS_1 = ['col_1', 'col_2', 'col_3']

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(LearnerPlaylistModelTests, self).setUp()

        user_models.LearnerPlaylistModel(
            id=self.USER_ID_1,
            exploration_ids=self.EXPLORATION_IDS_1,
            collection_ids=self.COLLECTION_IDS_1
        ).put()
        user_models.LearnerPlaylistModel(
            id=self.USER_ID_2,
            exploration_ids=self.EXPLORATION_IDS_1,
            collection_ids=self.COLLECTION_IDS_1,
            deleted=True
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.LearnerPlaylistModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.LearnerPlaylistModel.apply_deletion_policy(self.USER_ID_1)
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.LearnerPlaylistModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.LearnerPlaylistModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.LearnerPlaylistModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertFalse(
            user_models.LearnerPlaylistModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_on_nonexistent_user(self):
        """Test if export_data returns None when user is not in datastore."""
        user_data = user_models.LearnerPlaylistModel.export_data(
            self.NONEXISTENT_USER_ID)
        self.assertEqual({}, user_data)

    def test_export_data_on_existent_user(self):
        """Test if export_data works as intended on a user in datastore."""
        user_data = user_models.LearnerPlaylistModel.export_data(self.USER_ID_1)
        expected_data = {
            'exploration_ids': self.EXPLORATION_IDS_1,
            'collection_ids': self.COLLECTION_IDS_1
        }
        self.assertEqual(expected_data, user_data)


class UserContributionsModelTests(test_utils.GenericTestBase):
    """Tests for the UserContributionsModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_C_ID = 'id_c'
    USER_A_EMAIL = 'a@example.com'
    USER_B_EMAIL = 'b@example.com'
    USER_A_USERNAME = 'a'
    USER_B_USERNAME = 'b'
    EXP_ID_1 = 'exp_1'
    EXP_ID_2 = 'exp_2'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserContributionsModelTests, self).setUp()
        # User A has no created explorations, one edited exploration.
        # User B has two created and edited explorations.
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)

        # Note that creating an exploration counts as editing it.
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.user_b_id, end_state_name='End')

        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

        self.save_new_valid_exploration(
            self.EXP_ID_2, self.user_b_id, end_state_name='End')

        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID_2, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

        user_models.UserContributionsModel(
            id=self.USER_C_ID,
            deleted=True
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.UserContributionsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.UserContributionsModel.apply_deletion_policy(self.user_a_id)
        self.assertIsNone(
            user_models.UserContributionsModel.get_by_id(self.user_a_id))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserContributionsModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.UserContributionsModel
            .has_reference_to_user_id(self.user_a_id)
        )
        self.assertTrue(
            user_models.UserContributionsModel
            .has_reference_to_user_id(self.USER_C_ID)
        )
        self.assertFalse(
            user_models.UserContributionsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_on_nonexistent_user(self):
        """Test if export_data returns None when user is not in datastore."""
        user_data = user_models.UserContributionsModel.export_data(
            self.NONEXISTENT_USER_ID)
        self.assertEqual({}, user_data)

    def test_export_data_on_partially_involved_user(self):
        """Test export_data on user with no creations and two edits."""
        user_data = user_models.UserContributionsModel.export_data(
            self.user_a_id)
        expected_data = {
            'created_exploration_ids': [],
            'edited_exploration_ids': [self.EXP_ID_1, self.EXP_ID_2]
        }
        self.assertEqual(expected_data, user_data)

    def test_export_data_on_highly_involved_user(self):
        """Test export data on user with two creations and two edits."""
        user_data = user_models.UserContributionsModel.export_data(
            self.user_b_id)
        expected_data = {
            'created_exploration_ids': [self.EXP_ID_1, self.EXP_ID_2],
            'edited_exploration_ids': [self.EXP_ID_1, self.EXP_ID_2]
        }
        self.assertEqual(expected_data, user_data)


class UserEmailPreferencesModelTests(test_utils.GenericTestBase):
    """Tests for the UserEmailPreferencesModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'
    USER_ID_3 = 'id_3'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserEmailPreferencesModelTests, self).setUp()

        user_models.UserEmailPreferencesModel(id=self.USER_ID_1).put()
        user_models.UserEmailPreferencesModel(
            id=self.USER_ID_2,
            deleted=True
        ).put()
        user_models.UserEmailPreferencesModel(
            id=self.USER_ID_3,
            site_updates=False,
            editor_role_notifications=False,
            feedback_message_notifications=False,
            subscription_notifications=False
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.UserEmailPreferencesModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.UserEmailPreferencesModel.apply_deletion_policy(
            self.USER_ID_1)
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserEmailPreferencesModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.UserEmailPreferencesModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.UserEmailPreferencesModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertFalse(
            user_models.UserEmailPreferencesModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_trivial(self):
        user_data = user_models.UserEmailPreferencesModel.export_data(
            self.USER_ID_1)
        self.assertEqual(
            {
                'site_updates': None,
                'editor_role_notifications': True,
                'feedback_message_notifications': True,
                'subscription_notifications': True
            },
            user_data
        )

    def test_export_data_nontrivial(self):
        user_data = user_models.UserEmailPreferencesModel.export_data(
            self.USER_ID_3)
        self.assertEqual(
            user_data,
            {
                'site_updates': False,
                'editor_role_notifications': False,
                'feedback_message_notifications': False,
                'subscription_notifications': False
            }
        )


class UserSubscriptionsModelTests(test_utils.GenericTestBase):
    """Tests for UserSubscriptionsModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID_1 = 'user_id_1'
    USER_ID_2 = 'user_id_2'
    USER_ID_3 = 'user_id_3'
    USER_ID_4 = 'user_id_4'
    USER_ID_5 = 'user_id_5'
    USER_ID_6 = 'user_id_6'
    CREATOR_IDS = [USER_ID_5, USER_ID_6]
    CREATOR_USERNAMES = ['usernameuser_id_5', 'usernameuser_id_6']
    COLLECTION_IDS = ['23', '42', '4']
    EXPLORATION_IDS = ['exp_1', 'exp_2', 'exp_3']
    GENERAL_FEEDBACK_THREAD_IDS = ['42', '4', '8']
    GENERIC_DATETIME = datetime.datetime(2020, 6, 2)

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserSubscriptionsModelTests, self).setUp()
        user_models.UserSettingsModel(
            id=self.USER_ID_1,
            email='some@email.com'
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_ID_2,
            email='some_other@email.com'
        ).put()

        user_models.UserSubscriptionsModel(id=self.USER_ID_1).put()

        for creator_id in self.CREATOR_IDS:
            user_models.UserSettingsModel(
                id=creator_id,
                username='username' + creator_id,
                email=creator_id + '@example.com'
            ).put()

        user_models.UserSubscriptionsModel(
            id=self.USER_ID_2,
            creator_ids=self.CREATOR_IDS,
            collection_ids=self.COLLECTION_IDS,
            exploration_ids=self.EXPLORATION_IDS,
            general_feedback_thread_ids=self.GENERAL_FEEDBACK_THREAD_IDS,
            last_checked=self.GENERIC_DATETIME
        ).put()

        user_models.UserSubscriptionsModel(
            id=self.USER_ID_4,
            deleted=True
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.UserSubscriptionsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.UserSubscriptionsModel.apply_deletion_policy(self.USER_ID_1)
        self.assertIsNone(
            user_models.UserSubscriptionsModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserSubscriptionsModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.UserSubscriptionsModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.UserSubscriptionsModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertFalse(
            user_models.UserSubscriptionsModel
            .has_reference_to_user_id(self.USER_ID_3)
        )
        self.assertTrue(
            user_models.UserSubscriptionsModel
            .has_reference_to_user_id(self.USER_ID_4)
        )
        self.assertTrue(
            user_models.UserSubscriptionsModel
            .has_reference_to_user_id(self.USER_ID_5)
        )
        self.assertTrue(
            user_models.UserSubscriptionsModel
            .has_reference_to_user_id(self.USER_ID_6)
        )
        self.assertFalse(
            user_models.UserSubscriptionsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_trivial(self):
        """Test if empty user data is properly exported."""
        user_data = (
            user_models.UserSubscriptionsModel.export_data(self.USER_ID_1))
        test_data = {
            'creator_usernames': [],
            'collection_ids': [],
            'exploration_ids': [],
            'general_feedback_thread_ids': [],
            'last_checked_msec': None
        }
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self):
        """Test if nonempty user data is properly exported."""
        user_data = (
            user_models.UserSubscriptionsModel.export_data(self.USER_ID_2))
        test_data = {
            'creator_usernames': self.CREATOR_USERNAMES,
            'collection_ids': self.COLLECTION_IDS,
            'exploration_ids': self.EXPLORATION_IDS,
            'general_feedback_thread_ids': self.GENERAL_FEEDBACK_THREAD_IDS,
            'last_checked_msec':
                utils.get_time_in_millisecs(self.GENERIC_DATETIME)
        }
        self.assertEqual(user_data, test_data)

    def test_export_data_on_nonexistent_user(self):
        """Test if exception is raised on nonexistent UserSubscriptionsModel."""
        user_data = user_models.UserSubscriptionsModel.export_data(
            self.USER_ID_3)
        self.assertEqual({}, user_data)


class UserSubscribersModelTests(test_utils.GenericTestBase):
    """Tests for UserSubscribersModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'
    USER_ID_3 = 'id_3'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserSubscribersModelTests, self).setUp()

        user_models.UserSettingsModel(
            id=self.USER_ID_1,
            email='some@email.com'
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_ID_2,
            email='some_other@email.com'
        ).put()

        user_models.UserSubscribersModel(
            id=self.USER_ID_1, subscriber_ids=[self.USER_ID_3]).put()
        user_models.UserSubscribersModel(id=self.USER_ID_2, deleted=True).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.UserSubscribersModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.UserSubscribersModel.apply_deletion_policy(self.USER_ID_1)
        self.assertIsNone(
            user_models.UserSubscribersModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserSubscribersModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.UserSubscribersModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.UserSubscribersModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertTrue(
            user_models.UserSubscribersModel
            .has_reference_to_user_id(self.USER_ID_3)
        )
        self.assertFalse(
            user_models.UserSubscribersModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )


class UserRecentChangesBatchModelTests(test_utils.GenericTestBase):
    """Tests for the UserRecentChangesBatchModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserRecentChangesBatchModelTests, self).setUp()

        user_models.UserRecentChangesBatchModel(id=self.USER_ID_1).put()
        user_models.UserRecentChangesBatchModel(
            id=self.USER_ID_2,
            deleted=True
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.UserRecentChangesBatchModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.UserRecentChangesBatchModel.apply_deletion_policy(
            self.USER_ID_1)
        self.assertIsNone(
            user_models.UserRecentChangesBatchModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserRecentChangesBatchModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.UserRecentChangesBatchModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.UserRecentChangesBatchModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertFalse(
            user_models.UserRecentChangesBatchModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )


class UserStatsModelTest(test_utils.GenericTestBase):
    """Tests for the UserStatsModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'
    USER_ID_3 = 'id_3'

    USER_1_IMPACT_SCORE = 0.87
    USER_1_TOTAL_PLAYS = 33
    USER_1_AVERAGE_RATINGS = 4.37
    USER_1_NUM_RATINGS = 22
    USER_1_WEEKLY_CREATOR_STATS_LIST = [
        {
            ('2019-05-21'): {
                'average_ratings': 4.00,
                'total_plays': 5
            }
        },
        {
            ('2019-05-28'): {
                'average_ratings': 4.95,
                'total_plays': 10
            }
        }
    ]

    USER_2_IMPACT_SCORE = 0.33
    USER_2_TOTAL_PLAYS = 15
    USER_2_AVERAGE_RATINGS = 2.50
    USER_2_NUM_RATINGS = 10
    USER_2_WEEKLY_CREATOR_STATS_LIST = [
        {
            ('2019-05-21'): {
                'average_ratings': 2.50,
                'total_plays': 4
            }
        },
        {
            ('2019-05-28'): {
                'average_ratings': 2.50,
                'total_plays': 6
            }
        }
    ]

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserStatsModelTest, self).setUp()

        user_models.UserStatsModel(
            id=self.USER_ID_1,
            impact_score=self.USER_1_IMPACT_SCORE,
            total_plays=self.USER_1_TOTAL_PLAYS,
            average_ratings=self.USER_1_AVERAGE_RATINGS,
            num_ratings=self.USER_1_NUM_RATINGS,
            weekly_creator_stats_list=self.USER_1_WEEKLY_CREATOR_STATS_LIST
        ).put()
        user_models.UserStatsModel(
            id=self.USER_ID_2,
            impact_score=self.USER_2_IMPACT_SCORE,
            total_plays=self.USER_2_TOTAL_PLAYS,
            average_ratings=self.USER_2_AVERAGE_RATINGS,
            num_ratings=self.USER_2_NUM_RATINGS,
            weekly_creator_stats_list=self.USER_2_WEEKLY_CREATOR_STATS_LIST
        ).put()
        user_models.UserStatsModel(
            id=self.USER_ID_3,
            impact_score=self.USER_2_IMPACT_SCORE,
            total_plays=self.USER_2_TOTAL_PLAYS,
            average_ratings=self.USER_2_AVERAGE_RATINGS,
            num_ratings=self.USER_2_NUM_RATINGS,
            weekly_creator_stats_list=self.USER_2_WEEKLY_CREATOR_STATS_LIST,
            deleted=True
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.UserStatsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.UserStatsModel.apply_deletion_policy(self.USER_ID_1)
        self.assertIsNone(user_models.UserStatsModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserStatsModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.UserStatsModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.UserStatsModel
            .has_reference_to_user_id(self.USER_ID_3)
        )
        self.assertFalse(
            user_models.UserStatsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_on_existing_user(self):
        """Test if export_data works when user is in data store."""
        user_data = user_models.UserStatsModel.export_data(self.USER_ID_1)
        test_data = {
            'impact_score': self.USER_1_IMPACT_SCORE,
            'total_plays': self.USER_1_TOTAL_PLAYS,
            'average_ratings': self.USER_1_AVERAGE_RATINGS,
            'num_ratings': self.USER_1_NUM_RATINGS,
            'weekly_creator_stats_list': self.USER_1_WEEKLY_CREATOR_STATS_LIST
        }
        self.assertEqual(user_data, test_data)

    def test_export_data_on_multiple_users(self):
        """Test if export_data works on multiple users in data store."""
        user_1_data = user_models.UserStatsModel.export_data(self.USER_ID_1)
        test_1_data = {
            'impact_score': self.USER_1_IMPACT_SCORE,
            'total_plays': self.USER_1_TOTAL_PLAYS,
            'average_ratings': self.USER_1_AVERAGE_RATINGS,
            'num_ratings': self.USER_1_NUM_RATINGS,
            'weekly_creator_stats_list': self.USER_1_WEEKLY_CREATOR_STATS_LIST
        }

        user_2_data = user_models.UserStatsModel.export_data(self.USER_ID_2)
        test_2_data = {
            'impact_score': self.USER_2_IMPACT_SCORE,
            'total_plays': self.USER_2_TOTAL_PLAYS,
            'average_ratings': self.USER_2_AVERAGE_RATINGS,
            'num_ratings': self.USER_2_NUM_RATINGS,
            'weekly_creator_stats_list': self.USER_2_WEEKLY_CREATOR_STATS_LIST
        }

        self.assertEqual(user_1_data, test_1_data)
        self.assertEqual(user_2_data, test_2_data)

    def test_export_data_on_nonexistent_user(self):
        """Test if export_data returns None when user is not in data store."""
        user_data = user_models.UserStatsModel.export_data(
            self.NONEXISTENT_USER_ID)
        test_data = {}
        self.assertEqual(user_data, test_data)


class ExplorationUserDataModelTest(test_utils.GenericTestBase):
    """Tests for the ExplorationUserDataModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    DATETIME_OBJECT = datetime.datetime.strptime('2016-02-16', '%Y-%m-%d')
    DATETIME_EPOCH = utils.get_time_in_millisecs(DATETIME_OBJECT)
    USER_1_ID = 'id_1'
    USER_2_ID = 'id_2'
    EXP_ID_ONE = 'exp_id_one'
    EXP_ID_TWO = 'exp_id_two'
    EXP_ID_THREE = 'exp_id_three'

    def setUp(self):
        super(ExplorationUserDataModelTest, self).setUp()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_1_ID, self.EXP_ID_ONE),
            user_id=self.USER_1_ID,
            exploration_id=self.EXP_ID_ONE,
            rating=2,
            rated_on=self.DATETIME_OBJECT,
            draft_change_list={'new_content': {}},
            draft_change_list_last_updated=self.DATETIME_OBJECT,
            draft_change_list_exp_version=3,
            draft_change_list_id=1
        ).put()
        user_models.ExplorationUserDataModel.create(
            self.USER_1_ID, self.EXP_ID_TWO).put()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_2_ID, self.EXP_ID_ONE),
            user_id=self.USER_2_ID,
            exploration_id=self.EXP_ID_ONE,
            rating=2,
            rated_on=self.DATETIME_OBJECT,
            draft_change_list={'new_content': {}},
            draft_change_list_last_updated=self.DATETIME_OBJECT,
            draft_change_list_exp_version=3,
            draft_change_list_id=1
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.ExplorationUserDataModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.ExplorationUserDataModel.apply_deletion_policy(
            self.USER_1_ID)
        self.assertIsNone(
            user_models.ExplorationUserDataModel.query(
                user_models.ExplorationUserDataModel.user_id == self.USER_1_ID
            ).get()
        )
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.ExplorationUserDataModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.ExplorationUserDataModel
            .has_reference_to_user_id(self.USER_1_ID)
        )
        self.assertTrue(
            user_models.ExplorationUserDataModel
            .has_reference_to_user_id(self.USER_2_ID)
        )
        self.assertFalse(
            user_models.ExplorationUserDataModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_create_success(self):
        user_models.ExplorationUserDataModel.create(
            self.USER_1_ID, self.EXP_ID_TWO).put()
        retrieved_object = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_1_ID, self.EXP_ID_TWO))

        self.assertEqual(retrieved_object.user_id, self.USER_1_ID)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_TWO)

    def test_get_success(self):
        retrieved_object = user_models.ExplorationUserDataModel.get(
            self.USER_1_ID, self.EXP_ID_ONE)

        self.assertEqual(retrieved_object.user_id, self.USER_1_ID)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_ONE)
        self.assertEqual(retrieved_object.rating, 2)
        self.assertEqual(
            retrieved_object.draft_change_list, {'new_content': {}})
        self.assertEqual(retrieved_object.rated_on, self.DATETIME_OBJECT)
        self.assertEqual(
            retrieved_object.draft_change_list_last_updated,
            self.DATETIME_OBJECT)
        self.assertEqual(retrieved_object.draft_change_list_exp_version, 3)
        self.assertEqual(retrieved_object.draft_change_list_id, 1)

    def test_get_failure(self):
        retrieved_object = user_models.ExplorationUserDataModel.get(
            self.USER_1_ID, 'unknown_exp_id')

        self.assertEqual(retrieved_object, None)

    def test_export_data_nonexistent_user(self):
        user_data = user_models.ExplorationUserDataModel.export_data(
            'fake_user')
        self.assertEqual(user_data, {})

    def test_export_data_one_exploration(self):
        """Test export data when user has one exploration."""
        user_data = user_models.ExplorationUserDataModel.export_data(
            self.USER_2_ID)
        expected_data = {
            self.EXP_ID_ONE: {
                'rating': 2,
                'rated_on_msec': self.DATETIME_EPOCH,
                'draft_change_list': {'new_content': {}},
                'draft_change_list_last_updated_msec': self.DATETIME_EPOCH,
                'draft_change_list_exp_version': 3,
                'draft_change_list_id': 1,
                'mute_suggestion_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
                'mute_feedback_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)
            }
        }
        self.assertDictEqual(expected_data, user_data)

    def test_export_data_multiple_explorations(self):
        """Test export data when user has multiple explorations."""
        # Add two more explorations.
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_1_ID, self.EXP_ID_THREE),
            user_id=self.USER_1_ID,
            exploration_id=self.EXP_ID_THREE, rating=5,
            rated_on=self.DATETIME_OBJECT,
            draft_change_list={'new_content': {'content': 3}},
            draft_change_list_last_updated=self.DATETIME_OBJECT,
            draft_change_list_exp_version=2,
            draft_change_list_id=2).put()

        user_data = user_models.ExplorationUserDataModel.export_data(
            self.USER_1_ID)

        expected_data = {
            self.EXP_ID_ONE: {
                'rating': 2,
                'rated_on_msec': self.DATETIME_EPOCH,
                'draft_change_list': {'new_content': {}},
                'draft_change_list_last_updated_msec': self.DATETIME_EPOCH,
                'draft_change_list_exp_version': 3,
                'draft_change_list_id': 1,
                'mute_suggestion_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
                'mute_feedback_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)
            },
            self.EXP_ID_TWO: {
                'rating': None,
                'rated_on_msec': None,
                'draft_change_list': None,
                'draft_change_list_last_updated_msec': None,
                'draft_change_list_exp_version': None,
                'draft_change_list_id': 0,
                'mute_suggestion_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
                'mute_feedback_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)
            },
            self.EXP_ID_THREE: {
                'rating': 5,
                'rated_on_msec': self.DATETIME_EPOCH,
                'draft_change_list': {'new_content': {'content': 3}},
                'draft_change_list_last_updated_msec': self.DATETIME_EPOCH,
                'draft_change_list_exp_version': 2,
                'draft_change_list_id': 2,
                'mute_suggestion_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
                'mute_feedback_notifications': (
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)
            }
        }

        self.assertDictEqual(expected_data, user_data)


class CollectionProgressModelTests(test_utils.GenericTestBase):
    """Tests for CollectionProgressModel."""

    NONEXISTENT_USER_ID = 'user_id_x'
    USER_ID_1 = 'user_id_1'
    USER_ID_2 = 'user_id_2'
    USER_ID_3 = 'user_id_3'
    COLLECTION_ID_1 = 'col_id_1'
    COLLECTION_ID_2 = 'col_id_2'
    COMPLETED_EXPLORATION_IDS_1 = ['exp_id_1', 'exp_id_2', 'exp_id_3']
    COMPLETED_EXPLORATION_IDS_2 = ['exp_id_4', 'exp_id_5', 'exp_id_6']

    def setUp(self):
        super(CollectionProgressModelTests, self).setUp()

        user_models.CollectionProgressModel(
            id='%s.%s' % (self.USER_ID_1, self.COLLECTION_ID_1),
            user_id=self.USER_ID_1,
            collection_id=self.COLLECTION_ID_1,
            completed_explorations=self.COMPLETED_EXPLORATION_IDS_1
        ).put()
        user_models.CollectionProgressModel(
            id='%s.%s' % (self.USER_ID_1, self.COLLECTION_ID_2),
            user_id=self.USER_ID_1,
            collection_id=self.COLLECTION_ID_2,
            completed_explorations=self.COMPLETED_EXPLORATION_IDS_2
        ).put()
        user_models.CollectionProgressModel(
            id='%s.%s' % (self.USER_ID_2, self.COLLECTION_ID_1),
            user_id=self.USER_ID_2,
            collection_id=self.COLLECTION_ID_1,
            completed_explorations=self.COMPLETED_EXPLORATION_IDS_1
        ).put()
        user_models.CollectionProgressModel(
            id='%s.%s' % (self.USER_ID_3, self.COLLECTION_ID_1),
            user_id=self.USER_ID_3,
            collection_id=self.COLLECTION_ID_1,
            completed_explorations=self.COMPLETED_EXPLORATION_IDS_1,
            deleted=True
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.CollectionProgressModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.CollectionProgressModel.apply_deletion_policy(
            self.USER_ID_1)
        self.assertIsNone(
            user_models.CollectionProgressModel.query(
                user_models.CollectionProgressModel.user_id == self.USER_ID_1
            ).get()
        )
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.CollectionProgressModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.CollectionProgressModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.CollectionProgressModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertTrue(
            user_models.CollectionProgressModel
            .has_reference_to_user_id(self.USER_ID_3)
        )
        self.assertFalse(
            user_models.CollectionProgressModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_on_nonexistent_user(self):
        """Test export data on nonexistent user."""
        user_data = user_models.CollectionProgressModel.export_data(
            self.NONEXISTENT_USER_ID)
        expected_data = {}
        self.assertEqual(expected_data, user_data)

    def test_export_data_single_collection(self):
        """Test export data on user with a single collection."""
        user_data = user_models.CollectionProgressModel.export_data(
            self.USER_ID_2)
        expected_data = {
            self.COLLECTION_ID_1: {
                'completed_explorations': self.COMPLETED_EXPLORATION_IDS_1
            }
        }
        self.assertEqual(expected_data, user_data)

    def test_export_data_multiple_collections(self):
        """Test export data on user with multiple collections."""
        user_data = user_models.CollectionProgressModel.export_data(
            self.USER_ID_1)
        expected_data = {
            self.COLLECTION_ID_1: {
                'completed_explorations': self.COMPLETED_EXPLORATION_IDS_1
            },
            self.COLLECTION_ID_2: {
                'completed_explorations': self.COMPLETED_EXPLORATION_IDS_2
            }
        }
        self.assertEqual(expected_data, user_data)


class StoryProgressModelTests(test_utils.GenericTestBase):
    """Tests for StoryProgressModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'
    USER_ID_3 = 'id_3'
    STORY_ID_1 = 'story_id_1'
    STORY_ID_2 = 'story_id_2'
    COMPLETED_NODE_IDS_1 = ['node_id_1', 'node_id_2']
    COMPLETED_NODE_IDS_2 = ['node_id_a']

    def setUp(self):
        super(StoryProgressModelTests, self).setUp()
        user_models.StoryProgressModel(
            id='%s.%s' % (self.USER_ID_1, self.STORY_ID_1),
            user_id=self.USER_ID_1,
            story_id=self.STORY_ID_1,
            completed_node_ids=self.COMPLETED_NODE_IDS_1
        ).put()
        user_models.StoryProgressModel(
            id='%s.%s' % (self.USER_ID_2, self.STORY_ID_1),
            user_id=self.USER_ID_2,
            story_id=self.STORY_ID_1,
            completed_node_ids=self.COMPLETED_NODE_IDS_1
        ).put()
        user_models.StoryProgressModel(
            id='%s.%s' % (self.USER_ID_2, self.STORY_ID_2),
            user_id=self.USER_ID_2,
            story_id=self.STORY_ID_2,
            completed_node_ids=self.COMPLETED_NODE_IDS_2
        ).put()
        user_models.StoryProgressModel(
            id='%s.%s' % (self.USER_ID_3, self.STORY_ID_1),
            user_id=self.USER_ID_3,
            story_id=self.STORY_ID_1,
            completed_node_ids=self.COMPLETED_NODE_IDS_1,
            deleted=True
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.StoryProgressModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.StoryProgressModel.apply_deletion_policy(self.USER_ID_2)
        self.assertIsNone(
            user_models.StoryProgressModel.query(
                user_models.StoryProgressModel.user_id == self.USER_ID_2
            ).get()
        )
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.StoryProgressModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.StoryProgressModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.StoryProgressModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertTrue(
            user_models.StoryProgressModel
            .has_reference_to_user_id(self.USER_ID_3)
        )
        self.assertFalse(
            user_models.StoryProgressModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_on_nonexistent_user(self):
        user_data = user_models.StoryProgressModel.export_data(
            self.NONEXISTENT_USER_ID)
        expected_data = {}
        self.assertEqual(expected_data, user_data)

    def test_export_data_on_single_story(self):
        user_data = user_models.StoryProgressModel.export_data(
            self.USER_ID_1)
        expected_data = {
            self.STORY_ID_1: {
                'completed_node_ids': self.COMPLETED_NODE_IDS_1
            }
        }
        self.assertEqual(expected_data, user_data)

    def test_export_data_on_multi_story(self):
        user_data = user_models.StoryProgressModel.export_data(
            self.USER_ID_2)
        expected_data = {
            self.STORY_ID_1: {
                'completed_node_ids': self.COMPLETED_NODE_IDS_1
            },
            self.STORY_ID_2: {
                'completed_node_ids': self.COMPLETED_NODE_IDS_2
            }
        }
        self.assertEqual(expected_data, user_data)

    def test_get_multi(self):
        model = user_models.StoryProgressModel.create(
            'user_id', 'story_id_1')
        model.update_timestamps()
        model.put()

        model = user_models.StoryProgressModel.create(
            'user_id', 'story_id_2')
        model.update_timestamps()
        model.put()

        story_progress_models = user_models.StoryProgressModel.get_multi(
            'user_id', ['story_id_1', 'story_id_2'])
        self.assertEqual(len(story_progress_models), 2)
        self.assertEqual(story_progress_models[0].user_id, 'user_id')
        self.assertEqual(story_progress_models[0].story_id, 'story_id_1')

        self.assertEqual(story_progress_models[1].user_id, 'user_id')
        self.assertEqual(story_progress_models[1].story_id, 'story_id_2')


class UserQueryModelTests(test_utils.GenericTestBase):
    """Tests for UserQueryModel."""

    QUERY_1_ID = 'id_1'
    QUERY_2_ID = 'id_2'
    QUERY_3_ID = 'id_3'
    NONEXISTENT_USER_ID = 'submitter_id_x'
    USER_ID_1 = 'submitter_id_1'
    USER_ID_2 = 'submitter_id_2'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserQueryModelTests, self).setUp()

        user_models.UserQueryModel(
            id=self.QUERY_1_ID,
            submitter_id=self.USER_ID_1
        ).put()
        user_models.UserQueryModel(
            id=self.QUERY_2_ID,
            submitter_id=self.USER_ID_2,
            deleted=True
        ).put()
        user_models.UserQueryModel(
            id=self.QUERY_3_ID,
            submitter_id=self.USER_ID_1
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.UserQueryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.UserQueryModel.apply_deletion_policy(self.USER_ID_1)
        self.assertIsNone(
            user_models.UserQueryModel.query(
                user_models.UserQueryModel.submitter_id == self.USER_ID_1
            ).get()
        )
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserQueryModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.UserQueryModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.UserQueryModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertFalse(
            user_models.UserQueryModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_instance_stores_correct_data(self):
        inactive_in_last_n_days = 5
        created_at_least_n_exps = 1
        created_fewer_than_n_exps = 3
        edited_at_least_n_exps = 2
        edited_fewer_than_n_exps = 5
        has_not_logged_in_for_n_days = 10
        created_collection = True
        used_logic_proof_interaction = True
        user_models.UserQueryModel(
            id=self.QUERY_1_ID,
            inactive_in_last_n_days=inactive_in_last_n_days,
            created_at_least_n_exps=created_at_least_n_exps,
            created_fewer_than_n_exps=created_fewer_than_n_exps,
            edited_at_least_n_exps=edited_at_least_n_exps,
            edited_fewer_than_n_exps=edited_fewer_than_n_exps,
            has_not_logged_in_for_n_days=has_not_logged_in_for_n_days,
            created_collection=created_collection,
            used_logic_proof_interaction=used_logic_proof_interaction,
            submitter_id=self.USER_ID_1).put()

        query_model = user_models.UserQueryModel.get(self.QUERY_1_ID)
        self.assertEqual(query_model.submitter_id, self.USER_ID_1)
        self.assertEqual(
            query_model.inactive_in_last_n_days, inactive_in_last_n_days)
        self.assertEqual(
            query_model.has_not_logged_in_for_n_days,
            has_not_logged_in_for_n_days)
        self.assertEqual(
            query_model.created_at_least_n_exps, created_at_least_n_exps)
        self.assertEqual(
            query_model.created_fewer_than_n_exps, created_fewer_than_n_exps)
        self.assertEqual(
            query_model.edited_at_least_n_exps, edited_at_least_n_exps)
        self.assertEqual(
            query_model.edited_fewer_than_n_exps, edited_fewer_than_n_exps)
        self.assertEqual(query_model.created_collection, created_collection)
        self.assertEqual(
            query_model.used_logic_proof_interaction,
            used_logic_proof_interaction)

    def test_fetch_page(self):
        inactive_in_last_n_days = 5
        created_at_least_n_exps = 1
        created_fewer_than_n_exps = 3
        edited_at_least_n_exps = 2
        edited_fewer_than_n_exps = 5
        has_not_logged_in_for_n_days = 10
        created_collection = True
        used_logic_proof_interaction = True
        user_models.UserQueryModel(
            id=self.QUERY_1_ID,
            inactive_in_last_n_days=inactive_in_last_n_days,
            created_at_least_n_exps=created_at_least_n_exps,
            created_fewer_than_n_exps=created_fewer_than_n_exps,
            edited_at_least_n_exps=edited_at_least_n_exps,
            edited_fewer_than_n_exps=edited_fewer_than_n_exps,
            has_not_logged_in_for_n_days=has_not_logged_in_for_n_days,
            created_collection=created_collection,
            used_logic_proof_interaction=used_logic_proof_interaction,
            submitter_id=self.USER_ID_1).put()

        submitter_id = 'submitter_2'
        query_id = 'qid_2'
        inactive_in_last_n_days = 6
        created_at_least_n_exps = 7
        created_fewer_than_n_exps = 4
        edited_at_least_n_exps = 3
        edited_fewer_than_n_exps = 6
        has_not_logged_in_for_n_days = 11
        created_collection = False
        used_logic_proof_interaction = False
        user_models.UserQueryModel(
            id=query_id,
            inactive_in_last_n_days=inactive_in_last_n_days,
            created_at_least_n_exps=created_at_least_n_exps,
            created_fewer_than_n_exps=created_fewer_than_n_exps,
            edited_at_least_n_exps=edited_at_least_n_exps,
            edited_fewer_than_n_exps=edited_fewer_than_n_exps,
            has_not_logged_in_for_n_days=has_not_logged_in_for_n_days,
            created_collection=created_collection,
            used_logic_proof_interaction=used_logic_proof_interaction,
            submitter_id=submitter_id).put()

        # Fetch only one entity.
        query_models, _, _ = user_models.UserQueryModel.fetch_page(
            1, None)
        self.assertEqual(len(query_models), 1)

        self.assertEqual(query_models[0].submitter_id, 'submitter_2')
        self.assertEqual(query_models[0].id, 'qid_2')
        self.assertEqual(query_models[0].inactive_in_last_n_days, 6)
        self.assertEqual(query_models[0].created_at_least_n_exps, 7)
        self.assertEqual(query_models[0].created_fewer_than_n_exps, 4)
        self.assertEqual(query_models[0].edited_at_least_n_exps, 3)
        self.assertEqual(query_models[0].edited_fewer_than_n_exps, 6)
        self.assertEqual(query_models[0].has_not_logged_in_for_n_days, 11)
        self.assertFalse(query_models[0].created_collection)
        self.assertFalse(query_models[0].used_logic_proof_interaction)

        # Fetch both entities.
        query_models, _, _ = user_models.UserQueryModel.fetch_page(
            2, None)
        self.assertEqual(len(query_models), 2)

        self.assertEqual(query_models[0].submitter_id, 'submitter_2')
        self.assertEqual(query_models[0].id, 'qid_2')
        self.assertEqual(query_models[0].inactive_in_last_n_days, 6)
        self.assertEqual(query_models[0].created_at_least_n_exps, 7)
        self.assertEqual(query_models[0].created_fewer_than_n_exps, 4)
        self.assertEqual(query_models[0].edited_at_least_n_exps, 3)
        self.assertEqual(query_models[0].edited_fewer_than_n_exps, 6)
        self.assertEqual(query_models[0].has_not_logged_in_for_n_days, 11)
        self.assertFalse(query_models[0].created_collection)
        self.assertFalse(query_models[0].used_logic_proof_interaction)

        self.assertEqual(query_models[1].submitter_id, self.USER_ID_1)
        self.assertEqual(query_models[1].id, self.QUERY_1_ID)
        self.assertEqual(query_models[1].inactive_in_last_n_days, 5)
        self.assertEqual(query_models[1].created_at_least_n_exps, 1)
        self.assertEqual(query_models[1].created_fewer_than_n_exps, 3)
        self.assertEqual(query_models[1].edited_at_least_n_exps, 2)
        self.assertEqual(query_models[1].edited_fewer_than_n_exps, 5)
        self.assertEqual(query_models[1].has_not_logged_in_for_n_days, 10)
        self.assertTrue(query_models[1].created_collection)
        self.assertTrue(query_models[1].used_logic_proof_interaction)


class UserBulkEmailsModelTests(test_utils.GenericTestBase):
    """Tests for UserBulkEmailsModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserBulkEmailsModelTests, self).setUp()

        user_models.UserBulkEmailsModel(id=self.USER_ID_1).put()
        user_models.UserBulkEmailsModel(id=self.USER_ID_2, deleted=True).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.UserBulkEmailsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.UserBulkEmailsModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.UserBulkEmailsModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertFalse(
            user_models.UserBulkEmailsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )


class UserSkillMasteryModelTests(test_utils.GenericTestBase):
    """Tests for UserSkillMasteryModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_1_ID = 'user_1_id'
    USER_2_ID = 'user_2_id'
    SKILL_ID_1 = 'skill_id_1'
    SKILL_ID_2 = 'skill_id_2'
    DEGREE_OF_MASTERY = 0.5

    def setUp(self):
        super(UserSkillMasteryModelTests, self).setUp()
        user_models.UserSkillMasteryModel(
            id=user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_1_ID, self.SKILL_ID_1),
            user_id=self.USER_1_ID,
            skill_id=self.SKILL_ID_1,
            degree_of_mastery=self.DEGREE_OF_MASTERY
        ).put()
        user_models.UserSkillMasteryModel(
            id=user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_1_ID, self.SKILL_ID_2),
            user_id=self.USER_1_ID,
            skill_id=self.SKILL_ID_2,
            degree_of_mastery=self.DEGREE_OF_MASTERY
        ).put()
        user_models.UserSkillMasteryModel(
            id=user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_2_ID, self.SKILL_ID_2),
            user_id=self.USER_2_ID,
            skill_id=self.SKILL_ID_2,
            degree_of_mastery=self.DEGREE_OF_MASTERY,
            deleted=True
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.UserSkillMasteryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.UserSkillMasteryModel.apply_deletion_policy(self.USER_1_ID)
        self.assertIsNone(
            user_models.UserSkillMasteryModel.query(
                user_models.UserSkillMasteryModel.user_id == self.USER_1_ID
            ).get()
        )
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserSkillMasteryModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.UserSkillMasteryModel
            .has_reference_to_user_id(self.USER_1_ID)
        )
        self.assertTrue(
            user_models.UserSkillMasteryModel
            .has_reference_to_user_id(self.USER_2_ID)
        )
        self.assertFalse(
            user_models.UserSkillMasteryModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_construct_model_id(self):
        constructed_model_id = (
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_1_ID, self.SKILL_ID_1))

        self.assertEqual(constructed_model_id, 'user_1_id.skill_id_1')

    def test_get_success(self):
        constructed_model_id = (
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_1_ID, self.SKILL_ID_1))
        retrieved_object = user_models.UserSkillMasteryModel.get(
            constructed_model_id)

        self.assertEqual(retrieved_object.user_id, self.USER_1_ID)
        self.assertEqual(retrieved_object.skill_id, self.SKILL_ID_1)
        self.assertEqual(retrieved_object.degree_of_mastery, 0.5)

    def test_get_failure(self):
        retrieved_object = user_models.UserSkillMasteryModel.get(
            'unknown_model_id', strict=False)

        self.assertEqual(retrieved_object, None)

    def test_get_multi_success(self):
        skill_ids = [
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_1_ID, self.SKILL_ID_1),
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_1_ID, self.SKILL_ID_2)]
        retrieved_object = user_models.UserSkillMasteryModel.get_multi(
            skill_ids)

        self.assertEqual(retrieved_object[0].user_id, self.USER_1_ID)
        self.assertEqual(retrieved_object[0].skill_id, self.SKILL_ID_1)
        self.assertEqual(retrieved_object[0].degree_of_mastery, 0.5)
        self.assertEqual(retrieved_object[1].user_id, self.USER_1_ID)
        self.assertEqual(retrieved_object[1].skill_id, self.SKILL_ID_2)
        self.assertEqual(retrieved_object[1].degree_of_mastery, 0.5)

    def test_get_multi_failure(self):
        skill_ids = ['unknown_model_id_1', 'unknown_model_id_2']
        retrieved_object = user_models.UserSkillMasteryModel.get_multi(
            skill_ids)

        self.assertEqual(retrieved_object, [None, None])

    def test_export_data_trivial(self):
        user_data = user_models.UserSkillMasteryModel.export_data('fake_user')
        test_data = {}
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self):
        user_data = user_models.UserSkillMasteryModel.export_data(
            self.USER_1_ID)
        test_data = {
            self.SKILL_ID_1: {
                'degree_of_mastery': self.DEGREE_OF_MASTERY
            },
            self.SKILL_ID_2: {
                'degree_of_mastery': self.DEGREE_OF_MASTERY
            }
        }
        self.assertEqual(user_data, test_data)


class UserContributionProficiencyModelTests(test_utils.GenericTestBase):
    """Tests for UserContributionProficiencyModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_1_ID = 'user_1_id'
    USER_2_ID = 'user_2_id'
    USER_3_ID_OLD = 'user_3_id_old'
    USER_3_ID_NEW = 'user_3_id_new'
    SCORE_CATEGORY_1 = 'category_1'
    SCORE_CATEGORY_2 = 'category_2'

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(UserContributionProficiencyModelTests, self).setUp()

        user_models.UserContributionProficiencyModel(
            id='%s.%s' % (self.SCORE_CATEGORY_1, self.USER_1_ID),
            user_id=self.USER_1_ID,
            score_category=self.SCORE_CATEGORY_1,
            score=1.5,
            onboarding_email_sent=False
        ).put()
        user_models.UserContributionProficiencyModel(
            id='%s.%s' % (self.SCORE_CATEGORY_2, self.USER_1_ID),
            user_id=self.USER_1_ID,
            score_category=self.SCORE_CATEGORY_2,
            score=2,
            onboarding_email_sent=False
        ).put()
        user_models.UserContributionProficiencyModel(
            id='%s.%s' % (self.SCORE_CATEGORY_1, self.USER_2_ID),
            user_id=self.USER_2_ID,
            score_category=self.SCORE_CATEGORY_1,
            score=1.5,
            onboarding_email_sent=False,
            deleted=True
        ).put()

    def test_export_data_trivial(self):
        user_data = user_models.UserContributionProficiencyModel.export_data(
            'USER_WITHOUT_DATA')
        expected_data = {}
        self.assertEqual(user_data, expected_data)

    def test_export_data_nontrivial(self):
        user_data = user_models.UserContributionProficiencyModel.export_data(
            self.USER_1_ID)
        expected_data = {
            self.SCORE_CATEGORY_1: {
                'onboarding_email_sent': False,
                'score': 1.5
            },
            self.SCORE_CATEGORY_2: {
                'onboarding_email_sent': False,
                'score': 2
            }
        }
        self.assertEqual(user_data, expected_data)

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.UserContributionProficiencyModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self):
        user_models.UserContributionProficiencyModel.apply_deletion_policy(
            self.USER_1_ID)
        self.assertIsNone(
            user_models.UserContributionProficiencyModel.query(
                user_models.UserContributionProficiencyModel.user_id ==
                self.USER_1_ID
            ).get()
        )
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserContributionProficiencyModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.UserContributionProficiencyModel
            .has_reference_to_user_id(self.USER_1_ID)
        )
        self.assertTrue(
            user_models.UserContributionProficiencyModel
            .has_reference_to_user_id(self.USER_2_ID)
        )
        self.assertFalse(
            user_models.UserContributionProficiencyModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_create_model(self):
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category1', 1)
        score_models = (
            user_models.UserContributionProficiencyModel
            .get_all_scores_of_user('user1'))
        self.assertEqual(len(score_models), 1)
        self.assertEqual(score_models[0].id, 'category1.user1')
        self.assertEqual(score_models[0].user_id, 'user1')
        self.assertEqual(score_models[0].score_category, 'category1')
        self.assertEqual(score_models[0].score, 1)

    def test_create_entry_already_exists_failure(self):
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category1', 1)
        with self.assertRaisesRegexp(
            Exception, 'There is already a UserContributionProficiencyModel '
            'entry with the given id: category1.user1'):
            user_models.UserContributionProficiencyModel.create(
                'user1', 'category1', 2)

    def test_get_all_users_with_score_above_minimum_for_category(self):
        # User scoring models for category 1.
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category1', 1)
        user_models.UserContributionProficiencyModel.create(
            'user2', 'category1', 21)
        user_models.UserContributionProficiencyModel.create(
            'user3', 'category1', 11)
        user_models.UserContributionProficiencyModel.create(
            'user4', 'category1', 11)

        # User scoring models for category 2.
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category2', 11)
        user_models.UserContributionProficiencyModel.create(
            'user2', 'category2', 1)
        user_models.UserContributionProficiencyModel.create(
            'user3', 'category2', 1)
        user_models.UserContributionProficiencyModel.create(
            'user4', 'category2', 1)

        # Get the user score models that have a score high enough for review
        # for category 1.
        user_score_models = (
            user_models.UserContributionProficiencyModel
            .get_all_users_with_score_above_minimum_for_category('category1'))

        self.assertEqual(len(user_score_models), 3)
        self.assertIn(user_models.UserContributionProficiencyModel.get(
            'user2', 'category1'), user_score_models)
        self.assertIn(user_models.UserContributionProficiencyModel.get(
            'user3', 'category1'), user_score_models)
        self.assertIn(user_models.UserContributionProficiencyModel.get(
            'user4', 'category1'), user_score_models)

        # Get the user score models that have a score high enough for review
        # for category 2.
        user_score_models = (
            user_models.UserContributionProficiencyModel
            .get_all_users_with_score_above_minimum_for_category('category2'))

        self.assertEqual(len(user_score_models), 1)
        self.assertIn(user_models.UserContributionProficiencyModel.get(
            'user1', 'category2'), user_score_models)

    def test_get_all_users_with_score_above_minimum_for_category_invalid_input(
            self):
        user_score_models = (
            user_models.UserContributionProficiencyModel
            .get_all_users_with_score_above_minimum_for_category(
                'invalid_category'))

        self.assertEqual(user_score_models, [])

    def test_get_all_scores_of_user_with_multiple_scores(self):
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category1', 1)
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category2', 1)
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category3', 1)

        user_score_models = (
            user_models.UserContributionProficiencyModel
            .get_all_scores_of_user('user1'))

        self.assertEqual(len(user_score_models), 3)
        self.assertIn(user_models.UserContributionProficiencyModel.get(
            'user1', 'category1'), user_score_models)
        self.assertIn(user_models.UserContributionProficiencyModel.get(
            'user1', 'category2'), user_score_models)
        self.assertIn(user_models.UserContributionProficiencyModel.get(
            'user1', 'category3'), user_score_models)

    def test_get_all_scores_of_user_with_an_invalid_user_id_is_empty(self):
        user_score_models = (
            user_models.UserContributionProficiencyModel
            .get_all_scores_of_user('invalid_user_id'))

        self.assertEqual(user_score_models, [])

    def test_get_categories_where_user_can_review(self):
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category1', feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW
        )
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category3', feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW
        )
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category2', 0
        )

        score_categories = (
            user_models.UserContributionProficiencyModel
            .get_all_categories_where_user_can_review('user1'))

        self.assertIn('category1', score_categories)
        self.assertIn('category3', score_categories)
        self.assertNotIn('category2', score_categories)

    def test_get_categories_where_user_can_review_with_invalid_user_id(self):
        score_categories = (
            user_models.UserContributionProficiencyModel
            .get_all_categories_where_user_can_review('invalid_user_id'))

        self.assertEqual(score_categories, [])


class UserContributionRightsModelTests(test_utils.GenericTestBase):
    """Tests for UserContributionRightsModel."""

    USER_ID_1 = 'id_1'
    USER_ID_2 = 'id_2'
    NONEXISTENT_USER_ID = 'id_3'

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.UserContributionRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_has_reference_to_user_id(self):
        self.assertFalse(
            user_models.UserContributionRightsModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertFalse(
            user_models.UserContributionRightsModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertFalse(
            user_models.UserContributionRightsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

        user_models.UserContributionRightsModel(
            id=self.USER_ID_1,
            can_review_translation_for_language_codes=['hi', 'en'],
            can_review_voiceover_for_language_codes=[],
            can_review_questions=False).put()
        user_models.UserContributionRightsModel(
            id=self.USER_ID_2,
            can_review_translation_for_language_codes=['hi', 'en'],
            can_review_voiceover_for_language_codes=['hi'],
            can_review_questions=True).put()

        self.assertTrue(
            user_models.UserContributionRightsModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.UserContributionRightsModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertFalse(
            user_models.UserContributionRightsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_trivial(self):
        user_data = user_models.UserContributionRightsModel.export_data(
            self.USER_ID_1)
        expected_data = {}
        self.assertEqual(user_data, expected_data)

        user_models.UserContributionRightsModel(
            id=self.USER_ID_1,
            can_review_translation_for_language_codes=['hi', 'en'],
            can_review_voiceover_for_language_codes=['hi'],
            can_review_questions=True).put()

        user_data = user_models.UserContributionRightsModel.export_data(
            self.USER_ID_1)
        expected_data = {
            'can_review_translation_for_language_codes': ['hi', 'en'],
            'can_review_voiceover_for_language_codes': ['hi'],
            'can_review_questions': True,
            'can_submit_questions': False
        }
        self.assertEqual(user_data, expected_data)

    def test_get_translation_reviewer_user_ids(self):
        translation_reviewer_ids = (
            user_models.UserContributionRightsModel
            .get_translation_reviewer_user_ids('hi'))
        self.assertEqual(len(translation_reviewer_ids), 0)

        user_models.UserContributionRightsModel(
            id=self.USER_ID_1,
            can_review_translation_for_language_codes=['hi', 'en'],
            can_review_voiceover_for_language_codes=[],
            can_review_questions=False).put()
        user_models.UserContributionRightsModel(
            id=self.USER_ID_2,
            can_review_translation_for_language_codes=['hi', 'en'],
            can_review_voiceover_for_language_codes=['hi'],
            can_review_questions=True).put()

        translation_reviewer_ids = (
            user_models.UserContributionRightsModel
            .get_translation_reviewer_user_ids('hi'))
        self.assertEqual(len(translation_reviewer_ids), 2)
        self.assertTrue(self.USER_ID_1 in translation_reviewer_ids)
        self.assertTrue(self.USER_ID_2 in translation_reviewer_ids)

    def test_get_voiceover_reviewer_user_ids(self):
        voiceover_reviewer_ids = (
            user_models.UserContributionRightsModel
            .get_voiceover_reviewer_user_ids('hi'))
        self.assertEqual(len(voiceover_reviewer_ids), 0)

        user_models.UserContributionRightsModel(
            id=self.USER_ID_1,
            can_review_translation_for_language_codes=['hi', 'en'],
            can_review_voiceover_for_language_codes=[],
            can_review_questions=False).put()
        user_models.UserContributionRightsModel(
            id=self.USER_ID_2,
            can_review_translation_for_language_codes=['hi', 'en'],
            can_review_voiceover_for_language_codes=['hi'],
            can_review_questions=True).put()

        voiceover_reviewer_ids = (
            user_models.UserContributionRightsModel
            .get_voiceover_reviewer_user_ids('hi'))
        self.assertEqual(len(voiceover_reviewer_ids), 1)
        self.assertFalse(self.USER_ID_1 in voiceover_reviewer_ids)
        self.assertTrue(self.USER_ID_2 in voiceover_reviewer_ids)

    def test_get_question_reviewer_user_ids(self):
        question_reviewer_ids = (
            user_models.UserContributionRightsModel
            .get_question_reviewer_user_ids())
        self.assertEqual(len(question_reviewer_ids), 0)

        user_models.UserContributionRightsModel(
            id=self.USER_ID_1,
            can_review_translation_for_language_codes=['hi', 'en'],
            can_review_voiceover_for_language_codes=[],
            can_review_questions=False).put()
        user_models.UserContributionRightsModel(
            id=self.USER_ID_2,
            can_review_translation_for_language_codes=['hi', 'en'],
            can_review_voiceover_for_language_codes=['hi'],
            can_review_questions=True).put()

        question_reviewer_ids = (
            user_models.UserContributionRightsModel
            .get_question_reviewer_user_ids())
        self.assertEqual(len(question_reviewer_ids), 1)
        self.assertFalse(self.USER_ID_1 in question_reviewer_ids)
        self.assertTrue(self.USER_ID_2 in question_reviewer_ids)

    def test_get_question_submitter_user_ids(self):
        question_submitter_ids = (
            user_models.UserContributionRightsModel
            .get_question_submitter_user_ids())
        self.assertEqual(len(question_submitter_ids), 0)

        user_models.UserContributionRightsModel(
            id=self.USER_ID_1,
            can_review_translation_for_language_codes=['hi', 'en'],
            can_review_voiceover_for_language_codes=[],
            can_review_questions=False,
            can_submit_questions=False).put()
        user_models.UserContributionRightsModel(
            id=self.USER_ID_2,
            can_review_translation_for_language_codes=['hi', 'en'],
            can_review_voiceover_for_language_codes=['hi'],
            can_review_questions=True,
            can_submit_questions=True).put()

        question_submitter_ids = (
            user_models.UserContributionRightsModel
            .get_question_submitter_user_ids())
        self.assertEqual(len(question_submitter_ids), 1)
        self.assertFalse(self.USER_ID_1 in question_submitter_ids)
        self.assertTrue(self.USER_ID_2 in question_submitter_ids)


class PendingDeletionRequestModelTests(test_utils.GenericTestBase):
    """Tests for PendingDeletionRequestModel."""

    NONEXISTENT_USER_ID = 'id_x'
    USER_1_ID = 'user_1_id'
    USER_1_EMAIL = 'email@email.com'
    USER_1_ROLE = feconf.ROLE_ID_LEARNER

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(PendingDeletionRequestModelTests, self).setUp()

        user_models.PendingDeletionRequestModel(
            id=self.USER_1_ID,
            email=self.USER_1_EMAIL,
            role=self.USER_1_ROLE,
        ).put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.PendingDeletionRequestModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE_AT_END)

    def test_apply_deletion_policy_for_registered_user_deletes_them(self):
        user_models.PendingDeletionRequestModel.apply_deletion_policy(
            self.USER_1_ID)
        self.assertIsNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.USER_1_ID))

    def test_apply_deletion_policy_nonexistent_user_raises_no_exception(self):
        self.assertIsNone(
            user_models.PendingDeletionRequestModel.get_by_id(
                self.NONEXISTENT_USER_ID))
        user_models.PendingDeletionRequestModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            user_models.PendingDeletionRequestModel
            .has_reference_to_user_id(self.USER_1_ID)
        )
        self.assertFalse(
            user_models.PendingDeletionRequestModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )


class DeletedUserModelTests(test_utils.GenericTestBase):
    """Tests for DeletedUserModel."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.DeletedUserModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP)


class PseudonymizedUserModelTests(test_utils.GenericTestBase):
    """Tests for PseudonymizedUserModel."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.PendingDeletionRequestModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE_AT_END)

    def test_create_raises_error_when_many_id_collisions_occur(self):
        # Swap dependent method get_by_id to simulate collision every time.
        get_by_id_swap = self.swap(
            user_models.PseudonymizedUserModel, 'get_by_id', types.MethodType(
                lambda _, __: True, user_models.PseudonymizedUserModel))

        assert_raises_regexp_context_manager = self.assertRaisesRegexp(
            Exception, 'New id generator is producing too many collisions.')

        with assert_raises_regexp_context_manager, get_by_id_swap:
            user_models.PseudonymizedUserModel.get_new_id('exploration')


class DeletedUsernameModelTests(test_utils.GenericTestBase):
    """Tests for DeletedUsernameModel."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            user_models.DeletedUsernameModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)
