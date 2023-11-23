# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for feature_flag_services.py."""

from __future__ import annotations

import enum

from core import feconf
from core.constants import constants
from core.domain import caching_services
from core.domain import feature_flag_domain
from core.domain import feature_flag_registry as registry
from core.domain import feature_flag_services as feature_services
from core.tests import test_utils

from typing import List, Tuple


class FeatureNames(enum.Enum):
    """Enum for parameter names."""

    FEATURE_A = 'feature_a'
    FEATURE_B = 'feature_b'
    FEATURE_C = 'feature_c'
    FEATURE_D = 'feature_d'


FeatureStages = feature_flag_domain.FeatureStages


class FeatureFlagServiceTest(test_utils.GenericTestBase):
    """Test for the feature flag services."""

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.original_feature_flag_registry = (
            registry.Registry.feature_flag_registry.copy())
        registry.Registry.feature_flag_registry.clear()
        # Feature names that might be used in following tests.
        self.feature_names = ['feature_a', 'feature_b', 'feature_c']
        self.feature_name_enums = [
            FeatureNames.FEATURE_A,
            FeatureNames.FEATURE_B,
            FeatureNames.FEATURE_C
        ]
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            self.feature_names)

        self.swap_all_feature_flags = self.swap(
            feature_services,
            'ALL_FEATURE_FLAGS',
            self.feature_name_enums
        )

        self.swap_all_feature_names_set = self.swap(
            feature_services,
            'ALL_FEATURES_NAMES_SET',
            set(self.feature_names)
        )

        self.dev_feature_flag = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'a feature in dev stage',
            FeatureStages.DEV)
        self.test_feature_flag = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_B, 'a feature in test stage',
            FeatureStages.TEST)
        self.prod_feature_flag = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_C, 'a feature in prod stage',
            FeatureStages.PROD)

        with self.swap(
            feature_services,
            'ALL_FEATURES_NAMES_SET',
            set(self.feature_names)
        ):
            feature_services.update_feature_flag(
                self.dev_feature_flag.name, True, 0, [])
            feature_services.update_feature_flag(
                self.test_feature_flag.name, True, 0, [])
            feature_services.update_feature_flag(
                self.prod_feature_flag.name, True, 0, [])

    def tearDown(self) -> None:
        super().tearDown()
        registry.Registry.feature_flag_registry = (
            self.original_feature_flag_registry)

    def test_get_all_feature_flag_dicts_returns_correct_dicts(self) -> None:
        expected_dicts = [
            registry.Registry.get_feature_flag(
                self.dev_feature_flag.name).to_dict(),
            registry.Registry.get_feature_flag(
                self.test_feature_flag.name).to_dict(),
            registry.Registry.get_feature_flag(
                self.prod_feature_flag.name).to_dict(),
        ]
        with self.swap_all_feature_flags, self.swap_all_feature_names_set:
            self.assertEqual(
                feature_services.get_all_feature_flag_dicts(),
                expected_dicts)

    def test_feature_flag_is_correctly_fetched_when_not_present_in_storage(
        self) -> None:
        dev_feature_flag = registry.Registry.get_feature_flag(
            self.dev_feature_flag.name)
        test_feature_flag = registry.Registry.get_feature_flag(
            self.test_feature_flag.name)
        prod_feature_flag = registry.Registry.get_feature_flag(
            self.prod_feature_flag.name)

        expected_dicts = [
            dev_feature_flag.to_dict(),
            test_feature_flag.to_dict(),
            prod_feature_flag.to_dict()
        ]
        with self.swap_all_feature_flags, self.swap_all_feature_names_set:
            with self.swap_to_always_return(
                feature_services,
                'load_feature_flags_from_storage',
                {
                    dev_feature_flag.name: None,
                    test_feature_flag.name: test_feature_flag,
                    prod_feature_flag.name: prod_feature_flag
                }
            ):
                with self.swap_to_always_return(
                    caching_services,
                    'get_multi',
                    {
                        dev_feature_flag.name: None,
                        test_feature_flag.name: None,
                        prod_feature_flag.name: None
                    }
                ):
                    self.assertEqual(
                        feature_services.get_all_feature_flag_dicts(),
                        expected_dicts)

    def test_get_all_features_dicts_raises_error_when_feature_not_present(
        self) -> None:
        swap_all_feature_flags = self.swap(
            feature_services,
            'ALL_FEATURE_FLAGS',
            [
                FeatureNames.FEATURE_A,
                FeatureNames.FEATURE_B,
                FeatureNames.FEATURE_C,
                FeatureNames.FEATURE_D
            ]
        )
        with swap_all_feature_flags:
            with self.assertRaisesRegex(
                Exception, 'Feature flag not found: feature_d'
            ):
                feature_services.get_all_feature_flag_dicts()

    def test_get_feature_flag_values_with_unknown_name_raises_error(
        self
    ) -> None:
        with self.swap_all_feature_flags, self.swap_all_feature_names_set:
            with self.assertRaisesRegex(
                Exception, 'Feature flag not found: '
                'feature_that_does_not_exist.'
            ):
                feature_services.is_feature_flag_enabled(
                    self.owner_id, 'feature_that_does_not_exist')

    def test_updating_non_existing_feature_results_in_error(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Unknown feature flag: unknown_feature'
        ):
            feature_services.update_feature_flag(
                'unknown_feature',
                True,
                0,
                []
            )

    def test_get_all_feature_flag_values_in_dev_returns_correct_values(
        self
    ) -> None:
        with self.swap_all_feature_flags, self.swap_all_feature_names_set:
            with self.swap(constants, 'DEV_MODE', True):
                self.assertEqual(
                    feature_services.evaluate_all_feature_flag_values(
                        self.owner_id),
                    {
                        self.dev_feature_flag.name: True,
                        self.test_feature_flag.name: True,
                        self.prod_feature_flag.name: True,
                    })

    def test_get_all_feature_flag_values_in_test_returns_correct_values(
        self
    ) -> None:
        constants_swap = self.swap(constants, 'DEV_MODE', False)
        env_swap = self.swap(
            feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False)
        with self.swap_all_feature_flags, self.swap_all_feature_names_set:
            with constants_swap, env_swap:
                self.assertEqual(
                    feature_services.evaluate_all_feature_flag_values(
                        self.owner_id),
                    {
                        self.dev_feature_flag.name: False,
                        self.test_feature_flag.name: True,
                        self.prod_feature_flag.name: True,
                    })

    def test_get_all_feature_flag_values_in_prod_returns_correct_values(
        self
    ) -> None:
        constants_swap = self.swap(constants, 'DEV_MODE', False)
        env_swap = self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True)
        with self.swap_all_feature_flags, self.swap_all_feature_names_set:
            with constants_swap, env_swap:
                self.assertEqual(
                    feature_services.evaluate_all_feature_flag_values(
                        self.owner_id),
                    {
                        self.dev_feature_flag.name: False,
                        self.test_feature_flag.name: False,
                        self.prod_feature_flag.name: True,
                    })

    def test_evaluate_dev_feature_flag_for_dev_server_returns_true(
        self) -> None:
        with self.swap_all_feature_flags, self.swap_all_feature_names_set:
            with self.swap(constants, 'DEV_MODE', True):
                self.assertTrue(
                    feature_services.is_feature_flag_enabled(
                        self.owner_id, self.dev_feature_flag.name))

    def test_evaluate_test_feature_flag_for_dev_server_returns_true(
        self) -> None:
        with self.swap_all_feature_flags, self.swap_all_feature_names_set:
            with self.swap(constants, 'DEV_MODE', True):
                self.assertTrue(
                    feature_services.is_feature_flag_enabled(
                        self.owner_id, self.test_feature_flag.name))

    def test_evaluate_prod_feature_flag_for_dev_server_returns_true(
        self) -> None:
        with self.swap_all_feature_flags, self.swap_all_feature_names_set:
            with self.swap(constants, 'DEV_MODE', True):
                self.assertTrue(
                    feature_services.is_feature_flag_enabled(
                        self.owner_id, self.prod_feature_flag.name))

    def test_evaluate_dev_feature_flag_for_test_server_returns_false(
        self) -> None:
        with self.swap_all_feature_flags, self.swap_all_feature_names_set:
            with self.swap(constants, 'DEV_MODE', False):
                with self.swap(
                    feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False
                ):
                    self.assertFalse(
                        feature_services.is_feature_flag_enabled(
                            self.owner_id, self.dev_feature_flag.name))

    def test_evaluate_test_feature_flag_for_test_server_returns_true(
        self) -> None:
        with self.swap_all_feature_flags, self.swap_all_feature_names_set:
            with self.swap(constants, 'DEV_MODE', False):
                with self.swap(
                    feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False
                ):
                    self.assertTrue(
                        feature_services.is_feature_flag_enabled(
                            self.owner_id, self.test_feature_flag.name))

    def test_evaluate_prod_feature_flag_for_test_server_returns_true(
        self) -> None:
        with self.swap_all_feature_flags, self.swap(
            constants, 'DEV_MODE', False
        ):
            with self.swap_all_feature_names_set, self.swap(
                feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False
            ):
                self.assertTrue(
                    feature_services.is_feature_flag_enabled(
                        self.owner_id, self.prod_feature_flag.name))

    def test_evaluate_dev_feature_flag_for_prod_server_returns_false(
        self) -> None:
        with self.swap_all_feature_flags, self.swap(
            constants, 'DEV_MODE', False
        ):
            with self.swap_all_feature_names_set, self.swap(
                feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True
            ):
                self.assertFalse(
                    feature_services.is_feature_flag_enabled(
                        self.owner_id, self.dev_feature_flag.name))

    def test_evaluate_test_feature_flag_for_prod_server_returns_false(
        self) -> None:
        with self.swap_all_feature_flags, self.swap(
            constants, 'DEV_MODE', False
        ):
            with self.swap_all_feature_names_set, self.swap(
                feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True
            ):
                self.assertFalse(
                    feature_services.is_feature_flag_enabled(
                        self.owner_id, self.test_feature_flag.name))

    def test_evaluate_prod_feature_flag_for_prod_server_returns_true(
        self) -> None:
        with self.swap_all_feature_flags, self.swap(
            constants, 'DEV_MODE', False
        ):
            with self.swap_all_feature_names_set, self.swap(
                feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True
            ):
                self.assertTrue(
                    feature_services.is_feature_flag_enabled(
                        self.owner_id, self.prod_feature_flag.name))

    def test_feature_flag_flag_is_enabled_when_force_enable_is_set_to_true(
        self) -> None:
        self.assertTrue(feature_services.is_feature_flag_enabled(
            self.owner_id, self.dev_feature_flag.name))

    def test_feature_flag_enabled_for_logged_out_users_with_force_enable_prop(
        self) -> None:
        self.assertTrue(feature_services.is_feature_flag_enabled(
            None, self.dev_feature_flag.name))

    def test_feature_flag_not_enabled_for_logged_out_user(self) -> None:
        with self.swap_all_feature_names_set:
            feature_services.update_feature_flag(
                self.dev_feature_flag.name, False, 0, [])
        self.assertFalse(feature_services.is_feature_flag_enabled(
            None, self.dev_feature_flag.name))

    def _signup_multiple_users_and_return_ids(self) -> Tuple[str, str, str]:
        """Signup multiple users and returns user ids of them

        Returns:
            Tuple[int, int, int]. The tuple of user ids.
        """
        user_1_email = 'user1@example.com'
        user_1_username = 'username1'
        self.signup(user_1_email, user_1_username)
        user_1_id = self.get_user_id_from_email(user_1_email)
        user_2_email = 'user2@example.com'
        user_2_username = 'username2'
        self.signup(user_2_email, user_2_username)
        user_2_id = self.get_user_id_from_email(user_2_email)
        user_3_email = 'user3@example.com'
        user_3_username = 'username3'
        self.signup(user_3_email, user_3_username)
        user_3_id = self.get_user_id_from_email(user_3_email)

        return (user_1_id, user_2_id, user_3_id)

    def test_feature_flag_value_is_same_for_user_with_every_retrieval(
        self) -> None:
        user_1_id, user_2_id, user_3_id = (
            self._signup_multiple_users_and_return_ids())
        initial_user1_value, initial_user2_value, initial_user3_value = (
            False, False, False)
        with self.swap_all_feature_names_set:
            feature_services.update_feature_flag(
                self.dev_feature_flag.name, False, 50, [])
            initial_user1_value = feature_services.is_feature_flag_enabled(
                user_1_id, self.dev_feature_flag.name)
            initial_user2_value = feature_services.is_feature_flag_enabled(
                user_2_id, self.dev_feature_flag.name)
            initial_user3_value = feature_services.is_feature_flag_enabled(
                user_3_id, self.dev_feature_flag.name)
            for _ in range(500):
                self.assertEqual(
                    initial_user1_value,
                    feature_services.is_feature_flag_enabled(
                        user_1_id, self.dev_feature_flag.name)
                )
                self.assertEqual(
                    initial_user2_value,
                    feature_services.is_feature_flag_enabled(
                        user_2_id, self.dev_feature_flag.name)
                )
                self.assertEqual(
                    initial_user3_value,
                    feature_services.is_feature_flag_enabled(
                        user_3_id, self.dev_feature_flag.name)
                )

    def test_feature_flag_flag_not_enabled_for_all_users(self) -> None:
        user_1_id, user_2_id, user_3_id = (
            self._signup_multiple_users_and_return_ids())
        user_ids = [user_1_id, user_2_id, user_3_id, self.owner_id]
        feature_status_for_users = []
        with self.swap_all_feature_names_set:
            feature_services.update_feature_flag(
                self.dev_feature_flag.name, False, 0, [])
            for user_id in user_ids:
                feature_status_for_users.append(
                    feature_services.is_feature_flag_enabled(
                        user_id, self.dev_feature_flag.name))

        total_count_of_users_having_feature_enabled = 0
        for feature_status in feature_status_for_users:
            if feature_status is True:
                total_count_of_users_having_feature_enabled += 1

        self.assertEqual(total_count_of_users_having_feature_enabled, 0)

    def test_feature_flag_flag_enabled_for_100_perc_logged_in_users(
        self) -> None:
        user_1_id, user_2_id, user_3_id = (
            self._signup_multiple_users_and_return_ids())
        user_ids = [user_1_id, user_2_id, user_3_id, self.owner_id]
        feature_status_for_users = []
        with self.swap_all_feature_names_set:
            feature_services.update_feature_flag(
                self.dev_feature_flag.name, False, 100, [])
            for user_id in user_ids:
                feature_status_for_users.append(
                    feature_services.is_feature_flag_enabled(
                        user_id, self.dev_feature_flag.name))

        total_count_of_users_having_feature_enabled = 0
        for feature_status in feature_status_for_users:
            if feature_status is True:
                total_count_of_users_having_feature_enabled += 1

        self.assertEqual(total_count_of_users_having_feature_enabled, 4)
