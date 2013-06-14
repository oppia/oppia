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

from apps.exploration.models import Exploration
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

        self.exploration = Exploration.create(
            self.owner, 'A title', 'A category', 'A exploration_id')
        self.exploration.editors.append(self.editor)
        self.exploration.put()

    def test_is_owner(self):
        self.assertTrue(exp_services.is_owner(self.owner, self.exploration))
        self.assertFalse(exp_services.is_owner(self.editor, self.exploration))
        self.assertFalse(exp_services.is_owner(self.viewer, self.exploration))
        self.assertFalse(exp_services.is_owner(None, self.exploration))

        with self.assertRaises(AttributeError):
            exp_services.is_owner(self.owner, None)

    def test_is_editor(self):
        self.assertTrue(exp_services.is_editor(self.owner, self.exploration))
        self.assertTrue(exp_services.is_editor(self.editor, self.exploration))
        self.assertFalse(exp_services.is_editor(self.viewer, self.exploration))
        self.assertFalse(exp_services.is_editor(None, self.exploration))

        with self.assertRaises(AttributeError):
            exp_services.is_editor(self.owner, None)

    def test_get_viewable_explorations(self):
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
        # raise Exception(exp_services.get_editable_explorations(self.owner))
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

    def test_is_demo(self):
        self.assertEqual(exp_services.is_demo(Exploration(id='0')), True)
        self.assertEqual(exp_services.is_demo(Exploration(id='a')), False)
        self.assertEqual(exp_services.is_demo(Exploration(id='abcd')), False)
