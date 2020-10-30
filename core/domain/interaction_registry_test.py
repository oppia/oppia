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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json
import os

from core.domain import exp_services
from core.domain import interaction_registry
from core.tests import test_utils
from extensions.interactions import base
import feconf
import python_utils
import schema_utils

EXPECTED_TERMINAL_INTERACTIONS_COUNT = 1


class InteractionDependencyTests(test_utils.GenericTestBase):
    """Tests for the calculation of dependencies for interactions."""

    def setUp(self):
        super(InteractionDependencyTests, self).setUp()

        # Register and login as an editor.
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)

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
            ['skulpt', 'codemirror'])

    def test_dependency_loads_in_exploration_player_page(self):
        exp_id = '0'

        exp_services.load_demo(exp_id)

        # Ensure that dependencies are added in the exploration reader page.
        response = self.get_html_response('/explore/%s' % exp_id)
        response.mustcontain('dependency_html.html')

    def test_no_dependencies_in_non_exploration_pages(self):
        response = self.get_html_response(feconf.LIBRARY_INDEX_URL)
        response.mustcontain(no=['dependency_html.html'])

    def test_dependencies_loaded_in_exploration_editor(self):

        exp_services.load_demo('0')

        # Ensure that dependencies are added in the exploration editor page.
        response = self.get_html_response('/create/0')
        response.mustcontain('dependency_html.html')

        self.logout()


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
            len(list(specs_dict.keys())),
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
        with python_utils.open_file(spec_file, 'r') as f:
            specs_from_json = json.loads(f.read())

        self.assertDictEqual(all_specs, specs_from_json)

    def test_interaction_specs_customization_arg_specs_names_are_valid(self):
        """Test to ensure that all customization argument names in
        interaction specs only include alphabetic letters and are
        lowerCamelCase. This is because these properties are involved in the
        generation of content_ids for customization arguments.
        """
        all_specs = interaction_registry.Registry.get_all_specs()
        ca_names_in_schema = []

        def traverse_schema_to_find_names(schema):
            """Recursively traverses the schema to find all name fields.
            Recursion is required because names can be nested within
            'type: dict' inside a schema.

            Args:
                schema: dict. The schema to traverse.
            """
            if 'name' in schema:
                ca_names_in_schema.append(schema['name'])

            schema_type = schema['type']
            if schema_type == schema_utils.SCHEMA_TYPE_LIST:
                traverse_schema_to_find_names(schema['items'])
            elif schema_type == schema_utils.SCHEMA_TYPE_DICT:
                for schema_property in schema['properties']:
                    ca_names_in_schema.append(schema_property['name'])
                    traverse_schema_to_find_names(schema_property['schema'])

        for interaction_id in all_specs:
            for ca_spec in all_specs[interaction_id]['customization_arg_specs']:
                ca_names_in_schema.append(ca_spec['name'])
                traverse_schema_to_find_names(ca_spec['schema'])
        for name in ca_names_in_schema:
            self.assertTrue(name.isalpha())
            self.assertTrue(name[0].islower())

    def test_interaction_specs_customization_arg_default_values_are_valid(self):
        """Test to ensure that all customization argument default values
        that contain content_ids are properly set to None.
        """
        all_specs = interaction_registry.Registry.get_all_specs()

        def traverse_schema_to_find_and_validate_subtitled_content(
                value, schema):
            """Recursively traverse the schema to find SubtitledHtml or
            SubtitledUnicode contained or nested in value.

            Args:
                value: *. The value of the customization argument.
                schema: dict. The customization argument schema.
            """
            is_subtitled_html_spec = (
                schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM and
                schema['obj_type'] ==
                schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML)
            is_subtitled_unicode_spec = (
                schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM and
                schema['obj_type'] ==
                schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE)

            if is_subtitled_html_spec or is_subtitled_unicode_spec:
                self.assertIsNone(value['content_id'])
            elif schema['type'] == schema_utils.SCHEMA_TYPE_LIST:
                for x in value:
                    traverse_schema_to_find_and_validate_subtitled_content(
                        x, schema['items'])
            elif schema['type'] == schema_utils.SCHEMA_TYPE_DICT:
                for schema_property in schema['properties']:
                    traverse_schema_to_find_and_validate_subtitled_content(
                        x[schema_property.name],
                        schema_property['schema']
                    )

        for interaction_id in all_specs:
            for ca_spec in all_specs[interaction_id]['customization_arg_specs']:
                traverse_schema_to_find_and_validate_subtitled_content(
                    ca_spec['default_value'], ca_spec['schema'])

    def test_get_all_specs_for_state_schema_version_for_unsaved_version(self):
        with self.assertRaisesRegexp(
            Exception,
            'No specs json file found for state schema'
        ):
            (
                interaction_registry.Registry
                .get_all_specs_for_state_schema_version(10)
            )
