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

__author__ = 'Sean Lip'

import datetime

from core.domain import exp_services
from core.domain import user_services
from core.tests import test_utils
import feconf
import utils


class SignupTest(test_utils.GenericTestBase):

    def test_signup_page_does_not_have_top_right_menu(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(feconf.SIGNUP_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(no=['Logout', 'Sign in'])
        self.logout()

    def test_going_somewhere_else_while_signing_in_logs_user_out(self):
        exp_services.load_demo('0')

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(feconf.SIGNUP_URL)
        self.assertEqual(response.status_int, 200)
        response = self.testapp.get('/create/0')
        self.assertEqual(response.status_int, 302)
        self.assertIn('Logout', response.headers['location'])
        self.assertIn('create', response.headers['location'])

        self.logout()

    def test_accepting_terms_is_handled_correctly(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(feconf.SIGNUP_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL, {'agreed_to_terms': False},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn('you will need to accept', response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'agreed_to_terms': 'Hasta la vista!'},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn('you will need to accept', response_dict['error'])

        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'agreed_to_terms': True, 'username': 'myusername'},
            csrf_token=csrf_token)

        self.logout()

    def test_username_is_handled_correctly(self):
        self.login(self.EDITOR_EMAIL)

        response = self.testapp.get(feconf.SIGNUP_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL, {'agreed_to_terms': True},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn('Empty username supplied', response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': '', 'agreed_to_terms': True},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn('Empty username supplied', response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': '!a!', 'agreed_to_terms': True},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn(
            'can only have alphanumeric characters', response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': self.UNICODE_TEST_STRING, 'agreed_to_terms': True},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn(
            'can only have alphanumeric characters', response_dict['error'])

        response_dict = self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': 'abcde', 'agreed_to_terms': True},
            csrf_token=csrf_token)

        self.logout()


class UsernameCheckHandlerTests(test_utils.GenericTestBase):

    def test_username_check(self):
        self.signup('abc@example.com', username='abc')

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(feconf.SIGNUP_URL)
        csrf_token = self.get_csrf_token_from_response(response)

        response_dict = self.post_json(
            feconf.USERNAME_CHECK_DATA_URL, {'username': 'abc'},
            csrf_token=csrf_token)
        self.assertEqual(response_dict, {
            'username_is_taken': True
        })

        response_dict = self.post_json(
            feconf.USERNAME_CHECK_DATA_URL, {'username': 'def'},
            csrf_token=csrf_token)
        self.assertEqual(response_dict, {
            'username_is_taken': False
        })

        response_dict = self.post_json(
            feconf.USERNAME_CHECK_DATA_URL, {'username': '!!!INVALID!!!'},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn(
            'can only have alphanumeric characters', response_dict['error'])

        response_dict = self.post_json(
            feconf.USERNAME_CHECK_DATA_URL,
            {'username': self.UNICODE_TEST_STRING},
            csrf_token=csrf_token, expect_errors=True, expected_status_int=400)
        self.assertEqual(response_dict['code'], 400)
        self.assertIn(
            'can only have alphanumeric characters', response_dict['error'])

        self.logout()


class EmailPreferencesTests(test_utils.GenericTestBase):

    def test_user_not_setting_email_prefs_on_signup(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(feconf.SIGNUP_URL)
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': 'abc', 'agreed_to_terms': True},
            csrf_token=csrf_token)

        # The email update preference should be whatever the setting in feconf
        # is.
        self.EDITOR_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', True):
            self.assertEqual(
                user_services.get_email_preferences(self.EDITOR_ID),
                {'can_receive_email_updates': True})
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', False):
            self.assertEqual(
                user_services.get_email_preferences(self.EDITOR_ID),
                {'can_receive_email_updates': False})

    def test_user_allowing_emails_on_signup(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(feconf.SIGNUP_URL)
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': 'abc', 'agreed_to_terms': True,
             'can_receive_email_updates': True},
            csrf_token=csrf_token)

        # The email update preference should be True in all cases.
        self.EDITOR_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', True):
            self.assertEqual(
                user_services.get_email_preferences(self.EDITOR_ID),
                {'can_receive_email_updates': True})
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', False):
            self.assertEqual(
                user_services.get_email_preferences(self.EDITOR_ID),
                {'can_receive_email_updates': True})

    def test_user_disallowing_emails_on_signup(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(feconf.SIGNUP_URL)
        csrf_token = self.get_csrf_token_from_response(response)
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': 'abc', 'agreed_to_terms': True,
             'can_receive_email_updates': False},
            csrf_token=csrf_token)

        # The email update preference should be False in all cases.
        self.EDITOR_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', True):
            self.assertEqual(
                user_services.get_email_preferences(self.EDITOR_ID),
                {'can_receive_email_updates': False})
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', False):
            self.assertEqual(
                user_services.get_email_preferences(self.EDITOR_ID),
                {'can_receive_email_updates': False})


class ProfileLinkTests(test_utils.GenericTestBase):

    USERNAME = 'abc123'
    EMAIL = 'abc123@gmail.com'
    PROFILE_PIC_URL = '/preferenceshandler/profile_picture_by_username/'

    def test_get_profile_picture_invalid_username(self):
        response = self.testapp.get(
            '%s%s' % (self.PROFILE_PIC_URL, self.USERNAME), expect_errors=True
        )
        self.assertEqual(response.status_int, 404)

    def test_get_profile_picture_valid_username(self):
        self.signup(self.EMAIL, self.USERNAME)
        response_dict = self.get_json(
            '%s%s' % (self.PROFILE_PIC_URL, self.USERNAME)
        )
        self.assertEqual(
            response_dict['profile_picture_data_url_for_username'],
            None)


class ProfileDataHandlerTests(test_utils.GenericTestBase):

    def test_profile_data_is_independent_of_currently_logged_in_user(self):
        self.signup(self.EDITOR_EMAIL, username=self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'user_bio', 'data': 'My new editor bio'},
            csrf_token=csrf_token)
        self.logout()

        self.signup(self.VIEWER_EMAIL, username=self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'user_bio', 'data': 'My new viewer bio'},
            csrf_token=csrf_token)
        self.logout()

        # Viewer looks at editor's profile page.
        self.login(self.VIEWER_EMAIL)
        response = self.get_json(
            '/profilehandler/data/%s' % self.EDITOR_USERNAME)
        self.assertEqual(response['user_bio'], 'My new editor bio')
        self.logout()

        # Editor looks at their own profile page.
        self.login(self.EDITOR_EMAIL)
        response = self.get_json(
            '/profilehandler/data/%s' % self.EDITOR_USERNAME)
        self.assertEqual(response['user_bio'], 'My new editor bio')
        self.logout()

        # Looged-out user looks at editor's profile page/
        response = self.get_json(
            '/profilehandler/data/%s' % self.EDITOR_USERNAME)
        self.assertEqual(response['user_bio'], 'My new editor bio')


