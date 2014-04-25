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

__author__ = 'Sean Lip'

import feconf
import utils

from core.platform import models
transaction_services = models.Registry.import_transaction_services()
from google.appengine.ext import ndb


class BaseModel(ndb.Model):
    """Base model for all persistent object storage classes."""

    # When this entity was first created.
    created_on = ndb.DateTimeProperty(auto_now_add=True)
    # When this entity was last updated.
    last_updated = ndb.DateTimeProperty(auto_now=True)
    # Whether the current version of the file is deleted.
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
        """Gets an entity by id. Fails noisily if strict == True.

        Args:
          entity_id: str. The id of the entity.
          strict: bool. Whether to fail noisily if no entity with the given id
            exists in the datastore.

        Returns:
          None, if strict == False and no undeleted entity with the given id
          exists in the datastore. Otherwise, the entity instance that
          corresponds to the given id.

        Raises:
        - base_models.BaseModel.EntityNotFoundError: if strict == True and
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

    def put(self):
        super(BaseModel, self).put()

    @classmethod
    def get_multi(cls, entity_ids):
        entity_keys = [ndb.Key(cls, entity_id) for entity_id in entity_ids]
        return ndb.get_multi(entity_keys)

    @classmethod
    def put_multi(cls, entities):
        return ndb.put_multi(entities)

    def delete(self):
        super(BaseModel, self).key.delete()

    @classmethod
    def get_all(cls, include_deleted_entities=False):
        """Returns a filterable iterable of all entities of this class.

        If include_deleted_entities is True then entities that have been marked
        deleted are returned as well.
        """
        query = cls.query()
        if not include_deleted_entities:
            query = query.filter(cls.deleted == False)
        return query

    @classmethod
    def get_new_id(cls, entity_name):
        """Gets a new id for an entity, based on its name.

        The returned id is guaranteed to be unique among all instances of this
        entity.

        Args:
          entity_name: the name of the entity. Coerced to a utf-8 encoded
            string. Defaults to ''.

        Returns:
          str: a new unique id for this entity class.

        Raises:
        - Exception: if an id cannot be generated within a reasonable number
            of attempts.
        """
        try:
            entity_name = unicode(entity_name).encode('utf-8')
        except Exception:
            entity_name = ''

        MAX_RETRIES = 10
        RAND_RANGE = 127 * 127
        ID_LENGTH = 12
        for i in range(MAX_RETRIES):
            new_id = utils.convert_to_hash(
                '%s%s' % (entity_name, utils.get_random_int(RAND_RANGE)),
                ID_LENGTH)
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception('New id generator is producing too many collisions.')


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

    ### IMPORTANT: Subclasses should only overwrite things above this line. ###

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
    # The delimiter used to separate the version number from the model instance
    # id. To get the instance id from a snapshot id, use Python's rfind()
    # method to find the location of this delimiter.
    _VERSION_DELIMITER = '-'
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
        """Generates a snapshot (a Python dict) from the model fields."""
        return self.to_dict(exclude=['created_on', 'last_updated'])

    def _reconstitute(self, snapshot_dict):
        """Makes this instance into a reconstitution of the given snapshot."""
        self.populate(**snapshot_dict)
        return self

    def _reconstitute_from_snapshot_id(self, snapshot_id):
        """Makes this instance into a reconstitution of the given snapshot."""
        snapshot_model = self.SNAPSHOT_CONTENT_CLASS.get(snapshot_id)
        snapshot_dict = snapshot_model.content
        return self._reconstitute(snapshot_dict)

    @classmethod
    def _get_snapshot_id(cls, instance_id, version_number):
        return '%s%s%s' % (
            instance_id, cls._VERSION_DELIMITER, version_number)

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
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

        snapshot_metadata_instance = self.SNAPSHOT_METADATA_CLASS(
            id=snapshot_id, committer_id=committer_id, commit_type=commit_type,
            commit_message=commit_message, commit_cmds=commit_cmds)
        snapshot_content_instance = self.SNAPSHOT_CONTENT_CLASS(
            id=snapshot_id, content=snapshot)

        transaction_services.run_in_transaction(
            ndb.put_multi,
            [snapshot_metadata_instance, snapshot_content_instance, self])

    def delete(self, committer_id, commit_message, force_deletion=False):
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
            self._require_not_marked_deleted()
            self.deleted = True

            CMD_DELETE = '%s_mark_deleted' % self._AUTOGENERATED_PREFIX
            commit_cmds = [{
                'cmd': CMD_DELETE
            }]

            self._trusted_commit(
                committer_id, self._COMMIT_TYPE_DELETE, commit_message,
                commit_cmds)

    def put(self, *args, **kwargs):
        """For VersionedModels, this method is replaced with commit()."""
        raise NotImplementedError

    def commit(self, committer_id, commit_message, commit_cmds):
        """Saves a version snapshot and updates the model.

        commit_cmds should give sufficient information to reconstruct the
        commit.
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

    def revert(self, committer_id, commit_message, version_number):
        self._require_not_marked_deleted()

        if not self.ALLOW_REVERT:
            raise Exception(
                'Reverting of objects of type %s is not allowed.'
                % self.__class__.__name__)

        CMD_REVERT = '%s_revert_version_number' % self._AUTOGENERATED_PREFIX
        commit_cmds = [{
            'cmd': CMD_REVERT,
            'version_number': version_number
        }]

        # Do not overwrite the version number.
        current_version = self.version

        snapshot_id = self._get_snapshot_id(self.id, version_number)
        self._reconstitute_from_snapshot_id(snapshot_id)

        self.version = current_version

        self._trusted_commit(
            committer_id, self._COMMIT_TYPE_REVERT, commit_message,
            commit_cmds)

    @classmethod
    def get_version(cls, model_instance_id, version_number):
        """Returns a model instance representing the given version.

        The snapshot content is used to populate this model instance. The
        snapshot metadata is not used.
        """
        cls.get(model_instance_id)._require_not_marked_deleted()

        snapshot_id = cls._get_snapshot_id(model_instance_id, version_number)
        return cls(id=model_instance_id)._reconstitute_from_snapshot_id(
            snapshot_id)

    @classmethod
    def get(cls, entity_id, strict=True, version=None):
        """Gets an entity by id. Fails noisily if strict == True."""
        if version is None:
            return super(VersionedModel, cls).get(entity_id, strict=strict)
        else:
            return cls.get_version(entity_id, version)

    @classmethod
    def get_snapshots_metadata(cls, model_instance_id, version_numbers):
        """Returns a list of dicts, each representing a model snapshot.

        One dict is returned for each version number in the list of version
        numbers requested. If any of the version numbers does not exist, an
        error is raised.
        """
        cls.get(model_instance_id)._require_not_marked_deleted()

        snapshot_ids = [
            cls._get_snapshot_id(model_instance_id, version_number)
            for version_number in version_numbers]
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
            'created_on': model.created_on.strftime(
                feconf.HUMAN_READABLE_DATETIME_FORMAT),
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


class BaseSnapshotContentModel(BaseModel):
    """Base class for snapshot content classes.

    The id of this model is computed using VersionedModel.get_snapshot_id().
    """

    # The snapshot content, as a JSON blob.
    content = ndb.JsonProperty(indexed=False)
