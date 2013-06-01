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

__author__ = 'Jeremy Emerson'

import test_utils

from apps.exploration.models import Exploration
from apps.image.models import Image
from apps.parameter.models import Parameter
from apps.parameter.models import ParamSet
from apps.state.models import State
from apps.widget.models import InteractiveWidget

from google.appengine.ext.db import BadValueError
from google.appengine.api.users import User


class ExplorationModelUnitTests(test_utils.AppEngineTestBase):
    """Test the exploration model."""

    def setUp(self):
        """Loads the default widgets."""
        super(ExplorationModelUnitTests, self).setUp()
        InteractiveWidget.load_default_widgets()
        self.user = User(email='test@example.com')
        self.another_user = User(email='another@user.com')

    def test_exploration_class(self):
        """Test the Exploration class."""
        exploration = Exploration(id='The exploration hash id')

        # A new exploration should have a default title property.
        self.assertEqual(exploration.title, 'New exploration')

        # A new exploration should have a default is_public property.
        self.assertEqual(exploration.is_public, False)

        # An Exploration must have properties 'category' and 'init_state' set.
        with self.assertRaises(BadValueError):
            exploration.put()
        exploration.category = 'The category'
        with self.assertRaises(BadValueError):
            exploration.put()

        # The 'init_state' property must be a valid State.
        with self.assertRaises(BadValueError):
            exploration.init_state = 'The State'
        state = State(id='The state hash id', parent=exploration.key)
        state.put()
        exploration.init_state = state.key

        # The 'states' property must be a list.
        with self.assertRaises(BadValueError):
            exploration.states = 'A string'
        # TODO(emersoj): We should put the initial state in the states list. It
        # should not be empty
        exploration.states = []

        # The 'states property must be a list of State keys.
        with self.assertRaises(BadValueError):
            exploration.states = ['A string']
        with self.assertRaises(BadValueError):
            exploration.states = [state]
        exploration.states = [state.key]

        # The 'parameters' property must be a list of Parameter objects.
        with self.assertRaises(BadValueError):
            exploration.parameters = 'A string'
        exploration.parameters = []
        parameter = Parameter(name='theParameter', obj_type='Int')
        with self.assertRaises(BadValueError):
            exploration.parameters = [parameter.key]
        exploration.parameters = [parameter]

        # The 'is_public' property must be a boolean.
        with self.assertRaises(BadValueError):
            exploration.is_public = 'true'
        exploration.is_public = True

        # The 'image_id' property must be a string.
        image = Image(id='The image')
        with self.assertRaises(BadValueError):
            exploration.image_id = image
        with self.assertRaises(BadValueError):
            exploration.image_id = image.key
        exploration.image_id = 'A string'

        # The 'editors' property must be a list of User objects.
        with self.assertRaises(BadValueError):
            exploration.editors = 'A string'
        with self.assertRaises(BadValueError):
            exploration.editors = ['A string']
        exploration.editors = []
        # There must be at least one editor.
        with self.assertRaises(BadValueError):
            exploration.put()
        exploration.editors = [self.user]

        # Put and Retrieve the exploration.
        exploration.put()
        retrieved_exploration = Exploration.get_by_id('The exploration hash id')
        self.assertEqual(retrieved_exploration.category, 'The category')
        self.assertEqual(retrieved_exploration.init_state, state.key)
        self.assertEqual(retrieved_exploration.title, 'New exploration')
        self.assertEqual(retrieved_exploration.states, [state.key])
        self.assertEqual(retrieved_exploration.parameters, [parameter])
        self.assertEqual(retrieved_exploration.is_public, True)
        self.assertEqual(retrieved_exploration.image_id, 'A string')
        self.assertEqual(retrieved_exploration.editors, [self.user])

    def test_create_get_and_delete_exploration(self):
        """Test the create(), get() and delete() methods."""
        exploration = Exploration.create(
            self.user, 'A title', 'A category', 'A exploration_id')
        exploration.put()

        retrieved_exploration = Exploration.get('A exploration_id')
        self.assertEqual(exploration, retrieved_exploration)

        exploration.delete()
        with self.assertRaises(Exception):
            retrieved_exploration = Exploration.get('A exploration_id')

    def test_get_exploration_error_cases(self):
        """Test the error cases for the get() method."""
        with self.assertRaises(Exception):
            Exploration.get('Invalid id')
        with self.assertRaises(Exception):
            Exploration.get('Invalid id', strict=True)

        # The get() should fail silently when strict == False.
        self.assertIsNone(Exploration.get('Invalid id', strict=False))

    def test_editor_permissions(self):
        """Test permissions."""
        exploration = Exploration.create(self.user, 'Title', 'Category', 'eid')
        exploration.put()
        self.assertTrue(exploration.is_editable_by(self.user))
        self.assertFalse(exploration.is_editable_by(self.another_user))

        self.assertItemsEqual(
            Exploration.get_viewable_explorations(self.user), [exploration])
        self.assertItemsEqual(
            Exploration.get_viewable_explorations(self.another_user), [])

    def test_state_operations(self):
        """Test adding, renaming and checking existence of states."""
        exploration = Exploration.create(self.user, 'Title', 'Category', 'eid')
        exploration.put()

        self.assertEqual(len(exploration.states), 1)

        default_state = exploration.states[0].get()
        default_state_name = default_state.name
        exploration.rename_state(default_state, 'Renamed state')

        self.assertEqual(len(exploration.states), 1)
        self.assertEqual(default_state.name, 'Renamed state')

        # Add a new state.
        second_state = exploration.add_state('State 2')
        self.assertEqual(len(exploration.states), 2)

        # It is OK to rename a state to itself.
        exploration.rename_state(second_state, second_state.name)
        self.assertEqual(second_state.name, 'State 2')

        # But it is not OK to add or rename a state using a name that already
        # exists.
        with self.assertRaises(Exception):
            exploration.add_state('State 2')
        with self.assertRaises(Exception):
            exploration.rename_state(second_state, 'Renamed state')

        # The exploration now has exactly two states.
        self.assertFalse(exploration._has_state_named(default_state_name))
        self.assertTrue(exploration._has_state_named('Renamed state'))
        self.assertTrue(exploration._has_state_named('State 2'))

    def test_yaml_methods(self):
        """Test the as_yaml() and create_from_yaml() methods."""
        exploration = Exploration.create(
            self.user, 'A title', 'A category', 'A different exploration_id')
        exploration.add_state('New state')
        yaml_file = exploration.as_yaml()
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

        exploration2 = Exploration.create_from_yaml(
            yaml_file, self.user, 'Title', 'Category')
        self.assertEqual(len(exploration2.states), 2)
        self.assertEqual(exploration2.as_yaml(), yaml_file)

        self.assertEqual(Exploration.query().count(), 2)

        with self.assertRaises(Exception):
            Exploration.create_from_yaml(
                'No_initial_state_name', self.user, 'Title', 'category')

        with self.assertRaises(Exception):
            Exploration.create_from_yaml(
                'Invalid\ninit_state_name:\nMore stuff',
                self.user, 'Title', 'category')

        with self.assertRaises(Exception):
            Exploration.create_from_yaml(
                'State1:\n(\nInvalid yaml', self.user, 'Title', 'category')

        # Check that no new exploration was created.
        self.assertEqual(Exploration.query().count(), 2)

    def test_is_demo_exploration_method(self):
        """Test the is_demo_exploration() method."""
        demo = Exploration(id='0')
        self.assertEqual(demo.is_demo_exploration(), True)
        notdemo1 = Exploration(id='a')
        self.assertEqual(notdemo1.is_demo_exploration(), False)
        notdemo2 = Exploration(id='abcd')
        self.assertEqual(notdemo2.is_demo_exploration(), False)

    def test_loading_and_deletion_of_demo_explorations(self):
        """Test loading and deletion of the demo explorations."""
        self.assertEqual(Exploration.query().count(), 0)

        Exploration.load_demo_explorations()
        self.assertEqual(Exploration.query().count(), 7)

        Exploration.delete_demo_explorations()
        self.assertEqual(Exploration.query().count(), 0)

    def test_dataset_operations(self):
        """Test adding, deleting and adding values to a dataset."""
        exploration = Exploration.create(self.user, 'Title', 'Category', 'eid')
        exploration.put()

        self.assertEqual(len(exploration.datasets), 0)

        exploration.add_dataset('Dataset 1', ['Name', 'Number'])
        self.assertEqual(len(exploration.datasets), 1)
        self.assertEqual(exploration.datasets[0].name, 'Dataset 1')
        self.assertIsNone(exploration.datasets[0].get_random_param_set())

        # The same dataset name cannot be used more than once.
        with self.assertRaises(Exception):
            exploration.add_dataset('Dataset 1', ['Name', 'Number'])

        # Parameter names cannot be repeated across datasets.
        with self.assertRaises(Exception):
            exploration.add_dataset('Dataset 2', ['Name'])

        # It is not possible to add data to a non-existent dataset.
        with self.assertRaises(Exception):
            exploration.add_data_to_dataset('Fake dataset', [])

        exploration.add_data_to_dataset('Dataset 1', [])
        self.assertIsNone(exploration.datasets[0].get_random_param_set())

        # Parameter set keys must match the dataset schema.
        with self.assertRaises(Exception):
            exploration.add_data_to_dataset('Dataset 1', [{'Fake Key': 'John'}])
        with self.assertRaises(KeyError):
            exploration.add_data_to_dataset('Dataset 1', [{'Name': 'John'}])

        exploration.add_data_to_dataset(
            'Dataset 1', [{'Name': 'John', 'Number': '123'}])
        param_set = exploration.datasets[0].get_random_param_set()
        self.assertEqual(len(param_set.params), 2)
        self.assertEqual(param_set.params[0].name, 'Name')
        self.assertEqual(param_set.params[0].obj_type, 'UnicodeString')
        self.assertEqual(param_set.params[0].values[0], 'John')
        self.assertEqual(param_set.params[1].name, 'Number')
        self.assertEqual(param_set.params[1].obj_type, 'UnicodeString')
        self.assertEqual(param_set.params[1].values[0], '123')

        param_set_key = param_set.key
        self.assertTrue(ParamSet.get_by_id(param_set_key.id()))

        with self.assertRaises(Exception):
            exploration.delete_dataset('Fake dataset')

        exploration.add_dataset('Dataset 2', ['Address', 'Zip code'])
        self.assertEqual(len(exploration.datasets), 2)

        exploration.delete_dataset('Dataset 1')
        self.assertEqual(len(exploration.datasets), 1)
        self.assertIsNone(ParamSet.get_by_id(param_set_key.id()))
