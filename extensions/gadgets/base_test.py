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

import os
import re
import string

from core.domain import dependency_registry
from core.domain import gadget_registry
from core.domain import obj_services
from core.tests import test_utils
import feconf
import schema_utils
import schema_utils_test
import utils

# File names ending in any of these suffixes will be ignored when checking the
# validity of gadget definitions.
IGNORED_FILE_SUFFIXES = ['.pyc', '.DS_Store']

TEST_GADGET_TYPE = 'TestGadget'
TEST_GADGETS = {
    TEST_GADGET_TYPE: {
        'dir': os.path.join(feconf.GADGETS_DIR, 'TestGadget')
    }
}

_GADGET_CONFIG_SCHEMA = [
    ('short_description', basestring), ('description', basestring),
    ('height_px', int), ('width_px', int), ('panel', basestring),
    ('_customization_arg_specs', list)]


class GadgetUnitTests(test_utils.GenericTestBase):
    """Test that the default gadgets are valid."""

    def _is_camel_cased(self, name):
        """Check whether a name is in CamelCase."""
        return name and (name[0] in string.ascii_uppercase)

    def _is_alphanumeric_string(self, input_string):
        """Check whether a string is alphanumeric."""
        return bool(re.compile("^[a-zA-Z0-9_]+$").match(input_string))

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

    def _listdir_omit_ignored(self, directory):
        """List all files and directories within 'directory', omitting the ones
        whose name ends in one of the IGNORED_FILE_SUFFIXES."""
        names = os.listdir(directory)
        for suffix in IGNORED_FILE_SUFFIXES:
            names = [name for name in names if not name.endswith(suffix)]
        return names

    def test_gadget_properties(self):
        """Test the standard properties of gadgets."""

        with self.swap(feconf, 'ALLOWED_GADGETS', TEST_GADGETS):
            gadget = gadget_registry.Registry.get_gadget_by_type(
                TEST_GADGET_TYPE)
        self.assertEqual(gadget.type, TEST_GADGET_TYPE)
        self.assertEqual(gadget.short_description, 'Test Gadget')

        self.assertIn('id="gadget/TestGadget"', gadget.html_body)

        gadget_dict = gadget.to_dict()
        self.assertItemsEqual(gadget_dict.keys(), [
            'type', 'short_description', 'height_px', 'width_px', 'panel',
            'description', 'customization_arg_specs',])
        self.assertEqual(gadget_dict['type'], TEST_GADGET_TYPE)
        self.assertEqual(gadget_dict['customization_arg_specs'], [
            {
                'name': 'adviceObjects',
                'description': 'Title and content for each tip.',
                'schema': {
                    'type': 'list',
                    'validators': [{
                        'id': 'has_length_at_least',
                        'min_value': 1,
                    }, {
                        'id': 'has_length_at_most',
                        'max_value': 3,
                    }],
                    'items': {
                        'type': 'dict',
                        'properties': [{
                            'name': 'adviceTitle',
                            'description': 'Tip title',
                            'schema': {
                                'type': 'unicode',
                                'validators': [{
                                    'id': 'is_nonempty',
                                }]
                            },
                        }, {
                            'name': 'adviceHtml',
                            'description': 'Advice content',
                            'schema': {
                                'type': 'html',
                            },
                        }]
                    }
                },
                'default_value': [{
                    'adviceTitle': 'Tip title',
                    'adviceHtml': ''
                }]
            }])

    def test_default_gadgets_are_valid(self):
        """Test that the default gadgets are valid."""

        for gadget_type in feconf.ALLOWED_GADGETS:
            # Check that the gadget type is valid.
            self.assertTrue(self._is_camel_cased(gadget_type))

            # Check that the gadget directory exists.
            gadget_dir = os.path.join(
                feconf.GADGETS_DIR, gadget_type)
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
                    gadget_dir, '%sSpec.js' % gadget_type)))
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

            py_file = os.path.join(gadget_dir, '%s.py' % gadget_type)
            html_file = os.path.join(
                gadget_dir, '%s.html' % gadget_type)
            js_file = os.path.join(gadget_dir, '%s.js' % gadget_type)

            self.assertTrue(os.path.isfile(py_file))
            self.assertTrue(os.path.isfile(html_file))
            self.assertTrue(os.path.isfile(js_file))

            js_file_content = utils.get_file_contents(js_file)
            html_file_content = utils.get_file_contents(html_file)
            self.assertIn(
                'oppiaGadget%s' % gadget_type, js_file_content)
            self.assertIn(
                '<script type="text/ng-template" id="gadget/%s"' %
                gadget_type,
                html_file_content)
            # Check that the html template includes js script for the
            # gadget.
            self.assertIn(
                '<script src="{{cache_slug}}/extensions/gadgets/%s/%s.js">'
                '</script>' % (gadget_type, gadget_type),
                html_file_content)
            self.assertNotIn('<script>', js_file_content)
            self.assertNotIn('</script>', js_file_content)

            gadget = gadget_registry.Registry.get_gadget_by_type(
                gadget_type)

            # Check that the specified gadget type is the same as the class
            # name.
            self.assertTrue(gadget_type, gadget.__class__.__name__)

            # Check that height and width have been overridden with positive
            # values.
            self.assertGreater(gadget.height_px, 0)
            self.assertGreater(gadget.width_px, 0)

            # Check that the gadget's uses a valid panel in the Reader view.
            self.assertTrue(gadget.panel in feconf.ALLOWED_GADGET_PANELS)

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
                gadget._customization_arg_specs)  # pylint: disable=protected-access

            self._validate_dependencies(gadget.dependency_ids)
