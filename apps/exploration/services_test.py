# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

import test_utils

from apps.base_model.models import BaseModel
import apps.exploration.services as exp_services
from apps.widget.models import InteractiveWidget

from google.appengine.api.users import User


class ExplorationServicesUnitTests(test_utils.AppEngineTestBase):
    """Test the exploration services module."""

    def setUp(self):
        """Loads the default widgets and creates dummy users."""
        super(ExplorationServicesUnitTests, self).setUp()
        InteractiveWidget.load_default_widgets()

        # TODO(sll): Pull user creation and deletion out into its own model.
        self.owner = User(email='owner@example.com')
        self.editor = User(email='editor@example.com')
        self.viewer = User(email='viewer@example.com')

    def tearDown(self):
        """Deletes the dummy users and any other widgets and explorations."""
        # TODO(sll): Add deletion of all users.
        InteractiveWidget.delete_all_widgets()
        explorations = exp_services.get_all_explorations()
        for exploration in explorations:
            exploration.delete()


class ExplorationQueriesUnitTests(ExplorationServicesUnitTests):
    """Tests query methods."""

    def test_get_exploration_by_id(self):
        """Test get_exploration_by_id()."""

        EXP_ID = 'A exploration_id'
        exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', EXP_ID)

        self.assertEqual(
            exp_services.get_exploration_by_id(EXP_ID), exploration)
        self.assertIsNone(
            exp_services.get_exploration_by_id('FAKE_ID', strict=False))
        with self.assertRaises(BaseModel.EntityNotFoundError):
            exp_services.get_exploration_by_id('FAKE_ID')

    def test_get_all_explorations(self):
        """Test get_all_explorations()."""

        exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', 'A exploration_id')
        self.assertItemsEqual(
            exp_services.get_all_explorations(), [exploration])

        exploration2 = exp_services.create_new(
            self.owner, 'A new title', 'A category', 'A new exploration_id')
        self.assertItemsEqual(
            exp_services.get_all_explorations(), [exploration, exploration2])

    def test_get_public_explorations(self):
        exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', 'A exploration_id')
        self.assertItemsEqual(
            exp_services.get_public_explorations(), [])

        exploration.is_public = True
        exploration.put()
        self.assertItemsEqual(
            exp_services.get_public_explorations(), [exploration])

    def test_get_viewable_explorations(self):
        exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', 'A exploration_id')
        exploration.add_editor(self.editor)
        exploration.put()

        self.assertItemsEqual(
            exp_services.get_viewable_explorations(self.owner), [exploration])
        self.assertItemsEqual(
            exp_services.get_viewable_explorations(self.viewer), [])
        self.assertItemsEqual(
            exp_services.get_viewable_explorations(None), [])

        # Set the exploration's status to published.
        exploration.is_public = True
        exploration.put()

        self.assertItemsEqual(
            exp_services.get_viewable_explorations(self.owner), [exploration])
        self.assertItemsEqual(
            exp_services.get_viewable_explorations(self.viewer), [exploration])
        self.assertItemsEqual(
            exp_services.get_viewable_explorations(None), [exploration])

    def test_get_editable_explorations(self):
        exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', 'A exploration_id')
        exploration.add_editor(self.editor)
        exploration.put()

        self.assertItemsEqual(
            exp_services.get_editable_explorations(self.owner), [exploration])
        self.assertItemsEqual(
            exp_services.get_editable_explorations(self.viewer), [])
        self.assertItemsEqual(
            exp_services.get_editable_explorations(None), [])

        # Set the exploration's status to published.
        exploration.is_public = True
        exploration.put()

        self.assertItemsEqual(
            exp_services.get_editable_explorations(self.owner), [exploration])
        self.assertItemsEqual(
            exp_services.get_editable_explorations(self.viewer), [])
        self.assertItemsEqual(
            exp_services.get_editable_explorations(None), [])

    def test_count_explorations(self):
        """Test count_explorations()."""

        self.assertEqual(exp_services.count_explorations(), 0)

        exp_services.create_new(
            self.owner, 'A title', 'A category', 'A exploration_id')
        self.assertEqual(exp_services.count_explorations(), 1)

        exp_services.create_new(
            self.owner, 'A new title', 'A category', 'A new exploration_id')
        self.assertEqual(exp_services.count_explorations(), 2)


