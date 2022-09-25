# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for user domain objects."""

from __future__ import annotations

import datetime
import logging

from core import feconf
from core import utils
from core.constants import constants
from core.domain import auth_services
from core.domain import user_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import List, Optional, TypedDict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import user_models

user_models, = models.Registry.import_models([models.Names.USER])


class MockModifiableUserDataDict(TypedDict):
    """Dictionary representing the MockModifiableUserData object."""

    display_alias: str
    schema_version: int
    pin: Optional[str]
    preferred_language_codes: List[str]
    preferred_site_language_code: Optional[str]
    preferred_audio_language_code: Optional[str]
    preferred_translation_language_code: Optional[str]
    user_id: Optional[str]
    fake_field: Optional[str]


# This mock class will not be needed once the schema version is >=2 for the
# original class ModifiableUserData. Tests below using this class should also
# be modified then.
class MockModifiableUserData(user_domain.ModifiableUserData):
    """A mock ModifiableUserData class that adds a new attribute to the original
    class to create a new version of the schema for testing migration of old
    schema user data dict to latest one.
    """

    def __init__(
        self,
        display_alias: str,
        pin: Optional[str],
        preferred_language_codes: List[str],
        preferred_site_language_code: Optional[str],
        preferred_audio_language_code: Optional[str],
        preferred_translation_language_code: Optional[str],
        user_id: Optional[str]=None,
        fake_field: Optional[str]=None
    ) -> None:
        super().__init__(
            display_alias,
            pin,
            preferred_language_codes,
            preferred_site_language_code,
            preferred_audio_language_code,
            preferred_translation_language_code,
            user_id=None
        )
        self.fake_field = fake_field

    CURRENT_SCHEMA_VERSION = 2

    # Overriding method to add a new attribute added names 'fake_field'.
    # Here we use MyPy ignore because the signature of this method
    # doesn't match with user_domain.ModifiableUserData.from_dict().
    @classmethod
    def from_dict(  # type: ignore[override]
        cls, modifiable_user_data_dict: MockModifiableUserDataDict
    ) -> MockModifiableUserData:
        return MockModifiableUserData(
            modifiable_user_data_dict['display_alias'],
            modifiable_user_data_dict['pin'],
            modifiable_user_data_dict['preferred_language_codes'],
            modifiable_user_data_dict['preferred_site_language_code'],
            modifiable_user_data_dict['preferred_audio_language_code'],
            modifiable_user_data_dict['preferred_translation_language_code'],
            modifiable_user_data_dict['user_id'],
            modifiable_user_data_dict['fake_field']
        )

    # Adding a new method to convert v1 schema data dict to v2.
    @classmethod
    def _convert_v1_dict_to_v2_dict(
        cls, user_data_dict: MockModifiableUserDataDict
    ) -> MockModifiableUserDataDict:
        """Mock function to convert v1 dict to v2."""
        user_data_dict['schema_version'] = 2
        user_data_dict['fake_field'] = 'default_value'
        return user_data_dict

    # Overiding method to first convert raw user data dict to latest version
    # then returning a ModifiableUserData domain object.
    # Here we use MyPy ignore because the signature of this method
    # doesn't match with user_domain.ModifiableUserData.from_raw_dict().
    @classmethod
    def from_raw_dict(  # type: ignore[override]
        cls, raw_user_data_dict: MockModifiableUserDataDict
    ) -> MockModifiableUserData:
        data_schema_version = raw_user_data_dict.get('schema_version')
        user_data_dict = raw_user_data_dict

        if data_schema_version == 1:
            user_data_dict = cls._convert_v1_dict_to_v2_dict(user_data_dict)
            data_schema_version = 2

        return MockModifiableUserData.from_dict(user_data_dict)


class UserSettingsTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        user_settings = user_services.get_user_settings(self.owner_id)
        self.user_settings = user_settings
        self.user_settings.validate()
        self.assertEqual(self.owner.roles, [feconf.ROLE_ID_FULL_USER])
        user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'preferred_translation_language_code': None,
            'user_id': 'user_id',
        }
        self.modifiable_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict))
        new_user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias_3',
            'pin': None,
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'preferred_translation_language_code': None,
            'user_id': None,
        }
        self.modifiable_new_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(new_user_data_dict))

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_str_user_id_raises_exception(self) -> None:
        self.user_settings.user_id = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected user_id to be a string'
        ):
            self.user_settings.validate()

    def test_validate_wrong_format_user_id_raises_exception(
        self
    ) -> None:
        self.user_settings.user_id = 'uid_%sA' % ('a' * 31)
        with self.assertRaisesRegex(
            utils.ValidationError, 'The user ID is in a wrong format.'
        ):
            self.user_settings.validate()

        self.user_settings.user_id = 'uid_%s' % ('a' * 31)
        with self.assertRaisesRegex(
            utils.ValidationError, 'The user ID is in a wrong format.'
        ):
            self.user_settings.validate()

        self.user_settings.user_id = 'a' * 36
        with self.assertRaisesRegex(
            utils.ValidationError, 'The user ID is in a wrong format.'
        ):
            self.user_settings.validate()

    def test_validate_invalid_banned_value_type_raises_exception(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        self.user_settings.banned = 123  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected banned to be a bool'):
            self.user_settings.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        self.user_settings.banned = '123'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected banned to be a bool'):
            self.user_settings.validate()

    def test_validate_invalid_roles_value_type_raises_exception(self) -> None:
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        self.user_settings.roles = 123  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected roles to be a list'):
            self.user_settings.validate()

        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        self.user_settings.roles = True  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected roles to be a list'):
            self.user_settings.validate()

    def test_validate_banned_user_with_roles_raises_exception(
        self
    ) -> None:
        self.user_settings.roles = ['FULL_USER']
        self.user_settings.banned = True

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected roles for banned user to be empty'):
            self.user_settings.validate()

    def test_validate_roles_with_duplicate_value_raise_exception(
        self
    ) -> None:
        self.user_settings.roles = ['FULL_USER', 'FULL_USER', 'TOPIC_MANAGER']

        with self.assertRaisesRegex(
            utils.ValidationError, 'Roles contains duplicate values:'):
            self.user_settings.validate()

    def test_validate_roles_without_any_default_role_raise_exception(
        self
    ) -> None:
        self.user_settings.roles = ['TOPIC_MANAGER']

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected roles to contains one default role.'):
            self.user_settings.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_str_pin_id(self) -> None:
        self.user_settings.pin = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected PIN to be a string'
        ):
            self.user_settings.validate()

    def test_validate_invalid_length_pin_raises_error(self) -> None:
        invalid_pin_values_list = ['1', '12', '1234', '123@#6', 'ABCa', '1!#a']
        error_msg = (
            'User PIN can only be of length %s or %s' %
            (feconf.FULL_USER_PIN_LENGTH, feconf.PROFILE_USER_PIN_LENGTH)
        )
        for pin in invalid_pin_values_list:
            with self.assertRaisesRegex(
                utils.ValidationError, error_msg
            ):
                self.user_settings.pin = pin
                self.user_settings.validate()

    def test_validate_valid_length_with_numeric_char_pin_works_fine(
        self
    ) -> None:
        valid_pin_values_list = ['123', '12345', '764', '42343']
        for pin in valid_pin_values_list:
            self.user_settings.pin = pin
            self.user_settings.validate()

    def test_validate_valid_length_pin_with_non_numeric_char_raises_error(
        self
    ) -> None:
        valid_pin_values_list = ['AbC', '123A}', '1!2', 'AB!', '[123]']
        error_msg = 'Only numeric characters are allowed in PIN'
        for pin in valid_pin_values_list:
            with self.assertRaisesRegex(
                utils.ValidationError, error_msg
            ):
                self.user_settings.pin = pin
                self.user_settings.validate()

    def test_validate_empty_user_id_raises_exception(self) -> None:
        self.user_settings.user_id = ''
        with self.assertRaisesRegex(
            utils.ValidationError, 'No user id specified.'
        ):
            self.user_settings.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_str_role_raises_exception(self) -> None:
        self.user_settings.roles = [0]  # type: ignore[list-item]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected roles to be a string'
        ):
            self.user_settings.validate()

    def test_validate_invalid_role_name_raises_exception(self) -> None:
        self.user_settings.roles = ['invalid_role']
        with self.assertRaisesRegex(
            utils.ValidationError, 'Role invalid_role does not exist.'):
            self.user_settings.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_str_display_alias_raises_error(self) -> None:
        self.user_settings.display_alias = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected display_alias to be a string,'
            ' received %s' % self.user_settings.display_alias):
            self.user_settings.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_str_creator_dashboard_display_pref_raises_error(
        self
    ) -> None:
        self.user_settings.creator_dashboard_display_pref = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected dashboard display preference to be a string'
        ):
            self.user_settings.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validation_none__email_raises_error(self) -> None:
        self.user_settings.email = None  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected email to be a string,'
            ' received %s' % self.user_settings.email):
            self.user_settings.validate()

    def test_validation_wrong_email_raises_error(self) -> None:
        invalid_emails_list = [
            'testemail.com', '@testemail.com', 'testemail.com@']
        for email in invalid_emails_list:
            self.user_settings.email = email
            with self.assertRaisesRegex(
                utils.ValidationError, 'Invalid email address: %s' % email
            ):
                self.user_settings.validate()

    def test_validate_invalid_creator_dashboard_display_pref_raises_error(
        self
    ) -> None:
        self.user_settings.creator_dashboard_display_pref = (
            'invalid_creator_dashboard_display_pref')
        with self.assertRaisesRegex(
            utils.ValidationError,
            'invalid_creator_dashboard_display_pref is not a valid '
            'value for the dashboard display preferences.'
        ):
            self.user_settings.validate()

    def test_validate_empty_display_alias_for_profiles_raises_error(
        self
    ) -> None:
        self.modifiable_user_data.user_id = self.owner_id
        self.modifiable_user_data.pin = '12345'
        self.modifiable_user_data.display_alias = 'temp_name'
        user_services.update_multiple_users_data([self.modifiable_user_data])

        auth_id = self.get_auth_id_from_email(self.OWNER_EMAIL)
        profile_pin = '123'
        error_msg = 'Expected display_alias to be a string, received'
        with self.assertRaisesRegex(utils.ValidationError, error_msg):
            self.modifiable_new_user_data.display_alias = ''
            self.modifiable_new_user_data.pin = profile_pin
            user_services.create_new_profiles(
                auth_id, self.OWNER_EMAIL, [self.modifiable_new_user_data]
            )

    def test_has_not_fully_registered_for_guest_user_is_false(
        self
    ) -> None:
        self.assertFalse(user_services.has_fully_registered_account(
            'non_existing_user'
        ))

    def test_create_new_user_with_existing_auth_id_raises_error(self) -> None:
        user_id = self.user_settings.user_id
        user_auth_id = auth_services.get_auth_id_from_user_id(user_id)
        with self.assertRaisesRegex(
            Exception, 'User %s already exists for auth_id %s.'
            % (user_id, user_auth_id)
        ):
            # Ruling out the possibility of None for mypy type checking.
            assert user_auth_id is not None
            user_services.create_new_user(user_auth_id, self.OWNER_EMAIL)

    def test_cannot_set_existing_username(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Sorry, the username \"%s\" is already taken! Please pick '
            'a different one.' % self.OWNER_USERNAME
        ):
            user_services.set_username(self.owner_id, self.OWNER_USERNAME)

    def test_cannot_add_user_role_with_invalid_role(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Role invalid_role does not exist.'
        ):
            user_services.add_user_role(self.owner_id, 'invalid_role')

    def test_cannot_get_human_readable_user_ids_with_invalid_user_ids(
        self
    ) -> None:
        observed_log_messages = []

        # Here, args can take any non-keyword argument.
        def _mock_logging_function(msg: str, *args: str) -> None:
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        assert_raises_user_not_found = self.assertRaisesRegex(
            Exception, 'User not found.')

        with logging_swap, assert_raises_user_not_found:
            user_services.get_human_readable_user_ids(['invalid_user_id'])

        self.assertEqual(
            observed_log_messages,
            [
                'User id invalid_user_id not known in list of user_ids '
                '[\'invalid_user_id\']'
            ])

    def test_get_human_readable_user_ids(self) -> None:
        # Create an unregistered user who has no username.
        user_models.UserSettingsModel(
            id='unregistered_user_id',
            email='user@example.com',
            username=''
        ).put()

        user_ids = user_services.get_human_readable_user_ids(
            [self.owner_id, feconf.SYSTEM_COMMITTER_ID, 'unregistered_user_id'])
        expected_user_ids = [
            'owner', 'admin',
            '[Awaiting user registration: u..@example.com]']

        self.assertEqual(user_ids, expected_user_ids)

    def test_get_human_readable_user_ids_with_nonexistent_id_non_strict_passes(
        self
    ) -> None:
        user_id = user_services.create_new_user(
            'auth_id', 'user@example.com').user_id
        user_services.set_username(user_id, 'username')
        user_services.mark_user_for_deletion(user_id)
        human_readable_user_ids = user_services.get_human_readable_user_ids(
            [user_id], strict=False)

        self.assertEqual(
            human_readable_user_ids,
            [user_services.LABEL_FOR_USER_BEING_DELETED])

    def test_created_on_gets_updated_correctly(self) -> None:
        # created_on should not be updated upon updating other attributes of
        # the user settings model.
        user_settings = user_services.create_new_user(
            'auth_id', 'user@example.com')

        user_settings_model = user_models.UserSettingsModel.get_by_id(
            user_settings.user_id)
        time_of_creation = user_settings_model.created_on

        user_services.update_user_bio(user_settings.user_id, 'New bio.')

        user_settings_model = user_models.UserSettingsModel.get_by_id(
            user_settings.user_id)
        self.assertEqual(user_settings_model.created_on, time_of_creation)


class UserContributionsTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_contributions = user_services.get_user_contributions(
            self.owner_id, strict=True
        )
        self.user_contributions.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_str_user_id(self) -> None:
        self.user_contributions.user_id = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected user_id to be a string'):
            self.user_contributions.validate()

    def test_validate_user_id(self) -> None:
        self.user_contributions.user_id = ''
        with self.assertRaisesRegex(Exception, 'No user id specified.'):
            self.user_contributions.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_list_created_exploration_ids(self) -> None:
        self.user_contributions.created_exploration_ids = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected created_exploration_ids to be a list'):
            self.user_contributions.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_created_exploration_ids(self) -> None:
        self.user_contributions.created_exploration_ids = [0]  # type: ignore[list-item]
        with self.assertRaisesRegex(
            Exception, 'Expected exploration_id in created_exploration_ids '
            'to be a string'):
            self.user_contributions.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_non_list_edited_exploration_ids(self) -> None:
        self.user_contributions.edited_exploration_ids = 0  # type: ignore[assignment]
        with self.assertRaisesRegex(
            Exception, 'Expected edited_exploration_ids to be a list'):
            self.user_contributions.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_validate_edited_exploration_ids(self) -> None:
        self.user_contributions.edited_exploration_ids = [0]  # type: ignore[list-item]
        with self.assertRaisesRegex(
            Exception, 'Expected exploration_id in edited_exploration_ids '
            'to be a string'):
            self.user_contributions.validate()

    def test_cannot_create_user_contributions_with_migration_bot(
        self
    ) -> None:
        self.assertIsNone(
            user_services.create_user_contributions(
                feconf.MIGRATION_BOT_USER_ID, [], []))

    def test_update_user_contributions(self) -> None:
        user_services.update_user_contributions(self.owner_id, ['e1'], ['e2'])

        contributions = user_services.get_user_contributions(
            self.owner_id, strict=True
        )
        self.assertEqual(contributions.user_id, self.owner_id)
        self.assertEqual(contributions.created_exploration_ids, ['e1'])
        self.assertEqual(contributions.edited_exploration_ids, ['e2'])

    def test_cannot_create_user_contributions_with_existing_user_id(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'User contributions model for user %s already exists.'
            % self.owner_id):
            user_services.create_user_contributions(self.owner_id, [], [])

    def test_cannot_update_user_contributions_with_invalid_user_id(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'User contributions model for user invalid_user_id does not exist'):
            user_services.update_user_contributions('invalid_user_id', [], [])

    def test_cannot_update_dashboard_stats_log_with_invalid_schema_version(
        self
    ) -> None:
        model = user_models.UserStatsModel.get_or_create(self.owner_id)
        model.schema_version = 0
        model.update_timestamps()
        model.put()

        self.assertIsNone(user_services.get_user_impact_score(self.owner_id))
        with self.assertRaisesRegex(
            Exception,
            'Sorry, we can only process v1-v%d dashboard stats schemas at '
            'present.' % feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION):
            user_services.update_dashboard_stats_log(self.owner_id)


