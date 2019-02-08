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

from constants import constants
from core.controllers import base
from core.domain import acl_decorators
from core.domain import story_domain
from core.domain import story_services
from core.utils import test_utils
import feconf

class BaseStoryViewerControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign up process for the various users."""
        super(BaseStoryViewerControllerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.UserActionsInfo(self.admin_id)

        self.STORY_ID_1 = 'story_id_1'
        self.NODE_ID_1 = 'node_1'
        self.NODE_ID_2 = 'node_2'
        self.USER_ID = 'user'
        self.owner_id = 'owner'

        story = story_domain.Story.create_default_story(
            self.STORY_ID_1, 'Title')
        story.description = ('Description')
        self.node_1 = {
            'id': self.NODE_ID_1,
            'title': 'Title 1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.node_2 = {
            'id': self.NODE_ID_2,
            'title': 'Title 2',
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(self.node_1),
            story_domain.StoryNode.from_dict(self.node_2)
        ]
        self.nodes = story.story_contents.nodes
        story.story_contents.initial_node_id = 'node_1'
        story.story_contents.next_node_id = 'node_3'
        story_services.save_new_story(self.USER_ID, story)
        self._record_completion(self.owner_id, self.STORY_1_ID, self.NODE_ID_1)
 
class StoryPageDataHandlerTests(BaseStoryViewerControllerTests):

    def test_get(self):
        with self.swap(constants, 'ENABLE_NEW_STRUCTURES_PLAYER', True):
            json_response = self.get_json(
                '%s/%s' % (feconf.STORY_DATA_HANDLER, 'story_id_1'))
            expected_dict = {
                'completed_nodes': [],
                'pending_nodes':[]
            }
            self.assertDictContainsSubset(json_response, {})

