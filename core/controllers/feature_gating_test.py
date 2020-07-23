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
from core import features_registry
from core.domain import platform_parameter_domain as param_domain
from core.platform import models
from core.tests import test_utils

memcache_services = models.Registry.import_memcache_services()


class FeatureGatingHandlerTest(test_utils.GenericTestBase):
    """Tests for the FeatureGatingHandler."""

    def setUp(self):
        super(FeatureGatingHandlerTest, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.original_registry = param_domain.Registry.parameter_registry
        self.original_feature_list = features_registry.ALL_FEATURES_LIST
        self.original_feature_name_set = (
            features_registry.ALL_FEATURES_NAMES_SET)

        param_names = ['parameter_a', 'parameter_b']
        self.memcache_keys = [
            param_domain.PlatformParameter.get_memcache_key(name)
            for name in param_names]
        memcache_services.delete_multi(self.memcache_keys)

        param_domain.Registry.parameter_registry.clear()
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

        features_registry.ALL_FEATURES_LIST = param_names
        features_registry.ALL_FEATURES_NAMES_SET = set(param_names)

    def tearDown(self):
        super(FeatureGatingHandlerTest, self).tearDown()

        features_registry.ALL_FEATURES_LIST = self.original_feature_list
        features_registry.ALL_FEATURES_NAMES_SET = (
            self.original_feature_name_set)
        param_domain.Registry.parameter_registry = self.original_registry


    def test_post_handler_works_correctly(self):
        csrf_token = self.get_new_csrf_token()
        with self.swap(constants, 'DEV_MODE', True):
            result = self.post_json(
                url='/featuregatinghandler',
                payload={
                    'data': {
                        'platform': 'Android',
                        'client_type': 'native',
                        'browser': 'n/a',
                        'app_version': '1.0.0',
                        'locale': 'en-US',
                    }
                },
                csrf_token=csrf_token)
            self.assertEqual(
                result,
                {'parameter_a': False, 'parameter_b': True})
