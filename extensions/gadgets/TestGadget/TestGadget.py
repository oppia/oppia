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
            'description': 'A test attribute that helps increase height.',
            'schema': {
                'type': 'int',
            },
            'default_value': 1
        }, {
            'name': 'characters',
            'description': 'A test attribute that helps increase width.',
            'schema': {
                'type': 'int',
            },
            'default_value': 2
        }
    ]

    # This TestGadget tests having a dynamic height and width based on the
    # number of 'floors' and 'characters' it has in its customization args.
    # These attributes don't represent anything beyond their role in
    # calculating the gadget's dimentions.
    _MAX_FLOORS = 3
    _PIXEL_HEIGHT_PER_FLOOR = 50
    _PIXEL_WIDTH_PER_CHARACTER = 30

    def validate(self, customization_args):
        """Ensure TestGadget validates a proper config."""
        floors = customization_args['floors']['value']
        if floors > self._MAX_FLOORS:
            raise utils.ValidationError(
                'TestGadgets are limited to %d floors, found %d.' % (
                    self._MAX_FLOORS,
                    floors))

    def get_width(self, customization_args):
        """Returns int representing width in pixels.

        Args:
        - customization_args: list of CustomizationArgSpec instances.
        """
        characters = customization_args['characters']['value']
        return characters * self._PIXEL_WIDTH_PER_CHARACTER

    def get_height(self, customization_args):
        """Returns int representing height in pixels.

        Args:
        - customization_args: list of CustomizationArgSpec instances.
        """
        floors = customization_args['floors']['value']
        return floors * self._PIXEL_HEIGHT_PER_FLOOR
