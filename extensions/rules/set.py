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

"""Rules for Sets."""

__author__ = 'Sean Lip'

from extensions.rules import base


class Equals(base.SetRule):
    description = 'is equal to {{x|Set}}'

    def _evaluate(self, subject):
        return set(subject) == set(self.x)


class IsSubsetOf(base.SetRule):
    description = 'is a proper subset of {{x|Set}}'

    def _evaluate(self, subject):
        return set(subject) < set(self.x)


class IsSupersetOf(base.SetRule):
    description = 'is a proper superset of {{x|Set}}'

    def _evaluate(self, subject):
        return set(subject) > set(self.x)


class HasElementsIn(base.SetRule):
    description = 'has elements in common with {{x|Set}}'

    def _evaluate(self, subject):
        return bool(set(subject).intersection(set(self.x)))


class HasElementsNotIn(base.SetRule):
    description = 'has elements not in {{x|Set}}'

    def _evaluate(self, subject):
        return bool(set(subject) - set(self.x))


class OmitsElementsIn(base.SetRule):
    description = 'omits some elements of {{x|Set}}'

    def _evaluate(self, subject):
        return bool(set(self.x) - set(subject))


class IsDisjointFrom(base.SetRule):
    description = 'has no elements in common with {{x|Set}}'

    def _evaluate(self, subject):
        return not bool(set(subject).intersection(set(self.x)))
