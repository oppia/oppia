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

"""Tests for platform feature evaluation handler."""

from __future__ import annotations

import enum

from core.constants import constants
from core.domain import caching_services
from core.domain import platform_feature_services as feature_services
from core.domain import platform_parameter_domain as param_domain
from core.domain import platform_parameter_list as param_list
from core.domain import platform_parameter_registry as registry
from core.tests import test_utils

from typing import ContextManager


class ParamNames(enum.Enum):
    """Enum for parameter names."""

    PARAMETER_A = 'parameter_a'
    PARAMETER_B = 'parameter_b'


class PlatformFeaturesEvaluationHandlerTest(test_utils.GenericTestBase):
    """Tests for the PlatformFeaturesEvaluationHandler."""

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.original_registry = registry.Registry.parameter_registry
        self.original_feature_list = feature_services.ALL_FEATURES_LIST
        self.original_feature_name_set = feature_services.ALL_FEATURES_NAMES_SET

        param_names = ['parameter_a', 'parameter_b']
        param_name_enums = [ParamNames.PARAMETER_A, ParamNames.PARAMETER_B]
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            param_names)

        registry.Registry.parameter_registry.clear()
        self.dev_feature = registry.Registry.create_platform_parameter(
            ParamNames.PARAMETER_A, 'parameter for test',
            param_domain.DataTypes.BOOL, is_feature=True,
            feature_stage=param_domain.FeatureStages.DEV)
        self.prod_feature = registry.Registry.create_platform_parameter(
            ParamNames.PARAMETER_B, 'parameter for test',
            param_domain.DataTypes.BOOL, is_feature=True,
            feature_stage=param_domain.FeatureStages.PROD)
        registry.Registry.update_platform_parameter(
            self.prod_feature.name, self.user_id, 'edit rules',
            [
                param_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', param_domain.ServerMode.DEV.value]
                            ]
                        }
                    ],
                    'value_when_matched': True
                })
            ]
        )

        # Here we use MyPy ignore because the expected type of ALL_FEATURES_LIST
        # is a list of 'platform_feature_list.ParamNames' Enum, but here for
        # testing purposes we are providing a list of custom 'ParamNames' enums
        # for mocking the actual behavior, which causes MyPy to throw an
        # 'Incompatible types in assignment' error. Thus to avoid the error, we
        # used ignore here.
        feature_services.ALL_FEATURES_LIST = param_name_enums  # type: ignore[assignment]
        feature_services.ALL_FEATURES_NAMES_SET = set(param_names)

    def tearDown(self) -> None:
        super().tearDown()

        feature_services.ALL_FEATURES_LIST = self.original_feature_list
        feature_services.ALL_FEATURES_NAMES_SET = self.original_feature_name_set
        registry.Registry.parameter_registry = self.original_registry

    def test_get_dev_mode_android_client_returns_correct_flag_values(
        self
    ) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            result = self.get_json(
                '/platform_features_evaluation_handler',
                params={
                    'platform_type': 'Android',
                    'app_version': '1.0.0',
                }
            )
            self.assertEqual(
                result,
                {self.dev_feature.name: False, self.prod_feature.name: True})

    def test_get_features_invalid_platform_type_returns_features_disabled(
        self
    ) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            result = self.get_json(
                '/platform_features_evaluation_handler',
                params={
                    'platform_type': 'invalid',
                },
                expected_status_int=200
            )
            self.assertEqual(
                result,
                {self.dev_feature.name: False, self.prod_feature.name: False})

    def test_get_features_missing_platform_type_returns_features_disabled(
        self
    ) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            result = self.get_json(
                '/platform_features_evaluation_handler',
                params={}
            )
            self.assertEqual(
                result,
                {self.dev_feature.name: False, self.prod_feature.name: False})

    def test_get_features_invalid_version_flavor_raises_400(
        self
    ) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            resp_dict = self.get_json(
                '/platform_features_evaluation_handler',
                params={
                    'platform_type': 'Android',
                    'app_version': '1.0.0-abcdefg-invalid',
                },
                expected_status_int=400
            )
            self.assertEqual(
                resp_dict['error'],
                'Invalid version flavor \'invalid\', must be one of '
                '[\'test\', \'alpha\', \'beta\', \'release\'] if specified.'
            )

    def test_get_features_invalid_browser_type_raises_400(
        self
    ) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            result = self.get_json(
                '/platform_features_evaluation_handler',
                params={
                    'browser_type': 'invalid_browser',
                },
                expected_status_int=400
            )

            error_msg = (
                'Schema validation for \'browser_type\' failed: Received '
                'invalid_browser which is not in the allowed range of choices: '
                '[\'Chrome\', \'Edge\', \'Safari\', \'Firefox\', \'Others\']'
            )
            self.assertEqual(result['error'], error_msg)

    def test_get_features_invalid_app_version_raises_400(self) -> None:
        with self.swap(constants, 'DEV_MODE', True):
            result = self.get_json(
                '/platform_features_evaluation_handler',
                params={
                    'app_version': 'invalid_app_version',
                },
                expected_status_int=400
            )

            error_msg = (
                'Schema validation for \'%s\' failed: Validation failed: '
                'is_regex_matched ({\'regex_pattern\': \'%s\'}) for '
                'object invalid_app_version' % (
                    'app_version',
                    '^(\\\\d+(?:\\\\.\\\\d+){2})(?:-[a-z0-9]+(?:-(.+))?)?$'
                )
            )
            self.assertEqual(result['error'], error_msg)


