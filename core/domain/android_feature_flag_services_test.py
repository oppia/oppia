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

"""Tests for Android feature-flag services."""

from __future__ import annotations

import hashlib

from core import android_feature_flag_list, utils
from core.domain import (
    android_feature_flag_domain,
    android_feature_flag_registry,
    android_feature_flag_services,
    caching_services,
)
from core.platform import models
from core.tests import test_utils

from typing import Dict

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])

FEATURE_FLAG_NAME = (
    android_feature_flag_list.AndroidFeatureFlagNames.FAST_LANGUAGE_SWITCHING_IN_LESSON.value
)
SECOND_FEATURE_FLAG_NAME = 'android_test_feature_flag'


class AndroidFeatureFlagServicesTests(test_utils.GenericTestBase):
    """Tests for Android feature-flag service functions."""

    def setUp(self) -> None:
        super().setUp()
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_ANDROID_FEATURE_FLAG,
            None,
            [FEATURE_FLAG_NAME, SECOND_FEATURE_FLAG_NAME],
        )
        self.feature_flag_metadata = {
            FEATURE_FLAG_NAME: (
                'Fast language switching.',
                android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
            ),
            SECOND_FEATURE_FLAG_NAME: (
                'Test feature.',
                android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
            ),
        }

    def test_rollout_evaluation_is_deterministic_and_feature_salted(
        self,
    ) -> None:
        installation_id = 'installation-1'
        first_candidate = (
            int(
                hashlib.sha1(
                    ('%s:%s' % (installation_id, FEATURE_FLAG_NAME)).encode(
                        'utf-8'
                    )
                ).hexdigest()[:8],
                16,
            )
            % 100
        )
        second_candidate = (
            int(
                hashlib.sha1(
                    (
                        '%s:%s' % (installation_id, SECOND_FEATURE_FLAG_NAME)
                    ).encode('utf-8')
                ).hexdigest()[:8],
                16,
            )
            % 100
        )
        self.assertNotEqual(first_candidate, second_candidate)
        rollout_percentage = min(first_candidate, second_candidate) + 1

        feature_flag_metadata: Dict[
            str,
            tuple[str, android_feature_flag_domain.AndroidFeatureFlagState],
        ] = self.feature_flag_metadata
        with self.swap(
            android_feature_flag_registry,
            'ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            feature_flag_metadata,
        ), self.swap(
            android_feature_flag_registry.Registry,
            'get_all_feature_flag_names',
            staticmethod(lambda: [FEATURE_FLAG_NAME, SECOND_FEATURE_FLAG_NAME]),
        ):
            config_models.AndroidFeatureFlagConfigModel.create(
                FEATURE_FLAG_NAME,
                'live',
                '0.0',
                None,
                rollout_percentage,
            )
            config_models.AndroidFeatureFlagConfigModel.create(
                SECOND_FEATURE_FLAG_NAME,
                'live',
                '0.0',
                None,
                rollout_percentage,
            )
            first_result = android_feature_flag_services.get_evaluated_android_feature_flags(
                '1.2-abcdef-ga', installation_id
            )
            repeated_result = android_feature_flag_services.get_evaluated_android_feature_flags(
                '1.2-abcdef-ga', installation_id
            )

        self.assertEqual(
            first_result,
            repeated_result,
        )
        self.assertNotEqual(
            first_result[0][FEATURE_FLAG_NAME],
            first_result[1][SECOND_FEATURE_FLAG_NAME],
        )

    def test_evaluation_filters_flags_by_version_range(self) -> None:
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'final', '2.0', '3.0', 0
        )
        feature_flag_metadata: Dict[
            str,
            tuple[str, android_feature_flag_domain.AndroidFeatureFlagState],
        ] = {FEATURE_FLAG_NAME: self.feature_flag_metadata[FEATURE_FLAG_NAME]}
        with self.swap(
            android_feature_flag_registry,
            'ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            feature_flag_metadata,
        ):
            before_range = android_feature_flag_services.get_evaluated_android_feature_flags(
                '1.9-abcdef-ga', 'installation'
            )
            in_range = android_feature_flag_services.get_evaluated_android_feature_flags(
                '2.5-abcdef-ga', 'installation'
            )
            after_range = android_feature_flag_services.get_evaluated_android_feature_flags(
                '3.0-abcdef-ga', 'installation'
            )

        self.assertEqual(before_range, [])
        self.assertEqual(in_range, [{FEATURE_FLAG_NAME: True}])
        self.assertEqual(after_range, [])

    def test_live_flags_are_omitted_from_non_ga_builds(self) -> None:
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'live', '0.0', None, 100
        )
        feature_flag_metadata: Dict[
            str,
            tuple[str, android_feature_flag_domain.AndroidFeatureFlagState],
        ] = {FEATURE_FLAG_NAME: self.feature_flag_metadata[FEATURE_FLAG_NAME]}
        with self.swap(
            android_feature_flag_registry,
            'ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            feature_flag_metadata,
        ):
            result = android_feature_flag_services.get_evaluated_android_feature_flags(
                '1.2-abcdef-alpha', 'installation'
            )
        self.assertEqual(result, [])

    def test_release_candidate_version_name_is_parsed(self) -> None:
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'final', '0.19', None, 100
        )
        feature_flag_metadata: Dict[
            str,
            tuple[str, android_feature_flag_domain.AndroidFeatureFlagState],
        ] = {
            FEATURE_FLAG_NAME: (
                'Fast language switching.',
                android_feature_flag_domain.AndroidFeatureFlagState.FINAL,
            )
        }
        with self.swap(
            android_feature_flag_registry,
            'ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            feature_flag_metadata,
        ):
            result = android_feature_flag_services.get_evaluated_android_feature_flags(
                '0.19-rc03-alpha-9faec1d609', 'installation'
            )
        self.assertEqual(result, [{FEATURE_FLAG_NAME: True}])

    def test_android_version_name_format_is_parsed(self) -> None:
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'final', '12.5', None, 100
        )
        feature_flag_metadata: Dict[
            str,
            tuple[str, android_feature_flag_domain.AndroidFeatureFlagState],
        ] = {
            FEATURE_FLAG_NAME: (
                'Fast language switching.',
                android_feature_flag_domain.AndroidFeatureFlagState.FINAL,
            )
        }
        with self.swap(
            android_feature_flag_registry,
            'ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            feature_flag_metadata,
        ):
            result = android_feature_flag_services.get_evaluated_android_feature_flags(
                '12.5-5f58b8fbeb-dev', 'installation'
            )
        self.assertEqual(result, [{FEATURE_FLAG_NAME: True}])

    def test_invalid_app_version_name_raises_validation_error(self) -> None:
        with self.assertRaisesRegex(utils.ValidationError, 'Invalid Android'):
            android_feature_flag_services.get_evaluated_android_feature_flags(
                'not-a-version', 'installation'
            )

    def test_unknown_app_version_flavor_raises_validation_error(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid Android app version flavor'
        ):
            android_feature_flag_services.get_evaluated_android_feature_flags(
                '1.2-abcdef-unknown', 'installation'
            )

    def test_missing_flags_have_live_default_values(self) -> None:
        feature_flag_metadata: Dict[
            str,
            tuple[str, android_feature_flag_domain.AndroidFeatureFlagState],
        ] = {
            FEATURE_FLAG_NAME: (
                'Fast language switching.',
                android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
            )
        }
        with self.swap(
            android_feature_flag_registry,
            'ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            feature_flag_metadata,
        ):
            flags = (
                android_feature_flag_services.get_all_android_feature_flags()
            )
        self.assertEqual(len(flags), 1)
        self.assertEqual(
            flags[0].state,
            android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
        )
        self.assertEqual(flags[0].min_app_version, '0.0.0')
        self.assertEqual(flags[0].rollout_percentage, 0)

    def test_get_all_flags_returns_stored_configuration(self) -> None:
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'live', '1.2.3', '2.0.0', 25
        )
        flags = android_feature_flag_services.get_all_android_feature_flags()

        self.assertEqual(len(flags), 1)
        self.assertEqual(flags[0].min_app_version, '1.2.3')
        self.assertEqual(flags[0].max_app_version, '2.0.0')
        self.assertEqual(flags[0].rollout_percentage, 25)

    def test_update_preserves_unprovided_fields_and_invalidates_cache(
        self,
    ) -> None:
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'live', '1.0', '4.0', 25
        )
        android_feature_flag_registry.Registry.get_android_feature_flag(
            FEATURE_FLAG_NAME
        )
        android_feature_flag_services.update_android_feature_flag(
            FEATURE_FLAG_NAME, rollout_percentage=60
        )

        updated_flag = android_feature_flag_registry.Registry.load_feature_flag_from_storage(
            FEATURE_FLAG_NAME
        )
        self.assertEqual(updated_flag.min_app_version, '1.0')
        self.assertEqual(updated_flag.max_app_version, '4.0')
        self.assertEqual(updated_flag.rollout_percentage, 60)
        self.assertEqual(
            android_feature_flag_registry.Registry.get_android_feature_flag(
                FEATURE_FLAG_NAME
            ).rollout_percentage,
            60,
        )

    def test_update_rejects_invalid_rollout_and_version_range(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'rollout percentage'
        ):
            android_feature_flag_services.update_android_feature_flag(
                FEATURE_FLAG_NAME, rollout_percentage=101
            )
        with self.assertRaisesRegex(
            utils.ValidationError, 'Minimum app version cannot exceed'
        ):
            android_feature_flag_services.update_android_feature_flag(
                FEATURE_FLAG_NAME,
                min_app_version='3.0',
                max_app_version='2.0',
            )

    def test_update_rejects_minimum_version_below_default(self) -> None:
        with self.assertRaisesRegex(utils.ValidationError, 'cannot be less'):
            android_feature_flag_services.update_android_feature_flag(
                FEATURE_FLAG_NAME, min_app_version='0.0-alpha'
            )

    def test_update_rejects_final_flags(self) -> None:
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'final', '1.0', None, 100
        )
        with self.assertRaisesRegex(utils.ValidationError, 'is FINAL'):
            android_feature_flag_services.update_android_feature_flag(
                FEATURE_FLAG_NAME, rollout_percentage=50
            )
