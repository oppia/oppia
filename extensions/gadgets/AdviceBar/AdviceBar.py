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

# AdviceBars hold 1 or more Advice Resources, which include a title and text.
ADVICE_RESOURCE_SCHEMA = [
    {
        'name': 'Advice Title',
        'description': 'Link title displayed in the advice bar.',
        'schema': {
            'type': 'unicode',
        },
        'default_value': '',
    }, {
        'name': 'Advice Text',
        'description': 'Advice shown to learners on click.',
        'schema': {
            'type': 'unicode',
        },
        'default_value': '',
    }
]

class AdviceBar(base.BaseGadget):
    """Base gadget for providing an AdviceBar."""

    name = 'AdviceBar'
    description = 'Allows learners to receive advice from predefined tips.'
    _dependency_ids = []

    _customization_arg_specs = [
        {
            'name': 'title',
            'description': 'Optional title for the advice bar (e.g. "Tips")',
            'schema': {
                'type': 'unicode',
            },
            'default_value': ''
        }
    ]

    # Maximum number of tip resources that an AdviceBar can hold.
    _MAX_TIP_COUNT = 3

    # TODO(anuzis): position image for delivery.
    _ADVICE_ICON_FILENAME = 'AdviceBarTipIcon.png'

    # Constants for calculation of height and width.
    _FIXED_AXIS_BASE_LENGTH = 100
    _STACKABLE_AXIS_BASE_LENGTH = 150
    _LENGTH_PER_ADVICE_RESOURCE = 100

    # customization_args values that determine whether this AdviceBar should
    # be extended along a horizontal or vertical axis.
    _HORIZONTAL_AXIS = 'horizontal'
    _VERTICAL_AXIS = 'vertical'

    def validate(self, customization_args):
        """Ensure AdviceBar retains reasonable config."""
        tip_count = len(customization_args['advice_objects']['value'])
        if tip_count > self._MAX_TIP_COUNT:
            raise utils.ValidationError(
                'AdviceBars are limited to %d tips, found %d.' % (
                    self._MAX_TIP_COUNT,
                    tip_count))

    def _stackable_length_for_instance(self, advice_bar_instance):
        """Returns int representing the stackable axis length."""
        return self._STACKABLE_AXIS_BASE_LENGTH + (
            self._LENGTH_PER_ADVICE_RESOURCE * len(
                advice_bar_instance.resource_count))

    def get_width(self, customization_args):
        """Returns int representing width in pixels.

        Args:
        - customization_args: list of CustomizationArgSpec instances.
        """
        orientation = customization_args['orientation']['value']
        if orientation == self._HORIZONTAL_AXIS:
            return self._STACKABLE_AXIS_BASE_LENGTH + (
                self._LENGTH_PER_ADVICE_RESOURCE * len(
                    customization_args['advice_objects']['value']))
        elif orientation == self._VERTICAL_AXIS:
            return self._FIXED_AXIS_BASE_LENGTH
        else:
            raise Exception('Unknown gadget orientation: %s' % orientation)

    def get_height(self, customization_args):
        """Returns int representing height in pixels.

        Args:
        - customization_args: list of CustomizationArgSpec instances."""
        orientation = customization_args['orientation']['value']
        if orientation == self._VERTICAL_AXIS:
            return self._STACKABLE_AXIS_BASE_LENGTH + (
                self._LENGTH_PER_ADVICE_RESOURCE * len(
                    customization_args['advice_objects']['value']))
        elif orientation == self._HORIZONTAL_AXIS:
            return self._FIXED_AXIS_BASE_LENGTH
        else:
            raise Exception('Unknown gadget orientation: %s' % orientation)
