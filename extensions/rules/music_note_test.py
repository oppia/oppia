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

"""Tests for classification of MusicNotes."""

__author__ = 'Sean Lip'

from extensions.rules import music_note
import test_utils


class MusicNoteRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on MusicNote objects."""

    def test_equals_rule(self):
        self.assertTrue(music_note.Equals('A4').eval('A4'))
        self.assertFalse(music_note.Equals('A4').eval('B4'))

    def test_is_less_than_rule(self):
        self.assertTrue(music_note.IsLessThan('B4').eval('A4'))
        self.assertFalse(music_note.IsLessThan('A4').eval('B4'))
        self.assertFalse(music_note.IsLessThan('F5').eval('F5'))

    def test_is_greater_than_rule(self):
        self.assertTrue(music_note.IsGreaterThan('A4').eval('B4'))
        self.assertFalse(music_note.IsGreaterThan('B4').eval('A4'))
        self.assertFalse(music_note.IsGreaterThan('F5').eval('F5'))

    def test_is_less_than_or_equal_to_rule(self):
        rule = music_note.IsLessThanOrEqualTo('A4')

        self.assertTrue(rule.eval('G4'))
        self.assertTrue(rule.eval('A4'))
        self.assertFalse(rule.eval('B4'))

    def test_is_greater_than_or_equal_to_rule(self):
        rule = music_note.IsGreaterThanOrEqualTo('A4')

        self.assertTrue(rule.eval('B4'))
        self.assertTrue(rule.eval('A4'))
        self.assertFalse(rule.eval('G4'))

    def test_is_inclusively_between_rule(self):
        with self.assertRaises(AssertionError):
            music_note.IsInclusivelyBetween('B4', 'G4')

        rule = music_note.IsInclusivelyBetween('B4', 'F5')

        self.assertTrue(rule.eval('D5'))
        self.assertTrue(rule.eval('B4'))
        self.assertFalse(rule.eval('A4'))

    def test_is_within_tolerance_rule(self):
        self.assertTrue(music_note.IsWithinTolerance(3, 'D5').eval('A4'))
        self.assertFalse(music_note.IsWithinTolerance(3, 'D4').eval('A4'))
