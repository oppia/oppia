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

from __future__ import annotations

import logging
import os
import re
from unittest import mock

from core.constants import constants
from core.domain import auth_domain
from core.domain import param_domain
from core.platform import models
from core.tests import test_utils

import webapp2

exp_models, = models.Registry.import_models([models.NAMES.exploration])
email_services = models.Registry.import_email_services()


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
                    AssertionError. The argument doesn't match with the mock
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
                    AssertionError. The argument doesn't match with the mock
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

        class MockClass:
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

        class MockClass:
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

        class MockClass:
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


class AuthServicesStubTests(test_utils.GenericTestBase):

    EMAIL = 'user@test.com'

    def setUp(self):
        super().setUp()
        self.stub = test_utils.AuthServicesStub()

    def test_get_auth_claims_from_request(self):
        request = webapp2.Request.blank('/')

        self.assertIsNone(self.stub.get_auth_claims_from_request(request))

        with self.login_context(self.EMAIL):
            self.assertEqual(
                self.stub.get_auth_claims_from_request(request),
                auth_domain.AuthClaims(
                    self.get_auth_id_from_email(self.EMAIL), self.EMAIL, False))

        with self.super_admin_context():
            self.assertEqual(
                self.stub.get_auth_claims_from_request(request),
                auth_domain.AuthClaims(
                    self.get_auth_id_from_email(self.SUPER_ADMIN_EMAIL),
                    self.SUPER_ADMIN_EMAIL,
                    True))

        self.assertIsNone(self.stub.get_auth_claims_from_request(request))

    def test_get_association_that_is_present(self):
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid', 'uid'))

        self.assertEqual(self.stub.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(self.stub.get_auth_id_from_user_id('uid'), 'aid')

    def test_get_association_that_is_missing(self):
        self.assertIsNone(self.stub.get_user_id_from_auth_id('does_not_exist'))
        self.assertIsNone(self.stub.get_auth_id_from_user_id('does_not_exist'))

    def test_get_multi_associations_with_all_present(self):
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid1', 'uid1'))
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid2', 'uid2'))
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid3', 'uid3'))

        self.assertEqual(
            self.stub.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', 'uid2', 'uid3'])
        self.assertEqual(
            self.stub.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']),
            ['aid1', 'aid2', 'aid3'])

    def test_get_multi_associations_with_one_missing(self):
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid1', 'uid1'))
        # The aid2 <-> uid2 association is missing.
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid3', 'uid3'))

        self.assertEqual(
            self.stub.get_multi_user_ids_from_auth_ids(
                ['aid1', 'aid2', 'aid3']),
            ['uid1', None, 'uid3'])
        self.assertEqual(
            self.stub.get_multi_auth_ids_from_user_ids(
                ['uid1', 'uid2', 'uid3']),
            ['aid1', None, 'aid3'])

    def test_associate_auth_id_with_user_id_without_collision(self):
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid', 'uid'))

        self.assertEqual(self.stub.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(self.stub.get_auth_id_from_user_id('uid'), 'aid')

    def test_associate_auth_id_with_user_id_with_collision_raises(self):
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid', 'uid'))

        with self.assertRaisesRegex(Exception, 'already associated'):
            self.stub.associate_auth_id_with_user_id(
                auth_domain.AuthIdUserIdPair('aid', 'uid'))

    def test_associate_multi_auth_ids_with_user_ids_without_collisions(self):
        self.stub.associate_multi_auth_ids_with_user_ids(
            [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
             auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
             auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

        self.assertEqual(
            [self.stub.get_user_id_from_auth_id('aid1'),
             self.stub.get_user_id_from_auth_id('aid2'),
             self.stub.get_user_id_from_auth_id('aid3')],
            ['uid1', 'uid2', 'uid3'])

    def test_associate_multi_auth_ids_with_user_ids_with_collision_raises(self):
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid1', 'uid1'))

        with self.assertRaisesRegex(Exception, 'already associated'):
            self.stub.associate_multi_auth_ids_with_user_ids(
                [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
                 auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
                 auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

    def test_present_association_is_not_considered_to_be_deleted(self):
        # This operation creates the external auth association.
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))
        self.assertFalse(
            self.stub.verify_external_auth_associations_are_deleted('uid'))

    def test_missing_association_is_considered_to_be_deleted(self):
        self.assertTrue(self.stub.verify_external_auth_associations_are_deleted(
            'does_not_exist'))

    def test_delete_association_when_it_is_present(self):
        # This operation creates the external auth association.
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid', 'uid'))
        self.assertFalse(
            self.stub.verify_external_auth_associations_are_deleted('uid'))

        self.stub.delete_external_auth_associations('uid')

        self.assertTrue(
            self.stub.verify_external_auth_associations_are_deleted('uid'))

    def test_delete_association_when_it_is_missing_does_not_raise(self):
        # Should not raise.
        self.stub.delete_external_auth_associations('does_not_exist')


class CallCounterTests(test_utils.GenericTestBase):
    def test_call_counter_counts_the_number_of_times_a_function_gets_called(
            self):
        f = lambda x: x ** 2

        wrapped_function = test_utils.CallCounter(f)

        self.assertEqual(wrapped_function.times_called, 0)

        for i in range(5):
            self.assertEqual(wrapped_function(i), i ** 2)
            self.assertEqual(wrapped_function.times_called, i + 1)


class FailingFunctionTests(test_utils.GenericTestBase):

    def test_failing_function_never_succeeds_when_n_is_infinity(self):
        class MockError(Exception):
            pass

        function = lambda x: x ** 2

        failing_func = test_utils.FailingFunction(
            function, MockError('Dummy Exception'),
            test_utils.FailingFunction.INFINITY)

        for i in range(20):
            with self.assertRaisesRegex(MockError, 'Dummy Exception'):
                failing_func(i)

    def test_failing_function_raises_error_with_invalid_num_tries(self):
        class MockError(Exception):
            pass

        function = lambda x: x ** 2

        with self.assertRaisesRegex(
            ValueError,
            'num_tries_before_success should either be an integer greater than '
            'or equal to 0, or FailingFunction.INFINITY'):
            test_utils.FailingFunction(function, MockError, -1)


class TestUtilsTests(test_utils.GenericTestBase):

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

        with self.assertRaisesRegex(Exception, 'Parameter a not found'):
            self.get_updated_param_dict(
                {}, param_change_list, exp_param_specs)

    def test_cannot_save_new_linear_exp_with_no_state_name(self):
        with self.assertRaisesRegex(
            ValueError, 'must provide at least one state name'):
            self.save_new_linear_exp_with_state_names_and_interactions(
                'exp_id', 'owner_id', [], ['interaction_id'])

    def test_cannot_save_new_linear_exp_with_no_interaction_id(self):
        with self.assertRaisesRegex(
            ValueError, 'must provide at least one interaction type'):
            self.save_new_linear_exp_with_state_names_and_interactions(
                'exp_id', 'owner_id', ['state_name'], [])

    def test_cannot_perform_delete_json_with_non_dict_params(self):
        with self.assertRaisesRegex(
            Exception, 'Expected params to be a dict'):
            self.delete_json('random_url', params='invalid_params')

    def test_cannot_get_response_with_non_dict_params(self):
        with self.assertRaisesRegex(
            Exception, 'Expected params to be a dict'):
            self.get_response_without_checking_for_errors(
                'random_url', [200], params='invalid_params')

    def test_capture_logging(self):
        logging.info('0')
        with self.capture_logging() as logs:
            logging.info('1')
            logging.debug('2')
            logging.warning('3')
            logging.error('4')
            print('5')
        logging.info('6')

        self.assertEqual(logs, ['1', '2', '3', '4'])

    def test_capture_logging_with_min_level(self):
        logging.info('0')
        with self.capture_logging(min_level=logging.WARN) as logs:
            logging.info('1')
            logging.debug('2')
            logging.warning('3')
            logging.error('4')
            print('5')
        logging.error('6')

        self.assertEqual(logs, ['3', '4'])

    def test_swap_to_always_return_without_value_uses_none(self):
        obj = mock.Mock()
        obj.func = lambda: obj

        self.assertIs(obj.func(), obj)

        with self.swap_to_always_return(obj, 'func'):
            self.assertIsNone(obj.func())

    def test_swap_to_always_return_with_value(self):
        obj = mock.Mock()
        obj.func = lambda: 0

        self.assertEqual(obj.func(), 0)

        with self.swap_to_always_return(obj, 'func', value=123):
            self.assertEqual(obj.func(), 123)

    def test_swap_to_always_raise_without_error_uses_empty_exception(self):
        obj = mock.Mock()
        obj.func = lambda: None
        self.assertIsNone(obj.func())

        with self.swap_to_always_raise(obj, 'func'):
            try:
                obj.func()
            except Exception as e:
                self.assertIs(type(e), Exception)
                self.assertEqual(str(e), '')
            else:
                self.fail(msg='obj.func() did not raise an Exception')

    def test_swap_to_always_raise_with_error(self):
        obj = mock.Mock()
        obj.func = lambda: 1 // 0

        with self.assertRaisesRegex(
            ZeroDivisionError, 'integer division or modulo by zero'
        ):
            obj.func()

        with self.swap_to_always_raise(obj, 'func', error=ValueError('abc')):
            with self.assertRaisesRegex(ValueError, 'abc'):
                obj.func()

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
        with self.assertRaisesRegex(AssertionError, r'os\.getcwd'):
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
        with self.assertRaisesRegex(AssertionError, r'os\.getcwd'):
            with getcwd_swap:
                SwapWithCheckTestClass.empty_function_without_args()

    def test_swap_with_check_on_expected_args(self):
        def mock_getenv(unused_env):
            return
        def mock_samefile(*unused_args):
            return
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[('123',), ('456',)])
        samefile_swap = self.swap_with_checks(
            os.path,
            'samefile',
            mock_samefile,
            expected_args=[('first', 'second')]
        )
        with getenv_swap, samefile_swap:
            SwapWithCheckTestClass.functions_with_args()

    def test_swap_with_check_on_expected_args_failed_on_run_sequence(self):
        def mock_getenv(unused_env):
            return
        def mock_samefile(*unused_args):
            return
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[('456',), ('123',)])
        samefile_swap = self.swap_with_checks(
            os.path,
            'samefile',
            mock_samefile,
            expected_args=[('first', 'second')]
        )
        with self.assertRaisesRegex(AssertionError, r'os\.getenv'):
            with getenv_swap, samefile_swap:
                SwapWithCheckTestClass.functions_with_args()

    def test_swap_with_check_on_expected_args_failed_on_wrong_args_number(self):
        def mock_getenv(unused_env):
            return
        def mock_samefile(*unused_args):
            return
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[('123',), ('456',)])
        samefile_swap = self.swap_with_checks(
            os.path, 'samefile', mock_samefile, expected_args=[
                ('first', 'second'), ('third', 'forth')])
        with self.assertRaisesRegex(AssertionError, r'samefile'):
            with getenv_swap, samefile_swap:
                SwapWithCheckTestClass.functions_with_args()

    def test_swap_with_check_on_expected_kwargs(self):
        def mock_getenv(key, default): # pylint: disable=unused-argument
            return
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv,
            expected_args=[('123',), ('678',)],
            expected_kwargs=[{'default': '456'}, {'default': '900'}])

        with getenv_swap:
            SwapWithCheckTestClass.functions_with_kwargs()

    def test_swap_with_check_on_expected_kwargs_failed_on_wrong_numbers(self):
        def mock_getenv(key, default): # pylint: disable=unused-argument
            return
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_kwargs=[
                {'key': '123', 'default': '456'},
                {'key': '678', 'default': '900'},
                {'key': '678', 'default': '900'},
            ])

        with self.assertRaisesRegex(AssertionError, r'os\.getenv'):
            with getenv_swap:
                SwapWithCheckTestClass.functions_with_kwargs()

    def test_swap_with_check_on_capature_exception_raised_by_tested_function(
            self):
        def mock_getcwd():
            raise ValueError('Exception raised from getcwd()')

        getcwd_swap = self.swap_with_checks(os, 'getcwd', mock_getcwd)

        with self.assertRaisesRegex(
            ValueError, re.escape('Exception raised from getcwd()')
        ):
            with getcwd_swap:
                SwapWithCheckTestClass.getcwd_function_without_args()

    def test_assert_raises_with_error_message(self):
        def mock_exception_func():
            raise Exception()

        with self.assertRaisesRegex(
            NotImplementedError,
            'self.assertRaises should not be used in these tests. Please use '
            'self.assertRaisesRegex instead.'
        ):
            self.assertRaises(Exception, mock_exception_func)

    def test_assert_raises_regexp_with_empty_string(self):
        def mock_exception_func():
            raise Exception()

        with self.assertRaisesRegex(
            Exception,
            'Please provide a sufficiently strong regexp string to '
            'validate that the correct error is being raised.'
        ):
            self.assertRaisesRegex(Exception, '', mock_exception_func)

    def test_mock_datetime_utcnow_fails_when_wrong_type_is_passed(self):
        with self.assertRaisesRegex(
                Exception, 'mocked_now must be datetime, got: 123'):
            with self.mock_datetime_utcnow(123):
                pass


