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

"""Tests for classification of SetOfUnicodeString objects."""

__author__ = 'Sean Lip'

import extensions.rules.set_of_unicode_string as set_rules
import test_utils


class SetOfUnicodeStringRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on SetOfUnicodeString objects."""

    def test_equals_rule(self):
        self.assertTrue(set_rules.Equals(['1', '3']).eval(['3', '1']))
        self.assertFalse(set_rules.Equals(['1']).eval(['3', '1']))

    def test_is_subset_of_rule(self):
        rule = set_rules.IsSubsetOf(['a', 'b'])

        self.assertTrue(rule.eval(['a']))
        self.assertTrue(rule.eval(['b', 'b']))
        self.assertTrue(rule.eval([]))
        self.assertFalse(rule.eval(['a', 'b']))
        self.assertFalse(rule.eval(['c']))
        self.assertFalse(rule.eval(['a', 'b', 'c']))

    def test_is_superset_of_rule(self):
        rule = set_rules.IsSupersetOf(['a', 'b'])

        self.assertTrue(rule.eval(['a', 'c', 'b']))
        self.assertTrue(rule.eval(['a', 'ab', 'b', 'b']))
        self.assertFalse(rule.eval(['a', 'c']))
        self.assertFalse(rule.eval(['a', 'b']))
        self.assertFalse(rule.eval(['a']))
        self.assertFalse(rule.eval([]))

    def test_has_elements_in_rule(self):
        rule = set_rules.HasElementsIn(['a', 'b'])

        self.assertTrue(rule.eval(['a', 'c', 'b']))
        self.assertTrue(rule.eval(['b']))
        self.assertFalse(rule.eval(['c']))
        self.assertFalse(rule.eval([]))

    def test_has_elements_not_in_rule(self):
        rule = set_rules.HasElementsNotIn(['a', 'b'])

        self.assertTrue(rule.eval(['a', 'c', 'b']))
        self.assertTrue(rule.eval(['c']))
        self.assertFalse(rule.eval(['a', 'b']))
        self.assertFalse(rule.eval(['a']))
        self.assertFalse(rule.eval([]))

    def test_omits_elements_in_rule(self):
        rule = set_rules.OmitsElementsIn(['a', 'b'])

        self.assertTrue(rule.eval(['c', 'ab']))
        self.assertTrue(rule.eval(['c']))
        self.assertTrue(rule.eval([]))
        self.assertTrue(rule.eval(['a']))

        self.assertFalse(rule.eval(['a', 'c', 'b']))
        self.assertFalse(rule.eval(['a', 'b']))

    def is_disjoint_from_rule(self):
        rule = set_rules.IsDisjointFrom(['a', 'b'])

        self.assertTrue(rule.eval(['c', 'ab']))
        self.assertTrue(rule.eval(['c']))
        self.assertTrue(rule.eval([]))

        self.assertFalse(rule.eval(['a', 'c', 'b']))
        self.assertFalse(rule.eval(['a', 'b']))
        self.assertFalse(rule.eval(['a']))

