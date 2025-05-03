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

"""Python configuration for SetInput interaction."""

from __future__ import annotations

from extensions.interactions import base

from typing import List, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class SetInput(base.BaseInteraction):
    """Interaction for input of an unordered set of strings."""

    name: str = 'Set Input'
    description: str = 'Allows learners to enter an unordered set of strings.'
    display_mode: str = base.DISPLAY_MODE_INLINE
    _dependency_ids: List[str] = []
    answer_type: str = 'SetOfUnicodeString'
    instructions: Optional[str] = None
    narrow_instructions: Optional[str] = None
    needs_summary: bool = False
    can_have_solution: bool = True
    show_generic_submit_button: bool = True

    # NB: There used to be a UnicodeString-typed parameter here called
    # 'element_type'. This has since been removed.
    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'buttonText',
        'description': 'Label for the \'Add Item\' button',
        'schema': {
            'type': 'custom',
            'obj_type': 'SubtitledUnicode'
        },
        'default_value': {
            'content_id': None,
            'unicode_str': 'Add Item'
        }
    }]

    _answer_visualization_specs: List[base.AnswerVisualizationSpecsDict] = [{
        # Table with answer counts for top N answers.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'Top 10 answers',
        },
        'calculation_id': 'Top10AnswerFrequencies',
        'addressed_info_is_supported': True,
    }, {
        # Table with most commonly submitted elements of set.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Element', 'Count'],
            'title': 'Commonly submitted elements',
        },
        'calculation_id': 'FrequencyCommonlySubmittedElements',
        # Since individual answer elements are not generally intended to be
        # used as a single response to SetInput interactions, we omit the
        # addressed column entirely.
        'addressed_info_is_supported': False,
    }]
