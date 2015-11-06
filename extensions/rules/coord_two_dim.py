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

"""Rules for CoordTwoDim objects."""

__author__ = 'Sean Lip'

import math

from extensions.rules import base

RADIUS_OF_EARTH = 6371.0


def _haversine_distance(p1, p2):
    lat1 = math.radians(p1[0])
    lat2 = math.radians(p2[0])
    lat_diff = math.radians(p2[0] - p1[0])
    lon_diff = math.radians(p2[1] - p1[1])
    # Haversine formula
    haversine_of_central_angle = (
        math.sin(lat_diff / 2) ** 2 +
        math.cos(lat1) * math.cos(lat2) *
        math.sin(lon_diff / 2) ** 2)
    return (
        RADIUS_OF_EARTH * 2 *
        math.asin(math.sqrt(haversine_of_central_angle)))


class Within(base.CoordTwoDimRule):
    description = 'is within {{d|Real}} km of {{p|CoordTwoDim}}'

    def _evaluate(self, subject):
        actual_distance = _haversine_distance(self.p, subject)
        return self._fuzzify_truth_value(actual_distance < self.d)


class NotWithin(base.CoordTwoDimRule):
    description = 'is not within {{d|Real}} km of {{p|CoordTwoDim}}'

    def _evaluate(self, subject):
        return self._invert_fuzzy_truth_value(
            Within(self.d, self.p)._evaluate(subject))


class FuzzyMatches(base.CoordTwoDimRule):
    description = 'is similar to {{training_data|ListOfCoordTwoDim}}'

    def _evaluate(self, subject):
        # For simple classification, the membership value of the input point and
        # this cluster is the maximum inverse distance between the input and all
        # points in the training data.

        # If no training data exists, then the point cannot belong to the
        # cluster.
        if len(self.training_data) == 0:
            return self._fuzzify_truth_value(False)

        def _compute_certainty(p1, p2):
            dist = _haversine_distance(p1, p2)
            if dist < 1.0:
                return 1.0
            return 1.0 / dist

        return max([
            _compute_certainty(value, subject)
            for value in self.training_data])
