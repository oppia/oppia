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
    ('backend_id', basestring), ('category', basestring),
    ('description', basestring), ('frontend_id', basestring),
    ('tooltip', basestring), ('icon_data_url', basestring),
    ('requires_fs', bool), ('is_block_element', bool),
    ('customization_arg_specs', list)]


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
                self.assertEqual(
                    ca_spec['default_value'],
                    obj_class.normalize(ca_spec['default_value']))

    def _listdir_omit_ignored(self, directory):
        """List all files and directories within 'directory', omitting the ones
        whose name ends in one of the IGNORED_FILE_SUFFIXES.
        """
        names = os.listdir(directory)
        for suffix in IGNORED_FILE_SUFFIXES:
            names = [name for name in names if not name.endswith(suffix)]
        return names

    def test_image_thumbnails_for_rte_components(self):
        """Test the thumbnails for the RTE component icons."""
        rte_components = (
            rte_component_registry.Registry.get_all_rte_components())
        for (component_name, component_specs) in rte_components.iteritems():
            generated_image_filepath = os.path.join(
                os.getcwd(), feconf.RTE_EXTENSIONS_DIR,
                component_name, '%s.png' % component_name)
            relative_icon_data_url = component_specs['icon_data_url'][1:]
            defined_image_filepath = os.path.join(
                os.getcwd(), feconf.EXTENSIONS_DIR_PREFIX,
                'extensions', relative_icon_data_url)
            self.assertEqual(generated_image_filepath, defined_image_filepath)

            with open(generated_image_filepath, 'rb') as f:
                img_data = f.read()
                width, height = struct.unpack('>LL', img_data[16:24])
                self.assertEqual(int(width), RTE_THUMBNAIL_WIDTH_PX)
                self.assertEqual(int(height), RTE_THUMBNAIL_HEIGHT_PX)

    def test_rte_components_are_valid(self):
        """Test that the default RTE components are valid."""

        rte_components = (
            rte_component_registry.Registry.get_all_rte_components())

        for (component_id, component_specs) in rte_components.iteritems():
            # Check that the component id is valid.
            self.assertTrue(self._is_camel_cased(component_id))

            # Check that the component directory exists.
            component_dir = os.path.join(
                feconf.RTE_EXTENSIONS_DIR, component_id)
            self.assertTrue(os.path.isdir(component_dir))

            # In this directory there should be a /directives directory, an
            # an icon .png file and a protractor.js file, and an optional
            # preview .png file.
            # In /directives directory should be HTML file, a JS file,
            # there could be multiple JS and HTML files.
            dir_contents = self._listdir_omit_ignored(component_dir)
            self.assertLessEqual(len(dir_contents), 4)

            directives_dir = os.path.join(component_dir, 'directives')
            png_file = os.path.join(component_dir, '%s.png' % component_id)
            protractor_file = os.path.join(component_dir, 'protractor.js')

            self.assertTrue(os.path.isdir(directives_dir))
            self.assertTrue(os.path.isfile(png_file))
            self.assertTrue(os.path.isfile(protractor_file))

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


            # Check that the configuration file contains the correct
            # top-level keys, and that these keys have the correct types.
            for item, item_type in _COMPONENT_CONFIG_SCHEMA:
                self.assertTrue(isinstance(
                    component_specs[item], item_type))
                # The string attributes should be non-empty.
                if item_type == basestring:
                    self.assertTrue(component_specs[item])

            self._validate_customization_arg_specs(
                component_specs['customization_arg_specs'])  # pylint: disable=protected-access

    def test_html_contains_all_imports(self):
        """Test that the rich_text_components.html file contains script-imports
        for all directives of all RTE components.
        """

        js_files_paths = []
        for component_id in feconf.ALLOWED_RTE_EXTENSIONS:
            component_dir = os.path.join(
                feconf.RTE_EXTENSIONS_DIR, component_id)
            directives_dir = os.path.join(component_dir, 'directives')
            directive_filenames = os.listdir(directives_dir)
            js_files_paths.extend(
                os.path.join(directives_dir, filename) for filename
                in directive_filenames if filename.endswith('.js'))

        js_files_paths.sort()
        prefix = '<script src="/'
        suffix = '"></script>'
        html_script_tags = [
            '%s%s%s' % (prefix, path, suffix) for path in js_files_paths]
        generated_html = '\n'.join(html_script_tags)

        rtc_html_file = os.path.join(
            feconf.FRONTEND_TEMPLATES_DIR, 'components',
            'rich_text_components.html')
        with open(rtc_html_file, 'r') as f:
            rtc_html_file_contents = f.read()

        self.assertEqual(generated_html, rtc_html_file_contents.strip())
