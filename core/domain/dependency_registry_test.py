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

"""Tests for JavaScript library dependencies."""

from core.domain import dependency_registry
from core.domain import exp_services
from core.domain import interaction_registry
from core.tests import test_utils
import feconf


class DependencyRegistryTests(test_utils.GenericTestBase):
    """Tests for the dependency registry."""

    def test_get_dependency_html(self):
        self.assertIn(
            'skulpt',
            dependency_registry.Registry.get_dependency_html('skulpt'))

        with self.assertRaises(IOError):
            dependency_registry.Registry.get_dependency_html('a')


class DependencyControllerTests(test_utils.GenericTestBase):
    """Tests for dependency loading on user-facing pages."""

    def test_no_dependencies_in_non_exploration_pages(self):
        response = self.get_html_response(feconf.LIBRARY_INDEX_URL)
        response.mustcontain(no=['skulpt'])

        response = self.get_html_response('/about')
        response.mustcontain(no=['skulpt'])

    def test_dependencies_loaded_in_exploration_editor(self):
        exp_services.load_demo('0')

        # Register and login as an editor.
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.login(self.EDITOR_EMAIL)

        # Verify that the exploration does not have a Skulpt dependency.
        exploration = exp_services.get_exploration_by_id('0')
        interaction_ids = exploration.get_interaction_ids()
        all_dependency_ids = (
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                interaction_ids))

        self.assertNotIn('skulpt', all_dependency_ids)

        # However, Skulpt is loaded in the exploration editor anyway, since
        # all dependencies are loaded in the exploration editor.
        response = self.get_html_response('/create/0')
        response.mustcontain('skulpt')

        self.logout()

    def test_dependency_does_not_load_in_exploration_not_containing_it(self):
        exp_id = '0'

        exp_services.load_demo(exp_id)

        # Verify that exploration 0 does not have a Skulpt dependency.
        exploration = exp_services.get_exploration_by_id(exp_id)
        interaction_ids = exploration.get_interaction_ids()
        all_dependency_ids = (
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                interaction_ids))
        self.assertNotIn('skulpt', all_dependency_ids)

        # Thus, Skulpt is not loaded in the exploration reader.
        response = self.get_html_response('/explore/%s' % exp_id)
        response.mustcontain(no=['skulpt'])

    def test_dependency_loads_in_exploration_containing_it(self):
        exp_id = '1'

        exp_services.load_demo(exp_id)

        # Verify that exploration 1 has a Skulpt dependency.
        exploration = exp_services.get_exploration_by_id(exp_id)
        interaction_ids = exploration.get_interaction_ids()
        all_dependency_ids = (
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                interaction_ids))
        self.assertIn('skulpt', all_dependency_ids)

        # Thus, Skulpt is loaded in the exploration reader.
        response = self.get_html_response('/explore/%s' % exp_id)
        response.mustcontain('skulpt')
