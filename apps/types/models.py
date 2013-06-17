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

"""Models for typed instances."""

__author__ = 'Sean Lip'

from apps.base_model.models import BaseModel
from data.objects.models import objects

from google.appengine.ext import ndb


def get_object_class(cls_name):
    """Gets the object class based on the class name."""
    try:
        assert cls_name != 'BaseObject'

        object_class = getattr(objects, cls_name)
        assert object_class
    except Exception:
        raise TypeError('\'%s\' is not a valid typed object class.' % cls_name)

    return object_class


class TypedInstance(BaseModel):
    """Represents an instance of a typed object."""
    def _pre_put_hook(self):
        """Does validation before the model is put into the datastore.

        IMPORTANT: If this model is used as a StructuredProperty in another
        model, this validation hook will NOT be called. Use a
        TypedInstanceProperty instead.
        """
        object_class = get_object_class(self.obj_type)
        return object_class.normalize(self.value)

    # The name of the object's class.
    obj_type = ndb.StringProperty(required=True)
    # A normalized Python representation of the instance's value.
    value = ndb.JsonProperty()


class TypedInstanceProperty(ndb.StructuredProperty):
    """Represents an instance of a typed object."""
    def __init__(self, **kwds):
        super(TypedInstanceProperty, self).__init__(TypedInstance, **kwds)

    def _validate(self, val):
        object_class = get_object_class(val.obj_type)
        return TypedInstance(
            obj_type=val.obj_type, value=object_class.normalize(val.value))

    def _to_base_type(self, val):
        return TypedInstance(obj_type=val.obj_type, value=val.value)

    def _from_base_type(self, val):
        return TypedInstance(obj_type=val.obj_type, value=val.value)
