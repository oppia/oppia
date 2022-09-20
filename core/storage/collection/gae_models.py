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

from __future__ import annotations

import copy
import datetime

from core import feconf
from core import utils
from core.constants import constants
from core.platform import models
import core.storage.base_model.gae_models as base_models

from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services

datastore_services = models.Registry.import_datastore_services()


class CollectionSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a collection snapshot."""

    pass


class CollectionSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a collection snapshot."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE


class CollectionCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to collections.

    A new instance of this model is created and saved every time a commit to
    CollectionModel or CollectionRightsModel occurs.

    The id for this model is of the form 'collection-[collection_id]-[version]'.
    """

    # The id of the collection being edited.
    collection_id = (
        datastore_services.StringProperty(indexed=True, required=True))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize or delete corresponding
        to a user: user_id field.
        """
        return (
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """The history of commits is not relevant for the purposes of Takeout
        since commits don't contain relevant data corresponding to users.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this isn't exported
        because the history of commits isn't deemed as useful for users since
        commit logs don't contain relevant data corresponding to those users.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'collection_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_instance_id(cls, collection_id: str, version: int) -> str:
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
        cls,
        page_size: int,
        urlsafe_start_cursor: Optional[str],
        max_age: Optional[datetime.timedelta] = None
    ) -> Tuple[Sequence[CollectionCommitLogEntryModel], Optional[str], bool]:
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
            ValueError. The max_age is neither an instance of datetime.timedelta
                nor None.

        Returns:
            3-tuple of (results, cursor, more). Where:
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


