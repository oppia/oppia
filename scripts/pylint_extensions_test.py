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


class ExplicitKeywordArgsCheckerTests(unittest.TestCase):

    def test_finds_non_explicit_keyword_args(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.ExplicitKeywordArgsChecker)
        checker_test_object.setup_method()
        (
            func_call_node_one, func_call_node_two, func_call_node_three,
            func_call_node_four, func_call_node_five, func_call_node_six,
            class_call_node) = astroid.extract_node("""
        class TestClass():
            pass

        def test(test_var_one, test_var_two=4, test_var_three=5, test_var_four="test_checker"):
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
        with checker_test_object.assertAddsMessages(
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
            checker_test_object.checker.visit_call(
                func_call_node_one)

        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_call(
                func_call_node_two)

        with checker_test_object.assertAddsMessages(
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
            checker_test_object.checker.visit_call(
                func_call_node_three)

        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_call(class_call_node)

        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_call(func_call_node_four)

        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_call(func_call_node_five)

        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_call(func_call_node_six)

    def test_register(self):
        pylinter_instance = lint.PyLinter()
        pylint_extensions.register(pylinter_instance)


class HangingIndentCheckerTests(unittest.TestCase):

    def test_finds_hanging_indent(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.HangingIndentChecker)
        checker_test_object.setup_method()
        node_break_after_hanging_indent = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""self.post_json('/ml/trainedclassifierhandler',
                self.payload, expect_errors=True, expected_status_int=401)
                """)
        node_break_after_hanging_indent.file = filename
        node_break_after_hanging_indent.path = filename

        checker_test_object.checker.process_module(
            node_break_after_hanging_indent)

        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='no-break-after-hanging-indent',
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
            tmp.write(
                u"""\"""Some multiline
                docstring.
                \"""
                # Load JSON.
                master_translation_dict = json.loads(
                utils.get_file_contents(os.path.join(
                os.getcwd(), 'assets', 'i18n', 'en.json')))
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        checker_test_object.checker.process_module(node_with_no_error_message)

        with checker_test_object.assertNoMessages():
            temp_file.close()

        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""self.post_json('/',
                self.payload, expect_errors=True, expected_status_int=401)""")
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        checker_test_object.checker.process_module(node_with_no_error_message)

        with checker_test_object.assertNoMessages():
            temp_file.close()


