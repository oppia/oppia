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



"""Tests for one off statistics jobs."""

import os

import feconf
import utils

from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_jobs_one_off
from core.domain import stats_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils

(exp_models, stats_models,) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.statistics])


class RecomputeStateCompleteStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    state_a = 'a'
    state_b = 'b'

    def setUp(self):
        super(RecomputeStateCompleteStatisticsTest, self).setUp()

        stats_models.StateCompleteEventLogEntryModel(
            id='id0',
            exp_id=self.exp_id,
            exp_version=1,
            state_name=self.state_a,
            session_id='session_id_1',
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.StateCompleteEventLogEntryModel(
            id='id1',
            exp_id=self.exp_id,
            exp_version=1,
            state_name=self.state_a,
            session_id='session_id_2',
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.StateCompleteEventLogEntryModel(
            id='id2',
            exp_id=self.exp_id,
            exp_version=1,
            state_name=self.state_a,
            session_id='session_id_3',
            time_spent_in_state_secs=1.0,
            event_schema_version=1).put()
        stats_models.StateCompleteEventLogEntryModel(
            id='id3',
            exp_id=self.exp_id,
            exp_version=2,
            state_name=self.state_a,
            session_id='session_id_4',
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.StateCompleteEventLogEntryModel(
            id='id4',
            exp_id=self.exp_id,
            exp_version=3,
            state_name=self.state_b,
            session_id='session_id_4',
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()

        state_stats_dict = {
            'total_answers_count_v1': 3,
            'total_answers_count_v2': 0,
            'useful_feedback_count_v1': 3,
            'useful_feedback_count_v2': 0,
            'total_hit_count_v1': 3,
            'total_hit_count_v2': 0,
            'first_hit_count_v1': 3,
            'first_hit_count_v2': 0,
            'num_times_solution_viewed_v2': 0,
            'num_completions_v1': 3,
            'num_completions_v2': 9
        }
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 1, 0, 0, 0, 0, 0, 0,
            {
                self.state_a: state_stats_dict
            })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 2, 0, 0, 0, 0, 0, 0,
            {
                self.state_a: state_stats_dict
            })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 3, 0, 0, 0, 0, 0, 0,
            {
                self.state_a: state_stats_dict
            })

        exp_models.ExplorationCommitLogEntryModel(
            id=('exploration-%s-%s' % (self.exp_id, 2)),
            user_id='user_id',
            username='username',
            exploration_id=self.exp_id,
            commit_type='commit_type',
            commit_message='commit_message',
            commit_cmds=[],
            version=2,
            post_commit_status=feconf.ACTIVITY_STATUS_PRIVATE,
            post_commit_community_owned=True,
            post_commit_is_private=True
        ).put_async()
        # Change state_a to state_b in version 3
        exp_models.ExplorationCommitLogEntryModel(
            id=('exploration-%s-%s' % (self.exp_id, 3)),
            user_id='user_id',
            username='username',
            exploration_id=self.exp_id,
            commit_type='commit_type',
            commit_message='commit_message',
            commit_cmds=[{'cmd': exp_domain.CMD_RENAME_STATE,
                          'old_state_name': self.state_a,
                          'new_state_name': self.state_b}],
            version=3,
            post_commit_status=feconf.ACTIVITY_STATUS_PRIVATE,
            post_commit_community_owned=True,
            post_commit_is_private=True
        ).put_async()

    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatistics.create_new())
        stats_jobs_one_off.RecomputeStatistics.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, '1')
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state_a]
        # Check the old event schema version was not counted.
        self.assertEqual(state_stats['num_completions_v2'], 2)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, '2')
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state_a]
        # Check that the new version counts events for the previous
        # versions.
        self.assertEqual(state_stats['num_completions_v2'], 3)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, '3')
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state_b]
        # Check that the new version with a renamed state still
        # counts the events for the state in previous versions
        # with the old name.
        self.assertEqual(state_stats['num_completions_v2'], 4)


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
        stats_models.AnswerSubmittedEventLogEntryModel(
            id='id5',
            exp_id=self.exp_id,
            exp_version=2,
            state_name='b',
            session_id=self.session_id_1,
            time_spent_in_state_secs=1.0,
            is_feedback_useful=True,
            event_schema_version=2).put()

        state_stats_dict = {
            'total_answers_count_v1': 3,
            'total_answers_count_v2': 9,
            'useful_feedback_count_v1': 3,
            'useful_feedback_count_v2': 9,
            'total_hit_count_v1': 3,
            'total_hit_count_v2': 0,
            'first_hit_count_v1': 3,
            'first_hit_count_v2': 0,
            'num_times_solution_viewed_v2': 0,
            'num_completions_v1': 3,
            'num_completions_v2': 0
        }
        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0,
            {
                self.state: state_stats_dict
            })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 2, 0, 0, 0, 0, 0, 0,
            {
                self.state: state_stats_dict
            })

        exp_models.ExplorationCommitLogEntryModel(
            id=('exploration-%s-%s' % (self.exp_id, 2)),
            user_id='user_id',
            username='username',
            exploration_id=self.exp_id,
            commit_type='commit_type',
            commit_message='commit_message',
            commit_cmds=[{'cmd': exp_domain.CMD_RENAME_STATE,
                          'old_state_name': self.state,
                          'new_state_name': 'b'}],
            version=2,
            post_commit_status=feconf.ACTIVITY_STATUS_PRIVATE,
            post_commit_community_owned=True,
            post_commit_is_private=True
        ).put_async()

    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatistics.create_new())
        stats_jobs_one_off.RecomputeStatistics.enqueue(job_id)

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

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, '2')
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping['b']
        self.assertEqual(state_stats['total_answers_count_v2'], 4)
        self.assertEqual(state_stats['useful_feedback_count_v2'], 3)



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
        stats_models.StateHitEventLogEntryModel(
            id='id5',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.exp_id,
            exploration_version=2,
            state_name='b',
            session_id=self.session_id_2,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()

        state_stats_dict = {
            'total_answers_count_v1': 3,
            'total_answers_count_v2': 9,
            'useful_feedback_count_v1': 3,
            'useful_feedback_count_v2': 9,
            'total_hit_count_v1': 3,
            'total_hit_count_v2': 0,
            'first_hit_count_v1': 3,
            'first_hit_count_v2': 0,
            'num_times_solution_viewed_v2': 0,
            'num_completions_v1': 3,
            'num_completions_v2': 0
        }
        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0,
            {
                self.state: state_stats_dict
            })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 2, 0, 0, 0, 0, 0, 0,
            {
                self.state: state_stats_dict
            })

        exp_models.ExplorationCommitLogEntryModel(
            id=('exploration-%s-%s' % (self.exp_id, 2)),
            user_id='user_id',
            username='username',
            exploration_id=self.exp_id,
            commit_type='commit_type',
            commit_message='commit_message',
            commit_cmds=[{'cmd': exp_domain.CMD_RENAME_STATE,
                          'old_state_name': self.state,
                          'new_state_name': 'b'}],
            version=2,
            post_commit_status=feconf.ACTIVITY_STATUS_PRIVATE,
            post_commit_community_owned=True,
            post_commit_is_private=True
        ).put_async()

    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatistics.create_new())
        stats_jobs_one_off.RecomputeStatistics.enqueue(job_id)

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

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 2)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping['b']
        self.assertEqual(state_stats['first_hit_count_v2'], 3)
        self.assertEqual(state_stats['total_hit_count_v2'], 4)


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
        stats_models.SolutionHitEventLogEntryModel(
            id='id5',
            exp_id=self.exp_id,
            exp_version=2,
            state_name='b',
            session_id=self.session_id_3,
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()

        state_stats_dict = {
            'total_answers_count_v1': 3,
            'total_answers_count_v2': 9,
            'useful_feedback_count_v1': 3,
            'useful_feedback_count_v2': 9,
            'total_hit_count_v1': 3,
            'total_hit_count_v2': 0,
            'first_hit_count_v1': 3,
            'first_hit_count_v2': 0,
            'num_times_solution_viewed_v2': 0,
            'num_completions_v1': 3,
            'num_completions_v2': 0
        }
        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0,
            {
                self.state: state_stats_dict
            })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 2, 0, 0, 0, 0, 0, 0,
            {
                self.state: state_stats_dict
            })

        exp_models.ExplorationCommitLogEntryModel(
            id=('exploration-%s-%s' % (self.exp_id, 2)),
            user_id='user_id',
            username='username',
            exploration_id=self.exp_id,
            commit_type='commit_type',
            commit_message='commit_message',
            commit_cmds=[{'cmd': exp_domain.CMD_RENAME_STATE,
                          'old_state_name': self.state,
                          'new_state_name': 'b'}],
            version=2,
            post_commit_status=feconf.ACTIVITY_STATUS_PRIVATE,
            post_commit_community_owned=True,
            post_commit_is_private=True
        ).put_async()

    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatistics.create_new())
        stats_jobs_one_off.RecomputeStatistics.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, str(self.exp_version))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state]
        self.assertEqual(state_stats['num_times_solution_viewed_v2'], 3)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, '2')
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping['b']
        self.assertEqual(state_stats['num_times_solution_viewed_v2'], 4)


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
        stats_models.ExplorationActualStartEventLogEntryModel(
            id='id4',
            exp_id=self.exp_id,
            exp_version=2,
            state_name=self.state,
            session_id=self.session_id_1,
            event_schema_version=2).put()

        state_stats_dict = {
            'total_answers_count_v1': 3,
            'total_answers_count_v2': 9,
            'useful_feedback_count_v1': 3,
            'useful_feedback_count_v2': 9,
            'total_hit_count_v1': 3,
            'total_hit_count_v2': 0,
            'first_hit_count_v1': 3,
            'first_hit_count_v2': 0,
            'num_times_solution_viewed_v2': 0,
            'num_completions_v1': 3,
            'num_completions_v2': 0
        }
        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0, {
                self.state: state_stats_dict
                })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0, {
                self.state: state_stats_dict
                })
        exp_models.ExplorationCommitLogEntryModel(
            id=('exploration-%s-%s' % (self.exp_id, 2)),
            user_id='user_id',
            username='username',
            exploration_id=self.exp_id,
            commit_type='commit_type',
            commit_message='commit_message',
            commit_cmds=[],
            version=2,
            post_commit_status=feconf.ACTIVITY_STATUS_PRIVATE,
            post_commit_community_owned=True,
            post_commit_is_private=True
        ).put_async()

    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatistics.create_new())
        stats_jobs_one_off.RecomputeStatistics.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, str(self.exp_version))
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_actual_starts_v2, 2)
        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 2)
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_actual_starts_v2, 3)


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
        stats_models.CompleteExplorationEventLogEntryModel(
            id='id3',
            event_type=feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
            exploration_id=self.exp_id,
            exploration_version=2,
            state_name=self.state,
            session_id=self.session_id_1,
            client_time_spent_in_secs=1.0,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()

        state_stats_dict = {
            'total_answers_count_v1': 3,
            'total_answers_count_v2': 9,
            'useful_feedback_count_v1': 3,
            'useful_feedback_count_v2': 9,
            'total_hit_count_v1': 3,
            'total_hit_count_v2': 0,
            'first_hit_count_v1': 3,
            'first_hit_count_v2': 0,
            'num_times_solution_viewed_v2': 0,
            'num_completions_v1': 3,
            'num_completions_v2': 0
        }
        stats_models.ExplorationStatsModel.create(
            self.exp_id, self.exp_version, 0, 0, 0, 0, 0, 0, {
                self.state: state_stats_dict
                })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 2, 0, 0, 0, 0, 0, 0, {
                self.state: state_stats_dict
                })
        exp_models.ExplorationCommitLogEntryModel(
            id=('exploration-%s-%s' % (self.exp_id, 2)),
            user_id='user_id',
            username='username',
            exploration_id=self.exp_id,
            commit_type='commit_type',
            commit_message='commit_message',
            commit_cmds=[],
            version=2,
            post_commit_status=feconf.ACTIVITY_STATUS_PRIVATE,
            post_commit_community_owned=True,
            post_commit_is_private=True
        ).put_async()

    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatistics.create_new())
        stats_jobs_one_off.RecomputeStatistics.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, str(self.exp_version))
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_completions_v2, 2)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 2)
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_completions_v2, 3)


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
        stats_models.StateHitEventLogEntryModel.create(
            self.exp_id, self.exploration.version, 'New state',
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
            self.exp_id, self.exploration.version, 'New state',
            'TextInput', 0, 0, exp_domain.EXPLICIT_CLASSIFICATION,
            'session_id3', 0, {}, 'answer3')
        event_services.AnswerSubmissionEventHandler.record(
            self.exp_id, self.exploration.version, 'New state',
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
                'New state'].first_hit_count_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].total_hit_count_v1, 4)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].total_hit_count_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'New state'].total_hit_count_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].num_completions_v1, 3)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].num_completions_v1, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'New state'].num_completions_v1, 1)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].total_answers_count_v1, 3)
        self.assertEqual(
            exploration_stats.state_stats_mapping['End'].total_answers_count_v1,
            0)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'New state'].total_answers_count_v1, 2)

        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].useful_feedback_count_v1, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'End'].useful_feedback_count_v1, 0)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'New state'].useful_feedback_count_v1, 1)

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