class CollectionModel(base_models.VersionedModel):
    """Versioned storage model for an Oppia collection.

    This class should only be imported by the collection services file
    and the collection model test file.
    """

    SNAPSHOT_METADATA_CLASS = CollectionSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = CollectionSnapshotContentModel
    COMMIT_LOG_ENTRY_CLASS = CollectionCommitLogEntryModel
    ALLOW_REVERT = True

    # What this collection is called.
    title = datastore_services.StringProperty(required=True)
    # The category this collection belongs to.
    category = datastore_services.StringProperty(required=True, indexed=True)
    # The objective of this collection.
    objective = datastore_services.TextProperty(default='', indexed=False)
    # The language code of this collection.
    language_code = datastore_services.StringProperty(
        default=constants.DEFAULT_LANGUAGE_CODE, indexed=True)
    # Tags associated with this collection.
    tags = datastore_services.StringProperty(repeated=True, indexed=True)

    # The version of all property blob schemas.
    schema_version = datastore_services.IntegerProperty(
        required=True, default=1, indexed=True)

    # A dict representing the contents of a collection. Currently, this
    # contains the list of nodes. This dict should contain collection data
    # whose structure might need to be changed in the future.
    collection_contents = (
        datastore_services.JsonProperty(default={}, indexed=False))

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'category': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'objective': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'tags': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'collection_contents': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def get_collection_count(cls) -> int:
        """Returns the total number of collections."""
        return cls.get_all().count()

    # TODO(#15911): Here we use type Any because 'convert_to_valid_dict' method
    # accepts content NDB JSON properties and those NDB JSON properties have
    # loose typing. So, once we explicitly type those NDB JSON properties, we
    # can remove Any type from here.
    @staticmethod
    def convert_to_valid_dict(model_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Replace invalid fields and values in the CollectionModel dict.

        Some old CollectionModels can contain fields
        and field values that are no longer supported and would cause
        an exception when we try to reconstitute a CollectionModel from
        them. We need to remove or replace these fields and values.

        Args:
            model_dict: dict. The content of the model. Some fields and field
                values might no longer exist in the CollectionModel
                schema.

        Returns:
            dict. The content of the model. Only valid fields and values are
            present.
        """

        # The nodes field is moved to collection_contents dict. We
        # need to move the values from nodes field to collection_contents dict
        # and delete nodes.
        if 'nodes' in model_dict and model_dict['nodes']:
            model_dict['collection_contents']['nodes'] = (
                copy.deepcopy(model_dict['nodes']))
            del model_dict['nodes']

        return model_dict

    # TODO(#15911): Here we use type Any because this '_reconstitute' method
    # accepts content NDB JSON properties and those NDB JSON properties have
    # loose typing. So, once we explicitly type those NDB JSON properties, we
    # can remove Any type from the argument of '_reconstitute' method.
    def _reconstitute(self, snapshot_dict: Dict[str, Any]) -> CollectionModel:
        """Populates the model instance with the snapshot.

        Some old CollectionModels can contain fields
        and field values that are no longer supported and would cause
        an exception when we try to reconstitute a CollectionModel from
        them. We need to remove or replace these fields and values.

        Args:
            snapshot_dict: dict(str, *). The snapshot with the model
                property values.

        Returns:
            VersionedModel. The instance of the VersionedModel class populated
            with the the snapshot.
        """
        self.populate(
            **CollectionModel.convert_to_valid_dict(snapshot_dict))
        return self

    # We expect Mapping because we want to allow models that inherit
    # from BaseModel as the values, if we used Dict this wouldn't be allowed.
    def _prepare_additional_models(self) -> Mapping[str, base_models.BaseModel]:
        """Prepares additional models needed for the commit process.

        Returns:
            dict(str, BaseModel). Additional models needed for
            the commit process. Contains the CollectionRightsModel.
        """
        return {
            'rights_model': CollectionRightsModel.get_by_id(self.id)
        }

    # Here we use MyPy ignore because super class (VersionedModel)
    # defines this 'additional_models' argument as broader type but here
    # we are sure that in this sub-class (CollectionModel) argument
    # 'additional_models' is always going to be of type Dict[str,
    # CollectionRightsModel]. So, due to this conflict in argument types,
    # a conflict in signatures occurred which causes MyPy to throw an
    # error. Thus, to avoid the error, we used ignore here.
    def compute_models_to_commit(  # type: ignore[override]
        self,
        committer_id: str,
        commit_type: str,
        commit_message: Optional[str],
        commit_cmds: base_models.AllowedCommitCmdsListType,
        additional_models: Dict[str, CollectionRightsModel]
    ) -> base_models.ModelsToPutDict:
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str|None. The commit message or None if unpublished
                collection is provided.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
            additional_models: dict(str, BaseModel). Additional models that are
                needed for the commit process.

        Returns:
            ModelsToPutDict. A dict of models that should be put into
            the datastore.
        """
        models_to_put = super().compute_models_to_commit(
            committer_id,
            commit_type,
            commit_message,
            commit_cmds,
            additional_models
        )

        collection_rights_model = additional_models['rights_model']
        collection_commit_log = CollectionCommitLogEntryModel.create(
            self.id,
            self.version,
            committer_id,
            commit_type,
            commit_message,
            commit_cmds,
            collection_rights_model.status,
            collection_rights_model.community_owned
        )
        collection_commit_log.collection_id = self.id
        return {
            'snapshot_metadata_model': models_to_put['snapshot_metadata_model'],
            'snapshot_content_model': models_to_put['snapshot_content_model'],
            'commit_log_model': collection_commit_log,
            'versioned_model': models_to_put['versioned_model'],
        }

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with BaseModel.delete_multi().
    # https://mypy.readthedocs.io/en/stable/error_code_list.html#check-validity-of-overrides-override
    @classmethod
    def delete_multi( # type: ignore[override]
        cls,
        entity_ids: List[str],
        committer_id: str,
        commit_message: str,
        force_deletion: bool = False
    ) -> None:
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
            commit_log_models = []
            collection_rights_models = CollectionRightsModel.get_multi(
                entity_ids, include_deleted=True)
            versioned_models = cls.get_multi(entity_ids, include_deleted=True)
            for model, rights_model in zip(
                versioned_models, collection_rights_models):
                # Ruling out the possibility of None for mypy type checking.
                assert model is not None
                assert rights_model is not None
                collection_commit_log = CollectionCommitLogEntryModel.create(
                    model.id, model.version, committer_id,
                    feconf.COMMIT_TYPE_DELETE,
                    commit_message, [{'cmd': cls.CMD_DELETE_COMMIT}],
                    rights_model.status, rights_model.community_owned
                )
                collection_commit_log.collection_id = model.id
                commit_log_models.append(collection_commit_log)
            CollectionCommitLogEntryModel.update_timestamps_multi(
                commit_log_models)
            datastore_services.put_multi(commit_log_models)


class CollectionRightsSnapshotMetadataModel(
        base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a collection rights snapshot."""

    pass


class CollectionRightsSnapshotContentModel(
        base_models.BaseSnapshotContentModel):
    """Storage model for the content of a collection rights snapshot."""

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize or delete corresponding
        to a user: inside the content field there are owner_ids, editor_ids,
        voice_artist_ids, and viewer_ids fields.

        The pseudonymization of this model is handled in the wipeout_service
        in the _pseudonymize_activity_models_with_associated_rights_models(),
        based on the content_user_ids field of the
        CollectionRightsSnapshotMetadataModel.
        """
        return base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether CollectionRightsSnapshotContentModel references
        the given user. The owner_ids, editor_ids, voice_artist_ids,
        and viewer_ids fields are checked through content_user_ids field in
        the CollectionRightsSnapshotMetadataModel.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return CollectionRightsSnapshotMetadataModel.query(
            CollectionRightsSnapshotMetadataModel.content_user_ids == user_id
        ).get(keys_only=True) is not None


class CollectionRightsModel(base_models.VersionedModel):
    """Storage model for rights related to a collection.

    The id of each instance is the id of the corresponding collection.
    """

    SNAPSHOT_METADATA_CLASS = CollectionRightsSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = CollectionRightsSnapshotContentModel
    ALLOW_REVERT = False

    # The user_ids of owners of this collection.
    owner_ids = datastore_services.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to edit this collection.
    editor_ids = datastore_services.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to voiceover this collection.
    voice_artist_ids = (
        datastore_services.StringProperty(indexed=True, repeated=True))
    # The user_ids of users who are allowed to view this collection.
    viewer_ids = datastore_services.StringProperty(indexed=True, repeated=True)

    # Whether this collection is owned by the community.
    community_owned = (
        datastore_services.BooleanProperty(indexed=True, default=False))
    # For private collections, whether this collection can be viewed
    # by anyone who has the URL. If the collection is not private, this
    # setting is ignored.
    viewable_if_private = (
        datastore_services.BooleanProperty(indexed=True, default=False))
    # Time, in milliseconds, when the collection was first published.
    first_published_msec = (
        datastore_services.FloatProperty(indexed=True, default=None))

    # The publication status of this collection.
    status = datastore_services.StringProperty(
        default=constants.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            constants.ACTIVITY_STATUS_PRIVATE,
            constants.ACTIVITY_STATUS_PUBLIC
        ]
    )

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize or delete corresponding
        to a user: viewer_ids, voice_artist_ids, editor_ids,
        and owner_ids fields.
        """
        return (
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model is exported as one instance shared across users since multiple
        users contribute to collections and have varying rights.
        """
        return (
            base_models
            .MODEL_ASSOCIATION_TO_USER
            .ONE_INSTANCE_SHARED_ACROSS_USERS)

    @classmethod
    def get_field_name_mapping_to_takeout_keys(cls) -> Dict[str, str]:
        """Defines the mapping of field names to takeout keys since this model
        is exported as one instance shared across users.
        """
        return {
            'owner_ids': 'owned_collection_ids',
            'editor_ids': 'editable_collection_ids',
            'voice_artist_ids': 'voiced_collection_ids',
            'viewer_ids': 'viewable_collection_ids'
        }

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data to export/delete corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'owner_ids': base_models.EXPORT_POLICY.EXPORTED,
            'editor_ids': base_models.EXPORT_POLICY.EXPORTED,
            'voice_artist_ids': base_models.EXPORT_POLICY.EXPORTED,
            'viewer_ids': base_models.EXPORT_POLICY.EXPORTED,
            'community_owned': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'viewable_if_private': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'status': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'first_published_msec': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether CollectionRightsModel references the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(datastore_services.any_of(
            cls.owner_ids == user_id,
            cls.editor_ids == user_id,
            cls.voice_artist_ids == user_id,
            cls.viewer_ids == user_id
        )).get(keys_only=True) is not None

    def save(
        self,
        committer_id: str,
        commit_message: str,
        commit_cmds: base_models.AllowedCommitCmdsListType
    ) -> None:
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
        super().commit(
            committer_id, commit_message, commit_cmds)

    # TODO(#15911): Here we use type Any because 'convert_to_valid_dict' method
    # accepts content NDB JSON properties and those NDB JSON properties have
    # loose typing. So, once we explicitly type those NDB JSON properties, we
    # can remove Any type from here.
    @staticmethod
    def convert_to_valid_dict(model_dict: Dict[str, Any]) -> Dict[str, Any]:
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
            del model_dict['translator_ids']

        # We need to remove pseudonymous IDs from all the fields that contain
        # user IDs.
        for field_name in (
                'owner_ids', 'editor_ids', 'voice_artist_ids', 'viewer_ids'):
            model_dict[field_name] = [
                user_id for user_id in model_dict[field_name]
                if not utils.is_pseudonymous_id(user_id)
            ]

        return model_dict

    # TODO(#15911): Here we use type Any because this '_reconstitute' method
    # accepts content NDB JSON properties and those NDB JSON properties have
    # loose typing. So, once we explicitly type those NDB JSON properties, we
    # can remove Any type from the argument of '_reconstitute' method.
    def _reconstitute(
        self, snapshot_dict: Dict[str, Any]
    ) -> CollectionRightsModel:
        """Populates the model instance with the snapshot.

        Some old CollectionRightsSnapshotContentModels can contain fields
        and field values that are no longer supported and would cause
        an exception when we try to reconstitute a CollectionRightsModel from
        them. We need to remove or replace these fields and values.

        Args:
            snapshot_dict: dict(str, *). The snapshot with the model
                property values.

        Returns:
            VersionedModel. The instance of the VersionedModel class populated
            with the the snapshot.
        """
        self.populate(
            **CollectionRightsModel.convert_to_valid_dict(snapshot_dict))
        return self

    def compute_models_to_commit(
        self,
        committer_id: str,
        commit_type: str,
        commit_message: Optional[str],
        commit_cmds: base_models.AllowedCommitCmdsListType,
        # We expect Mapping because we want to allow models that inherit
        # from BaseModel as the values, if we used Dict this wouldn't
        # be allowed.
        additional_models: Mapping[str, base_models.BaseModel]
    ) -> base_models.ModelsToPutDict:
        """Record the event to the commit log after the model commit.

        Note that this overrides the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str|None. The commit message or None if unpublished
                collection is provided.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
            additional_models: dict(str, BaseModel). Additional models that are
                needed for the commit process.

        Returns:
            ModelsToPutDict. A dict of models that should be put into
            the datastore.
        """
        models_to_put = super().compute_models_to_commit(
            committer_id,
            commit_type,
            commit_message,
            commit_cmds,
            additional_models
        )

        snapshot_metadata_model = models_to_put['snapshot_metadata_model']
        snapshot_metadata_model.content_user_ids = list(sorted(
            set(self.owner_ids) |
            set(self.editor_ids) |
            set(self.voice_artist_ids) |
            set(self.viewer_ids)
        ))

        commit_cmds_user_ids = set()
        for commit_cmd in commit_cmds:
            user_id_attribute_names = next(
                cmd['user_id_attribute_names']
                for cmd in feconf.COLLECTION_RIGHTS_CHANGE_ALLOWED_COMMANDS
                if cmd['name'] == commit_cmd['cmd']
            )
            for user_id_attribute_name in user_id_attribute_names:
                user_id_name_value = commit_cmd[user_id_attribute_name]
                # # Ruling out the possibility of any other type for mypy type
                # checking.
                assert isinstance(user_id_name_value, str)
                commit_cmds_user_ids.add(user_id_name_value)
        snapshot_metadata_model.commit_cmds_user_ids = list(
            sorted(commit_cmds_user_ids))

        # Create and delete events will already be recorded in the
        # CollectionModel.
        if commit_type not in ['create', 'delete']:
            collection_commit_log = CollectionCommitLogEntryModel(
                id=('rights-%s-%s' % (self.id, self.version)),
                user_id=committer_id,
                collection_id=self.id,
                commit_type=commit_type,
                commit_message=commit_message,
                commit_cmds=commit_cmds,
                version=None,
                post_commit_status=self.status,
                post_commit_community_owned=self.community_owned,
                post_commit_is_private=(
                    self.status == constants.ACTIVITY_STATUS_PRIVATE)
            )
            return {
                'snapshot_metadata_model': (
                    models_to_put['snapshot_metadata_model']),
                'snapshot_content_model': (
                    models_to_put['snapshot_content_model']),
                'commit_log_model': collection_commit_log,
                'versioned_model': models_to_put['versioned_model'],
            }

        return models_to_put

    @classmethod
    def export_data(cls, user_id: str) -> Dict[str, List[str]]:
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
    title = datastore_services.StringProperty(required=True)
    # The category this collection belongs to.
    category = datastore_services.StringProperty(required=True, indexed=True)
    # The objective of this collection.
    objective = datastore_services.TextProperty(required=True, indexed=False)
    # The ISO 639-1 code for the language this collection is written in.
    language_code = (
        datastore_services.StringProperty(required=True, indexed=True))
    # Tags associated with this collection.
    tags = datastore_services.StringProperty(repeated=True, indexed=True)

    # Aggregate user-assigned ratings of the collection.
    ratings = datastore_services.JsonProperty(default=None, indexed=False)

    # Time when the collection model was last updated (not to be
    # confused with last_updated, which is the time when the
    # collection *summary* model was last updated).
    collection_model_last_updated = (
        datastore_services.DateTimeProperty(indexed=True))
    # Time when the collection model was created (not to be confused
    # with created_on, which is the time when the collection *summary*
    # model was created).
    collection_model_created_on = (
        datastore_services.DateTimeProperty(indexed=True))

    # The publication status of this collection.
    status = datastore_services.StringProperty(
        default=constants.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            constants.ACTIVITY_STATUS_PRIVATE,
            constants.ACTIVITY_STATUS_PUBLIC
        ]
    )

    # Whether this collection is owned by the community.
    community_owned = (
        datastore_services.BooleanProperty(required=True, indexed=True))

    # The user_ids of owners of this collection.
    owner_ids = datastore_services.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to edit this collection.
    editor_ids = datastore_services.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to view this collection.
    viewer_ids = datastore_services.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who have contributed (humans who have made a
    # positive (not just a revert) change to the collection's content).
    # NOTE TO DEVELOPERS: contributor_ids and contributors_summary need to be
    # synchronized, meaning that the keys in contributors_summary need be
    # equal to the contributor_ids list.
    contributor_ids = (
        datastore_services.StringProperty(indexed=True, repeated=True))
    # A dict representing the contributors of non-trivial commits to this
    # collection. Each key of this dict is a user_id, and the corresponding
    # value is the number of non-trivial commits that the user has made.
    contributors_summary = (
        datastore_services.JsonProperty(default={}, indexed=False))
    # The version number of the collection after this commit. Only populated
    # for commits to an collection (as opposed to its rights, etc.).
    version = datastore_services.IntegerProperty()
    # The number of nodes(explorations) that are within this collection.
    node_count = datastore_services.IntegerProperty()

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model contains data to pseudonymize or delete corresponding
        to a user: viewer_ids, editor_ids, owner_ids, contributor_ids,
        and contributors_summary fields.
        """
        return (
            base_models.DELETION_POLICY.PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE
        )

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model data has already been exported as a part of the
        CollectionRightsModel, and thus does not need an export_data
        function.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model contains data corresponding to a user, but this isn't exported
        because noteworthy details that belong to this model have already been
        exported as a part of the CollectionRightsModel.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'title': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'category': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'objective': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'tags': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'ratings': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'collection_model_last_updated':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'collection_model_created_on':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'status': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'community_owned': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'owner_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'editor_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'viewer_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'contributor_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'contributors_summary': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'node_count': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id: str) -> bool:
        """Check whether CollectionSummaryModel references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(datastore_services.any_of(
            cls.owner_ids == user_id,
            cls.editor_ids == user_id,
            cls.viewer_ids == user_id,
            cls.contributor_ids == user_id)).get(keys_only=True) is not None

    @classmethod
    def get_non_private(cls) -> Sequence[CollectionSummaryModel]:
        """Returns an iterable with non-private collection summary models.

        Returns:
            iterable. An iterable with non-private collection summary models.
        """
        return cls.get_all().filter(
            cls.status != constants.ACTIVITY_STATUS_PRIVATE
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_private_at_least_viewable(
        cls, user_id: str
    ) -> Sequence[CollectionSummaryModel]:
        """Returns an iterable with private collection summary models that are
        at least viewable by the given user.

        Args:
            user_id: str. The id of the given user.

        Returns:
            iterable. An iterable with private collection summary models that
            are at least viewable by the given user.
        """
        return cls.get_all().filter(
            cls.status == constants.ACTIVITY_STATUS_PRIVATE
        ).filter(
            datastore_services.any_of(
                cls.owner_ids == user_id,
                cls.editor_ids == user_id,
                cls.viewer_ids == user_id
            )
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_at_least_editable(
        cls, user_id: str
    ) -> Sequence[CollectionSummaryModel]:
        """Returns an iterable with collection summary models that are at least
        editable by the given user.

        Args:
            user_id: str. The id of the given user.

        Returns:
            iterable. An iterable with collection summary models that are at
            least viewable by the given user.
        """
        return CollectionSummaryModel.get_all().filter(
            datastore_services.any_of(
                CollectionSummaryModel.owner_ids == user_id,
                CollectionSummaryModel.editor_ids == user_id
            )
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)
