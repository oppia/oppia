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

from apps.statistics.models import Counter
from apps.statistics.models import Journal
from apps.statistics.models import Statistics
from apps.statistics.models import EventHandler
from apps.exploration.models import Exploration
from apps.widget.models import InteractiveWidget
from apps.state.models import Rule

from google.appengine.api.users import User


class StatisticsUnitTests(test_utils.AppEngineTestBase):
    """Test the exploration model."""

    def test_counter_class(self):
        """Test Counter Class."""
        o = Counter()
        o.name = 'The name'
        o.value = 2
        self.assertEqual(o.name, 'The name')
        self.assertEqual(o.value, 2)

    def test_journal_class(self):
        """Test Journal Class."""
        o = Journal()
        o.name = 'The name'
        o.values = ['The values']
        self.assertEqual(o.name, 'The name')
        self.assertEqual(o.values, ['The values'])

    def test_get_top_ten_improvable_states(self):
        InteractiveWidget.load_default_widgets()
        exp = Exploration.create(User(email='fake@user.com'), 'exploration', 'category', 'eid')

        state_id = exp.init_state.get().id

        EventHandler.record_rule_hit('eid', state_id, Rule(name='Default', dest=state_id), '1') 
        EventHandler.record_rule_hit('eid', state_id, Rule(name='Default', dest=state_id), '2') 
        EventHandler.record_rule_hit('eid', state_id, Rule(name='Default', dest=state_id), '1') 

        EventHandler.record_state_hit('eid', state_id)
        EventHandler.record_state_hit('eid', state_id)
        EventHandler.record_state_hit('eid', state_id)
        EventHandler.record_state_hit('eid', state_id)
        EventHandler.record_state_hit('eid', state_id)

        states = Statistics.get_top_ten_improvable_states(['eid'])
        self.assertEquals(len(states), 1)
        self.assertEquals(states[0]['exp_id'], 'eid')
        self.assertEquals(states[0]['type'], 'default')
        self.assertEquals(states[0]['rank'], 3)
        self.assertEquals(states[0]['state_id'], exp.init_state.get().id)