class UserGlobalPrefsTests(test_utils.GenericTestBase):
    """Test domain object for user global email preferences."""

    def test_initialization(self) -> None:
        """Testing init method."""
        user_global_prefs = (user_domain.UserGlobalPrefs(
            True, False, True, False))

        self.assertTrue(user_global_prefs.can_receive_email_updates)
        self.assertFalse(user_global_prefs.can_receive_editor_role_email)
        self.assertTrue(user_global_prefs.can_receive_feedback_message_email)
        self.assertFalse(user_global_prefs.can_receive_subscription_email)

    def test_create_default_prefs(self) -> None:
        """Testing create_default_prefs."""
        default_user_global_prefs = (
            user_domain.UserGlobalPrefs.create_default_prefs())

        self.assertEqual(
            default_user_global_prefs.can_receive_email_updates,
            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE)
        self.assertEqual(
            default_user_global_prefs.can_receive_editor_role_email,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
        self.assertEqual(
            default_user_global_prefs.can_receive_feedback_message_email,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)
        self.assertEqual(
            default_user_global_prefs.can_receive_subscription_email,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)


class UserExplorationPrefsTests(test_utils.GenericTestBase):
    """Test domain object for user exploration email preferences."""

    def test_initialization(self) -> None:
        """Testing init method."""
        user_exp_prefs = (user_domain.UserExplorationPrefs(
            False, True))

        mute_feedback_notifications = (
            user_exp_prefs.mute_feedback_notifications)
        mute_suggestion_notifications = (
            user_exp_prefs.mute_suggestion_notifications)

        self.assertFalse(mute_feedback_notifications)
        self.assertTrue(mute_suggestion_notifications)

    def test_create_default_prefs(self) -> None:
        """Testing create_default_prefs."""
        default_user_exp_prefs = (
            user_domain.UserExplorationPrefs.create_default_prefs())

        self.assertEqual(
            default_user_exp_prefs.mute_feedback_notifications,
            feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE)
        self.assertEqual(
            default_user_exp_prefs.mute_suggestion_notifications,
            feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)

    def test_to_dict(self) -> None:
        """Testing to_dict."""
        user_exp_prefs = (user_domain.UserExplorationPrefs(
            False, True))
        default_user_global_prefs = (
            user_domain.UserExplorationPrefs.create_default_prefs())

        test_dict = user_exp_prefs.to_dict()
        default_dict = default_user_global_prefs.to_dict()

        self.assertEqual(
            test_dict,
            {
                'mute_feedback_notifications': False,
                'mute_suggestion_notifications': True
            }
        )
        self.assertEqual(
            default_dict,
            {
                'mute_feedback_notifications':
                feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE,
                'mute_suggestion_notifications':
                feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE
            }
        )


class ExpUserLastPlaythroughTests(test_utils.GenericTestBase):
    """Testing domain object for an exploration last playthrough model."""

    def test_initialization(self) -> None:
        """Testing init method."""
        current_time = datetime.datetime.utcnow()
        exp_last_playthrough = (user_domain.ExpUserLastPlaythrough(
            'user_id0', 'exp_id0', 0, current_time, 'state0'))
        self.assertEqual(
            exp_last_playthrough.id, 'user_id0.exp_id0')
        self.assertEqual(
            exp_last_playthrough.user_id, 'user_id0')
        self.assertEqual(
            exp_last_playthrough.exploration_id, 'exp_id0')
        self.assertEqual(
            exp_last_playthrough.last_played_exp_version, 0)
        self.assertEqual(
            exp_last_playthrough.last_updated, current_time)
        self.assertEqual(
            exp_last_playthrough.last_played_state_name, 'state0')

    def test_update_last_played_information(self) -> None:
        """Testing update_last_played_information."""
        current_time = datetime.datetime.utcnow()
        exp_last_playthrough = (user_domain.ExpUserLastPlaythrough(
            'user_id0', 'exp_id0', 0, current_time, 'state0'))

        self.assertEqual(
            exp_last_playthrough.last_played_exp_version, 0)

        self.assertEqual(
            exp_last_playthrough.last_played_state_name, 'state0')

        exp_last_playthrough.update_last_played_information(1, 'state1')
        self.assertEqual(
            exp_last_playthrough.last_played_exp_version, 1)
        self.assertEqual(
            exp_last_playthrough.last_played_state_name, 'state1')


class IncompleteActivitiesTests(test_utils.GenericTestBase):
    """Testing domain object for incomplete activities model."""

    def test_initialization(self) -> None:
        """Testing init method."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertEqual(incomplete_activities.id, 'user_id0')
        self.assertListEqual(
            incomplete_activities.exploration_ids, ['exp_id0'])
        self.assertListEqual(
            incomplete_activities.collection_ids, ['collect_id0'])
        self.assertListEqual(
            incomplete_activities.story_ids, ['story_id0'])
        self.assertListEqual(
            incomplete_activities.partially_learnt_topic_ids, ['topic_id0'])

    def test_add_exploration_id(self) -> None:
        """Testing add_exploration_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            incomplete_activities.exploration_ids, ['exp_id0'])

        incomplete_activities.add_exploration_id('exp_id1')

        self.assertListEqual(
            incomplete_activities.exploration_ids,
            ['exp_id0', 'exp_id1'])

    def test_remove_exploration_id(self) -> None:
        """Testing remove_exploration_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            incomplete_activities.exploration_ids, ['exp_id0'])

        incomplete_activities.remove_exploration_id('exp_id0')

        self.assertListEqual(
            incomplete_activities.exploration_ids, [])

    def test_add_collection_id(self) -> None:
        """Testing add_collection_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            incomplete_activities.collection_ids, ['collect_id0'])

        incomplete_activities.add_collection_id('collect_id1')

        self.assertListEqual(
            incomplete_activities.collection_ids,
            ['collect_id0', 'collect_id1'])

    def test_remove_collection_id(self) -> None:
        """Testing remove_collection_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            incomplete_activities.collection_ids, ['collect_id0'])

        incomplete_activities.remove_collection_id('collect_id0')

        self.assertListEqual(
            incomplete_activities.collection_ids, [])

    def test_add_story_id(self) -> None:
        """Testing add_story_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            incomplete_activities.story_ids, ['story_id0'])

        incomplete_activities.add_story_id('story_id1')

        self.assertListEqual(
            incomplete_activities.story_ids,
            ['story_id0', 'story_id1'])

    def test_remove_story_id(self) -> None:
        """Testing remove_story_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            incomplete_activities.story_ids, ['story_id0'])

        incomplete_activities.remove_story_id('story_id0')

        self.assertListEqual(
            incomplete_activities.story_ids, [])

    def test_add_partially_learnt_topic_id(self) -> None:
        """Testing add_partially_learnt_topic_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            incomplete_activities.partially_learnt_topic_ids, ['topic_id0'])

        incomplete_activities.add_partially_learnt_topic_id('topic_id1')

        self.assertListEqual(
            incomplete_activities.partially_learnt_topic_ids,
            ['topic_id0', 'topic_id1'])

    def test_remove_partially_learnt_topic_id(self) -> None:
        """Testing remove_partially_learnt_topic_id."""
        incomplete_activities = (user_domain.IncompleteActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            incomplete_activities.partially_learnt_topic_ids, ['topic_id0'])

        incomplete_activities.remove_partially_learnt_topic_id('topic_id0')

        self.assertListEqual(
            incomplete_activities.partially_learnt_topic_ids, [])


class CompletedActivitiesTests(test_utils.GenericTestBase):
    """Testing domain object for the activities completed."""

    def test_initialization(self) -> None:
        """Testing init method."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertEqual('user_id0', completed_activities.id)
        self.assertListEqual(
            completed_activities.exploration_ids, ['exp_id0'])
        self.assertListEqual(
            completed_activities.collection_ids, ['collect_id0'])
        self.assertListEqual(
            completed_activities.story_ids, ['story_id0'])
        self.assertListEqual(
            completed_activities.learnt_topic_ids, ['topic_id0'])

    def test_add_exploration_id(self) -> None:
        """Testing add_exploration_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            completed_activities.exploration_ids, ['exp_id0'])

        completed_activities.add_exploration_id('exp_id1')

        self.assertListEqual(
            completed_activities.exploration_ids,
            ['exp_id0', 'exp_id1'])

    def test_remove_exploration_id(self) -> None:
        """Testing remove_exploration_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            completed_activities.exploration_ids, ['exp_id0'])

        completed_activities.remove_exploration_id('exp_id0')

        self.assertListEqual(
            completed_activities.exploration_ids, [])

    def test_add_collection_id(self) -> None:
        """Testing add_collection_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            completed_activities.collection_ids, ['collect_id0'])

        completed_activities.add_collection_id('collect_id1')

        self.assertListEqual(
            completed_activities.collection_ids,
            ['collect_id0', 'collect_id1'])

    def test_remove_collection_id(self) -> None:
        """Testing remove_collection_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            completed_activities.collection_ids, ['collect_id0'])

        completed_activities.remove_collection_id('collect_id0')

        self.assertListEqual(
            completed_activities.collection_ids, [])

    def test_add_story_id(self) -> None:
        """Testing add_story_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            completed_activities.story_ids, ['story_id0'])

        completed_activities.add_story_id('story_id1')

        self.assertListEqual(
            completed_activities.story_ids,
            ['story_id0', 'story_id1'])

    def test_remove_story_id(self) -> None:
        """Testing remove_story_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            completed_activities.story_ids, ['story_id0'])

        completed_activities.remove_story_id('story_id0')

        self.assertListEqual(
            completed_activities.story_ids, [])

    def test_add_learnt_topic_id(self) -> None:
        """Testing add_learnt_topic_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            completed_activities.learnt_topic_ids, ['topic_id0'])

        completed_activities.add_learnt_topic_id('topic_id1')

        self.assertListEqual(
            completed_activities.learnt_topic_ids,
            ['topic_id0', 'topic_id1'])

    def test_remove_learnt_topic_id(self) -> None:
        """Testing remove_learnt_topic_id."""
        completed_activities = (user_domain.CompletedActivities(
            'user_id0', ['exp_id0'], ['collect_id0'], ['story_id0'],
            ['topic_id0']))

        self.assertListEqual(
            completed_activities.learnt_topic_ids, ['topic_id0'])

        completed_activities.remove_learnt_topic_id('topic_id0')

        self.assertListEqual(
            completed_activities.learnt_topic_ids, [])


class LearnerGoalsTests(test_utils.GenericTestBase):
    """Testing domain object for learner goals model."""

    def test_initialization(self) -> None:
        """Testing init method."""
        learner_goals = (
            user_domain.LearnerGoals('user_id0', ['topic_id0'], []))

        self.assertListEqual(
            learner_goals.topic_ids_to_learn, ['topic_id0'])

    def test_add_topic_id_to_learn(self) -> None:
        """Testing add_topic_id_to_learn."""
        learner_goals = (
            user_domain.LearnerGoals('user_id0', ['topic_id0'], []))

        self.assertListEqual(
            learner_goals.topic_ids_to_learn, ['topic_id0'])

        learner_goals.add_topic_id_to_learn('topic_id1')

        self.assertListEqual(
            learner_goals.topic_ids_to_learn, ['topic_id0', 'topic_id1'])

    def test_remove_topic_id_to_learn(self) -> None:
        """Testing remove_topic_id_to_learn."""
        learner_goals = (
            user_domain.LearnerGoals('user_id0', ['topic_id0'], []))

        self.assertListEqual(
            learner_goals.topic_ids_to_learn, ['topic_id0'])

        learner_goals.remove_topic_id_from_learn('topic_id0')

        self.assertListEqual(
            learner_goals.topic_ids_to_learn, [])


class LearnerPlaylistTests(test_utils.GenericTestBase):
    """Testing domain object for the learner playlist."""

    def test_initialization(self) -> None:
        """Testing init method."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertEqual(learner_playlist.id, 'user_id0')
        self.assertListEqual(
            learner_playlist.exploration_ids, ['exp_id0'])
        self.assertListEqual(
            learner_playlist.collection_ids, ['collect_id0'])

    def test_insert_exploration_id_at_given_position(self) -> None:
        """Testing inserting the given exploration id at the given position."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.exploration_ids, ['exp_id0'])

        learner_playlist.insert_exploration_id_at_given_position(
            'exp_id1', 1)
        learner_playlist.insert_exploration_id_at_given_position(
            'exp_id2', 1)

        self.assertListEqual(
            learner_playlist.exploration_ids,
            ['exp_id0', 'exp_id2', 'exp_id1'])

    def test_add_exploration_id_to_list(self) -> None:
        """Testing add_exploration_id_to_list."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.exploration_ids, ['exp_id0'])

        learner_playlist.add_exploration_id_to_list('exp_id1')

        self.assertListEqual(
            learner_playlist.exploration_ids, ['exp_id0', 'exp_id1'])

    def test_insert_collection_id_at_given_position(self) -> None:
        """Testing insert_exploration_id_at_given_position."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.collection_ids, ['collect_id0'])

        learner_playlist.insert_collection_id_at_given_position(
            'collect_id1', 1)
        learner_playlist.insert_collection_id_at_given_position(
            'collect_id2', 1)

        self.assertListEqual(
            learner_playlist.collection_ids,
            ['collect_id0', 'collect_id2', 'collect_id1'])

    def test_add_collection_id_list(self) -> None:
        """Testing add_collection_id."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.collection_ids, ['collect_id0'])

        learner_playlist.add_collection_id_to_list('collect_id1')

        self.assertListEqual(
            learner_playlist.collection_ids,
            ['collect_id0', 'collect_id1'])

    def test_remove_exploration_id(self) -> None:
        """Testing remove_exploration_id."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.exploration_ids, ['exp_id0'])

        learner_playlist.remove_exploration_id('exp_id0')

        self.assertListEqual(
            learner_playlist.exploration_ids, [])

    def test_remove_collection_id(self) -> None:
        """Testing remove_collection_id."""
        learner_playlist = (user_domain.LearnerPlaylist(
            'user_id0', ['exp_id0'], ['collect_id0']))

        self.assertListEqual(
            learner_playlist.collection_ids, ['collect_id0'])

        learner_playlist.remove_collection_id('collect_id0')

        self.assertListEqual(
            learner_playlist.collection_ids, [])


