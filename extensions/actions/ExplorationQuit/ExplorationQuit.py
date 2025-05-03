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

"""Python configuration for recording the action corresponding to a learner
quitting an exploration.
"""

from __future__ import annotations

from extensions.actions import base

from typing import List

MYPY = False
if MYPY:  # pragma: no cover
    from extensions import domain


class ExplorationQuit(base.BaseLearnerActionSpec):
    """Learner action that's recorded when a learner quits an exploration."""

    _customization_arg_specs: List[domain.CustomizationArgSpecsDict] = [{
        'name': 'state_name',
        'description': 'State name',
        'schema': {
            'type': 'unicode',
        },
        'default_value': ''
    }, {
        'name': 'time_spent_in_state_in_msecs',
        'description': 'Time spent in state in milliseconds',
        'schema': {
            'type': 'int',
        },
        'default_value': 0
    }]
