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

"""Model for an Oppia exploration."""

__author__ = 'Sean Lip'

import core.storage.base_model.gae_models as base_models

from google.appengine.ext import ndb


QUERY_LIMIT = 100


class ExplorationSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for an exploration snapshot."""
    pass


class ExplorationSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of an exploration snapshot."""
    pass


class ExplorationModel(base_models.VersionedModel):
    """Versioned storage model for an Oppia exploration.

    This class should only be imported by the exploration domain file, the
    exploration services file, and the Exploration model test file.
    """
    SNAPSHOT_METADATA_CLASS = ExplorationSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = ExplorationSnapshotContentModel
    ALLOW_REVERT = True

    # What this exploration is called.
    title = ndb.StringProperty(required=True)
    # The category this exploration belongs to.
    category = ndb.StringProperty(required=True, indexed=True)

    # The name of the initial state of this exploration.
    init_state_name = ndb.StringProperty(required=True, indexed=False)
    # A dict representing the states of this exploration. This dict should
    # not be empty.
    states = ndb.JsonProperty(default={}, indexed=False)
    # The dict of parameter specifications associated with this exploration.
    # Each specification is a dict whose keys are param names and whose values
    # are each dicts with a single key, 'obj_type', whose value is a string.
    param_specs = ndb.JsonProperty(default={}, indexed=False)
    # The list of parameter changes to be performed once at the start of a
    # reader's encounter with an exploration.
    param_changes = ndb.JsonProperty(repeated=True, indexed=False)
    # The default HTML template to use for displaying the exploration to the
    # reader. This is a filename in data/skins (without the .html suffix).
    default_skin = ndb.StringProperty(default='conversation_v1')

    @classmethod
    def get_multi(cls, exp_ids):
        """Returns a list of exploration models, given a list of ids."""
        return super(ExplorationModel, cls).get_multi(exp_ids)

    @classmethod
    def get_exploration_count(cls):
        """Returns the total number of explorations."""
        return cls.get_all().count()

    def commit(self, committer_id, commit_message, commit_cmds):
        """Updates the exploration using the properties dict, then saves it."""
        super(ExplorationModel, self).commit(
            committer_id, commit_message, commit_cmds)


class ExplorationRightsSnapshotMetadataModel(
        base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for an exploration rights snapshot."""
    pass


class ExplorationRightsSnapshotContentModel(
        base_models.BaseSnapshotContentModel):
    """Storage model for the content of an exploration rights snapshot."""
    pass


class ExplorationRightsModel(base_models.VersionedModel):
    """Storage model for rights related to an exploration.

    The id of each instance is the id of the corresponding exploration.
    """

    SNAPSHOT_METADATA_CLASS = ExplorationRightsSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = ExplorationRightsSnapshotContentModel
    ALLOW_REVERT = False

    # The user_ids of owners of this exploration.
    owner_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to edit this exploration.
    editor_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to view this exploration.
    viewer_ids = ndb.StringProperty(indexed=True, repeated=True)

    # Whether this exploration is owned by the community.
    community_owned = ndb.BooleanProperty(indexed=True, default=False)
    # The exploration id which this exploration was cloned from. If None, this
    # exploration was created from scratch.
    cloned_from = ndb.StringProperty()

    # The publication status of this exploration.
    status = ndb.StringProperty(
        default='private', indexed=True,
        choices=['private', 'public', 'publicized']
    )

    def save(self, committer_id, commit_message, commit_cmds):
        super(ExplorationRightsModel, self).commit(
            committer_id, commit_message, commit_cmds)

    @classmethod
    def get_non_private(cls):
        """Returns an iterable with non-private exp rights models."""
        return ExplorationRightsModel.query().filter(
            ExplorationRightsModel.status.IN(['public', 'publicized'])
        ).filter(
            ExplorationRightsModel.deleted == False
        ).fetch(QUERY_LIMIT)

    @classmethod
    def get_community_owned(cls):
        """Returns an iterable with community-owned exp rights models."""
        return ExplorationRightsModel.query().filter(
            ExplorationRightsModel.community_owned == True
        ).filter(
            ExplorationRightsModel.deleted == False
        ).fetch(QUERY_LIMIT)

    @classmethod
    def get_viewable(cls, user_id):
        """Returns an iterable with exp rights viewable by the given user.

        All such explorations will have a status of 'private'.
        """
        return ExplorationRightsModel.query().filter(
            ExplorationRightsModel.viewer_ids == user_id
        ).filter(
            ExplorationRightsModel.deleted == False
        ).fetch(QUERY_LIMIT)

    @classmethod
    def get_editable(cls, user_id):
        """Returns an iterable with exp rights editable by the given user.

        This includes both private and public explorations.
        """
        return ExplorationRightsModel.query().filter(
            ExplorationRightsModel.editor_ids == user_id
        ).filter(
            ExplorationRightsModel.deleted == False
        ).fetch(QUERY_LIMIT)

    @classmethod
    def get_owned(cls, user_id):
        """Returns an iterable with exp rights owned by the given user.

        This includes both private and public explorations.
        """
        return ExplorationRightsModel.query().filter(
            ExplorationRightsModel.owner_ids == user_id
        ).filter(
            ExplorationRightsModel.deleted == False
        ).fetch(QUERY_LIMIT)
