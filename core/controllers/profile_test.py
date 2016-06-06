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

from core.domain import exp_services
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils
import feconf
import utils


class SignupTest(test_utils.GenericTestBase):

    def test_signup_page_does_not_have_top_right_menu(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(feconf.SIGNUP_URL)
        self.assertEqual(response.status_int, 200)
        # Sign in can't be inside an html tag, but can appear inside js code
        response.mustcontain(no=['Logout', '>Sign in'])
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
        editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', True):
            self.assertEqual(
                user_services.get_email_preferences(editor_id),
                {
                    'can_receive_email_updates': True,
                    'can_receive_editor_role_email': (
                        feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
                })
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', False):
            self.assertEqual(
                user_services.get_email_preferences(editor_id),
                {
                    'can_receive_email_updates': False,
                    'can_receive_editor_role_email': (
                        feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
                })

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
        editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', True):
            self.assertEqual(
                user_services.get_email_preferences(editor_id),
                {
                    'can_receive_email_updates': True,
                    'can_receive_editor_role_email': (
                        feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
                })
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', False):
            self.assertEqual(
                user_services.get_email_preferences(editor_id),
                {
                    'can_receive_email_updates': True,
                    'can_receive_editor_role_email': (
                        feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
                })

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
        editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', True):
            self.assertEqual(
                user_services.get_email_preferences(editor_id),
                {
                    'can_receive_email_updates': False,
                    'can_receive_editor_role_email': (
                        feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
                })
        with self.swap(feconf, 'DEFAULT_EMAIL_UPDATES_PREFERENCE', False):
            self.assertEqual(
                user_services.get_email_preferences(editor_id),
                {
                    'can_receive_email_updates': False,
                    'can_receive_editor_role_email': (
                        feconf.DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE)
                })


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
        # Every user must have a profile picture.
        self.assertEqual(
            response_dict['profile_picture_data_url_for_username'],
            user_services.DEFAULT_IDENTICON_DATA_URL)


class ProfileDataHandlerTests(test_utils.GenericTestBase):

    def test_preference_page_updates(self):
        self.signup(self.EDITOR_EMAIL, username=self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
        original_preferences = self.get_json('/preferenceshandler/data')
        self.assertEqual(
            ['en'], original_preferences['preferred_language_codes'])
        self.assertIsNone(original_preferences['preferred_site_language_code'])
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'preferred_site_language_code', 'data': 'en'},
            csrf_token=csrf_token)
        self.put_json(
            '/preferenceshandler/data',
            {'update_type': 'preferred_language_codes', 'data': ['de']},
            csrf_token=csrf_token)
        new_preferences = self.get_json('/preferenceshandler/data')
        self.assertEqual(new_preferences['preferred_language_codes'], ['de'])
        self.assertEqual(new_preferences['preferred_site_language_code'], 'en')

    def test_profile_data_is_independent_of_currently_logged_in_user(self):
        self.signup(self.EDITOR_EMAIL, username=self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
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
        response = self.testapp.get('/preferences')
        csrf_token = self.get_csrf_token_from_response(response)
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

        # Looged-out user looks at editor's profile page/
        response = self.get_json(
            '/profilehandler/data/%s' % self.EDITOR_USERNAME)
        self.assertEqual(response['user_bio'], 'My new editor bio')
        self.assertEqual(response['subject_interests'], ['editor', 'editing'])


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
        self.save_new_valid_exploration(
            self.EXP_ID_1, user_a_id, end_state_name='End')
        rights_manager.publish_exploration(user_a_id, self.EXP_ID_1)

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

        self.save_new_valid_exploration(
            self.EXP_ID_1, user_a_id, end_state_name='End')
        rights_manager.publish_exploration(user_a_id, self.EXP_ID_1)

        exp_services.update_exploration(user_b_id, self.EXP_ID_1, [{
            'cmd': 'edit_exploration_property',
            'property_name': 'objective',
            'new_value': 'the objective'
        }], 'Test edit')

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


class SiteLanguageHandlerTests(test_utils.GenericTestBase):

    def test_save_site_language_handler(self):
        """Test the language is saved in the preferences when handler is called.
        """
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        language_code = 'es'
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/preferences')
        self.assertEqual(response.status_int, 200)
        csrf_token = self.get_csrf_token_from_response(response)
        self.put_json('/preferenceshandler/data', {
            'update_type': 'preferred_site_language_code',
            'data': language_code,
        }, csrf_token)

        preferences = self.get_json('/preferenceshandler/data')
        self.assertIsNotNone(preferences)
        self.assertEqual(
            preferences['preferred_site_language_code'], language_code)

        self.logout()

    def test_save_site_language_no_user(self):
        """The SiteLanguageHandler handler can be called without a user."""
        response = self.testapp.get(feconf.SPLASH_URL)
        self.assertEqual(response.status_int, 200)
        csrf_token = self.get_csrf_token_from_response(
            response, token_type=feconf.CSRF_PAGE_NAME_I18N)
        self.put_json(feconf.SITE_LANGUAGE_DATA_URL, {
            'site_language_code': 'es',
        }, csrf_token)