class ExplorationCreateAndDeleteUnitTests(ExplorationServicesUnitTests):
    """Test creation and deletion methods."""

    def test_create_from_yaml(self):
        """Test the create_from_yaml() method."""
        exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', 'A different exploration_id')
        exploration.add_state('New state')
        yaml_file = exp_services.export_to_yaml(exploration.id)

        exploration2 = exp_services.create_from_yaml(
            yaml_file, self.owner, 'Title', 'Category')
        self.assertEqual(len(exploration2.state_ids), 2)
        yaml_file_2 = exp_services.export_to_yaml(exploration2.id)
        self.assertEqual(yaml_file_2, yaml_file)

        self.assertEqual(exp_services.count_explorations(), 2)

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'No_initial_state_name', self.owner, 'Title', 'category')

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'Invalid\ninit_state_name:\nMore stuff',
                self.owner, 'Title', 'category')

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'State1:\n(\nInvalid yaml', self.owner, 'Title', 'category')

        # Check that no new exploration was created.
        self.assertEqual(exp_services.count_explorations(), 2)

    def test_creation_and_deletion_of_individual_explorations(self):
        """Test the create_new() and delete() methods."""
        exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', 'A exploration_id')
        exploration.put()

        retrieved_exploration = exp_services.get_exploration_by_id(
            'A exploration_id')
        self.assertEqual(exploration, retrieved_exploration)

        exploration.delete()
        with self.assertRaises(Exception):
            retrieved_exploration = exp_services.get_exploration_by_id(
                'A exploration_id')

    def test_loading_and_deletion_of_demo_explorations(self):
        """Test loading and deletion of the demo explorations."""
        self.assertEqual(exp_services.count_explorations(), 0)

        exp_services.load_demos()
        self.assertEqual(exp_services.count_explorations(), 7)

        exp_services.delete_demos()
        self.assertEqual(exp_services.count_explorations(), 0)

    def test_export_to_yaml(self):
        """Test the export_to_yaml() method."""
        exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', 'A different exploration_id')
        exploration.add_state('New state')
        yaml_file = exp_services.export_to_yaml(exploration.id)
        self.assertEqual(yaml_file, """parameters: []
states:
- content: []
  name: '[untitled state]'
  param_changes: []
  widget:
    handlers:
    - name: submit
      rules:
      - dest: '[untitled state]'
        feedback: []
        inputs: {}
        name: Default
        param_changes: []
    params: {}
    sticky: false
    widget_id: interactive-Continue
- content: []
  name: New state
  param_changes: []
  widget:
    handlers:
    - name: submit
      rules:
      - dest: New state
        feedback: []
        inputs: {}
        name: Default
        param_changes: []
    params: {}
    sticky: false
    widget_id: interactive-Continue
""")


class ExplorationStateUnitTests(ExplorationServicesUnitTests):
    """Test methods operating on states."""

    def test_state_operations(self):
        """Test adding, renaming and checking existence of states."""
        exploration = exp_services.create_new(
            self.owner, 'Title', 'Category', 'eid')
        exploration.put()

        self.assertEqual(len(exploration.state_ids), 1)

        default_state = exp_services.get_state_by_id(
            exploration.id, exploration.state_ids[0])
        default_state_name = default_state.name
        exp_services.rename_state(
            exploration.id, default_state, 'Renamed state')

        self.assertEqual(len(exploration.state_ids), 1)
        self.assertEqual(default_state.name, 'Renamed state')

        # Add a new state.
        second_state = exploration.add_state('State 2')
        self.assertEqual(len(exploration.state_ids), 2)

        # It is OK to rename a state to itself.
        exp_services.rename_state(
            exploration.id, second_state, second_state.name)
        self.assertEqual(second_state.name, 'State 2')

        # But it is not OK to add or rename a state using a name that already
        # exists.
        with self.assertRaises(Exception):
            exploration.add_state('State 2')
        with self.assertRaises(Exception):
            exp_services.rename_state(
                exploration.id, second_state, 'Renamed state')

        # The exploration now has exactly two states.
        self.assertFalse(exploration._has_state_named(default_state_name))
        self.assertTrue(exploration._has_state_named('Renamed state'))
        self.assertTrue(exploration._has_state_named('State 2'))
