# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for platform_feature_services.py."""

from __future__ import annotations

import enum

from core import feconf
from core.constants import constants
from core.domain import caching_services
from core.domain import platform_feature_services as feature_services
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_registry as registry
from core.tests import test_utils


class ParamNames(enum.Enum):
    """Enum for parameter names."""

    FEATURE_A = 'feature_a'
    FEATURE_B = 'feature_b'
    FEATURE_C = 'feature_c'
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
        param_names = ['param_a', 'param_b', 'param_c']
        param_name_enums = [
            ParamNames.PARAM_A, ParamNames.PARAM_B, ParamNames.PARAM_C]
        param_names_features = ['feature_a', 'feature_b', 'feature_c']
        param_name_enums_features = [
            ParamNames.FEATURE_A, ParamNames.FEATURE_B, ParamNames.FEATURE_C]
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            param_names_features)
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            param_names)

        self.dev_feature = registry.Registry.create_feature_flag(
            ParamNames.FEATURE_A, 'a feature in dev stage',
            FeatureStages.DEV)
        self.test_feature = registry.Registry.create_feature_flag(
            ParamNames.FEATURE_B, 'a feature in test stage',
            FeatureStages.TEST)
        self.prod_feature = registry.Registry.create_feature_flag(
            ParamNames.FEATURE_C, 'a feature in prod stage',
            FeatureStages.PROD)
        self.param_a = registry.Registry.create_platform_parameter(
            ParamNames.PARAM_A,
            'Parameter named a',
            platform_parameter_domain.DataTypes.BOOL)
        self.param_b = registry.Registry.create_platform_parameter(
            ParamNames.PARAM_B,
            'Parameter named b',
            platform_parameter_domain.DataTypes.BOOL)
        self.param_c = registry.Registry.create_platform_parameter(
            ParamNames.PARAM_C,
            'Parameter named c',
            platform_parameter_domain.DataTypes.BOOL)

        registry.Registry.update_platform_parameter(
            self.dev_feature.name, self.user_id, 'edit rules',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', ServerMode.DEV.value]
                            ]
                        }
                    ],
                    'value_when_matched': True
                })
            ],
            False
        )

        registry.Registry.update_platform_parameter(
            self.test_feature.name, self.user_id, 'edit rules',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', ServerMode.DEV.value],
                                ['=', ServerMode.TEST.value],
                            ]
                        }
                    ],
                    'value_when_matched': True
                })
            ],
            False
        )

        registry.Registry.update_platform_parameter(
            self.prod_feature.name, self.user_id, 'edit rules',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', ServerMode.DEV.value],
                                ['=', ServerMode.TEST.value],
                                ['=', ServerMode.PROD.value]
                            ]
                        }
                    ],
                    'value_when_matched': True
                })
            ],
            False
        )

        # Replace feature lists with mocked names.
        self.original_feature_list = feature_services.ALL_FEATURE_FLAGS
        self.original_feature_name_set = (
            feature_services.ALL_FEATURES_NAMES_SET
        )
        self.original_parameter_list = (
            feature_services.ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS)
        # Here we use MyPy ignore because the expected type of ALL_FEATURE_FLAGS
        # is a list of 'PARAM_NAMES' Enum, but here for testing purposes we are
        # providing a list of 'ParamNames' enums, which causes MyPy to throw an
        # 'Incompatible types in assignment' error. Thus to avoid the error, we
        # used ignore here.
        feature_services.ALL_FEATURE_FLAGS = param_name_enums_features  # type: ignore[assignment]
        feature_services.ALL_FEATURES_NAMES_SET = set(param_names_features)
        # Here we use MyPy ignore because the expected type of
        # ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS is a list of 'PARAM_NAMES'
        # Enum, but here for testing purposes we are providing a list of
        # 'ParamNames' enums, which causes MyPy to throw an 'Incompatible types
        # in assignment' error. Thus to avoid the error, we used ignore here.
        feature_services.ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS = (
            param_name_enums) # type: ignore[assignment]

    def tearDown(self) -> None:
        super().tearDown()
        feature_services.ALL_FEATURE_FLAGS = self.original_feature_list
        feature_services.ALL_FEATURES_NAMES_SET = (
            self.original_feature_name_set)
        feature_services.ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS = (
            self.original_parameter_list)
        registry.Registry.parameter_registry = self.original_parameter_registry

    def test_get_all_platform_parameters_except_feature_flag_dicts(
        self
    ) -> None:
        expected_dicts = [
            self.param_a.to_dict(),
            self.param_b.to_dict(),
            self.param_c.to_dict(),
        ]
        self.assertEqual(
            feature_services.
            get_all_platform_parameters_except_feature_flag_dicts(),
            expected_dicts)

    def test_get_platform_parameter_value(self) -> None:
        self.assertEqual(
            feature_services.get_platform_parameter_value(
                self.param_a.name), False)

    def test_get_unknown_platform_param_value_results_in_error(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Unknown platform parameter: unknown_platform_param'
        ):
            feature_services.get_platform_parameter_value(
                'unknown_platform_param')

    def test_create_evaluation_context_for_client_returns_correct_context(
        self
    ) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            context = feature_services.create_evaluation_context_for_client(
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

    def test_get_all_feature_flag_dicts_returns_correct_dicts(self) -> None:
        expected_dicts = [
            self.dev_feature.to_dict(),
            self.test_feature.to_dict(),
            self.prod_feature.to_dict(),
        ]
        self.assertEqual(
            feature_services.get_all_feature_flag_dicts(),
            expected_dicts)

    def test_get_all_feature_flag_values_in_dev_returns_correct_values(
        self
    ) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            context = feature_services.create_evaluation_context_for_client({
                'platform_type': 'Android',
                'app_version': '1.0.0',
            })
            self.assertEqual(
                feature_services.evaluate_all_feature_flag_values_for_client(
                    context),
                {
                    self.dev_feature.name: True,
                    self.test_feature.name: True,
                    self.prod_feature.name: True,
                })

    def test_get_all_feature_flag_values_in_test_returns_correct_values(
        self
    ) -> None:
        constants_swap = self.swap(constants, 'DEV_MODE', False)
        env_swap = self.swap(
            feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False)
        with constants_swap, env_swap:
            context = feature_services.create_evaluation_context_for_client({
                'platform_type': 'Android',
                'app_version': '1.0.0',
            })
            self.assertEqual(
                feature_services.evaluate_all_feature_flag_values_for_client(
                    context),
                {
                    self.dev_feature.name: False,
                    self.test_feature.name: True,
                    self.prod_feature.name: True,
                })

    def test_get_all_feature_flag_values_in_prod_returns_correct_values(
        self
    ) -> None:
        constants_swap = self.swap(constants, 'DEV_MODE', False)
        env_swap = self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True)
        with constants_swap, env_swap:
            context = feature_services.create_evaluation_context_for_client({
                'platform_type': 'Android',
                'app_version': '1.0.0',
            })
            self.assertEqual(
                feature_services.evaluate_all_feature_flag_values_for_client(
                    context),
                {
                    self.dev_feature.name: False,
                    self.test_feature.name: False,
                    self.prod_feature.name: True,
                })

    def test_evaluate_dev_feature_for_dev_server_returns_true(self) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            self.assertTrue(
                feature_services.is_feature_enabled(self.dev_feature.name))

    def test_evaluate_test_feature_for_dev_server_returns_true(self) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            self.assertTrue(
                feature_services.is_feature_enabled(self.test_feature.name))

    def test_evaluate_prod_feature_for_dev_server_returns_true(self) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            self.assertTrue(
                feature_services.is_feature_enabled(self.prod_feature.name))

    def test_evaluate_dev_feature_for_test_server_returns_false(self) -> None:
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False):
                self.assertFalse(
                    feature_services.is_feature_enabled(self.dev_feature.name))

    def test_evaluate_test_feature_for_test_server_returns_true(self) -> None:
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False):
                self.assertTrue(
                    feature_services.is_feature_enabled(self.test_feature.name))

    def test_evaluate_prod_feature_for_test_server_returns_true(self) -> None:
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False):
                self.assertTrue(
                    feature_services.is_feature_enabled(self.prod_feature.name))

    def test_evaluate_dev_feature_for_prod_server_returns_false(self) -> None:
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                self.assertFalse(
                    feature_services.is_feature_enabled(self.dev_feature.name))

    def test_evaluate_test_feature_for_prod_server_returns_false(self) -> None:
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                self.assertFalse(
                    feature_services.is_feature_enabled(self.test_feature.name))

    def test_evaluate_prod_feature_for_prod_server_returns_true(self) -> None:
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                self.assertTrue(
                    feature_services.is_feature_enabled(self.prod_feature.name))

    def test_evaluation_context_for_app_version_works_as_expected(self) -> None:
        self.assertFalse(feature_services.get_platform_parameter_value(
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
            self.assertTrue(feature_services.get_platform_parameter_value(
                self.param_c.name))

        with self.swap(constants, 'BRANCH_NAME', 'release-3-3-1-hotfix-5'):
            self.assertTrue(feature_services.get_platform_parameter_value(
                self.param_c.name))

        with self.swap(constants, 'BRANCH_NAME', 'release-3-3-1'):
            self.assertTrue(feature_services.get_platform_parameter_value(
                self.param_c.name))

    def test_evaluate_feature_for_prod_server_matches_to_web_filter(
        self
    ) -> None:
        registry.Registry.update_platform_parameter(
            self.prod_feature.name, self.user_id, 'edit rules',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [
                                ['=', 'Web']
                            ],
                        }
                    ],
                    'value_when_matched': True
                })
            ],
            False
        )
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                self.assertTrue(
                    feature_services.is_feature_enabled(self.prod_feature.name))

    def test_get_feature_flag_values_with_unknown_name_raises_error(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Unknown feature flag'):
            feature_services.is_feature_enabled('feature_that_does_not_exist')

    def test_update_feature_flag_successfully_updates_rules(self) -> None:
        feature_services.update_feature_flag(
            self.dev_feature.name, self.user_id, 'test update',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', FeatureStages.DEV.value]
                            ]
                        }
                    ],
                    'value_when_matched': False
                })
            ],
            False
        )

        with self.swap(constants, 'DEV_MODE', True):
            self.assertFalse(
                feature_services.is_feature_enabled(self.dev_feature.name))

    def test_update_feature_flag_with_unknown_name_raises_error(
        self
    ) -> None:
        unknown_name = 'feature_that_does_not_exist'
        with self.assertRaisesRegex(
            Exception, 'Unknown feature flag: %s' % unknown_name):
            feature_services.update_feature_flag(
                unknown_name, self.user_id, 'test update',
                [
                    platform_parameter_domain.PlatformParameterRule.from_dict(
                        {'filters': [], 'value_when_matched': False}
                    ),
                ],
                False
            )

    def test_all_platform_params_should_appear_once_in_features_or_in_params_list( # pylint: disable=line-too-long
        self
    ) -> None:
        feature_services.ALL_FEATURE_FLAGS = self.original_feature_list
        feature_services.ALL_FEATURES_NAMES_SET = (
            self.original_feature_name_set)
        feature_services.ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS = (
            self.original_parameter_list)
        registry.Registry.parameter_registry = self.original_parameter_registry
        all_params_name = registry.Registry.get_all_platform_parameter_names()
        all_features_names_list = [
            feature.value for feature in feature_services.ALL_FEATURE_FLAGS]
        all_params_except_features_names_list = [
            params.value
            for params in feature_services.ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS]
        self.assertEqual(
            len(all_params_name),
            (
                len(all_features_names_list) +
                len(all_params_except_features_names_list)
            )
        )
        for param_name in all_params_name:
            if param_name in all_features_names_list:
                self.assertNotIn(
                    param_name,
                    all_params_except_features_names_list,
                    'The platform parameter named %s is already present '
                    'in the ALL_FEATURE_FLAGS list and should not be present '
                    'in the ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS list.' % (
                        param_name))
            elif param_name in all_params_except_features_names_list:
                self.assertNotIn(
                    param_name,
                    all_features_names_list,
                    'The platform parameter named %s is already present '
                    'in the ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS list and '
                    'should not be present in the ALL_FEATURE_FLAGS list.' % (
                        param_name))