class EmailMockTests(test_utils.EmailTestBase):
    """Class for testing EmailTestBase."""

    def test_override_run_swaps_contexts(self):
        """Test that the current_function
        email_services.send_email_to_recipients() is correctly swapped to its
        mock version when the testbase extends EmailTestBase.
        """
        referenced_function = getattr(
            email_services, 'send_email_to_recipients')
        correct_function = getattr(self, '_send_email_to_recipients')
        self.assertEqual(referenced_function, correct_function)

    def test_mock_send_email_to_recipients_sends_correct_emails(self):
        """Test sending email to recipients using mock adds the correct objects
        to emails_dict.
        """
        self._send_email_to_recipients(
            'a@a.com',
            ['b@b.com'],
            (
                'Hola 😂 - invitation to collaborate'
                .encode(encoding='utf-8')),
            'plaintext_body 😂'.encode(encoding='utf-8'),
            'Hi abc,<br> 😂'.encode(encoding='utf-8'),
            bcc=['c@c.com'],
            reply_to='abc',
            recipient_variables={'b@b.com': {'first': 'Bob', 'id': 1}})
        messages = self._get_sent_email_messages(
            'b@b.com')
        all_messages = self._get_all_sent_email_messages()

        self.assertEqual(len(messages), 1)
        self.assertEqual(len(all_messages), 1)
        self.assertEqual(all_messages['b@b.com'], messages)
        self.assertEqual(
            messages[0].subject,
            'Hola 😂 - invitation to collaborate'.encode(encoding='utf-8'))
        self.assertEqual(
            messages[0].body,
            'plaintext_body 😂'.encode(encoding='utf-8'))
        self.assertEqual(
            messages[0].html,
            'Hi abc,<br> 😂'.encode(encoding='utf-8'))
        self.assertEqual(messages[0].bcc, 'c@c.com')


class SwapWithCheckTestClass:
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
        os.path.samefile('first', 'second')

    @classmethod
    def functions_with_kwargs(cls):
        """Run a few functions with kwargs."""
        os.getenv('123', default='456')
        os.getenv('678', default='900')
