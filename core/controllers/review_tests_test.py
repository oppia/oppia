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

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils


class BaseReviewTestsControllerTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        """Completes the sign-up process for the various users."""
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.topic_id = 'topic_id'
        self.story_id_1 = 'story_id_1'
        self.story_id_2 = 'story_id_2'
        self.story_id_3 = 'story_id_3'
        self.node_id = 'node_1'
        self.node_id_2 = 'node_2'
        self.exp_id = 'exp_id'
        self.story_url_fragment_1 = 'public-story-title'
        self.story_url_fragment_2 = 'private-story-title'

        self.save_new_valid_exploration(
            self.exp_id, self.owner_id)
        self.publish_exploration(self.owner_id, self.exp_id)

        self.node_1: story_domain.StoryNodeDict = {
            'id': self.node_id,
            'title': 'Title 1',
            'description': 'Description 1',
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_id_1', 'skill_id_2'],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.exp_id,
            'status': 'Draft',
            'planned_publication_date_msecs': 100,
            'last_modified_msecs': 100,
            'first_publication_date_msecs': None,
            'unpublishing_reason': None
        }

        self.save_new_skill('skill_id_1', self.admin_id, description='Skill 1')
        self.save_new_skill('skill_id_2', self.admin_id, description='Skill 2')

        self.story = story_domain.Story.create_default_story(
            self.story_id_1, 'Public Story Title', 'Description', self.topic_id,
            self.story_url_fragment_1)
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(self.node_1)
        ]
        self.story.story_contents.initial_node_id = self.node_id
        self.story.story_contents.next_node_id = self.node_id_2
        story_services.save_new_story(self.admin_id, self.story)

        self.story_2 = story_domain.Story.create_default_story(
            self.story_id_2, 'Private Story Title', 'Description',
            self.topic_id, self.story_url_fragment_2)
        story_services.save_new_story(self.admin_id, self.story_2)
        subtopic_1 = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic Title 1', 'url-frag-one')
        subtopic_1.skill_ids = ['skill_id_1']
        subtopic_1.url_fragment = 'sub-one-frag'
        self.save_new_topic(
            self.topic_id, 'user', name='Topic',
            description='A new topic',
            canonical_story_ids=[self.story_id_1, self.story_id_3],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic_1], next_subtopic_id=2)
        topic_services.publish_topic(self.topic_id, self.admin_id)
        topic_services.publish_story(
            self.topic_id, self.story_id_1, self.admin_id)

        self.login(self.VIEWER_EMAIL)


class ReviewTestsPageTests(BaseReviewTestsControllerTests):

    def test_any_user_can_access_review_tests_page(self) -> None:
        self.get_html_response(
            '/learn/staging/topic/review-test/%s'
            % self.story_url_fragment_1)

    def test_no_user_can_access_unpublished_story_review_sessions_page(
        self
    ) -> None:
        self.get_html_response(
            '/learn/staging/topic/review-test/%s'
            % self.story_url_fragment_2,
            expected_status_int=404)

    def test_get_fails_when_story_doesnt_exist(self) -> None:
        self.get_html_response(
            '/learn/staging/topic/review-test/%s'
            % 'non-existent-story',
            expected_status_int=302)


class ReviewTestsPageDataHandlerTests(BaseReviewTestsControllerTests):

    def test_any_user_can_access_review_tests_data(self) -> None:
        story_services.record_completed_node_in_story_context(
            self.viewer_id, self.story_id_1, self.node_id)
        json_response = self.get_json(
            '%s/staging/topic/%s' % (
                feconf.REVIEW_TEST_DATA_URL_PREFIX,
                self.story_url_fragment_1))
        self.assertEqual(len(json_response['skill_descriptions']), 2)
        self.assertEqual(
            json_response['skill_descriptions']['skill_id_1'],
            'Skill 1')
        self.assertEqual(
            json_response['skill_descriptions']['skill_id_2'],
            'Skill 2')

    def test_no_user_can_access_unpublished_story_review_sessions_data(
        self
    ) -> None:
        self.get_json(
            '%s/staging/topic/%s' % (
                feconf.REVIEW_TEST_DATA_URL_PREFIX,
                self.story_url_fragment_2),
            expected_status_int=404)

    def test_get_fails_when_acquired_skills_dont_exist(self) -> None:
        node_id = 'node_1'
        node: story_domain.StoryNodeDict = {
            'id': node_id,
            'title': 'Title 1',
            'description': 'Description 1',
            'thumbnail_filename': 'image.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'thumbnail_size_in_bytes': 21131,
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_id_3'],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.exp_id,
            'status': 'Draft',
            'planned_publication_date_msecs': 100,
            'last_modified_msecs': 100,
            'first_publication_date_msecs': None,
            'unpublishing_reason': None
        }
        story = story_domain.Story.create_default_story(
            self.story_id_3, 'Public Story Title', 'Description', self.topic_id,
            'public-story-title-two')
        story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node)
        ]
        story.story_contents.initial_node_id = node_id
        story.story_contents.next_node_id = self.node_id_2
        story_services.save_new_story(self.admin_id, story)

        topic_services.publish_story(
            self.topic_id, self.story_id_3, self.admin_id)

        story_services.record_completed_node_in_story_context(
            self.viewer_id, self.story_id_3, node_id)
        self.get_json(
            '%s/staging/topic/%s' % (
                feconf.REVIEW_TEST_DATA_URL_PREFIX,
                'public-story-title-two'),
            expected_status_int=404)

    def test_get_fails_when_story_doesnt_exist(self) -> None:
        self.get_json(
            '%s/staging/topic/%s' % (
                feconf.REVIEW_TEST_DATA_URL_PREFIX,
                'non-existent-story-url-fragment'),
            expected_status_int=400)

    def test_get_fails_when_no_completed_story_node(self) -> None:
        self.get_json(
            '%s/staging/topic/%s' % (
                feconf.REVIEW_TEST_DATA_URL_PREFIX,
                self.story_url_fragment_1),
            expected_status_int=404)
