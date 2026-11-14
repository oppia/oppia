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

"""Tests for the Android feature-flag registry."""

from __future__ import annotations

from core import android_feature_flag_list, utils
from core.domain import android_feature_flag_domain, caching_services
from core.domain import android_feature_flag_registry as registry
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])

FEATURE_FLAG_NAME = (
    android_feature_flag_list.AndroidFeatureFlagNames.FAST_LANGUAGE_SWITCHING_IN_LESSON.value
)


class AndroidFeatureFlagRegistryTests(test_utils.GenericTestBase):
    """Tests for Android feature-flag registry methods."""

    def setUp(self) -> None:
        super().setUp()
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_ANDROID_FEATURE_FLAG,
            None,
            [FEATURE_FLAG_NAME],
        )

    def test_get_flag_returns_registered_default_and_caches_it(self) -> None:
        flag = registry.Registry.get_android_feature_flag(FEATURE_FLAG_NAME)
        self.assertEqual(
            flag.state,
            android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
        )
        self.assertEqual(flag.min_app_version, '0.0')
        self.assertIsNone(flag.max_app_version)
        self.assertEqual(flag.rollout_percentage, 0)

        def fail_if_storage_is_read(
            _: type[registry.Registry], name: str
        ) -> None:
            self.assertEqual(name, FEATURE_FLAG_NAME)
            self.fail('Storage should not be read on a cache hit.')

        with self.swap(
            registry.Registry,
            'load_feature_flag_from_storage',
            classmethod(fail_if_storage_is_read),
        ):
            cached_flag = registry.Registry.get_android_feature_flag(
                FEATURE_FLAG_NAME
            )
        self.assertEqual(cached_flag.to_dict(), flag.to_dict())

    def test_get_flag_loads_storage_config(self) -> None:
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'live', '12.9', '13.0', 30
        )

        flag = registry.Registry.get_android_feature_flag(FEATURE_FLAG_NAME)

        self.assertEqual(flag.min_app_version, '12.9')
        self.assertEqual(flag.max_app_version, '13.0')
        self.assertEqual(flag.rollout_percentage, 30)

    def test_get_unregistered_flag_raises_exception(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Android feature flag not found: unknown_flag'
        ):
            registry.Registry.get_android_feature_flag('unknown_flag')

    def test_load_storage_returns_none_for_missing_flag(self) -> None:
        self.assertIsNone(
            registry.Registry.load_feature_flag_from_storage(FEATURE_FLAG_NAME)
        )

    def test_load_multiple_flags_preserves_missing_entries(self) -> None:
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'live', '0.32', None, 25
        )
        secondary_name = 'registered_but_not_stored'
        feature_flag_metadata = dict(
            registry.ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE
        )
        feature_flag_metadata[secondary_name] = (
            'A registered Android feature flag.',
            android_feature_flag_domain.AndroidFeatureFlagState.LIVE,
        )
        with self.swap(
            registry,
            'ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE',
            feature_flag_metadata,
        ):
            flags = registry.Registry.load_feature_flags_from_storage(
                [FEATURE_FLAG_NAME, secondary_name]
            )

        self.assertEqual(flags[FEATURE_FLAG_NAME].min_app_version, '0.32')
        self.assertEqual(flags[FEATURE_FLAG_NAME].rollout_percentage, 25)
        self.assertIsNone(flags[secondary_name])

    def test_load_unregistered_flag_raises_exception(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Android feature flag not found: unknown_flag'
        ):
            registry.Registry.load_feature_flag_from_storage('unknown_flag')
        with self.assertRaisesRegex(
            Exception, 'Android feature flag not found: unknown_flag'
        ):
            registry.Registry.load_feature_flags_from_storage(['unknown_flag'])

    def test_update_creates_storage_and_invalidates_cache(self) -> None:
        registry.Registry.get_android_feature_flag(FEATURE_FLAG_NAME)

        registry.Registry.update_feature_flag(
            FEATURE_FLAG_NAME, '1.5', None, 60
        )

        stored_flag = registry.Registry.load_feature_flag_from_storage(
            FEATURE_FLAG_NAME
        )
        self.assertIsNotNone(stored_flag)
        self.assertEqual(stored_flag.min_app_version, '1.5')
        self.assertEqual(stored_flag.rollout_percentage, 60)
        self.assertEqual(
            registry.Registry.get_android_feature_flag(
                FEATURE_FLAG_NAME
            ).rollout_percentage,
            60,
        )

    def test_update_existing_storage(self) -> None:
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'live', '1.0', None, 25
        )

        registry.Registry.update_feature_flag(
            FEATURE_FLAG_NAME, '2.0', '3.0', 75
        )

        stored_flag = registry.Registry.load_feature_flag_from_storage(
            FEATURE_FLAG_NAME
        )
        self.assertEqual(stored_flag.min_app_version, '2.0')
        self.assertEqual(stored_flag.max_app_version, '3.0')
        self.assertEqual(stored_flag.rollout_percentage, 75)

    def test_final_flag_cannot_be_updated(self) -> None:
        config_models.AndroidFeatureFlagConfigModel.create(
            FEATURE_FLAG_NAME, 'final', '1.0', None, 100
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'is FINAL and cannot be updated'
        ):
            registry.Registry.update_feature_flag(
                FEATURE_FLAG_NAME, '2.0', None, 100
            )

    def test_invalid_update_is_not_saved(self) -> None:
        with self.assertRaisesRegex(
            utils.ValidationError, 'rollout percentage'
        ):
            registry.Registry.update_feature_flag(
                FEATURE_FLAG_NAME, '1.0', None, 101
            )

        self.assertIsNone(
            registry.Registry.load_feature_flag_from_storage(FEATURE_FLAG_NAME)
        )

    def test_update_unregistered_flag_raises_exception(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Android feature flag not found: unknown_flag'
        ):
            registry.Registry.update_feature_flag(
                'unknown_flag', '1.0', None, 50
            )

    def test_get_all_feature_flag_names_returns_registered_names(self) -> None:
        self.assertEqual(
            registry.Registry.get_all_feature_flag_names(),
            [FEATURE_FLAG_NAME],
        )
