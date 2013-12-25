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
import utils


class FakeExploration(exp_domain.Exploration):
    """Allows dummy explorations to be created and commited."""

    def __init__(self, exp_id='fake_exploration_id'):
        """Creates a dummy exploration."""
        # TODO(sll): Add tests to validate param_changes, default_skin and
        # version.
        self.id = exp_id
        self.title = ''
        self.category = ''
        self.init_state_name = ''
        self.states = {}
        self.parameters = []
        self.param_specs = {}

    def put(self):
        """The put() method is patched to make no commits to the datastore."""
        self._pre_put_hook()


class ExplorationDomainUnitTests(test_utils.GenericTestBase):
    """Test the exploration domain object."""

    def test_validation(self):
        """Test validation of explorations."""
        exploration = FakeExploration()

        with self.assertRaisesRegexp(
                utils.ValidationError, 'exploration has no title'):
            exploration.validate()

        exploration.title = 'Hello #'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid character #'):
            exploration.validate()

        exploration.title = 'Title'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'exploration has no category'):
            exploration.validate()

        exploration.category = 'Category'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'has no initial state name'):
            exploration.validate()

        exploration.init_state_name = 'initname'

        new_state = exp_domain.State(
            [], [], exp_domain.WidgetInstance.create_default_widget('name'))

        # The 'states' property must be a non-empty dict of states.
        exploration.states = {}
        with self.assertRaisesRegexp(
                utils.ValidationError, 'exploration has no states'):
            exploration.validate()
        exploration.states = {'A string #': new_state}
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid character # in state name'):
            exploration.validate()
        exploration.states = {'A string _': new_state}
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Invalid character _ in state name'):
            exploration.validate()

        exploration.states = {'Initial state name': new_state}

        with self.assertRaisesRegexp(
                utils.ValidationError,
                r'There is no state corresponding to .* initial state name.'):
            exploration.validate()

        exploration.states = {exploration.init_state_name: new_state}
        exploration.validate()

        exploration.param_specs = 'A string'
        with self.assertRaisesRegexp(
                utils.ValidationError, 'param_specs to be a dict'):
            exploration.validate()

        exploration.param_specs = {
            '@': {
                'obj_type': 'Int'
            }
        }
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Only parameter names with characters'):
            exploration.validate()

        exploration.param_specs = {
            'notAParamSpec': {
                'obj_type': 'Int'
            }
        }
        with self.assertRaisesRegexp(
                utils.ValidationError, 'Expected a ParamSpec'):
            exploration.validate()

        exploration.param_specs = {}
        exploration.validate()

    def test_is_demo_property(self):
        """Test the is_demo property."""
        demo = FakeExploration(exp_id='0')
        self.assertEqual(demo.is_demo, True)

        notdemo1 = FakeExploration(exp_id='a')
        self.assertEqual(notdemo1.is_demo, False)

        notdemo2 = FakeExploration(exp_id='abcd')
        self.assertEqual(notdemo2.is_demo, False)
