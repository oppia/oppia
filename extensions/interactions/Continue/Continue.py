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

from extensions.interactions import base


class Continue(base.BaseInteraction):
    """Interaction that takes the form of a simple 'Continue' button."""

    name = 'Continue Button'
    description = 'A simple \'go to next state\' button.'
    display_mode = base.DISPLAY_MODE_INLINE
    _dependency_ids = []
    is_linear = True
    instructions = None
    narrow_instructions = None
    needs_summary = False
    default_outcome_heading = 'When the button is clicked'
    # Linear interactions are not supposed to have a solution.
    can_have_solution = False
    # The Continue button is added to the progress nav, but is handled
    # separately from the generic Submit button because the text on it can
    # change depending on the customization args.
    show_generic_submit_button = False

    _customization_arg_specs = [{
        'name': 'buttonText',
        'description': 'Button label',
        'schema': {
            'type': 'unicode',
        },
        'default_value': 'Continue',
    }]
