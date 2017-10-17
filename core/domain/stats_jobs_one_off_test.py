# coding: utf-8
#
# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Tests for statistics one off computations."""

import feconf

from core.domain import stats_jobs_one_off
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


class RecomputeStateCompleteStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'
    session_id_2 = 'session_id_2'
    session_id_3 = 'session_id_3'
    entity_id_1 = 'entity_id_1'
    entity_id_2 = 'entity_id_2'
    entity_id_3 = 'entity_id_3'

    def setUp(self):
        super(RecomputeStateCompleteStatisticsTest, self).setUp()

        stats_models.StateCompleteEventLogEntryModel(
            id=self.entity_id_1,
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.StateCompleteEventLogEntryModel(
            id=self.entity_id_2,
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_2,
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.StateCompleteEventLogEntryModel(
            id=self.entity_id_3,
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_3,
            time_spent_in_state_secs=1.0,
            event_schema_version=1).put()


        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0,
            {self.state: {}})


    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStateCompleteStatistics.create_new())
        stats_jobs_one_off.RecomputeStateCompleteStatistics.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, str(self.exp_version))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state]
        self.assertEqual(state_stats['num_completions_v2'], 2)


class RecomputeAnswerSubmittedStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'
    session_id_2 = 'session_id_2'

    def setUp(self):
        super(RecomputeAnswerSubmittedStatisticsTest, self).setUp()
        stats_models.AnswerSubmittedEventLogEntryModel(
            id='id1',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            time_spent_in_state_secs=1.0,
            is_feedback_useful=True,
            event_schema_version=2).put()
        stats_models.AnswerSubmittedEventLogEntryModel(
            id='id2',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            time_spent_in_state_secs=1.0,
            is_feedback_useful=True,
            event_schema_version=2).put()
        stats_models.AnswerSubmittedEventLogEntryModel(
            id='id3',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            time_spent_in_state_secs=1.0,
            is_feedback_useful=False,
            event_schema_version=2).put()
        stats_models.AnswerSubmittedEventLogEntryModel(
            id='id4',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            time_spent_in_state_secs=1.0,
            is_feedback_useful=True,
            event_schema_version=1).put()

        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0, {self.state: {}})


    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeAnswerSubmittedStatistics.create_new())
        stats_jobs_one_off.RecomputeAnswerSubmittedStatistics.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, str(self.exp_version))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state]
        self.assertEqual(state_stats['total_answers_count_v2'], 3)
        self.assertEqual(state_stats['useful_feedback_count_v2'], 2)


class RecomputeStateHitStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'
    session_id_2 = 'session_id_2'

    def setUp(self):
        super(RecomputeStateHitStatisticsTest, self).setUp()
        stats_models.StateHitEventLogEntryModel(
            id='id1',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.exp_id,
            exploration_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.StateHitEventLogEntryModel(
            id='id2',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.exp_id,
            exploration_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.StateHitEventLogEntryModel(
            id='id3',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.exp_id,
            exploration_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_2,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.StateHitEventLogEntryModel(
            id='id4',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.exp_id,
            exploration_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_2,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=1).put()

        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0, {self.state: {}})


    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStateHitStatistics.create_new())
        stats_jobs_one_off.RecomputeStateHitStatistics.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, str(self.exp_version))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state]
        self.assertEqual(state_stats['first_hit_count_v2'], 2)
        self.assertEqual(state_stats['total_hit_count_v2'], 3)


class RecomputeSolutionHitStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'
    session_id_2 = 'session_id_2'
    session_id_3 = 'session_id_3'

    def setUp(self):
        super(RecomputeSolutionHitStatisticsTest, self).setUp()
        stats_models.SolutionHitEventLogEntryModel(
            id='id1',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.SolutionHitEventLogEntryModel(
            id='id2',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.SolutionHitEventLogEntryModel(
            id='id3',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_2,
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.SolutionHitEventLogEntryModel(
            id='id4',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_3,
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.SolutionHitEventLogEntryModel(
            id='id1',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            time_spent_in_state_secs=1.0,
            event_schema_version=1).put()

        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0, {self.state: {}})


    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeSolutionHitStatistics.create_new())
        stats_jobs_one_off.RecomputeSolutionHitStatistics.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, str(self.exp_version))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state]
        self.assertEqual(state_stats['num_times_solution_viewed_v2'], 3)


class RecomputeActualStartStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'

    def setUp(self):
        super(RecomputeActualStartStatisticsTest, self).setUp()
        stats_models.ExplorationActualStartEventLogEntryModel(
            id='id1',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            event_schema_version=2).put()
        stats_models.ExplorationActualStartEventLogEntryModel(
            id='id2',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            event_schema_version=2).put()
        stats_models.ExplorationActualStartEventLogEntryModel(
            id='id3',
            exp_id=self.exp_id,
            exp_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            event_schema_version=1).put()
        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0, {self.state: {}})


    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeActualStartStatistics.create_new())
        stats_jobs_one_off.RecomputeActualStartStatistics.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, str(self.exp_version))
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_actual_starts_v2, 2)


class RecomputeCompleteEventStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'

    def setUp(self):
        super(RecomputeCompleteEventStatisticsTest, self).setUp()

        stats_models.CompleteExplorationEventLogEntryModel(
            id='id1',
            event_type=feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
            exploration_id=self.exp_id,
            exploration_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            client_time_spent_in_secs=1.0,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.CompleteExplorationEventLogEntryModel(
            id='id2',
            event_type=feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
            exploration_id=self.exp_id,
            exploration_version=self.exp_version,
            state_name=self.state,
            session_id=self.session_id_1,
            client_time_spent_in_secs=1.0,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0, {self.state: {}})


    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeCompleteEventStatistics.create_new())
        stats_jobs_one_off.RecomputeCompleteEventStatistics.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, str(self.exp_version))
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_completions_v2, 2)
