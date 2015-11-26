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

"""Tests for classification of CheckedProof."""

__author__ = 'Jacob Davis'

from core.tests import test_utils
from extensions.rules import checked_proof


class CheckedProofRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on CheckedProof objects."""

    correct_example = {
        'assumptions_string': 'p',
        'target_string': 'q',
        'proof_string': 'a proof',
        'correct': True
    }
    incorrect_example_parsing = {
        'assumptions_string': 'p',
        'target_string': 'q',
        'proof_string': 'a proof',
        'correct': False,
        'error_category': 'parsing',
        'error_code': 'a code',
        'error_message': 'a message',
        'error_line_number': 3
    }
    incorrect_example_typing = {
        'assumptions_string': 'p',
        'target_string': 'q',
        'proof_string': 'a proof',
        'correct': False,
        'error_category': 'typing',
        'error_code': 'a code',
        'error_message': 'a message',
        'error_line_number': 4
    }

    def test_correct_rule(self):
        rule = checked_proof.Correct()
        self.assertFuzzyTrue(rule.eval(self.correct_example))
        self.assertFuzzyFalse(rule.eval(self.incorrect_example_parsing))
        self.assertFuzzyFalse(rule.eval(self.incorrect_example_typing))

    def test_not_correct_rule(self):
        rule = checked_proof.NotCorrect()
        self.assertFuzzyFalse(rule.eval(self.correct_example))
        self.assertFuzzyTrue(rule.eval(self.incorrect_example_parsing))
        self.assertFuzzyTrue(rule.eval(self.incorrect_example_typing))

    def test_not_correct_by_category_rule(self):
        rule = checked_proof.NotCorrectByCategory('typing')
        self.assertFuzzyFalse(rule.eval(self.correct_example))
        self.assertFuzzyFalse(rule.eval(self.incorrect_example_parsing))
        self.assertFuzzyTrue(rule.eval(self.incorrect_example_typing))



