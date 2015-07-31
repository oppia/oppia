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

"""Rules for MusicPhrase objects."""

__author__ = 'Michael Wagner'

from extensions.rules import base


NOTE_MAP = {'C4': 60, 'D4': 62, 'E4': 64, 'F4': 65, 'G4': 67, 'A4': 69,
            'B4': 71, 'C5': 72, 'D5': 74, 'E5': 76, 'F5': 77, 'G5': 79,
            'A5': 81}


def _get_midi_note_value(note):
    if isinstance(note, dict):
        if note['readableNoteName'] in NOTE_MAP:
            return NOTE_MAP[note['readableNoteName']]
    else:
        raise Exception('Invalid music note %s.' % note)


def _convert_sequence_to_midi(sequence):
    return [_get_midi_note_value(note) for note in sequence]


class Equals(base.MusicPhraseRule):
    description = 'is equal to {{x|MusicPhrase}}'

    def _evaluate(self, subject):
        return (_convert_sequence_to_midi(subject) ==
                _convert_sequence_to_midi(self.x))


class IsLongerThan(base.MusicPhraseRule):
    description = 'has more than {{k|NonnegativeInt}} notes'

    def _evaluate(self, subject):
        return len(_convert_sequence_to_midi(subject)) > self.k


class HasLengthInclusivelyBetween(base.MusicPhraseRule):
    description = ('has between {{a|NonnegativeInt}} and '
                   '{{b|NonnegativeInt}} notes, inclusive')

    def _evaluate(self, subject):
        return (self.a <= len(_convert_sequence_to_midi(subject)) <= self.b)


class IsEqualToExceptFor(base.MusicPhraseRule):
    description = ('is equal to {{x|MusicPhrase}} '
                   'except for {{k|NonnegativeInt}} notes')

    def _evaluate(self, subject):
        midi_target_sequence = _convert_sequence_to_midi(self.x)
        midi_user_sequence = _convert_sequence_to_midi(subject)
        if len(midi_user_sequence) != len(midi_target_sequence):
            return False
        num_correct_notes = (
            sum(1 for x in zip(
                midi_target_sequence, midi_user_sequence) if x[0] == x[1])
        )
        return len(midi_target_sequence) - num_correct_notes <= self.k


class IsTranspositionOf(base.MusicPhraseRule):
    description = ('is a transposition of {{x|MusicPhrase}} '
                   'by {{y|Int}} semitones')

    def _evaluate(self, subject):
        target_sequence_length = len(self.x)
        if len(subject) != target_sequence_length:
            return False
        midi_target_sequence = _convert_sequence_to_midi(self.x)
        midi_user_sequence = _convert_sequence_to_midi(subject)
        for i in range(target_sequence_length):
            if midi_user_sequence[i] - self.y != midi_target_sequence[i]:
                return False
        return True


class IsTranspositionOfExceptFor(base.MusicPhraseRule):
    description = ('is a transposition of {{x|MusicPhrase}} '
                   'by {{y|Int}} semitones '
                   'except for {{k|NonnegativeInt}} notes')

    def _evaluate(self, subject):
        midi_target_sequence = _convert_sequence_to_midi(self.x)
        midi_user_sequence = _convert_sequence_to_midi(subject)
        target_sequence_length = len(midi_target_sequence)
        if len(midi_user_sequence) != target_sequence_length:
            return False
        num_correct_notes = (
            sum(1 for x in zip(
                midi_target_sequence, midi_user_sequence) if x[0] == x[1] - self.y)
        )
        return len(midi_target_sequence) - num_correct_notes <= self.k
