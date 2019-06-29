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

"""Tests for the review tests page."""

from constants import constants
from core.domain import story_domain
from core.domain import story_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseReviewTestsControllerTests(test_utils.GenericTestBase):

    OWNER_EMAIL = 'owner@example.com'
    VIEWER_EMAIL = 'viewer@example.com'
    VIEWER_USERNAME = 'viewer'

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseReviewTestsControllerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)

        self.topic_id = 'topic_id'
        self.story_id_1 = 'story_id_1'
        self.story_id_2 = 'story_id_2'
        self.node_id = 'node_1'
        self.node_id_2 = 'node_2'
        self.exp_id = 'exp_id'

        self.save_new_valid_exploration(self.exp_id, self.owner_id)
        self.publish_exploration(self.owner_id, self.exp_id)

        self.node_1 = {
            'id': self.node_id,
            'title': 'Title 1',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_id_1', 'skill_id_2'],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.exp_id
        }

        self.save_new_skill('skill_id_1', self.admin_id, 'Skill 1')
        self.save_new_skill('skill_id_2', self.admin_id, 'Skill 2')

        self.story = story_domain.Story.create_default_story(
            self.story_id_1, 'Public Story Title', self.topic_id)
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(self.node_1)
        ]
        self.story.story_contents.initial_node_id = self.node_id
        self.story.story_contents.next_node_id = self.node_id_2
        story_services.save_new_story(self.admin_id, self.story)

        self.story_2 = story_domain.Story.create_default_story(
            self.story_id_2, 'Private Story Title', self.topic_id)
        story_services.save_new_story(self.admin_id, self.story_2)

        story_services.publish_story(self.story_id_1, self.admin_id)

        self.login(self.VIEWER_EMAIL)


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
            story_services.record_completed_node_in_story_context(
                self.viewer_id, self.story_id_1, self.node_id)
            json_response = self.get_json(
                '%s/%s' % (
                    feconf.REVIEW_TEST_DATA_URL_PREFIX,
                    self.story_id_1))
            self.assertEqual(len(json_response['skill_descriptions']), 2)
            self.assertEqual(
                json_response['skill_descriptions']['skill_id_1'],
                'Skill 1')
            self.assertEqual(
                json_response['skill_descriptions']['skill_id_2'],
                'Skill 2')

    def test_no_user_can_access_unpublished_story_review_sessions_data(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (
                    feconf.REVIEW_TEST_DATA_URL_PREFIX, self.story_id_2),
                expected_status_int=404)

    def test_get_fails_when_acquired_skills_dont_exist(self):
        story_id = 'story_id_3'
        node_id = 'node_1'
        node = {
            'id': node_id,
            'title': 'Title 1',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_id_3'],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.exp_id
        }
        story = story_domain.Story.create_default_story(
            story_id, 'Public Story Title', self.topic_id)
        story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node)
        ]
        story.story_contents.initial_node_id = node_id
        story.story_contents.next_node_id = self.node_id_2
        story_services.save_new_story(self.admin_id, story)

        story_services.publish_story(story_id, self.admin_id)

        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            story_services.record_completed_node_in_story_context(
                self.viewer_id, story_id, node_id)
            self.get_json(
                '%s/%s' % (
                    feconf.REVIEW_TEST_DATA_URL_PREFIX, story_id),
                expected_status_int=404)

    def test_get_fails_when_story_doesnt_exist(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (
                    feconf.REVIEW_TEST_DATA_URL_PREFIX,
                    'story_id_3'),
                expected_status_int=404)

    def test_get_fails_when_no_completed_story_node(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (
                    feconf.REVIEW_TEST_DATA_URL_PREFIX,
                    self.story_id_1),
                expected_status_int=404)
