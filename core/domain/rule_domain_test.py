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

"""Tests for rule objects."""

__author__ = 'Sean Lip'

from core.domain import rule_domain
from extensions.objects.models import objects
import test_utils


class FakeRule(rule_domain.Rule):
    subject_type = objects.Number
    description = 'is between {{x|Number}} and {{y|UnicodeString}}'

    def _evaluate(self, subject):
        return subject == self.x


class RuleServicesUnitTests(test_utils.GenericTestBase):
    """Tests for rule services."""

    def test_get_rules_for_input_type(self):
        self.assertEqual(
            len(rule_domain.get_rules_for_input_type(objects.NonnegativeInt)),
            1
        )
        self.assertEqual(
            len(rule_domain.get_rules_for_input_type(objects.Real)), 7)


class RuleDomainUnitTests(test_utils.GenericTestBase):
    """Tests for rules."""

    def test_rule_initialization(self):
        with self.assertRaises(ValueError):
            FakeRule()
        with self.assertRaises(ValueError):
            FakeRule(1, 'too_many_args', 3)
        with self.assertRaises(TypeError):
            FakeRule('not_a_number', 'a')
        with self.assertRaises(TypeError):
            FakeRule('wrong_order', 1)

        fake_rule = FakeRule(2, 'a')
        self.assertTrue(fake_rule.x, 2)
        self.assertTrue(fake_rule.y, 'a')
        self.assertEqual(
            fake_rule._PARAMS,
            [('x', objects.Number), ('y', objects.UnicodeString)]
        )

    def test_rule_composition(self):
        fake_rule_1 = FakeRule(2, 'unused')
        and_rule = rule_domain.AndRule(fake_rule_1, fake_rule_1)

        self.assertTrue(and_rule.eval(2))
        self.assertFalse(and_rule.eval(3))
        self.assertEqual(
            and_rule.description,
            'is between {{x|Number}} and {{y|UnicodeString}} and '
            'is between {{x|Number}} and {{y|UnicodeString}}'
        )

        fake_rule_2 = FakeRule(3, 'unused')
        or_rule = rule_domain.OrRule(fake_rule_1, fake_rule_2)

        self.assertTrue(or_rule.eval(2))
        self.assertTrue(or_rule.eval(3))
        self.assertFalse(or_rule.eval(4))
        self.assertEqual(
            or_rule.description,
            'is between {{x|Number}} and {{y|UnicodeString}} or '
            'is between {{x|Number}} and {{y|UnicodeString}}'
        )

        not_rule = rule_domain.NotRule(fake_rule_1)

        self.assertTrue(not_rule.eval(3))
        self.assertFalse(not_rule.eval(2))
        self.assertEqual(
            not_rule.description,
            'is not between {{x|Number}} and {{y|UnicodeString}}'
        )
