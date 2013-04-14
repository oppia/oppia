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

import re

from types import get_object_class

from google.appengine.ext import ndb


class AlphanumericProperty(ndb.StringProperty):
    """A property for strings with alphanumeric characters."""

    def _validate(self, value):
        """Check that the value is alphanumeric."""
        assert re.compile("^[a-zA-Z0-9]+$").match(value), (
            'Only parameter names with characters in [a-zA-Z0-9] are accepted.')


class Parameter(ndb.Model):
    """Represents a parameter.

    The 'value' attribute represents the default value of the parameter. The
    difference between a Parameter and a TypedInstance is that a Parameter can
    be overridden (by specifying its name and a new value).
    """
    def _pre_put_hook(self):
        """Does validation before the model is put into the datastore."""
        object_class = get_object_class(self.obj_type)
        self.value = object_class.normalize(self.value)

    # The name of the parameter.
    name = AlphanumericProperty(required=True)
    # The description of the parameter.
    description = ndb.TextProperty()
    # The type of the parameter.
    obj_type = ndb.StringProperty(required=True)
    # The default value of the parameter.
    value = ndb.JsonProperty()


class ParameterProperty(ndb.LocalStructuredProperty):
    """Represents a parameter."""
    def __init__(self, **kwds):
        super(ParameterProperty, self).__init__(Parameter, **kwds)

    def _validate(self, val):
        object_class = get_object_class(val.obj_type)
        return Parameter(
            obj_type=val.obj_type,
            values=object_class.normalize(val.value),
            name=val.name, description=val.description)

    def _to_base_type(self, val):
        return Parameter(
            obj_type=val.obj_type, value=val.value, name=val.name,
            description=val.description)

    def _from_base_type(self, val):
        return Parameter(
            obj_type=val.obj_type, value=val.value, name=val.name,
            description=val.description)


class ParameterChange(Parameter):
    """Represents a parameter change.

    This has the effect of replacing the value that can be taken by an
    existing parameter.
    """
    description = None


class ParameterChangeProperty(ndb.LocalStructuredProperty):
    """Represents a parameter change."""
    def __init__(self, **kwds):
        super(ParameterChangeProperty, self).__init__(ParameterChange, **kwds)

    def _validate(self, val):
        # Parent classes must do validation to check that the object type here
        # matches the object type of the parameter with the corresponding name.
        object_class = get_object_class(val.obj_type)
        return ParameterChange(
            obj_type=val.obj_type, name=val.name,
            values=object_class.normalize(val.value))

    def _to_base_type(self, val):
        return ParameterChange(
            obj_type=val.obj_type, name=val.name, value=val.value)

    def _from_base_type(self, val):
        return ParameterChange(
            obj_type=val.obj_type, name=val.name, value=val.value)


class MultiParameter(ndb.Model):
    """Represents a multi-valued parameter.

    The 'values' attribute represents the list of possible default values for the
    parameter. At resolution, exactly one of these values is chosen.
    """
    def _pre_put_hook(self):
        """Does validation before the model is put into the datastore."""
        object_class = get_object_class(self.obj_type)
        assert self.values, 'Parameter %s has no values supplied.' % self.name
        self.values = [object_class.normalize(value) for value in self.values]

    # The name of the parameter.
    name = ndb.StringProperty(required=True)
    # The description of the parameter.
    description = ndb.TextProperty()
    # The type of the parameter.
    obj_type = ndb.StringProperty(required=True)
    # The default values that can be taken by the parameter.
    values = ndb.JsonProperty(repeated=True)


class MultiParameterProperty(ndb.LocalStructuredProperty):
    """Represents a multi-valued parameter."""
    def __init__(self, **kwds):
        super(MultiParameterProperty, self).__init__(MultiParameter, **kwds)

    def _validate(self, val):
        object_class = get_object_class(val.obj_type)
        return MultiParameter(
            obj_type=val.obj_type,
            values=[object_class.normalize(value) for value in val.values],
            name=val.name, description=val.description)

    def _to_base_type(self, val):
        return MultiParameter(
            obj_type=val.obj_type, values=val.values, name=val.name,
            description=val.description)

    def _from_base_type(self, val):
        return MultiParameter(
            obj_type=val.obj_type, values=val.values, name=val.name,
            description=val.description)


class MultiParameterChange(MultiParameter):
    """Represents a change to a multi-valued parameter.

    This has the effect of replacing the set of values that can be taken
    by an existing parameter.
    """
    description = None


class MultiParameterChangeProperty(ndb.LocalStructuredProperty):
    """Represents a parameter change."""
    def __init__(self, **kwds):
        super(MultiParameterChangeProperty, self).__init__(MultiParameterChange, **kwds)

    def _validate(self, val):
        # Parent classes must do validation to check that the object type here
        # matches the object type of the parameter with the corresponding name.
        object_class = get_object_class(val.obj_type)
        return MultiParameterChange(
            obj_type=val.obj_type, name=val.name,
            values=[object_class.normalize(value) for value in val.values])

    def _to_base_type(self, val):
        return MultiParameterChange(
            obj_type=val.obj_type, name=val.name, values=val.values)

    def _from_base_type(self, val):
        return MultiParameterChange(
            obj_type=val.obj_type, name=val.name, values=val.values)
