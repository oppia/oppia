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

"""Tests for ClickOnImage rules."""

__author__ = 'Zhan Xiong Chin'

from core.tests import test_utils
from extensions.rules import click_on_image


class ClickOnImageRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on ClickOnImage objects."""

    def test_is_in_region_rule(self):
        self.assertFuzzyTrue(click_on_image.IsInRegion('asdf').eval({
            'clickPosition': [0.5, 0.5],
            'clickedRegions': ['ghjkl', 'asdf', 'a']
        }))
        self.assertFuzzyTrue(click_on_image.IsInRegion('123').eval({
            'clickPosition': [0.3, 1.0],
            'clickedRegions': ['123']
        }))
        self.assertFuzzyFalse(click_on_image.IsInRegion('123').eval({
            'clickPosition': [1.0, 0.5],
            'clickedRegions': ['12', '3', '1234', '124']
        }))
        self.assertFuzzyFalse(click_on_image.IsInRegion('a').eval({
            'clickPosition': [0.5, 0.5],
            'clickedRegions': []
        }))
