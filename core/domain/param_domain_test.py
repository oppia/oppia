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
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for parameter domain objects."""

__author__ = 'Sean Lip'

from core.domain import param_domain
import test_utils


class ParameterDomainUnitTests(test_utils.GenericTestBase):
    """Tests for parameter domain objects."""

    def test_parameter_object(self):
        """Test the parameter domain object class."""
        # Raise an error because no obj_type is specified.
        with self.assertRaises(ValueError):
            param_domain.Parameter('param1', None, ['hello'])

        # Raise an error because the value does not match the obj_type.
        with self.assertRaises(TypeError):
            param_domain.Parameter('param1', 'Int', ['hello'])

        param = param_domain.Parameter('param1', 'Int', [6])
        self.assertEqual(param.value, 6)

        param.values = []
        self.assertIsNone(param.value)
