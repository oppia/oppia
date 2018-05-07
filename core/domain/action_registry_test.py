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

from core.domain import action_registry
from core.tests import test_utils


class ActionRegistryUnitTests(test_utils.GenericTestBase):
    """Test for the action registry."""

    def test_action_registry(self):
        """Do some sanity checks on the action registry."""
        self.assertEqual(
            len(action_registry.Registry.get_all_actions()),
            len(action_registry.Registry.get_all_action_ids()))
