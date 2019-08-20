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

import datetime

from constants import constants
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import story_services
from core.tests import test_utils
import feconf
import utils


class StoryChangeTests(test_utils.GenericTestBase):

    def test_story_change_object_with_missing_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'):
            story_domain.StoryChange({'invalid': 'data'})

    def test_story_change_object_with_invalid_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'):
            story_domain.StoryChange({'cmd': 'invalid'})

    def test_story_change_object_with_missing_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_value, old_value')):
            story_domain.StoryChange({
                'cmd': 'update_story_property',
                'property_name': 'title',
            })

    def test_story_change_object_with_extra_attribute_in_cmd(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_id',
                'invalid': 'invalid'
            })

    def test_story_change_object_with_invalid_story_property(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd update_story_property: '
                'invalid is not allowed')):
            story_domain.StoryChange({
                'cmd': 'update_story_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_story_change_object_with_invalid_story_node_property(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd update_story_node_property: '
                'invalid is not allowed')):
            story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'node_id': 'node_id',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_story_change_object_with_invalid_story_contents_property(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Value for property_name in cmd update_story_contents_property:'
                ' invalid is not allowed')):
            story_domain.StoryChange({
                'cmd': 'update_story_contents_property',
                'property_name': 'invalid',
                'old_value': 'old_value',
                'new_value': 'new_value',
            })

    def test_story_change_object_with_add_story_node(self):
        story_change_object = story_domain.StoryChange({
            'cmd': 'add_story_node',
            'node_id': 'node_id',
            'title': 'title'
        })

        self.assertEqual(story_change_object.cmd, 'add_story_node')
        self.assertEqual(story_change_object.node_id, 'node_id')
        self.assertEqual(story_change_object.title, 'title')

    def test_story_change_object_with_delete_story_node(self):
        story_change_object = story_domain.StoryChange({
            'cmd': 'delete_story_node',
            'node_id': 'node_id'
        })

        self.assertEqual(story_change_object.cmd, 'delete_story_node')
        self.assertEqual(story_change_object.node_id, 'node_id')

    def test_story_change_object_with_update_story_node_property(self):
        story_change_object = story_domain.StoryChange({
            'cmd': 'update_story_node_property',
            'node_id': 'node_id',
            'property_name': 'title',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(story_change_object.cmd, 'update_story_node_property')
        self.assertEqual(story_change_object.node_id, 'node_id')
        self.assertEqual(story_change_object.property_name, 'title')
        self.assertEqual(story_change_object.new_value, 'new_value')
        self.assertEqual(story_change_object.old_value, 'old_value')

    def test_story_change_object_with_update_story_property(self):
        story_change_object = story_domain.StoryChange({
            'cmd': 'update_story_property',
            'property_name': 'title',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(story_change_object.cmd, 'update_story_property')
        self.assertEqual(story_change_object.property_name, 'title')
        self.assertEqual(story_change_object.new_value, 'new_value')
        self.assertEqual(story_change_object.old_value, 'old_value')

    def test_story_change_object_with_update_story_contents_property(self):
        story_change_object = story_domain.StoryChange({
            'cmd': 'update_story_contents_property',
            'property_name': 'initial_node_id',
            'new_value': 'new_value',
            'old_value': 'old_value'
        })

        self.assertEqual(
            story_change_object.cmd, 'update_story_contents_property')
        self.assertEqual(story_change_object.property_name, 'initial_node_id')
        self.assertEqual(story_change_object.new_value, 'new_value')
        self.assertEqual(story_change_object.old_value, 'old_value')

    def test_story_change_object_with_update_story_node_outline_status(self):
        story_change_object = story_domain.StoryChange({
            'cmd': 'update_story_node_outline_status',
            'node_id': 'node_id',
            'old_value': 'old_value',
            'new_value': 'new_value'
        })

        self.assertEqual(
            story_change_object.cmd, 'update_story_node_outline_status')
        self.assertEqual(story_change_object.node_id, 'node_id')
        self.assertEqual(story_change_object.old_value, 'old_value')
        self.assertEqual(story_change_object.new_value, 'new_value')

    def test_story_change_object_with_create_new(self):
        story_change_object = story_domain.StoryChange({
            'cmd': 'create_new',
            'title': 'title',
        })

        self.assertEqual(story_change_object.cmd, 'create_new')
        self.assertEqual(story_change_object.title, 'title')

    def test_story_change_object_with_migrate_schema_to_latest_version(
            self):
        story_change_object = story_domain.StoryChange({
            'cmd': 'migrate_schema_to_latest_version',
            'from_version': 'from_version',
            'to_version': 'to_version',
        })

        self.assertEqual(
            story_change_object.cmd, 'migrate_schema_to_latest_version')
        self.assertEqual(story_change_object.from_version, 'from_version')
        self.assertEqual(story_change_object.to_version, 'to_version')

    def test_to_dict(self):
        story_change_dict = {
            'cmd': 'create_new',
            'title': 'title'
        }
        story_change_object = story_domain.StoryChange(story_change_dict)
        self.assertEqual(story_change_object.to_dict(), story_change_dict)


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
        self.TOPIC_ID = utils.generate_random_string(12)
        self.story = self.save_new_story(
            self.STORY_ID, self.USER_ID, 'Title', 'Description', 'Notes',
            self.TOPIC_ID
        )
        self.story.add_node(self.NODE_ID_1, 'Node title')
        self.story.add_node(self.NODE_ID_2, 'Node title')
        self.story.update_node_destination_node_ids(
            self.NODE_ID_1, [self.NODE_ID_2])
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
        story_summary = story_fetchers.get_story_summary_by_id(self.STORY_ID)
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
        topic_id = utils.generate_random_string(12)
        story = story_domain.Story.create_default_story(
            self.STORY_ID, 'Title', topic_id)
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
            'corresponding_topic_id': topic_id,
            'version': 0
        }
        self.assertEqual(story.to_dict(), expected_story_dict)

    def test_get_acquired_skill_ids_for_node_ids(self):
        self.story.story_contents.nodes[0].acquired_skill_ids = ['skill_1']
        self.story.story_contents.nodes[1].acquired_skill_ids = ['skill_2']
        self.assertEqual(
            self.story.get_acquired_skill_ids_for_node_ids(
                [self.NODE_ID_1, self.NODE_ID_2]),
            ['skill_1', 'skill_2']
        )

    def test_get_acquired_skill_ids_for_node_ids_empty(self):
        self.story.story_contents.nodes[0].acquired_skill_ids = []
        self.story.story_contents.nodes[1].acquired_skill_ids = []
        self.assertEqual(
            self.story.get_acquired_skill_ids_for_node_ids(
                [self.NODE_ID_1, self.NODE_ID_2]), []
        )

    def test_get_acquired_skill_ids_for_node_ids_multi_skills(self):
        # Test cases when there are multiple acquired skill ids linked to
        # one node.
        self.story.story_contents.nodes[0].acquired_skill_ids = [
            'skill_1', 'skill_2']
        self.story.story_contents.nodes[1].acquired_skill_ids = [
            'skill_3']
        self.assertEqual(
            self.story.get_acquired_skill_ids_for_node_ids(
                [self.NODE_ID_1, self.NODE_ID_2]),
            ['skill_1', 'skill_2', 'skill_3']
        )

    def test_get_acquired_skill_ids_for_node_ids_overlapping_skills(self):
        # Test cases when there are and multiple nodes have overlapping
        # skill ids.
        self.story.story_contents.nodes[0].acquired_skill_ids = [
            'skill_1', 'skill_2']
        self.story.story_contents.nodes[1].acquired_skill_ids = [
            'skill_1']
        self.assertEqual(
            self.story.get_acquired_skill_ids_for_node_ids(
                [self.NODE_ID_1, self.NODE_ID_2]),
            ['skill_1', 'skill_2']
        )

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

    def test_corresponding_topic_id_validation(self):
        # Generating valid topic id of type str.
        valid_topic_id = utils.generate_random_string(12)
        self.assertTrue(isinstance(valid_topic_id, basestring))
        self.story.corresponding_topic_id = valid_topic_id
        self.story.validate()

        # Setting invalid topic id type.
        invalid_topic_id = 123
        self.story.corresponding_topic_id = invalid_topic_id
        self._assert_validation_error(
            'Expected corresponding_topic_id should be a string, received: %s' %
            (invalid_topic_id))

    def test_add_node_validation(self):
        with self.assertRaisesRegexp(
            Exception, 'The node id node_4 does not match the expected '
            'next node id for the story'):
            self.story.add_node('node_4', 'Title 4')

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

    def test_get_ordered_nodes(self):
        self.story.story_contents.next_node_id = 'node_4'
        node_1 = {
            'id': 'node_1',
            'title': 'Title 1',
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_2 = {
            'id': 'node_2',
            'title': 'Title 2',
            'destination_node_ids': ['node_1'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        node_3 = {
            'id': 'node_3',
            'title': 'Title 3',
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': None
        }
        self.story.story_contents.initial_node_id = 'node_2'
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_3)
        ]
        expected_list = [
            story_domain.StoryNode.from_dict(node_2),
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_3)
        ]

        calculated_list = self.story.story_contents.get_ordered_nodes()
        self.assertEqual(calculated_list[0].id, expected_list[0].id)
        self.assertEqual(calculated_list[1].id, expected_list[1].id)
        self.assertEqual(calculated_list[2].id, expected_list[2].id)

    def test_get_all_linked_exp_ids(self):
        self.story.story_contents.next_node_id = 'node_4'
        node_1 = {
            'id': 'node_1',
            'title': 'Title 1',
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': 'exp_1'
        }
        node_2 = {
            'id': 'node_2',
            'title': 'Title 2',
            'destination_node_ids': ['node_1'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': 'exp_2'
        }
        node_3 = {
            'id': 'node_3',
            'title': 'Title 3',
            'destination_node_ids': [],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': 'exp_3'
        }
        self.story.story_contents.initial_node_id = 'node_2'
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1),
            story_domain.StoryNode.from_dict(node_2),
        ]
        self.assertEqual(
            self.story.story_contents.get_all_linked_exp_ids(),
            ['exp_1', 'exp_2'])
        self.story.story_contents.nodes.append(
            story_domain.StoryNode.from_dict(node_3))
        self.assertEqual(
            self.story.story_contents.get_all_linked_exp_ids(),
            ['exp_1', 'exp_2', 'exp_3'])

    def test_get_node_with_corresponding_exp_id_with_valid_exp_id(self):
        self.story.story_contents.next_node_id = 'node_4'
        node_1 = {
            'id': 'node_1',
            'title': 'Title 1',
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': 'exp_1'
        }
        self.story.story_contents.initial_node_id = 'node_1'
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1)
        ]

        node_with_exp_1 = (
            self.story.story_contents.get_node_with_corresponding_exp_id(
                'exp_1'))

        self.assertEqual(node_with_exp_1.to_dict(), node_1)

    def test_get_node_with_corresponding_exp_id_with_invalid_exp_id(self):
        self.story.story_contents.next_node_id = 'node_4'
        node_1 = {
            'id': 'node_1',
            'title': 'Title 1',
            'destination_node_ids': ['node_3'],
            'acquired_skill_ids': [],
            'prerequisite_skill_ids': [],
            'outline': '',
            'outline_is_finalized': False,
            'exploration_id': 'exp_1'
        }
        self.story.story_contents.initial_node_id = 'node_1'
        self.story.story_contents.nodes = [
            story_domain.StoryNode.from_dict(node_1)
        ]
        with self.assertRaisesRegexp(
            Exception,
            'Unable to find the exploration id in any node: invalid_id'):
            self.story.story_contents.get_node_with_corresponding_exp_id(
                'invalid_id')

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

    def test_validate_non_str_exploration_id(self):
        self.story.story_contents.nodes[0].exploration_id = 1
        self._assert_validation_error(
            'Expected exploration ID to be a string')

    def test_validate_non_str_outline(self):
        self.story.story_contents.nodes[0].outline = 0
        self._assert_validation_error(
            'Expected outline to be a string')

    def test_validate_non_list_destination_node_ids(self):
        self.story.story_contents.nodes[0].destination_node_ids = 0
        self._assert_validation_error(
            'Expected destination node ids to be a list')

    def test_validate_node_id(self):
        self.story.story_contents.nodes[0].destination_node_ids = [
            self.NODE_ID_1]
        self._assert_validation_error(
            'The story node with ID %s points to itself.' % self.NODE_ID_1)

    def test_validate_non_str_node_id(self):
        self.story.story_contents.nodes[0].destination_node_ids = [0]
        self._assert_validation_error('Expected node ID to be a string')

    def test_validate_out_of_bounds_node_id(self):
        self.story.story_contents.nodes[0].id = 'node_3'
        self._assert_validation_error(
            'The node with id node_3 is out of bounds.')

    def test_get_node_index_with_invalid_node_id(self):
        self.assertIsNone(
            self.story.story_contents.get_node_index('invalid_node_id'))

    def test_validate_empty_title(self):
        self.story.title = ''
        self._assert_validation_error('Title field should not be empty')

    def test_story_summary_creation(self):
        curr_time = datetime.datetime.utcnow()
        story_summary = story_domain.StorySummary(
            'story_id', 'title', 'description', 'en', 1, 1, curr_time,
            curr_time)

        expected_dict = {
            'id': 'story_id',
            'title': 'title',
            'description': 'description',
            'language_code': 'en',
            'version': 1,
            'node_count': 1,
            'story_model_created_on': utils.get_time_in_millisecs(curr_time),
            'story_model_last_updated': utils.get_time_in_millisecs(curr_time),
        }

        self.assertEqual(story_summary.to_dict(), expected_dict)


