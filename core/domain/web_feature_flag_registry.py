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

"""Registry for web feature flags."""

from __future__ import annotations

from core import web_feature_flag_list
from core.domain import web_feature_flag_domain
from core.platform import models

from typing import List, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])

FeatureNames = web_feature_flag_list.FeatureNames
WEB_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE = (
    web_feature_flag_list.WEB_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE
)


class Registry:
    """Registry for all web feature flags."""

    @classmethod
    def get_feature_flag(cls, name: str) -> web_feature_flag_domain.FeatureFlag:
        """Returns the instance of the specified name of the feature flag.

        Args:
            name: str. The name of the feature flag.

        Returns:
            FeatureFlag. The instance of the specified feature flag.

        Raises:
            Exception. The given name of the feature flag doesn't exist.
        """
        web_feature_flag_config_from_storage = (
            cls.load_web_feature_flag_config_from_storage(name)
        )
        web_feature_flag_spec_values = (
            WEB_FEATURE_FLAG_NAME_TO_DESCRIPTION_AND_FEATURE_STAGE.get(name)
        )

        if web_feature_flag_spec_values is not None:
            web_feature_flag_spec = web_feature_flag_domain.WebFeatureFlagSpec(
                web_feature_flag_spec_values[0], web_feature_flag_spec_values[1]
            )
        else:
            raise Exception('Feature flag not found: %s.' % name)

        if web_feature_flag_config_from_storage is not None:
            return web_feature_flag_domain.FeatureFlag(
                name,
                web_feature_flag_spec,
                web_feature_flag_config_from_storage,
            )
        else:
            web_feature_flag_config = (
                web_feature_flag_domain.WebFeatureFlagConfig(False, 0, [], None)
            )
            return web_feature_flag_domain.FeatureFlag(
                name, web_feature_flag_spec, web_feature_flag_config
            )

    @classmethod
    def update_web_feature_flag(
        cls,
        name: str,
        force_enable_for_all_users: bool,
        rollout_percentage: int,
        user_group_ids: List[str],
    ) -> None:
        """Updates the web feature flag.

        Args:
            name: str. The name of the web feature flag to update.
            force_enable_for_all_users: bool. Is feature flag force enabled
                for all the users.
            rollout_percentage: int. The percentage of logged-in users for which
                the feature flag will be enabled.
            user_group_ids: List[str]. The list of ids of UserGroup objects.
        """
        web_feature_flag = cls.get_feature_flag(name)

        web_feature_flag.web_feature_flag_config.set_force_enable_for_all_users(
            force_enable_for_all_users
        )
        web_feature_flag.web_feature_flag_config.set_rollout_percentage(
            rollout_percentage
        )
        web_feature_flag.web_feature_flag_config.set_user_group_ids(
            user_group_ids
        )

        cls._update_web_feature_flag_storage_model(web_feature_flag)

    @classmethod
    def load_web_feature_flag_config_from_storage(
        cls, name: str
    ) -> Optional[web_feature_flag_domain.WebFeatureFlagConfig]:
        """Loads web feature flag config from storage, if not present returns None.

        Args:
            name: str. The name of the web feature flag.

        Returns:
            WebFeatureFlagConfig|None. The loaded instance, None if it's not found
            in storage.
        """
        web_feature_flag_config_model = (
            config_models.WebFeatureFlagConfigModel.get(name, strict=False)
        )

        if web_feature_flag_config_model is not None:
            return web_feature_flag_domain.WebFeatureFlagConfig(
                web_feature_flag_config_model.force_enable_for_all_users,
                web_feature_flag_config_model.rollout_percentage,
                web_feature_flag_config_model.user_group_ids,
                web_feature_flag_config_model.last_updated,
            )
        else:
            return None

    @classmethod
    def _update_web_feature_flag_storage_model(
        cls, web_feature_flag: web_feature_flag_domain.FeatureFlag
    ) -> None:
        """Updates web feature flag storage model.

        Args:
            web_feature_flag: FeatureFlag. The feature flag domain object.
        """
        web_feature_flag.web_feature_flag_config.validate(
            web_feature_flag.web_feature_flag_spec.feature_stage
        )

        model_instance = config_models.WebFeatureFlagConfigModel.get(
            web_feature_flag.name, strict=False
        )
        if model_instance is None:
            model_instance = config_models.WebFeatureFlagConfigModel.create(
                web_feature_flag.name,
                web_feature_flag.web_feature_flag_config.force_enable_for_all_users,
                web_feature_flag.web_feature_flag_config.rollout_percentage,
                web_feature_flag.web_feature_flag_config.user_group_ids,
            )
            return

        model_instance.force_enable_for_all_users = (
            web_feature_flag.web_feature_flag_config.force_enable_for_all_users
        )
        model_instance.rollout_percentage = (
            web_feature_flag.web_feature_flag_config.rollout_percentage
        )
        model_instance.user_group_ids = (
            web_feature_flag.web_feature_flag_config.user_group_ids
        )
        model_instance.update_timestamps()
        model_instance.put()
