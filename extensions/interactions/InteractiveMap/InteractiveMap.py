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

from core.domain import widget_domain


class InteractiveMap(widget_domain.BaseWidget):
    """Interaction for pinpointing a location on a map."""

    # The human-readable name of the interaction.
    name = 'World Map'

    # The category the interaction falls under in the repository.
    category = 'Custom'

    # A description of the interaction.
    description = (
        'Allows learners to specify a position on a world map.')

    # Customization args and their descriptions, schemas and default
    # values.
    _customization_arg_specs = [{
        'name': 'latitude',
        'description': 'Starting map center latitude (-90 to 90).',
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
        'description': 'Starting map center longitude (-180 to 180).',
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
        'description': 'Starting map zoom level (0 shows the entire earth).',
        'schema': {
            'type': 'float',
        },
        'default_value': 0.0,
    }]

    # Actions that the learner can perform on this interaction which trigger a
    # feedback response, and the associated input types. Each interaction must
    # have at least one of these. This attribute name MUST be prefixed by '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'CoordTwoDim'
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this interaction. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = ['google_maps']
