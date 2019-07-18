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
import pkgutil

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
        """Get component classes mapping for component types.

        Returns:
            dict. A dict mapping from rte component types to rte component
                classes.
        """
        rte_path = [feconf.RTE_EXTENSIONS_DIR]

        for loader, name, _ in pkgutil.iter_modules(path=rte_path):
            if name == 'components':
                module = loader.find_module(name).load_module(name)
                break

        component_types_to_component_classes = {}
        component_names = cls.get_all_rte_components().keys()
        for component_name in component_names:
            for name, obj in inspect.getmembers(module):
                if inspect.isclass(obj) and name == component_name:
                    component_types_to_component_classes[
                        'oppia-noninteractive-%s' % component_name.lower()] = (
                            obj)

        return component_types_to_component_classes

    @classmethod
    def get_component_tag_names(cls, key, expected_value):
        """Get a list of component tag names which have the expected
        value of a key.

        Args:
            key: str. The key to be checked in component spec.
            expected_value: bool. The expected value of the key to select
                the components.

        Returns:
            list(str). A list of component tag names which have the expected
                value of a key.
        """
        rich_text_components_specs = cls.get_all_rte_components()
        component_tag_names = []
        for component_spec in rich_text_components_specs.values():
            if component_spec[key] == expected_value:
                component_tag_names.append(
                    'oppia-noninteractive-%s' % component_spec['frontend_id'])
        return component_tag_names

    @classmethod
    def get_inline_component_tag_names(cls):
        """Get a list of inline component tag names.

        Returns:
            list(str). A list of inline component tag names.
        """
        return cls.get_component_tag_names('is_block_element', False)

    @classmethod
    def get_block_component_tag_names(cls):
        """Get a list of block component tag names.

        Returns:
            list(str). A list of block component tag names.
        """
        return cls.get_component_tag_names('is_block_element', True)

    @classmethod
    def get_simple_component_tag_names(cls):
        """Get a list of simple component tag names.

        Returns:
            list(str). A list of simple component tag names.
        """
        return cls.get_component_tag_names('is_complex', False)

    @classmethod
    def get_complex_component_tag_names(cls):
        """Get a list of complex component tag names.

        Returns:
            list(str). A list of complex component tag names.
        """
        return cls.get_component_tag_names('is_complex', True)
