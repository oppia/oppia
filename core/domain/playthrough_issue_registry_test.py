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

"""Tests for methods in the issue registry."""

from __future__ import annotations

from core import utils
from core.domain import playthrough_issue_registry
from core.tests import test_utils
from extensions.issues.CyclicStateTransitions import CyclicStateTransitions
from extensions.issues.EarlyQuit import EarlyQuit
from extensions.issues.MultipleIncorrectSubmissions import (
    MultipleIncorrectSubmissions)


class IssueRegistryUnitTests(test_utils.GenericTestBase):
    """Test for the issue registry."""

    def setUp(self):
        super(IssueRegistryUnitTests, self).setUp()
        self.issues_dict = {
                'EarlyQuit':
                EarlyQuit.EarlyQuit,
                'CyclicStateTransitions':
                CyclicStateTransitions.CyclicStateTransitions,
                'MultipleIncorrectSubmissions':
                MultipleIncorrectSubmissions.MultipleIncorrectSubmissions
                }
        self.invalid_issue_type = 'InvalidIssueType'
        self.Registry = playthrough_issue_registry.Registry()

    def test_issue_registry(self):
        """Do some sanity checks on the issue registry."""
        self.assertEqual(
            len(self.Registry.get_all_issues()), 3)

    def test_issue_registry_types(self):
        """Do some issue type checks on the issue registry."""

        def validate(issue_type):
            """validating function."""
            try:
                return self.Registry.get_issue_by_type(
                    issue_type)
            except KeyError as e:
                raise utils.ValidationError('Invalid issue type: %s' % (
                    issue_type)) from e

        for issue_type, instance in self.issues_dict.items():
            self.assertIsInstance(
                    validate(issue_type),
                    instance)

        with self.assertRaisesRegex(utils.ValidationError, (
            'Invalid issue type: %s' % self.invalid_issue_type)):
            validate(self.invalid_issue_type)
