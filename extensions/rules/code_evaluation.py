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

import re

from extensions.rules import base


def normalize_code(code_str):
    """Normalizes a code string (which is assumed not to contain tab
    characters). In particular:

    - Strips out lines that start with '#' (comments), possibly preceded by
        whitespace.
    - Trims trailing whitespace on each line.
    - Removes blank newlines.
    - Make the indentation level four spaces.
    """
    # TODO(sll): Augment this function to strip out comments that occur at the
    # end of a line. However, be careful with lines where '#' is contained in
    # quotes or the character is escaped.
    FOUR_SPACES = '    '
    # Maps the number of spaces at the beginning of a line to an int specifying
    # the desired indentation level.
    num_spaces_to_desired_indent_level = {
        0: 0,
    }

    code_lines = code_str.rstrip().split('\n')
    normalized_code_lines = []
    for line in code_lines:
        if line.lstrip().startswith('#'):
            continue
        line = line.rstrip()
        if not line:
            continue

        num_spaces = len(line) - len(line.lstrip())

        max_num_spaces = max(num_spaces_to_desired_indent_level.keys())
        if num_spaces > max_num_spaces:
            # Add a new indentation level.
            num_spaces_to_desired_indent_level[num_spaces] = len(
                num_spaces_to_desired_indent_level.keys())

        # This is set when the indentation level of the current line does not
        # start a new scope, and also does not match any previous indentation
        # level. This case is actually invalid, but for now, we take the
        # largest indentation level that is less than this one.
        # TODO(sll): Bad indentation should result in an error nearer the
        # source.
        is_shortfall_line = (
            num_spaces not in num_spaces_to_desired_indent_level and
            num_spaces < max_num_spaces)

        # Clear all existing indentation levels to the right of this one.
        num_spaces_to_desired_indent_level = {
            k: v for k, v in num_spaces_to_desired_indent_level.iteritems()
            if k <= num_spaces
        }

        if is_shortfall_line:
            num_spaces = max(num_spaces_to_desired_indent_level.keys())

        normalized_code_lines.append('%s%s' % (
            FOUR_SPACES * num_spaces_to_desired_indent_level[num_spaces],
            line.lstrip()))

    return '\n'.join(normalized_code_lines)


class CodeEquals(base.CodeEvaluationRule):
    description = 'has code equal to {{x|CodeString}}'

    def _evaluate(self, subject):
        normalized_code = normalize_code(subject['code'])
        normalized_expected_code = normalize_code(self.x)
        return self._fuzzify_truth_value(
            normalized_code == normalized_expected_code)


class CodeContains(base.CodeEvaluationRule):
    description = 'has code that contains {{x|CodeString}}'

    def _evaluate(self, subject):
        normalized_code = normalize_code(subject['code'])
        normalized_snippet = normalize_code(self.x)
        return self._fuzzify_truth_value(
            normalized_code.find(normalized_snippet) != -1)


class CodeDoesNotContain(base.CodeEvaluationRule):
    description = 'has code that does not contain {{x|CodeString}}'

    def _evaluate(self, subject):
        normalized_code = normalize_code(subject['code'])
        normalized_snippet = normalize_code(self.x)
        return self._fuzzify_truth_value(
            normalized_code.find(normalized_snippet) == -1)


class OutputEquals(base.CodeEvaluationRule):
    description = 'has output equal to {{x|CodeString}}'

    def _evaluate(self, subject):
        normalized_output = ' '.join(subject['output'].split())
        normalized_expected_output = ' '.join(self.x.split())
        return self._fuzzify_truth_value(
            normalized_output == normalized_expected_output)


class ResultsInError(base.CodeEvaluationRule):
    description = 'results in an error when run'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(bool(subject['error'].strip()))


class ErrorContains(base.CodeEvaluationRule):
    description = (
        'has error message that contains {{x|UnicodeString}}')

    def _evaluate(self, subject):
        normalized_error = ' '.join(subject['error'].split())
        normalized_snippet = ' '.join(self.x.split())
        return self._fuzzify_truth_value(
            normalized_error.find(normalized_snippet) != -1)


class FuzzyMatches(base.CodeEvaluationRule):
    description = 'is similar to {{training_data|ListOfCodeEvaluation}}'

    def _evaluate(self, subject):
        # TODO(bhenning): This is where a third party library could be used to
        # intelligently normalize and compare different submissions of code.
        # Also, this should return a value between 0 and 1 depending on how
        # closely it matches the training data, rather than doing a crisp
        # comparison on stripped code.

        # A very naive approach to 'normalizing' the code is to strip out all
        # comments and whitespace. This normalization currently assumes Python.
        def _normalize(python_code):
            # Remove comments.
            # TODO(sll): This does not correctly handle the case where '#' is
            # within quotes, or where it is escaped.
            stripped = re.sub(r'#.*', '', python_code)
            # Remove whitespace (including newlines).
            return re.sub(r'\s+', '', stripped)

        code = _normalize(subject['code'])
        for possibility in self.training_data:
            if _normalize(possibility['code']) == code:
                return self._fuzzify_truth_value(True)
        return self._fuzzify_truth_value(False)
