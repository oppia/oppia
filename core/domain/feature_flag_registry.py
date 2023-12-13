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

from core import platform_feature_list
from core import utils
from core.domain import caching_services
from core.domain import feature_flag_domain
from core.platform import models

from typing import Dict, List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])

FeatureNames = platform_feature_list.FeatureNames


class Registry:
    """Registry for all feature flags."""

    # The keys of feature_flag_spec_registry are the feature flags name,
    # and the values are FeatureFlagSpec instances with initial settings
    # defined in this file.
    feature_flag_spec_registry: Dict[
        str, feature_flag_domain.FeatureFlagSpec] = {}

    @classmethod
    def create_feature_flag(
        cls,
        name: FeatureNames,
        description: str,
        feature_stage: feature_flag_domain.FeatureStages,
    ) -> feature_flag_domain.FeatureFlag:
        """Creates, registers and returns a feature flag.

        Args:
            name: str. The name of the feature flag.
            description: str. The description of the feature flag.
            feature_stage: Enum(FeatureStages). The development stage of
                the feature flag.

        Returns:
            feature_flag_domain.FeatureFlag. The FeatureFlag object.

        Raises:
            Exception. Feature flag with the same name already exists.
        """
        if cls.feature_flag_spec_registry.get(name.value):
            raise Exception(
                'Feature flag with name %s already exists.' % name.value)

        feature_flag_spec_domain = (
            feature_flag_domain.FeatureFlagSpec.from_dict({
                'description': description,
                'feature_stage': feature_stage.value
            })
        )
        feature_flag_value_domain = (
            feature_flag_domain.FeatureFlagValue.from_dict({
                'force_enable_for_all_users': False,
                'rollout_percentage': 0,
                'user_group_ids': [],
                'last_updated': None
            })
        )
        feature_flag_spec_domain.validate()
        cls.feature_flag_spec_registry[name.value] = feature_flag_spec_domain

        return feature_flag_domain.FeatureFlag(
            name.value,
            feature_flag_spec_domain,
            feature_flag_value_domain
        )

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
        feature_flag_from_storage = cls.load_feature_flag_from_storage(name)
        if feature_flag_from_storage is not None:
            feature_flag = feature_flag_from_storage
        elif name in cls.feature_flag_spec_registry:
            feature_flag_spec = cls.feature_flag_spec_registry[name]
            feature_flag = feature_flag_domain.FeatureFlag.from_dict({
                'name': name,
                'description': feature_flag_spec.description,
                'feature_stage': feature_flag_spec.feature_stage.value,
                'last_updated': None,
                'force_enable_for_all_users': False,
                'rollout_percentage': 0,
                'user_group_ids': []
            })
        else:
            raise Exception('Feature flag not found: %s.' % name)

        return feature_flag

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

        feature_flag.feature_flag_value.set_force_enable_for_all_users(
            force_enable_for_all_users)
        feature_flag.feature_flag_value.set_rollout_percentage(
            rollout_percentage)
        feature_flag.feature_flag_value.set_user_group_ids(user_group_ids)

        cls._update_feature_flag_storage_model(feature_flag)

    @classmethod
    def load_feature_flag_from_storage(
        cls, name: str
    ) -> Optional[feature_flag_domain.FeatureFlag]:
        """Loads feature flag from storage, if not present returns None.

        Args:
            name: str. The name of the feature flag.

        Returns:
            FeatureFlag|None. The loaded instance, None if it's not found
            in storage.
        """
        feature_flag_value_model = config_models.FeatureFlagModel.get(
            name, strict=False)

        if feature_flag_value_model is not None:
            last_updated = utils.convert_naive_datetime_to_string(
                feature_flag_value_model.last_updated)
            feature_flag_spec = cls.feature_flag_spec_registry[name]
            return feature_flag_domain.FeatureFlag.from_dict({
                'name': feature_flag_value_model.id,
                'description': feature_flag_spec.description,
                'feature_stage': feature_flag_spec.feature_stage.value,
                'force_enable_for_all_users': (
                    feature_flag_value_model.force_enable_for_all_users),
                'rollout_percentage': (
                    feature_flag_value_model.rollout_percentage),
                'user_group_ids': feature_flag_value_model.user_group_ids,
                'last_updated': last_updated
            })
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
        feature_flag.feature_flag_value.validate(
            feature_flag.feature_flag_spec.feature_stage)

        model_instance = config_models.FeatureFlagModel.get(
            feature_flag.name, strict=False)
        if model_instance is None:
            model_instance = config_models.FeatureFlagModel.create(
                feature_flag.name,
                feature_flag.feature_flag_value.force_enable_for_all_users,
                feature_flag.feature_flag_value.rollout_percentage,
                feature_flag.feature_flag_value.user_group_ids
            )
            return

        model_instance.force_enable_for_all_users = (
            feature_flag.feature_flag_value.force_enable_for_all_users)
        model_instance.rollout_percentage = (
            feature_flag.feature_flag_value.rollout_percentage)
        model_instance.user_group_ids = (
            feature_flag.feature_flag_value.user_group_ids)
        model_instance.update_timestamps()
        model_instance.put()


