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

"""Unit tests for core.domain.rte_component_registry."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import inspect
import os
import pkgutil
import re
import string
import struct

from constants import constants
from core.domain import obj_services
from core.domain import rte_component_registry
from core.tests import test_utils
import feconf
import python_utils
import schema_utils
import schema_utils_test
import utils

# File names ending in any of these suffixes will be ignored when checking for
# RTE component validity.
IGNORED_FILE_SUFFIXES = ['.pyc', '.DS_Store']
RTE_THUMBNAIL_HEIGHT_PX = 16
RTE_THUMBNAIL_WIDTH_PX = 16

_COMPONENT_CONFIG_SCHEMA = [
    ('backend_id', python_utils.BASESTRING),
    ('category', python_utils.BASESTRING),
    ('description', python_utils.BASESTRING),
    ('frontend_id', python_utils.BASESTRING),
    ('tooltip', python_utils.BASESTRING),
    ('icon_data_url', python_utils.BASESTRING),
    ('requires_fs', bool), ('is_block_element', bool),
    ('customization_arg_specs', list)]


class RteComponentUnitTests(test_utils.GenericTestBase):
    """Tests that all the default RTE components are valid."""

    def _is_camel_cased(self, name):
        """Check whether a name is in CamelCase."""
        return name and (name[0] in string.ascii_uppercase)

    def _is_alphanumeric_string(self, input_string):
        """Check whether a string is alphanumeric."""
        return bool(re.compile('^[a-zA-Z0-9_]+$').match(input_string))

    def _validate_customization_arg_specs(self, customization_arg_specs):
        """Validates the given customization arg specs."""
        for ca_spec in customization_arg_specs:
            self.assertEqual(set(ca_spec.keys()), set([
                'name', 'description', 'schema', 'default_value']))

            self.assertTrue(
                isinstance(ca_spec['name'], python_utils.BASESTRING))
            self.assertTrue(self._is_alphanumeric_string(ca_spec['name']))
            self.assertTrue(
                isinstance(ca_spec['description'], python_utils.BASESTRING))
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
                # Default value of SanitizedUrl obj_type may be empty. The empty
                # string is not considered valid for this object, so we don't
                # attempt to normalize it.
                if ca_spec['schema']['obj_type'] == 'SanitizedUrl':
                    self.assertEqual(ca_spec['default_value'], '')
                else:
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
        for (component_name, component_specs) in rte_components.items():
            generated_image_filepath = os.path.join(
                os.getcwd(), feconf.RTE_EXTENSIONS_DIR,
                component_name, '%s.png' % component_name)
            relative_icon_data_url = component_specs['icon_data_url'][1:]
            defined_image_filepath = os.path.join(
                os.getcwd(), feconf.EXTENSIONS_DIR_PREFIX,
                'extensions', relative_icon_data_url)
            self.assertEqual(generated_image_filepath, defined_image_filepath)

            with python_utils.open_file(
                generated_image_filepath, 'rb', encoding=None) as f:
                img_data = f.read()
                width, height = struct.unpack('>LL', img_data[16:24])
                self.assertEqual(int(width), RTE_THUMBNAIL_WIDTH_PX)
                self.assertEqual(int(height), RTE_THUMBNAIL_HEIGHT_PX)

    def test_rte_components_are_valid(self):
        """Test that the default RTE components are valid."""

        rte_components = (
            rte_component_registry.Registry.get_all_rte_components())

        for (component_id, component_specs) in rte_components.items():
            # Check that the component id is valid.
            hyphenated_component_id = utils.camelcase_to_hyphenated(
                component_id)
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

            main_ts_file = os.path.join(
                directives_dir, 'oppia-noninteractive-%s.directive.ts'
                % hyphenated_component_id)
            main_html_file = os.path.join(
                directives_dir, '%s.directive.html' % hyphenated_component_id)
            self.assertTrue(os.path.isfile(main_ts_file))
            self.assertTrue(os.path.isfile(main_html_file))

            ts_file_content = utils.get_file_contents(main_ts_file)
            self.assertIn(
                'oppiaNoninteractive%s' % component_id, ts_file_content)
            self.assertNotIn('<script>', ts_file_content)
            self.assertNotIn('</script>', ts_file_content)


            # Check that the configuration file contains the correct
            # top-level keys, and that these keys have the correct types.
            for item, item_type in _COMPONENT_CONFIG_SCHEMA:
                self.assertTrue(isinstance(
                    component_specs[item], item_type))
                # The string attributes should be non-empty.
                if item_type == python_utils.BASESTRING:
                    self.assertTrue(component_specs[item])

            self._validate_customization_arg_specs(
                component_specs['customization_arg_specs'])  # pylint: disable=protected-access

    def test_require_file_contains_all_imports(self):
        """Test that the rich_text_components.html file contains script-imports
        for all directives of all RTE components.
        """

        rtc_ts_filenames = []
        for component_id in feconf.ALLOWED_RTE_EXTENSIONS:
            component_dir = os.path.join(
                feconf.RTE_EXTENSIONS_DIR, component_id)
            directives_dir = os.path.join(component_dir, 'directives')
            directive_filenames = os.listdir(directives_dir)
            rtc_ts_filenames.extend(
                filename for filename
                in directive_filenames if filename.endswith('.ts'))

        rtc_ts_file = os.path.join(
            feconf.RTE_EXTENSIONS_DIR, 'richTextComponentsRequires.ts')
        with python_utils.open_file(rtc_ts_file, 'r') as f:
            rtc_require_file_contents = f.read()

        for rtc_ts_filename in rtc_ts_filenames:
            self.assertIn(rtc_ts_filename, rtc_require_file_contents)


class RteComponentRegistryUnitTests(test_utils.GenericTestBase):
    """Tests the methods in RteComponentRegistry."""

    def test_get_all_rte_components(self):
        """Test get_all_rte_components method."""
        obtained_components = list(
            rte_component_registry.Registry.get_all_rte_components().keys())
        actual_components = [name for name in os.listdir(
            './extensions/rich_text_components') if os.path.isdir(os.path.join(
                './extensions/rich_text_components', name))]

        self.assertEqual(set(obtained_components), set(actual_components))

    def test_get_tag_list_with_attrs(self):
        """Test get_tag_list_with_attrs method."""
        obtained_tag_list_with_attrs = (
            rte_component_registry.Registry.get_tag_list_with_attrs())
        actual_tag_list_with_attrs = {}
        component_specs = (
            rte_component_registry.Registry.get_all_rte_components())
        for component_spec in component_specs.values():
            tag_name = 'oppia-noninteractive-%s' % component_spec['frontend_id']
            attr_names = [
                '%s-with-value' % attr['name'] for attr in component_spec[
                    'customization_arg_specs']]
            actual_tag_list_with_attrs[tag_name] = attr_names
        self.assertEqual(
            set(obtained_tag_list_with_attrs.keys()),
            set(actual_tag_list_with_attrs.keys()))
        for key in obtained_tag_list_with_attrs:
            self.assertEqual(
                set(obtained_tag_list_with_attrs[key]),
                set(actual_tag_list_with_attrs[key]))

    def test_get_component_types_to_component_classes(self):
        """Test get_component_types_to_component_classes method."""
        component_types_to_component_classes = rte_component_registry.Registry.get_component_types_to_component_classes() # pylint: disable=line-too-long
        component_specs = (
            rte_component_registry.Registry.get_all_rte_components())

        obtained_component_tags = list(
            component_types_to_component_classes.keys())
        actual_component_tags = [
            'oppia-noninteractive-%s' % component_spec['frontend_id']
            for component_spec in component_specs.values()]
        self.assertEqual(
            set(obtained_component_tags), set(actual_component_tags))

        obtained_component_class_names = [
            component_class.__name__
            for component_class in list(
                component_types_to_component_classes.values())
        ]
        actual_component_class_names = []

        rte_path = [feconf.RTE_EXTENSIONS_DIR]

        for loader, name, _ in pkgutil.iter_modules(path=rte_path):
            if name == 'components':
                module = loader.find_module(name).load_module(name)
                break

        for name, obj in inspect.getmembers(module):
            if inspect.isclass(obj) and name != 'BaseRteComponent':
                actual_component_class_names.append(name)

        self.assertEqual(
            set(obtained_component_class_names),
            set(actual_component_class_names))

    def test_get_component_tag_names(self):
        """Test get_component_tag_names method."""
        component_specs = (
            rte_component_registry.Registry.get_all_rte_components())
        keys = ['is_block_element', 'is_complex']
        expected_values = [True, False]
        for key in keys:
            for expected_value in expected_values:
                actual_component_tag_names = [
                    'oppia-noninteractive-%s' % component_spec['frontend_id']
                    for component_spec in component_specs.values()
                    if component_spec[key] == expected_value]
                obtained_component_tag_names = (
                    rte_component_registry.Registry.get_component_tag_names(
                        key, expected_value))
                self.assertEqual(
                    set(actual_component_tag_names),
                    set(obtained_component_tag_names))

    def test_get_inline_component_tag_names(self):
        """Test get_inline_component_tag_names method."""
        component_specs = (
            rte_component_registry.Registry.get_all_rte_components())
        obtained_inline_component_tag_names = (
            rte_component_registry.Registry.get_inline_component_tag_names())

        actual_inline_component_tag_names = [
            'oppia-noninteractive-%s' % component_spec['frontend_id']
            for component_spec in component_specs.values()
            if not component_spec['is_block_element']]

        self.assertEqual(
            set(actual_inline_component_tag_names),
            set(obtained_inline_component_tag_names))

    def test_inline_rte_components_list(self):
        inline_component_tag_names = (
            rte_component_registry.Registry.get_inline_component_tag_names())
        inline_component_tag_names_from_constant = [
            'oppia-noninteractive-%s' % element_id
            for element_id in constants.INLINE_RTE_COMPONENTS]
        self.assertEqual(
            set(inline_component_tag_names),
            set(inline_component_tag_names_from_constant))

    def test_get_block_component_tag_names(self):
        """Test get_block_component_tag_names method."""
        component_specs = (
            rte_component_registry.Registry.get_all_rte_components())
        obtained_block_component_tag_names = (
            rte_component_registry.Registry.get_block_component_tag_names())

        actual_block_component_tag_names = [
            'oppia-noninteractive-%s' % component_spec['frontend_id']
            for component_spec in component_specs.values()
            if component_spec['is_block_element']]

        self.assertEqual(
            set(actual_block_component_tag_names),
            set(obtained_block_component_tag_names))

    def test_get_simple_component_tag_names(self):
        """Test get_simple_component_tag_names method."""
        component_specs = (
            rte_component_registry.Registry.get_all_rte_components())
        obtained_simple_component_tag_names = (
            rte_component_registry.Registry.get_simple_component_tag_names())

        actual_simple_component_tag_names = [
            'oppia-noninteractive-%s' % component_spec['frontend_id']
            for component_spec in component_specs.values()
            if not component_spec['is_complex']]

        self.assertEqual(
            set(actual_simple_component_tag_names),
            set(obtained_simple_component_tag_names))

    def test_get_complex_component_tag_names(self):
        """Test get_complex_component_tag_names method."""
        component_specs = (
            rte_component_registry.Registry.get_all_rte_components())
        obtained_complex_component_tag_names = (
            rte_component_registry.Registry.get_complex_component_tag_names())

        actual_complex_component_tag_names = [
            'oppia-noninteractive-%s' % component_spec['frontend_id']
            for component_spec in component_specs.values()
            if component_spec['is_complex']]

        self.assertEqual(
            set(actual_complex_component_tag_names),
            set(obtained_complex_component_tag_names))
