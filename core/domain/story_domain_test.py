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
    NODE_ID_1 = story_domain.NODE_ID_PREFIX + '1'
    NODE_ID_2 = 'node_2'
    SKILL_ID_1 = 'skill_id_1'
    SKILL_ID_2 = 'skill_id_2'
    EXP_ID = 'exp_id'
    USER_ID = 'user'

    def setUp(self):
        super(StoryDomainUnitTests, self).setUp()
        self.STORY_ID = story_services.get_new_story_id()
        self.story = self.save_new_story(
            self.STORY_ID, self.USER_ID, 'Title', 'Description', 'Notes'
        )

    def _assert_validation_error(self, expected_error_substring):
        """Checks that the story passes validation."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            self.story.validate()

    def _assert_valid_story_id(self, expected_error_substring, story_id):
        """Checks that the story id is valid."""
        with self.assertRaisesRegexp(
            utils.ValidationError, expected_error_substring):
            story_domain.Story.require_valid_story_id(story_id)

    def test_valid_story_id(self):
        self._assert_valid_story_id('Story id should be a string', 10)
        self._assert_valid_story_id('Invalid story id', 'abc')

    def test_defaults(self):
        """Test the create_default_story and create_default_story_node
        method of class Story.
        """
        story = story_domain.Story.create_default_story(self.STORY_ID, 'Title')
        expected_story_dict = {
            'id': self.STORY_ID,
            'title': 'Title',
            'description': feconf.DEFAULT_STORY_DESCRIPTION,
            'notes': feconf.DEFAULT_STORY_NOTES,
            'story_contents': {
                'nodes': [{
                    'id': self.NODE_ID_1,
                    'destination_node_ids': [],
                    'acquired_skill_ids': [],
                    'prerequisite_skill_ids': [],
                    'outline': '',
                    'outline_is_finalized': False,
                    'exploration_id': None
                }],
                'initial_node_id': self.NODE_ID_1,
                'next_node_id': 'node_2'
            },
            'schema_version': feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }
        self.assertEqual(story.to_dict(), expected_story_dict)

    def test_title_validation(self):
        self.story.title = 1
        self._assert_validation_error(
            'Title should be a string')

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

    def test_get_number_from_node_id(self):
        self.assertEqual(
            story_domain.StoryNode.get_number_from_node_id('node_10'), 10)

    def test_node_outline_finalized_validation(self):
        self.story.story_contents.nodes[0].outline_is_finalized = 'abs'
        self._assert_validation_error(
            'Expected outline_is_finalized to be a boolean')

    def test_nodes_validation(self):
        self.story.story_contents.initial_node_id = 'node_10'
        self._assert_validation_error('Expected starting node to exist')
        self.story.story_contents.initial_node_id = 'node_id_1'
        self._assert_validation_error('Invalid node_id: node_id_1')
        self.story.story_contents.initial_node_id = 'node_abc'
        self._assert_validation_error('Invalid node_id: node_abc')

        self.story.story_contents.initial_node_id = 'node_1'
        self.story.story_contents.nodes = {}
        self._assert_validation_error(
            'Expected nodes field to be a list, received {}')

        self.story.story_contents.nodes = ['node_1']
        self._assert_validation_error(
            'Expected each node to be a StoryNode object, received node_1')

        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict({
                'id': 'node_1',
                'destination_node_ids': [self.NODE_ID_2],
                'prerequisite_skill_ids': [],
                'acquired_skill_ids': [],
                'outline': 'Outline',
                'outline_is_finalized': False,
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
        self.story.story_contents.next_node_id = 'node_4'
        # Case 1: Prerequisite skills not acquired.
        node_1 = {
            'id': 'node_1',
            'destination_node_ids': ['node_2', 'node_3'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_4'],
            'prerequisite_skill_ids': ['skill_3'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.story.story_contents.initial_node_id = 'node_1'
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3)
        ]
        self._assert_validation_error(
            'The prerequisite skills skill_3 were not completed before '
            'the node with id node_3 was unlocked.')

        # Case 2: Story with loops.
        node_1 = {
            'id': 'node_1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_4'],
            'prerequisite_skill_ids': ['skill_3'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3)
        ]
        self._assert_validation_error('Loops are not allowed in stories.')

        # Case 3: Disconnected graph.
        node_1 = {
            'id': 'node_1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_4'],
            'prerequisite_skill_ids': ['skill_3'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3)
        ]
        self._assert_validation_error(
            'The node with id node_3 is disconnected from the story graph.')

        # Case 4: Graph with duplicate nodes.
        node_1 = {
            'id': 'node_1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_2',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_4'],
            'prerequisite_skill_ids': ['skill_3'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3)
        ]
        self._assert_validation_error(
            'The node id node_2 is duplicated in the story.')

        self.story.story_contents.next_node_id = 'node_5'
        # Case 5: A valid graph.
        node_1 = {
            'id': 'node_1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1', 'skill_0'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'destination_node_ids': ['node_4', 'node_3'],
            'acquired_skill_ids': ['skill_3', 'skill_4'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': ['skill_4'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_4 = {
            'id': 'node_4',
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3),
            story_domain.StoryNode.from_dict(node_4)
        ]
        self.story.validate()

    def test_story_contents_export_import(self):
        """Test that to_dict and from_dict preserve all data within a
        story_contents object.
        """
        story_node = story_domain.StoryNode(
            self.NODE_ID_1, [self.NODE_ID_2],
            [self.SKILL_ID_1], [self.SKILL_ID_2],
            'Outline', False, self.EXP_ID)
        story_contents = story_domain.StoryContents(
            [story_node], self.NODE_ID_1, 2)
        story_contents_dict = story_contents.to_dict()
        story_contents_from_dict = story_domain.StoryContents.from_dict(
            story_contents_dict)
        self.assertEqual(
            story_contents_from_dict.to_dict(), story_contents_dict)
