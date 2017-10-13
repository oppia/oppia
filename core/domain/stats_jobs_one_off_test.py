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

"""Tests for one off statistics jobs."""

import os

from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_jobs_one_off
from core.domain import stats_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils

import feconf
import utils

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


class MigrateStatisticsTest(test_utils.GenericTestBase):
    """Tests for the one-off migration job for stats events."""

    def setUp(self):
        super(MigrateStatisticsTest, self).setUp()

        self.exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, self.exp_id, assets_list)

        self.exploration = exp_services.get_exploration_by_id(self.exp_id)

        # Create event models for version 1 of the exploration.
        stats_models.StartExplorationEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'Home', 'session_id1',
            {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.StartExplorationEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'Home', 'session_id2',
            {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.StateHitEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'Home', 'session_id1',
            {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.StateHitEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'Home', 'session_id2',
            {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.StateHitEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'Home', 'session_id2',
            {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.StateHitEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'End', 'session_id2',
            {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.CompleteExplorationEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'End', 'session_id2',
            10, {}, feconf.PLAY_TYPE_NORMAL)
        event_services.AnswerSubmissionEventHandler.record(
            self.exp_id, self.exploration.version, 'Home',
            'TextInput', 0, 0, exp_domain.EXPLICIT_CLASSIFICATION,
            'session_id2', 0, {}, 'answer1')
        event_services.AnswerSubmissionEventHandler.record(
            self.exp_id, self.exploration.version, 'Home',
            'TextInput', 0, 0, exp_domain.DEFAULT_OUTCOME_CLASSIFICATION,
            'session_id2', 0, {}, 'answer2')

        # Update exploration to version 2.
        change_list = [{
            'cmd': 'add_state',
            'state_name': 'New state',
        }, {
            'cmd': 'rename_state',
            'old_state_name': 'New state',
            'new_state_name': 'Renamed state'
        }]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        self.exploration = exp_services.get_exploration_by_id(self.exp_id)

        # Create event models for version 2 of the exploration.
        stats_models.StartExplorationEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'Home', 'session_id3',
            {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.StateHitEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'Home', 'session_id3',
            {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.StateHitEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'Renamed state',
            'session_id3', {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.StateHitEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'End', 'session_id3',
            {}, feconf.PLAY_TYPE_NORMAL)
        stats_models.CompleteExplorationEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'End', 'session_id3',
            10, {}, feconf.PLAY_TYPE_NORMAL)
        event_services.AnswerSubmissionEventHandler.record(
            self.exp_id, self.exploration.version, 'Home',
            'TextInput', 0, 0, exp_domain.DEFAULT_OUTCOME_CLASSIFICATION,
            'session_id3', 0, {}, 'answer2')
        event_services.AnswerSubmissionEventHandler.record(
            self.exp_id, self.exploration.version, 'Renamed state',
            'TextInput', 0, 0, exp_domain.EXPLICIT_CLASSIFICATION,
            'session_id3', 0, {}, 'answer3')
        event_services.AnswerSubmissionEventHandler.record(
            self.exp_id, self.exploration.version, 'Renamed state',
            'TextInput', 0, 0, exp_domain.DEFAULT_OUTCOME_CLASSIFICATION,
            'session_id3', 0, {}, 'answer4')

    def test_creation_of_stats_model(self):
        job_id = stats_jobs_one_off.MigrateStatistics.create_new()
        stats_jobs_one_off.MigrateStatistics.enqueue(job_id)

        self.assertEqual(self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exploration.version)
        self.assertEqual(exploration_stats.num_starts_v1, 3)
        self.assertEqual(exploration_stats.num_completions_v1, 2)
        self.assertEqual(exploration_stats.num_actual_starts_v1, 2)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].first_hit_count_v1, 3)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].first_hit_count_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Renamed state'].first_hit_count_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].total_hit_count_v1, 4)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].total_hit_count_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Renamed state'].total_hit_count_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].num_completions_v1, 3)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].num_completions_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Renamed state'].num_completions_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].total_answers_count_v1, 3)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].total_answers_count_v1,
            0)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Renamed state'].total_answers_count_v1, 2)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].useful_feedback_count_v1, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'End'].useful_feedback_count_v1, 0)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Renamed state'].useful_feedback_count_v1, 1)
