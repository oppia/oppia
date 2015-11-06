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

"""Tests for classification of real numbers."""

__author__ = 'Sean Lip'

from core.tests import test_utils
from extensions.rules import real


class RealRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on Real objects."""

    def test_equals_rule(self):
        self.assertTrue(real.Equals(3).eval(3))
        self.assertTrue(real.Equals(3.0).eval(3))
        self.assertFalse(real.Equals(4).eval(3))

    def test_is_less_than_rule(self):
        self.assertTrue(real.IsLessThan(4).eval(3))
        self.assertTrue(real.IsLessThan(4).eval(3.0))
        self.assertTrue(real.IsLessThan(4.0).eval(3.0))
        self.assertFalse(real.IsLessThan(3).eval(3))
        self.assertFalse(real.IsLessThan(3.0).eval(3.0))
        self.assertFalse(real.IsLessThan(3.0).eval(4.0))
        self.assertFalse(real.IsLessThan(3).eval(4))

    def test_is_greater_than_rule(self):
        self.assertTrue(real.IsGreaterThan(3).eval(4))
        self.assertTrue(real.IsGreaterThan(3.0).eval(4))
        self.assertTrue(real.IsGreaterThan(3.0).eval(4.0))
        self.assertFalse(real.IsGreaterThan(3).eval(3))
        self.assertFalse(real.IsGreaterThan(3.0).eval(3.0))
        self.assertFalse(real.IsGreaterThan(4.0).eval(3.0))
        self.assertFalse(real.IsGreaterThan(4).eval(3))

    def test_is_less_than_or_equal_to_rule(self):
        rule = real.IsLessThanOrEqualTo(3)

        self.assertTrue(rule.eval(2))
        self.assertTrue(rule.eval(3))
        self.assertFalse(rule.eval(4))

    def test_is_greater_than_or_equal_to_rule(self):
        rule = real.IsGreaterThanOrEqualTo(3)

        self.assertTrue(rule.eval(4))
        self.assertTrue(rule.eval(3))
        self.assertFalse(rule.eval(2))

    def test_is_inclusively_between_rule(self):
        with self.assertRaises(AssertionError):
            real.IsInclusivelyBetween(2, 1)

        rule = real.IsInclusivelyBetween(1, 3)

        self.assertTrue(rule.eval(2))
        self.assertTrue(rule.eval(1))
        self.assertTrue(rule.eval(3))
        self.assertTrue(rule.eval(1.0))
        self.assertFalse(rule.eval(3.001))

    def test_is_within_tolerance_rule(self):
        rule = real.IsWithinTolerance(0.5, 0)

        self.assertTrue(rule.eval(0))
        self.assertTrue(rule.eval(0.5))
        self.assertFalse(rule.eval(0.51))
