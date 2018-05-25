# Copyright 2018 The Oppia Authors. All Rights Reserved.
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
"""Python configuration for NumberWithUnits interaction."""

from extensions.interactions import base


class NumberWithUnits(base.BaseInteraction):
    """Interaction for number with units."""

    name = 'Number with units input'
    description = 'Allows learners to enter number with units.'
    display_mode = base.DISPLAY_MODE_INLINE
    is_trainable = False
    _dependency_ids = []
    answer_type = 'NumberWithUnits'
    instructions = None
    narrow_instructions = None
    needs_summary = False
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = []
    _answer_visualization_specs = []