class PlatformFeatureDummyHandlerTest(test_utils.GenericTestBase):
    """Tests for the PlatformFeatureDummyHandler."""

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def tearDown(self) -> None:
        feature_services.update_feature_flag_rules(
            param_list.ParamNames.DUMMY_FEATURE.value, self.user_id,
            'clear rule', []
        )

        super().tearDown()

    def _set_dummy_feature_status_for_mode(
        self, is_enabled: bool, mode: param_domain.ServerMode
    ) -> None:
        """Enables the dummy_feature for the dev environment."""
        feature_services.update_feature_flag_rules(
            param_list.ParamNames.DUMMY_FEATURE.value, self.user_id,
            'update rule for testing purpose',
            [param_domain.PlatformParameterRule.from_dict({
                'value_when_matched': is_enabled,
                'filters': [{
                    'type': 'server_mode',
                    'conditions': [['=', mode.value]]
                }]
            })]
        )

    def _mock_dummy_feature_stage(
        self, stage: param_domain.FeatureStages
    ) -> ContextManager[None]:
        """Creates a mock context in which the dummy_feature is at the
        specified stage.
        """
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            [param_list.ParamNames.DUMMY_FEATURE.value])

        feature = registry.Registry.parameter_registry.get(
            param_list.ParamNames.DUMMY_FEATURE.value)
        return self.swap(feature, '_feature_stage', stage.value)

    def test_get_with_dummy_feature_enabled_in_dev_returns_ok(self) -> None:
        dev_mode_ctx = self.swap(constants, 'DEV_MODE', True)
        dummy_feature_dev_stage_context = self._mock_dummy_feature_stage(
            param_domain.FeatureStages.DEV)

        with dev_mode_ctx, dummy_feature_dev_stage_context:
            self._set_dummy_feature_status_for_mode(
                True, param_domain.ServerMode.DEV
            )

            result = self.get_json(
                '/platform_feature_dummy_handler',
            )
            self.assertEqual(result, {'msg': 'ok'})

    def test_get_with_dummy_feature_disabled_in_dev_raises_404(self) -> None:
        dev_mode_ctx = self.swap(constants, 'DEV_MODE', True)
        dummy_feature_dev_stage_context = self._mock_dummy_feature_stage(
            param_domain.FeatureStages.DEV)

        with dev_mode_ctx, dummy_feature_dev_stage_context:
            self._set_dummy_feature_status_for_mode(
                False, param_domain.ServerMode.DEV
            )
            self.get_json(
                '/platform_feature_dummy_handler',
                expected_status_int=404
            )

    def test_get_with_dummy_feature_enabled_in_prod_returns_ok(self) -> None:
        dev_mode_ctx = self.swap(constants, 'DEV_MODE', False)
        dummy_feature_prod_stage_context = self._mock_dummy_feature_stage(
            param_domain.FeatureStages.PROD)

        with dev_mode_ctx, dummy_feature_prod_stage_context:
            self._set_dummy_feature_status_for_mode(
                True, param_domain.ServerMode.PROD
            )

            result = self.get_json(
                '/platform_feature_dummy_handler',
            )
            self.assertEqual(result, {'msg': 'ok'})

    def test_get_with_dummy_feature_disabled_in_prod_raises_404(self) -> None:
        dev_mode_ctx = self.swap(constants, 'DEV_MODE', False)
        dummy_feature_prod_stage_context = self._mock_dummy_feature_stage(
            param_domain.FeatureStages.PROD)

        with dev_mode_ctx, dummy_feature_prod_stage_context:
            self._set_dummy_feature_status_for_mode(
                False, param_domain.ServerMode.PROD
            )
            self.get_json(
                '/platform_feature_dummy_handler',
                expected_status_int=404
            )
