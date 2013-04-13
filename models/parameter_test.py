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

"""Tests for parameter models."""

__author__ = 'Sean Lip'

import test_utils
import parameter

from data.objects.models import objects
from google.appengine.ext import ndb


class ParameterUnitTests(test_utils.AppEngineTestBase):
    """Test the Parameter class."""

    def test_parameter_class(self):
        """Tests the Parameter class."""
        model = parameter.Parameter(name='param1', value='hello')
        # Raise an error because no obj_type is specified.
        with self.assertRaises(TypeError):
            model.put()

        model.obj_type = 'Int'
        # Raise an error because the value does not match the obj_type.
        with self.assertRaises(TypeError):
            model.put()

        model.value = 6
        model.put()


class MultiParameterUnitTests(test_utils.AppEngineTestBase):
    """Test the MultiParameter class."""

    def test_multi_parameter_class(self):
        """Tests the MultiParameter class."""
        model = parameter.MultiParameter(name='param1', values=['hello'])
        # Raise an error because no obj_type is specified.
        with self.assertRaises(TypeError):
            model.put()

        model.obj_type = 'Int'
        # Raise an error because the value does not match the obj_type.
        with self.assertRaises(TypeError):
            model.put()

        model.values = [6]
        model.put()
