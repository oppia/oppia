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

import datetime

from core import feconf
from core import utils
from core.constants import constants
from core.domain import feature_flag_domain
from core.tests import test_utils


class FeatureFlagSpecTests(test_utils.GenericTestBase):
    """Tests for FeatureFlagSpec."""

    def test_create_from_dict_returns_correct_instance(self) -> None:
        feature_flag_spec = feature_flag_domain.FeatureFlagSpec.from_dict({
            'description': 'for test',
            'feature_stage': feature_flag_domain.FeatureStages.DEV.value
        })
        self.assertIsInstance(
            feature_flag_spec, feature_flag_domain.FeatureFlagSpec)
        self.assertEqual(feature_flag_spec.description, 'for test')
        self.assertEqual(
            feature_flag_spec.feature_stage,
            feature_flag_domain.FeatureStages.DEV)

        feature_flag_spec = feature_flag_domain.FeatureFlagSpec.from_dict({
            'description': 'for test',
            'feature_stage': feature_flag_domain.FeatureStages.TEST.value
        })
        self.assertIsInstance(
            feature_flag_spec, feature_flag_domain.FeatureFlagSpec)
        self.assertEqual(feature_flag_spec.description, 'for test')
        self.assertEqual(
            feature_flag_spec.feature_stage,
            feature_flag_domain.FeatureStages.TEST)

        feature_flag_spec = feature_flag_domain.FeatureFlagSpec.from_dict({
            'description': 'for test',
            'feature_stage': feature_flag_domain.FeatureStages.PROD.value
        })
        self.assertIsInstance(
            feature_flag_spec, feature_flag_domain.FeatureFlagSpec)
        self.assertEqual(feature_flag_spec.description, 'for test')
        self.assertEqual(
            feature_flag_spec.feature_stage,
            feature_flag_domain.FeatureStages.PROD)

    def test_from_dict_raises_error_when_invalid_feature_stage(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Invalid feature stage, should be one of ServerMode.DEV, '
            'ServerMode.TEST or ServerMode.PROD.'
        ):
            feature_flag_domain.FeatureFlagSpec.from_dict({
            'description': 'for test',
            'feature_stage': 'invalid'
        })

    def test_to_dict_returns_correct_dict(self) -> None:
        feature_flag_spec_dict: feature_flag_domain.FeatureFlagSpecDict = {
            'description': 'for test',
            'feature_stage': feature_flag_domain.FeatureStages.DEV.value
        }
        feature_flag_spec = feature_flag_domain.FeatureFlagSpec(
            'for test',
            feature_flag_domain.FeatureStages.DEV)
        self.assertDictEqual(
            feature_flag_spec.to_dict(), feature_flag_spec_dict)


class FeatureFlagConfigTests(test_utils.GenericTestBase):
    """Tests for FeatureFlagConfig."""

    def test_create_from_dict_returns_correct_instance(self) -> None:
        current_time = datetime.datetime.utcnow()
        feature_flag_config = feature_flag_domain.FeatureFlagConfig.from_dict({
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': utils.convert_naive_datetime_to_string(
                current_time)
        })

        self.assertIsInstance(
            feature_flag_config, feature_flag_domain.FeatureFlagConfig)
        self.assertFalse(
            feature_flag_config.force_enable_for_all_users)
        self.assertEqual(
            feature_flag_config.rollout_percentage, 0)
        self.assertEqual(
            feature_flag_config.user_group_ids, [])
        self.assertEqual(
            feature_flag_config.last_updated, current_time)

    def test_to_dict_returns_correct_dict(self) -> None:
        current_time = datetime.datetime.utcnow()
        feature_flag_config_dict: feature_flag_domain.FeatureFlagConfigDict = {
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': utils.convert_naive_datetime_to_string(
                current_time)
        }
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False,
            0,
            [],
            current_time)
        self.assertDictEqual(
            feature_flag_config.to_dict(), feature_flag_config_dict)

    def test_set_object_values_correctly(self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False,
            0,
            [],
            datetime.datetime.utcnow()
        )
        current_time = datetime.datetime.utcnow()
        feature_flag_config.set_force_enable_for_all_users(True)
        feature_flag_config.set_rollout_percentage(50)
        feature_flag_config.set_user_group_ids(['user_group_1', 'user_group_2'])
        feature_flag_config.set_last_updated(current_time)

        self.assertTrue(feature_flag_config.force_enable_for_all_users)
        self.assertEqual(feature_flag_config.rollout_percentage, 50)
        self.assertEqual(
            feature_flag_config.user_group_ids,
            ['user_group_1', 'user_group_2']
        )
        self.assertEqual(feature_flag_config.last_updated, current_time)

    def test_validate_feature_flag_config_passes_without_exception(
        self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False,
            0,
            [],
            datetime.datetime.utcnow()
        )
        feature_flag_config.validate(feature_flag_domain.ServerMode.DEV)

    def test_validate_feature_flag_with_percentage_less_than_0_raises_exception(
        self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False,
            -1,
            [],
            datetime.datetime.utcnow()
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Feature flag rollout-percentage should be between '
            '0 and 100 inclusive.'
        ):
            feature_flag_config.validate(feature_flag_domain.ServerMode.DEV)

    def test_validate_feature_flag_with_perc_more_than_100_raises_exception(
        self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False,
            101,
            [],
            datetime.datetime.utcnow()
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Feature flag rollout-percentage should be between '
            '0 and 100 inclusive.'
        ):
            feature_flag_config.validate(feature_flag_domain.ServerMode.DEV)

    def test_validate_dev_feature_for_test_env_raises_exception(self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False,
            0,
            [],
            datetime.datetime.utcnow()
        )
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature flag in dev stage cannot be updated in test '
                    'environment.'
                ):
                    feature_flag_config.validate(
                        feature_flag_domain.ServerMode.DEV)

    def test_validate_dev_feature_for_prod_env_raises_exception(self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False,
            0,
            [],
            datetime.datetime.utcnow()
        )
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature flag in dev stage cannot be updated in prod '
                    'environment.'
                ):
                    feature_flag_config.validate(
                        feature_flag_domain.ServerMode.DEV)

    def test_validate_test_feature_for_prod_env_raises_exception(self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False,
            0,
            [],
            datetime.datetime.utcnow()
        )
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature flag in test stage cannot be updated in prod '
                    'environment.'
                ):
                    feature_flag_config.validate(
                        feature_flag_domain.ServerMode.TEST)


