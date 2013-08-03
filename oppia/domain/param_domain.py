# coding: utf-8
#
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

"""Classes relating to Oppia parameters."""

__author__ = 'Sean Lip'

from oppia.domain import obj_services
import utils


class Parameter(object):
    """Value object for a parameter.

    A parameter consists of a name, an obj_type, a list of values
    and an optional description. Each element in the list of values
    must be of the given obj_type.

    Note that the obj_type must be set before the values.
    """
    def __setattr__(self, name, value):
        if name == 'name':
            assert value
        elif name == 'obj_type':
            # Later, accept actual obj_types (not the string for the name).
            # Or maybe accept both?
            assert value and isinstance(value, basestring)
        elif name == 'values':
            assert value and isinstance(value, list)
            value = [obj_services.get_object_class(
                self.obj_type).normalize(item) for item in value]

        super(Parameter, self).__setattr__(name, value)

    def __init__(self, name, obj_type, values, description=''):
        self.name = name
        self.obj_type = obj_type
        self.values = values
        self.description = description

    @property
    def value(self):
        """Picks one of the values in the list at random."""
        if not self.values:
            return None
        return utils.get_random_choice(self.values)
