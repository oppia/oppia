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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

from constants import constants
from core import jobs
from core.domain import param_domain
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf
import python_utils
import utils

exp_models, = models.Registry.import_models([models.NAMES.exploration])


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
                """Mock pre call hook.

                Args:
                    args: ArgumentParser. The specified arguments to be checked
                        with the mock names.

                Raises:
                    AssertionError: The argument doesn't match with the mock
                        name.
                """
                order.append('before')
                testcase.assertEqual(args.get('posarg'), 'foo')
                testcase.assertEqual(args.get('kwarg'), 'bar')

            def post_call_hook(self, args, result):
                """Mock post call hook.

                Args:
                    args: ArgumentParser. The specified arguments to be checked
                        with the mock names.
                    result: str. The string to be checked with the mock name.

                Raises:
                    AssertionError: The argument doesn't match with the mock
                        name.
                """
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

        class MockClass(python_utils.OBJECT):
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

        class MockClass(python_utils.OBJECT):
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

        class MockClass(python_utils.OBJECT):
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

    def test_pre_call_hook_does_nothing(self):
        function = lambda x: x ** 2
        wrapped = test_utils.FunctionWrapper(function)

        self.assertIsNone(wrapped.pre_call_hook('args'))


class CallCounterTests(test_utils.GenericTestBase):
    def test_call_counter_counts_the_number_of_times_a_function_gets_called(
            self):
        f = lambda x: x ** 2

        wrapped_function = test_utils.CallCounter(f)

        self.assertEqual(wrapped_function.times_called, 0)

        for i in python_utils.RANGE(5):
            self.assertEqual(wrapped_function(i), i ** 2)
            self.assertEqual(wrapped_function.times_called, i + 1)


class FailingFunctionTests(test_utils.GenericTestBase):

    def test_failing_function_never_succeeds_when_n_is_infinity(self):
        class MockError(Exception):
            pass

        function = lambda x: x ** 2

        failing_func = test_utils.FailingFunction(
            function, MockError, test_utils.FailingFunction.INFINITY)

        for i in python_utils.RANGE(20):
            with self.assertRaises(MockError):
                failing_func(i)

    def test_failing_function_raises_error_with_invalid_num_tries(self):
        class MockError(Exception):
            pass

        function = lambda x: x ** 2

        with self.assertRaisesRegexp(
            ValueError,
            'num_tries_before_success should either be an integer greater than '
            'or equal to 0, or FailingFunction.INFINITY'):
            test_utils.FailingFunction(function, MockError, -1)


