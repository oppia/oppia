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
#
# For details on how to write such tests, please refer to
# https://github.com/oppia/oppia/wiki/Writing-Tests-For-Pylint

"""Unit tests for scripts/pylint_extensions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import tempfile
import unittest

import python_utils

from . import pylint_extensions

import astroid  # isort:skip
from pylint import testutils  # isort:skip
from pylint import lint  # isort:skip
from pylint import utils  # isort:skip


class ExplicitKeywordArgsCheckerTests(unittest.TestCase):

    def setUp(self):
        super(ExplicitKeywordArgsCheckerTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.ExplicitKeywordArgsChecker)
        self.checker_test_object.setup_method()

    def test_finds_non_explicit_keyword_args(self):
        (
            func_call_node_one, func_call_node_two, func_call_node_three,
            func_call_node_four, func_call_node_five, func_call_node_six,
            class_call_node) = astroid.extract_node(
                """
        class TestClass():
            pass

        def test(test_var_one, test_var_two=4, test_var_three=5,
                test_var_four="test_checker"):
            test_var_five = test_var_two + test_var_three
            return test_var_five

        def test_1(test_var_one, test_var_one):
            pass

        def test_2((a, b)):
            pass

        test(2, 5, test_var_three=6) #@
        test(2) #@
        test(2, 6, test_var_two=5, test_var_four="test_checker") #@
        max(5, 1) #@
        test_1(1, 2) #@
        test_2((1, 2)) #@

        TestClass() #@
        """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='non-explicit-keyword-args',
                node=func_call_node_one,
                args=(
                    '\'test_var_two\'',
                    'function',
                    'test'
                )
            ),
        ):
            self.checker_test_object.checker.visit_call(
                func_call_node_one)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_call(
                func_call_node_two)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='non-explicit-keyword-args',
                node=func_call_node_three,
                args=(
                    '\'test_var_three\'',
                    'function',
                    'test'
                )
            )
        ):
            self.checker_test_object.checker.visit_call(
                func_call_node_three)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_call(class_call_node)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_call(func_call_node_four)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_call(func_call_node_five)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_call(func_call_node_six)

    def test_finds_arg_name_for_non_keyword_arg(self):
        node_arg_name_for_non_keyword_arg = astroid.extract_node(
            """
            def test(test_var_one, test_var_two=4, test_var_three=5):
                test_var_five = test_var_two + test_var_three
                return test_var_five

            test(test_var_one=2, test_var_two=5) #@
            """)
        message = testutils.Message(
            msg_id='arg-name-for-non-keyword-arg',
            node=node_arg_name_for_non_keyword_arg,
            args=('\'test_var_one\'', 'function', 'test'))
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_call(
                node_arg_name_for_non_keyword_arg)

    def test_correct_use_of_keyword_args(self):
        node_with_no_error_message = astroid.extract_node(
            """
            def test(test_var_one, test_var_two=4, test_var_three=5):
                test_var_five = test_var_two + test_var_three
                return test_var_five

            test(2, test_var_two=2) #@
            """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_call(
                node_with_no_error_message)

    def test_function_with_args_and_kwargs(self):
        node_with_args_and_kwargs = astroid.extract_node(
            """
            def test_1(*args, **kwargs):
                pass

            test_1(first=1, second=2) #@
            """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_call(
                node_with_args_and_kwargs)

    def test_constructor_call_with_keyword_arguments(self):
        node_with_no_error_message = astroid.extract_node(
            """
            class TestClass():
                def __init__(self, first, second):
                    pass

            TestClass(first=1, second=2) #@
            """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_call(
                node_with_no_error_message)

    def test_register(self):
        pylinter_instance = lint.PyLinter()
        pylint_extensions.register(pylinter_instance)


class HangingIndentCheckerTests(unittest.TestCase):

    def setUp(self):
        super(HangingIndentCheckerTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.HangingIndentChecker)
        self.checker_test_object.setup_method()

    def test_no_break_after_hanging_indentation(self):
        node_break_after_hanging_indent = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""self.post_json('/ml/\\trainedclassifierhandler',
                self.payload, expect_errors=True, expected_status_int=401)
                if (a > 1 and
                        b > 2):
                """)
        node_break_after_hanging_indent.file = filename
        node_break_after_hanging_indent.path = filename

        self.checker_test_object.checker.process_tokens(
            utils.tokenize_module(node_break_after_hanging_indent))

        message = testutils.Message(
            msg_id='no-break-after-hanging-indent', line=1)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_no_break_after_hanging_indentation_with_comment(self):
        node_break_after_hanging_indent = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""self.post_json('/ml/\\trainedclassifierhandler',  # pylint: disable=invalid-name
                self.payload, expect_errors=True, expected_status_int=401)

                if (a > 1 and
                        b > 2):  # pylint: disable=invalid-name
                """)
        node_break_after_hanging_indent.file = filename
        node_break_after_hanging_indent.path = filename

        self.checker_test_object.checker.process_tokens(
            utils.tokenize_module(node_break_after_hanging_indent))

        message = testutils.Message(
            msg_id='no-break-after-hanging-indent', line=1)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_break_after_hanging_indentation(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""\"\"\"Some multiline
                docstring.
                \"\"\"
                # Load JSON.
                master_translation_dict = json.loads(
                utils.get_file_contents(os.path.join(
                os.getcwd(), 'assets', 'i18n', 'en.json')))
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_tokens(
            utils.tokenize_module(node_with_no_error_message))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_hanging_indentation_with_a_comment_after_bracket(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""self.post_json(  # pylint-disable=invalid-name
                '(',
                self.payload, expect_errors=True, expected_status_int=401)""")
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_tokens(
            utils.tokenize_module(node_with_no_error_message))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_hanging_indentation_with_a_comment_after_two_or_more_bracket(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""self.post_json(func(  # pylint-disable=invalid-name
                '(',
                self.payload, expect_errors=True, expected_status_int=401))""")
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_tokens(
            utils.tokenize_module(node_with_no_error_message))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()


class DocstringParameterCheckerTests(unittest.TestCase):

    def setUp(self):
        super(DocstringParameterCheckerTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DocstringParameterChecker)
        self.checker_test_object.setup_method()

    def test_no_newline_below_class_docstring(self):
        node_no_newline_below_class_docstring = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    class ClassName(dummy_class):
                        \"\"\"This is a docstring.\"\"\"
                        a = 1 + 2
                """)
        node_no_newline_below_class_docstring.file = filename
        node_no_newline_below_class_docstring.path = filename

        self.checker_test_object.checker.visit_classdef(
            node_no_newline_below_class_docstring)

        message = testutils.Message(
            msg_id='newline-below-class-docstring',
            node=node_no_newline_below_class_docstring)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_excessive_newline_below_class_docstring(self):
        node_excessive_newline_below_class_docstring = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'))
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    class ClassName(dummy_class):
                        \"\"\"This is a docstring.\"\"\"


                        a = 1 + 2
                """)
        node_excessive_newline_below_class_docstring.file = filename
        node_excessive_newline_below_class_docstring.path = filename

        self.checker_test_object.checker.visit_classdef(
            node_excessive_newline_below_class_docstring)

        message = testutils.Message(
            msg_id='newline-below-class-docstring',
            node=node_excessive_newline_below_class_docstring)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_inline_comment_after_class_docstring(self):
        node_inline_comment_after_class_docstring = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'))
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    class ClassName(dummy_class):
                        \"\"\"This is a docstring.\"\"\"
                        # This is a comment.
                        def func():
                            a = 1 + 2
                """)
        node_inline_comment_after_class_docstring.file = filename
        node_inline_comment_after_class_docstring.path = filename

        self.checker_test_object.checker.visit_classdef(
            node_inline_comment_after_class_docstring)

        message = testutils.Message(
            msg_id='newline-below-class-docstring',
            node=node_inline_comment_after_class_docstring)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_multiline_class_argument_with_incorrect_style(self):
        node_multiline_class_argument_with_incorrect_style = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'))
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    class ClassName(
                            dummy_class):
                        \"\"\"This is a docstring.\"\"\"
                        a = 1 + 2
                """)
        node_multiline_class_argument_with_incorrect_style.file = filename
        node_multiline_class_argument_with_incorrect_style.path = filename

        self.checker_test_object.checker.visit_classdef(
            node_multiline_class_argument_with_incorrect_style)

        message = testutils.Message(
            msg_id='newline-below-class-docstring',
            node=node_multiline_class_argument_with_incorrect_style)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()


    def test_multiline_class_argument_with_correct_style(self):
        node_multiline_class_argument_with_correct_style = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'))
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    class ClassName(
                            dummy_class):
                        \"\"\"This is a docstring.\"\"\"

                        a = 1 + 2
                """)
        node_multiline_class_argument_with_correct_style.file = filename
        node_multiline_class_argument_with_correct_style.path = filename

        self.checker_test_object.checker.visit_classdef(
            node_multiline_class_argument_with_correct_style)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_single_newline_below_class_docstring(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    class ClassName(dummy_class):
                        \"\"\"This is a multiline docstring.\"\"\"

                        a = 1 + 2
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.visit_classdef(
            node_with_no_error_message)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_class_with_no_docstring(self):
        node_class_with_no_docstring = astroid.scoped_nodes.Module(
            name='test',
            doc=None)
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    class ClassName(dummy_class):
                        a = 1 + 2
                """)
        node_class_with_no_docstring.file = filename
        node_class_with_no_docstring.path = filename

        self.checker_test_object.checker.visit_classdef(
            node_class_with_no_docstring)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_newline_before_docstring_with_correct_style(self):
        node_newline_before_docstring_with_correct_style = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'))
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    class ClassName(dummy_class):

                        \"\"\"This is a multiline docstring.\"\"\"

                        a = 1 + 2
                """)
        node_newline_before_docstring_with_correct_style.file = filename
        node_newline_before_docstring_with_correct_style.path = filename

        self.checker_test_object.checker.visit_classdef(
            node_newline_before_docstring_with_correct_style)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_newline_before_docstring_with_incorrect_style(self):
        node_newline_before_docstring_with_incorrect_style = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'))
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    class ClassName(dummy_class):

                        \"\"\"This is a multiline docstring.\"\"\"
                        a = 1 + 2
                """)
        node_newline_before_docstring_with_incorrect_style.file = filename
        node_newline_before_docstring_with_incorrect_style.path = filename

        self.checker_test_object.checker.visit_classdef(
            node_newline_before_docstring_with_incorrect_style)

        message = testutils.Message(
            msg_id='newline-below-class-docstring',
            node=node_newline_before_docstring_with_incorrect_style)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_malformed_args_section(self):
        node_malformed_args_section = astroid.extract_node(
            u"""def func(arg): #@
                \"\"\"Does nothing.

                Args:
                    arg: argument description.
                \"\"\"
                a = True
        """)

        message = testutils.Message(
            msg_id='malformed-args-section',
            node=node_malformed_args_section
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_malformed_args_section)

    def test_malformed_returns_section(self):
        node_malformed_returns_section = astroid.extract_node(
            u"""def func(): #@
                \"\"\"Return True.

                Returns:
                    arg: argument description.
                \"\"\"
                return True
        """)

        message = testutils.Message(
            msg_id='malformed-returns-section',
            node=node_malformed_returns_section
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_malformed_returns_section)

    def test_malformed_yields_section(self):
        node_malformed_yields_section = astroid.extract_node(
            u"""def func(): #@
                \"\"\"Yield true.

                Yields:
                    yields: argument description.
                \"\"\"
                yield True
        """)

        message = testutils.Message(
            msg_id='malformed-yields-section',
            node=node_malformed_yields_section
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_malformed_yields_section)

    def test_well_formated_args_section(self):
        node_with_no_error_message = astroid.extract_node(
            u"""def func(arg): #@
                \"\"\"Does nothing.

                Args:
                    arg: argument. description.
                \"\"\"
                a = True
        """)

        with self.checker_test_object.assertAddsMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_error_message)

    def test_well_formated_returns_section(self):
        node_with_no_error_message = astroid.extract_node(
            u"""def func(): #@
                \"\"\"Does nothing.

                Returns:
                    int. argument description.
                \"\"\"
                return args
        """)

        with self.checker_test_object.assertAddsMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_error_message)

    def test_well_formated_yields_section(self):
        node_with_no_error_message = astroid.extract_node(
            u"""def func(): #@
                \"\"\"Does nothing.

                Yields:
                    arg. argument description.
                \"\"\"
                yield args
        """)

        with self.checker_test_object.assertAddsMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_error_message)

    def test_space_after_docstring(self):
        node_space_after_docstring = astroid.extract_node(
            u"""def func():
                    \"\"\" Hello world.\"\"\"
                    Something
        """)

        message = testutils.Message(
            msg_id='space-after-triple-quote',
            node=node_space_after_docstring)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_space_after_docstring)

    def test_single_line_docstring_span_two_lines(self):
        node_single_line_docstring_span_two_lines = astroid.extract_node(
            u"""def func(): #@
                    \"\"\"This is a docstring.
                    \"\"\"
                    Something
        """)

        message = testutils.Message(
            msg_id='single-line-docstring-span-two-lines',
            node=node_single_line_docstring_span_two_lines)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_single_line_docstring_span_two_lines)

    def test_no_period_at_end(self):
        node_no_period_at_end = astroid.extract_node(
            u"""def func(): #@
                    \"\"\"This is a docstring\"\"\"
                    Something
        """)

        message = testutils.Message(
            msg_id='no-period-used',
            node=node_no_period_at_end)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_no_period_at_end)

    def test_empty_line_before_end_of_docstring(self):
        node_empty_line_before_end = astroid.extract_node(
            u"""def func(): #@
                    \"\"\"This is a docstring.

                    \"\"\"
                    Something
        """)

        message = testutils.Message(
            msg_id='empty-line-before-end', node=node_empty_line_before_end)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_empty_line_before_end)

    def test_no_period_at_end_of_a_multiline_docstring(self):
        node_no_period_at_end = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Args:
                            arg: variable. desciption
                    \"\"\"
                    Something
        """)

        message = testutils.Message(
            msg_id='no-period-used', node=node_no_period_at_end)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_no_period_at_end)

    def test_no_newline_at_end_of_multi_line_docstring(self):
        node_no_newline_at_end = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Args:
                            arg: variable. description.\"\"\"
                    Something
        """)

        message = testutils.Message(
            msg_id='no-newline-used-at-end', node=node_no_newline_at_end)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_no_newline_at_end)

    def test_no_newline_above_args(self):
        node_single_newline_above_args = astroid.extract_node(
            u"""def func(arg): #@
                \"\"\"Do something.
                Args:
                    arg: argument. description.
                \"\"\"
        """)

        message = testutils.Message(
            msg_id='single-space-above-args',
            node=node_single_newline_above_args)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_single_newline_above_args)


    def test_no_newline_above_raises(self):
        node_single_newline_above_raises = astroid.extract_node(
            u"""def func(): #@
                    \"\"\"Raises exception.
                    Raises:
                        raises_exception. description.
                    \"\"\"
                    raise exception
        """)

        message = testutils.Message(
            msg_id='single-space-above-raises',
            node=node_single_newline_above_raises
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_single_newline_above_raises)

    def test_no_newline_above_return(self):
        node_with_no_space_above_return = astroid.extract_node(
            u"""def func(): #@
                \"\"\"Returns something.
                Returns:
                    returns_something. description.
                \"\"\"
                return something
        """)

        message = testutils.Message(
            msg_id='single-space-above-returns',
            node=node_with_no_space_above_return
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_space_above_return)

    def test_varying_combination_of_newline_above_args(self):
        node_newline_above_args_raises = astroid.extract_node(
            u"""def func(arg): #@
                \"\"\"Raises exception.

                Args:
                    arg: argument. description.
                Raises:
                    raises_something. description.
                \"\"\"
                raise exception
        """)

        message = testutils.Message(
            msg_id='single-space-above-raises',
            node=node_newline_above_args_raises
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_newline_above_args_raises)


        node_newline_above_args_returns = astroid.extract_node(
            u"""def func(arg): #@
                \"\"\"Returns Something.

                Args:
                    arg: argument. description.
                Returns:
                    returns_something. description.
                \"\"\"
                return something
        """)

        message = testutils.Message(
            msg_id='single-space-above-returns',
            node=node_newline_above_args_returns
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_newline_above_args_returns)

        node_newline_above_returns_raises = astroid.extract_node(
            u"""def func(): #@
                \"\"\"Do something.



                Raises:
                    raises_exception: description.

                Returns:
                    returns_something. description.
                \"\"\"
                raise something
                return something
        """)

        message = testutils.Message(
            msg_id='single-space-above-raises',
            node=node_newline_above_returns_raises
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_newline_above_returns_raises)

    def test_excessive_newline_above_args(self):
        node_with_two_newline = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"Returns something.


                    Args:
                        arg: argument. This is  description.


                    Returns:
                        int. returns something.


                    Yields:
                        yield_something. description.
                    \"\"\"
                    return True
                    yield something
        """)

        message1 = testutils.Message(
            msg_id='single-space-above-args',
            node=node_with_two_newline
        )

        message2 = testutils.Message(
            msg_id='single-space-above-returns',
            node=node_with_two_newline
        )

        message3 = testutils.Message(
            msg_id='single-space-above-yield',
            node=node_with_two_newline
        )

        with self.checker_test_object.assertAddsMessages(
            message1, message2, message3):
            self.checker_test_object.checker.visit_functiondef(
                node_with_two_newline)

    def test_return_in_comment(self):
        node_with_return_in_comment = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"Returns something.

                    Args:
                        arg: argument. description.

                    Returns:
                        returns_something. description.
                    \"\"\"
                    "Returns: something"
                    return something
        """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_return_in_comment)

    def test_function_with_no_args(self):
        node_with_no_args = astroid.extract_node(
            u"""def func():
                \"\"\"Do something.\"\"\"

                a = 1 + 2
        """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_args)

    def test_well_placed_newline(self):
        node_with_no_error_message = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"Returns something.

                    Args:
                        arg: argument. This is description.

                    Returns:
                        returns_something. This is description.

                    Raises:
                        raises. something

                    Yield:
                        yield_something. This is description.
                    \"\"\"
                    raise something
                    yield something
                    return something
        """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_error_message)

    def test_invalid_parameter_indentation_in_docstring(self):
        raises_invalid_indentation_node = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Raises:
                        NoVariableException: variable.
                    \"\"\"
                    Something
        """)

        message = testutils.Message(
            msg_id='4-space-indentation-in-docstring',
            node=raises_invalid_indentation_node)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                raises_invalid_indentation_node)

        return_invalid_indentation_node = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Returns:
                        str. If :true,
                            individual key=value pairs.
                    \"\"\"
                    Something
        """)
        message = testutils.Message(
            msg_id='4-space-indentation-in-docstring',
            node=return_invalid_indentation_node)
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                return_invalid_indentation_node)

    def test_invalid_description_indentation_docstring(self):
        invalid_raises_description_indentation_node = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Raises:
                            AssertionError: if the
                            schema is not valid.
                    \"\"\"
                    Something
        """)

        message = testutils.Message(
            msg_id='8-space-indentation-in-docstring',
            node=invalid_raises_description_indentation_node)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                invalid_raises_description_indentation_node)

        invalid_return_description_indentation_node = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Returns:
                            str. If :true,
                                individual key=value pairs.
                    \"\"\"
                    return Something
        """)
        message = testutils.Message(
            msg_id='4-space-indentation-in-docstring',
            node=invalid_return_description_indentation_node)
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                invalid_return_description_indentation_node)

        invalid_yield_description_indentation_node = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Yields:
                            str. If :true,
                                incorrent indentation line.
                    \"\"\"
                    yield Something
        """)
        message = testutils.Message(
            msg_id='4-space-indentation-in-docstring',
            node=invalid_yield_description_indentation_node)
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                invalid_yield_description_indentation_node)

    def test_malformed_parameter_docstring(self):
        invalid_parameter_name = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Raises:
                            Incorrect-Exception: if the
                            schema is not valid.
                    \"\"\"
                    Something
        """)

        message = testutils.Message(
            msg_id='malformed-raises-section',
            node=invalid_parameter_name)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                invalid_parameter_name)

    def test_well_formed_single_line_docstring(self):
        node_with_no_error_message = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.\"\"\"
                    Something
        """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_error_message)

    def test_well_formed_multi_line_docstring(self):
        node_with_no_error_message = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Args:
                            arg: variable. description.
                    \"\"\"
                    Something
        """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_error_message)

    def test_well_formed_multi_line_description_docstring(self):
        node_with_no_error_message = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Args:
                            arg: bool. If true, individual key=value
                                pairs separated by '&' are
                                generated for each element of the value
                                sequence for the key.
                    \"\"\"
                    Something
        """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_error_message)

        node_with_no_error_message = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Raises:
                            doseq: bool. If true, individual
                                key=value pairs separated by '&' are
                                generated for each element of
                                the value sequence for the key
                                temp temp temp temp.
                            query: dict or tuple. The query to be encoded.
                    \"\"\"
                    Something
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_error_message)

        node_with_no_error_message = astroid.extract_node(
            u"""def func(arg):
                    \"\"\"This is a docstring.

                        Returns:
                            str. The string parsed using
                            Jinja templating. Returns an error
                            string in case of error in parsing.

                        Yields:
                            tuple. For ExplorationStatsModel,
                            a 2-tuple of the form (exp_id, value)
                            where value is of the form.
                    \"\"\"
                    if True:
                        return Something
                    else:
                        yield something
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_error_message)

        node_with_no_error_message = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Returns:
                            str. From this item there
                            is things:
                                Jinja templating. Returns an error
                            string in case of error in parsing.

                        Yields:
                            tuple. For ExplorationStatsModel:
                                {key
                                    (sym)
                                }
                    \"\"\"
                    if True:
                        return Something
                    else:
                        yield (a, b)
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_error_message)

    def test_checks_args_formatting_docstring(self):
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DocstringParameterChecker)
        self.checker_test_object.setup_method()
        invalid_args_description_node = astroid.extract_node(
            """
        def func(test_var_one, test_var_two): #@
            \"\"\"Function to test docstring parameters.

            Args:
                test_var_one: int. First test variable.
                test_var_two: str. Second test variable.
                Incorrect description indentation

            Returns:
                int. The test result.
            \"\"\"
            result = test_var_one + test_var_two
            return result
        """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='8-space-indentation-for-arg-in-descriptions-doc',
                node=invalid_args_description_node,
                args='Incorrect'
            ),
            testutils.Message(
                msg_id='malformed-args-section',
                node=invalid_args_description_node,
            )
        ):
            self.checker_test_object.checker.visit_functiondef(
                invalid_args_description_node)

        invalid_param_indentation_node = astroid.extract_node(
            """
        def func(test_var_one): #@
            \"\"\"Function to test docstring parameters.

            Args:
                 test_var_one: int. First test variable.

            Returns:
                int. The test result.
            \"\"\"
            result = test_var_one + test_var_two
            return result
        """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='4-space-indentation-for-arg-parameters-doc',
                node=invalid_param_indentation_node,
                args='test_var_one:'
            ),
        ):
            self.checker_test_object.checker.visit_functiondef(
                invalid_param_indentation_node)

        invalid_header_indentation_node = astroid.extract_node(
            """
        def func(test_var_one): #@
            \"\"\"Function to test docstring parameters.

             Args:
                 test_var_one: int. First test variable.

            Returns:
                int. The test result.
            \"\"\"
            result = test_var_one + test_var_two
            return result
        """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='incorrect-indentation-for-arg-header-doc',
                node=invalid_header_indentation_node,
            ),
        ):
            self.checker_test_object.checker.visit_functiondef(
                invalid_header_indentation_node)

    def test_correct_args_formatting_docstring(self):
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DocstringParameterChecker)
        self.checker_test_object.setup_method()
        valid_free_form_node = astroid.extract_node(
            """
        def func(test_var_one, test_var_two): #@
            \"\"\"Function to test docstring parameters.

            Args:
                test_var_one: int. First test variable.
                test_var_two: str. Second test variable:
                    Incorrect description indentation
                        {
                            key:
                        }

            Returns:
                int. The test result.
            \"\"\"
            result = test_var_one + test_var_two
            return result
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                valid_free_form_node)

        valid_indentation_node = astroid.extract_node(
            """
        def func(test_var_one, test_var_two): #@
            \"\"\"Function to test docstring parameters.

            Args:
                test_var_one: int. First test variable.
                test_var_two: str. Second test variable:
                    Correct indentaion.

            Returns:
                int. The test result.
            \"\"\"
            result = test_var_one + test_var_two
            return result
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                valid_indentation_node)

    def test_finds_docstring_parameter(self):
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DocstringParameterChecker)
        self.checker_test_object.setup_method()
        valid_func_node, valid_return_node = astroid.extract_node(
            """
        def test(test_var_one, test_var_two): #@
            \"\"\"Function to test docstring parameters.

            Args:
                test_var_one: int. First test variable.
                test_var_two: str. Second test variable.

            Returns:
                int. The test result.
            \"\"\"
            result = test_var_one + test_var_two
            return result #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(valid_func_node)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_return(valid_return_node)

        valid_func_node, valid_yield_node = astroid.extract_node(
            """
        def test(test_var_one, test_var_two): #@
            \"\"\"Function to test docstring parameters.\"\"\"
            result = test_var_one + test_var_two
            yield result #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(valid_func_node)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_yield(valid_yield_node)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_return(valid_yield_node)

        (
            missing_yield_type_func_node,
            missing_yield_type_yield_node) = astroid.extract_node(
                """
        class Test(python_utils.OBJECT):
            def __init__(self, test_var_one, test_var_two): #@
                \"\"\"Function to test docstring parameters.

                Args:
                    test_var_one: int. First test variable.
                    test_var_two: str. Second test variable.

                Returns:
                    int. The test result.
                \"\"\"
                result = test_var_one + test_var_two
                yield result #@
        """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='redundant-returns-doc',
                node=missing_yield_type_func_node
            ),
        ):
            self.checker_test_object.checker.visit_functiondef(
                missing_yield_type_func_node)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='missing-yield-doc',
                node=missing_yield_type_func_node
            ), testutils.Message(
                msg_id='missing-yield-type-doc',
                node=missing_yield_type_func_node
            ),
        ):
            self.checker_test_object.checker.visit_yieldfrom(
                missing_yield_type_yield_node)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_return(
                missing_yield_type_yield_node)

        (
            missing_return_type_func_node,
            missing_return_type_return_node) = astroid.extract_node(
                """
        class Test(python_utils.OBJECT):
            def __init__(self, test_var_one, test_var_two): #@
                \"\"\"Function to test docstring parameters.

                Args:
                    test_var_one: int. First test variable.
                    test_var_two: str. Second test variable.

                Yields:
                    int. The test result.
                \"\"\"
                result = test_var_one + test_var_two
                return result #@
        """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='redundant-yields-doc',
                node=missing_return_type_func_node
            ),
        ):
            self.checker_test_object.checker.visit_functiondef(
                missing_return_type_func_node)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='missing-return-doc',
                node=missing_return_type_func_node
            ), testutils.Message(
                msg_id='missing-return-type-doc',
                node=missing_return_type_func_node
            ),
        ):
            self.checker_test_object.checker.visit_return(
                missing_return_type_return_node)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_yield(
                missing_return_type_return_node)

        valid_raise_node = astroid.extract_node(
            """
        def func(test_var_one, test_var_two):
            \"\"\"Function to test docstring parameters.

            Args:
                test_var_one: int. First test variable.
                test_var_two: str. Second test variable.

            Raises:
                Exception: An exception.
            \"\"\"
            raise Exception #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        (
            missing_raise_type_func_node,
            missing_raise_type_raise_node) = astroid.extract_node(
                """
        def func(test_var_one, test_var_two): #@
            \"\"\"Function to test raising exceptions.

            Args:
                test_var_one: int. First test variable.
                test_var_two: str. Second test variable.
            \"\"\"
            raise Exception #@
        """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='missing-raises-doc',
                args=('Exception',),
                node=missing_raise_type_func_node
            ),
        ):
            self.checker_test_object.checker.visit_raise(
                missing_raise_type_raise_node)

        valid_raise_node = astroid.extract_node(
            """
        class Test(python_utils.OBJECT):
            raise Exception #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_raise_node = astroid.extract_node(
            """
        class Test():
            @property
            def decorator_func(self):
                pass

            @decorator_func.setter
            @property
            def func(self):
                raise Exception #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_raise_node = astroid.extract_node(
            """
        class Test():
            def func(self):
                raise Exception #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_raise_node = astroid.extract_node(
            """
        def func():
            try:
                raise Exception #@
            except Exception:
                pass
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_raise_node = astroid.extract_node(
            """
        def func():
            \"\"\"Function to test raising exceptions.\"\"\"
            raise Exception #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_raise_node = astroid.extract_node(
            """
        def my_func(self):
            \"\"\"This is a docstring.
            :raises NameError: Never.
            \"\"\"
            def ex_func(val):
                return RuntimeError(val)
            raise ex_func('hi') #@
            raise NameError('hi')
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_raise_node = astroid.extract_node(
            """
        from unknown import Unknown
        def my_func(self):
            \"\"\"This is a docstring.
            :raises NameError: Never.
            \"\"\"
            raise Unknown('hi') #@
            raise NameError('hi')
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_raise_node = astroid.extract_node(
            """
        def my_func(self):
            \"\"\"This is a docstring.
            :raises NameError: Never.
            \"\"\"
            def ex_func(val):
                def inner_func(value):
                    return OSError(value)
                return RuntimeError(val)
            raise ex_func('hi') #@
            raise NameError('hi')
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_return_node = astroid.extract_node(
            """
        def func():
            \"\"\"Function to test return values.\"\"\"
            return None #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_return(valid_return_node)

        valid_return_node = astroid.extract_node(
            """
        def func():
            \"\"\"Function to test return values.\"\"\"
            return #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_return(valid_return_node)

        missing_param_func_node = astroid.extract_node(
            """
        def func(test_var_one, test_var_two, *args, **kwargs): #@
            \"\"\"Function to test docstring parameters.

            Args:
                test_var_one: int. First test variable.
                test_var_two: str. Second test variable.

            Returns:
                int. The test result.
            \"\"\"
            result = test_var_one + test_var_two
            return result
        """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='missing-param-doc',
                node=missing_param_func_node,
                args=('args, kwargs',),
            ),
        ):
            self.checker_test_object.checker.visit_functiondef(
                missing_param_func_node)

        missing_param_func_node = astroid.extract_node(
            """
        def func(test_var_one, test_var_two): #@
            \"\"\"Function to test docstring parameters.

            Args:
                test_var_one: int. First test variable.
                invalid_var_name: str. Second test variable.

            Returns:
                int. The test result.
            \"\"\"
            result = test_var_one + test_var_two
            return result
        """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='missing-param-doc',
                node=missing_param_func_node,
                args=('test_var_two',),
            ), testutils.Message(
                msg_id='missing-type-doc',
                node=missing_param_func_node,
                args=('test_var_two',),
            ), testutils.Message(
                msg_id='differing-param-doc',
                node=missing_param_func_node,
                args=('invalid_var_name',),
            ), testutils.Message(
                msg_id='differing-type-doc',
                node=missing_param_func_node,
                args=('invalid_var_name',),
            ),
            testutils.Message(
                msg_id='8-space-indentation-for-arg-in-descriptions-doc',
                node=missing_param_func_node,
                args='invalid_var_name:'
            ),
        ):
            self.checker_test_object.checker.visit_functiondef(
                missing_param_func_node)

        class_node, multiple_constructor_func_node = astroid.extract_node(
            """
        class Test(): #@
            \"\"\"Function to test docstring parameters.

            Args:
                test_var_one: int. First test variable.
                test_var_two: str. Second test variable.

            Returns:
                int. The test result.
            \"\"\"

            def __init__(self, test_var_one, test_var_two): #@
                \"\"\"Function to test docstring parameters.

                Args:
                    test_var_one: int. First test variable.
                    test_var_two: str. Second test variable.

                Returns:
                    int. The test result.
                \"\"\"
                result = test_var_one + test_var_two
                return result
        """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='multiple-constructor-doc',
                node=class_node,
                args=(class_node.name,),
            ),
        ):
            self.checker_test_object.checker.visit_functiondef(
                multiple_constructor_func_node)

    def test_visit_raise_warns_unknown_style(self):
        self.checker_test_object.checker.config.accept_no_raise_doc = False
        node = astroid.extract_node(
            """
        def my_func(self):
            \"\"\"This is a docstring.\"\"\"
            raise RuntimeError('hi')
        """)
        raise_node = node.body[0]
        func_node = raise_node.frame()
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='missing-raises-doc',
                args=('RuntimeError',),
                node=func_node
            ),
        ):
            self.checker_test_object.checker.visit_raise(raise_node)


class ImportOnlyModulesCheckerTests(unittest.TestCase):

    def test_finds_import_from(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.ImportOnlyModulesChecker)
        checker_test_object.setup_method()
        importfrom_node1 = astroid.extract_node(
            """
            from os import path #@
            import sys
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_importfrom(importfrom_node1)

        importfrom_node2 = astroid.extract_node(
            """
            from os import error #@
            import sys
        """)
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='import-only-modules',
                node=importfrom_node2,
                args=('error', 'os')
            ),
        ):
            checker_test_object.checker.visit_importfrom(
                importfrom_node2)

        importfrom_node3 = astroid.extract_node(
            """
            from invalid_module import invalid_module #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_importfrom(importfrom_node3)

        importfrom_node4 = astroid.extract_node(
            """
            from constants import constants #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_importfrom(importfrom_node4)

        importfrom_node5 = astroid.extract_node(
            """
            from os import invalid_module #@
        """)
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='import-only-modules',
                node=importfrom_node5,
                args=('invalid_module', 'os')
            ),
        ):
            checker_test_object.checker.visit_importfrom(importfrom_node5)

        importfrom_node6 = astroid.extract_node(
            """
            from .constants import constants #@
        """, module_name='.constants')
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_importfrom(importfrom_node6)


