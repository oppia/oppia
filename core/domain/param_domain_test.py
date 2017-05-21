# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

from core.domain import param_domain
from core.tests import test_utils
import utils


class ParameterDomainUnitTests(test_utils.GenericTestBase):
    """Tests for parameter domain objects."""

    def test_param_spec_validation(self):
        """Test validation of param specs."""
        param_spec = param_domain.ParamSpec('FakeType')
        with self.assertRaisesRegexp(
            TypeError, '\'FakeType\' is not a valid object class.'
            ):
            param_spec.validate()

        param_spec.obj_type = 'Real'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Only \'UnicodeString\' is the '
            'supported object type for parameters, not: Real'
            ):
            param_spec.validate()

        # Restore a valid parameter spec.
        param_spec.obj_type = 'UnicodeString'
        param_spec.validate()

    def test_param_change_validation(self):
        """Test validation of parameter changes."""
        # Raise an error because the name is invalid.
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Only parameter names'
            ):
            param_domain.ParamChange('¡hola', 'Copier', {}).validate()

        # Raise an error because no such generator type exists.
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid generator id'
            ):
            param_domain.ParamChange('abc', 'InvalidGenerator', {}).validate()

        # Raise an error because customization_args is not a dict.
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected a dict'
            ):
            param_domain.ParamChange('abc', 'Copier', ['a', 'b']).validate()

    def test_param_change_class(self):
        """Test the ParamChange class."""
        param_change = param_domain.ParamChange(
            'abc', 'Copier', {'value': '3'})
        self.assertEqual(param_change.name, 'abc')
        self.assertEqual(param_change.generator.id, 'Copier')
        self.assertEqual(param_change.to_dict(), {
            'name': 'abc',
            'generator_id': 'Copier',
            'customization_args': {'value': '3'}
        })
        self.assertEqual(param_change.get_normalized_value('Int', {}), 3)
