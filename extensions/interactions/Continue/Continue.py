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

"""Python configuration for Continue interaction."""

from __future__ import annotations

from extensions.interactions import base

from typing import List, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class Continue(base.BaseInteraction):
    """Interaction that takes the form of a simple 'Continue' button."""

    name: str = 'Continue Button'
    description: str = 'A simple \'go to next state\' button.'
    display_mode: str = base.DISPLAY_MODE_INLINE
    _dependency_ids: List[str] = []
    is_linear: bool = True
    instructions: Optional[str] = None
    narrow_instructions: Optional[str] = None
    needs_summary: bool = False
    default_outcome_heading: str = 'When the button is clicked'
    # Linear interactions are not supposed to have a solution.
    can_have_solution: bool = False
    # The Continue button is added to the progress nav, but is handled
    # separately from the generic Submit button because the text on it can
    # change depending on the customization args.
    show_generic_submit_button: bool = False

    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'buttonText',
        'description': 'Button label',
        'schema': {
            'type': 'custom',
            'obj_type': 'SubtitledUnicode',
            'validators': [{
                'id': 'has_expected_subtitled_content_length',
                'max_value': 20
            }],
        },
        'default_value': {
            'content_id': None,
            'unicode_str': 'Continue'
        },
    }]
