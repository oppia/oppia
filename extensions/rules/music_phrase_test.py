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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for classification of MusicNotes."""

__author__ = 'Michael Wagner'

from core.tests import test_utils
from extensions.rules import music_phrase


class MusicPhraseRuleUnitTests(test_utils.GenericTestBase):
    """Tests for rules operating on MusicPhrase objects."""

    def test_equals_rule(self):
        self.assertFuzzyTrue(music_phrase.Equals([
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyTrue(music_phrase.Equals([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}]
        ))

        self.assertFuzzyFalse(music_phrase.Equals([
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyFalse(music_phrase.Equals([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}
        ]).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

    def test_is_equal_to_except_for_rule(self):
        self.assertFuzzyTrue(music_phrase.IsEqualToExceptFor([
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 1).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyTrue(music_phrase.IsEqualToExceptFor([
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 1).eval([
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyFalse(music_phrase.IsEqualToExceptFor([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 2).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
        self.assertFuzzyFalse(music_phrase.IsEqualToExceptFor([
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 1).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyFalse(music_phrase.IsEqualToExceptFor([
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 1).eval([
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyFalse(music_phrase.IsEqualToExceptFor([
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G5', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 2).eval([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

    def test_is_transposition_of_rule(self):
        self.assertFuzzyTrue(music_phrase.IsTranspositionOf([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 7).eval([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyTrue(music_phrase.IsTranspositionOf([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ], -2).eval([
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyFalse(music_phrase.IsTranspositionOf([
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 3).eval([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyFalse(music_phrase.IsTranspositionOf([
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 1).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

    def test_is_transposition_of_except_for_rule(self):
        self.assertFuzzyTrue(music_phrase.IsTranspositionOfExceptFor([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 7, 1).eval([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyTrue(music_phrase.IsTranspositionOfExceptFor([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D5', 'noteDuration': {'num': 1, 'den': 1}}
        ], -2, 1).eval([
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'D5', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyFalse(music_phrase.IsTranspositionOfExceptFor([
            {'readableNoteName': 'E4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 3, 1).eval([
            {'readableNoteName': 'G4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'A4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))

        self.assertFuzzyFalse(music_phrase.IsTranspositionOfExceptFor([
            {'readableNoteName': 'F4', 'noteDuration': {'num': 1, 'den': 1}},
            {'readableNoteName': 'B4', 'noteDuration': {'num': 1, 'den': 1}}
        ], 1, 1).eval([
            {'readableNoteName': 'C4', 'noteDuration': {'num': 1, 'den': 1}}
        ]))
