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

from core.domain import obj_services
from core.domain import widget_domain
from core.domain import widget_registry
from extensions.objects.models import objects
import feconf
import test_utils
import utils


class AnswerHandlerUnitTests(test_utils.GenericTestBase):
    """Test the AnswerHandler domain object."""

    def test_rules_property(self):
        """Test that answer_handler.rules behaves as expected."""
        answer_handler = widget_domain.AnswerHandler()
        self.assertEqual(answer_handler.name, 'submit')
        self.assertEqual(answer_handler.rules, [])

        answer_handler = widget_domain.AnswerHandler(
            input_type=objects.NonnegativeInt)
        self.assertEqual(len(answer_handler.rules), 1)


class WidgetUnitTests(test_utils.GenericTestBase):
    """Test the widget domain object and registry."""

    def test_parameterized_widget(self):
        """Test that parameterized widgets are correctly handled."""

        TEXT_INPUT_ID = 'TextInput'

        widget = widget_registry.Registry.get_widget_by_id(
            feconf.INTERACTIVE_PREFIX, TEXT_INPUT_ID)
        self.assertEqual(widget.id, TEXT_INPUT_ID)
        self.assertEqual(widget.name, 'Text input')

        self.assertIn('input ng-if="rows == 1"', widget.js_code)

        tag = widget.get_interactive_widget_tag({}, {})
        self.assertEqual(
            '<oppia-interactive-text-input '
            'placeholder-with-value="&#34;Type your answer here.&#34;" '
            'rows-with-value="1" columns-with-value="60">'
            '</oppia-interactive-text-input>', tag)

        tag = widget.get_interactive_widget_tag(
            {'placeholder': {'value': 'F4'}}, {})
        self.assertEqual(
            '<oppia-interactive-text-input '
            'placeholder-with-value="&#34;F4&#34;" rows-with-value="1" '
            'columns-with-value="60"></oppia-interactive-text-input>', tag)

        tag = widget.get_interactive_widget_tag(
            {'placeholder': {'value': '{{ntg}}', 'parse_with_jinja': True}},
            {'ntg': 'F4'})
        self.assertEqual(
            '<oppia-interactive-text-input '
            'placeholder-with-value="&#34;F4&#34;" rows-with-value="1" '
            'columns-with-value="60"></oppia-interactive-text-input>', tag)

        parameterized_widget_dict = widget.get_widget_instance_dict(
            {'placeholder': {'value': 'F4'}}, {}
        )
        self.assertItemsEqual(parameterized_widget_dict.keys(), [
            'widget_id', 'name', 'category', 'description', 'params',
            'handlers', 'customization_args', 'tag'])
        self.assertEqual(
            parameterized_widget_dict['widget_id'], TEXT_INPUT_ID)

        self.assertDictContainsSubset({
            'placeholder': {
                'value': 'F4',
                'description': 'The placeholder for the text input field.',
                'obj_type': 'UnicodeString',
                'generator_id': 'Copier',
                'init_args': {},
                'customization_args': {
                    'value': 'F4',
                }
            }
        }, parameterized_widget_dict['params'])

        self.assertDictContainsSubset({
            'placeholder': {
                'value': 'F4',
            }
        }, parameterized_widget_dict['customization_args'])


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

    def test_default_widgets_are_valid(self):
        """Test the default widgets."""
        bindings = widget_registry.Registry.interactive_widgets

        # TODO(sll): These tests ought to include non-interactive widgets as
        # well.

        for widget_id in feconf.ALLOWED_WIDGETS[feconf.INTERACTIVE_PREFIX]:
            # Check that the widget_id name is valid.
            self.assertTrue(self._is_camel_cased(widget_id))

            # Check that the widget directory exists.
            widget_dir = os.path.join(
                feconf.INTERACTIVE_WIDGETS_DIR, widget_id)
            self.assertTrue(os.path.isdir(widget_dir))

            # In this directory there should only be a config .py file, an
            # html file, a JS file, a response.html file, (optionally) a
            # directory named 'static' and (optionally) a stats_response.html
            # file.
            dir_contents = os.listdir(widget_dir)
            self.assertLessEqual(len(dir_contents), 7)

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
                    widget_dir, '%s.pyc' % widget_id)))
                optional_dirs_and_files_count += 1
            except Exception:
                pass

            self.assertEqual(
                optional_dirs_and_files_count + 4, len(dir_contents),
                dir_contents
            )

            py_file = os.path.join(widget_dir, '%s.py' % widget_id)
            html_entry_point = os.path.join(widget_dir, '%s.html' % widget_id)
            js_file = os.path.join(widget_dir, '%s.js' % widget_id)
            response_template = os.path.join(widget_dir, 'response.html')

            self.assertTrue(os.path.isfile(py_file))
            self.assertTrue(os.path.isfile(html_entry_point))
            self.assertTrue(os.path.isfile(js_file))
            self.assertTrue(os.path.isfile(response_template))

            WIDGET_CONFIG_SCHEMA = [
                ('name', basestring), ('category', basestring),
                ('description', basestring), ('_handlers', list),
                ('_params', list)
            ]

            widget = bindings[widget_id]

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
                HANDLER_KEYS = ['name', 'input_type']
                self.assertItemsEqual(HANDLER_KEYS, handler.keys())
                self.assertTrue(isinstance(handler['name'], basestring))
                # TODO(sll): Check that the input_type is either None or a
                # typed object.

            # Check that all handler names are unique.
            names = [handler.name for handler in widget.handlers]
            self.assertEqual(
                len(set(names)),
                len(names),
                'Widget %s has duplicate handler names' % widget_id
            )

            for param in widget._params:
                PARAM_KEYS = ['name', 'description', 'generator', 'init_args',
                              'customization_args', 'obj_type']
                for p in param:
                    self.assertIn(p, PARAM_KEYS)

                self.assertTrue(isinstance(param['name'], basestring))
                self.assertTrue(self._is_alphanumeric_string(param['name']))
                self.assertTrue(isinstance(param['description'], basestring))

                # Check that the parmaeter description is non-empty.
                self.assertTrue(param['description'])

                # TODO(sll): Check that the generator is a subclass of
                # BaseValueGenerator.

                self.assertTrue(isinstance(param['init_args'], dict))
                self.assertTrue(isinstance(param['customization_args'], dict))
                self.assertTrue(isinstance(param['obj_type'], basestring))

                # Ensure that this object type exists.
                obj_services.Registry.get_object_class_by_type(
                    param['obj_type'])

            # Check that the default customization args result in
            # parameters with the correct types.
            for param in widget.params:
                widget._get_widget_param_instances({}, {})
