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

import hashlib
import secrets

from core import platform_feature_list
from core import utils
from core.domain import caching_services
from core.domain import feature_flag_domain
from core.domain import feature_flag_registry as registry
from core.platform import models

from typing import Dict, List, Optional, Set

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])

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

    Raises:
        FeatureFlagNotFoundException. Feature flag trying to update does
            not exist.
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

    Raises:
        Exception. Feature flag does not exists.
    """
    feature_flags = []
    features_to_fetch_from_storage = []
    all_feature_flag_dicts = []

    for feature in ALL_FEATURE_FLAGS:
        feature_from_cache = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_FEATURE_FLAG, None, [feature.value]
        ).get(feature.value)
        if feature_from_cache is not None:
            feature_flags.append(feature_from_cache)
        else:
            features_to_fetch_from_storage.append(feature.value)

    features_from_storage = load_feature_flags_from_storage(
        features_to_fetch_from_storage)
    for feature_name, feature in features_from_storage.items():
        if feature is not None:
            feature_flags.append(feature)
        elif (
            feature is None and
            feature_name in registry.Registry.feature_registry
        ):
            feature_flags.append(
                registry.Registry.feature_registry[feature_name])
        else:
            raise Exception('Feature flag not found: %s.' % feature_name)

    for feature in feature_flags:
        all_feature_flag_dicts.append(feature.to_dict())
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_FEATURE_FLAG, None,
            {
                feature.name: feature,
            })

    return all_feature_flag_dicts


def load_feature_flags_from_storage(
    feature_names_list: List[str]
) -> Dict[str, Optional[feature_flag_domain.FeatureFlag]]:
    """Loads feature flags from the storage layer.

    Args:
        feature_names_list: List[str]. The list of feature flag names
            that needs to be fetched from the storage layer.

    Returns:
        feature_name_to_feature_flag_model_dict: Dict[str, FeatureFlag|None].
        Dictionary having key as the feature name and value as the feature
        flag domain model if present in the storage layer otherwise None.
    """
    feature_name_to_feature_flag_model_dict = {}
    feature_models = config_models.FeatureFlagModel.get_multi(
        feature_names_list)

    for feature_model in feature_models:
        if feature_model:
            feature_with_init_settings = registry.Registry.feature_registry[
                feature_model.id]
            last_updated = utils.convert_naive_datetime_to_string(
                feature_model.last_updated)
            feature_name_to_feature_flag_model_dict[feature_model.id] = (
                feature_flag_domain.FeatureFlag.from_dict({
                    'name': feature_with_init_settings.name,
                    'description': feature_with_init_settings.description,
                    'feature_stage': feature_with_init_settings.feature_stage,
                    'force_enable_for_all_users': (
                        feature_model.force_enable_for_all_users),
                    'rollout_percentage': feature_model.rollout_percentage,
                    'user_group_ids': feature_model.user_group_ids,
                    'last_updated': last_updated
                })
            )

    for feature_name in feature_names_list:
        if feature_name not in feature_name_to_feature_flag_model_dict:
            feature_name_to_feature_flag_model_dict[feature_name] = None

    return feature_name_to_feature_flag_model_dict


def is_feature_flag_enabled(
    user_id: Optional[str],
    feature_name: str,
    feature_flag: Optional[feature_flag_domain.FeatureFlag] = None
) -> bool:
    """Returns True if feature is enabled for the given user else False.

    Args:
        user_id: str|None. The id of the user, if logged-out user then None.
        feature_name: str. The name of the feature flag that needs to
            be evaluated.
        feature_flag: FeatureFlag. The feature flag domain model.

    Returns:
        bool. True if the feature is enabled for the given user else False.
    """
    if feature_flag is None:
        feature_flag = registry.Registry.get_feature_flag(feature_name)
    current_server = feature_flag_domain.get_server_mode()

    if (
        current_server == feature_flag_domain.ServerMode.TEST and
        feature_flag.feature_stage == feature_flag_domain.ServerMode.DEV.value
    ):
        return False

    if (
        current_server == feature_flag_domain.ServerMode.PROD and
        feature_flag.feature_stage in (
            feature_flag_domain.ServerMode.DEV.value,
            feature_flag_domain.ServerMode.TEST.value)
    ):
        return False

    if feature_flag.force_enable_for_all_users:
        return True
    if user_id:
        random_bytes = secrets.token_bytes(16)
        salt = feature_name.encode('utf-8') + random_bytes
        hashed_user_id = hashlib.sha256(
            user_id.encode('utf-8') + salt).hexdigest()
        hash_value = int(hashed_user_id, 16)
        mod_result = hash_value % 1000
        threshold = (feature_flag.rollout_percentage / 100) * 1000
        return bool(mod_result < threshold)
    return False


def evaluate_all_feature_flag_values(user_id: Optional[str]) -> Dict[str, bool]:
    """Evaluates and returns the value of feature flags.

    Args:
        user_id: str|None. The id of the user, if logged-out user then None.

    Returns:
        dict. The keys are the feature names and the values are boolean
        results of corresponding flags.
    """
    result_dict = {}
    feature_flag_dicts = get_all_feature_flag_dicts()
    for feature_dict in feature_flag_dicts:
        feature_domain_model = feature_flag_domain.FeatureFlag.from_dict(
            feature_dict)
        feature_status = is_feature_flag_enabled(
            user_id, feature_domain_model.name, feature_domain_model)
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(feature_status, bool)
        result_dict[feature_domain_model.name] = feature_status
    return result_dict
