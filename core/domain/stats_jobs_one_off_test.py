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

(stats_models, exp_models) = models.Registry.import_models(
    [models.NAMES.statistics, models.NAMES.exploration])


class GenerateV1StatisticsJobTest(test_utils.GenericTestBase):
    """Tests for the one-off migration job for stats events."""

    def setUp(self):
        super(GenerateV1StatisticsJobTest, self).setUp()

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

    def test_creation_of_stats_model_for_v1(self):
        job_id = stats_jobs_one_off.GenerateV1StatisticsJob.create_new()
        stats_jobs_one_off.GenerateV1StatisticsJob.enqueue(job_id)

        self.assertEqual(self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exploration.version)
        self.assertEqual(exploration_stats.num_starts_v1, 2)
        self.assertEqual(exploration_stats.num_completions_v1, 1)
        self.assertEqual(exploration_stats.num_actual_starts_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].first_hit_count_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].first_hit_count_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].total_hit_count_v1, 3)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].total_hit_count_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].num_completions_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].num_completions_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].total_answers_count_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].total_answers_count_v1,
            0)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].useful_feedback_count_v1, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'End'].useful_feedback_count_v1, 0)

    def test_that_state_answers_sharded_models_accumulate_stats(self):
        with self.swap(
            stats_models.StateAnswersModel, '_MAX_ANSWER_LIST_BYTE_SIZE',
            100000):

            submitted_answer_list = [
                stats_domain.SubmittedAnswer(
                    'answer a', 'TextInput', 0, 1,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v',
                    10.0),
                stats_domain.SubmittedAnswer(
                    'answer ccc', 'TextInput', 1, 1,
                    exp_domain.DEFAULT_OUTCOME_CLASSIFICATION, {},
                    'session_id_v', 3.0),
                stats_domain.SubmittedAnswer(
                    'answer bbbbb', 'TextInput', 1, 0,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v',
                    7.5),
            ]
            stats_services.record_answers(
                self.exp_id, self.exploration.version,
                'Home', 'TextInput',
                submitted_answer_list * 200)

        job_id = stats_jobs_one_off.GenerateV1StatisticsJob.create_new()
        stats_jobs_one_off.GenerateV1StatisticsJob.enqueue(job_id)

        self.assertEqual(self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exploration.version)

        # There are an additional two answers from the setup function.
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].total_answers_count_v1, 602)

        # There is an additional answer from the setup function.
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].useful_feedback_count_v1, 401)

    def test_creation_of_stats_model_for_addition(self):
        # Update exploration to version 2.
        change_list = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': u'Klüft',
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
            self.exp_id, self.exploration.version, u'Klüft',
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
            self.exp_id, self.exploration.version, u'Klüft',
            'TextInput', 0, 0, exp_domain.EXPLICIT_CLASSIFICATION,
            'session_id3', 0, {}, 'answer3')
        event_services.AnswerSubmissionEventHandler.record(
            self.exp_id, self.exploration.version, u'Klüft',
            'TextInput', 0, 0, exp_domain.DEFAULT_OUTCOME_CLASSIFICATION,
            'session_id3', 0, {}, 'answer4')

        job_id = stats_jobs_one_off.GenerateV1StatisticsJob.create_new()
        stats_jobs_one_off.GenerateV1StatisticsJob.enqueue(job_id)

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
                u'Klüft'].first_hit_count_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].total_hit_count_v1, 4)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].total_hit_count_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                u'Klüft'].total_hit_count_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].num_completions_v1, 3)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].num_completions_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                u'Klüft'].num_completions_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].total_answers_count_v1, 3)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].total_answers_count_v1,
            0)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                u'Klüft'].total_answers_count_v1, 2)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].useful_feedback_count_v1, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'End'].useful_feedback_count_v1, 0)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                u'Klüft'].useful_feedback_count_v1, 1)

    def test_creation_of_stats_model_for_deletion(self):
        # Update exploration to version 2.
        change_list = [{
            'cmd': exp_domain.CMD_DELETE_STATE,
            'state_name': 'End',
        }]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        self.exploration = exp_services.get_exploration_by_id(self.exp_id)


        job_id = stats_jobs_one_off.GenerateV1StatisticsJob.create_new()
        stats_jobs_one_off.GenerateV1StatisticsJob.enqueue(job_id)

        self.assertEqual(self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exploration.version)
        self.assertEqual(exploration_stats.num_starts_v1, 2)
        self.assertEqual(exploration_stats.num_completions_v1, 1)
        # Deletion of 'End' state makes the exploration a one-state exploration,
        # thus making num_actual_starts equal to num_starts.
        self.assertEqual(exploration_stats.num_actual_starts_v1, 2)

        self.assertFalse('End' in exploration_stats.state_stats_mapping)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].first_hit_count_v1, 2)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].total_hit_count_v1, 3)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].num_completions_v1, 2)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].total_answers_count_v1, 2)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].useful_feedback_count_v1, 1)

    def test_exploration_revert_updates_stats_to_old_values(self):
        # Update exploration to version 2.
        change_list = [{
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': 'New state',
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

        # Revert exploration to version 1.
        exp_services.revert_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, 2, 1)

        self.exploration = exp_services.get_exploration_by_id(self.exp_id)

        job_id = stats_jobs_one_off.GenerateV1StatisticsJob.create_new()
        stats_jobs_one_off.GenerateV1StatisticsJob.enqueue(job_id)

        self.assertEqual(self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exploration.version)
        self.assertEqual(exploration_stats.num_starts_v1, 2)
        self.assertEqual(exploration_stats.num_completions_v1, 1)
        self.assertEqual(exploration_stats.num_actual_starts_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].first_hit_count_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].first_hit_count_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].total_hit_count_v1, 3)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].total_hit_count_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].num_completions_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].num_completions_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].total_answers_count_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].total_answers_count_v1,
            0)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].useful_feedback_count_v1, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'End'].useful_feedback_count_v1, 0)

    def test_exploration_deletion_is_handled(self):
        exp_services.delete_exploration(feconf.SYSTEM_COMMITTER_ID, self.exp_id)

        job_id = stats_jobs_one_off.GenerateV1StatisticsJob.create_new()
        stats_jobs_one_off.GenerateV1StatisticsJob.enqueue(job_id)

        self.assertEqual(self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exploration.version)

        # Since exploration is deleted, ExplorationStatsModel instance is not
        # created.
        self.assertEqual(exploration_stats, None)
