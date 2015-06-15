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


class ItemSelectionInput(base.BaseInteraction):
    """Interaction for item selection input."""

    name = 'Item Selection'
    description = (
        'Allows learners to select various options.')
    display_mode = base.DISPLAY_MODE_INLINE
    _dependency_ids = []
    _handlers = [{
        'name': 'submit', 'obj_type': 'SetOfHtmlString'
    }]

    _customization_arg_specs = [{
        'name': 'items',
        'description': 'Items for selection',
        'schema': {
            'type': 'list',
            'items': {
                'type': 'html',
                'ui_config': {
                    'hide_complex_extensions': True,
                },
            },
            'ui_config': {
                'add_element_text': 'Add item for selection',
            }
        },
        'default_value': ['Sample item selection answer'],
    }]
