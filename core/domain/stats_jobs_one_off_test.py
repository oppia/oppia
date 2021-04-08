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

import ast

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.domain import stats_jobs_one_off
from core.domain import stats_services
from core.domain import taskqueue_services
from core.platform import models
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
        return self.count_jobs_in_mapreduce_taskqueue(
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
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        return self.ONE_OFF_JOB_CLASS.get_output(job_id)


class RegenerateMissingStateStatsOneOffJobTests(OneOffJobTestBase):
    """Unit tests for RegenerateMissingStateStatsOneOffJob."""

    ONE_OFF_JOB_CLASS = stats_jobs_one_off.RegenerateMissingStateStatsOneOffJob

    EXP_ID = 'eid'
    OWNER_ID = 'uid'

    def run_one_off_job(self):
        """Begins the one off job and returns its decoded values.

        Returns:
            list(*). The output of the one off job.
        """
        raw_output = super(
            RegenerateMissingStateStatsOneOffJobTests, self).run_one_off_job()
        return [ast.literal_eval(o) for o in raw_output]

    def test_job_yields_nothing_when_all_explorations_are_deleted(self):
        exp = self.save_new_valid_exploration(self.EXP_ID, self.OWNER_ID)
        exp_models.ExplorationModel.get(exp.id).delete(
            self.OWNER_ID, feconf.COMMIT_MESSAGE_EXPLORATION_DELETED)

        self.assertEqual(self.run_one_off_job(), [])

    def test_job_yields_success_when_all_state_stats_exist(self):
        exp = self.save_new_valid_exploration(self.EXP_ID, self.OWNER_ID)
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp.id, [], 'Trivial change')

        self.assertEqual(self.run_one_off_job(), [
            ['ExplorationStatsModel with valid state(s)', 2]
        ])

    def test_job_regenerates_state_with_same_stats_from_previous_version(self):
        exp = self.save_new_valid_exploration(self.EXP_ID, self.OWNER_ID)
        state_name = exp.init_state_name
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp.id, [], 'Trivial change')

        state_stats = stats_domain.StateStats(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)

        v1_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 1))
        v1_stats.state_stats_mapping[state_name] = state_stats.to_dict()
        v1_stats.update_timestamps()
        v1_stats.put()

        v2_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        del v2_stats.state_stats_mapping[state_name]
        v2_stats.update_timestamps()
        v2_stats.put()

        self.assertEqual(self.run_one_off_job(), [
            ['ExplorationStatsModel state stats regenerated', [
                '%s.2: %s' % (self.EXP_ID, state_name)
            ]],
            ['ExplorationStatsModel with valid state(s)', 1]
        ])

        v1_stats = stats_services.get_exploration_stats_by_id(self.EXP_ID, 1)
        v2_stats = stats_services.get_exploration_stats_by_id(self.EXP_ID, 2)
        self.assertEqual(
            v1_stats.state_stats_mapping[state_name],
            v2_stats.state_stats_mapping[state_name])

    def test_job_regenerates_renamed_state_with_same_stats(self):
        exp = self.save_new_valid_exploration(self.EXP_ID, self.OWNER_ID)
        old_state_name = exp.init_state_name
        new_state_name = 'Welcome!'
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': old_state_name,
                'new_state_name': new_state_name,
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp.id, change_list, 'Use Welcome!')

        state_stats = stats_domain.StateStats(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)

        v1_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 1))
        v1_stats.state_stats_mapping[old_state_name] = state_stats.to_dict()
        v1_stats.update_timestamps()
        v1_stats.put()

        v2_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        del v2_stats.state_stats_mapping[new_state_name]
        v2_stats.update_timestamps()
        v2_stats.put()

        self.assertEqual(self.run_one_off_job(), [
            ['ExplorationStatsModel state stats regenerated', [
                '%s.2: %s' % (self.EXP_ID, new_state_name)
            ]],
            ['ExplorationStatsModel with valid state(s)', 1]
        ])

        v1_stats = stats_services.get_exploration_stats_by_id(self.EXP_ID, 1)
        v2_stats = stats_services.get_exploration_stats_by_id(self.EXP_ID, 2)
        self.assertEqual(
            v1_stats.state_stats_mapping[old_state_name],
            v2_stats.state_stats_mapping[new_state_name])

    def test_job_regenerates_renamed_state_when_original_state_is_missing(self):
        exp = self.save_new_valid_exploration(self.EXP_ID, self.OWNER_ID)
        real_old_state_name = exp.init_state_name
        fake_old_state_name = 'Fake Introduction'
        new_state_name = 'Welcome!'
        change_list = [
            exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': real_old_state_name,
                'new_state_name': new_state_name,
            })
        ]
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp.id, change_list, 'Use Welcome!')

        snapshot = exp_models.ExplorationModel.SNAPSHOT_METADATA_CLASS.get(
            exp_models.ExplorationModel.get_snapshot_id(exp.id, 2))
        snapshot.commit_cmds[0]['old_state_name'] = fake_old_state_name
        snapshot.update_timestamps()
        snapshot.put()

        v2_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        del v2_stats.state_stats_mapping[new_state_name]
        v2_stats.update_timestamps()
        v2_stats.put()

        self.assertEqual(self.run_one_off_job(), [
            ['ExplorationStatsModel state stats has bad rename', [
                'eid.1: "Fake Introduction" -> "Welcome!"'
            ]],
            ['ExplorationStatsModel state stats regenerated', [
                '%s.2: %s' % (self.EXP_ID, new_state_name)
            ]],
            ['ExplorationStatsModel with valid state(s)', 1]
        ])

        v2_stats = stats_services.get_exploration_stats_by_id(self.EXP_ID, 2)
        self.assertEqual(
            v2_stats.state_stats_mapping[new_state_name],
            stats_domain.StateStats.create_default())

    def test_job_regenerates_state_when_missing_from_in_between_versions(self):
        # Create exploration's V1.
        exp = self.save_new_valid_exploration(self.EXP_ID, self.OWNER_ID)
        # Create exploration's V2.
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp.id,
            [exp_domain.ExplorationChange(
                {'cmd': 'add_state', 'state_name': 'State 2️⃣'})],
            'Add "Middle" state')
        # Create exploration's V3.
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp.id,
            [exp_domain.ExplorationChange(
                {'cmd': 'add_state', 'state_name': 'State 3️⃣'})],
            'Add "End" state')

        # Delete stats of the "in-between" exploration version.
        v2_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        del v2_stats.state_stats_mapping['State 2️⃣']
        v2_stats.update_timestamps()
        v2_stats.put()

        self.assertEqual(self.run_one_off_job(), [
            ['ExplorationStatsModel state stats regenerated', [
                '%s.2: State 2️⃣' % (self.EXP_ID,)
            ]],
            ['ExplorationStatsModel with valid state(s)', 2]
        ])

    def test_job_ignores_missing_state_when_entire_exp_stats_is_missing(self):
        """When entire ExplorationStatsModel is missing, responsibility for
        regenerating falls to the RegenerateMissingV*StatsModelsOneOffJob.
        """
        # Create exploration's V1.
        exp = self.save_new_valid_exploration(self.EXP_ID, self.OWNER_ID)
        # Create exploration's V2.
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp.id,
            [exp_domain.ExplorationChange(
                {'cmd': 'add_state', 'state_name': 'Middle'})],
            'Add "Middle" state')
        # Create exploration's V3.
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp.id,
            [exp_domain.ExplorationChange(
                {'cmd': 'add_state', 'state_name': 'End'})],
            'Add "End" state')

        # Delete v2 stats entirely.
        v2_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        v2_stats.delete()

        self.assertEqual(self.run_one_off_job(), [
            ['ExplorationStatsModel with valid state(s)', 2]
        ])


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
        self.process_and_flush_pending_mapreduce_tasks()
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

    def test_job_successfully_regenerates_stats_with_missing_state_stats(self):
        # Delete the stats of the initial state.
        v1_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.exp1.id, 1))
        del v1_stats.state_stats_mapping[self.exp1.init_state_name]
        v1_stats.update_timestamps()
        v1_stats.put()

        v2_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.exp1.id, 2))
        v2_stats.delete()

        self.assertEqual(
            self.run_one_off_job(),
            ['[u\'ExplorationStatsModel for missing versions regenerated: \', '
             '[u\'EXP_ID1 v2\']]',
             '[u\'ExplorationStatsModel ignored StateStats regeneration due '
             'to missing historical data\', [u\'EXP_ID1.2: Introduction\']]'])


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
        model1.update_timestamps()
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
        model1.update_timestamps()
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
        model1.update_timestamps()
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
        model1.update_timestamps()
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
        model1.update_timestamps()
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
        model1.update_timestamps()
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
        model1.update_timestamps()
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
        model1.update_timestamps()
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
        model1.update_timestamps()
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
        model1.update_timestamps()
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
        model1.update_timestamps()
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
        model1.update_timestamps()
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

    def test_job_successfully_regenerates_stats_with_missing_state_stats(self):
        v1_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 1))
        del v1_stats.state_stats_mapping[self.state_name]
        v1_stats.update_timestamps()
        v1_stats.put()

        v2_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        v2_stats.delete()

        self.assertEqual(self.run_one_off_job(), [u'[u\'Success\', 1]'])

        v2_stats = stats_models.ExplorationStatsModel.get(
            stats_models.ExplorationStatsModel.get_entity_id(self.EXP_ID, 2))
        self.assertEqual(
            v2_stats.state_stats_mapping[self.state_name],
            stats_domain.StateStats.create_default().to_dict())

    def test_job_correctly_calculates_stats_for_missing_commit_log_models(self):
        class MockExplorationCommitLogEntryModel(
                base_models.BaseCommitLogEntryModel):

            @classmethod
            def get_instance_id(cls, exp_id, exp_version):
                return 'exploration-%s-%s' % (exp_id, exp_version)

            def put(self):
                """Cancels the put operation."""
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


