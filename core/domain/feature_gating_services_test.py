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

"""Unit tests for feature_gating_services.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import feature_gating_services as feature_services
from core.domain import platform_parameter_domain as param_domain
from core.domain import platform_parameter_registry as registry
from core.platform import models
from core.tests import test_utils
import utils

memcache_services = models.Registry.import_memcache_services()


class FeatureGatingServicesTest(test_utils.GenericTestBase):
    """Test for the feature gating services."""

    def setUp(self):
        super(FeatureGatingServicesTest, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        registry.Registry.parameter_registry.clear()
        # Parameter names that might be used in following tests.
        param_names = ['parameter_a', 'parameter_b']
        memcache_keys = [
            param_domain.PlatformParameter.get_memcache_key(name)
            for name in param_names]
        memcache_services.delete_multi(memcache_keys)

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
                            'conditions': [
                                ['=', param_domain.FEATURE_STAGES.dev]
                            ]
                        }
                    ],
                    'value_when_matched': True
                }
            ]
        )

        # Replace feature lists with mocked names.
        self.original_feature_list = feature_services.ALL_FEATURES_LIST
        self.original_feature_name_set = (
            feature_services.ALL_FEATURES_NAMES_SET)
        feature_services.ALL_FEATURES_LIST = param_names
        feature_services.ALL_FEATURES_NAMES_SET = set(param_names)

    def tearDown(self):
        super(FeatureGatingServicesTest, self).tearDown()
        feature_services.ALL_FEATURES_LIST = self.original_feature_list
        feature_services.ALL_FEATURES_NAMES_SET = (
            self.original_feature_name_set)

    def test_create_evaluation_context_for_client_returns_correct_context(self):
        with self.swap(constants, 'DEV_MODE', True):
            context = feature_services.create_evaluation_context_for_client(
                {
                    'client_type': 'Android',
                    'browser_type': None,
                    'app_version': '1.0.0',
                    'user_locale': 'en',
                }
            )
            self.assertEqual(
                context.server_mode, param_domain.FEATURE_STAGES.dev)
            self.assertEqual(context.client_type, 'Android')
            self.assertEqual(context.browser_type, None)
            self.assertEqual(context.app_version, '1.0.0')
            self.assertEqual(context.user_locale, 'en')

    def test_get_all_feature_flag_setting_dicts_returns_correct_dicts(self):
        expected_dicts = {
            self.param_1.name: self.param_1.to_dict(),
            self.param_2.name: self.param_2.to_dict(),
        }
        self.assertEqual(
            feature_services.get_all_feature_flag_setting_dicts(),
            expected_dicts)

    def test_get_all_feature_flag_values_in_dev_returns_correct_values(self):
        with self.swap(constants, 'DEV_MODE', True):
            context = feature_services.create_evaluation_context_for_client({
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.0.0',
                'user_locale': 'en',
            })
            self.assertEqual(
                feature_services.get_all_feature_flag_values_for_context(
                    context),
                {
                    self.param_1.name: False,
                    self.param_2.name: True,
                }
            )

    def test_get_all_feature_flag_values_in_prod_returns_correct_values(self):
        with self.swap(constants, 'DEV_MODE', False):
            context = feature_services.create_evaluation_context_for_client({
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.0.0',
                'user_locale': 'en',
            })
            self.assertEqual(
                feature_services.get_all_feature_flag_values_for_context(
                    context),
                {
                    self.param_1.name: False,
                    self.param_2.name: False,
                }
            )

    def test_get_feature_flag_value_in_dev_env_returns_correct_values(self):
        with self.swap(constants, 'DEV_MODE', True):
            self.assertFalse(
                feature_services.get_feature_flag_value(self.param_1.name))
            self.assertTrue(
                feature_services.get_feature_flag_value(self.param_2.name))

    def test_get_feature_flag_value_in_prod_env_returns_correct_values(self):
        with self.swap(constants, 'DEV_MODE', False):
            self.assertFalse(
                feature_services.get_feature_flag_value(self.param_1.name))
            self.assertFalse(
                feature_services.get_feature_flag_value(self.param_2.name))

    def test_get_feature_flag_values_with_invalid_name_failure(self):
        with self.assertRaisesRegexp(Exception, 'not exist'):
            feature_services.get_feature_flag_value(
                'feature_that_does_not_exist')

    def test_update_feature_flag_rules_successfully_updates_rules(self):
        feature_services.update_feature_flag_rules(
            self.param_1.name, self.user_id, 'test update',
            [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', param_domain.FEATURE_STAGES.dev]
                            ]
                        }
                    ],
                    'value_when_matched': True
                },
            ]
        )

        with self.swap(constants, 'DEV_MODE', True):
            self.assertTrue(
                feature_services.get_feature_flag_value(self.param_1.name))
            self.assertTrue(
                feature_services.get_feature_flag_value(self.param_2.name))

    def test_update_feature_flag_rules_with_invalid_name_failure(self):
        with self.assertRaisesRegexp(Exception, 'not exist'):
            feature_services.update_feature_flag_rules(
                'feature_that_does_not_exist', self.user_id, 'test update',
                [
                    {'filters': [], 'value_when_matched': False},
                ]
            )

    def test_update_feature_flag_rules_with_invalid_rules_failure(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'must have a server_mode filter'):
            feature_services.update_feature_flag_rules(
                self.param_1.name, self.user_id, 'test update',
                [
                    {
                        'filters': [
                            {
                                'type': 'user_locale',
                                'conditions': [['=', 'en']]
                            }
                        ],
                        'value_when_matched': True
                    },
                    {
                        'filters': [], 'value_when_matched': False
                    }
                ]
            )
