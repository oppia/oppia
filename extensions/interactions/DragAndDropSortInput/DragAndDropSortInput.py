# Copyright 2018 The Oppia Authors. All Rights Reserved.
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
"""Python configuration for DragAndDropSortInput interaction."""

from __future__ import annotations

from extensions.interactions import base

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class DragAndDropSortInput(base.BaseInteraction):
    """Interaction for Drag and Drop Sorting."""

    name: str = 'Drag And Drop Sort'
    description: str = 'Allows learners to drag and drop items for sorting.'
    display_mode: str = base.DISPLAY_MODE_SUPPLEMENTAL
    is_trainable: bool = False
    _dependency_ids: List[str] = []
    answer_type: str = 'ListOfSetsOfTranslatableHtmlContentIds'
    instructions: str = 'I18N_INTERACTIONS_DRAG_AND_DROP_INSTRUCTION'
    narrow_instructions: str = 'I18N_INTERACTIONS_DRAG_AND_DROP_INSTRUCTION'
    needs_summary: bool = True
    can_have_solution: bool = True
    show_generic_submit_button: bool = True

    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'choices',
        'description': 'Items for drag and drop',
        'schema': {
            'type': 'list',
            'validators': [
                {
                    'id': 'has_length_at_least',
                    'min_value': 2
                },
                {
                    'id': 'has_unique_subtitled_contents'
                }
            ],
            'items': {
                'type': 'custom',
                'obj_type': 'SubtitledHtml',
                'validators': [{
                    'id': 'has_subtitled_html_non_empty'
                }],
                'replacement_ui_config': {
                    'html': {
                        'hide_complex_extensions': True,
                        'placeholder': (
                            'Enter an option for the learner to drag and drop.')
                    }
                }
            },
            'ui_config': {
                'add_element_text': 'Add a new item',
            }
        },
        'default_value': [{
            'content_id': None,
            'html': ''
        }],
    }, {
        'name': 'allowMultipleItemsInSamePosition',
        'description': 'Allow multiple sort items in the same position',
        'schema': {
            'type': 'bool'
        },
        'default_value': False
    }]

    _answer_visualization_specs: List[base.AnswerVisualizationSpecsDict] = []
