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

    def test_convert_to_js_string(self):
        """Test convert_to_js_string method."""
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
            self.assertEqual(utils.convert_to_js_string(tup[0]), tup[1])

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

    def test_parse_dict_with_params(self):
        """Test parse_dict_with_params method."""
        parsed_dict = utils.parse_dict_with_params({'a': 'b'}, {}, '')
        self.assertEqual(parsed_dict, {'a': '\\"b\\"'})

        parsed_dict = utils.parse_dict_with_params({'a': '{{b}}'}, {}, 'def')
        self.assertEqual(parsed_dict, {'a': '\\"def\\"'})

        parsed_dict = utils.parse_dict_with_params({'a': '{{b}}'}, {'b': 3}, '')
        self.assertEqual(parsed_dict, {'a': '\\"3\\"'})

        parsed_dict = utils.parse_dict_with_params(
            {'a': '{{b}}'}, {'b': 'c'}, '')
        self.assertEqual(parsed_dict, {'a': '\\"c\\"'})

        # Test that the original dictionary is unchanged.
        orig_dict = {'a': '{{b}}'}
        parsed_dict = utils.parse_dict_with_params(orig_dict, {'b': 'c'}, '')
        self.assertEqual(orig_dict, {'a': '{{b}}'})
        self.assertEqual(parsed_dict, {'a': '\\"c\\"'})

    def test_get_comma_sep_string_from_list(self):
        """Test get_comma_sep_string_from_list method."""
        alist = ['a', 'b', 'c', 'd']
        results = ['', 'a', 'a and b', 'a, b and c', 'a, b, c and d']

        for i in range(len(alist) + 1):
            comma_sep_string = utils.get_comma_sep_string_from_list(alist[:i])
            self.assertEqual(comma_sep_string, results[i])

    def test_to_ascii(self):
        """Test to_ascii method."""
        parsed_str = utils.to_ascii('abc')
        self.assertEqual(parsed_str, 'abc')

        parsed_str = utils.to_ascii(u'¡Hola!')
        self.assertEqual(parsed_str, 'Hola!')

        parsed_str = utils.to_ascii(
            u'Klüft skräms inför på fédéral électoral große')
        self.assertEqual(
            parsed_str, 'Kluft skrams infor pa federal electoral groe')

        parsed_str = utils.to_ascii('')
        self.assertEqual(parsed_str, '')

    def test_yaml_dict_conversion(self):
        """Test yaml_from_dict and dict_from_yaml methods."""
        test_dicts = [{}, {'a': 'b'}, {'a': 2}, {'a': ['b', 2, {'c': 3.5}]}]

        for adict in test_dicts:
            yaml_str = utils.yaml_from_dict(adict)
            yaml_dict = utils.dict_from_yaml(yaml_str)
            self.assertEqual(adict, yaml_dict)

        with self.assertRaises(utils.InvalidInputException):
            yaml_str = utils.dict_from_yaml('{')

    def test_normalize_classifier_return(self):
        """Test normalize_classifier_return method."""
        with self.assertRaises(utils.InvalidInputException):
            utils.normalize_classifier_return()
        with self.assertRaises(utils.InvalidInputException):
            utils.normalize_classifier_return(1, 2, 3)
        with self.assertRaises(AssertionError):
            utils.normalize_classifier_return(1)
        with self.assertRaises(AssertionError):
            utils.normalize_classifier_return(1, {'a': 'b'})
        with self.assertRaises(AssertionError):
            utils.normalize_classifier_return(True, 2)

        self.assertEqual(
            utils.normalize_classifier_return(True), (True, {}))
        self.assertEqual(
            utils.normalize_classifier_return(False), (False, {}))
        self.assertEqual(
            utils.normalize_classifier_return(
                False, {'a': 'b'}), (False, {'a': 'b'}))

    def test_recursively_remove_key(self):
        """Test recursively_remove_key method."""
        d = {'a': 'b'}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {})

        d = {}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {})

        d = {'a': 'b', 'c': 'd'}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {'c': 'd'})

        d = {'a': 'b', 'c': {'a': 'b'}}
        utils.recursively_remove_key(d, 'a')
        self.assertEqual(d, {'c': {}})

        d = ['a', 'b', {'c': 'd'}]
        utils.recursively_remove_key(d, 'c')
        self.assertEqual(d, ['a', 'b', {}])
