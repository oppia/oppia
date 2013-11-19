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
from core.domain import stats_domain
from core.domain import stats_services


class StateCounterUnitTests(test_utils.GenericTestBase):
    """Test the state counter domain object."""

    def test_state_entry_counts(self):
        exp = exp_services.get_exploration_by_id(exp_services.create_new(
            'user_id', 'exploration', 'category', 'eid'))
        second_state_id = exp_services.add_states(
            'user_id', exp.id, ['State 2'])[0]
        second_state = exp_services.get_state_by_id(exp.id, second_state_id)

        state1_id = exp.init_state_id
        state2_id = second_state.id

        state1_counter = stats_domain.StateCounter.get('eid', state1_id)

        self.assertEquals(state1_counter.first_entry_count, 0)
        self.assertEquals(state1_counter.subsequent_entries_count, 0)
        self.assertEquals(state1_counter.total_entry_count, 0)
        self.assertEquals(state1_counter.resolved_answer_count, 0)
        self.assertEquals(state1_counter.active_answer_count, 0)
        self.assertEquals(state1_counter.no_answer_count, 0)

        stats_services.EventHandler.record_state_hit('eid', state1_id, True)

        state1_counter = stats_domain.StateCounter.get('eid', state1_id)

        self.assertEquals(state1_counter.first_entry_count, 1)
        self.assertEquals(state1_counter.subsequent_entries_count, 0)
        self.assertEquals(state1_counter.total_entry_count, 1)
        self.assertEquals(state1_counter.resolved_answer_count, 0)
        self.assertEquals(state1_counter.active_answer_count, 0)
        self.assertEquals(state1_counter.no_answer_count, 1)

        stats_services.EventHandler.record_state_hit('eid', state2_id, True)
        stats_services.EventHandler.record_state_hit('eid', state2_id, False)

        state1_counter = stats_domain.StateCounter.get('eid', state1_id)
        state2_counter = stats_domain.StateCounter.get('eid', state2_id)

        self.assertEquals(state1_counter.first_entry_count, 1)
        self.assertEquals(state1_counter.subsequent_entries_count, 0)
        self.assertEquals(state1_counter.total_entry_count, 1)
        self.assertEquals(state1_counter.resolved_answer_count, 0)
        self.assertEquals(state1_counter.active_answer_count, 0)
        self.assertEquals(state1_counter.no_answer_count, 1)

        self.assertEquals(state2_counter.first_entry_count, 1)
        self.assertEquals(state2_counter.subsequent_entries_count, 1)
        self.assertEquals(state2_counter.total_entry_count, 2)
        self.assertEquals(state2_counter.resolved_answer_count, 0)
        self.assertEquals(state2_counter.active_answer_count, 0)
        self.assertEquals(state2_counter.no_answer_count, 2)


class StateRuleAnswerLogUnitTests(test_utils.GenericTestBase):
    """Test the state rule answer log domain object."""

    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR
    SUBMIT_HANDLER = stats_services.SUBMIT_HANDLER_NAME

    def test_state_rule_answer_logs(self):
        exp = exp_services.get_exploration_by_id(exp_services.create_new(
            'user_id', 'exploration', 'category', 'eid'))
        state_id = exp.init_state_id

        stats_services.EventHandler.record_state_hit(
            'eid', state_id, True)

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {})
        self.assertEquals(answer_log.total_answer_count, 0)
        self.assertEquals(answer_log.get_top_answers(2), [])

        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER,
            self.DEFAULT_RULESPEC_STR, 'answer1')

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer1': 1})
        self.assertEquals(answer_log.total_answer_count, 1)
        self.assertEquals(answer_log.get_top_answers(1), [('answer1', 1)])
        self.assertEquals(answer_log.get_top_answers(2), [('answer1', 1)])

        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER,
            self.DEFAULT_RULESPEC_STR, 'answer1')
        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR,
            'answer2')

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer1': 2, 'answer2': 1})
        self.assertEquals(answer_log.total_answer_count, 3)
        self.assertEquals(
            answer_log.get_top_answers(1), [('answer1', 2)])
        self.assertEquals(
            answer_log.get_top_answers(2), [('answer1', 2), ('answer2', 1)])

        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR,
            'answer2')
        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR,
            'answer2')

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer1': 2, 'answer2': 3})
        self.assertEquals(answer_log.total_answer_count, 5)
        self.assertEquals(
            answer_log.get_top_answers(1), [('answer2', 3)])
        self.assertEquals(
            answer_log.get_top_answers(2), [('answer2', 3), ('answer1', 2)])

    def test_recording_answer_for_different_rules(self):
        exp = exp_services.get_exploration_by_id(exp_services.create_new(
            'user_id', 'exploration', 'category', 'eid'))
        state_id = exp.init_state_id

        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR,
            'answer1')
        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER, 'a_different_rule_repr',
            'answer2')

        default_rule_answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(default_rule_answer_log.answers, {'answer1': 1})
        self.assertEquals(default_rule_answer_log.total_answer_count, 1)

        other_rule_answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_id, self.SUBMIT_HANDLER, 'a_different_rule_repr')
        self.assertEquals(other_rule_answer_log.answers, {'answer2': 1})
        self.assertEquals(other_rule_answer_log.total_answer_count, 1)

    def test_resolving_answers(self):
        exp = exp_services.get_exploration_by_id(exp_services.create_new(
            'user_id', 'exploration', 'category', 'eid'))
        state_id = exp.init_state_id

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {})

        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER,
            self.DEFAULT_RULESPEC_STR, 'answer1')
        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER,
            self.DEFAULT_RULESPEC_STR, 'answer1')
        stats_services.EventHandler.record_answer_submitted(
            'eid', state_id, self.SUBMIT_HANDLER,
            self.DEFAULT_RULESPEC_STR, 'answer2')

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer1': 2, 'answer2': 1})
        self.assertEquals(answer_log.total_answer_count, 3)

        stats_services.EventHandler.resolve_answers_for_default_rule(
            'eid', state_id, self.SUBMIT_HANDLER, ['answer1'])

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_id, self.SUBMIT_HANDLER, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer2': 1})
        self.assertEquals(answer_log.total_answer_count, 1)
