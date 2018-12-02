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

"""Tests for the moderator page."""

from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils


class ModeratorPageTests(test_utils.GenericTestBase):

    def test_moderator_page(self):
        """Tests access to the Moderator page."""
        # Try accessing the moderator page without logging in.
        response = self.testapp.get('/moderator')
        self.assertEqual(response.status_int, 302)

        # Try accessing the moderator page without being a moderator or admin.
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        response = self.testapp.get('/moderator', expect_errors=True)
        self.assertEqual(response.status_int, 401)
        self.logout()

        # Try accessing the moderator page after logging in as a moderator.
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get('/moderator')
        self.assertEqual(response.status_int, 200)
        self.logout()

        # Try accessing the moderator page after logging in as an admin.
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get('/moderator')
        self.assertEqual(response.status_int, 200)
        self.logout()


class FeaturedActivitiesHandlerTests(test_utils.GenericTestBase):

    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    username = 'albert'
    user_email = 'albert@example.com'

    def setUp(self):
        super(FeaturedActivitiesHandlerTests, self).setUp()
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.signup(self.user_email, self.username)
        self.set_moderators([self.MODERATOR_USERNAME])
        self.user_id = self.get_user_id_from_email(self.user_email)
        self.user = user_services.UserActionsInfo(self.user_id)
        self.save_new_valid_exploration(self.EXP_ID_1, self.user_id)
        rights_manager.publish_exploration(self.user, self.EXP_ID_1)

        self.save_new_valid_exploration(self.EXP_ID_2, self.user_id)

    def test_unpublished_activities_cannot_be_added_to_featured_list(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get('/moderator')
        self.assertEqual(response.status_int, 200)
        csrf_token = self.get_csrf_token_from_response(response)

        # Posting a list that includes private activities results in an error.
        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_2,
                }],
            }, csrf_token=csrf_token,
            expect_errors=True, expected_status_int=400)
        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_1,
                }, {
                    'type': 'exploration',
                    'id': self.EXP_ID_2,
                }],
            }, csrf_token=csrf_token,
            expect_errors=True, expected_status_int=400)

        # Posting a list that only contains public activities succeeds.
        self.post_json(
            '/moderatorhandler/featured', {
                'featured_activity_reference_dicts': [{
                    'type': 'exploration',
                    'id': self.EXP_ID_1,
                }],
            }, csrf_token=csrf_token)

        self.logout()
