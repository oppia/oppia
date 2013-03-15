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

"""Text classifier rule definitions."""

__author__ = 'Sean Lip'


from data.classifiers import normalizers

# Normalizer to use for reader answers.
DEFAULT_NORMALIZER = normalizers.String


def equals(val, x):
    """The given value should be equal to {{x}}, ignoring case."""
    return val.lower() == x.lower()


def case_sensitive_equals(val, x):
    """The given value should be equal to {{x}}. This is case-sensitive."""
    return val == x


def starts_with(val, x):
    """The given string should start with {{x}}."""
    return val.lower().startswith(x.lower())


def contains(val, x):
    """The given string should contain {{x}}."""
    return val.lower().find(x.lower()) != -1


def fuzzy_equals(val, x):
    """The edit distance between the given string and {{x}} is 1."""
    oneago = None
    thisrow = range(1, len(x) + 1) + [0]
    for i in range(len(val)):
        twoago, oneago, thisrow = oneago, thisrow, [0] * len(x) + [i + 1]
        for j in range(len(x)):
            delcost = oneago[j] + 1
            addcost = thisrow[j - 1] + 1
            subcost = oneago[j - 1] + (val[i] != x[j])
            thisrow[j] = min(delcost, addcost, subcost)
    return thisrow[len(x) - 1] == 1
