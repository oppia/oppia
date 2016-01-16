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

"""Rules for NormalizedStrings."""

from core.domain import rule_domain
from extensions.rules import base


class Equals(base.NormalizedStringRule):
    description = 'is equal to {{x|NormalizedString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(subject.lower() == self.x.lower())


class CaseSensitiveEquals(base.NormalizedStringRule):
    description = (
        'is equal to {{x|NormalizedString}}, taking case into account')

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(subject == self.x)


class StartsWith(base.NormalizedStringRule):
    description = 'starts with {{x|NormalizedString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(
            subject.lower().startswith(self.x.lower()))


class Contains(base.NormalizedStringRule):
    description = 'contains {{x|NormalizedString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(
            subject.lower().find(self.x.lower()) != -1)


class FuzzyEquals(base.NormalizedStringRule):
    description = (
        'is equal to {{x|NormalizedString}}, misspelled by at most '
        'one character')

    def _evaluate(self, subject):
        if subject.lower() == self.x.lower():
            return rule_domain.CERTAIN_TRUE_VALUE

        oneago = None
        thisrow = range(1, len(self.x) + 1) + [0]
        for ind, letter in enumerate(subject):
            oneago, thisrow = (thisrow, [0] * len(self.x) + [ind + 1])

            for j in range(len(self.x)):  # pylint: disable=invalid-name
                delcost = oneago[j] + 1
                addcost = thisrow[j - 1] + 1
                subcost = oneago[j - 1] + (letter != self.x[j])
                thisrow[j] = min(delcost, addcost, subcost)

        return self._fuzzify_truth_value(thisrow[len(self.x) - 1] == 1)


class FuzzyMatches(base.NormalizedStringRule):
    description = 'is similar to {{training_data|SetOfNormalizedString}}'

    def _evaluate(self, subject):
        lowercase_subject = subject.lower()
        for possibility in self.training_data:
            if possibility.lower() == lowercase_subject:
                return self._fuzzify_truth_value(True)
        return self._fuzzify_truth_value(False)
