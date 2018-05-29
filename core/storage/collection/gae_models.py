# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Model for an Oppia collection."""

import datetime

from constants import constants
import core.storage.base_model.gae_models as base_models
import core.storage.user.gae_models as user_models
import feconf

from google.appengine.ext import ndb


class CollectionSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a collection snapshot."""
    pass


class CollectionSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a collection snapshot."""
    pass


class CollectionModel(base_models.VersionedModel):
    """Versioned storage model for an Oppia collection.

    This class should only be imported by the collection services file
    and the collection model test file.
    """
    SNAPSHOT_METADATA_CLASS = CollectionSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = CollectionSnapshotContentModel
    ALLOW_REVERT = True

    # What this collection is called.
    title = ndb.StringProperty(required=True)
    # The category this collection belongs to.
    category = ndb.StringProperty(required=True, indexed=True)
    # The objective of this collection.
    objective = ndb.TextProperty(default='', indexed=False)
    # The language code of this collection.
    language_code = ndb.StringProperty(
        default=constants.DEFAULT_LANGUAGE_CODE, indexed=True)
    # Tags associated with this collection.
    tags = ndb.StringProperty(repeated=True, indexed=True)

    # The version of all property blob schemas.
    schema_version = ndb.IntegerProperty(
        required=True, default=1, indexed=True)
    # DEPRECATED in v2.4.2. Do not use.
    nodes = ndb.JsonProperty(default={}, indexed=False)

    # A dict representing the contents of a collection. Currently, this
    # contains the list of nodes. This dict should contain collection data
    # whose structure might need to be changed in the future.
    collection_contents = ndb.JsonProperty(default={}, indexed=False)

    @classmethod
    def get_collection_count(cls):
        """Returns the total number of collections."""
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
        super(CollectionModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        committer_user_settings_model = (
            user_models.UserSettingsModel.get_by_id(committer_id))
        committer_username = (
            committer_user_settings_model.username
            if committer_user_settings_model else '')

        collection_rights = CollectionRightsModel.get_by_id(self.id)

        # TODO(msl): test if put_async() leads to any problems (make
        # sure summary dicts get updated correctly when collections
        # are changed).
        collection_commit_log = CollectionCommitLogEntryModel.create(
            self.id, self.version, committer_id, committer_username,
            commit_type, commit_message, commit_cmds, collection_rights.status,
            collection_rights.community_owned
        )
        collection_commit_log.collection_id = self.id
        collection_commit_log.put()


class CollectionRightsSnapshotMetadataModel(
        base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a collection rights snapshot."""
    pass


class CollectionRightsSnapshotContentModel(
        base_models.BaseSnapshotContentModel):
    """Storage model for the content of a collection rights snapshot."""
    pass


class CollectionRightsModel(base_models.VersionedModel):
    """Storage model for rights related to a collection.

    The id of each instance is the id of the corresponding collection.
    """
    SNAPSHOT_METADATA_CLASS = CollectionRightsSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = CollectionRightsSnapshotContentModel
    ALLOW_REVERT = False

    # The user_ids of owners of this collection.
    owner_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to edit this collection.
    editor_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to view this collection.
    viewer_ids = ndb.StringProperty(indexed=True, repeated=True)

    # Whether this collection is owned by the community.
    community_owned = ndb.BooleanProperty(indexed=True, default=False)
    # For private collections, whether this collection can be viewed
    # by anyone who has the URL. If the collection is not private, this
    # setting is ignored.
    viewable_if_private = ndb.BooleanProperty(indexed=True, default=False)
    # Time, in milliseconds, when the collection was first published.
    first_published_msec = ndb.FloatProperty(indexed=True, default=None)

    # The publication status of this collection.
    status = ndb.StringProperty(
        default=feconf.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            feconf.ACTIVITY_STATUS_PRIVATE,
            feconf.ACTIVITY_STATUS_PUBLIC
        ]
    )

    def save(self, committer_id, commit_message, commit_cmds):
        """Updates the collection rights model by applying the given
        commit_cmds, then saves it.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and additional arguments for that command.
        """
        super(CollectionRightsModel, self).commit(
            committer_id, commit_message, commit_cmds)

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this overrides the superclass method.

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
        super(CollectionRightsModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        # Create and delete events will already be recorded in the
        # CollectionModel.
        if commit_type not in ['create', 'delete']:
            committer_user_settings_model = (
                user_models.UserSettingsModel.get_by_id(committer_id))
            committer_username = (
                committer_user_settings_model.username
                if committer_user_settings_model else '')
            # TODO(msl): test if put_async() leads to any problems (make
            # sure summary dicts get updated correctly when collections
            # are changed).
            CollectionCommitLogEntryModel(
                id=('rights-%s-%s' % (self.id, self.version)),
                user_id=committer_id,
                username=committer_username,
                collection_id=self.id,
                commit_type=commit_type,
                commit_message=commit_message,
                commit_cmds=commit_cmds,
                version=None,
                post_commit_status=self.status,
                post_commit_community_owned=self.community_owned,
                post_commit_is_private=(
                    self.status == feconf.ACTIVITY_STATUS_PRIVATE)
            ).put_async()


class CollectionCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to collections.

    A new instance of this model is created and saved every time a commit to
    CollectionModel or CollectionRightsModel occurs.

    The id for this model is of the form
    'collection-{{COLLECTION_ID}}-{{COLLECTION_VERSION}}'.
    """
    # The id of the collection being edited.
    collection_id = ndb.StringProperty(indexed=True, required=True)

    @classmethod
    def _get_instance_id(cls, collection_id, version):
        """This function returns the generated id for the get_commit function
        in the parent class.

        Args:
            collection_id: str. The id of the collection being edited.
            version: int. The version number of the collection after the commit.

        Returns:
            str. The commit id with the collection id and version number.
        """
        return 'collection-%s-%s' % (collection_id, version)

    @classmethod
    def get_all_non_private_commits(
            cls, page_size, urlsafe_start_cursor, max_age=None):
        """Fetches a list of all the non-private commits sorted by their last
        updated attribute.

        Args:
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned entities starts from this datastore cursor.
                Otherwise, the returned entities start from the beginning
                of the full list of entities.
            max_age: datetime.timedelta. An instance of datetime.timedelta
                representing the maximum age of the non-private commits to be
                fetched.

        Raises:
            ValueError. max_age is neither an instance of datetime.timedelta nor
                None.

        Returns:
            3-tuple of (results, cursor, more) where:
                results: List of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this might
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        if not isinstance(max_age, datetime.timedelta) and max_age is not None:
            raise ValueError(
                'max_age must be a datetime.timedelta instance or None.')

        query = cls.query(
            cls.post_commit_is_private == False)  # pylint: disable=singleton-comparison
        if max_age:
            query = query.filter(
                cls.last_updated >= datetime.datetime.utcnow() - max_age)
        return cls._fetch_page_sorted_by_last_updated(
            query, page_size, urlsafe_start_cursor)


class CollectionSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia collection.

    This should be used whenever the content blob of the collection is not
    needed (e.g. search results, etc).

    A CollectionSummaryModel instance stores the following information:

        id, title, category, objective, language_code, tags,
        last_updated, created_on, status (private, public),
        community_owned, owner_ids, editor_ids,
        viewer_ids, version.

    The key of each instance is the collection id.
    """

    # What this collection is called.
    title = ndb.StringProperty(required=True)
    # The category this collection belongs to.
    category = ndb.StringProperty(required=True, indexed=True)
    # The objective of this collection.
    objective = ndb.TextProperty(required=True, indexed=False)
    # The ISO 639-1 code for the language this collection is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)
    # Tags associated with this collection.
    tags = ndb.StringProperty(repeated=True, indexed=True)

    # Aggregate user-assigned ratings of the collection.
    ratings = ndb.JsonProperty(default=None, indexed=False)

    # Time when the collection model was last updated (not to be
    # confused with last_updated, which is the time when the
    # collection *summary* model was last updated).
    collection_model_last_updated = ndb.DateTimeProperty(indexed=True)
    # Time when the collection model was created (not to be confused
    # with created_on, which is the time when the collection *summary*
    # model was created).
    collection_model_created_on = ndb.DateTimeProperty(indexed=True)

    # The publication status of this collection.
    status = ndb.StringProperty(
        default=feconf.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            feconf.ACTIVITY_STATUS_PRIVATE,
            feconf.ACTIVITY_STATUS_PUBLIC
        ]
    )

    # Whether this collection is owned by the community.
    community_owned = ndb.BooleanProperty(required=True, indexed=True)

    # The user_ids of owners of this collection.
    owner_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to edit this collection.
    editor_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to view this collection.
    viewer_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who have contributed (humans who have made a
    # positive (not just a revert) change to the collection's content).
    contributor_ids = ndb.StringProperty(indexed=True, repeated=True)
    # A dict representing the contributors of non-trivial commits to this
    # collection. Each key of this dict is a user_id, and the corresponding
    # value is the number of non-trivial commits that the user has made.
    contributors_summary = ndb.JsonProperty(default={}, indexed=False)
    # The version number of the collection after this commit. Only populated
    # for commits to an collection (as opposed to its rights, etc.).
    version = ndb.IntegerProperty()
    # The number of nodes(explorations) that are within this collection.
    node_count = ndb.IntegerProperty()

    @classmethod
    def get_non_private(cls):
        """Returns an iterable with non-private collection summary models.

        Returns:
            iterable. An iterable with non-private collection summary models.
        """
        return CollectionSummaryModel.query().filter(
            CollectionSummaryModel.status != feconf.ACTIVITY_STATUS_PRIVATE
        ).filter(
            CollectionSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_private_at_least_viewable(cls, user_id):
        """Returns an iterable with private collection summary models that are
        at least viewable by the given user.

        Args:
            user_id: The id of the given user.

        Returns:
            iterable. An iterable with private collection summary models that
            are at least viewable by the given user.
        """
        return CollectionSummaryModel.query().filter(
            CollectionSummaryModel.status == feconf.ACTIVITY_STATUS_PRIVATE
        ).filter(
            ndb.OR(CollectionSummaryModel.owner_ids == user_id,
                   CollectionSummaryModel.editor_ids == user_id,
                   CollectionSummaryModel.viewer_ids == user_id)
        ).filter(
            CollectionSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_at_least_editable(cls, user_id):
        """Returns an iterable with collection summary models that are at least
        editable by the given user.

        Args:
            user_id: The id of the given user.

        Returns:
            iterable. An iterable with collection summary models that are at
            least viewable by the given user.
        """
        return CollectionSummaryModel.query().filter(
            ndb.OR(CollectionSummaryModel.owner_ids == user_id,
                   CollectionSummaryModel.editor_ids == user_id)
        ).filter(
            CollectionSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)
