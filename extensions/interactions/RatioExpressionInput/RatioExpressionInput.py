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

"""Python configuration for RatioExpressionInput interaction."""

from __future__ import annotations

from extensions.interactions import base

from typing import List, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class RatioExpressionInput(base.BaseInteraction):
    """Interaction for ratio input."""

    name: str = 'Ratio Expression Input'
    description: str = 'Allow learners to enter ratios.'
    display_mode: str = base.DISPLAY_MODE_INLINE
    is_trainable: bool = False
    _dependency_ids: List[str] = []
    answer_type: str = 'RatioExpression'
    instructions: Optional[str] = None
    narrow_instructions: Optional[str] = None
    needs_summary: bool = False
    can_have_solution: bool = True
    show_generic_submit_button: bool = True

    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'placeholder',
        'description': 'Custom placeholder text (optional)',
        'schema': {
            'type': 'custom',
            'obj_type': 'SubtitledUnicode'
        },
        'default_value': {
            'content_id': None,
            'unicode_str': ''
        }
    }, {
        'name': 'numberOfTerms',
        'description': (
            'The number of elements that the answer must have.'
            ' If set to 0, a ratio of any length will be accepted.'
            ' The number of elements should not be greater than 10.'),
        'schema': {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 0,
            }, {
                'id': 'is_at_most',
                'max_value': 10,
            }],
        },
        'default_value': 0,
    }]

    _answer_visualization_specs: List[base.AnswerVisualizationSpecsDict] = []
