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

    def setUp(self):
        super(RecomputeStateCompleteStatisticsTest, self).setUp()

        stats_models.StateCompleteEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1,
            1.0)
        stats_models.StateCompleteEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1,
            1.0)

        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, {self.state: {}})


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
        self.assertEqual(state_stats['num_completions'], 2)


class RecomputeAnswerSubmittedStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'
    session_id_2 = 'session_id_2'

    def setUp(self):
        super(RecomputeAnswerSubmittedStatisticsTest, self).setUp()

        stats_models.AnswerSubmittedEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1,
            1.0, True)
        stats_models.AnswerSubmittedEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1,
            1.0, True)
        stats_models.AnswerSubmittedEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_2,
            1.0, False)

        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, {self.state: {}})


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
        self.assertEqual(state_stats['total_answers_count'], 3)
        self.assertEqual(state_stats['useful_feedback_count'], 2)


class RecomputeStateHitStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'
    session_id_2 = 'session_id_2'

    def setUp(self):
        super(RecomputeStateHitStatisticsTest, self).setUp()

        stats_models.StateHitEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1,
            {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.StateHitEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1,
            {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.StateHitEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_2,
            {}, feconf.PLAY_TYPE_NORMAL)

        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, {self.state: {}})


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
        self.assertEqual(state_stats['first_hit_count'], 2)
        self.assertEqual(state_stats['total_hit_count'], 3)


class RecomputeSolutionHitStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'
    session_id_2 = 'session_id_2'
    session_id_3 = 'session_id_3'

    def setUp(self):
        super(RecomputeSolutionHitStatisticsTest, self).setUp()

        stats_models.SolutionHitEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1,
            1.0)
        stats_models.SolutionHitEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1,
            1.0)
        stats_models.SolutionHitEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_2,
            1.0)
        stats_models.SolutionHitEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_3,
            1.0)


        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, {self.state: {}})


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
        self.assertEqual(state_stats['num_times_solution_viewed'], 3)


class RecomputeActualStartStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'

    def setUp(self):
        super(RecomputeActualStartStatisticsTest, self).setUp()

        stats_models.ExplorationActualStartEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1)
        stats_models.ExplorationActualStartEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1)
        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, {self.state: {}})


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
        self.assertEqual(model.num_actual_starts, 2)


class RecomputeCompleteEventStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'

    def setUp(self):
        super(RecomputeCompleteEventStatisticsTest, self).setUp()

        stats_models.CompleteExplorationEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1,
            1.0, {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.CompleteExplorationEventLogEntryModel.create(
            self.exp_id, self.exp_version, self.state, self.session_id_1,
            1.0, {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, {self.state: {}})


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
        self.assertEqual(model.num_completions, 2)
