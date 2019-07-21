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

import os
import sys
import tempfile

from core.tests import test_utils
from scripts import pylint_extensions

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYLINT_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-1.9.4')
sys.path.insert(0, _PYLINT_PATH)

# Since these module needs to be imported after adding Pylint path,
# we need to disable isort for the below lines to prevent import
# order errors.
# pylint: disable=wrong-import-position
# pylint: disable=relative-import
import astroid  # isort:skip
from pylint import testutils  # isort:skip
from pylint.lint import PyLinter  # isort:skip  # pylint: disable=import-only-modules
# pylint: enable=wrong-import-position
# pylint: enable=relative-import


class ExplicitKeywordArgsCheckerTests(test_utils.GenericTestBase):

    def test_finds_non_explicit_keyword_args(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.ExplicitKeywordArgsChecker)
        checker_test_object.setup_method()
        (
            func_call_node_one, func_call_node_two, func_call_node_three,
            func_call_node_four, func_call_node_five, class_call_node) = (
                astroid.extract_node("""
        class TestClass():
            pass

        def test(test_var_one, test_var_two=4, test_var_three=5, test_var_four="test_checker"):
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
        """))
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

    def test_register(self):
        pylinter_instance = PyLinter()
        pylint_extensions.register(pylinter_instance)


class HangingIndentCheckerTests(test_utils.GenericTestBase):

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
        with open(filename, 'w') as tmp:
            tmp.write(
                """self.post_json('/ml/trainedclassifierhandler',
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

        node_no_err_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with open(filename, 'w') as tmp:
            tmp.write(
                """\"""Some multiline
                docstring.
                \"""
                # Load JSON.
                master_translation_dict = json.loads(
                utils.get_file_contents(os.path.join(
                os.getcwd(), 'assets', 'i18n', 'en.json')))
                """)
        node_no_err_message.file = filename
        node_no_err_message.path = filename

        checker_test_object.checker.process_module(node_no_err_message)

        with checker_test_object.assertNoMessages():
            temp_file.close()

        node_no_err_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with open(filename, 'w') as tmp:
            tmp.write(
                """self.post_json('/',
                self.payload, expect_errors=True, expected_status_int=401)""")
        node_no_err_message.file = filename
        node_no_err_message.path = filename

        checker_test_object.checker.process_module(node_no_err_message)

        with checker_test_object.assertNoMessages():
            temp_file.close()



