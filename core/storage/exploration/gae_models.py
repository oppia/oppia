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

import datetime

import core.storage.base_model.gae_models as base_models
import core.storage.user.gae_models as user_models
import feconf

from google.appengine.ext import ndb


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
    # The objective of this exploration.
    objective = ndb.TextProperty(default='', indexed=False)
    # The ISO 639-1 code for the language this exploration is written in.
    language_code = ndb.StringProperty(
        default=feconf.DEFAULT_LANGUAGE_CODE, indexed=True)
    # Tags (topics, skills, concepts, etc.) associated with this
    # exploration.
    tags = ndb.StringProperty(repeated=True, indexed=True)
    # A blurb for this exploration.
    blurb = ndb.TextProperty(default='', indexed=False)
    # 'Author notes' for this exploration.
    author_notes = ndb.TextProperty(default='', indexed=False)
    # Schema storing specifications of the contents of any gadget panels,
    # along with associated customizations for each gadget instance.
    skin_customizations = ndb.JsonProperty(required=True, indexed=False)

    # The version of the states blob schema.
    states_schema_version = ndb.IntegerProperty(
        required=True, default=0, indexed=True)
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

    # DEPRECATED in v2.0.0.rc.2. Do not use. Retaining it here because deletion
    # caused GAE to raise an error on fetching a specific version of the
    # exploration model.
    # TODO(sll): Fix this error and remove this property.
    skill_tags = ndb.StringProperty(repeated=True, indexed=True)
    # DEPRECATED in v2.0.1. Do not use.
    # TODO(sll): Remove this property from the model.
    default_skin = ndb.StringProperty(default=feconf.DEFAULT_SKIN_ID)

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

        Note that this extends the superclass method.
        """
        super(ExplorationModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        committer_user_settings_model = (
            user_models.UserSettingsModel.get_by_id(committer_id))
        committer_username = (
            committer_user_settings_model.username
            if committer_user_settings_model else '')

        exp_rights = ExplorationRightsModel.get_by_id(self.id)

        # TODO(msl): test if put_async() leads to any problems (make
        # sure summary dicts get updated correctly when explorations
        # are changed)
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
                exp_rights.status == feconf.ACTIVITY_STATUS_PRIVATE)
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
    # For private explorations, whether this exploration can be viewed
    # by anyone who has the URL. If the exploration is not private, this
    # setting is ignored.
    viewable_if_private = ndb.BooleanProperty(indexed=True, default=False)
    # Time, in milliseconds, when the exploration was first published.
    first_published_msec = ndb.FloatProperty(indexed=True, default=None)

    # The publication status of this exploration.
    status = ndb.StringProperty(
        default=feconf.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            feconf.ACTIVITY_STATUS_PRIVATE,
            feconf.ACTIVITY_STATUS_PUBLIC,
            feconf.ACTIVITY_STATUS_PUBLICIZED
        ]
    )

    def save(self, committer_id, commit_message, commit_cmds):
        super(ExplorationRightsModel, self).commit(
            committer_id, commit_message, commit_cmds)

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
            # TODO(msl): test if put_async() leads to any problems (make
            # sure summary dicts get updated correctly when explorations
            # are changed)
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
                    self.status == feconf.ACTIVITY_STATUS_PRIVATE)
            ).put_async()


class ExplorationCommitLogEntryModel(base_models.BaseModel):
    """Log of commits to explorations.

    A new instance of this model is created and saved every time a commit to
    ExplorationModel or ExplorationRightsModel occurs.

    The id for this model is of the form
    'exploration-{{EXP_ID}}-{{EXP_VERSION}}'.
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
    def get_all_commits(cls, page_size, urlsafe_start_cursor):
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(), page_size, urlsafe_start_cursor)

    @classmethod
    def get_all_non_private_commits(
            cls, page_size, urlsafe_start_cursor, max_age=None):
        if not isinstance(max_age, datetime.timedelta) and max_age is not None:
            raise ValueError(
                'max_age must be a datetime.timedelta instance or None.')

        query = cls.query(cls.post_commit_is_private == False)  # pylint: disable=singleton-comparison
        if max_age:
            query = query.filter(
                cls.last_updated >= datetime.datetime.utcnow() - max_age)
        return cls._fetch_page_sorted_by_last_updated(
            query, page_size, urlsafe_start_cursor)


class ExpSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia exploration.

    This should be used whenever the content blob of the exploration is not
    needed (e.g. in search results, etc).

    A ExpSummaryModel instance stores the following information:

        id, title, category, objective, language_code, tags,
        last_updated, created_on, status (private, public or
        publicized), community_owned, owner_ids, editor_ids,
        viewer_ids, version.

    The key of each instance is the exploration id.
    """

    # What this exploration is called.
    title = ndb.StringProperty(required=True)
    # The category this exploration belongs to.
    category = ndb.StringProperty(required=True, indexed=True)
    # The objective of this exploration.
    objective = ndb.TextProperty(required=True, indexed=False)
    # The ISO 639-1 code for the language this exploration is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)
    # Tags associated with this exploration.
    tags = ndb.StringProperty(repeated=True, indexed=True)

    # Aggregate user-assigned ratings of the exploration
    ratings = ndb.JsonProperty(default=None, indexed=False)

    # Scaled average rating for the exploration.
    scaled_average_rating = ndb.FloatProperty(indexed=True)

    # Time when the exploration model was last updated (not to be
    # confused with last_updated, which is the time when the
    # exploration *summary* model was last updated)
    exploration_model_last_updated = ndb.DateTimeProperty(indexed=True)
    # Time when the exploration model was created (not to be confused
    # with created_on, which is the time when the exploration *summary*
    # model was created)
    exploration_model_created_on = ndb.DateTimeProperty(indexed=True)
    # Time when the exploration was first published.
    first_published_msec = ndb.FloatProperty(indexed=True)

    # The publication status of this exploration.
    status = ndb.StringProperty(
        default=feconf.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            feconf.ACTIVITY_STATUS_PRIVATE,
            feconf.ACTIVITY_STATUS_PUBLIC,
            feconf.ACTIVITY_STATUS_PUBLICIZED
        ]
    )

    # Whether this exploration is owned by the community.
    community_owned = ndb.BooleanProperty(required=True, indexed=True)

    # The user_ids of owners of this exploration.
    owner_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to edit this exploration.
    editor_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to view this exploration.
    viewer_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who have contributed (humans who have made a
    # positive (not just a revert) change to the exploration's content)
    contributor_ids = ndb.StringProperty(indexed=True, repeated=True)
    # A dict representing the contributors of non-trivial commits to this
    # exploration. Each key of this dict is a user_id, and the corresponding
    # value is the number of non-trivial commits that the user has made.
    contributors_summary = ndb.JsonProperty(default={}, indexed=False)
    # The version number of the exploration after this commit. Only populated
    # for commits to an exploration (as opposed to its rights, etc.)
    version = ndb.IntegerProperty()

    @classmethod
    def get_non_private(cls):
        """Returns an iterable with non-private exp summary models."""
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status != feconf.ACTIVITY_STATUS_PRIVATE
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_featured(cls):
        """Returns an iterable with featured exp summary models."""
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status == feconf.ACTIVITY_STATUS_PUBLICIZED
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_top_rated(cls):
        """Returns an iterable with the top rated exp summaries that are
        public in descending order.
        """
        return ExpSummaryModel.query().filter(
            ndb.OR(ExpSummaryModel.status == feconf.ACTIVITY_STATUS_PUBLIC,
                   ExpSummaryModel.status == feconf.ACTIVITY_STATUS_PUBLICIZED)
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).order(
            -ExpSummaryModel.scaled_average_rating
        ).fetch(feconf.NUMBER_OF_TOP_RATED_EXPLORATIONS)

    @classmethod
    def get_private_at_least_viewable(cls, user_id):
        """Returns an iterable with private exp summaries that are at least
        viewable by the given user.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status == feconf.ACTIVITY_STATUS_PRIVATE
        ).filter(
            ndb.OR(ExpSummaryModel.owner_ids == user_id,
                   ExpSummaryModel.editor_ids == user_id,
                   ExpSummaryModel.viewer_ids == user_id)
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_at_least_editable(cls, user_id):
        """Returns an iterable with exp summaries that are at least
        editable by the given user.
        """
        return ExpSummaryModel.query().filter(
            ndb.OR(ExpSummaryModel.owner_ids == user_id,
                   ExpSummaryModel.editor_ids == user_id)
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_recently_published(cls):
        """Returns an iterable with exp summaries that are recently
        published.
        """
        return ExpSummaryModel.query().filter(
            ndb.OR(ExpSummaryModel.status == feconf.ACTIVITY_STATUS_PUBLIC,
                   ExpSummaryModel.status == feconf.ACTIVITY_STATUS_PUBLICIZED)
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).order(
            -ExpSummaryModel.first_published_msec
        ).fetch(feconf.RECENTLY_PUBLISHED_QUERY_LIMIT)
