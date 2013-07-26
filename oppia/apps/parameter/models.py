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

import oppia.apps.base_model.models as base_models
from oppia.apps.typed_objects import obj_services
import utils

from google.appengine.ext import ndb


class AlphanumericProperty(ndb.StringProperty):
    """A property for strings with alphanumeric characters."""

    def _validate(self, value):
        """Check that the value is alphanumeric."""
        assert re.compile("^[a-zA-Z0-9]+$").match(value), (
            'Only parameter names with characters in [a-zA-Z0-9] are accepted.')


class Parameter(base_models.BaseModel):
    """Represents a (multi-valued) parameter.

    The 'values' property represents the list of possible default values for
    the parameter. The 'value' property returns one value from these, chosen
    randomly; the 'values' property returns the entire list.

    The difference between a Parameter and a typed object is that a Parameter
    can be overridden (by specifying its name and a new set of values).
    """
    def _pre_put_hook(self):
        """Does validation before the model is put into the datastore."""
        object_class = obj_services.get_object_class(self.obj_type)
        self.values = [object_class.normalize(value) for value in self.values]

    # The name of the parameter.
    name = AlphanumericProperty(required=True)
    # The description of the parameter.
    description = ndb.TextProperty()
    # The type of the parameter.
    obj_type = ndb.StringProperty(required=True)
    # The default value of the parameter.
    values = ndb.JsonProperty(repeated=True)

    @property
    def value(self):
        if not self.values:
            return None
        return utils.get_random_choice(self.values)


class ParameterProperty(ndb.LocalStructuredProperty):
    """Represents a multi-valued parameter."""
    def __init__(self, **kwds):
        super(ParameterProperty, self).__init__(Parameter, **kwds)

    def _validate(self, val):
        object_class = obj_services.get_object_class(val.obj_type)
        return Parameter(
            obj_type=val.obj_type,
            values=[object_class.normalize(value) for value in val.values],
            name=val.name, description=val.description)

    def _to_base_type(self, val):
        return Parameter(
            obj_type=val.obj_type, values=val.values, name=val.name,
            description=val.description)

    def _from_base_type(self, val):
        return Parameter(
            obj_type=val.obj_type, values=val.values, name=val.name,
            description=val.description)


class ParamChange(Parameter):
    """Represents a change to a multi-valued parameter.

    This is used to replace or create the corresponding parameter in a reader's
    instance of an exploration. It does not result in changes in any backend
    models.

    The caller of this class is responsible for ensuring that the obj_type
    attribute is set correctly. The obj_type attribute should match the
    obj_type for the corresponding Parameter.
    """
    description = None


class ParamChangeProperty(ndb.LocalStructuredProperty):
    """Represents a parameter change."""
    def __init__(self, **kwds):
        super(ParamChangeProperty, self).__init__(ParamChange, **kwds)

    def _validate(self, val):
        # Parent classes must do validation to check that the object type here
        # matches the object type of the parameter with the corresponding name.
        object_class = obj_services.get_object_class(val.obj_type)
        return ParamChange(
            obj_type=val.obj_type, name=val.name,
            values=[object_class.normalize(value) for value in val.values])

    def _to_base_type(self, val):
        return ParamChange(
            obj_type=val.obj_type, name=val.name, values=val.values)

    def _from_base_type(self, val):
        return ParamChange(
            obj_type=val.obj_type, name=val.name, values=val.values)
