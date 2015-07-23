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

"""Rules for ClickOnImage objects."""

__author__ = 'Zhan Xiong Chin'

from extensions.rules import base


class IsInRegion(base.ClickOnImageRule):
    description = 'is in the region {{x|UnicodeString}}'

    def _evaluate(self, subject):
        return self._fuzzify_truth_value(self.x in subject['clickedRegions'])


class FuzzyMatches(base.ClickOnImageRule):
    description = 'is similar to {{training_data|SetOfReal}}'

    def _evaluate(self, subject):
        # For simple classification, this computes the inverse absolute
        # distances between the input value and all values in the training set.
        # The largest value is used as the "membership certainty" of the input
        # value belonging to this cluster.

        # If no training data exists, then this real value cannot belong to the
        # cluster.
        if len(self.training_data) == 0:
            return self._fuzzify_truth_value(False)

        def _compute_certainty(v1, v2):
            abs_dist = abs(v1 - v2)
            if abs_dist < 1:
                return 1
            return 1 / abs_dist

        best_certainty = _compute_certainty(subject, self.training_data[0])
        for value in self.training_data:
            best_certainty = max(
                best_certainty, _compute_certainty(subject, value))

        return best_certainty
