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

import StringIO
import ast
import io
import sys
import tempfile

from core.tests import test_utils
from core.tests.data import unicode_and_str_handler
import python_utils


class PythonUtilsTests(test_utils.GenericTestBase):
    """Tests for feature detection utilities for Python 2 and Python 3."""

    def test_import_string_io(self):
        if sys.version[0] == '2':
            stdout = python_utils.import_string_io()
            self.assertIsInstance(stdout, StringIO.StringIO)
        else:
            stdout = python_utils.import_string_io()
            self.assertIsInstance(stdout, io.StringIO)

    def test_get_args_of_function(self):
        function_txt = b"""def _mock_function(arg1, arg2):
                      pass"""

        ast_node = ast.walk(ast.parse(function_txt))
        function_node = [n for n in ast_node if isinstance(n, ast.FunctionDef)]
        args_list = python_utils.get_args_of_function(function_node[0], [])
        self.assertEqual(args_list, ['arg1', 'arg2'])

    def test_open_file(self):
        with python_utils.open_file('scripts/python_utils.py', 'r') as f:
            file_content = f.readlines()
            self.assertIsNotNone(file_content)

    def test_can_not_open_file(self):
        with self.assertRaisesRegexp(
            IOError, 'Unable to open file: invalid_file.py'):
            with python_utils.open_file('invalid_file.py', 'r') as f:
                f.readlines()

    def test_unicode_and_str_chars_in_file(self):
        if sys.version[0] == '2':
            self.assertIsInstance(
                unicode_and_str_handler.SOME_STR_TEXT, unicode)
        else:
            self.assertIsInstance(
                unicode_and_str_handler.SOME_STR_TEXT, str)
        if sys.version[0] == '2':
            self.assertIsInstance(
                unicode_and_str_handler.SOME_UNICODE_TEXT, unicode)
        else:
            self.assertIsInstance(
                unicode_and_str_handler.SOME_UNICODE_TEXT, str)
        self.assertIsInstance(unicode_and_str_handler.SOME_BINARY_TEXT, bytes)
        if sys.version[0] == '2':
            with python_utils.open_file(
                'core/tests/data/unicode_and_str_handler.py', 'r') as f:
                file_content = f.read()
                self.assertIsInstance(file_content, unicode)
        else:
            with python_utils.open_file(
                'core/tests/data/unicode_and_str_handler.py', 'r') as f:
                file_content = f.read()
                self.assertIsInstance(file_content, str)

    def test_import_urlparse(self):
        import urlparse
        if sys.version[0] == '2':
            urlparse_variable = python_utils.import_urlparse()
            self.assertEqual(urlparse_variable, urlparse)
        else:
            import urllib.parse  # pylint: disable=import-error
            urlparse_variable = python_utils.import_urlparse()
            self.assertIsInstance(urlparse_variable, urllib.parse)

    def test_url_quote(self):
        self.assertEqual(python_utils.url_quote('/~connolly/'), '/%7Econnolly/')

    def test_url_encode(self):
        url_dict = {'url': 'http://myapp/my%20test/'}
        self.assertEqual(
            python_utils.url_encode(url_dict, True),
            'url=http%3A%2F%2Fmyapp%2Fmy%2520test%2F')
        self.assertEqual(
            python_utils.url_encode(url_dict, False),
            'url=http%3A%2F%2Fmyapp%2Fmy%2520test%2F')

    def test_url_retrieve(self):
        tmp_file = tempfile.NamedTemporaryFile()
        tmp_file.name = 'temp_file.txt'
        python_utils.url_retrieve(
            'http://www.google.com', filename='temp_file.txt')

        with python_utils.open_file('temp_file.txt', 'rb', encoding=None) as f:
            content = f.read()

        self.assertIn('<title>Google</title>', content)
        tmp_file.close()

    def test_url_open(self):
        response = python_utils.url_open('http://www.google.com')
        self.assertEqual(response.getcode(), 200)
        self.assertEqual(response.url, 'http://www.google.com')

    def test_url_request(self):
        response = python_utils.url_request('http://www.google.com')
        self.assertEqual(response.get_full_url(), 'http://www.google.com')
