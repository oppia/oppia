# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Models for topics and related constructs"""

import core.storage.base_model.gae_models as base_models

from google.appengine.ext import ndb


class TopicRightsSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a topic rights snapshot."""
    pass


class TopicRightsSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a topic rights snapshot."""
    pass


class TopicRightsModel(base_models.VersionedModel):
    """Storage model for rights related to a topic.

    The id of each instance is the id of the corresponding topic.
    """

    SNAPSHOT_METADATA_CLASS = TopicRightsSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = TopicRightsSnapshotContentModel
    ALLOW_REVERT = False

    # The user_ids of the managers of this topic.
    manager_ids = ndb.StringProperty(indexed=True, repeated=True)
