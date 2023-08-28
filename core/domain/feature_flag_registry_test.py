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
from core.domain import caching_services
from core.domain import feature_flag_domain
from core.domain import feature_flag_registry as registry
from core.tests import test_utils

from typing import List

FeatureStages = feature_flag_domain.FeatureStages


class FeatureNames(enum.Enum):
    """Enum for parameter names."""

    FEATURE_A = 'feature_a'


class FeatureFlagRegistryTests(test_utils.GenericTestBase):
    """Tests for the feature flag Registry."""

    def setUp(self) -> None:
        super().setUp()

        self.original_feature_registry = registry.Registry.feature_registry
        registry.Registry.feature_registry.clear()

        # Feature names that might be used in following tests.
        feature_names = ['feature_a', 'feature_b']
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            feature_names)

    def tearDown(self) -> None:
        super().tearDown()

        registry.Registry.feature_registry = self.original_feature_registry

    def test_create_feature_flag(self) -> None:
        feature = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)
        self.assertIsInstance(feature, feature_flag_domain.FeatureFlag)
        feature.validate()

    def test_create_feature_flag_with_the_same_name_failure(self) -> None:
        registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)
        with self.assertRaisesRegex(
            Exception, 'Feature flag with name feature_a already exists'
        ):
            registry.Registry.create_feature_flag(
                FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)

    def test_get_feature_flag(self) -> None:
        registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)
        feature = registry.Registry.get_feature_flag(
            FeatureNames.FEATURE_A.value)
        self.assertIsNotNone(feature)
        self.assertIsInstance(feature, feature_flag_domain.FeatureFlag)

    def test_get_non_existing_feature_failure(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Feature flag not found: feature_d'
        ):
            registry.Registry.get_feature_flag('feature_d')

    def test_memcache_is_set_after_get_request_for_feature(self) -> None:
        registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)

        self.assertIsNone(
            registry.Registry.load_feature_flag_from_memcache(
                FeatureNames.FEATURE_A.value))
        registry.Registry.get_feature_flag(FeatureNames.FEATURE_A.value)
        self.assertIsNotNone(
            registry.Registry.load_feature_flag_from_memcache(
                FeatureNames.FEATURE_A.value))
        # Here we are verify that the feature now gets call from the memcache
        # instead of storage model or registry variable.
        feature = registry.Registry.get_feature_flag(
            FeatureNames.FEATURE_A.value)
        memcache_feature = registry.Registry.load_feature_flag_from_memcache(
            FeatureNames.FEATURE_A.value)
        self.assertEqual(feature.to_dict(), memcache_feature.to_dict())

    def test_existing_feature_gets_updated(self) -> None:
        registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)
        self.assertIsNone(
            registry.Registry.load_feature_flag_from_storage(
                FeatureNames.FEATURE_A.value))
        registry.Registry.update_feature_flag(
            FeatureNames.FEATURE_A.value,
            True,
            50,
            ['user_group_1', 'user_group_2']
        )
        self.assertIsNotNone(
            registry.Registry.load_feature_flag_from_storage(
                FeatureNames.FEATURE_A.value))
        registry.Registry.update_feature_flag(
            FeatureNames.FEATURE_A.value,
            True,
            100,
            ['user_group_1', 'user_group_2', 'user_group_3']
        )

        updated_feature = registry.Registry.get_feature_flag(
            FeatureNames.FEATURE_A.value)
        self.assertTrue(updated_feature.force_enable_for_all_users)
        self.assertEqual(updated_feature.rollout_percentage, 100)
        self.assertEqual(
            updated_feature.user_group_ids,
            ['user_group_1', 'user_group_2', 'user_group_3']
        )

    def test_update_feature_flag(self) -> None:
        registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)

        registry.Registry.update_feature_flag(
            FeatureNames.FEATURE_A.value,
            True,
            50,
            ['user_group_1', 'user_group_2']
        )

        updated_feature = registry.Registry.get_feature_flag(
            FeatureNames.FEATURE_A.value)
        self.assertTrue(updated_feature.force_enable_for_all_users)
        self.assertEqual(updated_feature.rollout_percentage, 50)
        self.assertEqual(
            updated_feature.user_group_ids, ['user_group_1', 'user_group_2'])

    def test_cached_value_is_invalidated_after_update(self) -> None:
        registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)

        registry.Registry.update_feature_flag(
            FeatureNames.FEATURE_A.value,
            True,
            50,
            ['user_group_1', 'user_group_2']
        )

        self.assertIsNone(
            registry.Registry.load_feature_flag_from_memcache(
                FeatureNames.FEATURE_A.value))

    def test_updating_dev_feature_in_test_env_raises_exception(self) -> None:
        feature = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature in dev stage cannot be updated in test '
                    'environment.'
                ):
                    feature.validate()

    def test_updating_dev_feature_in_prod_env_raises_exception(self) -> None:
        feature = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature in dev stage cannot be updated in prod '
                    'environment.'
                ):
                    feature.validate()

    def test_updating_test_feature_in_prod_env_raises_exception(self) -> None:
        feature = registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.TEST)
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature in test stage cannot be updated in prod '
                    'environment.'
                ):
                    feature.validate()

    def test_updated_feature_is_saved_in_storage(self) -> None:
        registry.Registry.create_feature_flag(
            FeatureNames.FEATURE_A, 'test', FeatureStages.DEV)
        self.assertIsNone(
            registry.Registry.load_feature_flag_from_storage(
                FeatureNames.FEATURE_A.value))

        registry.Registry.update_feature_flag(
            FeatureNames.FEATURE_A.value,
            True,
            50,
            ['user_group_1', 'user_group_2']
        )

        updated_feature = (
            registry.Registry.load_feature_flag_from_storage(
                FeatureNames.FEATURE_A.value)
        )
        self.assertIsNotNone(updated_feature)
