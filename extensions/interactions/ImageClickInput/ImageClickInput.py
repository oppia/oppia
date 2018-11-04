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


class ImageClickInput(base.BaseInteraction):
    """Interaction allowing multiple-choice selection on an image."""

    name = 'Image Region'
    description = 'Allows learners to click on regions of an image.'
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    _dependency_ids = []
    answer_type = 'ClickOnImage'
    instructions = 'Click on the image'
    narrow_instructions = 'View image'
    needs_summary = False
    # It is required to show which region is being clicked on while specifying
    # a solution. Once this issue is fixed, ImageClickInput interaction can be
    # supported by the solution feature.
    can_have_solution = False
    show_generic_submit_button = False

    _customization_arg_specs = [{
        'name': 'imageAndRegions',
        'description': 'Image',
        'schema': {
            'type': 'custom',
            'obj_type': 'ImageWithRegions',
        },
        'default_value': {
            'imagePath': '',
            'labeledRegions': []
        },
    }, {
        'name': 'highlightRegionsOnHover',
        'description': 'Highlight regions when the learner hovers over them',
        'schema': {
            'type': 'bool',
        },
        'default_value': False
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
