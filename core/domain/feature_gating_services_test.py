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
from core import features_registry
from core.domain import feature_gating_services as feature_services
from core.domain import platform_parameter_domain as param_domain
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

        param_domain.Registry.parameter_registry.clear()
        # Parameter names that might be used in following tests.
        param_names = ['parameter_a', 'parameter_b']
        memcache_keys = [
            param_domain.PlatformParameter.get_memcache_key(name)
            for name in param_names]
        memcache_services.delete_multi(memcache_keys)

        self.param_1 = param_domain.Registry.create_platform_parameter(
            name='parameter_a',
            description='parameter for test',
            data_type='bool',
            is_feature=True,
            feature_stage='dev',
        )
        self.param_2 = param_domain.Registry.create_platform_parameter(
            name='parameter_b',
            description='parameter for test',
            data_type='bool',
            is_feature=True,
            feature_stage='prod',
        )
        param_domain.Registry.update_platform_parameter(
            name=self.param_2.name,
            committer_id=self.user_id,
            commit_message='edit rules',
            new_rule_dicts=[
                {
                    'filters': [{'type': 'mode', 'value': 'dev'}],
                    'value_when_matched': True
                },
                {'filters': [], 'value_when_matched': False},
            ]
        )

        self.original_feature_list = features_registry.ALL_FEATURES_LIST
        self.original_feature_name_set = (
            features_registry.ALL_FEATURES_NAMES_SET)
        features_registry.ALL_FEATURES_LIST = param_names
        features_registry.ALL_FEATURES_NAMES_SET = set(param_names)

    def tearDown(self):
        super(FeatureGatingServicesTest, self).tearDown()
        features_registry.ALL_FEATURES_LIST = self.original_feature_list
        features_registry.ALL_FEATURES_NAMES_SET = (
            self.original_feature_name_set)

    def test_get_running_mode_in_dev(self):
        with self.swap(constants, 'DEV_MODE', True):
            self.assertEqual(feature_services.get_running_mode(), 'dev')

    def test_get_running_mode_in_prod(self):
        with self.swap(constants, 'DEV_MODE', False):
            self.assertEqual(feature_services.get_running_mode(), 'prod')

    def test_create_evaluation_context_for_client(self):
        with self.swap(constants, 'DEV_MODE', True):
            context = feature_services.create_evaluation_context_for_client(
                client_context_dict={
                    'client_platform': 'Android',
                    'client_type': 'native',
                    'browser_type': 'n/a',
                    'app_version': '1.0.0',
                    'user_locale': 'en-US',
                }
            )
            self.assertEqual(context.mode, 'dev')
            self.assertEqual(context.client_platform, 'Android')
            self.assertEqual(context.client_type, 'native')
            self.assertEqual(context.browser_type, 'n/a')
            self.assertEqual(context.app_version, '1.0.0')
            self.assertEqual(context.user_locale, 'en-US')

    def test_create_evaluation_context_for_server(self):
        with self.swap(constants, 'DEV_MODE', True):
            context = feature_services.create_evaluation_context_for_server()
            self.assertEqual(context.mode, 'dev')
            self.assertIsNone(context.client_platform)
            self.assertIsNone(context.client_type)
            self.assertIsNone(context.browser_type)
            self.assertIsNone(context.app_version)
            self.assertIsNone(context.user_locale)

    def test_get_all_feature_flag_setting_dicts(self):
        expected_dicts = [
            self.param_1.to_dict(),
            self.param_2.to_dict(),
        ]
        self.assertEqual(
            feature_services.get_all_feature_flag_setting_dicts(),
            expected_dicts)

    def test_get_all_feature_flag_values_for_context_of_client(self):
        with self.swap(constants, 'DEV_MODE', True):
            context = feature_services.create_evaluation_context_for_client({
                'client_platform': 'Android',
                'client_type': 'native',
                'browser_type': 'n/a',
                'app_version': '1.0.0',
                'user_locale': 'en-US',
            })
            self.assertEqual(
                feature_services.get_all_feature_flag_values_for_context(
                    context),
                {
                    self.param_1.name: False,
                    self.param_2.name: True,
                }
            )

    def test_get_feature_flag_values_for_context_of_server(self):
        with self.swap(constants, 'DEV_MODE', True):
            context = feature_services.create_evaluation_context_for_server()
            self.assertEqual(
                feature_services.get_all_feature_flag_values_for_context(
                    context),
                {
                    self.param_1.name: False,
                    self.param_2.name: True,
                }
            )

    def test_get_feature_flag_values_for_context_with_invalid_name_failure(
            self):
        context = feature_services.create_evaluation_context_for_server()
        with self.assertRaisesRegexp(Exception, 'not exist'):
            feature_services.get_feature_flag_values_for_context(
                ['feature_that_does_not_exist'],
                context)

    def test_update_feature_flag_rules(self):
        feature_services.update_feature_flag_rules(
            feature_name=self.param_1.name,
            committer_id=self.user_id,
            commit_message='test update',
            new_rule_dicts=[
                {
                    'filters': [{'type': 'mode', 'value': 'dev'}],
                    'value_when_matched': True
                },
                {'filters': [], 'value_when_matched': False},
            ]
        )

        with self.swap(constants, 'DEV_MODE', True):
            context = feature_services.create_evaluation_context_for_server()
            self.assertEqual(
                feature_services.get_all_feature_flag_values_for_context(
                    context),
                {
                    self.param_1.name: True,
                    self.param_2.name: True,
                }
            )

    def test_update_feature_flag_rules_with_invalid_name_failure(self):
        with self.assertRaisesRegexp(Exception, 'not exist'):
            feature_services.update_feature_flag_rules(
                feature_name='feature_that_does_not_exist',
                committer_id=self.user_id,
                commit_message='test update',
                new_rule_dicts=[
                    {'filters': [], 'value_when_matched': False},
                ]
            )

    def test_update_feature_flag_rules_with_invalid_rules_failure(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'must have a mode filter'):
            feature_services.update_feature_flag_rules(
                feature_name=self.param_1.name,
                committer_id=self.user_id,
                commit_message='test update',
                new_rule_dicts=[
                    {
                        'filters': [{'type': 'user_locale', 'value': 'en-US'}],
                        'value_when_matched': True
                    },
                    {
                        'filters': [], 'value_when_matched': False
                    }
                ]
            )
