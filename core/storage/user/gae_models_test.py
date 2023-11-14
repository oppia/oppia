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

from __future__ import annotations

import datetime
import types

from core import feconf
from core import utils
from core.domain import exp_domain
from core.domain import exp_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List, Set, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import user_models

(base_models, user_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.USER
])


class UserSettingsModelTest(test_utils.GenericTestBase):
    """Tests for UserSettingsModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_1_ID: Final = 'user_id'
    USER_1_EMAIL: Final = 'user@example.com'
    USER_1_ROLE: Final = feconf.ROLE_ID_CURRICULUM_ADMIN
    USER_2_ID: Final = 'user2_id'
    USER_2_EMAIL: Final = 'user2@example.com'
    USER_3_ID: Final = 'user3_id'
    USER_3_EMAIL: Final = 'user3@example.com'
    USER_3_ROLE: Final = feconf.ROLE_ID_CURRICULUM_ADMIN
    GENERIC_PIN: Final = '12345'
    PROFILE_1_ID: Final = 'profile_id'
    PROFILE_1_EMAIL: Final = 'user@example.com'
    PROFILE_1_ROLE: Final = feconf.ROLE_ID_MOBILE_LEARNER
    GENERIC_USERNAME: Final = 'user'
    GENERIC_DATE: Final = datetime.datetime(2019, 5, 20)
    GENERIC_EPOCH: Final = utils.get_time_in_millisecs(
        datetime.datetime(2019, 5, 20)
    )
    GENERIC_IMAGE_URL: Final = 'www.example.com/example.png'
    GENERIC_USER_BIO: Final = 'I am a user of Oppia!'
    GENERIC_SUBJECT_INTERESTS: Final = ['Math', 'Science']
    GENERIC_LANGUAGE_CODES: Final = ['en', 'es']
    GENERIC_DISPLAY_ALIAS: Final = 'display_alias'

    def setUp(self) -> None:
        super().setUp()
        user_models.UserSettingsModel(
            id=self.USER_1_ID,
            email=self.USER_1_EMAIL,
            roles=[self.USER_1_ROLE],
            banned=False
        ).put()
        user_models.UserSettingsModel(
            id=self.PROFILE_1_ID,
            email=self.PROFILE_1_EMAIL,
            roles=[self.PROFILE_1_ROLE],
            banned=False
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_2_ID,
            email=self.USER_2_EMAIL,
            roles=[],
            banned=True,
            deleted=True
        ).put()
        user_models.UserSettingsModel(
            id=self.USER_3_ID,
            email=self.USER_3_EMAIL,
            roles=[self.USER_3_ROLE],
            banned=False,
            username=self.GENERIC_USERNAME,
            normalized_username=self.GENERIC_USERNAME,
            last_agreed_to_terms=self.GENERIC_DATE,
            last_started_state_editor_tutorial=self.GENERIC_DATE,
            last_started_state_translation_tutorial=self.GENERIC_DATE,
            last_logged_in=self.GENERIC_DATE,
            last_created_an_exploration=self.GENERIC_DATE,
            last_edited_an_exploration=self.GENERIC_DATE,
            default_dashboard='learner',
            creator_dashboard_display_pref='card',
            user_bio=self.GENERIC_USER_BIO,
            subject_interests=self.GENERIC_SUBJECT_INTERESTS,
            first_contribution_msec=1,
            preferred_language_codes=self.GENERIC_LANGUAGE_CODES,
            preferred_site_language_code=self.GENERIC_LANGUAGE_CODES[0],
            preferred_audio_language_code=self.GENERIC_LANGUAGE_CODES[0],
            preferred_translation_language_code=self.GENERIC_LANGUAGE_CODES[0],
            display_alias=self.GENERIC_DISPLAY_ALIAS,
            pin=self.GENERIC_PIN
        ).put()

    def test_get_deletion_policy_is_delete(self) -> None:
        self.assertEqual(
            user_models.UserSettingsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE_AT_END)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserSettingsModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER)

    def test_get_field_names_for_takeout(self) -> None:
        expected_results = {
            'last_agreed_to_terms': 'last_agreed_to_terms_msec',
            'last_started_state_editor_tutorial':
            'last_started_state_editor_tutorial_msec',
            'last_started_state_translation_tutorial':
            'last_started_state_translation_tutorial_msec',
            'last_logged_in': 'last_logged_in_msec',
            'last_edited_an_exploration': 'last_edited_an_exploration_msec',
            'last_created_an_exploration': 'last_created_an_exploration_msec'
        }
        self.assertEqual(
            user_models.UserSettingsModel.get_field_names_for_takeout(),
            expected_results)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserSettingsModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'email': base_models.EXPORT_POLICY.EXPORTED,
                'last_agreed_to_terms': base_models.EXPORT_POLICY.EXPORTED,
                'roles': base_models.EXPORT_POLICY.EXPORTED,
                'banned': base_models.EXPORT_POLICY.EXPORTED,
                'last_logged_in': base_models.EXPORT_POLICY.EXPORTED,
                'display_alias': base_models.EXPORT_POLICY.EXPORTED,
                'user_bio': base_models.EXPORT_POLICY.EXPORTED,
                'subject_interests': base_models.EXPORT_POLICY.EXPORTED,
                'preferred_language_codes':
                    base_models.EXPORT_POLICY.EXPORTED,
                'preferred_site_language_code':
                    base_models.EXPORT_POLICY.EXPORTED,
                'preferred_audio_language_code':
                    base_models.EXPORT_POLICY.EXPORTED,
                'preferred_translation_language_code':
                    base_models.EXPORT_POLICY.EXPORTED,
                'username': base_models.EXPORT_POLICY.EXPORTED,
                'normalized_username': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_started_state_editor_tutorial':
                    base_models.EXPORT_POLICY.EXPORTED,
                'last_started_state_translation_tutorial':
                    base_models.EXPORT_POLICY.EXPORTED,
                'last_edited_an_exploration':
                    base_models.EXPORT_POLICY.EXPORTED,
                'last_created_an_exploration':
                    base_models.EXPORT_POLICY.EXPORTED,
                'default_dashboard': base_models.EXPORT_POLICY.EXPORTED,
                'creator_dashboard_display_pref':
                    base_models.EXPORT_POLICY.EXPORTED,
                'first_contribution_msec':
                    base_models.EXPORT_POLICY.EXPORTED,
                'pin': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'role': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'has_viewed_lesson_info_modal_once':
                    base_models.EXPORT_POLICY.EXPORTED
            }
        )

    def test_apply_deletion_policy_for_registered_users_deletes_them(
        self
    ) -> None:
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

    def test_apply_deletion_policy_for_banned_user_deletes_them(self) -> None:
        self.assertIsNotNone(
            user_models.UserSettingsModel.get_by_id(self.USER_2_ID))
        user_models.UserSettingsModel.apply_deletion_policy(self.USER_2_ID)
        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.USER_2_ID))

    def test_apply_deletion_policy_nonexistent_user_raises_no_exception(
        self
    ) -> None:
        self.assertIsNone(
            user_models.UserSettingsModel.get_by_id(self.NONEXISTENT_USER_ID))
        user_models.UserSettingsModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_registered_user_id_is_true(self) -> None:
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

    def test_has_reference_to_non_existing_user_id_is_false(self) -> None:
        self.assertFalse(
            user_models.UserSettingsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_get_by_normalized_username_valid_username(self) -> None:
        actual_user = user_models.UserSettingsModel.get_by_id(self.USER_3_ID)
        self.assertEqual(
            user_models.UserSettingsModel.get_by_normalized_username(
                self.GENERIC_USERNAME), actual_user)

    def test_get_normalized_username_invalid_username(self) -> None:
        invalid_username = 'user_x'
        self.assertIsNone(
            user_models.UserSettingsModel.get_by_normalized_username(
                invalid_username))

    def test_get_by_email_valid_user(self) -> None:
        actual_user = user_models.UserSettingsModel.get_by_id(self.USER_3_ID)
        self.assertEqual(
            user_models.UserSettingsModel
                .get_by_email(self.USER_3_EMAIL), actual_user)

    def test_get_by_email_invalid_user(self) -> None:
        self.assertIsNone(
            user_models.UserSettingsModel.get_by_email(
                'invalid_user@example.com'))

    def test_get_by_role_for_admin_returns_admin_users(self) -> None:
        actual_users = [
            user_models.UserSettingsModel.get_by_id(self.USER_1_ID),
            user_models.UserSettingsModel.get_by_id(self.USER_3_ID)
        ]
        self.assertItemsEqual(
            user_models.UserSettingsModel.get_by_role(
                feconf.ROLE_ID_CURRICULUM_ADMIN), actual_users)

    def test_export_data_for_nonexistent_user_raises_exception(self) -> None:
        with self.assertRaisesRegex(
            user_models.UserSettingsModel.EntityNotFoundError,
            'Entity for class UserSettingsModel with id fake_user not found'):
            user_models.UserSettingsModel.export_data('fake_user')

    def test_export_data_for_trivial_case_returns_data_correctly(self) -> None:
        user_model = user_models.UserSettingsModel.get_by_id(self.USER_1_ID)
        user_data = user_model.export_data(user_model.id)
        expected_user_data = {
            'email': 'user@example.com',
            'roles': [feconf.ROLE_ID_CURRICULUM_ADMIN],
            'banned': False,
            'username': None,
            'normalized_username': None,
            'last_agreed_to_terms_msec': None,
            'last_started_state_editor_tutorial_msec': None,
            'last_started_state_translation_tutorial_msec': None,
            'last_logged_in_msec': None,
            'last_edited_an_exploration_msec': None,
            'last_created_an_exploration_msec': None,
            'default_dashboard': 'learner',
            'creator_dashboard_display_pref': 'card',
            'user_bio': None,
            'subject_interests': [],
            'first_contribution_msec': None,
            'preferred_language_codes': [],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'preferred_translation_language_code': None,
            'display_alias': None,
            'has_viewed_lesson_info_modal_once': False
        }
        self.assertEqual(expected_user_data, user_data)

    def test_export_data_for_nontrivial_case_returns_data_correctly(
        self
    ) -> None:
        user_model = user_models.UserSettingsModel.get_by_id(self.USER_3_ID)
        user_data = user_model.export_data(user_model.id)
        expected_user_data = {
            'email': self.USER_3_EMAIL,
            'roles': [feconf.ROLE_ID_CURRICULUM_ADMIN],
            'banned': False,
            'username': self.GENERIC_USERNAME,
            'normalized_username': self.GENERIC_USERNAME,
            'last_agreed_to_terms_msec': self.GENERIC_EPOCH,
            'last_started_state_editor_tutorial_msec': self.GENERIC_EPOCH,
            'last_started_state_translation_tutorial_msec': self.GENERIC_EPOCH,
            'last_logged_in_msec': self.GENERIC_EPOCH,
            'last_edited_an_exploration_msec': self.GENERIC_EPOCH,
            'last_created_an_exploration_msec': self.GENERIC_EPOCH,
            'default_dashboard': 'learner',
            'creator_dashboard_display_pref': 'card',
            'user_bio': self.GENERIC_USER_BIO,
            'subject_interests': self.GENERIC_SUBJECT_INTERESTS,
            'first_contribution_msec': 1.0,
            'preferred_language_codes': self.GENERIC_LANGUAGE_CODES,
            'preferred_site_language_code': self.GENERIC_LANGUAGE_CODES[0],
            'preferred_audio_language_code': self.GENERIC_LANGUAGE_CODES[0],
            'preferred_translation_language_code': (
                self.GENERIC_LANGUAGE_CODES[0]),
            'display_alias': self.GENERIC_DISPLAY_ALIAS,
            'has_viewed_lesson_info_modal_once': False
        }
        self.assertEqual(expected_user_data, user_data)

    def test_get_new_id_under_normal_behaviour_returns_unique_ids(self) -> None:
        ids: Set[str] = set()
        for _ in range(100):
            new_id = user_models.UserSettingsModel.get_new_id('')
            self.assertNotIn(new_id, ids)
            user_models.UserSettingsModel(
                id=new_id, email='some@email.com').put()
            ids.add(new_id)

    def test_get_new_id_with_deleted_user_model(self) -> None:
        # Swap dependent method get_by_id to simulate collision every time.
        get_by_id_swap = self.swap(
            user_models.DeletedUserModel, 'get_by_id', types.MethodType(
                lambda _, __: True, user_models.DeletedUserModel))

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'New id generator is producing too many collisions.')

        with assert_raises_regexp_context_manager, get_by_id_swap:
            user_models.UserSettingsModel.get_new_id('exploration')

    def test_get_new_id_for_too_many_collisions_raises_error(self) -> None:
        # Swap dependent method get_by_id to simulate collision every time.
        get_by_id_swap = self.swap(
            user_models.UserSettingsModel, 'get_by_id', types.MethodType(
                lambda _, __: True, user_models.UserSettingsModel))

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'New id generator is producing too many collisions.')

        with assert_raises_regexp_context_manager, get_by_id_swap:
            user_models.UserSettingsModel.get_new_id('exploration')


class CompletedActivitiesModelTests(test_utils.GenericTestBase):
    """Tests for the CompletedActivitiesModel."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_1_ID: Final = 'id_1'
    USER_2_ID: Final = 'id_2'
    EXPLORATION_IDS_1: Final = ['exp_1', 'exp_2', 'exp_3']
    COLLECTION_IDS_1: Final = ['col_1', 'col_2', 'col_3']
    STORY_IDS_1: Final = ['story_1', 'story_2', 'story_3']
    TOPIC_IDS_1: Final = ['topic_1', 'topic_2', 'topic_3']

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

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

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.CompletedActivitiesModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.CompletedActivitiesModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.CompletedActivitiesModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'exploration_ids': base_models.EXPORT_POLICY.EXPORTED,
                'collection_ids': base_models.EXPORT_POLICY.EXPORTED,
                'story_ids': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'learnt_topic_ids': base_models.EXPORT_POLICY.EXPORTED,
                'mastered_topic_ids': base_models.EXPORT_POLICY.EXPORTED
            }
        )

    def test_apply_deletion_policy(self) -> None:
        user_models.CompletedActivitiesModel.apply_deletion_policy(
            self.USER_1_ID)
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.USER_1_ID))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.CompletedActivitiesModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_export_data_on_nonexistent_user(self) -> None:
        """Test if export_data returns None when user is not in datastore."""
        user_data = user_models.CompletedActivitiesModel.export_data(
            self.NONEXISTENT_USER_ID)
        self.assertEqual({}, user_data)

    def test_export_data_on_existent_user(self) -> None:
        """Test if export_data works as intended on a user in datastore."""
        user_data = (
            user_models.CompletedActivitiesModel.export_data(self.USER_1_ID))
        expected_data = {
            'exploration_ids': self.EXPLORATION_IDS_1,
            'collection_ids': self.COLLECTION_IDS_1,
            'story_ids': self.STORY_IDS_1,
            'learnt_topic_ids': self.TOPIC_IDS_1,
            'mastered_topic_ids': []
        }
        self.assertEqual(expected_data, user_data)


