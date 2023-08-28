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

"""Tests for the domain objects relating to feature flags."""

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.domain import feature_flag_domain
from core.tests import test_utils


class FeatureFlagTests(test_utils.GenericTestBase):
    """Tests for FeatureFlag."""

    def test_create_from_dict_returns_correct_instance(self) -> None:
        feature = feature_flag_domain.FeatureFlag.from_dict({
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': 'dev',
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': 'August 25, 2023'
        })

        self.assertIsInstance(feature, feature_flag_domain.FeatureFlag)
        self.assertEqual(feature.name, 'feature_a')
        self.assertEqual(feature.description, 'for test')
        self.assertEqual(feature.feature_stage, 'dev')
        self.assertFalse(feature.force_enable_for_all_users)
        self.assertEqual(feature.rollout_percentage, 0)
        self.assertEqual(feature.user_group_ids, [])
        self.assertEqual(feature.last_updated, 'August 25, 2023')

    def test_to_dict_returns_correct_dict(self) -> None:
        feature_flag_dict: feature_flag_domain.FeatureFlagDict = {
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': 'dev',
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': 'August 25, 2023'
        }
        feature = feature_flag_domain.FeatureFlag.from_dict(feature_flag_dict)
        self.assertDictEqual(feature.to_dict(), feature_flag_dict)

    def test_set_object_values_correctly(self) -> None:
        feature = feature_flag_domain.FeatureFlag.from_dict({
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': 'dev',
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': 'August 25, 2023'
        })
        feature.set_force_enable_for_all_users(True)
        feature.set_rollout_percentage(50)
        feature.set_user_group_ids(['user_group_1', 'user_group_2'])
        feature.set_last_updated('August 26, 2023')

        self.assertTrue(feature.force_enable_for_all_users)
        self.assertEqual(feature.rollout_percentage, 50)
        self.assertEqual(
            feature.user_group_ids, ['user_group_1', 'user_group_2'])
        self.assertEqual(feature.last_updated, 'August 26, 2023')

    def test_validate_feature_passes_without_exception(self) -> None:
        feature = feature_flag_domain.FeatureFlag.from_dict({
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': 'dev',
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': 'August 25, 2023'
        })
        feature.validate()

    def test_validate_with_invalid_name_raises_exception(self) -> None:
        feature = feature_flag_domain.FeatureFlag.from_dict({
            'name': 'Invalid~Name',
            'description': 'for test',
            'feature_stage': 'dev',
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': 'August 25, 2023'
        })
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Invalid feature name \'%s\'' % feature.name
        ):
            feature.validate()

    def test_validate_feature_with_invalid_stage_raises_exception(self) -> None:
        feature = feature_flag_domain.FeatureFlag.from_dict({
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': 'Invalid',
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': 'August 25, 2023'
        })
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid feature stage, got \'Invalid\''):
            feature.validate()

    def test_validate_dev_feature_for_test_env_raises_exception(self) -> None:
        feature = feature_flag_domain.FeatureFlag.from_dict({
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': 'dev',
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': 'August 25, 2023'
        })
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature in dev stage cannot be updated in test '
                    'environment.'
                ):
                    feature.validate()

    def test_validate_dev_feature_for_prod_env_raises_exception(self) -> None:
        feature = feature_flag_domain.FeatureFlag.from_dict({
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': 'dev',
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': 'August 25, 2023'
        })
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature in dev stage cannot be updated in prod '
                    'environment.'
                ):
                    feature.validate()

    def test_validate_test_feature_for_prod_env_raises_exception(self) -> None:
        feature = feature_flag_domain.FeatureFlag.from_dict({
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': 'test',
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': 'August 25, 2023'
        })
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature in test stage cannot be updated in prod '
                    'environment.'
                ):
                    feature.validate()

    def test_serialize_and_deserialize_returns_unchanged_platform_parameter(
        self
    ) -> None:
        """Checks that serializing and then deserializing a default feature
        works as intended by leaving the feature unchanged.
        """
        feature = feature_flag_domain.FeatureFlag.from_dict({
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': 'dev',
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': 'August 25, 2023'
        })
        self.assertEqual(
            feature.to_dict(),
            feature_flag_domain.FeatureFlag.deserialize(
                feature.serialize()).to_dict())
