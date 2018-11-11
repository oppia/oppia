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

"""Python configuration for MathExpressionInput interaction."""

from extensions.interactions import base


class MathExpressionInput(base.BaseInteraction):
    """Interaction for math expression input."""

    name = 'Math Expression Input'
    description = 'Allows learners to enter mathematical expressions.'
    display_mode = base.DISPLAY_MODE_INLINE
    is_trainable = False
    _dependency_ids = ['guppy', 'math_expressions']
    answer_type = 'MathExpression'
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = []
