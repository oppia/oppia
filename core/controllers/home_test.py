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

"""Tests for the user notification dashboard and 'my explorations' pages."""

__author__ = 'Sean Lip'

from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import user_jobs
from core.tests import test_utils
import feconf


class HomePageTest(test_utils.GenericTestBase):

    def test_logged_out_homepage(self):
        """Test the logged-out version of the home page."""
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Your personal tutor',
            'Oppia - Gallery', 'About', 'Login', no=['Logout'])

    def test_notifications_dashboard_redirects_for_logged_out_users(self):
        """Test the logged-out view of the notifications dashboard."""
        response = self.testapp.get('/notifications_dashboard')
        self.assertEqual(response.status_int, 302)
        # This should redirect to the login page.
        self.assertIn('signup', response.headers['location'])
        self.assertIn('notifications_dashboard', response.headers['location'])

        self.login('reader@example.com')
        response = self.testapp.get('/notifications_dashboard')
        # This should redirect the user to complete signup.
        self.assertEqual(response.status_int, 302)
        self.logout()

    def test_logged_in_notifications_dashboard(self):
        """Test the logged-in view of the notifications dashboard."""
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/notifications_dashboard')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Notifications', 'Logout',
            self.get_expected_logout_url('/'),
            no=['Login', 'Your personal tutor',
                self.get_expected_login_url('/')])
        self.logout()


class MyExplorationsHandlerTest(test_utils.GenericTestBase):

    MY_EXPLORATIONS_DATA_URL = '/myexplorationshandler/data'

    COLLABORATOR_EMAIL = 'collaborator@example.com'
    COLLABORATOR_USERNAME = 'collaborator'

    EXP_ID = 'exp_id'
    EXP_TITLE = 'Exploration title'

    def setUp(self):
        super(MyExplorationsHandlerTest, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.COLLABORATOR_EMAIL, self.COLLABORATOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.collaborator_id = self.get_user_id_from_email(
            self.COLLABORATOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_no_explorations(self):
        self.login(self.OWNER_EMAIL)
        response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
        self.assertEqual(response['explorations_list'], [])
        self.logout()

    def test_managers_can_see_explorations(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        self.set_admins([self.OWNER_EMAIL])

        self.login(self.OWNER_EMAIL)
        response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PRIVATE)

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PUBLIC)

        rights_manager.publicize_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PUBLICIZED)
        self.logout()

    def test_collaborators_can_see_explorations(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        rights_manager.assign_role_for_exploration(
            self.owner_id, self.EXP_ID, self.collaborator_id,
            rights_manager.ROLE_EDITOR)
        self.set_admins([self.OWNER_EMAIL])

        self.login(self.COLLABORATOR_EMAIL)
        response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PRIVATE)

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PUBLIC)

        rights_manager.publicize_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['status'],
            rights_manager.ACTIVITY_STATUS_PUBLICIZED)

        self.logout()

    def test_viewer_cannot_see_explorations(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        rights_manager.assign_role_for_exploration(
            self.owner_id, self.EXP_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        self.set_admins([self.OWNER_EMAIL])

        self.login(self.VIEWER_EMAIL)
        response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
        self.assertEqual(response['explorations_list'], [])

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
        self.assertEqual(response['explorations_list'], [])

        rights_manager.publicize_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
        self.assertEqual(response['explorations_list'], [])
        self.logout()

    def test_can_see_feedback_thread_counts(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)

        self.login(self.OWNER_EMAIL)

        response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
        self.assertEqual(len(response['explorations_list']), 1)
        self.assertEqual(
            response['explorations_list'][0]['num_open_threads'], 0)
        self.assertEqual(
            response['explorations_list'][0]['num_total_threads'], 0)

        def mock_get_thread_analytics(exploration_id):
            return {
                'num_open_threads': 2,
                'num_total_threads': 3,
            }

        with self.swap(
                feedback_services, 'get_thread_analytics',
                mock_get_thread_analytics):
            response = self.get_json(self.MY_EXPLORATIONS_DATA_URL)
            self.assertEqual(len(response['explorations_list']), 1)
            self.assertEqual(
                response['explorations_list'][0]['num_open_threads'], 2)
            self.assertEqual(
                response['explorations_list'][0]['num_total_threads'], 3)

        self.logout()


class NotificationsDashboardHandlerTest(test_utils.GenericTestBase):

    DASHBOARD_DATA_URL = '/notificationsdashboardhandler/data'

    def setUp(self):
        super(NotificationsDashboardHandlerTest, self).setUp()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def _get_recent_notifications_mock_by_viewer(self, unused_user_id):
        """Returns a single feedback thread by VIEWER_ID."""
        return (100000, [{
            'activity_id': 'exp_id',
            'activity_title': 'exp_title',
            'author_id': self.viewer_id,
            'last_updated_ms': 100000,
            'subject': 'Feedback Message Subject',
            'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
        }])

    def _get_recent_notifications_mock_by_anonymous_user(self, unused_user_id):
        """Returns a single feedback thread by an anonymous user."""
        return (200000, [{
            'activity_id': 'exp_id',
            'activity_title': 'exp_title',
            'author_id': None,
            'last_updated_ms': 100000,
            'subject': 'Feedback Message Subject',
            'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
        }])

    def test_author_ids_are_handled_correctly(self):
        """Test that author ids are converted into author usernames
        and that anonymous authors are handled correctly.
        """
        with self.swap(
                user_jobs.DashboardRecentUpdatesAggregator,
                'get_recent_notifications',
                self._get_recent_notifications_mock_by_viewer):
            self.login(self.VIEWER_EMAIL)
            response = self.get_json(self.DASHBOARD_DATA_URL)
            self.assertEqual(len(response['recent_notifications']), 1)
            self.assertEqual(
                response['recent_notifications'][0]['author_username'],
                self.VIEWER_USERNAME)
            self.assertNotIn('author_id', response['recent_notifications'][0])

        with self.swap(
                user_jobs.DashboardRecentUpdatesAggregator,
                'get_recent_notifications',
                self._get_recent_notifications_mock_by_anonymous_user):
            self.login(self.VIEWER_EMAIL)
            response = self.get_json(self.DASHBOARD_DATA_URL)
            self.assertEqual(len(response['recent_notifications']), 1)
            self.assertEqual(
                response['recent_notifications'][0]['author_username'], '')
            self.assertNotIn('author_id', response['recent_notifications'][0])
