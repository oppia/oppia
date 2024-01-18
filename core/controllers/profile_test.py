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

"""Tests for the profile page."""

from __future__ import annotations

import datetime
import io
import logging
import os
import re
import zipfile

from core import feconf
from core import utils
from core.constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_services
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

from typing import Final

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import secrets_services
    from mypy_imports import user_models

secrets_services = models.Registry.import_secrets_services()
(user_models,) = models.Registry.import_models([models.Names.USER])


class ProfilePageTests(test_utils.GenericTestBase):

    def test_get_profile_page_of_existing_user(self) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        response = self.get_html_response('/profile/%s' % self.OWNER_USERNAME)
        self.assertIn(b'<oppia-root></oppia-root>', response.body)

    def test_page_not_found(self) -> None:
        message = 'Could not find the page {}/profilehandler/data/{}.'.format(
            'http://localhost', self.EDITOR_USERNAME
        )
        error = {
            'error': message, 'status_code': 404
        }
        with self.swap_to_always_return(
            user_services, 'get_user_settings_from_username', False
        ):
            self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
            self.login(self.EDITOR_EMAIL)
            csrf_token = self.get_new_csrf_token()
            self.put_json(
                '/preferenceshandler/data',
                {
                    'update_type': 'user_bio',
                    'data': 'Bio data of the editor'
                },
                csrf_token=csrf_token
            )
            self.put_json(
                '/preferenceshandler/data',
                {
                    'update_type': 'subject_interests',
                    'data': ['editor', 'writing']
                },
                csrf_token=csrf_token
            )
            self.logout()
            self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
            self.login(self.VIEWER_EMAIL)
            response = self.get_json(
                '/profilehandler/data/%s' % self.EDITOR_USERNAME,
                expected_status_int=404
            )
            self.assertEqual(response, error)
            self.logout()
            response = self.get_json(
                '/profilehandler/data/%s' % self.EDITOR_USERNAME,
                expected_status_int=404
            )
            self.assertEqual(response, error)

    def test_user_does_have_fully_registered_account(self) -> None:
        with self.swap_to_always_return(
            user_services, 'has_fully_registered_account', True
        ):
            self.login(self.EDITOR_EMAIL)
            self.get_html_response(
                feconf.SIGNUP_URL + '?return_url=/',
                expected_status_int=302
            )
            csrf_token = self.get_new_csrf_token()
            response = self.post_json(
                feconf.SIGNUP_DATA_URL,
                {
                    'username': self.EDITOR_USERNAME,
                    'agreed_to_terms': True,
                    'default_dashboard': constants.DASHBOARD_TYPE_CREATOR,
                    'can_receive_email_updates': (
                        feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                    )
                },
                csrf_token=csrf_token
            )
            self.assertEqual(response, {})
            self.logout()


class ProfileDataHandlerTests(test_utils.GenericTestBase):

    def test_preference_page_updates(self) -> None:
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        original_preferences = self.get_json('/preferenceshandler/data')
        self.assertEqual(
            ['en'], original_preferences['preferred_language_codes'])
        self.assertIsNone(original_preferences['preferred_site_language_code'])
        self.assertIsNone(original_preferences['preferred_audio_language_code'])
        self.assertIsNone(
            original_preferences['preferred_translation_language_code'])
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'preferred_site_language_code', 'data': 'en'},
            csrf_token=csrf_token)
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'preferred_audio_language_code', 'data': 'hi-en'},
            csrf_token=csrf_token)
        self.put_json(
            '/preferenceshandler/data', {
                'update_type': 'preferred_translation_language_code',
                'data': 'en'
            },
            csrf_token=csrf_token)
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'preferred_language_codes', 'data': ['de']},
            csrf_token=csrf_token)
        new_preferences = self.get_json('/preferenceshandler/data')
        self.assertEqual(new_preferences['preferred_language_codes'], ['de'])
        self.assertEqual(new_preferences['preferred_site_language_code'], 'en')
        self.assertEqual(
            new_preferences['preferred_audio_language_code'], 'hi-en')
        self.assertEqual(
            new_preferences['preferred_translation_language_code'], 'en')

    def test_profile_data_is_independent_of_currently_logged_in_user(
        self
    ) -> None:
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'user_bio', 'data': 'My new editor bio'},
            csrf_token=csrf_token)
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'subject_interests', 'data': ['editor', 'editing']},
            csrf_token=csrf_token)
        self.logout()

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'user_bio', 'data': 'My new viewer bio'},
            csrf_token=csrf_token)
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'subject_interests', 'data': ['viewer', 'viewing']},
            csrf_token=csrf_token)
        self.logout()

        # Viewer looks at editor's profile page.
        self.login(self.VIEWER_EMAIL)
        response = self.get_json(
            '/profilehandler/data/%s' % self.EDITOR_USERNAME)
        self.assertEqual(response['user_bio'], 'My new editor bio')
        self.assertEqual(response['subject_interests'], ['editor', 'editing'])
        self.logout()

        # Editor looks at their own profile page.
        self.login(self.EDITOR_EMAIL)
        response = self.get_json(
            '/profilehandler/data/%s' % self.EDITOR_USERNAME)
        self.assertEqual(response['user_bio'], 'My new editor bio')
        self.assertEqual(response['subject_interests'], ['editor', 'editing'])
        self.logout()

        # Looged-out user looks at editor's profile page.
        response = self.get_json(
            '/profilehandler/data/%s' % self.EDITOR_USERNAME)
        self.assertEqual(response['user_bio'], 'My new editor bio')
        self.assertEqual(response['subject_interests'], ['editor', 'editing'])

    def test_preferences_page(self) -> None:
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)

        response = self.get_html_response(feconf.PREFERENCES_URL)
        self.assertIn(b'<oppia-root></oppia-root>', response.body)

        self.logout()


