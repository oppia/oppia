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
from core.domain import stats_jobs_continuous
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import user_services
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


# TODO(bhenning): Implement all of the missing stats services tests.
class EventLogEntryTests(test_utils.GenericTestBase):
    """Test for the event log creation."""

    def test_create_events(self):
        """Basic test that makes sure there are no exceptions thrown."""
        event_services.StartExplorationEventHandler.record(
            'eid', 2, 'state', 'session', {}, feconf.PLAY_TYPE_NORMAL)
        event_services.MaybeLeaveExplorationEventHandler.record(
            'eid', 2, 'state', 'session', 27.2, {}, feconf.PLAY_TYPE_NORMAL)


class AnswerStatsTests(test_utils.GenericTestBase):
    """Tests for stats functions related to answers."""

    EXP_ID = 'exp_id0'

    def setUp(self):
        super(AnswerStatsTests, self).setUp()
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        user_services.get_or_create_user(self.owner_id, self.OWNER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')

    def test_record_answer_without_retrieving_it_first(self):
        # Do not assert the initial state since
        # stats_services.get_state_answers() will change the behavior of
        # stats_services.record_answer().
        stats_services.record_answer(
            self.exploration, self.exploration.init_state_name,
            stats_domain.SubmittedAnswer(
                'first answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, [],
                'a_session_id_val', 1.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'first answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': []
        }])

    def test_record_and_retrieve_single_answer(self):
        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertIsNone(state_answers)

        stats_services.record_answer(
            self.exploration, self.exploration.init_state_name,
            stats_domain.SubmittedAnswer(
                'some text', 'TextInput', 0,
                1, exp_domain.EXPLICIT_CLASSIFICATION, [],
                'a_session_id_val', 10.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 1)
        self.assertEqual(
            state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(state_answers.interaction_id, 'TextInput')
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'some text',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': []
        }])

    def test_record_and_retrieve_single_answer_with_preexisting_entry(self):
        stats_services.record_answer(
            self.exploration, self.exploration.init_state_name,
            stats_domain.SubmittedAnswer(
                'first answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, [],
                'a_session_id_val', 1.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'first answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': []
        }])

        stats_services.record_answer(
            self.exploration, self.exploration.init_state_name,
            stats_domain.SubmittedAnswer(
                'some text', 'TextInput', 0,
                1, exp_domain.EXPLICIT_CLASSIFICATION, [],
                'a_session_id_val', 10.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 1)
        self.assertEqual(
            state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(state_answers.interaction_id, 'TextInput')
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'first answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': []
        }, {
            'answer': 'some text',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': []
        }])

    def test_record_many_answers(self):
        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertIsNone(state_answers)

        submitted_answer_list = [
            stats_domain.SubmittedAnswer(
                'answer a', 'TextInput', 0, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, [], 'session_id_v', 10.0),
            stats_domain.SubmittedAnswer(
                'answer ccc', 'TextInput', 1, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, [], 'session_id_v', 3.0),
            stats_domain.SubmittedAnswer(
                'answer bbbbb', 'TextInput', 1, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, [], 'session_id_v', 7.5),
        ]
        stats_services.record_answers(
            self.exploration, self.exploration.init_state_name,
            submitted_answer_list)

        # The order of the answers returned depends on the size of the answers.
        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 1)
        self.assertEqual(
            state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(state_answers.interaction_id, 'TextInput')
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'answer a',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': []
        }, {
            'answer': 'answer ccc',
            'time_spent_in_sec': 3.0,
            'answer_group_index': 1,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': []
        }, {
            'answer': 'answer bbbbb',
            'time_spent_in_sec': 7.5,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': []
        }])

    def test_record_many_answers_with_preexisting_entry(self):
        stats_services.record_answer(
            self.exploration, self.exploration.init_state_name,
            stats_domain.SubmittedAnswer(
                '1 answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, [],
                'a_session_id_val', 1.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': '1 answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': []
        }])

        submitted_answer_list = [
            stats_domain.SubmittedAnswer(
                'answer aaa', 'TextInput', 0, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, [], 'session_id_v', 10.0),
            stats_domain.SubmittedAnswer(
                'answer ccccc', 'TextInput', 1, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, [], 'session_id_v', 3.0),
            stats_domain.SubmittedAnswer(
                'answer bbbbbbb', 'TextInput', 1, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, [], 'session_id_v', 7.5),
        ]
        stats_services.record_answers(
            self.exploration, self.exploration.init_state_name,
            submitted_answer_list)

        # The order of the answers returned depends on the size of the answers.
        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 1)
        self.assertEqual(
            state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(state_answers.interaction_id, 'TextInput')
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': '1 answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': []
        }, {
            'answer': 'answer aaa',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': []
        }, {
            'answer': 'answer ccccc',
            'time_spent_in_sec': 3.0,
            'answer_group_index': 1,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': []
        }, {
            'answer': 'answer bbbbbbb',
            'time_spent_in_sec': 7.5,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': []
        }])

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

    def _get_default_dict_when_no_unresolved_answers(self, exp_ids):
        result = {}
        for exp_id in exp_ids:
            result[exp_id] = {'count': 0, 'unresolved_answers': []}
        return result

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

    def test_unresolved_answers_for_single_exploration(self):
        exp_1 = self._create_and_update_fake_exploration('eid1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1']), self._get_default_dict_when_no_unresolved_answers(
                    ['eid1']))
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.DEFAULT_RULESPEC_STR, 'a1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1']), {
                    'eid1': {'count': 1, 'unresolved_answers': [
                        {'count': 1, 'value': 'a1',
                         'state': exp_1.init_state_name}
                    ]}
                })

    def test_unresolved_answers_for_multiple_explorations(self):
        exp_1 = self._create_and_update_fake_exploration('eid1')
        exp_2 = self._create_and_update_fake_exploration('eid2')
        exp_3 = self._create_and_update_fake_exploration('eid3')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1', 'eid2', 'eid3']),
            self._get_default_dict_when_no_unresolved_answers(
                ['eid1', 'eid2', 'eid3']))
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.DEFAULT_RULESPEC_STR, 'a1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid2', 1, exp_2.init_state_name, self.DEFAULT_RULESPEC_STR, 'a3')
        event_services.AnswerSubmissionEventHandler.record(
            'eid2', 1, exp_2.init_state_name, self.DEFAULT_RULESPEC_STR, 'a2')
        event_services.AnswerSubmissionEventHandler.record(
            'eid3', 1, exp_3.init_state_name, self.DEFAULT_RULESPEC_STR, 'a2')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1', 'eid2', 'eid3']), {
                    'eid1': {'count': 1, 'unresolved_answers': [
                        {'count': 1, 'value': 'a1',
                         'state': exp_1.init_state_name}
                    ]},
                    'eid2': {'count': 2, 'unresolved_answers': [
                        {'count': 1, 'value': 'a3',
                         'state': exp_2.init_state_name},
                        {'count': 1, 'value': 'a2',
                         'state': exp_2.init_state_name}
                    ]},
                    'eid3': {'count': 1, 'unresolved_answers': [
                        {'count': 1, 'value': 'a2',
                         'state': exp_3.init_state_name}
                    ]}
                })

    def test_unresolved_answers_count_when_answers_marked_as_resolved(self):
        exp_1 = self._create_and_update_fake_exploration('eid1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1']),
            self._get_default_dict_when_no_unresolved_answers(['eid1']))
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.DEFAULT_RULESPEC_STR, 'a1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.DEFAULT_RULESPEC_STR, 'a2')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1']), {
                    'eid1': {'count': 2, 'unresolved_answers': [
                        {'count': 1, 'value': 'a1',
                         'state': exp_1.init_state_name},
                        {'count': 1, 'value': 'a2',
                         'state': exp_1.init_state_name}
                    ]}
                })

        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid1', exp_1.init_state_name, ['a1'])
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1']), {
                    'eid1': {'count': 1, 'unresolved_answers': [
                        {'count': 1, 'value': 'a2',
                         'state': exp_1.init_state_name}
                    ]}
                })

        exp_2 = self._create_and_update_fake_exploration('eid2')
        event_services.AnswerSubmissionEventHandler.record(
            'eid2', 1, exp_2.init_state_name, self.DEFAULT_RULESPEC_STR, 'a1')
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid1', exp_1.init_state_name, ['a2'])
        event_services.DefaultRuleAnswerResolutionEventHandler.record(
            'eid2', exp_1.init_state_name, ['a1'])
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1', 'eid2']),
            self._get_default_dict_when_no_unresolved_answers(
                ['eid1', 'eid2']))

    def test_unresolved_answers_count_for_multiple_states(self):
        exp_1 = self._create_and_update_fake_exploration('eid1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1']), self._get_default_dict_when_no_unresolved_answers(
                    ['eid1']))
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.DEFAULT_RULESPEC_STR, 'a1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, self.STATE_2_NAME, self.DEFAULT_RULESPEC_STR, 'a1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, self.STATE_2_NAME, self.DEFAULT_RULESPEC_STR, 'a2')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1']), {
                    'eid1': {'count': 3, 'unresolved_answers': [
                        {'count': 1, 'value': 'a1',
                         'state': exp_1.init_state_name},
                        {'count': 1, 'value': 'a1',
                         'state': self.STATE_2_NAME},
                        {'count': 1, 'value': 'a2',
                         'state': self.STATE_2_NAME}
                    ]}
                })

    def test_unresolved_answers_count_for_non_default_rules(self):
        exp_1 = self._create_and_update_fake_exploration('eid1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1']), self._get_default_dict_when_no_unresolved_answers(
                    ['eid1']))
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, exp_1.init_state_name, self.CLASSIFIER_RULESPEC_STR, 'a1'
        )
        event_services.AnswerSubmissionEventHandler.record(
            'eid1', 1, self.STATE_2_NAME, self.CLASSIFIER_RULESPEC_STR, 'a1')
        self.assertEquals(
            stats_services.get_exps_unresolved_answers_for_default_rule(
                ['eid1']), self._get_default_dict_when_no_unresolved_answers(
                    ['eid1']))


class ExplorationStatsTests(test_utils.GenericTestBase):
    """Tests for stats functions related to explorations."""
    pass
