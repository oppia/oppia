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

from datetime import datetime

from core import jobs_registry
from core.domain import event_services
from core.domain import stats_jobs
from core.platform import models
(job_models, stats_models,) = models.Registry.import_models([
    models.NAMES.job, models.NAMES.statistics])
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

    def test_no_completion(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            exp_id = 'eid'
            version = 1
            state = 'sid'
            event_services.StartExplorationEventHandler.record(
                exp_id, version, state, 'session1', {},
                feconf.PLAY_TYPE_NORMAL)
            event_services.StartExplorationEventHandler.record(
                exp_id, version, state, 'session2', {},
                feconf.PLAY_TYPE_NORMAL)
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
            version = 1
            state = 'sid'
            event_services.StartExplorationEventHandler.record(
                exp_id, version, state, 'session1', {},
                feconf.PLAY_TYPE_NORMAL)
            event_services.MaybeLeaveExplorationEventHandler.record(
                exp_id, version, feconf.END_DEST, 'session1', 27, {},
                feconf.PLAY_TYPE_NORMAL)
            event_services.StartExplorationEventHandler.record(
                exp_id, version, state, 'session2', {},
                feconf.PLAY_TYPE_NORMAL)
            event_services.MaybeLeaveExplorationEventHandler.record(
                exp_id, version, feconf.END_DEST, 'session2', 27, {},
                feconf.PLAY_TYPE_NORMAL)
            self.process_and_flush_pending_tasks()

            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            output_model = stats_models.ExplorationAnnotationsModel.get(exp_id)
            self.assertEqual(output_model.num_starts, 2)
            self.assertEqual(output_model.num_completions, 2)

    def _create_leave_event(self, exp_id, version, state, session, created_on):
        leave = stats_models.MaybeLeaveExplorationEventLogEntryModel(
            event_type=feconf.EVENT_TYPE_MAYBE_LEAVE_EXPLORATION,
            exploration_id=exp_id,
            exploration_version=version,
            state_name=state,
            session_id=session,
            client_time_spent_in_secs=27.0,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL)
        leave.put()
        leave.created_on = datetime.fromtimestamp(created_on)
        leave.put()

    def test_multiple_maybe_leaves_same_session(self):
        with self.swap(
                jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
                self.ALL_CONTINUOUS_COMPUTATION_MANAGERS_FOR_TESTS):
            exp_id = 'eid'
            version = 1
            state = 'sid'
            event_services.StartExplorationEventHandler.record(
                exp_id, version, state, 'session1', {},
                feconf.PLAY_TYPE_NORMAL)
            self._create_leave_event(exp_id, version, state, 'session1', 0)
            self._create_leave_event(exp_id, version, state, 'session1', 1)
            self._create_leave_event(
                exp_id, version, feconf.END_DEST, 'session1', 2)
            event_services.StartExplorationEventHandler.record(
                exp_id, version, state, 'session2', {},
                feconf.PLAY_TYPE_NORMAL)
            self._create_leave_event(exp_id, version, state, 'session2', 3)
            self._create_leave_event(exp_id, version, state, 'session2', 4)
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
            version = 1
            exp_id_1 = 'eid1'
            state_1_1 = 'sid1'
            exp_id_2 = 'eid2'
            state_2_1 = 'sid1'

            # Record 2 start events for exp_id_1 and 1 start event for
            # exp_id_2.
            event_services.StartExplorationEventHandler.record(
                exp_id_1, version, state_1_1, 'session1', {},
                feconf.PLAY_TYPE_NORMAL)
            event_services.StartExplorationEventHandler.record(
                exp_id_1, version, state_1_1, 'session2', {},
                feconf.PLAY_TYPE_NORMAL)
            event_services.StartExplorationEventHandler.record(
                exp_id_2, version, state_2_1, 'session3', {},
                feconf.PLAY_TYPE_NORMAL)
            self.process_and_flush_pending_tasks()

            ModifiedStatisticsAggregator.start_computation()
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()

            self.assertEqual(
                ModifiedStatisticsAggregator.get_statistics(exp_id_1), {
                    'start_exploration_count': 2,
                    'complete_exploration_count': 0
                })
            self.assertEqual(
                ModifiedStatisticsAggregator.get_statistics(exp_id_2), {
                    'start_exploration_count': 1,
                    'complete_exploration_count': 0
                })

            # Record 1 more start event for exp_id_1 and 1 more start event
            # for exp_id_2.
            event_services.StartExplorationEventHandler.record(
                exp_id_1, version, state_1_1, 'session2', {},
                feconf.PLAY_TYPE_NORMAL)
            event_services.StartExplorationEventHandler.record(
                exp_id_2, version, state_2_1, 'session3', {},
                feconf.PLAY_TYPE_NORMAL)
            self.process_and_flush_pending_tasks()

            self.assertEqual(
                ModifiedStatisticsAggregator.get_statistics(exp_id_1), {
                    'start_exploration_count': 3,
                    'complete_exploration_count': 0
                })
            self.assertEqual(
                ModifiedStatisticsAggregator.get_statistics(exp_id_2), {
                    'start_exploration_count': 2,
                    'complete_exploration_count': 0
                })
