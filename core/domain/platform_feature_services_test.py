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

from core import python_utils
from core import utils
from core.constants import constants
from core.domain import caching_services
from core.domain import platform_feature_services as feature_services
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_registry as registry
from core.tests import test_utils

PARAM_NAMES = python_utils.create_enum('feature_a', 'feature_b')  # pylint: disable=invalid-name
SERVER_MODES = platform_parameter_domain.SERVER_MODES
FEATURE_STAGES = platform_parameter_domain.FEATURE_STAGES


class PlatformFeatureServiceTest(test_utils.GenericTestBase):
    """Test for the platform feature services."""

    def setUp(self):
        super(PlatformFeatureServiceTest, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        registry.Registry.parameter_registry.clear()
        # Parameter names that might be used in following tests.
        param_names = ['feature_a', 'feature_b']
        param_name_enums = [PARAM_NAMES.feature_a, PARAM_NAMES.feature_b]
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            param_names)

        self.dev_feature = registry.Registry.create_feature_flag(
            PARAM_NAMES.feature_a, 'a feature in dev stage',
            platform_parameter_domain.FEATURE_STAGES.dev)
        self.prod_feature = registry.Registry.create_feature_flag(
            PARAM_NAMES.feature_b, 'a feature in prod stage',
            platform_parameter_domain.FEATURE_STAGES.prod)
        registry.Registry.update_platform_parameter(
            self.dev_feature.name, self.user_id, 'edit rules',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', SERVER_MODES.dev.value]
                            ]
                        }
                    ],
                    'value_when_matched': True
                })
            ]
        )

        registry.Registry.update_platform_parameter(
            self.prod_feature.name, self.user_id, 'edit rules',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', SERVER_MODES.dev.value],
                                ['=', SERVER_MODES.test.value],
                                ['=', SERVER_MODES.prod.value]
                            ]
                        }
                    ],
                    'value_when_matched': True
                })
            ]
        )

        # Replace feature lists with mocked names.
        self.original_feature_list = feature_services.ALL_FEATURES_LIST
        self.original_feature_name_set = (
            feature_services.ALL_FEATURES_NAMES_SET)
        feature_services.ALL_FEATURES_LIST = param_name_enums
        feature_services.ALL_FEATURES_NAMES_SET = set(param_names)

    def tearDown(self):
        super(PlatformFeatureServiceTest, self).tearDown()
        feature_services.ALL_FEATURES_LIST = self.original_feature_list
        feature_services.ALL_FEATURES_NAMES_SET = (
            self.original_feature_name_set)

    def test_create_evaluation_context_for_client_returns_correct_context(self):
        with self.swap(constants, 'DEV_MODE', True):
            context = feature_services.create_evaluation_context_for_client(
                {
                    'platform_type': 'Android',
                    'browser_type': None,
                    'app_version': '1.0.0',
                }
            )
            self.assertEqual(
                context.server_mode,
                platform_parameter_domain.FEATURE_STAGES.dev)
            self.assertEqual(context.platform_type, 'Android')
            self.assertEqual(context.browser_type, None)
            self.assertEqual(context.app_version, '1.0.0')

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
                'platform_type': 'Android',
                'browser_type': None,
                'app_version': '1.0.0',
            })
            self.assertEqual(
                feature_services.evaluate_all_feature_flag_values_for_client(
                    context),
                {
                    self.dev_feature.name: True,
                    self.prod_feature.name: True,
                })

    def test_get_all_feature_flag_values_in_prod_returns_correct_values(self):
        with self.swap(constants, 'DEV_MODE', False):
            context = feature_services.create_evaluation_context_for_client({
                'platform_type': 'Android',
                'browser_type': None,
                'app_version': '1.0.0',
            })
            self.assertEqual(
                feature_services.evaluate_all_feature_flag_values_for_client(
                    context),
                {
                    self.dev_feature.name: False,
                    self.prod_feature.name: True,
                })

    def test_evaluate_dev_feature_for_dev_server_returns_true(self):
        with self.swap(constants, 'DEV_MODE', True):
            self.assertTrue(
                feature_services.is_feature_enabled(self.dev_feature.name))

    def test_evaluate_prod_feature_for_dev_server_returns_true(self):
        with self.swap(constants, 'DEV_MODE', True):
            self.assertTrue(
                feature_services.is_feature_enabled(self.prod_feature.name))

    def test_evaluate_dev_feature_for_prod_server_returns_false(self):
        with self.swap(constants, 'DEV_MODE', False):
            self.assertFalse(
                feature_services.is_feature_enabled(self.dev_feature.name))

    def test_evaluate_prod_feature_for_prod_server_returns_true(
            self):
        with self.swap(constants, 'DEV_MODE', False):
            self.assertTrue(
                feature_services.is_feature_enabled(self.prod_feature.name))

    def test_evaluate_feature_for_prod_server_matches_to_backend_filter(
            self):
        registry.Registry.update_platform_parameter(
            self.prod_feature.name, self.user_id, 'edit rules',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', SERVER_MODES.prod.value]
                            ],
                        },
                        {
                            'type': 'platform_type',
                            'conditions': [
                                ['=', 'Backend']
                            ],
                        }
                    ],
                    'value_when_matched': True
                })
            ]
        )
        with self.swap(constants, 'DEV_MODE', False):
            self.assertTrue(
                feature_services.is_feature_enabled(self.prod_feature.name))

    def test_get_feature_flag_values_with_unknown_name_raises_error(self):
        with self.assertRaisesRegexp(
            Exception, 'Unknown feature flag'):
            feature_services.is_feature_enabled('feature_that_does_not_exist')

    def test_update_feature_flag_rules_successfully_updates_rules(self):
        feature_services.update_feature_flag_rules(
            self.dev_feature.name, self.user_id, 'test update',
            [
                platform_parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [
                                ['=', FEATURE_STAGES.dev.value]
                            ]
                        }
                    ],
                    'value_when_matched': False
                })
            ]
        )

        with self.swap(constants, 'DEV_MODE', True):
            self.assertFalse(
                feature_services.is_feature_enabled(self.dev_feature.name))

    def test_update_feature_flag_rules_with_unknown_name_raises_error(self):
        unknown_name = 'feature_that_does_not_exist'
        with self.assertRaisesRegexp(
            Exception, 'Unknown feature flag: %s' % unknown_name):
            feature_services.update_feature_flag_rules(
                unknown_name, self.user_id, 'test update',
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
                    platform_parameter_domain.PlatformParameterRule.from_dict({
                        'filters': [
                            {
                                'type': 'app_version',
                                'conditions': [['=', '1.2.3']]
                            }
                        ],
                        'value_when_matched': True
                    }),
                    platform_parameter_domain.PlatformParameterRule.from_dict({
                        'filters': [], 'value_when_matched': False
                    })
                ]
            )
