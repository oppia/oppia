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


class CodeRepl(base.BaseInteraction):
    """Interaction that allows programs to be input."""

    name = 'Code Editor'
    description = 'Allows learners to enter code and get it evaluated.'
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    _dependency_ids = ['jsrepl', 'codemirror']
    answer_type = 'CodeEvaluation'

    # Language options 'lua' and 'scheme' have been removed for possible
    # later re-release.
    _customization_arg_specs = [{
        'name': 'language',
        'description': 'Programming language',
        'schema': {
            'type': 'unicode',
            'choices': [
                'coffeescript', 'javascript', 'python', 'ruby',
            ]
        },
        'default_value': 'python'
    }, {
        'name': 'placeholder',
        'description': 'Initial code displayed',
        'schema': {
            'type': 'unicode',
            'ui_config': {
                'coding_mode': 'none',
            },
        },
        'default_value': '# Type your code here.'
    }, {
        'name': 'preCode',
        'description': 'Code to prepend to the learner\'s submission',
        'schema': {
            'type': 'unicode',
            'ui_config': {
                'coding_mode': 'none',
            },
        },
        'default_value': ''
    }, {
        'name': 'postCode',
        'description': 'Code to append after the learner\'s submission',
        'schema': {
            'type': 'unicode',
            'ui_config': {
                'coding_mode': 'none',
            },
        },
        'default_value': ''
    }]

    _answer_visualization_specs = [{
        # Table with answer counts for top N answers.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'Top 5 answers'
        },
        'calculation_id': 'Top5AnswerFrequencies',
    }, {
        # Table with answer counts.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'All answers'
        },
        'calculation_id': 'AnswerFrequencies',
    }]

