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

"""Tests for statistics MapReduce jobs."""

import feconf
from core import jobs
from core.platform import models
from time import sleep
from core.domain import stats_jobs
from core.domain import stats_services
import test_utils

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])

class StatsPageJobIntegrationTests(test_utils.GenericTestBase):
    """Tests for exlporation annotations."""

    def test_no_completion(self):
        exp_id = 'eid'
        version = 1
        state = 'sid'
        stats_services.EventHandler.start_exploration(
            exp_id, version, state, 'session1', {}, feconf.PLAY_TYPE_PLAYTEST)
        stats_services.EventHandler.start_exploration(
            exp_id, version, state, 'session2', {}, feconf.PLAY_TYPE_PLAYTEST)
        job_id = (
           stats_jobs.StatisticsPageJobManager.create_new())
        stats_jobs.StatisticsPageJobManager.enqueue(job_id)
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            stats_jobs.StatisticsPageJobManager.get_status_code(job_id), 
            jobs.STATUS_CODE_COMPLETED)
        output_model = stats_models.ExplorationAnnotationModel.get(exp_id)
        self.assertEqual(output_model.num_visits, 2)
        self.assertEqual(output_model.num_completions, 0)

    def test_all_complete(self):
        exp_id = 'eid'
        version = 1
        state = 'sid'
        stats_services.EventHandler.start_exploration(
            exp_id, version, state, 'session1', {}, feconf.PLAY_TYPE_PLAYTEST)
        stats_services.EventHandler.maybe_leave_exploration(
            exp_id, version, feconf.END_DEST, 'session1', 27, {},
            feconf.PLAY_TYPE_PLAYTEST)
        stats_services.EventHandler.start_exploration(
            exp_id, version, state, 'session2', {}, feconf.PLAY_TYPE_PLAYTEST)
        stats_services.EventHandler.maybe_leave_exploration(
            exp_id, version, feconf.END_DEST, 'session2', 27, {},
            feconf.PLAY_TYPE_PLAYTEST)
        job_id = stats_jobs.StatisticsPageJobManager.create_new()
        stats_jobs.StatisticsPageJobManager.enqueue(job_id)
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            stats_jobs.StatisticsPageJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        output_model = stats_models.ExplorationAnnotationModel.get(exp_id)
        self.assertEqual(output_model.num_visits, 2)
        self.assertEqual(output_model.num_completions, 2)

    def test_multiple_completes_same_session(self):
        exp_id = 'eid'
        version = 1
        state = 'sid'
        stats_services.EventHandler.start_exploration(
            exp_id, version, state, 'session1', {}, feconf.PLAY_TYPE_PLAYTEST)
        stats_services.EventHandler.maybe_leave_exploration(
            exp_id, version, state, 'session1', 27, {},
            feconf.PLAY_TYPE_PLAYTEST)
        sleep(0.2)
        stats_services.EventHandler.maybe_leave_exploration(
            exp_id, version, state, 'session1', 27, {},
            feconf.PLAY_TYPE_PLAYTEST)
        sleep(0.2)
        stats_services.EventHandler.maybe_leave_exploration(
            exp_id, version, feconf.END_DEST, 'session1', 27, {},
            feconf.PLAY_TYPE_PLAYTEST)
        stats_services.EventHandler.start_exploration(
            exp_id, version, state, 'session2', {}, feconf.PLAY_TYPE_PLAYTEST)
        stats_services.EventHandler.maybe_leave_exploration(
            exp_id, version, state, 'session2', 27, {},
            feconf.PLAY_TYPE_PLAYTEST)
        sleep(0.2)
        stats_services.EventHandler.maybe_leave_exploration(
            exp_id, version, state, 'session2', 27, {},
            feconf.PLAY_TYPE_PLAYTEST)
        job_id = stats_jobs.StatisticsPageJobManager.create_new()
        stats_jobs.StatisticsPageJobManager.enqueue(job_id)
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            stats_jobs.StatisticsPageJobManager.get_status_code(job_id),
            jobs.STATUS_CODE_COMPLETED)
        output_model = stats_models.ExplorationAnnotationModel.get(exp_id)
        self.assertEqual(output_model.num_visits, 2)
        self.assertEqual(output_model.num_completions, 1)

