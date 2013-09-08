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

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rule_domain
from core.domain import stats_domain
from core.domain import stats_services

import test_utils


class EventHandlerUnitTests(test_utils.GenericTestBase):
    """Test the event handler methods."""

    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR
    SUBMIT_HANDLER = stats_services.SUBMIT_HANDLER_NAME

    def test_record_state_hit(self):
        stats_services.EventHandler.record_state_hit('eid', 'sid', True)

        counter = stats_domain.StateCounter.get('eid', 'sid')
        self.assertEquals(counter.first_entry_count, 1)
        self.assertEquals(counter.subsequent_entries_count, 0)
        self.assertEquals(counter.resolved_answer_count, 0)
        self.assertEquals(counter.active_answer_count, 0)
        self.assertEquals(counter.total_entry_count, 1)
        self.assertEquals(counter.no_answer_count, 1)

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {})

        stats_services.EventHandler.record_state_hit('eid', 'sid', False)

        counter = stats_domain.StateCounter.get('eid', 'sid')
        self.assertEquals(counter.first_entry_count, 1)
        self.assertEquals(counter.subsequent_entries_count, 1)
        self.assertEquals(counter.resolved_answer_count, 0)
        self.assertEquals(counter.active_answer_count, 0)
        self.assertEquals(counter.total_entry_count, 2)
        self.assertEquals(counter.no_answer_count, 2)

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {})

    def test_record_answer_submitted(self):
        stats_services.EventHandler.record_state_hit('eid', 'sid', True)
        stats_services.EventHandler.record_answer_submitted(
            'eid', 'sid', self.SUBMIT_HANDLER, 'Rule', 'answer')

        counter = stats_domain.StateCounter.get('eid', 'sid')
        self.assertEquals(counter.first_entry_count, 1)
        self.assertEquals(counter.subsequent_entries_count, 0)
        self.assertEquals(counter.total_entry_count, 1)
        self.assertEquals(counter.resolved_answer_count, 0)
        self.assertEquals(counter.active_answer_count, 1)
        self.assertEquals(counter.no_answer_count, 0)

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, 'Rule')
        self.assertEquals(answer_log.answers, {'answer': 1})

        stats_services.EventHandler.record_state_hit('eid', 'sid', False)
        stats_services.EventHandler.record_answer_submitted(
            'eid', 'sid', self.SUBMIT_HANDLER, 'Rule', 'answer')

        counter = stats_domain.StateCounter.get('eid', 'sid')
        self.assertEquals(counter.first_entry_count, 1)
        self.assertEquals(counter.subsequent_entries_count, 1)
        self.assertEquals(counter.total_entry_count, 2)
        self.assertEquals(counter.resolved_answer_count, 0)
        self.assertEquals(counter.active_answer_count, 2)
        self.assertEquals(counter.no_answer_count, 0)

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, 'Rule')
        self.assertEquals(answer_log.answers, {'answer': 2})

        stats_services.EventHandler.record_state_hit('eid', 'sid', False)

        counter = stats_domain.StateCounter.get('eid', 'sid')
        self.assertEquals(counter.first_entry_count, 1)
        self.assertEquals(counter.subsequent_entries_count, 2)
        self.assertEquals(counter.total_entry_count, 3)
        self.assertEquals(counter.resolved_answer_count, 0)
        self.assertEquals(counter.active_answer_count, 2)
        self.assertEquals(counter.no_answer_count, 1)

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, 'Rule')
        self.assertEquals(answer_log.answers, {'answer': 2})

    def test_resolve_answers_for_default_rule(self):
        stats_services.EventHandler.record_state_hit('eid', 'sid', True)

        # Submit three answers.
        stats_services.EventHandler.record_answer_submitted(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR, 'a1')
        stats_services.EventHandler.record_answer_submitted(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR, 'a2')
        stats_services.EventHandler.record_answer_submitted(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR, 'a3')

        counter = stats_domain.StateCounter.get('eid', 'sid')
        self.assertEquals(counter.resolved_answer_count, 0)
        self.assertEquals(counter.active_answer_count, 3)

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(
            answer_log.answers, {'a1': 1, 'a2': 1, 'a3': 1})

        # Nothing changes if you try to resolve an invalid answer.
        stats_services.EventHandler.resolve_answers_for_default_rule(
            'eid', 'sid', self.SUBMIT_HANDLER, ['fake_answer'])
        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(
            answer_log.answers, {'a1': 1, 'a2': 1, 'a3': 1})

        # Resolve two answers.
        stats_services.EventHandler.resolve_answers_for_default_rule(
            'eid', 'sid', self.SUBMIT_HANDLER, ['a1', 'a2'])

        counter = stats_domain.StateCounter.get('eid', 'sid')
        self.assertEquals(counter.resolved_answer_count, 2)
        self.assertEquals(counter.active_answer_count, 1)

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'a3': 1})

        # Nothing changes if you try to resolve an answer that has already
        # been resolved.
        stats_services.EventHandler.resolve_answers_for_default_rule(
            'eid', 'sid', self.SUBMIT_HANDLER, ['a1'])
        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'a3': 1})

        # Resolve the last answer.
        stats_services.EventHandler.resolve_answers_for_default_rule(
            'eid', 'sid', self.SUBMIT_HANDLER, ['a3'])

        counter = stats_domain.StateCounter.get('eid', 'sid')
        self.assertEquals(counter.resolved_answer_count, 3)
        self.assertEquals(counter.active_answer_count, 0)

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, 'Rule')
        self.assertEquals(answer_log.answers, {})


