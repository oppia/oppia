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

from __future__ import annotations

from core import utils
from core.domain import param_domain
from core.tests import test_utils


class ParameterDomainUnitTests(test_utils.GenericTestBase):
    """Tests for parameter domain objects."""

    def test_param_spec_validation(self) -> None:
        """Test validation of param specs."""
        param_spec = param_domain.ParamSpec('FakeType')
        with self.assertRaisesRegex(TypeError, 'is not a valid object class'): # type: ignore[no-untyped-call]
            param_spec.validate()

        param_spec.obj_type = 'Real'
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError, 'is not among the supported object types'
        ):
            param_spec.validate()

        # Restore a valid parameter spec.
        param_spec.obj_type = 'UnicodeString'
        param_spec.validate()

    def test_param_change_validation(self) -> None:
        """Test validation of parameter changes."""
        # Raise an error because the name is invalid.
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError, 'Only parameter names'
        ):
            param_domain.ParamChange('¡hola', 'Copier', {}).validate()

        # Raise an error because generator ID is not string.
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError, 'Expected generator ID to be a string'
        ):
            param_domain.ParamChange('abc', 123, {}).validate() # type: ignore[arg-type]

        # Raise an error because no such generator type exists.
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError, 'Invalid generator ID'
        ):
            param_domain.ParamChange('abc', 'InvalidGenerator', {}).validate()

        # Raise an error because customization_args is not a dict.
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError, 'Expected a dict'
        ):
            param_domain.ParamChange('abc', 'Copier', ['a', 'b']).validate() # type: ignore[arg-type]

        # Raise an error because the param_change name is not a string.
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            utils.ValidationError,
            'Expected param_change name to be a string, received'
        ):
            param_domain.ParamChange(3, 'Copier', {}).validate() # type: ignore[arg-type]

        # Raise an error because the arg names in customization_args are not
        # strings.
        with self.assertRaisesRegex( # type: ignore[no-untyped-call]
            Exception, 'Invalid parameter change customization_arg name:'):
            param_domain.ParamChange('abc', 'Copier', {1: '1'}).validate() # type: ignore

    def test_param_spec_to_dict(self) -> None:
        sample_dict = {
            'obj_type': 'UnicodeString'
        }
        param_spec = param_domain.ParamSpec(sample_dict['obj_type'])
        self.assertEqual(param_spec.to_dict(), sample_dict)

    def test_param_spec_from_dict(self) -> None:
        sample_dict = {
            'obj_type': 'UnicodeString'
        }
        param_spec = param_domain.ParamSpec.from_dict(sample_dict)
        self.assertEqual(param_spec.to_dict(), sample_dict)

    def test_param_change_class(self) -> None:
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
        self.assertEqual(param_change.get_normalized_value('Int', {}), 3) # type: ignore[arg-type]

    def test_param_change_from_dict(self) -> None:
        sample_dict = {
            'name': 'abc',
            'generator_id': 'Copier',
            'customization_args': {'value': '3'}
        }
        param_change = param_domain.ParamChange.from_dict(sample_dict) # type: ignore[arg-type]
        self.assertEqual(param_change.to_dict(), sample_dict)
