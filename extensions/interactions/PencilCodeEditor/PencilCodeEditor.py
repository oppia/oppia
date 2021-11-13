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

"""Python configuration for PencilCodeEditor interaction."""

from __future__ import annotations

from extensions.interactions import base


class PencilCodeEditor(base.BaseInteraction):
    """Interaction for running code in Pencil Code."""

    name = 'Pencil Code Editor'
    description = 'Allows learners to edit code in Pencil Code.'
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    is_trainable = False
    _dependency_ids = ['pencilcode']
    answer_type = 'CodeEvaluation'
    instructions = 'I18N_INTERACTIONS_PENCILCODE_INSTRUCTION'
    narrow_instructions = 'I18N_INTERACTIONS_PENCILCODE_NARROW_INSTRUCTION'
    needs_summary = True
    can_have_solution = True
    show_generic_submit_button = False

    _customization_arg_specs = [{
        'name': 'initialCode',
        'description': 'The initial code',
        'schema': {
            'type': 'unicode',
            'ui_config': {
                'coding_mode': 'coffeescript',
            },
        },
        'default_value': '# Add the initial code snippet here.'
    }]
