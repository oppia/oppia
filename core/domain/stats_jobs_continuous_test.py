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

"""Tests for statistics continuous computations."""

import datetime
import time

from core import jobs_registry
from core.domain import exp_domain
from core.domain import event_services
from core.domain import exp_services
from core.domain import stats_jobs_continuous
from core.platform import models
from core.tests import test_utils
import feconf

(exp_models, stats_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.statistics])

EMPTY_STATE_HIT_COUNTS_DICT = {
    feconf.DEFAULT_INIT_STATE_NAME: {
        'total_entry_count': 0,
        'no_answer_count': 0,
        'first_entry_count': 0,
    }
}


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


class StatsAggregatorUnitTests(test_utils.GenericTestBase):
    """Tests for statistics aggregations."""

    ALL_CC_MANAGERS_FOR_TESTS = [ModifiedStatisticsAggregator]

    def _get_swap_context(self):
        return self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS)

    def _record_start(self, exp_id, exp_version, state, session_id):
        event_services.StartExplorationEventHandler.record(
            exp_id, exp_version, state, session_id, {},
            feconf.PLAY_TYPE_NORMAL)

    def _record_leave(self, exp_id, exp_version, state, session_id):
        event_services.MaybeLeaveExplorationEventHandler.record(
            exp_id, exp_version, state, session_id, 27, {},
            feconf.PLAY_TYPE_NORMAL)

    def _record_complete(self, exp_id, exp_version, state, session_id):
        event_services.CompleteExplorationEventHandler.record(
            exp_id, exp_version, state, session_id, 27, {},
            feconf.PLAY_TYPE_NORMAL)

    def _record_state_hit(self, exp_id, exp_version, state, session_id):
        event_services.StateHitEventHandler.record(
            exp_id, exp_version, state, session_id, {},
            feconf.PLAY_TYPE_NORMAL)

    def _create_state_counter(self, exp_id, state, first_entry_count):
        counter = stats_models.StateCounterModel.get_or_create(exp_id, state)
        counter.first_entry_count = first_entry_count
        counter.put()

    def test_state_hit(self):
        with self._get_swap_context():
            exp_id = 'eid'
            exploration = self.save_new_valid_exploration(exp_id, 'owner')
            time.sleep(1)
            stats_jobs_continuous._STATE_COUNTER_CUTOFF_DATE = (  # pylint: disable=protected-access
                datetime.datetime.utcnow())
            original_init_state = exploration.init_state_name
            new_init_state_name = 'New init state'
            exploration.rename_state(original_init_state, new_init_state_name)
            exp_services._save_exploration('owner', exploration, '', [])  # pylint: disable=protected-access
            exp_version = 2
            state2_name = 'sid2'

            self._record_state_hit(
                exp_id, exp_version, new_init_state_name, 'session1')
            self._record_state_hit(
                exp_id, exp_version, new_init_state_name, 'session2')
            self._create_state_counter(exp_id, original_init_state, 18)
            self._record_state_hit(
                exp_id, exp_version, state2_name, 'session1')
            self._create_state_counter(exp_id, state2_name, 9)
            self.process_and_flush_pending_tasks()

            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            state_hit_counts = (
                stats_jobs_continuous.StatisticsAggregator.get_statistics(
                    exp_id, exp_version)['state_hit_counts'])
            self.assertEqual(
                state_hit_counts[new_init_state_name]['first_entry_count'], 2)
            self.assertEqual(
                state_hit_counts[state2_name]['first_entry_count'], 1)

            output_model = (
                stats_jobs_continuous.StatisticsAggregator.get_statistics(
                    exp_id, stats_jobs_continuous.VERSION_NONE))
            state_hit_counts = output_model['state_hit_counts']
            self.assertEqual(
                state_hit_counts[original_init_state]['first_entry_count'], 18)
            self.assertEqual(
                state_hit_counts[state2_name]['first_entry_count'], 9)
            self.assertEqual(output_model['start_exploration_count'], 18)

            state_hit_counts = (
                stats_jobs_continuous.StatisticsAggregator.get_statistics(
                    exp_id,
                    stats_jobs_continuous.VERSION_ALL)['state_hit_counts'])
            self.assertEqual(
                state_hit_counts[original_init_state]['first_entry_count'], 18)
            self.assertEqual(
                state_hit_counts[new_init_state_name]['first_entry_count'], 2)
            self.assertEqual(
                state_hit_counts[state2_name]['first_entry_count'], 10)

    def test_no_completion(self):
        with self._get_swap_context():
            exp_id = 'eid'
            exp_version = 1
            exploration = self.save_new_valid_exploration(exp_id, 'owner')
            state = exploration.init_state_name

            self._record_start(exp_id, exp_version, state, 'session1')
            self._record_start(exp_id, exp_version, state, 'session2')
            self.process_and_flush_pending_tasks()

            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            model_id = '%s:%s' % (exp_id, exp_version)
            output_model = stats_models.ExplorationAnnotationsModel.get(
                model_id)
            self.assertEqual(output_model.num_starts, 2)
            self.assertEqual(output_model.num_completions, 0)

    def test_all_complete(self):
        with self._get_swap_context():
            exp_id = 'eid'
            exp_version = 1
            exploration = self.save_new_valid_exploration(exp_id, 'owner')
            state = exploration.init_state_name

            self._record_start(exp_id, exp_version, state, 'session1')
            self._record_complete(
                exp_id, exp_version, stats_jobs_continuous.OLD_END_DEST,
                'session1')

            self._record_start(exp_id, exp_version, state, 'session2')
            self._record_complete(
                exp_id, exp_version, stats_jobs_continuous.OLD_END_DEST,
                'session2')
            self.process_and_flush_pending_tasks()

            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            model_id = '%s:%s' % (exp_id, exp_version)
            output_model = stats_models.ExplorationAnnotationsModel.get(
                model_id)
            self.assertEqual(output_model.num_starts, 2)
            self.assertEqual(output_model.num_completions, 2)

    def test_one_leave_and_one_complete(self):
        with self._get_swap_context():
            exp_id = 'eid'
            exp_version = 1
            exploration = self.save_new_valid_exploration(exp_id, 'owner')
            state = exploration.init_state_name

            self._record_start(exp_id, exp_version, state, 'session1')
            self._record_leave(exp_id, exp_version, state, 'session1')

            self._record_start(exp_id, exp_version, state, 'session2')
            self._record_complete(
                exp_id, exp_version, 'END', 'session2')
            self.process_and_flush_pending_tasks()

            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            model_id = '%s:%s' % (exp_id, exp_version)
            output_model = stats_models.ExplorationAnnotationsModel.get(
                model_id)
            self.assertEqual(output_model.num_starts, 2)
            self.assertEqual(output_model.num_completions, 1)

    def test_one_leave_and_one_complete_same_session(self):
        with self._get_swap_context():
            exp_id = 'eid'
            exp_version = 1
            exploration = self.save_new_valid_exploration(exp_id, 'owner')
            init_state = exploration.init_state_name

            self._record_start(exp_id, exp_version, init_state, 'session1')
            self._record_state_hit(exp_id, exp_version, init_state, 'session1')
            self._record_leave(exp_id, exp_version, init_state, 'session1')
            self._record_state_hit(exp_id, exp_version, 'END', 'session1')
            self._record_complete(exp_id, exp_version, 'END', 'session1')
            self.process_and_flush_pending_tasks()

            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            model_id = '%s:%s' % (exp_id, exp_version)
            output_model = stats_models.ExplorationAnnotationsModel.get(
                model_id)
            self.assertEqual(output_model.num_starts, 1)
            self.assertEqual(output_model.num_completions, 1)

            stats_dict = ModifiedStatisticsAggregator.get_statistics(exp_id, 1)
            self.assertEqual(stats_dict['start_exploration_count'], 1)
            self.assertEqual(stats_dict['complete_exploration_count'], 1)
            self.assertEqual(stats_dict['state_hit_counts'], {
                exploration.init_state_name: {
                    'first_entry_count': 1,
                    'no_answer_count': 0,
                    'total_entry_count': 1,
                },
                'END': {
                    'first_entry_count': 1,
                    'total_entry_count': 1,
                }
            })

    def test_multiple_maybe_leaves_same_session(self):
        with self._get_swap_context():
            exp_id = 'eid'
            exp_version = 1
            exploration = self.save_new_valid_exploration(exp_id, 'owner')
            state = exploration.init_state_name

            self._record_start(exp_id, exp_version, state, 'session1')
            self._record_leave(exp_id, exp_version, state, 'session1')
            self._record_leave(exp_id, exp_version, state, 'session1')
            self._record_complete(
                exp_id, exp_version, stats_jobs_continuous.OLD_END_DEST,
                'session1')

            self._record_start(exp_id, exp_version, state, 'session2')
            self._record_leave(exp_id, exp_version, state, 'session2')
            self._record_leave(exp_id, exp_version, state, 'session2')
            self.process_and_flush_pending_tasks()

            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            model_id = '%s:%s' % (exp_id, exp_version)
            output_model = stats_models.ExplorationAnnotationsModel.get(
                model_id)
            self.assertEqual(output_model.num_starts, 2)
            self.assertEqual(output_model.num_completions, 1)

    def test_multiple_explorations(self):
        with self._get_swap_context():
            exp_version = 1
            exp_id_1 = 'eid1'
            exploration = self.save_new_valid_exploration(exp_id_1, 'owner')
            state_1_1 = exploration.init_state_name
            exp_id_2 = 'eid2'
            exploration = self.save_new_valid_exploration(exp_id_2, 'owner')
            state_2_1 = exploration.init_state_name

            # Record 2 start events for exp_id_1 and 1 start event for
            # exp_id_2.
            self._record_start(exp_id_1, exp_version, state_1_1, 'session1')
            self._record_start(exp_id_1, exp_version, state_1_1, 'session2')
            self._record_start(exp_id_2, exp_version, state_2_1, 'session3')
            self.process_and_flush_pending_tasks()
            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            results = ModifiedStatisticsAggregator.get_statistics(
                exp_id_1, stats_jobs_continuous.VERSION_ALL)
            self.assertDictContainsSubset({
                'start_exploration_count': 2,
                'complete_exploration_count': 0,
                'state_hit_counts': EMPTY_STATE_HIT_COUNTS_DICT,
            }, results)
            results = ModifiedStatisticsAggregator.get_statistics(
                exp_id_2, stats_jobs_continuous.VERSION_ALL)
            self.assertDictContainsSubset({
                'start_exploration_count': 1,
                'complete_exploration_count': 0,
                'state_hit_counts': EMPTY_STATE_HIT_COUNTS_DICT,
            }, results)

            # Record 1 more start event for exp_id_1 and 1 more start event
            # for exp_id_2.
            self._record_start(exp_id_1, exp_version, state_1_1, 'session2')
            self._record_start(exp_id_2, exp_version, state_2_1, 'session3')
            self.process_and_flush_pending_tasks()
            results = ModifiedStatisticsAggregator.get_statistics(
                exp_id_1, stats_jobs_continuous.VERSION_ALL)
            self.assertDictContainsSubset({
                'start_exploration_count': 3,
                'complete_exploration_count': 0,
                'state_hit_counts': EMPTY_STATE_HIT_COUNTS_DICT,
            }, results)
            results = ModifiedStatisticsAggregator.get_statistics(
                exp_id_2, stats_jobs_continuous.VERSION_ALL)
            self.assertDictContainsSubset({
                'start_exploration_count': 2,
                'complete_exploration_count': 0,
                'state_hit_counts': EMPTY_STATE_HIT_COUNTS_DICT,
            }, results)

            views_for_all_exps = ModifiedStatisticsAggregator.get_views_multi([
                exp_id_1, exp_id_2])
            self.assertEqual(views_for_all_exps, [3, 2])

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


