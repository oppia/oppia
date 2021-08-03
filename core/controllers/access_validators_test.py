# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.domain.access_validator."""

from __future__ import absolute_import
from __future__ import unicode_literals

from constants import constants
from core.domain import config_services
from core.domain import user_services
from core.tests import test_utils
import feconf

ACCESS_VALIDATORS_PREFIX = feconf.ACCESS_VALIDATORS_PREFIX

class SplashPageAccessValidationHandlerTests(test_utils.GenericTestBase):
    """Checks that the user is redirected according to login status when
    request is made to '/'."""

    def setUp(self):
        super(SplashPageAccessValidationHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)

    def test_redirection_if_user_is_not_fully_registered(self):
        response = self.get_json(
          '%s/can_access_splash_page' %ACCESS_VALIDATORS_PREFIX)
        self.assertTrue(response['valid'])
        self.logout()

    def test_redirection_to_default_dashboard_if_user_is_fully_registered(self):
        self.login(self.EDITOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        # Registering this user fully.
        self.post_json(
            feconf.SIGNUP_DATA_URL,
            {'username': self.EDITOR_USERNAME, 'agreed_to_terms': True},
            csrf_token=csrf_token)

        # Set the default dashboard as creator dashboard.
        user_services.update_user_default_dashboard(
            self.editor_id, constants.DASHBOARD_TYPE_LEARNER)
        response = self.get_json(
            '%s/can_access_splash_page' % ACCESS_VALIDATORS_PREFIX)
        self.assertFalse(response['valid'])
        self.assertEqual(response['default_dashboard'], 'learner')

        # Set the default dashboard as creator dashboard.
        user_services.update_user_default_dashboard(
            self.editor_id, constants.DASHBOARD_TYPE_CREATOR)
        response = self.get_json(
            '%s/can_access_splash_page' % ACCESS_VALIDATORS_PREFIX,)
        self.assertFalse(response['valid'])
        self.assertEqual(response['default_dashboard'], 'creator')


class ClassroomPageAccessValidationHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ClassroomPageAccessValidationHandlerTests, self).setUp()
        self.signup(
          self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.user_id_admin = (
            self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL))
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        config_services.set_property(
            self.user_id_admin, 'classroom_pages_data', [{
                'name': 'math',
                'url_fragment': 'math',
                'topic_ids': [],
                'course_details': '',
                'topic_list_intro': ''
            }])

    def test_validation_returns_true_if_classroom_is_available(self):
        self.login(self.EDITOR_EMAIL)
        response = self.get_json(
          '%s/can_access_classroom_page?classroom_url_fragment=%s' %
          (ACCESS_VALIDATORS_PREFIX, 'math'))
        self.assertTrue(response['valid'])
        self.assertIsNone(response['redirect_url'])

    def test_validation_returns_false_and_redirects_if_classroom_is_not_valid(self):
        self.login(self.EDITOR_EMAIL)
        response = self.get_json(
          '%s/can_access_classroom_page?classroom_url_fragment=%s' %
          (ACCESS_VALIDATORS_PREFIX, 'not_valid'))
        self.assertFalse(response['valid'])
        self.assertEqual(response['redirect_url'], '/learn/%s' %
                                    constants.DEFAULT_CLASSROOM_URL_FRAGMENT)


class ReleaseCoordinatorAccessValidationHandlerTests(test_utils.GenericTestBase):
    """Test for release coordinator access validation."""

    def setUp(self):
        """Complete the signup process for self.RELEASE_COORDINATOR_EMAIL."""
        super(ReleaseCoordinatorAccessValidationHandlerTests, self).setUp()
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_guest_user_does_not_pass_validation(self):
        self.get_json(
            '%s/can_access_release_coordinator_page' %
            ACCESS_VALIDATORS_PREFIX, expected_status_int=401)

    def test_exploration_editor_does_not_pass_validation(self):
        self.login(self.EDITOR_EMAIL)
        self.get_json(
            '%s/can_access_release_coordinator_page' %
            ACCESS_VALIDATORS_PREFIX, expected_status_int=401)

    def test_release_coordinator_passes_validation(self):
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_json('%s/can_access_release_coordinator_page' %
            ACCESS_VALIDATORS_PREFIX)
        self.assertTrue(response['valid'])



class AccountDeletionIsEnabledValidationHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(AccountDeletionIsEnabledValidationHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)

    def test_delete_account_validation_returns_true_if_enabled(self):
        with self.swap(constants, 'ENABLE_ACCOUNT_DELETION', True):
            response = self.get_json('%s/account_deletion_is_enabled' %
            ACCESS_VALIDATORS_PREFIX,)
            self.assertTrue(response['valid'])

    def test_delete_account_validation_returns_false_if_disabled(self):
        with self.swap(constants, 'ENABLE_ACCOUNT_DELETION', False):
            response = self.get_json('%s/account_deletion_is_enabled' %
            ACCESS_VALIDATORS_PREFIX,)
            self.assertFalse(response['valid'])

class ProfileExistsValidationHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ProfileExistsValidationHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_profile_validation_returns_true_if_user_views_other_profile(self):
        # Viewer looks at editor's profile page.
        self.login(self.VIEWER_EMAIL)
        response = self.get_json(
            '%s/does_profile_exist/%s' % (
              ACCESS_VALIDATORS_PREFIX, self.EDITOR_USERNAME))
        self.assertTrue(response['valid'])
        self.logout()

    def test_profile_validation_returns_true_if_user_views_own_profile(self):
        # Editor looks at their own profile page.
        self.login(self.EDITOR_EMAIL)
        response = self.get_json(
            '%s/does_profile_exist/%s' % (
              ACCESS_VALIDATORS_PREFIX, self.EDITOR_USERNAME))
        self.assertTrue(response['valid'])
        self.logout()

    def test_profile_validation_returns_false_if_user_views_non_existent_profile(self):
        # Editor looks at non-existing profile page.
        self.login(self.EDITOR_EMAIL)
        response = self.get_json(
            '%s/does_profile_exist/%s' % (
              ACCESS_VALIDATORS_PREFIX, self.BLOG_ADMIN_USERNAME))
        self.assertFalse(response['valid'])
        self.logout()

class ManageOwnAccountValidationHandlerTests(test_utils.GenericTestBase):

    banned_user = 'banneduser'
    banned_user_email = 'banned@example.com'
    username = 'user'
    user_email = 'user@example.com'

    def setUp(self):
        super(ManageOwnAccountValidationHandlerTests, self).setUp()
        self.signup(self.banned_user_email, self.banned_user)
        self.signup(self.user_email, self.username)
        self.mark_user_banned(self.banned_user)

    def test_banned_user_cannot_manage_account(self):
        self.login(self.banned_user_email)
        self.get_json(
            '%s/can_manage_own_account' % ACCESS_VALIDATORS_PREFIX,
            expected_status_int=401)

    def test_normal_user_can_manage_account(self):
        self.login(self.user_email)
        response = self.get_json(
            '%s/can_manage_own_account' % ACCESS_VALIDATORS_PREFIX)
        self.assertTrue(response['valid'])
        self.logout()