class UserContributionsTests(test_utils.GenericTestBase):

    USERNAME_A: Final = 'a'
    EMAIL_A: Final = 'a@example.com'
    USERNAME_B: Final = 'b'
    EMAIL_B: Final = 'b@example.com'
    EXP_ID_1: Final = 'exp_id_1'

    def test_null_case(self) -> None:
        # Check that the profile page for a user with no contributions shows
        # that they have 0 created/edited explorations.
        self.signup(self.EMAIL_A, self.USERNAME_A)
        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME_A)
        self.assertEqual(
            response_dict['created_exp_summary_dicts'], [])
        self.assertEqual(
            response_dict['edited_exp_summary_dicts'], [])

    def test_created(self) -> None:
        # Check that the profile page for a user who has created
        # a single exploration shows 1 created and 1 edited exploration.
        self.signup(self.EMAIL_A, self.USERNAME_A)
        user_a_id = self.get_user_id_from_email(self.EMAIL_A)
        user_a = user_services.get_user_actions_info(user_a_id)
        self.save_new_valid_exploration(
            self.EXP_ID_1, user_a_id, end_state_name='End')
        rights_manager.publish_exploration(user_a, self.EXP_ID_1)

        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME_A)
        self.assertEqual(len(
            response_dict['created_exp_summary_dicts']), 1)
        self.assertEqual(len(
            response_dict['edited_exp_summary_dicts']), 1)
        self.assertEqual(
            response_dict['created_exp_summary_dicts'][0]['id'],
            self.EXP_ID_1)
        self.assertEqual(
            response_dict['edited_exp_summary_dicts'][0]['id'],
            self.EXP_ID_1)

    def test_edited(self) -> None:
        # Check that the profile page for a user who has created
        # a single exploration shows 0 created and 1 edited exploration.
        self.signup(self.EMAIL_A, self.USERNAME_A)
        user_a_id = self.get_user_id_from_email(self.EMAIL_A)

        self.signup(self.EMAIL_B, self.USERNAME_B)
        user_b_id = self.get_user_id_from_email(self.EMAIL_B)
        user_a = user_services.get_user_actions_info(user_a_id)
        self.save_new_valid_exploration(
            self.EXP_ID_1, user_a_id, end_state_name='End')
        rights_manager.publish_exploration(user_a, self.EXP_ID_1)

        exp_services.update_exploration(
            user_b_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')
        self.process_and_flush_pending_tasks()

        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME_B)
        self.assertEqual(len(
            response_dict['created_exp_summary_dicts']), 0)
        self.assertEqual(len(
            response_dict['edited_exp_summary_dicts']), 1)
        self.assertEqual(
            response_dict['edited_exp_summary_dicts'][0]['id'],
            self.EXP_ID_1)
        self.assertEqual(
            response_dict['edited_exp_summary_dicts'][0]['objective'],
            'the objective')


class FirstContributionDateTests(test_utils.GenericTestBase):

    USERNAME: Final = 'abc123'
    EMAIL: Final = 'abc123@gmail.com'

    def test_contribution_msec(self) -> None:
        # Test the contribution time shows up correctly as None.
        self.signup(self.EMAIL, self.USERNAME)
        self.login(self.EMAIL)
        user_id = self.get_user_id_from_email(self.EMAIL)
        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME)
        self.assertIsNone(response_dict['first_contribution_msec'])

        # Update the first_contribution_msec to the current time in
        # milliseconds.
        first_time_in_msecs = utils.get_current_time_in_millisecs()
        user_settings_to_update = user_services.get_user_settings(user_id)
        user_settings_to_update.update_first_contribution_msec(
            first_time_in_msecs
        )
        user_services.save_user_settings(user_settings_to_update)

        # Test the contribution date correctly changes to current_time_in_msecs.
        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME)
        self.assertEqual(
            response_dict['first_contribution_msec'],
            first_time_in_msecs)

        # Test that the contribution date is not changed after the first time it
        # is set.
        second_time_in_msecs = utils.get_current_time_in_millisecs()
        user_settings_to_update = user_services.get_user_settings(user_id)
        user_settings_to_update.update_first_contribution_msec(
            second_time_in_msecs
        )
        user_services.save_user_settings(user_settings_to_update)
        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME)
        self.assertEqual(
            response_dict['first_contribution_msec'],
            first_time_in_msecs)


