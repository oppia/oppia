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

"""Coord2D classifier tests."""

__author__ = 'Koji Ashida'


import Coord2DClassifier
import test_utils


class Coord2DClassifierTest(test_utils.TestBase):

    def testCoord2DClassifier(self):

        assert not Coord2DClassifier.within([0, 0], [10, 10], 10)
        assert Coord2DClassifier.within([0, 0], [10, 10], 20)
        assert not Coord2DClassifier.within([-5, 0], [5, 10], 10)
        assert Coord2DClassifier.within([-5, 0], [5, 10], 20)

        assert Coord2DClassifier.not_within([0, 0], [10, 10], 10)
        assert not Coord2DClassifier.not_within([0, 0], [10, 10], 20)
        assert Coord2DClassifier.not_within([-5, 0], [5, 10], 10)
        assert not Coord2DClassifier.not_within([-5, 0], [5, 10], 20)
