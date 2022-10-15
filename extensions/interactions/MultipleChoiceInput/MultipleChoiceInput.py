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

"""Python configuration for MultipleChoiceInput interaction."""

from __future__ import annotations

from extensions.interactions import base

from typing import List, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class MultipleChoiceInput(base.BaseInteraction):
    """Interaction for multiple choice input."""

    name: str = 'Multiple Choice'
    description: str = (
        'Allows learners to select one of a list of multiple-choice options.')
    display_mode: str = base.DISPLAY_MODE_INLINE
    _dependency_ids: List[str] = []
    answer_type: str = 'NonnegativeInt'
    instructions: Optional[str] = None
    narrow_instructions: Optional[str] = None
    needs_summary: bool = False
    # Radio buttons get unselected when specifying a solution. This needs to be
    # fixed before solution feature can support this interaction.
    can_have_solution: bool = False
    show_generic_submit_button: bool = False

    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'choices',
        'description': 'Multiple Choice options',
        'schema': {
            'type': 'list',
            'validators': [
                {
                    'id': 'has_length_at_least',
                    'min_value': 1,
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
                            'Enter an option for the learner to select'),
                    }
                }
            },
            'ui_config': {
                'add_element_text': 'Add multiple choice option',
            }
        },
        'default_value': [{
            'content_id': None,
            'html': ''
        }],
    }, {
        'name': 'showChoicesInShuffledOrder',
        'description': 'Shuffle answer choices',
        'schema': {
            'type': 'bool',
        },
        'default_value': True
    }]

    _answer_visualization_specs: List[base.AnswerVisualizationSpecsDict] = [{
        'id': 'SortedTiles',
        'options': {'header': 'Top answers', 'use_percentages': True},
        'calculation_id': 'AnswerFrequencies',
        'addressed_info_is_supported': True,
    }]
