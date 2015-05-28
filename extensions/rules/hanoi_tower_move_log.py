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

"""Rules for HanoiTowerMoveLogs."""

__author__ = 'Sean Lip'

from extensions.rules import base


class HasLengthEqualTo(base.HanoiTowerMoveLogRule):
    description = 'has length equal to {{x|Int}}'
    is_generic = False

    def _evaluate(self, subject):
        return len(subject) == self.x


class HasLengthLessThan(base.HanoiTowerMoveLogRule):
    description = 'is less than {{x|Int}}'
    is_generic = True

    def _evaluate(self, subject):
        return len(subject) < self.x


class HasLengthGreaterThan(base.HanoiTowerMoveLogRule):
    description = 'has length greater than {{x|Int}}'
    is_generic = True

    def _evaluate(self, subject):
        return len(subject) > self.x


class HasLengthInclusivelyBetween(base.HanoiTowerMoveLogRule):
    description = 'has length between {{a|Int}} and {{b|Int}}, inclusive'
    is_generic = False

    def _validate_params(self):
        assert self.a <= self.b

    def _evaluate(self, subject):
        return self.a <= len(subject) <= self.b
