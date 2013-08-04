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

"""Rules for Lists."""

__author__ = 'Sean Lip'

from extensions.rules import base


class Equals(base.ListRule):
    description = 'is equal to {{x|List}}'

    def _evaluate(self, subject):
        return subject == self.x


class DoesNotEqual(base.ListRule):
    description = 'is not equal to {{x|List}}'

    def _evaluate(self, subject):
        return subject != self.x


class HasNonemptyCommonPrefix(base.ListRule):
    description = 'has a non-empty common prefix with {{x|List}}'

    def _evaluate(self, subject):
        return len(self.x) > 0 and len(subject) > 0 and self.x[0] == subject[0]