class IncompleteActivitiesModelTests(test_utils.GenericTestBase):
    """Tests for the IncompleteActivitiesModel."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_1_ID: Final = 'id_1'
    USER_2_ID: Final = 'id_2'
    EXPLORATION_IDS_1: Final = ['exp_1', 'exp_2', 'exp_3']
    COLLECTION_IDS_1: Final = ['col_1', 'col_2', 'col_3']
    STORY_IDS_1: Final = ['story_1', 'story_2', 'story_3']
    TOPIC_IDS_1: Final = ['topic_1', 'topic_2', 'topic_3']

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

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

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.IncompleteActivitiesModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.IncompleteActivitiesModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.IncompleteActivitiesModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'exploration_ids': base_models.EXPORT_POLICY.EXPORTED,
                'collection_ids': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'story_ids': base_models.EXPORT_POLICY.EXPORTED,
                'partially_learnt_topic_ids':
                    base_models.EXPORT_POLICY.EXPORTED,
                'partially_mastered_topic_ids': (
                    base_models.EXPORT_POLICY.EXPORTED)
            }
        )

    def test_apply_deletion_policy(self) -> None:
        user_models.IncompleteActivitiesModel.apply_deletion_policy(
            self.USER_1_ID)
        self.assertIsNone(
            user_models.IncompleteActivitiesModel.get_by_id(self.USER_1_ID))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.IncompleteActivitiesModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_export_data_on_nonexistent_user(self) -> None:
        """Test if export_data returns None when user is not in datastore."""
        user_data = user_models.IncompleteActivitiesModel.export_data(
            self.NONEXISTENT_USER_ID)
        self.assertEqual({}, user_data)

    def test_export_data_on_existent_user(self) -> None:
        """Test if export_data works as intended on a user in datastore."""
        user_data = (
            user_models.IncompleteActivitiesModel.export_data(self.USER_1_ID))
        expected_data = {
            'exploration_ids': self.EXPLORATION_IDS_1,
            'collection_ids': self.COLLECTION_IDS_1,
            'story_ids': self.STORY_IDS_1,
            'partially_learnt_topic_ids': self.TOPIC_IDS_1,
            'partially_mastered_topic_ids': []
        }
        self.assertEqual(expected_data, user_data)


class LearnerGoalsModelTests(test_utils.GenericTestBase):
    """Tests for the LearnerGoalsModel."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_1_ID: Final = 'id_1'
    USER_2_ID: Final = 'id_2'
    TOPIC_IDS: Final = ['topic_1', 'topic_2', 'topic_3']

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

        user_models.LearnerGoalsModel(
            id=self.USER_1_ID,
            topic_ids_to_learn=self.TOPIC_IDS,
            topic_ids_to_master=[]
        ).put()
        user_models.LearnerGoalsModel(
            id=self.USER_2_ID,
            topic_ids_to_learn=self.TOPIC_IDS,
            topic_ids_to_master=[],
            deleted=True
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.LearnerGoalsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.LearnerGoalsModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.LearnerGoalsModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'topic_ids_to_learn': base_models.EXPORT_POLICY.EXPORTED,
                'topic_ids_to_master': base_models.EXPORT_POLICY.EXPORTED,
            }
        )

    def test_apply_deletion_policy(self) -> None:
        user_models.LearnerGoalsModel.apply_deletion_policy(
            self.USER_1_ID)
        self.assertIsNone(
            user_models.LearnerGoalsModel.get_by_id(self.USER_1_ID))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.LearnerGoalsModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            user_models.LearnerGoalsModel
            .has_reference_to_user_id(self.USER_1_ID)
        )
        self.assertTrue(
            user_models.LearnerGoalsModel
            .has_reference_to_user_id(self.USER_2_ID)
        )
        self.assertFalse(
            user_models.LearnerGoalsModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_on_nonexistent_user(self) -> None:
        """Test if export_data returns None when user is not in datastore."""
        user_data = user_models.LearnerGoalsModel.export_data(
            self.NONEXISTENT_USER_ID)
        self.assertEqual({}, user_data)

    def test_export_data_on_existent_user(self) -> None:
        """Test if export_data works as intended on a user in datastore."""
        user_data = (
            user_models.LearnerGoalsModel.export_data(self.USER_1_ID))
        expected_data = {
            'topic_ids_to_learn': self.TOPIC_IDS,
            'topic_ids_to_master': []
        }
        self.assertEqual(expected_data, user_data)


class ExpUserLastPlaythroughModelTest(test_utils.GenericTestBase):
    """Tests for ExpUserLastPlaythroughModel class."""

    NONEXISTENT_USER_ID: Final = 'user_id_0'
    USER_ID_1: Final = 'user_id_1'
    USER_ID_2: Final = 'user_id_2'
    USER_ID_3: Final = 'user_id_3'
    EXP_ID_0: Final = 'exp_id_0'
    EXP_ID_1: Final = 'exp_id_1'
    STATE_NAME_1: Final = 'state_name_1'
    STATE_NAME_2: Final = 'state_name_2'
    EXP_VERSION: Final = 1

    def setUp(self) -> None:
        super().setUp()

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

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.ExpUserLastPlaythroughModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.ExpUserLastPlaythroughModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.ExpUserLastPlaythroughModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'exploration_id':
                    base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_played_exp_version':
                    base_models.EXPORT_POLICY.EXPORTED,
                'last_played_state_name': base_models.EXPORT_POLICY.EXPORTED
            }
        )

    def test_apply_deletion_policy(self) -> None:
        user_models.ExpUserLastPlaythroughModel.apply_deletion_policy(
            self.USER_ID_1)
        self.assertIsNone(
            user_models.ExpUserLastPlaythroughModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.ExpUserLastPlaythroughModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_create_success(self) -> None:
        user_models.ExpUserLastPlaythroughModel.create(
            self.USER_ID_1, self.EXP_ID_1).put()
        retrieved_object = user_models.ExpUserLastPlaythroughModel.get_by_id(
            '%s.%s' % (self.USER_ID_1, self.EXP_ID_1))

        self.assertEqual(retrieved_object.user_id, self.USER_ID_1)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_1)

    def test_get_success(self) -> None:
        retrieved_object = user_models.ExpUserLastPlaythroughModel.get(
            self.USER_ID_1, self.EXP_ID_0)

        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_object is not None
        self.assertEqual(retrieved_object.user_id, self.USER_ID_1)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_0)
        self.assertEqual(
            retrieved_object.last_played_exp_version, self.EXP_VERSION)
        self.assertEqual(
            retrieved_object.last_played_state_name, self.STATE_NAME_1)

    def test_get_failure(self) -> None:
        retrieved_object = user_models.ExpUserLastPlaythroughModel.get(
            self.USER_ID_1, 'unknown_exp_id')
        self.assertEqual(retrieved_object, None)

    def test_export_data_none(self) -> None:
        """Test export data on a user with no explorations."""
        user_data = user_models.ExpUserLastPlaythroughModel.export_data(
            self.NONEXISTENT_USER_ID)
        expected_data: Dict[str, Dict[str, str]] = {}
        self.assertEqual(expected_data, user_data)

    def test_export_data_single(self) -> None:
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

    def test_export_data_multi(self) -> None:
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

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    EXPLORATION_IDS_1: Final = ['exp_1', 'exp_2', 'exp_3']
    COLLECTION_IDS_1: Final = ['col_1', 'col_2', 'col_3']

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

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

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.LearnerPlaylistModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.LearnerPlaylistModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER)

    def test_export_policy(self) -> None:
        self.assertEqual(
            user_models.LearnerPlaylistModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'exploration_ids': base_models.EXPORT_POLICY.EXPORTED,
                'collection_ids': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            }
        )

    def test_apply_deletion_policy(self) -> None:
        user_models.LearnerPlaylistModel.apply_deletion_policy(self.USER_ID_1)
        self.assertIsNone(
            user_models.LearnerPlaylistModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.LearnerPlaylistModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_export_data_on_nonexistent_user(self) -> None:
        """Test if export_data returns None when user is not in datastore."""
        user_data = user_models.LearnerPlaylistModel.export_data(
            self.NONEXISTENT_USER_ID)
        self.assertEqual({}, user_data)

    def test_export_data_on_existent_user(self) -> None:
        """Test if export_data works as intended on a user in datastore."""
        user_data = user_models.LearnerPlaylistModel.export_data(self.USER_ID_1)
        expected_data = {
            'exploration_ids': self.EXPLORATION_IDS_1,
            'collection_ids': self.COLLECTION_IDS_1
        }
        self.assertEqual(expected_data, user_data)


class UserContributionsModelTests(test_utils.GenericTestBase):
    """Tests for the UserContributionsModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_C_ID: Final = 'id_c'
    USER_A_EMAIL: Final = 'a@example.com'
    USER_B_EMAIL: Final = 'b@example.com'
    USER_A_USERNAME: Final = 'a'
    USER_B_USERNAME: Final = 'b'
    EXP_ID_1: Final = 'exp_1'
    EXP_ID_2: Final = 'exp_2'

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()
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
            self.user_a_id, self.EXP_ID_1, [exp_domain.ExplorationChange(
                {
                    'cmd': 'edit_exploration_property',
                    'property_name': 'objective',
                    'new_value': 'the objective'
                })], 'Test edit')

        self.save_new_valid_exploration(
            self.EXP_ID_2, self.user_b_id, end_state_name='End')

        exp_services.update_exploration(
            self.user_a_id, self.EXP_ID_2, [exp_domain.ExplorationChange(
                {
                    'cmd': 'edit_exploration_property',
                    'property_name': 'objective',
                    'new_value': 'the objective'
                })], 'Test edit')

        user_models.UserContributionsModel(
            id=self.USER_C_ID,
            deleted=True
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.UserContributionsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserContributionsModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserContributionsModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_exploration_ids': base_models.EXPORT_POLICY.EXPORTED,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'edited_exploration_ids': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_apply_deletion_policy(self) -> None:
        user_models.UserContributionsModel.apply_deletion_policy(self.user_a_id)
        self.assertIsNone(
            user_models.UserContributionsModel.get_by_id(self.user_a_id))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserContributionsModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_export_data_on_nonexistent_user(self) -> None:
        """Test if export_data returns None when user is not in datastore."""
        user_data = user_models.UserContributionsModel.export_data(
            self.NONEXISTENT_USER_ID)
        self.assertEqual({}, user_data)

    def test_export_data_on_partially_involved_user(self) -> None:
        """Test export_data on user with no creations and two edits."""
        user_data = user_models.UserContributionsModel.export_data(
            self.user_a_id)
        expected_data = {
            'created_exploration_ids': [],
            'edited_exploration_ids': [self.EXP_ID_1, self.EXP_ID_2]
        }
        self.assertEqual(expected_data, user_data)

    def test_export_data_on_highly_involved_user(self) -> None:
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

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    USER_ID_3: Final = 'id_3'

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

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

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.UserEmailPreferencesModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserEmailPreferencesModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER)

    def test_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserEmailPreferencesModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'site_updates': base_models.EXPORT_POLICY.EXPORTED,
                'editor_role_notifications': base_models.EXPORT_POLICY.EXPORTED,
                'feedback_message_notifications':
                 base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'subscription_notifications': base_models.EXPORT_POLICY.EXPORTED
            }
        )

    def test_apply_deletion_policy(self) -> None:
        user_models.UserEmailPreferencesModel.apply_deletion_policy(
            self.USER_ID_1)
        self.assertIsNone(
            user_models.UserEmailPreferencesModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserEmailPreferencesModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_export_data_trivial(self) -> None:
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

    def test_export_data_nontrivial(self) -> None:
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

    def test_export_data_empty(self) -> None:
        user_data = user_models.UserEmailPreferencesModel.export_data(
            'fake_user_id')
        self.assertFalse(user_data)


class UserSubscriptionsModelTests(test_utils.GenericTestBase):
    """Tests for UserSubscriptionsModel."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID_1: Final = 'user_id_1'
    USER_ID_2: Final = 'user_id_2'
    USER_ID_3: Final = 'user_id_3'
    USER_ID_4: Final = 'user_id_4'
    USER_ID_5: Final = 'user_id_5'
    USER_ID_6: Final = 'user_id_6'
    CREATOR_IDS: Final = [USER_ID_5, USER_ID_6]
    CREATOR_USERNAMES: Final = ['usernameuser_id_5', 'usernameuser_id_6']
    COLLECTION_IDS: Final = ['23', '42', '4']
    EXPLORATION_IDS: Final = ['exp_1', 'exp_2', 'exp_3']
    GENERAL_FEEDBACK_THREAD_IDS: Final = ['42', '4', '8']
    GENERIC_DATETIME: Final = datetime.datetime(2020, 6, 2)

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()
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
            user_models.UserSubscriptionsModel(id=creator_id).put()

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

    def test_exclude_non_existing_creator_user_model_while_exporting_data(
        self
    ) -> None:
        user_models.UserSettingsModel(
            id='test_user',
            email='some@email.com'
        ).put()
        test_creator_ids = self.CREATOR_IDS + ['Invalid_id']

        user_models.UserSubscriptionsModel(
            id='test_user',
            creator_ids=test_creator_ids,
            collection_ids=self.COLLECTION_IDS,
            exploration_ids=self.EXPLORATION_IDS,
            general_feedback_thread_ids=self.GENERAL_FEEDBACK_THREAD_IDS,
            last_checked=self.GENERIC_DATETIME
        ).put()

        exported_data = user_models.UserSubscriptionsModel.export_data(
            'test_user'
        )

        # Here we are deleting 'last_checked_msec', because this key contains
        # the time stamp which can be different at the time of creation of model
        # and checking the output.
        del exported_data['last_checked_msec']
        expected_dict = {
            'exploration_ids': ['exp_1', 'exp_2', 'exp_3'],
            'collection_ids': ['23', '42', '4'],
            'general_feedback_thread_ids': ['42', '4', '8'],
            'creator_usernames': ['usernameuser_id_5', 'usernameuser_id_6']
        }
        self.assertEqual(expected_dict, exported_data)

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.UserSubscriptionsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserSubscriptionsModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER
        )

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserSubscriptionsModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'exploration_ids': base_models.EXPORT_POLICY.EXPORTED,
                'collection_ids': base_models.EXPORT_POLICY.EXPORTED,
                'general_feedback_thread_ids':
                 base_models.EXPORT_POLICY.EXPORTED,
                'creator_ids': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_checked': base_models.EXPORT_POLICY.EXPORTED
            }
        )

    def test_get_field_names_for_takeout(self) -> None:
        self.assertEqual(
            user_models.UserSubscriptionsModel.get_field_names_for_takeout(), {
                'creator_ids': 'creator_usernames',
                'last_checked': 'last_checked_msec'
            }
        )

    def test_apply_deletion_policy_deletes_model_for_user(self) -> None:
        user_models.UserSubscriptionsModel.apply_deletion_policy(self.USER_ID_1)
        self.assertIsNone(
            user_models.UserSubscriptionsModel.get_by_id(self.USER_ID_1))

    def test_apply_deletion_policy_deletes_user_from_creator_ids(self) -> None:
        user_models.UserSubscriptionsModel.apply_deletion_policy(self.USER_ID_5)
        user_subscriptions_model = (
            user_models.UserSubscriptionsModel.get_by_id(self.USER_ID_2))
        self.assertNotIn(self.USER_ID_5, user_subscriptions_model.creator_ids)

    def test_apply_deletion_policy_for_non_existing_user_passes(self) -> None:
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserSubscriptionsModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_export_data_trivial(self) -> None:
        """Test if empty user data is properly exported."""
        user_data = (
            user_models.UserSubscriptionsModel.export_data(self.USER_ID_1))
        test_data: Dict[str, Union[List[str], None]] = {
            'creator_usernames': [],
            'collection_ids': [],
            'exploration_ids': [],
            'general_feedback_thread_ids': [],
            'last_checked_msec': None
        }
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self) -> None:
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

    def test_export_data_on_nonexistent_user(self) -> None:
        """Test if exception is raised on nonexistent UserSubscriptionsModel."""
        user_data = user_models.UserSubscriptionsModel.export_data(
            self.USER_ID_3)
        self.assertEqual({}, user_data)


