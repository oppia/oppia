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

import datetime

from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_jobs_one_off
from core.domain import stats_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf

(exp_models, stats_models,) = models.Registry.import_models(
    [models.NAMES.exploration, models.NAMES.statistics])


class OneOffJobTestBase(test_utils.GenericTestBase):
    """Base class providing convenience methods for testing one off jobs."""

    def count_one_off_jobs_in_queue(self):
        """Counts one off jobs in the taskqueue."""
        return self.count_jobs_in_taskqueue(
            taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS)

    def run_one_off_job(self):
        """Begins the one off job and asserts it completes as expected.

        Assumes the existence of a class constant ONE_OFF_JOB_CLASS, pointing
        to the queue under test.

        Returns:
            *. The output of the one off job.
        """
        job_id = self.ONE_OFF_JOB_CLASS.create_new()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        self.ONE_OFF_JOB_CLASS.enqueue(job_id)
        self.assertEqual(self.count_one_off_jobs_in_queue(), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        return self.ONE_OFF_JOB_CLASS.get_output(job_id)


class PlaythroughAuditTests(OneOffJobTestBase):
    ONE_OFF_JOB_CLASS = stats_jobs_one_off.PlaythroughAudit

    def setUp(self):
        super(PlaythroughAuditTests, self).setUp()
        self.exp = self.save_new_valid_exploration('EXP_ID', 'owner_id')

    def create_playthrough(self):
        """Helper method to create and return a simple playthrough model."""
        playthrough_id = stats_models.PlaythroughModel.create(
            self.exp.id, self.exp.version, issue_type='EarlyQuit',
            issue_customization_args={
                'state_name': {'value': 'state_name'},
                'time_spent_in_exp_in_msecs': {'value': 200},
            },
            actions=[])
        return stats_models.PlaythroughModel.get(playthrough_id)

    def create_exp_issues_with_playthroughs(self, playthrough_ids_list):
        """Helper method to create and return an ExplorationIssuesModel instance
        with the given sets of playthrough ids as reference issues.
        """
        return stats_models.ExplorationIssuesModel.create(
            self.exp.id, self.exp.version, unresolved_issues=[
                {
                    'issue_type': 'EarlyQuit',
                    'issue_customization_args': {
                        'state_name': {'value': 'state_name'},
                        'time_spent_in_exp_in_msecs': {'value': 200},
                    },
                    'playthrough_ids': list(playthrough_ids),
                    'schema_version': 1,
                    'is_valid': True,
                }
                for playthrough_ids in playthrough_ids_list
            ])

    def test_empty_output_for_good_playthrough(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id])
        playthrough = self.create_playthrough()
        self.create_exp_issues_with_playthroughs([[playthrough.id]])

        output = self.run_one_off_job()

        self.assertEqual(output, [])

    def test_output_for_pre_release_playthrough(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id])
        playthrough = self.create_playthrough()
        # Set created_on to a date which is definitely before GSoC 2018.
        playthrough.created_on = datetime.datetime(2017, 12, 31)
        playthrough.put()
        self.create_exp_issues_with_playthroughs([[playthrough.id]])

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('before the GSoC 2018 submission deadline', output[0])

    def test_output_for_non_whitelisted_playthrough(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id + 'differentiated'])
        playthrough = self.create_playthrough()
        self.create_exp_issues_with_playthroughs([[playthrough.id]])

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('has not been curated for recording', output[0])

    def test_output_for_bad_schema_playthrough(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id])
        playthrough = self.create_playthrough()
        playthrough.actions.append({'bad schema key': 'bad schema value'})
        playthrough.put()
        self.create_exp_issues_with_playthroughs([[playthrough.id]])

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('could not be validated', output[0])

    def test_output_for_missing_reference(self):
        self.set_config_property(
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.exp.id])
        playthrough = self.create_playthrough()
        self.create_exp_issues_with_playthroughs([
            [playthrough.id + '-different'],
        ])

        output = self.run_one_off_job()

        self.assertEqual(len(output), 1)
        self.assertIn('not found as a reference', output[0])


