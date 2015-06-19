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
        }, {
            # AdviceBars hold 1 or more adviceObjects, which include a title
            # and text.
            'name': 'adviceObjects',
            'description': 'Title and content for each tip.',
            'schema': {
                'type': 'list',
                'items': {
                    'type': 'dict',
                    'properties': [{
                        'name': 'adviceTitle',
                        'description': 'Tip title (visible on advice bar)',
                        'schema': {
                            'type': 'unicode',
                        },
                    }, {
                        'name': 'adviceHtml',
                        'description': 'Advice content (visible upon click)',
                        'schema': {
                            'type': 'html',
                        },
                    }]
                }
            },
            'default_value': []
        }
    ]

    # Maximum and minimum number of tips that an AdviceBar can hold.
    _MAX_TIP_COUNT = 3
    _MIN_TIP_COUNT = 1

    # Constants for calculation of height and width.
    _FIXED_AXIS_BASE_LENGTH = 100
    _STACKABLE_AXIS_BASE_LENGTH = 150
    _LENGTH_PER_ADVICE_RESOURCE = 100

    def validate(self, customization_args):
        """Ensure AdviceBar retains reasonable config."""
        tip_count = len(customization_args['adviceObjects']['value'])
        if tip_count > self._MAX_TIP_COUNT:
            raise utils.ValidationError(
                'AdviceBars are limited to %d tips, found %d.' % (
                    self._MAX_TIP_COUNT,
                    tip_count))
        elif tip_count < self._MIN_TIP_COUNT:
            raise utils.ValidationError(
                'AdviceBar requires at least %d tips, found %s.' % (
                    self._MIN_TIP_COUNT,
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
        return self._FIXED_AXIS_BASE_LENGTH

    def get_height(self, customization_args):
        """Returns int representing height in pixels.

        Args:
        - customization_args: list of CustomizationArgSpec instances.
        """
        return self._STACKABLE_AXIS_BASE_LENGTH + (
            self._LENGTH_PER_ADVICE_RESOURCE * len(
                customization_args['adviceObjects']['value']))
