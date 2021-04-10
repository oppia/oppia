# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Python configuration for MathEquationInput interaction."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from extensions.interactions import base


class MathEquationInput(base.BaseInteraction):
    """Interaction for math equation input."""

    name = 'Math Equation Input'
    description = 'Allows learners to enter math equations.'
    display_mode = base.DISPLAY_MODE_INLINE
    is_trainable = False
    _dependency_ids = ['guppy', 'nerdamer']
    answer_type = 'MathEquation'
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'customOskLetters',
        'description': (
            'Shortcut variables that the learner can access in the on-screen '
            'keyboard. (The order of these variables will be reflected in the '
            'learner\'s keyboard)'),
        'schema': {
            'type': 'custom',
            'obj_type': 'CustomOskLetters',
        },
        'default_value': []
    }, {
        'name': 'useFractionForDivision',
        'description': (
            'Represent division using fractions (rather than ÷).'),
        'schema': {
            'type': 'bool'
        },
        'default_value': False
    }]