class RegenerateMissingStatsModelsOneOffJobTests(OneOffJobTestBase):
    ONE_OFF_JOB_CLASS = stats_jobs_one_off.RegenerateMissingStatsModelsOneOffJob
    EXP_ID = 'EXP_ID1'

    def setUp(self):
        super(RegenerateMissingStatsModelsOneOffJobTests, self).setUp()

        self.exp1 = self.save_new_valid_exploration(self.EXP_ID, 'owner')

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
            'num_completions_v2': 0,
        }

        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=1, num_starts_v1=7, num_starts_v2=0,
            num_actual_starts_v1=5, num_actual_starts_v2=0,
            num_completions_v1=2, num_completions_v2=0,
            state_stats_mapping={self.exp1.init_state_name: state_stats_dict})

        self.exp1.add_states(['New state'])
        change_list = [
            exp_domain.ExplorationChange(
                {'cmd': 'add_state', 'state_name': 'New state'})]
        # v2 version does not have ExplorationStatsModel.
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp1.id, change_list, '')
        self.exp1 = exp_services.get_exploration_by_id(self.exp1.id)

    def test_stats_models_regeneration_works(self):
        """Test that stats models are regenerated with correct v1 stats
        values.
        """
        self.run_one_off_job()

        # Verify exploration version 2 has a stats model and values are correct.
        exp_stats = (
            stats_services.get_exploration_stats_by_id(self.EXP_ID, 2))

        self.assertEqual(exp_stats.num_starts_v1, 7)
        self.assertEqual(exp_stats.num_actual_starts_v1, 5)
        self.assertEqual(exp_stats.num_completions_v1, 2)

        state_stats = exp_stats.state_stats_mapping[self.exp1.init_state_name]

        self.assertEqual(state_stats.total_answers_count_v1, 3)
        self.assertEqual(state_stats.useful_feedback_count_v1, 3)
        self.assertEqual(state_stats.total_hit_count_v1, 3)
        self.assertEqual(state_stats.first_hit_count_v1, 3)
        self.assertEqual(state_stats.num_completions_v1, 3)


class RecomputeStateCompleteStatisticsTests(OneOffJobTestBase):
    ONE_OFF_JOB_CLASS = stats_jobs_one_off.RecomputeStatisticsOneOffJob
    EXP_ID = 'EXP_ID'
    STATE_B = 'b'

    def setUp(self):
        super(RecomputeStateCompleteStatisticsTests, self).setUp()
        self.exp = self.save_new_valid_exploration(self.EXP_ID, 'owner')

        change_list = []
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': self.exp.init_state_name,
                'new_state_name': self.STATE_B,
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        stats_models.StateCompleteEventLogEntryModel(
            id='id0',
            exp_id=self.EXP_ID,
            exp_version=1,
            state_name=self.exp.init_state_name,
            session_id='session_id_1',
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.StateCompleteEventLogEntryModel(
            id='id1',
            exp_id=self.EXP_ID,
            exp_version=1,
            state_name=self.exp.init_state_name,
            session_id='session_id_2',
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.StateCompleteEventLogEntryModel(
            id='id2',
            exp_id=self.EXP_ID,
            exp_version=1,
            state_name=self.exp.init_state_name,
            session_id='session_id_3',
            time_spent_in_state_secs=1.0,
            event_schema_version=1).put()
        stats_models.StateCompleteEventLogEntryModel(
            id='id3',
            exp_id=self.EXP_ID,
            exp_version=2,
            state_name=self.exp.init_state_name,
            session_id='session_id_4',
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.StateCompleteEventLogEntryModel(
            id='id4',
            exp_id=self.EXP_ID,
            exp_version=3,
            state_name=self.STATE_B,
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
            'num_completions_v2': 9,
        }
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=1, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.exp.init_state_name: state_stats_dict})
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=2, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.exp.init_state_name: state_stats_dict})
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=3, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.STATE_B: state_stats_dict})

    def test_standard_operation(self):
        self.run_one_off_job()

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 1))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.exp.init_state_name]
        # Check the old event schema version was not counted.
        self.assertEqual(state_stats['num_completions_v2'], 2)

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.exp.init_state_name]
        # Check that the new version counts events for the previous
        # versions.
        self.assertEqual(state_stats['num_completions_v2'], 3)

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 3))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.STATE_B]
        # Check that the new version with a renamed state still
        # counts the events for the state in previous versions
        # with the old name.
        self.assertEqual(state_stats['num_completions_v2'], 4)


