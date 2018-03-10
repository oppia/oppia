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
# https://github.com/oppia/oppia/wiki/Writing-Tests

import os
import sys

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYLINT_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pylint-1.7.1')
sys.path.insert(0, _PYLINT_PATH)

# Since this module needs to be imported after adding Isort path,
# we need to disable isort for this line.
# pylint: disable=wrong-import-position
# pylint: disable=relative-import
import astroid  #isort:skip
import explicit_kwargs_checker  #isort:skip

import pylint.testutils  # isort:skip


class ExplicitKwargsCheckerTest(pylint.testutils.CheckerTestCase):
    CHECKER_CLASS = explicit_kwargs_checker.ExplicitKwargsChecker

    def test_finds_non_explicit_kwargs(self):
        func_node = astroid.extract_node("""
        def test(test_var_one, test_var_two=4, test_var_three=5, test_var_four="test_checker"): #@
            test_var_five = test_var_two + test_var_three
            return test_var_five
        """)
        self.checker.visit_functiondef(func_node)
        func_args = func_node.args
        self.checker.visit_arguments(func_args)
        func_call_node_one, func_call_node_two, func_call_node_three = (
            astroid.extract_node("""
        test(2, 5, 6) #@
        test(2) #@
        test(2, 5, 6, test_var_four="test_string") #@
        """))
        with self.assertAddsMessages(
            pylint.testutils.Message(
                msg_id='non-explicit-kwargs',
                node=func_call_node_one,
            ),
        ):
            self.checker.visit_call(func_call_node_one)
        with self.assertNoMessages():
            self.checker.visit_call(func_call_node_two)
        with self.assertAddsMessages(
            pylint.testutils.Message(
                msg_id='non-explicit-kwargs',
                node=func_call_node_three,
            ),
        ):
            self.checker.visit_call(func_call_node_three)


def main():
    # Create  an instance of the class.
    explicit_kwargs_checker_test_obj = ExplicitKwargsCheckerTest()
    # Initialize the test object.
    explicit_kwargs_checker_test_obj.setup_method()
    # Call the test method.
    explicit_kwargs_checker_test_obj.test_finds_non_explicit_kwargs()


if __name__ == '__main__':
    main()