feature_flag_name_enum_to_description = {
    FeatureNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS: (
        'This is a dummy feature flag for the e2e tests.'
    ),
    FeatureNames.END_CHAPTER_CELEBRATION: (
        'This flag is for the end chapter celebration feature.'
    ),
    FeatureNames.CHECKPOINT_CELEBRATION: (
        'This flag is for the checkpoint celebration feature.'
    ),
    FeatureNames.CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS: (
        'This flag enables showing per-contributor accomplishments on the '
        'contributor dashboard.'
    ),
    FeatureNames.ANDROID_BETA_LANDING_PAGE: (
        'This flag is for Android beta promo landing page.'
    ),
    FeatureNames.BLOG_PAGES: (
        'This flag is for blog home page, blog author profile page and blog '
        'post page.'
    ),
    FeatureNames.DIAGNOSTIC_TEST: (
        'This flag is for the diagnostic test functionality.'
    ),
    FeatureNames.SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW: (
        'This flag is for serial chapter launch feature and making changes '
        'only in the curriculum admin view.'
    ),
    FeatureNames.SERIAL_CHAPTER_LAUNCH_LEARNER_VIEW: (
        'This flag is for serial chapter launch feature and making changes '
        'only in the learner view.'
    ),
    FeatureNames.SHOW_REDESIGNED_LEARNER_DASHBOARD: (
        'This flag is to show redesigned learner dashboard.'
    ),
    FeatureNames.SHOW_TRANSLATION_SIZE: (
        'This flag is to show translation size on translation cards in '
        'contributor dashboard.'
    ),
    FeatureNames.SHOW_FEEDBACK_UPDATES_IN_PROFILE_PIC_DROPDOWN: (
        'This flag is to show feedback updates in the '
        'profile pic drop-down menu.'
    ),
    FeatureNames.CD_ADMIN_DASHBOARD_NEW_UI: (
        'This flag is to show new contributor admin dashboard.'
    ),
    FeatureNames.IS_IMPROVEMENTS_TAB_ENABLED: (
        'Exposes the Improvements Tab for creators in the exploration editor.'
    ),
    FeatureNames.LEARNER_GROUPS_ARE_ENABLED: 'Enable learner groups feature'
}

for feature_flag_name_enum_in_dev in platform_feature_list.DEV_FEATURES_LIST:
    Registry.create_feature_flag(
        feature_flag_name_enum_in_dev,
        feature_flag_name_enum_to_description[feature_flag_name_enum_in_dev],
        feature_flag_domain.FeatureStages.DEV
    )

for feature_flag_name_enum_in_test in platform_feature_list.TEST_FEATURES_LIST:
    Registry.create_feature_flag(
        feature_flag_name_enum_in_test,
        feature_flag_name_enum_to_description[feature_flag_name_enum_in_test],
        feature_flag_domain.FeatureStages.TEST
    )

for feature_flag_name_enum_in_prod in platform_feature_list.PROD_FEATURES_LIST:
    Registry.create_feature_flag(
        feature_flag_name_enum_in_prod,
        feature_flag_name_enum_to_description[feature_flag_name_enum_in_prod],
        feature_flag_domain.FeatureStages.PROD
    )
