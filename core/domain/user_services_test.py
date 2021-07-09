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

"""Unit tests for core.domain.user_services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import logging
import os

from constants import constants
from core.domain import auth_services
from core.domain import collection_services
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import suggestion_services
from core.domain import user_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

import requests_mock

auth_models, user_models = (
    models.Registry.import_models([models.NAMES.auth, models.NAMES.user]))
bulk_email_services = models.Registry.import_bulk_email_services()


class UserServicesUnitTests(test_utils.GenericTestBase):
    """Test the user services methods."""

    def setUp(self):
        super(UserServicesUnitTests, self).setUp()
        user_data_dict = {
            'schema_version': 1,
            'display_alias': 'display_alias',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'user_id': 'user_id',
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

    def test_set_and_get_username(self):
        auth_id = 'someUser'
        username = 'username'
        with self.assertRaisesRegexp(Exception, 'User not found.'):
            user_services.set_username(auth_id, username)

        user_settings = user_services.create_new_user(
            auth_id, 'user@example.com')

        user_services.set_username(user_settings.user_id, username)
        self.assertEqual(
            username, user_services.get_username(user_settings.user_id))

    def test_get_username_for_system_user(self):
        self.assertEqual(
            feconf.SYSTEM_COMMITTER_ID,
            user_services.get_username(feconf.SYSTEM_COMMITTER_ID))
        self.assertEqual(
            feconf.MIGRATION_BOT_USERNAME,
            user_services.get_username(feconf.MIGRATION_BOT_USER_ID))

    def test_get_username_for_pseudonymous_id(self):
        self.assertEqual(
            'User_Aaaaaaaa',
            user_services.get_username('pid_' + 'a' * 32))
        self.assertEqual(
            'User_Bbbbbbbb',
            user_services.get_username('pid_' + 'b' * 32))

    def test_get_usernames_for_pseudonymous_ids(self):

        # Handle usernames that exists.
        self.assertEqual(
            ['User_Aaaaaaaa', 'User_Bbbbbbbb'],
            user_services.get_usernames(['pid_' + 'a' * 32, 'pid_' + 'b' * 32]))

    def test_get_usernames_empty_list(self):
        # Return empty list when no user id passed.
        self.assertEqual([], user_services.get_usernames([]))

    def test_get_usernames_system_admin(self):
        # Check that system admin has correct username.
        self.assertEqual(
            [feconf.SYSTEM_COMMITTER_ID],
            user_services.get_usernames([feconf.SYSTEM_COMMITTER_ID]))

    def test_get_username_for_nonexistent_user(self):
        with self.assertRaisesRegexp(
            Exception,
            'User with ID \'fakeUser\' not found.'
        ):
            user_services.get_username('fakeUser')

    def test_get_username_for_user_being_deleted(self):
        auth_id = 'someUser'
        username = 'newUsername'
        user_id = user_services.create_new_user(
            auth_id, 'user@example.com'
        ).user_id
        user_services.set_username(user_id, username)

        user_services.mark_user_for_deletion(user_id)

        self.assertEqual(
            user_services.get_username(user_id),
            user_services.USERNAME_FOR_USER_BEING_DELETED)

    def test_get_username_none(self):
        user_id = user_services.create_new_user(
            'fakeUser', 'user@example.com').user_id
        self.assertEqual(None, user_services.get_username(user_id))

    def test_is_username_taken_false(self):
        self.assertFalse(user_services.is_username_taken('fakeUsername'))

    def test_is_username_taken_true(self):
        auth_id = 'someUser'
        username = 'newUsername'
        user_id = user_services.create_new_user(
            auth_id, 'user@example.com').user_id
        user_services.set_username(user_id, username)
        self.assertTrue(user_services.is_username_taken(username))

    def test_is_username_taken_different_case(self):
        auth_id = 'someUser'
        username = 'camelCase'
        user_id = user_services.create_new_user(
            auth_id, 'user@example.com').user_id
        user_services.set_username(user_id, username)
        self.assertTrue(user_services.is_username_taken('CaMeLcAsE'))

    def test_is_username_taken_when_user_marked_as_deleted_has_same_username(
            self):
        auth_id = 'someUser'
        username = 'camelCase'
        user_id = user_services.create_new_user(
            auth_id, 'user@example.com').user_id
        user_services.set_username(user_id, username)
        user_services.mark_user_for_deletion(user_id)
        self.assertTrue(user_services.is_username_taken(username))

    def test_is_username_taken_when_deleted_user_had_same_username(self):
        username = 'userName123'
        user_services.save_deleted_username(
            user_domain.UserSettings.normalize_username(username)
        )
        self.assertTrue(user_services.is_username_taken(username))

    def test_set_invalid_usernames(self):
        auth_id = 'someUser'
        user_id = user_services.create_new_user(
            auth_id, 'user@example.com').user_id
        bad_usernames_with_expected_error_message = [
            (' bob ', 'Usernames can only have alphanumeric characters.'),
            ('@', 'Usernames can only have alphanumeric characters.'),
            ('', 'Empty username supplied.'),
            ('a' * 100, 'A username can have at most 30 characters.'),
            ('ADMIN', 'This username is not available.'),
            ('admin', 'This username is not available.'),
            ('AdMiN2020', 'This username is not available.'),
            ('AbcOppiaMigrationBotXyz', 'This username is not available.'),
            ('OppiaMigrATIONBOTXyz', 'This username is not available.'),
            ('AbcOppiaSuggestionBotXyz', 'This username is not available.'),
            ('AAAOPPIASuggestionBotBBB', 'This username is not available.'),
            ('xyzOppia', 'This username is not available.'),
            ('oppiaXyz', 'This username is not available.'),
            ('abcOppiaXyz', 'This username is not available.')]
        for username, error_msg in bad_usernames_with_expected_error_message:
            with self.assertRaisesRegexp(utils.ValidationError, error_msg):
                user_services.set_username(user_id, username)

    def test_update_user_settings_for_invalid_display_alias_raises_error(self):
        auth_id = 'someUser'
        user_id = user_services.create_new_user(
            auth_id, 'user@example.com').user_id
        bad_display_aliases_with_expected_error = [
            ('', 'Expected display_alias to be a string, received .'),
            (0, 'Expected display_alias to be a string, received 0.'),
            (None, 'Expected display_alias to be a string, received None.')
        ]
        self.modifiable_new_user_data.user_id = user_id
        self.modifiable_new_user_data.pin = None
        for display_alias, error_msg in bad_display_aliases_with_expected_error:
            with self.assertRaisesRegexp(utils.ValidationError, error_msg):
                self.modifiable_new_user_data.display_alias = display_alias
                user_services.update_multiple_users_data(
                    [self.modifiable_new_user_data])

    def test_update_user_settings_valid_display_alias_set_successfully(self):
        auth_id = 'someUser'
        user_id = user_services.create_new_user(
            auth_id, 'user@example.com').user_id
        display_alias = 'Name'
        user_settings = user_services.get_user_settings(user_id)
        self.assertIsNone(user_settings.display_alias)
        self.modifiable_user_data.user_id = user_id
        self.modifiable_user_data.pin = None
        self.modifiable_user_data.display_alias = display_alias
        user_services.update_multiple_users_data([self.modifiable_user_data])
        user_settings = user_services.get_user_settings(user_id)
        self.assertEqual(user_settings.display_alias, display_alias)

    def test_create_new_user_with_invalid_emails_raises_exception(self):
        bad_email_addresses_with_expected_error_message = [
            ('@', 'Invalid email address: @'),
            ('@@', 'Invalid email address: @@'),
            ('abc', 'Invalid email address: abc'),
            ('', 'No user email specified.'),
            (None, 'Expected email to be a string, received None'),
            (
                ['a', '@', 'b.com'],
                r'Expected email to be a string, received '
                r'\[u\'a\', u\'@\', u\'b.com\'\]')]
        for email, error_msg in bad_email_addresses_with_expected_error_message:
            with self.assertRaisesRegexp(utils.ValidationError, error_msg):
                user_services.create_new_user('auth_id', email)

    def test_create_new_user_with_invalid_email_creates_no_user_models(self):
        bad_email = '@'
        error_msg = 'Invalid email address: @'
        with self.assertRaisesRegexp(utils.ValidationError, error_msg):
            user_services.create_new_user('auth_id', bad_email)
        tmp_admin_user_id = self.get_user_id_from_email(self.SUPER_ADMIN_EMAIL)
        user_ids_in_user_settings = [
            model.id for model in user_models.UserSettingsModel.get_all()]
        user_ids_in_user_auth_details = [
            model.id for model in auth_models.UserAuthDetailsModel.get_all()]
        user_ids_in_user_contributions = [
            model.id for model in user_models.UserContributionsModel.get_all()]
        self.assertEqual(user_ids_in_user_settings, [tmp_admin_user_id])
        self.assertEqual(user_ids_in_user_auth_details, [tmp_admin_user_id])
        self.assertEqual(user_ids_in_user_contributions, [tmp_admin_user_id])

    def test_email_truncation(self):
        email_addresses = [
            ('a@b.c', '..@b.c'),
            ('ab@c.d', 'a..@c.d'),
            ('abc@def.gh', 'a..@def.gh'),
            ('abcd@efg.h', 'a..@efg.h'),
            ('abcdefgh@efg.h', 'abcde..@efg.h'),
        ]
        for ind, (actual_email, expected_email) in enumerate(email_addresses):
            user_settings = user_services.create_new_user(
                python_utils.convert_to_bytes(ind), actual_email)
            self.assertEqual(user_settings.truncated_email, expected_email)

    def test_get_user_id_from_username(self):
        auth_id = 'someUser'
        username = 'username'
        user_email = 'user@example.com'

        user_settings = user_services.create_new_user(auth_id, user_email)
        user_services.set_username(user_settings.user_id, username)
        self.assertEqual(
            user_services.get_username(user_settings.user_id), username)

        # Handle usernames that exist.
        self.assertEqual(
            user_services.get_user_id_from_username(username),
            user_settings.user_id)

        # Handle usernames in the same equivalence class correctly.
        self.assertEqual(
            user_services.get_user_id_from_username('USERNAME'),
            user_settings.user_id)

        # Return None for usernames which don't exist.
        self.assertIsNone(
            user_services.get_user_id_from_username('fakeUsername'))

    def test_get_user_settings_by_auth_id_returns_user_settings(self):
        auth_id = 'auth_id'
        email = 'user@example.com'
        user_id = 'user_id'
        user_id = user_services.create_new_user(auth_id, email).user_id
        user_settings_model = user_models.UserSettingsModel.get_by_id(user_id)
        user_settings = user_services.get_user_settings_by_auth_id(auth_id)
        self.assertEqual(user_settings_model.id, user_settings.user_id)
        self.assertEqual(user_settings_model.email, user_settings.email)

    def test_get_user_settings_by_auth_id_for_nonexistent_auth_id_is_none(self):
        self.assertIsNone(
            user_services.get_user_settings_by_auth_id('auth_id_x'))

    def test_get_user_settings_by_auth_id_strict_returns_user_settings(self):
        auth_id = 'auth_id'
        email = 'user@example.com'
        user_id = user_services.create_new_user(auth_id, email).user_id
        user_settings_model = user_models.UserSettingsModel.get_by_id(
            user_id)
        user_settings = (
            user_services.get_user_settings_by_auth_id(auth_id, strict=True))
        self.assertEqual(user_settings_model.id, user_settings.user_id)
        self.assertEqual(user_settings_model.email, user_settings.email)

    def test_get_user_settings_by_auth_id_strict_for_missing_auth_id_is_none(
            self):
        with self.assertRaisesRegexp(Exception, 'User not found.'):
            user_services.get_user_settings_by_auth_id('auth_id_x', strict=True)

    def test_fetch_gravatar_success(self):
        user_email = 'user@example.com'
        gravatar_url = user_services.get_gravatar_url(user_email)

        expected_gravatar_filepath = os.path.join(
            self.get_static_asset_filepath(), 'assets', 'images', 'avatar',
            'gravatar_example.png')
        with python_utils.open_file(
            expected_gravatar_filepath, 'rb', encoding=None) as f:
            expected_gravatar = f.read()

        with requests_mock.Mocker() as requests_mocker:
            requests_mocker.get(gravatar_url, content=expected_gravatar)
            gravatar = user_services.fetch_gravatar(user_email)

        self.assertEqual(
            gravatar, utils.convert_png_to_data_url(expected_gravatar_filepath))

    def test_fetch_gravatar_failure_404(self):
        user_email = 'user@example.com'
        gravatar_url = user_services.get_gravatar_url(user_email)

        error_messages = []
        logging_mocker = self.swap(logging, 'error', error_messages.append)

        with logging_mocker, requests_mock.Mocker() as requests_mocker:
            requests_mocker.get(gravatar_url, status_code=404)
            gravatar = user_services.fetch_gravatar(user_email)

        self.assertEqual(
            error_messages,
            ['[Status 404] Failed to fetch Gravatar from %s' % gravatar_url])
        self.assertEqual(gravatar, user_services.DEFAULT_IDENTICON_DATA_URL)

    def test_fetch_gravatar_failure_exception(self):
        user_email = 'user@example.com'
        gravatar_url = user_services.get_gravatar_url(user_email)

        error_messages = []
        logging_mocker = self.swap(logging, 'exception', error_messages.append)

        with logging_mocker, requests_mock.Mocker() as requests_mocker:
            requests_mocker.get(gravatar_url, exc=Exception)
            gravatar = user_services.fetch_gravatar(user_email)

        self.assertEqual(
            error_messages, ['Failed to fetch Gravatar from %s' % gravatar_url])
        self.assertEqual(gravatar, user_services.DEFAULT_IDENTICON_DATA_URL)

    def test_default_identicon_data_url(self):
        identicon_filepath = os.path.join(
            self.get_static_asset_filepath(), 'assets', 'images', 'avatar',
            'user_blue_72px.png')
        identicon_data_url = utils.convert_png_to_data_url(identicon_filepath)
        self.assertEqual(
            identicon_data_url, user_services.DEFAULT_IDENTICON_DATA_URL)

    def test_set_and_get_user_email_preferences(self):
        auth_id = 'someUser'
        username = 'username'
        user_email = 'user@example.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)

        # When UserEmailPreferencesModel is yet to be created,
        # the value returned by get_email_preferences() should be True.
        email_preferences = user_services.get_email_preferences(user_id)
        self.assertEqual(
            email_preferences.can_receive_editor_role_email,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)

        email_preferences = user_services.get_email_preferences(user_id)
        self.assertEqual(
            email_preferences.can_receive_feedback_message_email,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)

        observed_log_messages = []
        def _mock_logging_function(msg, *args):
            """Mocks logging.info()."""
            observed_log_messages.append(msg % args)

        with self.swap(logging, 'info', _mock_logging_function):
            user_services.update_email_preferences(
                user_id, feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE,
                feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
                feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
                feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

        self.assertItemsEqual(
            observed_log_messages,
            ['Updated status of email ID %s\'s bulk email '
             'preference in the service provider\'s db to False. Cannot access '
             'API, since this is a dev environment.' % user_email])

        def _mock_add_or_update_user_status(_email, _can_receive_updates):
            """Mocks bulk_email_services.add_or_update_user_status()."""
            return False

        with self.swap(
            bulk_email_services, 'add_or_update_user_status',
            _mock_add_or_update_user_status):
            bulk_email_signup_message_should_be_shown = (
                user_services.update_email_preferences(
                    user_id, True, feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
                    feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
                    feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE))
            self.assertTrue(bulk_email_signup_message_should_be_shown)

        bulk_email_signup_message_should_be_shown = (
            user_services.update_email_preferences(
                user_id, True, feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
                feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
                feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE))
        self.assertFalse(bulk_email_signup_message_should_be_shown)

        email_preferences = user_services.get_email_preferences(user_id)
        self.assertEqual(
            email_preferences.can_receive_editor_role_email,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
        self.assertEqual(
            email_preferences.can_receive_feedback_message_email,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)

        user_services.update_email_preferences(
            user_id, feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE, False, False,
            False)

        email_preferences = user_services.get_email_preferences(user_id)

        self.assertFalse(email_preferences.can_receive_editor_role_email)
        self.assertFalse(email_preferences.can_receive_feedback_message_email)
        self.assertFalse(email_preferences.can_receive_subscription_email)

    def test_get_and_set_user_email_preferences_with_error(self):
        auth_id = 'someUser'
        username = 'username'
        user_email = 'user@example.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)
        user_services.update_email_preferences(
            user_id, feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)
        email_preferences = user_services.get_email_preferences(user_id)
        self.assertFalse(email_preferences.can_receive_email_updates)

        def _mock_add_or_update_user_status(_email, _can_receive_updates):
            """Mocks bulk_email_services.add_or_update_user_status().

            Raises:
                Exception. Mock exception - server error.
            """
            raise Exception('Server error')

        with self.swap(
            bulk_email_services, 'add_or_update_user_status',
            _mock_add_or_update_user_status):
            try:
                user_services.update_email_preferences(
                    user_id, True,
                    feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
                    feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
                    feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)
            except Exception:
                email_preferences = user_services.get_email_preferences(user_id)
                # 'can_receive_email_updates' should not be updated in this
                # case.
                self.assertFalse(email_preferences.can_receive_email_updates)

        user_services.update_email_preferences(
            user_id, True,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)
        email_preferences = user_services.get_email_preferences(user_id)
        self.assertTrue(email_preferences.can_receive_email_updates)

    def test_set_and_get_user_email_preferences_for_exploration(self):
        auth_id = 'someUser'
        exploration_id = 'someExploration'
        username = 'username'
        user_email = 'user@example.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)

        # When ExplorationUserDataModel is yet to be created, the value
        # of mute_feedback_notifications and mute_suggestion_notifications
        # should match the default values.
        exploration_user_model = (
            user_services.user_models.ExplorationUserDataModel.get(
                user_id, exploration_id))
        self.assertIsNone(exploration_user_model)
        email_preferences = user_services.get_email_preferences_for_exploration(
            user_id, exploration_id)
        self.assertEqual(
            email_preferences.mute_feedback_notifications,
            feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE)
        self.assertEqual(
            email_preferences.mute_suggestion_notifications,
            feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)

        # This initializes a ExplorationUserDataModel instance with
        # the default mute values.
        user_services.set_email_preferences_for_exploration(
            user_id, exploration_id,
            mute_feedback_notifications=(
                feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE),
            mute_suggestion_notifications=(
                feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE))

        email_preferences = user_services.get_email_preferences_for_exploration(
            user_id, exploration_id)
        self.assertEqual(
            email_preferences.mute_feedback_notifications,
            feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE)
        self.assertEqual(
            email_preferences.mute_suggestion_notifications,
            feconf.DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE)

        # This sets only mute_suggestion_notifications property to True.
        # mute_feedback_notifications should remain same as before.
        user_services.set_email_preferences_for_exploration(
            user_id, exploration_id, mute_suggestion_notifications=True)

        email_preferences = user_services.get_email_preferences_for_exploration(
            user_id, exploration_id)
        self.assertEqual(
            email_preferences.mute_feedback_notifications,
            feconf.DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE)
        self.assertTrue(email_preferences.mute_suggestion_notifications)

        # This sets only mute_feedback_notifications property to True.
        # mute_suggestion_notifications should remain same as before.
        user_services.set_email_preferences_for_exploration(
            user_id, exploration_id, mute_feedback_notifications=True)

        email_preferences = user_services.get_email_preferences_for_exploration(
            user_id, exploration_id)
        self.assertTrue(email_preferences.mute_feedback_notifications)
        self.assertTrue(email_preferences.mute_suggestion_notifications)

    def test_get_usernames_by_role(self):
        auth_ids = ['test1', 'test2', 'test3', 'test4']
        usernames = ['name1', 'name2', 'name3', 'name4']
        user_emails = [
            'test1@email.com', 'test2@email.com',
            'test3@email.com', 'test4@email.com']

        user_ids = []
        for auth_id, email, name in python_utils.ZIP(
                auth_ids, user_emails, usernames):
            user_id = user_services.create_new_user(auth_id, email).user_id
            user_ids.append(user_id)
            user_services.set_username(user_id, name)

        user_services.update_user_role(user_ids[0], feconf.ROLE_ID_MODERATOR)
        user_services.update_user_role(user_ids[1], feconf.ROLE_ID_MODERATOR)
        user_services.update_user_role(user_ids[2], feconf.ROLE_ID_BANNED_USER)
        user_services.update_user_role(user_ids[3], feconf.ROLE_ID_BANNED_USER)

        self.assertEqual(
            set(user_services.get_usernames_by_role(feconf.ROLE_ID_MODERATOR)),
            set(['name1', 'name2']))

        self.assertEqual(
            set(user_services.get_usernames_by_role(
                feconf.ROLE_ID_BANNED_USER)),
            set(['name3', 'name4']))

    def test_get_user_ids_by_role(self):
        auth_ids = ['test1', 'test2', 'test3', 'test4']
        usernames = ['name1', 'name2', 'name3', 'name4']
        user_emails = [
            'test1@email.com', 'test2@email.com',
            'test3@email.com', 'test4@email.com']

        user_ids = []
        for uid, email, name in python_utils.ZIP(
                auth_ids, user_emails, usernames):
            user_id = user_services.create_new_user(uid, email).user_id
            user_ids.append(user_id)
            user_services.set_username(user_id, name)

        user_services.update_user_role(user_ids[0], feconf.ROLE_ID_MODERATOR)
        user_services.update_user_role(user_ids[1], feconf.ROLE_ID_MODERATOR)
        user_services.update_user_role(user_ids[2], feconf.ROLE_ID_BANNED_USER)
        user_services.update_user_role(user_ids[3], feconf.ROLE_ID_BANNED_USER)

        self.assertEqual(
            set(user_services.get_user_ids_by_role(feconf.ROLE_ID_MODERATOR)),
            set([user_ids[0], user_ids[1]]))

        self.assertEqual(
            set(user_services.get_user_ids_by_role(
                feconf.ROLE_ID_BANNED_USER)),
            set([user_ids[2], user_ids[3]]))

    def test_update_user_creator_dashboard_display(self):
        auth_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)

        user_setting = user_services.get_user_settings(user_id)
        self.assertEqual(
            user_setting.creator_dashboard_display_pref,
            constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS['CARD'])

        user_services.update_user_creator_dashboard_display(
            user_id, constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS['LIST'])
        user_setting = user_services.get_user_settings(user_id)
        self.assertEqual(
            user_setting.creator_dashboard_display_pref,
            constants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS['LIST'])

    def test_update_user_role(self):
        auth_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)

        self.assertEqual(
            user_services.get_user_role_from_id(user_id),
            feconf.ROLE_ID_EXPLORATION_EDITOR)

        user_services.update_user_role(
            user_id, feconf.ROLE_ID_COLLECTION_EDITOR)
        self.assertEqual(
            user_services.get_user_role_from_id(user_id),
            feconf.ROLE_ID_COLLECTION_EDITOR)

    def test_remove_blog_editor(self):
        auth_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)

        self.assertEqual(
            user_services.get_user_role_from_id(user_id),
            feconf.ROLE_ID_EXPLORATION_EDITOR)
        user_services.update_user_role(
            user_id, feconf.ROLE_ID_BLOG_POST_EDITOR)
        self.assertEqual(
            user_services.get_user_role_from_id(user_id),
            feconf.ROLE_ID_BLOG_POST_EDITOR)

        user_services.remove_blog_editor(user_id)
        self.assertEqual(
            user_services.get_user_role_from_id(user_id),
            feconf.ROLE_ID_EXPLORATION_EDITOR)

    def test_adding_banned_role_to_user_also_updates_roles_and_banned_fields(
            self):
        auth_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)
        user_settings_model = user_models.UserSettingsModel.get_by_id(user_id)

        self.assertEqual(
            user_settings_model.roles, [feconf.ROLE_ID_EXPLORATION_EDITOR])
        self.assertFalse(user_settings_model.banned)

        user_services.update_user_role(
            user_id, feconf.ROLE_ID_BANNED_USER)

        self.assertEqual(
            user_services.get_user_role_from_id(user_id),
            feconf.ROLE_ID_BANNED_USER)
        self.assertEqual(user_settings_model.roles, [])
        self.assertTrue(user_settings_model.banned)

    def test_assign_ban_user_to_exp_editor_updates_roles(self):
        auth_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)
        user_settings_model = user_models.UserSettingsModel.get_by_id(user_id)

        user_services.update_user_role(
            user_id, feconf.ROLE_ID_BANNED_USER)

        self.assertEqual(
            user_services.get_user_role_from_id(user_id),
            feconf.ROLE_ID_BANNED_USER)
        self.assertEqual(user_settings_model.roles, [])
        self.assertTrue(user_settings_model.banned)

        user_services.update_user_role(
            user_id, feconf.ROLE_ID_EXPLORATION_EDITOR)

        self.assertEqual(
            user_services.get_user_role_from_id(user_id),
            feconf.ROLE_ID_EXPLORATION_EDITOR)
        self.assertEqual(
            user_settings_model.roles, [feconf.ROLE_ID_EXPLORATION_EDITOR])
        self.assertFalse(user_settings_model.banned)

    def test_assign_exp_editor_to_other_roles_updates_roles(self):
        auth_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)
        user_settings_model = user_models.UserSettingsModel.get_by_id(user_id)

        self.assertEqual(
            user_settings_model.role, feconf.ROLE_ID_EXPLORATION_EDITOR)
        self.assertEqual(
            user_settings_model.roles, [feconf.ROLE_ID_EXPLORATION_EDITOR])
        self.assertFalse(user_settings_model.banned)

        user_services.update_user_role(
            user_id, feconf.ROLE_ID_COLLECTION_EDITOR)
        user_settings_model = user_models.UserSettingsModel.get_by_id(user_id)

        self.assertEqual(
            user_settings_model.role, feconf.ROLE_ID_COLLECTION_EDITOR)
        self.assertEqual(
            user_settings_model.roles, [
                feconf.ROLE_ID_EXPLORATION_EDITOR,
                feconf.ROLE_ID_COLLECTION_EDITOR])
        self.assertFalse(user_settings_model.banned)

        user_services.update_user_role(
            user_id, feconf.ROLE_ID_TOPIC_MANAGER)
        user_settings_model = user_models.UserSettingsModel.get_by_id(user_id)

        self.assertEqual(
            user_settings_model.role, feconf.ROLE_ID_TOPIC_MANAGER)
        self.assertEqual(
            user_settings_model.roles, [
                feconf.ROLE_ID_EXPLORATION_EDITOR,
                feconf.ROLE_ID_TOPIC_MANAGER])
        self.assertFalse(user_settings_model.banned)

        user_services.update_user_role(
            user_id, feconf.ROLE_ID_MODERATOR)
        user_settings_model = user_models.UserSettingsModel.get_by_id(user_id)

        self.assertEqual(
            user_settings_model.role, feconf.ROLE_ID_MODERATOR)
        self.assertEqual(
            user_settings_model.roles, [
                feconf.ROLE_ID_EXPLORATION_EDITOR,
                feconf.ROLE_ID_MODERATOR])
        self.assertFalse(user_settings_model.banned)

        user_services.update_user_role(
            user_id, feconf.ROLE_ID_ADMIN)
        user_settings_model = user_models.UserSettingsModel.get_by_id(user_id)

        self.assertEqual(
            user_settings_model.role, feconf.ROLE_ID_ADMIN)
        self.assertEqual(
            user_settings_model.roles, [
                feconf.ROLE_ID_EXPLORATION_EDITOR,
                feconf.ROLE_ID_ADMIN])
        self.assertFalse(user_settings_model.banned)

    def test_profile_user_settings_have_correct_roles(self):
        auth_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)
        user_settings_model = user_models.UserSettingsModel.get_by_id(user_id)
        user_settings_model.pin = '12346'
        user_settings_model.update_timestamps()
        user_settings_model.put()

        profile_user_data_dict = {
            'schema_version': 1,
            'display_alias': 'display_alias3',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'user_id': None,
        }
        modifiable_user_data = user_domain.ModifiableUserData.from_raw_dict(
            profile_user_data_dict)
        profile_user_id = user_services.create_new_profiles(
            auth_id, user_email, [modifiable_user_data])[0].user_id
        profile_user_settings_model = user_models.UserSettingsModel.get_by_id(
            profile_user_id)

        self.assertEqual(
            profile_user_settings_model.role, feconf.ROLE_ID_LEARNER)
        self.assertEqual(
            profile_user_settings_model.roles, [feconf.ROLE_ID_LEARNER])
        self.assertFalse(profile_user_settings_model.banned)

    def test_get_all_profiles_auth_details_non_existent_id_raises_error(self):
        non_existent_user_id = 'id_x'
        error_msg = 'Parent user not found.'
        with self.assertRaisesRegexp(Exception, error_msg):
            user_services.get_all_profiles_auth_details_by_parent_user_id(
                non_existent_user_id)

    def test_update_user_role_from_learner_to_other_role_raises_exception(self):
        auth_id = 'test_id'
        user_email = 'test@email.com'
        user_pin = '12345'
        profile_pin = '123'
        display_alias = 'display_alias'
        display_alias_2 = 'display_alias_2'
        user_id = user_services.create_new_user(auth_id, user_email).user_id

        self.modifiable_user_data.user_id = user_id
        self.modifiable_user_data.pin = user_pin
        self.modifiable_user_data.display_alias = display_alias
        user_services.update_multiple_users_data([self.modifiable_user_data])
        self.modifiable_new_user_data.display_alias = display_alias_2
        self.modifiable_new_user_data.pin = profile_pin

        user_services.create_new_profiles(
            auth_id, user_email, [self.modifiable_new_user_data])
        profile_user_id = (
            user_services.get_all_profiles_auth_details_by_parent_user_id(
                user_id)[0].user_id
        )
        self.assertEqual(
            user_services.get_user_role_from_id(profile_user_id),
            feconf.ROLE_ID_LEARNER)
        error_msg = 'The role of a Learner cannot be changed.'
        with self.assertRaisesRegexp(Exception, error_msg):
            user_services.update_user_role(
                profile_user_id, feconf.ROLE_ID_EXPLORATION_EDITOR)

    def test_update_user_role_from_other_role_to_learner_raises_exception(self):
        auth_id = 'test_id'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        self.assertEqual(
            user_services.get_user_role_from_id(user_id),
            feconf.ROLE_ID_EXPLORATION_EDITOR)
        error_msg = 'Updating to a Learner role is not allowed.'
        with self.assertRaisesRegexp(Exception, error_msg):
            user_services.update_user_role(
                user_id, feconf.ROLE_ID_LEARNER)

    def test_create_new_user_creates_a_new_user_auth_details_entry(self):
        new_auth_id = 'new_auth_id'
        new_email = 'new@example.com'

        self.assertIsNone(auth_services.get_user_id_from_auth_id(new_auth_id))

        user_id = user_services.create_new_user(new_auth_id, new_email).user_id

        self.assertIsNotNone(auth_models.UserAuthDetailsModel.get(user_id))
        self.assertEqual(
            auth_services.get_auth_id_from_user_id(user_id), new_auth_id)

    def test_get_auth_details_by_user_id_for_existing_user_works_fine(self):
        auth_id = 'new_auth_id'
        email = 'new@example.com'
        user_id = user_services.create_new_user(auth_id, email).user_id
        user_auth_details_model = auth_models.UserAuthDetailsModel.get(user_id)
        user_auth_details = user_services.get_auth_details_by_user_id(user_id)
        self.assertEqual(
            user_auth_details.user_id, user_auth_details_model.id)
        self.assertEqual(
            user_auth_details.gae_id, user_auth_details_model.gae_id)
        self.assertEqual(
            user_auth_details.parent_user_id,
            user_auth_details_model.parent_user_id)

    def test_get_auth_details_by_user_id_non_existing_user_returns_none(self):
        non_existent_user_id = 'id_x'
        self.assertIsNone(
            user_services.get_auth_details_by_user_id(non_existent_user_id))

    def test_get_auth_details_by_user_id_strict_non_existing_user_error(self):
        non_existent_user_id = 'id_x'
        error_msg = 'User not found'
        with self.assertRaisesRegexp(Exception, error_msg):
            user_services.get_auth_details_by_user_id(
                non_existent_user_id, strict=True)

    def test_get_auth_details_by_auth_id_non_existing_user_returns_none(self):
        non_existent_user_id = 'id_x'
        self.assertIsNone(
            user_services.get_auth_details_by_user_id(non_existent_user_id))

    def test_create_new_profile_with_parent_user_pin_set_is_success(self):
        auth_id = 'auth_id'
        email = 'new@example.com'
        display_alias = 'display_alias'
        display_alias_2 = 'display_alias2'
        user_pin = '12345'
        profile_pin = '123'
        user_id = user_services.create_new_user(auth_id, email).user_id
        self.modifiable_user_data.user_id = user_id
        self.modifiable_user_data.pin = user_pin
        self.modifiable_user_data.display_alias = display_alias
        user_services.update_multiple_users_data([self.modifiable_user_data])
        self.modifiable_new_user_data.display_alias = display_alias_2
        self.modifiable_new_user_data.pin = profile_pin
        user_services.create_new_profiles(
            auth_id, email, [self.modifiable_new_user_data]
        )

        user_auth_details_models = (
            user_services.get_all_profiles_auth_details_by_parent_user_id(
                user_id)
        )
        self.assertEqual(len(user_auth_details_models), 1)
        self.assertEqual(user_auth_details_models[0].parent_user_id, user_id)
        self.assertIsNone(user_auth_details_models[0].gae_id)

    def test_create_new_profile_with_parent_user_pin_not_set_raises_error(self):
        auth_id = 'auth_id'
        email = 'new@example.com'
        display_alias = 'display_alias'
        profile_pin = '123'
        user_services.create_new_user(auth_id, email)
        error_msg = 'Pin must be set for a full user before creating a profile.'
        with self.assertRaisesRegexp(Exception, error_msg):
            self.modifiable_new_user_data.display_alias = display_alias
            self.modifiable_new_user_data.pin = profile_pin
            user_services.create_new_profiles(
                auth_id, email, [self.modifiable_new_user_data])

    def test_create_multiple_new_profiles_for_same_user_works_correctly(self):
        auth_id = 'auth_id'
        email = 'new@example.com'
        display_alias = 'display_alias'
        display_alias_2 = 'display_alias2'
        display_alias_3 = 'display_alias3'
        user_pin = '12345'
        profile_pin = '123'
        user_id = user_services.create_new_user(auth_id, email).user_id
        self.modifiable_user_data.user_id = user_id
        self.modifiable_user_data.pin = user_pin
        self.modifiable_user_data.display_alias = display_alias
        user_services.update_multiple_users_data([self.modifiable_user_data])
        self.modifiable_new_user_data.display_alias = display_alias_2
        self.modifiable_new_user_data.pin = profile_pin
        new_user_data_dict_2 = {
            'schema_version': 1,
            'display_alias': display_alias_3,
            'pin': None,
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'user_id': None,
        }
        modifiable_new_user_data_2 = (
            user_domain.ModifiableUserData.from_raw_dict(
                new_user_data_dict_2))
        user_settings_list = user_services.create_new_profiles(
            auth_id, email, [
                self.modifiable_new_user_data, modifiable_new_user_data_2
            ]
        )
        profile_1_id = user_settings_list[0].user_id
        profile_2_id = user_settings_list[1].user_id

        user_auth_details_models = [
            {
                'id': model.id,
                'auth_id': model.gae_id,
                'parent_user_id': model.parent_user_id
            } for model in
            auth_services.get_all_profiles_by_parent_user_id(user_id)
        ]

        expected_user_auth_output = [
            {
                'id': profile_1_id,
                'auth_id': None,
                'parent_user_id': user_id
            },
            {
                'id': profile_2_id,
                'auth_id': None,
                'parent_user_id': user_id
            }
        ]
        self.assertItemsEqual(
            user_auth_details_models, expected_user_auth_output)

        user_settings_models = [
            {
                'id': model.id,
                'display_alias': model.display_alias,
                'pin': model.pin,
                'role': model.role
            } for model in
            user_models.UserSettingsModel.get_multi(
                [profile_1_id, profile_2_id])
        ]

        expected_user_settings_output = [
            {
                'id': profile_1_id,
                'display_alias': display_alias_2,
                'pin': profile_pin,
                'role': feconf.ROLE_ID_LEARNER
            },
            {
                'id': profile_2_id,
                'display_alias': display_alias_3,
                'pin': None,
                'role': feconf.ROLE_ID_LEARNER
            }
        ]
        self.assertItemsEqual(
            user_settings_models, expected_user_settings_output)

    def test_create_new_profile_with_nonexistent_user_raises_error(self):
        non_existent_auth_id = 'auth_id_x'
        non_existent_email = 'x@example.com'
        profile_pin = '123'
        display_alias = 'display_alias'
        error_msg = 'User not found.'
        with self.assertRaisesRegexp(Exception, error_msg):
            self.modifiable_new_user_data.display_alias = display_alias
            self.modifiable_new_user_data.pin = profile_pin
            user_services.create_new_profiles(
                non_existent_auth_id, non_existent_email,
                [self.modifiable_new_user_data]
            )

    def test_create_new_profile_modifiable_user_with_user_id_raises_error(self):
        auth_id = 'auth_id'
        email = 'new@example.com'
        display_alias = 'display_alias'
        display_alias_2 = 'display_alias2'
        user_pin = '12345'
        profile_pin = '123'
        user_id = user_services.create_new_user(auth_id, email).user_id
        self.modifiable_user_data.user_id = user_id
        self.modifiable_user_data.pin = user_pin
        self.modifiable_user_data.display_alias = display_alias
        user_services.update_multiple_users_data([self.modifiable_user_data])
        error_msg = 'User id cannot already exist for a new user.'
        with self.assertRaisesRegexp(Exception, error_msg):
            self.modifiable_new_user_data.display_alias = display_alias_2
            self.modifiable_new_user_data.pin = profile_pin
            self.modifiable_new_user_data.user_id = 'user_id'
            user_services.create_new_profiles(
                auth_id, email, [self.modifiable_new_user_data]
            )

    def test_update_users_modifiable_object_user_id_not_set_raises_error(self):
        auth_id = 'auth_id'
        email = 'new@example.com'
        display_alias = 'display_alias2'
        user_pin = '12345'
        user_services.create_new_user(auth_id, email)
        self.modifiable_user_data.user_id = None
        self.modifiable_user_data.pin = user_pin
        self.modifiable_user_data.display_alias = display_alias

        error_msg = 'Missing user ID.'
        with self.assertRaisesRegexp(Exception, error_msg):
            user_services.update_multiple_users_data(
                [self.modifiable_user_data])

    def test_update_users_for_user_with_non_existent_id_raises_error(self):
        auth_id = 'auth_id'
        non_existent_user_id = 'id_x'
        email = 'new@example.com'
        display_alias = 'display_alias2'
        user_pin = '12345'
        user_services.create_new_user(auth_id, email)
        self.modifiable_user_data.user_id = non_existent_user_id
        self.modifiable_user_data.pin = user_pin
        self.modifiable_user_data.display_alias = display_alias

        error_msg = 'User not found.'
        with self.assertRaisesRegexp(Exception, error_msg):
            user_services.update_multiple_users_data(
                [self.modifiable_user_data])

    def test_update_users_data_for_multiple_users_works_correctly(self):
        # Preparing for the test.
        auth_id = 'auth_id'
        email = 'new@example.com'
        display_alias = 'display_alias'
        display_alias_2 = 'display_alias2'
        display_alias_3 = 'display_alias3'
        user_pin = '12345'
        profile_pin = '123'
        user_id = user_services.create_new_user(auth_id, email).user_id
        self.modifiable_user_data.user_id = user_id
        self.modifiable_user_data.pin = user_pin
        self.modifiable_user_data.display_alias = display_alias
        user_services.update_multiple_users_data([self.modifiable_user_data])
        self.modifiable_new_user_data.display_alias = display_alias_2
        self.modifiable_new_user_data.pin = profile_pin
        new_user_data_dict_2 = {
            'schema_version': 1,
            'display_alias': display_alias_3,
            'pin': None,
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'user_id': None,
        }
        modifiable_new_user_data_2 = (
            user_domain.ModifiableUserData.from_raw_dict(
                new_user_data_dict_2))
        user_settings_list = user_services.create_new_profiles(
            auth_id, email, [
                self.modifiable_new_user_data, modifiable_new_user_data_2
            ]
        )
        profile_user_ids = [
            user_settings_list[0].user_id, user_settings_list[1].user_id]
        self.modifiable_new_user_data.user_id = profile_user_ids[0]
        modifiable_new_user_data_2.user_id = profile_user_ids[1]

        # Performing the actual action.
        modifiable_new_user_data_2.pin = '345'
        self.modifiable_new_user_data.display_alias = 'xyz'
        user_services.update_multiple_users_data(
            [self.modifiable_new_user_data, modifiable_new_user_data_2])

        # Post-checking.
        user_auth_details_models = [
            {
                'id': model.id,
                'auth_id': model.gae_id,
                'parent_user_id': model.parent_user_id
            } for model in
            auth_models.UserAuthDetailsModel.get_multi(profile_user_ids)
        ]

        expected_auth_details_output = [
            {
                'id': profile_user_ids[0],
                'auth_id': None,
                'parent_user_id': user_id
            },
            {
                'id': profile_user_ids[1],
                'auth_id': None,
                'parent_user_id': user_id
            }
        ]
        self.assertItemsEqual(
            expected_auth_details_output, user_auth_details_models)

        user_settings_models = [
            {
                'id': model.id,
                'display_alias': model.display_alias,
                'pin': model.pin
            } for model in
            user_models.UserSettingsModel.get_multi(profile_user_ids)
        ]

        expected_user_settings_output = [
            {
                'id': profile_user_ids[0],
                'display_alias': 'xyz',
                'pin': profile_pin
            },
            {
                'id': profile_user_ids[1],
                'display_alias': display_alias_3,
                'pin': '345'
            }
        ]
        self.assertItemsEqual(
            expected_user_settings_output, user_settings_models)

    def test_mark_user_for_deletion_deletes_user_settings(self):
        auth_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)

        user_settings = user_services.get_user_settings_by_auth_id(auth_id)
        self.assertFalse(user_settings.deleted)

        user_services.mark_user_for_deletion(user_id)

        user_settings = user_services.get_user_settings_by_auth_id(auth_id)
        self.assertIsNone(user_settings)

    def test_mark_user_for_deletion_deletes_user_auth_details_entry(self):
        auth_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)

        user_auth_details = auth_models.UserAuthDetailsModel.get_by_id(user_id)
        self.assertFalse(user_auth_details.deleted)

        user_services.mark_user_for_deletion(user_id)

        user_auth_details = auth_models.UserAuthDetailsModel.get_by_id(user_id)
        self.assertTrue(user_auth_details.deleted)

    def test_mark_user_for_deletion_deletes_user_identifiers_entry(self):
        auth_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(auth_id, user_email).user_id
        user_services.set_username(user_id, username)

        self.assertIsNotNone(auth_services.get_auth_id_from_user_id(user_id))

        user_services.mark_user_for_deletion(user_id)

        self.assertIsNone(auth_services.get_auth_id_from_user_id(user_id))

    def test_get_current_date_as_string(self):
        custom_datetimes = [
            datetime.date(2011, 1, 1),
            datetime.date(2012, 2, 28)
        ]
        datetime_strings = [custom_datetime.strftime(
            feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)
                            for custom_datetime in custom_datetimes]

        self.assertEqual(len(datetime_strings[0].split('-')[0]), 4)
        self.assertEqual(len(datetime_strings[0].split('-')[1]), 2)
        self.assertEqual(len(datetime_strings[0].split('-')[2]), 2)

        self.assertEqual(len(datetime_strings[1].split('-')[0]), 4)
        self.assertEqual(len(datetime_strings[1].split('-')[1]), 2)
        self.assertEqual(len(datetime_strings[1].split('-')[2]), 2)

        self.assertEqual(datetime_strings[0], '2011-01-01')
        self.assertEqual(datetime_strings[1], '2012-02-28')

    def test_parse_date_from_string(self):
        self.assertEqual(
            user_services.parse_date_from_string('2016-06-30'),
            {'year': 2016, 'month': 6, 'day': 30})
        self.assertEqual(
            user_services.parse_date_from_string('2016-07-05'),
            {'year': 2016, 'month': 7, 'day': 5})

        with self.assertRaisesRegexp(
            ValueError,
            'time data \'2016-13-01\' does not match format \'%Y-%m-%d\''):
            user_services.parse_date_from_string('2016-13-01')
        with self.assertRaisesRegexp(ValueError, 'unconverted data remains: 2'):
            user_services.parse_date_from_string('2016-03-32')

    def test_record_user_started_state_translation_tutorial(self):
        # Testing of the user translation tutorial firsttime state storage.
        auth_id = 'someUser'
        username = 'username'
        user_id = user_services.create_new_user(
            auth_id, 'user@example.com').user_id
        user_services.set_username(user_id, username)
        user_services.record_user_started_state_translation_tutorial(user_id)
        user_settings = user_services.get_user_settings(user_id)
        self.assertIsInstance(
            user_settings.last_started_state_translation_tutorial,
            datetime.datetime)
        self.assertTrue(
            user_settings.last_started_state_translation_tutorial is not None)


class UpdateContributionMsecTests(test_utils.GenericTestBase):
    """Test whether contribution date changes with publication of
    exploration/collection and update of already published
    exploration/collection.
    """

    EXP_ID = 'test_exp'
    COL_ID = 'test_col'
    COLLECTION_TITLE = 'title'
    COLLECTION_CATEGORY = 'category'
    COLLECTION_OBJECTIVE = 'objective'

    def setUp(self):
        super(UpdateContributionMsecTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.admin = user_services.get_user_actions_info(self.admin_id)
        self.owner = user_services.get_user_actions_info(self.owner_id)

    def test_contribution_msec_updates_on_published_explorations(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.admin_id, end_state_name='End')
        init_state_name = exploration.init_state_name
        exp_services.publish_exploration_and_update_user_profiles(
            self.admin, self.EXP_ID)

        # Test all owners and editors of exploration after publication have
        # updated first contribution times in msecs.
        self.assertIsNotNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)

        # Test editor of published exploration has updated contribution time.
        rights_manager.release_ownership_of_exploration(
            self.admin, self.EXP_ID)

        exp_services.update_exploration(
            self.editor_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': init_state_name,
                'property_name': 'widget_id',
                'new_value': 'MultipleChoiceInput'
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': init_state_name,
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': '<p>Choice 1</p>'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': True}
                }
            })], 'commit')

        self.assertIsNotNone(user_services.get_user_settings(
            self.editor_id).first_contribution_msec)

    def test_contribution_msec_does_not_update_until_exp_is_published(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.admin_id, end_state_name='End')
        init_state_name = exploration.init_state_name

        # Test that saving an exploration does not update first contribution
        # time.
        self.assertIsNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)

        # Test that commit to unpublished exploration does not update
        # contribution time.
        exp_services.update_exploration(
            self.admin_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': init_state_name,
                'property_name': 'widget_id',
                'new_value': 'MultipleChoiceInput'
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': init_state_name,
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': '<p>Choice 1</p>'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': True}
                }
            })], '')
        self.assertIsNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)

        # Test that another user who commits to unpublished exploration does not
        # have updated first contribution time.
        rights_manager.assign_role_for_exploration(
            self.admin, self.EXP_ID, self.editor_id, 'editor')
        exp_services.update_exploration(
            self.editor_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'rename_state',
                'old_state_name': feconf.DEFAULT_INIT_STATE_NAME,
                'new_state_name': u'¡Hola! αβγ',
            })], '')
        self.assertIsNone(user_services.get_user_settings(
            self.editor_id).first_contribution_msec)

        # Test that after an exploration is published, all contributors have
        # updated first contribution time.
        exp_services.publish_exploration_and_update_user_profiles(
            self.admin, self.EXP_ID)
        self.assertIsNotNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)
        self.assertIsNotNone(user_services.get_user_settings(
            self.editor_id).first_contribution_msec)

    def test_contribution_msec_does_not_change_if_no_contribution_to_exp(self):
        self.save_new_valid_exploration(
            self.EXP_ID, self.admin_id, end_state_name='End')
        rights_manager.assign_role_for_exploration(
            self.admin, self.EXP_ID, self.editor_id, 'editor')
        exp_services.publish_exploration_and_update_user_profiles(
            self.admin, self.EXP_ID)

        # Test that contribution time is not given to an editor that has not
        # contributed.
        self.assertIsNotNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)
        self.assertIsNone(user_services.get_user_settings(
            self.editor_id).first_contribution_msec)

    def test_contribution_msec_does_not_change_if_exp_unpublished(self):
        self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')

        exp_services.publish_exploration_and_update_user_profiles(
            self.owner, self.EXP_ID)
        rights_manager.unpublish_exploration(self.admin, self.EXP_ID)

        # Test that contribution time is not eliminated if exploration is
        # unpublished.
        self.assertIsNotNone(user_services.get_user_settings(
            self.owner_id).first_contribution_msec)

    def test_contribution_msec_updates_on_published_collections(self):
        self.save_new_valid_collection(
            self.COL_ID, self.admin_id, title=self.COLLECTION_TITLE,
            category=self.COLLECTION_CATEGORY,
            objective=self.COLLECTION_OBJECTIVE,
            exploration_id=self.EXP_ID)

        collection_services.publish_collection_and_update_user_profiles(
            self.admin, self.COL_ID)
        exp_services.publish_exploration_and_update_user_profiles(
            self.admin, self.EXP_ID)

        # Test all owners and editors of collection after publication have
        # updated first contribution times.
        self.assertIsNotNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)

        # Test editor of published collection has updated
        # first contribution time.
        rights_manager.release_ownership_of_collection(
            self.admin, self.COL_ID)

        collection_services.update_collection(
            self.editor_id, self.COL_ID, [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'Some new title'
            }], 'Changed the title')

        self.assertIsNotNone(user_services.get_user_settings(
            self.editor_id).first_contribution_msec)

    def test_contribution_msec_does_not_update_until_collection_is_published(
            self):
        self.save_new_valid_collection(
            self.COL_ID, self.admin_id, title=self.COLLECTION_TITLE,
            category=self.COLLECTION_CATEGORY,
            objective=self.COLLECTION_OBJECTIVE,
            exploration_id=self.EXP_ID)

        # Test that saving a collection does not update first contribution
        # time.
        self.assertIsNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)

        # Test that commit to unpublished collection does not update
        # contribution time.
        collection_services.update_collection(
            self.admin_id, self.COL_ID, [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'Some new title'
            }], '')
        self.assertIsNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)

        # Test that another user who commits to unpublished collection does not
        # have updated first contribution time.
        rights_manager.assign_role_for_collection(
            self.admin, self.COL_ID, self.editor_id, 'editor')
        collection_services.update_collection(
            self.editor_id, self.COL_ID, [{
                'cmd': 'edit_collection_property',
                'property_name': 'category',
                'new_value': 'Some new category'
            }], '')
        self.assertIsNone(user_services.get_user_settings(
            self.editor_id).first_contribution_msec)

        # Test that after an collection is published, all contributors have
        # updated first contribution times.
        collection_services.publish_collection_and_update_user_profiles(
            self.admin, self.COL_ID)
        self.assertIsNotNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)
        self.assertIsNotNone(user_services.get_user_settings(
            self.editor_id).first_contribution_msec)

    def test_contribution_msec_does_not_change_if_no_contribution_to_collection(
            self):
        self.save_new_valid_collection(
            self.COL_ID, self.admin_id, title=self.COLLECTION_TITLE,
            category=self.COLLECTION_CATEGORY,
            objective=self.COLLECTION_OBJECTIVE,
            exploration_id=self.EXP_ID)
        rights_manager.assign_role_for_collection(
            self.admin, self.COL_ID, self.editor_id, 'editor')
        collection_services.publish_collection_and_update_user_profiles(
            self.admin, self.COL_ID)

        # Test that contribution time is not given to an editor that has not
        # contributed.
        self.assertIsNotNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)
        self.assertIsNone(user_services.get_user_settings(
            self.editor_id).first_contribution_msec)

    def test_contribution_msec_does_not_change_if_collection_unpublished(self):
        self.save_new_valid_collection(
            self.COL_ID, self.owner_id, title=self.COLLECTION_TITLE,
            category=self.COLLECTION_CATEGORY,
            objective=self.COLLECTION_OBJECTIVE,
            exploration_id=self.EXP_ID)
        collection_services.publish_collection_and_update_user_profiles(
            self.owner, self.COL_ID)
        rights_manager.unpublish_collection(self.admin, self.COL_ID)

        # Test that first contribution msec is not eliminated if collection is
        # unpublished.
        self.assertIsNotNone(user_services.get_user_settings(
            self.owner_id).first_contribution_msec)


class UserDashboardStatsTests(test_utils.GenericTestBase):
    """Test whether exploration-related statistics of a user change as events
    are registered.
    """

    OWNER_EMAIL = 'owner@example.com'
    OWNER_USERNAME = 'owner'
    EXP_ID = 'exp1'

    USER_SESSION_ID = 'session1'

    CURRENT_DATE_AS_STRING = user_services.get_current_date_as_string()

    def setUp(self):
        super(UserDashboardStatsTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def mock_get_current_date_as_string(self):
        return self.CURRENT_DATE_AS_STRING

    def test_get_user_dashboard_stats(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')
        init_state_name = exploration.init_state_name
        event_services.StartExplorationEventHandler.record(
            self.EXP_ID, 1, init_state_name, self.USER_SESSION_ID, {},
            feconf.PLAY_TYPE_NORMAL)
        event_services.StatsEventsHandler.record(
            self.EXP_ID, 1, {
                'num_starts': 1,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })
        self.assertEqual(
            user_services.get_dashboard_stats(self.owner_id),
            {
                'total_plays': 1,
                'num_ratings': 0,
                'average_ratings': None
            })

    def test_get_weekly_dashboard_stats_when_stats_model_is_none(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')
        init_state_name = exploration.init_state_name
        event_services.StartExplorationEventHandler.record(
            self.EXP_ID, 1, init_state_name, self.USER_SESSION_ID, {},
            feconf.PLAY_TYPE_NORMAL)
        self.assertEqual(
            user_services.get_weekly_dashboard_stats(self.owner_id), None)
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id), None)

        with self.swap(
            user_services, 'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            user_services.update_dashboard_stats_log(self.owner_id)

        self.assertEqual(
            user_services.get_weekly_dashboard_stats(self.owner_id), [{
                self.CURRENT_DATE_AS_STRING: {
                    'total_plays': 1,
                    'num_ratings': 0,
                    'average_ratings': None
                }
            }])

    def test_get_weekly_dashboard_stats(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')
        init_state_name = exploration.init_state_name
        event_services.StartExplorationEventHandler.record(
            self.EXP_ID, 1, init_state_name, self.USER_SESSION_ID, {},
            feconf.PLAY_TYPE_NORMAL)
        event_services.StatsEventsHandler.record(
            self.EXP_ID, 1, {
                'num_starts': 1,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })

        self.assertEqual(
            user_services.get_weekly_dashboard_stats(self.owner_id), None)
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id), None)

        self.process_and_flush_pending_tasks()

        self.assertEqual(
            user_services.get_weekly_dashboard_stats(self.owner_id), None)
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id), None)

        with self.swap(
            user_services, 'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            user_services.update_dashboard_stats_log(self.owner_id)

        self.assertEqual(
            user_services.get_weekly_dashboard_stats(self.owner_id), [{
                self.CURRENT_DATE_AS_STRING: {
                    'total_plays': 1,
                    'num_ratings': 0,
                    'average_ratings': None
                }
            }])


class SubjectInterestsUnitTests(test_utils.GenericTestBase):
    """Test the update_subject_interests method."""

    def setUp(self):
        super(SubjectInterestsUnitTests, self).setUp()
        self.auth_id = 'someUser'
        self.username = 'username'
        self.user_email = 'user@example.com'

        self.user_id = user_services.create_new_user(
            self.auth_id, self.user_email).user_id
        user_services.set_username(self.user_id, self.username)

    def test_invalid_subject_interests_are_not_accepted(self):
        with self.assertRaisesRegexp(utils.ValidationError, 'to be a list'):
            user_services.update_subject_interests(self.user_id, 'not a list')

        with self.assertRaisesRegexp(utils.ValidationError, 'to be a string'):
            user_services.update_subject_interests(self.user_id, [1, 2, 3])

        with self.assertRaisesRegexp(utils.ValidationError, 'to be non-empty'):
            user_services.update_subject_interests(self.user_id, ['', 'ab'])

        with self.assertRaisesRegexp(
            utils.ValidationError,
            'to consist only of lowercase alphabetic characters and spaces'
            ):
            user_services.update_subject_interests(self.user_id, ['!'])

        with self.assertRaisesRegexp(
            utils.ValidationError,
            'to consist only of lowercase alphabetic characters and spaces'
            ):
            user_services.update_subject_interests(
                self.user_id, ['has-hyphens'])

        with self.assertRaisesRegexp(
            utils.ValidationError,
            'to consist only of lowercase alphabetic characters and spaces'
            ):
            user_services.update_subject_interests(
                self.user_id, ['HasCapitalLetters'])

        with self.assertRaisesRegexp(utils.ValidationError, 'to be distinct'):
            user_services.update_subject_interests(self.user_id, ['a', 'a'])

        # The following cases are all valid.
        user_services.update_subject_interests(self.user_id, [])
        user_services.update_subject_interests(
            self.user_id, ['singleword', 'has spaces'])


class LastLoginIntegrationTests(test_utils.GenericTestBase):
    """Integration tests for testing that the last login time for a user updates
    correctly.
    """

    def setUp(self):
        """Create exploration with two versions."""
        super(LastLoginIntegrationTests, self).setUp()

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_legacy_user(self):
        """Test the case of a user who existed in the system before the
        last-login check was introduced.
        """
        previous_last_logged_in_datetime = (
            user_services.get_user_settings(self.viewer_id).last_logged_in)
        self.assertIsNotNone(previous_last_logged_in_datetime)

        current_datetime = datetime.datetime.utcnow()
        mocked_datetime_utcnow = current_datetime - datetime.timedelta(days=1)
        with self.mock_datetime_utcnow(mocked_datetime_utcnow):
            user_services.record_user_logged_in(self.viewer_id)

        user_settings = user_services.get_user_settings(self.viewer_id)
        last_logged_in = user_settings.last_logged_in

        # After logging in and requesting a URL, the last_logged_in property is
        # changed.
        self.login(self.VIEWER_EMAIL)
        self.get_html_response(feconf.LIBRARY_INDEX_URL)
        self.assertLess(
            last_logged_in,
            user_services.get_user_settings(self.viewer_id).last_logged_in)
        self.logout()

    def test_last_logged_in_only_updated_if_enough_time_has_elapsed(self):
        # The last logged-in time has already been set when the user
        # registered.
        previous_last_logged_in_datetime = (
            user_services.get_user_settings(self.viewer_id).last_logged_in)
        self.assertIsNotNone(previous_last_logged_in_datetime)

        current_datetime = datetime.datetime.utcnow()

        mocked_datetime_utcnow = current_datetime + datetime.timedelta(hours=11)
        with self.mock_datetime_utcnow(mocked_datetime_utcnow):
            self.login(self.VIEWER_EMAIL)
            self.get_html_response(feconf.LIBRARY_INDEX_URL)
            self.assertEqual(
                user_services.get_user_settings(self.viewer_id).last_logged_in,
                previous_last_logged_in_datetime)
            self.logout()

        mocked_datetime_utcnow = current_datetime + datetime.timedelta(hours=13)
        with self.mock_datetime_utcnow(mocked_datetime_utcnow):
            self.login(self.VIEWER_EMAIL)
            self.get_html_response(feconf.LIBRARY_INDEX_URL)
            self.assertGreater(
                user_services.get_user_settings(self.viewer_id).last_logged_in,
                previous_last_logged_in_datetime)
            self.logout()


class LastExplorationEditedIntegrationTests(test_utils.GenericTestBase):
    """Integration tests for testing the time the user last edited an
    exploration updates correctly.
    """

    EXP_ID = 'exp'

    def setUp(self):
        """Create users for creating and editing exploration."""
        super(LastExplorationEditedIntegrationTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')

    def test_legacy_user(self):
        """Test the case of a user who are editing exploration for first time
        after the last edited time check was introduced.
        """
        editor_settings = user_services.get_user_settings(self.editor_id)
        self.assertIsNone(editor_settings.last_edited_an_exploration)

        exp_services.update_exploration(
            self.editor_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

        editor_settings = user_services.get_user_settings(self.editor_id)
        self.assertIsNotNone(editor_settings.last_edited_an_exploration)

    def test_last_exp_edit_time_gets_updated(self):
        exp_services.update_exploration(
            self.editor_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

        # Decrease last exploration edited time by 13 hours.
        user_settings = user_services.get_user_settings(self.editor_id)
        mocked_datetime_utcnow = (
            user_settings.last_edited_an_exploration -
            datetime.timedelta(hours=13))
        with self.mock_datetime_utcnow(mocked_datetime_utcnow):
            user_services.record_user_edited_an_exploration(self.editor_id)

        editor_settings = user_services.get_user_settings(self.editor_id)
        previous_last_edited_an_exploration = (
            editor_settings.last_edited_an_exploration)
        self.assertIsNotNone(previous_last_edited_an_exploration)

        # The editor edits the exploration 13 hours after it was created.
        exp_services.update_exploration(
            self.editor_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'new objective'
            })], 'Test edit 2')

        # Make sure last exploration edited time gets updated.
        editor_settings = user_services.get_user_settings(self.editor_id)
        self.assertGreater(
            (editor_settings.last_edited_an_exploration),
            previous_last_edited_an_exploration)


class LastExplorationCreatedIntegrationTests(test_utils.GenericTestBase):
    """Integration tests for the time the user last created an exploration
    updates correctly.
    """

    EXP_ID_A = 'exp_a'
    EXP_ID_B = 'exp_b'

    def setUp(self):
        """Create user for creating exploration."""
        super(LastExplorationCreatedIntegrationTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def test_legacy_user(self):
        """Test the case of a user who are creating exploration for first time
        after the last edited time check was introduced.
        """
        owner_settings = user_services.get_user_settings(self.owner_id)
        self.assertIsNone(owner_settings.last_created_an_exploration)

        self.save_new_valid_exploration(
            self.EXP_ID_A, self.owner_id, end_state_name='End')

        owner_settings = user_services.get_user_settings(self.owner_id)
        self.assertIsNotNone(owner_settings.last_created_an_exploration)

    def test_last_exp_edit_time_gets_updated(self):
        self.save_new_valid_exploration(
            self.EXP_ID_A, self.owner_id, end_state_name='End')

        # Decrease last exploration created time by 13 hours.
        user_settings = user_services.get_user_settings(self.owner_id)
        with self.mock_datetime_utcnow(
            user_settings.last_created_an_exploration -
            datetime.timedelta(hours=13)):
            user_services.record_user_created_an_exploration(self.owner_id)

        owner_settings = user_services.get_user_settings(self.owner_id)
        previous_last_created_an_exploration = (
            owner_settings.last_created_an_exploration)
        self.assertIsNotNone(previous_last_created_an_exploration)

        # The creator creates another exploration 13 hours later.
        self.save_new_valid_exploration(
            self.EXP_ID_B, self.owner_id, end_state_name='End')

        # Make sure that last exploration created time gets updated.
        owner_settings = user_services.get_user_settings(self.owner_id)
        self.assertGreater(
            (owner_settings.last_created_an_exploration),
            previous_last_created_an_exploration)


class CommunityContributionStatsUnitTests(test_utils.GenericTestBase):
    """Test the functionality related to updating the community contribution
    stats.
    """

    REVIEWER_1_EMAIL = 'reviewer1@community.org'
    REVIEWER_2_EMAIL = 'reviewer2@community.org'

    def _assert_community_contribution_stats_is_in_default_state(self):
        """Checks if the community contribution stats is in its default
        state.
        """
        community_contribution_stats = (
            suggestion_services.get_community_contribution_stats()
        )

        self.assertEqual(
            (
                community_contribution_stats
                .translation_reviewer_counts_by_lang_code
            ), {})
        self.assertEqual(
            (
                community_contribution_stats
                .translation_suggestion_counts_by_lang_code
            ), {})
        self.assertEqual(
            community_contribution_stats.question_reviewer_count, 0)
        self.assertEqual(
            community_contribution_stats.question_suggestion_count, 0)

    def setUp(self):
        super(
            CommunityContributionStatsUnitTests, self).setUp()

        self.signup(self.REVIEWER_1_EMAIL, 'reviewer1')
        self.reviewer_1_id = self.get_user_id_from_email(
            self.REVIEWER_1_EMAIL)

        self.signup(self.REVIEWER_2_EMAIL, 'reviewer2')
        self.reviewer_2_id = self.get_user_id_from_email(
            self.REVIEWER_2_EMAIL)

    def test_grant_reviewer_translation_reviewing_rights_increases_count(self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'hi': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_grant_reviewer_translation_multi_reviewing_rights_increases_count(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code,
            {'hi': 1, 'en': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_grant_reviewer_existing_translation_reviewing_rights_no_count_diff(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        # Assert that the translation reviewer count increased by one.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'hi': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')

        # Assert that the translation reviewer count did not change because the
        # reviewer already had the permissions.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'hi': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_remove_all_reviewer_translation_reviewing_rights_decreases_count(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        # Assert that the translation reviewer count increased by one.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'hi': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        user_services.remove_translation_review_rights_in_language(
            self.reviewer_1_id, 'hi')

        # Assert that the translation reviewer count decreased by one after the
        # rights were removed.
        self._assert_community_contribution_stats_is_in_default_state()

    def test_remove_some_reviewer_translation_reviewing_rights_decreases_count(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        # Assert that the translation reviewer count increased by one.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'hi': 1, 'en': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        user_services.remove_translation_review_rights_in_language(
            self.reviewer_1_id, 'hi')

        # Assert that the translation reviewer count decreased by one after the
        # rights were removed.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'en': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_remove_translation_contribution_reviewer_decreases_count(self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        # Assert that the translation reviewer count increased by one.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'hi': 1, 'en': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        user_services.remove_contribution_reviewer(self.reviewer_1_id)

        # Assert that the translation reviewer counts decreased by one after the
        # contribution reviewer was removed.
        self._assert_community_contribution_stats_is_in_default_state()

    def test_grant_reviewer_question_reviewing_rights_increases_count(self):
        user_services.allow_user_to_review_question(self.reviewer_1_id)

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_grant_reviewer_existing_question_reviewing_rights_no_count_diff(
            self):
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        # Assert that the question reviewer count increased by one.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        user_services.allow_user_to_review_question(self.reviewer_1_id)

        # Assert that the question reviewer count did not change because the
        # reviewer already had the permissions.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_remove_reviewer_question_reviewing_rights_decreases_count(
            self):
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        # Assert that the question reviewer count increased by one.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        user_services.remove_question_review_rights(self.reviewer_1_id)

        # Assert that the question reviewer count decreased by one after the
        # rights were removed.
        self._assert_community_contribution_stats_is_in_default_state()

    def test_remove_question_contribution_reviewer_decreases_count(
            self):
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        # Assert that the question reviewer count increased by one.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        user_services.remove_contribution_reviewer(self.reviewer_1_id)

        # Assert that the question reviewer count decreased by one after the
        # contribution reviewer was removed.
        self._assert_community_contribution_stats_is_in_default_state()

    def test_grant_reviewer_multiple_reviewing_rights_increases_counts(self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        user_services.allow_user_to_review_question(self.reviewer_1_id)

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'hi': 1, 'en': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_grant_multiple_reviewers_multi_reviewing_rights_increases_counts(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_2_id, 'fr')
        user_services.allow_user_to_review_question(self.reviewer_2_id)

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 2)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code,
            {'hi': 2, 'en': 1, 'fr': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_remove_question_rights_from_multi_rights_reviewer_updates_count(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        # Assert that the counts were updated before the question rights are
        # removed.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'hi': 1, 'en': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        user_services.remove_question_review_rights(self.reviewer_1_id)

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 0)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'hi': 1, 'en': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_remove_translation_rights_from_multi_rights_reviewer_updates_count(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        # Assert that the counts were updated before the translation rights are
        # removed.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'hi': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        user_services.remove_translation_review_rights_in_language(
            self.reviewer_1_id, 'hi')

        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

    def test_remove_multi_rights_contribution_reviewer_decreases_counts(self):
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.reviewer_1_id, 'en')
        user_services.allow_user_to_review_question(self.reviewer_1_id)
        # Assert that the counts were updated before the contribution reviewer
        # is removed.
        stats = suggestion_services.get_community_contribution_stats()
        self.assertEqual(stats.question_reviewer_count, 1)
        self.assertEqual(stats.question_suggestion_count, 0)
        self.assertDictEqual(
            stats.translation_reviewer_counts_by_lang_code, {'hi': 1, 'en': 1})
        self.assertDictEqual(
            stats.translation_suggestion_counts_by_lang_code, {})

        user_services.remove_contribution_reviewer(self.reviewer_1_id)

        self._assert_community_contribution_stats_is_in_default_state()

    def test_grant_reviewer_voiceover_reviewing_permissions_does_nothing(self):
        # Granting reviewers voiceover reviewing permissions does not change the
        # counts because voiceover suggestions are currently not offered on the
        # Contributor Dashboard.
        user_services.allow_user_to_review_voiceover_in_language(
            self.reviewer_1_id, 'hi')

        self._assert_community_contribution_stats_is_in_default_state()

    def test_remove_reviewer_voiceover_reviewing_permissions_does_nothing(self):
        # Removing reviewers voiceover reviewing permissions does not change the
        # counts because voiceover suggestions are currently not offered on the
        # Contributor Dashboard.
        user_services.allow_user_to_review_voiceover_in_language(
            self.reviewer_1_id, 'hi')
        self._assert_community_contribution_stats_is_in_default_state()

        user_services.remove_voiceover_review_rights_in_language(
            self.reviewer_1_id, 'hi')

        self._assert_community_contribution_stats_is_in_default_state()


class UserContributionReviewRightsTests(test_utils.GenericTestBase):

    TRANSLATOR_EMAIL = 'translator@community.org'
    TRANSLATOR_USERNAME = 'translator'

    VOICE_ARTIST_EMAIL = 'voiceartist@community.org'
    VOICE_ARTIST_USERNAME = 'voiceartist'

    QUESTION_REVIEWER_EMAIL = 'question@community.org'
    QUESTION_REVIEWER_USERNAME = 'questionreviewer'

    def setUp(self):
        super(UserContributionReviewRightsTests, self).setUp()
        self.signup(self.TRANSLATOR_EMAIL, self.TRANSLATOR_USERNAME)
        self.translator_id = self.get_user_id_from_email(self.TRANSLATOR_EMAIL)

        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)

        self.signup(
            self.QUESTION_REVIEWER_EMAIL, self.QUESTION_REVIEWER_USERNAME)
        self.question_reviewer_id = (
            self.get_user_id_from_email(self.QUESTION_REVIEWER_EMAIL))

    def test_assign_user_review_translation_suggestion_in_language(self):
        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translator_id))

        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')

        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translator_id, language_code='hi'))

    def test_translation_review_assignement_adds_language_in_sorted_order(self):
        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')
        user_contribution_rights = user_services.get_user_contribution_rights(
            self.translator_id)
        self.assertEqual(
            user_contribution_rights.can_review_translation_for_language_codes,
            ['hi'])

        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'en')
        user_contribution_rights = user_services.get_user_contribution_rights(
            self.translator_id)
        self.assertEqual(
            user_contribution_rights.can_review_translation_for_language_codes,
            ['en', 'hi'])

    def test_assign_user_review_voiceover_application_in_language(self):
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voice_artist_id))

        user_services.allow_user_to_review_voiceover_in_language(
            self.voice_artist_id, 'hi')

        self.assertTrue(
            user_services.can_review_voiceover_applications(
                self.voice_artist_id, language_code='hi'))

    def test_voiceover_review_assignement_adds_language_in_sorted_order(self):
        user_services.allow_user_to_review_voiceover_in_language(
            self.voice_artist_id, 'hi')
        user_contribution_rights = user_services.get_user_contribution_rights(
            self.voice_artist_id)
        self.assertEqual(
            user_contribution_rights.can_review_voiceover_for_language_codes,
            ['hi'])

        user_services.allow_user_to_review_voiceover_in_language(
            self.voice_artist_id, 'en')
        user_contribution_rights = user_services.get_user_contribution_rights(
            self.voice_artist_id)
        self.assertEqual(
            user_contribution_rights.can_review_voiceover_for_language_codes,
            ['en', 'hi'])

    def test_assign_user_review_question_suggestion(self):
        self.assertFalse(
            user_services.can_review_question_suggestions(self.voice_artist_id))

        user_services.allow_user_to_review_question(self.voice_artist_id)

        self.assertTrue(
            user_services.can_review_question_suggestions(self.voice_artist_id))

    def test_assign_user_submit_question_suggestion(self):
        self.assertFalse(
            user_services.can_submit_question_suggestions(self.voice_artist_id))

        user_services.allow_user_to_submit_question(self.voice_artist_id)

        self.assertTrue(
            user_services.can_submit_question_suggestions(self.voice_artist_id))

    def test_get_users_contribution_rights_with_multiple_reviewer_user_ids(
            self):
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'en')
        expected_reviewer_ids = [self.question_reviewer_id, self.translator_id]

        users_contribution_rights = (
            user_services.get_users_contribution_rights(expected_reviewer_ids)
        )

        reviewer_ids = [
            user_contribution_rights.id for user_contribution_rights in
            users_contribution_rights
        ]
        self.assertEqual(len(users_contribution_rights), 2)
        self.assertItemsEqual(reviewer_ids, expected_reviewer_ids)

    def test_get_users_contribution_rights_with_one_reviewer_user_id(
            self):
        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')
        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'en')

        users_contribution_rights = (
            user_services.get_users_contribution_rights([self.translator_id])
        )

        self.assertEqual(len(users_contribution_rights), 1)
        self.assertEqual(users_contribution_rights[0].id, self.translator_id)
        self.assertEqual(
            (
                users_contribution_rights[0]
                .can_review_translation_for_language_codes
            ), ['en', 'hi']
        )

    def test_get_users_contribution_rights_returns_empty_for_no_reviewers_ids(
            self):
        users_contribution_rights = (
            user_services.get_users_contribution_rights([])
        )

        self.assertEqual(len(users_contribution_rights), 0)

    def test_get_all_reviewers_contribution_rights(self):
        self.assertEqual(
            user_services.get_all_reviewers_contribution_rights(), [])

        user_services.allow_user_to_review_voiceover_in_language(
            self.voice_artist_id, 'hi')

        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')

        all_reviewers = user_services.get_all_reviewers_contribution_rights()
        self.assertItemsEqual(
            [reviewer.id for reviewer in all_reviewers],
            [self.voice_artist_id, self.translator_id])

    def test_get_reviewer_user_ids_to_notify_when_reviewers_want_notifications(
            self):
        # Assert that there are no reviewers at the start.
        self.assertEqual(
            user_services.get_all_reviewers_contribution_rights(), [])
        # Add a question reviewer and a translation reviewer.
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')

        user_services.update_email_preferences(
            self.question_reviewer_id, True,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)
        user_services.update_email_preferences(
            self.translator_id, True,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

        reviewer_ids_to_notify = (
            user_services.get_reviewer_user_ids_to_notify())

        self.assertEqual(len(reviewer_ids_to_notify), 2)
        self.assertIn(self.question_reviewer_id, reviewer_ids_to_notify)
        self.assertIn(self.translator_id, reviewer_ids_to_notify)

    def test_get_reviewer_user_ids_to_notify_when_reviewers_do_not_want_emails(
            self):
        # Assert that there are no reviewers at the start.
        self.assertEqual(
            user_services.get_all_reviewers_contribution_rights(), [])
        # Add a question reviewer and a translation reviewer.
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')

        user_services.update_email_preferences(
            self.question_reviewer_id, False,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)
        user_services.update_email_preferences(
            self.translator_id, False,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

        reviewer_ids_to_notify = (
            user_services.get_reviewer_user_ids_to_notify())

        self.assertEqual(len(reviewer_ids_to_notify), 0)

    def test_get_reviewer_user_ids_to_notify_returns_empty_for_no_reviewers(
            self):
        # Assert that there are no reviewers.
        self.assertEqual(
            user_services.get_all_reviewers_contribution_rights(), [])

        reviewer_ids_to_notify = (
            user_services.get_reviewer_user_ids_to_notify())

        self.assertEqual(len(reviewer_ids_to_notify), 0)

    def test_remove_translation_review_rights_in_language(self):
        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translator_id, language_code='hi'))
        user_services.remove_translation_review_rights_in_language(
            self.translator_id, 'hi')

        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translator_id, language_code='hi'))

    def test_remove_voiceover_review_rights_in_language(self):
        user_services.allow_user_to_review_voiceover_in_language(
            self.voice_artist_id, 'hi')
        self.assertTrue(
            user_services.can_review_voiceover_applications(
                self.voice_artist_id, language_code='hi'))
        user_services.remove_voiceover_review_rights_in_language(
            self.voice_artist_id, 'hi')

        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.voice_artist_id, language_code='hi'))

    def test_remove_question_review_rights(self):
        user_services.allow_user_to_review_question(self.question_reviewer_id)
        self.assertTrue(
            user_services.can_review_question_suggestions(
                self.question_reviewer_id))
        user_services.remove_question_review_rights(self.question_reviewer_id)

        self.assertFalse(
            user_services.can_review_question_suggestions(
                self.question_reviewer_id))

    def test_remove_contribution_reviewer(self):
        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')
        user_services.allow_user_to_review_voiceover_in_language(
            self.translator_id, 'hi')
        user_services.allow_user_to_review_question(self.translator_id)
        self.assertTrue(
            user_services.can_review_translation_suggestions(
                self.translator_id, language_code='hi'))
        self.assertTrue(
            user_services.can_review_voiceover_applications(
                self.translator_id, language_code='hi'))
        self.assertTrue(
            user_services.can_review_question_suggestions(
                self.translator_id))

        user_services.remove_contribution_reviewer(self.translator_id)

        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translator_id, language_code='hi'))
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.translator_id, language_code='hi'))
        self.assertFalse(
            user_services.can_review_question_suggestions(
                self.translator_id))

    def test_removal_of_all_review_rights_deletes_model(self):
        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')
        user_services.allow_user_to_review_question(self.translator_id)

        user_services.remove_question_review_rights(self.translator_id)

        right_model = user_models.UserContributionRightsModel.get_by_id(
            self.translator_id)
        self.assertFalse(right_model is None)

        user_services.remove_translation_review_rights_in_language(
            self.translator_id, 'hi')

        right_model = user_models.UserContributionRightsModel.get_by_id(
            self.translator_id)
        self.assertTrue(right_model is None)

    def test_get_question_reviewer_usernames_with_lanaguge_code_raise_error(
            self):
        with self.assertRaisesRegexp(
            Exception, 'Expected language_code to be None'):
            user_services.get_contributor_usernames(
                constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION,
                language_code='hi')

    def test_get_contributor_usernames_in_voiceover_category_returns_correctly(
            self):
        usernames = user_services.get_contributor_usernames(
            constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
            language_code='hi')
        self.assertEqual(usernames, [])

        user_services.allow_user_to_review_voiceover_in_language(
            self.voice_artist_id, 'hi')

        usernames = user_services.get_contributor_usernames(
            constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
            language_code='hi')

        self.assertEqual(usernames, [self.VOICE_ARTIST_USERNAME])

    def test_get_contributor_usernames_with_invalid_category_raises(
            self):
        with self.assertRaisesRegexp(
            Exception, 'Invalid category: invalid_category'):
            user_services.get_contributor_usernames(
                'invalid_category', language_code='hi')
