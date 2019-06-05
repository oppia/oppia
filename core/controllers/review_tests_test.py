# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for the reivew tests page."""

from constants import constants
from core.domain import story_domain
from core.domain import story_services
from core.domain import user_services
from core.tests import test_utils
import feconf

class BaseReviewTestsControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseReviewTestsControllerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)

        self.story_id_1 = 'story_id_1'
        self.story_id_2 = 'story_id_2'

        self.story = story_domain.Story.create_default_story(
            self.story_id_1, 'Public Story Title')
        self.story.acquired_skill_ids = ['skill_id_1', 'skill_id_2']
        story_services.save_new_story(self.admin_id, self.story)

        self.story = story_domain.Story.create_default_story(
            self.story_id_2, 'Private Story Title')
        story_services.save_new_story(self.admin_id, self.story)

        story_services.publish_story(self.story_id_1, self.admin_id)


class ReviewTestsPageTests(BaseReviewTestsControllerTests):

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_html_response(
                '%s/%s' % (
                    feconf.REVIEW_TEST_URL_PREFIX,
                    self.story_id_1),
                expected_status_int=404)

    def test_any_user_can_access_review_tests_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s' % (
                    feconf.REVIEW_TEST_URL_PREFIX,
                    self.story_id_1))

    def test_no_user_can_access_unpublished_story_review_sessions_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s' % (
                    feconf.REVIEW_TEST_URL_PREFIX, self.story_id_2),
                expected_status_int=404)

    def test_get_fails_when_story_doesnt_exist(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s' % (
                    feconf.REVIEW_TEST_URL_PREFIX,
                    'story_id_3'),
                expected_status_int=404)


class ReviewTestsPageDataHandlerTests(BaseReviewTestsControllerTests):

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_json(
                '%s/%s' % (
                    feconf.REVIEW_TEST_DATA_URL_PREFIX,
                    self.story_id_1),
                expected_status_int=404)

    def test_any_user_can_access_review_tests_data(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            json_response = self.get_json(
                '%s/%s' % (
                    feconf.REVIEW_TEST_DATA_URL_PREFIX,
                    self.story_id_1))
            self.assertEqual(len(json_response['skill_list']), 2)
            self.assertEqual(json_response['skill_list'][0], 'skill_id_1')
            self.assertEqual(json_response['skill_list'][1], 'skill_id_2')

    def test_no_user_can_access_unpublished_story_review_sessions_data(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (
                    feconf.REVIEW_TEST_DATA_URL_PREFIX, self.story_id_2),
                expected_status_int=404)

    def test_get_fails_when_story_doesnt_exist(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (
                    feconf.REVIEW_TEST_DATA_URL_PREFIX,
                    'story_id_3'),
                expected_status_int=404)