class RecomputeAnswerSubmittedStatisticsTests(OneOffJobTestBase):
    ONE_OFF_JOB_CLASS = stats_jobs_one_off.RecomputeStatisticsOneOffJob
    EXP_ID = 'EXP_ID'
    EXP_VERSION = 1
    SESSION_ID_1 = 'session_id_1'
    SESSION_ID_2 = 'session_id_2'

    def setUp(self):
        super(RecomputeAnswerSubmittedStatisticsTests, self).setUp()
        self.exp = self.save_new_valid_exploration(self.EXP_ID, 'owner')
        self.state_name = self.exp.init_state_name

        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': self.state_name,
                'new_state_name': 'b',
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        stats_models.AnswerSubmittedEventLogEntryModel(
            id='id1',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_1,
            time_spent_in_state_secs=1.0,
            is_feedback_useful=True,
            event_schema_version=2).put()
        stats_models.AnswerSubmittedEventLogEntryModel(
            id='id2',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_1,
            time_spent_in_state_secs=1.0,
            is_feedback_useful=True,
            event_schema_version=2).put()
        stats_models.AnswerSubmittedEventLogEntryModel(
            id='id3',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_1,
            time_spent_in_state_secs=1.0,
            is_feedback_useful=False,
            event_schema_version=2).put()
        stats_models.AnswerSubmittedEventLogEntryModel(
            id='id4',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_1,
            time_spent_in_state_secs=1.0,
            is_feedback_useful=True,
            event_schema_version=1).put()
        stats_models.AnswerSubmittedEventLogEntryModel(
            id='id5',
            exp_id=self.EXP_ID,
            exp_version=2,
            state_name='b',
            session_id=self.SESSION_ID_1,
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
            'num_completions_v2': 0,
        }
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, self.EXP_VERSION, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.state_name: state_stats_dict})
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=2, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={'b': state_stats_dict})

    def test_standard_operation(self):
        self.run_one_off_job()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.EXP_ID, self.EXP_VERSION)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state_name]
        self.assertEqual(state_stats['total_answers_count_v2'], 3)
        self.assertEqual(state_stats['useful_feedback_count_v2'], 2)

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping['b']
        self.assertEqual(state_stats['total_answers_count_v2'], 4)
        self.assertEqual(state_stats['useful_feedback_count_v2'], 3)


