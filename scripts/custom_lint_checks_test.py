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

import os
import sys
import tempfile
import unittest

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYLINT_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-1.8.4')
sys.path.insert(0, _PYLINT_PATH)

# Since these module needs to be imported after adding Pylint path,
# we need to disable isort for the below lines to prevent import
# order errors.
# pylint: disable=wrong-import-position
# pylint: disable=relative-import
import astroid  # isort:skip
import custom_lint_checks  # isort:skip
from pylint import testutils  # isort:skip
# pylint: enable=wrong-import-position
# pylint: enable=relative-import


class ExplicitKwargsCheckerTest(unittest.TestCase):

    def test_finds_non_explicit_kwargs(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            custom_lint_checks.ExplicitKwargsChecker)
        checker_test_object.setup_method()
        func_node = astroid.extract_node("""
        def test(test_var_one, test_var_two=4, test_var_three=5, test_var_four="test_checker"): #@
            test_var_five = test_var_two + test_var_three
            return test_var_five
        """)
        checker_test_object.checker.visit_functiondef(func_node)
        func_args = func_node.args
        checker_test_object.checker.visit_arguments(func_args)
        func_call_node_one, func_call_node_two, func_call_node_three = (
            astroid.extract_node("""
        test(2, 5, 6) #@
        test(2) #@
        test(2, 5, 6, test_var_four="test_string") #@
        """))
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='non-explicit-kwargs',
                node=func_call_node_one,
            ),
        ):
            checker_test_object.checker.visit_call(
                func_call_node_one)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_call(
                func_call_node_two)
        with checker_test_object.assertAddsMessages(
            testutils.Message(
                msg_id='non-explicit-kwargs',
                node=func_call_node_three,
            ),
        ):
            checker_test_object.checker.visit_call(
                func_call_node_three)


    class HangingIndentCheckerTest(unittest.TestCase):

        def test_finds_hanging_indent(self):
            checker_test_object = testutils.CheckerTestCase()
            checker_test_object.CHECKER_CLASS = (
                custom_lint_checks.HangingIndentChecker)
            checker_test_object.setup_method()
            node1 = astroid.scoped_nodes.Module(name='test', doc='Custom test')
            temp_file = tempfile.NamedTemporaryFile()
            filename = temp_file.name
            with open(filename, 'w') as tmp:
                tmp.write(
                    """self.post_json('/ml/trainedclassifierhandler', self.payload,
                    expect_errors=True, expected_status_int=401)
                    """)
            node1.file = filename
            node1.path = filename

            checker_test_object.checker.process_module(node1)

            with checker_test_object.assertAddsMessages(
                testutils.Message(
                    msg_id='no-break-after-hanging-indent',
                    line=1
                ),
            ):
                temp_file.close()

            node2 = astroid.scoped_nodes.Module(name='test', doc='Custom test')

            temp_file = tempfile.NamedTemporaryFile()
            filename = temp_file.name
            with open(filename, 'w') as tmp:
                tmp.write(
                    """master_translation_dict = json.loads(
                    utils.get_file_contents(os.path.join(
                    os.getcwd(), 'assets', 'i18n', 'en.json')))
                    """)
            node2.file = filename
            node2.path = filename

            checker_test_object.checker.process_module(node2)

            with checker_test_object.assertNoMessages():
                temp_file.close()


class DocstringParameterCheckerTest(unittest.TestCase):
    
    def test_finds_docstring_parameter(self):
        checker_test_object = testutils.CheckerTestCase()
        checker_test_object.CHECKER_CLASS = (
            custom_lint_checks.DocstringParameterChecker)
        checker_test_object.setup_method()
        func_node = astroid.extract_node("""
        def test(test_var_one, test_var_two, test_var_three): #@
            \"\"\"Function to test docstring parameters.

            Args:
                test_var_one: int. First test variable.
                test_var_two: str. Second test variable.
                test_var_three: list(str). Third test variable.

            Returns:
                str. The test result.

           Yields:
                list(str). The test list.
            \"\"\"
        """)
        with checker_test_object.assertNoMessages():
            checker_test_object.checker.visit_functiondef(func_node)
