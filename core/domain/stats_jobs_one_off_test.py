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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.domain import stats_jobs_one_off
from core.domain import stats_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
import core.storage.base_model.gae_models as base_models
from core.tests import test_utils
import feconf
import python_utils

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


class RegenerateMissingV1StatsModelsOneOffJobTests(OneOffJobTestBase):
    """Unit tests for RegenerateMissingV1StatsModelsOneOffJob."""
    ONE_OFF_JOB_CLASS = (
        stats_jobs_one_off.RegenerateMissingV1StatsModelsOneOffJob)
    EXP_ID = 'EXP_ID1'

    def setUp(self):
        super(RegenerateMissingV1StatsModelsOneOffJobTests, self).setUp()

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
        self.exp1 = exp_fetchers.get_exploration_by_id(self.exp1.id)

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

    def test_output_for_deleted_exploration(self):
        job_id = self.ONE_OFF_JOB_CLASS.create_new()
        self.ONE_OFF_JOB_CLASS.enqueue(job_id)
        self.assertEqual(self.count_one_off_jobs_in_queue(), 1)

        exp_services.delete_exploration('owner', self.EXP_ID)
        self.process_and_flush_pending_tasks()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)

        output = self.ONE_OFF_JOB_CLASS.get_output(job_id)
        self.assertEqual(output, [])

    def test_stats_models_regeneration_with_no_stats_model(self):
        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'New state',
            'new_state_name': 'Another state'
        })]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.exp1.id, change_list, '')

        model_id = '%s.3' % self.EXP_ID
        model1 = stats_models.ExplorationStatsModel.get(model_id)
        model1.delete()

        output = self.run_one_off_job()
        self.assertEqual(
            output,
            ['[u\'ExplorationStatsModel for missing versions regenerated: \', '
             '[u\'EXP_ID1 v3\']]'])

        model_id = '%s.2' % self.EXP_ID
        model1 = stats_models.ExplorationStatsModel.get(model_id)
        model1.delete()

        output = self.run_one_off_job()
        self.assertEqual(
            output,
            ['[u\'ExplorationStatsModel for missing versions regenerated: \', '
             '[u\'EXP_ID1 v2\']]'])


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

    def test_job_for_addition_and_deletion_of_state_names(self):
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_ADD_STATE,
                'state_name': 'State A',
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        job_output = self.run_one_off_job()
        self.assertEqual(job_output, [])

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 4))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping.get('State A')

        expected_state_stats_dict = stats_domain.StateStats.create_default(
            ).to_dict()
        self.assertEqual(state_stats, expected_state_stats_dict)

        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_DELETE_STATE,
                'state_name': 'State A',
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

        job_output = self.run_one_off_job()
        self.assertEqual(job_output, [])

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 5))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping.get('State A')

        self.assertIsNone(state_stats)


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

    def test_job_with_no_exploration_version(self):
        model1 = stats_models.ExplorationActualStartEventLogEntryModel.get(
            'id1')
        model2 = stats_models.ExplorationActualStartEventLogEntryModel.get(
            'id2')
        model3 = stats_models.ExplorationActualStartEventLogEntryModel.get(
            'id3')
        model4 = stats_models.ExplorationActualStartEventLogEntryModel.get(
            'id4')
        stats_models.ExplorationActualStartEventLogEntryModel.delete_multi(
            [model1, model2, model3, model4])
        stats_models.ExplorationActualStartEventLogEntryModel(
            id='id',
            exp_id=self.EXP_ID,
            exp_version=None,
            state_name=self.STATE_NAME,
            session_id='session_id_4',
            event_schema_version=2).put()
        created_on = stats_models.ExplorationActualStartEventLogEntryModel.get(
            'id').created_on

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'None version for EXP_ID actual_start state_1 id %s\']'
             % created_on])

    def test_job_with_invalid_exploration_id(self):
        stats_models.ExplorationActualStartEventLogEntryModel(
            id='id',
            exp_id='invalid_exp_id',
            exp_version=self.EXP_VERSION,
            state_name=self.STATE_NAME,
            session_id='session_id_4',
            event_schema_version=2).put()

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'Exploration with exploration_id invalid_exp_id not found\']'])

    def test_job_with_non_existing_datastore_stats(self):
        model1 = stats_models.ExplorationStatsModel.get('%s.2' % self.EXP_ID)
        model2 = stats_models.ExplorationStatsModel.get('%s.3' % self.EXP_ID)
        stats_models.ExplorationStatsModel.delete_multi([model1, model2])

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'ERROR in retrieving datastore stats. They do not exist for: '
             'exp_id: EXP_ID, exp_version: 2\']'])


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


