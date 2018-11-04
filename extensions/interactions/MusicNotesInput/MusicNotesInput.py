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


class MusicNotesInput(base.BaseInteraction):
    """Interaction for music notes input."""

    name = 'Music Notes Input'
    description = (
        'Allows learners to drag and drop notes onto the lines of a music '
        'staff.')
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    _dependency_ids = ['midijs']
    answer_type = 'MusicPhrase'
    instructions = 'Drag notes to the staff to form a sequence'
    narrow_instructions = 'Show music staff'
    needs_summary = True
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'sequenceToGuess',
        'description': 'Correct sequence of notes',
        'schema': {
            'type': 'custom',
            'obj_type': 'MusicPhrase',
        },
        'default_value': [],
    }, {
        'name': 'initialSequence',
        'description': 'Starting notes on the staff',
        'schema': {
            'type': 'custom',
            'obj_type': 'MusicPhrase',
        },
        'default_value': [],
    }]

    _answer_visualization_specs = [{
        # Table with answer counts for top N answers.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'Top 10 answers',
        },
        'calculation_id': 'Top10AnswerFrequencies',
        'addressed_info_is_supported': True,
    }]
