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

"""Tests for the story viewer page"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import question_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import summary_services
from core.domain import topic_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseStoryViewerControllerTests(test_utils.GenericTestBase):

    def _record_completion(self, user_id, STORY_ID, node_id):
        """Records the completion of a node in the context of a story."""
        story_services.record_completed_node_in_story_context(
            user_id, STORY_ID, node_id)

    def setUp(self):
        """Completes the sign up process for the various users."""
        super(BaseStoryViewerControllerTests, self).setUp()
        self.VIEWER_EMAIL = 'viewer@example.com'
        self.VIEWER_USERNAME = 'viewer'
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.login(self.ADMIN_EMAIL)
        self.TOPIC_ID = 'topic_id'
        self.STORY_ID = 'story_id'
        self.NODE_ID_1 = 'node_1'
        self.NODE_ID_2 = 'node_2'
        self.NODE_ID_3 = 'node_3'
        self.EXP_ID_0 = '0'
        self.EXP_ID_1 = '1'
        self.EXP_ID_7 = '7'

        self.save_new_valid_exploration(
            self.EXP_ID_0, self.admin_id, title='Title 1', end_state_name='End')
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.admin_id, title='Title 2', end_state_name='End')
        self.save_new_valid_exploration(
            self.EXP_ID_7, self.admin_id, title='Title 3', end_state_name='End')
        self.publish_exploration(self.admin_id, self.EXP_ID_0)
        self.publish_exploration(self.admin_id, self.EXP_ID_1)
        self.publish_exploration(self.admin_id, self.EXP_ID_7)

        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'Title', self.TOPIC_ID)
        story.description = ('Description')
        exp_summary_dicts = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                [self.EXP_ID_0, self.EXP_ID_1, self.EXP_ID_7], user=self.admin))
        self.node_1 = {
            'id': self.NODE_ID_1,
            'title': 'Title 1',
            'description': 'Description 1',
            'thumbnail_filename': 'image_1.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.EXP_ID_1,
            'exp_summary_dict': exp_summary_dicts[1],
            'completed': False
        }
        self.node_2 = {
            'id': self.NODE_ID_2,
            'title': 'Title 2',
            'description': 'Description 2',
            'thumbnail_filename': 'image_2.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'destination_node_ids': ['node_1'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.EXP_ID_0,
            'exp_summary_dict': exp_summary_dicts[0],
            'completed': True
        }
        self.node_3 = {
            'id': self.NODE_ID_3,
            'title': 'Title 3',
            'description': 'Description 3',
            'thumbnail_filename': 'image_3.svg',
            'thumbnail_bg_color': constants.ALLOWED_THUMBNAIL_BG_COLORS[
                'chapter'][0],
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': self.EXP_ID_7,
            'exp_summary_dict': exp_summary_dicts[2],
            'completed': False
        }
        story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(self.node_1),
            story_domain.StoryNode.from_dict(self.node_2),
            story_domain.StoryNode.from_dict(self.node_3)
        ]
        self.nodes = story.story_contents.nodes
        story.story_contents.initial_node_id = 'node_2'
        story.story_contents.next_node_id = 'node_4'
        story_services.save_new_story(self.admin_id, story)
        self.save_new_topic(
            self.TOPIC_ID, 'user', name='Topic',
            description='A new topic', canonical_story_ids=[story.id],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=0)
        topic_services.publish_topic(self.TOPIC_ID, self.admin_id)
        topic_services.publish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id)
        self.logout()
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.login(self.VIEWER_EMAIL)
        self._record_completion(self.viewer_id, self.STORY_ID, self.NODE_ID_2)


class StoryPageTests(BaseStoryViewerControllerTests):
    def test_any_user_can_access_story_viewer_page(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s' % (feconf.STORY_VIEWER_URL_PREFIX, self.STORY_ID))

    def test_accessibility_of_unpublished_story_viewer_page(self):
        topic_services.unpublish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s' % (feconf.STORY_VIEWER_URL_PREFIX, self.STORY_ID),
                expected_status_int=404)
            self.login(self.ADMIN_EMAIL)
            self.get_html_response(
                '%s/%s' % (feconf.STORY_VIEWER_URL_PREFIX, self.STORY_ID))
            self.logout()

    def test_accessibility_of_story_viewer_in_unpublished_topic(self):
        topic_services.unpublish_topic(self.TOPIC_ID, self.admin_id)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_html_response(
                '%s/%s' % (feconf.STORY_VIEWER_URL_PREFIX, self.STORY_ID),
                expected_status_int=404)
            self.login(self.ADMIN_EMAIL)
            self.get_html_response(
                '%s/%s' % (feconf.STORY_VIEWER_URL_PREFIX, self.STORY_ID))
            self.logout()

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_html_response(
                '%s/%s' % (feconf.STORY_VIEWER_URL_PREFIX, self.STORY_ID),
                expected_status_int=404)


class StoryPageDataHandlerTests(BaseStoryViewerControllerTests):

    def test_can_not_access_story_viewer_page_with_unpublished_story(self):
        new_story_id = 'new_story_id'
        story = story_domain.Story.create_default_story(
            new_story_id, 'Title', self.TOPIC_ID)
        story_services.save_new_story(self.admin_id, story)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (feconf.STORY_DATA_HANDLER, new_story_id),
                expected_status_int=404)

    def test_can_not_access_story_viewer_page_with_unpublished_topic(self):
        new_story_id = 'new_story_id'
        self.save_new_topic(
            'topic_id_1', 'user', name='Topic 2',
            description='A new topic', canonical_story_ids=[new_story_id],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=0)
        story = story_domain.Story.create_default_story(
            new_story_id, 'Title', 'topic_id_1')
        story_services.save_new_story(self.admin_id, story)
        topic_services.publish_story(
            'topic_id_1', new_story_id, self.admin_id)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            self.get_json(
                '%s/%s' % (feconf.STORY_DATA_HANDLER, new_story_id),
                expected_status_int=404)

    def test_get(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', True):
            json_response = self.get_json(
                '%s/%s' % (feconf.STORY_DATA_HANDLER, 'story_id'))
            expected_dict = {
                'story_title': 'Title',
                'story_description': 'Description',
                'story_nodes': [self.node_2, self.node_1, self.node_3]
            }
            self.assertDictContainsSubset(expected_dict, json_response)

    def test_get_fails_when_new_structures_not_enabled(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_PLAYERS', False):
            self.get_json(
                '%s/%s' % (feconf.STORY_DATA_HANDLER, 'story_id'),
                expected_status_int=404)


class StoryProgressHandlerTests(BaseStoryViewerControllerTests):

    def test_post_fails_when_new_structures_not_enabled(self):
        csrf_token = self.get_new_csrf_token()
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', False):
            self.post_json(
                '%s/%s/%s' % (
                    feconf.STORY_PROGRESS_URL_PREFIX, self.STORY_ID,
                    self.NODE_ID_2
                ), {}, csrf_token=csrf_token, expected_status_int=404
            )

    def test_post_succeeds_when_story_and_node_exist(self):
        csrf_token = self.get_new_csrf_token()
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            json_response = self.post_json(
                '%s/%s/%s' % (
                    feconf.STORY_PROGRESS_URL_PREFIX, self.STORY_ID,
                    self.NODE_ID_1
                ), {}, csrf_token=csrf_token
            )

        self.assertEqual(json_response['summaries'][0]['id'], self.EXP_ID_7)
        self.assertEqual(json_response['next_node_id'], self.NODE_ID_3)
        self.assertFalse(json_response['ready_for_review_test'])

    def test_post_returns_empty_list_when_earlier_chapter_is_completed(self):
        csrf_token = self.get_new_csrf_token()
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            json_response = self.post_json(
                '%s/%s/%s' % (
                    feconf.STORY_PROGRESS_URL_PREFIX, self.STORY_ID,
                    self.NODE_ID_2
                ), {}, csrf_token=csrf_token
            )

        self.assertEqual(len(json_response['summaries']), 0)
        self.assertIsNone(json_response['next_node_id'])
        self.assertFalse(json_response['ready_for_review_test'])

    def test_post_fails_when_story_does_not_exist(self):
        csrf_token = self.get_new_csrf_token()
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            self.post_json(
                '%s/%s/%s' % (
                    feconf.STORY_PROGRESS_URL_PREFIX, 'invalid_story',
                    self.NODE_ID_2
                ), {}, csrf_token=csrf_token, expected_status_int=404
            )

    def test_post_fails_when_node_does_not_exist(self):
        csrf_token = self.get_new_csrf_token()
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            self.post_json(
                '%s/%s/%s' % (
                    feconf.STORY_PROGRESS_URL_PREFIX, self.STORY_ID,
                    'invalid_node'
                ), {}, csrf_token=csrf_token, expected_status_int=404
            )


    def test_post_fails_when_story_is_not_published_in_story_mode(self):
        topic_services.unpublish_story(
            self.TOPIC_ID, self.STORY_ID, self.admin_id)
        csrf_token = self.get_new_csrf_token()
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            self.post_json(
                '%s/%s/%s' % (
                    feconf.STORY_PROGRESS_URL_PREFIX, self.STORY_ID,
                    self.NODE_ID_2
                ), {}, csrf_token=csrf_token, expected_status_int=404
            )

    def test_post_returns_empty_list_when_user_completes_story(self):
        csrf_token = self.get_new_csrf_token()
        story_services.record_completed_node_in_story_context(
            self.viewer_id, self.STORY_ID, self.NODE_ID_2)
        story_services.record_completed_node_in_story_context(
            self.viewer_id, self.STORY_ID, self.NODE_ID_1)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            json_response = self.post_json(
                '%s/%s/%s' % (
                    feconf.STORY_PROGRESS_URL_PREFIX, self.STORY_ID,
                    self.NODE_ID_3
                ), {}, csrf_token=csrf_token
            )
        self.assertEqual(len(json_response['summaries']), 0)
        self.assertIsNone(json_response['next_node_id'])
        self.assertFalse(json_response['ready_for_review_test'])

    def test_post_returns_ready_for_review_when_acquired_skills_exist(self):
        csrf_token = self.get_new_csrf_token()
        self.save_new_skill(
            'skill_1', self.admin_id, description='Skill Description')
        self.save_new_question(
            'question_1', self.admin_id,
            self._create_valid_question_data('ABC'), ['skill_1'])
        question_services.create_new_question_skill_link(
            self.admin_id, 'question_1', 'skill_1', 0.3)
        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS),
                'node_id': self.NODE_ID_1,
                'old_value': [],
                'new_value': ['skill_1']
            })
        ]
        story_services.update_story(
            self.admin_id, self.STORY_ID, changelist,
            'Added acquired skill.')

        story_services.record_completed_node_in_story_context(
            self.viewer_id, self.STORY_ID, self.NODE_ID_2)
        story_services.record_completed_node_in_story_context(
            self.viewer_id, self.STORY_ID, self.NODE_ID_1)
        with self.swap(constants, 'ENABLE_NEW_STRUCTURE_VIEWER_UPDATES', True):
            json_response = self.post_json(
                '%s/%s/%s' % (
                    feconf.STORY_PROGRESS_URL_PREFIX, self.STORY_ID,
                    self.NODE_ID_3
                ), {}, csrf_token=csrf_token
            )
        self.assertEqual(len(json_response['summaries']), 0)
        self.assertIsNone(json_response['next_node_id'])
        self.assertTrue(json_response['ready_for_review_test'])
