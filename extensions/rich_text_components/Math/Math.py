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


class Math(base.BaseRichTextComponent):
    """A rich-text component representing a LaTeX math formula."""

    name = 'Math'
    category = 'Basic Input'
    description = 'A math formula.'
    frontend_name = 'math'
    tooltip = 'Insert mathematical formula'

    _customization_arg_specs = [{
        'name': 'raw_latex',
        'description': 'The raw string to be displayed as LaTeX.',
        'schema': {
            'type': 'custom',
            'obj_type': 'MathLatexString',
        },
        'default_value': '\\frac{x}{y}'
    }]

    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1%2BjfqA'
        'AAAAmJLR0QAAKqNIzIAAAAJcEhZcwAA%0AB2EAAAdhAZXDuLYAAAC8SURBVCjPxdG/SoJ'
        'hAIXx3/t9Gd%2BfSKVosYbACIJwa%2BkGhAa7hu6vyc0p%0AcG0RmhoiLKihIi0rjd4aC'
        'oK6AJ/xcODhcJg/wapgpOLDEpgZI1P3qBBSh7bdOFCxomNm3ZUodyTa%0AFBLPJkq5Rae'
        'iS1VtLbu62oYGiU9Vdec2fgRThaEntx7skCgseJPqy%2BRyUcO%2Bay3Htuyllt3h3oWa'
        '%0AdyNrJk401ZwZK8O/VR2lgaael%2B/gbyETBNHrvB/45QtenC6SdQpRRwAAACV0RVh0'
        'ZGF0ZTpjcmVh%0AdGUAMjAxMi0xMC0wNlQxODo0ODozOCswMjowMBG0RI8AAAAldEVYdG'
        'RhdGU6bW9kaWZ5ADIwMTAt%0AMTEtMTRUMDU6NTg6MDErMDE6MDCLUujdAAAAMnRFWHRM'
        'aWNlbnNlAGh0dHA6Ly9lbi53aWtpcGVk%0AaWEub3JnL3dpa2kvUHVibGljX2RvbWFpbj'
        '/96s8AAAAZdEVYdFNvZnR3YXJlAHd3dy5pbmtzY2Fw%0AZS5vcmeb7jwaAAAAGHRFWHRT'
        'b3VyY2UAV2lraW1lZGlhIENvbW1vbnPSwlOaAAAANnRFWHRTb3Vy%0AY2VfVVJMAGh0dH'
        'A6Ly9jb21tb25zLndpa2ltZWRpYS5vcmcvd2lraS9NYWluX1BhZ2US/BctAAAA%0AAElF'
        'TkSuQmCC%0A'
    )