class StorySummaryTests(test_utils.GenericTestBase):

    def setUp(self):
        super(StorySummaryTests, self).setUp()
        current_time = datetime.datetime.utcnow()
        time_in_millisecs = utils.get_time_in_millisecs(current_time)
        self.story_summary_dict = {
            'story_model_created_on': time_in_millisecs,
            'version': 1,
            'story_model_last_updated': time_in_millisecs,
            'description': 'description',
            'title': 'title',
            'node_count': 10,
            'language_code': 'en',
            'id': 'story_id'
        }

        self.story_summary = story_domain.StorySummary(
            'story_id', 'title', 'description', 'en', 1, 10,
            current_time, current_time)

    def test_story_summary_gets_created(self):
        self.assertEqual(
            self.story_summary.to_dict(), self.story_summary_dict)

    def test_validation_passes_with_valid_properties(self):
        self.story_summary.validate()

    def test_validation_fails_with_invalid_title(self):
        self.story_summary.title = 0
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected title to be a string, received 0'):
            self.story_summary.validate()

    def test_validation_fails_with_empty_title(self):
        self.story_summary.title = ''
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Title field should not be empty'):
            self.story_summary.validate()

    def test_validation_fails_with_invalid_description(self):
        self.story_summary.description = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected description to be a string, received 0'):
            self.story_summary.validate()

    def test_validation_fails_with_invalid_node_count(self):
        self.story_summary.node_count = '10'
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected node_count to be an int, received \'10\''):
            self.story_summary.validate()

    def test_validation_fails_with_negative_node_count(self):
        self.story_summary.node_count = -1
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'Expected node_count to be non-negative, '
                'received \'-1\'')):
            self.story_summary.validate()

    def test_validation_fails_with_invalid_language_code(self):
        self.story_summary.language_code = 0
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected language code to be a string, received 0'):
            self.story_summary.validate()

    def test_validation_fails_with_unallowed_language_code(self):
        self.story_summary.language_code = 'invalid'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid language code: invalid'):
            self.story_summary.validate()
