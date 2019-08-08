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

"""Python configuration for MultipleChoiceInput interaction."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import os
import sys

from extensions.interactions import base

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order

# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class MultipleChoiceInput(base.BaseInteraction):
    """Interaction for multiple choice input."""

    name = 'Multiple Choice'
    description = (
        'Allows learners to select one of a list of multiple-choice options.')
    display_mode = base.DISPLAY_MODE_INLINE
    _dependency_ids = []
    answer_type = 'NonnegativeInt'
    instructions = None
    narrow_instructions = None
    needs_summary = False
    # Radio buttons get unselected when specifying a solution. This needs to be
    # fixed before solution feature can support this interaction.
    can_have_solution = False
    show_generic_submit_button = False

    _customization_arg_specs = [{
        'name': 'choices',
        'description': 'Multiple Choice options',
        'schema': {
            'type': 'list',
            'validators': [{
                'id': 'has_length_at_least',
                'min_value': 1,
            }],
            'items': {
                'type': 'html',
                'ui_config': {
                    'hide_complex_extensions': True,
                    'placeholder': 'Enter an option for the learner to select',
                },
            },
            'ui_config': {
                'add_element_text': 'Add multiple choice option',
            }
        },
        'default_value': [''],
    }]

    _answer_visualization_specs = [{
        # Bar chart with answer counts.
        'id': 'BarChart',
        'options': {
            'x_axis_label': 'Answer',
            'y_axis_label': 'Count',
        },
        'calculation_id': 'AnswerFrequencies',
        # Bar charts don't have any useful way to display which answers are
        # addressed yet. By setting this option to False, we consequentially
        # avoid doing extra computation.
        'addressed_info_is_supported': False,
    }]
