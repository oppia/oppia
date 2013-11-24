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

"""Rules for CodeEvaluation objects."""

__author__ = 'Koji Ashida'

import re

from extensions.rules import base


class CodeEquals(base.CodeEvaluationRule):
    description = 'has code equal to {{c|NormalizedString}}'

    def _evaluate(self, subject):
        return subject['code'] == self.c


class OutputEquals(base.CodeEvaluationRule):
    description = (
    	'has output equal to {{x|NormalizedString}} (collapsing spaces)')

    def _evaluate(self, subject):
        regex = re.compile(r'\s+')
        normalized_result = regex.sub(' ', subject['output']).strip()
        normalized_expected_output = regex.sub(' ', self.x).strip()
        return normalized_result == normalized_expected_output
