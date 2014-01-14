# Copyright 2013 Google Inc. All Rights Reserved.
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

import base64
import feconf
import hashlib

from django.db import models
from django.utils import timezone
from core.platform import models as coremodels
transaction_services = coremodels.Registry.import_transaction_services()
import utils
from core import django_utils

primitive = (basestring, bool, float, int)


class BaseModel(models.Model):
    """A model class containing all common methods.

    All model instances have an id property.
    """
    # When this entity was first created.
    created_on = models.DateTimeField(default=timezone.now)
    # When this entity was last updated.
    last_updated = models.DateTimeField(auto_now=True)
    # Whether the current version of the file is deleted.
    deleted = models.BooleanField(default=False)

    id = models.CharField(max_length=100, primary_key=True)

    @classmethod
    def attr_list(cls):
        return [field.name for field in cls._meta.fields]

    class EntityNotFoundError(Exception):
        """Raised when no entity for a given id exists in the datastore."""
        pass

    class ModelValidationError(Exception):
        """Error class for domain object validation errors."""
        pass

    def _pre_put_hook(self):
        pass

    def put(self):
        self._pre_put_hook()
        self.save()
        return self

    @classmethod
    def get_multi(cls, entity_ids):
        return [cls.get(entity_id, strict=False) for entity_id in entity_ids]

    @classmethod
    def put_multi(cls, entities):
        for entity in entities:
            entity.put()

    def delete(self):
        super(BaseModel, self).delete()

    def to_dict(self, exclude=[], include=[]):
        primitives = (int, long, float, complex, bool, basestring, type(None),
                      dict, set, tuple, complex)
        if not include:
            attrs = list(set(self.__class__.attr_list()) - {'id'})
        else:
            attrs = include
        if exclude:
            attrs = list(set(attrs) - set(exclude))
        obj_dict = {}
        for attr in attrs:
            val = self.__getattribute__(attr)
            if isinstance(val, primitives):
                obj_dict[attr] = val
            elif isinstance(val, list):
                allprimitive = all(
                    isinstance(value, primitives) for value in val)
                if allprimitive:
                    obj_dict[attr] = val
                else:
                    obj_dict[attr] = [item.to_dict() for item in val]
            elif isinstance(val, object):
                obj_dict[attr] = val.to_dict()
        return obj_dict

    @classmethod
    def get_all(cls, include_deleted_entities=False):
        """Returns a filterable iterable of all entities of this class."""
        query = cls.objects.all()
        if not include_deleted_entities:
            query = query.filter(deleted=False)
        return query

    @classmethod
    def get_new_id(cls, entity_name):
        """Gets a new 12-character id for an entity, based on its name.

        This id is unique among all instances of this entity.

        Raises:
            Exception: if an id cannot be generated within a reasonable number
              of attempts.
        """
        MAX_RETRIES = 10
        RAND_RANGE = 127*127
        for i in range(MAX_RETRIES):
            new_id = base64.urlsafe_b64encode(
                hashlib.sha1(
                    '%s%s' % (entity_name.encode('utf-8'),
                              utils.get_random_int(RAND_RANGE))
                ).digest())[:12]
            try:
                cls.objects.get(id=new_id)
            except cls.DoesNotExist:
                return new_id

        raise Exception('New id generator is producing too many collisions.')

    @classmethod
    def get(cls, entity_id, strict=True):
        """Gets an entity by id. Fails noisily if strict == True."""
        if not entity_id:
            entity = None
        else:
            try:
                entity = cls.objects.get(id=entity_id)
            except cls.DoesNotExist:
                entity = None

        if entity and entity.deleted:
            entity = None

        if strict and entity is None:
            raise cls.EntityNotFoundError(
                'Entity for class %s with id %s not found' %
                (cls.__name__, entity_id))
        return entity

    class Meta:
        abstract = True


class DummyModel(models.Model):
    pass

dummymodel = DummyModel()

django_internal_attrs = dir(dummymodel)
internal_attrs = ['_json_field_cache']

