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

"""Registry for Android feature flags."""

from __future__ import annotations

from core import android_feature_flag_list, utils
from core.domain import android_feature_flag_domain, caching_services
from core.platform import models

from typing import Dict, List, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])

AndroidFeatureFlagNames = android_feature_flag_list.AndroidFeatureFlagNames
ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE = (
    android_feature_flag_list.FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE
)


class Registry:
    """Registry for all Android feature flags."""

    @classmethod
    def _validate_feature_flag_name(cls, name: str) -> None:
        """Raises an exception if the name is not registered."""
        if (
            name
            not in ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE
        ):
            raise Exception('Android feature flag not found: %s.' % name)

    @classmethod
    def get_android_feature_flag(
        cls, name: str
    ) -> android_feature_flag_domain.AndroidFeatureFlagConfig:
        """Returns an Android feature flag configuration.

        Args:
            name: str. Name of the registered Android feature flag.

        Returns:
            AndroidFeatureFlagConfig. The corresponding configuration.

        Raises:
            Exception. The feature flag name is not registered.
        """
        cls._validate_feature_flag_name(name)
        cached_flag = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_ANDROID_FEATURE_FLAG, None, [name]
        ).get(name)
        if cached_flag is not None:
            return cached_flag

        stored_flag = cls.load_feature_flag_from_storage(name)
        if stored_flag is not None:
            flag = stored_flag
        else:
            flag = android_feature_flag_domain.AndroidFeatureFlagConfig(
                ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE[
                    name
                ][1],
                '0.0',
                None,
                0,
            )

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_ANDROID_FEATURE_FLAG,
            None,
            {name: flag},
        )
        return flag

    @classmethod
    def update_feature_flag(
        cls,
        name: str,
        min_app_version: str,
        max_app_version: Optional[str],
        rollout_percentage: int,
    ) -> None:
        """Updates a registered LIVE Android feature flag.

        Args:
            name: str. Name of the feature flag to update.
            min_app_version: str. Minimum Android app version.
            max_app_version: Optional[str]. Maximum Android app version.
            rollout_percentage: int. Percentage rollout from 0 to 100.

        Raises:
            Exception. The feature flag name is not registered.
            ValidationError. The flag is FINAL or the configuration is invalid.
        """
        current_flag = cls.get_android_feature_flag(name)
        if (
            current_flag.state
            != android_feature_flag_domain.AndroidFeatureFlagState.LIVE
        ):
            raise utils.ValidationError(
                'Android feature flag %s is FINAL and cannot be updated.' % name
            )

        updated_flag = android_feature_flag_domain.AndroidFeatureFlagConfig(
            current_flag.state,
            min_app_version,
            max_app_version,
            rollout_percentage,
        )
        updated_flag.validate()

        model = config_models.AndroidFeatureFlagConfigModel.get(
            name, strict=False
        )
        if model is None:
            config_models.AndroidFeatureFlagConfigModel.create(
                name,
                updated_flag.state.value,
                updated_flag.min_app_version,
                updated_flag.max_app_version,
                updated_flag.rollout_percentage,
            )
        else:
            model.state = updated_flag.state.value
            model.min_app_version = updated_flag.min_app_version
            model.max_app_version = updated_flag.max_app_version
            model.rollout_percentage = updated_flag.rollout_percentage
            model.update_timestamps()
            model.put()

        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_ANDROID_FEATURE_FLAG,
            None,
            [name],
        )

    @classmethod
    def load_feature_flag_from_storage(
        cls, name: str
    ) -> Optional[android_feature_flag_domain.AndroidFeatureFlagConfig]:
        """Loads a registered Android feature-flag configuration from storage.

        Args:
            name: str. Name of the feature flag.

        Returns:
            AndroidFeatureFlagConfig|None. Configuration if stored, otherwise
            None.

        Raises:
            Exception. The feature flag name is not registered.
        """
        cls._validate_feature_flag_name(name)
        model = config_models.AndroidFeatureFlagConfigModel.get(
            name, strict=False
        )
        if model is None:
            return None

        return android_feature_flag_domain.AndroidFeatureFlagConfig.from_dict(
            {
                'state': model.state,
                'min_app_version': model.min_app_version,
                'max_app_version': model.max_app_version,
                'rollout_percentage': model.rollout_percentage,
            }
        )

    @classmethod
    def load_feature_flags_from_storage(
        cls, names: List[str]
    ) -> Dict[
        str, Optional[android_feature_flag_domain.AndroidFeatureFlagConfig]
    ]:
        """Loads multiple registered feature flags from storage.

        Args:
            names: List[str]. Names of the feature flags to load.

        Returns:
            Dict[str, AndroidFeatureFlagConfig|None]. Stored configuration for
            each name, or None when no storage entry exists.

        Raises:
            Exception. A feature flag name is not registered.
        """
        for name in names:
            cls._validate_feature_flag_name(name)

        models_by_name = {
            model.id: model
            for model in config_models.AndroidFeatureFlagConfigModel.get_multi(
                names
            )
            if model is not None
        }
        return {
            name: (
                android_feature_flag_domain.AndroidFeatureFlagConfig.from_dict(
                    {
                        'state': models_by_name[name].state,
                        'min_app_version': models_by_name[name].min_app_version,
                        'max_app_version': models_by_name[name].max_app_version,
                        'rollout_percentage': models_by_name[
                            name
                        ].rollout_percentage,
                    }
                )
                if name in models_by_name
                else None
            )
            for name in names
        }

    @classmethod
    def get_all_feature_flag_names(cls) -> List[str]:
        """Returns all registered Android feature-flag names."""
        return list(ANDROID_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE)
