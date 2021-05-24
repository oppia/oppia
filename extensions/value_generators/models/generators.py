# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy

from core.domain import value_generators_domain
import utils


class Copier(value_generators_domain.BaseValueGenerator):
    """Returns a copy of the input value."""

    default_value = ''

    def generate_value(
            self, unused_context_params, value, parse_with_jinja=False):  # pylint: disable=unused-argument
        """Returns a copy of the input value.

        Args:
            unused_context_params: dict. Context params parsed with input
                value which is treated as a template. Not used.
            value: str. Value whose copy should be returned.
            parse_with_jinja: bool. It is a part of ParamChange object.
                The parsing of input value against context_params
                based on parse_with_jinja is done in the FE. Not used.

        Returns:
            str. Copy of the input value.
        """
        return copy.deepcopy(value)


class RandomSelector(value_generators_domain.BaseValueGenerator):
    """Returns a random value from the input list."""

    default_value = ''

    def generate_value(self, unused_context_params, list_of_values):
        return copy.deepcopy(utils.get_random_choice(list_of_values))
