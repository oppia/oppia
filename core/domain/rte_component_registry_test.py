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

import os
import re
import string
import struct

from core.domain import obj_services
from core.domain import rte_component_registry
from core.tests import test_utils
import feconf
import schema_utils
import schema_utils_test
import utils

# File names ending in any of these suffixes will be ignored when checking for
# RTE component validity.
IGNORED_FILE_SUFFIXES = ['.pyc', '.DS_Store']
RTE_THUMBNAIL_HEIGHT_PX = 16
RTE_THUMBNAIL_WIDTH_PX = 16

_COMPONENT_CONFIG_SCHEMA = [
    ('name', basestring), ('category', basestring),
    ('description', basestring), ('_customization_arg_specs', list)]


class RteComponentUnitTests(test_utils.GenericTestBase):
    """Tests that all the default RTE comopnents are valid."""

    def _is_camel_cased(self, name):
        """Check whether a name is in CamelCase."""
        return name and (name[0] in string.ascii_uppercase)

    def _is_alphanumeric_string(self, input_string):
        """Check whether a string is alphanumeric."""
        return bool(re.compile("^[a-zA-Z0-9_]+$").match(input_string))

    def _validate_customization_arg_specs(self, customization_arg_specs):
        for ca_spec in customization_arg_specs:
            self.assertEqual(set(ca_spec.keys()), set([
                'name', 'description', 'schema', 'default_value']))

            self.assertTrue(isinstance(ca_spec['name'], basestring))
            self.assertTrue(self._is_alphanumeric_string(ca_spec['name']))
            self.assertTrue(isinstance(ca_spec['description'], basestring))
            self.assertGreater(len(ca_spec['description']), 0)

            # The default value might not pass validation checks (e.g. the
            # Image component has a required field whose default value is
            # empty). Thus, when checking the default value schema, we don't
            # apply the custom validators.
            schema_utils_test.validate_schema(ca_spec['schema'])
            self.assertEqual(
                ca_spec['default_value'],
                schema_utils.normalize_against_schema(
                    ca_spec['default_value'], ca_spec['schema'],
                    apply_custom_validators=False))

            if ca_spec['schema']['type'] == 'custom':
                obj_class = obj_services.Registry.get_object_class_by_type(
                    ca_spec['schema']['obj_type'])
                self.assertIsNotNone(obj_class.edit_html_filename)
                self.assertIsNotNone(obj_class.edit_js_filename)
                self.assertEqual(
                    ca_spec['default_value'],
                    obj_class.normalize(ca_spec['default_value']))

    def _listdir_omit_ignored(self, directory):
        """List all files and directories within 'directory', omitting the ones
        whose name ends in one of the IGNORED_FILE_SUFFIXES."""
        names = os.listdir(directory)
        for suffix in IGNORED_FILE_SUFFIXES:
            names = [name for name in names if not name.endswith(suffix)]
        return names

    def test_allowed_rich_text_components_and_counts(self):
        """Do sanity checks on the ALLOWED_RTE_EXTENSIONS dict in feconf.py."""
        self.assertEqual(
            len(rte_component_registry.Registry.get_all_rte_components()),
            len(feconf.ALLOWED_RTE_EXTENSIONS))

        for (component_name, component_definition) in (
                feconf.ALLOWED_RTE_EXTENSIONS.iteritems()):
            contents = os.listdir(
                os.path.join(os.getcwd(), component_definition['dir']))
            self.assertIn('%s.py' % component_name, contents)

    def test_image_thumbnails_for_rte_components(self):
        """Test the thumbnails for the RTE component icons."""
        for (cpt_name, cpt_spec) in feconf.ALLOWED_RTE_EXTENSIONS.iteritems():
            image_filepath = os.path.join(
                os.getcwd(), cpt_spec['dir'], '%s.png' % cpt_name)

            with open(image_filepath, 'rb') as f:
                img_data = f.read()
                width, height = struct.unpack('>LL', img_data[16:24])
                self.assertEqual(int(width), RTE_THUMBNAIL_WIDTH_PX)
                self.assertEqual(int(height), RTE_THUMBNAIL_HEIGHT_PX)

    def test_default_rte_components_are_valid(self):
        """Test that the default RTE components are valid."""

        for component_id in feconf.ALLOWED_RTE_EXTENSIONS:
            # Check that the component id is valid.
            self.assertTrue(self._is_camel_cased(component_id))

            # Check that the component directory exists.
            component_dir = os.path.join(
                feconf.RTE_EXTENSIONS_DIR, component_id)
            self.assertTrue(os.path.isdir(component_dir))

            # In this directory there should be a config .py file, an
            # html file, a JS file, an icon .png file and a protractor.js file,
            # and an optional preview .png file.
            dir_contents = self._listdir_omit_ignored(component_dir)
            self.assertLessEqual(len(dir_contents), 5)

            directives_dir = os.path.join(component_dir, 'directives')
            py_file = os.path.join(component_dir, '%s.py' % component_id)
            png_file = os.path.join(component_dir, '%s.png' % component_id)
            preview_file = os.path.join(
                component_dir, '%sPreview.png' % component_id)
            protractor_file = os.path.join(component_dir, 'protractor.js')

            self.assertTrue(os.path.isdir(directives_dir))
            self.assertTrue(os.path.isfile(py_file))
            self.assertTrue(os.path.isfile(png_file))
            self.assertTrue(os.path.isfile(protractor_file))
            if len(dir_contents) == 5:
                self.assertTrue(os.path.isfile(preview_file))

            main_js_file = os.path.join(
                directives_dir, '%sDirective.js' % component_id)
            main_html_file = os.path.join(
                directives_dir, '%s_directive.html' % component_id.lower())

            self.assertTrue(os.path.isfile(main_js_file))
            self.assertTrue(os.path.isfile(main_html_file))

            js_file_content = utils.get_file_contents(main_js_file)
            self.assertIn(
                'oppiaNoninteractive%s' % component_id, js_file_content)
            self.assertNotIn('<script>', js_file_content)
            self.assertNotIn('</script>', js_file_content)

            component = rte_component_registry.Registry.get_rte_component(
                component_id)

            # Check that the specified component id is the same as the class
            # name.
            self.assertTrue(component_id, component.__class__.__name__)

            # Check that the configuration file contains the correct
            # top-level keys, and that these keys have the correct types.
            for item, item_type in _COMPONENT_CONFIG_SCHEMA:
                self.assertTrue(isinstance(
                    getattr(component, item), item_type))
                # The string attributes should be non-empty.
                if item_type == basestring:
                    self.assertTrue(getattr(component, item))

            self._validate_customization_arg_specs(
                component._customization_arg_specs)  # pylint: disable=protected-access

    def test_html_contains_all_imports(self):
        """Test that the rich_text_components.html contains script-imports for
        all directives of all RTE components."""

        js_files_paths = []
        for component_id in feconf.ALLOWED_RTE_EXTENSIONS:
            component_dir = os.path.join(
                feconf.RTE_EXTENSIONS_DIR, component_id)
            directives_dir = os.path.join(component_dir, 'directives')
            names = os.listdir(directives_dir)
            js_files_paths.extend(
                os.path.join(directives_dir, name) for name in names
                if name.endswith('.js'))

        rtc_html_file = os.path.join(
            feconf.FRONTEND_TEMPLATES_DIR, 'pages', 'rich_text_components.html')
        with open(rtc_html_file, 'r') as f:
            rtc_html_file_contents = f.read()

        for js_file_path in js_files_paths:
            self.assertIn(js_file_path, rtc_html_file_contents)
