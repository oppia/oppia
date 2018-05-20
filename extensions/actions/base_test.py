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
from core.tests import test_utils

EXPLORATION_START_TYPE = 'ExplorationStart'
ANSWER_SUBMIT_TYPE = 'AnswerSubmit'
EXPLORATION_QUIT_TYPE = 'ExplorationQuit'


class ActionUnitTests(test_utils.GenericTestBase):
    """Test that the default actions are valid."""

    def test_action_properties_for_exp_start(self):
        """Test the standard properties of exploration start action."""

        action = action_registry.Registry.get_action_by_type(
            EXPLORATION_START_TYPE)

        action_dict = action.to_dict()
        self.assertItemsEqual(action_dict.keys(), [
            'customization_arg_specs'])
        self.assertEqual(
            action_dict['customization_arg_specs'], [{
                'name': 'state_name',
                'description': 'Initial state name',
                'schema': {
                    'type': 'unicode',
                },
                'default_value': ''
            }])

    def test_action_properties_for_answer_submit(self):
        """Test the standard properties of answer submit action."""

        action = action_registry.Registry.get_action_by_type(
            ANSWER_SUBMIT_TYPE)

        action_dict = action.to_dict()
        self.assertItemsEqual(action_dict.keys(), [
            'customization_arg_specs'])
        self.assertEqual(
            action_dict['customization_arg_specs'], [{
                'name': 'state_name',
                'description': 'State name',
                'schema': {
                    'type': 'unicode',
                },
                'default_value': ''
            }, {
                'name': 'dest_state_name',
                'description': 'Destination state name',
                'schema': {
                    'type': 'unicode',
                },
                'default_value': ''
            }, {
                'name': 'interaction_id',
                'description': 'ID of the interaction',
                'schema': {
                    'type': 'unicode',
                },
                'default_value': ''
            }, {
                'name': 'submitted_answer',
                'description': 'Submitted answer',
                'schema': {
                    'type': 'unicode',
                },
                'default_value': ''
            }, {
                'name': 'feedback',
                'description': 'Feedback for the submitted answer',
                'schema': {
                    'type': 'unicode',
                },
                'default_value': ''
            }, {
                'name': 'time_spent_state_in_msecs',
                'description': 'Time spent in state in milliseconds',
                'schema': {
                    'type': 'int',
                },
                'default_value': 0
            }])

    def test_action_properties_for_exp_quit(self):
        """Test the standard properties of exploration quit action."""

        action = action_registry.Registry.get_action_by_type(
            EXPLORATION_QUIT_TYPE)

        action_dict = action.to_dict()
        self.assertItemsEqual(action_dict.keys(), [
            'customization_arg_specs'])
        self.assertEqual(
            action_dict['customization_arg_specs'], [{
                'name': 'state_name',
                'description': 'State name',
                'schema': {
                    'type': 'unicode',
                },
                'default_value': ''
            }, {
                'name': 'time_spent_in_state_in_msecs',
                'description': 'Time spent in state in milliseconds',
                'schema': {
                    'type': 'int',
                },
                'default_value': 0
            }])
