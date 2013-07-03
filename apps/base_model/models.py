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
    """Base model for all object classes in Oppia."""

    class ValidationError(Exception):
        """Error class for model validation errors."""

    def _pre_put_hook(self):
        pass


class IdModel(BaseModel):
    """An abstract model class with an explicit id property."""
    @property
    def id(self):
        return self.key.id()

    def put(self):
        super(IdModel, self).put()

    def delete(self):
        super(IdModel, self).key.delete()

    @classmethod
    def get_new_id(cls, entity_name):
        """Gets a new 12-character id for an entity, based on its name.

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
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception('New id generator is producing too many collisions.')

    @classmethod
    def get(cls, entity_id, strict=True):
        """Gets an entity by id. Fails noisily if strict == True."""
        entity = cls.get_by_id(entity_id)
        if strict and not entity:
            raise Exception('Entity for class %s with id %s not found' %
                            (cls.__name__, entity_id))
        return entity
