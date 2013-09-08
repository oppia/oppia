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

from core.domain import value_generators_domain
import jinja_utils
import utils


class Copier(value_generators_domain.BaseValueGenerator):
    """Returns a copy of the input value."""

    default_value = ''

    def generate_value(self, context_params, value, parse_with_jinja=False):
        """Returns a copy of the input value.

        If parse_with_jinja is True, strings within the input value are treated
        as templates and parsed against context_params. The output will be a
        unicode string.

        If parse_with_jinja is False, the input value is copied and returned
        without changing its type.
        """
        if context_params is None:
            context_params = {}

        if parse_with_jinja:
            return jinja_utils.evaluate_object(value, context_params)
        else:
            return copy.deepcopy(value)


class RandomSelector(value_generators_domain.BaseValueGenerator):
    """Returns a random value from the input list."""

    default_value = ''

    def generate_value(self, context_params, list_of_values):
        return copy.deepcopy(utils.get_random_choice(list_of_values))


class RestrictedCopier(value_generators_domain.BaseValueGenerator):
    """Returns a copy of the input, after checking its existence in a list."""

    choices = []

    @property
    def default_value(self):
        return self.choices[0]

    def __init__(self, choices):
        if not isinstance(choices, list):
            raise TypeError('Expected a list of choices, received %s' % choices)
        self.choices = choices

    def generate_value(self, context_params, value, parse_with_jinja=False):
        if context_params is None:
            context_params = {}

        if parse_with_jinja:
            value = jinja_utils.evaluate_object(value, context_params)

        if not value in self.choices:
            raise Exception(
                'Value must be one of %s; received %s' % (self.choices, value))
        return copy.deepcopy(value)


class RangeRestrictedCopier(value_generators_domain.BaseValueGenerator):
    """Returns the input, after checking it is in a given interval."""

    min_value = 0
    max_value = 0

    @property
    def default_value(self):
        return (self.min_value + self.max_value) / 2

    def __init__(self, min_value, max_value):
        if not isinstance(min_value, numbers.Number):
            raise TypeError('Expected a number, received %s' % min_value)
        if not isinstance(max_value, numbers.Number):
            raise TypeError('Expected a number, received %s' % max_value)
        self.min_value = min_value
        self.max_value = max_value

    def generate_value(self, context_params, value):
        if not self.min_value <= value <= self.max_value:
            raise Exception(
                'Value must be between %s and %s, inclusive; received %s' %
                (self.min_value, self.max_value, value))
        return copy.deepcopy(value)
