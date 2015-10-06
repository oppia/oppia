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

__author__ = 'Sean Lip'

import pkgutil

import feconf
import utils


class Registry(object):
    """Registry of all custom rich-text components."""

    _rte_components = {}

    @classmethod
    def _refresh(cls):
        """Repopulate the registry."""
        cls._rte_components.clear()

        # Assemble all paths to the RTE components.
        EXTENSION_PATHS = [
            component['dir'] for component in
            feconf.ALLOWED_RTE_EXTENSIONS.values()]

        # Crawl the directories and add new RTE component instances to the
        # registry.
        for loader, name, _ in pkgutil.iter_modules(path=EXTENSION_PATHS):
            module = loader.find_module(name).load_module(name)
            clazz = getattr(module, name)

            ancestor_names = [
                base_class.__name__ for base_class in clazz.__bases__]
            if 'BaseRichTextComponent' in ancestor_names:
                cls._rte_components[clazz.__name__] = clazz()

    @classmethod
    def get_all_rte_components(cls):
        """Get a list of instances of all custom RTE components."""
        if len(cls._rte_components) == 0:
            cls._refresh()
        return cls._rte_components.values()

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
        component_list = cls.get_all_rte_components()

        component_tags = {}
        for component in component_list:
            tag_name = 'oppia-noninteractive-%s' % (
                utils.camelcase_to_hyphenated(component.id))

            component_tags[tag_name] = [
                '%s-with-value' % ca_spec.name
                for ca_spec in component.customization_arg_specs]

        return component_tags

    @classmethod
    def get_html_for_all_components(cls):
        """Returns the HTML bodies for all custom RTE components."""
        return ' \n'.join([
            component.html_body for component in cls.get_all_rte_components()])

    @classmethod
    def get_all_specs(cls):
        """Returns a dict containing the full specs of each RTE component."""
        return {
            component.id: component.to_dict()
            for component in cls.get_all_rte_components()
        }
