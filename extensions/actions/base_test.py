# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for the base action specification."""

from core.domain import action_registry
from core.domain import obj_services
from core.tests import test_utils
import schema_utils
import schema_utils_test

EXPLORATION_START_ID = 'ExplorationStart'


class ActionUnitTests(test_utils.GenericTestBase):
    """Test that the default actions are valid."""

    def _validate_customization_arg_specs(self, customization_args):
        for ca_spec in customization_args:
            self.assertEqual(set(ca_spec.keys()), set([
                'name', 'description', 'schema', 'default_value']))

            self.assertTrue(isinstance(ca_spec['name'], basestring))
            self.assertTrue(self._is_alphanumeric_string(ca_spec['name']))
            self.assertTrue(isinstance(ca_spec['description'], basestring))
            self.assertGreater(len(ca_spec['description']), 0)

            schema_utils_test.validate_schema(ca_spec['schema'])
            self.assertEqual(
                ca_spec['default_value'],
                schema_utils.normalize_against_schema(
                    ca_spec['default_value'], ca_spec['schema']))

            if ca_spec['schema']['type'] == 'custom':
                obj_class = obj_services.Registry.get_object_class_by_type(
                    ca_spec['schema']['obj_type'])
                self.assertIsNotNone(obj_class.edit_html_filename)
                self.assertIsNotNone(obj_class.edit_js_filename)
                self.assertEqual(
                    ca_spec['default_value'],
                    obj_class.normalize(ca_spec['default_value']))

    def test_action_properties(self):
        """Test the standard properties of actions."""

        action = action_registry.Registry.get_action_by_id(EXPLORATION_START_ID)

        action_dict = action.to_dict()
        self.assertItemsEqual(action_dict.keys(), [
            'customization_arg_specs'])
        self.assertEqual(action_dict['customization_arg_specs'], [{
            'name': 'state_name',
            'description': 'Initial state name',
            'schema': {
                'type': 'unicode',
            },
            'default_value': ''
        }])
