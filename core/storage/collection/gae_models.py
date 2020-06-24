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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
import core.storage.base_model.gae_models as base_models
import core.storage.user.gae_models as user_models
import feconf
import python_utils

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

    # A dict representing the contents of a collection. Currently, this
    # contains the list of nodes. This dict should contain collection data
    # whose structure might need to be changed in the future.
    collection_contents = ndb.JsonProperty(default={}, indexed=False)

    # DEPRECATED in v2.4.2. Do not use.
    nodes = ndb.JsonProperty(default={}, indexed=False)

    @staticmethod
    def get_deletion_policy():
        """Collection is deleted only if it is not public."""
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether CollectionModel snapshots references the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.SNAPSHOT_METADATA_CLASS.exists_for_user_id(user_id)

    @staticmethod
    def get_user_id_migration_policy():
        """CollectionModel doesn't have any field with user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE

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

        # TODO(msl): Test if put_async() leads to any problems (make
        # sure summary dicts get updated correctly when collections
        # are changed).
        collection_commit_log = CollectionCommitLogEntryModel.create(
            self.id, self.version, committer_id, committer_username,
            commit_type, commit_message, commit_cmds, collection_rights.status,
            collection_rights.community_owned
        )
        collection_commit_log.collection_id = self.id
        collection_commit_log.put()

    @classmethod
    def delete_multi(
            cls, entity_ids, committer_id, commit_message,
            force_deletion=False):
        """Deletes the given cls instances with the given entity_ids.

        Note that this extends the superclass method.

        Args:
            entity_ids: list(str). Ids of entities to delete.
            committer_id: str. The user_id of the user who committed the change.
            commit_message: str. The commit description message.
            force_deletion: bool. If True these models are deleted completely
                from storage, otherwise there are only marked as deleted.
                Default is False.
        """
        super(CollectionModel, cls).delete_multi(
            entity_ids, committer_id,
            commit_message, force_deletion=force_deletion)

        if not force_deletion:
            committer_user_settings_model = (
                user_models.UserSettingsModel.get_by_id(committer_id))
            committer_username = (
                committer_user_settings_model.username
                if committer_user_settings_model else '')

            commit_log_models = []
            collection_rights_models = CollectionRightsModel.get_multi(
                entity_ids, include_deleted=True)
            versioned_models = cls.get_multi(entity_ids, include_deleted=True)
            for model, rights_model in python_utils.ZIP(
                    versioned_models, collection_rights_models):
                collection_commit_log = CollectionCommitLogEntryModel.create(
                    model.id, model.version, committer_id, committer_username,
                    cls._COMMIT_TYPE_DELETE,
                    commit_message, [{'cmd': cls.CMD_DELETE_COMMIT}],
                    rights_model.status, rights_model.community_owned
                )
                collection_commit_log.collection_id = model.id
                commit_log_models.append(collection_commit_log)
            ndb.put_multi_async(commit_log_models)


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
    # The user_ids of users who are allowed to voiceover this collection.
    voice_artist_ids = ndb.StringProperty(indexed=True, repeated=True)
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
        default=constants.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            constants.ACTIVITY_STATUS_PRIVATE,
            constants.ACTIVITY_STATUS_PUBLIC
        ]
    )
    # DEPRECATED in v2.8.3. Do not use.
    translator_ids = ndb.StringProperty(indexed=True, repeated=True)

    @staticmethod
    def get_deletion_policy():
        """Collection rights are deleted only if the corresponding collection
        is not public.
        """
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @staticmethod
    def convert_to_valid_dict(model_dict):
        """Replace invalid fields and values in the CollectionRightsModel dict.

        Some old CollectionRightsSnapshotContentModels can contain fields
        and field values that are no longer supported and would cause
        an exception when we try to reconstitute a CollectionRightsModel from
        them. We need to remove or replace these fields and values.

        Args:
            model_dict: dict. The content of the model. Some fields and field
                values might no longer exist in the CollectionRightsModel
                schema.

        Returns:
            dict. The content of the model. Only valid fields and values are
            present.
        """
        # The status field could historically take the value 'publicized', this
        # value is now equivalent to 'public'.
        if model_dict['status'] == 'publicized':
            model_dict['status'] = constants.ACTIVITY_STATUS_PUBLIC
        # The voice_artist_ids field was previously named translator_ids. We
        # need to move the values from translator_ids field to voice_artist_ids
        # and delete translator_ids.
        if 'translator_ids' in model_dict and model_dict['translator_ids']:
            model_dict['voice_artist_ids'] = model_dict['translator_ids']
            model_dict['translator_ids'] = []
        return model_dict

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether CollectionRightsModel references the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return (
            cls.query(ndb.OR(
                cls.owner_ids == user_id,
                cls.editor_ids == user_id,
                cls.voice_artist_ids == user_id,
                cls.viewer_ids == user_id
            )).get(keys_only=True) is not None
            or cls.SNAPSHOT_METADATA_CLASS.exists_for_user_id(user_id))

    @staticmethod
    def get_user_id_migration_policy():
        """CollectionRightsModel has multiple fields with user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.CUSTOM

    @classmethod
    def migrate_model(cls, old_user_id, new_user_id):
        """Migrate model to use the new user ID in the owner_ids, editor_ids,
        voice_artist_ids and viewer_ids.

        Args:
            old_user_id: str. The old user ID.
            new_user_id: str. The new user ID.
        """
        migrated_models = []
        for model in cls.query(ndb.OR(
                cls.owner_ids == old_user_id,
                cls.editor_ids == old_user_id,
                cls.voice_artist_ids == old_user_id,
                cls.viewer_ids == old_user_id)).fetch():
            model.owner_ids = [
                new_user_id if owner_id == old_user_id else owner_id
                for owner_id in model.owner_ids]
            model.editor_ids = [
                new_user_id if editor_id == old_user_id else editor_id
                for editor_id in model.editor_ids]
            model.voice_artist_ids = [
                new_user_id if v_artist_id == old_user_id else v_artist_id
                for v_artist_id in model.voice_artist_ids]
            model.viewer_ids = [
                new_user_id if viewer_id == old_user_id else viewer_id
                for viewer_id in model.viewer_ids]
            migrated_models.append(model)
        cls.put_multi(migrated_models, update_last_updated_time=False)

    def verify_model_user_ids_exist(self):
        """Check if UserSettingsModel exists for all the ids in owner_ids,
        editor_ids, voice_artist_ids and viewer_ids.
        """
        user_ids = (self.owner_ids + self.editor_ids + self.voice_artist_ids +
                    self.viewer_ids)
        user_ids = [user_id for user_id in user_ids
                    if user_id not in feconf.SYSTEM_USERS]
        user_settings_models = user_models.UserSettingsModel.get_multi(
            user_ids, include_deleted=True)
        return all(model is not None for model in user_settings_models)

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
            # TODO(msl): Test if put_async() leads to any problems (make
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
                    self.status == constants.ACTIVITY_STATUS_PRIVATE)
            ).put_async()

    @classmethod
    def export_data(cls, user_id):
        """(Takeout) Export user-relevant properties of CollectionRightsModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict. The user-relevant properties of CollectionRightsModel
            in a python dict format. In this case, we are returning all the
            ids of collections that the user is connected to, so they either
            own, edit, voice, or have permission to view.
        """
        owned_collections = cls.get_all().filter(cls.owner_ids == user_id)
        editable_collections = cls.get_all().filter(cls.editor_ids == user_id)
        voiced_collections = (
            cls.get_all().filter(cls.voice_artist_ids == user_id))
        viewable_collections = cls.get_all().filter(cls.viewer_ids == user_id)

        owned_collection_ids = [col.key.id() for col in owned_collections]
        editable_collection_ids = [col.key.id() for col in editable_collections]
        voiced_collection_ids = [col.key.id() for col in voiced_collections]
        viewable_collection_ids = [col.key.id() for col in viewable_collections]

        return {
            'owned_collection_ids': owned_collection_ids,
            'editable_collection_ids': editable_collection_ids,
            'voiced_collection_ids': voiced_collection_ids,
            'viewable_collection_ids': viewable_collection_ids
        }