class PreferencesHandlerTests(test_utils.GenericTestBase):

    EXP_ID: Final = 'exp_id'
    EXP_TITLE: Final = 'Exploration title'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_can_see_subscriptions(self) -> None:
        self.login(self.VIEWER_EMAIL)

        response = self.get_json(feconf.PREFERENCES_DATA_URL)
        self.assertEqual(len(response['subscription_list']), 0)

        # Subscribe to user.
        subscription_services.subscribe_to_creator(
            self.viewer_id, self.owner_id)
        response = self.get_json(feconf.PREFERENCES_DATA_URL)
        self.assertEqual(len(response['subscription_list']), 1)
        self.assertEqual(
            response['subscription_list'][0]['creator_username'],
            self.OWNER_USERNAME)

        # Unsubscribe from user.
        subscription_services.unsubscribe_from_creator(
            self.viewer_id, self.owner_id)
        response = self.get_json(feconf.PREFERENCES_DATA_URL)
        self.assertEqual(len(response['subscription_list']), 0)
        self.logout()

    def test_can_update_profile_picture_data_url(self) -> None:
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        user_settings = user_services.get_user_settings(self.owner_id)
        # Ruling out the possibility of different types for mypy type checking.
        assert isinstance(user_settings.username, str)
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_png_img.png'),
            'rb',
            encoding=None
        ) as f:
            raw_image = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_USER, user_settings.username)
        fs.commit('profile_picture.png', raw_image, mimetype='image/png')
        self.put_json(
            feconf.PREFERENCES_DATA_URL,
            {
                'update_type': 'profile_picture_data_url',
                'data': user_services.DEFAULT_IDENTICON_DATA_URL},
            csrf_token=csrf_token)
        profile_data = utils.convert_image_binary_to_data_url(
            fs.get('profile_picture.png'), 'png')
        self.assertEqual(profile_data, user_services.DEFAULT_IDENTICON_DATA_URL)
        self.logout()

    def test_can_update_default_dashboard(self) -> None:
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        user_settings = user_services.get_user_settings(self.owner_id)
        self.put_json(
            feconf.PREFERENCES_DATA_URL,
            {
                'update_type': 'default_dashboard',
                'data': constants.DASHBOARD_TYPE_CREATOR},
            csrf_token=csrf_token)
        user_settings = user_services.get_user_settings(self.owner_id)
        self.assertEqual(
            user_settings.default_dashboard, constants.DASHBOARD_TYPE_CREATOR)
        self.logout()

    def test_update_preferences_with_invalid_update_type_raises_exception(
        self
    ) -> None:
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with self.assertRaisesRegex(Exception, 'Invalid update type:'):
            self.put_json(
                feconf.PREFERENCES_DATA_URL,
                {'update_type': 'invalid_update_type'},
                csrf_token=csrf_token)
        self.logout()

    def test_update_subject_interests_non_list_input_raises_exception(
        self) -> None:
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with self.assertRaisesRegex(
            Exception, 'Expected subject_interests to be a list'):
            self.put_json(
                feconf.PREFERENCES_DATA_URL,
                {'update_type': 'subject_interests', 'data': 'not a list'},
                csrf_token=csrf_token)
        self.logout()

    def test_update_preferrd_language_codes_non_list_input_raises_exception(
        self) -> None:
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with self.assertRaisesRegex(
            Exception, 'Expected preferred_language_codes to be a list'):
            self.put_json(
                feconf.PREFERENCES_DATA_URL,
                {'update_type': 'preferred_language_codes', 'data': 'en'},
                csrf_token=csrf_token)
        self.logout()

    def test_incorrect_key_in_email_data_dict_raises_exception(self) -> None:
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        data = {
            'can_receive_email_updates': False,
            'can_receive_editor_role_email': False,
            'can_receive_feedback_message_email': False,
            'can_receive_subscription_email_this_key_is_wrong': False
        }
        with self.assertRaisesRegex(
            Exception, 'Expected data to contain the fields,'):
            self.put_json(
                feconf.PREFERENCES_DATA_URL,
                {'update_type': 'email_preferences', 'data': data},
                csrf_token=csrf_token)
        self.logout()

    def test_missing_key_in_email_data_dict_raises_exception(self) -> None:
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        data = {
            'can_receive_email_updates': False,
            'can_receive_editor_role_email': False,
            'can_receive_feedback_message_email': False,
        }
        with self.assertRaisesRegex(
            Exception, 'Expected data to contain the fields'):
            self.put_json(
                feconf.PREFERENCES_DATA_URL,
                {'update_type': 'email_preferences', 'data': data},
                csrf_token=csrf_token)
        self.logout()

    def test_non_boolean_values_in_email_data_dict_raises_exception(
        self) -> None:
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        data = {
            'can_receive_email_updates': False,
            'can_receive_editor_role_email': False,
            'can_receive_feedback_message_email': False,
            'can_receive_subscription_email': 1
        }
        with self.assertRaisesRegex(
            Exception, 'Expected all values of data to be boolean'):
            self.put_json(
                feconf.PREFERENCES_DATA_URL,
                {'update_type': 'email_preferences', 'data': data},
                csrf_token=csrf_token)
        self.logout()

    def test_update_prfrence_which_need_str_with_non_str_input_raise_exception(
        self) -> None:
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        update_types = ['user_bio', 'preferred_translation_language_code',
            'preferred_audio_language_code', 'preferred_site_language_code',
            'default_dashboard', 'profile_picture_data_url'
        ]
        for update_type in update_types:
            with self.assertRaisesRegex(
                Exception, 'Expected %s to be a str' % update_type):
                self.put_json(
                    feconf.PREFERENCES_DATA_URL,
                    {'update_type': update_type, 'data': 1},
                    csrf_token=csrf_token)
        self.logout()


class LongUserBioHandlerTests(test_utils.GenericTestBase):
    USERNAME_A: Final = 'a'
    EMAIL_A: Final = 'a@example.com'
    USERNAME_B: Final = 'b'
    EMAIL_B: Final = 'b@example.com'

    def test_userbio_within_limit(self) -> None:
        self.signup(self.EMAIL_A, self.USERNAME_A)
        self.login(self.EMAIL_A)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/preferenceshandler/data', {
                'update_type': 'user_bio',
                'data': 'I am within 2000 char limit',
            }, csrf_token=csrf_token)
        preferences = self.get_json('/preferenceshandler/data')
        self.assertIsNotNone(preferences)
        self.assertEqual(
            preferences['user_bio'], 'I am within 2000 char limit')
        self.logout()

    def test_user_bio_exceeds_limit(self) -> None:
        self.signup(self.EMAIL_B, self.USERNAME_B)
        self.login(self.EMAIL_B)
        csrf_token = self.get_new_csrf_token()
        user_bio_response = self.put_json(
            '/preferenceshandler/data', {
                'update_type': 'user_bio',
                'data': 'I am not within 2000 char limit' * 200
            },
            csrf_token=csrf_token, expected_status_int=400)
        self.assertEqual(user_bio_response['status_code'], 400)
        self.assertIn(
            'User bio exceeds maximum character limit: %s'
            % feconf.MAX_BIO_LENGTH_IN_CHARS,
            user_bio_response['error'])
        self.logout()


