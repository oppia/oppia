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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import StringIO
import ast
import io
import sys
import tempfile
import unittest

from core.tests import test_utils
from core.tests.data import unicode_and_str_handler
import python_utils

import future  # isort:skip


class PythonUtilsTests(test_utils.GenericTestBase):
    """Tests for feature detection utilities that are common for Python 2 and
    Python 3.
    """

    def test_get_args_of_function(self):
        function_txt = b"""def _mock_function(arg1, arg2):
                      pass"""

        ast_node = ast.walk(ast.parse(function_txt))
        function_node = [n for n in ast_node if isinstance(n, ast.FunctionDef)]
        args_list = python_utils.get_args_of_function(function_node[0], [])
        self.assertEqual(args_list, ['arg1', 'arg2'])

    def test_open_file(self):
        with python_utils.open_file('python_utils.py', 'r') as f:
            file_content = f.readlines()
            self.assertIsNotNone(file_content)

    def test_can_not_open_file(self):
        with self.assertRaisesRegexp(
            IOError, 'Unable to open file: invalid_file.py'):
            with python_utils.open_file('invalid_file.py', 'r') as f:
                f.readlines()

    def test_url_quote(self):
        self.assertEqual(
            python_utils.url_quote(b'/~connolly/'), b'/%7Econnolly/')

    def test_url_encode(self):
        url_dict = {'url': 'http://myapp/my%20test/'}
        self.assertEqual(
            python_utils.url_encode(url_dict, doseq=True),
            'url=http%3A%2F%2Fmyapp%2Fmy%2520test%2F')
        self.assertEqual(
            python_utils.url_encode(url_dict, doseq=False),
            'url=http%3A%2F%2Fmyapp%2Fmy%2520test%2F')

    def test_url_retrieve(self):
        tmp_file = tempfile.NamedTemporaryFile()
        tmp_file.name = 'temp_file.txt'
        python_utils.url_retrieve(
            'http://www.google.com', filename='temp_file.txt')

        with python_utils.open_file('temp_file.txt', 'rb', encoding=None) as f:
            content = f.read()

        self.assertIn(b'<title>Google</title>', content)
        tmp_file.close()

    def test_url_open(self):
        response = python_utils.url_open('http://www.google.com')
        self.assertEqual(response.getcode(), 200)
        self.assertEqual(response.url, 'http://www.google.com')

    def test_url_request(self):
        response = python_utils.url_request('http://www.google.com', None, {})
        self.assertEqual(response.get_full_url(), 'http://www.google.com')

    def test_url_unquote_plus(self):
        self.assertEqual(
            python_utils.url_unquote_plus(b'/El+Ni%C3%B1o/'), b'/El Niño/')

    def test_divide(self):
        self.assertEqual(python_utils.divide(4, 2), 2)
        self.assertEqual(python_utils.divide(5, 2), 2)

    def test_with_metaclass(self):
        class BaseForm(python_utils.OBJECT):
            """Test baseclass."""
            pass

        class FormType1(type):
            """Test metaclass."""
            pass

        class FormType2(type):
            """Test metaclass."""
            pass

        class Form(python_utils.with_metaclass(FormType1, BaseForm)): # pylint: disable=inherit-non-class
            """Test class."""
            pass

        self.assertTrue(isinstance(Form, FormType1))
        self.assertFalse(isinstance(Form, FormType2))

    def test_convert_to_bytes(self):
        string1 = 'Home'
        string2 = u'Лорем'
        self.assertEqual(python_utils.convert_to_bytes(string1), string1)
        self.assertEqual(
            python_utils.convert_to_bytes(string2),
            string2.encode(encoding='utf-8'))

    def test_url_split(self):
        response = python_utils.url_split('http://www.google.com')
        self.assertEqual(response.geturl(), 'http://www.google.com')

    def test_url_unsplit(self):
        response = python_utils.url_split('http://www.google.com')
        self.assertEqual(
            python_utils.url_unsplit(response), 'http://www.google.com')

    def test_parse_query_string(self):
        response = python_utils.parse_query_string(
            'http://www.google.com?search=oppia')
        self.assertEqual(response, {'http://www.google.com?search': ['oppia']})

    def test_urllib_unquote(self):
        response = python_utils.urllib_unquote(b'/El%20Ni%C3%B1o/')
        self.assertEqual(response, b'/El Niño/')

    def test_url_parse(self):
        response = python_utils.url_parse('http://www.google.com')
        self.assertEqual(response.geturl(), 'http://www.google.com')

    def test_url_join(self):
        response = python_utils.url_join(
            'http://www.cwi.nl/%7Eguido/Python.html', 'FAQ.html')
        self.assertEqual(response, 'http://www.cwi.nl/%7Eguido/FAQ.html')

    def test_recursively_convert_to_str_with_dict(self):
        test_var_1_in_unicode = python_utils.UNICODE('test_var_1')
        test_var_2_in_unicode = python_utils.UNICODE('test_var_2')
        test_var_3_in_bytes = test_var_1_in_unicode.encode('utf-8')
        test_var_4_in_bytes = test_var_2_in_unicode.encode('utf-8')
        test_dict = {
            test_var_1_in_unicode: test_var_3_in_bytes,
            test_var_2_in_unicode: test_var_4_in_bytes
        }
        self.assertEqual(
            test_dict,
            {'test_var_1': b'test_var_1', 'test_var_2': b'test_var_2'})

        for key, val in test_dict.items():
            self.assertEqual(type(key), future.types.newstr)
            self.assertEqual(type(val), future.types.newbytes)

        dict_in_str = python_utils._recursively_convert_to_str(test_dict)  # pylint: disable=protected-access
        self.assertEqual(
            dict_in_str,
            {'test_var_1': 'test_var_1', 'test_var_2': 'test_var_2'})

        for key, val in dict_in_str.items():
            self.assertEqual(type(key), unicode)
            self.assertEqual(type(val), bytes)

    def test_recursively_convert_to_str_with_nested_structure(self):
        test_var_1_in_unicode = python_utils.UNICODE('test_var_1')
        test_list_1 = [
            test_var_1_in_unicode, test_var_1_in_unicode.encode('utf-8'),
            'test_var_2', b'test_var_3', {'test_var_4': b'test_var_5'}]
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
                    'test_var_1', b'test_var_1', 'test_var_2', 'test_var_3',
                    {'test_var_4': 'test_var_5'}]
            }
        )

        for key, value in dict_in_str.items():
            self.assertNotEqual(type(key), future.types.newstr)
            self.assertNotEqual(type(key), future.types.newbytes)
            self.assertTrue(isinstance(key, unicode))

            for item in value:
                self.assertNotEqual(type(item), future.types.newstr)
                self.assertNotEqual(type(item), future.types.newbytes)
                self.assertTrue(isinstance(item, (unicode, bytes, dict)))

            for k, v in value[-1].items():
                self.assertNotEqual(type(k), future.types.newstr)
                self.assertNotEqual(type(k), future.types.newbytes)
                self.assertNotEqual(type(v), future.types.newstr)
                self.assertNotEqual(type(v), future.types.newbytes)
                self.assertEqual(type(k), unicode)
                self.assertEqual(type(v), bytes)


