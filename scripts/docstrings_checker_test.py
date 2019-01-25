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

"""Unit tests for scripts/docstrings_checker."""

import unittest
import docstrings_checker # pylint: disable=relative-import


class ASTDocstringsCheckerTest(unittest.TestCase):
    """Class for testing the docstrings_checker script."""

    def test_build_regex_from_args_one_arg(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        args = ['arg_name0']
        expected_result = r'(Args:)[\S\s]*(arg_name0:)'
        result = docstring_checker.build_regex_from_args(args)
        self.assertEqual(result, expected_result)

    def test_build_regex_from_args_multiple_args(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        args = ['arg_name0', 'arg_name1']
        expected_result = r'(Args:)[\S\s]*(arg_name0:)[\S\s]*(arg_name1:)'
        result = docstring_checker.build_regex_from_args(args)
        self.assertEqual(result, expected_result)

    def test_build_regex_from_args_empty_list_returns_none(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        args = []
        expected_result = None
        result = docstring_checker.build_regex_from_args(args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_one_matching_arg_returns_empty_list(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name']
        docstring_args = """Description
            Args:
                arg_name: description
            """
        expected_result = []
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_no_colon_returns_error(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name']
        docstring_args = """Description
            Args:
                arg_name
            """
        expected_result = ['Arg not followed by colon: arg_name']
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_two_matching_ordered_args_success(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1', 'arg_name2']
        docstring_args = """Description
            Args:
                arg_name1: description,
                arg_name2: description
            """
        expected_result = []
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_empty_docstring_exits_without_error(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1']
        docstring_args = ''
        expected_result = []
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_no_arg_header_exits_without_error(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1']
        docstring_args = 'I only have a description.'
        expected_result = []
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_missing_arg_returns_arg(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1', 'arg_name2']
        docstring_args = """Description
            Args:
                arg_name1: description
            """
        expected_result = ['Arg missing from docstring: arg_name2']
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_missing_first_arg_returns_one_error(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1', 'arg_name2']
        docstring_args = """Description
            Args:
                arg_name2: description
            """
        expected_result = ['Arg missing from docstring: arg_name1']
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_misordered_args_returns_one_error(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1', 'arg_name2']
        docstring_args = """Description
            Args:
                arg_name2: description
                arg_name1: description
            """
        expected_result = ['Arg ordering error in docstring.']
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_mention_arg_without_colon_has_no_effect(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1', 'arg_name2']
        docstring_args = """Description
            Args:
                arg_name1: description involving arg_name2,
                arg_name2: description involving arg_name1
            """
        expected_result = []
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_arg_substring_not_confused(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['this_has_a_substring', 'intermediate_arg', 'substring']
        docstring_args = """Description
            Args:
                this_has_a_substring: description,
                intermediate_arg: description,
                substring: description
            """
        expected_result = []
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)

    def test_compare_arg_order_multi_line_descriptions_success(self):
        docstring_checker = docstrings_checker.ASTDocStringChecker()
        func_args = ['arg_name1', 'arg_name2']
        docstring_args = """Description
            Args:
                arg_name1: description that goes on for a
                    long time.
                arg_name2: description
            """
        expected_result = []
        result = docstring_checker.compare_arg_order(func_args, docstring_args)
        self.assertEqual(result, expected_result)
