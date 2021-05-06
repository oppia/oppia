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

"""Python configuration for recording cyclic state transitions issue."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from extensions.issues import base


class CyclicStateTransitions(base.BaseExplorationIssueSpec):
    """Issue that's recorded when the learner transitions between states in a
    cyclic manner multiple times.
    """

    _customization_arg_specs = [{
        'name': 'state_names',
        'description': 'List of state names',
        'schema': {
            'type': 'list',
            'items': {
                'type': 'unicode',
            },
        },
        'default_value': []
    }]
