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

from core.platform import models
import feconf
import utils

from google.appengine.datastore import datastore_query
from google.appengine.ext import ndb

transaction_services = models.Registry.import_transaction_services()

# The delimiter used to separate the version number from the model instance
# id. To get the instance id from a snapshot id, use Python's rfind()
# method to find the location of this delimiter.
_VERSION_DELIMITER = '-'

# Constants used for generating ids.
MAX_RETRIES = 10
RAND_RANGE = (1 << 30) - 1
ID_LENGTH = 12


class BaseModel(ndb.Model):
    """Base model for all persistent object storage classes."""

    # When this entity was first created. This can be overwritten and
    # set explicitly.
    created_on = ndb.DateTimeProperty(auto_now_add=True, indexed=True)
    # When this entity was last updated. This cannot be set directly.
    last_updated = ndb.DateTimeProperty(auto_now=True, indexed=True)
    # Whether the current version of the model instance is deleted.
    deleted = ndb.BooleanProperty(indexed=True, default=False)

    @property
    def id(self):
        """A unique id for this model instance."""
        return self.key.id()

    def _pre_put_hook(self):
        """This is run before model instances are saved to the datastore.

        Subclasses of BaseModel should override this method.
        """
        pass

    class EntityNotFoundError(Exception):
        """Raised when no entity for a given id exists in the datastore."""
        pass

    @classmethod
    def get(cls, entity_id, strict=True):
        """Gets an entity by id.

        Args:
            entity_id: str.
            strict: bool. Whether to fail noisily if no entity with the given id
                exists in the datastore. Default is True.

        Returns:
            None, if strict == False and no undeleted entity with the given id
            exists in the datastore. Otherwise, the entity instance that
            corresponds to the given id.

        Raises:
            base_models.BaseModel.EntityNotFoundError: if strict == True and
                no undeleted entity with the given id exists in the datastore.
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
            entity_ids: list(str).
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
                entity_keys.append(ndb.Key(cls, entity_id))
            else:
                none_argument_indices.append(index)

        entities = ndb.get_multi(entity_keys)
        for index in none_argument_indices:
            entities.insert(index, None)

        if not include_deleted:
            for i in xrange(len(entities)):
                if entities[i] and entities[i].deleted:
                    entities[i] = None
        return entities

    @classmethod
    def put_multi(cls, entities):
        """Stores the given ndb.Model instances.

        Args:
            entities: list(ndb.Model).
        """
        ndb.put_multi(entities)

    def delete(self):
        """Deletes this instance."""
        super(BaseModel, self).key.delete()

    @classmethod
    def get_all(cls, include_deleted=False):
        """Gets iterable of all entities of this class.

        Args:
            include_deleted: bool. If True, then entities that have been marked
                deleted are returned as well. Defaults to False.

        Returns:
            iterable. Filterable iterable of all entities of this class.
        """
        query = cls.query()
        if not include_deleted:
            query = query.filter(cls.deleted == False)  # pylint: disable=singleton-comparison
        return query

    @classmethod
    def get_new_id(cls, entity_name):
        """Gets a new id for an entity, based on its name.

        The returned id is guaranteed to be unique among all instances of this
        entity.

        Args:
            entity_name: The name of the entity. Coerced to a utf-8 encoded
                string. Defaults to ''.

        Returns:
            str. New unique id for this entity class.

        Raises:
            Exception: An ID cannot be generated within a reasonable number
                of attempts.
        """
        try:
            entity_name = unicode(entity_name).encode('utf-8')
        except Exception:
            entity_name = ''

        for _ in range(MAX_RETRIES):
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
            query: ndb.Query.
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of returned
                entities starts from this datastore cursor. Otherwise,
                the returned entities start from the beginning of the full
                list of entities.

        Returns:
            3-tuple of (results, cursor, more) as described in fetch_page() at:
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
            start_cursor = datastore_query.Cursor(urlsafe=urlsafe_start_cursor)
        else:
            start_cursor = None

        result = query.order(-cls.last_updated).fetch_page(
            page_size, start_cursor=start_cursor)
        return (
            result[0],
            (result[1].urlsafe() if result[1] else None),
            result[2])


class BaseCommitLogEntryModel(BaseModel):
    """Base Model for the models that store the log of commits to a construct.
    """
    # Update superclass model to make these properties indexed.
    created_on = ndb.DateTimeProperty(auto_now_add=True, indexed=True)
    last_updated = ndb.DateTimeProperty(auto_now=True, indexed=True)

    # The id of the user.
    user_id = ndb.StringProperty(indexed=True, required=True)
    # The username of the user, at the time of the edit.
    username = ndb.StringProperty(indexed=True, required=True)
    # The type of the commit: 'create', 'revert', 'edit', 'delete'.
    commit_type = ndb.StringProperty(indexed=True, required=True)
    # The commit message.
    commit_message = ndb.TextProperty(indexed=False)
    # The commit_cmds dict for this commit.
    commit_cmds = ndb.JsonProperty(indexed=False, required=True)
    # The version number of the model after this commit.
    version = ndb.IntegerProperty()

    @classmethod
    def create(
            cls, entity_id, version, committer_id, committer_username,
            commit_type, commit_message, commit_cmds, status=None,
            community_owned=None):
        """This method returns an instance of the CommitLogEntryModel for a
        construct with the common fields filled.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            committer_username: str. The username of the user who committed the
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
        if status:
            return cls(
                id=cls._get_instance_id(entity_id, version),
                user_id=committer_id,
                username=committer_username,
                commit_type=commit_type,
                commit_message=commit_message,
                commit_cmds=commit_cmds,
                version=version,
                post_commit_status=status,
                post_commit_community_owned=community_owned,
                post_commit_is_private=(
                    status == feconf.ACTIVITY_STATUS_PRIVATE)
            )
        else:
            return cls(
                id=cls._get_instance_id(entity_id, version),
                user_id=committer_id,
                username=committer_username,
                commit_type=commit_type,
                commit_message=commit_message,
                commit_cmds=commit_cmds,
                version=version
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
            NotImplementedError: The method is not overwritten in derived
                classes.
        """
        raise NotImplementedError

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
            target_entity_id: str. The id of the particular construct, from
                which this method is called.
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
    _AUTOGENERATED_PREFIX = 'AUTO'
    # The current version number of this instance. In each PUT operation,
    # this number is incremented and a snapshot of the modified instance is
    # stored in the snapshot metadata and content models. The snapshot
    # version number starts at 1 when the model instance is first created.
    # All data in this instance represents the version at HEAD; data about the
    # previous versions is stored in the snapshot models.
    version = ndb.IntegerProperty(default=0)

    def _require_not_marked_deleted(self):
        if self.deleted:
            raise Exception('This model instance has been deleted.')

    def _compute_snapshot(self):
        """Generates a snapshot (dict) from the model property values."""
        return self.to_dict(exclude=['created_on', 'last_updated'])

    def _reconstitute(self, snapshot_dict):
        self.populate(**snapshot_dict)
        return self

    def _reconstitute_from_snapshot_id(self, snapshot_id):
        """Gets a reconstituted instance of this model class, based on the given
        snapshot id.

        Args:
            snapshot_id: str.

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
    def _get_snapshot_id(cls, instance_id, version_number):
        """Gets a unique snapshot id for this instance and version.

        Args:
            instance_id: str.
            version_number: int.

        Returns:
            str. The unique snapshot id corresponding to the given instance and
            version.
        """
        return '%s%s%s' % (
            instance_id, _VERSION_DELIMITER, version_number)

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Evaluates and executes commit. Main function for all commit types.

        Args:
            committer_id: str. The user_id of the user who committed the change.
            commit_type: str. Unique identifier of commit type. Possible values
                are in COMMIT_TYPE_CHOICES.
            commit_message: str.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, should give sufficient information to
                reconstruct the commit. Dict always contains:
                    cmd: str. Unique command.
                And then additional arguments for that command. For example:

                {'cmd': 'AUTO_revert_version_number'
                 'version_number': 4}

        Raises:
            Exception: No snapshot metadata class has been defined.
            Exception: No snapshot content class has been defined.
            Exception: commit_cmds is not a list of dicts.
        """
        if self.SNAPSHOT_METADATA_CLASS is None:
            raise Exception('No snapshot metadata class defined.')
        if self.SNAPSHOT_CONTENT_CLASS is None:
            raise Exception('No snapshot content class defined.')
        if not isinstance(commit_cmds, list):
            raise Exception(
                'Expected commit_cmds to be a list of dicts, received %s'
                % commit_cmds)
        for item in commit_cmds:
            if not isinstance(item, dict):
                raise Exception(
                    'Expected commit_cmds to be a list of dicts, received %s'
                    % commit_cmds)

        self.version += 1

        snapshot = self._compute_snapshot()
        snapshot_id = self._get_snapshot_id(self.id, self.version)

        snapshot_metadata_instance = self.SNAPSHOT_METADATA_CLASS(  # pylint: disable=not-callable
            id=snapshot_id, committer_id=committer_id, commit_type=commit_type,
            commit_message=commit_message, commit_cmds=commit_cmds)
        snapshot_content_instance = self.SNAPSHOT_CONTENT_CLASS(  # pylint: disable=not-callable
            id=snapshot_id, content=snapshot)

        transaction_services.run_in_transaction(
            ndb.put_multi,
            [snapshot_metadata_instance, snapshot_content_instance, self])

    def delete(self, committer_id, commit_message, force_deletion=False):
        """Deletes this model instance.

        Args:
            committer_id: str. The user_id of the user who committed the change.
            commit_message: str.
            force_deletion: bool. If True this model is deleted
                completely from storage, otherwise it is only marked as deleted.
                Default is False.

        Raises:
            Exception: This model instance has been already deleted.
        """
        if force_deletion:
            current_version = self.version

            version_numbers = [str(num + 1) for num in range(current_version)]
            snapshot_ids = [
                self._get_snapshot_id(self.id, version_number)
                for version_number in version_numbers]

            metadata_keys = [
                ndb.Key(self.SNAPSHOT_METADATA_CLASS, snapshot_id)
                for snapshot_id in snapshot_ids]
            ndb.delete_multi(metadata_keys)

            content_keys = [
                ndb.Key(self.SNAPSHOT_CONTENT_CLASS, snapshot_id)
                for snapshot_id in snapshot_ids]
            ndb.delete_multi(content_keys)

            super(VersionedModel, self).delete()
        else:
            self._require_not_marked_deleted()  # pylint: disable=protected-access
            self.deleted = True

            commit_cmds = [{
                'cmd': '%s_mark_deleted' % self._AUTOGENERATED_PREFIX
            }]

            self._trusted_commit(
                committer_id, self._COMMIT_TYPE_DELETE, commit_message,
                commit_cmds)

    def put(self, *args, **kwargs):
        """For VersionedModels, this method is replaced with commit()."""
        raise NotImplementedError

    def commit(self, committer_id, commit_message, commit_cmds):
        """Saves a version snapshot and updates the model.

        Args:
            committer_id: str. The user_id of the user who committed the change.
            commit_message: str.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, should give sufficient information to
                reconstruct the commit. Dict always contains:
                    cmd: str. Unique command.
                And then additional arguments for that command. For example:

                {'cmd': 'AUTO_revert_version_number'
                 'version_number': 4}

        Raises:
            Exception: This model instance has been already deleted.
            Exception: commit_cmd is in invalid format.
        """
        self._require_not_marked_deleted()

        for commit_cmd in commit_cmds:
            if 'cmd' not in commit_cmd:
                raise Exception(
                    'Invalid commit_cmd: %s. Expected a \'cmd\' key.'
                    % commit_cmd)
            if commit_cmd['cmd'].startswith(self._AUTOGENERATED_PREFIX):
                raise Exception(
                    'Invalid change list command: ' % commit_cmd['cmd'])

        commit_type = (
            self._COMMIT_TYPE_CREATE if self.version == 0 else
            self._COMMIT_TYPE_EDIT)

        self._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

    @classmethod
    def revert(cls, model, committer_id, commit_message, version_number):
        """Reverts model to previous version.

        Args:
            model: VersionedModel.
            committer_id: str. The user_id of the user who committed the change.
            commit_message: str.
            version_number: int. Version to revert to.

        Raises:
            Exception: This model instance has been deleted.
            Exception: Reverting is not allowed on this model.
        """
        model._require_not_marked_deleted()  # pylint: disable=protected-access

        if not model.ALLOW_REVERT:
            raise Exception(
                'Reverting of objects of type %s is not allowed.'
                % model.__class__.__name__)

        commit_cmds = [{
            'cmd': (
                '%s_revert_version_number' %
                model._AUTOGENERATED_PREFIX),  # pylint: disable=protected-access
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

        # pylint: disable=protected-access
        snapshot_id = model._get_snapshot_id(model.id, version_number)
        new_model = cls(id=model.id)
        new_model._reconstitute_from_snapshot_id(snapshot_id)
        new_model.version = current_version

        new_model._trusted_commit(
            committer_id, cls._COMMIT_TYPE_REVERT, commit_message,
            commit_cmds)
        # pylint: enable=protected-access

    @classmethod
    def get_version(cls, entity_id, version_number):
        """Gets model instance representing the given version.

        The snapshot content is used to populate this model instance. The
        snapshot metadata is not used.

        Args:
            entity_id: str.
            version_number: int.

        Returns:
            VersionedModel. Model instance representing given version.

        Raises:
            Exception: This model instance has been deleted.
        """
        # pylint: disable=protected-access
        cls.get(entity_id)._require_not_marked_deleted()

        snapshot_id = cls._get_snapshot_id(entity_id, version_number)
        return cls(id=entity_id)._reconstitute_from_snapshot_id(
            snapshot_id)
        # pylint: enable=protected-access

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
        # pylint: disable=protected-access
        for version in version_numbers:
            snapshot_id = cls._get_snapshot_id(entity_id, version)
            snapshot_ids.append(snapshot_id)

        snapshot_models = cls.SNAPSHOT_CONTENT_CLASS.get_multi(snapshot_ids)
        for snapshot_model in snapshot_models:
            if snapshot_model is None:
                raise ValueError(
                    'At least one version number is invalid.')
            snapshot_dict = snapshot_model.content
            reconstituted_model = cls(id=entity_id)._reconstitute(
                snapshot_dict)
            reconstituted_model.created_on = snapshot_model.created_on
            reconstituted_model.last_updated = snapshot_model.last_updated

            instances.append(reconstituted_model)
        # pylint: enable=protected-access
        return instances

    @classmethod
    def get(cls, entity_id, strict=True, version=None):
        """Gets model instance.

        Args:
            entity_id: str.
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
            return cls.get_version(entity_id, version)

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
                commit_message: str.
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
            Exception: There is no model instance corresponding to at least one
                of the given version numbers.
        """
        # pylint: disable=protected-access
        if not allow_deleted:
            cls.get(model_instance_id)._require_not_marked_deleted()

        snapshot_ids = [
            cls._get_snapshot_id(model_instance_id, version_number)
            for version_number in version_numbers]
        # pylint: enable=protected-access
        metadata_keys = [
            ndb.Key(cls.SNAPSHOT_METADATA_CLASS, snapshot_id)
            for snapshot_id in snapshot_ids]
        returned_models = ndb.get_multi(metadata_keys)

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


class BaseSnapshotMetadataModel(BaseModel):
    """Base class for snapshot metadata classes.

    The id of this model is computed using VersionedModel.get_snapshot_id().
    """

    # The id of the user who committed this revision.
    committer_id = ndb.StringProperty(required=True)
    # The type of the commit associated with this snapshot.
    commit_type = ndb.StringProperty(
        required=True, choices=VersionedModel.COMMIT_TYPE_CHOICES)
    # The commit message associated with this snapshot.
    commit_message = ndb.TextProperty(indexed=False)
    # A sequence of commands that can be used to describe this commit.
    # Represented as a list of dicts.
    commit_cmds = ndb.JsonProperty(indexed=False)

    def get_unversioned_instance_id(self):
        """Gets the instance id from the snapshot id.

        Returns:
            str. Instance id part of snapshot id.
        """
        return self.id[:self.id.rfind(_VERSION_DELIMITER)]

    def get_version_string(self):
        """Gets the version number from the snapshot id.

        Returns:
            str. Version number part of snapshot id.
        """
        return self.id[self.id.rfind(_VERSION_DELIMITER) + 1:]


class BaseSnapshotContentModel(BaseModel):
    """Base class for snapshot content classes.

    The id of this model is computed using VersionedModel.get_snapshot_id().
    """

    # The snapshot content, as a JSON blob.
    content = ndb.JsonProperty(indexed=False)

    def get_unversioned_instance_id(self):
        """Gets the instance id from the snapshot id.

        Returns:
            str. Instance id part of snapshot id.
        """
        return self.id[:self.id.rfind(_VERSION_DELIMITER)]

    def get_version_string(self):
        """Gets the version number from the snapshot id.

        Returns:
            str. Version number part of snapshot id.
        """
        return self.id[self.id.rfind(_VERSION_DELIMITER) + 1:]


class BaseMapReduceBatchResultsModel(BaseModel):
    """Base model for batch storage for MR jobs.

    This model turns off caching, because this results in stale data being
    shown after each MapReduce job run. Classes which are used by a MR job to
    store its batch results should subclass this class.
    """
    _use_cache = False
    _use_memcache = False
