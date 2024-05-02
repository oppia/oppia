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

"""Tests for feature flag registry."""

from __future__ import annotations

import enum

from core import feconf
from core import utils
from core.constants import constants
from core.domain import feature_flag_domain
from core.domain import feature_flag_registry as registry
from core.tests import test_utils

FeatureStages = feature_flag_domain.FeatureStages


class FeatureNames(enum.Enum):
    """Enum for parameter names."""

    FEATURE_A = 'feature_a'


class FeatureFlagRegistryTests(test_utils.GenericTestBase):
    """Tests for the feature flag Registry."""

    def setUp(self) -> None:
        super().setUp()
        self.swap_name_to_description_feature_stage_dict = self.swap(
            registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.FEATURE_A.value: (
                    'test description', FeatureStages.DEV
                )
            }
        )

    def test_get_feature_flag(self) -> None:
        with self.swap_name_to_description_feature_stage_dict:
            feature_flag = registry.Registry.get_feature_flag(
                FeatureNames.FEATURE_A.value)
        self.assertIsNotNone(feature_flag)
        self.assertIsInstance(feature_flag, feature_flag_domain.FeatureFlag)

    def test_get_non_existing_feature_failure(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Feature flag not found: feature_d'
        ):
            registry.Registry.get_feature_flag('feature_d')

    def test_existing_feature_gets_updated(self) -> None:
        with self.swap_name_to_description_feature_stage_dict:
            self.assertIsNone(
                registry.Registry.load_feature_flag_config_from_storage(
                    FeatureNames.FEATURE_A.value))
            registry.Registry.update_feature_flag(
                FeatureNames.FEATURE_A.value,
                True,
                50,
                ['user_group_1', 'user_group_2']
            )
            self.assertIsNotNone(
                registry.Registry.load_feature_flag_config_from_storage(
                    FeatureNames.FEATURE_A.value))
            registry.Registry.update_feature_flag(
                FeatureNames.FEATURE_A.value,
                True,
                100,
                ['user_group_1', 'user_group_2', 'user_group_3']
            )

            updated_feature_flag = registry.Registry.get_feature_flag(
                FeatureNames.FEATURE_A.value)
            self.assertTrue(
                updated_feature_flag.feature_flag_config.
                force_enable_for_all_users)
            self.assertEqual(
                updated_feature_flag.feature_flag_config.rollout_percentage,
                100)
            self.assertEqual(
                updated_feature_flag.feature_flag_config.user_group_ids,
                ['user_group_1', 'user_group_2', 'user_group_3']
            )

    def test_update_feature_flag(self) -> None:
        with self.swap_name_to_description_feature_stage_dict:
            registry.Registry.update_feature_flag(
                FeatureNames.FEATURE_A.value,
                True,
                50,
                ['user_group_1', 'user_group_2']
            )

            updated_feature_flag = registry.Registry.get_feature_flag(
                FeatureNames.FEATURE_A.value)
        self.assertTrue(
            updated_feature_flag.feature_flag_config.force_enable_for_all_users)
        self.assertEqual(
            updated_feature_flag.feature_flag_config.rollout_percentage, 50)
        self.assertEqual(
            updated_feature_flag.feature_flag_config.user_group_ids,
            ['user_group_1', 'user_group_2']
        )

    def test_updating_dev_feature_in_test_env_raises_exception(self) -> None:
        with self.swap_name_to_description_feature_stage_dict:
            with self.swap(constants, 'DEV_MODE', False):
                with self.swap(
                    feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False
                ):
                    with self.assertRaisesRegex(
                        utils.ValidationError,
                        'Feature flag in dev stage cannot be updated in test '
                        'environment.'
                    ):
                        feature_flag = registry.Registry.get_feature_flag(
                            FeatureNames.FEATURE_A.value)
                        feature_flag.feature_flag_config.validate(
                            feature_flag_domain.ServerMode.DEV)

    def test_updating_dev_feature_in_prod_env_raises_exception(self) -> None:
        with self.swap_name_to_description_feature_stage_dict:
            with self.swap(constants, 'DEV_MODE', False):
                with self.swap(
                    feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True
                ):
                    with self.assertRaisesRegex(
                        utils.ValidationError,
                        'Feature flag in dev stage cannot be updated in prod '
                        'environment.'
                    ):
                        feature_flag = registry.Registry.get_feature_flag(
                            FeatureNames.FEATURE_A.value)
                        feature_flag.feature_flag_config.validate(
                            feature_flag_domain.ServerMode.DEV)

    def test_updating_test_feature_in_prod_env_raises_exception(self) -> None:
        swap_name_to_description_feature_stage_dict = self.swap(
            registry,
            'FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            {
                FeatureNames.FEATURE_A.value: (
                    'test description', FeatureStages.TEST
                )
            }
        )
        with swap_name_to_description_feature_stage_dict:
            with self.swap(constants, 'DEV_MODE', False):
                with self.swap(
                    feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True
                ):
                    with self.assertRaisesRegex(
                        utils.ValidationError,
                        'Feature flag in test stage cannot be updated in prod '
                        'environment.'
                    ):
                        feature_flag = registry.Registry.get_feature_flag(
                            FeatureNames.FEATURE_A.value)
                        feature_flag.feature_flag_config.validate(
                            feature_flag_domain.ServerMode.TEST)

    def test_updated_feature_is_saved_in_storage(self) -> None:
        with self.swap_name_to_description_feature_stage_dict:
            self.assertIsNone(
                registry.Registry.load_feature_flag_config_from_storage(
                    FeatureNames.FEATURE_A.value))

            registry.Registry.update_feature_flag(
                FeatureNames.FEATURE_A.value,
                True,
                50,
                ['user_group_1', 'user_group_2']
            )

            updated_feature_flag = (
                registry.Registry.load_feature_flag_config_from_storage(
                    FeatureNames.FEATURE_A.value)
            )
            self.assertIsNotNone(updated_feature_flag)
