# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for the release coordinator page."""

from __future__ import annotations

import enum

from core import feconf
from core.constants import constants
from core.domain import feature_flag_domain
from core.domain import feature_flag_registry
from core.domain import feature_flag_services
from core.tests import test_utils


class FeatureNames(enum.Enum):
    """Enum for feature names."""

    TEST_FEATURE_1 = 'test_feature_1'
    TEST_FEATURE_2 = 'test_feature_2'


FeatureStages = feature_flag_domain.FeatureStages


class MemoryCacheHandlerTest(test_utils.GenericTestBase):
    """Tests MemoryCacheHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_get_memory_cache_data(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_json('/memorycachehandler')
        self.assertEqual(
            response['total_allocation'], 0)
        self.assertEqual(
            response['peak_allocation'], 0)
        self.assertEqual(response['total_keys_stored'], 1)

    def test_flush_memory_cache(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)

        response = self.get_json('/memorycachehandler')
        self.assertEqual(response['total_keys_stored'], 1)

        self.delete_json('/memorycachehandler')

        response = self.get_json('/memorycachehandler')
        self.assertEqual(response['total_keys_stored'], 0)


class FeatureFlagsHandlerTest(test_utils.GenericTestBase):
    """Tests FeatureFlagsHandler."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(
            self.RELEASE_COORDINATOR_EMAIL, self.RELEASE_COORDINATOR_USERNAME)

        self.add_user_role(
            self.RELEASE_COORDINATOR_USERNAME,
            feconf.ROLE_ID_RELEASE_COORDINATOR)

    def test_without_feature_flag_name_update_feature_flag_is_not_performed(
        self
    ) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        prod_mode_swap = self.swap(constants, 'DEV_MODE', False)
        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception,
            'The \'feature_flag_name\' must be provided when the action is '
            'update_feature_flag.'
        )
        with assert_raises_regexp_context_manager, prod_mode_swap:
            self.put_json(
                feconf.FEATURE_FLAGS_URL, {
                    'action': 'update_feature_flag',
                    'feature_flag_name': None
                }, csrf_token=csrf_token)

        self.logout()

    def test_get_handler_includes_all_feature_flags(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        swap_name_to_description_feature_stage_dict = self.swap(
            feature_flag_services,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.TEST_FEATURE_1.value: (
                    'a feature in dev stage', FeatureStages.DEV
                )
            }
        )
        feature_list_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURE_FLAGS',
            [FeatureNames.TEST_FEATURE_1])
        feature_set_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURES_NAMES_SET',
            set([FeatureNames.TEST_FEATURE_1.value]))

        with swap_name_to_description_feature_stage_dict:
            with feature_list_ctx, feature_set_ctx:
                response_dict = self.get_json(feconf.FEATURE_FLAGS_URL)
                self.assertEqual(
                    response_dict['feature_flags'],
                    [
                        {
                            'name': FeatureNames.TEST_FEATURE_1.value,
                            'description': 'a feature in dev stage',
                            'feature_stage': FeatureStages.DEV.value,
                            'force_enable_for_all_users': False,
                            'rollout_percentage': 0,
                            'user_group_ids': [],
                            'last_updated': None
                        }
                    ])
        self.logout()

    def test_post_with_flag_changes_updates_feature_flags(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()
        swap_name_to_description_feature_stage_dict = self.swap(
            feature_flag_registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.TEST_FEATURE_1.value: (
                    'a feature in dev stage', FeatureStages.DEV
                )
            }
        )
        feature_list_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURE_FLAGS',
            [FeatureNames.TEST_FEATURE_1])
        feature_set_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURES_NAMES_SET',
            set([FeatureNames.TEST_FEATURE_1.value]))

        with swap_name_to_description_feature_stage_dict:
            with feature_list_ctx, feature_set_ctx:
                self.put_json(
                    feconf.FEATURE_FLAGS_URL, {
                        'action': 'update_feature_flag',
                        'feature_flag_name': FeatureNames.TEST_FEATURE_1.value,
                        'force_enable_for_all_users': False,
                        'rollout_percentage': 50,
                        'user_group_ids': []
                    }, csrf_token=csrf_token)

                updated_feature_flag = (
                    feature_flag_registry.Registry.get_feature_flag(
                        FeatureNames.TEST_FEATURE_1.value))
                self.assertEqual(
                    updated_feature_flag.feature_flag_config.
                    force_enable_for_all_users,
                    False
                )
                self.assertEqual(
                    updated_feature_flag.feature_flag_config.rollout_percentage,
                    50
                )
                self.assertEqual(
                    updated_feature_flag.feature_flag_config.user_group_ids, [])

        self.logout()

    def test_update_flag_with_unknown_feature_flag_name_returns_400(
        self
    ) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        feature_list_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURE_FLAGS', [])
        feature_set_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURES_NAMES_SET', set([]))
        swap_name_to_description_feature_stage_dict = self.swap(
            feature_flag_registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.TEST_FEATURE_1.value: (
                    'a feature in dev stage', FeatureStages.DEV
                )
            }
        )

        with swap_name_to_description_feature_stage_dict:
            with feature_list_ctx, feature_set_ctx:
                response = self.put_json(
                    feconf.FEATURE_FLAGS_URL, {
                        'action': 'update_feature_flag',
                        'feature_flag_name': 'test_feature_1',
                        'force_enable_for_all_users': False,
                        'rollout_percentage': 50,
                        'user_group_ids': []
                    },
                    csrf_token=csrf_token,
                    expected_status_int=400
                )
                self.assertEqual(
                    response['error'],
                    'Unknown feature flag: test_feature_1.')

        self.logout()

    def test_update_flag_with_invalid_values_returns_400(self) -> None:
        self.login(self.RELEASE_COORDINATOR_EMAIL)
        csrf_token = self.get_new_csrf_token()

        swap_name_to_description_feature_stage_dict = self.swap(
            feature_flag_registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.TEST_FEATURE_2.value: (
                    'a feature in dev stage', FeatureStages.DEV
                )
            }
        )
        feature_list_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURE_FLAGS',
            [FeatureNames.TEST_FEATURE_2])
        feature_set_ctx = self.swap(
            feature_flag_services, 'ALL_FEATURES_NAMES_SET',
            set([FeatureNames.TEST_FEATURE_2.value]))

        with swap_name_to_description_feature_stage_dict:
            with feature_list_ctx, feature_set_ctx:
                response = self.put_json(
                    feconf.FEATURE_FLAGS_URL, {
                        'action': 'update_feature_flag',
                        'feature_flag_name': FeatureNames.TEST_FEATURE_2.value,
                        'force_enable_for_all_users': False,
                        'rollout_percentage': 200,
                        'user_group_ids': []
                    },
                    csrf_token=csrf_token,
                    expected_status_int=400
                )
        self.assertEqual(
            response['error'],
            'Schema validation for \'rollout_percentage\' failed: '
            'Validation failed: is_at_most ({\'max_value\': 100}) '
            'for object 200')

        self.logout()