class UserSubscribersModelTests(test_utils.GenericTestBase):
    """Tests for UserSubscribersModel."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    USER_ID_3: Final = 'id_3'

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

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
        user_models.UserSubscribersModel(id=self.USER_ID_3).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.UserSubscribersModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy_deletes_model_for_user(self) -> None:
        user_models.UserSubscribersModel.apply_deletion_policy(self.USER_ID_1)
        self.assertIsNone(
            user_models.UserSubscribersModel.get_by_id(self.USER_ID_1))

    def test_apply_deletion_policy_deletes_user_from_creator_ids(self) -> None:
        user_models.UserSubscribersModel.apply_deletion_policy(self.USER_ID_3)
        user_subscribers_model = (
            user_models.UserSubscribersModel.get_by_id(self.USER_ID_1))
        self.assertNotIn(self.USER_ID_3, user_subscribers_model.subscriber_ids)

    def test_apply_deletion_policy_for_non_existing_user_passes(self) -> None:
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserSubscribersModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserSubscribersModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserSubscribersModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'subscriber_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )


class UserRecentChangesBatchModelTests(test_utils.GenericTestBase):
    """Tests for the UserRecentChangesBatchModel."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

        user_models.UserRecentChangesBatchModel(id=self.USER_ID_1).put()
        user_models.UserRecentChangesBatchModel(
            id=self.USER_ID_2,
            deleted=True
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.UserRecentChangesBatchModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self) -> None:
        user_models.UserRecentChangesBatchModel.apply_deletion_policy(
            self.USER_ID_1)
        self.assertIsNone(
            user_models.UserRecentChangesBatchModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserRecentChangesBatchModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserRecentChangesBatchModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserRecentChangesBatchModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'output': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'job_queued_msec': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )


class UserStatsModelTest(test_utils.GenericTestBase):
    """Tests for the UserStatsModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    USER_ID_3: Final = 'id_3'

    USER_1_IMPACT_SCORE: Final = 0.87
    USER_1_TOTAL_PLAYS: Final = 33
    USER_1_AVERAGE_RATINGS: Final = 4.37
    USER_1_NUM_RATINGS: Final = 22
    USER_1_WEEKLY_CREATOR_STATS_LIST: Final = [
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

    USER_2_IMPACT_SCORE: Final = 0.33
    USER_2_TOTAL_PLAYS: Final = 15
    USER_2_AVERAGE_RATINGS: Final = 2.50
    USER_2_NUM_RATINGS: Final = 10
    USER_2_WEEKLY_CREATOR_STATS_LIST: Final = [
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

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserStatsModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER)

    def test_get_or_create_user_stats_model_success(self) -> None:
        actual_user_existing = user_models.UserStatsModel.get_or_create(
            self.USER_ID_1)
        actual_user_new = user_models.UserStatsModel.get_or_create(
            'new_user_id')
        self.assertEqual(actual_user_existing.id, self.USER_ID_1)
        self.assertEqual(
            actual_user_existing.impact_score, self.USER_1_IMPACT_SCORE)
        self.assertEqual(actual_user_new.id, 'new_user_id')

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserStatsModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'impact_score': base_models.EXPORT_POLICY.EXPORTED,
                'total_plays': base_models.EXPORT_POLICY.EXPORTED,
                'average_ratings': base_models.EXPORT_POLICY.EXPORTED,
                'num_ratings': base_models.EXPORT_POLICY.EXPORTED,
                'weekly_creator_stats_list': base_models.EXPORT_POLICY.EXPORTED,
                'schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.UserStatsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self) -> None:
        user_models.UserStatsModel.apply_deletion_policy(self.USER_ID_1)
        self.assertIsNone(user_models.UserStatsModel.get_by_id(self.USER_ID_1))
        # Test that calling apply_deletion_policy with no existing model
        # doesn't fail.
        user_models.UserStatsModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_export_data_on_existing_user(self) -> None:
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

    def test_export_data_on_multiple_users(self) -> None:
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

    def test_export_data_on_nonexistent_user(self) -> None:
        """Test if export_data returns None when user is not in data store."""
        user_data = user_models.UserStatsModel.export_data(
            self.NONEXISTENT_USER_ID)
        test_data: Dict[str, str] = {}
        self.assertEqual(user_data, test_data)


class ExplorationUserDataModelTest(test_utils.GenericTestBase):
    """Tests for the ExplorationUserDataModel class."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    DATETIME_OBJECT: Final = datetime.datetime.strptime(
        '2016-02-16', '%Y-%m-%d'
    )
    DATETIME_EPOCH: Final = utils.get_time_in_millisecs(DATETIME_OBJECT)
    USER_1_ID: Final = 'id_1'
    USER_2_ID: Final = 'id_2'
    EXP_ID_ONE: Final = 'exp_id_one'
    EXP_ID_TWO: Final = 'exp_id_two'
    EXP_ID_THREE: Final = 'exp_id_three'

    def setUp(self) -> None:
        super().setUp()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_1_ID, self.EXP_ID_ONE),
            user_id=self.USER_1_ID,
            exploration_id=self.EXP_ID_ONE,
            rating=2,
            rated_on=self.DATETIME_OBJECT,
            draft_change_list={'new_content': {}},
            draft_change_list_last_updated=self.DATETIME_OBJECT,
            draft_change_list_exp_version=3,
            draft_change_list_id=1,
            furthest_reached_checkpoint_exp_version=1,
            furthest_reached_checkpoint_state_name='checkpoint1',
            most_recently_reached_checkpoint_exp_version=1,
            most_recently_reached_checkpoint_state_name='checkpoint1'
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
            draft_change_list_id=1,
            furthest_reached_checkpoint_exp_version=1,
            furthest_reached_checkpoint_state_name='checkpoint1',
            most_recently_reached_checkpoint_exp_version=1,
            most_recently_reached_checkpoint_state_name='checkpoint1'
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.ExplorationUserDataModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self) -> None:
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.ExplorationUserDataModel
            .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER)

    def test_get_field_names_for_takeout(self) -> None:
        self.assertEqual(
            user_models.ExplorationUserDataModel
            .get_field_names_for_takeout(), {
                'rated_on': 'rated_on_msec',
                'draft_change_list_last_updated':
                    'draft_change_list_last_updated_msec'
                }
        )

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.ExplorationUserDataModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'exploration_id':
                base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
                'rating': base_models.EXPORT_POLICY.EXPORTED,
                'rated_on': base_models.EXPORT_POLICY.EXPORTED,
                'draft_change_list': base_models.EXPORT_POLICY.EXPORTED,
                'draft_change_list_last_updated':
                base_models.EXPORT_POLICY.EXPORTED,
                'draft_change_list_exp_version':
                base_models.EXPORT_POLICY.EXPORTED,
                'draft_change_list_id': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'mute_suggestion_notifications':
                base_models.EXPORT_POLICY.EXPORTED,
                'mute_feedback_notifications':
                base_models.EXPORT_POLICY.EXPORTED,
                'furthest_reached_checkpoint_state_name':
                base_models.EXPORT_POLICY.EXPORTED,
                'furthest_reached_checkpoint_exp_version':
                base_models.EXPORT_POLICY.EXPORTED,
                'most_recently_reached_checkpoint_state_name':
                base_models.EXPORT_POLICY.EXPORTED,
                'most_recently_reached_checkpoint_exp_version':
                base_models.EXPORT_POLICY.EXPORTED
            }
        )

    def test_has_reference_to_user_id(self) -> None:
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

    def test_create_success(self) -> None:
        user_models.ExplorationUserDataModel.create(
            self.USER_1_ID, self.EXP_ID_TWO).put()
        retrieved_object = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_1_ID, self.EXP_ID_TWO))

        self.assertEqual(retrieved_object.user_id, self.USER_1_ID)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_TWO)

    def test_get_success(self) -> None:
        retrieved_object = user_models.ExplorationUserDataModel.get(
            self.USER_1_ID, self.EXP_ID_ONE)

        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_object is not None
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

    def test_get_failure(self) -> None:
        retrieved_object = user_models.ExplorationUserDataModel.get(
            self.USER_1_ID, 'unknown_exp_id')

        self.assertEqual(retrieved_object, None)

    def test_get_multiple_exploration_model_success(self) -> None:
        user_id_exp_id_combinations = [
            (self.USER_1_ID, self.EXP_ID_ONE),
            (self.USER_2_ID, self.EXP_ID_ONE)
        ]
        retrieved_object = user_models.ExplorationUserDataModel.get_multi(
            user_id_exp_id_combinations)
        # Mypy Type checking for None.
        assert retrieved_object[0] is not None
        assert retrieved_object[1] is not None
        self.assertEqual(len(retrieved_object), 2)
        self.assertEqual(retrieved_object[0].user_id, self.USER_1_ID)
        self.assertEqual(
            retrieved_object[0].id,
            '%s.%s' % (self.USER_1_ID, self.EXP_ID_ONE))
        self.assertEqual(
            retrieved_object[0].exploration_id, self.EXP_ID_ONE)
        self.assertEqual(retrieved_object[1].user_id, self.USER_2_ID)
        self.assertEqual(
            retrieved_object[1].id,
            '%s.%s' % (self.USER_2_ID, self.EXP_ID_ONE))
        self.assertEqual(
            retrieved_object[1].exploration_id, self.EXP_ID_ONE)

    def test_export_data_nonexistent_user(self) -> None:
        user_data = user_models.ExplorationUserDataModel.export_data(
            'fake_user')
        self.assertEqual(user_data, {})

    def test_export_data_one_exploration(self) -> None:
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
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
                'furthest_reached_checkpoint_exp_version': 1,
                'furthest_reached_checkpoint_state_name': 'checkpoint1',
                'most_recently_reached_checkpoint_exp_version': 1,
                'most_recently_reached_checkpoint_state_name': 'checkpoint1'
            }
        }
        self.assertDictEqual(expected_data, user_data)

    def test_export_data_multiple_explorations(self) -> None:
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
            draft_change_list_id=2,
            furthest_reached_checkpoint_exp_version=1,
            furthest_reached_checkpoint_state_name='checkpoint3',
            most_recently_reached_checkpoint_exp_version=1,
            most_recently_reached_checkpoint_state_name='checkpoint2').put()

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
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
                'furthest_reached_checkpoint_exp_version': 1,
                'furthest_reached_checkpoint_state_name': 'checkpoint1',
                'most_recently_reached_checkpoint_exp_version': 1,
                'most_recently_reached_checkpoint_state_name': 'checkpoint1'
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
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
                'furthest_reached_checkpoint_exp_version': None,
                'furthest_reached_checkpoint_state_name': None,
                'most_recently_reached_checkpoint_exp_version': None,
                'most_recently_reached_checkpoint_state_name': None
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
                    feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
                'furthest_reached_checkpoint_exp_version': 1,
                'furthest_reached_checkpoint_state_name': 'checkpoint3',
                'most_recently_reached_checkpoint_exp_version': 1,
                'most_recently_reached_checkpoint_state_name': 'checkpoint2'
            }
        }
        self.assertDictEqual(expected_data, user_data)


