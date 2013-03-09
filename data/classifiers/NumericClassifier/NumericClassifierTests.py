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

"""Numeric classifier tests."""

__author__ = 'Sean Lip'


import NumericClassifier

assert NumericClassifier.equals(3, 3)
assert NumericClassifier.equals(3.0, 3)
assert not NumericClassifier.equals(4, 3)

assert NumericClassifier.is_less_than(3, 4)
assert NumericClassifier.is_less_than(3.0, 4)
assert NumericClassifier.is_less_than(3.0, 4.0)
assert not NumericClassifier.is_less_than(3, 3)
assert not NumericClassifier.is_less_than(3.0, 3.0)
assert not NumericClassifier.is_less_than(4.0, 3.0)
assert not NumericClassifier.is_less_than(4, 3)

assert NumericClassifier.is_greater_than(4, 3)
assert NumericClassifier.is_greater_than(4, 3.0)
assert NumericClassifier.is_greater_than(4.0, 3.0)
assert not NumericClassifier.is_greater_than(3, 3)
assert not NumericClassifier.is_greater_than(3.0, 3.0)
assert not NumericClassifier.is_greater_than(3.0, 4.0)
assert not NumericClassifier.is_greater_than(3, 4)

assert NumericClassifier.is_less_than_or_equal_to(3, 4)
assert NumericClassifier.is_less_than_or_equal_to(3, 3)
assert not NumericClassifier.is_less_than_or_equal_to(4, 3)

assert NumericClassifier.is_greater_than_or_equal_to(4, 3)
assert NumericClassifier.is_greater_than_or_equal_to(3, 3)
assert not NumericClassifier.is_greater_than_or_equal_to(3, 4)

assert NumericClassifier.is_inclusively_between(2, 1, 3)
assert NumericClassifier.is_inclusively_between(1, 1, 3)
assert NumericClassifier.is_inclusively_between(3, 1, 3)
assert NumericClassifier.is_inclusively_between(1.0, 1, 3)
assert not NumericClassifier.is_inclusively_between(3.0, 1, 2.99)

assert NumericClassifier.is_within_tolerance(3, 3, 0.5)
assert NumericClassifier.is_within_tolerance(3.5, 3, 0.5)
assert not NumericClassifier.is_within_tolerance(3.51, 3, 0.5)
