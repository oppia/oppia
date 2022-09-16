# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for EndExploration.py"""

from __future__ import annotations

from core.domain import interaction_registry
from core.tests import test_utils
from extensions.interactions.EndExploration import EndExploration # pylint: disable=unused-import # isort: skip


class EndExplorationTests(test_utils.GenericTestBase):

    def test_end_exploration_converted_to_proto_correctly(self):
        end_exploration = (
            interaction_registry.Registry.get_interaction_by_id(
                'EndExploration'))
        end_exploration_proto = (
            end_exploration.to_android_end_exploration_proto())

        self.assertEqual(int(end_exploration_proto.ByteSize()), 0)