class InteractionAnswerSummariesAggregatorTests(test_utils.GenericTestBase):
    """Tests for interaction answer view aggregations."""

    CONTINUOUS_MANAGERS_FOR_TESTS = [
        ModifiedInteractionAnswerSummariesAggregator]

    def _record_start(self, exp_id, exp_version, state_name, session_id):
        event_services.StartExplorationEventHandler.record(
            exp_id, exp_version, state_name, session_id, {},
            feconf.PLAY_TYPE_NORMAL)

    def test_one_answer(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.CONTINUOUS_MANAGERS_FOR_TESTS):

            # setup example exploration
            exp_id = 'eid'
            exp = self.save_new_valid_exploration(exp_id, 'fake@user.com')
            first_state_name = exp.init_state_name
            second_state_name = 'State 2'
            exp_services.update_exploration('fake@user.com', exp_id, [{
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': first_state_name,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'new_value': 'MultipleChoiceInput',
            }, {
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': second_state_name,
            }, {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': second_state_name,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'new_value': 'MultipleChoiceInput',
            }], 'Add new state')
            exp = exp_services.get_exploration_by_id(exp_id)
            exp_version = exp.version

            time_spent = 5.0
            params = {}

            self._record_start(
                exp_id, exp_version, first_state_name, 'session1')
            self._record_start(
                exp_id, exp_version, first_state_name, 'session2')
            self.process_and_flush_pending_tasks()

            # add some answers
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'answer1')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session2', time_spent,
                params, 'answer1')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'answer2')
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, second_state_name, 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session2', time_spent,
                params, 'answer3')

            # Run job on exploration with answers
            ModifiedInteractionAnswerSummariesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(self.count_jobs_in_taskqueue(), 0)

            calc_id = 'AnswerFrequencies'

            # get job output of first state and check it
            calc_output_domain_object = (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output( # pylint: disable=line-too-long
                    exp_id, first_state_name, calc_id, exp_version))
            self.assertEqual(
                'AnswerFrequencies', calc_output_domain_object.calculation_id)

            calculation_output = calc_output_domain_object.calculation_output

            expected_calculation_output = [{
                'answer': 'answer1',
                'frequency': 2
            }, {
                'answer': 'answer2',
                'frequency': 1
            }]

            self.assertEqual(
                calculation_output, expected_calculation_output)

            # get job output of second state and check it
            calc_output_domain_object = (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output( # pylint: disable=line-too-long
                    exp_id, second_state_name, calc_id, exp_version))

            self.assertEqual(
                'AnswerFrequencies', calc_output_domain_object.calculation_id)

            calculation_output = calc_output_domain_object.calculation_output

            expected_calculation_output = [{
                'answer': 'answer3',
                'frequency': 1
            }]

            self.assertEqual(calculation_output, expected_calculation_output)


    def test_answers_across_multiple_exploration_versions(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.CONTINUOUS_MANAGERS_FOR_TESTS):

            # Setup example exploration.
            exp_id = 'eid'
            exp = self.save_new_valid_exploration(exp_id, 'fake@user.com')
            first_state_name = exp.init_state_name
            second_state_name = 'State 2'
            exp_services.update_exploration('fake@user.com', exp_id, [{
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': first_state_name,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'new_value': 'MultipleChoiceInput',
            }, {
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': second_state_name,
            }, {
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': second_state_name,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'new_value': 'MultipleChoiceInput',
            }], 'Add new state')
            exp = exp_services.get_exploration_by_id(exp_id)
            exp_version = exp.version

            time_spent = 5.0
            params = {}

            # Add an answer.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'answer1')

            # Run the answers aggregation job.
            ModifiedInteractionAnswerSummariesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(self.count_jobs_in_taskqueue(), 0)

            calc_id = 'AnswerFrequencies'

            # Check the output of the job.
            calc_output_first_domain_object = (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output( # pylint: disable=line-too-long
                    exp_id, first_state_name, calc_id,
                    exploration_version='2'))
            calc_output_all_domain_object = (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output( # pylint: disable=line-too-long
                    exp_id, first_state_name, calc_id,
                    exploration_version=None))

            self.assertEqual(
                'AnswerFrequencies',
                calc_output_first_domain_object.calculation_id)
            self.assertEqual(
                'AnswerFrequencies',
                calc_output_all_domain_object.calculation_id)

            calculation_output_first = (
                calc_output_first_domain_object.calculation_output)
            calculation_output_all = (
                calc_output_all_domain_object.calculation_output)

            expected_calculation_output_first_answer = [{
                'answer': 'answer1',
                'frequency': 1
            }]

            self.assertEqual(
                calculation_output_first,
                expected_calculation_output_first_answer)
            self.assertEqual(
                calculation_output_all,
                expected_calculation_output_first_answer)

            # Try modifying the exploration and adding another answer.
            exp_services.update_exploration('fake@user.com', exp_id, [{
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'third state',
            }], 'Adding yet another state')
            exp = exp_services.get_exploration_by_id(exp_id)
            self.assertNotEqual(exp.version, exp_version)

            # Submit another answer.
            exp_version = exp.version
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session2', time_spent,
                params, 'answer1')

            # Run the aggregator again.
            ModifiedInteractionAnswerSummariesAggregator.stop_computation('a')
            ModifiedInteractionAnswerSummariesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(self.count_jobs_in_taskqueue(), 0)

            # Extract the output from the job.
            calc_output_first_domain_object = (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output( # pylint: disable=line-too-long
                    exp_id, first_state_name, calc_id,
                    exploration_version='2'))
            calc_output_second_domain_object = (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output( # pylint: disable=line-too-long
                    exp_id, first_state_name, calc_id,
                    exploration_version='3'))
            calc_output_all_domain_object = (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output( # pylint: disable=line-too-long
                    exp_id, first_state_name, calc_id,
                    exploration_version=None))

            self.assertEqual(
                'AnswerFrequencies',
                calc_output_first_domain_object.calculation_id)
            self.assertEqual(
                'AnswerFrequencies',
                calc_output_second_domain_object.calculation_id)
            self.assertEqual(
                'AnswerFrequencies',
                calc_output_all_domain_object.calculation_id)

            calculation_output_first = (
                calc_output_first_domain_object.calculation_output)
            calculation_output_second = (
                calc_output_second_domain_object.calculation_output)
            calculation_output_all = (
                calc_output_all_domain_object.calculation_output)

            # The output for version 2 of the exploration should be the same,
            # but the total combined output should include both answers. Also,
            # the output for version 3 should only include the second answer.
            expected_calculation_output_second_answer = [{
                'answer': 'answer1',
                'frequency': 1
            }]
            expected_calculation_output_all_answers = [{
                'answer': 'answer1',
                'frequency': 2
            }]

            self.assertEqual(
                calculation_output_first,
                expected_calculation_output_first_answer)
            self.assertEqual(
                calculation_output_second,
                expected_calculation_output_second_answer)
            self.assertEqual(
                calculation_output_all,
                expected_calculation_output_all_answers)

    def test_multiple_computations_in_one_job(self):
        with self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):

            # setup example exploration
            exp_id = 'eid'
            exp = self.save_new_valid_exploration(exp_id, 'fake@user.com')
            first_state_name = exp.init_state_name
            second_state_name = 'State 2'
            exp_services.update_exploration('fake@user.com', exp_id, [{
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
            exp = exp_services.get_exploration_by_id(exp_id)
            exp_version = exp.version

            time_spent = 5.0
            params = {}

            # Add an answer.
            event_services.AnswerSubmissionEventHandler.record(
                exp_id, exp_version, first_state_name, 0, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, 'session1', time_spent,
                params, 'answer1')

            # Run the aggregator job.
            ModifiedInteractionAnswerSummariesAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            self.assertEqual(self.count_jobs_in_taskqueue(), 0)

            # Retrieve outputs for all of the computations running on this
            # interaction.
            answer_frequencies_calc_output_domain_object = (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output( # pylint: disable=line-too-long
                    exp_id, first_state_name, 'AnswerFrequencies'))
            self.assertEqual(
                'AnswerFrequencies',
                answer_frequencies_calc_output_domain_object.calculation_id)

            top5_answer_frequencies_calc_output_domain_object = (
                stats_jobs_continuous.InteractionAnswerSummariesAggregator.get_calc_output( # pylint: disable=line-too-long
                    exp_id, first_state_name, 'Top5AnswerFrequencies'))
            self.assertEqual(
                'Top5AnswerFrequencies',
                top5_answer_frequencies_calc_output_domain_object.calculation_id) # pylint: disable=line-too-long

            calculation_output_first = (
                answer_frequencies_calc_output_domain_object.calculation_output)
            calculation_output_second = (
                top5_answer_frequencies_calc_output_domain_object.calculation_output) # pylint: disable=line-too-long

            expected_calculation_output = [{
                'answer': 'answer1',
                'frequency': 1
            }]

            self.assertEqual(
                calculation_output_first, expected_calculation_output)
            self.assertEqual(
                calculation_output_second, expected_calculation_output)
