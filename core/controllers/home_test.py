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

"""Tests for various static pages (like About, Contact, etc.)."""

__author__ = 'Sean Lip'

from core.tests import test_utils
import feconf


class HomePageTest(test_utils.GenericTestBase):

    def test_logged_out_homepage(self):
        """Test the logged-out version of the home page."""
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Bite-sized learning journeys',
            'Browse the explorations gallery', '100% free!',
            'Learn', 'About', 'Contact',
            'Login', 'Create an Oppia account', 'Contribute',
            # No navbar tabs should be highlighted.
            no=['class="active"',
                'Profile', 'Logout', 'Create an exploration', 'Dashboard'])

    def test_logged_in_but_not_registered_as_editor_homepage(self):
        """Test the logged-in-but-not-editor version of the home page."""
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Login', self.get_expected_login_url('/'),
            no=['Logout', self.get_expected_logout_url('/')])

        self.login('reader@example.com')
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Bite-sized learning journeys',
            'Contribute', 'Profile', 'Logout', 'Create an exploration',
            self.get_expected_logout_url('/'),
            no=['Login', 'Create an Oppia account', 'Dashboard',
                self.get_expected_login_url('/')])
        self.logout()

    def test_logged_in_and_registered_as_editor_homepage(self):
        """Test the logged-in-and-editor home page (the 'dashboard')."""
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Login', self.get_expected_login_url('/'),
            no=['Logout', self.get_expected_logout_url('/')])

        self.register_editor('editor@example.com')
        self.login('editor@example.com')

        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Dashboard', 'Contribute', 'Profile', 'Logout',
            self.get_expected_logout_url('/'),
            no=['Login', 'Create an Oppia account',
                'Bite-sized learning journeys',
                self.get_expected_login_url('/')])
        self.logout()
