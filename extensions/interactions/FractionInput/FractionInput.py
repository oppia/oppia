# Copyright 2017 The Oppia Authors. All Rights Reserved.
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


class FractionInput(base.BaseInteraction):
    """Interaction for fraction input."""

    name = 'Fraction Input'
    description = 'Allows learners to enter integers and fractions.'
    display_mode = base.DISPLAY_MODE_INLINE
    is_trainable = False
    _dependency_ids = []
    answer_type = 'Fraction'
    instructions = None
    narrow_instructions = None
    needs_summary = False
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'requireSimplestForm',
        'description': 'Require the learner\'s answer to be in simplest form',
        'schema': {
            'type': 'bool',
        },
        'default_value': False
    }, {
        'name': 'allowImproperFraction',
        'description': 'Allow improper fractions in the learner\'s answer',
        'schema': {
            'type': 'bool',
        },
        'default_value': True
    }, {
        'name': 'allowNonzeroIntegerPart',
        'description': 'Allow the answer to contain an integer part',
        'schema': {
            'type': 'bool',
        },
        'default_value': True
    }, {
        'name': 'customPlaceholder',
        'description': 'Custom placeholder text (optional)',
        'schema': {
            'type': 'unicode'
        },
        'default_value': ''
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
    }]
