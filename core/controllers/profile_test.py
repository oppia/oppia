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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import re

from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


class ProfilePageTests(test_utils.GenericTestBase):

    def test_get_profile_page_of_non_existing_user_raises_status_404(self):
        self.get_html_response(
            '/profile/%s' % self.OWNER_USERNAME, expected_status_int=404)

    def test_get_profile_page_of_existing_user(self):
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        response = self.get_html_response('/profile/%s' % self.OWNER_USERNAME)
        self.assertIn(
            '<profile-page></profile-page>', response.body)


class ProfileDataHandlerTests(test_utils.GenericTestBase):

    def test_preference_page_updates(self):
        self.signup(self.EDITOR_EMAIL, username=self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        original_preferences = self.get_json('/preferenceshandler/data')
        self.assertEqual(
            ['en'], original_preferences['preferred_language_codes'])
        self.assertIsNone(original_preferences['preferred_site_language_code'])
        self.assertIsNone(original_preferences['preferred_audio_language_code'])
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'preferred_site_language_code', 'data': 'en'},
            csrf_token=csrf_token)
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'preferred_audio_language_code', 'data': 'hi-en'},
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

    def test_profile_data_is_independent_of_currently_logged_in_user(self):
        self.signup(self.EDITOR_EMAIL, username=self.EDITOR_USERNAME)
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

        self.signup(self.VIEWER_EMAIL, username=self.VIEWER_USERNAME)
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

    def test_preferences_page(self):
        self.signup(self.EDITOR_EMAIL, username=self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)

        response = self.get_html_response(feconf.PREFERENCES_URL)
        self.assertIn('{"title": "Preferences | Oppia"})', response.body)

        self.logout()


class UserContributionsTests(test_utils.GenericTestBase):

    USERNAME_A = 'a'
    EMAIL_A = 'a@example.com'
    USERNAME_B = 'b'
    EMAIL_B = 'b@example.com'
    EXP_ID_1 = 'exp_id_1'

    def test_null_case(self):
        # Check that the profile page for a user with no contributions shows
        # that they have 0 created/edited explorations.
        self.signup(self.EMAIL_A, self.USERNAME_A)
        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME_A)
        self.assertEqual(
            response_dict['created_exp_summary_dicts'], [])
        self.assertEqual(
            response_dict['edited_exp_summary_dicts'], [])

    def test_created(self):
        # Check that the profile page for a user who has created
        # a single exploration shows 1 created and 1 edited exploration.
        self.signup(self.EMAIL_A, self.USERNAME_A)
        user_a_id = self.get_user_id_from_email(self.EMAIL_A)
        user_a = user_services.UserActionsInfo(user_a_id)
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

    def test_edited(self):
        # Check that the profile page for a user who has created
        # a single exploration shows 0 created and 1 edited exploration.
        self.signup(self.EMAIL_A, self.USERNAME_A)
        user_a_id = self.get_user_id_from_email(self.EMAIL_A)

        self.signup(self.EMAIL_B, self.USERNAME_B)
        user_b_id = self.get_user_id_from_email(self.EMAIL_B)
        user_a = user_services.UserActionsInfo(user_a_id)
        self.save_new_valid_exploration(
            self.EXP_ID_1, user_a_id, end_state_name='End')
        rights_manager.publish_exploration(user_a, self.EXP_ID_1)

        exp_services.update_exploration(
            user_b_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

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

    USERNAME = 'abc123'
    EMAIL = 'abc123@gmail.com'

    def test_contribution_msec(self):
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
        user_services.update_first_contribution_msec_if_not_set(
            user_id, first_time_in_msecs)

        # Test the contribution date correctly changes to current_time_in_msecs.
        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME)
        self.assertEqual(
            response_dict['first_contribution_msec'],
            first_time_in_msecs)

        # Test that the contribution date is not changed after the first time it
        # is set.
        second_time_in_msecs = utils.get_current_time_in_millisecs()
        user_services.update_first_contribution_msec_if_not_set(
            user_id, second_time_in_msecs)
        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME)
        self.assertEqual(
            response_dict['first_contribution_msec'],
            first_time_in_msecs)


