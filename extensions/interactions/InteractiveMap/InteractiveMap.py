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

"""Python configuration for InteractiveMap interaction."""

from extensions.interactions import base


class InteractiveMap(base.BaseInteraction):
    """Interaction for pinpointing a location on a map."""

    name = 'World Map'
    description = 'Allows learners to specify a position on a world map.'
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    is_trainable = False
    _dependency_ids = ['google_maps']
    answer_type = 'CoordTwoDim'
    instructions = 'Click on the map'
    narrow_instructions = 'View map'
    needs_summary = True
    # There needs to be a way to pass marker location so that an answer can be
    # conveyed meaningfully to the learner. Once this issue is fixed,
    # InteractiveMap interaction can be supported by the solution feature.
    can_have_solution = False
    show_generic_submit_button = False

    _customization_arg_specs = [{
        'name': 'latitude',
        'description': 'Starting center latitude (-90 to 90)',
        'schema': {
            'type': 'float',
            'validators': [{
                'id': 'is_at_least',
                'min_value': -90.0,
            }, {
                'id': 'is_at_most',
                'max_value': 90.0,
            }]
        },
        'default_value': 0.0,
    }, {
        'name': 'longitude',
        'description': 'Starting center longitude (-180 to 180)',
        'schema': {
            'type': 'float',
            'validators': [{
                'id': 'is_at_least',
                'min_value': -180.0,
            }, {
                'id': 'is_at_most',
                'max_value': 180.0,
            }]
        },
        'default_value': 0.0,
    }, {
        'name': 'zoom',
        'description': 'Starting zoom level (0 shows the entire earth)',
        'schema': {
            'type': 'float',
        },
        'default_value': 0.0,
    }]

    _answer_visualization_specs = [{
        # Table with answer counts for top N answers.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'Top 10 answers',
        },
        'calculation_id': 'Top10AnswerFrequencies',
        'addressed_info_is_supported': True,
    }]
