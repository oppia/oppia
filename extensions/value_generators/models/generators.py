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
import random

import utils


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

    @classmethod
    def render_view(cls):
        """Renders a view-only version of the generator."""
        raise NotImplementedError

    @classmethod
    def render_edit(cls, frontend_name, data=None):
        """Renders a value generator customization UI."""
        raise NotImplementedError


class Copier(BaseValueGenerator):
    """Returns a copy of the input value."""

    def generate_value(self, value):
        return copy.deepcopy(value)


class RandomSelector(BaseValueGenerator):
    """Returns a random value from the input list."""

    def generate_value(self, list_of_values):
        return copy.deepcopy(utils.get_random_choice(list_of_values))


class InclusiveIntRangePicker(BaseValueGenerator):
    """Selects a random value from a given range of consecutive integers."""

    def generate_value(self, lower_bound, upper_bound):
        assert lower_bound <= upper_bound
        assert isinstance(lower_bound, int) and isinstance(upper_bound, int)
        return random.SystemRandom().randrange(lower_bound, upper_bound + 1)


class RandomStringGenerator(BaseValueGenerator):
    """Generates a random string of a specified length from a given charset."""

    def generate_value(self, length, charset):
        output = u''
        for i in range(length):
            ind = random.SystemRandom().randrange(0, len(charset))
            output += charset[ind]
        return output


class JinjaEvaluator(BaseValueGenerator):
    """Returns the result of evaluating a Jinja template string."""

    def generate_value(self, jinja_string, values_dict):
        return utils.parse_with_jinja(jinja_string, values_dict)


class Accumulator(BaseValueGenerator):
    """Returns the sum of the values in the input list."""

    def generate_value(self, list_of_values):
        output = 0
        for item in list_of_values:
            output += item
        return output


class RestrictedCopier(BaseValueGenerator):
    """Returns a copy of the input, after checking its existence in a list."""
    choices = []

    def __init__(self, choices):
        if not isinstance(choices, list):
            raise TypeError('Expected a list of choices, received %s' % choices)
        self.choices = choices

    def generate_value(self, value):
        assert value in self.choices
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
        assert self.min_value <= value <= self.max_value
        return copy.deepcopy(value)