class RecomputeStateHitStatisticsTests(OneOffJobTestBase):
    ONE_OFF_JOB_CLASS = stats_jobs_one_off.RecomputeStatisticsOneOffJob
    EXP_ID = 'EXP_ID'
    # Start on version 2 as the update from version 1 to 2 is only to
    # setup states for testing.
    EXP_VERSION = 1
    SESSION_ID_1 = 'session_id_1'
    SESSION_ID_2 = 'session_id_2'

    def setUp(self):
        super(RecomputeStateHitStatisticsTests, self).setUp()
        self.exp = self.save_new_valid_exploration(self.EXP_ID, 'owner')
        self.state_name = self.exp.init_state_name

        change_list = []
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': self.state_name,
                'new_state_name': 'b',
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        stats_models.StateHitEventLogEntryModel(
            id='id1',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.EXP_ID,
            exploration_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_1,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.StateHitEventLogEntryModel(
            id='id2',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.EXP_ID,
            exploration_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_1,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.StateHitEventLogEntryModel(
            id='id3',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.EXP_ID,
            exploration_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_2,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.StateHitEventLogEntryModel(
            id='id4',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.EXP_ID,
            exploration_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_2,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=1).put()
        stats_models.StateHitEventLogEntryModel(
            id='id5',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.EXP_ID,
            exploration_version=2,
            state_name='a',
            session_id=self.SESSION_ID_2,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.StateHitEventLogEntryModel(
            id='id6',
            event_type=feconf.EVENT_TYPE_STATE_HIT,
            exploration_id=self.EXP_ID,
            exploration_version=3,
            state_name='b',
            session_id=self.SESSION_ID_2,
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
            'num_completions_v2': 0,
        }
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=1, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={
                'a': state_stats_dict,
                self.state_name: state_stats_dict,
            })
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=2, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={
                'a': state_stats_dict,
                self.state_name: state_stats_dict,
            })
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=3, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={'a': state_stats_dict, 'b': state_stats_dict})

    def test_standard_operation(self):
        self.run_one_off_job()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.EXP_ID, self.EXP_VERSION)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state_name]
        self.assertEqual(state_stats['first_hit_count_v2'], 2)
        self.assertEqual(state_stats['total_hit_count_v2'], 3)

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 3))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping['b']
        self.assertEqual(state_stats['first_hit_count_v2'], 3)
        self.assertEqual(state_stats['total_hit_count_v2'], 4)

    def test_session_hitting_multiple_states(self):
        self.run_one_off_job()

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping['a']
        self.assertEqual(state_stats['first_hit_count_v2'], 1)
        self.assertEqual(state_stats['total_hit_count_v2'], 1)


class RecomputeSolutionHitStatisticsTests(OneOffJobTestBase):
    ONE_OFF_JOB_CLASS = stats_jobs_one_off.RecomputeStatisticsOneOffJob
    EXP_ID = 'EXP_ID'
    EXP_VERSION = 1
    SESSION_ID_1 = 'session_id_1'
    SESSION_ID_2 = 'session_id_2'
    SESSION_ID_3 = 'session_id_3'

    def setUp(self):
        super(RecomputeSolutionHitStatisticsTests, self).setUp()
        self.exp = self.save_new_valid_exploration(self.EXP_ID, 'owner')
        self.state_name = self.exp.init_state_name

        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': self.state_name,
                'new_state_name': 'b',
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        stats_models.SolutionHitEventLogEntryModel(
            id='id1',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_1,
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.SolutionHitEventLogEntryModel(
            id='id2',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_1,
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.SolutionHitEventLogEntryModel(
            id='id3',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_2,
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.SolutionHitEventLogEntryModel(
            id='id4',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_3,
            time_spent_in_state_secs=1.0,
            event_schema_version=2).put()
        stats_models.SolutionHitEventLogEntryModel(
            id='id1',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.state_name,
            session_id=self.SESSION_ID_1,
            time_spent_in_state_secs=1.0,
            event_schema_version=1).put()
        stats_models.SolutionHitEventLogEntryModel(
            id='id5',
            exp_id=self.EXP_ID,
            exp_version=2,
            state_name='b',
            session_id=self.SESSION_ID_3,
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
            'num_completions_v2': 0,
        }
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, self.EXP_VERSION, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.state_name: state_stats_dict})
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=2, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={'b': state_stats_dict})

    def test_standard_operation(self):
        self.run_one_off_job()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.EXP_ID, self.EXP_VERSION)
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.state_name]
        self.assertEqual(state_stats['num_times_solution_viewed_v2'], 3)

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping['b']
        self.assertEqual(state_stats['num_times_solution_viewed_v2'], 4)