class CollectionProgressModelTests(test_utils.GenericTestBase):
    """Tests for CollectionProgressModel."""

    NONEXISTENT_USER_ID: Final = 'user_id_x'
    USER_ID_1: Final = 'user_id_1'
    USER_ID_2: Final = 'user_id_2'
    USER_ID_3: Final = 'user_id_3'
    COLLECTION_ID_1: Final = 'col_id_1'
    COLLECTION_ID_2: Final = 'col_id_2'
    COMPLETED_EXPLORATION_IDS_1: Final = ['exp_id_1', 'exp_id_2', 'exp_id_3']
    COMPLETED_EXPLORATION_IDS_2: Final = ['exp_id_4', 'exp_id_5', 'exp_id_6']

    def setUp(self) -> None:
        super().setUp()

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

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.CollectionProgressModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.CollectionProgressModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.CollectionProgressModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'collection_id':
                    base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
                'completed_explorations': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_apply_deletion_policy(self) -> None:
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

    def test_has_reference_to_user_id(self) -> None:
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

    def test_create_collection_progress_model_success(self) -> None:
        retrieved_object = user_models.CollectionProgressModel.create(
            self.USER_ID_1, self.COLLECTION_ID_1)
        self.assertEqual(retrieved_object.user_id, self.USER_ID_1)
        self.assertEqual(
            retrieved_object.id,
            '%s.%s' % (self.USER_ID_1, self.COLLECTION_ID_1))
        self.assertEqual(retrieved_object.collection_id, self.COLLECTION_ID_1)

    def test_get_collection_progress_model_success(self) -> None:
        retrieved_object = user_models.CollectionProgressModel.get(
            self.USER_ID_1, self.COLLECTION_ID_2)
        assert retrieved_object is not None
        self.assertEqual(
            retrieved_object.id,
            '%s.%s' % (self.USER_ID_1, self.COLLECTION_ID_2))
        self.assertEqual(
            retrieved_object.user_id, self.USER_ID_1)
        self.assertEqual(
            retrieved_object.collection_id, self.COLLECTION_ID_2)
        self.assertEqual(
            retrieved_object.completed_explorations,
            self.COMPLETED_EXPLORATION_IDS_2
        )

    def test_get_collection_progress_model_failure(self) -> None:
        retrieved_object = user_models.CollectionProgressModel.get(
            self.USER_ID_1, 'fake_exp_id')
        self.assertIsNone(retrieved_object)

    def test_get_multiple_collection_progress_model_success(self) -> None:
        retrieved_object = user_models.CollectionProgressModel.get_multi(
            self.USER_ID_1, [self.COLLECTION_ID_1, self.COLLECTION_ID_2])
        # Mypy checking for None.
        assert retrieved_object[0] is not None
        assert retrieved_object[1] is not None
        self.assertEqual(len(retrieved_object), 2)
        self.assertEqual(retrieved_object[0].user_id, self.USER_ID_1)
        self.assertEqual(
            retrieved_object[0].id,
            '%s.%s' % (self.USER_ID_1, self.COLLECTION_ID_1))
        self.assertEqual(
            retrieved_object[0].collection_id, self.COLLECTION_ID_1)
        self.assertEqual(
            retrieved_object[1].collection_id, self.COLLECTION_ID_2)
        self.assertEqual(
            retrieved_object[1].id,
            '%s.%s' % (self.USER_ID_1, self.COLLECTION_ID_2))
        self.assertEqual(retrieved_object[1].user_id, self.USER_ID_1)

    def test_get_or_create_collection_progress_model_success(self) -> None:
        retrieved_object = user_models.CollectionProgressModel.get_or_create(
            self.USER_ID_1, self.COLLECTION_ID_1)
        self.assertIsNotNone(retrieved_object)
        self.assertEqual(retrieved_object.user_id, self.USER_ID_1)
        self.assertEqual(
            retrieved_object.id,
            '%s.%s' % (self.USER_ID_1, self.COLLECTION_ID_1))
        user_data_new = user_models.CollectionProgressModel.get_or_create(
            'new_user_id', 'new_coll_id')
        self.assertIsNotNone(user_data_new)
        self.assertEqual(user_data_new.user_id, 'new_user_id')
        self.assertEqual(
            user_data_new.id, 'new_user_id.new_coll_id')

    def test_export_data_on_nonexistent_user(self) -> None:
        """Test export data on nonexistent user."""
        user_data = user_models.CollectionProgressModel.export_data(
            self.NONEXISTENT_USER_ID)
        expected_data: Dict[str, str] = {}
        self.assertEqual(expected_data, user_data)

    def test_export_data_single_collection(self) -> None:
        """Test export data on user with a single collection."""
        user_data = user_models.CollectionProgressModel.export_data(
            self.USER_ID_2)
        expected_data = {
            self.COLLECTION_ID_1: {
                'completed_explorations': self.COMPLETED_EXPLORATION_IDS_1
            }
        }
        self.assertEqual(expected_data, user_data)

    def test_export_data_multiple_collections(self) -> None:
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

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    USER_ID_3: Final = 'id_3'
    STORY_ID_1: Final = 'story_id_1'
    STORY_ID_2: Final = 'story_id_2'
    COMPLETED_NODE_IDS_1: Final = ['node_id_1', 'node_id_2']
    COMPLETED_NODE_IDS_2: Final = ['node_id_a']

    def setUp(self) -> None:
        super().setUp()
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

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.StoryProgressModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.StoryProgressModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.StoryProgressModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'story_id':
                    base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
                'completed_node_ids': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_apply_deletion_policy(self) -> None:
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

    def test_has_reference_to_user_id(self) -> None:
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

    def test_export_data_on_nonexistent_user(self) -> None:
        user_data = user_models.StoryProgressModel.export_data(
            self.NONEXISTENT_USER_ID)
        expected_data: Dict[str, str] = {}
        self.assertEqual(expected_data, user_data)

    def test_export_data_on_single_story(self) -> None:
        user_data = user_models.StoryProgressModel.export_data(
            self.USER_ID_1)
        expected_data = {
            self.STORY_ID_1: {
                'completed_node_ids': self.COMPLETED_NODE_IDS_1
            }
        }
        self.assertEqual(expected_data, user_data)

    def test_export_data_on_multi_story(self) -> None:
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

    def test_get_story_progress_model_success(self) -> None:
        retrieved_object = user_models.StoryProgressModel.get(
            self.USER_ID_1, self.STORY_ID_1)

        self.assertEqual(retrieved_object.user_id, self.USER_ID_1)
        self.assertEqual(retrieved_object.story_id, self.STORY_ID_1)
        self.assertEqual(
            retrieved_object.id, '%s.%s' % (self.USER_ID_1, self.STORY_ID_1))
        self.assertEqual(
            retrieved_object.completed_node_ids, self.COMPLETED_NODE_IDS_1)

    def test_get_story_progress_model_failure(self) -> None:
        retrieved_object = user_models.StoryProgressModel.get(
            'unknown_user_id',
            'unknown_story_id', strict=False)
        self.assertEqual(retrieved_object, None)

    def test_get_multi(self) -> None:
        model = user_models.StoryProgressModel.create(
            'user_id', 'story_id_1')
        model.update_timestamps()
        model.put()

        model = user_models.StoryProgressModel.create(
            'user_id', 'story_id_2')
        model.update_timestamps()
        model.put()

        story_progress_models = user_models.StoryProgressModel.get_multi(
            ['user_id'], ['story_id_1', 'story_id_2'])
        # Ruling out the possibility of None for mypy type checking.
        assert story_progress_models[0] is not None
        assert story_progress_models[1] is not None
        self.assertEqual(len(story_progress_models), 2)
        self.assertEqual(story_progress_models[0].user_id, 'user_id')
        self.assertEqual(story_progress_models[0].story_id, 'story_id_1')

        self.assertEqual(story_progress_models[1].user_id, 'user_id')
        self.assertEqual(story_progress_models[1].story_id, 'story_id_2')

    def test_get_or_create_story_progress_model(self) -> None:
        story_progress_model = user_models.StoryProgressModel.get_or_create(
            self.USER_ID_1, self.STORY_ID_1)
        self.assertIsNotNone(story_progress_model)
        self.assertEqual(story_progress_model.user_id, self.USER_ID_1)
        self.assertEqual(
            story_progress_model.id,
            '%s.%s' % (self.USER_ID_1, self.STORY_ID_1))
        story_progress_model_new = user_models.StoryProgressModel.get_or_create(
            'new_user_id', 'new_story_id')
        self.assertIsNotNone(story_progress_model_new)
        self.assertEqual(story_progress_model_new.user_id, 'new_user_id')
        self.assertEqual(
            story_progress_model_new.id, 'new_user_id.new_story_id')


