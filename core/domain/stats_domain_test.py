# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import event_services
from core.domain import stats_domain
from core.domain import stats_services
from core.tests import test_utils


class StateRuleAnswerLogUnitTests(test_utils.GenericTestBase):
    """Test the state rule answer log domain object."""

    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR

    def test_state_rule_answer_logs(self):
        exp = exp_domain.Exploration.create_default_exploration('eid')
        exp_services.save_new_exploration('user_id', exp)
        SESSION_ID = 'SESSION_ID'
        TIME_SPENT = 5.0
        PARAMS = {}

        state_name = exp.init_state_name

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {})
        self.assertEquals(answer_log.total_answer_count, 0)
        self.assertEquals(answer_log.get_top_answers(2), [])

        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, SESSION_ID,
            TIME_SPENT, PARAMS, 'answer1')

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer1': 1})
        self.assertEquals(answer_log.total_answer_count, 1)
        self.assertEquals(answer_log.get_top_answers(1), [('answer1', 1)])
        self.assertEquals(answer_log.get_top_answers(2), [('answer1', 1)])

        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, SESSION_ID,
            TIME_SPENT, PARAMS, 'answer1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, SESSION_ID,
            TIME_SPENT, PARAMS, 'answer2')

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer1': 2, 'answer2': 1})
        self.assertEquals(answer_log.total_answer_count, 3)
        self.assertEquals(
            answer_log.get_top_answers(1), [('answer1', 2)])
        self.assertEquals(
            answer_log.get_top_answers(2), [('answer1', 2), ('answer2', 1)])

        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, SESSION_ID,
            TIME_SPENT, PARAMS, 'answer2')
        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, SESSION_ID,
            TIME_SPENT, PARAMS, 'answer2')

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer1': 2, 'answer2': 3})
        self.assertEquals(answer_log.total_answer_count, 5)
        self.assertEquals(
            answer_log.get_top_answers(1), [('answer2', 3)])
        self.assertEquals(
            answer_log.get_top_answers(2), [('answer2', 3), ('answer1', 2)])

    def test_recording_answer_for_different_rules(self):
        exp = exp_domain.Exploration.create_default_exploration('eid')
        exp_services.save_new_exploration('user_id', exp)

        rule = exp_domain.RuleSpec.from_dict({
            'rule_type': 'LessThan',
            'inputs': {'x': 5}
        })
        rule_str = rule.stringify_classified_rule()

        SESSION_ID = 'SESSION_ID'
        TIME_SPENT = 5.0
        PARAMS = {}

        state_name = exp.init_state_name

        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, SESSION_ID,
            TIME_SPENT, PARAMS, 'answer1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name, rule_str, SESSION_ID, TIME_SPENT, PARAMS,
            'answer2')

        default_rule_answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(default_rule_answer_log.answers, {'answer1': 1})
        self.assertEquals(default_rule_answer_log.total_answer_count, 1)

        other_rule_answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_name, rule_str)
        self.assertEquals(other_rule_answer_log.answers, {'answer2': 1})
        self.assertEquals(other_rule_answer_log.total_answer_count, 1)

    def test_resolving_answers(self):
        exp = exp_domain.Exploration.create_default_exploration('eid')
        exp_services.save_new_exploration('user_id', exp)
        SESSION_ID = 'SESSION_ID'
        TIME_SPENT = 5.0
        PARAMS = {}

        state_name = exp.init_state_name

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {})

        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, SESSION_ID,
            TIME_SPENT, PARAMS, 'answer1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, SESSION_ID,
            TIME_SPENT, PARAMS, 'answer1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, SESSION_ID,
            TIME_SPENT, PARAMS, 'answer2')

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer1': 2, 'answer2': 1})
        self.assertEquals(answer_log.total_answer_count, 3)

        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid', state_name, ['answer1'])

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer2': 1})
        self.assertEquals(answer_log.total_answer_count, 1)


class StateAnswersTests(test_utils.GenericTestBase):
    """Test the state answers domain object."""

    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR

    def test_record_answer(self):
        self.save_new_default_exploration('eid', 'fake@user.com')
        exp = exp_services.get_exploration_by_id('eid')

        FIRST_STATE_NAME = exp.init_state_name
        SECOND_STATE_NAME = 'State 2'
        exp_services.update_exploration('fake@user.com', 'eid', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': FIRST_STATE_NAME,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput',
        }, {
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': SECOND_STATE_NAME,
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': SECOND_STATE_NAME,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput',
        }], 'Add new state')
        exp = exp_services.get_exploration_by_id('eid')

        SESSION_ID = 'SESSION_ID'
        TIME_SPENT = 5.0
        exp_version = exp.version
        PARAMS = {}

        for state_name in [FIRST_STATE_NAME, SECOND_STATE_NAME]:
            state_answers = stats_services.get_state_answers(
                'eid', exp_version, state_name)
            self.assertEquals(state_answers, None)

        # answer is a string
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, FIRST_STATE_NAME, self.DEFAULT_RULESPEC_STR,
            'sid1', TIME_SPENT, PARAMS, 'answer1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, FIRST_STATE_NAME, self.DEFAULT_RULESPEC_STR,
            'sid2', TIME_SPENT, PARAMS, 'answer1')
        # answer is a dict
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, FIRST_STATE_NAME, self.DEFAULT_RULESPEC_STR,
            'sid1', TIME_SPENT, PARAMS, {'x': 1.0, 'y': 5.0})
        # answer is a list
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, SECOND_STATE_NAME, self.DEFAULT_RULESPEC_STR,
            'sid3', TIME_SPENT, PARAMS, [2, 4, 8])
        # answer is a unicode string
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, SECOND_STATE_NAME, self.DEFAULT_RULESPEC_STR,
            'sid4', TIME_SPENT, PARAMS, self.UNICODE_TEST_STRING)

        expected_answers_list1 = [{
            'answer_value': 'answer1', 'time_spent_in_sec': 5.0,
            'rule_str': 'Default', 'session_id': 'sid1',
            'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer_value': 'answer1', 'time_spent_in_sec': 5.0,
            'rule_str': 'Default', 'session_id': 'sid2',
            'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer_value': {'x': 1.0, 'y': 5.0}, 'time_spent_in_sec': 5.0,
            'rule_str': 'Default', 'session_id': 'sid1',
            'interaction_id': 'TextInput', 'params': {}
        }]
        expected_answers_list2 = [{
            'answer_value': [2, 4, 8], 'time_spent_in_sec': 5.0,
            'rule_str': 'Default', 'session_id': 'sid3',
            'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer_value': self.UNICODE_TEST_STRING, 'time_spent_in_sec': 5.0,
            'rule_str': 'Default', 'session_id': 'sid4',
            'interaction_id': 'TextInput', 'params': {}
        }]

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, FIRST_STATE_NAME)
        self.assertEquals(state_answers.answers_list, expected_answers_list1)

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, SECOND_STATE_NAME)
        self.assertEquals(state_answers.answers_list, expected_answers_list2)
