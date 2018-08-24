# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for the topic viewer page."""

from core.domain import rights_manager
from core.domain import story_domain
from core.domain import story_services
from core.domain import summary_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class BaseStoryViewerControllerTest(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseStoryViewerControllerTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)


        self.story_id = 'story'
        self.unsaved_story_id = 'story1'

        self.story = story_domain.Story.create_default_story(
            self.story_id, 'story_title')
        self.story.description = 'story_description'
        self.story.notes = 'notes'
        self.story.language_code = 'en'

        self.save_new_valid_exploration(
            'exp', self.admin_id, title='Bridges in England',
            category='Architecture', language_code='en')
        rights_manager.publish_exploration(self.admin, 'exp')

        node_1 = {
            'id': 'node_1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1', 'skill_0'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': 'exp'
        }
        node_2 = {
            'id': 'node_2',
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': ['skill_3', 'skill_4'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': 'exp'
        }
        node_3 = {
            'id': 'node_3',
            'destination_node_ids': ['node_4'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': ['skill_4'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': 'exp'
        }
        node_4 = {
            'id': 'node_4',
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': 'exp'
        }
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3),
            story_domain.StoryNode.from_dict(node_4)
        ]

        self.story.story_contents.initial_node_id = 'node_1'
        self.story.story_contents.next_node_id = 'node_5'
        story_services.save_new_story(self.admin_id, self.story)

        story_domain.Story.create_default_story(
            self.unsaved_story_id, 'story_title')

class StoryViewerPage(BaseStoryViewerControllerTest):

    def test_any_user_can_access_story_viewer_page(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (feconf.STORY_VIEWER_URL_PREFIX, self.story_id))

            self.assertEqual(response.status_int, 200)

    def test_no_user_can_access_unsaved_story_viewer_page(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            response = self.testapp.get(
                '%s/%s' % (
                    feconf.STORY_VIEWER_URL_PREFIX, self.unsaved_story_id),
                expect_errors=True)

            self.assertEqual(response.status_int, 404)


class StoryPageDataHandler(BaseStoryViewerControllerTest):

    def test_get(self):
        with self.swap(feconf, 'ENABLE_NEW_STRUCTURES', True):
            json_response = self.get_json(
                '%s/%s' % (feconf.STORY_DATA_HANDLER, self.story_id))
            expected_dict = (
                summary_services.get_learner_story_dict_by_id(self.story_id))

            self.assertDictContainsSubset(expected_dict, json_response)