class UserContributionProficiencyTests(test_utils.GenericTestBase):
    """Testing domain object for user contribution scoring model."""

    def setUp(self) -> None:
        super().setUp()
        self.user_proficiency = user_domain.UserContributionProficiency(
            'user_id0', 'category0', 0, False)

    def test_initialization(self) -> None:
        """Testing init method."""
        self.assertEqual(self.user_proficiency.user_id, 'user_id0')
        self.assertEqual(
            self.user_proficiency.score_category, 'category0')
        self.assertEqual(self.user_proficiency.score, 0)
        self.assertEqual(
            self.user_proficiency.onboarding_email_sent, False)

    def test_increment_score(self) -> None:
        self.assertEqual(self.user_proficiency.score, 0)

        self.user_proficiency.increment_score(4)
        self.assertEqual(self.user_proficiency.score, 4)

        self.user_proficiency.increment_score(-3)
        self.assertEqual(self.user_proficiency.score, 1)

    def test_can_user_review_category(self) -> None:
        self.assertEqual(self.user_proficiency.score, 0)
        self.assertFalse(self.user_proficiency.can_user_review_category())

        self.user_proficiency.increment_score(
            feconf.MINIMUM_SCORE_REQUIRED_TO_REVIEW)

        self.assertTrue(self.user_proficiency.can_user_review_category())

    def test_mark_onboarding_email_as_sent(self) -> None:
        self.assertFalse(self.user_proficiency.onboarding_email_sent)

        self.user_proficiency.mark_onboarding_email_as_sent()

        self.assertTrue(self.user_proficiency.onboarding_email_sent)


class UserContributionRightsTests(test_utils.GenericTestBase):
    """Testing UserContributionRights domain object."""

    def setUp(self) -> None:
        super().setUp()
        self.user_contribution_rights = user_domain.UserContributionRights(
            'user_id', ['hi'], [], True, False)

    def test_initialization(self) -> None:
        """Testing init method."""

        self.assertEqual(self.user_contribution_rights.id, 'user_id')
        self.assertEqual(
            self.user_contribution_rights
            .can_review_translation_for_language_codes, ['hi'])
        self.assertEqual(
            self.user_contribution_rights
            .can_review_voiceover_for_language_codes,
            [])
        self.assertEqual(
            self.user_contribution_rights.can_review_questions, True)

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_can_review_translation_for_language_codes_incorrect_type(
        self
    ) -> None:
        # To avoid pylint's line-too-long error, new variable is created here.
        user_contribution_rights = self.user_contribution_rights
        user_contribution_rights.can_review_translation_for_language_codes = 5  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected can_review_translation_for_language_codes to be a list'):
            self.user_contribution_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_can_review_voiceover_for_language_codes_incorrect_type(
        self
    ) -> None:
        # To avoid pylint's line-too-long error, new variable is created here.
        user_contribution_rights = self.user_contribution_rights
        user_contribution_rights.can_review_voiceover_for_language_codes = 5  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected can_review_voiceover_for_language_codes to be a list'):
            self.user_contribution_rights.validate()

    def test_incorrect_language_code_for_voiceover_raise_error(self) -> None:
        self.user_contribution_rights.can_review_voiceover_for_language_codes = [ # pylint: disable=line-too-long
            'invalid_lang_code']
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid language_code: invalid_lang_code'):
            self.user_contribution_rights.validate()

    def test_incorrect_language_code_for_translation_raise_error(self) -> None:
        self.user_contribution_rights.can_review_translation_for_language_codes = [ # pylint: disable=line-too-long
            'invalid_lang_code']
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid language_code: invalid_lang_code'):
            self.user_contribution_rights.validate()

    def test_can_review_voiceover_for_language_codes_with_duplicate_values(
        self
    ) -> None:
        self.user_contribution_rights.can_review_voiceover_for_language_codes = [ # pylint: disable=line-too-long
            'hi']
        self.user_contribution_rights.validate()

        self.user_contribution_rights.can_review_voiceover_for_language_codes = [ # pylint: disable=line-too-long
            'hi', 'hi']
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected can_review_voiceover_for_language_codes list not to have '
            'duplicate values'):
            self.user_contribution_rights.validate()

    def test_can_review_translation_for_language_codes_with_duplicate_values(
        self
    ) -> None:
        self.user_contribution_rights.can_review_translation_for_language_codes = [ # pylint: disable=line-too-long
            'hi']
        self.user_contribution_rights.validate()

        self.user_contribution_rights.can_review_translation_for_language_codes = [ # pylint: disable=line-too-long
            'hi', 'hi']
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected can_review_translation_for_language_codes list not to '
            'have duplicate values'):
            self.user_contribution_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_incorrect_type_for_can_review_questions_raise_error(self) -> None:
        self.user_contribution_rights.can_review_questions = 5  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected can_review_questions to be a boolean value'):
            self.user_contribution_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type the
    # codebase we plan to get rid of the tests that intentionally test wrong
    # inputs that we can normally catch by typing.
    def test_incorrect_type_for_can_submit_questions_raise_error(self) -> None:
        self.user_contribution_rights.can_submit_questions = 5  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected can_submit_questions to be a boolean value'):
            self.user_contribution_rights.validate()