class DocstringParameterCheckerTests(unittest.TestCase):

    def setUp(self):
        super(DocstringParameterCheckerTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DocstringParameterChecker)
        self.checker_test_object.setup_method()

    def test_finds_docstring_parameter(self):
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DocstringParameterChecker)
        self.checker_test_object.setup_method()
        valid_func_node, valid_return_node = astroid.extract_node("""
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

        valid_func_node, valid_yield_node = astroid.extract_node("""
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
            missing_yield_type_yield_node) = astroid.extract_node("""
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
            missing_return_type_return_node) = astroid.extract_node("""
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

        valid_raise_node = astroid.extract_node("""
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
            missing_raise_type_raise_node) = astroid.extract_node("""
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

        valid_raise_node = astroid.extract_node("""
        class Test(python_utils.OBJECT):
            raise Exception #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_raise_node = astroid.extract_node("""
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

        valid_raise_node = astroid.extract_node("""
        class Test():
            def func(self):
                raise Exception #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_raise_node = astroid.extract_node("""
        def func():
            try:
                raise Exception #@
            except Exception:
                pass
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_raise_node = astroid.extract_node("""
        def func():
            \"\"\"Function to test raising exceptions.\"\"\"
            raise Exception #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_raise(valid_raise_node)

        valid_raise_node = astroid.extract_node("""
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

        valid_raise_node = astroid.extract_node("""
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

        valid_raise_node = astroid.extract_node("""
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

        valid_return_node = astroid.extract_node("""
        def func():
            \"\"\"Function to test return values.\"\"\"
            return None #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_return(valid_return_node)

        valid_return_node = astroid.extract_node("""
        def func():
            \"\"\"Function to test return values.\"\"\"
            return #@
        """)
        with self.checker_test_object.assertNoMessages():
            self.checker_test_object.checker.visit_return(valid_return_node)

        missing_param_func_node = astroid.extract_node("""
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

        missing_param_func_node = astroid.extract_node("""
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
        ):
            self.checker_test_object.checker.visit_functiondef(
                missing_param_func_node)

        class_node, multiple_constructor_func_node = astroid.extract_node("""
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
        node = astroid.extract_node("""
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
        importfrom_node1 = astroid.extract_node("""
            from os import path #@
            import sys
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_importfrom(importfrom_node1)

        importfrom_node2 = astroid.extract_node("""
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

        importfrom_node3 = astroid.extract_node("""
            from invalid_module import invalid_module #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_importfrom(importfrom_node3)

        importfrom_node4 = astroid.extract_node("""
            from constants import constants #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_importfrom(importfrom_node4)

        importfrom_node5 = astroid.extract_node("""
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

        importfrom_node6 = astroid.extract_node("""
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
                """'cde'\\\n""" # pylint: disable=backslash-continuation
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
        functiondef_node1 = astroid.extract_node("""
        def test(self,test_var_one, test_var_two): #@
            result = test_var_one + test_var_two
            return result
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_functiondef(functiondef_node1)

        functiondef_node2 = astroid.extract_node("""
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

        functiondef_node3 = astroid.extract_node("""
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
        node_err_import = astroid.extract_node("""
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
        node_no_err_import = astroid.extract_node("""
            import core.platform.email.gae_email_services #@
        """)
        node_no_err_import.root().name = 'oppia.core.storage.topic'
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_import(node_no_err_import)

        # Tests the case wherein storage layer imports domain layer
        # in import-from statements.
        node_err_importfrom = astroid.extract_node("""
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
        node_no_err_importfrom = astroid.extract_node("""
            from core.platform.email import gae_email_services #@
        """)
        node_no_err_importfrom.root().name = 'oppia.core.storage.topicl'
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_importfrom(node_no_err_importfrom)

        # Tests the case wherein domain layer imports controller layer
        # in import statements.
        node_err_import = astroid.extract_node("""
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
        node_no_err_import = astroid.extract_node("""
            import core.platform.email.gae_email_services_test #@
        """)
        node_no_err_import.root().name = 'oppia.core.domain'
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_import(node_no_err_import)

        # Tests the case wherein domain layer imports controller layer
        # in import-from statements.
        node_err_importfrom = astroid.extract_node("""
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
        node_no_err_importfrom = astroid.extract_node("""
            from core.platform.email import gae_email_services_test #@
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
                    yield (5, 2)
                """)
        node_well_formed_one_line_yield_file.file = filename
        node_well_formed_one_line_yield_file.path = filename

        self.checker_test_object.checker.process_module(
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

        self.checker_test_object.checker.process_module(
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

        self.checker_test_object.checker.process_module(
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

        self.checker_test_object.checker.process_module(
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

        self.checker_test_object.checker.process_module(
            node_too_many_spaces_after_yield_file)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='single-space-after-yield',
                line=2
            ),
        ):
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

        self.checker_test_object.checker.process_module(
            node_no_spaces_after_yield_file)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='single-space-after-yield',
                line=2
            ),
        ):
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


class SingleNewlineAboveArgsCheckerTests(unittest.TestCase):

    def setUp(self):
        super(SingleNewlineAboveArgsCheckerTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.SingleNewlineAboveArgsChecker)
        self.checker_test_object.setup_method()

    def test_no_newline_above_args(self):
        node_single_newline_above_args = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func(arg):
                        '''Do something.
                        Args:
                            arg: argument
                        '''
                        do something
                """)
        node_single_newline_above_args.file = filename
        node_single_newline_above_args.path = filename

        self.checker_test_object.checker.process_module(
            node_single_newline_above_args)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='single-space-above-args',
                line=2
            ),
        ):
            temp_file.close()

    def test_no_newline_above_raises(self):
        node_single_newline_above_raises = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func():
                        '''Raises exception.
                        Raises:
                            raises_exception
                        '''
                        raises_exception
                """)
        node_single_newline_above_raises.file = filename
        node_single_newline_above_raises.path = filename

        self.checker_test_object.checker.process_module(
            node_single_newline_above_raises)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='single-space-above-raises',
                line=2
            ),
        ):
            temp_file.close()

    def test_no_newline_above_return(self):
        node_with_no_space_above_return = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func():
                    '''Returns something.
                    Returns:
                        returns_something
                    '''
                    returns_something
                """)
        node_with_no_space_above_return.file = filename
        node_with_no_space_above_return.path = filename

        self.checker_test_object.checker.process_module(
            node_with_no_space_above_return)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='single-space-above-returns',
                line=2
            ),
        ):
            temp_file.close()

    def test_varying_combination_of_newline_above_args(self):
        node_newline_above_args_raises = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func(arg):
                    '''Raises exception.

                    Args:
                        arg: argument
                    Raises:
                        raises_something
                    '''
                    raises_exception
                """)
        node_newline_above_args_raises.file = filename
        node_newline_above_args_raises.path = filename

        self.checker_test_object.checker.process_module(
            node_newline_above_args_raises)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='single-space-above-raises',
                line=5
            ),
        ):
            temp_file.close()

        node_newline_above_args_returns = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func(arg):
                    '''Returns Something.

                    Args:
                        arg: argument
                    Returns:
                        returns_something
                    '''
                    returns_something
                """)
        node_newline_above_args_returns.file = filename
        node_newline_above_args_returns.path = filename

        self.checker_test_object.checker.process_module(
            node_newline_above_args_returns)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='single-space-above-returns',
                line=5
            ),
        ):
            temp_file.close()

        node_newline_above_returns_raises = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func():
                    '''Do something.



                    Raises:
                        raises_exception

                    Returns:
                        returns_something
                    '''
                    raises_exception
                    returns_something
                """)
        node_newline_above_returns_raises.file = filename
        node_newline_above_returns_raises.path = filename

        self.checker_test_object.checker.process_module(
            node_newline_above_returns_raises)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='single-space-above-raises',
                line=5
            ),
        ):
            temp_file.close()

    def test_excessive_newline_above_args(self):
        node_with_two_newline = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func(arg):
                        '''Returns something.


                        Args:
                            arg: argument


                        Returns:
                            returns_something
                        '''
                        returns something
                """)
        node_with_two_newline.file = filename
        node_with_two_newline.path = filename

        self.checker_test_object.checker.process_module(
            node_with_two_newline)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='single-space-above-args',
                line=4
            ),
            testutils.Message(
                msg_id='single-space-above-returns',
                line=8
            ),
        ):
            temp_file.close()

    def test_return_in_comment(self):
        node_with_return_in_comment = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func(arg):
                        '''Returns something.

                        Args:
                            arg: argument

                        Returns:
                            returns_something
                        '''
                        "Returns: something"
                        returns_something
                """)
        node_with_return_in_comment.file = filename
        node_with_return_in_comment.path = filename

        self.checker_test_object.checker.process_module(
            node_with_return_in_comment)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_function_with_no_args(self):
        node_with_no_args = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func():
                    '''Do something.'''

                    do something
                """)
        node_with_no_args.file = filename
        node_with_no_args.path = filename

        self.checker_test_object.checker.process_module(
            node_with_no_args)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_well_placed_newline(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""def func(arg):
                        '''Returns something.

                        Args:
                            arg: argument

                        Returns:
                            returns_something

                        Raises:
                            raises something
                        '''
                        raises_something
                        returns_something
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_module(
            node_with_no_error_message)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()


class DivisionOperatorCheckerTests(unittest.TestCase):

    def setUp(self):
        super(DivisionOperatorCheckerTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DivisionOperatorChecker)
        self.checker_test_object.setup_method()

    def test_division_operator(self):
        node_division_operator = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""division = a / b
                    division=a/b
                """)
        node_division_operator.file = filename
        node_division_operator.path = filename

        self.checker_test_object.checker.process_module(node_division_operator)

        with self.checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='division-operator-used',
                line=1
            ),
            testutils.Message(
                msg_id='division-operator-used',
                line=2
            ),
        ):
            temp_file.close()

    def test_division_operator_inside_single_line_comment(self):
        node_single_line_comment = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""# Division = a / b.
                    division = python_utils.divide(a, b)
                """)
        node_single_line_comment.file = filename
        node_single_line_comment.path = filename

        self.checker_test_object.checker.process_module(
            node_single_line_comment)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_division_operator_inside_string(self):
        node_division_inside_string = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""string = 'a / b or a/b' + 'a/b'
                    division = python_utils.divide(a, b)
                """)
        node_division_inside_string.file = filename
        node_division_inside_string.path = filename

        self.checker_test_object.checker.process_module(
            node_division_inside_string)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_divide_method_used(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""division = python_utils.divide(a, b)""")
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_module(
            node_with_no_error_message)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()


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


class DocstringCheckerTests(unittest.TestCase):

    def setUp(self):
        super(DocstringCheckerTests, self).setUp()
        self.checker_test_object = testutils.CheckerTestCase()
        self.checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DocstringChecker)
        self.checker_test_object.setup_method()

    def test_space_after_docstring(self):
        node_space_after_docstring = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""class ABC(something):
                        \"\"\" Hello world.\"\"\"
                        Something
                """)
        node_space_after_docstring.file = filename
        node_space_after_docstring.path = filename

        self.checker_test_object.checker.process_module(
            node_space_after_docstring)

        message = testutils.Message(
            msg_id='space-after-triple-quote',
            line=2)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_single_line_docstring_span_two_lines(self):
        node_single_line_docstring_span_two_lines = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""class ABC(arg):
                        \"\"\"This is a docstring.
                        \"\"\"
                        Something
                """)
        node_single_line_docstring_span_two_lines.file = filename
        node_single_line_docstring_span_two_lines.path = filename

        self.checker_test_object.checker.process_module(
            node_single_line_docstring_span_two_lines)

        message = testutils.Message(
            msg_id='single-line-docstring-span-two-lines',
            line=3)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_no_period_at_end(self):
        node_no_period_at_end = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""class ABC(arg):
                        \"\"\"This is a docstring\"\"\"
                        Something
                """)
        node_no_period_at_end.file = filename
        node_no_period_at_end.path = filename

        self.checker_test_object.checker.process_module(node_no_period_at_end)

        message = testutils.Message(
            msg_id='no-period-used',
            line=2)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_empty_line_before_end_of_docstring(self):
        node_empty_line_before_end = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""class ABC(arg):
                        \"\"\"This is a docstring.

                        \"\"\"
                        Something
                """)
        node_empty_line_before_end.file = filename
        node_empty_line_before_end.path = filename

        self.checker_test_object.checker.process_module(
            node_empty_line_before_end)

        message = testutils.Message(
            msg_id='empty-line-before-end',
            line=4)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_no_period_at_end_of_a_multiline_docstring(self):
        node_no_period_at_end = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""class ABC(arg):
                        \"\"\"This is a docstring.
                            Args:
                                arg: variable
                        \"\"\"
                        Something
                """)
        node_no_period_at_end.file = filename
        node_no_period_at_end.path = filename

        self.checker_test_object.checker.process_module(node_no_period_at_end)

        message = testutils.Message(
            msg_id='no-period-used',
            line=5)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_no_newline_at_end_of_multi_line_docstring(self):
        node_no_newline_at_end = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""class ABC(arg):
                        \"\"\"This is a docstring.
                            Args:
                                arg: variable.\"\"\"
                        Something
                """)
        node_no_newline_at_end.file = filename
        node_no_newline_at_end.path = filename

        self.checker_test_object.checker.process_module(node_no_newline_at_end)

        message = testutils.Message(
            msg_id='no-newline-used-at-end',
            line=4)

        with self.checker_test_object.assertAddsMessages(message):
            temp_file.close()

    def test_well_formed_single_line_docstring(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""class ABC(arg):
                        \"\"\"This is a docstring.\"\"\"
                        Something
                """)
        node_with_no_error_message.file = filename
        node_with_no_error_message.path = filename

        self.checker_test_object.checker.process_module(
            node_with_no_error_message)

        with self.checker_test_object.assertNoMessages():
            temp_file.close()

    def test_well_formed_multi_line_docstring(self):
        node_with_no_error_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with python_utils.open_file(filename, 'w') as tmp:
            tmp.write(
                u"""class ABC(arg):
                        \"\"\"This is a docstring.
                            Args:
                                arg: variable.
                        \"\"\"
                        Something
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
