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
submitting an answer.
"""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import os
import sys

from extensions.actions import base

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class AnswerSubmit(base.BaseLearnerActionSpec):
    """Learner action that's recorded when an answer is submitted."""

    _customization_arg_specs = [{
        'name': 'state_name',
        'description': 'State name',
        'schema': {
            'type': 'unicode',
        },
        'default_value': ''
    }, {
        'name': 'dest_state_name',
        'description': 'Destination state name',
        'schema': {
            'type': 'unicode',
        },
        'default_value': ''
    }, {
        'name': 'interaction_id',
        'description': 'ID of the interaction',
        'schema': {
            'type': 'unicode',
        },
        'default_value': ''
    }, {
        'name': 'submitted_answer',
        'description': 'Submitted answer',
        'schema': {
            'type': 'unicode',
        },
        'default_value': ''
    }, {
        'name': 'feedback',
        'description': 'Feedback for the submitted answer',
        'schema': {
            'type': 'unicode',
        },
        'default_value': ''
    }, {
        'name': 'time_spent_state_in_msecs',
        'description': 'Time spent in state in milliseconds',
        'schema': {
            'type': 'int',
        },
        'default_value': 0
    }]