class RecomputeActualStartStatisticsTests(OneOffJobTestBase):
    ONE_OFF_JOB_CLASS = stats_jobs_one_off.RecomputeStatisticsOneOffJob
    EXP_ID = 'EXP_ID'
    EXP_VERSION = 1
    STATE_NAME = 'state_1'

    def setUp(self):
        super(RecomputeActualStartStatisticsTests, self).setUp()
        self.save_new_default_exploration(self.EXP_ID, 'owner')

        change_list = []
        # Update exploration to version 3.
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        stats_models.ExplorationActualStartEventLogEntryModel(
            id='id1',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.STATE_NAME,
            session_id='session_id_1',
            event_schema_version=2).put()
        stats_models.ExplorationActualStartEventLogEntryModel(
            id='id2',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.STATE_NAME,
            session_id='session_id_2',
            event_schema_version=2).put()
        stats_models.ExplorationActualStartEventLogEntryModel(
            id='id3',
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            state_name=self.STATE_NAME,
            session_id='session_id_3',
            event_schema_version=1).put()
        stats_models.ExplorationActualStartEventLogEntryModel(
            id='id4',
            exp_id=self.EXP_ID,
            exp_version=2,
            state_name=self.STATE_NAME,
            session_id='session_id_4',
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
            'num_completions_v2': 0,
        }
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, self.EXP_VERSION, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.STATE_NAME: state_stats_dict})
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=2, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.STATE_NAME: state_stats_dict})
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=3, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.STATE_NAME: state_stats_dict})

    def test_standard_operation(self):
        self.run_one_off_job()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.EXP_ID, self.EXP_VERSION)
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_actual_starts_v2, 2)
        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_actual_starts_v2, 3)

    def test_recompute_for_version_with_no_events(self):
        self.run_one_off_job()

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 3))
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_actual_starts_v2, 3)


class RecomputeCompleteEventStatisticsTests(OneOffJobTestBase):
    ONE_OFF_JOB_CLASS = stats_jobs_one_off.RecomputeStatisticsOneOffJob
    EXP_ID = 'EXP_ID'
    EXP_VERSION = 1
    STATE_NAME = 'state_1'

    def setUp(self):
        super(RecomputeCompleteEventStatisticsTests, self).setUp()
        self.save_new_default_exploration(self.EXP_ID, 'owner')

        change_list = []
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        stats_models.CompleteExplorationEventLogEntryModel(
            id='id1',
            event_type=feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
            exploration_id=self.EXP_ID,
            exploration_version=self.EXP_VERSION,
            state_name=self.STATE_NAME,
            session_id='session_id_1',
            client_time_spent_in_secs=1.0,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.CompleteExplorationEventLogEntryModel(
            id='id2',
            event_type=feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
            exploration_id=self.EXP_ID,
            exploration_version=self.EXP_VERSION,
            state_name=self.STATE_NAME,
            session_id='session_id_2',
            client_time_spent_in_secs=1.0,
            params={},
            play_type=feconf.PLAY_TYPE_NORMAL,
            event_schema_version=2).put()
        stats_models.CompleteExplorationEventLogEntryModel(
            id='id3',
            event_type=feconf.EVENT_TYPE_COMPLETE_EXPLORATION,
            exploration_id=self.EXP_ID,
            exploration_version=2,
            state_name=self.STATE_NAME,
            session_id='session_id_3',
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
            'num_completions_v2': 0,
        }
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, self.EXP_VERSION, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.STATE_NAME: state_stats_dict})
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, exp_version=2, num_starts_v1=0, num_starts_v2=0,
            num_actual_starts_v1=0, num_actual_starts_v2=0,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.STATE_NAME: state_stats_dict})

    def test_standard_operation(self):
        self.run_one_off_job()

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.EXP_ID, self.EXP_VERSION)
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_completions_v2, 2)

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.num_completions_v2, 3)
