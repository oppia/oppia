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

import core.storage.parameter.models as param_models
from django.utils import unittest


class ParameterUnitTests(unittest.TestCase):
    """Test the Parameter class."""

    def test_parameter_class(self):
        """Tests the Parameter class."""
        # Raise an error because no obj_type is specified.
        with self.assertRaises(TypeError):
            model = param_models.Parameter(name='param1', values=['hello'])

        # Raise an error because the value does not match the obj_type.
        with self.assertRaises(TypeError):
            model = param_models.Parameter(name='param1', obj_type='Int', values=['hello'])
            model.put()

        model = param_models.Parameter(name='param1', obj_type='Int', values=[6])
        model.put()

        self.assertEqual(model.value, 6)

        model.values = []
        model.put()
        self.assertIsNone(model.value)


class ParamSetUnitTests(unittest.TestCase):
    """Test the ParamSet class."""

    def test_paramset_class(self):
        """Test the ParamSet class."""

        param1 = param_models.Parameter(name='param1', obj_type='Int', values=[6])
        param2 = param_models.Parameter(name='param2', obj_type='Int', values=[8])

        params = [param1, param2]
        paramset = param_models.ParamSet(params=params)
        paramset.put()

        assert isinstance(paramset.params, list)

        self.assertEqual(len(paramset.params), 2)
        for param in paramset.params:
            assert isinstance(param, param_models.Parameter)
