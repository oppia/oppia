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
from core.domain import stats_jobs_continuous
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


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


class ModifiedInteractionAnswerSummariesAggregator(
        stats_jobs_continuous.StatisticsAggregator):
    """A modified InteractionAnswerSummariesAggregator that does not start
    a new batch job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return ModifiedInteractionAnswerSummariesMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class ModifiedInteractionAnswerSummariesMRJobManager(
        stats_jobs_continuous.InteractionAnswerSummariesMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return ModifiedInteractionAnswerSummariesAggregator


class EventLogEntryTests(test_utils.GenericTestBase):
    """Test for the event log creation."""

    def test_create_events(self):
        """Basic test that makes sure there are no exceptions thrown."""
        event_services.StartExplorationEventHandler.record(
            'eid', 2, 'state', 'session', {}, feconf.PLAY_TYPE_NORMAL)
        event_services.MaybeLeaveExplorationEventHandler.record(
            'eid', 2, 'state', 'session', 27.2, {}, feconf.PLAY_TYPE_NORMAL)


class AnswerEventTests(test_utils.GenericTestBase):
    """Test recording new answer operations through events."""

    SESSION_ID = 'SESSION_ID'
    TIME_SPENT = 5.0
    PARAMS = {}

    def test_record_answer(self):
        self.save_new_default_exploration('eid', 'fake@user.com')
        exp = exp_services.get_exploration_by_id('eid')

        first_state_name = exp.init_state_name
        second_state_name = 'State 2'
        third_state_name = 'State 3'
        exp_services.update_exploration('fake@user.com', 'eid', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': first_state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput',
        }, {
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': second_state_name,
        }, {
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': third_state_name,
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': second_state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput',
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': third_state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'Continue',
        }], 'Add new state')
        exp = exp_services.get_exploration_by_id('eid')

        exp_version = exp.version

        for state_name in [first_state_name, second_state_name]:
            state_answers = stats_services.get_state_answers(
                'eid', exp_version, state_name)
            self.assertEqual(state_answers, None)

        # answer is a string
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 0, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, 'answer1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 0, 1,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid2', self.TIME_SPENT,
            self.PARAMS, 'answer1')
        # answer is a dict
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 1, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, {'x': 1.0, 'y': 5.0})
        # answer is a number
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 2, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, 10)
        # answer is a list of dicts
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 3, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, [{'a': 'some', 'b': 'text'}, {'a': 1.0, 'c': 2.0}])
        # answer is a list
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, second_state_name, 'TextInput', 2, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid3', self.TIME_SPENT,
            self.PARAMS, [2, 4, 8])
        # answer is a unicode string
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, second_state_name, 'TextInput', 1, 1,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid4', self.TIME_SPENT,
            self.PARAMS, self.UNICODE_TEST_STRING)
        # answer is None (such as for Continue)
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, third_state_name, 'Continue', 1, 1,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid5', self.TIME_SPENT,
            self.PARAMS, None)

        expected_submitted_answer_list1 = [{
            'answer': 'answer1', 'time_spent_in_sec': 5.0,
            'answer_group_index': 0, 'rule_spec_index': 0,
            'classification_categorization': 'explicit', 'session_id': 'sid1',
            'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer': 'answer1', 'time_spent_in_sec': 5.0,
            'answer_group_index': 0, 'rule_spec_index': 1,
            'classification_categorization': 'explicit', 'session_id': 'sid2',
            'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer': {'x': 1.0, 'y': 5.0}, 'time_spent_in_sec': 5.0,
            'answer_group_index': 1, 'rule_spec_index': 0,
            'classification_categorization': 'explicit', 'session_id': 'sid1',
            'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer': 10, 'time_spent_in_sec': 5.0, 'answer_group_index': 2,
            'rule_spec_index': 0, 'classification_categorization': 'explicit',
            'session_id': 'sid1', 'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer': [{'a': 'some', 'b': 'text'}, {'a': 1.0, 'c': 2.0}],
            'time_spent_in_sec': 5.0, 'answer_group_index': 3,
            'rule_spec_index': 0, 'classification_categorization': 'explicit',
            'session_id': 'sid1', 'interaction_id': 'TextInput', 'params': {}
        }]
        expected_submitted_answer_list2 = [{
            'answer': [2, 4, 8], 'time_spent_in_sec': 5.0,
            'answer_group_index': 2, 'rule_spec_index': 0,
            'classification_categorization': 'explicit', 'session_id': 'sid3',
            'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer': self.UNICODE_TEST_STRING, 'time_spent_in_sec': 5.0,
            'answer_group_index': 1, 'rule_spec_index': 1,
            'classification_categorization': 'explicit', 'session_id': 'sid4',
            'interaction_id': 'TextInput', 'params': {}
        }]
        expected_submitted_answer_list3 = [{
            'answer': None, 'time_spent_in_sec': 5.0, 'answer_group_index': 1,
            'rule_spec_index': 1, 'classification_categorization': 'explicit',
            'session_id': 'sid5', 'interaction_id': 'Continue', 'params': {}
        }]

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, first_state_name)
        self.assertEqual(
            state_answers.get_submitted_answer_dict_list(),
            expected_submitted_answer_list1)

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, second_state_name)
        self.assertEqual(
            state_answers.get_submitted_answer_dict_list(),
            expected_submitted_answer_list2)

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, third_state_name)
        self.assertEqual(
            state_answers.get_submitted_answer_dict_list(),
            expected_submitted_answer_list3)


class RecordAnswerTests(test_utils.GenericTestBase):
    """Tests for functionality related to recording and retrieving answers."""

    EXP_ID = 'exp_id0'

    def setUp(self):
        super(RecordAnswerTests, self).setUp()
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')

    def test_record_answer_without_retrieving_it_first(self):
        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                'first answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, {},
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
            'params': {}
        }])

    def test_record_and_retrieve_single_answer(self):
        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertIsNone(state_answers)

        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                'some text', 'TextInput', 0,
                1, exp_domain.EXPLICIT_CLASSIFICATION, {},
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
            'params': {}
        }])

    def test_record_and_retrieve_single_answer_with_preexisting_entry(self):
        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                'first answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, {},
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
            'params': {}
        }])

        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                'some text', 'TextInput', 0,
                1, exp_domain.EXPLICIT_CLASSIFICATION, {},
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
            'params': {}
        }, {
            'answer': 'some text',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {}
        }])

    def test_record_many_answers(self):
        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertIsNone(state_answers)

        submitted_answer_list = [
            stats_domain.SubmittedAnswer(
                'answer a', 'TextInput', 0, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 10.0),
            stats_domain.SubmittedAnswer(
                'answer ccc', 'TextInput', 1, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 3.0),
            stats_domain.SubmittedAnswer(
                'answer bbbbb', 'TextInput', 1, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 7.5),
        ]
        stats_services.record_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
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
            'params': {}
        }, {
            'answer': 'answer ccc',
            'time_spent_in_sec': 3.0,
            'answer_group_index': 1,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {}
        }, {
            'answer': 'answer bbbbb',
            'time_spent_in_sec': 7.5,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {}
        }])

    def test_record_answers_exceeding_one_shard(self):
        # Use a smaller max answer list size so less answers are needed to
        # exceed a shard.
        with self.swap(
            stats_models.StateAnswersModel, '_MAX_ANSWER_LIST_BYTE_SIZE',
            100000):
            state_answers = stats_services.get_state_answers(
                self.EXP_ID, self.exploration.version,
                self.exploration.init_state_name)
            self.assertIsNone(state_answers)

            submitted_answer_list = [
                stats_domain.SubmittedAnswer(
                    'answer a', 'TextInput', 0, 1,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v',
                    10.0),
                stats_domain.SubmittedAnswer(
                    'answer ccc', 'TextInput', 1, 1,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v',
                    3.0),
                stats_domain.SubmittedAnswer(
                    'answer bbbbb', 'TextInput', 1, 0,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v',
                    7.5),
            ]
            stats_services.record_answers(
                self.EXP_ID, self.exploration.version,
                self.exploration.init_state_name, 'TextInput',
                submitted_answer_list * 200)

            # Verify more than 1 shard was stored. The index shard (shard_id 0)
            # is not included in the shard count.
            model = stats_models.StateAnswersModel.get('%s:%s:%s:%s' % (
                self.exploration.id, str(self.exploration.version),
                self.exploration.init_state_name, '0'))
            self.assertEqual(model.shard_count, 1)

            # The order of the answers returned depends on the size of the
            # answers.
            state_answers = stats_services.get_state_answers(
                self.EXP_ID, self.exploration.version,
                self.exploration.init_state_name)
            self.assertEqual(state_answers.exploration_id, 'exp_id0')
            self.assertEqual(state_answers.exploration_version, 1)
            self.assertEqual(
                state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
            self.assertEqual(state_answers.interaction_id, 'TextInput')
            self.assertEqual(
                len(state_answers.get_submitted_answer_dict_list()), 600)

    def test_record_many_answers_with_preexisting_entry(self):
        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                '1 answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, {},
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
            'params': {}
        }])

        submitted_answer_list = [
            stats_domain.SubmittedAnswer(
                'answer aaa', 'TextInput', 0, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 10.0),
            stats_domain.SubmittedAnswer(
                'answer ccccc', 'TextInput', 1, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 3.0),
            stats_domain.SubmittedAnswer(
                'answer bbbbbbb', 'TextInput', 1, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 7.5),
        ]
        stats_services.record_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
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
            'params': {}
        }, {
            'answer': 'answer aaa',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {}
        }, {
            'answer': 'answer ccccc',
            'time_spent_in_sec': 3.0,
            'answer_group_index': 1,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {}
        }, {
            'answer': 'answer bbbbbbb',
            'time_spent_in_sec': 7.5,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {}
        }])
