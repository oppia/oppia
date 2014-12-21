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

"""Tests for the home page (i.e. the splash page and user dashboard)."""

__author__ = 'Sean Lip'

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
            'Oppia strives to enable learning by doing.',
            'Explore Gallery', '100% Free',
            'Gallery', 'About', 'Login',
            # No navbar tabs should be highlighted.
            no=['class="active"', 'Logout', 'Dashboard'])

    def test_logged_in_but_not_registered_as_editor_homepage(self):
        """Test the logged-in-but-not-editor version of the home page."""
        response = self.testapp.get('/dashboard')
        self.assertEqual(response.status_int, 302)
        # This should redirect to the login page.
        self.assertIn(
            self.get_expected_login_url('/dashboard'),
            response.headers['location'])

        self.login('reader@example.com')
        response = self.testapp.get('/dashboard')
        # This should redirect to the registration page.
        self.assertEqual(response.status_int, 302)
        self.logout()

    def test_logged_in_and_registered_as_editor_homepage(self):
        """Test the logged-in-and-editor home page (the 'dashboard')."""
        self.register_editor(self.EDITOR_EMAIL)
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get('/dashboard')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Dashboard', 'Logout',
            self.get_expected_logout_url('/'),
            no=['Login', 'Oppia strives to enable learning by doing.',
                'Explore Gallery', self.get_expected_login_url('/')])
        self.logout()


class DashboardHandlerTest(test_utils.GenericTestBase):

    COLLABORATOR_EMAIL = 'collaborator@example.com'
    COLLABORATOR_USERNAME = 'collaborator'

    EXP_ID = 'exp_id'
    EXP_TITLE = 'Exploration title'

    def setUp(self):
        super(DashboardHandlerTest, self).setUp()
        self.register_editor(self.OWNER_EMAIL, username=self.OWNER_USERNAME)
        self.register_editor(
            self.COLLABORATOR_EMAIL, username=self.COLLABORATOR_USERNAME)
        self.register_editor(self.VIEWER_EMAIL, username=self.VIEWER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.collaborator_id = self.get_user_id_from_email(
            self.COLLABORATOR_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

    def test_no_explorations(self):
        self.login(self.OWNER_EMAIL)
        response = self.get_json('/dashboardhandler/data')
        self.assertEqual(response['explorations'], {})
        self.logout()

    def test_managers_can_see_explorations_on_dashboard(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        self.set_admins([self.OWNER_EMAIL])

        self.login(self.OWNER_EMAIL)
        response = self.get_json('/dashboardhandler/data')
        self.assertEqual(len(response['explorations']), 1)
        self.assertIn(self.EXP_ID, response['explorations'])
        self.assertEqual(
            response['explorations'][self.EXP_ID]['status'],
            rights_manager.EXPLORATION_STATUS_PRIVATE)

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json('/dashboardhandler/data')
        self.assertEqual(len(response['explorations']), 1)
        self.assertIn(self.EXP_ID, response['explorations'])
        self.assertEqual(
            response['explorations'][self.EXP_ID]['status'],
            rights_manager.EXPLORATION_STATUS_PUBLIC)

        rights_manager.publicize_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json('/dashboardhandler/data')
        self.assertEqual(len(response['explorations']), 1)
        self.assertIn(self.EXP_ID, response['explorations'])
        self.assertEqual(
            response['explorations'][self.EXP_ID]['status'],
            rights_manager.EXPLORATION_STATUS_PUBLICIZED)
        self.logout()

    def test_collaborators_can_see_explorations_on_dashboard(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        rights_manager.assign_role(
            self.owner_id, self.EXP_ID, self.collaborator_id,
            rights_manager.ROLE_EDITOR)
        self.set_admins([self.OWNER_EMAIL])

        self.login(self.COLLABORATOR_EMAIL)
        response = self.get_json('/dashboardhandler/data')
        self.assertEqual(len(response['explorations']), 1)
        self.assertIn(self.EXP_ID, response['explorations'])
        self.assertEqual(
            response['explorations'][self.EXP_ID]['status'],
            rights_manager.EXPLORATION_STATUS_PRIVATE)

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json('/dashboardhandler/data')
        self.assertEqual(len(response['explorations']), 1)
        self.assertIn(self.EXP_ID, response['explorations'])
        self.assertEqual(
            response['explorations'][self.EXP_ID]['status'],
            rights_manager.EXPLORATION_STATUS_PUBLIC)

        rights_manager.publicize_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json('/dashboardhandler/data')
        self.assertEqual(len(response['explorations']), 1)
        self.assertIn(self.EXP_ID, response['explorations'])
        self.assertEqual(
            response['explorations'][self.EXP_ID]['status'],
            rights_manager.EXPLORATION_STATUS_PUBLICIZED)

        self.logout()

    def test_viewer_cannot_see_explorations_on_dashboard(self):
        self.save_new_default_exploration(
            self.EXP_ID, self.owner_id, title=self.EXP_TITLE)
        rights_manager.assign_role(
            self.owner_id, self.EXP_ID, self.viewer_id,
            rights_manager.ROLE_VIEWER)
        self.set_admins([self.OWNER_EMAIL])

        self.login(self.VIEWER_EMAIL)
        response = self.get_json('/dashboardhandler/data')
        self.assertEqual(response['explorations'], {})

        rights_manager.publish_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json('/dashboardhandler/data')
        self.assertEqual(response['explorations'], {})

        rights_manager.publicize_exploration(self.owner_id, self.EXP_ID)
        response = self.get_json('/dashboardhandler/data')
        self.assertEqual(response['explorations'], {})
        self.logout()

    def _get_recent_updates_mock_by_viewer(self, unused_user_id):
        """Returns a single feedback thread by VIEWER_ID."""
        return (100000, [{
            'activity_id': 'exp_id',
            'activity_title': 'exp_title',
            'author_id': self.viewer_id,
            'last_updated_ms': 100000,
            'subject': 'Feedback Message Subject',
            'type': feconf.UPDATE_TYPE_FEEDBACK_MESSAGE,
        }])

    def _get_recent_updates_mock_by_anonymous_user(self, unused_user_id):
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
                'get_recent_updates',
                self._get_recent_updates_mock_by_viewer):
            self.login(self.VIEWER_EMAIL)
            response = self.get_json('/dashboardhandler/data')
            self.assertEqual(len(response['recent_updates']), 1)
            self.assertEqual(
                response['recent_updates'][0]['author_username'],
                self.VIEWER_USERNAME)
            self.assertNotIn('author_id', response['recent_updates'][0])

        with self.swap(
                user_jobs.DashboardRecentUpdatesAggregator,
                'get_recent_updates',
                self._get_recent_updates_mock_by_anonymous_user):
            self.login(self.VIEWER_EMAIL)
            response = self.get_json('/dashboardhandler/data')
            self.assertEqual(len(response['recent_updates']), 1)
            self.assertEqual(
                response['recent_updates'][0]['author_username'], '')
            self.assertNotIn('author_id', response['recent_updates'][0])
