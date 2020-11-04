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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import caching_services
from core.domain import platform_feature_services as feature_services
from core.domain import platform_parameter_domain as param_domain
from core.domain import platform_parameter_registry as registry
from core.tests import test_utils


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
            'parameter_a', 'parameter for test', 'bool',
            is_feature=True, feature_stage=param_domain.FEATURE_STAGES.dev)
        self.prod_feature = registry.Registry.create_platform_parameter(
            'parameter_b', 'parameter for test', 'bool',
            is_feature=True, feature_stage=param_domain.FEATURE_STAGES.prod)
        registry.Registry.update_platform_parameter(
            self.prod_feature.name, self.user_id, 'edit rules',
            [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [['=', param_domain.SERVER_MODES.dev]]
                        }
                    ],
                    'value_when_matched': True
                }
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
                    'client_type': 'Android',
                    'app_version': '1.0.0',
                    'user_locale': 'en',
                }
            )
            self.assertEqual(
                result,
                {self.dev_feature.name: False, self.prod_feature.name: True})

    def test_get_features_invalid_client_type_returns_features_disabled(self):
        with self.swap(constants, 'DEV_MODE', True):
            result = self.get_json(
                '/platform_features_evaluation_handler',
                params={
                    'client_type': 'invalid',
                    'user_locale': 'en',
                },
                expected_status_int=200
            )
            self.assertEqual(
                result,
                {self.dev_feature.name: False, self.prod_feature.name: False})

    def test_get_features_missing_client_type_returns_features_disabled(self):
        with self.swap(constants, 'DEV_MODE', True):
            result = self.get_json(
                '/platform_features_evaluation_handler',
                params={
                    'user_locale': 'en',
                }
            )
            self.assertEqual(
                result,
                {self.dev_feature.name: False, self.prod_feature.name: False})

    def test_get_features_invalid_user_locale_returns_features_disabled(self):
        with self.swap(constants, 'DEV_MODE', True):
            result = self.get_json(
                '/platform_features_evaluation_handler',
                params={
                    'client_type': 'Android',
                    'user_locale': 'invalid',
                },
                expected_status_int=200
            )
            self.assertEqual(
                result,
                {self.dev_feature.name: False, self.prod_feature.name: False})

    def test_get_features_missing_user_locale_returns_features_disabled(self):
        with self.swap(constants, 'DEV_MODE', True):
            result = self.get_json(
                '/platform_features_evaluation_handler',
                params={
                    'client_type': 'Android',
                }
            )
            self.assertEqual(
                result,
                {self.dev_feature.name: False, self.prod_feature.name: False})

    def test_get_features_invalid_version_flavor_raises_400(self):
        with self.swap(constants, 'DEV_MODE', True):
            resp_dict = self.get_json(
                '/platform_features_evaluation_handler',
                params={
                    'client_type': 'Android',
                    'app_version': '1.0.0-abcdefg-invalid',
                    'user_locale': 'en',
                },
                expected_status_int=400
            )
            self.assertEqual(
                resp_dict['error'],
                'Invalid version flavor \'invalid\', must be one of '
                '[u\'test\', u\'alpha\', u\'beta\', u\'release\'] if specified.'
            )
