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

"""Python configuration for ItemSelectionInput interaction."""

from __future__ import annotations

from extensions.interactions import base

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class ItemSelectionInput(base.BaseInteraction):
    """Interaction for item selection input."""

    name: str = 'Item Selection'
    description: str = (
        'Allows learners to select various options.')
    display_mode: str = base.DISPLAY_MODE_INLINE
    _dependency_ids: List[str] = []
    answer_type: str = 'SetOfTranslatableHtmlContentIds'
    # Radio buttons get unselected when specifying a solution. This needs to be
    # fixed before solution feature can support this interaction.
    can_have_solution: bool = False
    # ItemSelectionInput's submit button is dynamic and is handled
    # separately.
    show_generic_submit_button: bool = False

    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'minAllowableSelectionCount',
        'description': 'Minimum number of selections permitted.',
        'schema': {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 0,
            }],
        },
        'default_value': 1,
    }, {
        'name': 'maxAllowableSelectionCount',
        'description': 'Maximum number of selections permitted',
        'schema': {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 1,
            }],
        },
        'default_value': 1,
    }, {
        'name': 'choices',
        'description': 'Items for selection',
        'schema': {
            'type': 'list',
            'validators': [{
                'id': 'has_unique_subtitled_contents'
            }],
            'items': {
                'type': 'custom',
                'obj_type': 'SubtitledHtml',
                'validators': [{
                    'id': 'has_subtitled_html_non_empty'
                }],
                'replacement_ui_config': {
                    'html': {
                        'hide_complex_extensions': True,
                        'placeholder': 'Sample item answer',
                    }
                }
            },
            'ui_config': {
                'add_element_text': 'Add item for selection',
            }
        },
        'default_value': [{
            'content_id': None,
            'html': ''
        }],
    }]

    _answer_visualization_specs: List[base.AnswerVisualizationSpecsDict] = [{
        # Table with keyed answer counts for top N answers.
        'id': 'EnumeratedFrequencyTable',
        'options': {
            'column_headers': ['Answer (click to expand/collapse)', 'Count'],
            'title': 'Top answers',
        },
        'calculation_id': 'Top10AnswerFrequencies',
        'addressed_info_is_supported': True,
    }]
