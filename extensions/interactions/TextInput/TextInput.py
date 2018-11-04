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

from extensions.interactions import base


class TextInput(base.BaseInteraction):
    """Interaction for entering text strings."""

    name = 'Text Input'
    description = 'Allows learners to enter arbitrary text strings.'
    display_mode = base.DISPLAY_MODE_INLINE
    is_trainable = True
    _dependency_ids = ['text_input_prediction']
    answer_type = 'NormalizedString'
    instructions = None
    narrow_instructions = None
    needs_summary = False
    can_have_solution = True
    show_generic_submit_button = True

    # NB: There used to be an integer-typed parameter here called 'columns'
    # that was removed in revision 628942010573. Some text interactions in
    # older explorations may have this customization parameter still set
    # in the exploration definition, so, in order to minimize the possibility
    # of collisions, do not add a new parameter with this name to this list.
    # TODO(sll): Migrate old definitions which still contain the 'columns'
    # parameter.
    _customization_arg_specs = [{
        'name': 'placeholder',
        'description': 'Placeholder text (optional)',
        'schema': {
            'type': 'unicode',
        },
        'default_value': ''
    }, {
        'name': 'rows',
        'description': 'Height (in rows)',
        'schema': {
            'type': 'int',
            'validators': [{
                'id': 'is_at_least',
                'min_value': 1,
            }, {
                'id': 'is_at_most',
                'max_value': 200,
            }]
        },
        'default_value': 1,
    }]

    _answer_visualization_specs = [{
        # Table with answer counts for top N answers.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'Top answers',
        },
        'calculation_id': 'Top10AnswerFrequencies',
        'addressed_info_is_supported': True,
    }, {
        # Table with answer counts for top N unresolved answers.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'Top unresolved answers',
        },
        'calculation_id': 'TopNUnresolvedAnswersByFrequency',
        'addressed_info_is_supported': True,
    }]
