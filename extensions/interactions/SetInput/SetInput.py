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


class SetInput(widget_domain.BaseWidget):
    """Interaction for set input."""

    # The human-readable name of the interaction.
    name = 'Set'

    # The category the interaction falls under in the repository.
    category = 'Basic Input'

    # A description of the interaction.
    description = 'Allows learners to enter a set of strings.'

    # Customization args and their descriptions, schemas and default
    # values.
    # NB: There used to be a UnicodeString-typed parameter here called
    # 'element_type'. This has since been removed.
    _customization_arg_specs = []

    # Actions that the learner can perform on this interaction which trigger a
    # feedback response, and the associated input types. Each interaction must
    # have at least one of these. This attribute name MUST be prefixed by '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'SetOfUnicodeString'
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this interaction. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = []
