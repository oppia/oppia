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

"""Models relating to configuration properties."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import core.storage.base_model.gae_models as base_models

from google.appengine.ext import ndb


class ConfigPropertySnapshotMetadataModel(
        base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a config property snapshot."""

    @staticmethod
    def get_export_policy():
        """This model's export_data function implementation is still pending.

       TODO(#8523): Implement this function.
       """
        return base_models.EXPORT_POLICY.TO_BE_IMPLEMENTED


class ConfigPropertySnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content for a config property snapshot."""

    @staticmethod
    def get_export_policy():
        """This model's export_data function implementation is still pending.

       TODO(#8523): Implement this function.
       """
        return base_models.EXPORT_POLICY.TO_BE_IMPLEMENTED


class ConfigPropertyModel(base_models.VersionedModel):
    """A class that represents a named configuration property.

    The id is the name of the property.
    """
    SNAPSHOT_METADATA_CLASS = ConfigPropertySnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = ConfigPropertySnapshotContentModel

    # The property value.
    value = ndb.JsonProperty(indexed=False)

    @staticmethod
    def get_deletion_policy():
        """ConfigPropertyModel is not related to users."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_user_id_migration_policy():
        """ConfigPropertyModel doesn't have any field with user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE

    def commit(self, committer_id, commit_cmds):
        super(ConfigPropertyModel, self).commit(committer_id, '', commit_cmds)
