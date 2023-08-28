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

"""Registry for feature flags."""

from __future__ import annotations

import datetime
import enum

from core.domain import caching_services
from core.domain import feature_flag_domain
from core.platform import models

from typing import Dict, List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])


class Registry:
    """Registry for all feature flags."""

    # The keys of feature_registry are the feature names, and the values
    # are FeatureFlag instances with initial settings defined in this file.
    feature_registry: Dict[str, feature_flag_domain.FeatureFlag] = {}

    @classmethod
    def create_feature_flag(
        cls,
        name: enum.Enum,
        description: str,
        feature_stage: feature_flag_domain.FeatureStages,
    ) -> feature_flag_domain.FeatureFlag:
        """Creates, registers and returns a feature flag.

        Args:
            name: str. The name of the feature flag.
            description: str. The description of the feature flag.
            feature_stage: Enum(FeatureStages). The development stage of
                the feature.

        Returns:
            feature_flag_domain.FeatureFlag. The FeatureFlag object.
        """
        feature_flag_dict: feature_flag_domain.FeatureFlagDict = {
            'name': name.value,
            'description': description,
            'feature_stage': feature_stage.value,
            'force_enable_for_all_users': False,
            'rollout_percentage': 0,
            'user_group_ids': [],
            'last_updated': datetime.datetime.now(
                datetime.timezone.utc).strftime("%B %d, %Y")
        }
        feature = feature_flag_domain.FeatureFlag.from_dict(feature_flag_dict)
        feature.validate()
        if cls.feature_registry.get(feature.name):
            raise Exception(
                'Feature flag with name %s already exists.' % feature.name)
        cls.feature_registry[feature.name] = feature
        return feature

    @classmethod
    def get_feature_flag(cls, name: str) -> feature_flag_domain.FeatureFlag:
        """Returns the instance of the specified name of the feature flag.

        Args:
            name: str. The name of the feature flag.

        Returns:
            FeatureFlag. The instance of the specified feature flag.

        Raises:
            Exception. The given name of the feature flag doesn't exist.
        """
        feature_from_cache = cls.load_feature_flag_from_memcache(name)
        if feature_from_cache is not None:
            return feature_from_cache

        feature_from_storage = cls.load_feature_flag_from_storage(name)
        if feature_from_storage is not None:
            feature = feature_from_storage
        elif name in cls.feature_registry:
            feature = cls.feature_registry[name]
        else:
            raise Exception('Feature flag not found: %s.' % name)

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_FEATURE_FLAG, None,
            {
                name: feature,
            })
        return feature

    @classmethod
    def update_feature_flag(
        cls,
        name: str,
        force_enable_for_all_users: bool,
        rollout_percentage: int,
        user_group_ids: List[str],
    ) -> None:
        """Updates the feature flag.

        Args:
            name: str. The name of the feature flag to update.
            force_enable_for_all_users: bool. Is feature force enabled
                for all the users.
            rollout_percentage: int. The percentage of logged-in users for which
                the feature will be enabled.
            user_group_ids: List[str]. The list of ids of UserGroup objects.
        """
        feature = cls.get_feature_flag(name)

        # Create a temporary feature instance with new values for validation,
        # if the new values are invalid, an exception will be raised in
        # validate() method.
        feature_flag_dict = feature.to_dict()
        feature_flag_dict['force_enable_for_all_users'] = (
            force_enable_for_all_users)
        feature_flag_dict['rollout_percentage'] = rollout_percentage
        feature_flag_dict['user_group_ids'] = user_group_ids
        updated_feature = feature.from_dict(feature_flag_dict)
        updated_feature.validate()

        model_instance = cls._to_feature_flag_model(feature)
        model_instance.force_enable_for_all_users = force_enable_for_all_users
        model_instance.rollout_percentage = rollout_percentage
        model_instance.user_group_ids = user_group_ids
        model_instance.update_timestamps()
        model_instance.put()

        feature.set_force_enable_for_all_users(force_enable_for_all_users)
        feature.set_rollout_percentage(rollout_percentage)
        feature.set_user_group_ids(user_group_ids)
        updated_model_instance = config_models.FeatureFlagModel.get(
            feature.name, strict=False)
        last_updated = updated_model_instance.last_updated.strftime("%B %d, %Y")
        feature.set_last_updated(last_updated)

        cls.feature_registry[feature.name] = feature

        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_FEATURE_FLAG, None, [name])

    @classmethod
    def load_feature_flag_from_storage(
        cls, name: str
    ) -> Optional[feature_flag_domain.FeatureFlag]:
        """Loads feature flag from storage.

        Args:
            name: str. The name of the feature flag.

        Returns:
            FeatureFlag|None. The loaded instance, None if it's not found
            in storage.
        """
        feature_model = config_models.FeatureFlagModel.get(
            name, strict=False)

        if feature_model:
            feature_with_init_settings = cls.feature_registry[name]
            return feature_flag_domain.FeatureFlag.from_dict({
                'name': feature_with_init_settings.name,
                'description': feature_with_init_settings.description,
                'feature_stage': feature_with_init_settings.feature_stage,
                'force_enable_for_all_users': (
                    feature_model.force_enable_for_all_users),
                'rollout_percentage': feature_model.rollout_percentage,
                'user_group_ids': feature_model.user_group_ids,
                'last_updated': feature_model.last_updated.strftime("%B %d, %Y")
            })
        else:
            return None

    @classmethod
    def load_feature_flag_from_memcache(
        cls, name: str
    ) -> Optional[feature_flag_domain.FeatureFlag]:
        """Loads cached feature flag from memcache.

        Args:
            name: str. The name of the feature flag.

        Returns:
            FeatureFlag|None. The loaded instance, None if it's not found
            in cache.
        """
        cached_feature = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_FEATURE_FLAG, None, [name]
        ).get(name)
        return cached_feature

    @classmethod
    def _to_feature_flag_model(
        cls, feature: feature_flag_domain.FeatureFlag
    ) -> config_models.FeatureFlagModel:
        """Returns the feature flag model corresponding to the given
        domain object.

        Args:
            feature: FeatureFlag. The feature flag domain object.

        Returns:
            FeatureFlagModel. The corresponding storage model.
        """
        model_instance = config_models.FeatureFlagModel.get(
            feature.name, strict=False)
        if model_instance is None:
            model_instance = config_models.FeatureFlagModel.create(
                feature.name,
                feature.force_enable_for_all_users,
                feature.rollout_percentage,
                feature.user_group_ids
            )
        return model_instance
