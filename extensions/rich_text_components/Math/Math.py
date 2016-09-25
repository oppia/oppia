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
        'default_value': ''
    }]
