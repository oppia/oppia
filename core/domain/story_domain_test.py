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
    USER_ID_1 = 'user1'

    def setUp(self):
        super(StoryDomainUnitTests, self).setUp()
        self.STORY_ID = story_services.get_new_story_id()
        self.story = self.save_new_story(
            self.STORY_ID, self.USER_ID, 'Title', 'Description', 'Notes'
        )
        self.story.add_node(self.NODE_ID_1, 'Node title')
        self.signup('user@example.com', 'user')
        self.signup('user1@example.com', 'user1')

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

    def test_to_human_readable_dict(self):
        story_summary = story_services.get_story_summary_by_id(self.STORY_ID)
        expected_dict = {
            'id': self.STORY_ID,
            'title': 'Title',
            'description': 'Description'
        }

        self.assertEqual(expected_dict, story_summary.to_human_readable_dict())

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
                'nodes': [],
                'initial_node_id': None,
                'next_node_id': self.NODE_ID_1
            },
            'story_contents_schema_version': (
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION),
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'version': 0
        }
        self.assertEqual(story.to_dict(), expected_story_dict)

    def test_get_prerequisite_skill_ids(self):
        self.story.story_contents.nodes[0].prerequisite_skill_ids = ['skill_1']
        self.story.story_contents.nodes[0].exploration_id = 'exp_id'
        self.assertEqual(
            self.story.get_prerequisite_skill_ids_for_exp_id('exp_id'),
            ['skill_1'])
        self.assertIsNone(
            self.story.get_prerequisite_skill_ids_for_exp_id('exp_id_2'))

    def test_has_exploration_id(self):
        self.story.story_contents.nodes[0].exploration_id = 'exp_id'
        self.assertTrue(self.story.has_exploration('exp_id'))
        self.assertFalse(self.story.has_exploration('exp_id_2'))

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
        self.story.story_contents_schema_version = 'schema_version'
        self._assert_validation_error(
            'Expected story contents schema version to be an integer, received '
            'schema_version')

        self.story.story_contents_schema_version = 100
        self._assert_validation_error(
            'Expected story contents schema version to be %s, received %s' % (
                feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION,
                self.story.story_contents_schema_version)
        )

    def test_add_node_validation(self):
        with self.assertRaisesRegexp(
            Exception, 'The node id node_3 does not match the expected '
            'next node id for the story'):
            self.story.add_node('node_3', 'Title 3')

    def test_get_number_from_node_id(self):
        self.assertEqual(
            story_domain.StoryNode.get_number_from_node_id('node_10'), 10)

    def test_node_outline_finalized_validation(self):
        self.story.story_contents.nodes[0].outline_is_finalized = 'abs'
        self._assert_validation_error(
            'Expected outline_is_finalized to be a boolean')

    def test_node_title_validation(self):
        self.story.story_contents.nodes[0].title = 1
        self._assert_validation_error(
            'Expected title to be a string, received 1')

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
                'title': 'Title 1',
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
            story_domain.StoryNode.create_default_story_node(
                self.NODE_ID_2, 'Title 2'))
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
            'title': 'Title 1',
            'destination_node_ids': ['node_2', 'node_3'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'title': 'Title 2',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'title': 'Title 3',
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
            'title': 'Title 1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'title': 'Title 2',
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'title': 'Title 3',
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
            'title': 'Title 1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'title': 'Title 2',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'title': 'Title 3',
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
            'title': 'Title 1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'title': 'Title 2',
            'destination_node_ids': [],
            'acquired_skill_ids': ['skill_3'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_2',
            'title': 'Title 2',
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
        self._assert_validation_error('Expected all node ids to be distinct')

        self.story.story_contents.next_node_id = 'node_5'
        # Case 5: A valid graph.
        node_1 = {
            'id': 'node_1',
            'title': 'Title 1',
            'destination_node_ids': ['node_2'],
            'acquired_skill_ids': ['skill_2'],
            'prerequisite_skill_ids': ['skill_1', 'skill_0'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'title': 'Title 2',
            'destination_node_ids': ['node_4', 'node_3'],
            'acquired_skill_ids': ['skill_3', 'skill_4'],
            'prerequisite_skill_ids': ['skill_2'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'title': 'Title 3',
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': ['skill_4'],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_4 = {
            'id': 'node_4',
            'title': 'Title 4',
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
            self.NODE_ID_1, 'Title', [self.NODE_ID_2],
            [self.SKILL_ID_1], [self.SKILL_ID_2],
            'Outline', False, self.EXP_ID)
        story_contents = story_domain.StoryContents(
            [story_node], self.NODE_ID_1, 2)
        story_contents_dict = story_contents.to_dict()
        story_contents_from_dict = story_domain.StoryContents.from_dict(
            story_contents_dict)
        self.assertEqual(
            story_contents_from_dict.to_dict(), story_contents_dict)

    def test_to_dict(self):
        user_ids = [self.USER_ID, self.USER_ID_1]
        story_rights = story_domain.StoryRights(self.STORY_ID, user_ids, False)
        expected_dict = {
            'story_id': self.STORY_ID,
            'manager_names': ['user', 'user1'],
            'story_is_published': False
        }

        self.assertEqual(expected_dict, story_rights.to_dict())

    def test_is_manager(self):
        user_ids = [self.USER_ID, self.USER_ID_1]
        story_rights = story_domain.StoryRights(self.STORY_ID, user_ids, False)
        self.assertTrue(story_rights.is_manager(self.USER_ID))
        self.assertTrue(story_rights.is_manager(self.USER_ID_1))
        self.assertFalse(story_rights.is_manager('fakeuser'))


class StoryRightsChangeTests(test_utils.GenericTestBase):
    """Test the story rights change domain object."""

    def setUp(self):
        super(StoryRightsChangeTests, self).setUp()
        self.STORY_ID = story_services.get_new_story_id()
        self.story = self.save_new_story(
            self.STORY_ID, 'user_id', 'Title', 'Description', 'Notes'
        )
        self.signup('user@example.com', 'user')

    def test_initializations(self):
        with self.assertRaisesRegexp(
            Exception, 'Invalid change_dict: '
            '{\'invalid_key\': \'invalid_value\'}'):
            story_domain.StoryRightsChange({
                'invalid_key': 'invalid_value'
            })

        change_role_object = story_domain.StoryRightsChange({
            'cmd': story_domain.CMD_CHANGE_ROLE,
            'assignee_id': 'assignee_id',
            'new_role': 'new_role',
            'old_role': 'old_role'
        })

        self.assertEqual(change_role_object.cmd, story_domain.CMD_CHANGE_ROLE)
        self.assertEqual(change_role_object.assignee_id, 'assignee_id')
        self.assertEqual(change_role_object.new_role, 'new_role')
        self.assertEqual(change_role_object.old_role, 'old_role')

        cmd_list = [
            story_domain.CMD_CREATE_NEW,
            story_domain.CMD_PUBLISH_STORY,
            story_domain.CMD_UNPUBLISH_STORY
        ]

        for cmd in cmd_list:
            cmd_object = story_domain.StoryRightsChange({
                'cmd': cmd
            })
            self.assertEqual(cmd, cmd_object.cmd)

        with self.assertRaisesRegexp(
            Exception, 'Invalid change_dict: '
            '{\'cmd\': \'invalid_command\'}'):
            story_domain.StoryRightsChange({
                'cmd': 'invalid_command'
            })

    def test_to_dict(self):
        change_role_object = story_domain.StoryRightsChange({
            'cmd': story_domain.CMD_CHANGE_ROLE,
            'assignee_id': 'assignee_id',
            'new_role': 'new_role',
            'old_role': 'old_role'
        })

        expected_dict = {
            'cmd': story_domain.CMD_CHANGE_ROLE,
            'assignee_id': 'assignee_id',
            'new_role': 'new_role',
            'old_role': 'old_role'
        }

        self.assertDictEqual(expected_dict, change_role_object.to_dict())

        cmd_list = [
            story_domain.CMD_CREATE_NEW,
            story_domain.CMD_PUBLISH_STORY,
            story_domain.CMD_UNPUBLISH_STORY
        ]

        for cmd in cmd_list:
            cmd_object = story_domain.StoryRightsChange({
                'cmd': cmd
            })
            expected_dict = {
                'cmd': cmd
            }
            self.assertDictEqual(expected_dict, cmd_object.to_dict())
