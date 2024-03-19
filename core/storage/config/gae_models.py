# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Models relating to configuration properties and platform parameters."""

from __future__ import annotations

from core.platform import models
import core.storage.base_model.gae_models as base_models

from typing import Dict, List

MYPY = False
if MYPY: # pragma: no cover
    # Here, we are importing 'platform_parameter_domain' only for type checking.
    from core.domain import platform_parameter_domain  # pylint: disable=invalid-import # isort:skip
    from mypy_imports import base_models
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class PlatformParameterSnapshotMetadataModel(
        base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a platform parameter snapshot."""

    pass


class PlatformParameterSnapshotContentModel(
        base_models.BaseSnapshotContentModel):
    """Storage model for the content for a platform parameter snapshot."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE


class PlatformParameterModel(base_models.VersionedModel):
    """A class that represents a named dynamic platform parameter.
    This model only stores fields that can be updated in run time.

    The id is the name of the parameter.
    """

    SNAPSHOT_METADATA_CLASS = PlatformParameterSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = PlatformParameterSnapshotContentModel

    rules = datastore_services.JsonProperty(repeated=True)
    rule_schema_version = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    default_value = datastore_services.JsonProperty()

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """PlatformParameterModel is not related to users."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'rules': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'rule_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'default_value': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def create(
        cls,
        param_name: str,
        rule_dicts: List[platform_parameter_domain.PlatformParameterRuleDict],
        rule_schema_version: int,
        default_value: platform_parameter_domain.PlatformDataTypes
    ) -> PlatformParameterModel:
        """Creates a PlatformParameterModel instance.

        Args:
            param_name: str. The name of the parameter, which is immutable.
            rule_dicts: list(dict). List of dict representation of
                PlatformParameterRule objects, which have the following
                structure:
                    - value_when_matched: *. The result of the rule when it's
                        matched.
                    - filters: list(dict). List of dict representation of
                        PlatformParameterFilter objects, having the following
                        structure:
                            - type: str. The type of the filter.
                            - conditions: list((str, str)). Each element of the
                                list is a 2-tuple (op, value), where op is the
                                operator for comparison and value is the value
                                used for comparison.
            rule_schema_version: int. The schema version for the rule dicts.
            default_value: PlatformDataTypes. The default value of the platform
                parameter.

        Returns:
            PlatformParameterModel. The created PlatformParameterModel
            instance.
        """
        return cls(
            id=param_name,
            rules=rule_dicts,
            rule_schema_version=rule_schema_version,
            default_value=default_value)


class FeatureFlagConfigModel(base_models.BaseModel):
    """A class that represents named dynamic feature-flag.
    This model only stores fields that can be updated in run time.

    The id is the name of the feature-flag.
    """

    # Whether the feature flag is force enabled for all the users.
    force_enable_for_all_users = datastore_services.BooleanProperty(
        default=False, indexed=True)
    # The percentage of logged-in users for which the feature flag will
    # be enabled. The value of this field should be between 0 and 100.
    rollout_percentage = datastore_services.IntegerProperty(
        default=0, indexed=True)
    # A list of IDs of user groups for which the feature flag will be enabled.
    user_group_ids = datastore_services.StringProperty(repeated=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """FeatureFlagConfigModel is not related to users."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'force_enable_for_all_users': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'rollout_percentage': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'user_group_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def create(
        cls,
        feature_flag_name: str,
        force_enable_for_all_users: bool,
        rollout_percentage: int,
        user_group_ids: List[str]
    ) -> FeatureFlagConfigModel:
        """Creates FeatureFlagConfigModel instance.

        Args:
            feature_flag_name: str. The name of the feature-flag.
            force_enable_for_all_users: bool. Whether to force-enable the
                feature-flag for all the users.
            rollout_percentage: int. The defined percentage of logged-in
                users for which the feature should be enabled.
            user_group_ids: List[str]. The list of ids of UserGroup objects.

        Returns:
            FeatureFlagConfigModel. The created FeatureFlagConfigModel instance.
        """
        feature_flag_entity = cls(
            id=feature_flag_name,
            force_enable_for_all_users=force_enable_for_all_users,
            rollout_percentage=rollout_percentage,
            user_group_ids=user_group_ids)
        feature_flag_entity.update_timestamps()
        feature_flag_entity.put()
        return feature_flag_entity
