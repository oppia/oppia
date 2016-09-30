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

from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.domain import stats_services
from core.tests import test_utils
import feconf


class ModifiedStatisticsAggregator(stats_jobs_continuous.StatisticsAggregator):
    """A modified StatisticsAggregator that does not start a new batch
    job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return ModifiedStatisticsMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class ModifiedStatisticsMRJobManager(
        stats_jobs_continuous.StatisticsMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return ModifiedStatisticsAggregator


class AnalyticsEventHandlersUnitTests(test_utils.GenericTestBase):
    """Test the event handlers for analytics events."""

    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR
    CLASSIFIER_RULESPEC_STR = exp_domain.CLASSIFIER_RULESPEC_STR
    DEFAULT_SESSION_ID = 'session_id'
    DEFAULT_TIME_SPENT = 5.0
    DEFAULT_PARAMS = {}

    EXP_ID0 = 'eid0'
    EXP_ID1 = 'eid1'

    def _record_answer(
            self, answer, exploration_id='eid0', exploration_version=1,
            state_name='sname', rule_spec_str=DEFAULT_RULESPEC_STR,
            session_id=DEFAULT_SESSION_ID,
            time_spent_in_secs=DEFAULT_TIME_SPENT, params=DEFAULT_PARAMS):
        event_services.AnswerSubmissionEventHandler.record(
            exploration_id, exploration_version, state_name, rule_spec_str,
            session_id, time_spent_in_secs, params, answer)

    def setUp(self):
        """Before each individual test, create a dummy exploration."""
        super(AnalyticsEventHandlersUnitTests, self).setUp()
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        exp = self.save_new_default_exploration(self.EXP_ID0, self.owner_id)
        self.state_name = exp.init_state_name

    def test_record_answer_submitted(self):
        self._record_answer('answer', state_name=self.state_name)
        answer_log = stats_domain.StateRuleAnswerLog.get(
            self.EXP_ID0, self.state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer': 1})

        self._record_answer('answer', state_name=self.state_name)
        answer_log = stats_domain.StateRuleAnswerLog.get(
            self.EXP_ID0, self.state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer': 2})

        answer_log = stats_domain.StateRuleAnswerLog.get(
            self.EXP_ID0, self.state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer': 2})

    def test_resolve_answers_for_default_rule(self):
        # Submit three answers.
        self._record_answer('a1', state_name=self.state_name)
        self._record_answer('a2', state_name=self.state_name)
        self._record_answer('a3', state_name=self.state_name)

        answer_log = stats_domain.StateRuleAnswerLog.get(
            self.EXP_ID0, self.state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(
            answer_log.answers, {'a1': 1, 'a2': 1, 'a3': 1})

        # Nothing changes if you try to resolve an invalid answer.
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            self.EXP_ID0, self.state_name, ['fake_answer'])
        answer_log = stats_domain.StateRuleAnswerLog.get(
            self.EXP_ID0, self.state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(
            answer_log.answers, {'a1': 1, 'a2': 1, 'a3': 1})

        # Resolve two answers.
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            self.EXP_ID0, self.state_name, ['a1', 'a2'])

        answer_log = stats_domain.StateRuleAnswerLog.get(
            self.EXP_ID0, self.state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'a3': 1})

        # Nothing changes if you try to resolve an answer that has already
        # been resolved.
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            self.EXP_ID0, self.state_name, ['a1'])
        answer_log = stats_domain.StateRuleAnswerLog.get(
            self.EXP_ID0, self.state_name, self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'a3': 1})

        # Resolve the last answer.
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            self.EXP_ID0, self.state_name, ['a3'])

        answer_log = stats_domain.StateRuleAnswerLog.get(
            self.EXP_ID0, self.state_name, 'Rule')
        self.assertEquals(answer_log.answers, {})

    def test_get_top_state_rule_answers(self):
        # There are no initial top answers for this state.
        top_answers = stats_services.get_top_state_rule_answers(
            self.EXP_ID0, self.state_name, [self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers), 0)

        # Submit some answers.
        self._record_answer('a', state_name=self.state_name)
        self._record_answer('a', state_name=self.state_name)
        self._record_answer('b', state_name=self.state_name)
        self._record_answer('b', state_name=self.state_name)
        self._record_answer('b', state_name=self.state_name)
        self._record_answer('c', state_name=self.state_name)
        self._record_answer('c', state_name=self.state_name)

        top_answers = stats_services.get_top_state_rule_answers(
            self.EXP_ID0, self.state_name, [self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers), 3)
        self.assertEquals(top_answers, [{
            'value': 'b',
            'count': 3
        }, {
            'value': 'a',
            'count': 2
        }, {
            'value': 'c',
            'count': 2
        }])

    def test_get_top_state_answers_for_multiple_classified_rules(self):
        # There are no initial top answers for this state.
        top_answers = stats_services.get_top_state_rule_answers(
            self.EXP_ID0, self.state_name,
            [self.CLASSIFIER_RULESPEC_STR, self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers), 0)

        # Submit some answers.
        self._record_answer(
            'a', state_name=self.state_name,
            rule_spec_str=self.DEFAULT_RULESPEC_STR)
        self._record_answer(
            'a', state_name=self.state_name,
            rule_spec_str=self.DEFAULT_RULESPEC_STR)
        self._record_answer(
            'b', state_name=self.state_name,
            rule_spec_str=self.CLASSIFIER_RULESPEC_STR)
        self._record_answer(
            'b', state_name=self.state_name,
            rule_spec_str=self.CLASSIFIER_RULESPEC_STR)
        self._record_answer(
            'b', state_name=self.state_name,
            rule_spec_str=self.CLASSIFIER_RULESPEC_STR)
        self._record_answer(
            'c', state_name=self.state_name,
            rule_spec_str=self.CLASSIFIER_RULESPEC_STR)
        self._record_answer(
            'c', state_name=self.state_name,
            rule_spec_str=self.DEFAULT_RULESPEC_STR)

        top_answers = stats_services.get_top_state_rule_answers(
            self.EXP_ID0, self.state_name,
            [self.CLASSIFIER_RULESPEC_STR, self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers), 3)
        # Rules across multiple rule types are combined and still sorted by
        # frequency.
        self.assertEquals(top_answers, [{
            'value': 'b',
            'count': 3
        }, {
            'value': 'a',
            'count': 2
        }, {
            'value': 'c',
            'count': 2
        }])

    def test_get_top_state_rule_answers_from_multiple_explorations(self):
        exp1 = self.save_new_default_exploration(self.EXP_ID1, self.owner_id)
        exp_services.update_exploration(self.owner_id, self.EXP_ID1, [{
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': feconf.DEFAULT_INIT_STATE_NAME,
            'new_state_name': 'Second',
        }], 'Change state name')
        state_name0 = self.state_name
        state_name1 = exp1.init_state_name

        # There are no initial top answers for these explorations.
        top_answers_list = stats_services.get_top_state_rule_answers_multi(
            [(self.EXP_ID0, state_name0), (self.EXP_ID1, state_name1)],
            [self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers_list), 2)
        self.assertEquals(len(top_answers_list[0]), 0)
        self.assertEquals(len(top_answers_list[1]), 0)

        # Submit some answers.
        self._record_answer(
            'a', exploration_id=self.EXP_ID0, state_name=state_name0)
        self._record_answer(
            'a', exploration_id=self.EXP_ID1, state_name=state_name1)
        self._record_answer(
            'b', exploration_id=self.EXP_ID1, state_name=state_name1)
        self._record_answer(
            'b', exploration_id=self.EXP_ID1, state_name=state_name1)
        self._record_answer(
            'b', exploration_id=self.EXP_ID1, state_name=state_name1)
        self._record_answer(
            'c', exploration_id=self.EXP_ID1, state_name=state_name1)
        self._record_answer(
            'c', exploration_id=self.EXP_ID0, state_name=state_name0)

        top_answers_list = stats_services.get_top_state_rule_answers_multi(
            [(self.EXP_ID0, state_name0), (self.EXP_ID1, state_name1)],
            [self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers_list), 2)
        self.assertEquals(top_answers_list[0], [{
            'value': 'a',
            'count': 1
        }, {
            'value': 'c',
            'count': 1
        }])
        self.assertEquals(top_answers_list[1], [{
            'value': 'b',
            'count': 3
        }, {
            'value': 'a',
            'count': 1
        }, {
            'value': 'c',
            'count': 1
        }])

    def test_get_top_state_rule_answers_from_multiple_states(self):
        state_name0 = self.state_name
        state_name1 = 'Second'

        exp_services.update_exploration(self.owner_id, self.EXP_ID0, [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': state_name1
        }], 'Add new state')

        # There are no initial top answers for these states.
        top_answers_list = stats_services.get_top_state_rule_answers_multi(
            [(self.EXP_ID0, state_name0), (self.EXP_ID0, state_name1)],
            [self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers_list), 2)
        self.assertEquals(len(top_answers_list[0]), 0)
        self.assertEquals(len(top_answers_list[1]), 0)

        # Submit some answers.
        self._record_answer(
            'a', exploration_id=self.EXP_ID0, state_name=state_name0)
        self._record_answer(
            'a', exploration_id=self.EXP_ID0, exploration_version=2,
            state_name=state_name1)
        self._record_answer(
            'b', exploration_id=self.EXP_ID0, exploration_version=2,
            state_name=state_name1)
        self._record_answer(
            'b', exploration_id=self.EXP_ID0, exploration_version=2,
            state_name=state_name1)
        self._record_answer(
            'b', exploration_id=self.EXP_ID0, exploration_version=2,
            state_name=state_name1)
        self._record_answer(
            'c', exploration_id=self.EXP_ID0, exploration_version=2,
            state_name=state_name1)
        self._record_answer(
            'c', exploration_id=self.EXP_ID0, state_name=state_name0)

        top_answers_list = stats_services.get_top_state_rule_answers_multi(
            [(self.EXP_ID0, state_name0), (self.EXP_ID0, state_name1)],
            [self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers_list), 2)
        self.assertEquals(top_answers_list[0], [{
            'value': 'a',
            'count': 1
        }, {
            'value': 'c',
            'count': 1
        }])
        self.assertEquals(top_answers_list[1], [{
            'value': 'b',
            'count': 3
        }, {
            'value': 'a',
            'count': 1
        }, {
            'value': 'c',
            'count': 1
        }])


class StateImprovementsUnitTests(test_utils.GenericTestBase):
    """Test the get_state_improvements() function."""

    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR
    DEFAULT_SESSION_ID = 'session_id'
    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR
    DEFAULT_TIME_SPENT = 5.0
    DEFAULT_PARAMS = {}

    def _get_swap_context(self):
        return self.swap(
            stats_jobs_continuous.StatisticsAggregator, 'get_statistics',
            ModifiedStatisticsAggregator.get_statistics)

    def test_get_state_improvements(self):
        exp = exp_domain.Exploration.create_default_exploration('eid')
        exp_services.save_new_exploration('fake@user.com', exp)

        for ind in range(5):
            event_services.StartExplorationEventHandler.record(
                'eid', 1, exp.init_state_name, 'session_id_%s' % ind,
                {}, feconf.PLAY_TYPE_NORMAL)
            event_services.StateHitEventHandler.record(
                'eid', 1, exp.init_state_name, 'session_id_%s' % ind,
                {}, feconf.PLAY_TYPE_NORMAL)
        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, exp.init_state_name,
            self.DEFAULT_RULESPEC_STR, self.DEFAULT_SESSION_ID,
            self.DEFAULT_TIME_SPENT, self.DEFAULT_PARAMS, '1')
        for _ in range(2):
            event_services.AnswerSubmissionEventHandler.record(
                'eid', 1, exp.init_state_name,
                self.DEFAULT_RULESPEC_STR, self.DEFAULT_SESSION_ID,
                self.DEFAULT_TIME_SPENT, self.DEFAULT_PARAMS, '2')
        ModifiedStatisticsAggregator.start_computation()
        self.process_and_flush_pending_tasks()
        with self._get_swap_context():
            self.assertEquals(
                stats_services.get_state_improvements('eid', 1), [{
                    'type': 'default',
                    'rank': 3,
                    'state_name': exp.init_state_name
                }])

    def test_single_default_rule_hit(self):
        exp = exp_domain.Exploration.create_default_exploration('eid')
        exp_services.save_new_exploration('fake@user.com', exp)
        state_name = exp.init_state_name

        event_services.StartExplorationEventHandler.record(
            'eid', 1, state_name, 'session_id', {}, feconf.PLAY_TYPE_NORMAL)
        event_services.StateHitEventHandler.record(
            'eid', 1, state_name, 'session_id', {},
            feconf.PLAY_TYPE_NORMAL)
        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name,
            self.DEFAULT_RULESPEC_STR, 'session_id', self.DEFAULT_TIME_SPENT,
            self.DEFAULT_PARAMS, '1')
        ModifiedStatisticsAggregator.start_computation()
        self.process_and_flush_pending_tasks()

        with self._get_swap_context():
            self.assertEquals(
                stats_services.get_state_improvements('eid', 1), [{
                    'type': 'default',
                    'rank': 1,
                    'state_name': exp.init_state_name
                }])

    def test_no_improvement_flag_hit(self):
        self.save_new_valid_exploration(
            'eid', 'fake@user.com', end_state_name='End')
        exp = exp_services.get_exploration_by_id('eid')

        not_default_rule_spec = exp_domain.RuleSpec('Equals', {'x': 'Text'})
        not_default_rule_spec_str = (
            not_default_rule_spec.stringify_classified_rule())
        init_interaction = exp.init_state.interaction
        init_interaction.answer_groups.append(exp_domain.AnswerGroup(
            exp_domain.Outcome(exp.init_state_name, [], {}),
            [not_default_rule_spec]))
        init_interaction.default_outcome = exp_domain.Outcome(
            'End', [], {})
        exp_services._save_exploration(  # pylint: disable=protected-access
            'fake@user.com', exp, '', [])

        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, exp.init_state_name,
            not_default_rule_spec_str, self.DEFAULT_SESSION_ID,
            self.DEFAULT_TIME_SPENT, self.DEFAULT_PARAMS, '1')
        self.assertEquals(stats_services.get_state_improvements('eid', 1), [])

    def test_incomplete_and_default_flags(self):
        exp = exp_domain.Exploration.create_default_exploration('eid')
        exp_services.save_new_exploration('fake@user.com', exp)
        state_name = exp.init_state_name

        # Fail to answer twice.
        for ind in range(2):
            event_services.StartExplorationEventHandler.record(
                'eid', 1, state_name, 'session_id %d' % ind, {},
                feconf.PLAY_TYPE_NORMAL)
            event_services.StateHitEventHandler.record(
                'eid', 1, state_name, 'session_id %d' % ind,
                {}, feconf.PLAY_TYPE_NORMAL)
            event_services.MaybeLeaveExplorationEventHandler.record(
                'eid', 1, state_name, 'session_id %d' % ind, 10.0, {},
                feconf.PLAY_TYPE_NORMAL)

        # Hit the default rule once.
        event_services.StateHitEventHandler.record(
            'eid', 1, state_name, 'session_id 3', {}, feconf.PLAY_TYPE_NORMAL)
        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name,
            self.DEFAULT_RULESPEC_STR, 'session_id 3',
            self.DEFAULT_TIME_SPENT, self.DEFAULT_PARAMS, '1')

        # The result should be classified as incomplete.
        ModifiedStatisticsAggregator.start_computation()
        self.process_and_flush_pending_tasks()
        with self._get_swap_context():
            self.assertEquals(
                stats_services.get_state_improvements('eid', 1), [{
                    'rank': 2,
                    'type': 'incomplete',
                    'state_name': state_name
                }])

        # Now hit the default two more times. The result should be classified
        # as default.
        for _ in range(2):
            event_services.StateHitEventHandler.record(
                'eid', 1, state_name, 'session_id',
                {}, feconf.PLAY_TYPE_NORMAL)
            event_services.AnswerSubmissionEventHandler.record(
                'eid', 1, state_name,
                self.DEFAULT_RULESPEC_STR, 'session_id',
                self.DEFAULT_TIME_SPENT, self.DEFAULT_PARAMS, '1')
        with self._get_swap_context():
            self.assertEquals(
                stats_services.get_state_improvements('eid', 1), [{
                    'rank': 3,
                    'type': 'default',
                    'state_name': state_name
                }])

    def test_two_state_default_hit(self):
        self.save_new_default_exploration('eid', 'fake@user.com')
        exp = exp_services.get_exploration_by_id('eid')

        first_state_name = exp.init_state_name
        second_state_name = 'State 2'
        exp_services.update_exploration('fake@user.com', 'eid', [{
            'cmd': 'edit_state_property',
            'state_name': first_state_name,
            'property_name': 'widget_id',
            'new_value': 'TextInput',
        }, {
            'cmd': 'add_state',
            'state_name': second_state_name,
        }, {
            'cmd': 'edit_state_property',
            'state_name': second_state_name,
            'property_name': 'widget_id',
            'new_value': 'TextInput',
        }], 'Add new state')

        # Hit the default rule of state 1 once, and the default rule of state 2
        # twice. Note that both rules are self-loops.
        event_services.StartExplorationEventHandler.record(
            'eid', 2, first_state_name, 'session_id', {},
            feconf.PLAY_TYPE_NORMAL)
        event_services.StateHitEventHandler.record(
            'eid', 2, first_state_name, 'session_id',
            {}, feconf.PLAY_TYPE_NORMAL)
        event_services.AnswerSubmissionEventHandler.record(
            'eid', 2, first_state_name,
            self.DEFAULT_RULESPEC_STR, 'session_id',
            self.DEFAULT_TIME_SPENT, self.DEFAULT_PARAMS, '1')

        for _ in range(2):
            event_services.StateHitEventHandler.record(
                'eid', 2, second_state_name, 'session_id',
                {}, feconf.PLAY_TYPE_NORMAL)
            event_services.AnswerSubmissionEventHandler.record(
                'eid', 2, second_state_name,
                self.DEFAULT_RULESPEC_STR, 'session_id',
                self.DEFAULT_TIME_SPENT, self.DEFAULT_PARAMS, '1')
        ModifiedStatisticsAggregator.start_computation()
        self.process_and_flush_pending_tasks()
        with self._get_swap_context():
            states = stats_services.get_state_improvements('eid', 2)
        self.assertEquals(states, [{
            'rank': 2,
            'type': 'default',
            'state_name': second_state_name
        }, {
            'rank': 1,
            'type': 'default',
            'state_name': first_state_name
        }])

        # Hit the default rule of state 1 two more times.
        for _ in range(2):
            event_services.StateHitEventHandler.record(
                'eid', 1, first_state_name, 'session_id',
                {}, feconf.PLAY_TYPE_NORMAL)
            event_services.AnswerSubmissionEventHandler.record(
                'eid', 1, first_state_name,
                self.DEFAULT_RULESPEC_STR, 'session_id',
                self.DEFAULT_TIME_SPENT, self.DEFAULT_PARAMS, '1')

        with self._get_swap_context():
            states = stats_services.get_state_improvements('eid', 2)
        self.assertEquals(states, [{
            'rank': 3,
            'type': 'default',
            'state_name': first_state_name
        }, {
            'rank': 2,
            'type': 'default',
            'state_name': second_state_name
        }])


# TODO(bhenning): Remove these.
class UnresolvedAnswersTests(test_utils.GenericTestBase):
    """Test the unresolved answers methods."""

    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR
    CLASSIFIER_RULESPEC_STR = exp_domain.CLASSIFIER_RULESPEC_STR
    DEFAULT_SESSION_ID = 'session_id'
    DEFAULT_TIME_SPENT = 5.0
    DEFAULT_PARAMS = {}
    STATE_2_NAME = 'State 2'

    def _create_and_update_fake_exploration(self, exp_id):
        exp = exp_domain.Exploration.create_default_exploration(exp_id)
        exp_services.save_new_exploration('fake@user.com', exp)
        exp_services.update_exploration('fake@user.com', exp_id, [{
            'cmd': 'edit_state_property',
            'state_name': exp.init_state_name,
            'property_name': 'widget_id',
            'new_value': 'TextInput',
        }, {
            'cmd': 'add_state',
            'state_name': self.STATE_2_NAME,
        }, {
            'cmd': 'edit_state_property',
            'state_name': self.STATE_2_NAME,
            'property_name': 'widget_id',
            'new_value': 'TextInput',
        }], 'Add new state')
        return exp

    def test_get_top_unresolved_answers(self):
        exp = exp_domain.Exploration.create_default_exploration(
            'eid', 'title', 'category')
        exp_services.save_new_exploration('user_id', exp)
        state_name = exp.init_state_name

        self.assertEquals(
            stats_services.get_top_unresolved_answers_for_default_rule(
                'eid', state_name), {})

        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name,
            self.DEFAULT_RULESPEC_STR, 'session', self.DEFAULT_TIME_SPENT,
            self.DEFAULT_PARAMS, 'a1')
        self.assertEquals(
            stats_services.get_top_unresolved_answers_for_default_rule(
                'eid', state_name), {'a1': 1})

        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, state_name,
            self.DEFAULT_RULESPEC_STR, 'session', self.DEFAULT_TIME_SPENT,
            self.DEFAULT_PARAMS, 'a1')
        self.assertEquals(
            stats_services.get_top_unresolved_answers_for_default_rule(
                'eid', state_name), {'a1': 2})

        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid', state_name, ['a1'])
        self.assertEquals(
            stats_services.get_top_unresolved_answers_for_default_rule(
                'eid', state_name), {})

    def test_unresolved_answers_count_for_single_exploration(self):
        exp_1 = self._create_and_update_fake_exploration('eid1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1']), {})
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.DEFAULT_RULESPEC_STR, 'a1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1']), {'eid1': 1})

    def test_unresolved_answers_count_for_multiple_explorations(self):
        exp_1 = self._create_and_update_fake_exploration('eid1')
        exp_2 = self._create_and_update_fake_exploration('eid2')
        exp_3 = self._create_and_update_fake_exploration('eid3')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1', 'eid2', 'eid3']), {})
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.DEFAULT_RULESPEC_STR, 'a1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid2', 1, exp_2.init_state_name, self.DEFAULT_RULESPEC_STR, 'a3')
        event_services.AnswerSubmissionEventHandler.record(
            'eid2', 1, exp_2.init_state_name, self.DEFAULT_RULESPEC_STR, 'a2')
        event_services.AnswerSubmissionEventHandler.record(
            'eid3', 1, exp_3.init_state_name, self.DEFAULT_RULESPEC_STR, 'a2')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1', 'eid2', 'eid3']), {'eid1': 1, 'eid2': 2, 'eid3': 1})

    def test_unresolved_answers_count_when_answers_marked_as_resolved(self):
        exp_1 = self._create_and_update_fake_exploration('eid1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1']), {})
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.DEFAULT_RULESPEC_STR, 'a1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.DEFAULT_RULESPEC_STR, 'a2')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1']), {'eid1': 2})

        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid1', exp_1.init_state_name, ['a1'])
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1']), {'eid1': 1})

        exp_2 = self._create_and_update_fake_exploration('eid2')
        event_services.AnswerSubmissionEventHandler.record(
            'eid2', 1, exp_2.init_state_name, self.DEFAULT_RULESPEC_STR, 'a1')
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid1', exp_1.init_state_name, ['a2'])
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid2', exp_1.init_state_name, ['a1'])
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1', 'eid2']), {})

    def test_unresolved_answers_count_for_multiple_states(self):
        exp_1 = self._create_and_update_fake_exploration('eid1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1']), {})
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.DEFAULT_RULESPEC_STR, 'a1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, self.STATE_2_NAME, self.DEFAULT_RULESPEC_STR, 'a1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, self.STATE_2_NAME, self.DEFAULT_RULESPEC_STR, 'a2')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1']), {'eid1': 3})

    def test_unresolved_answers_count_for_non_default_rules(self):
        exp_1 = self._create_and_update_fake_exploration('eid1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1']), {})
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.CLASSIFIER_RULESPEC_STR, 'a1'
        )
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, self.STATE_2_NAME, self.CLASSIFIER_RULESPEC_STR, 'a1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_count_for_default_rule(
                ['eid1']), {})


class EventLogEntryTests(test_utils.GenericTestBase):
    """Test for the event log creation."""

    def test_create_events(self):
        """Basic test that makes sure there are no exceptions thrown."""
        event_services.StartExplorationEventHandler.record(
            'eid', 2, 'state', 'session', {}, feconf.PLAY_TYPE_NORMAL)
        event_services.MaybeLeaveExplorationEventHandler.record(
            'eid', 2, 'state', 'session', 27.2, {}, feconf.PLAY_TYPE_NORMAL)
