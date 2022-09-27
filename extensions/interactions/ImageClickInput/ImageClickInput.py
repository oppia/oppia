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

"""Python configuration for ImageClickInput interaction."""

from __future__ import annotations

from extensions.interactions import base

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class ImageClickInput(base.BaseInteraction):
    """Interaction allowing multiple-choice selection on an image."""

    name: str = 'Image Region'
    description: str = 'Allows learners to click on regions of an image.'
    display_mode: str = base.DISPLAY_MODE_SUPPLEMENTAL
    _dependency_ids: List[str] = []
    answer_type: str = 'ClickOnImage'
    instructions: str = 'I18N_INTERACTIONS_IMAGE_CLICK_INSTRUCTION'
    narrow_instructions: str = 'View image'
    needs_summary: bool = False
    # It is required to show which region is being clicked on while specifying
    # a solution. Once this issue is fixed, ImageClickInput interaction can be
    # supported by the solution feature.
    can_have_solution: bool = False
    show_generic_submit_button: bool = False

    _labeled_regions_list: List[domain.LabeledRegionDict] = []

    _image_and_regions_default_value: domain.ImageAndRegionDict = {
        'imagePath': '',
        'labeledRegions': _labeled_regions_list
    }

    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'imageAndRegions',
        'description': 'Image',
        'schema': {
            'type': 'custom',
            'obj_type': 'ImageWithRegions',
        },
        'default_value': _image_and_regions_default_value,
    }, {
        'name': 'highlightRegionsOnHover',
        'description': 'Highlight regions when the learner hovers over them',
        'schema': {
            'type': 'bool',
        },
        'default_value': False
    }]

    _answer_visualization_specs: List[base.AnswerVisualizationSpecsDict] = [{
        # Bar chart with answer counts.
        'id': 'ClickHexbins',
        'options': {},
        'calculation_id': 'AnswerFrequencies',
        # Adding addressed info for hexbins needs more design work, but
        # conceptually should be possible by highlighting which hexagons are
        # explicitly addressed.
        'addressed_info_is_supported': False,
    }]
