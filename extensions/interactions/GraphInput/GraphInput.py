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

"""Python configuration for GraphInput interaction."""

from extensions.interactions import base


class GraphInput(base.BaseInteraction):
    """Interaction for evaluating graphs."""

    name = 'Graph Theory'
    description = 'Allows learners to create and manipulate graphs.'
    display_mode = base.DISPLAY_MODE_SUPPLEMENTAL
    is_trainable = False
    _dependency_ids = []
    answer_type = 'Graph'
    instructions = 'Create a graph'
    narrow_instructions = 'View graph'
    needs_summary = True
    can_have_solution = True
    show_generic_submit_button = True

    _customization_arg_specs = [{
        'name': 'graph',
        'description': 'Initial graph',
        'schema': {
            'type': 'custom',
            'obj_type': 'Graph',
        },
        'default_value': {
            'vertices': [{
                'x': 150.0,
                'y': 50.0,
                'label': '',
            }, {
                'x': 200.0,
                'y': 50.0,
                'label': '',
            }, {
                'x': 150.0,
                'y': 100.0,
                'label': '',
            }],
            'edges': [{
                'src': 0,
                'dst': 1,
                'weight': 1,
            }, {
                'src': 1,
                'dst': 2,
                'weight': 1,
            }],
            'isLabeled': False,
            'isDirected': False,
            'isWeighted': False,
        }
    }, {
        'name': 'canAddVertex',
        'description': 'Allow learner to add vertices',
        'schema': {
            'type': 'bool',
        },
        'default_value': False
    }, {
        'name': 'canDeleteVertex',
        'description': 'Allow learner to delete vertices',
        'schema': {
            'type': 'bool',
        },
        'default_value': False
    }, {
        'name': 'canMoveVertex',
        'description': 'Allow learner to move vertices',
        'schema': {
            'type': 'bool',
        },
        'default_value': True
    }, {
        'name': 'canEditVertexLabel',
        'description': 'Allow learner to edit vertex labels',
        'schema': {
            'type': 'bool',
        },
        'default_value': False
    }, {
        'name': 'canAddEdge',
        'description': 'Allow learner to add edges',
        'schema': {
            'type': 'bool',
        },
        'default_value': True
    }, {
        'name': 'canDeleteEdge',
        'description': 'Allow learner to delete edges',
        'schema': {
            'type': 'bool',
        },
        'default_value': True
    }, {
        'name': 'canEditEdgeWeight',
        'description': 'Allow learner to edit edge weights',
        'schema': {
            'type': 'bool',
        },
        'default_value': False
    }]