class ExplorationMissingStatsAuditOneOffJobTests(OneOffJobTestBase):
    ONE_OFF_JOB_CLASS = stats_jobs_one_off.ExplorationMissingStatsAudit

    def run_one_off_job(self):
        output = super(
            ExplorationMissingStatsAuditOneOffJobTests, self).run_one_off_job()
        return [ast.literal_eval(o) for o in output]

    def _do_not_create_stats_models(self):
        """Returns a context manager which does not create new stats models."""
        return self.swap(stats_services, 'create_stats_model', lambda _: None)

    def test_success_when_there_are_no_models(self):
        self.assertItemsEqual(self.run_one_off_job(), [])

    def test_success_when_stats_model_exists(self):
        self.save_new_default_exploration('ID', 'owner_id')

        self.assertItemsEqual(self.run_one_off_job(), [
            ['EXPECTED', '1 ExplorationStats model is valid'],
        ])

    def test_success_when_several_stats_model_exists(self):
        self.save_new_default_exploration('ID1', 'owner_id')
        self.save_new_default_exploration('ID2', 'owner_id')
        self.save_new_default_exploration('ID3', 'owner_id')

        self.assertItemsEqual(self.run_one_off_job(), [
            ['EXPECTED', '3 ExplorationStats models are valid'],
        ])

    def test_error_when_stats_model_is_missing(self):
        with self._do_not_create_stats_models():
            self.save_new_default_exploration('ID', 'owner_id')

        self.assertItemsEqual(self.run_one_off_job(), [
            ['UNEXPECTED',
             'ExplorationStats for Exploration "ID" missing at version: 1'],
        ])

    def test_error_when_stats_model_is_deleted(self):
        exp = self.save_new_default_exploration('ID', 'owner_id')

        stats = stats_models.ExplorationStatsModel.get_model('ID', exp.version)
        stats.deleted = True
        stats.update_timestamps()
        stats.put()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['UNEXPECTED',
             'ExplorationStats for Exploration "ID" deleted at version: 1'],
        ])

    def test_error_when_stats_model_is_missing_at_disjoint_versions(self):
        with self._do_not_create_stats_models():
            self.save_new_default_exploration('ID', 'owner_id')

        exp_services.update_exploration('owner_id', 'ID', None, 'noop')

        with self._do_not_create_stats_models():
            exp_services.update_exploration('owner_id', 'ID', None, 'noop')

        self.assertItemsEqual(self.run_one_off_job(), [
            ['EXPECTED', '1 ExplorationStats model is valid'],
            ['UNEXPECTED',
             'ExplorationStats for Exploration "ID" missing at versions: 1, 3'],
        ])

    def test_error_when_stats_model_is_deleted_at_disjoint_versions(self):
        self.save_new_default_exploration('ID', 'owner_id') # v1
        exp_services.update_exploration('owner_id', 'ID', None, 'noop') # v2
        exp_services.update_exploration('owner_id', 'ID', None, 'noop') # v3

        for stats in stats_models.ExplorationStatsModel.get_multi_versions(
                'ID', [1, 3]):
            stats.deleted = True
            stats.update_timestamps()
            stats.put()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['EXPECTED', '1 ExplorationStats model is valid'],
            ['UNEXPECTED',
             'ExplorationStats for Exploration "ID" deleted at versions: 1, 3'],
        ])

    def test_no_error_when_exploration_is_missing(self):
        stats_domain.ExplorationStats.create_default('ID', 1, {})

        self.assertItemsEqual(self.run_one_off_job(), [])

    def test_no_error_when_exploration_is_deleted(self):
        with self._do_not_create_stats_models():
            self.save_new_default_exploration('ID', 'owner_id')

        exp_models.ExplorationModel.get('ID').delete(
            'owner_id', feconf.COMMIT_MESSAGE_EXPLORATION_DELETED)

        self.assertItemsEqual(self.run_one_off_job(), [])

    def test_error_when_stats_for_state_is_missing(self):
        self.save_new_default_exploration('ID', 'owner_id')
        stats = stats_models.ExplorationStatsModel.get_model('ID', 1)
        del stats.state_stats_mapping[feconf.DEFAULT_INIT_STATE_NAME]
        stats.update_timestamps()
        stats.put()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['UNEXPECTED',
             'ExplorationStats "ID" v1 does not have stats for card "%s", but '
             'card appears in version: 1.' % (feconf.DEFAULT_INIT_STATE_NAME)]
        ])

    def test_error_when_state_which_does_not_exist_has_stats(self):
        self.save_new_default_exploration('ID', 'owner_id')
        stats = stats_models.ExplorationStatsModel.get_model('ID', 1)
        stats.state_stats_mapping['Unknown State'] = (
            stats_domain.StateStats.create_default().to_dict())
        stats.update_timestamps()
        stats.put()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['UNEXPECTED',
             'ExplorationStats "ID" v1 has stats for card "Unknown State", but '
             'card never existed.']
        ])

    def test_no_error_when_end_state_which_does_not_exist_has_stats(self):
        self.save_new_default_exploration('ID', 'owner_id')
        stats = stats_models.ExplorationStatsModel.get_model('ID', 1)
        stats.state_stats_mapping['END'] = (
            stats_domain.StateStats.create_default().to_dict())
        stats.update_timestamps()
        stats.put()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['EXPECTED', '1 ExplorationStats model is valid'],
        ])

    def test_error_when_stats_for_state_no_longer_exists(self):
        self.save_new_default_exploration('ID', 'owner_id')
        exp_services.update_exploration('owner_id', 'ID', None, 'noop') # v2
        stats = stats_models.ExplorationStatsModel.get_model('ID', 2)
        del stats.state_stats_mapping[feconf.DEFAULT_INIT_STATE_NAME]
        stats.update_timestamps()
        stats.put()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['EXPECTED', '1 ExplorationStats model is valid'],
            ['UNEXPECTED',
             'ExplorationStats "ID" v2 does not have stats for card "%s", but '
             'card appears in versions: 1, 2.' % feconf.DEFAULT_INIT_STATE_NAME]
        ])

    def test_error_when_stats_for_state_once_existed(self):
        self.save_new_linear_exp_with_state_names_and_interactions(
            'ID', 'owner_id',
            ['State ①', 'State ②', 'State ③'],
            ['TextInput', 'TextInput', 'EndExploration'])
        exp_services.update_exploration('owner_id', 'ID', None, 'noop') # v2
        exp_services.update_exploration( # v3
            'owner_id', 'ID', [
                exp_domain.ExplorationChange(
                    {'cmd': 'delete_state', 'state_name': 'State ②'})
            ], 'Delete State ②')

        stats = stats_models.ExplorationStatsModel.get_model('ID', 3)
        stats.state_stats_mapping['State ②'] = (
            stats_domain.StateStats.create_default().to_dict())
        stats.update_timestamps()
        stats.put()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['EXPECTED', '2 ExplorationStats models are valid'],
            ['UNEXPECTED',
             'ExplorationStats "ID" v3 has stats for card "State ②", but card '
             'only appears in versions: 1, 2.']
        ])

    def test_no_error_when_exploration_can_not_update_schema(self):
        old_schema = self.swap(feconf, 'CURRENT_STATE_SCHEMA_VERSION', 41)

        with old_schema:
            self.save_new_default_exploration('ID', 'owner_id')

        new_schema = self.swap(feconf, 'CURRENT_STATE_SCHEMA_VERSION', 42)
        schema_update_failure = self.swap(
            exp_domain.Exploration, '_convert_states_v41_dict_to_v42_dict',
            classmethod(lambda *_: python_utils.divide(1, 0)))

        with new_schema, schema_update_failure:
            self.assertItemsEqual(self.run_one_off_job(), [
                ['EXPECTED', '1 ExplorationStats model is valid']
            ])


