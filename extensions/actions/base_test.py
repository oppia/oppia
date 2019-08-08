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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import os
import sys

from core.domain import action_registry
from core.platform import models
from core.tests import test_utils

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order

# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


class ActionUnitTests(test_utils.GenericTestBase):
    """Test that the default actions are valid."""

    def test_action_properties_for_exp_start(self):
        """Test the standard properties of exploration start action."""

        action = action_registry.Registry.get_action_by_type(
            stats_models.ACTION_TYPE_EXPLORATION_START)

        action_dict = action.to_dict()
        self.assertItemsEqual(list(action_dict.keys()), [
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
            stats_models.ACTION_TYPE_ANSWER_SUBMIT)

        action_dict = action.to_dict()
        self.assertItemsEqual(list(action_dict.keys()), [
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
            stats_models.ACTION_TYPE_EXPLORATION_QUIT)

        action_dict = action.to_dict()
        self.assertItemsEqual(list(action_dict.keys()), [
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
