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


class ParamSpecUnitTests(test_utils.GenericTestBase):
    """Tests for parameter domain objects."""

    def test_to_dict(self):
        # Unit test to test to_dict function.
        initial_vals = {
            'obj_type': 'UnicodeString',
        }
        param_spec_obj = param_domain.ParamSpec('UnicodeString')
        self.assertDictEqual(
            initial_vals,
            param_spec_obj.to_dict())

    def test_from_dict(self):
        # Unit test to test from_dict function.
        initial_vals = {
            'obj_type': 'UnicodeString',
        }
        param_spec_obj = param_domain.ParamSpec('UnicodeString')
        obj_from_dict = param_spec_obj.from_dict(initial_vals)
        self.assertDictEqual(
            param_spec_obj.to_dict(),
            obj_from_dict.to_dict())

    def test_param_spec_validation(self):
        # Unit test to test validate function in ParamSpec class.
        """Test validation of param specs."""
        param_spec = param_domain.ParamSpec('FakeType')
        with self.assertRaisesRegexp(TypeError, 'is not a valid object class'):
            param_spec.validate()

        param_spec.obj_type = 'Real'
        with self.assertRaisesRegexp(
            utils.ValidationError, 'is not among the supported object types'
            ):
            param_spec.validate()

        # Restore a valid parameter spec.
        param_spec.obj_type = 'UnicodeString'
        param_spec.validate()


class ParamChangeUnitTests(test_utils.GenericTestBase):

    def test_to_dict(self):
        # Unit test to test to_dict function.
        initial_vals = {
            'name': 'abc',
            'generator_id': 'Copier',
            'customization_args': {'value': '3'}
        }
        param_change_obj = param_domain.ParamChange(
            'abc', 'Copier', {'value': '3'})
        self.assertDictEqual(
            initial_vals,
            param_change_obj.to_dict())

    def test_from_dict(self):
        # Unit test to test from_dict function.
        initial_vals = {
            'name': 'abc',
            'generator_id': 'Copier',
            'customization_args': {'value': '3'}
        }
        param_change_obj = param_domain.ParamChange(
            'abc', 'Copier', {'value': '3'})
        obj_from_dict = param_change_obj.from_dict(initial_vals)
        self.assertDictEqual(
            param_change_obj.to_dict(),
            obj_from_dict.to_dict())

    def test_validation_error_raised_param_change_name_not_a_string(
            self):
        # Raise an error because the name is not a string.
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected param_change name to be a string'
            ):
            param_domain.ParamChange(1, 'Copier', {}).validate()

    def test_validation_error_raised_invalid_name(self):
        # Raise an error because the name is invalid.
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Only parameter names with characters'
            ):
            param_domain.ParamChange('¡hola', 'Copier', {}).validate()

    def test_validation_error_invalid_generator_id(self):
        # Raise an error because no such generator type exists.
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid generator id'
            ):
            param_domain.ParamChange('abc', 'InvalidGenerator', {}).validate()

    def test_validation_error_customization_args_not_a_dict(self):
        # Raise an error because customization_args is not a dict.
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected a dict'
            ):
            param_domain.ParamChange('abc', 'Copier', ['a', 'b']).validate()

    def test_validation_error_customization_arg_name_not_a_string(self):
        # Raise an error because the customization_arg name is not a string.
        with self.assertRaisesRegexp(
            Exception, 'Invalid parameter change customization_arg name'
            ):
            param_domain.ParamChange('abc', 'Copier', {True: '3'}).validate()


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
