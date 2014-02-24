
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

"""Tests for classification of MusicNotes."""

__author__ = 'Michael Wagner'

from extensions.rules import music_phrase
import test_utils


class MusicPhraseRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on MusicPhrase objects."""

    def test_equals_rule(self):
        self.assertTrue(music_phrase.Equals([
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
        self.assertTrue(music_phrase.Equals([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}]
        ))
        self.assertFalse(music_phrase.Equals([
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
        self.assertFalse(music_phrase.Equals([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}}, 
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

    def test_is_equal_to_except_for_rule(self):
		self.assertTrue(music_phrase.IsEqualToExceptFor(1, [
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
		self.assertTrue(music_phrase.IsEqualToExceptFor(1, [
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
		self.assertTrue(music_phrase.IsEqualToExceptFor(2, [
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
		self.assertFalse(music_phrase.IsEqualToExceptFor(1, [
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
		self.assertFalse(music_phrase.IsEqualToExceptFor(1, [
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
		self.assertFalse(music_phrase.IsEqualToExceptFor(2, [
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G5', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

    def test_is_transposition_of_rule(self):
		self.assertTrue(music_phrase.IsTranspositionOf(7, [
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
		self.assertTrue(music_phrase.IsTranspositionOf(-2, [
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
		self.assertFalse(music_phrase.IsTranspositionOf(3, [
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
		self.assertFalse(music_phrase.IsTranspositionOf(1, [
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

    def test_is_transposition_of_except_for_rule(self):
		self.assertTrue(music_phrase.IsTranspositionOfExceptFor(7, 1, [
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
		self.assertTrue(music_phrase.IsTranspositionOfExceptFor(-2, 1, [
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D5', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D5', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
		self.assertFalse(music_phrase.IsTranspositionOfExceptFor(3, 1, [
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
		self.assertFalse(music_phrase.IsTranspositionOfExceptFor(1, 1, [
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))