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

"""Tests for the base interaction specification."""

__author__ = 'Sean Lip'

import os
import re
import string
import struct

from core.domain import dependency_registry
from core.domain import interaction_registry
from core.domain import obj_services
from core.domain import rule_domain
from core.tests import test_utils
from extensions.interactions import base
import feconf
import schema_utils
import schema_utils_test
import utils

# File names ending in any of these suffixes will be ignored when checking the
# validity of interaction definitions.
IGNORED_FILE_SUFFIXES = ['.pyc', '.DS_Store']
# Expected dimensions for an interaction thumbnail PNG image.
INTERACTION_THUMBNAIL_WIDTH_PX = 178
INTERACTION_THUMBNAIL_HEIGHT_PX = 146


class InteractionAnswerUnitTests(test_utils.GenericTestBase):
    """Test the answer object and type properties of an interaction object."""

    def test_rules_property(self):
        """Test that interaction.rules behaves as expected."""
        interaction = base.BaseInteraction()
        interaction.answer_type = None
        interaction.normalize_answer('15')
        self.assertEqual(interaction.rules, [])

        interaction.answer_type = 'NonnegativeInt'
        self.assertEqual(len(interaction.rules), 1)
        interaction.normalize_answer('15')

        with self.assertRaisesRegexp(Exception, 'not a valid object class'):
            interaction.answer_type = 'FakeObjType'
            interaction.normalize_answer('15')


