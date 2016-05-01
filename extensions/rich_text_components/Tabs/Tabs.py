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


TAB_CONTENT_SCHEMA = {
    'type': 'dict',
    'properties': [{
        'name': 'title',
        'description': 'Tab title',
        'schema': {
            'type': 'unicode',
            'validators': [{
                'id': 'is_nonempty'
            }]
        }
    }, {
        'name': 'content',
        'description': 'Tab content',
        'schema': {
            'type': 'html',
            'ui_config': {
                'hide_complex_extensions': True,
            }

        }
    }]
}


class Tabs(base.BaseRichTextComponent):
    """A rich-text component representing a series of tabs."""

    name = 'Tabs'
    category = 'Basic Input'
    description = 'A series of tabs.'
    frontend_name = 'tabs'
    tooltip = 'Insert tabs (e.g. for hints)'
    is_complex = True
    is_block_element = True

    _customization_arg_specs = [{
        'name': 'tab_contents',
        'description': 'The tab titles and contents.',
        'schema': {
            'type': 'list',
            'items': TAB_CONTENT_SCHEMA,
            'ui_config': {
                'add_element_text': 'Add new tab'
            }
        },
        'default_value': [{
            'title': 'Hint introduction',
            'content': ('This set of tabs shows some hints. Click on the '
                        'other tabs to display the relevant hints.')
        }, {
            'title': 'Hint 1',
            'content': 'This is a first hint.'
        }],
    }]
