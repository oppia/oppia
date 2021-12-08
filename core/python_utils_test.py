# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for feature detection utilities for Python 2 and Python 3."""

from __future__ import annotations

import ast
import builtins
import os
import sys
import unittest
import urllib

from core import python_utils
from core.tests import test_utils
from core.tests.data import unicode_and_str_handler


class PythonUtilsTests(test_utils.GenericTestBase):
    """Tests for feature detection utilities that are common for Python 2 and
    Python 3.
    """

    def test_get_args_of_function_node(self):
        function_txt = b"""def _mock_function(arg1, arg2):
                      pass"""

        ast_node = ast.walk(ast.parse(function_txt))
        function_node = [n for n in ast_node if isinstance(n, ast.FunctionDef)]
        args_list = python_utils.get_args_of_function_node(function_node[0], [])
        self.assertEqual(args_list, ['arg1', 'arg2'])

    def test_open_file(self):
        with python_utils.open_file(
                os.path.join('core', 'python_utils.py'), 'r'
        ) as f:
            file_content = f.readlines()
            self.assertIsNotNone(file_content)

    def test_can_not_open_file(self):
        with self.assertRaisesRegexp(
            IOError, 'Unable to open file: invalid_file.py'):
            with python_utils.open_file('invalid_file.py', 'r') as f:
                f.readlines()

    def test_divide(self):
        self.assertEqual(python_utils.divide(4, 2), 2)
        self.assertEqual(python_utils.divide(5, 2), 2)

    def test_url_unsplit(self):
        response = urllib.parse.urlsplit('http://www.google.com')
        self.assertEqual(
            python_utils.url_unsplit(response), 'http://www.google.com')

    def test_parse_query_string(self):
        response = python_utils.parse_query_string(
            'http://www.google.com?search=oppia')
        self.assertEqual(response, {'http://www.google.com?search': ['oppia']})

    def test_recursively_convert_to_str_with_dict(self):
        test_var_1_in_unicode = str('test_var_1')
        test_var_2_in_unicode = str('test_var_2')
        test_var_3_in_bytes = test_var_1_in_unicode.encode(encoding='utf-8')
        test_var_4_in_bytes = test_var_2_in_unicode.encode(encoding='utf-8')
        test_dict = {
            test_var_1_in_unicode: test_var_3_in_bytes,
            test_var_2_in_unicode: test_var_4_in_bytes
        }
        self.assertEqual(
            test_dict,
            {'test_var_1': b'test_var_1', 'test_var_2': b'test_var_2'})

        for key, val in test_dict.items():
            self.assertEqual(type(key), str)
            self.assertEqual(type(val), builtins.bytes)

        dict_in_str = python_utils._recursively_convert_to_str(test_dict)  # pylint: disable=protected-access
        self.assertEqual(
            dict_in_str,
            {'test_var_1': 'test_var_1', 'test_var_2': 'test_var_2'})

        for key, val in dict_in_str.items():
            self.assertEqual(type(key), str)
            self.assertEqual(type(val), str)

    def test_recursively_convert_to_str_with_nested_structure(self):
        test_var_1_in_unicode = str('test_var_1')
        test_list_1 = [
            test_var_1_in_unicode,
            test_var_1_in_unicode.encode(encoding='utf-8'),
            'test_var_2',
            b'test_var_3',
            {'test_var_4': b'test_var_5'}
        ]
        test_dict = {test_var_1_in_unicode: test_list_1}
        self.assertEqual(
            test_dict,
            {
                'test_var_1': [
                    'test_var_1', b'test_var_1', 'test_var_2', b'test_var_3',
                    {'test_var_4': b'test_var_5'}]
            }
        )

        dict_in_str = python_utils._recursively_convert_to_str(test_dict)  # pylint: disable=protected-access
        self.assertEqual(
            dict_in_str,
            {
                'test_var_1': [
                    'test_var_1', 'test_var_1', 'test_var_2', 'test_var_3',
                    {'test_var_4': 'test_var_5'}]
            }
        )

        for key, value in dict_in_str.items():
            self.assertNotEqual(type(key), builtins.bytes)
            self.assertTrue(isinstance(key, str))

            for item in value:
                self.assertNotEqual(type(item), builtins.bytes)
                self.assertTrue(isinstance(item, (str, bytes, dict)))

            for k, v in value[-1].items():
                self.assertEqual(type(k), str)
                self.assertEqual(type(v), str)

    def test_create_enum_method_and_check_its_values(self):
        """Test create_enum method."""
        enums = python_utils.create_enum('first', 'second', 'third')
        self.assertEqual(enums.first.value, 'first')
        self.assertEqual(enums.second.value, 'second')
        self.assertEqual(enums.third.value, 'third')

    def test_create_enum_method_and_check_its_names(self):
        """Test create_enum method."""
        enums = python_utils.create_enum('first', 'second', 'third')
        self.assertEqual(enums.first.name, 'first')
        self.assertEqual(enums.second.name, 'second')
        self.assertEqual(enums.third.name, 'third')

    def test_enum_for_invalid_attribute(self):
        enums = python_utils.create_enum('first', 'second', 'third')
        with self.assertRaisesRegexp(AttributeError, 'fourth'):
            getattr(enums, 'fourth')


@unittest.skipUnless(
    sys.version[0] == '3', 'Test cases for ensuring Python 3 behavior only')
class PythonUtilsForPython3Tests(test_utils.GenericTestBase):
    """Tests for feature detection utilities for Python 3."""

    def test_unicode_and_str_chars_in_file(self):
        self.assertIsInstance(unicode_and_str_handler.SOME_STR_TEXT, str)
        self.assertIsInstance(
            unicode_and_str_handler.SOME_UNICODE_TEXT, str)
        self.assertIsInstance(
            unicode_and_str_handler.SOME_BINARY_TEXT, bytes)

        with python_utils.open_file(
            'core/tests/data/unicode_and_str_handler.py', 'r') as f:
            file_content = f.read()
            self.assertIsInstance(file_content, str)
