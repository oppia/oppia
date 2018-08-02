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

# pylint: disable=relative-import

from core.tests import test_utils
import jinja_utils


class JinjaUtilsUnitTests(test_utils.GenericTestBase):

    def test_js_string_filter(self):
        """Test js_string filter."""
        expected_values = [
            ('a', '\\"a\\"'),
            (2, '2'),
            (5.5, '5.5'),
            ("'", '\\"\\\'\\"'),
            (u'¡Hola!', '\\"\\\\u00a1Hola!\\"'),
            (['a', '¡Hola!', 2], '[\\"a\\", \\"\\\\u00a1Hola!\\", 2]'),
            ({'a': 4, '¡Hola!': 2}, '{\\"a\\": 4, \\"\\\\u00a1Hola!\\": 2}'),
            ('', '\\"\\"'),
            (None, 'null'),
            (['a', {'b': 'c', 'd': ['e', None]}],
             '[\\"a\\", {\\"b\\": \\"c\\", \\"d\\": [\\"e\\", null]}]')
        ]

        for tup in expected_values:
            self.assertEqual(jinja_utils.JINJA_FILTERS['js_string'](
                tup[0]), tup[1])

    def test_parse_string(self):
        parsed_str = jinja_utils.parse_string('{{test}}', {'test': 'hi'})
        self.assertEqual(parsed_str, 'hi')

        # Some parameters are missing.
        parsed_str = jinja_utils.parse_string(
            '{{test}} and {{test2}}', {'test2': 'hi'})
        self.assertEqual(parsed_str, ' and hi')

        # All parameters are missing.
        parsed_str = jinja_utils.parse_string('{{test}} and {{test2}}', {})
        self.assertEqual(parsed_str, ' and ')

        # The string has no parameters.
        parsed_str = jinja_utils.parse_string('no params', {'param': 'hi'})
        self.assertEqual(parsed_str, 'no params')

        # Integer parameters are used.
        parsed_str = jinja_utils.parse_string('int {{i}}', {'i': 2})
        self.assertEqual(parsed_str, 'int 2')

    def test_evaluate_object(self):
        parsed_object = jinja_utils.evaluate_object('abc', {})
        self.assertEqual(parsed_object, 'abc')

        parsed_object = jinja_utils.evaluate_object('{{ab}}', {'ab': 'c'})
        self.assertEqual(parsed_object, 'c')

        parsed_object = jinja_utils.evaluate_object('abc{{ab}}', {'ab': 'c'})
        self.assertEqual(parsed_object, 'abcc')

        parsed_object = jinja_utils.evaluate_object(
            ['a', '{{a}}', 'a{{a}}'], {'a': 'b'})
        self.assertEqual(parsed_object, ['a', 'b', 'ab'])

        parsed_object = jinja_utils.evaluate_object({}, {})
        self.assertEqual(parsed_object, {})

        parsed_object = jinja_utils.evaluate_object({}, {'a': 'b'})
        self.assertEqual(parsed_object, {})

        parsed_object = jinja_utils.evaluate_object({'a': 'b'}, {})
        self.assertEqual(parsed_object, {'a': 'b'})

        parsed_object = jinja_utils.evaluate_object(
            {'a': 'a{{b}}'}, {'b': 'c'})
        self.assertEqual(parsed_object, {'a': 'ac'})

        parsed_object = jinja_utils.evaluate_object({'a': '{{b}}'}, {'b': 3})
        self.assertEqual(parsed_object, {'a': '3'})

        parsed_object = jinja_utils.evaluate_object({'a': '{{b}}'}, {'b': 'c'})
        self.assertEqual(parsed_object, {'a': 'c'})

        # Failure cases should be handled gracefully.
        parsed_object = jinja_utils.evaluate_object('{{c}}', {})
        self.assertEqual(parsed_object, '')

        parsed_object = jinja_utils.evaluate_object('{{c}}', {'a': 'b'})
        self.assertEqual(parsed_object, '')

        # Test that the original dictionary is unchanged.
        orig_dict = {'a': '{{b}}'}
        parsed_dict = jinja_utils.evaluate_object(orig_dict, {'b': 'c'})
        self.assertEqual(orig_dict, {'a': '{{b}}'})
        self.assertEqual(parsed_dict, {'a': 'c'})
