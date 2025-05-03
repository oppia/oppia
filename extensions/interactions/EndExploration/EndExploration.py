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

"""Python configuration for EndExploration interaction."""

from __future__ import annotations

from extensions.interactions import base

from typing import List, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class EndExploration(base.BaseInteraction):
    """Interaction that allows the exploration to end.

    This interaction is unusual in that there is no way for the learner to
    submit an answer, so the exploration effectively terminates at the state
    containing it.
    """

    name: str = 'End Exploration'
    description: str = (
        'Ends the exploration, and suggests recommendations for explorations '
        'to try next.')
    display_mode: str = base.DISPLAY_MODE_INLINE
    is_terminal: bool = True
    _dependency_ids: List[str] = []
    instructions: Optional[str] = None
    narrow_instructions: Optional[str] = None
    needs_summary: bool = False
    # Linear interactions are not supposed to have a solution.
    can_have_solution: bool = False
    show_generic_submit_button: bool = False

    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'recommendedExplorationIds',
        'description': (
            'IDs of explorations to recommend to the learner (at most 3 are '
            'shown). The ID of an exploration is the string of characters '
            'appearing after \'/explore/\' in the URL bar.'),
        'schema': {
            'type': 'list',
            'items': {
                'type': 'unicode',
            },
            'validators': [{
                'id': 'has_length_at_most',
                'max_value': 3,
            }],
            'ui_config': {
                'add_element_text': 'Add exploration ID',
            }
        },
        'default_value': [],
    }]
