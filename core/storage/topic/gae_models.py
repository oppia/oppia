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

"""Models for topics and related constructs."""

import core.storage.base_model.gae_models as base_models

from google.appengine.ext import ndb


class TopicSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a topic snapshot."""
    pass


class TopicSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a topic snapshot."""
    pass


class TopicModel(base_models.VersionedModel):
    """Model for storing Topics.

    This class should only be imported by the topic domain file, the
    topic services file, and the topic model test file.
    """
    SNAPSHOT_METADATA_CLASS = TopicSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = TopicSnapshotContentModel
    ALLOW_REVERT = False

    # The name of the topic.
    name = ndb.StringProperty(required=True, indexed=True)
    # The description of the topic.
    description = ndb.TextProperty(indexed=False)
    # This consists of the list of canonical story ids that are part of
    # this topic.
    canonical_story_ids = ndb.StringProperty(repeated=True, indexed=True)
    # This consists of the list of additional (non-canonical) story ids that
    # are part of this topic.
    additional_story_ids = ndb.StringProperty(repeated=True, indexed=True)
    # This consists of the full list of skill ids that are part of this topic.
    skill_ids = ndb.StringProperty(repeated=True, indexed=True)
    # The ISO 639-1 code for the language this topic is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)


class TopicCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to topics.

    A new instance of this model is created and saved every time a commit to
    TopicModel occurs.

    The id for this model is of the form
    'topic-{{TOPIC_ID}}-{{TOPIC_VERSION}}'.
    """
    # The id of the topic being edited.
    topic_id = ndb.StringProperty(indexed=True, required=True)

    @classmethod
    def get_commit(cls, topic_id, version):
        """Returns the commit corresponding to the given topic id and
        version number.

        Args:
            topic_id: str. The id of the topic being edited.
            version: int. The version number of the topic after the commit.

        Returns:
            The commit with the given topic id and version number.
        """
        return cls.get_by_id('topic-%s-%s' % (topic_id, version))


class TopicSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia Topic.

    This should be used whenever the content blob of the topic is not
    needed (e.g. search results, etc).

    A TopicSummaryModel instance stores the following information:

        id, description, language_code, last_updated, created_on, version.

    The key of each instance is the topic id.
    """

    # The name of the topic.
    name = ndb.StringProperty(required=True, indexed=True)
    # The ISO 639-1 code for the language this topic is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)

    # Time when the topic model was last updated (not to be
    # confused with last_updated, which is the time when the
    # topic *summary* model was last updated).
    topic_model_last_updated = ndb.DateTimeProperty(required=True, indexed=True)
    # Time when the topic model was created (not to be confused
    # with created_on, which is the time when the topic *summary*
    # model was created).
    topic_model_created_on = ndb.DateTimeProperty(required=True, indexed=True)
    # The number of canonical stories that are part of this topic.
    canonical_story_count = ndb.IntegerProperty(required=True, indexed=True)
    # The number of additional stories that are part of this topic.
    additional_story_count = ndb.IntegerProperty(required=True, indexed=True)
    # The number of skills that are part of this topic.
    skill_count = ndb.IntegerProperty(required=True, indexed=True)
    version = ndb.IntegerProperty(required=True)


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
