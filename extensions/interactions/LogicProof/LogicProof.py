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

"""Python configuration for LogicProof interaction."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from extensions.interactions import base

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class LogicProof(base.BaseInteraction):
    """Interaction for entering logic proofs."""

    name = 'Logic Proof'
    description = (
        'Allows learners to write proofs for simple logical statements.')
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    _dependency_ids = ['logic_proof', 'codemirror']
    answer_type = 'CheckedProof'
    instructions = 'Construct a proof'
    narrow_instructions = 'Construct a proof'
    needs_summary = True
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'question',
        'description': 'Question to ask',
        'schema': {
            'type': 'custom',
            'obj_type': 'LogicQuestion',
        },
        'default_value': {
            'assumptions': [{
                'top_kind_name': 'variable',
                'top_operator_name': 'p',
                'arguments': [],
                'dummies': []
            }],
            'results': [{
                'top_kind_name': 'variable',
                'top_operator_name': 'p',
                'arguments': [],
                'dummies': []
            }],
            'default_proof_string': ''
        },
    }]

    _answer_visualization_specs = [{
        # Table with answer counts for top N answers.
        'id': 'FrequencyTable',
        'options': {
            'column_headers': ['Answer', 'Count'],
            'title': 'Top 10 answers',
        },
        'calculation_id': 'Top10AnswerFrequencies',
        'addressed_info_is_supported': True,
    }]
