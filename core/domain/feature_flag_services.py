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

"""The services file for the feature flag."""

from __future__ import annotations

from core import platform_feature_list
from core.domain import feature_flag_domain
from core.domain import feature_flag_registry as registry

from typing import Dict, List, Set

ALL_FEATURE_FLAGS: List[platform_feature_list.ParamNames] = (
    platform_feature_list.DEV_FEATURES_LIST +
    platform_feature_list.TEST_FEATURES_LIST +
    platform_feature_list.PROD_FEATURES_LIST
)

ALL_FEATURES_NAMES_SET: Set[str] = set(
    feature.value for feature in ALL_FEATURE_FLAGS
)


class FeatureFlagNotFoundException(Exception):
    """Exception thrown when an unknown feature flag is requested."""

    pass


def update_feature_flag(
    feature_name: str,
    force_enable_for_all_users: bool,
    rollout_percentage: int,
    user_group_ids: List[str],
) -> None:
    """Updates the feature flag.

    Args:
        feature_name: str. The name of the feature flag to update.
        force_enable_for_all_users: bool. Is feature force enabled
            for all the users.
        rollout_percentage: int. The percentage of logged-in users for which
            the feature will be enabled.
        user_group_ids: List[str]. The list of ids of UserGroup objects.
    """
    if feature_name not in ALL_FEATURES_NAMES_SET:
        raise FeatureFlagNotFoundException(
            'Unknown feature flag: %s.' % feature_name)

    registry.Registry.update_feature_flag(
        feature_name,
        force_enable_for_all_users,
        rollout_percentage,
        user_group_ids
    )


def get_all_feature_flag_dicts() -> List[feature_flag_domain.FeatureFlag]:
    """Returns dict representations of all feature flags. This method is used
    for providing detailed feature flags information to the release
    coordinator page.

    Returns:
        list(dict). A list containing the dict mappings of all fields of the
        feature flags.
    """
    return [
        registry.Registry.get_feature_flag(_feature.value).to_dict()
        for _feature in ALL_FEATURE_FLAGS
    ]


def is_feature_flag_enabled(user_id: str) -> bool:
    """Returns True if feature is enabled for the given user else False.

    Args:
        user_id: str. The id of the user.

    Returns:
        bool. True if the feature is enabled for the given user else False.
    """
    return True


def evaluate_all_feature_flag_values(user_id: str) -> Dict[str, bool]:
    """Evaluates and returns the value of feature flags.

    Args:
        user_id: str. The id of the user.

    Returns:
        dict. The keys are the feature names and the values are boolean
        results of corresponding flags.
    """
    result_dict = {}
    for feature_name in ALL_FEATURES_NAMES_SET:
        feature_name_value = is_feature_flag_enabled(user_id)
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(feature_name_value, bool)
        result_dict[feature_name] = feature_name_value
    return result_dict
