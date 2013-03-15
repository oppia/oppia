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

        # Try the case where no controllers are needed.
        js_file = utils.get_js_controllers([])
        self.assertEqual(js_file, '')

    def test_parse_with_jinja(self):
        """Test parse_with_jinja method."""
        parsed_str = utils.parse_with_jinja('{{test}}', {'test': 'hi'})
        self.assertEqual(parsed_str, 'hi')

        # Some parameters are missing.
        parsed_str = utils.parse_with_jinja(
            '{{test}} and {{test2}}', {'test2': 'hi'})
        self.assertEqual(parsed_str, ' and hi')

        # All parameters are missing.
        parsed_str = utils.parse_with_jinja('{{test}} and {{test2}}', {})
        self.assertEqual(parsed_str, ' and ')

        # Default parameters are used.
        parsed_str = utils.parse_with_jinja('{{test}} and {{test2}}', {}, 'def')
        self.assertEqual(parsed_str, 'def and def')

        # The string has no parameters.
        parsed_str = utils.parse_with_jinja('no params', {'param': 'hi'})
        self.assertEqual(parsed_str, 'no params')

        # Integer parameters are used.
        parsed_str = utils.parse_with_jinja('int {{i}}', {'i': 2})
        self.assertEqual(parsed_str, 'int 2')

    def test_get_comma_sep_string_from_list(self):
        """Test get_comma_sep_string_from_list method."""
        alist = ['a', 'b', 'c', 'd']
        results = ['', 'a', 'a and b', 'a, b and c', 'a, b, c and d']

        for i in range(len(alist) + 1):
            comma_sep_string = utils.get_comma_sep_string_from_list(alist[:i])
            self.assertEqual(comma_sep_string, results[i])

    def test_encode_strings_as_ascii(self):
        """Test encode_strings_as_ascii method."""
        # Integers.
        o = utils.encode_strings_as_ascii(2)
        self.assertEqual(o, 2)
        self.assertNotEqual(o, '2')

        # Floats.
        o = utils.encode_strings_as_ascii(2.0)
        self.assertEqual(o, 2.0)
        self.assertNotEqual(o, '2')
        self.assertNotEqual(o, '2.0')

        # Strings.
        o = utils.encode_strings_as_ascii('a')
        self.assertEqual(o, 'a')
        self.assertIsInstance(o, str)

        # Unicode strings.
        o = utils.encode_strings_as_ascii(u'a')
        self.assertEqual(o, 'a')
        self.assertIsInstance(o, str)

        # TODO(sll): Add more tests here.