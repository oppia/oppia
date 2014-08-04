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

    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class StatsPageJobIntegrationTests(test_utils.GenericTestBase):
    """Tests for exploration annotations."""

    def test_no_completion(self):
        exp_id = 'eid'
        version = 1
        state = 'sid'
        event_services.StartExplorationEventHandler.record(
            exp_id, version, state, 'session1', {}, feconf.PLAY_TYPE_NORMAL)
        event_services.StartExplorationEventHandler.record(
            exp_id, version, state, 'session2', {}, feconf.PLAY_TYPE_NORMAL)
        self.process_and_flush_pending_tasks()

        ModifiedStatisticsAggregator.start_computation()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()

        output_model = stats_models.ExplorationAnnotationsModel.get(exp_id)
        self.assertEqual(output_model.num_starts, 2)
        self.assertEqual(output_model.num_completions, 0)

    def test_all_complete(self):
        exp_id = 'eid'
        version = 1
        state = 'sid'
        event_services.StartExplorationEventHandler.record(
            exp_id, version, state, 'session1', {}, feconf.PLAY_TYPE_NORMAL)
        event_services.MaybeLeaveExplorationEventHandler.record(
            exp_id, version, feconf.END_DEST, 'session1', 27, {},
            feconf.PLAY_TYPE_NORMAL)
        event_services.StartExplorationEventHandler.record(
            exp_id, version, state, 'session2', {}, feconf.PLAY_TYPE_NORMAL)
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
        exp_id = 'eid'
        version = 1
        state = 'sid'
        event_services.StartExplorationEventHandler.record(
            exp_id, version, state, 'session1', {}, feconf.PLAY_TYPE_NORMAL)
        self._create_leave_event(exp_id, version, state, 'session1', 0)
        self._create_leave_event(exp_id, version, state, 'session1', 1)
        self._create_leave_event(
            exp_id, version, feconf.END_DEST, 'session1', 2)
        event_services.StartExplorationEventHandler.record(
            exp_id, version, state, 'session2', {}, feconf.PLAY_TYPE_NORMAL)
        self._create_leave_event(exp_id, version, state, 'session2', 3)
        self._create_leave_event(exp_id, version, state, 'session2', 4)
        self.process_and_flush_pending_tasks()

        ModifiedStatisticsAggregator.start_computation()
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()

        output_model = stats_models.ExplorationAnnotationsModel.get(exp_id)
        self.assertEqual(output_model.num_starts, 2)
        self.assertEqual(output_model.num_completions, 1)
