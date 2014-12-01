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

__author__ = 'Zhan Xiong Chin'

from core.domain import widget_domain
from extensions.value_generators.models import generators

class ImageClickInput(widget_domain.BaseWidget):
    """Interactive widget for multiple choice selection on an image"""

    # The human-readable name of the widget.
    name = 'Image'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = 'A widget where users click on regions of an image.'

    # Customization parameters and their descriptions, schemas and default
    # values.
    _customization_arg_specs = [{
        'name': 'image_and_regions',
        'description': 'The image and its regions.',
        'schema': {
            'type': 'custom',
            'obj_type': 'SegmentedImage',
        },
        'default_value': {
            'imagePath': '',
            'imageRegions': []
        },
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attirbute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'CoordTwoDim'   
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this widget. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = []
