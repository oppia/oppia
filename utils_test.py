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


class UtilsTests(test_utils.GenericTestBase):
    """Test the core utility methods."""

    def test_create_enum_method(self):
        """Test create_enum method."""
        o = utils.create_enum('first', 'second', 'third')
        self.assertEqual(o.first, 'first')
        self.assertEqual(o.second, 'second')
        self.assertEqual(o.third, 'third')
        with self.assertRaises(AttributeError):
            o.fourth

    def evaluate_object_with_params(self):
        """Test evaluate_object_with_params method."""
        parsed_object = utils.evaluate_object_with_params('abc', {})
        self.assertEqual(parsed_object, 'abc')

        parsed_object = utils.evaluate_object_with_params(
            '{{ab}}', {'ab': 'c'})
        self.assertEqual(parsed_object, 'c')

        parsed_object = utils.evaluate_object_with_params(
            'abc{{ab}}', {'ab': 'c'})
        self.assertEqual(parsed_object, 'abc{{ab}}')

        parsed_object = utils.evaluate_object_with_params(
            ['a', '{{a}}', 'a{{a}}'], {'a': 'b'})
        self.assertEqual(parsed_object, ['a', 'b', 'a{{a}}'])

        parsed_object = utils.evaluate_object_with_params({}, {})
        self.assertEqual(parsed_object, {})

        parsed_object = utils.evaluate_object_with_params({}, {'a': 'b'})
        self.assertEqual(parsed_object, {})

        parsed_object = utils.evaluate_object_with_params({'a': 'b'}, {})
        self.assertEqual(parsed_object, {'a': 'b'})

        with self.assertRaises(KeyError):
            utils.evaluate_object_with_params('{{c}}', {})

        with self.assertRaises(KeyError):
            utils.evaluate_object_with_params('{{c}}', {'a': 'b'})

        parsed_object = utils.evaluate_object_with_params(
            {'a': '{{b}}'}, {'b': 3})
        self.assertEqual(parsed_object, {'a': 3})

        parsed_object = utils.evaluate_object_with_params(
            {'a': '{{b}}'}, {'b': 'c'})
        self.assertEqual(parsed_object, {'a': 'c'})

        # Test that the original dictionary is unchanged.
        orig_dict = {'a': '{{b}}'}
        parsed_dict = utils.evaluate_object_with_params(orig_dict, {'b': 'c'})
        self.assertEqual(orig_dict, {'a': '{{b}}'})
        self.assertEqual(parsed_dict, {'a': 'c'})

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
