# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Tests the sample data."""

__author__ = 'Sean Lip'

import os
import re
import string

from core.domain import exp_services
from core.domain import obj_services
from core.domain import widget_registry
import feconf
import test_utils
import utils


class ExplorationDataUnitTests(test_utils.GenericTestBase):
    """Tests that all the default explorations are valid."""

    def test_default_explorations_are_valid(self):
        """Test the default explorations."""
        # Show full failure messages for this test (both the system-generated
        # one and the developer-specified one).
        self.longMessage = True

        exploration_data_paths = os.listdir(
            os.path.join(feconf.SAMPLE_EXPLORATIONS_DIR))

        self.assertTrue(feconf.DEMO_EXPLORATIONS,
                        msg='There must be at least one demo exploration.')

        derived_paths = [item[0] for item in feconf.DEMO_EXPLORATIONS]
        self.assertItemsEqual(exploration_data_paths, derived_paths,
                              msg='Files in data/explorations do not match '
                                  'the demo explorations in feconf.py.')

        for data_path in exploration_data_paths:
            full_path = os.path.join(feconf.SAMPLE_EXPLORATIONS_DIR, data_path)
            if full_path.endswith('yaml'):
                self.assertTrue(
                    os.path.isfile(full_path), msg='%s is not a file.'
                    % full_path)
            else:
                self.assertTrue(
                    os.path.isdir(full_path), msg='%s is not a directory.'
                    % full_path)

            # Convert each exploration into a dict, and verify it.
            # TODO(sll): Verify the assets, e.g. check that there are no
            # superfluous assets and that every asset that is expected by the
            # exploration exists.
            exploration_yaml, unused_assets = (
                exp_services.get_demo_exploration_components(data_path))
            exploration_dict = utils.dict_from_yaml(exploration_yaml)
            try:
                exp_services.verify_exploration_dict(exploration_dict)
            except Exception as e:
                raise Exception('%s: %s' % (full_path, e))


class WidgetDataUnitTests(test_utils.GenericTestBase):
    """Tests that all the default widgets are valid."""

    def is_camel_cased(self, name):
        """Check whether a name is in CamelCase."""
        return name and (name[0] in string.ascii_uppercase)

    def is_alphanumeric_string(self, string):
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
            self.assertTrue(self.is_camel_cased(widget_id))

            # Check that the widget directory exists.
            widget_dir = os.path.join(
                feconf.INTERACTIVE_WIDGETS_DIR, widget_id)
            self.assertTrue(os.path.isdir(widget_dir))

            # In this directory there should only be a config.yaml file, an
            # html entry-point file, a response.html file, (optionally) a
            # directory named 'static', (optionally) a response_iframe.html
            # file and (optionally) a stats_response.html file.
            dir_contents = os.listdir(widget_dir)
            self.assertLessEqual(len(dir_contents), 6)

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
                    widget_dir, 'response_iframe.html')))
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
                optional_dirs_and_files_count + 3, len(dir_contents),
                dir_contents
            )

            py_file = os.path.join(widget_dir, '%s.py' % widget_id)
            html_entry_point = os.path.join(widget_dir, '%s.html' % widget_id)
            response_template = os.path.join(widget_dir, 'response.html')

            self.assertTrue(os.path.isfile(py_file))
            self.assertTrue(os.path.isfile(html_entry_point))
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
                self.assertTrue(self.is_alphanumeric_string(param['name']))
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
