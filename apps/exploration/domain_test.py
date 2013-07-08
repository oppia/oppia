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

from apps.exploration.domain import Exploration
import apps.exploration.services as exp_services
from apps.state.models import State
from apps.widget.models import InteractiveWidget


class FakeExploration(Exploration):
    """Allows dummy explorations to be created and commited."""

    def __init__(self, exp_id='fake_exploration_id', owner_id=None):
        """Creates a dummy exploration."""
        self.id = exp_id
        self.title = 'title'
        self.category = 'category'
        self.state_ids = []
        self.parameters = []
        self.is_public = False
        self.image_id = 'image_id'
        self.editor_ids = [owner_id] if owner_id else []

    def put(self):
        """The put() method is patched to make no commits to the datastore."""
        self._pre_put_hook()


class ExplorationDomainUnitTests(test_utils.TestBase):
    """Test the exploration domain object."""

    def setUp(self):
        """Loads the default widgets."""
        super(ExplorationDomainUnitTests, self).setUp()
        InteractiveWidget.load_default_widgets()

    def tearDown(self):
        """Deletes all widgets and explorations."""
        InteractiveWidget.delete_all_widgets()
        explorations = exp_services.get_all_explorations()
        for exploration in explorations:
            exploration.delete()
        super(ExplorationDomainUnitTests, self).tearDown()

    def test_validation(self):
        """Test validation of explorations."""
        exploration = FakeExploration()

        # The 'state_ids property must be a non-empty list of strings
        # representing State ids.
        with self.assertRaises(Exploration.ObjectValidationError):
            exploration.state_ids = ['A string']
            exploration.put()

        # There must be at least one editor id.
        with self.assertRaises(Exploration.ObjectValidationError):
            exploration.put()

    def test_init_state_property(self):
        """Test the init_state property."""
        INIT_STATE_ID = 'init_state_id'
        INIT_STATE_NAME = 'init_state_name'

        init_state = State(id=INIT_STATE_ID, name=INIT_STATE_NAME)
        init_state.put()

        exploration = FakeExploration(owner_id='owner@example.com')
        exploration.state_ids = ['init_state_id']
        self.assertEqual(exploration.init_state.id, INIT_STATE_ID)
        self.assertEqual(exploration.init_state.name, INIT_STATE_NAME)

        exploration.add_state('b')
        self.assertEqual(exploration.init_state.id, INIT_STATE_ID)
        self.assertEqual(exploration.init_state.name, INIT_STATE_NAME)

    def test_is_demo_property(self):
        """Test the is_demo property."""
        demo = FakeExploration(exp_id='0')
        self.assertEqual(demo.is_demo, True)

        notdemo1 = FakeExploration(exp_id='a')
        self.assertEqual(notdemo1.is_demo, False)

        notdemo2 = FakeExploration(exp_id='abcd')
        self.assertEqual(notdemo2.is_demo, False)

    def test_is_owned_by(self):
        """Test the is_owned_by() method."""
        owner_id = 'owner@example.com'
        editor_id = 'editor@example.com'
        viewer_id = 'viewer@example.com'

        exploration = FakeExploration(owner_id=owner_id)
        exploration.add_editor(editor_id)

        self.assertTrue(exploration.is_owned_by(owner_id))
        self.assertFalse(exploration.is_owned_by(editor_id))
        self.assertFalse(exploration.is_owned_by(viewer_id))
        self.assertFalse(exploration.is_owned_by(None))

    def test_is_editable_by(self):
        """Test the is_editable_by() method."""
        owner_id = 'owner@example.com'
        editor_id = 'editor@example.com'
        viewer_id = 'viewer@example.com'

        exploration = FakeExploration(owner_id=owner_id)
        exploration.add_editor(editor_id)

        self.assertTrue(exploration.is_editable_by(owner_id))
        self.assertTrue(exploration.is_editable_by(editor_id))
        self.assertFalse(exploration.is_editable_by(viewer_id))
        self.assertFalse(exploration.is_editable_by(None))
