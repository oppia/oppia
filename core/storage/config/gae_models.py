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

from typing import Any, Dict, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class ConfigPropertySnapshotMetadataModel(
        base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a config property snapshot."""

    pass


class ConfigPropertySnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content for a config property snapshot."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE


class ConfigPropertyModel(base_models.VersionedModel):
    """A class that represents a named configuration property.

    The id is the name of the property.
    """

    SNAPSHOT_METADATA_CLASS = ConfigPropertySnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = ConfigPropertySnapshotContentModel

    # The property value.
    value = datastore_services.JsonProperty(indexed=False)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """ConfigPropertyModel is not related to users."""
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
            'value': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    # TODO(#13523): Change 'commit_cmds' to domain object/TypedDict to
    # remove Any from type-annotation below.
    # We have ignored [override] here because the signature of this method
    # doesn't match with VersionedModel.commit().
    # https://mypy.readthedocs.io/en/stable/error_code_list.html#check-validity-of-overrides-override
    def commit( # type: ignore[override]
        self,
        committer_id: str,
        commit_cmds: List[Dict[str, Any]]
    ) -> None:
        super(ConfigPropertyModel, self).commit(committer_id, '', commit_cmds)


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
            'rule_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    # TODO(#13523): Change 'rule_dicts' to domain object/TypedDict to
    # remove Any from type-annotation below.
    @classmethod
    def create(
        cls,
        param_name: str,
        rule_dicts: List[Dict[str, Any]],
        rule_schema_version: int
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
                            - value: *. The value of the filter to match
                                against.
            rule_schema_version: int. The schema version for the rule dicts.

        Returns:
            PlatformParameterModel. The created PlatformParameterModel
            instance.
        """
        return cls(
            id=param_name,
            rules=rule_dicts,
            rule_schema_version=rule_schema_version)
