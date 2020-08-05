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

"""Tests for feature gating handler."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import feature_gating_services as feature_services
from core.domain import platform_parameter_domain as param_domain
from core.domain import platform_parameter_registry as registry
from core.platform import models
from core.tests import test_utils

memcache_services = models.Registry.import_memcache_services()


class FeatureGatingHandlerTest(test_utils.GenericTestBase):
    """Tests for the FeatureGatingHandler."""

    def setUp(self):
        super(FeatureGatingHandlerTest, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.original_registry = registry.Registry.parameter_registry
        self.original_feature_list = feature_services.ALL_FEATURES_LIST
        self.original_feature_name_set = feature_services.ALL_FEATURES_NAMES_SET

        param_names = ['parameter_a', 'parameter_b']
        self.memcache_keys = [
            param_domain.PlatformParameter.get_memcache_key(name)
            for name in param_names]
        memcache_services.delete_multi(self.memcache_keys)

        registry.Registry.parameter_registry.clear()
        self.param_1 = registry.Registry.create_platform_parameter(
            'parameter_a', 'parameter for test', 'bool',
            is_feature=True, feature_stage=param_domain.FEATURE_STAGES.dev)
        self.param_2 = registry.Registry.create_platform_parameter(
            'parameter_b', 'parameter for test', 'bool',
            is_feature=True, feature_stage=param_domain.FEATURE_STAGES.prod)
        registry.Registry.update_platform_parameter(
            self.param_2.name, self.user_id, 'edit rules',
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
        super(FeatureGatingHandlerTest, self).tearDown()

        feature_services.ALL_FEATURES_LIST = self.original_feature_list
        feature_services.ALL_FEATURES_NAMES_SET = self.original_feature_name_set
        registry.Registry.parameter_registry = self.original_registry

    def test_post_handler_returns_correct_feature_flag_values(self):
        csrf_token = self.get_new_csrf_token()
        with self.swap(constants, 'DEV_MODE', True):
            result = self.post_json(
                '/featuregatinghandler',
                {
                    'client_type': 'Android',
                    'browser_type': None,
                    'app_version': '1.0.0',
                    'user_locale': 'en',
                },
                csrf_token=csrf_token)
            self.assertEqual(
                result,
                {'parameter_a': False, 'parameter_b': True})

    def test_post_handler_with_invalid_context_raises_400(self):
        csrf_token = self.get_new_csrf_token()
        resp_dict = self.post_json(
            '/featuregatinghandler',
            {
                'client_type': 'Invalid',
                'browser_type': None,
                'app_version': '1.0.0',
                'user_locale': 'en',
            },
            csrf_token=csrf_token,
            expected_status_int=400)
        self.assertEqual(
            resp_dict['error'],
            'Invalid client type \'Invalid\', must be one of [u\'Web\', '
            'u\'Android\'].'
        )
