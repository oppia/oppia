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

"""Tests for classification of Hanoi Tower move logs."""

__author__ = 'Sean Lip'

from extensions.rules import hanoi_tower_move_log
import test_utils


class HanoiTowerMoveLogRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on HanoiTowerMoveLog objects."""

    def test_has_length_equal_to_rule(self):
        self.assertTrue(
            hanoi_tower_move_log.HasLengthEqualTo(3).eval(['a', 'b', 'c']))
        self.assertFalse(
            hanoi_tower_move_log.HasLengthEqualTo(3).eval(['a', 'b']))

    def test_has_length_less_than_rule(self):
        self.assertTrue(hanoi_tower_move_log.HasLengthLessThan(4).eval([
            'a', 'b', 'c']))
        self.assertFalse(hanoi_tower_move_log.HasLengthLessThan(4).eval([
            'a', 'b', 'c', 'd']))
        self.assertFalse(hanoi_tower_move_log.HasLengthLessThan(4).eval([
            'a', 'b', 'c', 'd', 'e']))

    def test_has_length_greater_than_rule(self):
        self.assertTrue(hanoi_tower_move_log.HasLengthGreaterThan(4).eval([
            'a', 'b', 'c', 'd', 'e']))
        self.assertFalse(hanoi_tower_move_log.HasLengthGreaterThan(4).eval([
            'a', 'b', 'c', 'd']))
        self.assertFalse(hanoi_tower_move_log.HasLengthGreaterThan(4).eval([
            'a', 'b', 'c']))

    def test_has_length_inclusively_between_rule(self):
        with self.assertRaises(AssertionError):
            hanoi_tower_move_log.HasLengthInclusivelyBetween(2, 1)

        rule = hanoi_tower_move_log.HasLengthInclusivelyBetween(1, 3)

        self.assertTrue(rule.eval(['a']))
        self.assertTrue(rule.eval(['a', 'b']))
        self.assertTrue(rule.eval(['a', 'b', 'c']))
        self.assertFalse(rule.eval([]))
        self.assertFalse(rule.eval(['a', 'b', 'c', 'd']))