class EmailPreferencesTests(test_utils.GenericTestBase):

    def test_missing_can_receive_email_updates_key_raises_error(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        csrf_token = self.get_new_csrf_token()
        response = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'username': self.EDITOR_USERNAME,
                'agreed_to_terms': True,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        self.assertEqual(
            response['error'],
            'Missing key in handler args: can_receive_email_updates.'
        )

    def test_user_allowing_emails_on_signup(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        csrf_token = self.get_new_csrf_token()
        json_response = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'username': self.EDITOR_USERNAME,
                'agreed_to_terms': True,
                'can_receive_email_updates': True,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER
            },
            csrf_token=csrf_token)
        self.assertFalse(
            json_response['bulk_email_signup_message_should_be_shown'])

        # The email update preference should be True in all cases.
        editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', True):
            email_preferences = user_services.get_email_preferences(editor_id)
            self.assertEqual(email_preferences.can_receive_email_updates, True)
            self.assertEqual(
                email_preferences.can_receive_editor_role_email,
                feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
            self.assertEqual(
                email_preferences.can_receive_feedback_message_email,
                feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)
            self.assertEqual(
                email_preferences.can_receive_subscription_email,
                feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', False):
            email_preferences = user_services.get_email_preferences(editor_id)
            self.assertEqual(email_preferences.can_receive_email_updates, True)
            self.assertEqual(
                email_preferences.can_receive_editor_role_email,
                feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
            self.assertEqual(
                email_preferences.can_receive_feedback_message_email,
                feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)
            self.assertEqual(
                email_preferences.can_receive_subscription_email,
                feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

    def test_send_post_signup_email(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        csrf_token = self.get_new_csrf_token()
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            with self.swap_to_always_return(
                user_services, 'has_ever_registered', False
            ):
                json_response = self.post_json(
                    feconf.SIGNUP_DATA_URL,
                    {
                        'username': self.EDITOR_USERNAME,
                        'agreed_to_terms': True,
                        'default_dashboard': constants.DASHBOARD_TYPE_CREATOR,
                        'can_receive_email_updates': (
                            feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                        )
                    },
                    csrf_token=csrf_token
                )
                self.assertFalse(
                    json_response['bulk_email_signup_message_should_be_shown']
                )

    def test_user_cannot_be_added_to_bulk_email_mailing_list(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        csrf_token = self.get_new_csrf_token()
        with self.swap_to_always_return(
            user_services, 'update_email_preferences', True
        ):
            json_response = self.post_json(
                feconf.SIGNUP_DATA_URL,
                {
                    'username': self.EDITOR_USERNAME,
                    'agreed_to_terms': True,
                    'can_receive_email_updates': True,
                    'default_dashboard': constants.DASHBOARD_TYPE_LEARNER
                }, csrf_token=csrf_token)
            self.assertTrue(
                json_response['bulk_email_signup_message_should_be_shown'])

    def test_user_disallowing_emails_on_signup(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'username': self.EDITOR_USERNAME,
                'agreed_to_terms': True,
                'can_receive_email_updates': False,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER
            },
            csrf_token=csrf_token)

        # The email update preference should be False in all cases.
        editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', True):
            email_preferences = user_services.get_email_preferences(editor_id)
            self.assertEqual(email_preferences.can_receive_email_updates, False)
            self.assertEqual(
                email_preferences.can_receive_editor_role_email,
                feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
            self.assertEqual(
                email_preferences.can_receive_feedback_message_email,
                feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)
            self.assertEqual(
                email_preferences.can_receive_subscription_email,
                feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', False):
            email_preferences = user_services.get_email_preferences(editor_id)
            self.assertEqual(email_preferences.can_receive_email_updates, False)
            self.assertEqual(
                email_preferences.can_receive_editor_role_email,
                feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
            self.assertEqual(
                email_preferences.can_receive_feedback_message_email,
                feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE)
            self.assertEqual(
                email_preferences.can_receive_subscription_email,
                feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

    def test_email_preferences_updates(self) -> None:
        """Test that Preferences Handler correctly updates the email
        preferences of the user.
        """

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        payload = {
            'update_type': 'email_preferences',
            'data': {
                'can_receive_email_updates': True,
                'can_receive_editor_role_email': True,
                'can_receive_feedback_message_email': True,
                'can_receive_subscription_email': True
            }
        }

        # Allow all emails.
        self.put_json(
            '/preferenceshandler/data', payload, csrf_token=csrf_token)

        email_preferences = user_services.get_email_preferences(editor_id)
        self.assertTrue(email_preferences.can_receive_email_updates)
        self.assertTrue(email_preferences.can_receive_editor_role_email)
        self.assertTrue(email_preferences.can_receive_feedback_message_email)
        self.assertTrue(email_preferences.can_receive_subscription_email)

        payload = {
            'update_type': 'email_preferences',
            'data': {
                'can_receive_email_updates': False,
                'can_receive_editor_role_email': False,
                'can_receive_feedback_message_email': False,
                'can_receive_subscription_email': False
            }
        }

        # Disallow all emails.
        self.put_json(
            '/preferenceshandler/data', payload, csrf_token=csrf_token)

        email_preferences = user_services.get_email_preferences(editor_id)
        self.assertFalse(email_preferences.can_receive_email_updates)
        self.assertFalse(email_preferences.can_receive_editor_role_email)
        self.assertFalse(email_preferences.can_receive_feedback_message_email)
        self.assertFalse(email_preferences.can_receive_subscription_email)


class SignupTests(test_utils.GenericTestBase):

    def test_signup_page_does_not_have_top_right_menu(self) -> None:
        self.login(self.EDITOR_EMAIL)
        response = self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        # Sign in can't be inside an html tag, but can appear inside js code.
        response.mustcontain(no=['Logout'])
        self.logout()

    def test_going_somewhere_else_while_signing_in_logs_user_out(self) -> None:
        exp_services.load_demo('0')

        self.login(self.EDITOR_EMAIL)
        response = self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        self.get_html_response(feconf.SIGNUP_URL)
        response = self.get_html_response('/create/0', expected_status_int=302)
        self.assertIn('logout', response.headers['location'])
        self.assertIn('create', response.headers['location'])

        self.logout()

    def test_to_check_url_redirection_in_signup(self) -> None:
        """To validate the redirections from return_url."""
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        csrf_token = self.get_new_csrf_token()

        # Registering this user fully.
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'username': self.EDITOR_USERNAME,
                'agreed_to_terms': True,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                'can_receive_email_updates': (
                    feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                )
            },
            csrf_token=csrf_token
        )

        def strip_domain_from_location_header(url: str) -> str:
            """To strip the domain form the location url."""
            splitted_url = re.match(r'(http[s]?:\/\/)?([^\/\s]+\/)(.*)', url)
            assert splitted_url is not None
            return splitted_url.group(3)

        response = self.get_html_response(
            '/signup?return_url=https://google.com', expected_status_int=302)
        self.assertEqual('', strip_domain_from_location_header(
            response.headers['location']))

        response = self.get_html_response(
            '/signup?return_url=//google.com', expected_status_int=302)
        self.assertEqual('', strip_domain_from_location_header(
            response.headers['location']))

        response = self.get_html_response(
            '/signup?return_url=/page#hello', expected_status_int=302)
        self.assertEqual('page', strip_domain_from_location_header(
            response.headers['location']))

        response = self.get_html_response(
            '/signup?return_url=/page/hello', expected_status_int=302)
        self.assertEqual('page/hello', strip_domain_from_location_header(
            response.headers['location']))

        response = self.get_html_response(
            '/signup?return_url=/page/hello?id=tests', expected_status_int=302)
        self.assertEqual(
            'page/hello?id=tests', strip_domain_from_location_header(
                response.headers['location']))

        self.logout()

    def test_accepting_terms_is_handled_correctly(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        csrf_token = self.get_new_csrf_token()

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'username': self.EDITOR_USERNAME,
                'agreed_to_terms': False,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                'can_receive_email_updates': (
                    feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                )
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        error_msg = (
            'In order to edit explorations on this site, you will need to'
            ' accept the license terms.'
        )
        self.assertIn(
            'In order to edit explorations on this site, you will need to'
            ' accept the license terms.', response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'username': self.EDITOR_USERNAME,
                'agreed_to_terms': False,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                'can_receive_email_updates': (
                    feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                )
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        self.assertIn(error_msg, response_dict['error'])

        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'agreed_to_terms': True,
                'username': self.EDITOR_USERNAME,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                'can_receive_email_updates': (
                    feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                )
            },
            csrf_token=csrf_token
        )

        self.logout()

    def test_username_is_handled_correctly(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        csrf_token = self.get_new_csrf_token()

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'agreed_to_terms': True,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER
            },
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn(
            'Missing key in handler args: username.',
            response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'username': '',
                'agreed_to_terms': True,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER
            },
            csrf_token=csrf_token, expected_status_int=400)
        error_msg = 'Validation failed: is_valid_username_string ({})'
        self.assertIn(
            'Schema validation for \'username\' failed: %s for object'
            % error_msg,
            response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'username': '!a!',
                'agreed_to_terms': True,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER
            },
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn(
            'Schema validation for \'username\' failed: %s for object !a!'
            % error_msg,
            response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'username': self.UNICODE_TEST_STRING,
                'agreed_to_terms': True,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                'can_receive_email_updates': (
                    feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                )
            },
            csrf_token=csrf_token,
            expected_status_int=400
        )
        self.assertIn(
            'Schema validation for \'username\' failed: %s for object %s'
            % (error_msg, self.UNICODE_TEST_STRING),
            response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'username': 'abcde',
                'agreed_to_terms': True,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                'can_receive_email_updates': (
                    feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                )
            },
            csrf_token=csrf_token
        )

        self.logout()

    def test_default_dashboard_for_new_users(self) -> None:
        self.login(self.EDITOR_EMAIL)
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')
        csrf_token = self.get_new_csrf_token()

        # This user should have the creator dashboard as default.
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'agreed_to_terms': True, 'username': self.EDITOR_USERNAME,
                'default_dashboard': constants.DASHBOARD_TYPE_CREATOR,
                'can_receive_email_updates': (
                    feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                )
            },
            csrf_token=csrf_token
        )

        editor_user_id = user_services.get_user_id_from_username(
            self.EDITOR_USERNAME
        )
        assert editor_user_id is not None
        user_settings = user_services.get_user_settings(
            editor_user_id, strict=True
        )
        self.assertEqual(
            user_settings.default_dashboard, constants.DASHBOARD_TYPE_CREATOR)

        self.logout()

        user_services.create_new_user(
            self.get_auth_id_from_email(self.VIEWER_EMAIL), self.VIEWER_EMAIL)
        self.login(self.VIEWER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # This user should have the learner dashboard as default.
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {
                'agreed_to_terms': True,
                'username': self.VIEWER_USERNAME,
                'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
                'can_receive_email_updates': (
                    feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE
                )
            },
            csrf_token=csrf_token
        )

        viewer_user_id = user_services.get_user_id_from_username(
            self.VIEWER_USERNAME
        )
        assert viewer_user_id is not None
        user_settings = user_services.get_user_settings(
            viewer_user_id, strict=True
        )
        self.assertEqual(
            user_settings.default_dashboard, constants.DASHBOARD_TYPE_LEARNER)

        self.logout()

    def test_user_settings_of_non_existing_user(self) -> None:
        self.login(self.OWNER_EMAIL)
        self.get_html_response(feconf.SIGNUP_URL + '?return_url=/')

        values_dict = {
            'can_send_emails': False,
            'has_agreed_to_latest_terms': False,
            'has_ever_registered': False,
            'username': None,
        }

        response = self.get_json(feconf.SIGNUP_DATA_URL)
        self.assertDictEqual(values_dict, response)
        self.logout()

    def test_user_settings_of_existing_user(self) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.login(self.OWNER_EMAIL)
        values_dict = {
            'can_send_emails': True,
            'has_agreed_to_latest_terms': True,
            'has_ever_registered': True,
            'username': 'owner',
        }
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            response = self.get_json(feconf.SIGNUP_DATA_URL)
            self.assertDictEqual(values_dict, response)

        self.logout()


class DeleteAccountPageTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)

    def test_get_delete_account_page(self) -> None:
        response = self.get_html_response('/delete-account')
        self.assertIn(b'<oppia-root></oppia-root>', response.body)


class MailingListSubscriptionHandlerTests(test_utils.GenericTestBase):

    def test_put_function(self) -> None:
        swap_add_fn = self.swap(
            user_services, 'add_user_to_mailing_list', lambda *args,
            **kwargs: True)

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)

        csrf_token = self.get_new_csrf_token()
        with swap_add_fn:
            json_response = self.put_json(
                '/mailinglistsubscriptionhandler', {
                    'email': 'email@example.com',
                    'tag': 'Web',
                    'name': 'Name'
                }, csrf_token=csrf_token)
            self.assertEqual(json_response, {'status': True})

            # Name parameter should be optional.
            json_response = self.put_json(
                '/mailinglistsubscriptionhandler', {
                    'email': 'email2@example.com',
                    'tag': 'Web',
                }, csrf_token=csrf_token)
            self.assertEqual(json_response, {'status': True})

        self.logout()

    def test_email_provider_error(self) -> None:
        def raise_exception() -> None:
            raise Exception('Backend error')
        swap_add_fn = self.swap(
            user_services, 'add_user_to_mailing_list', raise_exception)

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)

        csrf_token = self.get_new_csrf_token()
        with swap_add_fn:
            self.put_json(
                '/mailinglistsubscriptionhandler', {
                    'email': 'email@example.com',
                    'tag': 'Web',
                    'name': 'Name'
                }, csrf_token=csrf_token, expected_status_int=500)

        self.logout()

    def test_invalid_inputs(self) -> None:
        swap_add_fn = self.swap(
            user_services, 'add_user_to_mailing_list', lambda *args: True)

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)

        csrf_token = self.get_new_csrf_token()
        with swap_add_fn:
            self.put_json(
                '/mailinglistsubscriptionhandler', {
                    'email': 'invalidemail.com',
                    'tag': 'Web',
                    'name': 'Name'
                }, csrf_token=csrf_token, expected_status_int=400)

            self.put_json(
                '/mailinglistsubscriptionhandler', {
                    'email': 'email@example.com',
                    'tag': 'Web',
                    'name': ''
                }, csrf_token=csrf_token, expected_status_int=400)

            self.put_json(
                '/mailinglistsubscriptionhandler', {
                    'email': 'email@example.com',
                    'tag': '',
                    'name': 'Name'
                }, csrf_token=csrf_token, expected_status_int=400)

        self.logout()


class BulkEmailWebhookEndpointTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.swap_secret = self.swap_to_always_return(
            secrets_services, 'get_secret', 'secret')
        self.swap_audience_id = (
            self.swap(feconf, 'MAILCHIMP_AUDIENCE_ID', 'audience_id'))
        user_services.update_email_preferences(
            self.editor_id, feconf.DEFAULT_EMAIL_UPDATES_PREFERENCE,
            feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE,
            feconf.DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE,
            feconf.DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE)

    def test_get_function(self) -> None:
        # The GET function should not throw any error and should return status
        # 200. No other check required here.
        with self.swap_secret:
            self.get_html_response(
                '%s/secret' % feconf.BULK_EMAIL_WEBHOOK_ENDPOINT)

    def test_raises_error_if_audience_id_provided_without_email_id(
        self
    ) -> None:
        response = self.post_json(
                '%s/secret' % feconf.BULK_EMAIL_WEBHOOK_ENDPOINT,
                {
                    'data[list_id]': 'audience_id',
                    'type': 'subscribe'
                },
                use_payload=False,
                expected_status_int=400
            )
        self.assertEqual(
            response['error'],
            'Missing key in handler args: data[email].'
        )

    def test_post_with_different_audience_id(self) -> None:
        with self.swap_secret, self.swap_audience_id:
            json_response = self.post_json(
                '%s/secret' % feconf.BULK_EMAIL_WEBHOOK_ENDPOINT, {
                    'data[list_id]': 'invalid_audience_id',
                    'data[email]': self.EDITOR_EMAIL,
                    'type': 'subscribe'
                }, use_payload=False)
            self.assertEqual(json_response, {})

    def test_post_with_invalid_email_id(self) -> None:
        with self.swap_secret, self.swap_audience_id:
            json_response = self.post_json(
                '%s/secret' % feconf.BULK_EMAIL_WEBHOOK_ENDPOINT, {
                    'data[list_id]': 'audience_id',
                    'data[email]': 'invalid_email@example.com',
                    'type': 'subscribe'
                }, use_payload=False)
            self.assertEqual(json_response, {})

    def test_post_with_invalid_secret(self) -> None:
        with self.swap_secret:
            with self.capture_logging(min_level=logging.ERROR) as captured_logs:
                self.post_json(
                    '%s/invalid_secret' % feconf.BULK_EMAIL_WEBHOOK_ENDPOINT, {
                        'data[list_id]': 'audience_id',
                        'data[email]': self.EDITOR_EMAIL,
                        'type': 'subscribe'
                    }, use_payload=False, expected_status_int=404)
                self.assertIn(
                    'Received invalid Mailchimp webhook secret', captured_logs)

    def test_post(self) -> None:
        with self.swap_secret, self.swap_audience_id:
            email_preferences = user_services.get_email_preferences(
                self.editor_id)
            self.assertEqual(email_preferences.can_receive_email_updates, False)

            # User subscribed externally.
            json_response = self.post_json(
                '%s/secret' % feconf.BULK_EMAIL_WEBHOOK_ENDPOINT, {
                    'data[list_id]': 'audience_id',
                    'data[email]': self.EDITOR_EMAIL,
                    'type': 'subscribe'
                }, use_payload=False)
            self.assertEqual(json_response, {})
            email_preferences = user_services.get_email_preferences(
                self.editor_id)
            self.assertEqual(email_preferences.can_receive_email_updates, True)

            # User unsubscribed externally.
            json_response = self.post_json(
                '%s/secret' % feconf.BULK_EMAIL_WEBHOOK_ENDPOINT, {
                    'data[list_id]': 'audience_id',
                    'data[email]': self.EDITOR_EMAIL,
                    'type': 'unsubscribe'
                }, use_payload=False)
            self.assertEqual(json_response, {})
            email_preferences = user_services.get_email_preferences(
                self.editor_id)
            self.assertEqual(email_preferences.can_receive_email_updates, False)


class DeleteAccountHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)

    def test_delete_delete_account_page(self) -> None:
        data = self.delete_json('/delete-account-handler')
        self.assertEqual(data, {'success': True})


class ExportAccountHandlerTests(test_utils.GenericTestBase):
    GENERIC_DATE: Final = datetime.datetime(2021, 5, 20)
    GENERIC_EPOCH: Final = utils.get_time_in_millisecs(GENERIC_DATE)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)

        user_models.UserSubscriptionsModel(
            id=self.get_user_id_from_email(self.EDITOR_EMAIL),
            creator_ids=[],
            collection_ids=[],
            exploration_ids=[],
            general_feedback_thread_ids=[]).put()

    def test_export_account_handler(self) -> None:
        # Update user settings to constants.
        user_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        user_settings = user_services.get_user_settings(user_id)
        user_settings.last_agreed_to_terms = self.GENERIC_DATE
        user_settings.last_logged_in = self.GENERIC_DATE
        user_settings.validate()
        user_models.UserSettingsModel(
            id=user_settings.user_id,
            email=user_settings.email,
            roles=user_settings.roles,
            username=user_settings.username,
            normalized_username=user_settings.normalized_username,
            last_agreed_to_terms=user_settings.last_agreed_to_terms,
            last_started_state_editor_tutorial=(
                user_settings.last_started_state_editor_tutorial),
            last_started_state_translation_tutorial=(
                user_settings.last_started_state_translation_tutorial),
            last_logged_in=user_settings.last_logged_in,
            last_edited_an_exploration=user_settings.last_edited_an_exploration,
            last_created_an_exploration=(
                user_settings.last_created_an_exploration),
            default_dashboard=user_settings.default_dashboard,
            creator_dashboard_display_pref=(
                user_settings.creator_dashboard_display_pref),
            user_bio=user_settings.user_bio,
            subject_interests=user_settings.subject_interests,
            first_contribution_msec=user_settings.first_contribution_msec,
            preferred_language_codes=user_settings.preferred_language_codes,
            preferred_site_language_code=(
                user_settings.preferred_site_language_code),
            preferred_audio_language_code=(
                user_settings.preferred_audio_language_code),
            deleted=user_settings.deleted
        ).put()

        time_swap = self.swap(
            user_services, 'record_user_logged_in', lambda *args: None)

        with time_swap:
            data = self.get_custom_response(
                '/export-account-handler', 'text/plain')

            # Check downloaded zip file.
            filename = 'oppia_takeout_data.zip'
            self.assertEqual(
                data.headers['Content-Disposition'],
                'attachment; filename=%s' % filename)
            zf_saved = zipfile.ZipFile(io.BytesIO(data.body))
            self.assertEqual(
                zf_saved.namelist(),
                [
                    'oppia_takeout_data.json',
                    'images/user_settings_profile_picture.png',
                    'images/user_settings_profile_picture.webp'
                ]
            )

    def test_data_does_not_export_if_user_id_leaked(self) -> None:
        # Update user settings to constants.
        user_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        user_settings = user_services.get_user_settings(user_id)
        user_settings.last_agreed_to_terms = self.GENERIC_DATE
        user_settings.last_logged_in = self.GENERIC_DATE

        # For testing, set the user_settings.username to the user_id.
        user_settings.username = user_settings.user_id

        user_settings.validate()
        user_models.UserSettingsModel(
            id=user_settings.user_id,
            email=user_settings.email,
            roles=user_settings.roles,
            username=user_settings.username,
            normalized_username=user_settings.normalized_username,
            last_agreed_to_terms=user_settings.last_agreed_to_terms,
            last_started_state_editor_tutorial=(
                user_settings.last_started_state_editor_tutorial),
            last_started_state_translation_tutorial=(
                user_settings.last_started_state_translation_tutorial),
            last_logged_in=user_settings.last_logged_in,
            last_edited_an_exploration=user_settings.last_edited_an_exploration,
            last_created_an_exploration=(
                user_settings.last_created_an_exploration),
            default_dashboard=user_settings.default_dashboard,
            creator_dashboard_display_pref=(
                user_settings.creator_dashboard_display_pref),
            user_bio=user_settings.user_bio,
            subject_interests=user_settings.subject_interests,
            first_contribution_msec=user_settings.first_contribution_msec,
            preferred_language_codes=user_settings.preferred_language_codes,
            preferred_site_language_code=(
                user_settings.preferred_site_language_code),
            preferred_audio_language_code=(
                user_settings.preferred_audio_language_code),
            preferred_translation_language_code=(
                user_settings.preferred_translation_language_code),
            deleted=user_settings.deleted
        ).put()

        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_png_img.png'),
            'rb',
            encoding=None
        ) as f:
            raw_image_png = f.read()
        with utils.open_file(
            os.path.join(feconf.TESTS_DATA_DIR, 'test_png_img.webp'),
            'rb',
            encoding=None
        ) as f:
            raw_image_webp = f.read()
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_USER, user_settings.username)
        fs.commit('profile_picture.png', raw_image_png, mimetype='image/png')
        fs.commit('profile_picture.webp', raw_image_webp, mimetype='image/webp')

        time_swap = self.swap(
            user_services, 'record_user_logged_in', lambda *args: None)

        with time_swap:
            data = self.get_custom_response(
                '/export-account-handler', 'text/plain')

            # Check downloaded zip file.
            filename = 'oppia_takeout_data.zip'
            self.assertEqual(
                data.headers['Content-Disposition'],
                'attachment; filename=%s' % filename)
            zf_saved = zipfile.ZipFile(io.BytesIO(data.body))
            self.assertEqual(
                zf_saved.namelist(),
                [
                    'oppia_takeout_data.json',
                ]
            )

    def test_export_account_handler_enabled_logged_out(self) -> None:
        self.logout()
        self.get_json('/export-account-handler', expected_status_int=401)


