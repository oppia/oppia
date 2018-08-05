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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Registry for custom rich-text components."""

import inspect

import constants
import feconf
import utils


class Registry(object):
    """Registry of all custom rich-text components."""

    _rte_components = {}

    @classmethod
    def _refresh(cls):
        """Repopulate the registry."""
        cls._rte_components.clear()
        with open(feconf.RTE_EXTENSIONS_DEFINITIONS_PATH, 'r') as f:
            cls._rte_components = constants.parse_json_from_js(f)

    @classmethod
    def get_all_rte_components(cls):
        """Get a dictionary mapping RTE component IDs to their definitions."""
        if not cls._rte_components:
            cls._refresh()
        return cls._rte_components

    @classmethod
    def get_tag_list_with_attrs(cls):
        """Returns a dict of HTML tag names and attributes for RTE components.

        The keys are tag names starting with 'oppia-noninteractive-', followed
        by the hyphenated version of the name of the RTE component. The values
        are lists of allowed attributes of the form
        [PARAM_NAME]-with-[CUSTOMIZATION_ARG_NAME].
        """
        # TODO(sll): Cache this computation and update it on each refresh.
        # Better still, bring this into the build process so it doesn't have
        # to be manually computed each time.
        component_list = cls.get_all_rte_components().values()

        component_tags = {}
        for component_specs in component_list:
            tag_name = 'oppia-noninteractive-%s' % (
                utils.camelcase_to_hyphenated(component_specs['backend_id']))

            component_tags[tag_name] = [
                '%s-with-value' % ca_spec['name']
                for ca_spec in component_specs['customization_arg_specs']]

        return component_tags

    @classmethod
    def get_component_types_to_component_classes(cls):
        """Get component classes mapping for component types."""
        # Importing this at top of file creates a circular dependency:
        # rte_component_registry imports components
        # components import objects
        # objects import schema_utils
        # schema_utils import html_cleaner
        # html_cleaner import rte_component_registry.
        from extensions.rich_text_components import components # pylint: disable=relative-import
        component_types_to_component_classes = {}
        component_names = cls.get_all_rte_components().keys()
        for component_name in component_names:
            for name, obj in inspect.getmembers(components):
                if inspect.isclass(obj) and name == component_name:
                    component_types_to_component_classes[
                        'oppia-noninteractive-%s' % component_name.lower()] = (
                            obj)

        return component_types_to_component_classes

    @classmethod
    def get_inline_components(cls):
        """Gets an list of inline component tags."""
        rich_text_components_specs = cls.get_all_rte_components()
        inline_component_tag_names = []
        for component_spec in rich_text_components_specs.values():
            if not component_spec['is_block_element']:
                inline_component_tag_names.append(
                    'oppia-noninteractive-%s' % component_spec['frontend_id'])
        return inline_component_tag_names

    @classmethod
    def get_block_components(cls):
        """Gets an list of block component tags."""
        rich_text_components_specs = cls.get_all_rte_components()
        block_component_tag_names = []
        for component_spec in rich_text_components_specs.values():
            if component_spec['is_block_element']:
                block_component_tag_names.append(
                    'oppia-noninteractive-%s' % component_spec['frontend_id'])
        return block_component_tag_names

    @classmethod
    def get_simple_components(cls):
        """Gets an list of simple component tags."""
        rich_text_components_specs = cls.get_all_rte_components()
        simple_component_tag_names = []
        for component_spec in rich_text_components_specs.values():
            if not component_spec['is_complex']:
                simple_component_tag_names.append(
                    'oppia-noninteractive-%s' % component_spec['frontend_id'])
        return simple_component_tag_names

    @classmethod
    def get_complex_components(cls):
        """Gets an list of complex component tags."""
        rich_text_components_specs = cls.get_all_rte_components()
        complex_component_tag_names = []
        for component_spec in rich_text_components_specs.values():
            if component_spec['is_complex']:
                complex_component_tag_names.append(
                    'oppia-noninteractive-%s' % component_spec['frontend_id'])
        return complex_component_tag_names