class FeatureFlagTests(test_utils.GenericTestBase):
    """Tests for FeatureFlag."""

    def test_create_from_dict_returns_correct_instance(self) -> None:
        current_time = datetime.datetime.utcnow()
        feature_flag = feature_flag_domain.FeatureFlag.from_dict({
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': feature_flag_domain.FeatureStages.DEV.value,
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': utils.convert_naive_datetime_to_string(
                current_time)
        })

        self.assertIsInstance(feature_flag, feature_flag_domain.FeatureFlag)
        self.assertEqual(feature_flag.name, 'feature_a')
        self.assertEqual(feature_flag.feature_flag_spec.description, 'for test')
        self.assertEqual(
            feature_flag.feature_flag_spec.feature_stage,
            feature_flag_domain.FeatureStages.DEV)
        self.assertFalse(
            feature_flag.feature_flag_config.force_enable_for_all_users)
        self.assertEqual(
            feature_flag.feature_flag_config.rollout_percentage, 0)
        self.assertEqual(
            feature_flag.feature_flag_config.user_group_ids, [])
        self.assertEqual(
            feature_flag.feature_flag_config.last_updated, current_time)

    def test_to_dict_returns_correct_dict(self) -> None:
        current_time = datetime.datetime.utcnow()
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False,
            0,
            [],
            current_time
        )
        feature_flag_spec = feature_flag_domain.FeatureFlagSpec(
            'for test',
            feature_flag_domain.FeatureStages.DEV
        )
        feature_flag_dict: feature_flag_domain.FeatureFlagDict = {
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': feature_flag_domain.FeatureStages.DEV.value,
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': utils.convert_naive_datetime_to_string(current_time)
        }
        feature_flag = feature_flag_domain.FeatureFlag(
            'feature_a',
            feature_flag_spec,
            feature_flag_config
        )
        feature_flag.validate()
        self.assertDictEqual(feature_flag.to_dict(), feature_flag_dict)

    def test_validate_feature_flag_with_invalid_name_raises_exception(
        self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False,
            0,
            [],
            datetime.datetime.utcnow()
        )
        feature_flag_spec = feature_flag_domain.FeatureFlagSpec(
            'for test',
            feature_flag_domain.FeatureStages.DEV
        )
        feature_flag = feature_flag_domain.FeatureFlag(
            'Invalid~Name',
            feature_flag_spec,
            feature_flag_config
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Invalid feature flag name \'%s\'' % feature_flag.name
        ):
            feature_flag.validate()

    def test_validate_feature_flag_with_perc_more_than_100_raises_exception(
        self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False,
            101,
            [],
            datetime.datetime.utcnow()
        )
        feature_flag_spec = feature_flag_domain.FeatureFlagSpec(
            'Feature Description',
            feature_flag_domain.ServerMode.DEV
        )
        feature_flag = feature_flag_domain.FeatureFlag(
            'Feature',
            feature_flag_spec,
            feature_flag_config
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Feature flag rollout-percentage should be between '
            '0 and 100 inclusive.'
        ):
            feature_flag.validate()
