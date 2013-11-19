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

from core.domain import exp_domain
from core.domain import exp_services
import utils


class FakeExploration(exp_domain.Exploration):
    """Allows dummy explorations to be created and commited."""

    def __init__(self, exp_id='fake_exploration_id', owner_id=None):
        """Creates a dummy exploration."""
        self.id = exp_id
        self.title = 'title'
        self.category = 'category'
        self.state_ids = []
        self.parameters = []
        self.is_public = False
        self.editor_ids = [owner_id] if owner_id else []

    def put(self):
        """The put() method is patched to make no commits to the datastore."""
        self._pre_put_hook()


class StateDomainUnitTests(test_utils.GenericTestBase):
    """Test the state domain object."""

    def test_validation(self):
        """Test validation of states."""
        state = exp_domain.State('id', 'name', [], [], None)

        state.name = '_INVALID_'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid character _ in state name'):
            state.validate()


class ExplorationDomainUnitTests(test_utils.GenericTestBase):
    """Test the exploration domain object."""

    def test_validation(self):
        """Test validation of explorations."""
        exploration = FakeExploration()
        USER_ID = 'user_id'

        # The 'state_ids property must be a non-empty list of strings
        # representing State ids.
        exploration.state_ids = []
        with self.assertRaisesRegexp(
                utils.ValidationError, 'exploration has no states'):
            exp_services.save_exploration(USER_ID, exploration)
        exploration.state_ids = ['A string']
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid state_id'):
            exp_services.save_exploration(USER_ID, exploration)

        new_state = exp_domain.State(
            'Initial state id', 'name', [], [], None)
        exp_services.save_states(USER_ID, exploration.id, [new_state])
        exploration.state_ids = ['Initial state id']

        # There must be at least one editor id.
        exploration.editor_ids = []
        with self.assertRaisesRegexp(
                utils.ValidationError, 'exploration has no editors'):
            exp_services.save_exploration(USER_ID, exploration)

        exploration.editor_ids = [USER_ID]
        exploration.title = 'Hello #'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid character #'):
            exp_services.save_exploration(USER_ID, exploration)

    def test_init_state_property(self):
        """Test the init_state property."""
        exploration = FakeExploration(owner_id='owner@example.com')
        USER_ID = 'user_id'

        INIT_STATE_ID = 'init_state_id'
        INIT_STATE_NAME = 'init state name'
        init_state = exp_domain.State(
            INIT_STATE_ID, INIT_STATE_NAME, [], [], None)
        exp_services.save_states(USER_ID, exploration.id, [init_state])

        exploration.state_ids = [INIT_STATE_ID]
        self.assertEqual(exploration.init_state_id, INIT_STATE_ID)
        self.assertEqual(exploration.init_state.name, INIT_STATE_NAME)

        second_state = exp_domain.State(
            'unused_second_state', 'unused name', [], [], None)
        exp_services.save_states(USER_ID, exploration.id, [second_state])
        exploration.state_ids.append(second_state.id)
        self.assertEqual(exploration.init_state_id, INIT_STATE_ID)
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
