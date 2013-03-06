# coding: utf-8
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

"""Music note classifier rule definitions."""

__author__ = 'Sean Lip'


from data.classifiers import normalizers

# Normalizer to use for reader answers.
DEFAULT_NORMALIZER = normalizers.MusicNote

NOTE_MAP = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5']


def get_note_index(note):
    for idx, map_note in enumerate(NOTE_MAP):
        if note == map_note:
            return idx
    return None


def equals(val, x):
    """The given value should be equal to {{x}}."""
    return val == x


def is_less_than(val, x):
    """The given value should be lower in pitch than {{x}}."""
    return get_note_index(val) < get_note_index(x)


def is_greater_than(val, x):
    """The given value should be greater in pitch than {{x}}."""
    return get_note_index(val) > get_note_index(x)


def is_less_than_or_equal_to(val, x):
    """The given value should have pitch less than or equal to {{x}}."""
    return get_note_index(val) <= get_note_index(x)


def is_inclusively_between(val, a, b):
    """The given value should be between {{a}} and {{b}}, inclusive."""
    return (get_note_index(val) >= get_note_index(a) and
            get_note_index(val) <= get_note_index(b))


def is_within_tolerance(val, x, tol):
    """The given value should be within {{tol}} of {{x}}, inclusive."""
    lower_note = NOTE_MAP[max(get_note_index(x) - tol, 0)]
    upper_note = NOTE_MAP[min(get_note_index(x) + tol, len(NOTE_MAP) - 1)]
    return is_inclusively_between(val, lower_note, upper_note)
