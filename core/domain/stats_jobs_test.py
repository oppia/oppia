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

__author__ = 'Stephanie Federwisch'

"""Tests for statistics continuous computations."""

import datetime

from core import jobs_registry
from core.domain import event_services
from core.domain import stats_jobs
from core.platform import models
(stats_models,) = models.Registry.import_models([models.NAMES.statistics])
from core.tests import test_utils
import feconf


class ModifiedStatisticsAggregator(stats_jobs.StatisticsAggregator):
    """A modified StatisticsAggregator that does not start a new batch
    job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return ModifiedStatisticsMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class ModifiedStatisticsMRJobManager(stats_jobs.StatisticsMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return ModifiedStatisticsAggregator


class StatsAggregatorUnitTests(test_utils.GenericTestBase):
    """Tests for statistics aggregations."""

    ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS = [
        ModifiedStatisticsAggregator]

    def _record_start(self, exp_id, exp_version, state, session_id):
        event_services.StartExplorationEventHandler.record(
            exp_id, exp_version, state, session_id, {},
            feconf.PLAY_TYPE_NORMAL)

    def _record_leave(self, exp_id, exp_version, state, session_id):
        event_services.MaybeLeaveExplorationEventHandler.record(
            exp_id, exp_version, state, session_id, 27, {},
            feconf.PLAY_TYPE_NORMAL)

    def test_no_completion(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
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

            output_model = stats_models.ExplorationAnnotationsModel.get(exp_id)
            self.assertEqual(output_model.num_starts, 2)
            self.assertEqual(output_model.num_completions, 0)

    def test_all_complete(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            exp_id = 'eid'
            exp_version = 1
            exploration = self.save_new_valid_exploration(exp_id, 'owner') 
            state = exploration.init_state_name

            self._record_start(exp_id, exp_version, state, 'session1')
            self._record_leave(
                exp_id, exp_version, feconf.END_DEST, 'session1')
            self._record_start(exp_id, exp_version, state, 'session2')
            self._record_leave(
                exp_id, exp_version, feconf.END_DEST, 'session2')
            self.process_and_flush_pending_tasks()

            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            output_model = stats_models.ExplorationAnnotationsModel.get(exp_id)
            self.assertEqual(output_model.num_starts, 2)
            self.assertEqual(output_model.num_completions, 2)

    def test_multiple_maybe_leaves_same_session(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            exp_id = 'eid'
            exp_version = 1
            exploration = self.save_new_valid_exploration(exp_id, 'owner') 
            state = exploration.init_state_name

            self._record_start(exp_id, exp_version, state, 'session1')
            self._record_leave(exp_id, exp_version, state, 'session1')
            self._record_leave(exp_id, exp_version, state, 'session1')
            self._record_leave(
                exp_id, exp_version, feconf.END_DEST, 'session1')

            self._record_start(exp_id, exp_version, state, 'session2')
            self._record_leave(exp_id, exp_version, state, 'session2')
            self._record_leave(exp_id, exp_version, state, 'session2')
            self.process_and_flush_pending_tasks()

            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            output_model = stats_models.ExplorationAnnotationsModel.get(exp_id)
            self.assertEqual(output_model.num_starts, 2)
            self.assertEqual(output_model.num_completions, 1)

    def test_multiple_explorations(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):

            exp_version = 1
            exp_id_1 = 'eid1'
            exploration = self.save_new_valid_exploration(exp_id_1, 'owner') 
            state_1_1 = exploration.init_state_name
            exp_id_2 = 'eid2'
            exploration = self.save_new_valid_exploration(exp_id_2, 'owner') 
            state_2_1 = exploration.init_state_name

            EMPTY_STATE_HIT_COUNTS_DICT = {
                'First State': {
                    'total_entry_count': 0,
                    'no_answer_count': 0,
                    'first_entry_count': 0,
                },
            }

            # Record 2 start events for exp_id_1 and 1 start event for
            # exp_id_2.
            self._record_start(exp_id_1, exp_version, state_1_1, 'session1')
            self._record_start(exp_id_1, exp_version, state_1_1, 'session2')
            self._record_start(exp_id_2, exp_version, state_2_1, 'session3')
            self.process_and_flush_pending_tasks()
            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            results = ModifiedStatisticsAggregator.get_statistics(exp_id_1)
            self.assertDictContainsSubset({
                'start_exploration_count': 2,
                'complete_exploration_count': 0,
                'state_hit_counts': EMPTY_STATE_HIT_COUNTS_DICT,
            }, results)
            results = ModifiedStatisticsAggregator.get_statistics(exp_id_2)
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
            results = ModifiedStatisticsAggregator.get_statistics(exp_id_1)
            self.assertDictContainsSubset({
                'start_exploration_count': 3,
                'complete_exploration_count': 0,
                'state_hit_counts': EMPTY_STATE_HIT_COUNTS_DICT,
            }, results)
            results = ModifiedStatisticsAggregator.get_statistics(exp_id_2)
            self.assertDictContainsSubset({
                'start_exploration_count': 2,
                'complete_exploration_count': 0,
                'state_hit_counts': EMPTY_STATE_HIT_COUNTS_DICT,
            }, results)
