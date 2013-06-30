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

import apps.exploration.services as exp_services
from apps.widget.models import InteractiveWidget

from google.appengine.api.users import User


class ExplorationServicesUnitTests(test_utils.AppEngineTestBase):
    """Test the exploration services module."""

    def setUp(self):
        """Loads the default widgets."""
        super(ExplorationServicesUnitTests, self).setUp()
        InteractiveWidget.load_default_widgets()

        self.owner = User(email='owner@example.com')
        self.editor = User(email='editor@example.com')
        self.viewer = User(email='viewer@example.com')

    def test_get_viewable_explorations(self):
        self.exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', 'A exploration_id')
        self.exploration.editors.append(self.editor)
        self.exploration.put()

        self.assertItemsEqual(
            exp_services.get_viewable_explorations(self.owner),
            [self.exploration])
        self.assertItemsEqual(
            exp_services.get_viewable_explorations(self.viewer), [])
        self.assertItemsEqual(
            exp_services.get_viewable_explorations(None), [])

        # Set the exploration's status to published.
        self.exploration.is_public = True
        self.exploration.put()

        self.assertItemsEqual(
            exp_services.get_viewable_explorations(self.owner),
            [self.exploration])
        self.assertItemsEqual(
            exp_services.get_viewable_explorations(self.viewer),
            [self.exploration])
        self.assertItemsEqual(
            exp_services.get_viewable_explorations(None),
            [self.exploration])

        # Clean up.
        self.exploration.is_public = False
        self.exploration.put()

    def test_get_editable_explorations(self):
        self.exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', 'A exploration_id')
        self.exploration.editors.append(self.editor)
        self.exploration.put()

        self.assertItemsEqual(
            exp_services.get_editable_explorations(self.owner),
            [self.exploration])
        self.assertItemsEqual(
            exp_services.get_editable_explorations(self.viewer), [])
        self.assertItemsEqual(
            exp_services.get_editable_explorations(None), [])

        # Set the exploration's status to published.
        self.exploration.is_public = True
        self.exploration.put()

        self.assertItemsEqual(
            exp_services.get_editable_explorations(self.owner),
            [self.exploration])
        self.assertItemsEqual(
            exp_services.get_editable_explorations(self.viewer), [])
        self.assertItemsEqual(
            exp_services.get_editable_explorations(None), [])

        # Clean up.
        self.exploration.is_public = False
        self.exploration.put()

    def test_create_from_yaml(self):
        """Test the create_from_yaml() method."""
        exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', 'A different exploration_id')
        exploration.add_state('New state')
        yaml_file = exploration.as_yaml

        exploration2 = exp_services.create_from_yaml(
            yaml_file, self.owner, 'Title', 'Category')
        self.assertEqual(len(exploration2.states), 2)
        self.assertEqual(exploration2.as_yaml, yaml_file)

        self.assertEqual(exp_services.count_explorations(), 2)

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'No_initial_state_name', self.user, 'Title', 'category')

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'Invalid\ninit_state_name:\nMore stuff',
                self.user, 'Title', 'category')

        with self.assertRaises(Exception):
            exp_services.create_from_yaml(
                'State1:\n(\nInvalid yaml', self.user, 'Title', 'category')

        # Check that no new exploration was created.
        self.assertEqual(exp_services.count_explorations(), 2)

    def test_creation_and_deletion_of_individual_explorations(self):
        """Test the create_new() and delete() methods."""
        exploration = exp_services.create_new(
            self.owner, 'A title', 'A category', 'A exploration_id')
        exploration.put()

        retrieved_exploration = exp_services.get_by_id('A exploration_id')
        self.assertEqual(exploration, retrieved_exploration)

        exp_services.delete(exploration.id)
        with self.assertRaises(Exception):
            retrieved_exploration = exp_services.get_by_id('A exploration_id')

    def test_loading_and_deletion_of_demo_explorations(self):
        """Test loading and deletion of the demo explorations."""
        self.assertEqual(exp_services.count_explorations(), 0)

        exp_services.load_demos()
        self.assertEqual(exp_services.count_explorations(), 7)

        exp_services.delete_demos()
        self.assertEqual(exp_services.count_explorations(), 0)
