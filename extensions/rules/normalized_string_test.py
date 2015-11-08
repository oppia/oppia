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

"""Tests for classification of NormalizedStrings."""

__author__ = 'Sean Lip'

from core.tests import test_utils
from extensions.rules import normalized_string


class NormalizedStringRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on NormalizedString objects."""

    def test_equals_rule(self):
        rule = normalized_string.Equals('hello')

        self.assertFuzzyTrue(rule.eval('hello'))
        self.assertFuzzyTrue(rule.eval('Hello'))
        self.assertFuzzyFalse(rule.eval('goodbye'))

    def test_case_sensitive_equals_rule(self):
        rule = normalized_string.CaseSensitiveEquals('hello')

        self.assertFuzzyTrue(rule.eval('hello'))
        self.assertFuzzyFalse(rule.eval('Hello'))
        self.assertFuzzyFalse(rule.eval('goodbye'))

    def test_starts_with_rule(self):
        self.assertFuzzyTrue(normalized_string.StartsWith('he').eval('hello'))
        self.assertFuzzyTrue(normalized_string.StartsWith('HE').eval('hello'))
        self.assertFuzzyFalse(normalized_string.StartsWith('hello').eval('he'))

    def test_contains_rule(self):
        self.assertFuzzyTrue(normalized_string.Contains('he').eval('hello'))
        self.assertFuzzyTrue(normalized_string.Contains('HE').eval('hello'))
        self.assertFuzzyTrue(normalized_string.Contains('ll').eval('hello'))
        self.assertFuzzyFalse(normalized_string.Contains('ol').eval('hello'))

    def test_fuzzy_equals_rule(self):
        self.assertFuzzyTrue(
            normalized_string.FuzzyEquals('hello').eval('hello'))
        self.assertFuzzyTrue(
            normalized_string.FuzzyEquals('HEllp').eval('hellp'))
        self.assertFuzzyTrue(
            normalized_string.FuzzyEquals('hello').eval('hell'))
        self.assertFuzzyTrue(
            normalized_string.FuzzyEquals('hell').eval('hello'))
        self.assertFuzzyTrue(
            normalized_string.FuzzyEquals('hellp').eval('hello'))
        self.assertFuzzyTrue(
            normalized_string.FuzzyEquals('hello').eval('hellp'))
        self.assertFuzzyTrue(
            normalized_string.FuzzyEquals('hello').eval('helo'))
        self.assertFuzzyTrue(
            normalized_string.FuzzyEquals('hello').eval('helllo'))

        self.assertFuzzyFalse(
            normalized_string.FuzzyEquals('pleh').eval('help'))
        self.assertFuzzyFalse(normalized_string.FuzzyEquals('hello').eval(
            'hellllo'))
        self.assertFuzzyFalse(
            normalized_string.FuzzyEquals('hello').eval('help'))
