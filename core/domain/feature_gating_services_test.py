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
        param_names = ['feature_a', 'feature_b']
        memcache_keys = [
            param_domain.PlatformParameter.get_memcache_key(name)
            for name in param_names]
        memcache_services.delete_multi(memcache_keys)

        self.dev_feature = registry.Registry.create_feature_flag(
            'feature_a', 'a feature in dev stage',
            param_domain.FEATURE_STAGES.dev)
        self.prod_feature = registry.Registry.create_feature_flag(
            'feature_b', 'a feature in prod stage',
            param_domain.FEATURE_STAGES.prod)

        registry.Registry.update_platform_parameter(
            self.dev_feature.name, self.user_id, 'edit rules',
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

        registry.Registry.update_platform_parameter(
            self.prod_feature.name, self.user_id, 'edit rules',
            [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', param_domain.SERVER_MODES.dev],
                                ['=', param_domain.SERVER_MODES.test],
                                ['=', param_domain.SERVER_MODES.prod]
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

    def test_get_all_feature_flag_dicts_returns_correct_dicts(self):
        expected_dicts = [
            self.dev_feature.to_dict(),
            self.prod_feature.to_dict(),
        ]
        self.assertEqual(
            feature_services.get_all_feature_flag_dicts(),
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
                feature_services.evaluate_all_feature_flag_value_for_client(
                    context),
                {
                    self.dev_feature.name: True,
                    self.prod_feature.name: True,
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
                feature_services.evaluate_all_feature_flag_value_for_client(
                    context),
                {
                    self.dev_feature.name: False,
                    self.prod_feature.name: True,
                }
            )

    def test_evaluate_dev_feature_for_dev_server_returns_true(self):
        with self.swap(constants, 'DEV_MODE', True):
            self.assertTrue(
                feature_services.evaluate_feature_flag_value_for_server(
                    self.dev_feature.name))

    def test_evaluate_prod_feature_for_dev_server_returns_false(self):
        with self.swap(constants, 'DEV_MODE', True):
            self.assertTrue(
                feature_services.evaluate_feature_flag_value_for_server(
                    self.prod_feature.name))

    def test_evaluate_dev_feature_for_prod_server_returns_false(self):
        with self.swap(constants, 'DEV_MODE', False):
            self.assertFalse(
                feature_services.evaluate_feature_flag_value_for_server(
                    self.dev_feature.name))

    def test_evaluate_prod_feature_for_prod_server_returns_true(
            self):
        with self.swap(constants, 'DEV_MODE', False):
            self.assertTrue(
                feature_services.evaluate_feature_flag_value_for_server(
                    self.prod_feature.name))

    def test_get_feature_flag_values_with_unknown_name_raises_error(self):
        with self.assertRaisesRegexp(
            Exception, 'Unknown feature flag'):
            feature_services.evaluate_feature_flag_value_for_server(
                'feature_that_does_not_exist')

    def test_update_feature_flag_rules_successfully_updates_rules(self):
        feature_services.update_feature_flag_rules(
            self.dev_feature.name, self.user_id, 'test update',
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
                    'value_when_matched': False
                },
            ]
        )

        with self.swap(constants, 'DEV_MODE', True):
            self.assertFalse(
                feature_services.evaluate_feature_flag_value_for_server(
                    self.dev_feature.name))

    def test_update_feature_flag_rules_with_unknown_name_raises_error(self):
        with self.assertRaisesRegexp(Exception, 'not exist'):
            feature_services.update_feature_flag_rules(
                'feature_that_does_not_exist', self.user_id, 'test update',
                [
                    {'filters': [], 'value_when_matched': False},
                ]
            )

    def test_update_feature_flag_rules_with_invalid_rules_raises_error(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'must have a server_mode filter'):
            feature_services.update_feature_flag_rules(
                self.dev_feature.name, self.user_id, 'test update',
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
