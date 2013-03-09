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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Set classifier rule definitions."""

__author__ = 'Sean Lip'


from data.classifiers import normalizers

# Normalizer to use for reader answers.
DEFAULT_NORMALIZER = normalizers.Set


def equals(val, x):
    """The given value should be equal to {{x}}."""
    return val == x


def is_subset_of(val, x):
    """The given value should be a proper subset of {{x}}."""
    return val < x


def is_superset_pf(val, x):
    """The given value should be a proper superset of {{x}}."""
    return val > x


def has_elements_not_in(val, x):
    """The given value should have elements not in {{x}}."""
    return bool(val - x)


def omits_elements_in(val, x):
    """The given value should omit some elements in {{x}}."""
    return bool(x - val)


def is_disjoint_from(val, x):
    """The given value should have no elements in common with {{x}}."""
    return not bool(val.intersection(x))
