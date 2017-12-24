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


class RedirectExploration(base.BaseInteraction):
    """Interaction that pauses the exploratiom and redirects to a prerequisite
    exploration.

    This interaction is like EndExploration, just that, it pauses an exploration
    instead of ending it and redirects to another exploration.
    """

    name = 'Redirect Exploration'
    description = (
        'Pauses the exploration and redirects to a previous exploration.')
    display_mode = base.DISPLAY_MODE_INLINE
    is_terminal = True
    continue_type = base.ENDS_EXPLORATION_WITH_FAILURE
    _dependency_ids = []
    instructions = None
    narrow_instructions = None
    needs_summary = False
    # Linear interactions are not supposed to have a solution.
    can_have_solution = False

    _customization_arg_specs = [{
        'name': 'redirectExplorationId',
        'description': (
            'ID of a prerequisite exploration to be completed '
            'before proceeding further in current exploration. The ID of an '
            'exploration is the string of characters appearing after '
            ' \'/explore/\' in the URL bar.'),
        'schema': {
            'type': 'unicode',
            'items': {
                'type': 'unicode',
            },
            'ui_config': {
                'add_element_text': 'Enter Exploration ID',
            }
        },
        'default_value': [],
    }]
