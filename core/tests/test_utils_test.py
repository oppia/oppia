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

from core import feature_flag_list
from core.constants import constants
from core.domain import auth_domain
from core.domain import feature_flag_services
from core.domain import param_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

import elasticsearch
from typing import Callable, Final, List, OrderedDict, Tuple
import webapp2

email_services = models.Registry.import_email_services()


class EnableFeatureFlagTests(test_utils.GenericTestBase):
    """Tests for testing test_utils.enable_feature_flags."""

    @test_utils.enable_feature_flags(
        [feature_flag_list.FeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS])
    def test_enable_feature_flags_decorator(self) -> None:
        """Tests if single feature-flag is enabled."""
        self.assertTrue(feature_flag_services.is_feature_flag_enabled(
            None, 'dummy_feature_flag_for_e2e_tests'))

    @test_utils.enable_feature_flags([
        feature_flag_list.FeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS,
        feature_flag_list.FeatureNames.DIAGNOSTIC_TEST
    ])
    def test_enable_multiple_feature_flags_decorator(self) -> None:
        """Tests if multiple feature flags are enabled."""
        self.assertTrue(feature_flag_services.is_feature_flag_enabled(
            None, 'dummy_feature_flag_for_e2e_tests'))
        self.assertTrue(feature_flag_services.is_feature_flag_enabled(
            None, 'diagnostic_test'))