class DocstringParameterCheckerTests(test_utils.GenericTestBase):

    def test_finds_docstring_parameter(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.DocstringParameterChecker)
        checker_test_object.setup_method()
        func_node, return_node = astroid.extract_node("""
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
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_functiondef(func_node)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_return(return_node)

        func_node, yield_node = astroid.extract_node("""
        def test(test_var_one, test_var_two): #@
            \"\"\"Function to test docstring parameters.\"\"\"
            result = test_var_one + test_var_two
            yield result #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_functiondef(func_node)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_yield(yield_node)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_return(yield_node)

        func_node, yield_node = astroid.extract_node("""
        class Test(object):
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
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='redundant-returns-doc',
                node=func_node
            ),
        ):
            checker_test_object.checker.visit_functiondef(func_node)
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='missing-yield-doc',
                node=func_node
            ), testutils.Message(
                msg_id='missing-yield-type-doc',
                node=func_node
            ),
        ):
            checker_test_object.checker.visit_yieldfrom(yield_node)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_return(yield_node)

        func_node, return_node = astroid.extract_node("""
        class Test(object):
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
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='redundant-yields-doc',
                node=func_node
            ),
        ):
            checker_test_object.checker.visit_functiondef(func_node)
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='missing-return-doc',
                node=func_node
            ), testutils.Message(
                msg_id='missing-return-type-doc',
                node=func_node
            ),
        ):
            checker_test_object.checker.visit_return(return_node)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_yield(return_node)

        func_node, raise_node = astroid.extract_node("""
        def func(test_var_one, test_var_two): #@
            \"\"\"Function to test docstring parameters.

            Args:
                test_var_one: int. First test variable.
                test_var_two: str. Second test variable.

            Raises:
                Exception: An exception.
            \"\"\"
            raise Exception #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_raise(raise_node)

        func_node, raise_node = astroid.extract_node("""
        def func(test_var_one, test_var_two): #@
            \"\"\"Function to test raising exceptions.

            Args:
                test_var_one: int. First test variable.
                test_var_two: str. Second test variable.
            \"\"\"
            raise Exception #@
        """)
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='missing-raises-doc',
                args=('Exception',),
                node=func_node
            ),
        ):
            checker_test_object.checker.visit_raise(raise_node)

        raise_node = astroid.extract_node("""
        class Test(object):
            raise Exception #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_raise(raise_node)

        raise_node = astroid.extract_node("""
        class Test():
            @property
            def decorator_func(self):
                pass

            @decorator_func.setter
            @property
            def func(self):
                raise Exception #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_raise(raise_node)

        raise_node = astroid.extract_node("""
        class Test():
            def func(self):
                raise Exception #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_raise(raise_node)

        raise_node = astroid.extract_node("""
        def func():
            try:
                raise Exception #@
            except Exception:
                pass
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_raise(raise_node)

        raise_node = astroid.extract_node("""
        def func():
            \"\"\"Function to test raising exceptions.\"\"\"
            raise Exception #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_raise(raise_node)

        raise_node = astroid.extract_node('''
        def my_func(self):
            """This is a docstring.
            :raises NameError: Never
            """
            def ex_func(val):
                return RuntimeError(val)
            raise ex_func('hi') #@
            raise NameError('hi')
        ''')
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_raise(raise_node)

        raise_node = astroid.extract_node('''
        from unknown import Unknown
        def my_func(self):
            """This is a docstring.
            :raises NameError: Never
            """
            raise Unknown('hi') #@
            raise NameError('hi')
        ''')
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_raise(raise_node)

        raise_node = astroid.extract_node('''
        def my_func(self):
            """This is a docstring.
            :raises NameError: Never
            """
            def ex_func(val):
                def inner_func(value):
                    return OSError(value)
                return RuntimeError(val)
            raise ex_func('hi') #@
            raise NameError('hi')
        ''')
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_raise(raise_node)

        return_node = astroid.extract_node("""
        def func():
            \"\"\"Function to test return values.\"\"\"
            return None #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_return(return_node)

        return_node = astroid.extract_node("""
        def func():
            \"\"\"Function to test return values.\"\"\"
            return #@
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_return(return_node)

        func_node = astroid.extract_node("""
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
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='missing-param-doc',
                node=func_node,
                args=('args, kwargs',),
            ),
        ):
            checker_test_object.checker.visit_functiondef(func_node)

        func_node = astroid.extract_node("""
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
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='missing-param-doc',
                node=func_node,
                args=('test_var_two',),
            ), testutils.Message(
                msg_id='missing-type-doc',
                node=func_node,
                args=('test_var_two',),
            ), testutils.Message(
                msg_id='differing-param-doc',
                node=func_node,
                args=('invalid_var_name',),
            ), testutils.Message(
                msg_id='differing-type-doc',
                node=func_node,
                args=('invalid_var_name',),
            ),
        ):
            checker_test_object.checker.visit_functiondef(func_node)

        class_node, func_node = astroid.extract_node("""
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
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='multiple-constructor-doc',
                node=class_node,
                args=(class_node.name,),
            ),
        ):
            checker_test_object.checker.visit_functiondef(func_node)


class ImportOnlyModulesCheckerTests(test_utils.GenericTestBase):

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


class BackslashContinuationCheckerTests(test_utils.GenericTestBase):

    def test_finds_backslash_continuation(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            pylint_extensions.BackslashContinuationChecker)
        checker_test_object.setup_method()
        node = astroid.scoped_nodes.Module(name='test', doc='Custom test')
        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name

        with open(filename, 'w') as tmp:
            tmp.write(
                """message1 = 'abc'\\\n""" # pylint: disable=backslash-continuation
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


class FunctionArgsOrderCheckerTests(test_utils.GenericTestBase):

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


class RestrictedImportCheckerTests(test_utils.GenericTestBase):

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


class SingleCharAndNewlineAtEOFCheckerTests(test_utils.GenericTestBase):

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

        with open(filename, 'w') as tmp:
            tmp.write(
                """c = 'something dummy'
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
        with open(filename, 'w') as tmp:
            tmp.write("""1""")
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

        node_no_err_message = astroid.scoped_nodes.Module(
            name='test',
            doc='Custom test')

        temp_file = tempfile.NamedTemporaryFile()
        filename = temp_file.name
        with open(filename, 'w') as tmp:
            tmp.write("""x = 'something dummy'""")
        node_no_err_message.file = filename
        node_no_err_message.path = filename

        checker_test_object.checker.process_module(node_no_err_message)

        with checker_test_object.assertNoMessages():
            temp_file.close()