class ModifiableUserDataTests(test_utils.GenericTestBase):
    """Testing domain object for modifiable user data."""

    def test_initialization_with_none_user_id_is_successful(self) -> None:
        """Testing init method user id set None."""
        user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '123',
            'preferred_language_codes': ['preferred_language_codes'],
            'preferred_site_language_code': 'preferred_site_language_code',
            'preferred_audio_language_code': 'preferred_audio_language_code',
            'preferred_translation_language_code': (
                'preferred_translation_language_code'),
            'user_id': None,
        }
        modifiable_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict)
        )

        self.assertEqual(
            modifiable_user_data.display_alias, 'display_alias')
        self.assertEqual(modifiable_user_data.pin, '123')
        self.assertEqual(
            modifiable_user_data.preferred_language_codes,
            ['preferred_language_codes']
        )
        self.assertEqual(
            modifiable_user_data.preferred_site_language_code,
            'preferred_site_language_code'
        )
        self.assertEqual(
            modifiable_user_data.preferred_audio_language_code,
            'preferred_audio_language_code'
        )
        self.assertEqual(
            modifiable_user_data.preferred_translation_language_code,
            'preferred_translation_language_code'
        )
        self.assertIsNone(modifiable_user_data.user_id)

    def test_initialization_with_valid_user_id_is_successful(self) -> None:
        """Testing init method with a valid user id set."""
        user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '123',
            'preferred_language_codes': ['preferred_language_codes'],
            'preferred_site_language_code': 'preferred_site_language_code',
            'preferred_audio_language_code': 'preferred_audio_language_code',
            'preferred_translation_language_code': (
                'preferred_translation_language_code'),
            'user_id': 'user_id',
        }
        modifiable_user_data = (
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict)
        )

        self.assertEqual(
            modifiable_user_data.display_alias, 'display_alias')
        self.assertEqual(modifiable_user_data.pin, '123')
        self.assertEqual(
            modifiable_user_data.preferred_language_codes,
            ['preferred_language_codes']
        )
        self.assertEqual(
            modifiable_user_data.preferred_site_language_code,
            'preferred_site_language_code'
        )
        self.assertEqual(
            modifiable_user_data.preferred_audio_language_code,
            'preferred_audio_language_code'
        )
        self.assertEqual(
            modifiable_user_data.preferred_translation_language_code,
            'preferred_translation_language_code'
        )
        self.assertEqual(modifiable_user_data.user_id, 'user_id')

    def test_from_raw_dict_with_none_schema_version_raises_error(
        self
    ) -> None:
        # Here we use MyPy ignore because schema_version is expecting an int
        # type but for test purposes we're assigning it with None. Thus to
        # avoid MyPy error, ignore statement is added here.
        user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': None,  # type: ignore[typeddict-item]
            'display_alias': 'display_alias',
            'pin': '123',
            'preferred_language_codes': ['preferred_language_codes'],
            'preferred_site_language_code': 'preferred_site_language_code',
            'preferred_audio_language_code': 'preferred_audio_language_code',
            'preferred_translation_language_code': (
                'preferred_translation_language_code'),
            'user_id': 'user_id',
        }
        error_msg = 'Invalid modifiable user data: no schema version specified.'
        with self.assertRaisesRegex(Exception, error_msg):
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict)

    def test_from_raw_dict_with_invalid_schema_version_raises_error(
        self
    ) -> None:
        user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '123',
            'preferred_language_codes': ['preferred_language_codes'],
            'preferred_site_language_code': 'preferred_site_language_code',
            'preferred_audio_language_code': 'preferred_audio_language_code',
            'preferred_translation_language_code': (
                'preferred_translation_language_code'),
            'user_id': 'user_id',
        }
        current_version_plus_one = (
            user_domain.ModifiableUserData.CURRENT_SCHEMA_VERSION + 1)
        invalid_schema_versions = (
            -1, 0, current_version_plus_one
        )
        for version in invalid_schema_versions:
            user_data_dict['schema_version'] = version
            error_msg = 'Invalid version %s received.' % version
            with self.assertRaisesRegex(Exception, error_msg):
                user_domain.ModifiableUserData.from_raw_dict(user_data_dict)

    def test_from_raw_dict_with_invalid_schema_version_type_raises_error(
        self
    ) -> None:
        user_data_dict: user_domain.RawUserDataDict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '123',
            'preferred_language_codes': ['preferred_language_codes'],
            'preferred_site_language_code': 'preferred_site_language_code',
            'preferred_audio_language_code': 'preferred_audio_language_code',
            'preferred_translation_language_code': (
                'preferred_translation_language_code'),
            'user_id': 'user_id',
        }
        # TODO(#13059): Here we use MyPy ignore because after we fully type the
        # codebase we plan to get rid of the tests that intentionally test wrong
        # inputs that we can normally catch by typing.
        version = '-1'
        user_data_dict['schema_version'] = version  # type: ignore[arg-type]
        error_msg = (
            'Version has invalid type, expected int, '
            'received %s' % type(version)
        )
        with self.assertRaisesRegex(Exception, error_msg):
            user_domain.ModifiableUserData.from_raw_dict(user_data_dict)

    # This test should be modified to use the original class ModifiableUserData
    # itself when the CURRENT_SCHEMA_VERSION has been updated to 2 or higher.
    def test_mock_modifiable_user_data_class_with_all_attributes_given(
        self
    ) -> None:
        user_data_dict: MockModifiableUserDataDict = {
            'schema_version': 2,
            'display_alias': 'name',
            'pin': '123',
            'preferred_language_codes': ['en', 'es'],
            'preferred_site_language_code': 'es',
            'preferred_audio_language_code': 'en',
            'preferred_translation_language_code': 'en',
            'user_id': None,
            'fake_field': 'set_value'
        }
        modifiable_user_data = (
            MockModifiableUserData.from_raw_dict(user_data_dict))
        self.assertEqual(modifiable_user_data.display_alias, 'name')
        self.assertEqual(modifiable_user_data.pin, '123')
        self.assertEqual(
            modifiable_user_data.preferred_language_codes, ['en', 'es'])
        self.assertEqual(
            modifiable_user_data.preferred_site_language_code, 'es')
        self.assertEqual(
            modifiable_user_data.preferred_audio_language_code, 'en')
        self.assertEqual(
            modifiable_user_data.preferred_translation_language_code, 'en')
        self.assertEqual(modifiable_user_data.fake_field, 'set_value')
        self.assertEqual(modifiable_user_data.user_id, None)

    # This test should be modified to use the original class ModifiableUserData
    # itself when the CURRENT_SCHEMA_VERSION has been updated to 2 or higher.
    def test_mock_migration_from_old_version_to_new_works_correctly(
        self
    ) -> None:
        user_data_dict: MockModifiableUserDataDict = {
            'schema_version': 1,
            'display_alias': 'name',
            'pin': '123',
            'preferred_language_codes': ['en', 'es'],
            'preferred_site_language_code': 'es',
            'preferred_audio_language_code': 'en',
            'preferred_translation_language_code': 'en',
            'user_id': None,
            'fake_field': None
        }
        modifiable_user_data = (
            MockModifiableUserData.from_raw_dict(user_data_dict))
        self.assertEqual(modifiable_user_data.display_alias, 'name')
        self.assertEqual(modifiable_user_data.pin, '123')
        self.assertEqual(
            modifiable_user_data.preferred_language_codes, ['en', 'es'])
        self.assertEqual(
            modifiable_user_data.preferred_site_language_code, 'es')
        self.assertEqual(
            modifiable_user_data.preferred_audio_language_code, 'en')
        self.assertEqual(
            modifiable_user_data.preferred_translation_language_code, 'en')
        self.assertEqual(modifiable_user_data.fake_field, 'default_value')
        self.assertEqual(modifiable_user_data.user_id, None)


