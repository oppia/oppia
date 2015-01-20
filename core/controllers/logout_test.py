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

"""Tests for the logout page."""

__author__ = 'sbhowmik@google.com (Shantanu Bhowmik)'
import datetime

from core.domain import exp_services
from core.platform.users import gae_current_user_services
from core.tests import test_utils
import feconf

class LogoutTest(test_utils.GenericTestBase):

    def test_logout_page(self):
        """Tests  for logout handler."""
        exp_services.load_demo('0') 
        # Logout with valid query arg.
        current_page = '/explore/0'
        response = self.testapp.get(current_page)
        self.assertEqual(response.status_int, 200)
        self.login('reader@example.com')
        response = self.testapp.get(current_page)
        self.assertEqual(response.status_int, 200)

        current_page = '/about'
        self.assertFalse(self.is_logged_out(response))
        response = self.testapp.get(gae_current_user_services.create_logout_url(
            current_page))
        self.assertTrue(self.is_logged_out(response))
        self.assertIn(current_page, response.headers['location'])   
        
        # Logout with invalid query arg.                
        current_page = '/explore/0'
        response = self.testapp.get(current_page)
        self.assertEqual(response.status_int, 200)
        self.login('reader@example.com') 
        response = self.testapp.get(current_page)
        self.assertEqual(response.status_int, 200)

        current_page = ''
        response = self.testapp.get(gae_current_user_services.create_logout_url(
            current_page)) 
        self.assertTrue(self.is_logged_out(response))
        self.assertIn(current_page, response.headers['location'])   
