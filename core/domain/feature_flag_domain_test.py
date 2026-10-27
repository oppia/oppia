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

from core import feconf, utils
from core.constants import constants
from core.domain import feature_flag_domain
from core.tests import test_utils

from typing import List, Optional


class FeatureFlagSpecTests(test_utils.GenericTestBase):
    """Tests for FeatureFlagSpec."""

    def test_create_from_dict_returns_correct_instance(self) -> None:
        feature_flag_spec = feature_flag_domain.FeatureFlagSpec.from_dict(
            {
                'description': 'for test',
                'feature_stage': feature_flag_domain.FeatureStages.DEV.value,
            }
        )
        self.assertIsInstance(
            feature_flag_spec, feature_flag_domain.FeatureFlagSpec
        )
        self.assertEqual(feature_flag_spec.description, 'for test')
        self.assertEqual(
            feature_flag_spec.feature_stage,
            feature_flag_domain.FeatureStages.DEV,
        )

        feature_flag_spec = feature_flag_domain.FeatureFlagSpec.from_dict(
            {
                'description': 'for test',
                'feature_stage': feature_flag_domain.FeatureStages.TEST.value,
            }
        )
        self.assertIsInstance(
            feature_flag_spec, feature_flag_domain.FeatureFlagSpec
        )
        self.assertEqual(feature_flag_spec.description, 'for test')
        self.assertEqual(
            feature_flag_spec.feature_stage,
            feature_flag_domain.FeatureStages.TEST,
        )

        feature_flag_spec = feature_flag_domain.FeatureFlagSpec.from_dict(
            {
                'description': 'for test',
                'feature_stage': feature_flag_domain.FeatureStages.PROD.value,
            }
        )
        self.assertIsInstance(
            feature_flag_spec, feature_flag_domain.FeatureFlagSpec
        )
        self.assertEqual(feature_flag_spec.description, 'for test')
        self.assertEqual(
            feature_flag_spec.feature_stage,
            feature_flag_domain.FeatureStages.PROD,
        )

    def test_from_dict_raises_error_when_invalid_feature_stage(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'Invalid feature stage, should be one of ServerMode.DEV, '
            'ServerMode.TEST or ServerMode.PROD.',
        ):
            feature_flag_domain.FeatureFlagSpec.from_dict(
                {'description': 'for test', 'feature_stage': 'invalid'}
            )

    def test_to_dict_returns_correct_dict(self) -> None:
        feature_flag_spec_dict: feature_flag_domain.FeatureFlagSpecDict = {
            'description': 'for test',
            'feature_stage': feature_flag_domain.FeatureStages.DEV.value,
        }
        feature_flag_spec = feature_flag_domain.FeatureFlagSpec(
            'for test', feature_flag_domain.FeatureStages.DEV
        )
        self.assertDictEqual(
            feature_flag_spec.to_dict(), feature_flag_spec_dict
        )


class FeatureFlagConfigTests(test_utils.GenericTestBase):
    """Tests for FeatureFlagConfig."""

    def test_create_from_dict_returns_correct_instance(self) -> None:
        current_time = utils.get_current_utc_datetime()
        feature_flag_config = feature_flag_domain.FeatureFlagConfig.from_dict(
            {
                'force_enable_for_all_users': False,
                'rollout_percentage': 0,
                'user_group_ids': [],
                'last_updated': utils.convert_naive_datetime_to_string(
                    current_time
                ),
            }
        )

        self.assertIsInstance(
            feature_flag_config, feature_flag_domain.FeatureFlagConfig
        )
        self.assertFalse(feature_flag_config.force_enable_for_all_users)
        self.assertEqual(feature_flag_config.rollout_percentage, 0)
        self.assertEqual(feature_flag_config.user_group_ids, [])
        self.assertEqual(feature_flag_config.last_updated, current_time)

    def test_to_dict_returns_correct_dict(self) -> None:
        current_time = utils.get_current_utc_datetime()
        feature_flag_config_dict: feature_flag_domain.FeatureFlagConfigDict = {
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': utils.convert_naive_datetime_to_string(
                current_time
            ),
        }
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False, 0, [], current_time
        )
        self.assertDictEqual(
            feature_flag_config.to_dict(), feature_flag_config_dict
        )

    def test_set_object_values_correctly(self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False, 0, [], utils.get_current_utc_datetime()
        )
        current_time = utils.get_current_utc_datetime()
        feature_flag_config.set_force_enable_for_all_users(True)
        feature_flag_config.set_rollout_percentage(50)
        feature_flag_config.set_user_group_ids(['user_group_1', 'user_group_2'])
        feature_flag_config.set_last_updated(current_time)

        self.assertTrue(feature_flag_config.force_enable_for_all_users)
        self.assertEqual(feature_flag_config.rollout_percentage, 50)
        self.assertEqual(
            feature_flag_config.user_group_ids, ['user_group_1', 'user_group_2']
        )
        self.assertEqual(feature_flag_config.last_updated, current_time)

    def test_validate_feature_flag_config_passes_without_exception(
        self,
    ) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False, 0, [], utils.get_current_utc_datetime()
        )
        feature_flag_config.validate(feature_flag_domain.ServerMode.DEV)

    def test_validate_feature_flag_with_percentage_less_than_0_raises_exception(
        self,
    ) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False, -1, [], utils.get_current_utc_datetime()
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Feature flag rollout-percentage should be between '
            '0 and 100 inclusive.',
        ):
            feature_flag_config.validate(feature_flag_domain.ServerMode.DEV)

    def test_validate_feature_flag_with_perc_more_than_100_raises_exception(
        self,
    ) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False, 101, [], utils.get_current_utc_datetime()
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Feature flag rollout-percentage should be between '
            '0 and 100 inclusive.',
        ):
            feature_flag_config.validate(feature_flag_domain.ServerMode.DEV)

    def test_validate_dev_feature_for_test_env_raises_exception(self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False, 0, [], utils.get_current_utc_datetime()
        )
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature flag in dev stage cannot be updated in test '
                    'environment.',
                ):
                    feature_flag_config.validate(
                        feature_flag_domain.ServerMode.DEV
                    )

    def test_validate_dev_feature_for_prod_env_raises_exception(self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False, 0, [], utils.get_current_utc_datetime()
        )
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature flag in dev stage cannot be updated in prod '
                    'environment.',
                ):
                    feature_flag_config.validate(
                        feature_flag_domain.ServerMode.DEV
                    )

    def test_validate_test_feature_for_prod_env_raises_exception(self) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False, 0, [], utils.get_current_utc_datetime()
        )
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                with self.assertRaisesRegex(
                    utils.ValidationError,
                    'Feature flag in test stage cannot be updated in prod '
                    'environment.',
                ):
                    feature_flag_config.validate(
                        feature_flag_domain.ServerMode.TEST
                    )


class FeatureFlagTests(test_utils.GenericTestBase):
    """Tests for FeatureFlag."""

    def test_create_from_dict_returns_correct_instance(self) -> None:
        current_time = utils.get_current_utc_datetime()
        feature_flag = feature_flag_domain.FeatureFlag.from_dict(
            {
                'name': 'feature_a',
                'description': 'for test',
                'feature_stage': feature_flag_domain.FeatureStages.DEV.value,
                'force_enable_for_all_users': False,
                'rollout_percentage': 0,
                'user_group_ids': [],
                'last_updated': utils.convert_naive_datetime_to_string(
                    current_time
                ),
            }
        )

        self.assertIsInstance(feature_flag, feature_flag_domain.FeatureFlag)
        self.assertEqual(feature_flag.name, 'feature_a')
        self.assertEqual(feature_flag.feature_flag_spec.description, 'for test')
        self.assertEqual(
            feature_flag.feature_flag_spec.feature_stage,
            feature_flag_domain.FeatureStages.DEV,
        )
        self.assertFalse(
            feature_flag.feature_flag_config.force_enable_for_all_users
        )
        self.assertEqual(feature_flag.feature_flag_config.rollout_percentage, 0)
        self.assertEqual(feature_flag.feature_flag_config.user_group_ids, [])
        self.assertEqual(
            feature_flag.feature_flag_config.last_updated, current_time
        )

    def test_to_dict_returns_correct_dict(self) -> None:
        current_time = utils.get_current_utc_datetime()
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False, 0, [], current_time
        )
        feature_flag_spec = feature_flag_domain.FeatureFlagSpec(
            'for test', feature_flag_domain.FeatureStages.DEV
        )
        feature_flag_dict: feature_flag_domain.FeatureFlagDict = {
            'name': 'feature_a',
            'description': 'for test',
            'feature_stage': feature_flag_domain.FeatureStages.DEV.value,
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': utils.convert_naive_datetime_to_string(
                current_time
            ),
        }
        feature_flag = feature_flag_domain.FeatureFlag(
            'feature_a', feature_flag_spec, feature_flag_config
        )
        feature_flag.validate()
        self.assertDictEqual(feature_flag.to_dict(), feature_flag_dict)

    def test_validate_feature_flag_with_invalid_name_raises_exception(
        self,
    ) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False, 0, [], utils.get_current_utc_datetime()
        )
        feature_flag_spec = feature_flag_domain.FeatureFlagSpec(
            'for test', feature_flag_domain.FeatureStages.DEV
        )
        feature_flag = feature_flag_domain.FeatureFlag(
            'Invalid~Name', feature_flag_spec, feature_flag_config
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Invalid feature flag name \'%s\'' % feature_flag.name,
        ):
            feature_flag.validate()

    def test_validate_feature_flag_with_perc_more_than_100_raises_exception(
        self,
    ) -> None:
        feature_flag_config = feature_flag_domain.FeatureFlagConfig(
            False, 101, [], utils.get_current_utc_datetime()
        )
        feature_flag_spec = feature_flag_domain.FeatureFlagSpec(
            'Feature Description', feature_flag_domain.ServerMode.DEV
        )
        feature_flag = feature_flag_domain.FeatureFlag(
            'Feature', feature_flag_spec, feature_flag_config
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Feature flag rollout-percentage should be between '
            '0 and 100 inclusive.',
        ):
            feature_flag.validate()


class FeatureFlagIsEnabledTests(test_utils.GenericTestBase):
    """Tests for FeatureFlag.is_enabled."""

    def _create_feature_flag(
        self,
        feature_stage: feature_flag_domain.ServerMode,
        force_enable_for_all_users: bool = False,
        rollout_percentage: int = 0,
        user_group_ids: Optional[List[str]] = None,
        name: str = 'feature_a',
    ) -> feature_flag_domain.FeatureFlag:
        """Returns a FeatureFlag with the given stage and config."""
        return feature_flag_domain.FeatureFlag(
            name,
            feature_flag_domain.FeatureFlagSpec('for test', feature_stage),
            feature_flag_domain.FeatureFlagConfig(
                force_enable_for_all_users,
                rollout_percentage,
                user_group_ids or [],
                None,
            ),
        )

    def test_dev_feature_is_disabled_on_test_server(self) -> None:
        feature_flag = self._create_feature_flag(
            feature_flag_domain.ServerMode.DEV, force_enable_for_all_users=True
        )
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', False):
                self.assertFalse(feature_flag.is_enabled('user_id', set()))

    def test_dev_and_test_features_are_disabled_on_prod_server(self) -> None:
        dev_feature_flag = self._create_feature_flag(
            feature_flag_domain.ServerMode.DEV, force_enable_for_all_users=True
        )
        test_feature_flag = self._create_feature_flag(
            feature_flag_domain.ServerMode.TEST, force_enable_for_all_users=True
        )
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                self.assertFalse(dev_feature_flag.is_enabled('user_id', set()))
                self.assertFalse(test_feature_flag.is_enabled('user_id', set()))

    def test_prod_feature_is_enabled_on_prod_server_when_forced(self) -> None:
        feature_flag = self._create_feature_flag(
            feature_flag_domain.ServerMode.PROD, force_enable_for_all_users=True
        )
        with self.swap(constants, 'DEV_MODE', False):
            with self.swap(feconf, 'ENV_IS_OPPIA_ORG_PRODUCTION_SERVER', True):
                self.assertTrue(feature_flag.is_enabled('user_id', set()))

    def test_force_enabled_feature_is_enabled_for_logged_out_user(
        self,
    ) -> None:
        feature_flag = self._create_feature_flag(
            feature_flag_domain.ServerMode.DEV, force_enable_for_all_users=True
        )
        with self.swap(constants, 'DEV_MODE', True):
            self.assertTrue(feature_flag.is_enabled(None, set()))

    def test_feature_is_disabled_for_logged_out_user_if_not_forced(
        self,
    ) -> None:
        feature_flag = self._create_feature_flag(
            feature_flag_domain.ServerMode.DEV,
            rollout_percentage=100,
            user_group_ids=['group_1'],
        )
        with self.swap(constants, 'DEV_MODE', True):
            self.assertFalse(feature_flag.is_enabled(None, {'group_1'}))

    def test_feature_is_enabled_only_for_users_in_its_user_groups(
        self,
    ) -> None:
        feature_flag = self._create_feature_flag(
            feature_flag_domain.ServerMode.DEV,
            user_group_ids=['group_1', 'group_2'],
        )
        with self.swap(constants, 'DEV_MODE', True):
            self.assertTrue(
                feature_flag.is_enabled('user_id', {'group_2', 'group_3'})
            )
            self.assertFalse(feature_flag.is_enabled('user_id', {'group_3'}))
            self.assertFalse(feature_flag.is_enabled('user_id', set()))

    def test_rollout_percentage_of_0_and_100(self) -> None:
        feature_flag_at_0 = self._create_feature_flag(
            feature_flag_domain.ServerMode.DEV, rollout_percentage=0
        )
        feature_flag_at_100 = self._create_feature_flag(
            feature_flag_domain.ServerMode.DEV, rollout_percentage=100
        )
        with self.swap(constants, 'DEV_MODE', True):
            for user_id in ['user_1', 'user_2', 'user_3']:
                self.assertFalse(feature_flag_at_0.is_enabled(user_id, set()))
                self.assertTrue(feature_flag_at_100.is_enabled(user_id, set()))

    def test_rollout_result_is_stable_and_depends_on_feature_name(
        self,
    ) -> None:
        user_ids = ['user_%s' % i for i in range(200)]
        feature_flag_a = self._create_feature_flag(
            feature_flag_domain.ServerMode.DEV,
            rollout_percentage=50,
            name='feature_a',
        )
        feature_flag_b = self._create_feature_flag(
            feature_flag_domain.ServerMode.DEV,
            rollout_percentage=50,
            name='feature_b',
        )
        with self.swap(constants, 'DEV_MODE', True):
            results_a = [
                feature_flag_a.is_enabled(user_id, set())
                for user_id in user_ids
            ]
            results_b = [
                feature_flag_b.is_enabled(user_id, set())
                for user_id in user_ids
            ]
            self.assertEqual(
                results_a,
                [
                    feature_flag_a.is_enabled(user_id, set())
                    for user_id in user_ids
                ],
            )
        # With a 50% rollout, some users are in the rollout and some are
        # not, and the set of users differs between the two feature flags
        # because the feature flag name is used as the salt.
        self.assertIn(True, results_a)
        self.assertIn(False, results_a)
        self.assertNotEqual(results_a, results_b)
