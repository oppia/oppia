# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Validators for config models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.domain import config_domain
from core.domain import platform_parameter_domain
from core.platform import models
import python_utils


(base_models, config_models, user_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.config, models.NAMES.user])


class ConfigPropertyModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating ConfigPropertyModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                config_models.ConfigPropertySnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                config_models.ConfigPropertySnapshotContentModel,
                snapshot_model_ids)]


class ConfigPropertySnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating ConfigPropertySnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'config property'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}-\d+$'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return config_domain.ConfigPropertyChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'config_property_ids',
                config_models.ConfigPropertyModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class ConfigPropertySnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating ConfigPropertySnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'config property'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}-\d+$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'config_property_ids',
                config_models.ConfigPropertyModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class PlatformParameterModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating PlatformParameterModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                config_models.PlatformParameterSnapshotMetadataModel,
                snapshot_model_ids
            ),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                config_models.PlatformParameterSnapshotContentModel,
                snapshot_model_ids
            ),
        ]


class PlatformParameterSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
    """Class for validating PlatformParameterSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'platform parameter'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}-\d+$'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return platform_parameter_domain.PlatformParameterChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'platform_parameter_ids',
                config_models.PlatformParameterModel,
                [item.id[:item.id.find('-')]]
            ),
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )
        ]


class PlatformParameterSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating PlatformParameterSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'platform parameter'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^[A-Za-z0-9_]{1,100}-\d+$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'platform_parameter_ids',
                config_models.PlatformParameterModel,
                [item.id[:item.id.find('-')]]
            )
        ]
