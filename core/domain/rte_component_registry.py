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
