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

"""Rules for UnicodeString."""

__author__ = 'Tarashish Mishra'

import base64

from extensions.rules import base


class Equals(base.UnicodeStringRule):
    description = 'is equal to {{x|UnicodeString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(subject.lower() == self.x.lower())


class CaseSensitiveEquals(base.UnicodeStringRule):
    description = 'is equal to {{x|UnicodeString}}, taking case into account'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(subject == self.x)


class StartsWith(base.UnicodeStringRule):
    description = 'starts with {{x|UnicodeString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(
            subject.lower().startswith(self.x.lower()))


class Contains(base.UnicodeStringRule):
    description = 'contains {{x|UnicodeString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(
            subject.lower().find(self.x.lower()) != -1)


class MatchesBase64EncodedFile(base.UnicodeStringRule):
    description = (
        'has same content as the file located at '
        '{{filepath|UnicodeString}}')

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(
            base64.b64decode(subject) == self.fs.get(self.filepath))