class PreferencesHandlerTests(test_utils.GenericTestBase):
    EXP_ID = 'exp_id'
    EXP_TITLE = 'Exploration title'

    def setUp(self):
        super(PreferencesHandlerTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_can_see_subscriptions(self):
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

    def test_can_update_profile_picture_data_url(self):
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        user_settings = user_services.get_user_settings(self.owner_id)
        self.assertTrue(test_utils.check_image_png_or_webp(
            user_settings.profile_picture_data_url))
        self.put_json(
            feconf.PREFERENCES_DATA_URL,
            payload={'update_type': 'profile_picture_data_url',
                     'data': 'new_profile_picture_data_url'},
            csrf_token=csrf_token)
        user_settings = user_services.get_user_settings(self.owner_id)
        self.assertEqual(
            user_settings.profile_picture_data_url,
            'new_profile_picture_data_url')
        self.logout()

    def test_can_update_default_dashboard(self):
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        user_settings = user_services.get_user_settings(self.owner_id)
        self.assertIsNone(user_settings.default_dashboard)
        self.put_json(
            feconf.PREFERENCES_DATA_URL,
            payload={'update_type': 'default_dashboard',
                     'data': constants.DASHBOARD_TYPE_CREATOR},
            csrf_token=csrf_token)
        user_settings = user_services.get_user_settings(self.owner_id)
        self.assertEqual(
            user_settings.default_dashboard, constants.DASHBOARD_TYPE_CREATOR)
        self.logout()

    def test_update_preferences_with_invalid_update_type_raises_exception(self):
        self.login(self.OWNER_EMAIL)
        csrf_token = self.get_new_csrf_token()
        with self.assertRaisesRegexp(Exception, 'Invalid update type:'):
            self.put_json(
                feconf.PREFERENCES_DATA_URL,
                payload={'update_type': 'invalid_update_type'},
                csrf_token=csrf_token)
        self.logout()


class LongUserBioHandlerTests(test_utils.GenericTestBase):
    USERNAME_A = 'a'
    EMAIL_A = 'a@example.com'
    USERNAME_B = 'b'
    EMAIL_B = 'b@example.com'

    def test_userbio_within_limit(self):
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

    def test_user_bio_exceeds_limit(self):
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
        self.assertIn('User bio exceeds maximum character limit: 2000',
                      user_bio_response['error'])
        self.logout()


class ProfileLinkTests(test_utils.GenericTestBase):

    USERNAME = 'abc123'
    EMAIL = 'abc123@gmail.com'
    PROFILE_PIC_URL = '/preferenceshandler/profile_picture_by_username/'

    def test_get_profile_picture_invalid_username(self):
        self.get_json(
            '%s%s' % (self.PROFILE_PIC_URL, self.USERNAME),
            expected_status_int=404)

    def test_get_profile_picture_valid_username(self):
        self.signup(self.EMAIL, self.USERNAME)
        response_dict = self.get_json(
            '%s%s' % (self.PROFILE_PIC_URL, self.USERNAME)
        )
        # Every user must have a profile picture.
        self.assertEqual(
            response_dict['profile_picture_data_url_for_username'],
            user_services.DEFAULT_IDENTICON_DATA_URL)


class EmailPreferencesTests(test_utils.GenericTestBase):

    def test_user_not_setting_email_prefs_on_signup(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': 'abc', 'agreed_to_terms': True},
            csrf_token=csrf_token)

        # The email update preference should be whatever the setting in feconf
        # is.
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

    def test_user_allowing_emails_on_signup(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': 'abc', 'agreed_to_terms': True,
             'can_receive_email_updates': True},
            csrf_token=csrf_token)

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

    def test_user_disallowing_emails_on_signup(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': 'abc', 'agreed_to_terms': True,
             'can_receive_email_updates': False},
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

    def test_email_preferences_updates(self):
        """Test that Preferences Handler correctly updates the email
        preferences of the user.
        """

        self.signup(self.EDITOR_EMAIL, username=self.EDITOR_USERNAME)
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


class ProfilePictureHandlerTests(test_utils.GenericTestBase):

    def test_get_profile_picture_with_updated_value(self):
        self.get_json(
            '/preferenceshandler/profile_picture', expected_status_int=401)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.login(self.OWNER_EMAIL)
        user_settings = user_services.get_user_settings(owner_id)
        response = self.get_json('/preferenceshandler/profile_picture')
        self.assertEqual(
            response['profile_picture_data_url'],
            user_settings.profile_picture_data_url)
        user_services.update_profile_picture_data_url(
            owner_id, 'new_profile_picture')
        response = self.get_json('/preferenceshandler/profile_picture')
        self.assertEqual(
            response['profile_picture_data_url'], 'new_profile_picture')
        self.logout()


