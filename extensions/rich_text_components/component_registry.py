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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Registry for Rich Text Components."""

import constants
from extensions.rich_text_components import components
import feconf


class Registry(object):
    """Registry of all rich text components."""

    @classmethod
    def get_all_component_specs(cls):
        """Get a dict of all components_specs."""
        with open(feconf.RTE_EXTENSIONS_DEFINITIONS_PATH, 'r') as f:
            rich_text_components_specs = constants.parse_json_from_js(f)
        return rich_text_components_specs

    @classmethod
    def get_component_type_to_component_classes(cls):
        """Get component classes mapping for component types."""
        component_types_to_component_classes = {
            'oppia-noninteractive-collapsible': components.Collapsible,
            'oppia-noninteractive-image': components.Image,
            'oppia-noninteractive-link': components.Link,
            'oppia-noninteractive-math': components.Math,
            'oppia-noninteractive-tabs': components.Tabs,
            'oppia-noninteractive-video': components.Video
        }
        return component_types_to_component_classes

    @classmethod
    def get_inline_components(cls):
        """Gets an list of inline components tags."""
        rich_text_components_specs = cls.get_all_component_specs()
        inline_component_tag_names = []
        for component_spec in rich_text_components_specs.values():
            if not component_spec['is_block_element']:
                inline_component_tag_names.append(
                    'oppia-noninteractive-%s' % component_spec['frontend_id'])
        return inline_component_tag_names

    @classmethod
    def get_block_components(cls):
        """Gets an list of block components tags."""
        rich_text_components_specs = cls.get_all_component_specs()
        block_component_tag_names = []
        for component_spec in rich_text_components_specs.values():
            if component_spec['is_block_element']:
                block_component_tag_names.append(
                    'oppia-noninteractive-%s' % component_spec['frontend_id'])
        return block_component_tag_names
