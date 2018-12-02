# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for test_utils, mainly for the FunctionWrapper."""

from core.tests import test_utils


class FunctionWrapperTests(test_utils.GenericTestBase):
    """Test for testing test_utils.FunctionWrapper."""

    def test_wrapper_calls_subclass_methods(self):
        """Tests the basic functionality of FunctionWrapper."""

        # Keeps track of which functions have been called, to test that
        # pre_call_hook, the actual function, and post_call_hook are
        # called in the right order.
        order = []
        testcase = self

        class MockWrapper(test_utils.FunctionWrapper):

            def pre_call_hook(self, args):
                order.append('before')
                testcase.assertEqual(args.get('posarg'), 'foo')
                testcase.assertEqual(args.get('kwarg'), 'bar')

            def post_call_hook(self, args, result):
                order.append('after')
                testcase.assertEqual(result, 'foobar')
                testcase.assertEqual(args.get('posarg'), 'foo')
                testcase.assertEqual(args.get('kwarg'), 'bar')

        def mock_function(posarg, kwarg):
            order.append('call')
            return posarg + kwarg

        wrapped = MockWrapper(mock_function)

        self.assertEqual(wrapped('foo', kwarg='bar'), 'foobar')
        self.assertEqual(order, ['before', 'call', 'after'])

    def test_wrapper_calls_passed_method(self):
        """Tests that FunctionWrapper also works for methods."""
        data = {}

        class MockClass(object):
            def __init__(self, num1):
                self.num1 = num1

            def mock_method(self, num2):
                data['value'] = self.num1 + num2
                return (self.num1 + num2) * 2

        wrapped = test_utils.FunctionWrapper(MockClass.mock_method)

        with self.swap(MockClass, 'mock_method', wrapped):
            val = MockClass('foo').mock_method('bar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_class_method(self):
        """Tests that FunctionWrapper also works for class methods."""
        data = {}

        class MockClass(object):
            str_attr = 'foo'

            @classmethod
            def mock_classmethod(cls, num):
                data['value'] = cls.str_attr + num
                return (cls.str_attr + num) * 2

        wrapped = test_utils.FunctionWrapper(MockClass.mock_classmethod)
        with self.swap(MockClass, 'mock_classmethod', wrapped):
            val = MockClass.mock_classmethod('bar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_static_method(self):
        """Tests that FunctionWrapper also works for static methods."""
        data = {}

        class MockClass(object):
            @staticmethod
            def mock_staticmethod(num):
                data['value'] = num
                return num * 2

        wrapped = test_utils.FunctionWrapper(MockClass.mock_staticmethod)
        with self.swap(MockClass, 'mock_staticmethod', wrapped):
            val = MockClass.mock_staticmethod('foobar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_lambdas(self):
        data = {}

        def mock_function_with_side_effect(num):
            data['value'] = num
            return num

        mock_lambda = lambda x: mock_function_with_side_effect(x) * 2

        wrapped = test_utils.FunctionWrapper(mock_lambda)
        self.assertEqual(wrapped('foobar'), 'foobarfoobar')
        self.assertEqual(data.get('value'), 'foobar')


class CallCounterTests(test_utils.GenericTestBase):
    def test_call_counter_counts_the_number_of_times_a_function_gets_called(
            self):
        f = lambda x: x ** 2

        wrapped_function = test_utils.CallCounter(f)

        self.assertEqual(wrapped_function.times_called, 0)

        for i in xrange(5):
            self.assertEqual(wrapped_function(i), i ** 2)
            self.assertEqual(wrapped_function.times_called, i + 1)


class FailingFunctionTests(test_utils.GenericTestBase):
    def test_failing_function_fails_for_first_n_calls(self):
        class MockError(Exception):
            pass

        function = lambda x: x ** 2

        failing_func = test_utils.FailingFunction(function, MockError, 5)

        for i in xrange(5):
            with self.assertRaises(MockError):
                failing_func(i)
                raise ValueError(str(i))

        self.assertEqual(failing_func(5), 25)

    def test_failing_function_never_succeeds_when_n_is_infinity(self):
        class MockError(Exception):
            pass

        function = lambda x: x ** 2

        failing_func = test_utils.FailingFunction(
            function, MockError, test_utils.FailingFunction.INFINITY)

        for i in xrange(20):
            with self.assertRaises(MockError):
                failing_func(i)
