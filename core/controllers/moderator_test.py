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

__author__ = 'Yana Malysheva'

import test_utils


class ModeratorTest(test_utils.GenericTestBase):

    def test_moderator_page(self):
        """Tests access to the Moderator page"""
        # Try accessing the moderator page without logging in.
        response = self.testapp.get('/moderator')
        self.assertEqual(response.status_int, 302)

        # Try accessing the moderator page without being a moderator or admin.
        self.login('user@example.com')
        response = self.testapp.get('/moderator', expect_errors=True)
        csrf_token = self.get_csrf_token_from_response(response)
        self.assertEqual(response.status_int, 401)
        response = self.post_json(
            '/moderatorhandler/user_services',
            {'username': 'username'},
            csrf_token=csrf_token,
            expect_errors=True,
            expected_status_int=401)
        self.logout()

        # Try accessing the moderator page after logging in as a moderator.
        self.set_moderators(['moderator@example.com'])

        self.login('moderator@example.com')
        response = self.testapp.get('/moderator')
        self.assertEqual(response.status_int, 200)
        self.logout()

        # Try accessing the moderator page after logging in as an admin.
        self.set_admins(['admin@example.com'])

        self.login('admin@example.com')
        response = self.testapp.get('/moderator')
        self.assertEqual(response.status_int, 200)
        self.logout()
