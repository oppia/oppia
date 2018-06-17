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
"""Python configuration for DragAndDropSort interaction."""

from extensions.interactions import base


class DragAndDropSort(base.BaseInteraction):
    """Interaction for Drag and Drop Sorting."""

    name = 'Drag And Drop Sort'
    description = 'Allows learners to drag and drop items for sorting.'
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    is_trainable = False
    _dependency_ids = []
    answer_type = 'ListOfSetsOfHtmlStrings'
    instructions = 'Drag and drop items'
    narrow_instructions = 'Drag and drop items'
    needs_summary = True
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'choices',
        'description': 'Items for drag and drop',
        'schema': {
            'type': 'list',
            'validators': [{
                'id': 'has_length_at_least',
                'min_value': 2
            }],
            'items': {
                'type': 'html',
                'ui_config': {
                    'hide_complex_extensions': True,
                    'placeholder': 'Enter at least two options for the ' +
                                   'learner to drag and drop',
                },
            },
            'ui_config': {
                'add_element_text': 'Add new item',
            }
        },
        'default_value': [''],
    }]

    _answer_visualization_specs = []