class FunctionWrapperTests(test_utils.GenericTestBase):
    """Test for testing test_utils.FunctionWrapper."""

    def test_wrapper_calls_subclass_methods(self) -> None:
        """Tests the basic functionality of FunctionWrapper."""

        # Keeps track of which functions have been called, to test that
        # pre_call_hook, the actual function, and post_call_hook are
        # called in the right order.
        order = []
        testcase = self

        class MockWrapper(test_utils.FunctionWrapper):

            def pre_call_hook(self, args: OrderedDict[str, str]) -> None:
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

            def post_call_hook(
                self, args: OrderedDict[str, str], result: str
            ) -> None:
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

        def mock_function(posarg: str, kwarg: str) -> str:
            order.append('call')
            return posarg + kwarg

        wrapped = MockWrapper(mock_function)

        self.assertEqual(wrapped('foo', kwarg='bar'), 'foobar')
        self.assertEqual(order, ['before', 'call', 'after'])

    def test_wrapper_calls_passed_method(self) -> None:
        """Tests that FunctionWrapper also works for methods."""
        data = {}

        class MockClass:
            def __init__(self, string1: str) -> None:
                self.string1 = string1

            def mock_method(self, string2: str) -> str:
                data['value'] = self.string1 + string2
                return (self.string1 + string2) * 2

        wrapped = test_utils.FunctionWrapper(MockClass.mock_method)

        with self.swap(MockClass, 'mock_method', wrapped):
            val = MockClass('foo').mock_method('bar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_class_method(self) -> None:
        """Tests that FunctionWrapper also works for class methods."""
        data = {}

        class MockClass:
            str_attr = 'foo'

            @classmethod
            def mock_classmethod(cls, string: str) -> str:
                data['value'] = cls.str_attr + string
                return (cls.str_attr + string) * 2

        wrapped = test_utils.FunctionWrapper(MockClass.mock_classmethod)
        with self.swap(MockClass, 'mock_classmethod', wrapped):
            val = MockClass.mock_classmethod('bar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_static_method(self) -> None:
        """Tests that FunctionWrapper also works for static methods."""
        data = {}

        class MockClass:
            @staticmethod
            def mock_staticmethod(string: str) -> str:
                data['value'] = string
                return string * 2

        wrapped = test_utils.FunctionWrapper(MockClass.mock_staticmethod)
        with self.swap(MockClass, 'mock_staticmethod', wrapped):
            val = MockClass.mock_staticmethod('foobar')
            self.assertEqual(val, 'foobarfoobar')
            self.assertEqual(data.get('value'), 'foobar')

    def test_wrapper_calls_passed_lambdas(self) -> None:
        """Tests that FunctionWrapper also works for lambdas."""
        data = {}

        def mock_function_with_side_effect(string: str) -> str:
            data['value'] = string
            return string

        mock_lambda = lambda x: mock_function_with_side_effect(x) * 2

        wrapped = test_utils.FunctionWrapper(mock_lambda)
        self.assertEqual(wrapped('foobar'), 'foobarfoobar')
        self.assertEqual(data.get('value'), 'foobar')


class AuthServicesStubTests(test_utils.GenericTestBase):
    """Test the methods for AuthServices."""

    EMAIL: Final = 'user@test.com'

    def setUp(self) -> None:
        super().setUp()
        self.stub = test_utils.AuthServicesStub()

    def test_get_auth_claims_from_request(self) -> None:
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

    def test_get_association_that_is_present(self) -> None:
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid', 'uid'))

        self.assertEqual(self.stub.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(self.stub.get_auth_id_from_user_id('uid'), 'aid')

    def test_get_association_that_is_missing(self) -> None:
        self.assertIsNone(self.stub.get_user_id_from_auth_id('does_not_exist'))
        self.assertIsNone(self.stub.get_auth_id_from_user_id('does_not_exist'))

    def test_fail_to_get_deleted_association(self) -> None:
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid', 'uid'))
        self.stub.mark_user_for_deletion('uid')
        self.assertIsNone(self.stub.get_user_id_from_auth_id('aid'))

    def test_get_multi_associations_with_all_present(self) -> None:
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

    def test_get_multi_associations_with_one_missing(self) -> None:
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

    def test_associate_auth_id_with_user_id_without_collision(self) -> None:
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid', 'uid'))

        self.assertEqual(self.stub.get_user_id_from_auth_id('aid'), 'uid')
        self.assertEqual(self.stub.get_auth_id_from_user_id('uid'), 'aid')

    def test_associate_auth_id_with_user_id_with_collision_raises(self) -> None:
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid', 'uid'))

        with self.assertRaisesRegex(Exception, 'already associated'):
            self.stub.associate_auth_id_with_user_id(
                auth_domain.AuthIdUserIdPair('aid', 'uid'))

    def test_associate_multi_auth_ids_with_user_ids_without_collisions(
        self
    ) -> None:
        self.stub.associate_multi_auth_ids_with_user_ids(
            [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
             auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
             auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

        self.assertEqual(
            [self.stub.get_user_id_from_auth_id('aid1'),
             self.stub.get_user_id_from_auth_id('aid2'),
             self.stub.get_user_id_from_auth_id('aid3')],
            ['uid1', 'uid2', 'uid3'])

    def test_associate_multi_auth_ids_with_user_ids_with_collision_raises(
        self
    ) -> None:
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid1', 'uid1'))

        with self.assertRaisesRegex(Exception, 'already associated'):
            self.stub.associate_multi_auth_ids_with_user_ids(
                [auth_domain.AuthIdUserIdPair('aid1', 'uid1'),
                 auth_domain.AuthIdUserIdPair('aid2', 'uid2'),
                 auth_domain.AuthIdUserIdPair('aid3', 'uid3')])

    def test_present_association_is_not_considered_to_be_deleted(self) -> None:
        # This operation creates the external auth association.
        self.stub.associate_auth_id_with_user_id(
            auth_domain.AuthIdUserIdPair('aid', 'uid'))
        self.assertFalse(
            self.stub.verify_external_auth_associations_are_deleted('uid'))

    def test_missing_association_is_considered_to_be_deleted(self) -> None:
        self.assertTrue(self.stub.verify_external_auth_associations_are_deleted(
            'does_not_exist'))

    def test_delete_association_when_it_is_present(self) -> None:
        # This operation creates the external auth association.
        self.stub.associate_auth_id_with_user_id(auth_domain.AuthIdUserIdPair(
            'aid', 'uid'))
        self.assertFalse(
            self.stub.verify_external_auth_associations_are_deleted('uid'))

        self.stub.delete_external_auth_associations('uid')

        self.assertTrue(
            self.stub.verify_external_auth_associations_are_deleted('uid'))

    def test_delete_association_when_it_is_missing_does_not_raise(self) -> None:
        # Should not raise.
        self.stub.delete_external_auth_associations('does_not_exist')


class CallCounterTests(test_utils.GenericTestBase):
    def test_call_counter_counts_the_number_of_times_a_function_gets_called(
        self
    ) -> None:
        f = lambda x: x ** 2

        wrapped_function = test_utils.CallCounter(f)

        self.assertEqual(wrapped_function.times_called, 0)

        for i in range(5):
            self.assertEqual(wrapped_function(i), i ** 2)
            self.assertEqual(wrapped_function.times_called, i + 1)


class FailingFunctionTests(test_utils.GenericTestBase):

    def test_failing_function_never_succeeds_when_n_is_infinity(self) -> None:
        class MockError(Exception):
            pass

        function = lambda x: x ** 2

        failing_func = test_utils.FailingFunction(
            function, MockError('Dummy Exception'),
            test_utils.FailingFunction.INFINITY)

        for i in range(20):
            with self.assertRaisesRegex(MockError, 'Dummy Exception'):
                failing_func(i)

    def test_failing_function_raises_error_with_invalid_num_tries(self) -> None:
        class MockError(Exception):
            pass

        function = lambda x: x ** 2

        with self.assertRaisesRegex(
            ValueError,
            'num_tries_before_success should either be an integer greater than '
            'or equal to 0, or FailingFunction.INFINITY'):
            test_utils.FailingFunction(function, MockError, -1)


class TestUtilsTests(test_utils.GenericTestBase):

    def test_get_static_asset_url(self) -> None:
        asset_url = self.get_static_asset_url('/images/subjects/Lightbulb.svg')
        self.assertEqual(asset_url, '/assets/images/subjects/Lightbulb.svg')

    def test_get_static_asset_filepath_with_prod_mode_on(self) -> None:
        with self.swap(constants, 'DEV_MODE', False):
            filepath = self.get_static_asset_filepath()
            self.assertEqual(filepath, 'build')

    def test_cannot_get_updated_param_dict_with_invalid_param_name(
        self
    ) -> None:
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

    def test_cannot_save_new_linear_exp_with_no_state_name(self) -> None:
        with self.assertRaisesRegex(
            ValueError, 'must provide at least one state name'):
            self.save_new_linear_exp_with_state_names_and_interactions(
                'exp_id', 'owner_id', [], ['interaction_id'])

    def test_cannot_save_new_linear_exp_with_no_interaction_id(self) -> None:
        with self.assertRaisesRegex(
            ValueError, 'must provide at least one interaction type'):
            self.save_new_linear_exp_with_state_names_and_interactions(
                'exp_id', 'owner_id', ['state_name'], [])

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_cannot_perform_delete_json_with_non_dict_params(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Expected params to be a dict'):
            self.delete_json('random_url', params='invalid_params')  # type: ignore[arg-type]

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_cannot_get_response_with_non_dict_params(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Expected params to be a dict'):
            self.get_response_without_checking_for_errors(
                'random_url', [200], params='invalid_params')  # type: ignore[arg-type]

    def test_capture_logging(self) -> None:
        logging.info('0')
        with self.capture_logging() as logs:
            logging.info('1')
            logging.debug('2')
            logging.warning('3')
            logging.error('4')
            print('5')
        logging.info('6')

        self.assertEqual(logs, ['1', '2', '3', '4'])

    def test_capture_logging_with_min_level(self) -> None:
        logging.info('0')
        with self.capture_logging(min_level=logging.WARN) as logs:
            logging.info('1')
            logging.debug('2')
            logging.warning('3')
            logging.error('4')
            print('5')
        logging.error('6')

        self.assertEqual(logs, ['3', '4'])

    def test_swap_to_always_return_without_value_uses_none(self) -> None:
        obj = mock.Mock()
        test_func: Callable[..., mock.Mock] = lambda: obj
        obj.func = test_func

        self.assertIs(obj.func(), obj)

        with self.swap_to_always_return(obj, 'func'):
            self.assertIsNone(obj.func())

    def test_swap_to_always_return_with_value(self) -> None:
        obj = mock.Mock()
        test_func: Callable[..., int] = lambda: 0
        obj.func = test_func

        self.assertEqual(obj.func(), 0)

        with self.swap_to_always_return(obj, 'func', value=123):
            self.assertEqual(obj.func(), 123)

    def test_swap_to_always_raise_without_error_uses_empty_exception(
        self
    ) -> None:
        obj = mock.Mock()
        test_func: Callable[..., None] = lambda: None
        obj.func = test_func
        self.assertIsNone(obj.func())

        with self.swap_to_always_raise(obj, 'func'):
            try:
                obj.func()
            except Exception as e:
                self.assertIs(type(e), Exception)
                self.assertEqual(str(e), '')
            else:
                self.fail(msg='obj.func() did not raise an Exception')

    def test_swap_to_always_raise_with_error(self) -> None:
        obj = mock.Mock()
        test_func: Callable[..., int] = lambda: 1 // 0
        obj.func = test_func

        with self.assertRaisesRegex(
            ZeroDivisionError, 'integer division or modulo by zero'
        ):
            obj.func()

        with self.swap_to_always_raise(obj, 'func', error=ValueError('abc')):
            with self.assertRaisesRegex(ValueError, 'abc'):
                obj.func()

    def test_swap_with_check_on_method_called(self) -> None:
        def mock_getcwd() -> None:
            return

        getcwd_swap = self.swap_with_checks(os, 'getcwd', mock_getcwd)
        with getcwd_swap:
            SwapWithCheckTestClass.getcwd_function_without_args()

    def test_swap_with_check_on_called_failed(self) -> None:
        def mock_getcwd() -> None:
            return

        getcwd_swap = self.swap_with_checks(os, 'getcwd', mock_getcwd)
        with self.assertRaisesRegex(AssertionError, r'os\.getcwd'):
            with getcwd_swap:
                SwapWithCheckTestClass.empty_function_without_args()

    def test_swap_with_check_on_not_called(self) -> None:
        def mock_getcwd() -> None:
            return

        getcwd_swap = self.swap_with_checks(
            os, 'getcwd', mock_getcwd, called=False)
        with getcwd_swap:
            SwapWithCheckTestClass.empty_function_without_args()

    def test_swap_with_check_on_not_called_failed(self) -> None:
        def mock_getcwd() -> None:
            return

        getcwd_swap = self.swap_with_checks(
            os, 'getcwd', mock_getcwd)
        with self.assertRaisesRegex(AssertionError, r'os\.getcwd'):
            with getcwd_swap:
                SwapWithCheckTestClass.empty_function_without_args()

    def test_swap_with_check_on_expected_args(self) -> None:
        def mock_getenv(unused_env: str) -> None:
            return
        def mock_samefile(*unused_args: str) -> None:
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

    def test_swap_with_check_on_expected_args_failed_on_run_sequence(
        self
    ) -> None:
        def mock_getenv(unused_env: str) -> None:
            return

        def mock_samefile(*unused_args: str) -> None:
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

    def test_swap_with_check_on_expected_args_failed_on_wrong_args_number(
        self
    ) -> None:
        def mock_getenv(unused_env: str) -> None:
            return

        def mock_samefile(*unused_args: str) -> None:
            return

        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv, expected_args=[('123',), ('456',)])
        samefile_swap = self.swap_with_checks(
            os.path, 'samefile', mock_samefile, expected_args=[
                ('first', 'second'), ('third', 'forth')])
        with self.assertRaisesRegex(AssertionError, r'samefile'):
            with getenv_swap, samefile_swap:
                SwapWithCheckTestClass.functions_with_args()

    def test_swap_with_check_on_expected_kwargs(self) -> None:
        def mock_getenv(key: str, default: str) -> None: # pylint: disable=unused-argument
            return
        getenv_swap = self.swap_with_checks(
            os, 'getenv', mock_getenv,
            expected_args=[('123',), ('678',)],
            expected_kwargs=[{'default': '456'}, {'default': '900'}])

        with getenv_swap:
            SwapWithCheckTestClass.functions_with_kwargs()

    def test_swap_with_check_on_expected_kwargs_failed_on_wrong_numbers(
        self
    ) -> None:
        def mock_getenv(key: str, default: str) -> None: # pylint: disable=unused-argument
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
        self
    ) -> None:
        def mock_getcwd() -> None:
            raise ValueError('Exception raised from getcwd()')

        getcwd_swap = self.swap_with_checks(os, 'getcwd', mock_getcwd)

        with self.assertRaisesRegex(
            ValueError, re.escape('Exception raised from getcwd()')
        ):
            with getcwd_swap:
                SwapWithCheckTestClass.getcwd_function_without_args()

    def test_assert_raises_with_error_message(self) -> None:
        def mock_exception_func() -> None:
            raise Exception()

        with self.assertRaisesRegex(
            NotImplementedError,
            'self.assertRaises should not be used in these tests. Please use '
            'self.assertRaisesRegex instead.'
        ):
            self.assertRaises(Exception, mock_exception_func)

    def test_assert_raises_regexp_with_empty_string(self) -> None:
        def mock_exception_func() -> None:
            raise Exception()

        with self.assertRaisesRegex(
            Exception,
            'Please provide a sufficiently strong regexp string to '
            'validate that the correct error is being raised.'
        ):
            with self.assertRaisesRegex(Exception, ''):
                mock_exception_func()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally
    # test wrong inputs that we can normally catch by typing.
    def test_mock_datetime_utcnow_fails_when_wrong_type_is_passed(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'mocked_now must be datetime, got: 123'
        ):
            with self.mock_datetime_utcnow(123):  # type: ignore[arg-type]
                pass

    def test_raises_error_if_no_mock_file_path_found(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'No file exists for the given file name'
        ):
            test_utils.mock_load_template('invalid_path')

    def test_raises_error_if_multiple_file_paths_found(self) -> None:
        def mock_walk(_: str) -> List[Tuple[str, List[str], List[str]]]:
            return [
                ('page-dir-1', [], ['duplicate_file.ts']),
                ('page-dir-2', [], ['duplicate_file.ts']),
            ]
        walk_swap = self.swap_with_checks(
            os, 'walk', mock_walk, expected_args=[('core/templates/pages',)])
        with self.assertRaisesRegex(
            Exception, 'Multiple files found with name: duplicate_file.ts'
        ):
            with walk_swap:
                test_utils.mock_load_template('duplicate_file.ts')

    def test_raises_error_if_no_user_name_exists_with_strict_true(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'No user_id found for the given email address'
        ):
            self.get_user_id_from_email(
                'invalidemail@gmail.com'
            )

    def test_assert_matches_regexps_error_diff_num_expressions(self) -> None:
        with self.assertRaisesRegex(
            AssertionError, 'missing item expected to match: \'1\''
        ):
            self.assert_matches_regexps([], ['1'])

        with self.assertRaisesRegex(
            AssertionError, 'extra item \'1\''
        ):
            self.assert_matches_regexps(['1'], [])

    def test_set_translation_coordinators(self) -> None:
        self.signup('c@example.com', 'C')
        user_id_c = self.get_user_id_from_email('c@example.com')

        self.set_translation_coordinators(['C'], 'en')
        self.set_translation_coordinators(['C'], 'hi')

        coordinator_rights_model = (
            user_services.get_translation_rights_with_user(user_id_c))
        self.assertEqual(
            2,
            len(coordinator_rights_model)
        )
        self.assertEqual(
            'en',
            coordinator_rights_model[0].language_id
        )
        self.assertEqual(
            'hi',
            coordinator_rights_model[1].language_id
        )


class CheckImagePngOrWebpTests(test_utils.GenericTestBase):

    def test_png_image_yields_true(self) -> None:
        self.assertTrue(test_utils.check_image_png_or_webp('data:image/png'))

    def test_webp_image_yields_true(self) -> None:
        self.assertTrue(test_utils.check_image_png_or_webp('data:image/webp'))

    def test_jpeg_image_yields_false(self) -> None:
        self.assertFalse(test_utils.check_image_png_or_webp('data:image/jpeg'))


class ElasticSearchStubTests(test_utils.GenericTestBase):

    def test_duplicate_index_yields_error(self) -> None:
        stub = test_utils.ElasticSearchStub()
        stub.mock_create_index('index1')
        stub.mock_create_index('index2')
        with self.assertRaisesRegex(
            elasticsearch.RequestError,
            r'RequestError\(400, \'resource_already_exists_exception\'\)',
        ):
            stub.mock_create_index('index1')

    def test_delete_from_missing_index_yields_error(self) -> None:
        stub = test_utils.ElasticSearchStub()
        with self.assertRaisesRegex(
            elasticsearch.NotFoundError,
            (
                r'NotFoundError\(404, \'index_not_found_exception\', '
                r'\'no such index \[index1\]\', index1, index_or_alias\)'
            ),
        ):
            stub.mock_delete('index1', 'some_id')

    def test_delete_missing_doc_yields_error(self) -> None:
        stub = test_utils.ElasticSearchStub()
        stub.mock_create_index('index1')
        with self.assertRaisesRegex(
            elasticsearch.NotFoundError,
            r'NotFoundError\(404,',
        ):
            stub.mock_delete('index1', 'doc_id')

    def test_delete_by_query_with_missing_index_yields_error(self) -> None:
        stub = test_utils.ElasticSearchStub()
        with self.assertRaisesRegex(
            elasticsearch.NotFoundError,
            (
                r'NotFoundError\(404, \'index_not_found_exception\', '
                r'\'no such index \[index1\]\', index1, index_or_alias\)'
            ),
        ):
            stub.mock_delete_by_query('index1', {'query': {'match_all': {}}})


class EmailMockTests(test_utils.EmailTestBase):
    """Class for testing EmailTestBase."""

    def test_override_run_swaps_contexts(self) -> None:
        """Test that the current_function
        email_services.send_email_to_recipients() is correctly swapped to its
        mock version when the testbase extends EmailTestBase.
        """
        referenced_function = getattr(
            email_services, 'send_email_to_recipients')
        correct_function = getattr(self, '_send_email_to_recipients')
        self.assertEqual(referenced_function, correct_function)

    def test_mock_send_email_to_recipients_sends_correct_emails(self) -> None:
        """Test sending email to recipients using mock adds the correct objects
        to emails_dict.
        """
        self._send_email_to_recipients(
            'a@a.com',
            ['b@b.com'],
            ('Hola 😂 - invitation to collaborate'),
            'plaintext_body 😂',
            'Hi abc,<br> 😂',
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
            'Hola 😂 - invitation to collaborate')
        self.assertEqual(
            messages[0].body,
            'plaintext_body 😂')
        self.assertEqual(
            messages[0].html,
            'Hi abc,<br> 😂')
        self.assertEqual(messages[0].bcc, 'c@c.com')


class SwapWithCheckTestClass:
    """Dummy class for testing check_with_swap. This class stores a few dummy
    functions.
    """

    @classmethod
    def getcwd_function_without_args(cls) -> None:
        """Run getcwd function."""
        os.getcwd()

    @classmethod
    def empty_function_without_args(cls) -> None:
        """Empty function."""
        pass

    @classmethod
    def functions_with_args(cls) -> None:
        """Run a few functions with args."""
        os.getenv('123')
        os.getenv('456')
        os.path.samefile('first', 'second')

    @classmethod
    def functions_with_kwargs(cls) -> None:
        """Run a few functions with kwargs."""
        os.getenv('123', default='456')
        os.getenv('678', default='900')
