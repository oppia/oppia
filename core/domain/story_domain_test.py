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

"""Tests for story domain objects and methods defined on them."""

from constants import constants
from core.domain import story_domain
from core.tests import test_utils
import feconf


class StoryDomainUnitTests(test_utils.GenericTestBase):
    """Test the story domain object."""

    STORY_ID = 'story_id'
    NODE_ID_1 = 'node_id_1'
    NODE_ID_2 = 'node_id_2'
    SKILL_ID_1 = 'skill_id_1'
    SKILL_ID_2 = 'skill_id_2'
    EXP_ID = 'exp_id'

    def test_defaults(self):
        """Test the create_default_story and create_default_story_node
        method of class Story.
        """
        story = story_domain.Story.create_default_story(self.STORY_ID)
        story_node = story_domain.StoryNode.create_default_story_node(
            self.NODE_ID_1)
        story.story_nodes.append(story_node)
        expected_story_dict = {
            'id': self.STORY_ID,
            'title': feconf.DEFAULT_STORY_TITLE,
            'description': feconf.DEFAULT_STORY_DESCRIPTION,
            'notes': feconf.DEFAULT_STORY_NOTES,
            'story_nodes': [story_node.to_dict()],
            'schema_version': feconf.CURRENT_STORY_SCHEMA_VERSION,
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }
        self.assertEqual(story.to_dict(), expected_story_dict)

    def test_story_export_import(self):
        """Test that to_dict and from_dict preserve all data within a story.
        """
        story_node = story_domain.StoryNode(
            self.NODE_ID_1, [self.NODE_ID_2],
            [self.SKILL_ID_1], [self.SKILL_ID_2],
            'Outline', self.EXP_ID)
        story = story_domain.Story(
            self.STORY_ID, 'Title', 'Description', 'Notes', [story_node],
            feconf.CURRENT_STORY_SCHEMA_VERSION, 'en', 0)
        story_dict = story.to_dict()
        story_from_dict = story_domain.Story.from_dict(story_dict)
        self.assertEqual(story_from_dict.to_dict(), story_dict)
