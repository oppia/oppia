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

"""Rules for CodeEvaluation objects."""

__author__ = 'Koji Ashida'

from extensions.rules import base
import re


class OutputEquals(base.CodeEvaluationRule):
    description = (
        'has output equal to {{x|UnicodeString}} (collapsing spaces)')

    def _evaluate(self, subject):
        normalized_result = ' '.join(subject['output'].split())
        normalized_expected_output = ' '.join(self.x.split())
        return self._fuzzify_truth_value(
            normalized_result == normalized_expected_output)


class ResultsInError(base.CodeEvaluationRule):
    description = 'results in an error when run'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(bool(subject['error'].strip()))


class FuzzyMatches(base.CodeEvaluationRule):
    description = 'is similar to {{training_data|ListOfCodeEvaluation}}'

    def _evaluate(self, subject):
        # TODO(bhenning): This is where a third party library could be used to
        # intelligently normalize and compare different submissions of code.

        # A very naive approach to 'normalizing' the code is to strip out all
        # comments and whitespace. This normalization currently assumes Python.
        def _normalize(python_code):
            # Remove comments.
            stripped = re.sub(r'#.*', '', python_code)
            # Remove whitespace (including newlines).
            return re.sub(r'\s+', '', stripped)

        code = _normalize(subject['code'])
        for possibility in self.training_data:
            if _normalize(possibility['code']) == code:
                return self._fuzzify_truth_value(True)
        return self._fuzzify_truth_value(False)