class StatisticsAuditTests(OneOffJobTestBase):

    ONE_OFF_JOB_CLASS = stats_jobs_one_off.StatisticsAudit
    EXP_ID = 'EXP_ID'
    EXP_VERSION = 1
    STATE_NAME = 'state_1'

    def setUp(self):
        super(StatisticsAuditTests, self).setUp()

        state_count = {
            'state_name': {
                'first_entry_count': 1,
                'total_entry_count': 1,
                'no_answer_count': 1
            }
        }
        stats_models.ExplorationAnnotationsModel.create(
            'exp_id1', '1', 0, 0, state_count)
        stats_models.StateCounterModel.get_or_create('exp_id1', 'state_name')

    def test_statistics_audit_with_negative_start_count(self):
        model1 = stats_models.ExplorationAnnotationsModel.get('exp_id1:1')
        model1.num_starts = -2
        model1.put()
        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'Negative start count: exp_id:exp_id1 version:1 starts:-2\']',
             '[u\'Completions > starts: exp_id:exp_id1 version:1 0>-2\']',
             '[u\'Non-all != all for starts: exp_id:exp_id1 sum: -2 all: 0\']'])

    def test_statistics_audit_with_negative_completion_count(self):
        model1 = stats_models.ExplorationAnnotationsModel.get('exp_id1:1')
        model1.num_completions = -2
        model1.put()
        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'Negative completion count: exp_id:exp_id1 version:1 '
             'completions:-2\']',
             '[u\'Non-all != all for completions: exp_id:exp_id1 sum: -2 '
             'all: 0\']'])

    def test_statistics_audit_with_version_all(self):
        model1 = stats_models.ExplorationAnnotationsModel.get('exp_id1:1')
        model1.version = stats_jobs_continuous.VERSION_ALL
        model1.put()

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'state hit count not same exp_id:exp_id1 state:state_name, '
             'all:1 sum: null\']'])

    def test_statistics_audit_with_negative_first_entry_count(self):
        model1 = stats_models.StateCounterModel.get_or_create(
            'exp_id1', 'state_name')
        model1.first_entry_count = -1
        model1.put()

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u"Less than 0: Key('
             '\'StateCounterModel\', \'exp_id1.state_name\') -1"]'])


class StatisticsAuditVTwoTests(OneOffJobTestBase):

    ONE_OFF_JOB_CLASS = stats_jobs_one_off.StatisticsAuditV2
    EXP_ID = 'EXP_ID'
    EXP_VERSION = 1
    STATE_NAME = 'state_1'

    def setUp(self):
        super(StatisticsAuditVTwoTests, self).setUp()

        state_stats_dict = {
            'total_answers_count_v1': 3,
            'total_answers_count_v2': 9,
            'useful_feedback_count_v1': 3,
            'useful_feedback_count_v2': 1,
            'total_hit_count_v1': 3,
            'total_hit_count_v2': 1,
            'first_hit_count_v1': 3,
            'first_hit_count_v2': 1,
            'num_times_solution_viewed_v2': 1,
            'num_completions_v1': 3,
            'num_completions_v2': 1,
        }
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, self.EXP_VERSION, num_starts_v1=2, num_starts_v2=2,
            num_actual_starts_v1=1, num_actual_starts_v2=1,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.STATE_NAME: state_stats_dict})

    def test_statistics_audit_v2_with_invalid_completions_count(self):
        model1 = stats_models.ExplorationStatsModel.get_model(
            self.EXP_ID, self.EXP_VERSION)
        model1.num_completions_v2 = 3
        model1.put()

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'Completions > starts: exp_id:EXP_ID version:1 3 > 2\']',
             '[u\'Completions > actual starts: exp_id:EXP_ID version:1 '
             '3 > 1\']'])

    def test_statistics_audit_v2_with_invalid_actual_starts_count(self):
        model1 = stats_models.ExplorationStatsModel.get_model(
            self.EXP_ID, self.EXP_VERSION)
        model1.num_actual_starts_v2 = 3
        model1.put()

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'Actual starts > starts: exp_id:EXP_ID version:1 3 > 2\']'])

    def test_statistics_audit_v2_with_invalid_useful_feedback_count(self):
        state_stats_dict = {
            'total_answers_count_v1': 3,
            'total_answers_count_v2': 9,
            'useful_feedback_count_v1': 3,
            'useful_feedback_count_v2': 10,
            'total_hit_count_v1': 3,
            'total_hit_count_v2': 1,
            'first_hit_count_v1': 3,
            'first_hit_count_v2': 1,
            'num_times_solution_viewed_v2': 1,
            'num_completions_v1': 3,
            'num_completions_v2': 1,
        }

        model1 = stats_models.ExplorationStatsModel.get_model(
            self.EXP_ID, self.EXP_VERSION)
        model1.state_stats_mapping = {self.STATE_NAME: state_stats_dict}
        model1.put()

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'Total answers < Answers with useful feedback: exp_id:EXP_ID '
             'version:1 state:state_1 9 > 10\']'])

    def test_statistics_audit_v2_with_negative_total_hit_count(self):
        state_stats_dict = {
            'total_answers_count_v1': 3,
            'total_answers_count_v2': 9,
            'useful_feedback_count_v1': 3,
            'useful_feedback_count_v2': 1,
            'total_hit_count_v1': 3,
            'total_hit_count_v2': -1,
            'first_hit_count_v1': 3,
            'first_hit_count_v2': 1,
            'num_times_solution_viewed_v2': 1,
            'num_completions_v1': 3,
            'num_completions_v2': 1,
        }

        model1 = stats_models.ExplorationStatsModel.get_model(
            self.EXP_ID, self.EXP_VERSION)
        model1.state_stats_mapping = {self.STATE_NAME: state_stats_dict}
        model1.put()

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'Solution count > Total state hits: exp_id:EXP_ID version:1 '
             'state:state_1 1 > -1\']',
             '[u\'Total state hits < First state hits: exp_id:EXP_ID version:1 '
             'state:state_1 -1 > 1\']',
             '[u\'Total state hits < Total state completions: exp_id:EXP_ID '
             'version:1 state:state_1 -1 > 1\']',
             'Negative count: exp_id:EXP_ID version:1 state:state_1 '
             'total_hit_count_v2:-1'])


