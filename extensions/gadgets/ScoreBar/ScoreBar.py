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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'Michael Anuzis'


from extensions.gadgets import base


class ScoreBar(base.BaseGadget):
    """Gadget for providing a ScoreBar."""

    short_description = 'Score Bar'
    description = 'A visual score bar that can represent progress or success.'
    height_px = 100
    width_px = 250
    panel = 'bottom'
    _dependency_ids = []

    _customization_arg_specs = [
    {
        'name': 'maxValue',
        'description': 'Maximum value (the bar fills up to this value)',
        'schema': {
            'type': 'int',
        },
        'default_value': 100
    }, {
        'name': 'paramName',
        'description': 'Which parameter should this score bar follow?',
        'schema': {
            'type': 'custom',
            'obj_type': 'ParameterName',
        },
        'default_value': ''
    }]
