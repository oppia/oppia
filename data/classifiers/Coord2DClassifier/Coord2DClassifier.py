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

"""Coord2D classifier rule definitions."""

__author__ = 'Koji Ashida'


from data.classifiers import normalizers

# Normalizer to use for reader answers.
DEFAULT_NORMALIZER = normalizers.Coord2D


def within(val, p, d):
    """The given value should be within {{d}} of {{p}}."""
    dx = val[0] - p[0]
    dy = val[1] - p[1]
    return dx * dx + dy * dy < d * d


def not_within(val, p, d):
    """The given value should not be within {{d}} of {{p}}."""
    return not within(val, p, d)
