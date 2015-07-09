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


class Within(base.CoordTwoDimRule):
    description = 'is within {{d|Real}} km of {{p|CoordTwoDim}}'

    def _evaluate(self, subject):
        lat1 = math.radians(self.p[0])
        lat2 = math.radians(subject[0])
        lat_diff = math.radians(subject[0] - self.p[0])
        lon_diff = math.radians(subject[1] - self.p[1])
        # Haversine formula
        haversine_of_central_angle = (
            math.sin(lat_diff / 2) ** 2 +
            math.cos(lat1) * math.cos(lat2) *
            math.sin(lon_diff / 2) ** 2)

        actual_distance = (
            RADIUS_OF_EARTH * 2 *
            math.asin(math.sqrt(haversine_of_central_angle)))
        return actual_distance < self.d


class NotWithin(base.CoordTwoDimRule):
    description = 'is not within {{d|Real}} km of {{p|CoordTwoDim}}'

    def _evaluate(self, subject):
        return not Within(self.d, self.p)._evaluate(subject)
