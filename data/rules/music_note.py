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

"""Rules for MusicNotes."""

__author__ = 'Sean Lip'

from data.objects.models import objects
from data.rules import base

NOTE_MAP = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5']


def get_note_index(note):
    for idx, map_note in enumerate(NOTE_MAP):
        if note == map_note:
            return idx
    return None


class Equals(base.MusicNoteRule):
    description = 'is equal to {{x|MusicNote}}'
    _PARAMS = [('x', objects.MusicNote)]

    def _evaluate(self, subject):
        return subject == self.x


class IsLessThan(base.MusicNoteRule):
    description = 'is lower in pitch than {{x|MusicNote}}'
    _PARAMS = [('x', objects.MusicNote)]

    def _evaluate(self, subject):
        return get_note_index(subject) < get_note_index(self.x)


class IsGreaterThan(base.MusicNoteRule):
    description = 'is higher in pitch than {{x|MusicNote}}'
    _PARAMS = [('x', objects.MusicNote)]

    def _evaluate(self, subject):
        return get_note_index(subject) > get_note_index(self.x)


class IsLessThanOrEqualTo(base.MusicNoteRule):
    description = 'has pitch lower than or equal to {{x|MusicNote}}'
    _PARAMS = [('x', objects.MusicNote)]

    def _evaluate(self, subject):
        return get_note_index(subject) <= get_note_index(self.x)


class IsGreaterThanOrEqualTo(base.MusicNoteRule):
    description = 'has pitch higher than or equal to {{x|MusicNote}}'
    _PARAMS = [('x', objects.MusicNote)]

    def _evaluate(self, subject):
        return get_note_index(subject) >= get_note_index(self.x)


class IsInclusivelyBetween(base.MusicNoteRule):
    description = ('has a pitch between {{a|MusicNote}} and '
                   '{{b|MusicNote}}, inclusive')
    _PARAMS = [
        ('a', objects.MusicNote),
        ('b', objects.MusicNote),
    ]

    def _validate_params(self):
        assert get_note_index(self.a) <= get_note_index(self.b)

    def _evaluate(self, subject):
        return (get_note_index(self.a) <= get_note_index(subject)
                <= get_note_index(self.b))


class IsWithinTolerance(base.MusicNoteRule):
    description = 'is within {{tol|Real}} of {{x|MusicNote}}'
    _PARAMS = [
        ('tol', objects.Int),
        ('x', objects.MusicNote),
    ]

    def _evaluate(self, subject):
        lower_note = NOTE_MAP[max(get_note_index(self.x) - self.tol, 0)]
        upper_note = NOTE_MAP[
            min(get_note_index(self.x) + self.tol, len(NOTE_MAP) - 1)]
        return IsInclusivelyBetween(lower_note, upper_note)._evaluate(subject)
