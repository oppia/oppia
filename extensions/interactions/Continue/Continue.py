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

from core.domain import widget_domain


class Continue(widget_domain.BaseWidget):
    """Interaction that takes the form of a simple 'Continue' button."""

    # The human-readable name of the interaction.
    name = 'Continue Button'

    # The category the interaction falls under in the repository.
    category = 'Basic Input'

    # A description of the interaction.
    description = 'A simple \'go to next state\' button.'

    # Customization args and their descriptions, schemas and default
    # values.
    _customization_arg_specs = [{
        'name': 'buttonText',
        'description': 'The text to display on the button.',
        'schema': {
            'type': 'unicode',
        },
        'default_value': 'Continue',
    }]

    # Actions that the learner can perform on this interaction which trigger a
    # feedback response, and the associated input types. Each interaction must
    # have at least one of these. This attribute name MUST be prefixed by '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'Null'
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this interaction. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = []
