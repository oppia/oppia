# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for Android feature-flag domain objects."""

from __future__ import annotations

from core import utils
from core.domain import android_feature_flag_domain
from core.tests import test_utils


class AndroidFeatureFlagConfigTests(test_utils.GenericTestBase):
    """Tests for AndroidFeatureFlagConfig."""

    def setUp(self) -> None:
        super().setUp()
        self.config = android_feature_flag_domain.AndroidFeatureFlagConfig(
            android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
            '1.2.3',
            None,
            50,
        )

    def test_validate_with_valid_config(self) -> None:
        self.config.validate()

    def test_from_dict_returns_correct_instance(self) -> None:
        config = android_feature_flag_domain.AndroidFeatureFlagConfig.from_dict(
            {
                'state': 'live',
                'min_app_version': '1.2.3',
                'max_app_version': None,
                'rollout_percentage': 50,
            }
        )
        self.assertIsInstance(
            config, android_feature_flag_domain.AndroidFeatureFlagConfig
        )
        self.assertEqual(config.to_dict(), self.config.to_dict())

    def test_from_dict_with_invalid_state_raises_error(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid Android feature flag state'
        ):
            android_feature_flag_domain.AndroidFeatureFlagConfig.from_dict(
                {
                    'state': 'unknown',
                    'min_app_version': None,
                    'max_app_version': None,
                    'rollout_percentage': 100,
                }
            )

    def test_from_dict_with_non_string_state_raises_error(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid Android feature flag state'
        ):
            android_feature_flag_domain.AndroidFeatureFlagConfig.from_dict(
                {
                    'state': None,
                    'min_app_version': None,
                    'max_app_version': None,
                    'rollout_percentage': 100,
                }
            )

    def test_to_dict_returns_correct_dict(self) -> None:
        self.assertEqual(
            self.config.to_dict(),
            {
                'state': 'live',
                'min_app_version': '1.2.3',
                'max_app_version': None,
                'rollout_percentage': 50,
            },
        )

    def test_serialize_and_deserialize_round_trip(self) -> None:
        restored_config = (
            android_feature_flag_domain.AndroidFeatureFlagConfig.deserialize(
                self.config.serialize()
            )
        )
        self.assertEqual(restored_config.to_dict(), self.config.to_dict())

    def test_validate_with_none_min_app_version_raises_error(self) -> None:
        config = android_feature_flag_domain.AndroidFeatureFlagConfig(
            android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
            # Here we use MyPy ignore because None is intentionally passed to
            # verify runtime validation of the required minimum version.
            None,  # type: ignore[arg-type]
            None,
            100,
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Minimum app version cannot be None',
        ):
            config.validate()

    def test_validate_with_invalid_app_version_type_raises_error(self) -> None:
        config = android_feature_flag_domain.AndroidFeatureFlagConfig(
            android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
            # Here we use MyPy ignore because this test passes an integer to
            # verify runtime rejection of non-string version values.
            10,  # type: ignore[arg-type]
            None,
            100,
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Minimum app version must be a string',
        ):
            config.validate()

    def test_validate_with_boolean_app_version_raises_error(self) -> None:
        config = android_feature_flag_domain.AndroidFeatureFlagConfig(
            android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
            '1.2.3',
            # Here we use MyPy ignore because this test verifies runtime
            # rejection of a non-string maximum version.
            True,  # type: ignore[arg-type]
            100,
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Maximum app version must be a string or None',
        ):
            config.validate()

    def test_validate_with_min_app_version_greater_than_max_raises_error(
        self,
    ) -> None:
        config = android_feature_flag_domain.AndroidFeatureFlagConfig(
            android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
            '2.0.0',
            '1.9.9',
            100,
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Minimum app version cannot exceed maximum app version',
        ):
            config.validate()

    def test_validate_with_rollout_outside_range_raises_error(self) -> None:
        config = android_feature_flag_domain.AndroidFeatureFlagConfig(
            android_feature_flag_domain.AndroidFeatureFlagState.FINAL,
            '1.2.3',
            None,
            101,
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'rollout percentage must be integer between 0 and 100 inclusive',
        ):
            config.validate()

    def test_validate_with_negative_rollout_raises_error(self) -> None:
        config = android_feature_flag_domain.AndroidFeatureFlagConfig(
            android_feature_flag_domain.AndroidFeatureFlagState.FINAL,
            '1.2.3',
            None,
            -1,
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'rollout percentage must be integer between 0 and 100 inclusive',
        ):
            config.validate()

    def test_validate_with_invalid_state_type_raises_error(self) -> None:
        config = android_feature_flag_domain.AndroidFeatureFlagConfig(
            # Here we use MyPy ignore because this test passes an invalid state
            # type to verify runtime validation.
            'live',  # type: ignore[arg-type]
            None,
            None,
            100,
        )
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid Android feature flag state'
        ):
            config.validate()

    def test_validate_with_malformed_min_app_version_raises_error(self) -> None:
        config = android_feature_flag_domain.AndroidFeatureFlagConfig(
            android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
            'not-a-version',
            None,
            100,
        )
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Android app versions must be valid version strings',
        ):
            config.validate()
