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


class Link(base.BaseRichTextComponent):
    """A rich-text component for displaying links."""

    name = 'Link'
    category = 'Basic Input'
    description = 'A link to a URL.'
    frontend_name = 'link'
    tooltip = 'Insert link'

    _customization_arg_specs = [{
        'name': 'url',
        'description': (
            'The URL for this link. It must start with http:// or https://'),
        'schema': {
            'type': 'custom',
            'obj_type': 'SanitizedUrl',
        },
        'default_value': 'https://www.example.com',
    }, {
        'name': 'open_link_in_same_window',
        'description': 'Open the linked page in the same window?',
        'schema': {
            'type': 'bool'
        },
        'default_value': False,
    }]

    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1%2BjfqA'
        'AAABGdBTUEAAK/INwWK6QAAABl0RVh0%0AU29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXH'
        'JZTwAAADpSURBVCjPY/jPgB8y0EmBHXdWaeu7ef9r%0AHuaY50jU3J33v/VdVqkdN1SBE'
        'ZtP18T/L/7f/X/wf%2BO96kM3f9z9f%2BT/xP8%2BXUZsYAWGfsUfrr6L%0A2Ob9J/X/p'
        'P%2BV/1P/e/%2BJ2LbiYfEHQz%2BICV1N3yen%2B3PZf977/9z/Q//X/rf/7M81Ob3pu1'
        'EXWIFu%0AZvr7aSVBOx1/uf0PBEK3/46/gnZOK0l/r5sJVqCp6Xu99/2qt%2Bv%2BT/9f'
        '%2BL8CSK77v%2Bpt73vf65qa%0AYAVqzPYGXvdTvmR/z/4ZHhfunP0p%2B3vKF6/79gZq'
        'zPQLSYoUAABKPQ%2BkpVV/igAAAABJRU5ErkJg%0Agg%3D%3D%0A'
    )
