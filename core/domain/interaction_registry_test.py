# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for methods in the interaction registry."""

import json
import os

from core.domain import interaction_registry
from core.tests import test_utils
from extensions.interactions import base

EXPECTED_TERMINAL_INTERACTIONS_COUNT = 1


class InteractionDependencyTests(test_utils.GenericTestBase):
    """Tests for the calculation of dependencies for interactions."""

    def test_deduplication_of_dependency_ids(self):
        self.assertItemsEqual(
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                ['CodeRepl']),
            ['skulpt', 'codemirror'])

        self.assertItemsEqual(
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                ['CodeRepl', 'CodeRepl', 'CodeRepl']),
            ['skulpt', 'codemirror'])

        self.assertItemsEqual(
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                ['CodeRepl', 'LogicProof']),
            ['skulpt', 'codemirror', 'logic_proof'])


class InteractionRegistryUnitTests(test_utils.GenericTestBase):
    """Test for the interaction registry."""

    def test_interaction_registry(self):
        """Do some sanity checks on the interaction registry."""
        self.assertEqual(
            len(interaction_registry.Registry.get_all_interactions()),
            len(interaction_registry.Registry.get_all_interaction_ids()))

    def test_get_all_specs(self):
        """Test the get_all_specs() method."""

        specs_dict = interaction_registry.Registry.get_all_specs()
        self.assertEqual(
            len(specs_dict.keys()),
            len(interaction_registry.Registry.get_all_interaction_ids()))

        terminal_interactions_count = 0
        for item in specs_dict.values():
            self.assertIn(item['display_mode'], base.ALLOWED_DISPLAY_MODES)
            self.assertTrue(isinstance(item['is_terminal'], bool))
            if item['is_terminal']:
                terminal_interactions_count += 1

        self.assertEqual(
            terminal_interactions_count, EXPECTED_TERMINAL_INTERACTIONS_COUNT)

    def test_interaction_specs_json_sync_all_specs(self):
        """Test to ensure that the interaction_specs.json file is upto date
        with additions in the individual interaction files.
        """
        all_specs = interaction_registry.Registry.get_all_specs()

        spec_file = os.path.join(
            'extensions', 'interactions', 'interaction_specs.json')
        with open(spec_file, 'r') as f:
            specs_from_json = json.loads(f.read())

        self.assertDictEqual(all_specs, specs_from_json)