class UserQueryModelTests(test_utils.GenericTestBase):
    """Tests for UserQueryModel."""

    QUERY_1_ID: Final = 'id_1'
    QUERY_2_ID: Final = 'id_2'
    QUERY_3_ID: Final = 'id_3'
    NONEXISTENT_USER_ID: Final = 'submitter_id_x'
    USER_ID_1: Final = 'submitter_id_1'
    USER_ID_2: Final = 'submitter_id_2'

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

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

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.UserQueryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserQueryModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserQueryModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'inactive_in_last_n_days':
                    base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'has_not_logged_in_for_n_days':
                    base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_at_least_n_exps':
                    base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_fewer_than_n_exps':
                    base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'edited_at_least_n_exps':
                    base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'edited_fewer_than_n_exps':
                    base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_collection': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'user_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'submitter_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'sent_email_model_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'query_status': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_apply_deletion_policy(self) -> None:
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

    def test_has_reference_to_user_id(self) -> None:
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

    def test_instance_stores_correct_data(self) -> None:
        inactive_in_last_n_days = 5
        created_at_least_n_exps = 1
        created_fewer_than_n_exps = 3
        edited_at_least_n_exps = 2
        edited_fewer_than_n_exps = 5
        has_not_logged_in_for_n_days = 10
        created_collection = True
        user_models.UserQueryModel(
            id=self.QUERY_1_ID,
            inactive_in_last_n_days=inactive_in_last_n_days,
            created_at_least_n_exps=created_at_least_n_exps,
            created_fewer_than_n_exps=created_fewer_than_n_exps,
            edited_at_least_n_exps=edited_at_least_n_exps,
            edited_fewer_than_n_exps=edited_fewer_than_n_exps,
            has_not_logged_in_for_n_days=has_not_logged_in_for_n_days,
            created_collection=created_collection,
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

    def test_fetch_page(self) -> None:
        inactive_in_last_n_days = 5
        created_at_least_n_exps = 1
        created_fewer_than_n_exps = 3
        edited_at_least_n_exps = 2
        edited_fewer_than_n_exps = 5
        has_not_logged_in_for_n_days = 10
        created_collection = True
        user_models.UserQueryModel(
            id=self.QUERY_1_ID,
            inactive_in_last_n_days=inactive_in_last_n_days,
            created_at_least_n_exps=created_at_least_n_exps,
            created_fewer_than_n_exps=created_fewer_than_n_exps,
            edited_at_least_n_exps=edited_at_least_n_exps,
            edited_fewer_than_n_exps=edited_fewer_than_n_exps,
            has_not_logged_in_for_n_days=has_not_logged_in_for_n_days,
            created_collection=created_collection,
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
        user_models.UserQueryModel(
            id=query_id,
            inactive_in_last_n_days=inactive_in_last_n_days,
            created_at_least_n_exps=created_at_least_n_exps,
            created_fewer_than_n_exps=created_fewer_than_n_exps,
            edited_at_least_n_exps=edited_at_least_n_exps,
            edited_fewer_than_n_exps=edited_fewer_than_n_exps,
            has_not_logged_in_for_n_days=has_not_logged_in_for_n_days,
            created_collection=created_collection,
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

        self.assertEqual(query_models[1].submitter_id, self.USER_ID_1)
        self.assertEqual(query_models[1].id, self.QUERY_1_ID)
        self.assertEqual(query_models[1].inactive_in_last_n_days, 5)
        self.assertEqual(query_models[1].created_at_least_n_exps, 1)
        self.assertEqual(query_models[1].created_fewer_than_n_exps, 3)
        self.assertEqual(query_models[1].edited_at_least_n_exps, 2)
        self.assertEqual(query_models[1].edited_fewer_than_n_exps, 5)
        self.assertEqual(query_models[1].has_not_logged_in_for_n_days, 10)
        self.assertTrue(query_models[1].created_collection)


class UserBulkEmailsModelTests(test_utils.GenericTestBase):
    """Tests for UserBulkEmailsModel."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

        user_models.UserBulkEmailsModel(id=self.USER_ID_1).put()
        user_models.UserBulkEmailsModel(id=self.USER_ID_2, deleted=True).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.UserBulkEmailsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_apply_deletion_policy_deletes_model_for_user(self) -> None:
        user_models.UserBulkEmailsModel.apply_deletion_policy(
            self.USER_ID_1)
        self.assertIsNone(
            user_models.UserBulkEmailsModel.get_by_id(self.USER_ID_1))

    def test_apply_deletion_policy_raises_no_exception_for_nonexistent_user(
        self
    ) -> None:
        user_models.UserBulkEmailsModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserBulkEmailsModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserBulkEmailsModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'sent_email_model_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )


class UserSkillMasteryModelTests(test_utils.GenericTestBase):
    """Tests for UserSkillMasteryModel."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_1_ID: Final = 'user_1_id'
    USER_2_ID: Final = 'user_2_id'
    SKILL_ID_1: Final = 'skill_id_1'
    SKILL_ID_2: Final = 'skill_id_2'
    DEGREE_OF_MASTERY: Final = 0.5

    def setUp(self) -> None:
        super().setUp()
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

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.UserSkillMasteryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserSkillMasteryModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserSkillMasteryModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'skill_id':
                    base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
                'degree_of_mastery': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_apply_deletion_policy(self) -> None:
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

    def test_has_reference_to_user_id(self) -> None:
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

    def test_construct_model_id(self) -> None:
        constructed_model_id = (
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_1_ID, self.SKILL_ID_1))

        self.assertEqual(constructed_model_id, 'user_1_id.skill_id_1')

    def test_get_success(self) -> None:
        constructed_model_id = (
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_1_ID, self.SKILL_ID_1))
        retrieved_object = user_models.UserSkillMasteryModel.get(
            constructed_model_id)

        self.assertEqual(retrieved_object.user_id, self.USER_1_ID)
        self.assertEqual(retrieved_object.skill_id, self.SKILL_ID_1)
        self.assertEqual(retrieved_object.degree_of_mastery, 0.5)

    def test_get_failure(self) -> None:
        retrieved_object = user_models.UserSkillMasteryModel.get(
            'unknown_model_id', strict=False)

        self.assertEqual(retrieved_object, None)

    def test_get_multi_success(self) -> None:
        skill_ids = [
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_1_ID, self.SKILL_ID_1),
            user_models.UserSkillMasteryModel.construct_model_id(
                self.USER_1_ID, self.SKILL_ID_2)]
        retrieved_object = user_models.UserSkillMasteryModel.get_multi(
            skill_ids)

        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_object[0] is not None
        assert retrieved_object[1] is not None
        self.assertEqual(retrieved_object[0].user_id, self.USER_1_ID)
        self.assertEqual(retrieved_object[0].skill_id, self.SKILL_ID_1)
        self.assertEqual(retrieved_object[0].degree_of_mastery, 0.5)
        self.assertEqual(retrieved_object[1].user_id, self.USER_1_ID)
        self.assertEqual(retrieved_object[1].skill_id, self.SKILL_ID_2)
        self.assertEqual(retrieved_object[1].degree_of_mastery, 0.5)

    def test_get_multi_failure(self) -> None:
        skill_ids = ['unknown_model_id_1', 'unknown_model_id_2']
        retrieved_object = user_models.UserSkillMasteryModel.get_multi(
            skill_ids)

        self.assertEqual(retrieved_object, [None, None])

    def test_export_data_trivial(self) -> None:
        user_data = user_models.UserSkillMasteryModel.export_data('fake_user')
        test_data: Dict[str, str] = {}
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self) -> None:
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

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_1_ID: Final = 'user_1_id'
    USER_2_ID: Final = 'user_2_id'
    USER_3_ID_OLD: Final = 'user_3_id_old'
    USER_3_ID_NEW: Final = 'user_3_id_new'
    SCORE_CATEGORY_1: Final = 'category_1'
    SCORE_CATEGORY_2: Final = 'category_2'

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

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

    def test_export_data_trivial(self) -> None:
        user_data = user_models.UserContributionProficiencyModel.export_data(
            'USER_WITHOUT_DATA')
        expected_data: Dict[str, str] = {}
        self.assertEqual(user_data, expected_data)

    def test_export_data_nontrivial(self) -> None:
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserContributionProficiencyModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserContributionProficiencyModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'score_category':
                    base_models.EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
                'score': base_models.EXPORT_POLICY.EXPORTED,
                'onboarding_email_sent': base_models.EXPORT_POLICY.EXPORTED
            }
        )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.UserContributionProficiencyModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_apply_deletion_policy(self) -> None:
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

    def test_has_reference_to_user_id(self) -> None:
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

    def test_create_model(self) -> None:
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

    def test_create_entry_already_exists_failure(self) -> None:
        user_models.UserContributionProficiencyModel.create(
            'user1', 'category1', 1)
        with self.assertRaisesRegex(
            Exception, 'There is already a UserContributionProficiencyModel '
            'entry with the given id: category1.user1'):
            user_models.UserContributionProficiencyModel.create(
                'user1', 'category1', 2)

    def test_get_all_users_with_score_above_minimum_for_category(self) -> None:
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
            self) -> None:
        user_score_models = (
            user_models.UserContributionProficiencyModel
            .get_all_users_with_score_above_minimum_for_category(
                'invalid_category'))

        self.assertEqual(user_score_models, [])

    def test_get_all_scores_of_user_with_multiple_scores(self) -> None:
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

    def test_get_all_scores_of_user_with_an_invalid_user_id_is_empty(
            self
    ) -> None:
        user_score_models = (
            user_models.UserContributionProficiencyModel
            .get_all_scores_of_user('invalid_user_id'))

        self.assertEqual(user_score_models, [])

    def test_get_categories_where_user_can_review(self) -> None:
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

    def test_get_categories_where_user_can_review_with_invalid_user_id(
            self
    ) -> None:
        score_categories = (
            user_models.UserContributionProficiencyModel
            .get_all_categories_where_user_can_review('invalid_user_id'))

        self.assertEqual(score_categories, [])


