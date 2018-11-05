# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

import unittest
import docstrings_checker # pylint: disable=relative-import


class ASTDocStringCheckerTest(unittest.TestCase):

    def test_parse_arg_list_from_docstring_empty_string_yield_empty_list(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        docstring = ''
        expected_result = []
        result = docstring_checker.parse_arg_list_from_docstring(docstring)
        self.assertEqual(result, expected_result)

    def test_parse_arg_list_from_docstring_one_arg_docstring_returns_arg(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        docstring = """This is what the function does.

                Args:
                    arg_name: type. Description here.
                """
        expected_result = ['arg_name']
        result = docstring_checker.parse_arg_list_from_docstring(docstring)
        self.assertEqual(result, expected_result)

    def test_parse_arg_list_from_docstring_returns_title_has_no_effect(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        docstring = """This is what the function does.

                Args:
                    arg_name: type. Description here.

                Returns:
                    looks_like_an_arg_name: but i am not one
                """
        expected_result = ['arg_name']
        result = docstring_checker.parse_arg_list_from_docstring(docstring)
        self.assertEqual(result, expected_result)

    def test_parse_arg_list_from_docstring_raises_title_has_no_effect(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        docstring = """This is what the function does.

                Args:
                    arg_name: type. Description here.

                Raises:
                    looks_like_an_arg_name: but i am not one
                """
        expected_result = ['arg_name']
        result = docstring_checker.parse_arg_list_from_docstring(docstring)
        self.assertEqual(result, expected_result)

    def test_parse_arg_list_from_docstring_no_colon_returns_empty_list(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        docstring = """Args:
                    arg_name and then no colon.
                """
        expected_result = []
        result = docstring_checker.parse_arg_list_from_docstring(docstring)
        self.assertEqual(result, expected_result)

    def test_parse_arg_list_from_docstring_no_heder_returns_empty_list(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        docstring = """arg_name: type. But there is no Arg title first.
                """
        expected_result = []
        result = docstring_checker.parse_arg_list_from_docstring(docstring)
        self.assertEqual(result, expected_result)


    def test_compare_arg_order_one_matching_arg_returns_empty_list(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name']
        docstring_args = ['arg_name']
        expected_result = []
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_two_matching_ordered_args_success(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1', 'arg_name2']
        docstring_args = ['arg_name1', 'arg_name2']
        expected_result = []
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_no_args_in_docstring_exits_without_error(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1']
        docstring_args = []
        expected_result = []
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_missing_arg_returns_arg(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1', 'arg_name2']
        docstring_args = ['arg_name1']
        expected_result = ['Arg missing from docstring: arg_name2']
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_missing_first_arg_returns_two_errors(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1', 'arg_name2']
        docstring_args = ['arg_name2']
        expected_result = ['Arg missing from docstring: arg_name1',
                           'Arg ordering error in docstring: arg_name2']
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_misordered_args_returns_two_errors(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1', 'arg_name2']
        docstring_args = ['arg_name2', 'arg_name1']
        expected_result = ['Arg ordering error in docstring: arg_name1',
                           'Arg ordering error in docstring: arg_name2']
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)