class StatsServicesUnitTests(test_utils.GenericTestBase):
    """Test the statistics services."""

    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR
    SUBMIT_HANDLER = stats_services.SUBMIT_HANDLER_NAME

    def test_delete_all_stats(self):
        stats_services.EventHandler.record_answer_submitted(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR, '1')

        self.assertEqual(stats_domain.StateCounter.get(
            'eid', 'sid').active_answer_count, 1)
        self.assertEqual(stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR
        ).total_answer_count, 1)

        stats_services.delete_all_stats()
        self.assertEqual(stats_domain.StateCounter.get(
            'eid', 'sid').active_answer_count, 0)
        self.assertEqual(stats_domain.StateRuleAnswerLog.get(
            'eid', 'sid', self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR
        ).total_answer_count, 0)


class TopImprovableStatesUnitTests(test_utils.GenericTestBase):
    """Test the get_top_improvable_states() function."""

    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR
    SUBMIT_HANDLER = stats_services.SUBMIT_HANDLER_NAME

    def test_get_top_improvable_states(self):
        exp = exp_services.get_exploration_by_id(exp_services.create_new(
            'fake@user.com', 'exploration', 'category', 'eid'))
        state_id = exp.init_state_id

        for _ in range(5):
            stats_services.EventHandler.record_state_hit('eid', state_id, True)

        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER,
            self.DEFAULT_RULESPEC_STR, '1')
        for _ in range(2):
            stats_services.EventHandler.record_answer_submitted(
                'eid', state_id, self.SUBMIT_HANDLER,
                self.DEFAULT_RULESPEC_STR, '2')

        expected_top_state = {
            'exp_id': 'eid', 'type': 'default', 'rank': 3,
            'state_id': exp.init_state_id
        }

        states = stats_services.get_top_improvable_states(['eid'], 10)
        self.assertEquals(len(states), 1)
        self.assertDictContainsSubset(expected_top_state, states[0])

    def test_single_default_rule_hit(self):
        exp = exp_services.get_exploration_by_id(exp_services.create_new(
            'fake@user.com', 'exploration', 'category', 'eid'))
        state_id = exp.init_state_id

        stats_services.EventHandler.record_state_hit('eid', state_id, True)
        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER,
            self.DEFAULT_RULESPEC_STR, '1')

        expected_top_state = {
            'exp_id': 'eid', 'type': 'default', 'rank': 1,
            'state_id': exp.init_state_id
        }

        states = stats_services.get_top_improvable_states(['eid'], 2)
        self.assertEquals(len(states), 1)
        self.assertDictContainsSubset(expected_top_state, states[0])

    def test_no_improvement_flag_hit(self):
        exp = exp_services.get_exploration_by_id(exp_services.create_new(
            'fake@user.com', 'exploration', 'category', 'eid'))

        not_default_rule_spec = exp_domain.RuleSpec({
            'rule_type': rule_domain.ATOMIC_RULE_TYPE,
            'name': 'NotDefault',
            'inputs': {},
            'subject': 'answer'
        }, exp.init_state.id, [], [])
        exp.init_state.widget.handlers[0].rule_specs = [
            not_default_rule_spec, exp_domain.DEFAULT_RULESPEC
        ]
        exp_services.save_state('fake@user.com', exp.id, exp.init_state)

        stats_services.EventHandler.record_state_hit(
            'eid', exp.init_state.id, True)
        stats_services.EventHandler.record_answer_submitted(
            'eid', exp.init_state.id, self.SUBMIT_HANDLER,
            str(not_default_rule_spec), '1')

        states = stats_services.get_top_improvable_states(['eid'], 1)
        self.assertEquals(len(states), 0)

    def test_incomplete_and_default_flags(self):
        exp = exp_services.get_exploration_by_id(exp_services.create_new(
            'fake@user.com', 'exploration', 'category', 'eid'))
        state_id = exp.init_state_id

        # Hit the default rule once, and fail to answer twice. The result
        # should be classified as incomplete.

        for _ in range(3):
            stats_services.EventHandler.record_state_hit('eid', state_id, True)

        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER,
            self.DEFAULT_RULESPEC_STR, '1')

        states = stats_services.get_top_improvable_states(['eid'], 2)
        self.assertEquals(len(states), 1)
        self.assertEquals(states[0]['rank'], 2)
        self.assertEquals(states[0]['type'], 'incomplete')

        # Now hit the default two more times. The result should be classified
        # as default.

        for i in range(2):
            stats_services.EventHandler.record_state_hit('eid', state_id, True)
            stats_services.EventHandler.record_answer_submitted(
                'eid', state_id, self.SUBMIT_HANDLER,
                self.DEFAULT_RULESPEC_STR, '1')

        states = stats_services.get_top_improvable_states(['eid'], 2)
        self.assertEquals(len(states), 1)
        self.assertEquals(states[0]['rank'], 3)
        self.assertEquals(states[0]['type'], 'default')

    def test_two_state_default_hit(self):
        exp = exp_services.get_exploration_by_id(exp_services.create_new(
            'fake@user.com', 'exploration', 'category', 'eid'))
        SECOND_STATE = 'State 2'
        exp_services.add_state('fake@user.com', exp.id, SECOND_STATE)
        exp = exp_services.get_exploration_by_id('eid')
        state1_id = exp.init_state_id
        second_state = exp_services.get_state_by_name('eid', SECOND_STATE)
        state2_id = second_state.id

        # Hit the default rule of state 1 once, and the default rule of state 2
        # twice.
        stats_services.EventHandler.record_state_hit('eid', state1_id, True)
        stats_services.EventHandler.record_answer_submitted(
            'eid', state1_id, self.SUBMIT_HANDLER,
            self.DEFAULT_RULESPEC_STR, '1')

        for i in range(2):
            stats_services.EventHandler.record_state_hit(
                'eid', state2_id, True)
            stats_services.EventHandler.record_answer_submitted(
                'eid', state2_id, self.SUBMIT_HANDLER,
                self.DEFAULT_RULESPEC_STR, '1')

        states = stats_services.get_top_improvable_states(['eid'], 5)
        self.assertEquals(len(states), 2)
        self.assertEquals(states[0]['rank'], 2)
        self.assertEquals(states[0]['type'], 'default')
        self.assertEquals(states[0]['state_id'], state2_id)
        self.assertEquals(states[1]['rank'], 1)
        self.assertEquals(states[1]['type'], 'default')
        self.assertEquals(states[1]['state_id'], state1_id)

        # Hit the default rule of state 1 two more times.

        for i in range(2):
            stats_services.EventHandler.record_state_hit(
                'eid', state1_id, True)
            stats_services.EventHandler.record_answer_submitted(
                'eid', state1_id, self.SUBMIT_HANDLER,
                self.DEFAULT_RULESPEC_STR, '1')

        states = stats_services.get_top_improvable_states(['eid'], 5)
        self.assertEquals(len(states), 2)
        self.assertEquals(states[0]['rank'], 3)
        self.assertEquals(states[0]['type'], 'default')
        self.assertEquals(states[0]['state_id'], state1_id)
        self.assertEquals(states[1]['rank'], 2)
        self.assertEquals(states[1]['type'], 'default')
        self.assertEquals(states[1]['state_id'], state2_id)

        # Try getting just the top improvable state.
        states = stats_services.get_top_improvable_states(['eid'], 1)
        self.assertEquals(len(states), 1)
        self.assertEquals(states[0]['rank'], 3)
        self.assertEquals(states[0]['type'], 'default')
        self.assertEquals(states[0]['state_id'], state1_id)