@unittest.skipUnless(
    sys.version[0] == '2', 'Test cases for ensuring Python 2 behavior only')
class PythonUtilsForPython2Tests(test_utils.GenericTestBase):
    """Tests for feature detection utilities for Python 2."""

    def test_string_io(self):
        stdout = python_utils.string_io()
        self.assertIsInstance(stdout, StringIO.StringIO)

    def test_unicode_and_str_chars_in_file(self):
        self.assertIsInstance(
            unicode_and_str_handler.SOME_STR_TEXT, python_utils.UNICODE)
        self.assertIsInstance(
            unicode_and_str_handler.SOME_UNICODE_TEXT, python_utils.UNICODE)
        self.assertIsInstance(
            unicode_and_str_handler.SOME_BINARY_TEXT, bytes)

        with python_utils.open_file(
            'core/tests/data/unicode_and_str_handler.py', 'r') as f:
            file_content = f.read()
            self.assertIsInstance(file_content, python_utils.UNICODE)

@unittest.skipUnless(
    sys.version[0] == '3', 'Test cases for ensuring Python 3 behavior only')
class PythonUtilsForPython3Tests(test_utils.GenericTestBase):
    """Tests for feature detection utilities for Python 3."""

    def test_string_io(self):
        stdout = python_utils.string_io()
        self.assertIsInstance(stdout, io.StringIO)

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
