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

from constants import constants
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
        default=constants.DEFAULT_LANGUAGE_CODE, indexed=True)
    # Tags (topics, skills, concepts, etc.) associated with this
    # exploration.
    tags = ndb.StringProperty(repeated=True, indexed=True)
    # A blurb for this exploration.
    blurb = ndb.TextProperty(default='', indexed=False)
    # 'Author notes' for this exploration.
    author_notes = ndb.TextProperty(default='', indexed=False)

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
    # A boolean indicating whether automatic text-to-speech is enabled in
    # this exploration.
    auto_tts_enabled = ndb.BooleanProperty(default=True, indexed=True)
    # A boolean indicating whether correctness feedback is enabled in this
    # exploration.
    correctness_feedback_enabled = ndb.BooleanProperty(
        default=False, indexed=True)

    # DEPRECATED in v2.0.0.rc.2. Do not use. Retaining it here because deletion
    # caused GAE to raise an error on fetching a specific version of the
    # exploration model.
    # TODO(sll): Fix this error and remove this property.
    skill_tags = ndb.StringProperty(repeated=True, indexed=True)
    # DEPRECATED in v2.0.1. Do not use.
    # TODO(sll): Remove this property from the model.
    default_skin = ndb.StringProperty(default='conversation_v1')
    # DEPRECATED in v2.5.4. Do not use.
    skin_customizations = ndb.JsonProperty(indexed=False)

    @classmethod
    def get_exploration_count(cls):
        """Returns the total number of explorations."""
        return cls.get_all().count()

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
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
        # are changed).
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
            feconf.ACTIVITY_STATUS_PUBLIC
        ]
    )

    def save(self, committer_id, commit_message, commit_cmds):
        """Saves a new version of the exploration, updating the Exploration
        datastore model.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. The type of the command. A full list of command
                        types can be found in core/domain/exp_domain.py.
                and then additional arguments for that command. For example:

                {'cmd': 'AUTO_revert_version_number',
                 'version_number': 4}
        """
        super(ExplorationRightsModel, self).commit(
            committer_id, commit_message, commit_cmds)

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
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
            # are changed).
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
    # for commits to an exploration (as opposed to its rights, etc.).
    version = ndb.IntegerProperty()

    # The status of the exploration after the edit event ('private', 'public').
    post_commit_status = ndb.StringProperty(indexed=True, required=True)
    # Whether the exploration is community-owned after the edit event.
    post_commit_community_owned = ndb.BooleanProperty(indexed=True)
    # Whether the exploration is private after the edit event. Having a
    # separate field for this makes queries faster, since an equality query
    # on this property is faster than an inequality query on
    # post_commit_status.
    post_commit_is_private = ndb.BooleanProperty(indexed=True)

    @classmethod
    def _get_instance_id(cls, exp_id, exp_version):
        """Returns ID of the exploration commit log entry model.

        Args:
            exp_id: str. The exploration id whose states are mapped.
            exp_version: int. The version of the exploration.
        """
        return 'exploration-%s-%s' % (exp_id, exp_version)

    @classmethod
    def get_all_commits(cls, page_size, urlsafe_start_cursor):
        """Fetches a list of all the commits sorted by their last updated
        attribute.

        Args:
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned entities starts from this datastore cursor.
                Otherwise, the returned entities start from the beginning
                of the full list of entities.

        Returns:
            3-tuple of (results, cursor, more) as described in fetch_page() at:
            https://developers.google.com/appengine/docs/python/ndb/queryclass,
            where:
                results: List of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this will
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(), page_size, urlsafe_start_cursor)

    @classmethod
    def get_all_non_private_commits(
            cls, page_size, urlsafe_start_cursor, max_age=None):
        """Fetches a list of all the non-private commits sorted by their
        last updated attribute.

        Args:
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned entities starts from this datastore cursor.
                Otherwise, the returned entities start from the beginning
                of the full list of entities.
            max_age: datetime.timedelta. The maximum time duration within which
                commits are needed.

        Returns:
            3-tuple of (results, cursor, more) which were created which were
            created no earlier than max_age before the current time where:
                results: List of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this will
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """

        if not isinstance(max_age, datetime.timedelta) and max_age is not None:
            raise ValueError(
                'max_age must be a datetime.timedelta instance or None.')

        query = cls.query(cls.post_commit_is_private == False)  # pylint: disable=singleton-comparison
        if max_age:
            query = query.filter(
                cls.last_updated >= datetime.datetime.utcnow() - max_age)
        return cls._fetch_page_sorted_by_last_updated(
            query, page_size, urlsafe_start_cursor)

    @classmethod
    def get_all_exploration_commits(cls, exp_id, latest_version):
        """Fetches all the commits made on a particular exploration up to latest
        version of exploration.

        Args:
            exp_id: str. The exploration id.
            latest_version: int. Latest version of the exploration.

        Returns:
            list(ExplorationCommitLogEntryModel). Commit log entry model
            for each version of the given exploration.
        """
        model_ids = []
        for version in range(1, latest_version + 1):
            model_ids.append(cls._get_instance_id(exp_id, version))

        models = cls.get_multi(model_ids)
        return models


class ExpSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia exploration.

    This should be used whenever the content blob of the exploration is not
    needed (e.g. in search results, etc).

    A ExpSummaryModel instance stores the following information:

        id, title, category, objective, language_code, tags,
        last_updated, created_on, status (private, public),
        community_owned, owner_ids, editor_ids,
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

    # Aggregate user-assigned ratings of the exploration.
    ratings = ndb.JsonProperty(default=None, indexed=False)

    # Scaled average rating for the exploration.
    scaled_average_rating = ndb.FloatProperty(indexed=True)

    # Time when the exploration model was last updated (not to be
    # confused with last_updated, which is the time when the
    # exploration *summary* model was last updated).
    exploration_model_last_updated = ndb.DateTimeProperty(indexed=True)
    # Time when the exploration model was created (not to be confused
    # with created_on, which is the time when the exploration *summary*
    # model was created).
    exploration_model_created_on = ndb.DateTimeProperty(indexed=True)
    # Time when the exploration was first published.
    first_published_msec = ndb.FloatProperty(indexed=True)

    # The publication status of this exploration.
    status = ndb.StringProperty(
        default=feconf.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            feconf.ACTIVITY_STATUS_PRIVATE,
            feconf.ACTIVITY_STATUS_PUBLIC
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
    # positive (not just a revert) change to the exploration's content).
    contributor_ids = ndb.StringProperty(indexed=True, repeated=True)
    # A dict representing the contributors of non-trivial commits to this
    # exploration. Each key of this dict is a user_id, and the corresponding
    # value is the number of non-trivial commits that the user has made.
    contributors_summary = ndb.JsonProperty(default={}, indexed=False)
    # The version number of the exploration after this commit. Only populated
    # for commits to an exploration (as opposed to its rights, etc.).
    version = ndb.IntegerProperty()

    @classmethod
    def get_non_private(cls):
        """Returns an iterable with non-private ExpSummary models.

        Returns:
            iterable. An iterable with non-private ExpSummary models.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status != feconf.ACTIVITY_STATUS_PRIVATE
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_top_rated(cls, limit):
        """Fetches the top-rated exp summaries that are public in descending
        order of scaled_average_rating.

        Args:
            limit: int. The maximum number of results to return.

        Returns:
            iterable. An iterable with the top rated exp summaries that are
                public in descending order of scaled_average_rating.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status == feconf.ACTIVITY_STATUS_PUBLIC
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).order(
            -ExpSummaryModel.scaled_average_rating
        ).fetch(limit)

    @classmethod
    def get_private_at_least_viewable(cls, user_id):
        """Fetches private exp summaries that are at least viewable by the
        given user.

        Args:
            user_id: The id of the given user.

        Returns:
            iterable. An iterable with private exp summaries that are at least
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
        """Fetches exp summaries that are at least editable by the given user.

        Args:
            user_id: The id of the given user.

        Returns:
            iterable. An iterable with exp summaries that are at least
                editable by the given user.
        """
        return ExpSummaryModel.query().filter(
            ndb.OR(ExpSummaryModel.owner_ids == user_id,
                   ExpSummaryModel.editor_ids == user_id)
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_recently_published(cls, limit):
        """Fetches exp summaries that are recently published.

        Args:
            limit: int. The maximum number of results to return.

        Returns:
            An iterable with exp summaries that are recently published. The
                returned list is sorted by the time of publication with latest
                being first in the list.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status == feconf.ACTIVITY_STATUS_PUBLIC
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).order(
            -ExpSummaryModel.first_published_msec
        ).fetch(limit)


class StateIdMappingModel(base_models.BaseModel):
    """State ID model for Oppia explorations.

    This model maps each exploration version's state to a unique id.
    Note: use the state id only for derived data, but not for data that’s
    regarded as the source of truth, as the rules for assigning state id may
    change in future.

    The key of each instance is a combination of exploration id and version.
    """

    # The exploration id whose states are mapped.
    exploration_id = ndb.StringProperty(indexed=True, required=True)

    # The version of the exploration.
    exploration_version = ndb.IntegerProperty(indexed=True, required=True)

    # A dict which maps each state name to a unique id.
    state_names_to_ids = ndb.JsonProperty(required=True)

    # Latest state id that has been assigned to any of the states in any of
    # of the versions of given exploration. New state IDs should be assigned
    # from this value + 1.
    largest_state_id_used = ndb.IntegerProperty(indexed=True, required=True)

    @classmethod
    def _generate_instance_id(cls, exp_id, exp_version):
        """Generates ID of the state id mapping model instance.

        Args:
            exp_id: str. The exploration id whose states are mapped.
            exp_version: int. The version of the exploration.
        """
        return '%s.%d' % (exp_id, exp_version)

    @classmethod
    def create(
            cls, exp_id, exp_version, state_names_to_ids,
            largest_state_id_used, overwrite=False):
        """Creates a new instance of state id mapping model.

        Args:
            exp_id: str. The exploration id whose states are mapped.
            exp_version: int. The version of that exploration.
            state_names_to_ids: dict. A dict storing state name to ids mapping.
            largest_state_id_used: int. The largest integer so far that has been
                used as a state ID for this exploration.
            overwrite: bool. Whether overwriting of an existing model should
                be allowed.

        Returns:
            StateIdMappingModel. Instance of the state id mapping model.
        """
        instance_id = cls._generate_instance_id(exp_id, exp_version)
        if not overwrite and cls.get_by_id(instance_id):
            raise Exception(
                'State id mapping model already exists for exploration %s,'
                ' version %d' % (exp_id, exp_version))
        model = cls(
            id=instance_id, exploration_id=exp_id,
            exploration_version=exp_version,
            state_names_to_ids=state_names_to_ids,
            largest_state_id_used=largest_state_id_used)
        model.put()

        return model

    @classmethod
    def get_state_id_mapping_model(cls, exp_id, exp_version):
        """Retrieve state id mapping model from the datastore.

        Args:
            exp_id: str. The exploration id.
            exp_version: int. The exploration version.
            strict: bool. Whether to raise an error if no StateIdMappingModel
                entry is found for the given exploration id and version.

        Returns:
            StateIdMappingModel. The model retrieved from the datastore.
        """
        instance_id = cls._generate_instance_id(exp_id, exp_version)
        instance = cls.get(instance_id)
        return instance

    @classmethod
    def delete_state_id_mapping_models(cls, exp_id, exp_versions):
        """Removes state id mapping models present in state_id_mapping_models.

        Args:
            exp_id: The id of the exploration.
            exp_versions: list(int). A list of exploration versions for which
                the state id mapping model is to be deleted.
        """
        keys = [
            ndb.Key(cls, cls._generate_instance_id(exp_id, exp_version))
            for exp_version in exp_versions]
        ndb.delete_multi(keys)
