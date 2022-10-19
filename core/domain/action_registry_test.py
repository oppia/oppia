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

import os
import tempfile

from core.domain import action_registry
from core.platform import models
from core.tests import test_utils
from typing import List
MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import stats_models

(stats_models,) = models.Registry.import_models([models.Names.STATISTICS])


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

        tempdir = tempfile.TemporaryDirectory(
            prefix=os.getcwd() + '/extensions/actions/')
        action_name = tempdir.name.split('/')[-1]
        action_file = os.path.join(tempdir.name, action_name + '.py')
        with open(action_file, 'w', encoding='utf8') as f:
            f.write('class FakeBaseActionSpec:\n')
            f.write('\tsome_property: int = 0\n\n')
            f.write('class %s(FakeBaseActionSpec):\n' % action_name)
            f.write('\tsome_property: int = 1\n')

        def mock_get_all_action_types() -> List[str]:
            predefined_action_types = stats_models.ALLOWED_ACTION_TYPES
            updated_action_types = [action_name, *predefined_action_types]
            return updated_action_types
        swap_get_all_action_types = self.swap(
            action_registry.Registry, 'get_all_action_types',
            mock_get_all_action_types)
        with swap_get_all_action_types:
            all_actions = action_registry.Registry.get_all_actions()

        tempdir.cleanup()
        self.assertEqual(len(all_actions), 3)
        self.assertEqual(
            all_actions, action_registry.Registry.get_all_actions())

    def test_cannot_get_action_by_invalid_type(self) -> None:
        # Testing with invalid action type.
        # Invalid action type raises 'KeyError' with invalid_key
        # as the error message.
        with self.assertRaisesRegex(KeyError, 'fakeAction'):
            action_registry.Registry.get_action_by_type('fakeAction')

    def test_can_get_action_by_valid_type(self) -> None:
        # Testing with valid action type.
        self.assertIsNotNone(
            action_registry.Registry.get_action_by_type('ExplorationStart'))