class StatisticsCustomizationArgsAuditTests(OneOffJobTestBase):

    ONE_OFF_JOB_CLASS = stats_jobs_one_off.StatisticsCustomizationArgsAudit
    EXP_ID = 'EXP_ID'
    EXP_VERSION = 1
    STATE_NAME = 'state_1'

    def setUp(self):
        super(StatisticsCustomizationArgsAuditTests, self).setUp()

        # ExplorationIssues with one valid ExplorationIssue, and one invalid.
        stats_models.ExplorationIssuesModel.create(
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            unresolved_issues=[{
                'issue_type': 'MultipleIncorrectSubmissions',
                'issue_customization_args': {
                    'state_name': {
                        'value': ''
                    },
                    'num_times_answered_incorrectly': {
                        'value': 1
                    }
                },
                'playthrough_ids': [],
                'schema_version': 0,
                'is_valid': False
            }, {
                'issue_type': 'MultipleIncorrectSubmissions',
                'issue_customization_args': {
                    'state_name': {
                        'value': ''
                    },
                },
                'playthrough_ids': [],
                'schema_version': 0,
                'is_valid': False
            }]
        )

        # PlaythroughModel with valid customization args, and action with valid
        # customization args.
        stats_models.PlaythroughModel.create(
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            issue_type='EarlyQuit',
            issue_customization_args={
                'state_name': {
                    'value': ''
                },
                'time_spent_in_exp_in_msecs': {
                    'value': 0
                }
            },
            actions=[{
                'action_type': 'ExplorationStart',
                'action_customization_args': {
                    'state_name': {
                        'value': ''
                    }
                },
                'schema_version': 1
            }]
        )

        # PlaythroughModel with invalid customization args, and action with
        # invalid customization args.
        stats_models.PlaythroughModel.create(
            exp_id=self.EXP_ID,
            exp_version=self.EXP_VERSION,
            issue_type='EarlyQuit',
            issue_customization_args={},
            actions=[{
                'action_type': 'ExplorationStart',
                'action_customization_args': {},
                'schema_version': 1
            }]
        )

    def test_statistics_customization_args_audit(self):
        self.assertItemsEqual(
            self.run_one_off_job(),
            [
                u'[u\'ExplorationIssue -- SUCCESS\', 1]',
                (
                    u'[u\'Playthrough Action -- FAILURE\', [u"(\'EXP_ID\', \'Ex'
                    'plorationStart\', [])"]]'),
                (
                    u'[u\'Playthrough Issue -- FAILURE\', [u"(\'EXP_ID\', \'Ear'
                    'lyQuit\', [])"]]'),
                u'[u\'Playthrough Action -- SUCCESS\', 1]',
                (
                    u'[u\'ExplorationIssue -- FAILURE\', [u"(\'EXP_ID\', \'Mult'
                    'ipleIncorrectSubmissions\', [\'state_name\'])"]]'),
                u'[u\'Playthrough Issue -- SUCCESS\', 1]'
            ]
        )


