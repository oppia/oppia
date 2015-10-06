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

from core.domain import exp_services
from core.domain import user_services
from core.tests import test_utils
import feconf


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
