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


class ExplorationStatsTests(test_utils.GenericTestBase):
    """Tests for stats functions related to explorations."""
    pass
