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

"""Rules for SetOfHtmlString objects."""

__author__ = 'Kevin Lee'

from extensions.rules import base


class Equals(base.SetOfHtmlStringRule):
    description = 'is equal to {{x|SetOfHtmlString}}'
    is_generic = False

    def _evaluate(self, subject):
        return set(subject) == set(self.x)


class ContainsAtLeastOneOf(base.SetOfHtmlStringRule):
    description = 'contains at least one of {{x|SetOfHtmlString}}'
    is_generic = False

    def _evaluate(self, subject):
        return any([e in self.x for e in subject])


class DoesNotContainAtLeastOneOf(base.SetOfHtmlStringRule):
    description = 'does not contain at least one of {{x|SetOfHtmlString}}'
    is_generic = False

    def _evaluate(self, subject):
        return any([e not in self.x for e in subject])
