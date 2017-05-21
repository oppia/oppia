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
from core.tests import test_utils


class ModeratorTest(test_utils.GenericTestBase):

    def test_moderator_page(self):
        """Tests access to the Moderator page"""
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


class FeaturedActivitiesHandlerTest(test_utils.GenericTestBase):

    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    ALBERT_ID = 'albert'

    def setUp(self):
        super(FeaturedActivitiesHandlerTest, self).setUp()
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        self.set_moderators([self.MODERATOR_USERNAME])

        self.save_new_valid_exploration(self.EXP_ID_1, self.ALBERT_ID)
        rights_manager.publish_exploration(self.ALBERT_ID, self.EXP_ID_1)

        self.save_new_valid_exploration(self.EXP_ID_2, self.ALBERT_ID)

    def test_unpublished_activities_cannot_be_added_to_featured_list(self):
        self.login(self.MODERATOR_EMAIL)
        response = self.testapp.get('/moderator')
        self.assertEqual(response.status_int, 200)
        csrf_token = self.get_csrf_token_from_response(response)

        # Posting a list that includes private activities results in an error.
        self.post_json('/moderatorhandler/featured', {
            'featured_activity_reference_dicts': [{
                'type': 'exploration',
                'id': self.EXP_ID_2,
            }],
        }, csrf_token, expect_errors=True, expected_status_int=400)
        self.post_json('/moderatorhandler/featured', {
            'featured_activity_reference_dicts': [{
                'type': 'exploration',
                'id': self.EXP_ID_1,
            }, {
                'type': 'exploration',
                'id': self.EXP_ID_2,
            }],
        }, csrf_token, expect_errors=True, expected_status_int=400)

        # Posting a list that only contains public activities succeeds.
        self.post_json('/moderatorhandler/featured', {
            'featured_activity_reference_dicts': [{
                'type': 'exploration',
                'id': self.EXP_ID_1,
            }],
        }, csrf_token)

        self.logout()