class SignupTests(test_utils.GenericTestBase):

    def test_signup_page_does_not_have_top_right_menu(self):
        self.login(self.EDITOR_EMAIL)
        response = self.get_html_response(feconf.SIGNUP_URL)
        # Sign in can't be inside an html tag, but can appear inside js code.
        response.mustcontain(no=['Logout'])
        self.logout()

    def test_going_somewhere_else_while_signing_in_logs_user_out(self):
        exp_services.load_demo('0')

        self.login(self.EDITOR_EMAIL)
        response = self.get_html_response(feconf.SIGNUP_URL)
        response = self.get_html_response('/create/0', expected_status_int=302)
        self.assertIn('logout', response.headers['location'])
        self.assertIn('create', response.headers['location'])

        self.logout()

    def test_to_check_url_redirection_in_signup(self):
        """To validate the redirections from return_url."""
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Registering this user fully.
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': 'abc', 'agreed_to_terms': True},
            csrf_token=csrf_token)

        def strip_domain_from_location_header(url):
            """To strip the domain form the location url."""
            splitted_url = re.match(r'(http[s]?:\/\/)?([^\/\s]+\/)(.*)', url)
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

    def test_accepting_terms_is_handled_correctly(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL, {'agreed_to_terms': False},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn('you will need to accept', response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'agreed_to_terms': 'Hasta la vista!'},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn('you will need to accept', response_dict['error'])

        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'agreed_to_terms': True, 'username': 'myusername'},
            csrf_token=csrf_token)

        self.logout()

    def test_username_is_handled_correctly(self):
        self.login(self.EDITOR_EMAIL)

        csrf_token = self.get_new_csrf_token()

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL, {'agreed_to_terms': True},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn('Empty username supplied', response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': '', 'agreed_to_terms': True},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn('Empty username supplied', response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': '!a!', 'agreed_to_terms': True},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn(
            'can only have alphanumeric characters', response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': self.UNICODE_TEST_STRING, 'agreed_to_terms': True},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn(
            'can only have alphanumeric characters', response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': 'abcde', 'agreed_to_terms': True},
            csrf_token=csrf_token)

        self.logout()

    def test_default_dashboard_for_new_users(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # This user should have the creator dashboard as default.
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'agreed_to_terms': True, 'username': 'creatoruser',
             'default_dashboard': constants.DASHBOARD_TYPE_CREATOR,
             'can_receive_email_updates': None},
            csrf_token=csrf_token)

        user_id = user_services.get_user_id_from_username('creatoruser')
        user_settings = user_services.get_user_settings(user_id)
        self.assertEqual(
            user_settings.default_dashboard, constants.DASHBOARD_TYPE_CREATOR)

        self.logout()

        self.login(self.VIEWER_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # This user should have the learner dashboard as default.
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'agreed_to_terms': True, 'username': 'learneruser',
             'default_dashboard': constants.DASHBOARD_TYPE_LEARNER,
             'can_receive_email_updates': None},
            csrf_token=csrf_token)

        user_id = user_services.get_user_id_from_username('learneruser')
        user_settings = user_services.get_user_settings(user_id)
        self.assertEqual(
            user_settings.default_dashboard, constants.DASHBOARD_TYPE_LEARNER)

        self.logout()

    def test_user_settings_of_non_existing_user(self):
        self.login(self.OWNER_EMAIL)
        values_dict = {
            'can_send_emails': False,
            'has_agreed_to_latest_terms': False,
            'has_ever_registered': False,
            'username': None,
        }

        response = self.get_json(feconf.SIGNUP_DATA_URL)
        self.assertDictEqual(values_dict, response)
        self.logout()

    def test_user_settings_of_existing_user(self):
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

    def setUp(self):
        super(DeleteAccountPageTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)

    def test_get_delete_account_page(self):
        with self.swap(constants, 'ENABLE_ACCOUNT_DELETION', True):
            response = self.get_html_response('/delete-account')
            self.assertIn(
                '<delete-account-page></delete-account-page>', response.body)

    def test_get_delete_account_page_disabled(self):
        with self.swap(constants, 'ENABLE_ACCOUNT_DELETION', False):
            self.get_html_response('/delete-account', expected_status_int=404)


class DeleteAccountHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(DeleteAccountHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)

    def test_delete_delete_account_page(self):
        with self.swap(constants, 'ENABLE_ACCOUNT_DELETION', True):
            data = self.delete_json('/delete-account-handler')
            self.assertEqual(data, {'success': True})

    def test_delete_delete_account_page_disabled(self):
        with self.swap(constants, 'ENABLE_ACCOUNT_DELETION', False):
            self.delete_json('/delete-account-handler', expected_status_int=404)


class ExportAccountHandlerTests(test_utils.GenericTestBase):
    GENERIC_DATE = datetime.datetime(2019, 5, 20)
    GENERIC_EPOCH = utils.get_time_in_millisecs(GENERIC_DATE)

    def setUp(self):
        super(ExportAccountHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)

        user_models.UserSubscriptionsModel(
            id=self.get_user_id_from_email(self.EDITOR_EMAIL),
            creator_ids=[],
            collection_ids=[],
            activity_ids=[],
            general_feedback_thread_ids=[]).put()

    def test_export_account_handler(self):
        # Update user settings to constants.
        user_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        user_settings = user_services.get_user_settings(user_id)
        user_settings.last_agreed_to_terms = self.GENERIC_DATE
        user_settings.last_logged_in = self.GENERIC_DATE
        user_settings.validate()
        user_models.UserSettingsModel(
            id=user_settings.user_id,
            gae_id=user_settings.gae_id,
            email=user_settings.email,
            role=user_settings.role,
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
            profile_picture_data_url=user_settings.profile_picture_data_url,
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

        constants_swap = self.swap(constants, 'ENABLE_ACCOUNT_EXPORT', True)
        time_swap = self.swap(
            user_services, 'record_user_logged_in', lambda *args: None)

        with constants_swap, time_swap:
            data = self.get_json('/export-account-handler')
            expected_data = {
                u'topic_rights_data': {
                    u'managed_topic_ids': []
                },
                u'subtopic_page_snapshot_metadata_data': {},
                u'general_voiceover_application_data': {},
                u'collection_progress_data': {},
                u'story_snapshot_metadata_data': {},
                u'user_community_rights_data': {},
                u'user_contributions_data': {
                    u'edited_exploration_ids': [],
                    u'created_exploration_ids': []
                },
                u'general_feedback_thread_user_data': {},
                u'question_snapshot_metadata_data': {},
                u'general_feedback_message_data': {},
                u'story_progress_data': {},
                u'learner_playlist_data': {},
                u'collection_rights_data': {
                    u'voiced_collection_ids': [],
                    u'owned_collection_ids': [],
                    u'viewable_collection_ids': [],
                    u'editable_collection_ids': []
                },
                u'skill_snapshot_metadata_data': {},
                u'exploration_user_data_data': {},
                u'collection_snapshot_metadata_data': {},
                u'exploration_rights_data': {
                    u'viewable_exploration_ids': [],
                    u'owned_exploration_ids': [],
                    u'voiced_exploration_ids': [],
                    u'editable_exploration_ids': []
                },
                u'topic_snapshot_metadata_data': {},
                u'completed_activities_data': {},
                u'general_feedback_thread_data': {},
                u'topic_rights_snapshot_metadata_data': {},
                u'user_stats_data': {},
                u'exploration_rights_snapshot_metadata_data': {},
                u'user_subscriptions_data': {
                    u'creator_usernames': [],
                    u'collection_ids': [],
                    u'activity_ids': [],
                    u'general_feedback_thread_ids': [],
                    u'last_checked': None
                },
                u'config_property_snapshot_metadata_data': {},
                u'exploration_snapshot_metadata_data': {},
                u'incomplete_activities_data': {},
                u'user_skill_mastery_data': {},
                u'exp_user_last_playthrough_data': {},
                u'user_settings_data': {
                    u'username': u'editor',
                    u'last_agreed_to_terms': self.GENERIC_EPOCH,
                    u'last_started_state_translation_tutorial': None,
                    u'last_started_state_editor_tutorial': None,
                    u'normalized_username': u'editor',
                    u'first_contribution_msec': None,
                    u'preferred_language_codes': [
                        u'en'
                    ],
                    u'creator_dashboard_display_pref': u'card',
                    u'subject_interests': [],
                    u'default_dashboard': None,
                    u'preferred_site_language_code': None,
                    u'user_bio': u'',
                    u'profile_picture_data_url':
                        user_services.DEFAULT_IDENTICON_DATA_URL,
                    u'role': u'EXPLORATION_EDITOR',
                    u'last_edited_an_exploration': None,
                    u'email': u'editor@example.com',
                    u'preferred_audio_language_code': None,
                    u'last_logged_in': self.GENERIC_EPOCH
                },
                u'general_suggestion_data': {},
                u'user_contribution_scoring_data': {},
                u'general_feedback_email_reply_to_id_data': {},
                u'collection_rights_snapshot_metadata_data': {},
                u'task_entry_data': {
                    u'task_ids_resolved_by_user': [],
                },
            }
            self.assertEqual(
                data,
                expected_data
            )

    def test_export_account_handler_disabled_logged_in(self):
        with self.swap(constants, 'ENABLE_ACCOUNT_EXPORT', False):
            self.get_json('/export-account-handler', expected_status_int=404)

    def test_export_account_hander_disabled_logged_out(self):
        self.logout()
        with self.swap(constants, 'ENABLE_ACCOUNT_EXPORT', False):
            self.get_json('/export-account-handler', expected_status_int=401)

    def test_export_account_handler_enabled_logged_out(self):
        self.logout()
        with self.swap(constants, 'ENABLE_ACCOUNT_EXPORT', True):
            self.get_json('/export-account-handler', expected_status_int=401)


class PendingAccountDeletionPageTests(test_utils.GenericTestBase):

    def test_get_pending_account_deletion_page(self):
        with self.swap(constants, 'ENABLE_ACCOUNT_DELETION', True):
            response = self.get_html_response('/pending-account-deletion')
            self.assertIn('Pending Account Deletion', response.body)

    def test_get_pending_account_deletion_page_disabled(self):
        with self.swap(constants, 'ENABLE_ACCOUNT_DELETION', False):
            self.get_html_response('/pending-account-deletion',
                                   expected_status_int=404)


class UsernameCheckHandlerTests(test_utils.GenericTestBase):

    def test_username_check(self):
        self.signup('abc@example.com', username='abc')

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
            'can only have alphanumeric characters', response_dict['error'])

        response_dict = self.post_json(
            feconf.USERNAME_CHECK_DATA_URL,
            {'username': self.UNICODE_TEST_STRING},
            csrf_token=csrf_token, expected_status_int=400)
        self.assertIn(
            'can only have alphanumeric characters', response_dict['error'])

        self.logout()


class SiteLanguageHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(SiteLanguageHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

    def test_save_site_language_handler(self):
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

    def test_can_update_site_language_code(self):
        self.login(self.EDITOR_EMAIL)
        user_settings = user_services.get_user_settings(
            self.editor_id, strict=True)
        self.assertIsNone(user_settings.preferred_site_language_code)
        csrf_token = self.get_new_csrf_token()
        self.put_json(
            feconf.SITE_LANGUAGE_DATA_URL, payload={'site_language_code': 'en'},
            csrf_token=csrf_token)
        user_settings = user_services.get_user_settings(
            self.editor_id, strict=True)
        self.assertEqual(user_settings.preferred_site_language_code, 'en')
        self.logout()


class UserInfoHandlerTests(test_utils.GenericTestBase):

    def test_user_info_handler(self):
        """Test the language is saved in the preferences when handler is
        called.
        """
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        json_response = self.get_json('/userinfohandler')
        self.assertDictEqual({
            'is_moderator': False,
            'is_admin': False,
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


class UrlHandlerTests(test_utils.GenericTestBase):

    def test_login_url_is_none_for_signed_in_user(self):
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        response = self.get_json('/url_handler')
        self.assertIsNone(response['login_url'])
        self.logout()

    def test_login_url_gets_created_for_signed_out_users(self):
        response = self.get_json(
            '/url_handler', params={'current_url': 'random_url'})
        self.assertTrue(response['login_url'].endswith('random_url'))
