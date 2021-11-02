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

from core import python_utils
from core.constants import constants
from core.domain import caching_services
from core.domain import platform_feature_services as feature_services
from core.domain import platform_parameter_domain as param_domain
from core.domain import platform_parameter_list as param_list
from core.domain import platform_parameter_registry as registry
from core.tests import test_utils

PARAM_NAMES = python_utils.create_enum('parameter_a', 'parameter_b')  # pylint: disable=invalid-name
DATA_TYPES = param_domain.DATA_TYPES


class PlatformFeaturesEvaluationHandlerTest(test_utils.GenericTestBase):
    """Tests for the PlatformFeaturesEvaluationHandler."""

    def setUp(self):
        super(PlatformFeaturesEvaluationHandlerTest, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.original_registry = registry.Registry.parameter_registry
        self.original_feature_list = feature_services.ALL_FEATURES_LIST
        self.original_feature_name_set = feature_services.ALL_FEATURES_NAMES_SET

        param_names = ['parameter_a', 'parameter_b']
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            param_names)

        registry.Registry.parameter_registry.clear()
        self.dev_feature = registry.Registry.create_platform_parameter(
            PARAM_NAMES.parameter_a, 'parameter for test', DATA_TYPES.bool,
            is_feature=True, feature_stage=param_domain.FEATURE_STAGES.dev)
        self.prod_feature = registry.Registry.create_platform_parameter(
            PARAM_NAMES.parameter_b, 'parameter for test', DATA_TYPES.bool,
            is_feature=True, feature_stage=param_domain.FEATURE_STAGES.prod)
        registry.Registry.update_platform_parameter(
            self.prod_feature.name, self.user_id, 'edit rules',
            [
                param_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', param_domain.SERVER_MODES.dev.value]
                            ]
                        }
                    ],
                    'value_when_matched': True
                })
            ]
        )

        feature_services.ALL_FEATURES_LIST = param_names
        feature_services.ALL_FEATURES_NAMES_SET = set(param_names)

    def tearDown(self):
        super(PlatformFeaturesEvaluationHandlerTest, self).tearDown()

        feature_services.ALL_FEATURES_LIST = self.original_feature_list
        feature_services.ALL_FEATURES_NAMES_SET = self.original_feature_name_set
        registry.Registry.parameter_registry = self.original_registry

    def test_get_dev_mode_android_client_returns_correct_flag_values(self):
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

    def test_get_features_invalid_platform_type_returns_features_disabled(self):
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

    def test_get_features_missing_platform_type_returns_features_disabled(self):
        with self.swap(constants, 'DEV_MODE', True):
            result = self.get_json(
                '/platform_features_evaluation_handler',
                params={}
            )
            self.assertEqual(
                result,
                {self.dev_feature.name: False, self.prod_feature.name: False})

    def test_get_features_invalid_version_flavor_raises_400(self):
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

    def test_get_features_invalid_browser_type_raises_400(self):
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

    def test_get_features_invalid_app_version_raises_400(self):
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

    def setUp(self):
        super(PlatformFeatureDummyHandlerTest, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def tearDown(self):
        feature_services.update_feature_flag_rules(
            param_list.PARAM_NAMES.dummy_feature.value, self.user_id,
            'clear rule', []
        )

        super(PlatformFeatureDummyHandlerTest, self).tearDown()

    def _set_dummy_feature_status_for_mode(self, is_enabled, mode):
        """Enables the dummy_feature for the dev environment."""
        feature_services.update_feature_flag_rules(
            param_list.PARAM_NAMES.dummy_feature.value, self.user_id,
            'update rule for testing purpose',
            [param_domain.PlatformParameterRule.from_dict({
                'value_when_matched': is_enabled,
                'filters': [{
                    'type': 'server_mode',
                    'conditions': [['=', mode.value]]
                }]
            })]
        )

    def _mock_dummy_feature_stage(self, stage):
        """Creates a mock context in which the dummy_feature is at the
        specified stage.
        """
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            [param_list.PARAM_NAMES.dummy_feature.value])

        feature = registry.Registry.parameter_registry.get(
            param_list.PARAM_NAMES.dummy_feature.value)
        return self.swap(feature, '_feature_stage', stage.value)

    def test_get_with_dummy_feature_enabled_in_dev_returns_ok(self):
        dev_mode_ctx = self.swap(constants, 'DEV_MODE', True)
        dummy_feature_dev_stage_context = self._mock_dummy_feature_stage(
            param_domain.FEATURE_STAGES.dev)

        with dev_mode_ctx, dummy_feature_dev_stage_context:
            self._set_dummy_feature_status_for_mode(
                True, param_domain.SERVER_MODES.dev
            )

            result = self.get_json(
                '/platform_feature_dummy_handler',
            )
            self.assertEqual(result, {'msg': 'ok'})

    def test_get_with_dummy_feature_disabled_in_dev_raises_404(self):
        dev_mode_ctx = self.swap(constants, 'DEV_MODE', True)
        dummy_feature_dev_stage_context = self._mock_dummy_feature_stage(
            param_domain.FEATURE_STAGES.dev)

        with dev_mode_ctx, dummy_feature_dev_stage_context:
            self._set_dummy_feature_status_for_mode(
                False, param_domain.SERVER_MODES.dev
            )
            self.get_json(
                '/platform_feature_dummy_handler',
                expected_status_int=404
            )

    def test_get_with_dummy_feature_enabled_in_prod_returns_ok(self):
        dev_mode_ctx = self.swap(constants, 'DEV_MODE', False)
        dummy_feature_prod_stage_context = self._mock_dummy_feature_stage(
            param_domain.FEATURE_STAGES.prod)

        with dev_mode_ctx, dummy_feature_prod_stage_context:
            self._set_dummy_feature_status_for_mode(
                True, param_domain.SERVER_MODES.prod
            )

            result = self.get_json(
                '/platform_feature_dummy_handler',
            )
            self.assertEqual(result, {'msg': 'ok'})

    def test_get_with_dummy_feature_disabled_in_prod_raises_404(self):
        dev_mode_ctx = self.swap(constants, 'DEV_MODE', False)
        dummy_feature_prod_stage_context = self._mock_dummy_feature_stage(
            param_domain.FEATURE_STAGES.prod)

        with dev_mode_ctx, dummy_feature_prod_stage_context:
            self._set_dummy_feature_status_for_mode(
                False, param_domain.SERVER_MODES.prod
            )
            self.get_json(
                '/platform_feature_dummy_handler',
                expected_status_int=404
            )
