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

"""Tests for classification of SetOfUnicodeString objects."""

__author__ = 'Sean Lip'

from core.tests import test_utils
import extensions.rules.set_of_unicode_string as set_rules


class SetOfUnicodeStringRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on SetOfUnicodeString objects."""

    def test_equals_rule(self):
        self.assertFuzzyTrue(set_rules.Equals(['1', '3']).eval(['3', '1']))
        self.assertFuzzyFalse(set_rules.Equals(['1']).eval(['3', '1']))

    def test_is_subset_of_rule(self):
        rule = set_rules.IsSubsetOf(['a', 'b'])

        self.assertFuzzyTrue(rule.eval(['a']))
        self.assertFuzzyTrue(rule.eval(['b']))
        self.assertFuzzyTrue(rule.eval([]))
        self.assertFuzzyFalse(rule.eval(['a', 'b']))
        self.assertFuzzyFalse(rule.eval(['c']))
        self.assertFuzzyFalse(rule.eval(['a', 'b', 'c']))

    def test_is_superset_of_rule(self):
        rule = set_rules.IsSupersetOf(['a', 'b'])

        self.assertFuzzyTrue(rule.eval(['a', 'c', 'b']))
        self.assertFuzzyTrue(rule.eval(['a', 'ab', 'b']))
        self.assertFuzzyFalse(rule.eval(['a', 'c']))
        self.assertFuzzyFalse(rule.eval(['a', 'b']))
        self.assertFuzzyFalse(rule.eval(['a']))
        self.assertFuzzyFalse(rule.eval([]))

    def test_has_elements_in_rule(self):
        rule = set_rules.HasElementsIn(['a', 'b'])

        self.assertFuzzyTrue(rule.eval(['a', 'c', 'b']))
        self.assertFuzzyTrue(rule.eval(['b']))
        self.assertFuzzyFalse(rule.eval(['c']))
        self.assertFuzzyFalse(rule.eval([]))

    def test_has_elements_not_in_rule(self):
        rule = set_rules.HasElementsNotIn(['a', 'b'])

        self.assertFuzzyTrue(rule.eval(['a', 'c', 'b']))
        self.assertFuzzyTrue(rule.eval(['c']))
        self.assertFuzzyFalse(rule.eval(['a', 'b']))
        self.assertFuzzyFalse(rule.eval(['a']))
        self.assertFuzzyFalse(rule.eval([]))

    def test_omits_elements_in_rule(self):
        rule = set_rules.OmitsElementsIn(['a', 'b'])

        self.assertFuzzyTrue(rule.eval(['c', 'ab']))
        self.assertFuzzyTrue(rule.eval(['c']))
        self.assertFuzzyTrue(rule.eval([]))
        self.assertFuzzyTrue(rule.eval(['a']))

        self.assertFuzzyFalse(rule.eval(['a', 'c', 'b']))
        self.assertFuzzyFalse(rule.eval(['a', 'b']))

    def test_is_disjoint_from_rule(self):
        rule = set_rules.IsDisjointFrom(['a', 'b'])

        self.assertFuzzyTrue(rule.eval(['c', 'ab']))
        self.assertFuzzyTrue(rule.eval(['c']))
        self.assertFuzzyTrue(rule.eval([]))

        self.assertFuzzyFalse(rule.eval(['a', 'c', 'b']))
        self.assertFuzzyFalse(rule.eval(['a', 'b']))
        self.assertFuzzyFalse(rule.eval(['a']))
