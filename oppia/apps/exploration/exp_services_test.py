# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

import test_utils

from oppia.apps.exploration import exp_domain
from oppia.apps.exploration import exp_services
import oppia.apps.widget.models as widget_models


class ExplorationServicesUnitTests(test_utils.AppEngineTestBase):
    """Test the exploration services module."""

    def setUp(self):
        """Loads the default widgets and creates dummy users."""
        super(ExplorationServicesUnitTests, self).setUp()
        widget_models.InteractiveWidget.load_default_widgets()

        self.owner_id = 'owner@example.com'
        self.editor_id = 'editor@example.com'
        self.viewer_id = 'viewer@example.com'

    def tearDown(self):
        """Deletes the dummy users and any other widgets and explorations."""
        widget_models.InteractiveWidget.delete_all_widgets()
        exp_services.delete_all_explorations()
        super(ExplorationServicesUnitTests, self).tearDown()


class ExplorationQueriesUnitTests(ExplorationServicesUnitTests):
    """Tests query methods."""

    def test_get_all_explorations(self):
        """Test get_all_explorations()."""

        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        self.assertItemsEqual(
            [e.id for e in exp_services.get_all_explorations()],
            [exploration.id]
        )

        exploration2 = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A new title', 'A category', 'A new exploration_id'))
        self.assertItemsEqual(
            [e.id for e in exp_services.get_all_explorations()],
            [exploration.id, exploration2.id]
        )

    def test_get_public_explorations(self):
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        self.assertEqual(exp_services.get_public_explorations(), [])

        exploration.is_public = True
        exploration.put()
        self.assertEqual(
            [e.id for e in exp_services.get_public_explorations()],
            [exploration.id]
        )

    def test_get_viewable_explorations(self):
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        exploration.add_editor(self.editor_id)
        exploration.put()

        def get_viewable_ids(user_id):
            return [
                e.id for e in exp_services.get_viewable_explorations(user_id)
            ]

        self.assertEqual(get_viewable_ids(self.owner_id), [exploration.id])
        self.assertEqual(get_viewable_ids(self.viewer_id), [])
        self.assertEqual(get_viewable_ids(None), [])

        # Set the exploration's status to published.
        exploration.is_public = True
        exploration.put()

        self.assertEqual(get_viewable_ids(self.owner_id), [exploration.id])
        self.assertEqual(
            get_viewable_ids(self.viewer_id), [exploration.id])
        self.assertEqual(get_viewable_ids(None), [exploration.id])

    def test_get_editable_explorations(self):
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        exploration.add_editor(self.editor_id)
        exploration.put()

        def get_editable_ids(user_id):
            return [
                e.id for e in exp_services.get_editable_explorations(user_id)
            ]

        self.assertEqual(get_editable_ids(self.owner_id), [exploration.id])
        self.assertEqual(get_editable_ids(self.viewer_id), [])
        self.assertEqual(get_editable_ids(None), [])

        # Set the exploration's status to published.
        exploration.is_public = True
        exploration.put()

        self.assertEqual(get_editable_ids(self.owner_id), [exploration.id])
        self.assertEqual(get_editable_ids(self.viewer_id), [])
        self.assertEqual(get_editable_ids(None), [])

    def test_count_explorations(self):
        """Test count_explorations()."""

        self.assertEqual(exp_services.count_explorations(), 0)

        exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id')
        self.assertEqual(exp_services.count_explorations(), 1)

        exp_services.create_new(
            self.owner_id, 'A new title', 'A category', 'A new exploration_id')
        self.assertEqual(exp_services.count_explorations(), 2)


class ExplorationCreateAndDeleteUnitTests(ExplorationServicesUnitTests):
    """Test creation and deletion methods."""

    def test_create_from_yaml(self):
        """Test the create_from_yaml() method."""
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category',
            'A different exploration_id'))
        exploration.add_state('New state')
        yaml_content = exp_services.export_to_yaml(exploration.id)

        exploration2 = exp_domain.Exploration.get(exp_services.create_from_yaml(
            yaml_content, self.owner_id, 'Title', 'Category'))
        self.assertEqual(len(exploration2.state_ids), 2)
        yaml_content_2 = exp_services.export_to_yaml(exploration2.id)
        self.assertEqual(yaml_content_2, yaml_content)

        self.assertEqual(exp_services.count_explorations(), 2)

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'No_initial_state_name', self.owner_id, 'Title', 'category')

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'Invalid\ninit_state_name:\nMore stuff',
                self.owner_id, 'Title', 'category')

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'State1:\n(\nInvalid yaml', self.owner_id, 'Title', 'category')

        # Check that no new exploration was created.
        self.assertEqual(exp_services.count_explorations(), 2)

    def test_creation_and_deletion_of_individual_explorations(self):
        """Test the create_new() and delete() methods."""
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        exploration.put()

        retrieved_exploration = exp_domain.Exploration.get('A exploration_id')
        self.assertEqual(exploration.id, retrieved_exploration.id)
        self.assertEqual(exploration.title, retrieved_exploration.title)

        exploration.delete()
        with self.assertRaises(Exception):
            retrieved_exploration = exp_domain.Exploration.get(
                'A exploration_id')

    def test_loading_and_deletion_of_demo_explorations(self):
        """Test loading and deletion of the demo explorations."""
        self.assertEqual(exp_services.count_explorations(), 0)

        exp_services.load_demos()
        self.assertEqual(exp_services.count_explorations(), 7)

        exp_services.delete_demos()
        self.assertEqual(exp_services.count_explorations(), 0)

    def test_export_to_yaml(self):
        """Test the export_to_yaml() method."""
        exploration = exp_domain.Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category',
            'A different exploration_id'))
        exploration.add_state('New state')
        yaml_content = exp_services.export_to_yaml(exploration.id)
        self.assertEqual(yaml_content, """parameters: []
states:
- content: []
  name: '[untitled state]'
  param_changes: []
  widget:
    handlers:
    - name: submit
      rules:
      - dest: '[untitled state]'
        feedback: []
        inputs: {}
        name: Default
        param_changes: []
    params: {}
    sticky: false
    widget_id: interactive-Continue
- content: []
  name: New state
  param_changes: []
  widget:
    handlers:
    - name: submit
      rules:
      - dest: New state
        feedback: []
        inputs: {}
        name: Default
        param_changes: []
    params: {}
    sticky: false
    widget_id: interactive-Continue
""")
