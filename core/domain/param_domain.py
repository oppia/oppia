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

"""Classes relating to parameters."""

__author__ = 'Sean Lip'

import re

from core.domain import obj_services
import utils


class Parameter(object):
    """Value object for a parameter.

    A parameter consists of a name, an obj_type, and a list of values.
    Each element in the list of values must be of the given obj_type.

    Note that the obj_type must be set before the values.
    """
    def __init__(self, name, obj_type, values, choices=None, description=''):
        self.name = name
        self.obj_type = obj_type

        # "choices" needs to be set before values because we might need to
        # validate the values against possible choices.
        self.choices = choices
        self.values = values

    def __setattr__(self, name, value):
        if name == 'name':
            if not value or not re.compile('^[a-zA-Z0-9]+$').match(value):
                raise ValueError(
                    'Only parameter names with characters in [a-zA-Z0-9] are '
                    'accepted.')
        elif name == 'obj_type':
            # TODO(sll): Accept actual obj_types (not the string for the name).
            # Or maybe accept both?
            if (not isinstance(value, basestring) or
                    not obj_services.get_object_class(value)):
                raise ValueError('Invalid obj_type: %s' % value)
        elif name == 'values':
            if not isinstance(value, list):
                raise ValueError(
                    'The values property for a parameter should be a list.')
            if self.choices is not None:
                for item in value:
                    if item not in self.choices:
                        raise ValueError('The values not in choices.')
            value = [obj_services.get_object_class(
                self.obj_type).normalize(item) for item in value]

        super(Parameter, self).__setattr__(name, value)

    @property
    def value(self):
        """Picks one of the values in the list at random."""
        return utils.get_random_choice(self.values) if self.values else None

    def to_dict(self):
        return {
            'name': self.name,
            'obj_type': self.obj_type,
            'values': self.values
        }

    @classmethod
    def from_dict(cls, param_dict):
        return cls(param_dict['name'], param_dict['obj_type'],
                   param_dict['values'])
