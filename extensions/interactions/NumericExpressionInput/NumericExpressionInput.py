# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Python configuration for NumericExpressionInput interaction."""

from __future__ import annotations

from extensions.interactions import base

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class NumericExpressionInput(base.BaseInteraction):
    """Interaction for numeric expression input."""

    name: str = 'Numeric Expression Input'
    description: str = 'Allows learners to enter numeric expressions.'
    display_mode: str = base.DISPLAY_MODE_INLINE
    is_trainable: bool = False
    _dependency_ids: List[str] = ['guppy', 'nerdamer']
    answer_type: str = 'NumericExpression'
    can_have_solution: bool = True
    show_generic_submit_button: bool = True

    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'placeholder',
        'description': 'Placeholder text',
        'schema': {
            'type': 'custom',
            'obj_type': 'SubtitledUnicode'
        },
        'default_value': {
            'content_id': None,
            'unicode_str': 'Type an expression here, using only numbers.'
        }
    }, {
        'name': 'useFractionForDivision',
        'description': (
            'Represent division using fractions (rather than ÷).'),
        'schema': {
            'type': 'bool'
        },
        'default_value': False
    }]
