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

"""Tests for the base gadget specification."""

__author__ = 'Michael Anuzis'

import os
import re
import string

from core.domain import dependency_registry
from core.domain import gadget_registry
from core.tests import test_utils
from extensions.gadgets import base
import feconf
import schema_utils
import schema_utils_test
import utils

# File names ending in any of these suffixes will be ignored when checking the
# validity of gadget definitions.
IGNORED_FILE_SUFFIXES = ['.pyc', '.DS_Store']

TEST_GADGETS = {
    'TestGadget': {
        'dir': os.path.join(feconf.GADGETS_DIR, 'TestGadget')
    }
}


class GadgetUnitTests(test_utils.GenericTestBase):
    """Test that the default gadgets are valid."""

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

    def test_gadget_properties(self):
        """Test the standard properties of gadgets."""

        TEST_GADGET_ID = 'TestGadget'

        with self.swap(feconf, 'ALLOWED_GADGETS', TEST_GADGETS):
            gadget = gadget_registry.Registry.get_gadget_by_id(
                TEST_GADGET_ID)
        self.assertEqual(gadget.id, TEST_GADGET_ID)
        self.assertEqual(gadget.name, 'TestGadget')

        self.assertIn('id="gadget/TestGadget"', gadget.html_body)

        gadget_dict = gadget.to_dict()
        self.assertItemsEqual(gadget_dict.keys(), [
            'id', 'name', 'description', 'customization_arg_specs',])
        self.assertEqual(gadget_dict['id'], TEST_GADGET_ID)
        self.assertEqual(gadget_dict['customization_arg_specs'], [
            {
                'name': 'title',
                'description': 'A text title of the test gadget.',
                'schema': {
                    'type': 'unicode',
                },
                'default_value': ''
            }, {
                'name': 'floors',
                'description': 'A test attribute that helps increase height.',
                'schema': {
                    'type': 'int',
                },
                'default_value': 1
            }, {
                'name': 'characters',
                'description': 'A test attribute that helps increase width.',
                'schema': {
                    'type': 'int',
                },
                'default_value': 2
            }])

    def test_default_gadgets_are_valid(self):
        """Test that the default gadgets are valid."""

        _GADGET_CONFIG_SCHEMA = [
            ('name', basestring), ('description', basestring),
            ('_customization_arg_specs', list)]

        for gadget_id in feconf.ALLOWED_GADGETS:
            # Check that the gadget id is valid.
            self.assertTrue(self._is_camel_cased(gadget_id))

            # Check that the gadget directory exists.
            gadget_dir = os.path.join(
                feconf.GADGETS_DIR, gadget_id)
            self.assertTrue(os.path.isdir(gadget_dir))

            # In this directory there should only be a config .py file, an
            # html file, a JS file, (optionally) a directory named 'static',
            # (optionally) a JS test file, and (optionally) a protractor.js
            # file.
            dir_contents = self._listdir_omit_ignored(gadget_dir)

            optional_dirs_and_files_count = 0

            try:
                self.assertIn('static', dir_contents)
                static_dir = os.path.join(gadget_dir, 'static')
                self.assertTrue(os.path.isdir(static_dir))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    gadget_dir, '%sSpec.js' % gadget_id)))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    gadget_dir, 'protractor.js')))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

            self.assertEqual(
                optional_dirs_and_files_count + 3, len(dir_contents),
                dir_contents
            )

            py_file = os.path.join(gadget_dir, '%s.py' % gadget_id)
            html_file = os.path.join(
                gadget_dir, '%s.html' % gadget_id)
            js_file = os.path.join(gadget_dir, '%s.js' % gadget_id)

            self.assertTrue(os.path.isfile(py_file))
            self.assertTrue(os.path.isfile(html_file))
            self.assertTrue(os.path.isfile(js_file))

            js_file_content = utils.get_file_contents(js_file)
            html_file_content = utils.get_file_contents(html_file)
            self.assertIn(
                'oppiaGadget%s' % gadget_id, js_file_content)
            self.assertIn(
                '<script type="text/ng-template" id="gadget/%s"' %
                    gadget_id,
                html_file_content)
            self.assertNotIn('<script>', js_file_content)
            self.assertNotIn('</script>', js_file_content)

            gadget = gadget_registry.Registry.get_gadget_by_id(
                gadget_id)

            # Check that the specified gadget id is the same as the class
            # name.
            self.assertTrue(gadget_id, gadget.__class__.__name__)

            # Check that the configuration file contains the correct
            # top-level keys, and that these keys have the correct types.
            for item, item_type in _GADGET_CONFIG_SCHEMA:
                self.assertTrue(isinstance(
                    getattr(gadget, item), item_type))
                # The string attributes should be non-empty (except for
                # 'category').
                if item_type == basestring and item != 'category':
                    self.assertTrue(getattr(gadget, item))

            self._validate_customization_arg_specs(
                gadget._customization_arg_specs)

            self._validate_dependencies(gadget.dependency_ids)
