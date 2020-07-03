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
from core.domain import collection_services
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import user_jobs_continuous
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

from google.appengine.api import urlfetch

(user_models,) = models.Registry.import_models([models.NAMES.user])


class MockUserStatsAggregator(
        user_jobs_continuous.UserStatsAggregator):
    """A modified UserStatsAggregator that does not start a new
     batch job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return MockUserStatsMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class MockUserStatsMRJobManager(
        user_jobs_continuous.UserStatsMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return MockUserStatsAggregator


class UserServicesUnitTests(test_utils.GenericTestBase):
    """Test the user services methods."""
    def test_set_and_get_username(self):
        gae_id = 'someUser'
        username = 'username'
        with self.assertRaisesRegexp(Exception, 'User not found.'):
            user_services.set_username(gae_id, username)

        user_settings = user_services.create_new_user(
            gae_id, 'user@example.com')

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

    def test_get_usernames(self):
        gae_ids = ['test1', 'test2']
        usernames = ['name1', 'name2']
        user_emails = ['test1@email.com', 'test2@email.com']

        user_ids = []
        for gae_id, email, name in python_utils.ZIP(
                gae_ids, user_emails, usernames):
            user_id = user_services.create_new_user(gae_id, email).user_id
            user_services.set_username(user_id, name)
            user_ids.append(user_id)

        # Handle usernames that exists.
        self.assertEqual(usernames, user_services.get_usernames(user_ids))

        # Return None for usernames that don't exists.
        self.assertEqual(
            [None, 'name1'],
            user_services.get_usernames(['fakeUser', user_ids[0]]))

    def test_get_usernames_empty_list(self):
        # Return empty list when no user id passed.
        self.assertEqual([], user_services.get_usernames([]))

    def test_get_usernames_system_admin(self):
        # Check that system admin has correct username.
        self.assertEqual(
            [feconf.SYSTEM_COMMITTER_ID],
            user_services.get_usernames([feconf.SYSTEM_COMMITTER_ID]))

    def test_get_username_for_nonexistent_user(self):
        with self.assertRaisesRegexp(Exception, 'User not found.'):
            user_services.get_username('fakeUser')

    def test_get_username_none(self):
        user_id = user_services.create_new_user(
            'fakeUser', 'user@example.com').user_id
        self.assertEqual(None, user_services.get_username(user_id))

    def test_is_username_taken_false(self):
        self.assertFalse(user_services.is_username_taken('fakeUsername'))

    def test_is_username_taken_true(self):
        gae_id = 'someUser'
        username = 'newUsername'
        user_id = user_services.create_new_user(
            gae_id, 'user@example.com').user_id
        user_services.set_username(user_id, username)
        self.assertTrue(user_services.is_username_taken(username))

    def test_is_username_taken_different_case(self):
        gae_id = 'someUser'
        username = 'camelCase'
        user_id = user_services.create_new_user(
            gae_id, 'user@example.com').user_id
        user_services.set_username(user_id, username)
        self.assertTrue(user_services.is_username_taken('CaMeLcAsE'))

    def test_set_invalid_usernames(self):
        gae_id = 'someUser'
        user_id = user_services.create_new_user(
            gae_id, 'user@example.com').user_id
        bad_usernames = [
            ' bob ', '@', '', 'a' * 100, 'ADMIN', 'admin', 'AdMiN2020',
            'AbcOppiaMigrationBotXyz', 'OppiaMigrATIONBOTXyz',
            'AbcOppiaSuggestionBotXyz', 'AAAOPPIASuggestionBotBBB',
            'xyzOppia', 'oppiaXyz', 'abcOppiaXyz']
        for username in bad_usernames:
            with self.assertRaises(utils.ValidationError):
                user_services.set_username(user_id, username)

    def test_invalid_emails(self):
        bad_email_addresses = ['@', '@@', 'abc', '', None, ['a', '@', 'b.com']]
        for email in bad_email_addresses:
            with self.assertRaises(utils.ValidationError):
                user_services.create_new_user('user_id', email)

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

    def test_get_email_from_username(self):
        gae_id = 'someUser'
        username = 'username'
        user_email = 'user@example.com'

        user_settings = user_services.create_new_user(gae_id, user_email)
        user_services.set_username(user_settings.user_id, username)
        self.assertEqual(
            user_services.get_username(user_settings.user_id), username)

        # Handle usernames that exist.
        self.assertEqual(
            user_services.get_email_from_username(username), user_email)

        # Handle usernames in the same equivalence class correctly.
        self.assertEqual(
            user_services.get_email_from_username('USERNAME'), user_email)

        # Return None for usernames which don't exist.
        self.assertIsNone(
            user_services.get_email_from_username('fakeUsername'))

    def test_get_user_id_from_username(self):
        gae_id = 'someUser'
        username = 'username'
        user_email = 'user@example.com'

        user_settings = user_services.create_new_user(gae_id, user_email)
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

    def test_get_user_settings_by_gae_id(self):
        gae_id = 'gae_id'
        user_models.UserSettingsModel(
            id='user_id',
            gae_id=gae_id,
            email='user@example.com',
            username='username',
        ).put()
        user_settings_model = user_models.UserSettingsModel.get_by_gae_id(
            gae_id)
        user_settings = user_services.get_user_settings_by_gae_id(gae_id)
        self.assertEqual(user_settings_model.id, user_settings.user_id)
        self.assertEqual(user_settings_model.email, user_settings.email)
        self.assertEqual(user_settings_model.username, user_settings.username)
        self.assertIsNone(user_services.get_user_settings_by_gae_id('id_x'))

    def test_get_user_settings_by_gae_id_strict(self):
        gae_id = 'gae_id'
        user_models.UserSettingsModel(
            id='user_id',
            gae_id=gae_id,
            email='user@example.com',
            username='username',
        ).put()
        user_settings_model = user_models.UserSettingsModel.get_by_gae_id(
            gae_id)
        user_settings = user_services.get_user_settings_by_gae_id(
            gae_id, strict=True)
        self.assertEqual(user_settings_model.id, user_settings.user_id)
        self.assertEqual(user_settings_model.email, user_settings.email)
        self.assertEqual(user_settings_model.username, user_settings.username)

        with self.assertRaises(Exception):
            user_services.get_user_settings_by_gae_id('id_x', strict=True)

    def test_fetch_gravatar_success(self):
        user_email = 'user@example.com'
        expected_gravatar_filepath = os.path.join(
            self.get_static_asset_filepath(), 'assets', 'images', 'avatar',
            'gravatar_example.png')
        with python_utils.open_file(
            expected_gravatar_filepath, 'rb', encoding=None) as f:
            gravatar = f.read()
        with self.urlfetch_mock(content=gravatar):
            profile_picture = user_services.fetch_gravatar(user_email)
            gravatar_data_url = utils.convert_png_to_data_url(
                expected_gravatar_filepath)
            self.assertEqual(profile_picture, gravatar_data_url)

    def test_fetch_gravatar_failure_404(self):
        user_email = 'user@example.com'

        error_messages = []
        def mock_log_function(message):
            error_messages.append(message)

        gravatar_url = user_services.get_gravatar_url(user_email)
        expected_error_message = (
            '[Status 404] Failed to fetch Gravatar from %s' % gravatar_url)
        logging_error_mock = test_utils.CallCounter(mock_log_function)
        urlfetch_counter = test_utils.CallCounter(urlfetch.fetch)
        urlfetch_mock_ctx = self.urlfetch_mock(status_code=404)
        log_swap_ctx = self.swap(logging, 'error', logging_error_mock)
        fetch_swap_ctx = self.swap(urlfetch, 'fetch', urlfetch_counter)
        with urlfetch_mock_ctx, log_swap_ctx, fetch_swap_ctx:
            profile_picture = user_services.fetch_gravatar(user_email)
            self.assertEqual(urlfetch_counter.times_called, 1)
            self.assertEqual(logging_error_mock.times_called, 1)
            self.assertEqual(expected_error_message, error_messages[0])
            self.assertEqual(
                profile_picture, user_services.DEFAULT_IDENTICON_DATA_URL)

    def test_fetch_gravatar_failure_exception(self):
        user_email = 'user@example.com'

        error_messages = []
        def mock_log_function(message):
            error_messages.append(message)

        gravatar_url = user_services.get_gravatar_url(user_email)
        expected_error_message = (
            'Failed to fetch Gravatar from %s' % gravatar_url)
        logging_error_mock = test_utils.CallCounter(mock_log_function)
        urlfetch_fail_mock = test_utils.FailingFunction(
            urlfetch.fetch, urlfetch.InvalidURLError,
            test_utils.FailingFunction.INFINITY)
        log_swap_ctx = self.swap(logging, 'error', logging_error_mock)
        fetch_swap_ctx = self.swap(urlfetch, 'fetch', urlfetch_fail_mock)
        with log_swap_ctx, fetch_swap_ctx:
            profile_picture = user_services.fetch_gravatar(user_email)
            self.assertEqual(logging_error_mock.times_called, 1)
            self.assertEqual(expected_error_message, error_messages[0])
            self.assertEqual(
                profile_picture, user_services.DEFAULT_IDENTICON_DATA_URL)

    def test_default_identicon_data_url(self):
        identicon_filepath = os.path.join(
            self.get_static_asset_filepath(), 'assets', 'images', 'avatar',
            'user_blue_72px.png')
        identicon_data_url = utils.convert_png_to_data_url(identicon_filepath)
        self.assertEqual(
            identicon_data_url, user_services.DEFAULT_IDENTICON_DATA_URL)

    def test_set_and_get_user_email_preferences(self):
        gae_id = 'someUser'
        username = 'username'
        user_email = 'user@example.com'

        user_id = user_services.create_new_user(gae_id, user_email).user_id
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

        # The user retrieves their email preferences. This initializes
        # a UserEmailPreferencesModel instance with the default values.
        user_services.update_email_preferences(
            user_id, feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

        email_preferences = user_services.get_email_preferences(user_id)
        self.assertEqual(
            email_preferences.can_receive_editor_role_email,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
        self.assertEqual(
            email_preferences.can_receive_feedback_message_email,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)

        # The user sets their membership email preference to False.
        user_services.update_email_preferences(
            user_id, feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE, False, False,
            False)

        email_preferences = user_services.get_email_preferences(user_id)

        self.assertFalse(email_preferences.can_receive_editor_role_email)
        self.assertFalse(email_preferences.can_receive_feedback_message_email)
        self.assertFalse(email_preferences.can_receive_subscription_email)

    def test_set_and_get_user_email_preferences_for_exploration(self):
        gae_id = 'someUser'
        exploration_id = 'someExploration'
        username = 'username'
        user_email = 'user@example.com'

        user_id = user_services.create_new_user(gae_id, user_email).user_id
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
        gae_ids = ['test1', 'test2', 'test3', 'test4']
        usernames = ['name1', 'name2', 'name3', 'name4']
        user_emails = [
            'test1@email.com', 'test2@email.com',
            'test3@email.com', 'test4@email.com']

        user_ids = []
        for gae_id, email, name in python_utils.ZIP(
                gae_ids, user_emails, usernames):
            user_id = user_services.create_new_user(gae_id, email).user_id
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
        gae_ids = ['test1', 'test2', 'test3', 'test4']
        usernames = ['name1', 'name2', 'name3', 'name4']
        user_emails = [
            'test1@email.com', 'test2@email.com',
            'test3@email.com', 'test4@email.com']

        user_ids = []
        for uid, email, name in python_utils.ZIP(
                gae_ids, user_emails, usernames):
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
        gae_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(gae_id, user_email).user_id
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
        gae_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'

        user_id = user_services.create_new_user(gae_id, user_email).user_id
        user_services.set_username(user_id, username)

        self.assertEqual(user_services.get_user_role_from_id(user_id),
                         feconf.ROLE_ID_EXPLORATION_EDITOR)

        user_services.update_user_role(
            user_id, feconf.ROLE_ID_COLLECTION_EDITOR)
        self.assertEqual(user_services.get_user_role_from_id(user_id),
                         feconf.ROLE_ID_COLLECTION_EDITOR)

    def test_mark_user_for_deletion(self):
        gae_id = 'test_id'
        username = 'testname'
        user_email = 'test@email.com'
        exploration_ids = ['exp_id']
        collection_ids = ['col_id']

        user_id = user_services.create_new_user(gae_id, user_email).user_id
        user_services.set_username(user_id, username)

        user_services.mark_user_for_deletion(
            user_id, exploration_ids, collection_ids)

        user_settings = user_services.get_user_settings_by_gae_id(gae_id)
        self.assertTrue(user_settings.deleted)

        pending_deletion_model = (
            user_models.PendingDeletionRequestModel.get_by_id(user_id))
        self.assertEqual(
            pending_deletion_model.email, user_settings.email)
        self.assertFalse(
            pending_deletion_model.deletion_complete)
        self.assertEqual(
            pending_deletion_model.exploration_ids, exploration_ids)
        self.assertEqual(
            pending_deletion_model.collection_ids, collection_ids)

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
        test_datetime_strings = [
            '2016-06-30',
            '2016-07-05',
            '2016-13-01',
            '2016-03-32'
        ]

        self.assertEqual(
            user_services.parse_date_from_string(test_datetime_strings[0]),
            {
                'year': 2016,
                'month': 6,
                'day': 30
            })
        self.assertEqual(
            user_services.parse_date_from_string(test_datetime_strings[1]),
            {
                'year': 2016,
                'month': 7,
                'day': 5
            })

        with self.assertRaises(ValueError):
            user_services.parse_date_from_string(test_datetime_strings[2])
        with self.assertRaises(ValueError):
            user_services.parse_date_from_string(test_datetime_strings[3])

    def test_record_user_started_state_translation_tutorial(self):
        # Testing of the user translation tutorial firsttime state storage.
        gae_id = 'someUser'
        username = 'username'
        user_id = user_services.create_new_user(
            gae_id, 'user@example.com').user_id
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

        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.owner = user_services.UserActionsInfo(self.owner_id)

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
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.owner_id),
            {
                'total_plays': 0,
                'num_ratings': 0,
                'average_ratings': None
            })
        MockUserStatsAggregator.start_computation()
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            user_jobs_continuous.UserStatsAggregator.get_dashboard_stats(
                self.owner_id),
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
                    'total_plays': 0,
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

        MockUserStatsAggregator.start_computation()
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
        self.gae_id = 'someUser'
        self.username = 'username'
        self.user_email = 'user@example.com'

        self.user_id = user_services.create_new_user(
            self.gae_id, self.user_email).user_id
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


class UserSettingsTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UserSettingsTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.UserActionsInfo(self.owner_id)

        self.user_settings = user_services.get_user_settings(self.owner_id)
        self.user_settings.validate()
        self.assertEqual(self.owner.role, feconf.ROLE_ID_EXPLORATION_EDITOR)

    def test_validate_non_str_user_id(self):
        self.user_settings.user_id = 0
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected user_id to be a string'
        ):
            self.user_settings.validate()

    def test_validate_non_str_gae_id(self):
        self.user_settings.gae_id = 0
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected gae_id to be a string'
        ):
            self.user_settings.validate()

    def test_validate_empty_user_id(self):
        self.user_settings.user_id = ''
        with self.assertRaisesRegexp(
            utils.ValidationError, 'No user id specified.'
        ):
            self.user_settings.validate()

    def test_validate_non_str_role(self):
        self.user_settings.role = 0
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected role to be a string'
        ):
            self.user_settings.validate()

    def test_validate_role(self):
        self.user_settings.role = 'invalid_role'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Role invalid_role does not exist.'):
            self.user_settings.validate()

    def test_validate_non_str_creator_dashboard_display_pref(self):
        self.user_settings.creator_dashboard_display_pref = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected dashboard display preference to be a string'
        ):
            self.user_settings.validate()

    def test_validate_creator_dashboard_display_pref(self):
        self.user_settings.creator_dashboard_display_pref = (
            'invalid_creator_dashboard_display_pref')
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'invalid_creator_dashboard_display_pref is not a valid '
            'value for the dashboard display preferences.'
        ):
            self.user_settings.validate()

    def test_guest_has_not_fully_registered(self):
        self.assertFalse(user_services.has_fully_registered(None))

    def test_cannot_create_new_user_with_existing_user_id(self):
        with self.assertRaisesRegexp(
            Exception, 'User %s already exists.' % self.owner_id
        ):
            user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)

    def test_cannot_set_existing_username(self):
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Sorry, the username \"%s\" is already taken! Please pick '
            'a different one.' % self.OWNER_USERNAME
        ):
            user_services.set_username(self.owner_id, self.OWNER_USERNAME)

    def test_cannot_update_user_role_with_invalid_role(self):
        with self.assertRaisesRegexp(
            Exception, 'Role invalid_role does not exist.'
        ):
            user_services.update_user_role(self.owner_id, 'invalid_role')

    def test_cannot_get_human_readable_user_ids_with_invalid_user_ids(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        assert_raises_user_not_found = self.assertRaisesRegexp(
            Exception, 'User not found.')

        with logging_swap, assert_raises_user_not_found:
            user_services.get_human_readable_user_ids(['invalid_user_id'])

        self.assertEqual(
            observed_log_messages,
            [
                'User id invalid_user_id not known in list of user_ids '
                '[u\'invalid_user_id\']'
            ])

    def test_get_human_readable_user_ids(self):
        # Create an unregistered user who has no username.
        user_models.UserSettingsModel(
            id='unregistered_user_id',
            gae_id='gae_unregistered_user_id',
            email='user@example.com',
            username='').put()

        user_ids = user_services.get_human_readable_user_ids(
            [self.owner_id, feconf.SYSTEM_COMMITTER_ID, 'unregistered_user_id'])
        expected_user_ids = [
            'owner', 'admin',
            '[Awaiting user registration: u..@example.com]']

        self.assertEqual(user_ids, expected_user_ids)

    def test_created_on_gets_updated_correctly(self):
        # created_on should not be updated upon updating other attributes of
        # the user settings model.
        user_settings = user_services.create_new_user(
            'gae_id', 'user@example.com')

        user_settings_model = user_models.UserSettingsModel.get_by_id(
            user_settings.user_id)
        time_of_creation = user_settings_model.created_on

        user_services.update_user_bio(user_settings.user_id, 'New bio.')

        user_settings_model = user_models.UserSettingsModel.get_by_id(
            user_settings.user_id)
        self.assertEqual(user_settings_model.created_on, time_of_creation)


class UserContributionsTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UserContributionsTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_contributions = user_services.get_user_contributions(
            self.owner_id)
        self.user_contributions.validate()

    def test_validate_non_str_user_id(self):
        self.user_contributions.user_id = 0
        with self.assertRaisesRegexp(
            Exception, 'Expected user_id to be a string'):
            self.user_contributions.validate()

    def test_validate_user_id(self):
        self.user_contributions.user_id = ''
        with self.assertRaisesRegexp(Exception, 'No user id specified.'):
            self.user_contributions.validate()

    def test_validate_non_list_created_exploration_ids(self):
        self.user_contributions.created_exploration_ids = 0
        with self.assertRaisesRegexp(
            Exception, 'Expected created_exploration_ids to be a list'):
            self.user_contributions.validate()

    def test_validate_created_exploration_ids(self):
        self.user_contributions.created_exploration_ids = [0]
        with self.assertRaisesRegexp(
            Exception, 'Expected exploration_id in created_exploration_ids '
            'to be a string'):
            self.user_contributions.validate()

    def test_validate_non_list_edited_exploration_ids(self):
        self.user_contributions.edited_exploration_ids = 0
        with self.assertRaisesRegexp(
            Exception, 'Expected edited_exploration_ids to be a list'):
            self.user_contributions.validate()

    def test_validate_edited_exploration_ids(self):
        self.user_contributions.edited_exploration_ids = [0]
        with self.assertRaisesRegexp(
            Exception, 'Expected exploration_id in edited_exploration_ids '
            'to be a string'):
            self.user_contributions.validate()

    def test_cannot_create_user_contributions_with_existing_user_id(self):
        with self.assertRaisesRegexp(
            Exception,
            'User contributions model for user %s already exists.'
            % self.owner_id):
            user_services.create_user_contributions(self.owner_id, [], [])

    def test_cannot_update_user_contributions_with_invalid_user_id(self):
        with self.assertRaisesRegexp(
            Exception,
            'User contributions model for user invalid_user_id does not exist'):
            user_services.update_user_contributions('invalid_user_id', [], [])

    def test_cannot_update_dashboard_stats_log_with_invalid_schema_version(
            self):
        model = user_models.UserStatsModel.get_or_create(self.owner_id)
        model.schema_version = 0
        model.put()

        self.assertIsNone(user_services.get_user_impact_score(self.owner_id))
        with self.assertRaisesRegexp(
            Exception,
            'Sorry, we can only process v1-v%d dashboard stats schemas at '
            'present.' % feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION):
            user_services.update_dashboard_stats_log(self.owner_id)

    def test_flush_migration_bot_contributions_model(self):
        created_exploration_ids = ['exp_1', 'exp_2']
        edited_exploration_ids = ['exp_3', 'exp_4']
        user_services.create_user_contributions(
            feconf.MIGRATION_BOT_USER_ID, created_exploration_ids,
            edited_exploration_ids)

        migration_bot_contributions_model = (
            user_services.get_user_contributions(feconf.MIGRATION_BOT_USER_ID))
        self.assertEqual(
            migration_bot_contributions_model.created_exploration_ids,
            created_exploration_ids)
        self.assertEqual(
            migration_bot_contributions_model.edited_exploration_ids,
            edited_exploration_ids)

        user_services.flush_migration_bot_contributions_model()
        migration_bot_contributions_model = (
            user_services.get_user_contributions(feconf.MIGRATION_BOT_USER_ID))
        self.assertEqual(
            migration_bot_contributions_model.created_exploration_ids, [])
        self.assertEqual(
            migration_bot_contributions_model.edited_exploration_ids, [])


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
            self.get_user_id_from_email(self.TRANSLATOR_EMAIL))

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
        user_community_rights = user_services.get_user_community_rights(
            self.translator_id)
        self.assertEqual(
            user_community_rights.can_review_translation_for_language_codes,
            ['hi'])

        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'en')
        user_community_rights = user_services.get_user_community_rights(
            self.translator_id)
        self.assertEqual(
            user_community_rights.can_review_translation_for_language_codes,
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
        user_community_rights = user_services.get_user_community_rights(
            self.voice_artist_id)
        self.assertEqual(
            user_community_rights.can_review_voiceover_for_language_codes,
            ['hi'])

        user_services.allow_user_to_review_voiceover_in_language(
            self.voice_artist_id, 'en')
        user_community_rights = user_services.get_user_community_rights(
            self.voice_artist_id)
        self.assertEqual(
            user_community_rights.can_review_voiceover_for_language_codes,
            ['en', 'hi'])

    def test_assign_user_review_question_suggestion(self):
        self.assertFalse(
            user_services.can_review_question_suggestions(self.voice_artist_id))

        user_services.allow_user_to_review_question(self.voice_artist_id)

        self.assertTrue(
            user_services.can_review_question_suggestions(self.voice_artist_id))

    def test_get_all_community_reviewers(self):
        self.assertEqual(user_services.get_all_community_reviewers(), [])

        user_services.allow_user_to_review_voiceover_in_language(
            self.voice_artist_id, 'hi')

        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')

        all_reviewers = user_services.get_all_community_reviewers()
        self.assertItemsEqual(
            [reviewer.id for reviewer in all_reviewers],
            [self.voice_artist_id, self.translator_id])

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

    def test_remove_community_reviewer(self):
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

        user_services.remove_community_reviewer(self.translator_id)

        self.assertFalse(
            user_services.can_review_translation_suggestions(
                self.translator_id, language_code='hi'))
        self.assertFalse(
            user_services.can_review_voiceover_applications(
                self.translator_id, language_code='hi'))
        self.assertFalse(
            user_services.can_review_question_suggestions(
                self.translator_id))

    def test_removal_of_all_review_rights_delets_model(self):
        user_services.allow_user_to_review_translation_in_language(
            self.translator_id, 'hi')
        user_services.allow_user_to_review_question(self.translator_id)

        user_services.remove_question_review_rights(self.translator_id)

        right_model = user_models.UserCommunityRightsModel.get_by_id(
            self.translator_id)
        self.assertFalse(right_model is None)

        user_services.remove_translation_review_rights_in_language(
            self.translator_id, 'hi')

        right_model = user_models.UserCommunityRightsModel.get_by_id(
            self.translator_id)
        self.assertTrue(right_model is None)

    def test_get_question_reviewer_usernames_with_lanaguge_code_raise_error(
            self):
        with self.assertRaisesRegexp(
            Exception, 'Expected language_code to be None'):
            user_services.get_community_reviewer_usernames(
                constants.REVIEW_CATEGORY_QUESTION, language_code='hi')

    def test_get_community_reviewer_usernames_in_invalid_category_raise_error(
            self):
        with self.assertRaisesRegexp(
            Exception, 'Invalid review category: invalid_category'):
            user_services.get_community_reviewer_usernames(
                'invalid_category', language_code='hi')
