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

"""Tests for classification of NonnegativeInts."""

__author__ = 'Sean Lip'

from core.tests import test_utils
from extensions.rules import nonnegative_int


class NonnegativeIntUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on NonnegativeInt objects."""

    def test_equals_rule(self):
        self.assertFuzzyTrue(nonnegative_int.Equals(3).eval(3))
        self.assertFuzzyFalse(nonnegative_int.Equals(4).eval(3))
