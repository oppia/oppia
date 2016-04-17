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

from extensions.rules import base


class CodeEquals(base.CodeEvaluationRule):
    description = 'has code equal to {{x|CodeString}}'


class CodeContains(base.CodeEvaluationRule):
    description = 'has code that contains {{x|CodeString}}'


class CodeDoesNotContain(base.CodeEvaluationRule):
    description = 'has code that does not contain {{x|CodeString}}'

class OutputContains(base.CodeEvaluationRule):
    description = 'has output that contains {{x|CodeString}}'

class OutputEquals(base.CodeEvaluationRule):
    description = 'has output equal to {{x|CodeString}}'


class ResultsInError(base.CodeEvaluationRule):
    description = 'results in an error when run'


class ErrorContains(base.CodeEvaluationRule):
    description = (
        'has error message that contains {{x|UnicodeString}}')
