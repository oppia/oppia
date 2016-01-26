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

"""Rules for Reals."""

from extensions.rules import base


class Equals(base.RealRule):
    description = 'is equal to {{x|Real}}'


class IsLessThan(base.RealRule):
    description = 'is less than {{x|Real}}'


class IsGreaterThan(base.RealRule):
    description = 'is greater than {{x|Real}}'


class IsLessThanOrEqualTo(base.RealRule):
    description = 'is less than or equal to {{x|Real}}'


class IsGreaterThanOrEqualTo(base.RealRule):
    description = 'is greater than or equal to {{x|Real}}'


class IsInclusivelyBetween(base.RealRule):
    description = 'is between {{a|Real}} and {{b|Real}}, inclusive'


class IsWithinTolerance(base.RealRule):
    description = 'is within {{tol|Real}} of {{x|Real}}'
