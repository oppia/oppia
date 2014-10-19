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

__author__ = 'Jeremy Emerson'

import os
import re
import string

from core.domain import dependency_registry
from core.domain import obj_services
from core.domain import widget_domain
from core.domain import widget_registry
from core.tests import test_utils
import feconf
import schema_utils
import schema_utils_test
import utils

# File names ending in any of these suffixes will be ignored when checking for
# widget validity.
IGNORED_FILE_SUFFIXES = ['.pyc', '.DS_Store']


class AnswerHandlerUnitTests(test_utils.GenericTestBase):
    """Test the AnswerHandler domain object."""

    def test_rules_property(self):
        """Test that answer_handler.rules behaves as expected."""
        answer_handler = widget_domain.AnswerHandler('submit', 'Null')
        self.assertEqual(answer_handler.name, 'submit')
        self.assertEqual(answer_handler.rules, [])

        answer_handler = widget_domain.AnswerHandler(
            'submit', 'NonnegativeInt')
        self.assertEqual(len(answer_handler.rules), 1)

        with self.assertRaisesRegexp(Exception, 'not a valid object class'):
            widget_domain.AnswerHandler('submit', 'FakeObjType')


class WidgetUnitTests(test_utils.GenericTestBase):
    """Test the widget domain object and registry."""

    def test_widget_properties(self):
        """Test the standard properties of widgets."""

        TEXT_INPUT_ID = 'TextInput'

        widget = widget_registry.Registry.get_widget_by_id(
            feconf.INTERACTIVE_PREFIX, TEXT_INPUT_ID)
        self.assertEqual(widget.id, TEXT_INPUT_ID)
        self.assertEqual(widget.name, 'Text')

        self.assertIn('id="interactiveWidget/TextInput"', widget.html_body)
        self.assertIn('id="response/TextInput"', widget.html_body)

        widget_dict = widget.to_dict()
        self.assertItemsEqual(widget_dict.keys(), [
            'widget_id', 'name', 'category', 'description',
            'handler_specs', 'customization_args'])
        self.assertEqual(widget_dict['widget_id'], TEXT_INPUT_ID)
        self.assertEqual(widget_dict['customization_args'], [{
            'name': 'placeholder',
            'description': 'The placeholder for the text input field.',
            'schema': {'type': 'unicode'},
            'default_value': 'Type your answer here.',
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


class WidgetDataUnitTests(test_utils.GenericTestBase):
    """Tests that all the default widgets are valid."""

    def _is_camel_cased(self, name):
        """Check whether a name is in CamelCase."""
        return name and (name[0] in string.ascii_uppercase)

    def _is_alphanumeric_string(self, string):
        """Check whether a string is alphanumeric."""
        return bool(re.compile("^[a-zA-Z0-9_]+$").match(string))

    def test_allowed_widgets(self):
        """Do sanity checks on the ALLOWED_WIDGETS dict in feconf.py."""
        widget_registries = [
            feconf.ALLOWED_WIDGETS[feconf.NONINTERACTIVE_PREFIX],
            feconf.ALLOWED_WIDGETS[feconf.INTERACTIVE_PREFIX]
        ]

        for registry in widget_registries:
            for (widget_name, definition) in registry.iteritems():
                contents = os.listdir(
                    os.path.join(os.getcwd(), definition['dir']))
                self.assertIn('%s.py' % widget_name, contents)

    def test_widget_counts(self):
        """Test that the correct number of widgets are loaded."""
        widget_registry.Registry.refresh()

        self.assertEqual(
            len(widget_registry.Registry.interactive_widgets),
            len(feconf.ALLOWED_WIDGETS[feconf.INTERACTIVE_PREFIX])
        )
        self.assertEqual(
            len(widget_registry.Registry.noninteractive_widgets),
            len(feconf.ALLOWED_WIDGETS[feconf.NONINTERACTIVE_PREFIX])
        )

    def test_image_data_urls_for_noninteractive_widgets(self):
        """Test the data urls for the noninteractive widget editor icons."""
        widget_registry.Registry.refresh()

        widget_list = widget_registry.Registry.noninteractive_widgets
        allowed_widgets = feconf.ALLOWED_WIDGETS[feconf.NONINTERACTIVE_PREFIX]
        for widget_name in allowed_widgets:
            image_filepath = os.path.join(
                os.getcwd(), allowed_widgets[widget_name]['dir'],
                '%s.png' % widget_name)
            self.assertEqual(
                utils.convert_png_to_data_url(image_filepath),
                widget_list[widget_name].icon_data_url
            )

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

    def _validate_widget_dependencies(self, dependency_ids):
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

    def test_default_noninteractive_widgets_are_valid(self):
        """Test that the default noninteractive widgets are valid."""
        noninteractive_bindings = (
            widget_registry.Registry.noninteractive_widgets)

        for widget_id in feconf.ALLOWED_WIDGETS[feconf.NONINTERACTIVE_PREFIX]:
            # Check that the widget_id name is valid.
            self.assertTrue(self._is_camel_cased(widget_id))

            # Check that the widget directory exists.
            widget_dir = os.path.join(
                feconf.NONINTERACTIVE_WIDGETS_DIR, widget_id)
            self.assertTrue(os.path.isdir(widget_dir))

            # In this directory there should be a config .py file, an
            # html file, a JS file, and a .png file.
            dir_contents = self._listdir_omit_ignored(widget_dir)
            self.assertLessEqual(len(dir_contents), 4)

            py_file = os.path.join(widget_dir, '%s.py' % widget_id)
            html_file = os.path.join(widget_dir, '%s.html' % widget_id)
            js_file = os.path.join(widget_dir, '%s.js' % widget_id)
            png_file = os.path.join(widget_dir, '%s.png' % widget_id)

            self.assertTrue(os.path.isfile(py_file))
            self.assertTrue(os.path.isfile(html_file))
            self.assertTrue(os.path.isfile(js_file))
            self.assertTrue(os.path.isfile(png_file))

            js_file_content = utils.get_file_contents(js_file)
            html_file_content = utils.get_file_contents(html_file)
            self.assertIn('oppiaNoninteractive%s' % widget_id, js_file_content)
            self.assertIn(
                '<script type="text/ng-template" '
                'id="noninteractiveWidget/%s"' % widget_id,
                html_file_content)
            self.assertNotIn('<script>', js_file_content)
            self.assertNotIn('</script>', js_file_content)

            WIDGET_CONFIG_SCHEMA = [
                ('name', basestring), ('category', basestring),
                ('description', basestring), ('_customization_arg_specs', list)
            ]

            widget = noninteractive_bindings[widget_id]

            # Check that the specified widget id is the same as the class name.
            self.assertTrue(widget_id, widget.__class__.__name__)

            # Check that the configuration file contains the correct
            # top-level keys, and that these keys have the correct types.
            for item, item_type in WIDGET_CONFIG_SCHEMA:
                self.assertTrue(isinstance(
                    getattr(widget, item), item_type
                ))
                # The string attributes should be non-empty.
                if item_type == basestring:
                    self.assertTrue(getattr(widget, item))

            self._validate_customization_arg_specs(
                widget._customization_arg_specs)

            self._validate_widget_dependencies(widget.dependency_ids)

    def test_default_interactive_widgets_are_valid(self):
        """Test that the default interactive widgets are valid."""
        interactive_bindings = widget_registry.Registry.interactive_widgets

        for widget_id in feconf.ALLOWED_WIDGETS[feconf.INTERACTIVE_PREFIX]:
            # Check that the widget_id name is valid.
            self.assertTrue(self._is_camel_cased(widget_id))

            # Check that the widget directory exists.
            widget_dir = os.path.join(
                feconf.INTERACTIVE_WIDGETS_DIR, widget_id)
            self.assertTrue(os.path.isdir(widget_dir))

            # In this directory there should only be a config .py file, an
            # html file, a JS file, (optionally) a directory named 'static',
            # (optionally) a widget JS test file, (optionally) a
            # stats_response.html file and (optionally) a protractor.js file.
            dir_contents = self._listdir_omit_ignored(widget_dir)

            optional_dirs_and_files_count = 0

            try:
                self.assertIn('static', dir_contents)
                static_dir = os.path.join(widget_dir, 'static')
                self.assertTrue(os.path.isdir(static_dir))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(
                    os.path.join(widget_dir, 'stats_response.html')))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    widget_dir, '%sSpec.js' % widget_id)))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

            try:
                self.assertTrue(os.path.isfile(os.path.join(
                    widget_dir, 'protractor.js')))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

            self.assertEqual(
                optional_dirs_and_files_count + 3, len(dir_contents),
                dir_contents
            )

            py_file = os.path.join(widget_dir, '%s.py' % widget_id)
            html_file = os.path.join(widget_dir, '%s.html' % widget_id)
            js_file = os.path.join(widget_dir, '%s.js' % widget_id)

            self.assertTrue(os.path.isfile(py_file))
            self.assertTrue(os.path.isfile(html_file))
            self.assertTrue(os.path.isfile(js_file))

            js_file_content = utils.get_file_contents(js_file)
            html_file_content = utils.get_file_contents(html_file)
            self.assertIn('oppiaInteractive%s' % widget_id, js_file_content)
            self.assertIn('oppiaResponse%s' % widget_id, js_file_content)
            self.assertIn(
                '<script type="text/ng-template" '
                'id="interactiveWidget/%s"' % widget_id,
                html_file_content)
            self.assertIn(
                '<script type="text/ng-template" id="response/%s"' % widget_id,
                html_file_content)
            self.assertNotIn('<script>', js_file_content)
            self.assertNotIn('</script>', js_file_content)

            WIDGET_CONFIG_SCHEMA = [
                ('name', basestring), ('category', basestring),
                ('description', basestring), ('_handlers', list),
                ('_customization_arg_specs', list)
            ]

            widget = interactive_bindings[widget_id]

            # Check that the specified widget id is the same as the class name.
            self.assertTrue(widget_id, widget.__class__.__name__)

            # Check that the configuration file contains the correct
            # top-level keys, and that these keys have the correct types.
            for item, item_type in WIDGET_CONFIG_SCHEMA:
                self.assertTrue(isinstance(
                    getattr(widget, item), item_type
                ))
                # The string attributes should be non-empty.
                if item_type == basestring:
                    self.assertTrue(getattr(widget, item))

            # Check that at least one handler exists.
            self.assertTrue(
                len(widget.handlers),
                msg='Widget %s has no handlers defined' % widget_id
            )

            for handler in widget._handlers:
                HANDLER_KEYS = ['name', 'obj_type']
                self.assertItemsEqual(HANDLER_KEYS, handler.keys())
                self.assertTrue(isinstance(handler['name'], basestring))
                # Check that the obj_type corresponds to a valid object class.
                obj_services.Registry.get_object_class_by_type(
                    handler['obj_type'])

            # Check that all handler names are unique.
            names = [handler.name for handler in widget.handlers]
            self.assertEqual(
                len(set(names)),
                len(names),
                'Widget %s has duplicate handler names' % widget_id
            )

            self._validate_customization_arg_specs(
                widget._customization_arg_specs)

            self._validate_widget_dependencies(widget.dependency_ids)
