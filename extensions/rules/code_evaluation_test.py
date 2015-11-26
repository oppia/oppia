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


class CodeNormalizationUnitTests(test_utils.GenericTestBase):
    """Tests the normalization of code strings."""

    TEST_DATA = [{
        'before': (
            'def x():\n'
            '    y = 345'),
        'after': (
            'def x():\n'
            '    y = 345'),
    }, {
        # Indentation gets converted to 4 spaces. Trailing whitespace and empty
        # lines are removed.
        'before': (
            'def x():         \n'
            '    \n'
            '  y = 345\n'
            '            \n'
            '       '),
        'after': (
            'def x():\n'
            '    y = 345'),
    }, {
        # Full-line comments are removed, but not comments starting in the
        # middle of a line.
        'before': (
            '# This is a comment.\n'
            '  # This is a comment with some spaces before it.\n'
            'def x():         # And a comment with some code before it.\n'
            '  y = \'#String with hashes#\''),
        'after': (
            'def x():         # And a comment with some code before it.\n'
            '    y = \'#String with hashes#\''),
    }, {
        # Complex indentation is handled correctly.
        'before': (
            'abcdefg\n'
            '    hij\n'
            '              ppppp\n'
            'x\n'
            '  abc\n'
            '    bcd\n'
            '  cde\n'
            '              xxxxx\n'
            '  y\n'
            ' z'),
        'after': (
            'abcdefg\n'
            '    hij\n'
            '        ppppp\n'
            'x\n'
            '    abc\n'
            '        bcd\n'
            '    cde\n'
            '        xxxxx\n'
            '    y\n'
            'z'),
    }]

    def test_code_normalization(self):
        for test in self.TEST_DATA:
            self.assertEqual(
                code_evaluation.normalize_code(test['before']), test['after'])


class CodeEvaluationRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on CodeEvaluation objects."""

    def test_code_equals_rule(self):
        rule = code_evaluation.CodeEquals(
            'def x():\n'
            '    y = \'ab    c\'\n'
            '    return x')

        self.assertFuzzyTrue(rule.eval({
            'code': (
                'def x():\n'
                '    y = \'ab    c\'\n'
                '    return x'
            ),
            'output': 'Original code',
            'evaluation': '',
            'error': ''
        }))

        self.assertFuzzyTrue(rule.eval({
            'code': (
                'def x():\n'
                '    y = \'ab    c\'\n'
                '    \n'
                '    return x'
            ),
            'output': 'Extra newline with spaces',
            'evaluation': '',
            'error': ''
        }))

        self.assertFuzzyTrue(rule.eval({
            'code': (
                'def x():        \n'
                '    y = \'ab    c\'\n'
                '    return x'
            ),
            'output': 'Extra trailing whitespace on first line',
            'evaluation': '',
            'error': ''
        }))

        self.assertFuzzyTrue(rule.eval({
            'code': (
                'def x(): \t\n'
                '    y = \'ab    c\'\n'
                '    return x\n\n\n'
            ),
            'output': 'Extra trailing whitespace; tab character in first line',
            'evaluation': '',
            'error': ''
        }))

        self.assertFuzzyFalse(rule.eval({
            'code': (
                'def x():\n'
                '  y = \'ab    c\'\n'
                '    return x'
            ),
            'output': 'Changing spaces at start of a line',
            'evaluation': '',
            'error': ''
        }))

        self.assertFuzzyFalse(rule.eval({
            'code': (
                'def x():'
                '    y = \'ab    c\'\n'
                '    return x'
            ),
            'output': 'Missing newline in first line',
            'evaluation': '',
            'error': ''
        }))

        self.assertFuzzyFalse(rule.eval({
            'code': (
                'def x():'
                '    y = \'ab c\'\n'
                '    return x'
            ),
            'output': 'Changing spaces inside quotes',
            'evaluation': '',
            'error': ''
        }))

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

