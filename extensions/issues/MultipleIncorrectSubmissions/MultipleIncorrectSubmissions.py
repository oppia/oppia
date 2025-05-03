# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Python configuration for recording multiple incorrect submissions issue."""

from __future__ import annotations

from extensions.issues import base

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class MultipleIncorrectSubmissions(base.BaseExplorationIssueSpec):
    """Issue that's recorded when the learner answers multiple times incorrectly
    in the same card and quits the exploration.
    """

    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'state_name',
        'description': 'State name',
        'schema': {
            'type': 'unicode',
        },
        'default_value': ''
    }, {
        'name': 'num_times_answered_incorrectly',
        'description': 'Number of times incorrect answers were submitted',
        'schema': {
            'type': 'int',
        },
        'default_value': 0
    }]
