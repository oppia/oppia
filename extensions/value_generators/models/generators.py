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

from __future__ import annotations

import copy

from core import utils
from core.domain import value_generators_domain

from typing import List, cast


class Copier(value_generators_domain.BaseValueGenerator[str]):
    """Returns a copy of the input value."""

    default_value: str = ''

    def generate_value(self, *args: object, **kwargs: object) -> str:
        """Returns a copy of the input value.

        Args:
            *args: object. Positional args; first arg is the value to copy.
            **kwargs: object. Unused keyword args.

        Returns:
            str. Copy of the input value.
        """
        value = args[1] if len(args) > 1 else kwargs.get('value', '')
        return copy.deepcopy(str(value))


class RandomSelector(value_generators_domain.BaseValueGenerator[str]):
    """Returns a random value from the input list."""

    default_value: str = ''

    def generate_value(self, *args: object, **kwargs: object) -> str:
        list_of_values: List[str] = cast(
            List[str],
            args[1] if len(args) > 1 else kwargs.get('list_of_values', []),
        )
        return copy.deepcopy(utils.get_random_choice(list_of_values))