class WipeExplorationIssuesOneOffJobTests(OneOffJobTestBase):

    ONE_OFF_JOB_CLASS = stats_jobs_one_off.WipeExplorationIssuesOneOffJob

    EXP_ID = 'eid'

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
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertEqual(self.count_one_off_jobs_in_queue(), 0)
        return [ast.literal_eval(output)
                for output in self.ONE_OFF_JOB_CLASS.get_output(job_id)]

    def assert_playthroughs_exist(self, playthrough_ids):
        """Asserts that the given playthrough exists.

        Args:
            playthrough_ids: list(str). The playthroughs to check.
        """
        playthrough_models = (
            stats_models.PlaythroughModel.get_multi(playthrough_ids))
        models_deleted = [
            playthrough_id
            for playthrough_id, playthrough_model in python_utils.ZIP(
                playthrough_ids, playthrough_models)
            if not playthrough_model or playthrough_model.deleted
        ]
        self.assertEqual(models_deleted, [])

    def assert_playthroughs_deleted(self, playthrough_ids=None):
        """Asserts that all playthroughs are deleted.

        Args:
            playthrough_ids: list(str) | None. The list of playthrough_ids to
                verify no longer exist. If None, then every playthrough in
                storage is checked.
        """
        playthrough_models = (
            stats_models.PlaythroughModel.get_all()
            if playthrough_ids is None else
            stats_models.PlaythroughModel.get_multi(playthrough_ids))
        models_not_deleted = [
            playthrough_model.id for playthrough_model in playthrough_models
            if playthrough_model
        ]
        self.assertEqual(models_not_deleted, [])

    def assert_exp_issues_empty(self):
        """Asserts that all exploration issues are empty."""
        exp_issues_models = stats_models.ExplorationIssuesModel.get_all()
        models_not_empty = [
            exp_issues_model.id for exp_issues_model in exp_issues_models
            if exp_issues_model and exp_issues_model.unresolved_issues
        ]
        self.assertEqual(models_not_empty, [])

    def get_exp_issues(self, exp_id=EXP_ID, exp_version=1):
        """Fetches the ExplorationIssuesModel for the given version."""
        return (
            stats_models.ExplorationIssuesModel.get_model(exp_id, exp_version))

    def append_exp_issue(self, exp_issues_model, playthrough_ids):
        """Appends a new ExplorationIssue to the given model.

        Args:
            exp_issues_model: ExplorationIssuesModel. The model to append a new
                issue to.
            playthrough_ids: list(str). The playthrough ids to include in the
                new issue.
        """
        new_exp_issue = stats_domain.ExplorationIssue(
            issue_type='EarlyQuit',
            issue_customization_args={
                'state_name': {'value': ''},
                'time_spent_in_exp_in_msecs': {'value': 0},
            },
            playthrough_ids=playthrough_ids, schema_version=1, is_valid=True)
        exp_issues_model.unresolved_issues.append(new_exp_issue.to_dict())
        exp_issues_model.update_timestamps()
        exp_issues_model.put()

    def create_playthrough_model(self, exp_id=EXP_ID, exp_version=1):
        """Creates a new playthrough model and returns its ID."""
        return stats_models.PlaythroughModel.create(
            exp_id=exp_id,
            exp_version=exp_version,
            issue_type='EarlyQuit',
            issue_customization_args={
                'state_name': {'value': ''},
                'time_spent_in_exp_in_msecs': {'value': 0},
            },
            actions=[{
                'action_type': 'ExplorationStart',
                'action_customization_args': {'state_name': {'value': ''}},
                'schema_version': 1,
            }]
        )

    def create_exp_and_exp_issues(self, exp_id=EXP_ID):
        """Creates a new exploration and its corresponding issues model."""
        # Exploration's creation process guarantees a corresponding issues model
        # is created, no need for us to do anything else.
        self.save_new_valid_exploration(exp_id, feconf.SYSTEM_COMMITTER_ID)

    def create_next_exp_version(self, exp_id=EXP_ID):
        """Publishes a new version of the given exploration."""
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp_id, [], 'Trivial change')

    def test_run_job_with_empty_environment_does_nothing(self):
        self.assertEqual(self.run_one_off_job(), [])

    def test_run_job_with_trivial_exp_and_exp_issues_wipes_them(self):
        self.create_exp_and_exp_issues()

        self.assertItemsEqual(self.run_one_off_job(), [
            ['Existing ExplorationIssuesModel(s) wiped out', 1],
        ])

        self.assert_exp_issues_empty()

    def test_run_job_with_playthrough_references_deletes_them(self):
        self.create_exp_and_exp_issues()
        self.append_exp_issue(
            self.get_exp_issues(),
            [self.create_playthrough_model() for _ in python_utils.RANGE(3)])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['Existing ExplorationIssuesModel(s) wiped out', 1],
            ['Referenced PlaythroughModel(s) deleted', 3],
        ])

        self.assert_exp_issues_empty()
        self.assert_playthroughs_deleted()

        # Running job again should only report cleared items.
        self.assertItemsEqual(self.run_one_off_job(), [
            ['Existing ExplorationIssuesModel(s) wiped out', 1],
        ])

        self.assert_exp_issues_empty()
        self.assert_playthroughs_deleted()

    def test_run_job_with_missing_issues_regenerates_them(self):
        self.create_exp_and_exp_issues()
        self.create_next_exp_version()
        self.create_next_exp_version()
        stats_models.ExplorationIssuesModel.delete_multi([
            self.get_exp_issues(exp_version=2),
            self.get_exp_issues(exp_version=3),
        ])

        self.assertItemsEqual(self.run_one_off_job(), [
            ['Existing ExplorationIssuesModel(s) wiped out', 1],
            ['Missing ExplorationIssuesModel(s) regenerated',
             'exp_id=\'eid\' exp_version(s)=[2, 3]'],
        ])

        self.assert_exp_issues_empty()

        # Running job again should only report cleared items.
        self.assertItemsEqual(self.run_one_off_job(), [
            ['Existing ExplorationIssuesModel(s) wiped out', 3],
        ])

        self.assert_exp_issues_empty()

    def test_run_job_with_unowned_playthroughs_leaves_them_alone(self):
        self.create_exp_and_exp_issues()
        owned_playthrough_ids = [
            self.create_playthrough_model(), self.create_playthrough_model()]
        unowned_playthrough_ids = [
            self.create_playthrough_model(), self.create_playthrough_model()]
        self.append_exp_issue(self.get_exp_issues(), owned_playthrough_ids)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['Existing ExplorationIssuesModel(s) wiped out', 1],
            ['Referenced PlaythroughModel(s) deleted', 2],
        ])

        self.assert_exp_issues_empty()
        self.assert_playthroughs_exist(unowned_playthrough_ids)
        self.assert_playthroughs_deleted(playthrough_ids=owned_playthrough_ids)

    def test_run_job_with_dangling_playthrough_reports_it(self):
        self.create_exp_and_exp_issues()
        playthrough_id = self.create_playthrough_model()
        self.append_exp_issue(self.get_exp_issues(), [playthrough_id])
        stats_models.PlaythroughModel.delete_by_id(playthrough_id)

        self.assertItemsEqual(self.run_one_off_job(), [
            ['Existing ExplorationIssuesModel(s) wiped out', 1],
            ['Dangling PlaythroughModel(s) discovered', 1],
        ])

        self.assert_exp_issues_empty()
        self.assert_playthroughs_deleted()
