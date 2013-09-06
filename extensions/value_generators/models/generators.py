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
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Custom value generator classes."""

import copy
import numbers

import jinja_utils


class BaseValueGenerator(object):
    """Base value generator class.

    A value generator is a class containing a function that takes in
    customization args and uses them to generate a value. The generated values
    are not typed, so if the caller wants strongly-typed values it would need
    to normalize the output of each generator.
    """

    def generate_value(self, *args, **kwargs):
        """Generates a new value, using the given customization args."""
        raise NotImplementedError


class Copier(BaseValueGenerator):
    """Returns a copy of the input value."""

    def generate_value(self, value, parse_with_jinja=False,
                       context_params=None):
        """Returns a copy of the input value.

        If parse_with_jinja is True, the input value is treated as a template
        string and parsed against context_params before being copied. The
        output will be a unicode string.

        If parse_with_jinja is False, the input value is copied and returned
        without changing its type.
        """
        if context_params is None:
            context_params = {}

        if parse_with_jinja:
            return jinja_utils.parse_string(unicode(value), context_params)
        else:
            return copy.deepcopy(value)


class RestrictedCopier(BaseValueGenerator):
    """Returns a copy of the input, after checking its existence in a list."""
    choices = []

    def __init__(self, choices):
        if not isinstance(choices, list):
            raise TypeError('Expected a list of choices, received %s' % choices)
        self.choices = choices

    def generate_value(self, value):
        if not value in self.choices:
            raise Exception(
                'Value must be one of %s; received %s' % (self.choices, value))
        return copy.deepcopy(value)


class RangeRestrictedCopier(BaseValueGenerator):
    """Returns the input, after checking it is in a given interval."""

    min_value = 0
    max_value = 0

    def __init__(self, min_value, max_value):
        if not isinstance(min_value, numbers.Number):
            raise TypeError('Expected a number, received %s' % min_value)
        if not isinstance(max_value, numbers.Number):
            raise TypeError('Expected a number, received %s' % max_value)
        self.min_value = min_value
        self.max_value = max_value

    def generate_value(self, value):
        if not self.min_value <= value <= self.max_value:
            raise Exception(
                'Value must be between %s and %s, inclusive; received %s' %
                (self.min_value, self.max_value, value))
        return copy.deepcopy(value)
