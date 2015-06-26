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
import utils


class TestGadget(base.BaseGadget):
    """Base gadget for testing and validation."""

    name = 'TestGadget'
    description = 'Tests base gadget validation internals.'
    height_px = 50
    width_px = 60
    _dependency_ids = []

    _customization_arg_specs = [
        {
            'name': 'title',
            'description': 'A text title of the test gadget.',
            'schema': {
                'type': 'unicode',
            },
            'default_value': ''
        }, {
            'name': 'floors',
            'description': 'A test attribute of the gadget.',
            'schema': {
                'type': 'int',
            },
            'default_value': 1
        }
    ]

    # The TestGadget should not have more than 3 floors.
    _MAX_FLOORS = 3

    def validate(self, customization_args):
        """Ensure TestGadget validates a proper config."""
        floors = customization_args['floors']['value']
        if floors > self._MAX_FLOORS:
            raise utils.ValidationError(
                'TestGadgets are limited to %d floors, found %d.' % (
                    self._MAX_FLOORS,
                    floors))
