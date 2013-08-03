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

from oppia.domain import exp_services
from oppia.platform import models
(exp_models, image_models, param_models, state_models) = (
    models.Registry.import_models([
        models.NAMES.exploration, models.NAMES.image,
        models.NAMES.parameter, models.NAMES.state,
    ])
)
import test_utils

from google.appengine.ext.db import BadValueError


class ExplorationModelUnitTests(test_utils.AppEngineTestBase):
    """Test the exploration model."""

    def test_exploration_class(self):
        """Test the Exploration model class."""
        exploration = exp_models.ExplorationModel(id='The exploration hash id')

        # A new exploration should have a default title property.
        self.assertEqual(exploration.title, 'New exploration')

        # A new exploration should have a default is_public property.
        self.assertEqual(exploration.is_public, False)

        state = state_models.State(id='The state hash id')
        state.put()

        # The 'state_ids' property must be a list of strings.
        with self.assertRaises(BadValueError):
            exploration.state_ids = 'A string'
            exploration.put()
        with self.assertRaises(BadValueError):
            exploration.state_ids = [state]
        exploration.state_ids = [state.id]

        # An Exploration must have a category.
        with self.assertRaises(BadValueError):
            exploration.put()
        exploration.category = 'The category'

        # The 'parameters' property must be a list of Parameter objects.
        with self.assertRaises(BadValueError):
            exploration.parameters = 'A string'
        exploration.parameters = []
        parameter = param_models.Parameter(name='theParameter', obj_type='Int')
        with self.assertRaises(BadValueError):
            exploration.parameters = [parameter.key]
        exploration.parameters = [parameter]

        # The 'is_public' property must be a boolean.
        with self.assertRaises(BadValueError):
            exploration.is_public = 'true'
        exploration.is_public = True

        # The 'image_id' property must be a string.
        image = image_models.Image(id='The image')
        with self.assertRaises(BadValueError):
            exploration.image_id = image
        with self.assertRaises(BadValueError):
            exploration.image_id = image.key
        exploration.image_id = 'A string'

        exploration.editor_ids = ['A user id']

        # Put and retrieve the exploration.
        exploration.put()

        retrieved_exploration = exp_services.get_exploration_by_id(
            'The exploration hash id')
        self.assertEqual(retrieved_exploration.category, 'The category')
        self.assertEqual(retrieved_exploration.title, 'New exploration')
        self.assertEqual(retrieved_exploration.state_ids, [state.id])
        self.assertEqual(retrieved_exploration.parameters, [parameter])
        self.assertEqual(retrieved_exploration.is_public, True)
        self.assertEqual(retrieved_exploration.image_id, 'A string')
        self.assertEqual(retrieved_exploration.editor_ids, ['A user id'])