class BackslashContinuationCheckerTests(unittest.TestCase):

    def test_finds_backslash_continuation(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.BackslashContinuationChecker)
        checker_test_object.setup_method()
        node = astroid.scoped_nodes.Module(name='test', doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""message1 = 'abc'\\\n""" # pylint: disable=backslash-continuation
                """'cde'\\\n"""             # pylint: disable=backslash-continuation
                """'xyz'
                message2 = 'abc\\\\'
                message3 = (
                    'abc\\\\'
                    'xyz\\\\'
                )
                """)

        node.file = filename
        node.path = filename

        checker_test_object.checker.process_module(node)

        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='backslash-continuation',
                line=1
            ),
            testutils.Message(
                msg_id='backslash-continuation',
                line=2
            ),
        ):
            temp_file.close()


class FunctionArgsOrderCheckerTests(unittest.TestCase):

    def test_finds_function_def(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.FunctionArgsOrderChecker)
        checker_test_object.setup_method()
        functiondef_node1 = astroid.extract_node(
            """
        def test(self,test_var_one, test_var_two): #@
            result = test_var_one + test_var_two
            return result
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_functiondef(functiondef_node1)

        functiondef_node2 = astroid.extract_node(
            """
        def test(test_var_one, test_var_two, self): #@
            result = test_var_one + test_var_two
            return result
        """)
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='function-args-order-self',
                node=functiondef_node2
            ),
        ):
            checker_test_object.checker.visit_functiondef(functiondef_node2)

        functiondef_node3 = astroid.extract_node(
            """
        def test(test_var_one, test_var_two, cls): #@
            result = test_var_one + test_var_two
            return result
        """)
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='function-args-order-cls',
                node=functiondef_node3
            ),
        ):
            checker_test_object.checker.visit_functiondef(functiondef_node3)


