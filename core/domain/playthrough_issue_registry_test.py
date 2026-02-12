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

import importlib

from core.domain import playthrough_issue_registry
from core.tests import test_utils
from extensions.issues.CyclicStateTransitions import CyclicStateTransitions
from extensions.issues.EarlyQuit import EarlyQuit
from extensions.issues.MultipleIncorrectSubmissions import (
    MultipleIncorrectSubmissions,
)

from typing import Any


class IssueRegistryUnitTests(test_utils.GenericTestBase):
    """Test for the issue registry."""

    def setUp(self) -> None:
        super().setUp()
        self.issues_dict = {
            'EarlyQuit': EarlyQuit.EarlyQuit,
            'CyclicStateTransitions': (
                CyclicStateTransitions.CyclicStateTransitions
            ),
            'MultipleIncorrectSubmissions': (
                MultipleIncorrectSubmissions.MultipleIncorrectSubmissions
            ),
        }
        self.invalid_issue_type = 'InvalidIssueType'

    def tearDown(self) -> None:
        playthrough_issue_registry.Registry._issues = (  # pylint: disable=protected-access
            {}
        )
        super().tearDown()

    def test_issue_registry(self) -> None:
        """Do some sanity checks on the issue registry."""
        self.assertEqual(
            len(playthrough_issue_registry.Registry.get_all_issues()), 3
        )

    def test_correct_issue_registry_types(self) -> None:
        """Tests issue registry for fetching of issue instances of correct
        issue types.
        """
        for issue_type, _class in self.issues_dict.items():
            self.assertIsInstance(
                playthrough_issue_registry.Registry.get_issue_by_type(
                    issue_type
                ),
                _class,
            )

    def test_incorrect_issue_registry_types(self) -> None:
        """Tests that an error is raised when fetching an incorrect issue
        type.
        """
        with self.assertRaisesRegex(KeyError, self.invalid_issue_type):
            playthrough_issue_registry.Registry.get_issue_by_type(
                self.invalid_issue_type
            )

    def test_refresh_skips_classes_not_inheriting_base_issue_spec(
        self,
    ) -> None:
        """Test that _refresh skips classes whose base class is not
        BaseExplorationIssueSpec.
        """

        class NotAnIssue:
            """A dummy class that does not inherit from
            BaseExplorationIssueSpec.
            """

            pass

        original_import = importlib.import_module

        # Here we use type Any because the mock_import_module function
        # needs to return different module types depending on the name,
        # so a specific return type cannot be used.
        def mock_import_module(name: str) -> Any:
            module = original_import(name)
            if name.endswith('.EarlyQuit.EarlyQuit'):
                setattr(module, 'EarlyQuit', NotAnIssue)
            return module

        with self.swap(importlib, 'import_module', mock_import_module):
            playthrough_issue_registry.Registry._refresh()  # pylint: disable=protected-access

        self.assertNotIn(
            'EarlyQuit',
            playthrough_issue_registry.Registry._issues,  # pylint: disable=protected-access
        )
        self.assertTrue(
            len(
                playthrough_issue_registry.Registry._issues  # pylint: disable=protected-access
            )
            > 0
        )

    def test_get_all_issues_returns_cached_when_already_populated(
        self,
    ) -> None:
        """Test that get_all_issues skips _refresh when _issues is already
        populated.
        """
        # First call populates _issues.
        first_result = playthrough_issue_registry.Registry.get_all_issues()
        self.assertTrue(len(first_result) > 0)
        # Second call should return from cache without calling _refresh.
        second_result = playthrough_issue_registry.Registry.get_all_issues()
        self.assertEqual(len(first_result), len(second_result))
