"""coding: utf-8

 Copyright 2014 The Oppia Authors. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, softwar
 distributed under the License is distributed on an "AS-IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
"""

from extensions.interactions import base


class LabelingInput(base.BaseInteraction):
    """Interaction allowing labeling on an image."""

    name = 'Label the Picture'
    description = 'Allows learners to label pictures.'
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    _dependency_ids = ['dragdrop']
    answer_type = 'ClickOnImage'
    instructions = 'Drag in the correct labels.'
    narrow_instructions = 'Label the image'
    needs_summary = False

    _customization_arg_specs = [{
        'name': 'imageAndLabels',
        'description': 'Image',
        'schema': {
            'type': 'custom',
            'obj_type': 'ImageWithLabels',
        },
        'default_value': {
            'imagePath': '',
            'labeledRegions': []
        },
    }, {
        'name': 'imageTitle',
        'description': 'Image Title',
        'schema': {
            'type': 'unicode'
        },
        'default_value': ''
    }, {
        'name': 'bonusWords',
        'description': 
            'Extra words to be used in the word bank (separated by comma: word1, word2, word3)',
        'schema': {
            'type': 'unicode'
        },
        'default_value': ''
    }, {
        'name': 'showLines',
        'description': 
            'Show Lines on Image (Applies out of Interaction Editor)',
        'schema': {
            'type': 'bool'
        },
        'default_value': True
    }]
