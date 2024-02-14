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

from core import feature_flag_list
from core.domain import feature_flag_domain
from core.platform import models

from typing import List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])

FeatureNames = feature_flag_list.FeatureNames
FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE = (
    feature_flag_list.FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE)


class Registry:
    """Registry for all feature flags."""

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
        feature_flag_config_from_storage = (
            cls.load_feature_flag_config_from_storage(name))
        feature_flag_spec_values = (
            FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE.get(name))

        if feature_flag_spec_values is not None:
            feature_flag_spec = feature_flag_domain.FeatureFlagSpec(
                feature_flag_spec_values[0],
                feature_flag_spec_values[1]
            )
        else:
            raise Exception('Feature flag not found: %s.' % name)

        if feature_flag_config_from_storage is not None:
            return feature_flag_domain.FeatureFlag(
                name,
                feature_flag_spec,
                feature_flag_config_from_storage
            )
        else:
            feature_flag_config = feature_flag_domain.FeatureFlagConfig(
                False,
                0,
                [],
                None
            )
            return feature_flag_domain.FeatureFlag(
                name,
                feature_flag_spec,
                feature_flag_config
            )

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
            force_enable_for_all_users: bool. Is feature flag force enabled
                for all the users.
            rollout_percentage: int. The percentage of logged-in users for which
                the feature flag will be enabled.
            user_group_ids: List[str]. The list of ids of UserGroup objects.
        """
        feature_flag = cls.get_feature_flag(name)

        feature_flag.feature_flag_config.set_force_enable_for_all_users(
            force_enable_for_all_users)
        feature_flag.feature_flag_config.set_rollout_percentage(
            rollout_percentage)
        feature_flag.feature_flag_config.set_user_group_ids(user_group_ids)

        cls._update_feature_flag_storage_model(feature_flag)

    @classmethod
    def load_feature_flag_config_from_storage(
        cls, name: str
    ) -> Optional[feature_flag_domain.FeatureFlagConfig]:
        """Loads feature flag config from storage, if not present returns None.

        Args:
            name: str. The name of the feature flag.

        Returns:
            FeatureFlagConfig|None. The loaded instance, None if it's not found
            in storage.
        """
        feature_flag_config_model = config_models.FeatureFlagConfigModel.get(
            name, strict=False)

        if feature_flag_config_model is not None:
            return feature_flag_domain.FeatureFlagConfig(
                feature_flag_config_model.force_enable_for_all_users,
                feature_flag_config_model.rollout_percentage,
                feature_flag_config_model.user_group_ids,
                feature_flag_config_model.last_updated
            )
        else:
            return None

    @classmethod
    def _update_feature_flag_storage_model(
        cls, feature_flag: feature_flag_domain.FeatureFlag
    ) -> None:
        """Updates feature flag storage model.

        Args:
            feature_flag: FeatureFlag. The feature flag domain object.
        """
        feature_flag.feature_flag_config.validate(
            feature_flag.feature_flag_spec.feature_stage)

        model_instance = config_models.FeatureFlagConfigModel.get(
            feature_flag.name, strict=False)
        if model_instance is None:
            model_instance = config_models.FeatureFlagConfigModel.create(
                feature_flag.name,
                feature_flag.feature_flag_config.force_enable_for_all_users,
                feature_flag.feature_flag_config.rollout_percentage,
                feature_flag.feature_flag_config.user_group_ids
            )
            return

        model_instance.force_enable_for_all_users = (
            feature_flag.feature_flag_config.force_enable_for_all_users)
        model_instance.rollout_percentage = (
            feature_flag.feature_flag_config.rollout_percentage)
        model_instance.user_group_ids = (
            feature_flag.feature_flag_config.user_group_ids)
        model_instance.update_timestamps()
        model_instance.put()
