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

from extensions.interactions import base


class EndExploration(base.BaseInteraction):
    """Interaction that allows the exploration to end.

    This interaction is unusual in that there is no way for the learner to
    submit an answer, so the exploration effectively terminates at the state
    containing it.
    """

    name = 'End Exploration'
    description = (
        'Ends the exploration, and suggests recommendations for explorations '
        'to try next.')
    display_mode = base.DISPLAY_MODE_INLINE
    is_terminal = True
    _dependency_ids = []
    instructions = None
    narrow_instructions = None
    needs_summary = False
    # Linear interactions are not supposed to have a solution.
    can_have_solution = False
    show_generic_submit_button = False

    _customization_arg_specs = [{
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
            'ui_config': {
                'add_element_text': 'Add exploration ID',
            }
        },
        'default_value': [],
    }]