class PendingAccountDeletionPageTests(test_utils.GenericTestBase):

    def test_get_pending_account_deletion_page(self) -> None:
        response = self.get_html_response('/pending-account-deletion')
        self.assertIn(b'<oppia-root></oppia-root>', response.body)


class UsernameCheckHandlerTests(test_utils.GenericTestBase):

    def test_username_check(self) -> None:
        self.signup('abc@example.com', 'abc')

        user_services.create_new_user(
            self.get_auth_id_from_email(self.EDITOR_EMAIL), self.EDITOR_EMAIL)
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response_dict = self.post_json(
            feconf.USERNAME_CHECK_DATA_URL, {'username': 'abc'},
            csrf_token=csrf_token)
        self.assertEqual(
            response_dict, {
                'username_is_taken': True
            })

        response_dict = self.post_json(
            feconf.USERNAME_CHECK_DATA_URL, {'username': 'def'},
            csrf_token=csrf_token)
        self.assertEqual(
            response_dict, {
                'username_is_taken': False
            })

        response_dict = self.post_json(
            feconf.USERNAME_CHECK_DATA_URL, {'username': '!!!INVALID!!!'},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn(
            'Validation failed: is_valid_username_string ({}) for object ',
            response_dict['error'])

        response_dict = self.post_json(
            feconf.USERNAME_CHECK_DATA_URL,
            {'username': self.UNICODE_TEST_STRING},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn(
            'Validation failed: is_valid_username_string ({}) for object ',
            response_dict['error'])

        self.logout()


class SiteLanguageHandlerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

    def test_save_site_language_handler(self) -> None:
        """Test the language is saved in the preferences when handler is
        called.
        """
        language_code = 'es'
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            '/preferenceshandler/data', {
                'update_type': 'preferred_site_language_code',
                'data': language_code,
            }, csrf_token=csrf_token)

        preferences = self.get_json('/preferenceshandler/data')
        self.assertIsNotNone(preferences)
        self.assertEqual(
            preferences['preferred_site_language_code'], language_code)

        self.logout()

    def test_can_update_site_language_code(self) -> None:
        self.login(self.EDITOR_EMAIL)
        user_settings = user_services.get_user_settings(
            self.editor_id, strict=True)
        self.assertIsNone(user_settings.preferred_site_language_code)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            feconf.SITE_LANGUAGE_DATA_URL, {'site_language_code': 'en'},
            csrf_token=csrf_token)
        user_settings = user_services.get_user_settings(
            self.editor_id, strict=True)
        self.assertEqual(user_settings.preferred_site_language_code, 'en')
        self.logout()


