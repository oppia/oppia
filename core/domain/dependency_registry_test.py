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

__author__ = 'Sean Lip'

from core.domain import dependency_registry
from core.domain import exp_services
from core.domain import widget_registry
from core.tests import test_utils
import feconf


class DependencyRegistryTests(test_utils.GenericTestBase):
    """Tests for the dependency registry."""

    def test_get_dependency_html(self):
        self.assertIn(
            'jsrepl',
            dependency_registry.Registry.get_dependency_html('jsrepl'))

        with self.assertRaises(IOError):
            dependency_registry.Registry.get_dependency_html('a')


class DependencyControllerTests(test_utils.GenericTestBase):
    """Tests for dependency loading on user-facing pages."""

    def test_no_dependencies_in_non_exploration_pages(self):
        response = self.testapp.get(feconf.LEARN_GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(no=['jsrepl'])

        response = self.testapp.get('/about')
        self.assertEqual(response.status_int, 200)
        response.mustcontain(no=['jsrepl'])

        self.register_editor('editor@example.com')
        self.login('editor@example.com')
        response = self.testapp.get(feconf.CONTRIBUTE_GALLERY_URL)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(no=['jsrepl'])
        self.logout()

    def test_dependencies_loaded_in_exploration_editor(self):
        exp_services.load_demo('0')

        # Register and login as an editor.
        self.register_editor('editor@example.com')
        self.login('editor@example.com')

        # Verify that the exploration does not have a jsrepl dependency.
        exploration = exp_services.get_exploration_by_id('0')
        interactive_widget_ids = exploration.get_interactive_widget_ids()
        all_dependency_ids = (
            widget_registry.Registry.get_deduplicated_dependency_ids(
                interactive_widget_ids))

        self.assertNotIn('jsrepl', all_dependency_ids)

        # However, jsrepl is loaded in the exploration editor anyway, since
        # all dependencies are loaded in the exploration editor.
        response = self.testapp.get('/create/0')
        self.assertEqual(response.status_int, 200)
        response.mustcontain('jsrepl')

        self.logout()

    def test_dependency_does_not_load_in_exploration_not_containing_it(self):
        EXP_ID = '0'

        exp_services.load_demo(EXP_ID)

        # Verify that exploration 0 does not have a jsrepl dependency.
        exploration = exp_services.get_exploration_by_id(EXP_ID)
        interactive_widget_ids = exploration.get_interactive_widget_ids()
        all_dependency_ids = (
            widget_registry.Registry.get_deduplicated_dependency_ids(
                interactive_widget_ids))
        self.assertNotIn('jsrepl', all_dependency_ids)

        # Thus, jsrepl is not loaded in the exploration reader.
        response = self.testapp.get('/explore/%s' % EXP_ID)
        self.assertEqual(response.status_int, 200)
        response.mustcontain(no=['jsrepl'])

    def test_dependency_loads_in_exploration_containing_it(self):
        EXP_ID = '1'

        exp_services.load_demo(EXP_ID)

        # Verify that exploration 1 has a jsrepl dependency.
        exploration = exp_services.get_exploration_by_id(EXP_ID)
        interactive_widget_ids = exploration.get_interactive_widget_ids()
        all_dependency_ids = (
            widget_registry.Registry.get_deduplicated_dependency_ids(
                interactive_widget_ids))
        self.assertIn('jsrepl', all_dependency_ids)

        # Thus, jsrepl is loaded in the exploration reader.
        response = self.testapp.get('/explore/%s' % EXP_ID)
        self.assertEqual(response.status_int, 200)
        response.mustcontain('jsrepl')
