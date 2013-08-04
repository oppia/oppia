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

"""Rules for NormalizedStrings."""

__author__ = 'Sean Lip'

from extensions.rules import base


class Equals(base.NormalizedStringRule):
    description = 'is equal to {{x|NormalizedString}}'

    def _evaluate(self, subject):
        return subject.lower() == self.x.lower()


class CaseSensitiveEquals(base.NormalizedStringRule):
    description = 'is equal to {{x|NormalizedString}}, taking case into account'

    def _evaluate(self, subject):
        return subject == self.x


class StartsWith(base.NormalizedStringRule):
    description = 'starts with {{x|NormalizedString}}'

    def _evaluate(self, subject):
        return subject.lower().startswith(self.x.lower())


class Contains(base.NormalizedStringRule):
    description = 'contains {{x|NormalizedString}}'

    def _evaluate(self, subject):
        return subject.lower().find(self.x.lower()) != -1


class FuzzyEquals(base.NormalizedStringRule):
    description = 'is equal to {{x|NormalizedString}}, but misspelled by one character'

    def _evaluate(self, subject):
        oneago = None
        thisrow = range(1, len(self.x) + 1) + [0]
        for i in range(len(subject)):
            twoago, oneago, thisrow = (
                oneago, thisrow, [0] * len(self.x) + [i + 1])

            for j in range(len(self.x)):
                delcost = oneago[j] + 1
                addcost = thisrow[j - 1] + 1
                subcost = oneago[j - 1] + (subject[i] != self.x[j])
                thisrow[j] = min(delcost, addcost, subcost)

        return thisrow[len(self.x) - 1] == 1
