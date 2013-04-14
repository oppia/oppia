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

import feconf
import test_utils
from models.types import get_object_class
import utils


class WidgetDataUnitTests(test_utils.AppEngineTestBase):
    """Tests that all the default widgets are valid."""

    def is_camel_cased(self, name):
        """Check whether a name is in CamelCase."""
        return name and (name[0] in string.ascii_uppercase)

    def is_alphanumeric_string(self, string):
        """Check whether a string is alphanumeric."""
        return bool(re.compile("^[a-zA-Z0-9]+$").match(string))

    def test_default_widgets(self):
        """Test the default widgets."""
        widget_ids = os.listdir(os.path.join(feconf.SAMPLE_WIDGETS_DIR))

        for widget_id in widget_ids:
            # Check that the widget_id name is valid.
            self.assertTrue(self.is_camel_cased(widget_id))

            # Check that the widget directory exists.
            widget_dir = os.path.join(feconf.SAMPLE_WIDGETS_DIR, widget_id)
            self.assertTrue(os.path.isdir(widget_dir))

            # In this directory there should only be a config.yaml file, an html
            # entry-point file, and (optionally) a directory named 'static'.
            dir_contents = os.listdir(widget_dir)
            self.assertLessEqual(len(dir_contents), 3)

            if len(dir_contents) == 3:
                self.assertIn('static', dir_contents)
                static_dir = os.path.join(widget_dir, 'static')
                self.assertTrue(os.path.isdir(static_dir))

            config_filepath = os.path.join(
                widget_dir, '%s.config.yaml' % widget_id)
            html_entry_point = os.path.join(widget_dir, '%s.html' % widget_id)

            self.assertTrue(os.path.isfile(config_filepath))
            self.assertTrue(os.path.isfile(html_entry_point))

            # Read the widget configuration from config.yaml.
            with open(config_filepath) as f:
                widget_config = utils.dict_from_yaml(f.read().decode('utf-8'))

            # Check that the configuration file contains the correct top-level
            # keys.
            TOP_LEVEL_KEYS = [
                'id', 'name', 'category', 'description', 'handlers', 'params']
            self.assertItemsEqual(TOP_LEVEL_KEYS, widget_config.keys())

            # Check that these keys have the correct types.
            self.assertTrue(isinstance(widget_config['id'], basestring))
            self.assertTrue(isinstance(widget_config['name'], basestring))
            self.assertTrue(isinstance(widget_config['category'], basestring))
            self.assertTrue(isinstance(
                widget_config['description'], basestring))
            self.assertTrue(isinstance(widget_config['handlers'], list))
            self.assertTrue(isinstance(widget_config['params'], list))

            # Check that the specified widget id is the same as the directory
            # name.
            self.assertTrue(widget_config['id'], widget_id)

            for handler in widget_config['handlers']:
                HANDLER_KEYS = ['name', 'classifier']
                self.assertItemsEqual(HANDLER_KEYS, handler.keys())
                self.assertTrue(isinstance(handler['name'], basestring))
                # The default classifier may be None (e.g. in the case of the
                # 'Continue' widget).
                if handler['classifier'] is not None:
                    self.assertTrue(isinstance(
                        handler['classifier'], basestring))
                    # Check that the classifier directory exists.
                    classifier_dir = os.path.join(
                        'data/classifiers', handler['classifier'])
                    self.assertTrue(
                        os.path.isdir(classifier_dir),
                        msg='Classifier %s does not exist' % classifier_dir)

            for param in widget_config['params']:
                PARAM_KEYS = ['name', 'description', 'obj_type', 'value']
                self.assertItemsEqual(PARAM_KEYS, param.keys())
                self.assertTrue(isinstance(param['name'], basestring))
                self.assertTrue(self.is_alphanumeric_string(param['name']))
                self.assertTrue(isinstance(param['description'], basestring))

                obj_class = get_object_class(param['obj_type'])
                self.assertIsNotNone(obj_class)
                obj_class.normalize(param['value'])