class UserContributionRightsModelTests(test_utils.GenericTestBase):
    """Tests for UserContributionRightsModel."""

    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    NONEXISTENT_USER_ID: Final = 'id_3'

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.UserContributionRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_has_reference_to_user_id(self) -> None:
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

    def test_export_data_trivial(self) -> None:
        user_data = user_models.UserContributionRightsModel.export_data(
            self.USER_ID_1)
        expected_data: Dict[str, Union[bool, List[str]]] = {}
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.UserContributionRightsModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.UserContributionRightsModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'can_review_translation_for_language_codes':
                    base_models.EXPORT_POLICY.EXPORTED,
                'can_review_voiceover_for_language_codes':
                    base_models.EXPORT_POLICY.EXPORTED,
                'can_review_questions': base_models.EXPORT_POLICY.EXPORTED,
                'can_submit_questions': base_models.EXPORT_POLICY.EXPORTED,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_get_translation_reviewer_user_ids(self) -> None:
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

    def test_get_voiceover_reviewer_user_ids(self) -> None:
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

    def test_get_question_reviewer_user_ids(self) -> None:
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

    def test_get_question_submitter_user_ids(self) -> None:
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

    def test_apply_deletion_policy(self) -> None:
        user_models.UserContributionRightsModel.apply_deletion_policy(
            self.USER_ID_1)
        self.assertFalse(
            user_models.UserContributionRightsModel.has_reference_to_user_id(
                self.USER_ID_1)
        )
        # Check if passing a non-existent user_id does not fail.
        user_models.UserContributionRightsModel.apply_deletion_policy(
            'fake_user_id')


class PendingDeletionRequestModelTests(test_utils.GenericTestBase):
    """Tests for PendingDeletionRequestModel."""

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_1_ID: Final = 'user_1_id'
    USER_1_EMAIL: Final = 'email@email.com'
    USER_1_ROLE: Final = feconf.ROLE_ID_MOBILE_LEARNER

    def setUp(self) -> None:
        """Set up user models in datastore for use in testing."""
        super().setUp()

        user_models.PendingDeletionRequestModel(
            id=self.USER_1_ID,
            email=self.USER_1_EMAIL,
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.PendingDeletionRequestModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE_AT_END)

    def test_apply_deletion_policy_for_registered_user_deletes_them(
            self
    ) -> None:
        user_models.PendingDeletionRequestModel.apply_deletion_policy(
            self.USER_1_ID)
        self.assertIsNone(
            user_models.PendingDeletionRequestModel.get_by_id(self.USER_1_ID))

    def test_apply_deletion_policy_nonexistent_user_raises_no_exception(
            self
    ) -> None:
        self.assertIsNone(
            user_models.PendingDeletionRequestModel.get_by_id(
                self.NONEXISTENT_USER_ID))
        user_models.PendingDeletionRequestModel.apply_deletion_policy(
            self.NONEXISTENT_USER_ID)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.PendingDeletionRequestModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.PendingDeletionRequestModel.get_export_policy(), {
                'username': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'email': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'normalized_long_term_username': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE),
                'deletion_complete': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'pseudonymizable_entity_mappings': (
                    base_models.EXPORT_POLICY.NOT_APPLICABLE),
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_has_reference_to_user_id(self) -> None:
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

    NONEXISTENT_USER_ID: Final = 'id_x'
    USER_1_ID: Final = 'user_1_id'

    def setUp(self) -> None:
        super().setUp()
        user_models.DeletedUserModel(
            id=self.USER_1_ID
        ).put()

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.DeletedUserModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.DeletedUserModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.DeletedUserModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            user_models.DeletedUserModel.has_reference_to_user_id(
                self.USER_1_ID))
        self.assertFalse(
            user_models.DeletedUserModel.has_reference_to_user_id(
                self.NONEXISTENT_USER_ID))


