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

"""Service functions for Android feature flags."""

from __future__ import annotations

import hashlib

from core import utils
from core.domain import (
    android_feature_flag_domain,
    android_feature_flag_registry,
    android_platform_parameter_domain,
)

import packaging.version
from typing import Dict, List, Optional

DEFAULT_MIN_APP_VERSION = '0.0'
GA_APP_VERSION_FLAVOR = android_platform_parameter_domain.ANDROID_PLATFORM_PARAMETER_ALLOWED_APP_VERSION_FLAVORS[
    3
]
AndroidFeatureFlagConfig = android_feature_flag_domain.AndroidFeatureFlagConfig
AndroidFeatureFlagState = android_feature_flag_domain.AndroidFeatureFlagState


def _parse_app_version_name(
    app_version_name: str,
) -> tuple[str, str]:
    """Returns the base version and flavor encoded in an Android version name.

    Args:
        app_version_name: str. The Android app version string.

    Returns:
        tuple[str, str]. A 2-tuple of the app version and its flavor.

    Raises:
        ValidationError. The supplied app version name is invalid or has an
            unsupported flavor.
    """
    match = android_platform_parameter_domain.APP_VERSION_WITH_SUFFIX_REGEXP.fullmatch(
        app_version_name
    )
    if match is None:
        raise utils.ValidationError(
            'Invalid Android app version: %s.' % app_version_name
        )

    app_version = match.group(1)
    flavor = match.group(2) or match.group(3)
    if (
        flavor is None
        or flavor
        not in android_platform_parameter_domain.ALLOWED_APP_VERSION_FLAVORS
    ):
        raise utils.ValidationError(
            'Invalid Android app version flavor: %s.' % flavor
        )
    return app_version, flavor


def _is_rollout_enabled(
    installation_id: str, feature_flag_name: str, rollout_percentage: int
) -> bool:
    """Checks whether an installation is included in a rollout for a flag.

    Args:
        installation_id: str. The unique installation identifier.
        feature_flag_name: str. The Android feature flag name.
        rollout_percentage: int. The percentage of installations to include.

    Returns:
        bool. True if the installation is within the rollout percentage.
    """
    unique_feature_install_id = (
        '%s:%s' % (installation_id, feature_flag_name)
    ).encode('utf-8')
    sha1_hex = hashlib.sha1(unique_feature_install_id).hexdigest()
    candidate_id = int(sha1_hex[:8], 16)
    return candidate_id % 100 < rollout_percentage


def get_evaluated_android_feature_flags(
    app_version_name: str, installation_id: str
) -> List[Dict[str, bool]]:
    """Returns all applicable Android feature flags with evaluated values.

    Args:
        app_version_name: str. The Android app version string.
        installation_id: str. The installation identifier used for rollout
            evaluation.

    Returns:
        list(dict(str, bool)). A list of feature-name-to-enabled-value mappings
        for the flags applicable to the given app version and installation.
    """
    app_version, flavor = _parse_app_version_name(app_version_name)
    parsed_app_version = packaging.version.Version(app_version)
    feature_flag_names = (
        android_feature_flag_registry.Registry.get_all_feature_flag_names()
    )
    feature_flag_dict = (
        android_feature_flag_registry.Registry.load_feature_flags_from_storage(
            feature_flag_names
        )
    )

    evaluated_flags: List[Dict[str, bool]] = []
    for feature_flag_name in feature_flag_names:
        feature_flag = feature_flag_dict[feature_flag_name]
        if feature_flag is None:
            feature_flag = AndroidFeatureFlagConfig(
                AndroidFeatureFlagState.LIVE,
                DEFAULT_MIN_APP_VERSION,
                None,
                0,
            )

        if parsed_app_version < packaging.version.Version(
            feature_flag.min_app_version
        ):
            continue
        if (
            feature_flag.max_app_version is not None
            and parsed_app_version
            > packaging.version.Version(feature_flag.max_app_version)
        ):
            continue
        if (
            feature_flag.state == AndroidFeatureFlagState.LIVE
            and flavor != GA_APP_VERSION_FLAVOR
        ):
            continue

        is_enabled = feature_flag.state == AndroidFeatureFlagState.FINAL
        if feature_flag.state == AndroidFeatureFlagState.LIVE:
            is_enabled = _is_rollout_enabled(
                installation_id,
                feature_flag_name,
                feature_flag.rollout_percentage,
            )
        evaluated_flags.append({feature_flag_name: is_enabled})

    return evaluated_flags


def update_android_feature_flag(
    feature_flag_name: str,
    min_app_version: Optional[str] = None,
    max_app_version: Optional[str] = None,
    rollout_percentage: Optional[int] = None,
) -> None:
    """Updates the provided fields for a registered LIVE Android feature flag.

    Args:
        feature_flag_name: str. The name of the Android feature flag to update.
        min_app_version: str|None. The minimum Android app version required for
            the flag to be active.
        max_app_version: str|None. The maximum Android app version allowed for
            the flag to be active.
        rollout_percentage: int|None. The percentage of installations for which
            the live flag is enabled.

    Raises:
        ValidationError. The feature flag is not LIVE, or the new minimum app
            version is invalid.
    """
    current_flag = (
        android_feature_flag_registry.Registry.get_android_feature_flag(
            feature_flag_name
        )
    )
    if current_flag.state != AndroidFeatureFlagState.LIVE:
        raise utils.ValidationError(
            'Android feature flag %s is FINAL and cannot be updated.'
            % feature_flag_name
        )

    updated_min_app_version = (
        min_app_version
        if min_app_version is not None
        else current_flag.min_app_version
    )
    updated_flag = AndroidFeatureFlagConfig(
        current_flag.state,
        updated_min_app_version,
        (
            max_app_version
            if max_app_version is not None
            else current_flag.max_app_version
        ),
        (
            rollout_percentage
            if rollout_percentage is not None
            else current_flag.rollout_percentage
        ),
    )
    updated_flag.validate()
    if packaging.version.Version(
        updated_flag.min_app_version
    ) < packaging.version.Version(DEFAULT_MIN_APP_VERSION):
        raise utils.ValidationError(
            'Minimum app version cannot be less than %s.'
            % DEFAULT_MIN_APP_VERSION
        )

    android_feature_flag_registry.Registry.update_feature_flag(
        feature_flag_name,
        updated_flag.min_app_version,
        updated_flag.max_app_version,
        updated_flag.rollout_percentage,
    )


def get_all_android_feature_flags() -> List[AndroidFeatureFlagConfig]:
    """Returns all Android feature-flag configurations with defaults applied.

    Returns:
        list(AndroidFeatureFlagConfig). The feature flag configurations for all
        registered Android feature flags, defaulting any missing values.
    """
    feature_flag_names = (
        android_feature_flag_registry.Registry.get_all_feature_flag_names()
    )
    feature_flag_dict = (
        android_feature_flag_registry.Registry.load_feature_flags_from_storage(
            feature_flag_names
        )
    )
    return [
        (
            feature_flag
            if feature_flag is not None
            else AndroidFeatureFlagConfig(
                AndroidFeatureFlagState.LIVE,
                DEFAULT_MIN_APP_VERSION,
                None,
                0,
            )
        )
        for feature_flag in feature_flag_dict.values()
    ]
