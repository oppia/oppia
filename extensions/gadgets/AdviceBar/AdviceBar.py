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

    short_description = 'Advice Bar'
    description = 'Allows learners to receive advice from predefined tips.'
    height_px = 300
    width_px = 100
    # TODO(anuzis): AdviceBar doesn't fit any panels in the current Oppia
    # view. It's listed as bottom here to temporarily pass validation, but
    # is disabled in the feconf.py ALLOWED_GADGETS to prevent it from being
    # displayed. We might remove the gadget entirely, but are preserving it
    # temporarily in case it would be useful in a subsequent release with
    # expanded gadget panel functionality.
    panel = 'bottom'
    _dependency_ids = []

    _customization_arg_specs = [
        {
            # AdviceBars hold 1 or more adviceObjects, which include a title
            # and text.
            'name': 'adviceObjects',
            'description': 'Title and content for each tip.',
            'schema': {
                'type': 'list',
                'validators': [{
                    'id': 'has_length_at_least',
                    'min_value': 1,
                }, {
                    'id': 'has_length_at_most',
                    'max_value': 3,
                }],
                'items': {
                    'type': 'dict',
                    'properties': [{
                        'name': 'adviceTitle',
                        'description': 'Tip title (visible on advice bar)',
                        'schema': {
                            'type': 'unicode',
                            'validators': [{
                                'id': 'is_nonempty',
                            }]
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
            'default_value': [{
                'adviceTitle': 'Tip title',
                'adviceHtml': ''
            }]
        }
    ]

    # Maximum and minimum number of tips that an AdviceBar can hold.
    _MAX_TIP_COUNT = 3
    _MIN_TIP_COUNT = 1

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
