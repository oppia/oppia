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

"""Tests for classification of Lists."""

__author__ = 'Sean Lip'

import extensions.rules.list as list_rules
import test_utils


class ListRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on List objects."""

    def test_equals_rule(self):
        rule = list_rules.Equals(['a', 3])

        self.assertTrue(rule.eval(['a', 3]))
        self.assertFalse(rule.eval([3, 'a']))
        self.assertFalse(rule.eval([3]))
        self.assertFalse(rule.eval(['a']))

    def test_does_not_equal_rule(self):
        rule = list_rules.DoesNotEqual(['a', 3])

        self.assertFalse(rule.eval(['a', 3]))
        self.assertTrue(rule.eval([3, 'a']))
        self.assertTrue(rule.eval([3]))
        self.assertTrue(rule.eval(['a']))

    def test_has_nonempty_common_prefix(self):
        self.assertTrue(list_rules.HasNonemptyCommonPrefix([3]).eval([3, 4]))
        self.assertTrue(list_rules.HasNonemptyCommonPrefix([3, 4]).eval([3, 4]))

        self.assertFalse(list_rules.HasNonemptyCommonPrefix([3]).eval([2, 4]))
        self.assertFalse(list_rules.HasNonemptyCommonPrefix([]).eval([2, 4]))
        self.assertFalse(list_rules.HasNonemptyCommonPrefix([3]).eval([]))
