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

from unittest import mock

from core.domain import action_registry
from core.tests import test_utils
from extensions.actions import base


class ActionRegistryUnitTests(test_utils.GenericTestBase):
    """Tests for the action registry methods."""

    @mock.patch('importlib.import_module')
    def test_action_registry_with_compliant_and_non_compliant_actions(
        self, mock_import_module: mock.MagicMock
    ) -> None:
        """Test that only subclasses of BaseLearnerActionSpec 
        are added to the registry.
        """

        class CompliantAction(base.BaseLearnerActionSpec):
            """A compliant action subclassing BaseLearnerActionSpec."""

            pass

        class NonCompliantAction:
            """A non-compliant action that does not
            subclass BaseLearnerActionSpec.
            """

            pass

        def mock_import_module_side_effect(module_name: str) -> mock.MagicMock:
            """Mock the import of modules for testing action types."""
            mock_module = mock.MagicMock()

            class_name = module_name.split('.')[-1]
            if class_name == 'ExplorationStart':
                setattr(mock_module, class_name, CompliantAction)
            elif class_name == 'AnswerSubmit':
                setattr(mock_module, class_name, NonCompliantAction)
            elif class_name == 'ExplorationQuit':
                setattr(mock_module, class_name, NonCompliantAction)
            return mock_module

        mock_import_module.side_effect = mock_import_module_side_effect
        actions = action_registry.Registry.get_all_actions()

        self.assertEqual(len(actions), 1)
        self.assertTrue(isinstance(actions[0], CompliantAction))

    def test_cannot_get_action_with_empty_registry_by_invalid_type(
        self) -> None:
        """Test with an invalid action type. Should raise a KeyError."""
        with self.assertRaisesRegex(KeyError, 'fakeAction'):
            action_registry.Registry.get_action_by_type('fakeAction')

    def test_get_action_by_valid_type(self) -> None:
        """Test retrieving an action using valid action type."""

        actions = action_registry.Registry.get_all_actions()
        action_type = actions[0].__class__.__name__
        retrieved_action = (
            action_registry.Registry.get_action_by_type(action_type))
        self.assertIsNotNone(retrieved_action)
        self.assertEqual(retrieved_action.__class__.__name__, action_type)
