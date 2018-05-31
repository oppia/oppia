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
from core.domain import story_services
from core.tests import test_utils
import feconf
import utils


class StoryDomainUnitTests(test_utils.GenericTestBase):
    """Test the story domain object."""

    STORY_ID = 'story_id'
    NODE_ID_1 = 'node_id_1'
    NODE_ID_2 = 'node_id_2'
    SKILL_ID_1 = 'skill_id_1'
    SKILL_ID_2 = 'skill_id_2'
    EXP_ID = 'exp_id'
    USER_ID = 'user'

    def setUp(self):
        super(StoryDomainUnitTests, self).setUp()
        story_node = story_domain.StoryNode.create_default_story_node(
            self.NODE_ID_1)
        story_contents = story_domain.StoryContents([story_node])
        self.STORY_ID = story_services.get_new_story_id()
        self.story = self.save_new_story(
            self.STORY_ID, self.USER_ID, 'Title', 'Description', 'Notes',
            story_contents
        )

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the story passes validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.story.validate()

    def test_defaults(self):
        """Test the create_default_story and create_default_story_node
        method of class Story.
        """
        story = story_domain.Story.create_default_story(self.STORY_ID)
        story_node = story_domain.StoryNode.create_default_story_node(
            self.NODE_ID_1)
        story.story_contents = story_domain.StoryContents([story_node])
        expected_story_dict = {
            'id': self.STORY_ID,
            'title': feconf.DEFAULT_STORY_TITLE,
            'description': feconf.DEFAULT_STORY_DESCRIPTION,
            'notes': feconf.DEFAULT_STORY_NOTES,
            'story_contents': {
                'nodes': [{
                    'id': self.NODE_ID_1,
                    'destination_node_ids': [],
                    'acquired_skill_ids': [],
                    'prerequisite_skill_ids': [],
                    'outline': '',
                    'exploration_id': None
                }]
            },
            'schema_version': feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }
        self.assertEqual(story.to_dict(), expected_story_dict)

    def test_title_validation(self):
        self.story.title = 1
        self._assert_validation_error(
            'Expected title to be a string, received 1')

    def test_description_validation(self):
        self.story.description = 1
        self._assert_validation_error(
            'Expected description to be a string, received 1')

    def test_notes_validation(self):
        self.story.notes = 1
        self._assert_validation_error(
            'Expected notes to be a string, received 1')

    def test_language_code_validation(self):
        self.story.language_code = 0
        self._assert_validation_error(
            'Expected language code to be a string, received 0')

        self.story.language_code = 'xz'
        self._assert_validation_error('Invalid language code')

    def test_schema_version_validation(self):
        self.story.schema_version = 'schema_version'
        self._assert_validation_error(
            'Expected schema version to be an integer, received schema_version')

        self.story.schema_version = 100
        self._assert_validation_error(
            'Expected schema version to be %s, received %s' % (
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
                self.story.schema_version)
        )

    def test_nodes_validation(self):
        self.story.story_contents.nodes = {}
        self._assert_validation_error(
            'Expected nodes field to be a list, received {}')

        self.story.story_contents.nodes = ['node_1']
        self._assert_validation_error(
            'Expected each node to be a StoryNode object, received node_1')

        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict({
                'id': 'node_id',
                'destination_node_ids': [self.NODE_ID_2],
                'prerequisite_skill_ids': [],
                'acquired_skill_ids': [],
                'outline': 'Outline',
                'exploration_id': 'exploration_id'
            })
        ]
        self._assert_validation_error('Expected all destination nodes to exist')
        # The following line is to remove the 'Expected all destination nodes to
        # exist' error for the remaining tests.
        self.story.story_contents.nodes.append(
            story_domain.StoryNode.create_default_story_node(self.NODE_ID_2))
        self.story.story_contents.nodes[0].acquired_skill_ids = [
            'skill_id', 'skill_id', 'skill_id_1']
        self._assert_validation_error(
            'Expected all acquired skills to be distinct.')
        self.story.story_contents.nodes[0].acquired_skill_ids = [1]
        self._assert_validation_error(
            'Expected each acquired skill id to be a string, received 1')

        self.story.story_contents.nodes[0].acquired_skill_ids = 1
        self._assert_validation_error(
            'Expected acquired skill ids to be a list, received 1')

        self.story.story_contents.nodes[0].prerequisite_skill_ids = [
            'skill_id', 'skill_id', 'skill_id_1']
        self._assert_validation_error(
            'Expected all prerequisite skills to be distinct.')
        self.story.story_contents.nodes[0].prerequisite_skill_ids = [1]
        self._assert_validation_error(
            'Expected each prerequisite skill id to be a string, received 1')

        self.story.story_contents.nodes[0].prerequisite_skill_ids = 1
        self._assert_validation_error(
            'Expected prerequisite skill ids to be a list, received 1')

    def test_acquired_prerequisite_skill_intersection_validation(self):
        self.story.story_contents.nodes[0].prerequisite_skill_ids = [
            'skill_id', 'skill_id_1']
        self.story.story_contents.nodes[0].acquired_skill_ids = [
            'skill_id', 'skill_id_2']
        self._assert_validation_error(
            'Expected prerequisite skill ids and acquired skill ids '
            'to be mutually exclusive.')

    def test_all_nodes_visited(self):
        node_1 = {
            'id': 'node_1',
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_4'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_4'],
            'outline': '',
            'exploration_id': None
        }
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3)
        ]
        self._assert_validation_error('Expected all nodes to be reachable.')

        node_1 = {
            'id': 'node_1',
            'destination_node_ids': ['node_3', 'node_2'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_4'],
            'prerequisite_skill_ids': ['skill_3'],
            'outline': '',
            'exploration_id': None
        }
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3)
        ]
        self.story.validate()

        node_1 = {
            'id': 'node_1',
            'destination_node_ids': ['node_2', 'node_3'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_1'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_4'],
            'prerequisite_skill_ids': ['skill_3'],
            'outline': '',
            'exploration_id': None
        }
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3)
        ]
        self._assert_validation_error('Expected all nodes to be reachable.')

    def test_story_contents_export_import(self):
        """Test that to_dict and from_dict preserve all data within a
        story_contents object.
        """
        story_node = story_domain.StoryNode(
            self.NODE_ID_1, [self.NODE_ID_2],
            [self.SKILL_ID_1], [self.SKILL_ID_2],
            'Outline', self.EXP_ID)
        story_contents = story_domain.StoryContents([story_node])
        story_contents_dict = story_contents.to_dict()
        story_contents_from_dict = story_domain.StoryContents.from_dict(
            story_contents_dict)
        self.assertEqual(
            story_contents_from_dict.to_dict(), story_contents_dict)
