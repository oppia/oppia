# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for platform_parameter_services.py."""

from __future__ import annotations

import enum

from core import feconf
from core.constants import constants
from core.domain import caching_services
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_list
from core.domain import platform_parameter_registry as registry
from core.domain import platform_parameter_services as parameter_services
from core.tests import test_utils


class ParamName(enum.Enum):
    """Enum for parameter names."""

    PARAM_A = 'param_a'
    PARAM_B = 'param_b'
    PARAM_C = 'param_c'


ServerMode = platform_parameter_domain.ServerMode
FeatureStages = platform_parameter_domain.FeatureStages


class PlatformFeatureServiceTest(test_utils.GenericTestBase):
    """Test for the platform feature services."""

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.original_parameter_registry = (
            registry.Registry.parameter_registry.copy())
        registry.Registry.parameter_registry.clear()

        # Parameter names that might be used in following tests.
        self.param_names = ['param_a', 'param_b', 'param_c']
        self.param_name_enums = [
            ParamName.PARAM_A, ParamName.PARAM_B, ParamName.PARAM_C]
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            self.param_names)

        # Here we use MyPy ignore because we use dummy platform parameter
        # names for our tests and create_platform_parameter only accepts
        # platform parameter name of type platform_parameter_list.ParamName.
        self.param_a = registry.Registry.create_platform_parameter(
            ParamName.PARAM_A, # type: ignore[arg-type]
            'Parameter named a',
            platform_parameter_domain.DataTypes.STRING)
        # Here we use MyPy ignore because we use dummy platform parameter
        # names for our tests and create_platform_parameter only accepts
        # platform parameter name of type platform_parameter_list.ParamName.
        self.param_b = registry.Registry.create_platform_parameter(
            ParamName.PARAM_B, # type: ignore[arg-type]
            'Parameter named b',
            platform_parameter_domain.DataTypes.BOOL)
        # Here we use MyPy ignore because we use dummy platform parameter
        # names for our tests and create_platform_parameter only accepts
        # platform parameter name of type platform_parameter_list.ParamName.
        self.param_c = registry.Registry.create_platform_parameter(
            ParamName.PARAM_C, # type: ignore[arg-type]
            'Parameter named c',
            platform_parameter_domain.DataTypes.NUMBER)

        self.swap_all_platform_params_list = self.swap(
            platform_parameter_list,
            'ALL_PLATFORM_PARAMS_LIST',
            self.param_name_enums
        )

    def tearDown(self) -> None:
        super().tearDown()
        registry.Registry.parameter_registry = self.original_parameter_registry

    def test_get_all_platform_parameters_dicts(
        self
    ) -> None:
        expected_dicts = [
            self.param_a.to_dict(),
            self.param_b.to_dict(),
            self.param_c.to_dict(),
        ]
        with self.swap_all_platform_params_list:
            self.assertEqual(
                parameter_services.
                get_all_platform_parameters_dicts(),
                expected_dicts)

    def test_get_platform_parameter_value(self) -> None:
        with self.swap_all_platform_params_list:
            self.assertEqual(
                parameter_services.get_platform_parameter_value(
                    self.param_b.name), False)

    def test_get_unknown_platform_param_value_results_in_error(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Unknown platform parameter: unknown_platform_param'
        ):
            with self.swap_all_platform_params_list:
                parameter_services.get_platform_parameter_value(
                    'unknown_platform_param')

    def test_create_evaluation_context_for_client_returns_correct_context(
        self
    ) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            context = parameter_services.create_evaluation_context_for_client(
                {
                    'platform_type': 'Android',
                    'app_version': '1.0.0',
                }
            )
            self.assertEqual(
                context.server_mode,
                FeatureStages.DEV)
            self.assertEqual(context.platform_type, 'Android')
            self.assertEqual(context.app_version, '1.0.0')

    def test_evaluation_context_for_app_version_works_as_expected(self) -> None:
        with self.swap_all_platform_params_list:
            self.assertFalse(parameter_services.get_platform_parameter_value(
                self.param_c.name))

            registry.Registry.update_platform_parameter(
                self.param_c.name, self.user_id, 'edit rules',
                [
                    platform_parameter_domain.PlatformParameterRule.from_dict({
                        'filters': [
                            {
                                'type': 'app_version',
                                'conditions': [
                                    ['>=', '3.3.1']
                                ],
                            }
                        ],
                        'value_when_matched': True
                    })
                ],
                False
            )

            with self.swap(constants, 'BRANCH_NAME', ''):
                self.assertTrue(parameter_services.get_platform_parameter_value(
                    self.param_c.name))

            with self.swap(constants, 'BRANCH_NAME', 'release-3-3-1-hotfix-5'):
                self.assertTrue(parameter_services.get_platform_parameter_value(
                    self.param_c.name))

            with self.swap(constants, 'BRANCH_NAME', 'release-3-3-1'):
                self.assertTrue(parameter_services.get_platform_parameter_value(
                    self.param_c.name))

    def test_platform_parameter_schema_acc_to_data_type(self) -> None:
        with self.swap_all_platform_params_list:
            self.assertEqual(
                {'type': 'unicode'},
                parameter_services.get_platform_parameter_schema(
                    self.param_a.name)
            )

            self.assertEqual(
                {'type': 'bool'},
                parameter_services.get_platform_parameter_schema(
                    self.param_b.name)
            )

            self.assertEqual(
                {'type': 'float'},
                parameter_services.get_platform_parameter_schema(
                    self.param_c.name)
            )

    def test_raise_exception_when_invalid_data_type_trying_to_get_schema(
        self
    ) -> None:
        param_dict = {
            'name': 'param_name',
            'description': 'param description',
            'data_type': 'unknown',
            'rules': [],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': 'abc',
            'is_feature': False,
            'feature_stage': None
        }
        # Here we use MyPy ignore because we want to create a platform parameter
        # with an invalid 'data_type' field to test that the exception
        # gets raised.
        parameter = platform_parameter_domain.PlatformParameter.from_dict(
            param_dict) # type: ignore[arg-type]
        swap_get_platform_parameter = self.swap_to_always_return(
            registry.Registry,
            'get_platform_parameter',
            parameter
        )

        with swap_get_platform_parameter, self.assertRaisesRegex(Exception, (
            'The param_name platform parameter has a data type of unknown '
            'which is not valid. Please use one of these data types instead: '
            'typing.Union\\[str, int, bool, float].'
        )):
            parameter_services.get_platform_parameter_schema(parameter.name)
