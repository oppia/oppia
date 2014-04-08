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
import core.storage.user.gae_models as user_models

from google.appengine.datastore import datastore_query
from google.appengine.ext import ndb


QUERY_LIMIT = 100

EXPLORATION_STATUS_PRIVATE = 'private'
EXPLORATION_STATUS_PUBLIC = 'public'
EXPLORATION_STATUS_PUBLICIZED = 'publicized'


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

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this overrides the superclass method.
        """
        super(ExplorationModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        committer_user_settings_model = (
            user_models.UserSettingsModel.get_by_id(committer_id))
        committer_username = (
            committer_user_settings_model.username
            if committer_user_settings_model else '')

        exp_rights = ExplorationRightsModel.get_by_id(self.id)

        ExplorationCommitLogEntryModel(
            id=('exploration-%s-%s' % (self.id, self.version)),
            user_id=committer_id,
            username=committer_username,
            exploration_id=self.id,
            commit_type=commit_type,
            commit_message=commit_message,
            commit_cmds=commit_cmds,
            version=self.version,
            post_commit_status=exp_rights.status,
            post_commit_community_owned=exp_rights.community_owned,
            post_commit_is_private=(
                exp_rights.status == EXPLORATION_STATUS_PRIVATE)
        ).put_async()


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
        default=EXPLORATION_STATUS_PRIVATE, indexed=True,
        choices=[
            EXPLORATION_STATUS_PRIVATE,
            EXPLORATION_STATUS_PUBLIC,
            EXPLORATION_STATUS_PUBLICIZED
        ]
    )

    def save(self, committer_id, commit_message, commit_cmds):
        super(ExplorationRightsModel, self).commit(
            committer_id, commit_message, commit_cmds)

    @classmethod
    def get_non_private(cls):
        """Returns an iterable with non-private exp rights models."""
        return ExplorationRightsModel.query().filter(
            ExplorationRightsModel.status.IN([
                EXPLORATION_STATUS_PUBLIC, EXPLORATION_STATUS_PUBLICIZED])
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

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this overrides the superclass method.
        """
        super(ExplorationRightsModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        # Create and delete events will already be recorded in the
        # ExplorationModel.
        if commit_type not in ['create', 'delete']:
            committer_user_settings_model = (
                user_models.UserSettingsModel.get_by_id(committer_id))
            committer_username = (
                committer_user_settings_model.username
                if committer_user_settings_model else '')
            ExplorationCommitLogEntryModel(
                id=('rights-%s-%s' % (self.id, self.version)),
                user_id=committer_id,
                username=committer_username,
                exploration_id=self.id,
                commit_type=commit_type,
                commit_message=commit_message,
                commit_cmds=commit_cmds,
                version=None,
                post_commit_status=self.status,
                post_commit_community_owned=self.community_owned,
                post_commit_is_private=(
                    self.status == EXPLORATION_STATUS_PRIVATE)
            ).put_async()


class ExplorationCommitLogEntryModel(base_models.BaseModel):
    """Log of commits to explorations.

    A new entry in this log is created each time a commit to ExplorationModel
    or ExplorationRightsModel occurs.
    """
    # Update superclass model to make these properties indexed.
    created_on = ndb.DateTimeProperty(auto_now_add=True, indexed=True)
    last_updated = ndb.DateTimeProperty(auto_now=True, indexed=True)

    # The id of the user.
    user_id = ndb.StringProperty(indexed=True, required=True)
    # The username of the user, at the time of the edit.
    username = ndb.StringProperty(indexed=True, required=True)
    # The id of the exploration being edited.
    exploration_id = ndb.StringProperty(indexed=True, required=True)
    # The type of the commit: 'create', 'revert', 'edit', 'delete'.
    commit_type = ndb.StringProperty(indexed=True, required=True)
    # The commit message.
    commit_message = ndb.TextProperty(indexed=False)
    # The commit_cmds dict for this commit.
    commit_cmds = ndb.JsonProperty(indexed=False, required=True)
    # The version number of the exploration after this commit. Only populated
    # for commits to an exploration (as opposed to its rights, etc.)
    version = ndb.IntegerProperty()

    # The status of the exploration after the edit event ('private', 'public',
    # 'publicized').
    post_commit_status = ndb.StringProperty(indexed=True, required=True)
    # Whether the exploration is community-owned after the edit event.
    post_commit_community_owned = ndb.BooleanProperty(indexed=True)
    # Whether the exploration is private after the edit event. Having a
    # separate field for this makes queries faster, since an equality query
    # on this property is faster than an inequality query on
    # post_commit_status.
    post_commit_is_private = ndb.BooleanProperty(indexed=True)

    @classmethod
    def _fetch_page_sorted_by_last_updated(
            cls, query, page_size, urlsafe_start_cursor):
        if urlsafe_start_cursor:
            start_cursor = datastore_query.Cursor(urlsafe=urlsafe_start_cursor)
        else:
            start_cursor = None

        result = query.order(-cls.last_updated).fetch_page(
            page_size, start_cursor=start_cursor)
        return (
            result[0],
            (result[1].urlsafe() if result[1] else None),
            result[2])

    @classmethod
    def get_all_commits(cls, page_size, urlsafe_start_cursor):
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(), page_size, urlsafe_start_cursor)

    @classmethod
    def get_all_non_private_commits(cls, page_size, urlsafe_start_cursor):
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(cls.post_commit_is_private == False),
            page_size, urlsafe_start_cursor)

    @classmethod
    def get_all_commits_by_exp_id(
            cls, exploration_id, page_size, urlsafe_start_cursor):
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(cls.exploration_id == exploration_id),
            page_size, urlsafe_start_cursor)

    @classmethod
    def get_all_commits_by_user_id(
            cls, user_id, page_size, urlsafe_start_cursor):
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(cls.user_id == user_id), page_size, urlsafe_start_cursor)
