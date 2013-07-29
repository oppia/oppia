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

from oppia.domain import exp_domain
from oppia.domain import exp_services
from oppia.domain import stats_domain
from oppia.domain import stats_services


class StateCounterUnitTests(test_utils.AppEngineTestBase):
    """Test the state counter domain object."""

    def test_state_entry_counts(self):
        exp = exp_domain.Exploration.get(exp_services.create_new(
            'user_id', 'exploration', 'category', 'eid'))
        second_state = exp.add_state('State 2')

        state1_id = exp.init_state_id
        state2_id = second_state.id

        state1_counter = stats_domain.StateCounter.get('eid', state1_id)

        self.assertEquals(state1_counter.first_entry_count, 0)
        self.assertEquals(state1_counter.subsequent_entries_count, 0)
        self.assertEquals(state1_counter.resolved_answer_count, 0)
        self.assertEquals(state1_counter.active_answer_count, 0)
        self.assertEquals(state1_counter.total_entry_count, 0)
        self.assertEquals(state1_counter.no_answer_count, 0)

        stats_services.EventHandler.record_state_hit('eid', state1_id, True)

        state1_counter = stats_domain.StateCounter.get('eid', state1_id)

        self.assertEquals(state1_counter.first_entry_count, 1)
        self.assertEquals(state1_counter.subsequent_entries_count, 0)
        self.assertEquals(state1_counter.resolved_answer_count, 0)
        self.assertEquals(state1_counter.active_answer_count, 0)
        self.assertEquals(state1_counter.total_entry_count, 1)
        self.assertEquals(state1_counter.no_answer_count, 1)

        stats_services.EventHandler.record_state_hit('eid', state2_id, True)
        stats_services.EventHandler.record_state_hit('eid', state2_id, False)

        state1_counter = stats_domain.StateCounter.get('eid', state1_id)
        state2_counter = stats_domain.StateCounter.get('eid', state2_id)

        self.assertEquals(state1_counter.first_entry_count, 1)
        self.assertEquals(state1_counter.subsequent_entries_count, 0)
        self.assertEquals(state1_counter.resolved_answer_count, 0)
        self.assertEquals(state1_counter.active_answer_count, 0)
        self.assertEquals(state1_counter.total_entry_count, 1)
        self.assertEquals(state1_counter.no_answer_count, 1)

        self.assertEquals(state2_counter.first_entry_count, 1)
        self.assertEquals(state2_counter.subsequent_entries_count, 1)
        self.assertEquals(state2_counter.resolved_answer_count, 0)
        self.assertEquals(state2_counter.active_answer_count, 0)
        self.assertEquals(state2_counter.total_entry_count, 2)
        self.assertEquals(state2_counter.no_answer_count, 2)
