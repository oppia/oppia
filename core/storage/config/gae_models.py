# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

import core.storage.base_model.gae_models as base_models

from google.appengine.ext import ndb


class ConfigSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a config property snapshot."""
    pass


class ConfigSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content for a config property snapshot."""
    pass


class ConfigPropertyModel(base_models.VersionedModel):
    """A class that represents a named configuration property.

    The id is the name of the property.
    """
    SNAPSHOT_METADATA_CLASS = ConfigSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = ConfigSnapshotContentModel

    # The property value.
    value = ndb.JsonProperty(indexed=False)

    def put(self, committer_id, commit_message, commit_cmds):
        self.save(committer_id, commit_message, commit_cmds)
