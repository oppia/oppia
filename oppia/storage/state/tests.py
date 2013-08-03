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
from oppia.domain import exp_services
from oppia.platform import models
(state_models,) = models.Registry.import_models([models.NAMES.state])
import test_utils


class StateModelUnitTests(test_utils.AppEngineTestBase):
    """Test the state model."""

    def setUp(self):
        """Loads the default widgets and creates a sample exploration."""
        super(StateModelUnitTests, self).setUp()
        self.user_id = 'test@example.com'

    def test_state_class(self):
        """Test State Class."""
        state = state_models.State(id='The exploration hash id')

        # A new state should have a default name property.
        self.assertEqual(state.name, feconf.DEFAULT_STATE_NAME)

        state.put()

    def test_create_and_get_state(self):
        """Test creation and retrieval of states."""
        eid = 'A exploration_id'
        exploration = exp_services.get_exploration_by_id(
            exp_services.create_new(
                self.user_id, 'A title', 'A category', eid))

        id_1 = '123'
        name_1 = 'State 1'
        state_1 = exploration.add_state(name_1, state_id=id_1)

        fetched_state_1 = exploration.get_state_by_id(id_1)
        self.assertEqual(fetched_state_1, state_1)

        self.assertEqual(
            exp_services.get_state_by_name(eid, name_1), state_1)

        name_2 = 'fake_name'
        self.assertIsNone(exp_services.get_state_by_name(
            eid, name_2, strict=False))
        with self.assertRaisesRegexp(Exception, 'not found'):
            exp_services.get_state_by_name(eid, name_2, strict=True)
        # The default behavior is to fail noisily.
        with self.assertRaisesRegexp(Exception, 'not found'):
            exp_services.get_state_by_name(eid, name_2)
