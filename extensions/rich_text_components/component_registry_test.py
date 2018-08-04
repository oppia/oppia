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

"""Tests for methods in the rich text component registry."""

import inspect
import os

from core.tests import test_utils
from extensions.rich_text_components import component_registry
from extensions.rich_text_components import components


class ComponentRegistryUnitTests(test_utils.GenericTestBase):
    """Test for the component registry."""

    def test_get_all_component_specs(self):
        """Test get_all_component_specs method."""
        obtained_components = (
            component_registry.Registry.get_all_component_specs().keys())
        actual_components = [name for name in os.listdir(
            './extensions/rich_text_components') if os.path.isdir(os.path.join(
                './extensions/rich_text_components', name))]

        self.assertEqual(set(obtained_components), set(actual_components))

    def test_get_component_type_to_component_classes(self):
        """Test get_component_type_to_component_classes method."""
        component_type_to_component_classes = (
            component_registry.Registry.get_component_type_to_component_classes(
                ))
        component_specs = component_registry.Registry.get_all_component_specs()

        obtained_component_tags = component_type_to_component_classes.keys()
        actual_components_tags = [
            'oppia-noninteractive-%s' % component_spec['frontend_id']
            for component_spec in component_specs.values()]
        self.assertEqual(
            set(obtained_component_tags), set(actual_components_tags))

        obtained_components_classes = (
            component_type_to_component_classes.values())
        actual_components_classes = []
        for name, obj in inspect.getmembers(components):
            if inspect.isclass(obj) and name != 'BaseRteComponent':
                actual_components_classes.append(obj)
        self.assertEqual(
            set(obtained_components_classes), set(actual_components_classes))

    def test_get_inline_components(self):
        """Test get_inline_components method."""
        component_specs = component_registry.Registry.get_all_component_specs()
        actual_inline_components = [
            'oppia-noninteractive-%s' % component_spec['frontend_id']
            for component_spec in component_specs.values()
            if not component_spec['is_block_element']]
        obtained_inline_components = (
            component_registry.Registry.get_inline_components())
        self.assertEqual(
            set(actual_inline_components), set(obtained_inline_components))

    def test_get_block_components(self):
        """Test get_block_components method."""
        component_specs = component_registry.Registry.get_all_component_specs()
        actual_block_components = [
            'oppia-noninteractive-%s' % component_spec['frontend_id']
            for component_spec in component_specs.values()
            if component_spec['is_block_element']]
        obtained_block_components = (
            component_registry.Registry.get_block_components())
        self.assertEqual(
            set(actual_block_components), set(obtained_block_components))
