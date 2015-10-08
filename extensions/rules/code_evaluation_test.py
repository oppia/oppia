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

"""Tests for classification of CodeEvaluation."""

__author__ = 'Koji Ashida'

from core.tests import test_utils
from extensions.rules import code_evaluation


class CodeEvaluationRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on CodeEvaluation objects."""

    def test_output_equals_rule(self):
        rule = code_evaluation.OutputEquals('1')

        self.assertFuzzyTrue(rule.eval({
            'code': 'hello',
            'output': '1',
            'evaluation': '',
            'error': ''
        }))
        self.assertFuzzyTrue(rule.eval({
            'code': 'hello',
            'output': '\n1\n     ',
            'evaluation': '',
            'error': ''
        }))
        self.assertFuzzyFalse(rule.eval({
            'code': 'hello',
            'output': '',
            'evaluation': '',
            'error': ''
        }))
        self.assertFuzzyFalse(rule.eval({
            'code': 'hello',
            'output': 'bad output',
            'evaluation': '',
            'error': ''
        }))

    def test_fuzzy_matches_rule(self):
        rule = code_evaluation.FuzzyMatches([{
            'code': 'def func():\n    return 1\nprint func()',
            'output': '1',
            'evaluation': '',
            'error': ''
        }])

        # The same code should match.
        self.assertFuzzyTrue(rule.eval({
            'code': 'def func():\n    return 1\nprint func()',
            'output': '1',
            'evaluation': '',
            'error': ''
        }))

        # Extra whitespacing should not matter for the fuzzy match.
        self.assertFuzzyTrue(rule.eval({
            'code': '\ndef func():\n  return 1\n\n\nprint func()\n',
            'output': '1',
            'evaluation': '',
            'error': ''
        }))

        # Comments should make no difference for the comparison.
        self.assertFuzzyTrue(rule.eval({
            'code': (
                '# A func that returns 1.\ndef func():\n    return 1\n\n# Now '
                'print it.\nprint func()'),
            'output': '1',
            'evaluation': '',
            'error': ''
        }))

        # Renaming the identifiers should fail due to the current fuzzy rule
        # not doing very intelligent normalization.
        self.assertFuzzyFalse(rule.eval({
            'code': 'def ret_one():\n    return 1\nprint ret_one()',
            'output': '1',
            'evaluation': '',
            'error': ''
        }))

        # Different code should not match.
        self.assertFuzzyFalse(rule.eval({
            'code': 'print (1+2)',
            'output': '1',
            'evaluation': '',
            'error': ''
        }))
