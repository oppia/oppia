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

"""Base model class."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.platform import models
import feconf
import python_utils
import utils

transaction_services = models.Registry.import_transaction_services()
datastore_services = models.Registry.import_datastore_services()

# The delimiter used to separate the version number from the model instance
# id. To get the instance id from a snapshot id, use Python's rfind()
# method to find the location of this delimiter.
VERSION_DELIMITER = '-'

# Types of deletion policies. The pragma comment is needed because Enums are
# evaluated as classes in Python and they should use PascalCase, but using
# UPPER_CASE seems more appropriate here.
DELETION_POLICY = utils.create_enum(  # pylint: disable=invalid-name
    # Models that should be kept.
    'KEEP',
    # Models that should be deleted.
    'DELETE',
    # Models that should be deleted after all the other models are deleted and
    # verified to be deleted.
    'DELETE_AT_END',
    # Models that should be pseudonymized in their local context.
    'LOCALLY_PSEUDONYMIZE',
    # Models that should be pseudonymized if they are published and otherwise
    # (when private) deleted.
    'PSEUDONYMIZE_IF_PUBLIC_DELETE_IF_PRIVATE',
    # Models that are not directly or indirectly related to users.
    'NOT_APPLICABLE'
)

EXPORT_POLICY = utils.create_enum(  # pylint: disable=invalid-name
    # Indicates that a model's field is to be exported.
    'EXPORTED',
    # Indicates that the value of the field is exported as the key in the
    # Takeout dict.
    'EXPORTED_AS_KEY_FOR_TAKEOUT_DICT',
    # Indicates that a model's field should not be exported.
    'NOT_APPLICABLE'
)

MODEL_ASSOCIATION_TO_USER = utils.create_enum(  # pylint: disable=invalid-name
    # Indicates that a model has a single instance per user.
    'ONE_INSTANCE_PER_USER',
    # Indicates that a model can be shared by multiple users.
    'ONE_INSTANCE_SHARED_ACROSS_USERS',
    # Indicates that a model has multiple instances, specific to a user.
    'MULTIPLE_INSTANCES_PER_USER',
    # Indicates that a model should not be exported.
    'NOT_CORRESPONDING_TO_USER'
)

# Constant used when retrieving big number of models.
FETCH_BATCH_SIZE = 1000

# Constants used for generating ids.
MAX_RETRIES = 10
RAND_RANGE = (1 << 30) - 1
ID_LENGTH = 12


class BaseModel(datastore_services.Model):
    """Base model for all persistent object storage classes."""

    # Specifies whether the model's id is used as a key in Takeout. By default,
    # the model's id is not used as the key for the Takeout dict.
    ID_IS_USED_AS_TAKEOUT_KEY = False

    # When this entity was first created. This value should only be modified by
    # the update_timestamps method.
    created_on = (
        datastore_services.DateTimeProperty(indexed=True, required=True))
    # When this entity was last updated. This value should only be modified by
    # the update_timestamps method.
    last_updated = (
        datastore_services.DateTimeProperty(indexed=True, required=True))
    # Whether the current version of the model instance is deleted.
    deleted = datastore_services.BooleanProperty(indexed=True, default=False)

    def __init__(self, *args, **kwargs):
        super(BaseModel, self).__init__(*args, **kwargs)
        self._last_updated_timestamp_is_fresh = False

    def _pre_put_hook(self):
        """Operations to perform just before the model is `put` into storage.

        Raises:
            Exception. The model has not refreshed the value of last_updated.
        """
        super(BaseModel, self)._pre_put_hook()

        if self.created_on is None:
            self.created_on = datetime.datetime.utcnow()

        if self.last_updated is None:
            self.last_updated = datetime.datetime.utcnow()
            self._last_updated_timestamp_is_fresh = True

        if not self._last_updated_timestamp_is_fresh:
            raise Exception(
                '%s did not call update_timestamps() yet' % type(self).__name__)

        self._last_updated_timestamp_is_fresh = False

    @property
    def id(self):
        """A unique id for this model instance."""
        return self.key.id()

    class EntityNotFoundError(Exception):
        """Raised when no entity for a given id exists in the datastore."""

        pass

    @staticmethod
    def get_lowest_supported_role():
        """The lowest supported role for all the classes will be Exploration
        editor by default. The subclasses may override this value if needed.
        """
        return feconf.ROLE_ID_EXPLORATION_EDITOR

    @staticmethod
    def get_deletion_policy():
        """This method should be implemented by subclasses.

        Raises:
            NotImplementedError. The method is not overwritten in a derived
                class.
        """
        raise NotImplementedError(
            'The get_deletion_policy() method is missing from the '
            'derived class. It should be implemented in the derived class.')

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """This method should be implemented by subclasses.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Raises:
            NotImplementedError. The method is not overwritten in a derived
                class.
        """
        raise NotImplementedError(
            'The has_reference_to_user_id() method is missing from the '
            'derived class. It should be implemented in the derived class.')

    @staticmethod
    def export_data(user_id):
        """This method should be implemented by subclasses.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Raises:
            NotImplementedError. The method is not overwritten in a derived
                class.
        """
        raise NotImplementedError(
            'The export_data() method is missing from the '
            'derived class. It should be implemented in the derived class.')

    @staticmethod
    def get_model_association_to_user():
        """This method should be implemented by subclasses.

        Raises:
            NotImplementedError. The method is not overwritten in a derived
                class.
        """
        raise NotImplementedError(
            'The get_model_association_to_user() method is missing from the '
            'derived class. It should be implemented in the derived class.')

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user."""
        return {
            'created_on': EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': EXPORT_POLICY.NOT_APPLICABLE
        }

    @classmethod
    def get_field_names_for_takeout(cls):
        """Returns a dictionary containing a mapping from field names to
        export dictionary keys for fields whose export dictionary key does
        not match their field name.
        """
        return {}

    @classmethod
    def get(cls, entity_id, strict=True):
        """Gets an entity by id.

        Args:
            entity_id: str. The entity id.
            strict: bool. Whether to fail noisily if no entity with the given id
                exists in the datastore. Default is True.

        Returns:
            None|*. None, if strict == False and no undeleted entity with the
            given id exists in the datastore. Otherwise, the entity instance
            that corresponds to the given id.

        Raises:
            BaseModel.EntityNotFoundError. The value of strict is
                True and no undeleted entity with the given id exists in the
                datastore.
        """
        entity = cls.get_by_id(entity_id)
        if entity and entity.deleted:
            entity = None

        if strict and entity is None:
            raise cls.EntityNotFoundError(
                'Entity for class %s with id %s not found' %
                (cls.__name__, entity_id))
        return entity

    @classmethod
    def get_multi(cls, entity_ids, include_deleted=False):
        """Gets list of entities by list of ids.

        Args:
            entity_ids: list(str). List of entity ids.
            include_deleted: bool. Whether to include deleted entities in the
                return list. Default is False.

        Returns:
            list(*|None). A list that contains model instances that match
            the corresponding entity_ids in the input list. If an instance is
            not found, or it has been deleted and include_deleted is False,
            then the corresponding entry is None.
        """
        entity_keys = []
        none_argument_indices = []
        for index, entity_id in enumerate(entity_ids):
            if entity_id:
                entity_keys.append(datastore_services.Key(cls, entity_id))
            else:
                none_argument_indices.append(index)

        entities = datastore_services.get_multi(entity_keys)
        for index in none_argument_indices:
            entities.insert(index, None)

        if not include_deleted:
            for i in python_utils.RANGE(len(entities)):
                if entities[i] and entities[i].deleted:
                    entities[i] = None
        return entities

    def update_timestamps(self, update_last_updated_time=True):
        """Update the created_on and last_updated fields.

        Args:
            update_last_updated_time: bool. Whether to update the
                last_updated field of the model.
        """
        self._last_updated_timestamp_is_fresh = True

        if self.created_on is None:
            self.created_on = datetime.datetime.utcnow()

        if update_last_updated_time or self.last_updated is None:
            self.last_updated = datetime.datetime.utcnow()

    @classmethod
    def update_timestamps_multi(cls, entities, update_last_updated_time=True):
        """Update the created_on and last_updated fields of all given entities.

        Args:
            entities: list(datastore_services.Model). List of model instances to
                be stored.
            update_last_updated_time: bool. Whether to update the
                last_updated field of the model.
        """
        datastore_services.update_timestamps_multi(
            entities, update_last_updated_time=update_last_updated_time)

    @classmethod
    def put_multi(cls, entities):
        """Stores the given datastore_services.Model instances.

        Args:
            entities: list(datastore_services.Model). List of model instances to
                be stored.
        """
        datastore_services.put_multi(entities)

    @classmethod
    def delete_multi(cls, entities):
        """Deletes the given datastore_services.Model instances.

        Args:
            entities: list(datastore_services.Model). The list of model
                instances to be deleted.
        """
        datastore_services.delete_multi([entity.key for entity in entities])

    @classmethod
    def delete_by_id(cls, instance_id):
        """Deletes instance by id.

        Args:
            instance_id: str. Id of the model to delete.
        """
        datastore_services.Key(cls, instance_id).delete()

    def delete(self):
        """Deletes this instance."""
        self.key.delete()

    @classmethod
    def get_all(cls, include_deleted=False):
        """Gets iterable of all entities of this class.

        Args:
            include_deleted: bool. If True, then entities that have been marked
                deleted are returned as well. Defaults to False.

        Returns:
            iterable. Filterable iterable of all entities of this class.
        """
        return (
            cls.query() if include_deleted else
            cls.query().filter(cls.deleted == False)) # pylint: disable=singleton-comparison

    @classmethod
    def get_new_id(cls, entity_name):
        """Gets a new id for an entity, based on its name.

        The returned id is guaranteed to be unique among all instances of this
        entity.

        Args:
            entity_name: The name of the entity. Coerced to a utf-8 encoded
                string.

        Returns:
            str. New unique id for this entity class.

        Raises:
            Exception. An ID cannot be generated within a reasonable number
                of attempts.
        """
        for _ in python_utils.RANGE(MAX_RETRIES):
            new_id = utils.convert_to_hash(
                '%s%s' % (entity_name, utils.get_random_int(RAND_RANGE)),
                ID_LENGTH)
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception('New id generator is producing too many collisions.')

    @classmethod
    def _fetch_page_sorted_by_last_updated(
            cls, query, page_size, urlsafe_start_cursor):
        """Fetches a page of entities sorted by their last_updated attribute in
        descending order (newly updated first).

        Args:
            query: datastore_services.Query. The query object to be used to
                fetch entities.
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of returned
                entities starts from this datastore cursor. Otherwise,
                the returned entities start from the beginning of the full
                list of entities.

        Returns:
            3-tuple (results, cursor, more). As described in fetch_page() at:
            https://developers.google.com/appengine/docs/python/ndb/queryclass,
            where:
                results: List of query results.
                cursor: str or None. A query cursor pointing to the next batch
                    of results. If there are no more results, this will be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        if urlsafe_start_cursor:
            start_cursor = datastore_services.make_cursor(
                urlsafe_cursor=urlsafe_start_cursor)
        else:
            start_cursor = None

        result = query.order(-cls.last_updated).fetch_page(
            page_size, start_cursor=start_cursor)
        return (
            result[0],
            (result[1].urlsafe() if result[1] else None),
            result[2])


class BaseHumanMaintainedModel(BaseModel):
    """A model that tracks the last time it was updated by a human.

    When the model is updated by a human, use `self.put_for_human()` to store
    it. For example: after the title of an exploration is changed
    by its creator.

    Otherwise, when the model is updated by some non-human or automated process,
    use `self.put_for_bot()`. For example: by a one-off job updating the
    schema version of a property.
    """

    # When this entity was last updated on behalf of a human.
    last_updated_by_human = (
        datastore_services.DateTimeProperty(indexed=True, required=True))

    def put(self):
        """Unsupported operation on human-maintained models."""
        raise NotImplementedError('Use put_for_human or put_for_bot instead')

    def put_for_human(self):
        """Stores the model instance on behalf of a human."""
        self.last_updated_by_human = datetime.datetime.utcnow()
        return super(BaseHumanMaintainedModel, self).put()

    def put_for_bot(self):
        """Stores the model instance on behalf of a non-human."""
        return super(BaseHumanMaintainedModel, self).put()

    @classmethod
    def put_multi(cls, unused_instances):
        """Unsupported operation on human-maintained models."""
        raise NotImplementedError(
            'Use put_multi_for_human or put_multi_for_bot instead')

    @classmethod
    def put_multi_for_human(cls, instances):
        """Stores the given model instances on behalf of a human.

        Args:
            instances: list(BaseHumanMaintainedModel). The instances to store.

        Returns:
            list(future). A list of futures.
        """
        now = datetime.datetime.utcnow()
        for instance in instances:
            instance.last_updated_by_human = now
        return super(BaseHumanMaintainedModel, cls).put_multi(instances)

    @classmethod
    def put_multi_for_bot(cls, instances):
        """Stores the given model instances on behalf of a non-human.

        Args:
            instances: list(BaseHumanMaintainedModel). The instances to store.

        Returns:
            list(future). A list of futures.
        """
        return super(BaseHumanMaintainedModel, cls).put_multi(instances)


class BaseCommitLogEntryModel(BaseModel):
    """Base Model for the models that store the log of commits to a
    construct.
    """

    # The id of the user.
    user_id = datastore_services.StringProperty(indexed=True, required=True)
    # The type of the commit: 'create', 'revert', 'edit', 'delete'.
    commit_type = datastore_services.StringProperty(indexed=True, required=True)
    # The commit message.
    commit_message = datastore_services.TextProperty(indexed=False)
    # The commit_cmds dict for this commit.
    commit_cmds = datastore_services.JsonProperty(indexed=False, required=True)
    # The status of the entity after the edit event ('private', 'public').
    post_commit_status = (
        datastore_services.StringProperty(indexed=True, required=True))
    # Whether the entity is community-owned after the edit event.
    post_commit_community_owned = (
        datastore_services.BooleanProperty(indexed=True))
    # Whether the entity is private after the edit event. Having a
    # separate field for this makes queries faster, since an equality query
    # on this property is faster than an inequality query on
    # post_commit_status.
    post_commit_is_private = datastore_services.BooleanProperty(indexed=True)
    # The version number of the model after this commit.
    version = datastore_services.IntegerProperty()

    @staticmethod
    def get_model_association_to_user():
        """The history of commits is not relevant for the purposes of
        Takeout, since commits do not contain any personal data of the user.
        """
        return MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @staticmethod
    def get_deletion_policy():
        """Model contains data corresponding to a user that
        requires pseudonymization: user_id field.
        """
        return DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @classmethod
    def get_export_policy(cls):
        """Model contains data corresponding to a user,
        but this isn't exported because the history of commits is not
        relevant to a user for the purposes of Takeout, since commits do not
        contain any personal user data.
        """
        return dict(BaseModel.get_export_policy(), **{
            'user_id': EXPORT_POLICY.NOT_APPLICABLE,
            'commit_type': EXPORT_POLICY.NOT_APPLICABLE,
            'commit_message': EXPORT_POLICY.NOT_APPLICABLE,
            'commit_cmds': EXPORT_POLICY.NOT_APPLICABLE,
            'post_commit_status': EXPORT_POLICY.NOT_APPLICABLE,
            'post_commit_community_owned':
                EXPORT_POLICY.NOT_APPLICABLE,
            'post_commit_is_private': EXPORT_POLICY.NOT_APPLICABLE,
            'version': EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether BaseCommitLogEntryModel references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(cls.user_id == user_id).get(keys_only=True) is not None

    @classmethod
    def create(
            cls, entity_id, version, committer_id, commit_type, commit_message,
            commit_cmds, status, community_owned):
        """This method returns an instance of the CommitLogEntryModel for a
        construct with the common fields filled.

        Args:
            entity_id: str. The ID of the construct corresponding to this
                commit log entry model (e.g. the exp_id for an exploration,
                the story_id for a story, etc.).
            version: int. The version number of the model after the commit.
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
            status: str. The status of the entity after the commit.
            community_owned: bool. Whether the entity is community_owned after
                the commit.

        Returns:
            CommitLogEntryModel. Returns the respective CommitLogEntryModel
            instance of the construct from which this is called.
        """
        return cls(
            id=cls._get_instance_id(entity_id, version),
            user_id=committer_id,
            commit_type=commit_type,
            commit_message=commit_message,
            commit_cmds=commit_cmds,
            version=version,
            post_commit_status=status,
            post_commit_community_owned=community_owned,
            post_commit_is_private=(
                status == constants.ACTIVITY_STATUS_PRIVATE)
        )

    @classmethod
    def _get_instance_id(cls, target_entity_id, version):
        """This method should be implemented in the inherited classes.

        Args:
            target_entity_id: str. The ID of the construct corresponding to this
                commit log entry model (e.g. the exp_id for an exploration,
                the story_id for a story, etc.).
            version: int. The version number of the model after the commit.

        Raises:
            NotImplementedError. The method is not overwritten in derived
                classes.
        """
        raise NotImplementedError(
            'The _get_instance_id() method is missing from the '
            'derived class. It should be implemented in the derived class.')

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
            3-tuple (results, cursor, more). As described in fetch_page() at:
            https://developers.google.com/appengine/docs/python/ndb/queryclass,
            where:
                results: List of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this might
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(), page_size, urlsafe_start_cursor)

    @classmethod
    def get_commit(cls, target_entity_id, version):
        """Returns the commit corresponding to an instance id and
        version number.

        Args:
            target_entity_id: str. The ID of the construct corresponding to this
                commit log entry model (e.g. the exp_id for an exploration,
                the story_id for a story, etc.).
            version: int. The version number of the instance
                after the commit.

        Returns:
            BaseCommitLogEntryModel. The commit with the target entity id and
            version number.
        """
        commit_id = cls._get_instance_id(target_entity_id, version)
        return cls.get_by_id(commit_id)


class VersionedModel(BaseModel):
    """Model that handles storage of the version history of model instances.

    To use this class, you must declare a SNAPSHOT_METADATA_CLASS and a
    SNAPSHOT_CONTENT_CLASS. The former must contain the String fields
    'committer_id', 'commit_type' and 'commit_message', and a JSON field for
    the Python list of dicts, 'commit_cmds'. The latter must contain the JSON
    field 'content'. The item that is being versioned must be serializable to a
    JSON blob.

    Note that commit() should be used for VersionedModels, as opposed to put()
    for direct subclasses of BaseModel.
    """

    # The class designated as the snapshot model. This should be a subclass of
    # BaseSnapshotMetadataModel.
    SNAPSHOT_METADATA_CLASS = None
    # The class designated as the snapshot content model. This should be a
    # subclass of BaseSnapshotContentModel.
    SNAPSHOT_CONTENT_CLASS = None
    # Whether reverting is allowed. Default is False.
    ALLOW_REVERT = False

    # IMPORTANT: Subclasses should only overwrite things above this line.

    # The possible commit types.
    _COMMIT_TYPE_CREATE = 'create'
    _COMMIT_TYPE_REVERT = 'revert'
    _COMMIT_TYPE_EDIT = 'edit'
    _COMMIT_TYPE_DELETE = 'delete'
    # A list containing the possible commit types.
    COMMIT_TYPE_CHOICES = [
        _COMMIT_TYPE_CREATE, _COMMIT_TYPE_REVERT, _COMMIT_TYPE_EDIT,
        _COMMIT_TYPE_DELETE
    ]
    # The reserved prefix for keys that are automatically inserted into a
    # commit_cmd dict by this model.
    _AUTOGENERATED_PREFIX = feconf.AUTOGENERATED_PREFIX

    # The command string for a revert commit.
    CMD_REVERT_COMMIT = feconf.CMD_REVERT_COMMIT

    # The command string for a delete commit.
    CMD_DELETE_COMMIT = feconf.CMD_DELETE_COMMIT

    # The current version number of this instance. In each PUT operation,
    # this number is incremented and a snapshot of the modified instance is
    # stored in the snapshot metadata and content models. The snapshot
    # version number starts at 1 when the model instance is first created.
    # All data in this instance represents the version at HEAD; data about the
    # previous versions is stored in the snapshot models.
    version = datastore_services.IntegerProperty(default=0)

    def _require_not_marked_deleted(self):
        """Checks whether the model instance is deleted."""
        if self.deleted:
            raise Exception('This model instance has been deleted.')

    def compute_snapshot(self):
        """Generates a snapshot (dict) from the model property values."""
        return self.to_dict(exclude=['created_on', 'last_updated'])

    def _reconstitute(self, snapshot_dict):
        """Populates the model instance with the snapshot.

        Args:
            snapshot_dict: dict(str, *). The snapshot with the model
                property values.

        Returns:
            VersionedModel. The instance of the VersionedModel class populated
            with the the snapshot.
        """
        self.populate(**snapshot_dict)
        return self

    def _reconstitute_from_snapshot_id(self, snapshot_id):
        """Gets a reconstituted instance of this model class, based on the given
        snapshot id.

        Args:
            snapshot_id: str. The given snapshot id.

        Returns:
            VersionedModel. Reconstituted instance.
        """
        snapshot_model = self.SNAPSHOT_CONTENT_CLASS.get(snapshot_id)
        snapshot_dict = snapshot_model.content
        reconstituted_model = self._reconstitute(snapshot_dict)
        # TODO(sll): The 'created_on' and 'last_updated' values here will be
        # slightly different from the values the entity model would have had,
        # since they correspond to the corresponding fields for the snapshot
        # content model instead. Figure out whether this is a problem or not,
        # and whether we need to record the contents of those fields in the
        # actual entity model (in which case we also need a way to deal with
        # old snapshots that don't have this information).
        reconstituted_model.created_on = snapshot_model.created_on
        reconstituted_model.last_updated = snapshot_model.last_updated
        return reconstituted_model

    @classmethod
    def get_snapshot_id(cls, instance_id, version_number):
        """Gets a unique snapshot id for this instance and version.

        Args:
            instance_id: str. The given instance id.
            version_number: int. The given version number.

        Returns:
            str. The unique snapshot id corresponding to the given instance and
            version.
        """
        return '%s%s%s' % (
            instance_id, VERSION_DELIMITER, version_number)

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Evaluates and executes commit. Main function for all commit types.

        Args:
            committer_id: str. The user_id of the user who committed the change.
            commit_type: str. Unique identifier of commit type. Possible values
                are in COMMIT_TYPE_CHOICES.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, should give sufficient information to
                reconstruct the commit. Dict always contains:
                    cmd: str. Unique command.
                And then additional arguments for that command. For example:

                {'cmd': 'AUTO_revert_version_number'
                 'version_number': 4}

        Raises:
            Exception. No snapshot metadata class has been defined.
            Exception. No snapshot content class has been defined.
            Exception. The commit_cmds is not a list of dicts.
        """
        if self.SNAPSHOT_METADATA_CLASS is None:
            raise Exception('No snapshot metadata class defined.')
        if self.SNAPSHOT_CONTENT_CLASS is None:
            raise Exception('No snapshot content class defined.')
        if not isinstance(commit_cmds, list):
            raise Exception(
                'Expected commit_cmds to be a list of dicts, received %s'
                % commit_cmds)

        self.version += 1

        snapshot = self.compute_snapshot()
        snapshot_id = self.get_snapshot_id(self.id, self.version)

        snapshot_metadata_instance = self.SNAPSHOT_METADATA_CLASS.create(
            snapshot_id, committer_id, commit_type, commit_message, commit_cmds)
        snapshot_content_instance = (
            self.SNAPSHOT_CONTENT_CLASS.create(snapshot_id, snapshot))

        entities = [snapshot_metadata_instance, snapshot_content_instance, self]
        self.update_timestamps_multi(entities)
        transaction_services.run_in_transaction(BaseModel.put_multi, entities)

    def delete(self, committer_id, commit_message, force_deletion=False):
        """Deletes this model instance.

        Args:
            committer_id: str. The user_id of the user who committed the change.
            commit_message: str. The commit description message.
            force_deletion: bool. If True this model is deleted
                completely from storage, otherwise it is only marked as deleted.
                Default is False.

        Raises:
            Exception. This model instance has been already deleted.
        """
        if force_deletion:
            current_version = self.version

            version_numbers = [
                python_utils.UNICODE(num + 1) for num in python_utils.RANGE(
                    current_version)]
            snapshot_ids = [
                self.get_snapshot_id(self.id, version_number)
                for version_number in version_numbers]

            metadata_keys = [
                datastore_services.Key(
                    self.SNAPSHOT_METADATA_CLASS, snapshot_id)
                for snapshot_id in snapshot_ids]
            datastore_services.delete_multi(metadata_keys)

            content_keys = [
                datastore_services.Key(self.SNAPSHOT_CONTENT_CLASS, snapshot_id)
                for snapshot_id in snapshot_ids]
            datastore_services.delete_multi(content_keys)

            super(VersionedModel, self).delete()
        else:
            self._require_not_marked_deleted()  # pylint: disable=protected-access
            self.deleted = True

            commit_cmds = [{
                'cmd': self.CMD_DELETE_COMMIT
            }]

            self._trusted_commit(
                committer_id, self._COMMIT_TYPE_DELETE, commit_message,
                commit_cmds)

    @classmethod
    def delete_multi(
            cls, entity_ids, committer_id, commit_message,
            force_deletion=False):
        """Deletes the given cls instancies with the given entity_ids.

        Args:
            entity_ids: list(str). Ids of entities to delete.
            committer_id: str. The user_id of the user who committed the change.
            commit_message: str. The commit description message.
            force_deletion: bool. If True these models are deleted completely
                from storage, otherwise there are only marked as deleted.
                Default is False.

        Raises:
            Exception. This model instance has been already deleted.
        """
        versioned_models = cls.get_multi(
            entity_ids, include_deleted=force_deletion)
        versioned_models = [
            versioned_model for versioned_model in versioned_models
            if versioned_model is not None
        ]
        if force_deletion:
            all_models_metadata_keys = []
            all_models_content_keys = []
            for model in versioned_models:
                model_version_numbers = [
                    python_utils.UNICODE(num + 1) for num in
                    python_utils.RANGE(model.version)]
                model_snapshot_ids = [
                    model.get_snapshot_id(model.id, version_number)
                    for version_number in model_version_numbers]

                all_models_metadata_keys.extend([
                    datastore_services.Key(
                        model.SNAPSHOT_METADATA_CLASS, snapshot_id)
                    for snapshot_id in model_snapshot_ids])
                all_models_content_keys.extend([
                    datastore_services.Key(
                        model.SNAPSHOT_CONTENT_CLASS, snapshot_id)
                    for snapshot_id in model_snapshot_ids])
            versioned_models_keys = [model.key for model in versioned_models]
            all_models_keys = (
                all_models_metadata_keys +
                all_models_content_keys +
                versioned_models_keys
            )
            for i in python_utils.RANGE(
                    0,
                    len(all_models_keys),
                    feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION):
                transaction_services.run_in_transaction(
                    datastore_services.delete_multi,
                    all_models_keys[
                        i:i + feconf.MAX_NUMBER_OF_OPS_IN_TRANSACTION])
        else:
            for model in versioned_models:
                model._require_not_marked_deleted()  # pylint: disable=protected-access
                model.deleted = True

            commit_cmds = [{
                'cmd': cls.CMD_DELETE_COMMIT
            }]
            snapshot_metadata_models = []
            snapshot_content_models = []
            for model in versioned_models:
                model.version += 1
                snapshot = model.compute_snapshot()
                snapshot_id = model.get_snapshot_id(model.id, model.version)

                snapshot_metadata_models.append(
                    model.SNAPSHOT_METADATA_CLASS.create(
                        snapshot_id, committer_id, cls._COMMIT_TYPE_DELETE,
                        commit_message, commit_cmds))
                snapshot_content_models.append(
                    model.SNAPSHOT_CONTENT_CLASS.create(snapshot_id, snapshot))

            entities = (
                snapshot_metadata_models + snapshot_content_models +
                versioned_models)
            cls.update_timestamps_multi(entities)
            transaction_services.run_in_transaction(
                BaseModel.put_multi, entities)

    def put(self, *args, **kwargs):
        """For VersionedModels, this method is replaced with commit()."""
        raise NotImplementedError(
            'The put() method is missing from the '
            'derived class. It should be implemented in the derived class.')

    def commit(self, committer_id, commit_message, commit_cmds):
        """Saves a version snapshot and updates the model.

        Args:
            committer_id: str. The user_id of the user who committed the change.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, should give sufficient information to
                reconstruct the commit. Dict always contains:
                    cmd: str. Unique command.
                And then additional arguments for that command. For example:

                {'cmd': 'AUTO_revert_version_number'
                 'version_number': 4}

        Raises:
            Exception. This model instance has been already deleted.
            Exception. The commit_cmd is in invalid format.
        """
        self._require_not_marked_deleted()

        for item in commit_cmds:
            if not isinstance(item, dict):
                raise Exception(
                    'Expected commit_cmds to be a list of dicts, received %s'
                    % commit_cmds)

        for commit_cmd in commit_cmds:
            if 'cmd' not in commit_cmd:
                raise Exception(
                    'Invalid commit_cmd: %s. Expected a \'cmd\' key.'
                    % commit_cmd)
            if commit_cmd['cmd'].startswith(self._AUTOGENERATED_PREFIX):
                raise Exception(
                    'Invalid change list command: %s' % commit_cmd['cmd'])

        commit_type = (
            self._COMMIT_TYPE_CREATE if self.version == 0 else
            self._COMMIT_TYPE_EDIT)

        self._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

    @classmethod
    def revert(cls, model, committer_id, commit_message, version_number):
        """Reverts model to previous version.

        Args:
            model: VersionedModel. The model instance to revert.
            committer_id: str. The user_id of the user who committed the change.
            commit_message: str. The commit description message.
            version_number: int. Version to revert to.

        Raises:
            Exception. This model instance has been deleted.
            Exception. Reverting is not allowed on this model.
        """
        model._require_not_marked_deleted()  # pylint: disable=protected-access

        if not model.ALLOW_REVERT:
            raise Exception(
                'Reverting objects of type %s is not allowed.'
                % model.__class__.__name__)

        commit_cmds = [{
            'cmd': model.CMD_REVERT_COMMIT,
            'version_number': version_number
        }]

        # Do not overwrite the version number.
        current_version = model.version

        # If a new property is introduced after a certain version of a model,
        # the property should be its default value when an old snapshot of the
        # model is applied during reversion. E.g. states_schema_version in
        # ExplorationModel may be added after some version of a saved
        # exploration. If that exploration is reverted to a version that does
        # not have a states_schema_version property, it should revert to the
        # default states_schema_version value rather than taking the
        # states_schema_version value from the latest exploration version.

        snapshot_id = model.get_snapshot_id(model.id, version_number)
        new_model = cls(id=model.id)
        new_model._reconstitute_from_snapshot_id(snapshot_id)  # pylint: disable=protected-access
        new_model.version = current_version

        new_model._trusted_commit(  # pylint: disable=protected-access
            committer_id, cls._COMMIT_TYPE_REVERT, commit_message,
            commit_cmds)

    @classmethod
    def get_version(cls, entity_id, version_number, strict=True):
        """Gets model instance representing the given version.

        The snapshot content is used to populate this model instance. The
        snapshot metadata is not used.

        Args:
            entity_id: str. The given entity id.
            version_number: int. The given version number.
            strict: bool. Whether to fail noisily if no entity with the given id
                exists in the datastore. Default is True.

        Returns:
            VersionedModel. Model instance representing given version.

        Raises:
            Exception. This model instance has been deleted.
        """
        current_version_model = cls.get(entity_id, strict=strict)

        if current_version_model is None:
            return None

        current_version_model._require_not_marked_deleted()  # pylint: disable=protected-access

        snapshot_id = cls.get_snapshot_id(entity_id, version_number)

        try:
            return cls(  # pylint: disable=protected-access
                id=entity_id,
                version=version_number
            )._reconstitute_from_snapshot_id(snapshot_id)
        except cls.EntityNotFoundError as e:
            if not strict:
                return None
            raise e

    @classmethod
    def get_multi_versions(cls, entity_id, version_numbers):
        """Gets model instances for each version specified in version_numbers.

        Args:
            entity_id: str. ID of the entity.
            version_numbers: list(int). List of version numbers.

        Returns:
            list(VersionedModel). Model instances representing the given
            versions.

        Raises:
            ValueError. The given entity_id is invalid.
            ValueError. Requested version number cannot be higher than the
                current version number.
            ValueError. At least one version number is invalid.
        """
        instances = []

        entity = cls.get(entity_id, strict=False)
        if not entity:
            raise ValueError('The given entity_id %s is invalid.' % (entity_id))
        current_version = entity.version
        max_version = max(version_numbers)
        if max_version > current_version:
            raise ValueError(
                'Requested version number %s cannot be higher than the current '
                'version number %s.' % (max_version, current_version))

        snapshot_ids = []
        for version in version_numbers:
            snapshot_id = cls.get_snapshot_id(entity_id, version)
            snapshot_ids.append(snapshot_id)

        snapshot_models = cls.SNAPSHOT_CONTENT_CLASS.get_multi(snapshot_ids)
        for snapshot_model in snapshot_models:
            if snapshot_model is None:
                raise ValueError(
                    'At least one version number is invalid.')
            snapshot_dict = snapshot_model.content
            reconstituted_model = cls(id=entity_id)._reconstitute(  # pylint: disable=protected-access
                snapshot_dict)
            reconstituted_model.created_on = snapshot_model.created_on
            reconstituted_model.last_updated = snapshot_model.last_updated

            instances.append(reconstituted_model)
        return instances

    @classmethod
    def get(cls, entity_id, strict=True, version=None):
        """Gets model instance.

        Args:
            entity_id: str. The given entity id.
            strict: bool. Whether to fail noisily if no entity with the given id
                exists in the datastore. Default is True.
            version: int. Version we want to get. Default is None.

        Returns:
            VersionedModel. If version is None, get the newest version of the
            model. Otherwise, get the specified version.
        """
        if version is None:
            return super(VersionedModel, cls).get(entity_id, strict=strict)
        else:
            return cls.get_version(entity_id, version, strict=strict)

    @classmethod
    def get_snapshots_metadata(
            cls, model_instance_id, version_numbers, allow_deleted=False):
        """Gets a list of dicts, each representing a model snapshot.

        One dict is returned for each version number in the list of version
        numbers requested. If any of the version numbers does not exist, an
        error is raised.

        Args:
            model_instance_id: str. Id of requested model.
            version_numbers: list(int). List of version numbers.
            allow_deleted: bool. If is False, an error is raised if the current
                model has been deleted. Default is False.

        Returns:
            list(dict). Each dict contains metadata for a particular snapshot.
            It has the following keys:
                committer_id: str. The user_id of the user who committed the
                    change.
                commit_message: str. The commit description message.
                commit_cmds: list(dict). A list of commands, describing changes
                    made in this model, should give sufficient information to
                    reconstruct the commit. Dict always contains:
                        cmd: str. Unique command.
                    And then additional arguments for that command. For example:

                    {'cmd': 'AUTO_revert_version_number'
                     'version_number': 4}

                commit_type: str. Unique identifier of commit type. Possible
                    values are in COMMIT_TYPE_CHOICES.
                version_number: int.
                created_on_ms: float. Snapshot creation time in milliseconds
                    since the Epoch.

        Raises:
            Exception. There is no model instance corresponding to at least one
                of the given version numbers.
        """
        if not allow_deleted:
            cls.get(model_instance_id)._require_not_marked_deleted()  # pylint: disable=protected-access

        snapshot_ids = [
            cls.get_snapshot_id(model_instance_id, version_number)
            for version_number in version_numbers]
        metadata_keys = [
            datastore_services.Key(cls.SNAPSHOT_METADATA_CLASS, snapshot_id)
            for snapshot_id in snapshot_ids]
        returned_models = datastore_services.get_multi(metadata_keys)

        for ind, model in enumerate(returned_models):
            if model is None:
                raise Exception(
                    'Invalid version number %s for model %s with id %s'
                    % (version_numbers[ind], cls.__name__, model_instance_id))

        return [{
            'committer_id': model.committer_id,
            'commit_message': model.commit_message,
            'commit_cmds': model.commit_cmds,
            'commit_type': model.commit_type,
            'version_number': version_numbers[ind],
            'created_on_ms': utils.get_time_in_millisecs(model.created_on),
        } for (ind, model) in enumerate(returned_models)]

    @staticmethod
    def get_model_association_to_user():
        """The history of commits is not relevant for the purposes of
        Takeout, since commits do not contain any personal user data.
        """
        return MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model contains data corresponding to a user, but this isn't exported
        because the history of commits is not relevant for the purposes of
        Takeout, since commits do not contain any personal user data.
        """
        return dict(BaseModel.get_export_policy(), **{
            'version': EXPORT_POLICY.NOT_APPLICABLE
        })


class BaseSnapshotMetadataModel(BaseModel):
    """Base class for snapshot metadata classes.

    The id of this model is computed using VersionedModel.get_snapshot_id().
    """

    # The ids of SnapshotMetadataModels are used as Takeout keys.
    ID_IS_USED_AS_TAKEOUT_KEY = True

    # The id of the user who committed this revision.
    committer_id = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The type of the commit associated with this snapshot.
    commit_type = datastore_services.StringProperty(
        required=True, choices=VersionedModel.COMMIT_TYPE_CHOICES)
    # The commit message associated with this snapshot.
    commit_message = datastore_services.StringProperty(indexed=True)
    # A sequence of commands that can be used to describe this commit.
    # Represented as a list of dicts.
    commit_cmds = datastore_services.JsonProperty(indexed=False)
    # The user ids that are in some field in commit_cmds.
    commit_cmds_user_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))
    # The user ids that are enclosed inside the 'content' field in the relevant
    # snapshot content model.
    content_user_ids = (
        datastore_services.StringProperty(repeated=True, indexed=True))

    @staticmethod
    def get_deletion_policy():
        """Model contains data corresponding to a user that requires
        pseudonymization: committer_id field.
        """
        return DELETION_POLICY.LOCALLY_PSEUDONYMIZE

    @staticmethod
    def get_model_association_to_user():
        """There are multiple SnapshotMetadataModels per user."""
        return MODEL_ASSOCIATION_TO_USER.MULTIPLE_INSTANCES_PER_USER

    @classmethod
    def get_export_policy(cls):
        """Model contains data to export/delete corresponding to a user."""
        return dict(BaseModel.get_export_policy(), **{
            'committer_id': EXPORT_POLICY.NOT_APPLICABLE,
            'commit_type': EXPORT_POLICY.EXPORTED,
            'commit_message': EXPORT_POLICY.EXPORTED,
            'commit_cmds': EXPORT_POLICY.NOT_APPLICABLE,
            'commit_cmds_user_ids': EXPORT_POLICY.NOT_APPLICABLE,
            'content_user_ids': EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether BaseSnapshotMetadataModel references the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(datastore_services.any_of(
            cls.committer_id == user_id,
            cls.commit_cmds_user_ids == user_id,
            cls.content_user_ids == user_id,
        )).get(keys_only=True) is not None

    @classmethod
    def create(
            cls, snapshot_id, committer_id, commit_type, commit_message,
            commit_cmds):
        """This method returns an instance of the BaseSnapshotMetadataModel for
        a construct with the common fields filled.

        Args:
            snapshot_id: str. The ID of the construct corresponding to this
                snapshot.
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

        Returns:
            BaseSnapshotMetadataModel. Returns the respective
            BaseSnapshotMetadataModel instance of the construct from which this
            is called.
        """
        return cls(
            id=snapshot_id, committer_id=committer_id,
            commit_type=commit_type, commit_message=commit_message,
            commit_cmds=commit_cmds)

    def get_unversioned_instance_id(self):
        """Gets the instance id from the snapshot id.

        Returns:
            str. Instance id part of snapshot id.
        """
        return self.id[:self.id.rfind(VERSION_DELIMITER)]

    def get_version_string(self):
        """Gets the version number from the snapshot id.

        Returns:
            str. Version number part of snapshot id.
        """
        return self.id[self.id.rfind(VERSION_DELIMITER) + 1:]

    @classmethod
    def export_data(cls, user_id):
        metadata_models = (
            cls.query(cls.committer_id == user_id).fetch(
                projection=[cls.commit_type, cls.commit_message]))

        user_data = {}
        for metadata_model in metadata_models:
            user_data[metadata_model.id] = {
                'commit_type': metadata_model.commit_type,
                'commit_message': metadata_model.commit_message,
            }
        return user_data


class BaseSnapshotContentModel(BaseModel):
    """Base class for snapshot content classes.

    The id of this model is computed using VersionedModel.get_snapshot_id().
    """

    # The snapshot content, as a JSON blob.
    content = datastore_services.JsonProperty(indexed=False)

    @staticmethod
    def get_model_association_to_user():
        """The contents of snapshots are not relevant to the user for
        Takeout.
        """
        return MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model contains data corresponding to a user, but this isn't exported
        because the contents of snapshots are note relevant to the user for
        Takeout.
        """
        return dict(BaseModel.get_export_policy(), **{
            'content': EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def create(cls, snapshot_id, content):
        """This method returns an instance of the BaseSnapshotContentModel for
        a construct with the common fields filled.

        Args:
            snapshot_id: str. The ID of the construct corresponding to this
                snapshot.
            content: dict. The fields of the original model in dict format.

        Returns:
            BaseSnapshotContentModel. Returns the respective
            BaseSnapshotContentModel instance of the construct from which this
            is called.
        """
        return cls(id=snapshot_id, content=content)

    def get_unversioned_instance_id(self):
        """Gets the instance id from the snapshot id.

        Returns:
            str. Instance id part of snapshot id.
        """
        return self.id[:self.id.rfind(VERSION_DELIMITER)]

    def get_version_string(self):
        """Gets the version number from the snapshot id.

        Returns:
            str. Version number part of snapshot id.
        """
        return self.id[self.id.rfind(VERSION_DELIMITER) + 1:]


class BaseMapReduceBatchResultsModel(BaseModel):
    """Base model for batch storage for MR jobs.

    This model turns off caching, because this results in stale data being
    shown after each MapReduce job run. Classes which are used by a MR job to
    store its batch results should subclass this class.
    """

    _use_cache = False
    _use_memcache = False
