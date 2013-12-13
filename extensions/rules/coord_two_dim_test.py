# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Tests for classification of 2D coordinates."""

__author__ = 'Sean Lip'

from extensions.rules import coord_two_dim
import test_utils


class CoordTwoDimRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on CoordTwoDim objects."""

    def test_within_rule(self):
        self.assertFalse(coord_two_dim.Within(10, [10, 10]).eval([0, 0]))
        self.assertTrue(coord_two_dim.Within(20, [10, 10]).eval([0, 0]))
        self.assertFalse(coord_two_dim.Within(10, [5, 10]).eval([-5, 0]))
        self.assertTrue(coord_two_dim.Within(20, [5, 10]).eval([-5, 0]))

    def test_not_within_rule(self):
        self.assertTrue(coord_two_dim.NotWithin(10, [10, 10]).eval([0, 0]))
        self.assertFalse(coord_two_dim.NotWithin(20, [10, 10]).eval([0, 0]))
        self.assertTrue(coord_two_dim.NotWithin(10, [5, 10]).eval([-5, 0]))
        self.assertFalse(coord_two_dim.NotWithin(20, [5, 10]).eval([-5, 0]))
