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
