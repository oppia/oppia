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

from extensions.rich_text_components import base


class Collapsible(base.BaseRichTextComponent):
    """A rich-text component representing a collapsible block."""

    name = 'Collapsible'
    category = 'Basic Input'
    description = 'A collapsible block of HTML.'
    frontend_name = 'collapsible'
    tooltip = 'Insert collapsible block'
    is_complex = True
    is_block_element = True

    _customization_arg_specs = [{
        'name': 'heading',
        'description': 'The heading for the collapsible block',
        'schema': {
            'type': 'unicode',
        },
        'default_value': 'Sample Header',
    }, {
        'name': 'content',
        'description': 'The content of the collapsible block',
        'schema': {
            'type': 'html',
            'ui_config': {
                'hide_complex_extensions': True,
            }
        },
        'default_value': 'You have opened the collapsible block.'
    }]
