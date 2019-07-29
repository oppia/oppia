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
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import copy
import os
import sys

from core.domain import value_generators_domain
import jinja_utils
import utils

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


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

    def generate_value(self, unused_context_params, list_of_values):
        return copy.deepcopy(utils.get_random_choice(list_of_values))
