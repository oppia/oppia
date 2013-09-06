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

"""Tests for classification of CodeEvaluation."""

__author__ = 'Koji Ashida'

from extensions.rules import code_evaluation
import test_utils


class CodeEvaluationRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on CodeEvaluation objects."""

    def test_equals_rule(self):
        rule = code_evaluation.CodeEquals('hello')

        self.assertTrue(rule.eval({
            'code': 'hello',
            'output': '',
            'evaluation': '',
            'error': ''
        }))
        self.assertFalse(rule.eval({
            'code': 'goodbye',
            'output': '',
            'evaluation': '',
            'error': ''
        }))
