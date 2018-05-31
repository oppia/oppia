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

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_jobs_one_off
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf

(exp_models, stats_models,) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.statistics])


class ExplorationIssuesModelCreatorOneOffJobTest(test_utils.GenericTestBase):
    exp_id1 = 'exp_id1'
    exp_id2 = 'exp_id2'

    def setUp(self):
        super(ExplorationIssuesModelCreatorOneOffJobTest, self).setUp()
        self.exp1 = self.save_new_valid_exploration(self.exp_id1, 'owner')
        self.exp2 = self.save_new_valid_exploration(self.exp_id2, 'owner')

    def test_default_job_execution(self):
        job_id = (
            stats_jobs_one_off.ExplorationIssuesModelCreatorOneOffJob.create_new()) # pylint: disable=line-too-long
        stats_jobs_one_off.ExplorationIssuesModelCreatorOneOffJob.enqueue(
            job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        exp_issues1 = stats_models.ExplorationIssuesModel.get_model(
            self.exp_id1, self.exp1.version)
        self.assertEqual(exp_issues1.exp_id, self.exp_id1)
        self.assertEqual(exp_issues1.exp_version, self.exp1.version)
        self.assertEqual(exp_issues1.unresolved_issues, [])

        exp_issues2 = stats_models.ExplorationIssuesModel.get_model(
            self.exp_id2, self.exp2.version)
        self.assertEqual(exp_issues2.exp_id, self.exp_id2)
        self.assertEqual(exp_issues2.exp_version, self.exp2.version)
        self.assertEqual(exp_issues2.unresolved_issues, [])

    def test_with_existing_exp_issues_instance(self):
        stats_models.ExplorationIssuesModel.create(
            self.exp_id1, self.exp1.version,
            [{
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': ['playthrough_id1']
            }]
        )

        job_id = (
            stats_jobs_one_off.ExplorationIssuesModelCreatorOneOffJob.create_new()) # pylint: disable=line-too-long
        stats_jobs_one_off.ExplorationIssuesModelCreatorOneOffJob.enqueue(
            job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        exp_issues1 = stats_models.ExplorationIssuesModel.get_model(
            self.exp_id1, self.exp1.version)
        self.assertEqual(exp_issues1.exp_id, self.exp_id1)
        self.assertEqual(exp_issues1.exp_version, self.exp1.version)
        self.assertEqual(exp_issues1.unresolved_issues, [])

        exp_issues2 = stats_models.ExplorationIssuesModel.get_model(
            self.exp_id2, self.exp2.version)
        self.assertEqual(exp_issues2.exp_id, self.exp_id2)
        self.assertEqual(exp_issues2.exp_version, self.exp2.version)
        self.assertEqual(exp_issues2.unresolved_issues, [])


class RecomputeStateCompleteStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    state_b = 'b'

    def setUp(self):
        super(RecomputeStateCompleteStatisticsTest, self).setUp()
        self.exp = self.save_new_valid_exploration(self.exp_id, 'owner')

        change_list = []
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': self.exp.init_state_name,
                'new_state_name': self.state_b
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

        stats_models.StateCompleteEventLogEntryModel(
            id='id0',
            exp_id=self.exp_id,
            exp_version=1,
            state_name=self.exp.init_state_name,
            session_id='session_id_1',
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.StateCompleteEventLogEntryModel(
            id='id1',
            exp_id=self.exp_id,
            exp_version=1,
            state_name=self.exp.init_state_name,
            session_id='session_id_2',
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.StateCompleteEventLogEntryModel(
            id='id2',
            exp_id=self.exp_id,
            exp_version=1,
            state_name=self.exp.init_state_name,
            session_id='session_id_3',
            time_spent_in_state_secs=1.0,
            event_schema_version=1).put()
        stats_models.StateCompleteEventLogEntryModel(
            id='id3',
            exp_id=self.exp_id,
            exp_version=2,
            state_name=self.exp.init_state_name,
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
                self.exp.init_state_name: state_stats_dict
            })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 2, 0, 0, 0, 0, 0, 0,
            {
                self.exp.init_state_name: state_stats_dict
            })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 3, 0, 0, 0, 0, 0, 0,
            {
                self.state_b: state_stats_dict
            })

    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatisticsOneOffJob.create_new())
        stats_jobs_one_off.RecomputeStatisticsOneOffJob.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 1)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.exp.init_state_name]
        # Check the old event schema version was not counted.
        self.assertEqual(state_stats['num_completions_v2'], 2)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 2)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.exp.init_state_name]
        # Check that the new version counts events for the previous
        # versions.
        self.assertEqual(state_stats['num_completions_v2'], 3)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 3)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state_b]
        # Check that the new version with a renamed state still
        # counts the events for the state in previous versions
        # with the old name.
        self.assertEqual(state_stats['num_completions_v2'], 4)


class RecomputeAnswerSubmittedStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    session_id_1 = 'session_id_1'
    session_id_2 = 'session_id_2'

    def setUp(self):
        super(RecomputeAnswerSubmittedStatisticsTest, self).setUp()
        self.exp = self.save_new_valid_exploration(self.exp_id, 'owner')
        self.state = self.exp.init_state_name

        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': self.state,
                'new_state_name': 'b'
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')


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
                'b': state_stats_dict
            })

    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatisticsOneOffJob.create_new())
        stats_jobs_one_off.RecomputeStatisticsOneOffJob.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, self.exp_version)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state]
        self.assertEqual(state_stats['total_answers_count_v2'], 3)
        self.assertEqual(state_stats['useful_feedback_count_v2'], 2)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 2)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping['b']
        self.assertEqual(state_stats['total_answers_count_v2'], 4)
        self.assertEqual(state_stats['useful_feedback_count_v2'], 3)


class RecomputeStateHitStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    # Start on version 2 as the update from version 1 to 2 is only to
    # setup states for testing.
    exp_version = 1
    session_id_1 = 'session_id_1'
    session_id_2 = 'session_id_2'

    def setUp(self):
        super(RecomputeStateHitStatisticsTest, self).setUp()
        self.exp = self.save_new_valid_exploration(self.exp_id, 'owner')
        self.state = self.exp.init_state_name

        change_list = []
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': self.state,
                'new_state_name': 'b'
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

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
            state_name='a',
            session_id=self.session_id_2,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.StateHitEventLogEntryModel(
            id='id6',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.exp_id,
            exploration_version=3,
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
            self.exp_id, 1, 0, 0, 0, 0, 0, 0,
            {
                'a': state_stats_dict,
                self.state: state_stats_dict
            })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 2, 0, 0, 0, 0, 0, 0,
            {
                'a': state_stats_dict,
                self.state: state_stats_dict
            })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 3, 0, 0, 0, 0, 0, 0,
            {
                'a': state_stats_dict,
                'b': state_stats_dict
            })

    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatisticsOneOffJob.create_new())
        stats_jobs_one_off.RecomputeStatisticsOneOffJob.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, self.exp_version)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state]
        self.assertEqual(state_stats['first_hit_count_v2'], 2)
        self.assertEqual(state_stats['total_hit_count_v2'], 3)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 3)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping['b']
        self.assertEqual(state_stats['first_hit_count_v2'], 3)
        self.assertEqual(state_stats['total_hit_count_v2'], 4)

    def test_session_hitting_multiple_states(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatisticsOneOffJob.create_new())
        stats_jobs_one_off.RecomputeStatisticsOneOffJob.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 2)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping['a']
        self.assertEqual(state_stats['first_hit_count_v2'], 1)
        self.assertEqual(state_stats['total_hit_count_v2'], 1)



class RecomputeSolutionHitStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    session_id_1 = 'session_id_1'
    session_id_2 = 'session_id_2'
    session_id_3 = 'session_id_3'

    def setUp(self):
        super(RecomputeSolutionHitStatisticsTest, self).setUp()
        self.exp = self.save_new_valid_exploration(self.exp_id, 'owner')
        self.state = self.exp.init_state_name

        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': self.state,
                'new_state_name': 'b'
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

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
                'b': state_stats_dict
            })

    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatisticsOneOffJob.create_new())
        stats_jobs_one_off.RecomputeStatisticsOneOffJob.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, self.exp_version)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state]
        self.assertEqual(state_stats['num_times_solution_viewed_v2'], 3)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 2)
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
        self.save_new_default_exploration(self.exp_id, 'owner')

        change_list = []
        # Update exploration to version 3.
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

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
            self.exp_id, 2, 0, 0, 0, 0, 0, 0, {
                self.state: state_stats_dict
                })
        stats_models.ExplorationStatsModel.create(
            self.exp_id, 3, 0, 0, 0, 0, 0, 0, {
                self.state: state_stats_dict
                })

    def test_standard_operation(self):
        job_id = (stats_jobs_one_off.RecomputeStatisticsOneOffJob.create_new())
        stats_jobs_one_off.RecomputeStatisticsOneOffJob.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, self.exp_version)
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_actual_starts_v2, 2)
        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 2)
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_actual_starts_v2, 3)

    def test_recompute_for_version_with_no_events(self):
        job_id = (stats_jobs_one_off.RecomputeStatisticsOneOffJob.create_new())
        stats_jobs_one_off.RecomputeStatisticsOneOffJob.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 3)
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_actual_starts_v2, 3)


class RecomputeCompleteEventStatisticsTest(test_utils.GenericTestBase):
    exp_id = 'exp_id'
    exp_version = 1
    state = 'state_1'
    session_id_1 = 'session_id_1'

    def setUp(self):
        super(RecomputeCompleteEventStatisticsTest, self).setUp()
        self.save_new_default_exploration(self.exp_id, 'owner')

        change_list = []
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp_id, change_list, '')

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

    def test_standard_operation(self):
        job_id = (
            stats_jobs_one_off.RecomputeStatisticsOneOffJob.create_new())
        stats_jobs_one_off.RecomputeStatisticsOneOffJob.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, self.exp_version)
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_completions_v2, 2)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.exp_id, 2)
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_completions_v2, 3)
