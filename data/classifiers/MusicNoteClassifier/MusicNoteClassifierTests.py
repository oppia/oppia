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

"""Music note classifier tests."""

__author__ = 'Sean Lip'


import MusicNoteClassifier

assert MusicNoteClassifier.equals('A4', 'A4')
assert not MusicNoteClassifier.equals('A4', 'B4')

assert MusicNoteClassifier.is_less_than('A4', 'B4')
assert not MusicNoteClassifier.is_less_than('B4', 'A4')
assert not MusicNoteClassifier.is_less_than('F5', 'F5')

assert MusicNoteClassifier.is_greater_than('B4', 'A4')
assert not MusicNoteClassifier.is_greater_than('A4', 'B4')
assert not MusicNoteClassifier.is_greater_than('F5', 'F5')

assert MusicNoteClassifier.is_less_than_or_equal_to('A4', 'B4')
assert MusicNoteClassifier.is_less_than_or_equal_to('A4', 'A4')
assert not MusicNoteClassifier.is_less_than_or_equal_to('B4', 'A4')

assert MusicNoteClassifier.is_inclusively_between('A4', 'G4', 'B4')
assert not MusicNoteClassifier.is_inclusively_between('A4', 'B4', 'F5')

assert MusicNoteClassifier.is_within_tolerance('A4', 'D5', 3)
assert not MusicNoteClassifier.is_within_tolerance('A4', 'D4', 3)