class InteractionUnitTests(test_utils.GenericTestBase):
    """Test that the default interactions are valid."""

    def _is_camel_cased(self, name):
        """Check whether a name is in CamelCase."""
        return name and (name[0] in string.ascii_uppercase)

    def _is_alphanumeric_string(self, string):
        """Check whether a string is alphanumeric."""
        return bool(re.compile("^[a-zA-Z0-9_]+$").match(string))

    def _validate_customization_arg_specs(self, customization_args):
        for ca_spec in customization_args:
            self.assertEqual(set(ca_spec.keys()), set([
                'name', 'description', 'schema', 'default_value']))

            self.assertTrue(isinstance(ca_spec['name'], basestring))
            self.assertTrue(self._is_alphanumeric_string(ca_spec['name']))
            self.assertTrue(isinstance(ca_spec['description'], basestring))
            self.assertGreater(len(ca_spec['description']), 0)

            schema_utils_test.validate_schema(ca_spec['schema'])
            self.assertEqual(
                ca_spec['default_value'],
                schema_utils.normalize_against_schema(
                    ca_spec['default_value'], ca_spec['schema']))

            if ca_spec['schema']['type'] == 'custom':
                obj_class = obj_services.Registry.get_object_class_by_type(
                    ca_spec['schema']['obj_type'])
                self.assertIsNotNone(obj_class.edit_html_filename)
                self.assertIsNotNone(obj_class.edit_js_filename)
                self.assertEqual(
                    ca_spec['default_value'],
                    obj_class.normalize(ca_spec['default_value']))

    def _validate_dependencies(self, dependency_ids):
        # Check that all dependency ids are valid.
        for dependency_id in dependency_ids:
            dependency_registry.Registry.get_dependency_html(dependency_id)

    def _listdir_omit_ignored(self, dir):
        """List all files and directories within 'dir', omitting the ones whose
        name ends in one of the IGNORED_FILE_SUFFIXES."""
        names = os.listdir(dir)
        for suffix in IGNORED_FILE_SUFFIXES:
            names = [name for name in names if not name.endswith(suffix)]
        return names

    def test_interaction_properties(self):
        """Test the standard properties of interactions."""

        TEXT_INPUT_ID = 'TextInput'

        interaction = interaction_registry.Registry.get_interaction_by_id(
            TEXT_INPUT_ID)
        self.assertEqual(interaction.id, TEXT_INPUT_ID)
        self.assertEqual(interaction.name, 'Text Input')

        interaction_dict = interaction.to_dict()
        self.assertItemsEqual(interaction_dict.keys(), [
            'id', 'name', 'description', 'display_mode',
            'customization_arg_specs', 'is_trainable', 'is_terminal',
            'is_linear', 'rule_descriptions', 'instructions', 'needs_summary',
            'default_outcome_heading'])
        self.assertEqual(interaction_dict['id'], TEXT_INPUT_ID)
        self.assertEqual(interaction_dict['customization_arg_specs'], [{
            'name': 'placeholder',
            'description': 'Placeholder text (optional)',
            'schema': {'type': 'unicode'},
            'default_value': '',
        }, {
            'name': 'rows',
            'description': 'Height (in rows)',
            'schema': {
                'type': 'int',
                'validators': [{
                    'id': 'is_at_least', 'min_value': 1
                }, {
                    'id': 'is_at_most', 'max_value': 200
                }]
            },
            'default_value': 1,
        }])

    def test_default_interactions_are_valid(self):
        """Test that the default interactions are valid."""

        _INTERACTION_CONFIG_SCHEMA = [
            ('name', basestring), ('display_mode', basestring),
            ('description', basestring), ('_customization_arg_specs', list),
            ('is_terminal', bool), ('needs_summary', bool)]

        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())

        for interaction_id in all_interaction_ids:
            # Check that the interaction id is valid.
            self.assertTrue(self._is_camel_cased(interaction_id))

            # Check that the interaction directory exists.
            interaction_dir = os.path.join(
                feconf.INTERACTIONS_DIR, interaction_id)
            self.assertTrue(os.path.isdir(interaction_dir))

            # In this directory there should only be a config .py file, an
            # html file, a JS file, a validator.js file,  a directory named
            # 'static' that contains (at least) a .png thumbnail file,
            # (optionally) a JS test spec file, (optionally) a
            # stats_response.html file and (optionally) a protractor.js file.
            dir_contents = self._listdir_omit_ignored(interaction_dir)

            optional_dirs_and_files_count = 0

            try:
                self.assertTrue(os.path.isfile(
                    os.path.join(interaction_dir, 'stats_response.html')))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    interaction_dir, '%sSpec.js' % interaction_id)))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    interaction_dir, 'protractor.js')))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

            self.assertEqual(
                optional_dirs_and_files_count + 5, len(dir_contents),
                dir_contents
            )

            py_file = os.path.join(interaction_dir, '%s.py' % interaction_id)
            html_file = os.path.join(
                interaction_dir, '%s.html' % interaction_id)
            js_file = os.path.join(interaction_dir, '%s.js' % interaction_id)
            validator_js_file = os.path.join(interaction_dir, 'validator.js')

            self.assertTrue(os.path.isfile(py_file))
            self.assertTrue(os.path.isfile(html_file))
            self.assertTrue(os.path.isfile(js_file))

            # Check that the PNG thumbnail image has the correct dimensions.
            static_dir = os.path.join(interaction_dir, 'static')
            self.assertTrue(os.path.isdir(static_dir))
            png_file = os.path.join(
                interaction_dir, 'static', '%s.png' % interaction_id)

            self.assertTrue(os.path.isfile(png_file))
            with open(png_file, 'rb') as f:
                img_data = f.read()
                w, h = struct.unpack('>LL', img_data[16:24])
                self.assertEqual(int(w), INTERACTION_THUMBNAIL_WIDTH_PX)
                self.assertEqual(int(h), INTERACTION_THUMBNAIL_HEIGHT_PX)

            js_file_content = utils.get_file_contents(js_file)
            html_file_content = utils.get_file_contents(html_file)
            validator_js_file_content = utils.get_file_contents(
                validator_js_file)

            self.assertIn(
                'oppiaInteractive%s' % interaction_id, js_file_content)
            self.assertIn('oppiaResponse%s' % interaction_id, js_file_content)
            self.assertIn(
                '<script type="text/ng-template" id="interaction/%s"' %
                    interaction_id,
                html_file_content)
            self.assertIn(
                '<script type="text/ng-template" id="response/%s"' %
                    interaction_id,
                html_file_content)
            self.assertNotIn('<script>', js_file_content)
            self.assertNotIn('</script>', js_file_content)
            self.assertIn(
                'oppiaInteractive%sValidator' % interaction_id,
                validator_js_file_content)
            self.assertNotIn('<script>', validator_js_file_content)
            self.assertNotIn('</script>', validator_js_file_content)

            interaction = interaction_registry.Registry.get_interaction_by_id(
                interaction_id)

            # Check that the specified interaction id is the same as the class
            # name.
            self.assertTrue(interaction_id, interaction.__class__.__name__)

            # Check that the configuration file contains the correct
            # top-level keys, and that these keys have the correct types.
            for item, item_type in _INTERACTION_CONFIG_SCHEMA:
                self.assertTrue(isinstance(
                    getattr(interaction, item), item_type))
                if item_type == basestring:
                    self.assertTrue(getattr(interaction, item))

            self.assertIn(interaction.display_mode, base.ALLOWED_DISPLAY_MODES)

            if interaction.is_linear or interaction.is_terminal:
                self.assertIsNone(interaction.answer_type)
            else:
                # Check that the answer_type corresponds to a valid object
                # class.
                obj_services.Registry.get_object_class_by_type(
                    interaction.answer_type)

            self._validate_customization_arg_specs(
                interaction._customization_arg_specs)

            self._validate_dependencies(interaction.dependency_ids)

            # Check that supplemental interactions have instructions, and
            # inline ones do not.
            if interaction.display_mode == base.DISPLAY_MODE_INLINE:
                self.assertIsNone(interaction.instructions)
            else:
                self.assertTrue(
                    isinstance(interaction.instructions, basestring))
                self.assertIsNotNone(interaction.instructions)

            # Check that terminal interactions are not linear.
            if interaction.is_terminal:
                self.assertFalse(interaction.is_linear)

            # Check that only linear interactions have a
            # default_outcome_heading property.
            if interaction.is_linear:
                self.assertTrue(
                    isinstance(interaction.default_outcome_heading, basestring)
                    and interaction.default_outcome_heading)
            else:
                self.assertIsNone(interaction.default_outcome_heading)

    def test_trainable_interactions_have_fuzzy_rules(self):
        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())

        for interaction_id in all_interaction_ids:
            interaction = interaction_registry.Registry.get_interaction_by_id(
                interaction_id)
            if interaction.is_trainable:
                obj_type = interaction.answer_type
                all_rule_classes = rule_domain.get_rules_for_obj_type(obj_type)
                self.assertIn(
                    rule_domain.FUZZY_RULE_TYPE,
                    [rule_class.__name__ for rule_class in all_rule_classes],
                    'Expected to find a fuzzy rule in trainable '
                    'interaction: %s' % interaction_id)

    def test_untrainable_interactions_do_not_have_fuzzy_rules(self):
        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())

        for interaction_id in all_interaction_ids:
            interaction = interaction_registry.Registry.get_interaction_by_id(
                interaction_id)
            if not interaction.is_trainable:
                obj_type = interaction.answer_type
                all_rule_classes = rule_domain.get_rules_for_obj_type(obj_type)
                self.assertNotIn(
                    rule_domain.FUZZY_RULE_TYPE,
                    [rule_class.__name__ for rule_class in all_rule_classes],
                    'Did not expect to find a fuzzy rule in untrainable '
                    'interaction: %s' % interaction_id)

    def test_trainable_interactions_have_more_than_just_a_fuzzy_rule(self):
        """This ensures that trainable interactions cannot only have a fuzzy
        rule, as that would break frontend functionality (users would not be
        able to create manual answer groups).
        """
        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())

        for interaction_id in all_interaction_ids:
            interaction = interaction_registry.Registry.get_interaction_by_id(
                interaction_id)
            if interaction.is_trainable:
                obj_type = interaction.answer_type
                all_rule_classes = rule_domain.get_rules_for_obj_type(obj_type)
                self.assertNotEqual(
                    len(all_rule_classes), 1,
                    'Expected trainable interaction to have more than just a '
                    'fuzzy rule: %s' % interaction_id)

    def test_linear_interactions(self):
        """Sanity-check for the number of linear interactions."""

        all_interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())

        count = 0
        for interaction_id in all_interaction_ids:
            interaction = interaction_registry.Registry.get_interaction_by_id(
                interaction_id)
            if interaction.is_linear:
                count += 1

        self.assertEqual(count, 1)