class StatisticsAuditVOneTests(OneOffJobTestBase):

    ONE_OFF_JOB_CLASS = stats_jobs_one_off.StatisticsAuditV1
    EXP_ID = 'EXP_ID'
    EXP_VERSION = 1
    STATE_NAME = 'state_1'

    def setUp(self):
        super(StatisticsAuditVOneTests, self).setUp()

        state_stats_dict = {
            'total_answers_count_v1': 9,
            'total_answers_count_v2': 9,
            'useful_feedback_count_v1': 1,
            'useful_feedback_count_v2': 1,
            'total_hit_count_v1': 1,
            'total_hit_count_v2': 1,
            'first_hit_count_v1': 1,
            'first_hit_count_v2': 1,
            'num_times_solution_viewed_v2': 1,
            'num_completions_v1': 1,
            'num_completions_v2': 1,
        }
        stats_models.ExplorationStatsModel.create(
            self.EXP_ID, self.EXP_VERSION, num_starts_v1=2, num_starts_v2=2,
            num_actual_starts_v1=1, num_actual_starts_v2=1,
            num_completions_v1=0, num_completions_v2=0,
            state_stats_mapping={self.STATE_NAME: state_stats_dict})

    def test_statistics_audit_v1_with_invalid_completions_count(self):
        model1 = stats_models.ExplorationStatsModel.get_model(
            self.EXP_ID, self.EXP_VERSION)
        model1.num_completions_v1 = 3
        model1.put()

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'Completions > starts: exp_id:EXP_ID version:1 3 > 2\']',
             '[u\'Completions > actual starts: exp_id:EXP_ID version:1 '
             '3 > 1\']'])

    def test_statistics_audit_v1_with_invalid_actual_starts_count(self):
        model1 = stats_models.ExplorationStatsModel.get_model(
            self.EXP_ID, self.EXP_VERSION)
        model1.num_actual_starts_v1 = 3
        model1.put()

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'Actual starts > starts: exp_id:EXP_ID version:1 3 > 2\']'])

    def test_statistics_audit_v1_with_invalid_useful_feedback_count(self):
        state_stats_dict = {
            'total_answers_count_v1': 9,
            'total_answers_count_v2': 9,
            'useful_feedback_count_v1': 10,
            'useful_feedback_count_v2': 1,
            'total_hit_count_v1': 1,
            'total_hit_count_v2': 1,
            'first_hit_count_v1': 1,
            'first_hit_count_v2': 1,
            'num_times_solution_viewed_v2': 1,
            'num_completions_v1': 1,
            'num_completions_v2': 1,
        }

        model1 = stats_models.ExplorationStatsModel.get_model(
            self.EXP_ID, self.EXP_VERSION)
        model1.state_stats_mapping = {self.STATE_NAME: state_stats_dict}
        model1.put()

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'Total answers < Answers with useful feedback: exp_id:EXP_ID '
             'version:1 state:state_1 9 > 10\']'])

    def test_statistics_audit_v1_with_negative_total_hit_count(self):
        state_stats_dict = {
            'total_answers_count_v1': 9,
            'total_answers_count_v2': 9,
            'useful_feedback_count_v1': 1,
            'useful_feedback_count_v2': 1,
            'total_hit_count_v1': -1,
            'total_hit_count_v2': 1,
            'first_hit_count_v1': 1,
            'first_hit_count_v2': 1,
            'num_times_solution_viewed_v2': 1,
            'num_completions_v1': 1,
            'num_completions_v2': 1,
        }

        model1 = stats_models.ExplorationStatsModel.get_model(
            self.EXP_ID, self.EXP_VERSION)
        model1.state_stats_mapping = {self.STATE_NAME: state_stats_dict}
        model1.put()

        job_output = self.run_one_off_job()
        self.assertEqual(
            job_output,
            ['[u\'Total state hits < First state hits: exp_id:EXP_ID version:1 '
             'state:state_1 -1 > 1\']',
             '[u\'Total state hits < Total state completions: exp_id:EXP_ID '
             'version:1 state:state_1 -1 > 1\']',
             'Negative count: exp_id:EXP_ID version:1 state:state_1 '
             'total_hit_count_v1:-1'])