class FirstContributionDateTests(test_utils.GenericTestBase):

    USERNAME = 'abc123'
    EMAIL = 'abc123@gmail.com'

    def test_contribution_datetime(self):
        # Test the contribution date shows up correctly as nonexist.
        self.signup(self.EMAIL, self.USERNAME)
        self.login(self.EMAIL)
        self.user_id = self.get_user_id_from_email(self.EMAIL)
        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME)
        self.assertEqual(response_dict['first_contribution_datetime'], None)

        # Update the first_contribution_datetime to the current datetime.
        current_datetime = datetime.datetime.utcnow()
        user_services.update_first_contribution_datetime(
            self.user_id,current_datetime)

        # Test the contribution date correctly changes to set date time.
        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME)
        self.assertEqual(
            response_dict['first_contribution_datetime'],
            utils.get_time_in_millisecs(current_datetime))


class UserContributionsTests(test_utils.GenericTestBase):

    USERNAME_A = 'a'
    EMAIL_A = 'a@example.com'
    USERNAME_B = 'b'
    EMAIL_B = 'b@example.com'
    EXP_ID_1 = 'exp_id_1'

    def test_zero_count(self):
        # Check that the profile page for a user with no contributions shows
        # that they have 0 created/edited explorations.

        self.signup(self.EMAIL_A, self.USERNAME_A)
        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME_A)
        self.assertEqual(response_dict['created_explorations_count'], 0)
        self.assertEqual(response_dict['edited_explorations_count'], 0)

    def test_created_count(self):
        # Check to see a user with 1 created explorations
        # shows up as 1 created and edited on the profile page.
        self.signup(self.EMAIL_A, self.USERNAME_A)
        self.user_a_id = self.get_user_id_from_email(self.EMAIL_A)
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.user_a_id, end_state_name='End')
        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME_A)
        self.assertEqual(response_dict['created_explorations_count'], 1)
        self.assertEqual(response_dict['edited_explorations_count'], 1)

    def test_edited_count(self):
        # Check to see a user with 1 edited exploration
        # shows up as 1 edited on the profile page.
        self.signup(self.EMAIL_A, self.USERNAME_A)
        self.user_a_id = self.get_user_id_from_email(self.EMAIL_A)

        self.signup(self.EMAIL_B, self.USERNAME_B)
        self.user_b_id = self.get_user_id_from_email(self.EMAIL_B)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.user_a_id, end_state_name='End')

        exp_services.update_exploration(self.user_b_id, self.EXP_ID_1, [{
            'cmd': 'edit_exploration_property',
            'property_name': 'objective',
            'new_value': 'the objective'
        }], 'Test edit')

        response_dict = self.get_json(
            '/profilehandler/data/%s' % self.USERNAME_B)
        self.assertEqual(response_dict['created_explorations_count'], 0)
        self.assertEqual(response_dict['edited_explorations_count'], 1)

