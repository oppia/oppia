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

from core.domain import obj_services
import core.storage.base_model.models as base_models
from core.storage.base_model.django_models import django_internal_attrs
import utils

from django.db import models
from core.django_utils import JSONField


class Parameter(base_models.BaseModel):
    """Represents a (multi-valued) parameter.

    The 'values' property represents the list of possible default values for
    the parameter. The 'value' property returns one value from these, chosen
    randomly; the 'values' property returns the entire list.

    The difference between a Parameter and a typed object is that a Parameter
    can be overridden (by specifying its name and a new set of values). A
    typed object is meant to be immutable (once it is created).
    """

    def _pre_put_hook(self):
        """Does validation before the model is put into the datastore."""
        self.validate_name()

    # The name of the parameter.
    name = models.CharField(max_length=100)
    # The description of the parameter.
    description = models.TextField(blank=True)
    # The type of the parameter.
    obj_type = models.CharField(max_length=100)
    # The default value of the parameter.
    values = JSONField(default=[], blank=True, primitivelist=True)

    def validate_name(self):
        """Check that the value is alphanumeric."""
        assert re.compile("^[a-zA-Z0-9]+$").match(self.name), (
            'Only parameter names with characters in [a-zA-Z0-9] are accepted.')

    @property
    def value(self):
        if not self.values:
            return None
        return utils.get_random_choice(self.values)

    def __setattr__(self, item, value):
        """Perform some validations before setting values"""
        if item == 'obj_type':
            obj_services.get_object_class(value)
            self.__dict__['obj_type'] = value
        elif item == 'values':
            # Always assign obj_type before values. Otherwise this will fail.
            object_class = obj_services.get_object_class(self.obj_type)
            if not value == u'[]':
                values = [object_class.normalize(elem) for elem in value]
            else:
                values = []
            self.__dict__['values'] = values

        elif item in django_internal_attrs or item in [
            'name', 'description', 'values', '_json_field_cache', 'parameter_ptr_id'
        ]:
            self.__dict__[item] = value
        else:
            raise AttributeError(item)


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


class ParamSet(base_models.BaseModel):
    """A list of parameters."""
    # List of Parameter objects. An ordered list of parameters.
    params = JSONField(default=[], schema=[Parameter])
