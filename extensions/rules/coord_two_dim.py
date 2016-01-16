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

from extensions.rules import base


class Within(base.CoordTwoDimRule):
    description = 'is within {{d|Real}} km of {{p|CoordTwoDim}}'


class NotWithin(base.CoordTwoDimRule):
    description = 'is not within {{d|Real}} km of {{p|CoordTwoDim}}'


class FuzzyMatches(base.CoordTwoDimRule):
    description = 'is similar to {{training_data|ListOfCoordTwoDim}}'
    # TODO(wxy): Create a better classifier for this interaction. Currently,
    # the frontend implementation of this rule returns a boolean value,
    # checking if the answer is close to any point in the training data.
    # If this fails, the answer should then go to a backend classifier that
    # picks the answer group with the best matching answer group.
