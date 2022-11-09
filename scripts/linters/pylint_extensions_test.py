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

from __future__ import annotations

import tempfile
import unittest

from core import utils

from . import pylint_extensions

import astroid  # isort:skip
from pylint import interfaces  # isort:skip
from pylint import testutils  # isort:skip
from pylint import lint  # isort:skip
from pylint import utils as pylint_utils  # isort:skip


class ExplicitKeywordArgsCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.ExplicitKeywordArgsChecker)
        self.checker_test_object.setup_method()

    def test_finds_non_explicit_keyword_args(self):
        (
            func_call_node_one, func_call_node_two, func_call_node_three,
            func_call_node_four, func_call_node_five, class_call_node
        ) = astroid.extract_node(
                """
        class TestClass():
            pass

        def test(test_var_one, test_var_two=4, test_var_three=5,
                test_var_four="test_checker"):
            test_var_five = test_var_two + test_var_three
            return test_var_five

        def test_1(test_var_one, test_var_one):
            pass

        test(2, 5, test_var_three=6) #@
        test(2) #@
        test(2, 6, test_var_two=5, test_var_four="test_checker") #@
        max(5, 1) #@
        test_1(1, 2) #@

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

    def test_checker_skips_object_call_when_noncallable_object_is_called(self):
        node_with_no_error_message = astroid.extract_node(
            """
            1() #@
            """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_call(
                node_with_no_error_message)

    def test_register(self):
        pylinter_instance = lint.PyLinter()
        pylint_extensions.register(pylinter_instance)


class HangingIndentCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
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
        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""self.post_json('/ml/\\trainedclassifierhandler',
                self.payload, expect_errors=True, expected_status_int=401)
                if (a > 1 and
                        b > 2):
                """)
        node_break_after_hanging_indent.file = filename
        node_break_after_hanging_indent.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_break_after_hanging_indent))

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
        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""self.post_json('/ml/\\trainedclassifierhandler',
                self.payload, expect_errors=True, expected_status_int=401)

                if (a > 1 and
                        b > 2):  # pylint: disable=invalid-name
                """)
        node_break_after_hanging_indent.file = filename
        node_break_after_hanging_indent.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_break_after_hanging_indent))

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
        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""\"\"\"Some multiline
                docstring.
                \"\"\"
                # Load JSON.
                master_translation_dict = json.loads(
               pylint_utils.get_file_contents(os.path.join(
                os.getcwd(), 'assets', 'i18n', 'en.json')))
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_with_no_error_message))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_hanging_indentation_with_a_comment_after_bracket(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""self.post_json(  # Random comment
                '(',
                self.payload, expect_errors=True, expected_status_int=401)""")
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_with_no_error_message))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_hanging_indentation_with_a_comment_after_two_or_more_bracket(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""self.post_json(func(  # Random comment
                '(',
                self.payload, expect_errors=True, expected_status_int=401))""")
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_with_no_error_message))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_hanging_indentation_with_a_comment_after_square_bracket(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""self.post_json([  # Random comment
                '(',
                '', '', ''])""")
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_with_no_error_message))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_hanging_indentation_with_a_if_statement_before(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                if 5 > 7:
                    self.post_json([
                    '(',
                    '', '', ''])

                def func(arg1,
                    arg2, arg3):
                    a = 2 / 2""")
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_with_no_error_message))

        message = testutils.Message(
            msg_id='no-break-after-hanging-indent',
            line=7)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()


class DocstringParameterCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
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

        with utils.open_file(filename, 'w') as tmp:
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

        with utils.open_file(filename, 'w') as tmp:
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

        with utils.open_file(filename, 'w') as tmp:
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

        with utils.open_file(filename, 'w') as tmp:
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

        with utils.open_file(filename, 'w') as tmp:
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

        with utils.open_file(filename, 'w') as tmp:
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

        with utils.open_file(filename, 'w') as tmp:
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

        with utils.open_file(filename, 'w') as tmp:
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

        with utils.open_file(filename, 'w') as tmp:
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
                    arg: Argument description.
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
                    arg: Argument description.
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
                    yields: Argument description.
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

    def test_malformed_raises_section(self):
        node_malformed_raises_section = astroid.extract_node(
            u"""def func(): #@
                \"\"\"Raise an exception.

                Raises:
                    Exception: Argument description.
                \"\"\"
                raise Exception()
        """)

        message = testutils.Message(
            msg_id='malformed-raises-section',
            node=node_malformed_raises_section
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_malformed_raises_section)

    def test_malformed_args_argument(self):
        node_malformed_args_argument = astroid.extract_node(
            u"""def func(*args): #@
                \"\"\"Does nothing.

                Args:
                    *args: int. Argument description.
                \"\"\"
                a = True
        """)

        message = testutils.Message(
            msg_id='malformed-args-argument',
            node=node_malformed_args_argument
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_malformed_args_argument)

    def test_well_formated_args_argument(self):
        node_with_no_error_message = astroid.extract_node(
            u"""def func(*args): #@
                \"\"\"Does nothing.

                Args:
                    *args: list(*). Description.
                \"\"\"
                a = True
        """)

        with self.checker_test_object.assertAddsMessages():
            self.checker_test_object.checker.visit_functiondef(
                node_with_no_error_message)

    def test_well_formated_args_section(self):
        node_with_no_error_message = astroid.extract_node(
            u"""def func(arg): #@
                \"\"\"Does nothing.

                Args:
                    arg: argument. Description.
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
                    int. Argument escription.
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
                    arg. Argument description.
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

    def test_two_lines_empty_docstring_raise_correct_message(self):
        node_with_docstring = astroid.extract_node(
            u"""def func():
                    \"\"\"
                    \"\"\"
                    pass
        """)
        message = testutils.Message(
            msg_id='single-line-docstring-span-two-lines',
            node=node_with_docstring)

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_functiondef(
                node_with_docstring)

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
                            arg: variable. Desciption
                    \"\"\"
                    Something
        """)

        no_period_at_end_message = testutils.Message(
            msg_id='no-period-used', node=node_no_period_at_end)
        malformed_args_message = testutils.Message(
            msg_id='malformed-args-section', node=node_no_period_at_end)

        with self.checker_test_object.assertAddsMessages(
            no_period_at_end_message, malformed_args_message):
            self.checker_test_object.checker.visit_functiondef(
                node_no_period_at_end)

    def test_no_newline_at_end_of_multi_line_docstring(self):
        node_no_newline_at_end = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"This is a docstring.

                        Args:
                            arg: variable. Description.\"\"\"
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
                    arg: argument. Description.
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
                        raises_exception. Description.
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
                    returns_something. Description.
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
                    arg: argument. Description.
                Raises:
                    raises_something. Description.
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
                    arg: argument. Description.
                Returns:
                    returns_something. Description.
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
                    raises_exception. Description.

                Returns:
                    returns_something. Description.
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
                        int. Returns something.


                    Yields:
                        yield_something. Description.
                    \"\"\"
                    return True
                    yield something
        """)

        single_space_above_args_message = testutils.Message(
            msg_id='single-space-above-args',
            node=node_with_two_newline
        )

        single_space_above_returns_message = testutils.Message(
            msg_id='single-space-above-returns',
            node=node_with_two_newline
        )

        single_space_above_yields_message = testutils.Message(
            msg_id='single-space-above-yield',
            node=node_with_two_newline
        )

        with self.checker_test_object.assertAddsMessages(
            single_space_above_args_message, single_space_above_returns_message,
            single_space_above_yields_message):
            self.checker_test_object.checker.visit_functiondef(
                node_with_two_newline)

    def test_return_in_comment(self):
        node_with_return_in_comment = astroid.extract_node(
            u"""def func(arg): #@
                    \"\"\"Returns something.

                    Args:
                        arg: argument. Description.

                    Returns:
                        returns_something. Description.
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
                        raises. Something.

                    Yields:
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
                        NoVariableException. Variable.
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
                            AssertionError. If the
                            schema is not valid.
                    \"\"\"
                    Something
        """)

        incorrect_indentation_message = testutils.Message(
            msg_id='8-space-indentation-in-docstring',
            node=invalid_raises_description_indentation_node)
        malformed_raises_message = testutils.Message(
            msg_id='malformed-raises-section',
            node=invalid_raises_description_indentation_node)

        with self.checker_test_object.assertAddsMessages(
            incorrect_indentation_message, malformed_raises_message,
            malformed_raises_message):
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
                            Incorrect-Exception. If the
                            schema is not valid.
                    \"\"\"
                    Something
        """)

        malformed_raises_message = testutils.Message(
            msg_id='malformed-raises-section',
            node=invalid_parameter_name)

        with self.checker_test_object.assertAddsMessages(
            malformed_raises_message, malformed_raises_message):
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
                            arg: variable. Description.
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
                            doseq. If true, individual
                                key=value pairs separated by '&' are
                                generated for each element of
                                the value sequence for the key
                                temp temp temp temp.
                            query. The query to be encoded.
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
                                }.
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
                        }.

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

        valid_indentation_with_kw_args_node = astroid.extract_node(
        """
        def func( #@
            test_var_one,
            *,
            test_var_two
        ):
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
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(
                valid_indentation_with_kw_args_node)

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
        class Test:
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
        class Test:
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
                Exception. An exception.
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
        class Test:
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

    def test_importing_internals_from_allowed_modules_does_not_raise_message(
            self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.ImportOnlyModulesChecker)
        checker_test_object.setup_method()
        importfrom_node = astroid.extract_node(
            """
            from __future__ import invalid_module #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_importfrom(importfrom_node)


class BackslashContinuationCheckerTests(unittest.TestCase):

    def test_finds_backslash_continuation(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.BackslashContinuationChecker)
        checker_test_object.setup_method()
        node = astroid.scoped_nodes.Module(name='test', doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
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

    def setUp(self):
        super().setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.RestrictedImportChecker)
        self.checker_test_object.setup_method()
        # The spaces are included on purpose so that we properly test
        # the input sanitization.
        self.checker_test_object.checker.config.forbidden_imports = (
            (
                '*core.controllers*:\n'
                '    import core.platform*   |  \n'
                '    import core.storage*\n'
            ),
            (
                '*core.domain*:import core.controllers*'
            ),
            (
                '   *core.storage*:import    core.domain*   '
            ),
            (
                '*core.domain.*_domain:\n'
                '    from core.domain    import    *_service*   |\n'
                '    from   core.domain import *_cleaner|\n'
                '      from core.domain import *_registry |\n'
                '    from core.domain import *_fetchers  |\n'
                '    from core.domain import *_manager |\n'
                '       from core.platform import   models'
            )
        )
        self.checker_test_object.checker.open()

    def test_forbid_domain_import_in_storage_module(self):
        node_err_import = astroid.extract_node(
            """
            import core.domain.activity_domain #@
            """
        )
        node_err_import.root().name = 'oppia.core.storage.topic'
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_err_import,
                args=('core.domain*', '*core.storage*'),
            ),
        ):
            self.checker_test_object.checker.visit_import(node_err_import)

    def test_allow_platform_import_in_storage_module(self):
        node_no_err_import = astroid.extract_node(
            """
            import core.platform.email.mailgun_email_services #@
        """)
        node_no_err_import.root().name = 'oppia.core.storage.topic'
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_import(node_no_err_import)

    def test_forbid_domain_from_import_in_storage_module(self):
        node_err_importfrom = astroid.extract_node(
            """
            from core.domain import activity_domain #@
        """)
        node_err_importfrom.root().name = 'oppia.core.storage.topic'
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_err_importfrom,
                args=('core.domain*', '*core.storage*'),
            )
        ):
            self.checker_test_object.checker.visit_importfrom(
                node_err_importfrom)

    def test_allow_platform_from_import_in_storage_module(self):
        node_no_err_importfrom = astroid.extract_node(
            """
            from core.platform.email import mailgun_email_services #@
        """)
        node_no_err_importfrom.root().name = 'oppia.core.storage.topicl'
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_importfrom(
                node_no_err_importfrom)

    def test_forbid_controllers_import_in_domain_module(self):
        node_err_import = astroid.extract_node(
            """
            import core.controllers.acl_decorators #@
        """)
        node_err_import.root().name = 'oppia.core.domain'
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_err_import,
                args=('core.controllers*', '*core.domain*'),
            ),
        ):
            self.checker_test_object.checker.visit_import(node_err_import)

    def test_allow_platform_import_in_domain_module(self):
        node_no_err_import = astroid.extract_node(
            """
            import core.platform.email.mailgun_email_services_test #@
        """)
        node_no_err_import.root().name = 'oppia.core.domain'
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_import(node_no_err_import)

    def test_forbid_controllers_from_import_in_domain_module(self):
        node_err_importfrom = astroid.extract_node(
            """
            from core.controllers import acl_decorators #@
            """
        )
        node_err_importfrom.root().name = 'oppia.core.domain'
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_err_importfrom,
                args=('core.controllers*', '*core.domain*'),
            )
        ):
            self.checker_test_object.checker.visit_importfrom(
                node_err_importfrom)

    def test_allow_platform_from_import_in_domain_module(self):
        node_no_err_importfrom = astroid.extract_node(
            """
            from core.platform.email import mailgun_email_services_test #@
        """)
        node_no_err_importfrom.root().name = 'oppia.core.domain'
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_importfrom(
                node_no_err_importfrom)

    def test_forbid_service_import_in_domain_file(self):
        node_err_import = astroid.extract_node(
            """
            import core.domain.exp_services #@
            """
        )
        node_err_import.root().name = 'oppia.core.domain.exp_domain'
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import-from',
                node=node_err_import,
                args=('*_service*', 'core.domain', '*core.domain.*_domain'),
            ),
        ):
            self.checker_test_object.checker.visit_import(node_err_import)

    def test_allow_domain_file_import_in_domain_file(self):
        node_no_err_import = astroid.extract_node(
            """
            import core.domain.collection_domain #@
            """
        )
        node_no_err_import.root().name = 'oppia.core.domain.topic_domain'
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_import(node_no_err_import)

    def test_forbid_cleaner_from_import_in_domain_file(self):
        node_err_importfrom = astroid.extract_node(
            """
            from core.domain import html_cleaner #@
            """
        )
        node_err_importfrom.root().name = 'oppia.core.domain.collection_domain'
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import-from',
                node=node_err_importfrom,
                args=('*_cleaner', 'core.domain', '*core.domain.*_domain'),
            )
        ):
            self.checker_test_object.checker.visit_importfrom(
                node_err_importfrom)

    def test_allow_domain_file_from_import_in_domain_file(self):
        node_no_err_importfrom = astroid.extract_node(
            """
            from core.domain import exp_domain #@
            """
        )
        node_no_err_importfrom.root().name = 'oppia.core.domain.story_domain'
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_importfrom(
                node_no_err_importfrom)

    def test_forbid_platform_import_in_controllers_module(self):
        node_err_import = astroid.extract_node(
            """
            import core.platform #@
        """)
        node_err_import.root().name = 'oppia.core.controllers.controller'
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_err_import,
                args=('core.platform*', '*core.controllers*'),
            )
        ):
            self.checker_test_object.checker.visit_import(node_err_import)

    def test_forbid_storage_import_in_controllers_module(self):
        node_err_import = astroid.extract_node(
            """
            import core.storage #@
        """)
        node_err_import.root().name = 'oppia.core.controllers.controller'
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_err_import,
                args=('core.storage*', '*core.controllers*'),
            )
        ):
            self.checker_test_object.checker.visit_import(node_err_import)

    def test_allow_domain_import_in_controllers_module(self):
        node_no_err_import = astroid.extract_node(
            """
            import core.domain #@
        """)
        node_no_err_import.root().name = 'oppia.core.controllers.controller'
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_import(node_no_err_import)

    def test_forbid_platform_from_import_in_controllers_module(self):
        node_no_err_importfrom = astroid.extract_node(
            """
            from core.platform import models #@
        """)
        node_no_err_importfrom.root().name = 'oppia.core.controllers.controller'
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_no_err_importfrom,
                args=('core.platform*', '*core.controllers*'),
            )
        ):
            self.checker_test_object.checker.visit_importfrom(
                node_no_err_importfrom)

    def test_forbid_storage_from_import_in_controllers_module(self):
        node_no_err_importfrom = astroid.extract_node(
            """
            from core.storage.user import gae_models as user_models #@
        """)
        node_no_err_importfrom.root().name = 'oppia.core.controllers.controller'
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='invalid-import',
                node=node_no_err_importfrom,
                args=('core.storage*', '*core.controllers*'),
            )
        ):
            self.checker_test_object.checker.visit_importfrom(
                node_no_err_importfrom)

    def test_allow_domain_from_import_in_controllers_module(self):
        node_no_err_importfrom = astroid.extract_node(
            """
            from core.domain import user_services #@
        """)
        node_no_err_importfrom.root().name = 'oppia.core.controllers.controller'
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_importfrom(
                node_no_err_importfrom)


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

        with utils.open_file(filename, 'w') as tmp:
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
        with utils.open_file(filename, 'w') as tmp:
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
        with utils.open_file(filename, 'w') as tmp:
            tmp.write(u"""x = 'something dummy'""")
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        checker_test_object.checker.process_module(node_with_no_error_message)

        with checker_test_object.assertNoMessages():
            temp_file.close()


class TypeIgnoreCommentCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.TypeIgnoreCommentChecker)
        self.checker_test_object.setup_method()
        self.checker_test_object.checker.config.allowed_type_ignore_error_codes = [  # pylint: disable=line-too-long
            'attr-defined',
            'union-attr',
            'arg-type',
            'call-overload',
            'override',
            'return',
            'assignment',
            'list-item',
            'dict-item',
            'typeddict-item',
            'func-returns-value',
            'misc',
            'type-arg',
            'no-untyped-def',
            'no-untyped-call',
            'no-any-return'
        ]

    def test_type_ignore_used_without_comment_raises_error(self):
        node_function_with_type_ignore_only = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                suggestion.change.new_value = (  # type: ignore[attr-defined]
                    new_content
                ) #@
                """
            )
        node_function_with_type_ignore_only.file = filename

        message = testutils.Message(
            msg_id='mypy-ignore-used',
            line=2,
            node=node_function_with_type_ignore_only
        )
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(
                node_function_with_type_ignore_only
            )
        temp_file.close()

    def test_raises_error_if_prohibited_error_code_is_used(self):
        node_with_prohibited_error_code = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                suggestion.change.new_value = (  # type: ignore[some-new-ignore]
                    new_content
                ) #@
                """
            )
        node_with_prohibited_error_code.file = filename

        message = testutils.Message(
            msg_id='prohibited-type-ignore-used',
            line=2,
            node=node_with_prohibited_error_code,
            args=('some-new-ignore',)
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(
                node_with_prohibited_error_code
            )
        temp_file.close()

        node_with_prohibited_type_ignore_error_code = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'
            )
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # Here we use MyPy ignore because ...
                suggestion.change.new_value = (  # type: ignore[attr-defined]
                    new_content
                )

                suggestion.change.new_value = (  # type: ignore[truthy-bool]
                    new_content
                )

                # Here we use MyPy ignore because ...
                func_only_accept_str('hi')  # type: ignore[attr-defined]

                #@
                """
            )
        node_with_prohibited_type_ignore_error_code.file = filename

        message = testutils.Message(
            msg_id='prohibited-type-ignore-used',
            line=7,
            node=node_with_prohibited_type_ignore_error_code,
            args=('truthy-bool',)
        )
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(
                node_with_prohibited_type_ignore_error_code
            )
        temp_file.close()

    def test_raises_error_if_prohibited_error_code_is_used_in_combined_form(
        self
    ):
        node_with_prohibited_error_code_in_combined_form = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'
            )
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                suggestion.change.new_value = (  # type: ignore[arg-type, no-untyped-call, truthy-bool] pylint: disable=line-too-long
                    new_content
                ) #@
                """
            )
        node_with_prohibited_error_code_in_combined_form.file = filename

        message = testutils.Message(
            msg_id='prohibited-type-ignore-used',
            line=2,
            node=node_with_prohibited_error_code_in_combined_form,
            args=('truthy-bool',)
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(
                node_with_prohibited_error_code_in_combined_form
            )
        temp_file.close()

        node_with_multiple_prohibited_error_code_in_combined_form = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'
            )
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                suggestion.change.new_value = (  # type: ignore[return-none, no-untyped-call, truthy-bool] pylint: disable=line-too-long
                    new_content
                ) #@
                """
            )
        node_with_multiple_prohibited_error_code_in_combined_form.file = (
            filename)

        message = testutils.Message(
            msg_id='prohibited-type-ignore-used',
            line=2,
            node=node_with_multiple_prohibited_error_code_in_combined_form,
            args=('return-none', 'truthy-bool')
        )

        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(
                node_with_multiple_prohibited_error_code_in_combined_form
            )
        temp_file.close()

    def test_extra_type_ignore_comment_used_in_a_module_raises_error(self):
        node_function_with_extra_comment = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # Here we use MyPy ignore because ...
                suggestion.change.new_value = (   # type: ignore[attr-defined]
                    new_content
                )

                # Here we use MyPy ignore because ...
                suggestion.change.new_value = (
                    new_content
                )

                # Here we use MyPy ignore because ...
                func_only_accept_str('hi')   # type: ignore[attr-defined]

                # Here we use MyPy ignore because ...
                suggestion.change.new_value = (
                    new_content
                )
                #@
                """
            )
        node_function_with_extra_comment.file = filename

        message1 = testutils.Message(
            msg_id='redundant-type-comment',
            line=7,
            node=node_function_with_extra_comment
        )
        message2 = testutils.Message(
            msg_id='redundant-type-comment',
            line=15,
            node=node_function_with_extra_comment
        )
        with self.checker_test_object.assertAddsMessages(message1, message2):
            self.checker_test_object.checker.visit_module(
                node_function_with_extra_comment
            )
        temp_file.close()

        node_function_with_extra_comment2 = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # Here we use MyPy ignore because ...
                suggestion.change.new_value = (   # type: ignore[attr-defined]
                    new_content
                )

                # Here we use MyPy ignore because ...
                suggestion.change.new_value = (
                    new_content
                )

                # Here we use MyPy ignore because ...
                func_only_accept_str('hi')   # type: ignore[attr-defined]
                #@
                """
            )
        node_function_with_extra_comment2.file = filename

        message = testutils.Message(
            msg_id='redundant-type-comment',
            line=7,
            node=node_function_with_extra_comment2
        )
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(
                node_function_with_extra_comment2
            )
        temp_file.close()

    def test_raises_error_if_type_ignore_is_in_second_place(self):
        node_with_type_ignore = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                suggestion.change.new_value = (  # pylint: disable=line-too-long type: ignore[attr-defined]
                    new_content
                )
                #@
                """
            )
        node_with_type_ignore.file = filename

        message = testutils.Message(
            msg_id='mypy-ignore-used',
            line=2,
            node=node_with_type_ignore
        )
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(
                node_with_type_ignore
            )
        temp_file.close()

    def test_type_ignores_with_comments_should_not_raises_error(self):
        node_with_type_ignore_in_single_form = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # Here we use MyPy ignore because attributes on BaseChange
                # class are defined dynamically.
                suggestion.change.new_value = (  # type: ignore[attr-defined]
                    new_content
                )

                # Here we use MyPy ignore because this function is can only
                # str values but here we are providing integer which causes
                # MyPy to throw an error. Thus to avoid the error, we used
                # ignore here.
                func_only_accept_str(1234)  # type: ignore[arg-type] #@
                """
            )
        node_with_type_ignore_in_single_form.file = filename

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_type_ignore_in_single_form
            )
        temp_file.close()

        node_with_type_ignore_in_combined_form = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # Here we use MyPy ignore because ...
                suggestion.change.new_value = (  # type: ignore[attr-defined, list-item]
                    new_content
                )

                # Here we use MyPy ignore because ...
                func_only_accept_str(1234)  # type: ignore[arg-type]
                #@
                """
            )
        node_with_type_ignore_in_combined_form.file = filename

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_type_ignore_in_combined_form
            )
        temp_file.close()

    def test_untyped_call_type_ignores_should_not_raise_error(self):
        node_function = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # Here we use MyPy ignore because attributes on BaseChange
                # class are defined dynamically.
                suggestion.change.new_value = (  # type: ignore[attr-defined]
                    new_content
                )

                func_only_accept_str(1234)  # type: ignore[no-untyped-call] #@
                """
            )
        node_function.file = filename

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(node_function)
        temp_file.close()

    def test_raises_error_if_gap_in_ignore_and_comment_is_more_than_fifteen(
        self
    ):
        node_with_ignore_and_more_than_fifteen_gap = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'
            )
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # Here we use MyPy ignore because stubs of protobuf are not
                # available yet.

                variable_one: str = '123'
                variable_two: str = '1234'
                # Some other content of module one.

                # Line 1 content.
                # Line 2 content.
                # Line 3 content.
                # Line 4 content.

                # Some other content of module two.

                def test_foo(arg: str) -> str:

                def foo(exp_id: str) -> str:  # type: ignore[arg-type]
                    return 'hi' #@
                """
            )
        node_with_ignore_and_more_than_fifteen_gap.file = filename

        message1 = testutils.Message(
            msg_id='mypy-ignore-used',
            line=18,
            node=node_with_ignore_and_more_than_fifteen_gap
        )
        message2 = testutils.Message(
            msg_id='redundant-type-comment',
            line=2,
            node=node_with_ignore_and_more_than_fifteen_gap
        )
        with self.checker_test_object.assertAddsMessages(
            message1, message2
        ):
            self.checker_test_object.checker.visit_module(
                node_with_ignore_and_more_than_fifteen_gap
            )
        temp_file.close()

    def test_generic_type_ignore_raises_pylint_error(self):
        node_with_generic_type_ignore = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # TODO(#sll): Here we use MyPy ignore because stubs of protobuf
                # are not available yet.

                def foo(exp_id: str) -> str:  # type: ignore
                    return 'hi' #@
                """
            )
        node_with_generic_type_ignore.file = filename

        message1 = testutils.Message(
            msg_id='generic-mypy-ignore-used',
            line=5,
            node=node_with_generic_type_ignore
        )
        message2 = testutils.Message(
            msg_id='redundant-type-comment',
            line=2,
            node=node_with_generic_type_ignore
        )

        with self.checker_test_object.assertAddsMessages(
            message1, message2
        ):
            self.checker_test_object.checker.visit_module(
                node_with_generic_type_ignore
            )
        temp_file.close()

        node_with_both_generic_and_non_generic_type_ignores = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'
            )
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # TODO(#sll): Here we use MyPy ignore because stubs of protobuf
                # are not available yet.
                def foo(exp_id: str) -> str:  # type: ignore[arg-type]
                    return 'hi' #@

                def foo(exp_id: str) -> str:  # type: ignore
                    return 'hi' #@

                # TODO(#sll): Here we use MyPy ignore because stubs of protobuf
                # are not available yet.
                def foo(exp_id: str) -> str:  # type: ignore[misc]
                    return 'hi' #@
                """
            )
        node_with_both_generic_and_non_generic_type_ignores.file = filename

        message1 = testutils.Message(
            msg_id='generic-mypy-ignore-used',
            line=7,
            node=node_with_both_generic_and_non_generic_type_ignores
        )

        with self.checker_test_object.assertAddsMessages(message1):
            self.checker_test_object.checker.visit_module(
                node_with_both_generic_and_non_generic_type_ignores
            )
        temp_file.close()

    def test_raises_no_error_if_todo_is_present_initially(self):
        node_with_ignore_having_todo = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # TODO(#sll): Here we use MyPy ignore because stubs of protobuf
                # are not available yet.

                def foo(exp_id: str) -> str:  # type: ignore[arg-type]
                    return 'hi' #@
                """
            )
        node_with_ignore_having_todo.file = filename

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_ignore_having_todo
            )
        temp_file.close()

    def test_raises_no_error_if_module_is_excluded(self):
        node_with_ignore_having_todo = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                def foo(exp_id: str) -> str:  # type: ignore[arg-type]
                    return 'hi' #@
                """
            )
        node_with_ignore_having_todo.file = filename

        self.checker_test_object.checker.EXCLUDED_DIRS_HAVING_IGNORE_TYPE_COMMENTS = (   # pylint: disable=line-too-long
            [filename]
        )
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_ignore_having_todo
            )
        temp_file.close()


class ExceptionalTypesCommentCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.ExceptionalTypesCommentChecker)
        self.checker_test_object.setup_method()

    def test_raises_error_if_exceptional_types_are_used_without_comment(self):
        # Checking for Any type.
        node_with_any_type = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                schema_dict: Dict[str, Any] = {
                    'key': 'value'
                } #@
                """
            )
        node_with_any_type.file = filename

        message = testutils.Message(
            msg_id='any-type-used',
            line=2,
            node=node_with_any_type
        )
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(node_with_any_type)
        temp_file.close()

        # Checking for object class.
        node_with_object_type = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                func(proto_buff_stuff: object) #@
                """
            )
        node_with_object_type.file = filename

        message = testutils.Message(
            msg_id='object-class-used',
            line=2,
            node=node_with_object_type
        )
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(node_with_object_type)
        temp_file.close()

        # Checking for cast method.
        node_with_cast_method = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                func(cast(str, change.new_value)) #@
                """
            )
        node_with_cast_method.file = filename

        message = testutils.Message(
            msg_id='cast-func-used',
            line=2,
            node=node_with_cast_method
        )
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(node_with_cast_method)
        temp_file.close()

    def test_raises_error_if_exceptional_types_are_combined_in_module(
        self
    ):
        node_with_combined_types = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                schema_dict: Dict[str, Any] = {
                    'key': 'value'
                }

                def func(proto_buff_stuff: object) -> None:
                    pass

                # Some other contents of the module.

                # Here we use object because to test the linters.
                new_object: object = 'strong hi'

                # We are not considering this case.
                var = object()
                new_string = 'hi'

                change_value = cast(str, change.new_value) #@
                """
            )
        node_with_combined_types.file = filename

        message1 = testutils.Message(
            msg_id='any-type-used',
            line=2,
            node=node_with_combined_types
        )
        message2 = testutils.Message(
            msg_id='object-class-used',
            line=6,
            node=node_with_combined_types
        )
        message3 = testutils.Message(
            msg_id='cast-func-used',
            line=18,
            node=node_with_combined_types
        )
        with self.checker_test_object.assertAddsMessages(
            message1, message3, message2
        ):
            self.checker_test_object.checker.visit_module(
                node_with_combined_types
            )
        temp_file.close()

    def test_raises_error_if_any_type_used_in_function_signature(self):
        node_with_any_type_arg = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                def foo(*args: Any) -> None:
                    pass #@
                """
            )
        node_with_any_type_arg.file = filename

        message = testutils.Message(
            msg_id='any-type-used',
            line=2,
            node=node_with_any_type_arg
        )
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(
                node_with_any_type_arg
            )
        temp_file.close()

        node_with_any_type_return = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                def foo(*args: str) -> Any:
                    pass #@
                """
            )
        node_with_any_type_return.file = filename

        message = testutils.Message(
            msg_id='any-type-used',
            line=2,
            node=node_with_any_type_return
        )
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(
                node_with_any_type_return
            )
        temp_file.close()

        node_with_any_type_return_and_args = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                def foo(*args: Any) -> Any:
                    pass #@
                """
            )
        node_with_any_type_return_and_args.file = filename

        message = testutils.Message(
            msg_id='any-type-used',
            line=2,
            node=node_with_any_type_return_and_args
        )
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(
                node_with_any_type_return_and_args
            )
        temp_file.close()

        node_with_multiple_any_type_functions = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                def foo(*args: Any) -> Any:
                    pass

                def foo1(arg1: str) -> int:
                    pass

                def foo2(*args: str) -> Any:
                    pass #@
                """
            )
        node_with_multiple_any_type_functions.file = filename

        message = testutils.Message(
            msg_id='any-type-used',
            line=2,
            node=node_with_multiple_any_type_functions
        )
        message2 = testutils.Message(
            msg_id='any-type-used',
            line=8,
            node=node_with_multiple_any_type_functions
        )
        with self.checker_test_object.assertAddsMessages(
            message, message2
        ):
            self.checker_test_object.checker.visit_module(
                node_with_multiple_any_type_functions
            )
        temp_file.close()

    def test_any_and_cast_will_not_raise_error_in_import(self):
        node_with_any_and_cast_imported = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                from typing import Any, cast #@
                """
            )
        node_with_any_and_cast_imported.file = filename

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_any_and_cast_imported
            )
        temp_file.close()

        node_with_any_and_cast_in_multi_line_import = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'
            )
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                from typing import (
                    Any, Dict, List, Optional, cast
                ) #@
                """
            )
        node_with_any_and_cast_in_multi_line_import.file = filename

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_any_and_cast_in_multi_line_import
            )
        temp_file.close()

    def test_exceptional_types_with_comments_should_not_raise_error(self):
        node_with_any_type_and_comment = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                from typing import Any

                # Here we use type Any because, this function can take
                # any argument.
                def foo(arg1: Any) -> None
                    pass

                # Some other contents of the Module.
                new_var: str = 'hi'

                # Here we use type Any because, schema dicts can accept
                # any value.
                schema_dict: Dict[str, Any] = {
                    'key': 'value'
                }

                def foo1(arg2: str) -> None
                    # Here we use type Any because, new_value can accept any
                    # value.
                    new_value: Any = 'hi' #@
                """
            )
        node_with_any_type_and_comment.file = filename

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_any_type_and_comment
            )
        temp_file.close()

        node_with_cast_method_and_comment = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                from typing import Any, cast

                # Here we use type Any because, this function can take
                # any argument.
                def foo(arg1: Any) -> None
                    pass

                # Here we use cast because we are narrowing down the object
                # to string object.
                new_var: str = cast(str, object())

                # Here we use type Any because, schema dicts can accept
                # any value.
                schema_dict: Dict[str, Any] = {
                    'key': 'value'
                }

                # Here we use object because stubs of protobuf are not
                # available yet. So, instead of Any we used object here.
                def save_classifier_data(
                    exp_id: str,
                    job_id: str,
                    classifier_data_proto: object
                ) -> None:
                    pass #@
                """
            )
        node_with_cast_method_and_comment.file = filename

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_cast_method_and_comment
            )
        temp_file.close()

    def test_no_error_raised_if_objects_are_present_with_comment(self):
        node_with_multiple_objects_in_func = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # Here we use object because stubs of protobuf are not
                # available yet. So, instead of Any we used object here.
                def foo(exp_id: object) -> object:
                    return 'hi' #@
                """
            )
        node_with_multiple_objects_in_func.file = filename

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_multiple_objects_in_func
            )
        temp_file.close()

    def test_raises_error_if_gap_between_type_and_comment_is_more_than_fifteen(
        self
    ):
        node_with_object_and_more_than_expected_gap = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'
            )
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # Here we use object because stubs of protobuf are not
                # available yet. So, instead of Any we used object here.

                variable_one: str = '123'
                variable_two: str = '1234'
                # Some other content of module one.

                # Line 1 content.
                # Line 2 content.
                # Line 3 content.
                # Line 4 content.

                # Some other content of module two.

                def test_foo(arg: str) -> str:

                def foo(exp_id: str) -> object:
                    return 'hi' #@
                """
            )
        node_with_object_and_more_than_expected_gap.file = filename

        message = testutils.Message(
            msg_id='object-class-used',
            line=18,
            node=node_with_object_and_more_than_expected_gap
        )
        with self.checker_test_object.assertAddsMessages(message):
            self.checker_test_object.checker.visit_module(
                node_with_object_and_more_than_expected_gap
            )
        temp_file.close()

        node_with_object_and_less_than_fifteen_gap = (
            astroid.scoped_nodes.Module(
                name='test',
                doc='Custom test'
            )
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # Here we use object because stubs of protobuf are not
                # available yet. So, instead of Any we used object here.

                variable_one: str = '123'
                variable_two: str = '1234'
                # Some other content of module one.

                def test_foo(arg: str) -> str:

                def foo(exp_id: str) -> object:
                    return 'hi' #@
                """
            )
        node_with_object_and_less_than_fifteen_gap.file = filename

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_object_and_less_than_fifteen_gap
            )
        temp_file.close()

    def test_no_error_raised_if_objects_are_present_with_todo_comment(self):
        node_with_object_and_todo_comment = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                # TODO(#sll): Here we use object because stubs of protobuf
                # are not available yet. So, instead of Any we used object
                # here.
                def foo(exp_id: object) -> object:
                    return 'hi' #@
                """
            )
        node_with_object_and_todo_comment.file = filename

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_object_and_todo_comment
            )
        temp_file.close()

    def test_no_error_raised_if_module_is_excluded(self):
        node_with_object_and_todo_comment = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test'
        )
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                def foo(exp_id: object) -> object:
                    return 'hi' #@
                """
            )
        node_with_object_and_todo_comment.file = filename

        self.checker_test_object.checker.EXCLUDED_DIRS_HAVING_EXCEPTIONAL_TYPE_COMMENTS = (   # pylint: disable=line-too-long
            [filename]
        )
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_module(
                node_with_object_and_todo_comment
            )
        temp_file.close()


class SingleLineCommentCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
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

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# This is a multiline
                # comment/

                # Comment.
                """)
        node_invalid_punctuation.file = filename
        node_invalid_punctuation.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_invalid_punctuation))

        message = testutils.Message(
            msg_id='invalid-punctuation-used',
            line=2)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_no_space_at_beginning(self):
        node_no_space_at_beginning = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""#Something.
                """)
        node_no_space_at_beginning.file = filename
        node_no_space_at_beginning.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_no_space_at_beginning))

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

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# coding: utf-8

                    # something.
                """)
        node_no_capital_letter_at_beginning.file = filename
        node_no_capital_letter_at_beginning.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_no_capital_letter_at_beginning))

        message = testutils.Message(
            msg_id='no-capital-letter-at-beginning',
            line=3)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_comment_with_excluded_phrase(self):
        node_comment_with_excluded_phrase = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# coding: utf-8
                # pylint: disable
                a = 1 + 2  # pylint: disable
                """)
        node_comment_with_excluded_phrase.file = filename
        node_comment_with_excluded_phrase.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_comment_with_excluded_phrase))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_inline_comment_with_allowed_pragma_raises_no_error(self):
        node_inline_comment_with_allowed_pragma = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""a = 1 + 2  # type: ignore[some-rule]
                """)

        node_inline_comment_with_allowed_pragma.file = filename
        node_inline_comment_with_allowed_pragma.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(
               node_inline_comment_with_allowed_pragma))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_inline_comment_with_multiple_allowed_pragmas_raises_no_error(self):
        node_inline_comment_with_allowed_pragma = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""a = 1 + 2  # isort:skip # pylint: ignore[some-rule]
                """)

        node_inline_comment_with_allowed_pragma.file = filename
        node_inline_comment_with_allowed_pragma.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(
               node_inline_comment_with_allowed_pragma))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_inline_comment_with_invalid_pragma_raises_error(self):
        node_inline_comment_with_invalid_pragma = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""a = 1 + 2  # not_a_valid_pragma
                """)

        node_inline_comment_with_invalid_pragma.file = filename
        node_inline_comment_with_invalid_pragma.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(
               node_inline_comment_with_invalid_pragma))

        message = testutils.Message(
            msg_id='no-allowed-inline-pragma',
            line=1)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_variable_name_in_comment(self):
        node_variable_name_in_comment = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# coding: utf-8

                # variable_name is used.
                """)
        node_variable_name_in_comment.file = filename
        node_variable_name_in_comment.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_variable_name_in_comment))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_comment_with_version_info(self):
        node_comment_with_version_info = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# coding: utf-8

                # v2 is used.
                """)
        node_comment_with_version_info.file = filename
        node_comment_with_version_info.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_comment_with_version_info))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_data_type_in_comment(self):
        node_data_type_in_comment = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# coding: utf-8

                # str. variable is type of str.
                """)
        node_data_type_in_comment.file = filename
        node_data_type_in_comment.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_data_type_in_comment))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_comment_inside_docstring(self):
        node_comment_inside_docstring = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# coding: utf-8
                    \"\"\"# str. variable is type of str.\"\"\"
                    \"\"\"# str. variable is type
                    of str.\"\"\"
                """)
        node_comment_inside_docstring.file = filename
        node_comment_inside_docstring.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_comment_inside_docstring))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_well_formed_comment(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# coding: utf-8

                # Multi
                # line
                # comment.
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_with_no_error_message))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()


class BlankLineBelowFileOverviewCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
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

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    \"\"\" this file does something \"\"\"
                    import something
                    import random
                """)
        node_no_empty_line_below_fileoverview.file = filename
        node_no_empty_line_below_fileoverview.path = filename
        node_no_empty_line_below_fileoverview.fromlineno = 2

        self.checker_test_object.checker.visit_module(
            node_no_empty_line_below_fileoverview)

        message = testutils.Message(
            msg_id='no-empty-line-provided-below-fileoverview',
            node=node_no_empty_line_below_fileoverview)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_extra_empty_lines_below_fileoverview(self):
        node_extra_empty_lines_below_fileoverview = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""

                    \"\"\" this file does something \"\"\"


                    import something
                    from something import random
                """)
        node_extra_empty_lines_below_fileoverview.file = filename
        node_extra_empty_lines_below_fileoverview.path = filename
        node_extra_empty_lines_below_fileoverview.fromlineno = 2

        self.checker_test_object.checker.visit_module(
            node_extra_empty_lines_below_fileoverview)

        message = testutils.Message(
            msg_id='only-a-single-empty-line-should-be-provided',
            node=node_extra_empty_lines_below_fileoverview)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_extra_empty_lines_below_fileoverview_with_unicode_characters(self):
        node_extra_empty_lines_below_fileoverview = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    #this comment has a unicode character \u2713
                    \"\"\" this file does \u2715 something \"\"\"


                    from something import random
                """)
        node_extra_empty_lines_below_fileoverview.file = filename
        node_extra_empty_lines_below_fileoverview.path = filename
        node_extra_empty_lines_below_fileoverview.fromlineno = 3

        self.checker_test_object.checker.visit_module(
            node_extra_empty_lines_below_fileoverview)

        message = testutils.Message(
            msg_id='only-a-single-empty-line-should-be-provided',
            node=node_extra_empty_lines_below_fileoverview)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_no_empty_line_below_fileoverview_with_unicode_characters(self):
        node_no_empty_line_below_fileoverview = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    #this comment has a unicode character \u2713
                    \"\"\" this file does \u2715 something \"\"\"
                    import something
                    import random
                """)
        node_no_empty_line_below_fileoverview.file = filename
        node_no_empty_line_below_fileoverview.path = filename
        node_no_empty_line_below_fileoverview.fromlineno = 3

        self.checker_test_object.checker.visit_module(
            node_no_empty_line_below_fileoverview)

        message = testutils.Message(
            msg_id='no-empty-line-provided-below-fileoverview',
            node=node_no_empty_line_below_fileoverview)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_single_new_line_below_file_overview(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    \"\"\" this file does something \"\"\"

                    import something
                    import random
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename
        node_with_no_error_message.fromlineno = 2

        self.checker_test_object.checker.visit_module(
            node_with_no_error_message)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_file_with_no_file_overview(self):
        node_file_with_no_file_overview = astroid.scoped_nodes.Module(
            name='test',
            doc=None)
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    import something
                    import random
                """)
        node_file_with_no_file_overview.file = filename
        node_file_with_no_file_overview.path = filename

        self.checker_test_object.checker.visit_module(
            node_file_with_no_file_overview)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_file_overview_at_end_of_file(self):
        node_file_overview_at_end_of_file = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    \"\"\" this file does something \"\"\"   """)
        node_file_overview_at_end_of_file.file = filename
        node_file_overview_at_end_of_file.path = filename
        node_file_overview_at_end_of_file.fromlineno = 2

        self.checker_test_object.checker.visit_module(
            node_file_overview_at_end_of_file)

        message = testutils.Message(
            msg_id='only-a-single-empty-line-should-be-provided',
            node=node_file_overview_at_end_of_file)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()


class SingleLinePragmaCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
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

        with utils.open_file(filename, 'w') as tmp:
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
           pylint_utils.tokenize_module(node_pragma_for_multiline))

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

        with utils.open_file(filename, 'w') as tmp:
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
           pylint_utils.tokenize_module(
               node_enable_single_line_pragma_for_multiline))

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

        with utils.open_file(filename, 'w') as tmp:
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
           pylint_utils.tokenize_module(
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

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                    def funcName():  # pylint: disable=single-line-pragma
                        pass
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_with_no_error_message))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_no_and_extra_space_before_pylint(self):
        node_no_and_extra_space_before_pylint = (
            astroid.scoped_nodes.Module(name='test', doc='Custom test'))
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
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
           pylint_utils.tokenize_module(node_no_and_extra_space_before_pylint))

        message = testutils.Message(
            msg_id='single-line-pragma',
            line=2)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()


class SingleSpaceAfterKeyWordCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.SingleSpaceAfterKeyWordChecker)
        self.checker_test_object.setup_method()

    def test_no_space_after_keyword(self):
        node_no_space_after_keyword = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                if(False):
                    pass
                elif(True):
                    pass
                while(True):
                    pass
                yield(1)
                return True if(True) else False
                """)
        node_no_space_after_keyword.file = filename
        node_no_space_after_keyword.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_no_space_after_keyword))

        if_message = testutils.Message(
            msg_id='single-space-after-keyword', args=('if'), line=2)
        elif_message = testutils.Message(
            msg_id='single-space-after-keyword', args=('elif'), line=4)
        while_message = testutils.Message(
            msg_id='single-space-after-keyword', args=('while'), line=6)
        yield_message = testutils.Message(
            msg_id='single-space-after-keyword', args=('yield'), line=8)
        if_exp_message = testutils.Message(
            msg_id='single-space-after-keyword', args=('if'), line=9)

        with self.checker_test_object.assertAddsMessages(
            if_message, elif_message, while_message, yield_message,
            if_exp_message):
            temp_file.close()

    def test_multiple_spaces_after_keyword(self):
        node_multiple_spaces_after_keyword = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                if  False:
                    pass
                elif  True:
                    pass
                while  True:
                    pass
                yield  1
                return True if  True else False
                """)
        node_multiple_spaces_after_keyword.file = filename
        node_multiple_spaces_after_keyword.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_multiple_spaces_after_keyword))

        if_message = testutils.Message(
            msg_id='single-space-after-keyword', args=('if'), line=2)
        elif_message = testutils.Message(
            msg_id='single-space-after-keyword', args=('elif'), line=4)
        while_message = testutils.Message(
            msg_id='single-space-after-keyword', args=('while'), line=6)
        yield_message = testutils.Message(
            msg_id='single-space-after-keyword', args=('yield'), line=8)
        if_exp_message = testutils.Message(
            msg_id='single-space-after-keyword', args=('if'), line=9)

        with self.checker_test_object.assertAddsMessages(
            if_message, elif_message, while_message, yield_message,
            if_exp_message):
            temp_file.close()

    def test_single_space_after_keyword(self):
        node_single_space_after_keyword = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""
                if False:
                    pass
                elif True:
                    pass
                while True:
                    pass
                yield 1
                return True if True else False
                """)
        node_single_space_after_keyword.file = filename
        node_single_space_after_keyword.path = filename

        self.checker_test_object.checker.process_tokens(
           pylint_utils.tokenize_module(node_single_space_after_keyword))

        with self.checker_test_object.assertNoMessages():
            temp_file.close()


class InequalityWithNoneCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.InequalityWithNoneChecker)
        self.checker_test_object.setup_method()

    def test_inequality_op_on_none_adds_message(self):
        if_node = astroid.extract_node(
            """
            if x != None: #@
                pass
            """
        )
        compare_node = if_node.test
        not_equal_none_message = testutils.Message(
            msg_id='inequality-with-none', node=compare_node)
        with self.checker_test_object.assertAddsMessages(
            not_equal_none_message
        ):
            self.checker_test_object.checker.visit_compare(compare_node)

    def test_inequality_op_on_none_with_wrapped_none_adds_message(self):
        if_node = astroid.extract_node(
            """
            if x != ( #@
                None
            ):
                pass
            """
        )
        compare_node = if_node.test
        not_equal_none_message = testutils.Message(
            msg_id='inequality-with-none', node=compare_node)
        with self.checker_test_object.assertAddsMessages(
            not_equal_none_message
        ):
            self.checker_test_object.checker.visit_compare(compare_node)

    def test_usage_of_is_not_on_none_does_not_add_message(self):
        if_node = astroid.extract_node(
            """
            if x is not None: #@
                pass
            """
        )
        compare_node = if_node.test
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_compare(compare_node)


class DisallowedFunctionsCheckerTests(unittest.TestCase):
    """Unit tests for DisallowedFunctionsChecker"""

    def setUp(self):
        super().setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DisallowedFunctionsChecker)
        self.checker_test_object.setup_method()

    def test_disallowed_removals_str(self):
        (
            self.checker_test_object
            .checker.config.disallowed_functions_and_replacements_str) = [
                'example_func',
                'a.example_attr',
            ]
        self.checker_test_object.checker.open()

        call1, call2 = astroid.extract_node(
            """
        example_func() #@
        a.example_attr() #@
        """)

        message_remove_example_func = testutils.Message(
            msg_id='remove-disallowed-function-calls',
            node=call1,
            args='example_func',
            confidence=interfaces.UNDEFINED
        )

        message_remove_example_attr = testutils.Message(
            msg_id='remove-disallowed-function-calls',
            node=call2,
            args='a.example_attr',
            confidence=interfaces.UNDEFINED
        )

        with self.checker_test_object.assertAddsMessages(
            message_remove_example_func,
            message_remove_example_attr
        ):
            self.checker_test_object.checker.visit_call(call1)
            self.checker_test_object.checker.visit_call(call2)

    def test_disallowed_replacements_str(self):
        (
            self.checker_test_object
            .checker.config.disallowed_functions_and_replacements_str) = [
                'datetime.datetime.now=>datetime.datetime.utcnow',
                'self.assertEquals=>self.assertEqual',
            ]
        self.checker_test_object.checker.open()

        call1, call2, call3 = astroid.extract_node(
        """
            datetime.datetime.now() #@
            self.assertEquals() #@
            b.a.next() #@
        """)

        message_replace_disallowed_datetime = testutils.Message(
            msg_id='replace-disallowed-function-calls',
            node=call1,
            args=('datetime.datetime.now', 'datetime.datetime.utcnow'),
            confidence=interfaces.UNDEFINED
        )

        message_replace_disallowed_assert_equals = testutils.Message(
            msg_id='replace-disallowed-function-calls',
            node=call2,
            args=('self.assertEquals', 'self.assertEqual'),
            confidence=interfaces.UNDEFINED
        )

        with self.checker_test_object.assertAddsMessages(
            message_replace_disallowed_datetime,
            message_replace_disallowed_assert_equals,
        ):
            self.checker_test_object.checker.visit_call(call1)
            self.checker_test_object.checker.visit_call(call2)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_call(call3)

    def test_disallowed_removals_regex(self):
        (
            self.checker_test_object
            .checker.config.disallowed_functions_and_replacements_regex) = [
                r'.*example_func',
                r'.*\..*example_attr'
            ]
        self.checker_test_object.checker.open()

        call1, call2 = astroid.extract_node(
            """
        somethingexample_func() #@
        c.someexample_attr() #@
        """)

        message_remove_example_func = testutils.Message(
            msg_id='remove-disallowed-function-calls',
            node=call1,
            args='somethingexample_func',
            confidence=interfaces.UNDEFINED
        )

        message_remove_example_attr = testutils.Message(
            msg_id='remove-disallowed-function-calls',
            node=call2,
            args='c.someexample_attr',
            confidence=interfaces.UNDEFINED
        )

        with self.checker_test_object.assertAddsMessages(
            message_remove_example_func,
            message_remove_example_attr
        ):
            self.checker_test_object.checker.visit_call(call1)
            self.checker_test_object.checker.visit_call(call2)

    def test_disallowed_replacements_regex(self):
        (
            self.checker_test_object
            .checker.config.disallowed_functions_and_replacements_regex) = [
                r'.*example_func=>other_func',
                r'.*\.example_attr=>other_attr',
            ]
        self.checker_test_object.checker.open()

        call1, call2, call3, call4 = astroid.extract_node(
            """
        somethingexample_func() #@
        d.example_attr() #@
        d.example_attr() #@
        d.b.example_attr() #@
        """)

        message_replace_example_func = testutils.Message(
            msg_id='replace-disallowed-function-calls',
            node=call1,
            args=('somethingexample_func', 'other_func'),
            confidence=interfaces.UNDEFINED
        )

        message_replace_example_attr1 = testutils.Message(
            msg_id='replace-disallowed-function-calls',
            node=call2,
            args=('d.example_attr', 'other_attr'),
            confidence=interfaces.UNDEFINED
        )

        message_replace_example_attr2 = testutils.Message(
            msg_id='replace-disallowed-function-calls',
            node=call3,
            args=('d.example_attr', 'other_attr'),
            confidence=interfaces.UNDEFINED
        )

        message_replace_example_attr3 = testutils.Message(
            msg_id='replace-disallowed-function-calls',
            node=call4,
            args=('d.b.example_attr', 'other_attr'),
            confidence=interfaces.UNDEFINED
        )

        with self.checker_test_object.assertAddsMessages(
            message_replace_example_func,
            message_replace_example_attr1,
            message_replace_example_attr2,
            message_replace_example_attr3
        ):
            self.checker_test_object.checker.visit_call(call1)
            self.checker_test_object.checker.visit_call(call2)
            self.checker_test_object.checker.visit_call(call3)
            self.checker_test_object.checker.visit_call(call4)


class NonTestFilesFunctionNameCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.NonTestFilesFunctionNameChecker)
        self.checker_test_object.setup_method()

    def test_function_def_for_test_file_with_test_only_adds_no_msg(self):
        def_node = astroid.extract_node(
            """
            def test_only_some_random_function(param1, param2):
                pass
            """
        )
        def_node.root().name = 'random_module_test'

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(def_node)

    def test_function_def_for_test_file_without_test_only_adds_no_msg(self):
        def_node = astroid.extract_node(
            """
            def some_random_function(param1, param2):
                pass
            """
        )
        def_node.root().name = 'random_module_test'

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(def_node)

    def test_function_def_for_non_test_file_with_test_only_adds_msg(self):
        def_node = astroid.extract_node(
            """
            def test_only_some_random_function(param1, param2):
                pass
            """
        )
        def_node.root().name = 'random_module_nontest'
        non_test_function_name_message = testutils.Message(
            msg_id='non-test-files-function-name-checker', node=def_node)

        with self.checker_test_object.assertAddsMessages(
            non_test_function_name_message
        ):
            self.checker_test_object.checker.visit_functiondef(def_node)

    def test_function_def_for_non_test_file_without_test_only_adds_no_msg(self):
        def_node = astroid.extract_node(
            """
            def some_random_function(param1, param2):
                pass
            """
        )
        def_node.root().name = 'random_module_nontest'

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_functiondef(def_node)


class DisallowHandlerWithoutSchemaTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DisallowHandlerWithoutSchema)
        self.checker_test_object.setup_method()

    def test_schema_handlers_without_request_args_raise_error(self):

        schemaless_class_node = astroid.extract_node(
            """
            class BaseHandler():
                HANDLER_ARGS_SCHEMAS = None
                URL_PATH_ARGS_SCHEMAS = None

            class FakeClass(BaseHandler):
                URL_PATH_ARGS_SCHEMAS = {}
            """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='no-schema-for-handler-args',
                node=schemaless_class_node,
                args=(schemaless_class_node.name)
            )
        ):
            self.checker_test_object.checker.visit_classdef(
                schemaless_class_node)

    def test_schema_handlers_without_url_path_args_raise_error(self):

        schemaless_class_node = astroid.extract_node(
            """
            class BaseHandler():
                HANDLER_ARGS_SCHEMAS = None
                URL_PATH_ARGS_SCHEMAS = None

            class FakeClass(BaseHandler):
                HANDLER_ARGS_SCHEMAS = {}
            """)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='no-schema-for-url-path-elements',
                node=schemaless_class_node,
                args=(schemaless_class_node.name)
            )
        ):
            self.checker_test_object.checker.visit_classdef(
                schemaless_class_node)

    def test_handlers_with_valid_schema_do_not_raise_error(self):

        schemaless_class_node = astroid.extract_node(
            """
            class BaseHandler():
                HANDLER_ARGS_SCHEMAS = None
                URL_PATH_ARGS_SCHEMAS = None

            class FakeClass(BaseHandler):
                URL_PATH_ARGS_SCHEMAS = {}
                HANDLER_ARGS_SCHEMAS = {'GET': {}}
            """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_classdef(
                schemaless_class_node)

    def test_list_of_non_schema_handlers_do_not_raise_errors(self):
        """Handler class name in list of
        HANDLER_CLASS_NAMES_WHICH_STILL_NEED_SCHEMAS do not raise error
        for missing schemas.
        """

        schemaless_class_node = astroid.extract_node(
            """
            class BaseHandler():
                HANDLER_ARGS_SCHEMAS = None
                URL_PATH_ARGS_SCHEMAS = None

            class SessionBeginHandler(BaseHandler):
                def get(self):
                    return
            """)

        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_classdef(
                schemaless_class_node)

    def test_schema_handler_with_basehandler_as_an_ancestor_raise_error(self):
        """Handlers which are child classes of BaseHandler must have schema
        defined locally in the class.
        """

        schemaless_class_node = astroid.extract_node(
            """
            class BaseHandler():
                HANDLER_ARGS_SCHEMAS = None
                URL_PATH_ARGS_SCHEMAS = None

            class BaseClass(BaseHandler):
                HANDLER_ARGS_SCHEMAS = {}
                URL_PATH_ARGS_SCHEMAS = {}

            class FakeClass(BaseClass):
                HANDLER_ARGS_SCHEMAS = {}
            """)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='no-schema-for-url-path-elements',
                node=schemaless_class_node,
                args=(schemaless_class_node.name)
            )
        ):
            self.checker_test_object.checker.visit_classdef(
                schemaless_class_node)

    def test_wrong_data_type_in_url_path_args_schema_raise_error(self):
        """Checks whether the schemas in URL_PATH_ARGS_SCHEMAS must be of
        dict type.
        """

        schemaless_class_node = astroid.extract_node(
            """
            class BaseHandler():
                HANDLER_ARGS_SCHEMAS = None
                URL_PATH_ARGS_SCHEMA = None

            class BaseClass(BaseHandler):
                HANDLER_ARGS_SCHEMAS = {}
                URL_PATH_ARGS_SCHEMAS = {}

            class FakeClass(BaseClass):
                URL_PATH_ARGS_SCHEMAS = 5
                HANDLER_ARGS_SCHEMAS = {}
            """)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='url-path-args-schemas-must-be-dict',
                node=schemaless_class_node,
                args=(schemaless_class_node.name)
            )
        ):
            self.checker_test_object.checker.visit_classdef(
                schemaless_class_node)

    def test_wrong_data_type_in_handler_args_schema_raise_error(self):
        """Checks whether the schemas in URL_PATH_ARGS_SCHEMAS must be of
        dict type.
        """

        schemaless_class_node = astroid.extract_node(
            """
            class BaseHandler():
                HANDLER_ARGS_SCHEMAS = None
                URL_PATH_ARGS_SCHEMAS = None

            class BaseClass(BaseHandler):
                HANDLER_ARGS_SCHEMAS = {}
                URL_PATH_ARGS_SCHEMAS = {}

            class FakeClass(BaseClass):
                URL_PATH_ARGS_SCHEMAS = {}
                HANDLER_ARGS_SCHEMAS = 10
            """)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='handler-args-schemas-must-be-dict',
                node=schemaless_class_node,
                args=(schemaless_class_node.name)
            )
        ):
            self.checker_test_object.checker.visit_classdef(
                schemaless_class_node)


class DisallowedImportsCheckerTests(unittest.TestCase):

    def setUp(self):
        super().setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DisallowedImportsChecker)
        self.checker_test_object.setup_method()

    def test_importing_text_from_typing_in_single_line_raises_error(self):
        node = astroid.extract_node("""from typing import Any, cast, Text""")
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='disallowed-text-import',
                node=node,
            )
        ):
            self.checker_test_object.checker.visit_importfrom(
                node)

    def test_importing_text_from_typing_in_multi_line_raises_error(self):
        node = astroid.extract_node(
            """
            from typing import (
                Any, Dict, List, Optional, Sequence, Text, TypeVar)
            """)
        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='disallowed-text-import',
                node=node,
            )
        ):
            self.checker_test_object.checker.visit_importfrom(
                node)

    def test_non_import_of_text_from_typing_does_not_raise_error(self):
        node = astroid.extract_node(
            """
            from typing import Any, Dict, List, Optional
            """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_importfrom(
                node)
