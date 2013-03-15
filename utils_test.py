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

__author__ = 'Jeremy Emerson'

import test_utils
import utils


class UtilsTests(test_utils.AppEngineTestBase):
    """Test the core utility methods."""

    def test_create_enum_method(self):
        """Test create_enum method."""
        o = utils.create_enum('first', 'second', 'third')
        self.assertEqual(o.first, 'first')
        self.assertEqual(o.second, 'second')
        self.assertEqual(o.third, 'third')
        with self.assertRaises(AttributeError):
            o.fourth

    def test_get_js_controllers(self):
        """Test get_js_controllers method."""
        js_file = utils.get_js_controllers(['base', 'yamlEditor'])
        self.assertIn('Base', js_file)
        self.assertIn('function YamlEditor(', js_file)
        self.assertNotIn('function EditorExploration(', js_file)
