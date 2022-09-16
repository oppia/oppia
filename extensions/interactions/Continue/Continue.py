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
from proto_files import state_pb2


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
            'type': 'custom',
            'obj_type': 'SubtitledUnicode'
        },
        'default_value': {
            'content_id': None,
            'unicode_str': 'Continue'
        },
    }]

    @classmethod
    def to_android_continue_proto(cls, default_outcome, customization_args):
        """Creates a ContinueInstanceDto proto object.
        Args:
            default_outcome: Outcome. The domain object.
            customization_args: CustomizationArgs. The domain object.
        Returns:
            ContinueInstanceDto. The proto object.
        """
        outcome_proto = default_outcome.to_android_outcome_proto()
        customization_args_proto = (
            cls._convert_customization_args_to_proto(customization_args)
        )

        return state_pb2.ContinueInstanceDto(
            customization_args = customization_args_proto,
            default_outcome = outcome_proto
        )

    @classmethod
    def _convert_customization_args_to_proto(cls, customization_args):
        """Creates a CustomizationArgsDto proto object
        for ContinueInstanceDto.
        Args:
            customization_args: dict. The customization dict. The keys are
                names of customization_args and the values are dicts with a
                single key, 'value', whose corresponding value is the value of
                the customization arg.
        Returns:
            CustomizationArgsDto. The proto object.
        """
        content = customization_args['buttonText'].value

        return state_pb2.ContinueInstanceDto.CustomizationArgsDto(
            button_text=content.to_android_content_proto()
        )
