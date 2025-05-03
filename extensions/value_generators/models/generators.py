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

from typing import Dict, List, Optional


class Copier(value_generators_domain.BaseValueGenerator):
    """Returns a copy of the input value."""

    default_value: str = ''

    # Here we use MyPy ignore because the signature of this method doesn't
    # match with super class's generate_value method, because in the super
    # class's method we are allowing arbitrary numbers of arguments with
    # *args and **kwargs but here we are specifying only limited arguments.
    # So, due to this conflict in arguments definitions, a conflict in
    # signatures occurred which causes MyPy to throw an error. Thus, to
    # avoid the error, we used ignore here.
    def generate_value(  # type: ignore[override]
        self,
        unused_context_params: Optional[Dict[str, str]],
        value: str,
        parse_with_jinja: bool = False  # pylint: disable=unused-argument
    ) -> str:
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

    default_value: str = ''

    # Here we use MyPy ignore because the signature of this method doesn't
    # match with super class's generate_value method, because in the super
    # class's method we are allowing arbitrary numbers of arguments with
    # *args and **kwargs but here we are specifying only limited arguments.
    # So, due to this conflict in arguments definitions, a conflict in
    # signatures occurred which causes MyPy to throw an error. Thus, to
    # avoid the error, we used ignore here.
    def generate_value(  # type: ignore[override]
        self,
        unused_context_params: Dict[str, str],
        list_of_values: List[str]
    ) -> str:
        return copy.deepcopy(utils.get_random_choice(list_of_values))
