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

from extensions.gadgets import base
import utils


class TestGadget(base.BaseGadget):
    """TestGadget is a simplified AdviceBar for testing purposes."""

    short_description = 'Test Gadget'
    description = 'Tests functionality allowing supplementary predefined tips.'
    height_px = 50
    width_px = 60
    panel = 'bottom'
    _dependency_ids = []

    _customization_arg_specs = [
        {
            # TestGadget holds 1 or more adviceObjects, which include a title
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
                        'description': 'Tip title',
                        'schema': {
                            'type': 'unicode',
                            'validators': [{
                                'id': 'is_nonempty',
                            }]
                        },
                    }, {
                        'name': 'adviceHtml',
                        'description': 'Advice content',
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

    # Maximum and minimum number of tips that the TestGadget can hold.
    _MAX_TIP_COUNT = 3
    _MIN_TIP_COUNT = 1

    def validate(self, customization_args):
        """Ensure TestGadget retains reasonable config."""
        tip_count = len(customization_args['adviceObjects']['value'])
        if tip_count > self._MAX_TIP_COUNT:
            raise utils.ValidationError(
                'TestGadget is limited to %d tips, found %d.' % (
                    self._MAX_TIP_COUNT,
                    tip_count))
        elif tip_count < self._MIN_TIP_COUNT:
            raise utils.ValidationError(
                'TestGadget requires at least %d tips, found %s.' % (
                    self._MIN_TIP_COUNT,
                    tip_count))
