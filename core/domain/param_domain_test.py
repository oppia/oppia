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

    def test_param_change_class(self):
        """Test the ParamChange class."""
        # Raise an error because the name is invalid.
        with self.assertRaisesRegexp(ValueError, 'Only parameter names'):
            param_domain.ParamChange('¡hola', 'Copier', {})

        # Raise an error because no such generator type exists.
        with self.assertRaisesRegexp(ValueError, 'Invalid generator id'):
            param_domain.ParamChange('abc', 'InvalidGenerator', {})

        # Raise an error because the given generator requires initialization
        # args.
        with self.assertRaisesRegexp(ValueError, 'require any initialization'):
            param_domain.ParamChange('abc', 'RestrictedCopier', {})

        # Raise an error because customization_args is not a dict.
        with self.assertRaisesRegexp(ValueError, 'Expected a dict'):
            param_domain.ParamChange('abc', 'Copier', ['a', 'b'])

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