class RestrictedImportCheckerTests(unittest.TestCase):

    def test_detect_restricted_import(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.RestrictedImportChecker)
        checker_test_object.setup_method()

        # Tests the case wherein storage layer imports domain layer
        # in import statements.
        node_err_import = astroid.extract_node(
            """
            import core.domain.activity_domain #@
        """)
        node_err_import.root().name = 'oppia.core.storage.topic'
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_err_import,
                args=('domain', 'storage'),
            ),
        ):
            checker_test_object.checker.visit_import(node_err_import)

        # Tests the case wherein storage layer does not import domain layer
        # in import statements.
        node_no_err_import = astroid.extract_node(
            """
            import core.platform.email.mailgun_email_services #@
        """)
        node_no_err_import.root().name = 'oppia.core.storage.topic'
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_import(node_no_err_import)

        # Tests the case wherein storage layer imports domain layer
        # in import-from statements.
        node_err_importfrom = astroid.extract_node(
            """
            from core.domain import activity_domain #@
        """)
        node_err_importfrom.root().name = 'oppia.core.storage.topic'
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_err_importfrom,
                args=('domain', 'storage'),
            )
        ):
            checker_test_object.checker.visit_importfrom(node_err_importfrom)

        # Tests the case wherein storage layer does not import domain layer
        # in import-from statements.
        node_no_err_importfrom = astroid.extract_node(
            """
            from core.platform.email import mailgun_email_services #@
        """)
        node_no_err_importfrom.root().name = 'oppia.core.storage.topicl'
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_importfrom(node_no_err_importfrom)

        # Tests the case wherein domain layer imports controller layer
        # in import statements.
        node_err_import = astroid.extract_node(
            """
            import core.controllers.acl_decorators #@
        """)
        node_err_import.root().name = 'oppia.core.domain'
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_err_import,
                args=('controller', 'domain'),
            ),
        ):
            checker_test_object.checker.visit_import(node_err_import)

        # Tests the case wherein domain layer does not import controller layer
        # in import statements.
        node_no_err_import = astroid.extract_node(
            """
            import core.platform.email.mailgun_email_services_test #@
        """)
        node_no_err_import.root().name = 'oppia.core.domain'
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_import(node_no_err_import)

        # Tests the case wherein domain layer imports controller layer
        # in import-from statements.
        node_err_importfrom = astroid.extract_node(
            """
            from core.controllers import acl_decorators #@
        """)
        node_err_importfrom.root().name = 'oppia.core.domain'
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_err_importfrom,
                args=('controller', 'domain'),
            )
        ):
            checker_test_object.checker.visit_importfrom(node_err_importfrom)

        # Tests the case wherein domain layer does not import controller layer
        # in import-from statements.
        node_no_err_importfrom = astroid.extract_node(
            """
            from core.platform.email import mailgun_email_services_test #@
        """)
        node_no_err_importfrom.root().name = 'oppia.core.domain'
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_importfrom(node_no_err_importfrom)


class SingleCharAndNewlineAtEOFCheckerTests(unittest.TestCase):

    def test_checks_single_char_and_newline_eof(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.SingleCharAndNewlineAtEOFChecker)
        checker_test_object.setup_method()
        node_missing_newline_at_eof = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""c = 'something dummy'
                """)
        node_missing_newline_at_eof.file = filename
        node_missing_newline_at_eof.path = filename

        checker_test_object.checker.process_module(node_missing_newline_at_eof)

        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='newline-at-eof',
                line=2
            ),
        ):
            temp_file.close()

        node_single_char_file = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(u"""1""")
        node_single_char_file.file = filename
        node_single_char_file.path = filename

        checker_test_object.checker.process_module(node_single_char_file)

        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='only-one-character',
                line=1
            ),
        ):
            temp_file.close()

        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(u"""x = 'something dummy'""")
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        checker_test_object.checker.process_module(node_with_no_error_message)

        with checker_test_object.assertNoMessages():
            temp_file.close()


class SingleSpaceAfterYieldTests(unittest.TestCase):

    def setUp(self):
        super(SingleSpaceAfterYieldTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.SingleSpaceAfterYieldChecker)
        self.checker_test_object.setup_method()

    def test_well_formed_yield_statement_on_single_line(self):
        node_well_formed_one_line_yield_file = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def helloworld():
                    \"\"\"Below is the yield statement.\"\"\"
                    yield (5, 2)
                """)
        node_well_formed_one_line_yield_file.file = filename
        node_well_formed_one_line_yield_file.path = filename
        node_well_formed_one_line_yield_file.fromlineno = 3

        self.checker_test_object.checker.visit_yield(
            node_well_formed_one_line_yield_file)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_well_formed_yield_statement_on_multiple_lines(self):
        node_well_formed_mult_lines_file = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def helloworld():
                    yield (
                        'This line was too long to be put on one line.')
                """)
        node_well_formed_mult_lines_file.file = filename
        node_well_formed_mult_lines_file.path = filename
        node_well_formed_mult_lines_file.fromlineno = 2

        self.checker_test_object.checker.visit_yield(
            node_well_formed_mult_lines_file)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_yield_nothing(self):
        yield_nothing_file = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def helloworld():
                    yield
                """)
        yield_nothing_file.file = filename
        yield_nothing_file.path = filename
        yield_nothing_file.fromlineno = 2

        self.checker_test_object.checker.visit_yield(
            yield_nothing_file)

        # No errors on yield statements that do nothing.
        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_yield_in_multi_line_comment(self):
        yield_in_multiline_file = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def helloworld():
                    \"\"\"
                        yield(\"invalid yield format\")
                    \"\"\"
                    extract_node(\"\"\"
                        yield   (invalid)
                    \"\"\")
                    extract_node(
                    b\"\"\"
                        yield(1, 2)
                    \"\"\")
                    extract_node(
                    u\"\"\"
                        yield(3, 4)
                    \"\"\")
                    )
                """)
        yield_in_multiline_file.file = filename
        yield_in_multiline_file.path = filename

        self.checker_test_object.checker.visit_yield(
            yield_in_multiline_file)

        # No errors on yield statements in multi-line comments.
        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_too_many_spaces_after_yield_statement(self):
        node_too_many_spaces_after_yield_file = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def helloworld():
                    yield  (5, 2)
                """)
        node_too_many_spaces_after_yield_file.file = filename
        node_too_many_spaces_after_yield_file.path = filename
        node_too_many_spaces_after_yield_file.fromlineno = 2

        self.checker_test_object.checker.visit_yield(
            node_too_many_spaces_after_yield_file)

        message = testutils.Message(
            msg_id='single-space-after-yield',
            node=node_too_many_spaces_after_yield_file)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_no_space_after_yield_statement(self):
        node_no_spaces_after_yield_file = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def helloworld():
                    yield(5, 2)
                """)
        node_no_spaces_after_yield_file.file = filename
        node_no_spaces_after_yield_file.path = filename
        node_no_spaces_after_yield_file.fromlineno = 2

        self.checker_test_object.checker.visit_yield(
            node_no_spaces_after_yield_file)

        message = testutils.Message(
            msg_id='single-space-after-yield',
            node=node_no_spaces_after_yield_file)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()


class ExcessiveEmptyLinesCheckerTests(unittest.TestCase):

    def test_checks_excessive_empty_lines(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.ExcessiveEmptyLinesChecker)
        checker_test_object.setup_method()
        node_excessive_empty_lines = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func1():
                        returns_something



                    def func2():
                        \"\"\"This is a comment.\"\"\"
                        returns_something
                """)
        node_excessive_empty_lines.file = filename
        node_excessive_empty_lines.path = filename

        checker_test_object.checker.process_module(node_excessive_empty_lines)

        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='excessive-new-lines',
                line=5
            ),
        ):
            temp_file.close()

        node_method_with_decorator = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func0():
                        returns_something



                    @something
                    def func1():
                        \"\"\"This is a multiline
                        comment.\"\"\"
                        returns_something
                """)
        node_method_with_decorator.file = filename
        node_method_with_decorator.path = filename

        checker_test_object.checker.process_module(node_method_with_decorator)

        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='excessive-new-lines',
                line=5
            ),
        ):
            temp_file.close()

        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func0():
                        returns_something

                    def func1():
                        returns_something


                    def func2():
                        returns_something

                    @something
                    def func3():
                        returns_something
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        checker_test_object.checker.process_module(node_with_no_error_message)

        with checker_test_object.assertNoMessages():
            temp_file.close()


class DivisionOperatorCheckerTests(unittest.TestCase):

    def setUp(self):
        super(DivisionOperatorCheckerTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DivisionOperatorChecker)
        self.checker_test_object.setup_method()

    def test_division_operator_with_spaces(self):
        node_division_operator_with_spaces = astroid.extract_node(
            u"""
            a / b #@
            """)

        message = testutils.Message(
            msg_id='division-operator-used',
            node=node_division_operator_with_spaces)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_binop(
                node_division_operator_with_spaces)

    def test_division_operator_without_spaces(self):
        node_division_operator_without_spaces = astroid.extract_node(
            u"""
            a/b #@
            """)

        message = testutils.Message(
            msg_id='division-operator-used',
            node=node_division_operator_without_spaces)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_binop(
                node_division_operator_without_spaces)


class SingleLineCommentCheckerTests(unittest.TestCase):

    def setUp(self):
        super(SingleLineCommentCheckerTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.SingleLineCommentChecker)
        self.checker_test_object.setup_method()

    def test_invalid_punctuation(self):
        node_invalid_punctuation = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# Something/
                """)
        node_invalid_punctuation.file = filename
        node_invalid_punctuation.path = filename

        self.checker_test_object.checker.process_module(
            node_invalid_punctuation)

        message = testutils.Message(
            msg_id='invalid-punctuation-used',
            line=1)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_no_space_at_beginning(self):
        node_no_space_at_beginning = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""#Something.
                """)
        node_no_space_at_beginning.file = filename
        node_no_space_at_beginning.path = filename

        self.checker_test_object.checker.process_module(
            node_no_space_at_beginning)

        message = testutils.Message(
            msg_id='no-space-at-beginning',
            line=1)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_no_capital_letter_at_beginning(self):
        node_no_capital_letter_at_beginning = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# something.
                """)
        node_no_capital_letter_at_beginning.file = filename
        node_no_capital_letter_at_beginning.path = filename

        self.checker_test_object.checker.process_module(
            node_no_capital_letter_at_beginning)

        message = testutils.Message(
            msg_id='no-capital-letter-at-beginning',
            line=1)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_comment_with_excluded_phrase(self):
        node_comment_with_excluded_phrase = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# coding: utf-8
                # pylint: disable
                """)
        node_comment_with_excluded_phrase.file = filename
        node_comment_with_excluded_phrase.path = filename

        self.checker_test_object.checker.process_module(
            node_comment_with_excluded_phrase)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_variable_name_in_comment(self):
        node_variable_name_in_comment = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# variable_name is used.
                """)
        node_variable_name_in_comment.file = filename
        node_variable_name_in_comment.path = filename

        self.checker_test_object.checker.process_module(
            node_variable_name_in_comment)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_comment_with_version_info(self):
        node_comment_with_version_info = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# v2 is used.
                """)
        node_comment_with_version_info.file = filename
        node_comment_with_version_info.path = filename

        self.checker_test_object.checker.process_module(
            node_comment_with_version_info)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_data_type_in_comment(self):
        node_data_type_in_comment = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# str. variable is type of str.
                """)
        node_data_type_in_comment.file = filename
        node_data_type_in_comment.path = filename

        self.checker_test_object.checker.process_module(
            node_data_type_in_comment)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_comment_inside_docstring(self):
        node_comment_inside_docstring = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    \"\"\"# str. variable is type of str.\"\"\"
                    \"\"\"# str. variable is type
                    of str.\"\"\"
                """)
        node_comment_inside_docstring.file = filename
        node_comment_inside_docstring.path = filename

        self.checker_test_object.checker.process_module(
            node_comment_inside_docstring)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_well_formed_comment(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# Multi
                    # line
                    # comment.
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_module(
            node_with_no_error_message)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()


class BlankLineBelowFileOverviewCheckerTests(unittest.TestCase):

    def setUp(self):
        super(BlankLineBelowFileOverviewCheckerTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.BlankLineBelowFileOverviewChecker)
        self.checker_test_object.setup_method()

    def test_no_empty_line_below_fileoverview(self):
        node_no_empty_line_below_fileoverview = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    \"\"\" this file does something \"\"\"
                    import something
                    import random
                """)
        node_no_empty_line_below_fileoverview.file = filename
        node_no_empty_line_below_fileoverview.path = filename

        self.checker_test_object.checker.process_module(
            node_no_empty_line_below_fileoverview)

        message = testutils.Message(
            msg_id='no-empty-line-provided-below-fileoverview',
            line=2)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_extra_empty_lines_below_fileoverview(self):
        node_extra_empty_lines_below_fileoverview = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    \"\"\" this file does something \"\"\"


                    import something
                    from something import random
                """)
        node_extra_empty_lines_below_fileoverview.file = filename
        node_extra_empty_lines_below_fileoverview.path = filename

        self.checker_test_object.checker.process_module(
            node_extra_empty_lines_below_fileoverview)

        message = testutils.Message(
            msg_id='only-a-single-empty-line-should-be-provided', line=2)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_extra_empty_lines_below_fileoverview_with_unicode_characters(self):
        node_extra_empty_lines_below_fileoverview = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    #this comment has a unicode character \u2713
                    \"\"\" this file does \u2715 something \"\"\"


                    from something import random
                """)
        node_extra_empty_lines_below_fileoverview.file = filename
        node_extra_empty_lines_below_fileoverview.path = filename

        self.checker_test_object.checker.process_module(
            node_extra_empty_lines_below_fileoverview)

        message = testutils.Message(
            msg_id='only-a-single-empty-line-should-be-provided', line=3)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_no_empty_line_below_fileoverview_with_unicode_characters(self):
        node_no_empty_line_below_fileoverview = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    #this comment has a unicode character \u2713
                    \"\"\" this file does \u2715 something \"\"\"
                    import something
                    import random
                """)
        node_no_empty_line_below_fileoverview.file = filename
        node_no_empty_line_below_fileoverview.path = filename

        self.checker_test_object.checker.process_module(
            node_no_empty_line_below_fileoverview)

        message = testutils.Message(
            msg_id='no-empty-line-provided-below-fileoverview',
            line=3)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_single_new_line_below_file_overview(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    \"\"\" this file does something \"\"\"

                    import something
                    import random
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_module(
            node_with_no_error_message)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_file_with_no_file_overview(self):
        node_file_with_no_file_overview = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    import something
                    import random
                """)
        node_file_with_no_file_overview.file = filename
        node_file_with_no_file_overview.path = filename

        self.checker_test_object.checker.process_module(
            node_file_with_no_file_overview)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_file_overview_at_end_of_file(self):
        node_file_overview_at_end_of_file = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    \"\"\" this file does something \"\"\"   """)
        node_file_overview_at_end_of_file.file = filename
        node_file_overview_at_end_of_file.path = filename

        self.checker_test_object.checker.process_module(
            node_file_overview_at_end_of_file)

        message = testutils.Message(
            msg_id='no-empty-line-provided-below-fileoverview',
            line=2)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()


