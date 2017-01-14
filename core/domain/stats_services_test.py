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

from core import jobs_registry
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

    def _get_submitted_answer_dict_list(self, state_answers):
        submitted_answer_dict_list = (
            state_answers.get_submitted_answer_dict_list())
        for submitted_answer_dict in submitted_answer_dict_list:
            del submitted_answer_dict['json_size']
        return submitted_answer_dict_list

    def test_record_answer(self):
        self.save_new_default_exploration('eid', 'fake@user.com')
        exp = exp_services.get_exploration_by_id('eid')

        first_state_name = exp.init_state_name
        second_state_name = 'State 2'
        exp_services.update_exploration('fake@user.com', 'eid', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': first_state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput',
        }, {
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': second_state_name,
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': second_state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput',
        }], 'Add new state')
        exp = exp_services.get_exploration_by_id('eid')

        exp_version = exp.version

        for state_name in [first_state_name, second_state_name]:
            state_answers = stats_services.get_state_answers(
                'eid', exp_version, state_name)
            self.assertEqual(state_answers, None)

        # answer is a string
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 0, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, 'answer1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 0, 1,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid2', self.TIME_SPENT,
            self.PARAMS, 'answer1')
        # answer is a dict
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 1, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, {'x': 1.0, 'y': 5.0})
        # answer is a list
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, second_state_name, 2, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid3', self.TIME_SPENT,
            self.PARAMS, [2, 4, 8])
        # answer is a unicode string
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, second_state_name, 1, 1,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid4', self.TIME_SPENT,
            self.PARAMS, self.UNICODE_TEST_STRING)

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

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, first_state_name)
        self.assertEqual(
            self._get_submitted_answer_dict_list(state_answers),
            expected_submitted_answer_list1)

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, second_state_name)
        self.assertEqual(
            self._get_submitted_answer_dict_list(state_answers),
            expected_submitted_answer_list2)


