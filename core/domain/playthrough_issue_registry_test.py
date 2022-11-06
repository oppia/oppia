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

import builtins

from core.domain import playthrough_issue_registry
from core.tests import test_utils
from extensions.issues.CyclicStateTransitions import CyclicStateTransitions
from extensions.issues.EarlyQuit import EarlyQuit
from extensions.issues.MultipleIncorrectSubmissions import (
    MultipleIncorrectSubmissions)


class IssueRegistryUnitTests(test_utils.GenericTestBase):
    """Test for the issue registry."""

    def setUp(self) -> None:
        super().setUp()
        self.issues_dict = {
            'EarlyQuit': EarlyQuit.EarlyQuit,
            'CyclicStateTransitions': (
                CyclicStateTransitions.CyclicStateTransitions),
            'MultipleIncorrectSubmissions': (
                MultipleIncorrectSubmissions.MultipleIncorrectSubmissions)
        }
        self.invalid_issue_type = 'InvalidIssueType'

    def tearDown(self) -> None:
        playthrough_issue_registry.Registry._issues = {} # pylint: disable=protected-access
        super().tearDown()

    def test_cannot_get_issues_that_do_not_inherit_base_exploration_issue_spec(
        self
    ) -> None:
        class FakeAction: # pylint: disable=missing-docstring
            some_property: int
        swap_getattr = self.swap(
            builtins, 'getattr', lambda *unused_args: FakeAction)
        with swap_getattr:
            all_issues = playthrough_issue_registry.Registry.get_all_issues()
        self.assertEqual(all_issues, [])

    def test_issue_registry(self) -> None:
        """Do some sanity checks on the issue registry."""
        self.assertEqual(
            len(playthrough_issue_registry.Registry.get_all_issues()), 3)

    def test_correct_issue_registry_types(self) -> None:
        """Tests issue registry for fetching of issue instances of correct
        issue types.
        """
        for issue_type, _class in self.issues_dict.items():
            self.assertIsInstance(
                playthrough_issue_registry.Registry.get_issue_by_type(
                    issue_type), _class)
        self.assertEqual(
            len(playthrough_issue_registry.Registry.get_all_issues()), 3)

    def test_incorrect_issue_registry_types(self) -> None:
        """Tests that an error is raised when fetching an incorrect issue
        type.
        """
        with self.assertRaisesRegex(KeyError, self.invalid_issue_type):
            playthrough_issue_registry.Registry.get_issue_by_type(
                self.invalid_issue_type)
