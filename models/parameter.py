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

"""Models for generic parameters."""

__author__ = 'Sean Lip'

from types import TypedInstance
from types import get_object_class

from google.appengine.ext import ndb


class Parameter(TypedInstance):
    """Represents a parameter.

    Note that this class also has obj_type and value attributes, since it
    inherits from TypedInstance.

    The 'value' attribute represents the default value of the parameter. The
    difference between a Parameter and an Instance is that a Parameter can be
    overridden (by specifying its name and a new value).
    """
    # The name of the parameter.
    name = ndb.StringProperty(required=True)
    # The description of the parameter.
    description = ndb.TextProperty()


class ParameterProperty(ndb.StructuredProperty):
    """Represents a parameter."""
    def __init__(self, **kwds):
        super(ParameterProperty, self).__init__(Parameter, **kwds)

    def _validate(self, val):
        object_class = get_object_class(val.obj_type)
        return ParameterModel(
            obj_type=val.obj_type, value=object_class.normalize(val.value),
            name=val.name, description=val.description)

    def _to_base_type(self, val):
        return ParameterModel(
            obj_type=val.obj_type, value=val.value, name=val.name,
            description=val.description)

    def _from_base_type(self, val):
        return ParameterModel(
            obj_type=val.obj_type, value=val.value, name=val.name,
            description=val.description)


class ParameterChange(TypedInstance):
    """Represents a parameter change.

    Note that this class also has obj_type and value attributes, since it
    inherits from TypedInstance. The value attribute is the new value for the
    parameter.
    """
    # The name of the parameter to change.
    name = ndb.StringProperty(required=True)


class ParameterChangeProperty(ndb.StructuredProperty):
    """Represents a parameter change."""
    def __init__(self, **kwds):
        super(ParameterChangeProperty, self).__init__(ParameterChange, **kwds)

    def _validate(self, val):
        # Parent classes must do validation to check that the object type here
        # matches the object type of the parameter with the corresponding name.
        object_class = get_object_class(val.obj_type)
        return ParameterChangeModel(
            obj_type=val.obj_type, name=val.name,
            value=object_class.normalize(val.value))

    def _to_base_type(self, val):
        return ParameterChangeModel(
            obj_type=val.obj_type, name=val.name, value=val.value)

    def _from_base_type(self, val):
        return ParameterChangeModel(
            obj_type=val.obj_type, name=val.name, value=val.value)
