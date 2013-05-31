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

__author__ = 'Jeremy Emerson'

import feconf
import test_utils

from apps.exploration.models import Exploration
from apps.state.models import State
from apps.widget.models import InteractiveWidget

from google.appengine.api.users import User


class StateModelUnitTests(test_utils.AppEngineTestBase):
    """Test the state model."""

    def setUp(self):
        """Loads the default widgets and create sample users and explorations."""
        super(StateModelUnitTests, self).setUp()
        InteractiveWidget.load_default_widgets()

        self.user = User(email='test@example.com')
        self.another_user = User(email='another@user.com')

        self.exploration = Exploration.create(
            self.user, 'A title', 'A category', 'A exploration_id')
        self.exploration.put()

    def test_state_class(self):
        """Test State Class."""
        state = State(id='The exploration hash id')

        # A new state should have a default name property.
        self.assertEqual(state.name, feconf.DEFAULT_STATE_NAME)

        # A state that is put into the datastore must have a parent
        # exploration.
        with self.assertRaises(Exception):
            state.put()

    def test_create_and_get_state(self):
        """Test creation and retrieval of states."""
        id_1 = '123'
        name_1 = 'State 1'
        state_1 = State.create(self.exploration, name_1, state_id=id_1)
        fetched_state_1 = State.get(id_1, self.exploration)
        self.assertEqual(fetched_state_1, state_1)

        fetched_state_by_name_1 = State.get_by_name(name_1, self.exploration)
        self.assertEqual(fetched_state_by_name_1, state_1)

        # Test the failure cases.
        id_2 = 'fake_id'
        name_2 = 'fake_name'
        fetched_state_2 = State.get(id_2, self.exploration)
        self.assertIsNone(fetched_state_2)

        fetched_state_by_name_2 = State.get_by_name(
            name_2, self.exploration, strict=False)
        self.assertIsNone(fetched_state_by_name_2)
        with self.assertRaises(Exception):
            State.get_by_name(name_2, self.exploration, strict=True)
        # The default behavior is to fail noisily.
        with self.assertRaises(Exception):
            State.get_by_name(name_2, self.exploration)

    def test_get_id_from_name(self):
        """Test converting state names to ids."""
        id_1 = '123'
        name_1 = 'State 1'
        State.create(self.exploration, name_1, state_id=id_1)
        self.assertEqual(
            State._get_id_from_name(name_1, self.exploration), id_1)

        with self.assertRaises(Exception):
            State._get_id_from_name('fake_name', self.exploration)

        self.assertEqual(
            State._get_id_from_name(feconf.END_DEST, self.exploration),
            feconf.END_DEST)
