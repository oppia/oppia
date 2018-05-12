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

"""Tests for the base issue specification."""

from core.domain import issue_registry
from core.tests import test_utils

EARLY_QUIT_ID = 'EarlyQuit'
MULTIPLE_INCORRECT_SUBMISSIONS_ID = 'MultipleIncorrectSubmissions'
CYCLIC_STATE_TRANSITIONS_ID = 'CyclicStateTransitions'


class IssueUnitTests(test_utils.GenericTestBase):
    """Test that the default issues are valid."""

    def test_issue_properties(self):
        """Test the standard properties of issues."""

        issue = issue_registry.Registry.get_issue_by_id(EARLY_QUIT_ID)

        issue_dict = issue.to_dict()
        self.assertItemsEqual(issue_dict.keys(), [
            'customization_arg_specs'])
        self.assertEqual(
            issue_dict['customization_arg_specs'], [{
                'name': 'state_name',
                'description': 'State name',
                'schema': {
                    'type': 'unicode',
                },
                'default_value': ''
            }, {
                'name': 'time_spent_in_exp_in_msecs',
                'description': (
                    'Time spent in the exploration before quitting in '
                    'milliseconds'),
                'schema': {
                    'type': 'int',
                },
                'default_value': 0
            }])

        issue = issue_registry.Registry.get_issue_by_id(
            MULTIPLE_INCORRECT_SUBMISSIONS_ID)

        issue_dict = issue.to_dict()
        self.assertItemsEqual(issue_dict.keys(), [
            'customization_arg_specs'])
        self.assertEqual(
            issue_dict['customization_arg_specs'], [{
                'name': 'state_name',
                'description': 'State name',
                'schema': {
                    'type': 'unicode',
                },
                'default_value': ''
            }, {
                'name': 'num_times_answered_incorrectly',
                'description': (
                    'Number of times incorrect answers were submitted'),
                'schema': {
                    'type': 'int',
                },
                'default_value': 0
            }])

        issue = issue_registry.Registry.get_issue_by_id(
            CYCLIC_STATE_TRANSITIONS_ID)

        issue_dict = issue.to_dict()
        self.assertItemsEqual(issue_dict.keys(), [
            'customization_arg_specs'])
        self.assertEqual(
            issue_dict['customization_arg_specs'], [{
                'name': 'state_names',
                'description': 'List of state names',
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'unicode',
                    },
                },
                'default_value': []
            }])