all_internal_attrs = django_internal_attrs + internal_attrs


class FakeModel(BaseModel):
    pass


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
    version = models.IntegerField(default=0)

    def _require_not_marked_deleted(self):
        if self.deleted:
            raise Exception('This model instance has been deleted.')

    def _compute_snapshot(self):
        """Generates a snapshot (a Python dict) from the model fields."""
        return self.to_dict(
            exclude=['created_on', 'last_updated', 'versionedmodel_ptr'])

    def _reconstitute(self, snapshot_dict):
        """Makes this instance into a reconstitution of the given snapshot.

        The given snapshot is in the form of a Python dict produced by
        _compute_snapshot().
        """
        # TODO(sunu0000): Implement this.
        raise NotImplementedError

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
            id=snapshot_id, committer_id=committer_id,
            commit_type=commit_type, commit_message=commit_message,
            commit_cmds=commit_cmds)

        snapshot_content_instance = self.SNAPSHOT_CONTENT_CLASS(
            id=snapshot_id, content=snapshot)

        transaction_services.run_in_transaction(
            self.put_multi,
            [snapshot_metadata_instance, snapshot_content_instance, self])

    def delete(self, committer_id, commit_message, force_deletion=False):
        if force_deletion:
            current_version = self.version

            version_numbers = [str(num + 1) for num in range(current_version)]
            snapshot_ids = [
                self._get_snapshot_id(self.id, version_number)
                for version_number in version_numbers]

            for snapshot_id in snapshot_ids:
                # This needs to be explicit, because otherwise get() will not
                # return an object that has been marked deleted.
                try:
                    obj = self.SNAPSHOT_METADATA_CLASS.objects.get(
                        id=snapshot_id)
                    obj.delete()
                except self.SNAPSHOT_METADATA_CLASS.DoesNotExist:
                    pass

            for snapshot_id in snapshot_ids:
                try:
                    obj = self.SNAPSHOT_CONTENT_CLASS.objects.get(
                        id=snapshot_id)
                    obj.delete()
                except self.SNAPSHOT_CONTENT_CLASS.DoesNotExist:
                    pass

            super(VersionedModel, self).delete()
        else:
            self._require_not_marked_deleted()
            self.deleted = True
            self._trusted_commit(
                committer_id, self._COMMIT_TYPE_DELETE, commit_message, [])

    def commit(self, committer_id, commit_message, commit_cmds):
        """Saves a version snapshot and updates the model.

        commit_cmds should give sufficient information to reconstruct the
        commit.
        """
        self._require_not_marked_deleted()

        for commit_cmd in commit_cmds:
            for key in commit_cmd:
                if key.startswith(self._AUTOGENERATED_PREFIX):
                    raise Exception(
                        'Invalid key %s in commit_cmds' % key)

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

        commit_cmds = [{
            'AUTO_revert_version_number': version_number
        }]

        snapshot_id = self._get_snapshot_id(self.id, version_number)
        self._reconstitute_from_snapshot_id(snapshot_id)

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

        returned_models = [
            cls.SNAPSHOT_METADATA_CLASS.get(snapshot_id)
            for snapshot_id in snapshot_ids]

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
    committer_id = models.CharField(max_length=30)
    # The type of the commit associated with this snapshot.
    commit_type = models.CharField(
        max_length=30,
        choices=[(x, x) for x in VersionedModel.COMMIT_TYPE_CHOICES])
    # The commit message associated with this snapshot.
    commit_message = models.CharField(max_length=500, blank=True)
    # A sequence of commands that can be used to describe this commit.
    # Represented as a list of dicts.
    commit_cmds = django_utils.JSONField(
        blank=True, default=[], primitivelist=True)


class BaseSnapshotContentModel(BaseModel):
    """Base class for snapshot content classes.

    The id of this model is computed using VersionedModel.get_snapshot_id().
    """

    # The snapshot content, as a JSON blob.
    content = django_utils.JSONField(blank=True, primitivelist=True)