class SingleLinePragmaCheckerTests(unittest.TestCase):

    def setUp(self):
        super(SingleLinePragmaCheckerTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.SingleLinePragmaChecker)
        self.checker_test_object.setup_method()

    def test_pragma_for_multiline(self):
        node_pragma_for_multiline = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    # pylint: disable=invalid-name
                    def funcName():
                        \"\"\" # pylint: disable=test-purpose\"\"\"
                        pass
                    # pylint: enable=invalid-name
                """)
        node_pragma_for_multiline.file = filename
        node_pragma_for_multiline.path = filename

        self.checker_test_object.checker.process_tokens(
            utils.tokenize_module(node_pragma_for_multiline))

        message1 = testutils.Message(
            msg_id='single-line-pragma',
            line=2)

        message2 = testutils.Message(
            msg_id='single-line-pragma',
            line=6)

        with self.checker_test_object.assertAddsMessages(
            message1, message2):
            temp_file.close()

    def test_enable_single_line_pragma_for_multiline(self):
        node_enable_single_line_pragma_for_multiline = (
            astroid.scoped_nodes.Module(name='test', doc='Custom test'))
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    # pylint: disable=single-line-pragma
                    def func():
                        \"\"\"
                        # pylint: disable=testing-purpose
                        \"\"\"
                        pass
                    # pylint: enable=single-line-pragma
                """)
        node_enable_single_line_pragma_for_multiline.file = filename
        node_enable_single_line_pragma_for_multiline.path = filename

        self.checker_test_object.checker.process_tokens(
            utils.tokenize_module(node_enable_single_line_pragma_for_multiline))

        message = testutils.Message(
            msg_id='single-line-pragma',
            line=2)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_enable_single_line_pragma_with_invalid_name(self):
        node_enable_single_line_pragma_with_invalid_name = (
            astroid.scoped_nodes.Module(name='test', doc='Custom test'))
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    # pylint: disable=invalid-name, single-line-pragma
                    def funcName():
                        \"\"\"
                        # pylint: disable=testing-purpose
                        \"\"\"
                        pass
                    # pylint: enable=invalid_name, single-line-pragma
                """)
        node_enable_single_line_pragma_with_invalid_name.file = filename
        node_enable_single_line_pragma_with_invalid_name.path = filename

        self.checker_test_object.checker.process_tokens(
            utils.tokenize_module(
                node_enable_single_line_pragma_with_invalid_name))

        message = testutils.Message(
            msg_id='single-line-pragma',
            line=2)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_single_line_pylint_pragma(self):
        node_with_no_error_message = (
            astroid.scoped_nodes.Module(name='test', doc='Custom test'))
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    def funcName():  # pylint: disable=single-line-pragma
                        pass
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_tokens(
            utils.tokenize_module(node_with_no_error_message))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_no_and_extra_space_before_pylint(self):
        node_no_and_extra_space_before_pylint = (
            astroid.scoped_nodes.Module(name='test', doc='Custom test'))
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    # pylint:disable=single-line-pragma
                    def func():
                        \"\"\"
                        # pylint: disable=testing-purpose
                        \"\"\"
                        pass
                    # pylint:     enable=single-line-pragma
                """)
        node_no_and_extra_space_before_pylint.file = filename
        node_no_and_extra_space_before_pylint.path = filename

        self.checker_test_object.checker.process_tokens(
            utils.tokenize_module(node_no_and_extra_space_before_pylint))

        message = testutils.Message(
            msg_id='single-line-pragma',
            line=2)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()