class PseudonymizedUserModelTests(test_utils.GenericTestBase):
    """Tests for PseudonymizedUserModel."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.PseudonymizedUserModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.PseudonymizedUserModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_create_raises_error_when_many_id_collisions_occur(self) -> None:
        # Swap dependent method get_by_id to simulate collision every time.
        get_by_id_swap = self.swap(
            user_models.PseudonymizedUserModel, 'get_by_id', types.MethodType(
                lambda _, __: True, user_models.PseudonymizedUserModel))

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'New id generator is producing too many collisions.')

        with assert_raises_regexp_context_manager, get_by_id_swap:
            user_models.PseudonymizedUserModel.get_new_id('exploration')

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.PseudonymizedUserModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_get_new_id_normal_behaviour_returns_unique_ids(self) -> None:
        ids: Set[str] = set()
        for _ in range(100):
            new_id = user_models.PseudonymizedUserModel.get_new_id('')
            self.assertNotIn(new_id, ids)
            user_models.PseudonymizedUserModel(
                id=new_id).put()
            ids.add(new_id)

    def test_get_new_id_simulate_collisions(self) -> None:
        get_by_id_swap = self.swap(
            user_models.PseudonymizedUserModel, 'get_by_id', types.MethodType(
                lambda _, __: True, user_models.PseudonymizedUserModel))

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'New id generator is producing too many collisions.')

        with assert_raises_regexp_context_manager, get_by_id_swap:
            user_models.PseudonymizedUserModel.get_new_id('exploration')


class DeletedUsernameModelTests(test_utils.GenericTestBase):
    """Tests for DeletedUsernameModel."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.DeletedUsernameModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.DeletedUsernameModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.DeletedUsernameModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )


class LearnerGroupsUserModelTests(test_utils.GenericTestBase):
    """Tests for LearnerGroupsUserModel."""

    USER_ID_1: Final = 'id_1'
    USER_ID_2: Final = 'id_2'
    NONEXISTENT_USER_ID: Final = 'id_3'

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.LearnerGroupsUserModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_has_reference_to_user_id(self) -> None:
        self.assertFalse(
            user_models.LearnerGroupsUserModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertFalse(
            user_models.LearnerGroupsUserModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertFalse(
            user_models.LearnerGroupsUserModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

        user_models.LearnerGroupsUserModel(
            id=self.USER_ID_1,
            invited_to_learner_groups_ids=['group_id_1', 'group_id_2'],
            learner_groups_user_details=[
                {
                    'group_id': 'group_id_3',
                    'progress_sharing_is_turned_on': False
                },
                {
                    'group_id': 'group_id_4',
                    'progress_sharing_is_turned_on': True
                }
            ]).put()
        user_models.LearnerGroupsUserModel(
            id=self.USER_ID_2,
            invited_to_learner_groups_ids=['group_id_1', 'group_id_1'],
            learner_groups_user_details=[
                {
                    'group_id': 'group_id_3',
                    'progress_sharing_is_turned_on': False
                },
                {
                    'group_id': 'group_id_4',
                    'progress_sharing_is_turned_on': True
                }
            ]).put()

        self.assertTrue(
            user_models.LearnerGroupsUserModel
            .has_reference_to_user_id(self.USER_ID_1)
        )
        self.assertTrue(
            user_models.LearnerGroupsUserModel
            .has_reference_to_user_id(self.USER_ID_2)
        )
        self.assertFalse(
            user_models.LearnerGroupsUserModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID)
        )

    def test_export_data_trivial(self) -> None:
        user_data = user_models.LearnerGroupsUserModel.export_data(
            self.USER_ID_1)
        self.assertEqual(user_data, {})

        user_models.LearnerGroupsUserModel(
            id=self.USER_ID_1,
            invited_to_learner_groups_ids=['group_id_1', 'group_id_2'],
            learner_groups_user_details=[
                {
                    'group_id': 'group_id_3',
                    'progress_sharing_is_turned_on': False
                },
                {
                    'group_id': 'group_id_4',
                    'progress_sharing_is_turned_on': True
                }
            ]).put()

        user_data = user_models.LearnerGroupsUserModel.export_data(
            self.USER_ID_1)
        expected_data: user_models.LearnerGroupsUserDataDict = {
            'invited_to_learner_groups_ids': ['group_id_1', 'group_id_2'],
            'learner_groups_user_details': [
                {
                    'group_id': 'group_id_3',
                    'progress_sharing_is_turned_on': False
                },
                {
                    'group_id': 'group_id_4',
                    'progress_sharing_is_turned_on': True
                }
            ]
        }
        self.assertEqual(user_data, expected_data)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.LearnerGroupsUserModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.ONE_INSTANCE_PER_USER)

    def test_get_export_policy(self) -> None:
        self.assertEqual(
            user_models.LearnerGroupsUserModel.get_export_policy(), {
                'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'invited_to_learner_groups_ids':
                    base_models.EXPORT_POLICY.EXPORTED,
                'learner_groups_user_details':
                    base_models.EXPORT_POLICY.EXPORTED,
                'learner_groups_user_details_schema_version':
                    base_models.EXPORT_POLICY.NOT_APPLICABLE,
                'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE
            }
        )

    def test_apply_deletion_policy(self) -> None:
        user_models.LearnerGroupsUserModel.apply_deletion_policy(
            self.USER_ID_1)
        self.assertFalse(
            user_models.LearnerGroupsUserModel.has_reference_to_user_id(
                self.USER_ID_1)
        )
        # Check if passing a non-existent user_id does not fail.
        user_models.LearnerGroupsUserModel.apply_deletion_policy(
            'fake_user_id')

    def test_delete_learner_group_references(self) -> None:
        """Test delete_learner_group_references function."""

        user_models.LearnerGroupsUserModel(
            id='user_34',
            invited_to_learner_groups_ids=['group_id_1', 'group_id_2'],
            learner_groups_user_details=[
                {
                    'group_id': 'group_id_3',
                    'progress_sharing_is_turned_on': False
                },
                {
                    'group_id': 'group_id_4',
                    'progress_sharing_is_turned_on': True
                }
            ]).put()

        # Delete reference for a group id in learner_groups_user_details.
        user_models.LearnerGroupsUserModel.delete_learner_group_references(
            'group_id_3', ['user_34'])

        # Delete reference for a group id in invited_to_learner_groups_ids.
        user_models.LearnerGroupsUserModel.delete_learner_group_references(
            'group_id_1', ['user_34'])

        # Test delete reference for a group id for uninvolved users.
        user_models.LearnerGroupsUserModel.delete_learner_group_references(
            'group_id_1', ['uninvolved_user_1'])

        user_data = user_models.LearnerGroupsUserModel.export_data(
            'user_34')
        expected_data = {
            'invited_to_learner_groups_ids': ['group_id_2'],
            'learner_groups_user_details': [
                {
                    'group_id': 'group_id_4',
                    'progress_sharing_is_turned_on': True
                }
            ]
        }
        self.assertEqual(user_data, expected_data)


class PinnedOpportunityModelTest(test_utils.GenericTestBase):
    """Tests for the PinnedOpportunityModel class."""

    def setUp(self) -> None:
        super().setUp()

        self.user_id = 'user_id_1'
        self.language_code = 'en'
        self.topic_id = 'topic_id_1'
        self.opportunity_id_1 = 'opportunity_id1'

        user_models.PinnedOpportunityModel.create(
            user_id=self.user_id,
            language_code=self.language_code,
            topic_id=self.topic_id,
            opportunity_id=self.opportunity_id_1
        )

    def test_create_and_fetch_model(self) -> None:
        fetched_model = user_models.PinnedOpportunityModel.get_model(
            self.user_id, self.language_code, self.topic_id)
        assert fetched_model is not None, (
            'Expected fetched_model to be not None')
        self.assertEqual(fetched_model.opportunity_id, self.opportunity_id_1)

        user_models.PinnedOpportunityModel.create(
            'user_id_2', 'en', 'topic_id_1', 'opportunity_id_2')

        fetched_model = (
            user_models.PinnedOpportunityModel.
        get_model('user_id_2', 'en', 'topic_id_1'))
        assert fetched_model is not None, (
            'Expected fetched_model to be not None')
        self.assertEqual(fetched_model.opportunity_id, 'opportunity_id_2')

    def test_create_raises_exception_for_existing_instance(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'There is already a pinned opportunity' +
            ' with the given id:'):
            user_models.PinnedOpportunityModel.create(
                user_id=self.user_id,
                language_code=self.language_code,
                topic_id=self.topic_id,
                opportunity_id=self.opportunity_id_1
            )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            user_models.PinnedOpportunityModel.get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE
        )

    def test_has_reference_to_user_id(self) -> None:
        self.assertTrue(
            user_models.PinnedOpportunityModel.
            has_reference_to_user_id(
                self.user_id
            )
        )

    def test_export_data_valid_user(self) -> None:
        user_data = user_models.PinnedOpportunityModel.export_data(
            self.user_id)
        key = f'{self.language_code}_{self.topic_id}'

        expected_data = {
            key: {
                'opportunity_id': self.opportunity_id_1,
            }
        }

        self.assertDictEqual(user_data, expected_data)

    def test_model_association_to_user(self) -> None:
        self.assertEqual(
            user_models.PinnedOpportunityModel.
            get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy = {
            'language_code': base_models.
                EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT,
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'topic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'opportunity_id': base_models.EXPORT_POLICY.EXPORTED,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }

        self.assertEqual(
            user_models.PinnedOpportunityModel.get_export_policy(),
            expected_export_policy
        )

    def test_apply_deletion_policy(self) -> None:
        user_models.PinnedOpportunityModel.apply_deletion_policy(
            self.user_id)

        fetched_model = user_models.PinnedOpportunityModel.get_model(
            self.user_id, self.language_code, self.topic_id)
        self.assertIsNone(fetched_model)
