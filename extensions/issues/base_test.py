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

EARLY_QUIT_TYPE = 'EarlyQuit'
MULTIPLE_INCORRECT_SUBMISSIONS_TYPE = 'MultipleIncorrectSubmissions'
CYCLIC_STATE_TRANSITIONS_TYPE = 'CyclicStateTransitions'


class IssueUnitTests(test_utils.GenericTestBase):
    """Test that the default issues are valid."""

    def test_issue_properties_for_early_quit(self):
        """Test the standard properties of early quit issue."""

        issue = issue_registry.Registry.get_issue_by_type(
            EARLY_QUIT_TYPE)

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

    def test_issue_properties_for_multiple_incorrect_submissions(self):
        """Test the standard properties of multiple incorrect submissions
        issue.
        """

        issue = issue_registry.Registry.get_issue_by_type(
            MULTIPLE_INCORRECT_SUBMISSIONS_TYPE)

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

    def test_issue_properties_for_cyclic_state_transitions(self):
        """Test the standard properties of cyclic state transitions issue."""

        issue = issue_registry.Registry.get_issue_by_type(
            CYCLIC_STATE_TRANSITIONS_TYPE)

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
