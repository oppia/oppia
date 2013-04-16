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

from exploration import Exploration
from exploration import Parameter
from state import State
from widget import InteractiveWidget
from image import Image

from google.appengine.ext.db import BadValueError
from google.appengine.api.users import User


class ExplorationModelUnitTests(test_utils.AppEngineTestBase):
    """Test the exploration model."""

    def setUp(self):
        """Loads the default widgets."""
        super(ExplorationModelUnitTests, self).setUp()
        InteractiveWidget.load_default_widgets()
        self.user = User(email='test@example.com')

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
        state = State(id='The state hash id')
        state.put()
        exploration.init_state = state.key

        # The 'states' property must be a list.
        with self.assertRaises(BadValueError):
            exploration.states = 'A string'
        # TODO(emersoj): We should put the initial state in the states list it should not be empty
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
        exploration.editors = []
        with self.assertRaises(BadValueError):
            exploration.editors = ['A string']
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

        # The Exploration class has a 'create' class method.
        exploration2 = Exploration.create(self.user, 'A title', 'A category', 'A exploration_id')
        exploration2.put()

        # The Exploration class has a 'get' class method.
        retrieved_exploration2 = Exploration.get('A exploration_id')
        self.assertEqual(exploration2, retrieved_exploration2)

        # An Exploration has a 'delete' method.
        exploration2.delete()
        with self.assertRaises(Exception):
            retrieved_exploration2 = Exploration.get('A exploration_id')
        # The get() should fail silently when strict == False.
        retrieved_exploration2 = Exploration.get(
            'A exploration_id', strict=False)
        self.assertIsNone(retrieved_exploration2)

        # An Exploration has a 'is_demo_exploration' method.
        demo = Exploration(id='0')
        self.assertEqual(demo.is_demo_exploration(), True)
        notdemo1 = Exploration(id='a')
        self.assertEqual(notdemo1.is_demo_exploration(), False)
        notdemo2 = Exploration(id='abcd')
        self.assertEqual(notdemo2.is_demo_exploration(), False)

    def test_as_yaml_method(self):
        """Test the as_yaml() method."""
        exploration3 = Exploration.create(
            self.user, 'A title', 'A category', 'A different exploration_id')
        self.assertEqual(exploration3.as_yaml(), """Activity 1:
  content: []
  param_changes: []
  widget:
    handlers:
    - name: submit
      rules:
      - dest: Activity 1
        feedback: []
        inputs: {}
        name: Default
        param_changes: []
    params: {}
    sticky: false
    widget_id: Continue
""")

    def test_loading_and_deletion_of_demo_explorations(self):
        """Test loading and deletion of the demo explorations."""
        self.assertEqual(Exploration.query().count(), 0)

        Exploration.load_demo_explorations()
        self.assertEqual(Exploration.query().count(), 6)

        Exploration.delete_demo_explorations()
        self.assertEqual(Exploration.query().count(), 0)
