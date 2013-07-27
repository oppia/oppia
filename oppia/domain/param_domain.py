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

import utils


class Parameter(object):
    """Value object for a parameter.

    A parameter consists of a name, an obj_type, a list of values
    and an optional description. Each element in the list of values
    must be of the given obj_type.
    """
    name = None
    values = None
    obj_type = None
    description = ''

    def __init__(self, name, values, obj_type, description=''):
        self.name = name
        self.values = values
        self.obj_type = obj_type
        self.description = description
        assert self.values and self.obj_type and self.name

    @property
    def value(self):
        """Picks one of the values in the list at random."""
        if not self.values:
            return None
        return utils.get_random_choice(self.values)
