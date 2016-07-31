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

    def _record_answer(
            self, answer, exploration_id='eid', state_name='sname',
            rule_spec_str=DEFAULT_RULESPEC_STR):
        event_services.AnswerSubmissionEventHandler.record(
            exploration_id, 1, state_name, rule_spec_str, answer)

    def test_record_answer_submitted(self):
        self._record_answer('answer')

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sname', self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer': 1})

        self._record_answer('answer')

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sname', self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer': 2})

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sname', self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'answer': 2})

    def test_resolve_answers_for_default_rule(self):
        # Submit three answers.
        self._record_answer('a1')
        self._record_answer('a2')
        self._record_answer('a3')

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sname', self.DEFAULT_RULESPEC_STR)
        self.assertEquals(
            answer_log.answers, {'a1': 1, 'a2': 1, 'a3': 1})

        # Nothing changes if you try to resolve an invalid answer.
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid', 'sname', ['fake_answer'])
        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sname', self.DEFAULT_RULESPEC_STR)
        self.assertEquals(
            answer_log.answers, {'a1': 1, 'a2': 1, 'a3': 1})

        # Resolve two answers.
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid', 'sname', ['a1', 'a2'])

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sname', self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'a3': 1})

        # Nothing changes if you try to resolve an answer that has already
        # been resolved.
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid', 'sname', ['a1'])
        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sname', self.DEFAULT_RULESPEC_STR)
        self.assertEquals(answer_log.answers, {'a3': 1})

        # Resolve the last answer.
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid', 'sname', ['a3'])

        answer_log = stats_domain.StateRuleAnswerLog.get(
            'eid', 'sname', 'Rule')
        self.assertEquals(answer_log.answers, {})

    def test_get_top_state_rule_answers(self):
        # There are no initial top answers for this state.
        top_answers = stats_services.get_top_state_rule_answers(
            'eid', 'sname', [self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers), 0)

        # Submit some answers.
        self._record_answer('a')
        self._record_answer('a')
        self._record_answer('b')
        self._record_answer('b')
        self._record_answer('b')
        self._record_answer('c')
        self._record_answer('c')

        top_answers = stats_services.get_top_state_rule_answers(
            'eid', 'sname', [self.DEFAULT_RULESPEC_STR])
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
            'eid', 'sname',
            [self.CLASSIFIER_RULESPEC_STR, self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers), 0)

        # Submit some answers.
        self._record_answer('a', rule_spec_str=self.DEFAULT_RULESPEC_STR)
        self._record_answer('a', rule_spec_str=self.DEFAULT_RULESPEC_STR)
        self._record_answer('b', rule_spec_str=self.CLASSIFIER_RULESPEC_STR)
        self._record_answer('b', rule_spec_str=self.CLASSIFIER_RULESPEC_STR)
        self._record_answer('b', rule_spec_str=self.CLASSIFIER_RULESPEC_STR)
        self._record_answer('c', rule_spec_str=self.CLASSIFIER_RULESPEC_STR)
        self._record_answer('c', rule_spec_str=self.DEFAULT_RULESPEC_STR)

        top_answers = stats_services.get_top_state_rule_answers(
            'eid', 'sname',
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
        # There are no initial top answers for these explorations.
        top_answers_list = stats_services.get_top_state_rule_answers_multi(
            [('eid0', 'First'), ('eid1', 'Second')],
            [self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers_list), 2)
        self.assertEquals(len(top_answers_list[0]), 0)
        self.assertEquals(len(top_answers_list[1]), 0)

        # Submit some answers.
        self._record_answer('a', exploration_id='eid0', state_name='First')
        self._record_answer('a', exploration_id='eid1', state_name='Second')
        self._record_answer('b', exploration_id='eid1', state_name='Second')
        self._record_answer('b', exploration_id='eid1', state_name='Second')
        self._record_answer('b', exploration_id='eid1', state_name='Second')
        self._record_answer('c', exploration_id='eid1', state_name='Second')
        self._record_answer('c', exploration_id='eid0', state_name='First')

        top_answers_list = stats_services.get_top_state_rule_answers_multi(
            [('eid0', 'First'), ('eid1', 'Second')],
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
        # There are no initial top answers for these states.
        top_answers_list = stats_services.get_top_state_rule_answers_multi(
            [('eid0', 'First'), ('eid0', 'Second')],
            [self.DEFAULT_RULESPEC_STR])
        self.assertEquals(len(top_answers_list), 2)
        self.assertEquals(len(top_answers_list[0]), 0)
        self.assertEquals(len(top_answers_list[1]), 0)

        # Submit some answers.
        self._record_answer('a', exploration_id='eid0', state_name='First')
        self._record_answer('a', exploration_id='eid0', state_name='Second')
        self._record_answer('b', exploration_id='eid0', state_name='Second')
        self._record_answer('b', exploration_id='eid0', state_name='Second')
        self._record_answer('b', exploration_id='eid0', state_name='Second')
        self._record_answer('c', exploration_id='eid0', state_name='Second')
        self._record_answer('c', exploration_id='eid0', state_name='First')

        top_answers_list = stats_services.get_top_state_rule_answers_multi(
            [('eid0', 'First'), ('eid0', 'Second')],
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
            'eid', 1, exp.init_state_name, self.DEFAULT_RULESPEC_STR, '1')
        for _ in range(2):
            event_services.AnswerSubmissionEventHandler.record(
                'eid', 1, exp.init_state_name, self.DEFAULT_RULESPEC_STR, '2')
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
            'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, '1')
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
            not_default_rule_spec.stringify_classified_rule(),
            '1')
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
            'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, '1')

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
                'eid', 1, state_name, self.DEFAULT_RULESPEC_STR, '1')

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
            'eid', 1, first_state_name, 'session_id', {},
            feconf.PLAY_TYPE_NORMAL)
        event_services.StateHitEventHandler.record(
            'eid', 1, first_state_name, 'session_id',
            {}, feconf.PLAY_TYPE_NORMAL)
        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, first_state_name, self.DEFAULT_RULESPEC_STR, '1')

        for _ in range(2):
            event_services.StateHitEventHandler.record(
                'eid', 1, second_state_name, 'session_id',
                {}, feconf.PLAY_TYPE_NORMAL)
            event_services.AnswerSubmissionEventHandler.record(
                'eid', 1, second_state_name, self.DEFAULT_RULESPEC_STR, '1')
        ModifiedStatisticsAggregator.start_computation()
        self.process_and_flush_pending_tasks()

        with self._get_swap_context():
            states = stats_services.get_state_improvements('eid', 1)
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
                'eid', 1, first_state_name, self.DEFAULT_RULESPEC_STR, '1')

        with self._get_swap_context():
            states = stats_services.get_state_improvements('eid', 1)
        self.assertEquals(states, [{
            'rank': 3,
            'type': 'default',
            'state_name': first_state_name
        }, {
            'rank': 2,
            'type': 'default',
            'state_name': second_state_name
        }])


class UnresolvedAnswersTests(test_utils.GenericTestBase):
    """Test the unresolved answers methods."""

    DEFAULT_RULESPEC_STR = exp_domain.DEFAULT_RULESPEC_STR
    CLASSIFIER_RULESPEC_STR = exp_domain.CLASSIFIER_RULESPEC_STR
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
        self.assertEquals(
            stats_services.get_top_unresolved_answers_for_default_rule(
                'eid', 'sid'), {})

        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, 'sid', self.DEFAULT_RULESPEC_STR, 'a1')
        self.assertEquals(
            stats_services.get_top_unresolved_answers_for_default_rule(
                'eid', 'sid'), {'a1': 1})

        event_services.AnswerSubmissionEventHandler.record(
            'eid', 1, 'sid', self.DEFAULT_RULESPEC_STR, 'a1')
        self.assertEquals(
            stats_services.get_top_unresolved_answers_for_default_rule(
                'eid', 'sid'), {'a1': 2})

        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid', 'sid', ['a1'])
        self.assertEquals(
            stats_services.get_top_unresolved_answers_for_default_rule(
                'eid', 'sid'), {})

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
