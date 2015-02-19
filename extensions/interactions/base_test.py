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

from core.domain import dependency_registry
from core.domain import interaction_registry
from core.domain import obj_services
from core.tests import test_utils
from extensions.interactions import base
import feconf
import schema_utils
import schema_utils_test
import utils

# File names ending in any of these suffixes will be ignored when checking the
# validity of interaction definitions.
IGNORED_FILE_SUFFIXES = ['.pyc', '.DS_Store']


class AnswerHandlerUnitTests(test_utils.GenericTestBase):
    """Test the AnswerHandler domain object."""

    def test_rules_property(self):
        """Test that answer_handler.rules behaves as expected."""
        answer_handler = base.AnswerHandler('submit', 'Null')
        self.assertEqual(answer_handler.name, 'submit')
        self.assertEqual(answer_handler.rules, [])

        answer_handler = base.AnswerHandler(
            'submit', 'NonnegativeInt')
        self.assertEqual(len(answer_handler.rules), 1)

        with self.assertRaisesRegexp(Exception, 'not a valid object class'):
            base.AnswerHandler('submit', 'FakeObjType')


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
        self.assertEqual(interaction.name, 'Text')

        self.assertIn('id="interaction/TextInput"', interaction.html_body)
        self.assertIn('id="response/TextInput"', interaction.html_body)

        interaction_dict = interaction.to_dict()
        self.assertItemsEqual(interaction_dict.keys(), [
            'id', 'name', 'category', 'description', 'display_mode',
            'handler_specs', 'customization_arg_specs', 'is_terminal'])
        self.assertEqual(interaction_dict['id'], TEXT_INPUT_ID)
        self.assertEqual(interaction_dict['customization_arg_specs'], [{
            'name': 'placeholder',
            'description': 'The placeholder for the text input field.',
            'schema': {'type': 'unicode'},
            'default_value': '',
        }, {
            'name': 'rows',
            'description': (
                'How long the learner\'s answer is expected to be (in rows).'),
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
            ('name', basestring), ('category', basestring),
            ('display_mode', basestring), ('description', basestring),
            ('_handlers', list), ('_customization_arg_specs', list)]

        for interaction_id in feconf.ALLOWED_INTERACTIONS:
            # Check that the interaction id is valid.
            self.assertTrue(self._is_camel_cased(interaction_id))

            # Check that the interaction directory exists.
            interaction_dir = os.path.join(
                feconf.INTERACTIONS_DIR, interaction_id)
            self.assertTrue(os.path.isdir(interaction_dir))

            # In this directory there should only be a config .py file, an
            # html file, a JS file, (optionally) a directory named 'static',
            # (optionally) a JS test file, (optionally) a stats_response.html
            # file and (optionally) a protractor.js file.
            dir_contents = self._listdir_omit_ignored(interaction_dir)

            optional_dirs_and_files_count = 0

            try:
                self.assertIn('static', dir_contents)
                static_dir = os.path.join(interaction_dir, 'static')
                self.assertTrue(os.path.isdir(static_dir))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

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
                optional_dirs_and_files_count + 3, len(dir_contents),
                dir_contents
            )

            py_file = os.path.join(interaction_dir, '%s.py' % interaction_id)
            html_file = os.path.join(
                interaction_dir, '%s.html' % interaction_id)
            js_file = os.path.join(interaction_dir, '%s.js' % interaction_id)

            self.assertTrue(os.path.isfile(py_file))
            self.assertTrue(os.path.isfile(html_file))
            self.assertTrue(os.path.isfile(js_file))

            js_file_content = utils.get_file_contents(js_file)
            html_file_content = utils.get_file_contents(html_file)
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
                # The string attributes should be non-empty.
                if item_type == basestring:
                    self.assertTrue(getattr(interaction, item))

            self.assertIn(interaction.display_mode, base.ALLOWED_DISPLAY_MODES)

            # Check that at least one handler exists.
            self.assertTrue(
                len(interaction.handlers),
                msg='Interaction %s has no handlers defined' % interaction_id)

            for handler in interaction._handlers:
                HANDLER_KEYS = ['name', 'obj_type']
                self.assertItemsEqual(HANDLER_KEYS, handler.keys())
                self.assertTrue(isinstance(handler['name'], basestring))
                # Check that the obj_type corresponds to a valid object class.
                obj_services.Registry.get_object_class_by_type(
                    handler['obj_type'])

            # Check that all handler names are unique.
            names = [handler.name for handler in interaction.handlers]
            self.assertEqual(
                len(set(names)), len(names),
                'Interaction %s has duplicate handler names' % interaction_id)

            self._validate_customization_arg_specs(
                interaction._customization_arg_specs)

            self._validate_dependencies(interaction.dependency_ids)
