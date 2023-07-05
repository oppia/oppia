# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for methods in the rule registry."""

from __future__ import annotations

import json
import os

from core import utils
from core.domain import rules_registry
from core.tests import test_utils


class RulesRegistryUnitTests(test_utils.GenericTestBase):
    """Test for the rules registry."""

    def test_get_html_field_types_to_rule_specs_for_current_state_schema_version(  # pylint: disable=line-too-long
        self
    ) -> None:
        html_field_types_to_rule_specs = (
            rules_registry.Registry.get_html_field_types_to_rule_specs())

        spec_file = os.path.join(
            'extensions', 'interactions', 'html_field_types_to_rule_specs.json')
        with utils.open_file(spec_file, 'r') as f:
            specs_from_json = json.loads(f.read())

        self.assertDictEqual(
            html_field_types_to_rule_specs,
            specs_from_json)

    def test_get_html_field_types_to_rule_specs_for_previous_state_schema_version(  # pylint: disable=line-too-long
        self
    ) -> None:
        html_field_types_to_rule_specs_v41 = (
            rules_registry.Registry.get_html_field_types_to_rule_specs(
                state_schema_version=41))

        spec_file_v41 = os.path.join(
            'extensions', 'interactions',
            'legacy_html_field_types_to_rule_specs_by_state_version',
            'html_field_types_to_rule_specs_state_v41.json')
        with utils.open_file(spec_file_v41, 'r') as f:
            specs_from_json_v41 = json.loads(f.read())

            self.assertDictEqual(
                html_field_types_to_rule_specs_v41, specs_from_json_v41
            )

    def test_get_html_field_types_to_rule_specs_for_unsaved_state_schema_version_without_caching(  # pylint: disable=line-too-long
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'No specs json file found for state schema'
        ):
            (
                rules_registry.Registry
                .get_html_field_types_to_rule_specs(state_schema_version=10)
            )

    def test_get_html_field_types_to_rule_specs_for_given_state_schema_version_with_caching(  # pylint: disable=line-too-long
        self
    ) -> None:
        # Checking the html field types to rule specs for version 41,
        # and simuntaneously populating the
        # Registry._state_schema_version_to_html_field_types_to_rule_specs
        # for caching purpose.

        html_field_types_to_rule_specs_v41 = (
            rules_registry.Registry.get_html_field_types_to_rule_specs(
                state_schema_version=41))

        spec_file_v41 = os.path.join(
            'extensions', 'interactions',
            'legacy_html_field_types_to_rule_specs_by_state_version',
            'html_field_types_to_rule_specs_state_v41.json')
        with utils.open_file(spec_file_v41, 'r') as f:
            specs_from_json_v41 = json.loads(f.read())

        self.assertDictEqual(
            html_field_types_to_rule_specs_v41,
            specs_from_json_v41)

        # Checking if a key(41) is already present in
        # Registry._state_schema_version_to_html_field_types_to_rule_specs
        # and then re-calling Registry.get_html_field_types_to_rule_specs
        # to check if state_schema_version_to_html_field_types_to_rule_specs
        # is repopulated or not.

        expected_state_schema_version_to_html_field_types_to_rule_specs = {
            None: {},
            41: specs_from_json_v41
        }
        self.assertEqual(
            rules_registry.Registry._state_schema_version_to_html_field_types_to_rule_specs,  # pylint: disable=protected-access
            expected_state_schema_version_to_html_field_types_to_rule_specs
        )

        rules_registry.Registry._state_schema_version_to_html_field_types_to_rule_specs[41] = {}  # pylint: disable=protected-access
        rules_registry.Registry.get_html_field_types_to_rule_specs(
            state_schema_version=41)

        self.assertNotEqual(
            rules_registry.Registry._state_schema_version_to_html_field_types_to_rule_specs,  # pylint: disable=protected-access
            expected_state_schema_version_to_html_field_types_to_rule_specs
        )

        rules_registry.Registry._state_schema_version_to_html_field_types_to_rule_specs[41] = (  # pylint: disable=protected-access
            specs_from_json_v41
        )
