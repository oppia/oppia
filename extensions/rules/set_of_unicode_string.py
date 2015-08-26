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

"""Rules for SetOfUnicodeString objects."""

__author__ = 'Sean Lip'

from extensions.rules import base


class Equals(base.SetOfUnicodeStringRule):
    description = 'is equal to {{x|SetOfUnicodeString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(set(subject) == set(self.x))


class IsSubsetOf(base.SetOfUnicodeStringRule):
    description = 'is a proper subset of {{x|SetOfUnicodeString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(set(subject) < set(self.x))


class IsSupersetOf(base.SetOfUnicodeStringRule):
    description = 'is a proper superset of {{x|SetOfUnicodeString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(set(subject) > set(self.x))


class HasElementsIn(base.SetOfUnicodeStringRule):
    description = 'has elements in common with {{x|SetOfUnicodeString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(set(subject).intersection(set(self.x)))


class HasElementsNotIn(base.SetOfUnicodeStringRule):
    description = 'has elements not in {{x|SetOfUnicodeString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(set(subject) - set(self.x))


class OmitsElementsIn(base.SetOfUnicodeStringRule):
    description = 'omits some elements of {{x|SetOfUnicodeString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(set(self.x) - set(subject))


class IsDisjointFrom(base.SetOfUnicodeStringRule):
    description = 'has no elements in common with {{x|SetOfUnicodeString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(
            not bool(set(subject).intersection(set(self.x))))