class FailingMapReduceJobManager(jobs.BaseMapReduceJobManager):
    """Test job that fails because map is a classmethod."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return []

    @classmethod
    def map(cls):
        pass


class TestUtilsTests(test_utils.GenericTestBase):

    def test_failing_job(self):
        self.assertIsNone(FailingMapReduceJobManager.map())

        job_id = FailingMapReduceJobManager.create_new()
        FailingMapReduceJobManager.enqueue(
            job_id, taskqueue_services.QUEUE_NAME_DEFAULT)
        self.assertEqual(
            self.count_jobs_in_taskqueue(None), 1)
        with self.assertRaisesRegexp(
            RuntimeError, 'MapReduce task to URL .+ failed'):
            self.process_and_flush_pending_tasks()

    def test_get_static_asset_url(self):
        asset_url = self.get_static_asset_url('/images/subjects/Lightbulb.svg')
        self.assertEqual(asset_url, '/assets/images/subjects/Lightbulb.svg')

    def test_get_static_asset_filepath_with_prod_mode_on(self):
        with self.swap(constants, 'DEV_MODE', False):
            filepath = self.get_static_asset_filepath()
            self.assertEqual(filepath, 'build')

    def test_cannot_get_updated_param_dict_with_invalid_param_name(self):
        param_change_list = [
            param_domain.ParamChange(
                'a', 'Copier', {
                    'value': 'firstValue', 'parse_with_jinja': False
                }
            )
        ]
        exp_param_specs = {
            'b': param_domain.ParamSpec('UnicodeString'),
        }

        with self.assertRaisesRegexp(Exception, 'Parameter a not found'):
            self.get_updated_param_dict(
                {}, param_change_list, exp_param_specs)

    def test_cannot_save_new_linear_exp_with_no_state_name(self):
        with self.assertRaisesRegexp(
            ValueError, 'must provide at least one state name'):
            self.save_new_linear_exp_with_state_names_and_interactions(
                'exp_id', 'owner_id', [], ['interaction_id'])

    def test_cannot_save_new_linear_exp_with_no_interaction_id(self):
        with self.assertRaisesRegexp(
            ValueError, 'must provide at least one interaction type'):
            self.save_new_linear_exp_with_state_names_and_interactions(
                'exp_id', 'owner_id', ['state_name'], [])

    def test_error_is_raised_with_fake_reply_to_id(self):
        # Generate reply email.
        recipient_email = 'reply+%s@%s' % (
            'fake_id', feconf.INCOMING_EMAILS_DOMAIN_NAME)
        # Send email to Oppia.
        self.post_email(
            recipient_email, self.NEW_USER_EMAIL, 'feedback email reply',
            'New reply', html_body='<p>New reply!</p>', expected_status_int=404)

    def test_cannot_perform_delete_json_with_non_dict_params(self):
        with self.assertRaisesRegexp(
            Exception, 'Expected params to be a dict'):
            self.delete_json('random_url', params='invalid_params')

    def test_cannot_get_response_with_non_dict_params(self):
        with self.assertRaisesRegexp(
            Exception, 'Expected params to be a dict'):
            self.get_response_without_checking_for_errors(
                'random_url', [200], params='invalid_params')

    def test_fetch_gravatar_with_headers(self):
        user_email = 'user@example.com'
        expected_gravatar_filepath = os.path.join(
            self.get_static_asset_filepath(), 'assets', 'images', 'avatar',
            'gravatar_example.webp')
        with python_utils.open_file(
            expected_gravatar_filepath, 'rb', encoding=None) as f:
            gravatar = f.read()

        headers_dict = {
            'content_type': 'application/json; charset=utf-8'
        }
        with self.urlfetch_mock(content=gravatar, headers=headers_dict):
            profile_picture = user_services.fetch_gravatar(user_email)
            gravatar_data_url = utils.convert_png_to_data_url(
                expected_gravatar_filepath)
            self.assertEqual(profile_picture, gravatar_data_url)

    def test_swap_with_check_on_method_called(self):
        def mock_getcwd():
            return

        getcwd_swap = self.swap_with_checks(os, 'getcwd', mock_getcwd)
        with getcwd_swap:
            SwapWithCheckTestClass.getcwd_function_without_args()

    def test_swap_with_check_on_called_failed(self):
        def mock_getcwd():
            return

        getcwd_swap = self.swap_with_checks(os, 'getcwd', mock_getcwd)
        with self.assertRaisesRegexp(AssertionError, r'os\.getcwd'):
            with getcwd_swap:
                SwapWithCheckTestClass.empty_function_without_args()

    def test_swap_with_check_on_not_called(self):
        def mock_getcwd():
            return

        getcwd_swap = self.swap_with_checks(
            os, 'getcwd', mock_getcwd, called=False)
        with getcwd_swap:
            SwapWithCheckTestClass.empty_function_without_args()

    def test_swap_with_check_on_not_called_failed(self):
        def mock_getcwd():
            return

        getcwd_swap = self.swap_with_checks(
            os, 'getcwd', mock_getcwd)
        with self.assertRaisesRegexp(AssertionError, r'os\.getcwd'):
            with getcwd_swap:
                SwapWithCheckTestClass.empty_function_without_args()

    def test_swap_with_check_on_expected_args(self):
        def mock_getenv(unused_env):
            return
        def mock_join(*unused_args):
            return
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[('123',), ('456',)])
        join_swap = self.swap_with_checks(
            os.path, 'join', mock_join, expected_args=[('first', 'second')])
        with getenv_swap, join_swap:
            SwapWithCheckTestClass.functions_with_args()

    def test_swap_with_check_on_expected_args_failed_on_run_sequence(self):
        def mock_getenv(unused_env):
            return
        def mock_join(*unused_args):
            return
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[('456',), ('123',)])
        join_swap = self.swap_with_checks(
            os.path, 'join', mock_join, expected_args=[('first', 'second')])
        with self.assertRaisesRegexp(AssertionError, r'os\.getenv'):
            with getenv_swap, join_swap:
                SwapWithCheckTestClass.functions_with_args()

    def test_swap_with_check_on_expected_args_failed_on_wrong_args_number(self):
        def mock_getenv(unused_env):
            return
        def mock_join(*unused_args):
            return
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[('123',), ('456',)])
        join_swap = self.swap_with_checks(
            os.path, 'join', mock_join, expected_args=[
                ('first', 'second'), ('third', 'forth')])
        with self.assertRaisesRegexp(AssertionError, r'join'):
            with getenv_swap, join_swap:
                SwapWithCheckTestClass.functions_with_args()

    def test_swap_with_check_on_expected_kwargs(self):
        # pylint: disable=unused-argument
        def mock_getenv(key, default):
            return
        # pylint: enable=unused-argument
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_kwargs=[
                {'key': '123', 'default': '456'},
                {'key': '678', 'default': '900'},
            ])

        with getenv_swap:
            SwapWithCheckTestClass.functions_with_kwargs()

    def test_swap_with_check_on_expected_kwargs_failed_on_wrong_numbers(self):
        # pylint: disable=unused-argument
        def mock_getenv(key, default):
            return
        # pylint: enable=unused-argument
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_kwargs=[
                {'key': '123', 'default': '456'},
                {'key': '678', 'default': '900'},
                {'key': '678', 'default': '900'},
            ])

        with self.assertRaisesRegexp(AssertionError, r'os\.getenv'):
            with getenv_swap:
                SwapWithCheckTestClass.functions_with_kwargs()

    def test_swap_with_check_on_capature_exception_raised_by_tested_function(
            self):
        def mock_getcwd():
            raise ValueError()


        getcwd_swap = self.swap_with_checks(os, 'getcwd', mock_getcwd)

        with self.assertRaises(ValueError):
            with getcwd_swap:
                SwapWithCheckTestClass.getcwd_function_without_args()


class SwapWithCheckTestClass(python_utils.OBJECT):
    """Dummy class for testing check_with_swap. This class stores a few dummy
    functions.
    """

    @classmethod
    def getcwd_function_without_args(cls):
        """Run getcwd function."""
        os.getcwd()

    @classmethod
    def empty_function_without_args(cls):
        """Empty function."""
        pass

    @classmethod
    def functions_with_args(cls):
        """Run a few functions with args."""
        os.getenv('123')
        os.getenv('456')
        os.path.join('first', 'second')

    @classmethod
    def functions_with_kwargs(cls):
        """Run a few functions with kwargs."""
        os.getenv(key='123', default='456')
        os.getenv(key='678', default='900')