class UserInfoHandlerTests(test_utils.GenericTestBase):

    def test_user_info_handler(self) -> None:
        """Test the language is saved in the preferences when handler is
        called.
        """
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        json_response = self.get_json('/userinfohandler')
        self.assertDictEqual({
            'roles': ['EXPLORATION_EDITOR'],
            'is_moderator': False,
            'is_curriculum_admin': False,
            'is_topic_manager': False,
            'is_super_admin': False,
            'can_create_collections': False,
            'preferred_site_language_code': None,
            'username': self.EDITOR_USERNAME,
            'email': self.EDITOR_EMAIL,
            'user_is_logged_in': True}, json_response)
        self.logout()

        json_response = self.get_json('/userinfohandler')
        self.assertDictEqual({
            'user_is_logged_in': False
        }, json_response)

    def test_set_user_has_viewed_lesson_info_modal_once_to_true(
        self
    ) -> None:
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        user_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        user_settings = user_services.get_user_settings(user_id)
        self.assertEqual(
            user_settings.has_viewed_lesson_info_modal_once, False)

        csrf_token = self.get_new_csrf_token()
        self.put_json('/userinfohandler/data', {
            'user_has_viewed_lesson_info_modal_once': True
        }, csrf_token=csrf_token)

        user_settings = user_services.get_user_settings(user_id)
        self.assertEqual(
            user_settings.has_viewed_lesson_info_modal_once, True)

    def test_no_user_info_provided_if_user_is_not_logged_in(self) -> None:
        csrf_token = self.get_new_csrf_token()
        self.put_json('/userinfohandler/data', {
            'user_has_viewed_lesson_info_modal_once': True
        }, csrf_token=csrf_token)


class UrlHandlerTests(test_utils.GenericTestBase):

    def test_login_url_is_none_for_signed_in_user(self) -> None:
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        response = self.get_json('/url_handler?current_url=login')
        self.assertIsNone(response['login_url'])
        self.logout()

    def test_login_url_gets_created_for_signed_out_users(self) -> None:
        response = self.get_json(
            '/url_handler', params={'current_url': 'random_url'})
        self.assertTrue(response['login_url'].endswith('random_url'))

    def test_invalid_input_exception(self) -> None:
        response = self.get_json(
            '/url_handler', expected_status_int=400)
        error = {
            'error': 'Missing key in handler args: current_url.',
            'status_code': 400
        }
        self.assertEqual(response, error)
