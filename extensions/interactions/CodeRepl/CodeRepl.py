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

"""Python configuration for CodeRepl interaction."""

from __future__ import annotations

from extensions.interactions import base

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class CodeRepl(base.BaseInteraction):
    """Interaction that allows programs to be input."""

    name: str = 'Code Editor'
    description: str = 'Allows learners to enter code and get it evaluated.'
    display_mode: str = base.DISPLAY_MODE_SUPPLEMENTAL
    is_trainable: bool = True
    _dependency_ids: List[str] = ['skulpt', 'codemirror']
    answer_type: str = 'CodeEvaluation'
    instructions: str = 'I18N_INTERACTIONS_CODE_REPL_INSTRUCTION'
    narrow_instructions: str = 'I18N_INTERACTIONS_CODE_REPL_NARROW_INSTRUCTION'
    needs_summary: bool = True
    can_have_solution: bool = True
    show_generic_submit_button: bool = True

    # Language options 'lua', 'scheme', 'coffeescript', 'javascript', and
    # 'ruby' have been removed for possible later re-release.
    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'language',
        'description': 'Programming language',
        'schema': {
            'type': 'unicode',
            'choices': [
                'python',
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

    _answer_visualization_specs: List[base.AnswerVisualizationSpecsDict] = [{
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'Top 10 answers',
        },
        'calculation_id': 'Top10AnswerFrequencies',
        'addressed_info_is_supported': True,
    }]
