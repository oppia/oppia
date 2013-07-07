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

from apps.base_model.models import BaseModel
from apps.exploration.models import Exploration
import apps.exploration.services as exp_services
from apps.image.models import Image
from apps.parameter.models import Parameter
from apps.state.models import State
from apps.widget.models import InteractiveWidget

from google.appengine.ext.db import BadValueError


class ExplorationModelUnitTests(test_utils.AppEngineTestBase):
    """Test the exploration model."""

    def setUp(self):
        """Loads the default widgets."""
        super(ExplorationModelUnitTests, self).setUp()
        InteractiveWidget.load_default_widgets()

    def tearDown(self):
        """Deletes all widgets and explorations."""
        InteractiveWidget.delete_all_widgets()
        explorations = exp_services.get_all_explorations()
        for exploration in explorations:
            exploration.delete()
        super(ExplorationModelUnitTests, self).tearDown()

    def test_exploration_class(self):
        """Test the Exploration class."""
        exploration = Exploration(id='The exploration hash id')

        # A new exploration should have a default title property.
        self.assertEqual(exploration.title, 'New exploration')

        # A new exploration should have a default is_public property.
        self.assertEqual(exploration.is_public, False)

        state = State(id='The state hash id')
        state.put()

        # The 'state_ids' property must be a list.
        with self.assertRaises(BadValueError):
            exploration.state_ids = 'A string'
        exploration.state_ids = []

        # The 'state_ids property must be a non-empty list of strings
        # representing State ids.
        with self.assertRaises(BaseModel.ModelValidationError):
            exploration.state_ids = ['A string']
            exploration.put()
        with self.assertRaises(BadValueError):
            exploration.state_ids = [state]
        exploration.state_ids = [state.id]

        # An Exploration must have a category.
        with self.assertRaises(BaseModel.ModelValidationError):
            exploration.put()
        exploration.category = 'The category'

        # The 'init_state' property should return the first state in the states
        # list.
        self.assertEqual(exploration.init_state.id, state.id)

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

        exploration.editor_ids = []
        # There must be at least one editor id.
        with self.assertRaises(BaseModel.ModelValidationError):
            exploration.put()
        exploration.editor_ids = ['A user id']

        # Put and Retrieve the exploration.
        exploration.put()
        retrieved_exploration = Exploration.get('The exploration hash id')
        self.assertEqual(retrieved_exploration.category, 'The category')
        self.assertEqual(retrieved_exploration.init_state, state)
        self.assertEqual(retrieved_exploration.title, 'New exploration')
        self.assertEqual(len(retrieved_exploration.state_ids), 1)
        self.assertEqual(retrieved_exploration.state_ids[0], state.id)
        self.assertEqual(retrieved_exploration.parameters, [parameter])
        self.assertEqual(retrieved_exploration.is_public, True)
        self.assertEqual(retrieved_exploration.image_id, 'A string')
        self.assertEqual(retrieved_exploration.editor_ids, ['A user id'])

    def test_get_exploration_error_cases(self):
        """Test the error cases for the get() method."""
        with self.assertRaises(Exception):
            Exploration.get('Invalid id')
        with self.assertRaises(Exception):
            Exploration.get('Invalid id', strict=True)

        # The get() should fail silently when strict == False.
        self.assertIsNone(Exploration.get('Invalid id', strict=False))

    def test_is_demo_property(self):
        """Test the is_demo property."""
        demo = Exploration(id='0')
        self.assertEqual(demo.is_demo, True)
        notdemo1 = Exploration(id='a')
        self.assertEqual(notdemo1.is_demo, False)
        notdemo2 = Exploration(id='abcd')
        self.assertEqual(notdemo2.is_demo, False)

    def test_is_owned_by(self):
        """Test the is_owned_by() method."""
        self.owner_id = 'owner@example.com'
        self.editor_id = 'editor@example.com'
        self.viewer_id = 'viewer@example.com'

        exploration = exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id')
        exploration.add_editor(self.editor_id)
        exploration.put()

        self.assertTrue(exploration.is_owned_by(self.owner_id))
        self.assertFalse(exploration.is_owned_by(self.editor_id))
        self.assertFalse(exploration.is_owned_by(self.viewer_id))
        self.assertFalse(exploration.is_owned_by(None))

    def test_is_editable_by(self):
        """Test the is_editable_by() method."""
        self.owner_id = 'owner@example.com'
        self.editor_id = 'editor@example.com'
        self.viewer_id = 'viewer@example.com'

        exploration = exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id')
        exploration.add_editor(self.editor_id)
        exploration.put()

        self.assertTrue(exploration.is_editable_by(self.owner_id))
        self.assertTrue(exploration.is_editable_by(self.editor_id))
        self.assertFalse(exploration.is_editable_by(self.viewer_id))
        self.assertFalse(exploration.is_editable_by(None))
