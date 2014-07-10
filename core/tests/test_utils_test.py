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

"""Tests for test_utils, mainly for the FunctionWrapper. """

__author__ = 'Frederik Creemers'

from core.tests import test_utils


class FunctionWrapperTests(test_utils.GenericTestBase):
    """Test for testing test_utils.FunctionWrapper"""

    def test_wrapper_calls_subclass_methods(self):
        """Tests the basic functionality of FunctionWrapper."""

        # Keeps track of which functions have been called, to test that pre_call_hook,
        # the actual function, and post_call_hook are called in the right order.
        order = []
        testcase = self

        class MyWrapper(test_utils.FunctionWrapper):


            def before_call(self, args):
                order.append('before')
                testcase.assertEqual(args.get('foo'), 'foo')
                testcase.assertEqual(args.get('bar'), 'bar')

            def post_call_hook(self, result):
                order.append('after')
                testcase.assertEqual(result, "foobar")

        def function(foo, bar):
            order.append("call")
            return foo + bar

        wrapped = MyWrapper(function)

        self.assertEqual(wrapped('foo', bar='bar'), 'foobar')
        self.assertEqual(order, ['before', 'call', 'after'])

    def test_wrapper_calls_passed_method(self):
        """Tests that FunctionWrapper also works for methods"""
        data = {}

        class A(object):
            def __init__(self, a):
                self.a = a

            def my_method(self, b):
                data['value'] = self.a + b
                return (self.a + b)*2

        wrapped = test_utils.FunctionWrapper(A.my_method)

        with self.swap(A, 'my_method', wrapped):
            val = A('foo').my_method('bar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_class_method(self):
        """Tests that FunctionWrapper also works for class methods"""
        data = {}

        class A(object):
            a = "foo"

            @classmethod
            def class_method(cls, b):
                data['value'] = cls.a + b
                return (cls.a + b)*2

        wrapped = test_utils.FunctionWrapper(A.class_method)
        with self.swap(A, 'class_method', wrapped):
            val = A.class_method('bar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_static_method(self):
        """Tests that FunctionWrapper also works for static methods"""
        data = {}

        class A(object):
            @staticmethod
            def static_method(ab):
                data['value'] = ab
                return ab*2

        wrapped = test_utils.FunctionWrapper(A.static_method)
        with self.swap(A, 'static_method', wrapped):
            val = A.static_method('foobar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_lambdas(self):
        data = {}

        def side_effect(ab):
            data['value'] = ab
            return ab

        l = lambda x: side_effect(x)*2

        wrapped = test_utils.FunctionWrapper(l)
        self.assertEqual(wrapped('foobar'), 'foobarfoobar')
        self.assertEqual(data.get('value'), 'foobar')

class CallCounterTests(test_utils.GenericTestBase):
    def call_counter_counts_the_number_of_times_a_function_gets_called(self):
        f = lambda x: x ** 2

        counter = test_utils.CallCounter(f)

        self.assertEqual(counter.times_called, 0)

        for i in xrange(5):
            self.assertEqual(counter(i), i ** 2)
            self.assertEqual(counter.times_called, i + 1)


class FailingFunctionTests(test_utils.GenericTestBase):
    def test_failing_function_fails_for_first_n_calls(self):
        class CustomError(Exception):
            pass

        function = lambda x: x ** 2

        ff = test_utils.FailingFunction(function, CustomError, 5)

        for i in xrange(5):
            with self.assertRaises(CustomError):
                ff(i)

        self.assertEqual(ff(5), 25)

    def test_failing_function_never_succeeds_when_n_is_negative(self):
        class CustomError(Exception):
            pass

        function = lambda x: x ** 2

        ff = test_utils.FailingFunction(function, CustomError, -42)

        for i in xrange(20):
            with self.assertRaises(CustomError):
                ff(i)

