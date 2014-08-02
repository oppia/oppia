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


class SplashPageTest(test_utils.GenericTestBase):

    def test_splash_page(self):
        """Test the main splash page."""
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Bite-sized learning journeys',
            'Browse the explorations gallery', '100% free!',
            'Learn', 'About', 'Contact',
            # No navbar tabs should be highlighted.
            no=['class="active"'])

    def test_login_and_logout_on_splash_page(self):
        """Test that the splash page redirects to the dashboard on login."""
        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Login', 'Create an Oppia account', 'Contribute',
            self.get_expected_login_url('/'),
            no=['Profile', 'Logout', 'Create an exploration',
                self.get_expected_logout_url('/')])

        self.login('reader@example.com')

        response = self.testapp.get('/')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(
            'Contribute', 'Profile', 'Logout', 'Create an exploration',
            self.get_expected_logout_url('/'),
            no=['Login', 'Create an Oppia account',
                self.get_expected_login_url('/')])

        self.logout()


class NoninteractivePagesTest(test_utils.GenericTestBase):

    def test_about_page(self):
        """Test the About page."""
        response = self.testapp.get('/about')
        self.assertEqual(response.status_int, 200)
        self.assertEqual(response.content_type, 'text/html')
        response.mustcontain('What is Oppia?', 'About this website', 'License')
