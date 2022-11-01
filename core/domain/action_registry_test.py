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

"""Tests for methods in the action registry."""

from __future__ import annotations

import builtins
import os
import tempfile

from core import feconf
from core.domain import action_registry
from core.tests import test_utils
from typing import List


class ActionRegistryUnitTests(test_utils.GenericTestBase):
    """Test for the action registry."""

    def test_action_registry(self) -> None:
        """Do some sanity checks on the action registry."""
        self.assertEqual(
            len(action_registry.Registry.get_all_actions()), 3)

    def test_cannot_get_actions_that_do_not_inherit_base_learner_action_spec(
            self) -> None:
        # The dict '_actions' is a class property which once gets populated,
        # doesn't call '_refresh()' method again making it difficult to test
        # all branches of action_registry.py. Hence, we manually empty it
        # before this test.
        action_registry.Registry._actions = {} # pylint: disable=protected-access
        class FakeAction:
            some_property: int
        swap_getattr = self.swap(
            builtins, 'getattr', lambda *unused_args: FakeAction)
        with swap_getattr:
            all_actions = action_registry.Registry.get_all_actions()
        self.assertEqual(all_actions, [])

    def test_cannot_get_action_by_invalid_type(self) -> None:
        # Testing with invalid action type.
        # Invalid action type raises 'KeyError' with invalid_key
        # as the error message.
        with self.assertRaisesRegex(KeyError, 'fakeAction'):
            action_registry.Registry.get_action_by_type('fakeAction')

    def test_can_get_action_by_valid_type(self) -> None:
        # Testing with valid action type.
        action = action_registry.Registry.get_action_by_type('ExplorationStart')
        self.assertIsNotNone(action)
        self.assertIn(action, action_registry.Registry.get_all_actions())