class RecomputeStatisticsValidationCopyOneOffJobTests(OneOffJobTestBase):

    ONE_OFF_JOB_CLASS = (
        stats_jobs_one_off.RecomputeStatisticsValidationCopyOneOffJob)
    EXP_ID = 'EXP_ID'
    EXP_VERSION = 1
    STATE_NAME = 'state_1'

    def setUp(self):
        super(RecomputeStatisticsValidationCopyOneOffJobTests, self).setUp()
        self.exp = self.save_new_valid_exploration(self.EXP_ID, 'owner_id')

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
            exp_version=None,
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

        stats_models.StartExplorationEventLogEntryModel.create(
            self.EXP_ID, 1, self.exp.init_state_name, 'session_id1', {},
            feconf.PLAY_TYPE_NORMAL)

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

    def test_recompute_statistics_validation_copy_one_off_job(self):
        self.run_one_off_job()

        model_id = (
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 1))
        model = stats_models.ExplorationStatsModel.get(model_id)
        state_stats = model.state_stats_mapping[self.exp.init_state_name]

        self.assertEqual(state_stats['num_completions_v2'], 9)


class RegenerateMissingV2StatsModelsOneOffJobTests(OneOffJobTestBase):
    """Tests the regeneration of missing stats models."""
    ONE_OFF_JOB_CLASS = (
        stats_jobs_one_off.RegenerateMissingV2StatsModelsOneOffJob)

    def setUp(self):
        super(RegenerateMissingV2StatsModelsOneOffJobTests, self).setUp()
        self.EXP_ID = 'EXP_ID'
        self.exp = self.save_new_valid_exploration(self.EXP_ID, 'owner_id')
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

        exp_services.revert_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, 3, 2)

        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': self.state_name,
                'new_state_name': 'b',
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_ID, change_list, '')

    def test_job_successfully_regenerates_deleted_model(self):
        self.exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(self.exp.version, 5)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.EXP_ID, 4)
        model = stats_models.ExplorationStatsModel.get(model_id)
        model.delete()

        output = self.run_one_off_job()
        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.EXP_ID, 4)
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(output, [u'[u\'Success\', 1]'])

    def test_job_yields_correct_message_when_missing_model_at_version_1(self):
        self.exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(self.exp.version, 5)

        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.EXP_ID, 1)
        model = stats_models.ExplorationStatsModel.get(model_id)
        model.delete()
        model_id = stats_models.ExplorationStatsModel.get_entity_id(
            self.EXP_ID, 2)
        model = stats_models.ExplorationStatsModel.get(model_id)
        model.delete()

        output = self.run_one_off_job()
        self.assertEqual(
            output, [u'[u\'Missing model at version 1\', [u\''
                     + self.EXP_ID + '\']]'])

    def test_job_yields_no_change_when_no_regeneration_is_needed(self):
        self.exp = exp_fetchers.get_exploration_by_id(self.EXP_ID)
        self.assertEqual(self.exp.version, 5)

        output = self.run_one_off_job()
        self.assertEqual(output, [u'[u\'No change\', 1]'])

    def test_job_cleans_up_stats_models_for_deleted_exps(self):
        exp_id_1 = 'EXP_ID_1'
        exp = self.save_new_valid_exploration(exp_id_1, 'owner_id')
        state_name = exp.init_state_name

        change_list = []
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp_id_1, change_list, '')
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': state_name,
                'new_state_name': 'b',
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp_id_1, change_list, '')

        exp_services.revert_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp_id_1, 3, 2)

        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': state_name,
                'new_state_name': 'b',
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp_id_1, change_list, '')
        exp = exp_fetchers.get_exploration_by_id(exp_id_1)
        self.assertEqual(exp.version, 5)

        exp_services.delete_exploration(feconf.SYSTEM_COMMITTER_ID, exp_id_1)

        # The call to delete_exploration() causes some tasks to be started. So,
        # we flush them before running the job.
        self.process_and_flush_pending_tasks()

        output = self.run_one_off_job()
        self.assertEqual(
            output, [u'[u\'Deleted all stats\', [u"{u\'exp_id\': \'EXP_ID_1\', '
                     'u\'number_of_models\': 5}"]]', u'[u\'No change\', 1]'])

        all_models = (
            stats_models.ExplorationStatsModel.get_multi_stats_models(
                [exp_domain.ExpVersionReference(exp.id, version)
                 for version in python_utils.RANGE(1, exp.version + 1)]))
        for model in all_models:
            self.assertEqual(model, None)

    def test_job_correctly_calculates_stats_for_missing_commit_log_models(self):
        class MockExplorationCommitLogEntryModel(
                base_models.BaseCommitLogEntryModel):

            @classmethod
            def _get_instance_id(cls, exp_id, exp_version):
                return 'exploration-%s-%s' % (exp_id, exp_version)

            def put(self):
                return

        with self.swap(
            exp_models, 'ExplorationCommitLogEntryModel',
            MockExplorationCommitLogEntryModel):

            exp_id_2 = 'EXP_ID_2'
            exp = self.save_new_valid_exploration(exp_id_2, 'owner_id')
            state_name = exp.init_state_name

            change_list = []
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, exp_id_2, change_list, '')
            change_list = [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_RENAME_STATE,
                    'old_state_name': state_name,
                    'new_state_name': 'b',
                })
            ]
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, exp_id_2, change_list, '')

            exp_services.revert_exploration(
                feconf.SYSTEM_COMMITTER_ID, exp_id_2, 3, 2)

            change_list = [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_RENAME_STATE,
                    'old_state_name': state_name,
                    'new_state_name': 'c',
                })
            ]
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, exp_id_2, change_list, '')
            change_list = [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': 'd',
                })
            ]
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, exp_id_2, change_list, '')
            change_list = [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_DELETE_STATE,
                    'state_name': 'd'
                })
            ]
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, exp_id_2, change_list, '')
        exp = exp_fetchers.get_exploration_by_id(exp_id_2)
        self.assertEqual(exp.version, 7)

        for i in python_utils.RANGE(4, exp.version + 1):
            model_id = stats_models.ExplorationStatsModel.get_entity_id(
                exp_id_2, i)
            model = stats_models.ExplorationStatsModel.get(model_id)
            model.delete()

        for i in python_utils.RANGE(1, 7):
            commit_log_model = (
                exp_models.ExplorationCommitLogEntryModel.get_commit(
                    exp_id_2, i))
            self.assertIsNone(commit_log_model)

        output = self.run_one_off_job()
        self.assertEqual(output, [u'[u\'No change\', 1]', u'[u\'Success\', 1]'])

        all_models = (
            stats_models.ExplorationStatsModel.get_multi_stats_models(
                [exp_domain.ExpVersionReference(exp_id_2, version)
                 for version in python_utils.RANGE(1, exp.version + 1)]))
        for model in all_models:
            self.assertNotEqual(model, None)
        self.assertTrue('c' in all_models[4].state_stats_mapping)
        self.assertFalse('b' in all_models[4].state_stats_mapping)

        self.assertTrue('d' in all_models[5].state_stats_mapping)
        self.assertFalse('d' in all_models[6].state_stats_mapping)
