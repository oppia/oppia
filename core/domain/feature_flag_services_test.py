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

import contextlib
import enum

from core import feconf
from core.constants import constants
from core.domain import feature_flag_domain
from core.domain import feature_flag_registry as registry
from core.domain import feature_flag_services as feature_services
from core.platform import models
from core.tests import test_utils

from typing import Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import user_models

(user_models, ) = models.Registry.import_models([models.Names.USER])


class FeatureNames(enum.Enum):
    """Enum for parameter names."""

    FEATURE_A = 'feature_a'
    FEATURE_B = 'feature_b'
    FEATURE_C = 'feature_c'
    FEATURE_D = 'feature_d'
    FEATURE_ONE = 'feature_one'
    FEATURE_TWO = 'feature_two'
    FEATURE_THREE = 'feature_three'


FeatureStages = feature_flag_domain.FeatureStages


class FeatureFlagServiceTest(test_utils.GenericTestBase):
    """Test for the feature flag services."""

    LOGGED_OUT_USER_ID = None

    def _swap_name_to_description_feature_stage_registry(
        self) -> contextlib._GeneratorContextManager[None]:
        """Returns swap iterator for the registry variable."""
        return self.swap(
            registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.FEATURE_A.value: (
                    'a feature in dev stage', FeatureStages.DEV
                ),
                FeatureNames.FEATURE_B.value: (
                    'a feature in test stage', FeatureStages.TEST
                ),
                FeatureNames.FEATURE_C.value: (
                    'a feature in prod stage', FeatureStages.PROD
                )
            }
        )

    def _swap_feature_flags_list(self) -> Tuple[
        contextlib._GeneratorContextManager[None],
        contextlib._GeneratorContextManager[None]
    ]:
        """Returns the tuple of swap iterator of feature flags."""
        swap_all_feature_flags = self.swap(
            feature_services,
            'ALL_FEATURE_FLAGS',
            self.feature_name_enums
        )

        swap_all_feature_names_set = self.swap(
            feature_services,
            'ALL_FEATURES_NAMES_SET',
            set(self.feature_names)
        )

        return (swap_all_feature_flags, swap_all_feature_names_set)

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.USER_GROUP_1 = 'user_group_1'
        self.USER_GROUP_2 = 'user_group_2'

        # Feature names that might be used in following tests.
        self.feature_names = ['feature_a', 'feature_b', 'feature_c']
        self.feature_name_enums = [
            FeatureNames.FEATURE_A,
            FeatureNames.FEATURE_B,
            FeatureNames.FEATURE_C
        ]

        self.swap_all_feature_names_set = self.swap(
            feature_services,
            'ALL_FEATURES_NAMES_SET',
            set(self.feature_names)
        )

        swapped_value = {
            FeatureNames.FEATURE_A.value: (
                'a feature in dev stage', FeatureStages.DEV
            ),
            FeatureNames.FEATURE_B.value: (
                'a feature in test stage', FeatureStages.TEST
            ),
            FeatureNames.FEATURE_C.value: (
                'a feature in prod stage', FeatureStages.PROD
            )
        }

        self.swap_name_to_description_feature_stage_dict = self.swap(
            feature_services,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            swapped_value
        )

        self.swap_name_to_description_feature_stage_registry_dict = self.swap(
            registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            swapped_value
        )

        self.dev_feature_flag = feature_flag_domain.FeatureFlag(
            FeatureNames.FEATURE_A.value,
            feature_flag_domain.FeatureFlagSpec(
                'a feature in dev stage',
                FeatureStages.DEV
            ),
            feature_flag_domain.FeatureFlagConfig(
                False,
                0,
                [],
                None
            )
        )
        self.test_feature_flag = feature_flag_domain.FeatureFlag(
            FeatureNames.FEATURE_B.value,
            feature_flag_domain.FeatureFlagSpec(
                'a feature in test stage',
                FeatureStages.TEST
            ),
            feature_flag_domain.FeatureFlagConfig(
                False,
                0,
                [],
                None
            )
        )
        self.prod_feature_flag = feature_flag_domain.FeatureFlag(
            FeatureNames.FEATURE_C.value,
            feature_flag_domain.FeatureFlagSpec(
                'a feature in prod stage',
                FeatureStages.PROD
            ),
            feature_flag_domain.FeatureFlagConfig(
                False,
                0,
                [],
                None
            )
        )

        with self.swap_all_feature_names_set:
            with self.swap_name_to_description_feature_stage_registry_dict:
                feature_services.update_feature_flag(
                    self.dev_feature_flag.name, True, 0, [])
                feature_services.update_feature_flag(
                    self.test_feature_flag.name, True, 0, [])
                feature_services.update_feature_flag(
                    self.prod_feature_flag.name, True, 0, [])

    def test_get_all_feature_flags_returns_correct_feature_flags(self) -> None:
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_name_to_description_feature_stage_registry_dict:
            expected_feature_flags_dict = [
                registry.Registry.get_feature_flag(
                    self.dev_feature_flag.name).to_dict(),
                registry.Registry.get_feature_flag(
                    self.test_feature_flag.name).to_dict(),
                registry.Registry.get_feature_flag(
                    self.prod_feature_flag.name).to_dict(),
            ]
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        with swap_all_feature_flags, swap_all_feature_names_set:
            with self.swap_name_to_description_feature_stage_dict:
                self.assertEqual(
                    [
                        feature_flag.to_dict() for feature_flag in
                        feature_services.get_all_feature_flags()
                    ],
                    expected_feature_flags_dict
                )

    def test_feature_flag_is_correctly_fetched_when_not_present_in_storage(
        self
    ) -> None:
        expected_feature_flags_dict = [
            {
                'name': FeatureNames.FEATURE_ONE.value,
                'description': 'feature flag one',
                'feature_stage': FeatureStages.DEV.value,
                'force_enable_for_all_users': False,
                'rollout_percentage': 0,
                'user_group_ids': [],
                'last_updated': None
            },
            {
                'name': FeatureNames.FEATURE_TWO.value,
                'description': 'feature flag two',
                'feature_stage': FeatureStages.DEV.value,
                'force_enable_for_all_users': False,
                'rollout_percentage': 0,
                'user_group_ids': [],
                'last_updated': None
            },
            {
                'name': FeatureNames.FEATURE_THREE.value,
                'description': 'feature flag three',
                'feature_stage': FeatureStages.DEV.value,
                'force_enable_for_all_users': False,
                'rollout_percentage': 0,
                'user_group_ids': [],
                'last_updated': None
            }
        ]
        feature_flag_name_enums = [
            FeatureNames.FEATURE_ONE,
            FeatureNames.FEATURE_TWO,
            FeatureNames.FEATURE_THREE
        ]
        feature_flag_names = ['feature_one', 'feature_two', 'feature_three']
        swap_all_feature_flags = self.swap(
            feature_services,
            'ALL_FEATURE_FLAGS',
            feature_flag_name_enums
        )
        swap_all_feature_names_set = self.swap(
            feature_services,
            'ALL_FEATURES_NAMES_SET',
            set(feature_flag_names)
        )
        swap_name_to_description_feature_stage_dict = self.swap(
            feature_services,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.FEATURE_ONE.value: (
                    'feature flag one', FeatureStages.DEV
                ),
                FeatureNames.FEATURE_TWO.value: (
                    'feature flag two', FeatureStages.DEV
                ),
                FeatureNames.FEATURE_THREE.value: (
                    'feature flag three', FeatureStages.DEV
                )
            }
        )

        with swap_all_feature_flags, swap_all_feature_names_set:
            with swap_name_to_description_feature_stage_dict:
                self.assertEqual(
                    [
                        feature_flag.to_dict() for feature_flag in
                        feature_services.get_all_feature_flags()
                    ],
                    expected_feature_flags_dict)

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
            with self.swap_name_to_description_feature_stage_dict:
                with self.assertRaisesRegex(
                    Exception, 'Feature flag not found: feature_d'
                ):
                    feature_services.get_all_feature_flags()

    def test_get_feature_flag_configs_with_unknown_name_raises_error(
        self
    ) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_all_feature_flags, swap_all_feature_names_set:
            with swap_name_to_description_feature_stage_registry_dict:
                with self.assertRaisesRegex(
                    Exception, 'Feature flag not found: '
                    'feature_that_does_not_exist.'
                ):
                    feature_services.is_feature_flag_enabled(
                        'feature_that_does_not_exist', self.owner_id)

    def test_updating_non_existing_feature_results_in_error(self) -> None:
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_name_to_description_feature_stage_registry_dict:
            with self.assertRaisesRegex(
                Exception, 'Unknown feature flag: unknown_feature'
            ):
                feature_services.update_feature_flag(
                    'unknown_feature',
                    True,
                    0,
                    []
            )

    def test_get_all_feature_flag_configs_in_dev_returns_correct_values(
        self
    ) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        with swap_all_feature_flags, swap_all_feature_names_set:
            with self.swap_name_to_description_feature_stage_dict, self.swap(
                constants, 'DEV_MODE', True
            ):
                self.assertEqual(
                    feature_services.evaluate_all_feature_flag_configs(
                        self.owner_id),
                    {
                        self.dev_feature_flag.name: True,
                        self.test_feature_flag.name: True,
                        self.prod_feature_flag.name: True,
                    })

    def test_get_all_feature_flag_configs_in_test_returns_correct_values(
        self
    ) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        constants_swap = self.swap(constants, 'DEV_MODE', False)
        env_swap = self.swap(
            feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False)
        with swap_all_feature_flags, swap_all_feature_names_set:
            with self.swap_name_to_description_feature_stage_dict:
                with constants_swap, env_swap:
                    self.assertEqual(
                        feature_services.evaluate_all_feature_flag_configs(
                            self.owner_id),
                        {
                            self.dev_feature_flag.name: False,
                            self.test_feature_flag.name: True,
                            self.prod_feature_flag.name: True,
                        })

    def test_get_all_feature_flag_configs_in_prod_returns_correct_values(
        self
    ) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        constants_swap = self.swap(constants, 'DEV_MODE', False)
        env_swap = self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True)
        with swap_all_feature_flags, swap_all_feature_names_set:
            with self.swap_name_to_description_feature_stage_dict:
                with constants_swap, env_swap:
                    self.assertEqual(
                        feature_services.evaluate_all_feature_flag_configs(
                            self.owner_id),
                        {
                            self.dev_feature_flag.name: False,
                            self.test_feature_flag.name: False,
                            self.prod_feature_flag.name: True,
                        })

    def test_evaluate_dev_feature_flag_for_dev_server_returns_true(
        self) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_all_feature_flags, swap_all_feature_names_set:
            with swap_name_to_description_feature_stage_registry_dict:
                with self.swap(constants, 'DEV_MODE', True):
                    self.assertTrue(
                        feature_services.is_feature_flag_enabled(
                            self.dev_feature_flag.name,
                            self.owner_id)
                        )

    def test_evaluate_test_feature_flag_for_dev_server_returns_true(
        self) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_all_feature_flags, swap_all_feature_names_set:
            with swap_name_to_description_feature_stage_registry_dict:
                with self.swap(constants, 'DEV_MODE', True):
                    self.assertTrue(
                        feature_services.is_feature_flag_enabled(
                            self.test_feature_flag.name,
                            self.owner_id)
                        )

    def test_evaluate_prod_feature_flag_for_dev_server_returns_true(
        self) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_all_feature_flags, swap_all_feature_names_set:
            with self.swap(constants, 'DEV_MODE', True):
                with swap_name_to_description_feature_stage_registry_dict:
                    self.assertTrue(
                        feature_services.is_feature_flag_enabled(
                            self.prod_feature_flag.name,
                            self.owner_id)
                        )

    def test_evaluate_dev_feature_flag_for_test_server_returns_false(
        self) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_all_feature_flags, swap_all_feature_names_set:
            with self.swap(constants, 'DEV_MODE', False):
                with swap_name_to_description_feature_stage_registry_dict:
                    with self.swap(
                        feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False
                    ):
                        self.assertFalse(
                            feature_services.is_feature_flag_enabled(
                                self.dev_feature_flag.name,
                                self.owner_id)
                            )

    def test_evaluate_test_feature_flag_for_test_server_returns_true(
        self) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_all_feature_flags, swap_all_feature_names_set:
            with self.swap(constants, 'DEV_MODE', False):
                with swap_name_to_description_feature_stage_registry_dict:
                    with self.swap(
                        feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False
                    ):
                        self.assertTrue(
                            feature_services.is_feature_flag_enabled(
                                self.test_feature_flag.name,
                                self.owner_id)
                            )

    def test_evaluate_prod_feature_flag_for_test_server_returns_true(
        self) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_all_feature_flags, self.swap(
            constants, 'DEV_MODE', False
        ):
            with swap_name_to_description_feature_stage_registry_dict:
                with swap_all_feature_names_set, self.swap(
                    feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False
                ):
                    self.assertTrue(
                        feature_services.is_feature_flag_enabled(
                            self.prod_feature_flag.name,
                            self.owner_id)
                        )

    def test_evaluate_dev_feature_flag_for_prod_server_returns_false(
        self) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_all_feature_flags, self.swap(
            constants, 'DEV_MODE', False
        ):
            with swap_name_to_description_feature_stage_registry_dict:
                with swap_all_feature_names_set, self.swap(
                    feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True
                ):
                    self.assertFalse(
                        feature_services.is_feature_flag_enabled(
                            self.dev_feature_flag.name,
                            self.owner_id)
                        )

    def test_evaluate_test_feature_flag_for_prod_server_returns_false(
        self) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_all_feature_flags, self.swap(
            constants, 'DEV_MODE', False
        ):
            with swap_name_to_description_feature_stage_registry_dict:
                with swap_all_feature_names_set, self.swap(
                    feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True
                ):
                    self.assertFalse(
                        feature_services.is_feature_flag_enabled(
                            self.test_feature_flag.name,
                            self.owner_id)
                        )

    def test_evaluate_prod_feature_flag_for_prod_server_returns_true(
        self) -> None:
        swap_all_feature_flags, swap_all_feature_names_set = (
            self._swap_feature_flags_list())
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_all_feature_flags, self.swap(
            constants, 'DEV_MODE', False
        ):
            with swap_name_to_description_feature_stage_registry_dict:
                with swap_all_feature_names_set, self.swap(
                    feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True
                ):
                    self.assertTrue(
                        feature_services.is_feature_flag_enabled(
                            self.prod_feature_flag.name,
                            self.owner_id)
                        )

    def test_feature_flag_flag_is_enabled_when_force_enable_is_set_to_true(
        self) -> None:
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_name_to_description_feature_stage_registry_dict:
            self.assertTrue(feature_services.is_feature_flag_enabled(
                self.dev_feature_flag.name, self.owner_id))

    def test_feature_flag_enable_for_logged_out_user_with_force_enable_property(
        self) -> None:
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_name_to_description_feature_stage_registry_dict:
            self.assertTrue(feature_services.is_feature_flag_enabled(
                self.dev_feature_flag.name, self.LOGGED_OUT_USER_ID))

    def test_feature_flag_not_enabled_for_logged_out_user(self) -> None:
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        _, swap_all_feature_names_set = self._swap_feature_flags_list()
        with swap_all_feature_names_set:
            with swap_name_to_description_feature_stage_registry_dict:
                feature_services.update_feature_flag(
                    self.dev_feature_flag.name, False, 0, [])
                self.assertFalse(feature_services.is_feature_flag_enabled(
                    self.dev_feature_flag.name,
                    self.LOGGED_OUT_USER_ID))

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

    def test_feature_flag_enabled_for_given_user_groups(self) -> None:
        (user_1_id, user_2_id, user_3_id) = (
            self._signup_multiple_users_and_return_ids())
        user_models.UserGroupModel(
            id=self.USER_GROUP_1, name='USER_GROUP_1', user_ids=[
                user_1_id, user_2_id, user_3_id]).put()
        user_models.UserGroupModel(
            id=self.USER_GROUP_2, name='USER_GROUP_2', user_ids=[
                user_1_id, user_2_id]).put()
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        _, swap_all_feature_names_set = self._swap_feature_flags_list()
        with swap_all_feature_names_set:
            with swap_name_to_description_feature_stage_registry_dict:
                feature_services.update_feature_flag(
                    self.dev_feature_flag.name, False, 0, [
                        self.USER_GROUP_1, self.USER_GROUP_2]
                )
                self.assertTrue(feature_services.is_feature_flag_enabled(
                    self.dev_feature_flag.name, user_1_id))

    def test_feature_flag_disabled_if_user_not_in_user_groups(self) -> None:
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        _, swap_all_feature_names_set = self._swap_feature_flags_list()
        with swap_all_feature_names_set:
            with swap_name_to_description_feature_stage_registry_dict:
                feature_services.update_feature_flag(
                    self.dev_feature_flag.name, False, 0, [self.USER_GROUP_2]
                )
                self.assertFalse(feature_services.is_feature_flag_enabled(
                    self.dev_feature_flag.name, 'user_id'))

    def test_feature_flag_config_is_same_for_user_with_every_retrieval(
        self) -> None:
        user_1_id, user_2_id, user_3_id = (
            self._signup_multiple_users_and_return_ids())
        initial_user1_value, initial_user2_value, initial_user3_value = (
            False, False, False)
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        _, swap_all_feature_names_set = self._swap_feature_flags_list()
        with swap_name_to_description_feature_stage_registry_dict:
            with swap_all_feature_names_set:
                feature_services.update_feature_flag(
                    self.dev_feature_flag.name, False, 50, [])
                initial_user1_value = feature_services.is_feature_flag_enabled(
                    self.dev_feature_flag.name, user_1_id)
                initial_user2_value = feature_services.is_feature_flag_enabled(
                    self.dev_feature_flag.name, user_2_id)
                initial_user3_value = feature_services.is_feature_flag_enabled(
                    self.dev_feature_flag.name, user_3_id)
                for _ in range(500):
                    self.assertEqual(
                        initial_user1_value,
                        feature_services.is_feature_flag_enabled(
                            self.dev_feature_flag.name,
                            user_1_id
                        )
                    )
                    self.assertEqual(
                        initial_user2_value,
                        feature_services.is_feature_flag_enabled(
                            self.dev_feature_flag.name,
                            user_2_id
                        )
                    )
                    self.assertEqual(
                        initial_user3_value,
                        feature_services.is_feature_flag_enabled(
                            self.dev_feature_flag.name,
                            user_3_id
                        )
                    )

    def test_feature_flag_enabled_for_users_in_5_perc_when_increased_to_10_perc(
        self) -> None:
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        _, swap_all_feature_names_set = self._swap_feature_flags_list()
        user_ids_list = []
        user_ids_for_which_feature_flag_enabled_for_5_perc = set()
        count_feature_flag_enabled_for_5_perc = 0
        user_ids_for_which_feature_flag_enabled_for_10_perc = set()
        count_feature_flag_enabled_for_10_perc = 0
        for count in range(1, 1001):
            user_ids_list.append('userid%s' % str(count))

        with swap_name_to_description_feature_stage_registry_dict:
            with swap_all_feature_names_set:
                feature_services.update_feature_flag(
                    self.dev_feature_flag.name, False, 5, [])
                for user_id in user_ids_list:
                    feature_is_enabled = (
                        feature_services.is_feature_flag_enabled(
                            self.dev_feature_flag.name,
                            user_id
                        )
                    )
                    if feature_is_enabled:
                        count_feature_flag_enabled_for_5_perc += 1
                        user_ids_for_which_feature_flag_enabled_for_5_perc.add(
                            user_id)
                # To avoid this test being flaky, we need to determine what the
                # likely range is for the number of users who have the feature
                # flag enabled. This is modelled as a binomial random variable
                # with n = 1000 and p = 0.5. This roughly follows a normal
                # distribution with mean np = 50 and standard deviation
                # sqrt(npq) = 6.89. In a normal distribution, around 0.997 of
                # values are within 3 standard deviation of the mean, and there
                # is a chance of only 0.00006334 of them being outside 4 s.d. of
                # the mean. Hence the range can be
                # (50 - 4 * 6.89, 50 + 4 * 6.89)
                self.assertTrue(
                    count_feature_flag_enabled_for_5_perc in list(
                        range(22, 78)
                    )
                )

                feature_services.update_feature_flag(
                    self.dev_feature_flag.name, False, 10, [])
                for user_id in user_ids_list:
                    feature_is_enabled = (
                        feature_services.is_feature_flag_enabled(
                            self.dev_feature_flag.name,
                            user_id
                        )
                    )
                    if feature_is_enabled:
                        count_feature_flag_enabled_for_10_perc += 1
                        user_ids_for_which_feature_flag_enabled_for_10_perc.add(
                            user_id)
                # (For a detailed explanation, please see the similar
                # comment above.) For p = 0.1, the binomial random variable
                # follows an approximate normal distribution with mean np = 100
                # and standard deviation 9.49. The range would be
                # (100 - 4 * 9.49, 100 + 4 * 9.49)
                self.assertTrue(
                    count_feature_flag_enabled_for_10_perc in list(
                        range(62, 138)))

                self.assertTrue(
                    user_ids_for_which_feature_flag_enabled_for_5_perc.issubset(
                        user_ids_for_which_feature_flag_enabled_for_10_perc))

    def test_feature_flag_not_enabled_for_all_users(self) -> None:
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        _, swap_all_feature_names_set = self._swap_feature_flags_list()
        user_1_id, user_2_id, user_3_id = (
            self._signup_multiple_users_and_return_ids())
        user_ids = [user_1_id, user_2_id, user_3_id, self.owner_id]
        feature_status_for_users = []
        with swap_name_to_description_feature_stage_registry_dict:
            with swap_all_feature_names_set:
                feature_services.update_feature_flag(
                    self.dev_feature_flag.name, False, 0, [])
                for user_id in user_ids:
                    feature_status_for_users.append(
                        feature_services.is_feature_flag_enabled(
                            self.dev_feature_flag.name, user_id))

        for feature_status in feature_status_for_users:
            self.assertFalse(feature_status)

    def test_feature_flag_enabled_for_100_perc_logged_in_users(
        self) -> None:
        user_1_id, user_2_id, user_3_id = (
            self._signup_multiple_users_and_return_ids())
        user_ids = [user_1_id, user_2_id, user_3_id, self.owner_id]
        feature_status_for_users = []
        _, swap_all_feature_names_set = self._swap_feature_flags_list()
        swap_name_to_description_feature_stage_registry_dict = (
            self._swap_name_to_description_feature_stage_registry())
        with swap_name_to_description_feature_stage_registry_dict:
            with swap_all_feature_names_set:
                feature_services.update_feature_flag(
                    self.dev_feature_flag.name, False, 100, [])
                for user_id in user_ids:
                    feature_status_for_users.append(
                        feature_services.is_feature_flag_enabled(
                            self.dev_feature_flag.name, user_id))

        for feature_status in feature_status_for_users:
            self.assertTrue(feature_status)
