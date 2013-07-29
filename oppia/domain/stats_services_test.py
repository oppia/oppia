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

from oppia.domain import exp_domain
from oppia.domain import exp_services
from oppia.domain import stats_services
import oppia.storage.state.models as state_models
import test_utils


class StatsServicesUnitTests(test_utils.AppEngineTestBase):
    """Test the statistics services."""

    def setUp(self):
        super(StatsServicesUnitTests, self).setUp()
        self.user_id = 'fake@user.com'

    def test_unresolved_answers_tally(self):
        self.assertEquals(
            stats_services.get_unresolved_answers_for_default_rule(
                'eid', 'sid'), {})

        stats_services.EventHandler.record_answer_submitted(
            'eid', 'sid', state_models.DEFAULT_RULE_SPEC_REPR, 'answer1')
        self.assertEquals(
            stats_services.get_unresolved_answers_for_default_rule(
                'eid', 'sid'), {'answer1': 1}
        )

        stats_services.EventHandler.record_answer_submitted(
            'eid', 'sid', state_models.DEFAULT_RULE_SPEC_REPR, 'answer1')
        self.assertEquals(
            stats_services.get_unresolved_answers_for_default_rule(
                'eid', 'sid'), {'answer1': 2}
        )

        stats_services.EventHandler.resolve_answers_for_default_rule(
            'eid', 'sid', ['answer1'])
        self.assertEquals(
            stats_services.get_unresolved_answers_for_default_rule(
                'eid', 'sid'), {}
        )

    def test_get_top_ten_improvable_states(self):
        exp = exp_domain.Exploration.get(exp_services.create_new(
            self.user_id, 'exploration', 'category', 'eid'))

        state_id = exp.init_state_id
        default_rule_spec = state_models.DEFAULT_RULE_SPEC_REPR

        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, default_rule_spec, '1')
        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, default_rule_spec, '2')
        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, default_rule_spec, '1')

        stats_services.EventHandler.record_state_hit('eid', state_id, True)
        stats_services.EventHandler.record_state_hit('eid', state_id, True)
        stats_services.EventHandler.record_state_hit('eid', state_id, True)
        stats_services.EventHandler.record_state_hit('eid', state_id, True)
        stats_services.EventHandler.record_state_hit('eid', state_id, True)

        states = stats_services.get_top_ten_improvable_states(['eid'])
        self.assertEquals(len(states), 1)
        self.assertEquals(states[0]['exp_id'], 'eid')
        self.assertEquals(states[0]['type'], 'default')
        self.assertEquals(states[0]['rank'], 3)
        self.assertEquals(states[0]['state_id'], exp.init_state_id)

    def test_single_default_rule_hit(self):
        exp = exp_domain.Exploration.get(exp_services.create_new(
            self.user_id, 'exploration', 'category', 'eid'))

        state_id = exp.init_state_id
        default_rule_spec = state_models.DEFAULT_RULE_SPEC_REPR

        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, default_rule_spec, '1')
        stats_services.EventHandler.record_state_hit('eid', state_id, True)

        states = stats_services.get_top_ten_improvable_states(['eid'])
        self.assertEquals(len(states), 1)
        self.assertEquals(states[0]['exp_id'], 'eid')
        self.assertEquals(states[0]['type'], 'default')
        self.assertEquals(states[0]['rank'], 1)
        self.assertEquals(states[0]['state_id'], exp.init_state_id)

    def test_no_improvement_flag_hit(self):
        exp = exp_domain.Exploration.get(exp_services.create_new(
            self.user_id, 'exploration', 'category', 'eid'))

        init_state = exp.init_state
        init_state.widget.handlers[0].rule_specs = [
            state_models.RuleSpec(name='NotDefault', dest=init_state.id),
            state_models.RuleSpec(name='Default', dest=init_state.id),
        ]
        init_state.put()

        stats_services.EventHandler.record_answer_submitted(
            'eid', init_state.id,
            str(state_models.RuleSpec(name='NotDefault', dest=init_state.id)),
            '1')
        stats_services.EventHandler.record_state_hit('eid', init_state.id, True)

        states = stats_services.get_top_ten_improvable_states(['eid'])
        self.assertEquals(len(states), 0)

    def test_incomplete_and_default_flags(self):
        exp = exp_domain.Exploration.get(exp_services.create_new(
            self.user_id, 'exploration', 'category', 'eid'))

        state_id = exp.init_state_id
        default_rule_spec = state_models.DEFAULT_RULE_SPEC_REPR

        # Hit the default once, and do an incomplete twice. The result should
        # be classified as incomplete.

        for i in range(3):
            stats_services.EventHandler.record_state_hit('eid', state_id, True)

        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, default_rule_spec, '1')

        states = stats_services.get_top_ten_improvable_states(['eid'])
        self.assertEquals(len(states), 1)
        self.assertEquals(states[0]['rank'], 2)
        self.assertEquals(states[0]['type'], 'incomplete')

        # Now hit the default two more times. The result should be classified
        # as default.

        for i in range(2):
            stats_services.EventHandler.record_state_hit('eid', state_id, True)
            stats_services.EventHandler.record_answer_submitted(
                'eid', state_id,
                str(state_models.RuleSpec(name='Default', dest=state_id)), '1')

        states = stats_services.get_top_ten_improvable_states(['eid'])
        self.assertEquals(len(states), 1)
        self.assertEquals(states[0]['rank'], 3)
        self.assertEquals(states[0]['type'], 'default')

    def test_two_state_default_hit(self):
        SECOND_STATE = 'State 2'

        exp = exp_domain.Exploration.get(exp_services.create_new(
            self.user_id, 'exploration', 'category', 'eid'))
        second_state = exp.add_state(SECOND_STATE)

        state_1_id = exp.init_state_id
        state_2_id = second_state.id

        # Hit the default rule of state 1 once, and the default rule of state 2
        # twice.
        stats_services.EventHandler.record_state_hit('eid', state_1_id, True)
        stats_services.EventHandler.record_answer_submitted(
            'eid', state_1_id,
            str(state_models.RuleSpec(name='Default', dest=state_1_id)), '1')

        for i in range(2):
            stats_services.EventHandler.record_state_hit(
                'eid', state_2_id, True)
            stats_services.EventHandler.record_answer_submitted(
                'eid', state_2_id,
                str(state_models.RuleSpec(name='Default', dest=state_2_id)),
                '1')

        states = stats_services.get_top_ten_improvable_states(['eid'])
        self.assertEquals(len(states), 2)
        self.assertEquals(states[0]['rank'], 2)
        self.assertEquals(states[0]['type'], 'default')
        self.assertEquals(states[0]['state_id'], state_2_id)
        self.assertEquals(states[1]['rank'], 1)
        self.assertEquals(states[1]['type'], 'default')
        self.assertEquals(states[1]['state_id'], state_1_id)

        # Hit the default rule of state 1 two more times.

        for i in range(2):
            stats_services.EventHandler.record_state_hit(
                'eid', state_1_id, True)
            stats_services.EventHandler.record_answer_submitted(
                'eid', state_1_id,
                str(state_models.RuleSpec(name='Default', dest=state_1_id)),
                '1')

        states = stats_services.get_top_ten_improvable_states(['eid'])
        self.assertEquals(len(states), 2)
        self.assertEquals(states[0]['rank'], 3)
        self.assertEquals(states[0]['type'], 'default')
        self.assertEquals(states[0]['state_id'], state_1_id)
        self.assertEquals(states[1]['rank'], 2)
        self.assertEquals(states[1]['type'], 'default')
        self.assertEquals(states[1]['state_id'], state_2_id)
