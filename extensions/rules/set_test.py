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

"""Tests for classification of Sets."""

__author__ = 'Sean Lip'

import extensions.rules.set as set_rules
import test_utils


class SetRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on Set objects."""

    def test_equals_rule(self):
        self.assertTrue(set_rules.Equals([1, 3]).eval([3, 1]))
        self.assertFalse(set_rules.Equals([1]).eval([3, 1]))

    # TODO(sll): Add more tests.
