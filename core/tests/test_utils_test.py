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

        class MyWrapper(test_utils.FunctionWrapper):

            def pre_call_hook(self, args):
                order.append('before')
                testcase.assertEqual(args.get('posarg'), 'foo')
                testcase.assertEqual(args.get('kwarg'), 'bar')

            def post_call_hook(self, args, result):
                order.append('after')
                testcase.assertEqual(result, 'foobar')
                testcase.assertEqual(args.get('posarg'), 'foo')
                testcase.assertEqual(args.get('kwarg'), 'bar')

        def function(posarg, kwarg):
            order.append("call")
            return posarg + kwarg

        wrapped = MyWrapper(function)

        self.assertEqual(wrapped('foo', kwarg='bar'), 'foobar')
        self.assertEqual(order, ['before', 'call', 'after'])

    def test_wrapper_calls_passed_method(self):
        """Tests that FunctionWrapper also works for methods."""
        data = {}

        class Klass(object):
            def __init__(self, num1):
                self.num1 = num1

            def my_method(self, num2):
                data['value'] = self.num1 + num2
                return (self.num1 + num2) * 2

        wrapped = test_utils.FunctionWrapper(Klass.my_method)

        with self.swap(Klass, 'my_method', wrapped):
            val = Klass('foo').my_method('bar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_class_method(self):
        """Tests that FunctionWrapper also works for class methods."""
        data = {}

        class Klass(object):
            str_attr = 'foo'

            @classmethod
            def class_method(cls, num):
                data['value'] = cls.str_attr + num
                return (cls.str_attr + num) * 2

        wrapped = test_utils.FunctionWrapper(Klass.class_method)
        with self.swap(Klass, 'class_method', wrapped):
            val = Klass.class_method('bar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_static_method(self):
        """Tests that FunctionWrapper also works for static methods."""
        data = {}

        class Klass(object):
            @staticmethod
            def static_method(num):
                data['value'] = num
                return num * 2

        wrapped = test_utils.FunctionWrapper(Klass.static_method)
        with self.swap(Klass, 'static_method', wrapped):
            val = Klass.static_method('foobar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_lambdas(self):
        data = {}

        def side_effect(num):
            data['value'] = num
            return num

        l = lambda x: side_effect(x) * 2

        wrapped = test_utils.FunctionWrapper(l)
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
        class CustomError(Exception):
            pass

        function = lambda x: x ** 2

        failing_func = test_utils.FailingFunction(function, CustomError, 5)

        for i in xrange(5):
            with self.assertRaises(CustomError):
                failing_func(i)
                raise ValueError(str(i))

        self.assertEqual(failing_func(5), 25)

    def test_failing_function_never_succeeds_when_n_is_infinity(self):
        class CustomError(Exception):
            pass

        function = lambda x: x ** 2

        failing_func = test_utils.FailingFunction(
            function, CustomError, test_utils.FailingFunction.INFINITY)

        for i in xrange(20):
            with self.assertRaises(CustomError):
                failing_func(i)
