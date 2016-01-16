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

from extensions.rules import base


class Equals(base.MusicPhraseRule):
    description = 'is equal to {{x|MusicPhrase}}'


class IsLongerThan(base.MusicPhraseRule):
    description = 'has more than {{k|NonnegativeInt}} notes'


class HasLengthInclusivelyBetween(base.MusicPhraseRule):
    description = ('has between {{a|NonnegativeInt}} and '
                   '{{b|NonnegativeInt}} notes, inclusive')


class IsEqualToExceptFor(base.MusicPhraseRule):
    description = ('is equal to {{x|MusicPhrase}} '
                   'except for {{k|NonnegativeInt}} notes')


class IsTranspositionOf(base.MusicPhraseRule):
    description = ('is a transposition of {{x|MusicPhrase}} '
                   'by {{y|Int}} semitones')


class IsTranspositionOfExceptFor(base.MusicPhraseRule):
    description = ('is a transposition of {{x|MusicPhrase}} '
                   'by {{y|Int}} semitones '
                   'except for {{k|NonnegativeInt}} notes')