class ExplorationUserDataTests(test_utils.GenericTestBase):
    """Tests for ExplorationUserData domain object."""

    def test_initialization(self) -> None:
        exploration_user_data = user_domain.ExplorationUserData(
            'user1', 'exp1')

        expected_exploration_user_data_dict = {
            'rating': None,
            'rated_on': None,
            'draft_change_list': None,
            'draft_change_list_last_updated': None,
            'draft_change_list_exp_version': None,
            'draft_change_list_id': 0,
            'mute_suggestion_notifications': (
                feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE),
            'mute_feedback_notifications': (
                feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE),
            'furthest_reached_checkpoint_exp_version': None,
            'furthest_reached_checkpoint_state_name': None,
            'most_recently_reached_checkpoint_state_name': None,
            'most_recently_reached_checkpoint_exp_version': None
        }

        self.assertEqual(exploration_user_data.user_id, 'user1')
        self.assertEqual(exploration_user_data.exploration_id, 'exp1')
        self.assertEqual(
            exploration_user_data.to_dict(),
            expected_exploration_user_data_dict)

    def test_to_dict(self) -> None:
        exploration_user_data = user_domain.ExplorationUserData(
            'user1', 'exp1', 4,
            datetime.datetime(2022, 4, 1, 0, 0, 0, 0), None,
            None, None, 0, False, False, 1, 'checkpoint2', 2, 'checkpoint1'
        )
        expected_exploration_user_data_dict = {
            'rating': 4,
            'rated_on': datetime.datetime(2022, 4, 1, 0, 0, 0, 0),
            'draft_change_list': None,
            'draft_change_list_last_updated': None,
            'draft_change_list_exp_version': None,
            'draft_change_list_id': 0,
            'mute_suggestion_notifications': False,
            'mute_feedback_notifications': False,
            'furthest_reached_checkpoint_exp_version': 1,
            'furthest_reached_checkpoint_state_name': 'checkpoint2',
            'most_recently_reached_checkpoint_exp_version': 2,
            'most_recently_reached_checkpoint_state_name': 'checkpoint1'
        }

        self.assertEqual(exploration_user_data.user_id, 'user1')
        self.assertEqual(exploration_user_data.exploration_id, 'exp1')
        self.assertEqual(
            exploration_user_data.to_dict(),
            expected_exploration_user_data_dict)


class LearnerGroupUserDetailsTests(test_utils.GenericTestBase):
    """Tests for LearnerGroupUserDetails domain object."""

    def test_initialization(self) -> None:
        learner_group_user_details = (
            user_domain.LearnerGroupUserDetails(
                'group_id_1', True))

        expected_learner_grp_user_details_dict = {
            'group_id': 'group_id_1',
            'progress_sharing_is_turned_on': True
        }

        self.assertEqual(
            learner_group_user_details.group_id, 'group_id_1')
        self.assertEqual(
            learner_group_user_details.progress_sharing_is_turned_on, True)
        self.assertEqual(
            learner_group_user_details.to_dict(),
            expected_learner_grp_user_details_dict)

    def test_to_dict(self) -> None:
        learner_group_user_details = (
            user_domain.LearnerGroupUserDetails(
                'group_id_1', True))
        expected_learner_grp_user_details_dict = {
            'group_id': 'group_id_1',
            'progress_sharing_is_turned_on': True
        }

        self.assertEqual(
            learner_group_user_details.to_dict(),
            expected_learner_grp_user_details_dict)


class LearnerGroupsUserTest(test_utils.GenericTestBase):
    """Tests for LearnerGroupsUser domain object."""

    def test_initialization(self) -> None:
        learner_group_user_details = (
            user_domain.LearnerGroupUserDetails(
                'group_id_1', False))
        learner_group_user = user_domain.LearnerGroupsUser(
            'user1', ['group_id_2', 'group_id_3'],
            [learner_group_user_details], 1)

        expected_learner_group_user_dict = {
            'user_id': 'user1',
            'invited_to_learner_groups_ids': ['group_id_2', 'group_id_3'],
            'learner_groups_user_details': [
                {
                    'group_id': 'group_id_1',
                    'progress_sharing_is_turned_on': False
                }
            ],
            'learner_groups_user_details_schema_version': 1
        }

        self.assertEqual(learner_group_user.user_id, 'user1')
        self.assertEqual(
            learner_group_user.invited_to_learner_groups_ids,
            ['group_id_2', 'group_id_3'])
        self.assertEqual(
            learner_group_user.learner_groups_user_details,
            [learner_group_user_details])
        self.assertEqual(
            learner_group_user.learner_groups_user_details_schema_version, 1)
        self.assertEqual(
            learner_group_user.to_dict(),
            expected_learner_group_user_dict)

    def test_to_dict(self) -> None:
        learner_group_user_details = (
            user_domain.LearnerGroupUserDetails('group_id_1', False))
        learner_group_user = user_domain.LearnerGroupsUser(
            'user1', ['group_id_2', 'group_id_3'],
            [learner_group_user_details], 1)

        expected_learner_group_user_dict = {
            'user_id': 'user1',
            'invited_to_learner_groups_ids': ['group_id_2', 'group_id_3'],
            'learner_groups_user_details': [
                {
                    'group_id': 'group_id_1',
                    'progress_sharing_is_turned_on': False
                }
            ],
            'learner_groups_user_details_schema_version': 1
        }

        self.assertEqual(
            learner_group_user.to_dict(),
            expected_learner_group_user_dict)

    def test_validation(self) -> None:
        learner_group_user_details = (
            user_domain.LearnerGroupUserDetails('group_id_1', True))

        self._assert_validation_error(
            user_domain.LearnerGroupsUser(
                'user1', ['group_id_1'], [learner_group_user_details], 1),
            'Learner cannot be invited to join learner group group_id_1 since '
            'they are already its learner.')
