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

__author__ = 'Jacob Davis'

from core.domain import widget_domain
from extensions.objects.models import objects
from extensions.value_generators.models import generators


class LogicProof(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Logic Proof'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = (
        'A widget where users prove simple logical statements.')

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'question',
        'description': 'Question to ask.',
        'generator': generators.Copier,
        'init_args': {
            'value': {
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
            }
        },
        'customization_args': {
            'value': {
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
            }
        },
        'obj_type': 'LogicQuestion'
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'CheckedProof'
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this widget. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = ['logic_proof']