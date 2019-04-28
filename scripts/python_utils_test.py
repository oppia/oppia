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

from core.tests import test_utils

from . import python_utils


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
        with self.assertRaisesRegexp(IOError, 'No such file found:'):
            with python_utils.open_file('invalid_file.py', 'r') as f:
                f.readlines()
