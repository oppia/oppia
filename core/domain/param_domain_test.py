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

from core import utils
from core.domain import param_domain
from core.tests import test_utils

from __future__ import annotations

class ParameterDomainUnitTests(test_utils.GenericTestBase):
    """Tests for parameter domain objects."""

    def test_param_spec_validation(self) -> None:
        """Test validation of param specs."""
        param_spec = param_domain.ParamSpec('FakeType')
        # TODO(#xx2): Remove the type ignore[no-untyped-call] when file test_utils is fully type-annotated. 
        with self.assertRaisesRegexp(TypeError, 'is not a valid object class'): # type: ignore[no-untyped-call]
            param_spec.validate()

        param_spec.obj_type = 'Real'
        # TODO(#xx2): Remove the type ignore[no-untyped-call] when file test_utils is fully type-annotated. 
        with self.assertRaisesRegexp( # type: ignore[no-untyped-call]
            utils.ValidationError, 'is not among the supported object types'
        ):
            param_spec.validate()

        # Restore a valid parameter spec.
        param_spec.obj_type = 'UnicodeString'
        param_spec.validate()

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
