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

from extensions.interactions import base


class ItemSelectionInput(base.BaseInteraction):
    """Interaction for item selection input."""

    name = 'Item Selection'
    description = (
        'Allows learners to select various options.')
    display_mode = base.DISPLAY_MODE_INLINE
    _dependency_ids = []
    answer_type = 'SetOfHtmlString'
    # Radio buttons get unselected when specifying a solution. This needs to be
    # fixed before solution feature can support this interaction.
    can_have_solution = False
    # ItemSelectionInput's submit button is dynamic and is handled
    # separately.
    show_generic_submit_button = False

    _customization_arg_specs = [{
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
            'items': {
                'type': 'html',
                'ui_config': {
                    'hide_complex_extensions': True,
                    'placeholder': 'Sample item answer',
                },
            },
            'ui_config': {
                'add_element_text': 'Add item for selection',
            }
        },
        'default_value': [''],
    }]

    _answer_visualization_specs = [{
        # Table with keyed answer counts for top N answers.
        'id': 'EnumeratedFrequencyTable',
        'options': {
            'column_headers': ['Answer (click to expand/collapse)', 'Count'],
            'title': 'Top answers',
        },
        'calculation_id': 'Top10AnswerFrequencies',
        'addressed_info_is_supported': True,
    }]