class RecordAnswerTests(test_utils.GenericTestBase):
    """Tests for functionality related to recording and retrieving answers."""

    EXP_ID = 'exp_id0'

    def _get_submitted_answer_dict_list(self, state_answers):
        submitted_answer_dict_list = (
            state_answers.get_submitted_answer_dict_list())
        for submitted_answer_dict in submitted_answer_dict_list:
            del submitted_answer_dict['json_size']
        return submitted_answer_dict_list

    def setUp(self):
        super(RecordAnswerTests, self).setUp()
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
                0, exp_domain.EXPLICIT_CLASSIFICATION, {},
                'a_session_id_val', 1.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(self._get_submitted_answer_dict_list(state_answers), [{
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
            self.exploration, self.exploration.init_state_name,
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
        self.assertEqual(self._get_submitted_answer_dict_list(state_answers), [{
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
            self.exploration, self.exploration.init_state_name,
            stats_domain.SubmittedAnswer(
                'first answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, {},
                'a_session_id_val', 1.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(self._get_submitted_answer_dict_list(state_answers), [{
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
            self.exploration, self.exploration.init_state_name,
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
        self.assertEqual(self._get_submitted_answer_dict_list(state_answers), [{
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
        self.assertEqual(self._get_submitted_answer_dict_list(state_answers), [{
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
            self.exploration, self.exploration.init_state_name,
            submitted_answer_list * 200)

        # Verify more than 1 shard was stored. The index shard (shard_id 0) is
        # not included in the shard count.
        model = stats_models.StateAnswersModel.get('%s:%s:%s:%s' % (
            self.exploration.id, str(self.exploration.version),
            self.exploration.init_state_name, '0'))
        self.assertEqual(model.shard_count, 1)

        # The order of the answers returned depends on the size of the answers.
        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 1)
        self.assertEqual(
            state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(state_answers.interaction_id, 'TextInput')
        self.assertEqual(
            len(self._get_submitted_answer_dict_list(state_answers)), 600)

    def test_record_many_answers_with_preexisting_entry(self):
        stats_services.record_answer(
            self.exploration, self.exploration.init_state_name,
            stats_domain.SubmittedAnswer(
                '1 answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, {},
                'a_session_id_val', 1.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(self._get_submitted_answer_dict_list(state_answers), [{
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
        self.assertEqual(self._get_submitted_answer_dict_list(state_answers), [{
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


class AnswerStatsTests(test_utils.GenericTestBase):
    """Tests functionality related to answer statistics."""

    ALL_CC_MANAGERS_FOR_TESTS = [ModifiedInteractionAnswerSummariesAggregator]
    DEFAULT_TIME_SPENT = 10.0

    def setUp(self):
        super(AnswerStatsTests, self).setUp()
        self.exploration0 = self.save_new_valid_exploration(
            'eid0', 'test@example.com')
        self.exploration1 = self.save_new_valid_exploration(
            'eid1', 'test@example.com')
        self.state_name00 = self.exploration0.init_state_name
        self.state_name01 = 'Second'
        self.state_name10 = self.exploration1.init_state_name

        exp_services.update_exploration('test@example.com', 'eid0', [{
            'cmd': 'add_state',
            'state_name': self.state_name01,
        }, {
            'cmd': 'edit_state_property',
            'state_name': self.state_name01,
            'property_name': 'widget_id',
            'new_value': 'TextInput',
        }], 'Add new state')
        self.exploration0 = exp_services.get_exploration_by_id('eid0')

    def _record_answer(
            self, answer_str, exploration, state_name,
            classification=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION):
        stats_services.record_answer(
            exploration, state_name, stats_domain.SubmittedAnswer(
                answer_str, 'TextInput', 0, 0, classification, {}, 'session',
                self.DEFAULT_TIME_SPENT))

    def _record_answer_to_default_exp(
            self, answer_str,
            classification=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION):
        self._record_answer(
            answer_str, self.exploration0, self.state_name00,
            classification=classification)

    def _run_aggregator_job(self):
        """Start the InteractionAnswerSummariesAggregator to aggregate submitted
        answers.
        """
        ModifiedInteractionAnswerSummariesAggregator.start_computation()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self.count_jobs_in_taskqueue(), 0)

    def test_get_top_state_rule_answers(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS):
            # There are no initial top answers for this state.
            top_answers = stats_services.get_top_state_rule_answers(
                'eid0', self.state_name00, [
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION])
            self.assertEqual(len(top_answers), 0)

            # Submit some answers.
            self._record_answer_to_default_exp('a')
            self._record_answer_to_default_exp('a')
            self._record_answer_to_default_exp('b')
            self._record_answer_to_default_exp('b')
            self._record_answer_to_default_exp('b')
            self._record_answer_to_default_exp('c')
            self._record_answer_to_default_exp('c')
            self._run_aggregator_job()

            top_answers = stats_services.get_top_state_rule_answers(
                'eid0', self.state_name00, [
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION])
            self.assertEqual(len(top_answers), 3)
            self.assertEqual(top_answers, [{
                'answer': 'b',
                'frequency': 3
            }, {
                'answer': 'a',
                'frequency': 2
            }, {
                'answer': 'c',
                'frequency': 2
            }])

    def test_get_top_state_answers_for_multiple_classified_rules(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS):
            # There are no initial top answers for this state.
            top_answers = stats_services.get_top_state_rule_answers(
                'eid0', self.state_name00, [
                    exp_domain.STATISTICAL_CLASSIFICATION,
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION])
            self.assertEqual(len(top_answers), 0)

            # Submit some answers.
            self._record_answer_to_default_exp(
                'a', classification=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'a', classification=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'b', classification=exp_domain.STATISTICAL_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'b', classification=exp_domain.STATISTICAL_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'b', classification=exp_domain.STATISTICAL_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'c', classification=exp_domain.STATISTICAL_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'c', classification=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
            self._run_aggregator_job()

            top_answers = stats_services.get_top_state_rule_answers(
                'eid0', self.state_name00, [
                    exp_domain.STATISTICAL_CLASSIFICATION,
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION])
            self.assertEqual(len(top_answers), 3)
            # Rules across multiple rule types are combined and still sorted by
            # frequency.
            self.assertEqual(top_answers, [{
                'answer': 'b',
                'frequency': 3
            }, {
                'answer': 'c',
                'frequency': 2
            }, {
                'answer': 'a',
                'frequency': 2
            }])

    def test_get_top_state_rule_answers_from_multiple_explorations(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS):
            # There are no initial top answers for these explorations.
            top_answers_list = stats_services.get_top_state_rule_answers_multi(
                [('eid0', self.state_name00), ('eid1', self.state_name10)],
                [exp_domain.DEFAULT_OUTCOME_CLASSIFICATION])
            self.assertEqual(len(top_answers_list), 2)
            self.assertEqual(len(top_answers_list[0]), 0)
            self.assertEqual(len(top_answers_list[1]), 0)

            # Submit some answers.
            self._record_answer('a', self.exploration0, self.state_name00)
            self._record_answer('a', self.exploration1, self.state_name10)
            self._record_answer('b', self.exploration1, self.state_name10)
            self._record_answer('b', self.exploration1, self.state_name10)
            self._record_answer('b', self.exploration1, self.state_name10)
            self._record_answer('c', self.exploration1, self.state_name10)
            self._record_answer('c', self.exploration0, self.state_name00)
            self._run_aggregator_job()

            top_answers_list = stats_services.get_top_state_rule_answers_multi(
                [('eid0', self.state_name00), ('eid1', self.state_name10)],
                [exp_domain.DEFAULT_OUTCOME_CLASSIFICATION])
            self.assertEqual(len(top_answers_list), 2)
            self.assertEqual(top_answers_list[0], [{
                'answer': 'a',
                'frequency': 1
            }, {
                'answer': 'c',
                'frequency': 1
            }])
            self.assertEqual(top_answers_list[1], [{
                'answer': 'b',
                'frequency': 3
            }, {
                'answer': 'a',
                'frequency': 1
            }, {
                'answer': 'c',
                'frequency': 1
            }])

    def test_get_top_state_rule_answers_from_multiple_states(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS):
            # There are no initial top answers for these states.
            top_answers_list = stats_services.get_top_state_rule_answers_multi(
                [('eid0', self.state_name00), ('eid0', self.state_name01)],
                [exp_domain.DEFAULT_OUTCOME_CLASSIFICATION])
            self.assertEqual(len(top_answers_list), 2)
            self.assertEqual(len(top_answers_list[0]), 0)
            self.assertEqual(len(top_answers_list[1]), 0)

            # Submit some answers.
            self._record_answer('a', self.exploration0, self.state_name00)
            self._record_answer('a', self.exploration0, self.state_name01)
            self._record_answer('b', self.exploration0, self.state_name01)
            self._record_answer('b', self.exploration0, self.state_name01)
            self._record_answer('b', self.exploration0, self.state_name01)
            self._record_answer('c', self.exploration0, self.state_name01)
            self._record_answer('c', self.exploration0, self.state_name00)
            self._run_aggregator_job()

            top_answers_list = stats_services.get_top_state_rule_answers_multi(
                [('eid0', self.state_name00), ('eid0', self.state_name01)],
                [exp_domain.DEFAULT_OUTCOME_CLASSIFICATION])
            self.assertEqual(len(top_answers_list), 2)
            self.assertEqual(top_answers_list[0], [{
                'answer': 'a',
                'frequency': 1
            }, {
                'answer': 'c',
                'frequency': 1
            }])
            self.assertEqual(top_answers_list[1], [{
                'answer': 'b',
                'frequency': 3
            }, {
                'answer': 'a',
                'frequency': 1
            }, {
                'answer': 'c',
                'frequency': 1
            }])

    def test_count_top_state_rule_answers(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS):
            # There are no initial top answers for this state.
            default_answer_count = stats_services.count_top_state_rule_answers(
                'eid0', self.state_name00,
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
            self.assertEqual(default_answer_count, 0)

            stats_answer_count = stats_services.count_top_state_rule_answers(
                'eid0', self.state_name00,
                exp_domain.STATISTICAL_CLASSIFICATION)
            self.assertEqual(stats_answer_count, 0)

            # Submit some answers.
            self._record_answer_to_default_exp(
                'a', classification=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'a', classification=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'b', classification=exp_domain.STATISTICAL_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'b', classification=exp_domain.STATISTICAL_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'b', classification=exp_domain.STATISTICAL_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'c', classification=exp_domain.STATISTICAL_CLASSIFICATION)
            self._record_answer_to_default_exp(
                'c', classification=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
            self._run_aggregator_job()

            top_answers = stats_services.get_top_state_rule_answers(
                'eid0', self.state_name00, [
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION])
            # Rules across multiple rule types are combined and still sorted by
            # frequency.
            self.assertEqual(top_answers, [{
                'answer': 'a',
                'frequency': 2
            }, {
                'answer': 'c',
                'frequency': 1
            }])

            default_answer_count = stats_services.count_top_state_rule_answers(
                'eid0', self.state_name00,
                exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
            self.assertEqual(default_answer_count, 3)

            top_answers = stats_services.get_top_state_rule_answers(
                'eid0', self.state_name00, [
                    exp_domain.STATISTICAL_CLASSIFICATION])
            # Rules across multiple rule types are combined and still sorted by
            # frequency.
            self.assertEqual(top_answers, [{
                'answer': 'b',
                'frequency': 3
            }, {
                'answer': 'c',
                'frequency': 1
            }])

            stats_answer_count = stats_services.count_top_state_rule_answers(
                'eid0', self.state_name00,
                exp_domain.STATISTICAL_CLASSIFICATION)
            self.assertEqual(stats_answer_count, 4)


class UnresolvedAnswersTests(test_utils.GenericTestBase):
    """Tests the unresolved answers methods."""

    ALL_CC_MANAGERS_FOR_TESTS = [ModifiedInteractionAnswerSummariesAggregator]
    STATE_2_NAME = 'State 2'
    DEFAULT_TIME_SPENT = 10.0

    def _create_and_update_fake_exploration(self, exp_id):
        self.save_new_valid_exploration(exp_id, 'fake@user.com')
        exp_services.update_exploration('fake@user.com', exp_id, [{
            'cmd': 'add_state',
            'state_name': self.STATE_2_NAME,
        }, {
            'cmd': 'edit_state_property',
            'state_name': self.STATE_2_NAME,
            'property_name': 'widget_id',
            'new_value': 'TextInput',
        }], 'Add new state')
        return exp_services.get_exploration_by_id(exp_id)

    def _get_default_dict_when_no_unresolved_answers(self, exp_ids):
        result = {}
        for exp_id in exp_ids:
            result[exp_id] = {'frequency': 0, 'unresolved_answers': []}
        return result

    def _record_answer(
            self, answer_str, exploration, state_name,
            classification=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION):
        stats_services.record_answer(
            exploration, state_name, stats_domain.SubmittedAnswer(
                answer_str, 'TextInput', 0, 0, classification, {}, 'session',
                self.DEFAULT_TIME_SPENT))

    def _run_aggregator_job(self):
        """Start the InteractionAnswerSummariesAggregator to aggregate submitted
        answers.
        """
        ModifiedInteractionAnswerSummariesAggregator.start_computation()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self.count_jobs_in_taskqueue(), 0)

    def test_unresolved_answers_for_single_exploration(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS):
            exp_1 = self._create_and_update_fake_exploration('eid1')
            self.assertEqual(
                stats_services.get_exps_unresolved_answers_for_default_rule(
                    ['eid1']),
                self._get_default_dict_when_no_unresolved_answers(['eid1']))
            self._record_answer('a1', exp_1, exp_1.init_state_name)
            self._run_aggregator_job()
            self.assertEqual(
                stats_services.get_exps_unresolved_answers_for_default_rule(
                    ['eid1']), {
                        'eid1': {
                            'frequency': 1,
                            'unresolved_answers': [{
                                'frequency': 1,
                                'answer': 'a1',
                                'state': exp_1.init_state_name
                            }]
                        }
                    })

    def test_unresolved_answers_for_multiple_explorations(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS):
            exp_1 = self._create_and_update_fake_exploration('eid1')
            exp_2 = self._create_and_update_fake_exploration('eid2')
            exp_3 = self._create_and_update_fake_exploration('eid3')
            self.assertEqual(
                stats_services.get_exps_unresolved_answers_for_default_rule(
                    ['eid1', 'eid2', 'eid3']),
                self._get_default_dict_when_no_unresolved_answers(
                    ['eid1', 'eid2', 'eid3']))
            self._record_answer('a1', exp_1, exp_1.init_state_name)
            self._record_answer('a3', exp_2, exp_2.init_state_name)
            self._record_answer('a2', exp_2, exp_2.init_state_name)
            self._record_answer('a2', exp_3, exp_3.init_state_name)
            self._run_aggregator_job()
            self.assertEqual(
                stats_services.get_exps_unresolved_answers_for_default_rule(
                    ['eid1', 'eid2', 'eid3']), {
                        'eid1': {
                            'frequency': 1,
                            'unresolved_answers': [{
                                'frequency': 1,
                                'answer': 'a1',
                                'state': exp_1.init_state_name
                            }]
                        },
                        'eid2': {
                            'frequency': 2,
                            'unresolved_answers': [{
                                'frequency': 1,
                                'answer': 'a3',
                                'state': exp_2.init_state_name
                            }, {
                                'frequency': 1,
                                'answer': 'a2',
                                'state': exp_2.init_state_name
                            }]
                        },
                        'eid3': {
                            'frequency': 1,
                            'unresolved_answers': [{
                                'frequency': 1,
                                'answer': 'a2',
                                'state': exp_3.init_state_name
                            }]
                        }
                    })

    def test_unresolved_answers_count_for_multiple_states(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS):
            exp_1 = self._create_and_update_fake_exploration('eid1')
            self.assertEqual(
                stats_services.get_exps_unresolved_answers_for_default_rule(
                    ['eid1']),
                self._get_default_dict_when_no_unresolved_answers(['eid1']))
            self._record_answer('a1', exp_1, exp_1.init_state_name)
            self._record_answer('a1', exp_1, self.STATE_2_NAME)
            self._record_answer('a2', exp_1, self.STATE_2_NAME)
            self._run_aggregator_job()
            self.assertEqual(
                stats_services.get_exps_unresolved_answers_for_default_rule(
                    ['eid1']), {
                        'eid1': {
                            'frequency': 3,
                            'unresolved_answers': [{
                                'frequency': 1,
                                'answer': 'a1',
                                'state': exp_1.init_state_name
                            }, {
                                'frequency': 1,
                                'answer': 'a1',
                                'state': self.STATE_2_NAME
                            }, {
                                'frequency': 1,
                                'answer': 'a2',
                                'state': self.STATE_2_NAME
                            }]
                        }
                    })

    def test_unresolved_answers_count_for_non_default_rules(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS):
            exp_1 = self._create_and_update_fake_exploration('eid1')
            self.assertEqual(
                stats_services.get_exps_unresolved_answers_for_default_rule(
                    ['eid1']),
                self._get_default_dict_when_no_unresolved_answers(['eid1']))
            self._record_answer(
                'a1', exp_1, exp_1.init_state_name,
                classification=exp_domain.STATISTICAL_CLASSIFICATION)
            self._record_answer(
                'a1', exp_1, self.STATE_2_NAME,
                classification=exp_domain.STATISTICAL_CLASSIFICATION)
            self._run_aggregator_job()
            self.assertEqual(
                stats_services.get_exps_unresolved_answers_for_default_rule(
                    ['eid1']),
                self._get_default_dict_when_no_unresolved_answers(['eid1']))


class ExplorationStatsTests(test_utils.GenericTestBase):
    """Tests for stats functions related to explorations."""
    pass
