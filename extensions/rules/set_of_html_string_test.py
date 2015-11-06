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

"""Tests for rules operating on SetOfHtmlString objects."""

__author__ = 'Kevin Lee'

from core.tests import test_utils
from extensions.rules import set_of_html_string


class SetOfHtmlStringUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on SetOfHtmlString objects."""

    def test_equals_rule(self):
        rule = set_of_html_string.Equals(['ab', 'c', 'e'])

        self.assertTrue(rule.eval(['ab', 'c', 'e']))
        self.assertTrue(rule.eval(['c', 'e', 'ab']))
        self.assertFalse(rule.eval(['c']))
        self.assertFalse(rule.eval(['e']))
        self.assertFalse(rule.eval(['10']))
        self.assertFalse(rule.eval(['a']))

    def test_contains_rule(self):
        rule = set_of_html_string.ContainsAtLeastOneOf(['a'])

        self.assertTrue(rule.eval(['a', 'b']))
        self.assertTrue(rule.eval([' ', 'a']))
        self.assertTrue(rule.eval(['a']))
        self.assertFalse(rule.eval([]))
        self.assertFalse(rule.eval(['b']))

    def test_does_not_contain_rule(self):
        rule = set_of_html_string.DoesNotContainAtLeastOneOf(['los', 'la'])

        self.assertTrue(rule.eval(['ld']))
        self.assertTrue(rule.eval(['l']))
        self.assertTrue(rule.eval(['a']))
        self.assertFalse(rule.eval(['la']))
        self.assertFalse(rule.eval(['los', 'la']))