class CollectionRightsAllUsersModel(base_models.BaseModel):
    """Temporary storage model for all user ids ever mentioned in the collection
    rights.

    TODO (#8529): This model should be deleted after the user ID migration is
    completed.

    The id of each instance is the id of the corresponding collection.
    """
    # The user_ids of users who are (or were in history) members of owner_ids,
    # editor_ids, voice_artist_ids or viewer_ids in corresponding rights model.
    all_user_ids = ndb.StringProperty(indexed=True, repeated=True)

    @staticmethod
    def get_deletion_policy():
        """CollectionRightsAllUsersModel are temporary model that will be
        deleted after user migration.
        """
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether CollectionRightsAllUsersModel references the given
        user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.all_user_ids == user_id).get(keys_only=True) is not None

    @staticmethod
    def get_export_policy():
        """This model is only used for migration purposes. All the data
        contained in this model are already exported through
        CollectionRightsModel.
        """
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_user_id_migration_policy():
        """CollectionRightsAllUsersModel has multiple fields with user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.CUSTOM

    @classmethod
    def migrate_model(cls, unused_old_user_id, unused_new_user_id):
        """This model is used to verify that the user ID migration of
        CollectionRightsSnapshotContentModel was successful. The content is
        filled by the AddAllUserIdsVerificationJob and
        AddAllUserIdsSnapshotsVerificationJob before the
        GaeIdNotInModelsVerificationJob is run, thus it shouldn't be migrated by
        this method.

        Args:
            unused_old_user_id: str. The old user ID.
            unused_new_user_id: str. The new user ID.
        """
        pass

    def verify_model_user_ids_exist(self):
        """Check if UserSettingsModel exists for all the ids in all_user_ids."""
        user_ids = [user_id for user_id in self.all_user_ids
                    if user_id not in feconf.SYSTEM_USERS]
        user_settings_models = user_models.UserSettingsModel.get_multi(
            user_ids, include_deleted=True)
        return all(model is not None for model in user_settings_models)


class CollectionCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to collections.

    A new instance of this model is created and saved every time a commit to
    CollectionModel or CollectionRightsModel occurs.

    The id for this model is of the form 'collection-[collection_id]-[version]'.
    """
    # The id of the collection being edited.
    collection_id = ndb.StringProperty(indexed=True, required=True)

    @staticmethod
    def get_deletion_policy():
        """Collection commit log is deleted only if the corresponding collection
        is not public.
        """
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @staticmethod
    def get_export_policy():
        """The history of commits is not relevant for the purposes of
        Takeout.
        """
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

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

        id, title, category, objective, language_code, tags, ratings,
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
        default=constants.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            constants.ACTIVITY_STATUS_PRIVATE,
            constants.ACTIVITY_STATUS_PUBLIC
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
    # NOTE TO DEVELOPERS: contributor_ids and contributors_summary need to be
    # synchronized, meaning that the keys in contributors_summary need be
    # equal to the contributor_ids list.
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

    @staticmethod
    def get_deletion_policy():
        """Collection summary is deleted only if the corresponding collection
        is not public.
        """
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @staticmethod
    def get_export_policy():
        """Model data has already been exported as a part of the
        CollectionRightsModel, and thus does not need an export_data
        function.
        """
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether CollectionSummaryModel references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(ndb.OR(
            cls.owner_ids == user_id,
            cls.editor_ids == user_id,
            cls.viewer_ids == user_id,
            cls.contributor_ids == user_id)).get(keys_only=True) is not None

    @staticmethod
    def get_user_id_migration_policy():
        """CollectionSummaryModel has multiple fields with user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.CUSTOM

    @classmethod
    def migrate_model(cls, old_user_id, new_user_id):
        """Migrate model to use the new user ID in the owner_ids, editor_ids,
        viewer_ids and contributor_ids.

        Args:
            old_user_id: str. The old user ID.
            new_user_id: str. The new user ID.
        """
        migrated_models = []
        for model in cls.query(ndb.OR(
                cls.owner_ids == old_user_id, cls.editor_ids == old_user_id,
                cls.viewer_ids == old_user_id,
                cls.contributor_ids == old_user_id)).fetch():
            model.owner_ids = [
                new_user_id if owner_id == old_user_id else owner_id
                for owner_id in model.owner_ids]
            model.editor_ids = [
                new_user_id if editor_id == old_user_id else editor_id
                for editor_id in model.editor_ids]
            model.viewer_ids = [
                new_user_id if viewer_id == old_user_id else viewer_id
                for viewer_id in model.viewer_ids]
            model.contributor_ids = [
                new_user_id if contributor_id == old_user_id else
                contributor_id for contributor_id in model.contributor_ids]
            if old_user_id in model.contributors_summary:
                model.contributors_summary[new_user_id] = (
                    model.contributors_summary[old_user_id])
                del model.contributors_summary[old_user_id]
            migrated_models.append(model)
        cls.put_multi(migrated_models, update_last_updated_time=False)

    @classmethod
    def get_non_private(cls):
        """Returns an iterable with non-private collection summary models.

        Returns:
            iterable. An iterable with non-private collection summary models.
        """
        return CollectionSummaryModel.query().filter(
            CollectionSummaryModel.status != constants.ACTIVITY_STATUS_PRIVATE
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
            CollectionSummaryModel.status == constants.ACTIVITY_STATUS_PRIVATE
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

    def verify_model_user_ids_exist(self):
        """Check if UserSettingsModel exists for all the ids in owner_ids,
        editor_ids, viewer_ids and contributor_ids.
        """
        user_ids = (self.owner_ids + self.editor_ids + self.viewer_ids +
                    self.contributor_ids)
        user_ids = [user_id for user_id in user_ids
                    if user_id not in feconf.SYSTEM_USERS]
        user_settings_models = user_models.UserSettingsModel.get_multi(
            user_ids, include_deleted=True)
        return all(model is not None for model in user_settings_models)
