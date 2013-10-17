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
import hashlib

import utils

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

    @classmethod
    def get(cls, entity_id, strict=True, parent=None):
        """Gets an entity by id. Fails noisily if strict == True.

        Args:
          entity_id: str. The id of the entity.
          strict: bool. Whether to fail noisily if no entity with the given id
            exists in the datastore.
          parent: key of the parent, if applicable.

        Returns:
          None, if strict == False and no undeleted entity with the given id
          exists in the datastore. Otherwise, the entity instance that
          corresponds to the given id.

        Raises:
        - base_models.BaseModel.EntityNotFoundError: if strict == True and
            no undeleted entity with the given id exists in the datastore.
        """
        entity = cls.get_by_id(entity_id, parent=parent)
        if entity and entity.deleted:
            entity = None

        if strict and not entity:
            raise cls.EntityNotFoundError(
                'Entity for class %s with id %s not found' %
                (cls.__name__, entity_id))
        return entity

    def put(self):
        super(BaseModel, self).put()

    def delete(self):
        super(BaseModel, self).key.delete()

    @classmethod
    def get_all(cls):
        """Returns a filterable iterable of all entities of this class."""
        return cls.query()

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
            new_id = base64.urlsafe_b64encode(hashlib.sha1(
                '%s%s' % (entity_name, utils.get_random_int(RAND_RANGE))
            ).digest())[:ID_LENGTH]
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception('New id generator is producing too many collisions.')
