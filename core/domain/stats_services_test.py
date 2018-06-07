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

import operator
import os

from core import jobs_registry
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_jobs_continuous
from core.domain import stats_services
from core.domain import user_services
from core.platform import models
from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services
from core.tests import test_utils
import feconf
import utils

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


class StatisticsServicesTest(test_utils.GenericTestBase):
    """Test the helper functions and methods defined in the stats_services
    module.
    """

    def setUp(self):
        super(StatisticsServicesTest, self).setUp()
        self.exp_id = 'exp_id1'
        self.exp_version = 1
        self.stats_model_id = (
            stats_models.ExplorationStatsModel.create(
                'exp_id1', 1, 0, 0, 0, 0, 0, 0, {}))
        stats_models.ExplorationIssuesModel.create(
            self.exp_id, self.exp_version, [])

    def test_update_stats_method(self):
        """Test the update_stats method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 1)
        exploration_stats.state_stats_mapping = {
            'Home': stats_domain.StateStats.create_default()
        }
        stats_services.save_stats_model_transactional(exploration_stats)

        # Pass in exploration start event to stats model created in setup
        # function.
        aggregated_stats = {
            'num_starts': 1,
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                }
            }
        }

        stats_services.update_stats(
            'exp_id1', 1, aggregated_stats)
        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 1)
        self.assertEqual(exploration_stats.num_starts_v2, 1)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 1)
        self.assertEqual(exploration_stats.num_completions_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].total_hit_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].first_hit_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].total_answers_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].useful_feedback_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].num_completions_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Home'].num_times_solution_viewed_v2, 1)

    def test_calls_to_stats_methods(self):
        """Test that calls are being made to the
        handle_stats_creation_for_new_exp_version and
        handle_stats_creation_for_new_exploration methods when an exploration is
        created or updated.
        """
        # Initialize call counters.
        stats_for_new_exploration_log = test_utils.CallCounter(
            stats_services.handle_stats_creation_for_new_exploration)
        stats_for_new_exp_version_log = test_utils.CallCounter(
            stats_services.handle_stats_creation_for_new_exp_version)

        # Create exploration object in datastore.
        exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        with self.swap(
            stats_services, 'handle_stats_creation_for_new_exploration',
            stats_for_new_exploration_log):
            exp_services.save_new_exploration_from_yaml_and_assets(
                feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
                assets_list)

        # Now, the stats creation for new explorations method will be called
        # once and stats creation for new exploration version won't be called.
        self.assertEqual(stats_for_new_exploration_log.times_called, 1)
        self.assertEqual(stats_for_new_exp_version_log.times_called, 0)

        # Update exploration by adding a state.
        change_list = [{
            'cmd': 'add_state',
            'state_name': 'New state'
        }]
        with self.swap(
            stats_services, 'handle_stats_creation_for_new_exp_version',
            stats_for_new_exp_version_log):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, exp_id, change_list, '')

        # Now, the stats creation for new explorations method will be called
        # once and stats creation for new exploration version will also be
        # called once.
        self.assertEqual(stats_for_new_exploration_log.times_called, 1)
        self.assertEqual(stats_for_new_exp_version_log.times_called, 1)

    def test_handle_stats_creation_for_new_exploration(self):
        """Test the handle_stats_creation_for_new_exploration method."""
        # Create exploration object in datastore.
        exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
            assets_list)
        exploration = exp_services.get_exploration_by_id(exp_id)

        stats_services.handle_stats_creation_for_new_exploration(
            exploration.id, exploration.version, exploration.states)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(exploration_stats.exp_id, exp_id)
        self.assertEqual(exploration_stats.exp_version, 1)
        self.assertEqual(exploration_stats.num_starts_v1, 0)
        self.assertEqual(exploration_stats.num_starts_v2, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v1, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 0)
        self.assertEqual(exploration_stats.num_completions_v1, 0)
        self.assertEqual(exploration_stats.num_completions_v2, 0)
        self.assertEqual(
            exploration_stats.state_stats_mapping.keys(), ['Home', 'End'])

    def test_handle_stats_creation_for_new_exp_version(self):
        """Test the handle_stats_creation_for_new_exp_version method."""
        # Create exploration object in datastore.
        exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
            assets_list)
        exploration = exp_services.get_exploration_by_id(exp_id)

        # Test addition of states.
        exploration.add_states(['New state', 'New state 2'])
        exploration.version += 1
        change_list = [{
            'cmd': 'add_state',
            'state_name': 'New state',
        }, {
            'cmd': 'add_state',
            'state_name': 'New state 2'
        }]
        stats_services.handle_stats_creation_for_new_exp_version(
            exploration.id, exploration.version, exploration.states,
            change_list)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(exploration_stats.exp_id, exp_id)
        self.assertEqual(exploration_stats.exp_version, 2)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 0)
        self.assertEqual(exploration_stats.num_completions_v2, 0)
        self.assertEqual(
            set(exploration_stats.state_stats_mapping.keys()), set([
                'Home', 'New state 2', 'End', 'New state']))
        self.assertEqual(
            exploration_stats.state_stats_mapping['New state'].to_dict(),
            stats_domain.StateStats.create_default().to_dict())
        self.assertEqual(
            exploration_stats.state_stats_mapping['New state 2'].to_dict(),
            stats_domain.StateStats.create_default().to_dict())

        # Test renaming of states.
        exploration.rename_state('New state 2', 'Renamed state')
        exploration.version += 1
        change_list = [{
            'cmd': 'rename_state',
            'old_state_name': 'New state 2',
            'new_state_name': 'Renamed state'
        }]
        stats_services.handle_stats_creation_for_new_exp_version(
            exploration.id, exploration.version, exploration.states,
            change_list)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(exploration_stats.exp_version, 3)
        self.assertEqual(
            set(exploration_stats.state_stats_mapping.keys()), set([
                'Home', 'End', 'Renamed state', 'New state']))

        # Test deletion of states.
        exploration.delete_state('New state')
        exploration.version += 1
        change_list = [{
            'cmd': 'delete_state',
            'state_name': 'New state'
        }]
        stats_services.handle_stats_creation_for_new_exp_version(
            exploration.id, exploration.version, exploration.states,
            change_list)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(exploration_stats.exp_version, 4)
        self.assertEqual(
            set(exploration_stats.state_stats_mapping.keys()),
            set(['Home', 'Renamed state', 'End']))

        # Test addition, renaming and deletion of states.
        exploration.add_states(['New state 2'])
        exploration.rename_state('New state 2', 'Renamed state 2')
        exploration.delete_state('Renamed state 2')
        exploration.version += 1
        change_list = [{
            'cmd': 'add_state',
            'state_name': 'New state 2'
        }, {
            'cmd': 'rename_state',
            'old_state_name': 'New state 2',
            'new_state_name': 'Renamed state 2'
        }, {
            'cmd': 'delete_state',
            'state_name': 'Renamed state 2'
        }]
        stats_services.handle_stats_creation_for_new_exp_version(
            exploration.id, exploration.version, exploration.states,
            change_list)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(exploration_stats.exp_version, 5)
        self.assertEqual(
            set(exploration_stats.state_stats_mapping.keys()),
            set(['Home', 'End', 'Renamed state']))

        # Test addition and multiple renames.
        exploration.add_states(['New state 2'])
        exploration.rename_state('New state 2', 'New state 3')
        exploration.rename_state('New state 3', 'New state 4')
        exploration.version += 1
        change_list = [{
            'cmd': 'add_state',
            'state_name': 'New state 2',
        }, {
            'cmd': 'rename_state',
            'old_state_name': 'New state 2',
            'new_state_name': 'New state 3'
        }, {
            'cmd': 'rename_state',
            'old_state_name': 'New state 3',
            'new_state_name': 'New state 4'
        }]
        stats_services.handle_stats_creation_for_new_exp_version(
            exploration.id, exploration.version, exploration.states,
            change_list)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(exploration_stats.exp_version, 6)
        self.assertEqual(
            set(exploration_stats.state_stats_mapping.keys()),
            set(['Home', 'New state 4', 'Renamed state', 'End']))

        # Set some values for the the stats in the ExplorationStatsModel
        # instance.
        exploration_stats_model = stats_models.ExplorationStatsModel.get_model(
            exploration.id, exploration.version)
        exploration_stats_model.num_actual_starts_v2 = 5
        exploration_stats_model.num_completions_v2 = 2
        exploration_stats_model.state_stats_mapping['New state 4'][
            'total_answers_count_v2'] = 12
        exploration_stats_model.state_stats_mapping['Home'][
            'total_hit_count_v2'] = 8
        exploration_stats_model.state_stats_mapping['Renamed state'][
            'first_hit_count_v2'] = 2
        exploration_stats_model.state_stats_mapping['End'][
            'useful_feedback_count_v2'] = 4
        exploration_stats_model.put()

        # Test deletion, addition and rename.
        exploration.delete_state('New state 4')
        exploration.add_states(['New state'])
        exploration.rename_state('New state', 'New state 4')
        exploration.version += 1
        change_list = [{
            'cmd': 'delete_state',
            'state_name': 'New state 4'
        }, {
            'cmd': 'add_state',
            'state_name': 'New state',
        }, {
            'cmd': 'rename_state',
            'old_state_name': 'New state',
            'new_state_name': 'New state 4'
        }]
        stats_services.handle_stats_creation_for_new_exp_version(
            exploration.id, exploration.version, exploration.states,
            change_list)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(exploration_stats.exp_version, 7)
        self.assertEqual(
            set(exploration_stats.state_stats_mapping.keys()),
            set(['Home', 'New state 4', 'Renamed state', 'End']))

        # Test the values of the stats carried over from the last version.
        self.assertEqual(exploration_stats.num_actual_starts_v2, 5)
        self.assertEqual(exploration_stats.num_completions_v2, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping['Home'].total_hit_count_v2, 8)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'Renamed state'].first_hit_count_v2, 2)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'End'].useful_feedback_count_v2, 4)
        # State 'New state 4' has been deleted and recreated, so it should
        # now contain default values for stats instead of the values it
        # contained in the last version.
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                'New state 4'].total_answers_count_v2, 0)

    def test_get_exp_issues_from_model(self):
        """Test the get_exp_issues_from_model method."""
        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        exp_issues = stats_services.get_exp_issues_from_model(model)
        self.assertEqual(exp_issues.exp_id, self.exp_id)
        self.assertEqual(exp_issues.exp_version, 1)
        self.assertEqual(exp_issues.unresolved_issues, [])

    def test_get_exploration_stats_from_model(self):
        """Test the get_exploration_stats_from_model method."""
        model = stats_models.ExplorationStatsModel.get(self.stats_model_id)
        exploration_stats = stats_services.get_exploration_stats_from_model(
            model)
        self.assertEqual(exploration_stats.exp_id, 'exp_id1')
        self.assertEqual(exploration_stats.exp_version, 1)
        self.assertEqual(exploration_stats.num_starts_v1, 0)
        self.assertEqual(exploration_stats.num_starts_v2, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v1, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 0)
        self.assertEqual(exploration_stats.num_completions_v1, 0)
        self.assertEqual(exploration_stats.num_completions_v2, 0)
        self.assertEqual(exploration_stats.state_stats_mapping, {})

    def test_get_exploration_stats_by_id(self):
        """Test the get_exploration_stats_by_id method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        self.assertEqual(exploration_stats.exp_id, 'exp_id1')
        self.assertEqual(exploration_stats.exp_version, 1)
        self.assertEqual(exploration_stats.num_starts_v1, 0)
        self.assertEqual(exploration_stats.num_starts_v2, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v1, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 0)
        self.assertEqual(exploration_stats.num_completions_v1, 0)
        self.assertEqual(exploration_stats.num_completions_v2, 0)
        self.assertEqual(exploration_stats.state_stats_mapping, {})

    def test_create_stats_model(self):
        """Test the create_stats_model method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        exploration_stats.exp_version += 1
        model_id = stats_services.create_stats_model(exploration_stats)
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version + 1)
        self.assertEqual(exploration_stats.exp_id, 'exp_id1')
        self.assertEqual(exploration_stats.exp_version, 2)
        self.assertEqual(exploration_stats.num_starts_v1, 0)
        self.assertEqual(exploration_stats.num_starts_v2, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v1, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 0)
        self.assertEqual(exploration_stats.num_completions_v1, 0)
        self.assertEqual(exploration_stats.num_completions_v2, 0)
        self.assertEqual(exploration_stats.state_stats_mapping, {})

        # Test create method with different state_stats_mapping.
        exploration_stats.state_stats_mapping = {
            'Home': stats_domain.StateStats.create_default()
        }
        exploration_stats.exp_version += 1
        model_id = stats_services.create_stats_model(exploration_stats)
        model = stats_models.ExplorationStatsModel.get(model_id)
        self.assertEqual(model.exp_id, 'exp_id1')
        self.assertEqual(model.exp_version, 3)
        self.assertEqual(exploration_stats.num_starts_v1, 0)
        self.assertEqual(exploration_stats.num_starts_v2, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v1, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 0)
        self.assertEqual(exploration_stats.num_completions_v1, 0)
        self.assertEqual(exploration_stats.num_completions_v2, 0)
        self.assertEqual(
            model.state_stats_mapping, {
                'Home': {
                    'total_answers_count_v1': 0,
                    'total_answers_count_v2': 0,
                    'useful_feedback_count_v1': 0,
                    'useful_feedback_count_v2': 0,
                    'total_hit_count_v1': 0,
                    'total_hit_count_v2': 0,
                    'first_hit_count_v1': 0,
                    'first_hit_count_v2': 0,
                    'num_times_solution_viewed_v2': 0,
                    'num_completions_v1': 0,
                    'num_completions_v2': 0
                }
            })

    def test_save_exp_issues_model_transactional(self):
        """Test the save_exp_issues_model_transactional method."""
        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        exp_issues = stats_services.get_exp_issues_from_model(model)
        exp_issues.unresolved_issues.append(
            stats_domain.ExplorationIssue.from_dict({
                'issue_type': 'EarlyQuit',
                'issue_customization_args': {
                    'state_name': {
                        'value': 'state_name1'
                    },
                    'time_spent_in_exp_in_msecs': {
                        'value': 200
                    }
                },
                'playthrough_ids': ['playthrough_id1'],
                'schema_version': 1,
                'is_valid': True
            }))
        stats_services.save_exp_issues_model_transactional(exp_issues)

        model = stats_models.ExplorationIssuesModel.get_model(self.exp_id, 1)
        self.assertEqual(
            model.unresolved_issues[0],
            exp_issues.unresolved_issues[0].to_dict())

    def test_save_stats_model_transactional(self):
        """Test the save_stats_model_transactional method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        exploration_stats.num_starts_v2 += 15
        exploration_stats.num_actual_starts_v2 += 5
        exploration_stats.num_completions_v2 += 2
        stats_services.save_stats_model_transactional(exploration_stats)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        self.assertEqual(exploration_stats.num_starts_v2, 15)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 5)
        self.assertEqual(exploration_stats.num_completions_v2, 2)

    def test_get_exploration_stats_multi(self):
        """Test the get_exploration_stats_multi method."""
        stats_models.ExplorationStatsModel.create(
            'exp_id2', 2, 10, 0, 0, 0, 0, 0, {})
        exp_version_references = [
            exp_domain.ExpVersionReference(self.exp_id, self.exp_version),
            exp_domain.ExpVersionReference('exp_id2', 2)]

        exp_stats_list = stats_services.get_exploration_stats_multi(
            exp_version_references)
        self.assertEqual(len(exp_stats_list), 2)
        self.assertEqual(exp_stats_list[0].exp_id, self.exp_id)
        self.assertEqual(exp_stats_list[0].exp_version, self.exp_version)
        self.assertEqual(exp_stats_list[1].exp_id, 'exp_id2')
        self.assertEqual(exp_stats_list[1].exp_version, 2)


class ModifiedInteractionAnswerSummariesAggregator(
        stats_jobs_continuous.InteractionAnswerSummariesAggregator):
    """A modified InteractionAnswerSummariesAggregator that does not start
    a new batch job when the previous one has finished.
    """
    @classmethod
    def _get_batch_job_manager_class(cls):
        return ModifiedInteractionAnswerSummariesMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class ModifiedInteractionAnswerSummariesMRJobManager(
        stats_jobs_continuous.InteractionAnswerSummariesMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return ModifiedInteractionAnswerSummariesAggregator


class EventLogEntryTests(test_utils.GenericTestBase):
    """Test for the event log creation."""

    def test_create_events(self):
        """Basic test that makes sure there are no exceptions thrown."""
        event_services.StartExplorationEventHandler.record(
            'eid', 2, 'state', 'session', {}, feconf.PLAY_TYPE_NORMAL)
        event_services.MaybeLeaveExplorationEventHandler.record(
            'eid', 2, 'state', 'session', 27.2, {}, feconf.PLAY_TYPE_NORMAL)


class AnswerEventTests(test_utils.GenericTestBase):
    """Test recording new answer operations through events."""

    SESSION_ID = 'SESSION_ID'
    TIME_SPENT = 5.0
    PARAMS = {}

    def test_record_answer(self):
        self.save_new_default_exploration('eid', 'fake@user.com')
        exp = exp_services.get_exploration_by_id('eid')

        first_state_name = exp.init_state_name
        second_state_name = 'State 2'
        third_state_name = 'State 3'
        exp_services.update_exploration('fake@user.com', 'eid', [{
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': first_state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput',
        }, {
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': second_state_name,
        }, {
            'cmd': exp_domain.CMD_ADD_STATE,
            'state_name': third_state_name,
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': second_state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'TextInput',
        }, {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'state_name': third_state_name,
            'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
            'new_value': 'Continue',
        }], 'Add new state')
        exp = exp_services.get_exploration_by_id('eid')

        exp_version = exp.version

        for state_name in [first_state_name, second_state_name]:
            state_answers = stats_services.get_state_answers(
                'eid', exp_version, state_name)
            self.assertEqual(state_answers, None)

        # answer is a string.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 0, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, 'answer1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 0, 1,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid2', self.TIME_SPENT,
            self.PARAMS, 'answer1')
        # answer is a dict.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 1, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, {'x': 1.0, 'y': 5.0})
        # answer is a number.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 2, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, 10)
        # answer is a list of dicts.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 3, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, [{'a': 'some', 'b': 'text'}, {'a': 1.0, 'c': 2.0}])
        # answer is a list.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, second_state_name, 'TextInput', 2, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid3', self.TIME_SPENT,
            self.PARAMS, [2, 4, 8])
        # answer is a unicode string.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, second_state_name, 'TextInput', 1, 1,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid4', self.TIME_SPENT,
            self.PARAMS, self.UNICODE_TEST_STRING)
        # answer is None (such as for Continue).
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, third_state_name, 'Continue', 1, 1,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid5', self.TIME_SPENT,
            self.PARAMS, None)

        expected_submitted_answer_list1 = [{
            'answer': 'answer1', 'time_spent_in_sec': 5.0,
            'answer_group_index': 0, 'rule_spec_index': 0,
            'classification_categorization': 'explicit', 'session_id': 'sid1',
            'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer': 'answer1', 'time_spent_in_sec': 5.0,
            'answer_group_index': 0, 'rule_spec_index': 1,
            'classification_categorization': 'explicit', 'session_id': 'sid2',
            'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer': {'x': 1.0, 'y': 5.0}, 'time_spent_in_sec': 5.0,
            'answer_group_index': 1, 'rule_spec_index': 0,
            'classification_categorization': 'explicit', 'session_id': 'sid1',
            'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer': 10, 'time_spent_in_sec': 5.0, 'answer_group_index': 2,
            'rule_spec_index': 0, 'classification_categorization': 'explicit',
            'session_id': 'sid1', 'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer': [{'a': 'some', 'b': 'text'}, {'a': 1.0, 'c': 2.0}],
            'time_spent_in_sec': 5.0, 'answer_group_index': 3,
            'rule_spec_index': 0, 'classification_categorization': 'explicit',
            'session_id': 'sid1', 'interaction_id': 'TextInput', 'params': {}
        }]
        expected_submitted_answer_list2 = [{
            'answer': [2, 4, 8], 'time_spent_in_sec': 5.0,
            'answer_group_index': 2, 'rule_spec_index': 0,
            'classification_categorization': 'explicit', 'session_id': 'sid3',
            'interaction_id': 'TextInput', 'params': {}
        }, {
            'answer': self.UNICODE_TEST_STRING, 'time_spent_in_sec': 5.0,
            'answer_group_index': 1, 'rule_spec_index': 1,
            'classification_categorization': 'explicit', 'session_id': 'sid4',
            'interaction_id': 'TextInput', 'params': {}
        }]
        expected_submitted_answer_list3 = [{
            'answer': None, 'time_spent_in_sec': 5.0, 'answer_group_index': 1,
            'rule_spec_index': 1, 'classification_categorization': 'explicit',
            'session_id': 'sid5', 'interaction_id': 'Continue', 'params': {}
        }]

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, first_state_name)
        self.assertEqual(
            state_answers.get_submitted_answer_dict_list(),
            expected_submitted_answer_list1)

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, second_state_name)
        self.assertEqual(
            state_answers.get_submitted_answer_dict_list(),
            expected_submitted_answer_list2)

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, third_state_name)
        self.assertEqual(
            state_answers.get_submitted_answer_dict_list(),
            expected_submitted_answer_list3)


class RecordAnswerTests(test_utils.GenericTestBase):
    """Tests for functionality related to recording and retrieving answers."""

    EXP_ID = 'exp_id0'

    def setUp(self):
        super(RecordAnswerTests, self).setUp()
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')

    def test_record_answer_without_retrieving_it_first(self):
        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                'first answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, {},
                'a_session_id_val', 1.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'first answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {}
        }])

    def test_record_and_retrieve_single_answer(self):
        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertIsNone(state_answers)

        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                'some text', 'TextInput', 0,
                1, exp_domain.EXPLICIT_CLASSIFICATION, {},
                'a_session_id_val', 10.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 1)
        self.assertEqual(
            state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(state_answers.interaction_id, 'TextInput')
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'some text',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {}
        }])

    def test_record_and_retrieve_single_answer_with_preexisting_entry(self):
        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                'first answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, {},
                'a_session_id_val', 1.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'first answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {}
        }])

        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                'some text', 'TextInput', 0,
                1, exp_domain.EXPLICIT_CLASSIFICATION, {},
                'a_session_id_val', 10.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 1)
        self.assertEqual(
            state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(state_answers.interaction_id, 'TextInput')
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'first answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {}
        }, {
            'answer': 'some text',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {}
        }])

    def test_record_many_answers(self):
        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertIsNone(state_answers)

        submitted_answer_list = [
            stats_domain.SubmittedAnswer(
                'answer a', 'TextInput', 0, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 10.0),
            stats_domain.SubmittedAnswer(
                'answer ccc', 'TextInput', 1, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 3.0),
            stats_domain.SubmittedAnswer(
                'answer bbbbb', 'TextInput', 1, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 7.5),
        ]
        stats_services.record_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            submitted_answer_list)

        # The order of the answers returned depends on the size of the answers.
        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 1)
        self.assertEqual(
            state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(state_answers.interaction_id, 'TextInput')
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'answer a',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {}
        }, {
            'answer': 'answer ccc',
            'time_spent_in_sec': 3.0,
            'answer_group_index': 1,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {}
        }, {
            'answer': 'answer bbbbb',
            'time_spent_in_sec': 7.5,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {}
        }])

    def test_record_answers_exceeding_one_shard(self):
        # Use a smaller max answer list size so less answers are needed to
        # exceed a shard.
        with self.swap(
            stats_models.StateAnswersModel, '_MAX_ANSWER_LIST_BYTE_SIZE',
            100000):
            state_answers = stats_services.get_state_answers(
                self.EXP_ID, self.exploration.version,
                self.exploration.init_state_name)
            self.assertIsNone(state_answers)

            submitted_answer_list = [
                stats_domain.SubmittedAnswer(
                    'answer a', 'TextInput', 0, 1,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v',
                    10.0),
                stats_domain.SubmittedAnswer(
                    'answer ccc', 'TextInput', 1, 1,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v',
                    3.0),
                stats_domain.SubmittedAnswer(
                    'answer bbbbb', 'TextInput', 1, 0,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v',
                    7.5),
            ]
            stats_services.record_answers(
                self.EXP_ID, self.exploration.version,
                self.exploration.init_state_name, 'TextInput',
                submitted_answer_list * 200)

            # Verify that more than 1 shard was stored. The index shard
            # (shard_id 0) is not included in the shard count.
            master_model = stats_models.StateAnswersModel.get_master_model(
                self.exploration.id, self.exploration.version,
                self.exploration.init_state_name)
            self.assertGreater(master_model.shard_count, 0)

            # The order of the answers returned depends on the size of the
            # answers.
            state_answers = stats_services.get_state_answers(
                self.EXP_ID, self.exploration.version,
                self.exploration.init_state_name)
            self.assertEqual(state_answers.exploration_id, 'exp_id0')
            self.assertEqual(state_answers.exploration_version, 1)
            self.assertEqual(
                state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
            self.assertEqual(state_answers.interaction_id, 'TextInput')
            self.assertEqual(
                len(state_answers.get_submitted_answer_dict_list()), 600)

    def test_record_many_answers_with_preexisting_entry(self):
        stats_services.record_answer(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            stats_domain.SubmittedAnswer(
                '1 answer', 'TextInput', 0,
                0, exp_domain.EXPLICIT_CLASSIFICATION, {},
                'a_session_id_val', 1.0))

        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': '1 answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {}
        }])

        submitted_answer_list = [
            stats_domain.SubmittedAnswer(
                'answer aaa', 'TextInput', 0, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 10.0),
            stats_domain.SubmittedAnswer(
                'answer ccccc', 'TextInput', 1, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 3.0),
            stats_domain.SubmittedAnswer(
                'answer bbbbbbb', 'TextInput', 1, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 7.5),
        ]
        stats_services.record_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            submitted_answer_list)

        # The order of the answers returned depends on the size of the answers.
        state_answers = stats_services.get_state_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(state_answers.exploration_id, 'exp_id0')
        self.assertEqual(state_answers.exploration_version, 1)
        self.assertEqual(
            state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
        self.assertEqual(state_answers.interaction_id, 'TextInput')
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': '1 answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {}
        }, {
            'answer': 'answer aaa',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {}
        }, {
            'answer': 'answer ccccc',
            'time_spent_in_sec': 3.0,
            'answer_group_index': 1,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {}
        }, {
            'answer': 'answer bbbbbbb',
            'time_spent_in_sec': 7.5,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {}
        }])


class SampleAnswerTests(test_utils.GenericTestBase):
    """Tests for functionality related to retrieving sample answers."""

    EXP_ID = 'exp_id0'

    def setUp(self):
        super(SampleAnswerTests, self).setUp()
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')

    def test_at_most_100_answers_returned_even_if_there_are_lots(self):
        submitted_answer_list = [
            stats_domain.SubmittedAnswer(
                'answer a', 'TextInput', 0, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 10.0),
            stats_domain.SubmittedAnswer(
                'answer ccc', 'TextInput', 1, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 3.0),
            stats_domain.SubmittedAnswer(
                'answer bbbbb', 'TextInput', 1, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 7.5),
        ]
        # Record 600 answers.
        stats_services.record_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            submitted_answer_list * 200)

        sample_answers = stats_services.get_sample_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(len(sample_answers), 100)

    def test_exactly_100_answers_returned_if_main_shard_has_100_answers(self):
        submitted_answer_list = [
            stats_domain.SubmittedAnswer(
                'answer a', 'TextInput', 0, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 10.0)
        ]
        # Record 100 answers.
        stats_services.record_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            submitted_answer_list * 100)

        sample_answers = stats_services.get_sample_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(sample_answers, ['answer a'] * 100)

    def test_all_answers_returned_if_main_shard_has_few_answers(self):
        submitted_answer_list = [
            stats_domain.SubmittedAnswer(
                'answer a', 'TextInput', 0, 1,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 10.0),
            stats_domain.SubmittedAnswer(
                'answer bbbbb', 'TextInput', 1, 0,
                exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v', 7.5),
        ]
        # Record 2 answers.
        stats_services.record_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name, 'TextInput',
            submitted_answer_list)

        sample_answers = stats_services.get_sample_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertEqual(sample_answers, ['answer a', 'answer bbbbb'])

    def test_only_sample_answers_in_main_shard_returned(self):
        # Use a smaller max answer list size so fewer answers are needed to
        # exceed a shard.
        with self.swap(
            stats_models.StateAnswersModel, '_MAX_ANSWER_LIST_BYTE_SIZE',
            15000):
            state_answers = stats_services.get_state_answers(
                self.EXP_ID, self.exploration.version,
                self.exploration.init_state_name)
            self.assertIsNone(state_answers)

            submitted_answer_list = [
                stats_domain.SubmittedAnswer(
                    'answer ccc', 'TextInput', 1, 1,
                    exp_domain.EXPLICIT_CLASSIFICATION, {}, 'session_id_v',
                    3.0),
            ]
            stats_services.record_answers(
                self.EXP_ID, self.exploration.version,
                self.exploration.init_state_name, 'TextInput',
                submitted_answer_list * 100)

        # Verify more than 1 shard was stored. The index shard (shard_id 0)
        # is not included in the shard count. Since a total of 100 answers were
        # submitted, there must therefore be fewer than 100 answers in the
        # index shard.
        model = stats_models.StateAnswersModel.get('%s:%s:%s:%s' % (
            self.exploration.id, str(self.exploration.version),
            self.exploration.init_state_name, '0'))
        self.assertEqual(model.shard_count, 1)

        # Verify that the list of sample answers returned contains fewer than
        # 100 answers, although a total of 100 answers were submitted.
        sample_answers = stats_services.get_sample_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertLess(len(sample_answers), 100)


# TODO(bhenning): Either add tests for multiple visualizations for one state or
# disallow stats from having multiple visualizations (no interactions currently
# seem to use more than one visualization ID).

# TODO(bhenning): Add tests for each possible visualization
# (TopAnswersByCategorization is not currently used yet by any interactions).
class AnswerVisualizationsTests(test_utils.GenericTestBase):
    """Tests for functionality related to retrieving visualization information
    for answers.
    """
    ALL_CC_MANAGERS_FOR_TESTS = [ModifiedInteractionAnswerSummariesAggregator]
    INIT_STATE_NAME = feconf.DEFAULT_INIT_STATE_NAME
    TEXT_INPUT_EXP_ID = 'exp_id0'
    SET_INPUT_EXP_ID = 'exp_id1'
    DEFAULT_EXP_ID = 'exp_id2'
    NEW_STATE_NAME = 'new state'

    def _get_swap_context(self):
        return self.swap(
            jobs_registry, 'ALL_CONTINUOUS_COMPUTATION_MANAGERS',
            self.ALL_CC_MANAGERS_FOR_TESTS)

    def _get_visualizations(
            self, exp_id=TEXT_INPUT_EXP_ID, state_name=INIT_STATE_NAME):
        exploration = exp_services.get_exploration_by_id(exp_id)
        init_state = exploration.states[state_name]
        return stats_services.get_visualizations_info(
            exp_id, state_name, init_state.interaction.id)

    def _record_answer(
            self, answer, exp_id=TEXT_INPUT_EXP_ID, state_name=INIT_STATE_NAME):
        exploration = exp_services.get_exploration_by_id(exp_id)
        interaction_id = exploration.states[state_name].interaction.id
        event_services.AnswerSubmissionEventHandler.record(
            exp_id, exploration.version, state_name, interaction_id, 0, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', 10.0, {}, answer)

    def _run_answer_summaries_aggregator(self):
        ModifiedInteractionAnswerSummariesAggregator.start_computation()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)

    def _rerun_answer_summaries_aggregator(self):
        ModifiedInteractionAnswerSummariesAggregator.stop_computation('a')
        self._run_answer_summaries_aggregator()

    def _rename_state(
            self, new_state_name, exp_id=TEXT_INPUT_EXP_ID,
            state_name=INIT_STATE_NAME):
        exp_services.update_exploration(
            self.owner_id, exp_id, [{
                'cmd': exp_domain.CMD_RENAME_STATE,
                'old_state_name': state_name,
                'new_state_name': new_state_name
            }], 'Update state name')

    def _change_state_interaction_id(
            self, interaction_id, exp_id=TEXT_INPUT_EXP_ID,
            state_name=INIT_STATE_NAME):
        exp_services.update_exploration(
            self.owner_id, exp_id, [{
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': state_name,
                'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                'new_value': interaction_id
            }], 'Update state interaction ID')

    def _change_state_content(
            self, new_content, exp_id=TEXT_INPUT_EXP_ID,
            state_name=INIT_STATE_NAME):
        exp_services.update_exploration(
            self.owner_id, exp_id, [{
                'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                'state_name': state_name,
                'property_name': exp_domain.STATE_PROPERTY_CONTENT,
                'new_value': {
                    'html': new_content,
                    'audio_translations': {},
                }
            }], 'Change content description')

    def setUp(self):
        super(AnswerVisualizationsTests, self).setUp()
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.save_new_valid_exploration(
            self.TEXT_INPUT_EXP_ID, self.owner_id, end_state_name='End')
        self.save_new_valid_exploration(
            self.SET_INPUT_EXP_ID, self.owner_id, end_state_name='End',
            interaction_id='SetInput')
        self.save_new_default_exploration(self.DEFAULT_EXP_ID, self.owner_id)

    def test_no_vis_info_for_exp_with_no_interaction_id(self):
        with self._get_swap_context():
            visualizations = self._get_visualizations(
                exp_id=self.DEFAULT_EXP_ID)
            self.assertEqual(visualizations, [])

    def test_no_vis_info_for_exp_with_no_answers_no_calculations(self):
        with self._get_swap_context():
            visualizations = self._get_visualizations()
            self.assertEqual(visualizations, [])

    def test_no_vis_info_for_exp_with_answer_no_completed_calculations(self):
        with self._get_swap_context():
            self._record_answer('Answer A')
            visualizations = self._get_visualizations()
            self.assertEqual(visualizations, [])

    def test_no_vis_info_for_exp_with_no_answers_but_with_calculations(self):
        with self._get_swap_context():
            self._run_answer_summaries_aggregator()
            visualizations = self._get_visualizations()
            self.assertEqual(visualizations, [])

    def test_has_vis_info_options_for_text_input_interaction(self):
        with self._get_swap_context():
            self._record_answer('Answer A')
            self._run_answer_summaries_aggregator()
            visualizations = self._get_visualizations()
            # There are two visualizations for TextInput. One for top answers
            # and second is for top unresolved answers but top unresolved
            # answers visualization is not shown as part of exploration stats.
            self.assertEqual(len(visualizations), 1)

            visualization = visualizations[0]
            self.assertEqual(
                visualization['options']['column_headers'], ['Answer', 'Count'])
            self.assertIn('Top', visualization['options']['title'])

    def test_has_vis_info_for_exp_with_answer_for_one_calculation(self):
        with self._get_swap_context():
            self._record_answer('Answer A')
            self._run_answer_summaries_aggregator()
            visualizations = self._get_visualizations()

            # There are two visualizations for TextInput. One for top answers
            # and second is for top unresolved answers but top unresolved
            # answers visualization is not shown as part of exploration stats.
            self.assertEqual(len(visualizations), 1)

            visualization = visualizations[0]
            self.assertEqual(visualization['id'], 'FrequencyTable')
            self.assertEqual(
                visualization['data'], [{
                    'answer': 'Answer A',
                    'frequency': 1
                }])

    def test_has_vis_info_for_exp_with_many_answers_for_one_calculation(self):
        with self._get_swap_context():
            self._record_answer('Answer A')
            self._record_answer('Answer A')
            self._record_answer('Answer C')
            self._record_answer('Answer B')
            self._record_answer('Answer A')
            self._run_answer_summaries_aggregator()
            visualizations = self._get_visualizations()
            # There are two visualizations for TextInput. One for top answers
            # and second is for top unresolved answers but top unresolved
            # answers visualization is not shown as part of exploration stats.
            self.assertEqual(len(visualizations), 1)

            visualization = visualizations[0]
            self.assertEqual(visualization['id'], 'FrequencyTable')
            # Ties will appear in same order they are submitted in.
            self.assertEqual(
                visualization['data'], [{
                    'answer': 'Answer A',
                    'frequency': 3
                }, {
                    'answer': 'Answer C',
                    'frequency': 1
                }, {
                    'answer': 'Answer B',
                    'frequency': 1
                }])

    def test_has_vis_info_for_each_calculation_for_multi_calc_exp(self):
        with self._get_swap_context():
            self._record_answer(['A', 'B'], exp_id=self.SET_INPUT_EXP_ID)
            self._record_answer(['C', 'A'], exp_id=self.SET_INPUT_EXP_ID)
            self._record_answer(['A', 'B'], exp_id=self.SET_INPUT_EXP_ID)
            self._record_answer(['A'], exp_id=self.SET_INPUT_EXP_ID)
            self._record_answer(['A'], exp_id=self.SET_INPUT_EXP_ID)
            self._record_answer(['A', 'B'], exp_id=self.SET_INPUT_EXP_ID)
            self._run_answer_summaries_aggregator()
            visualizations = sorted(
                self._get_visualizations(exp_id=self.SET_INPUT_EXP_ID),
                key=operator.itemgetter('data'))
            self.assertEqual(len(visualizations), 1)

            # Use options to distinguish between the two visualizations, since
            # both are FrequencyTable.
            top_answers_visualization = visualizations[0]
            self.assertEqual(top_answers_visualization['id'], 'FrequencyTable')
            self.assertEqual(
                top_answers_visualization['options']['column_headers'],
                ['Answer', 'Count'])
            self.assertEqual(
                top_answers_visualization['data'], [{
                    'answer': ['A', 'B'],
                    'frequency': 3
                }, {
                    'answer': ['A'],
                    'frequency': 2
                }, {
                    'answer': ['C', 'A'],
                    'frequency': 1
                }])

            common_elements_visualization = visualizations[1]
            self.assertEqual(
                common_elements_visualization['id'], 'FrequencyTable')
            self.assertEqual(
                common_elements_visualization['options']['column_headers'],
                ['Element', 'Count'])

            common_visualization_data = (
                common_elements_visualization['data'])
            self.assertEqual(
                common_visualization_data, [{
                    'answer': 'A',
                    'frequency': 6
                }, {
                    'answer': 'B',
                    'frequency': 3
                }, {
                    'answer': 'C',
                    'frequency': 1
                }])

    def test_retrieves_latest_vis_info_with_rounds_of_calculations(self):
        with self._get_swap_context():
            self._record_answer('Answer A')
            self._record_answer('Answer C')
            self._run_answer_summaries_aggregator()

            # Submit a new answer and run the aggregator again.
            self._record_answer('Answer A')
            self._rerun_answer_summaries_aggregator()
            visualizations = self._get_visualizations()
            # There are two visualizations for TextInput. One for top answers
            # and second is for top unresolved answers but top unresolved
            # answers visualization is not shown as part of exploration stats.
            self.assertEqual(len(visualizations), 1)

            visualization = visualizations[0]
            # The latest data should include all submitted answers.
            self.assertEqual(
                visualization['data'], [{
                    'answer': 'Answer A',
                    'frequency': 2
                }, {
                    'answer': 'Answer C',
                    'frequency': 1
                }])

    def test_retrieves_vis_info_across_multiple_exploration_versions(self):
        with self._get_swap_context():
            self._record_answer('Answer A')
            self._record_answer('Answer B')

            # Change the exploration version and submit a new answer.
            self._change_state_content('New content')
            self._record_answer('Answer A')

            self._run_answer_summaries_aggregator()
            visualizations = self._get_visualizations()
            # There are two visualizations for TextInput. One for top answers
            # and second is for top unresolved answers but top unresolved
            # answers visualization is not shown as part of exploration stats.
            self.assertEqual(len(visualizations), 1)

            visualization = visualizations[0]
            # The latest data should include all submitted answers.
            self.assertEqual(
                visualization['data'], [{
                    'answer': 'Answer A',
                    'frequency': 2
                }, {
                    'answer': 'Answer B',
                    'frequency': 1
                }])

    def test_no_vis_info_for_exp_with_new_state_name_before_calculations(self):
        with self._get_swap_context():
            self._record_answer('Answer A')
            self._rename_state(self.NEW_STATE_NAME)
            self._run_answer_summaries_aggregator()

            visualizations = self._get_visualizations(
                state_name=self.NEW_STATE_NAME)

            self.assertEqual(visualizations, [])

    def test_no_vis_info_for_exp_with_new_state_name_after_calculations(self):
        with self._get_swap_context():
            self._record_answer('Answer A')
            self._run_answer_summaries_aggregator()
            self._rename_state(self.NEW_STATE_NAME)

            visualizations = self._get_visualizations(
                state_name=self.NEW_STATE_NAME)

            self.assertEqual(visualizations, [])

    def test_no_vis_info_for_exp_with_new_interaction_before_calculations(self):
        with self._get_swap_context():
            self._record_answer('Answer A')
            self._change_state_interaction_id('SetInput')
            self._run_answer_summaries_aggregator()

            visualizations = self._get_visualizations()

            self.assertEqual(visualizations, [])

    def test_no_vis_info_for_exp_with_new_interaction_after_calculations(self):
        with self._get_swap_context():
            self._record_answer('Answer A')
            self._run_answer_summaries_aggregator()
            self._change_state_interaction_id('SetInput')

            visualizations = self._get_visualizations()

            self.assertEqual(visualizations, [])


class StateAnswersStatisticsTest(test_utils.GenericTestBase):
    """Tests for functionality related to retrieving statistics for answers of a
    particular state.
    """
    STATE_NAMES = ['STATE A', 'STATE B', 'STATE C']
    EXP_ID = 'exp_id'

    def _get_top_state_answer_stats(
            self, exp_id=EXP_ID, state_name=STATE_NAMES[0]):
        return stats_services.get_top_state_answer_stats(exp_id, state_name)

    def _get_top_state_unresolved_answer_stats(
            self, exp_id=EXP_ID, state_name=STATE_NAMES[0]):
        return stats_services.get_top_state_unresolved_answers(
            exp_id, state_name)

    def _get_top_state_answer_stats_multi(
            self, exp_id=EXP_ID, state_names=None):
        if not state_names:
            raise ValueError('Must provide non-empty state names.')
        return stats_services.get_top_state_answer_stats_multi(
            exp_id, state_names)

    def _record_answer(
            self, answer, exp_id=EXP_ID, state_name=STATE_NAMES[0],
            classification_category=exp_domain.EXPLICIT_CLASSIFICATION):
        exploration = exp_services.get_exploration_by_id(exp_id)
        interaction_id = exploration.states[state_name].interaction.id
        event_services.AnswerSubmissionEventHandler.record(
            exp_id, exploration.version, state_name, interaction_id, 0, 0,
            classification_category, 'sid1', 10.0, {}, answer)

    def _run_answer_summaries_aggregator(self):
        ModifiedInteractionAnswerSummariesAggregator.start_computation()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)
        ModifiedInteractionAnswerSummariesAggregator.stop_computation(
            feconf.SYSTEM_COMMITTER_ID)

    def setUp(self):
        super(StateAnswersStatisticsTest, self).setUp()
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        user_services.create_new_user(self.owner_id, self.OWNER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.save_new_linear_exp_with_state_names_and_interactions(
            self.EXP_ID, self.owner_id, self.STATE_NAMES, ['TextInput'])

    def test_get_top_state_unresolved_answer_stats(self):
        self._record_answer(
            'A', classification_category=exp_domain.EXPLICIT_CLASSIFICATION)
        self._record_answer(
            'B', classification_category=exp_domain.EXPLICIT_CLASSIFICATION)
        self._record_answer(
            'C', classification_category=exp_domain.STATISTICAL_CLASSIFICATION)
        self._record_answer(
            'A', classification_category=exp_domain.STATISTICAL_CLASSIFICATION)
        self._record_answer(
            'D',
            classification_category=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
        self._record_answer(
            'E',
            classification_category=exp_domain.DEFAULT_OUTCOME_CLASSIFICATION)
        self._record_answer(
            'D', classification_category=exp_domain.EXPLICIT_CLASSIFICATION)
        self._run_answer_summaries_aggregator()

        with self.swap(feconf, 'STATE_ANSWER_STATS_MIN_FREQUENCY', 1):
            state_answers_stats = self._get_top_state_unresolved_answer_stats()

        self.assertEqual(
            state_answers_stats, [
                {'answer': 'A', 'frequency': 2},
                {'answer': 'C', 'frequency': 1},
                {'answer': 'E', 'frequency': 1}
            ])

        self._record_answer(
            'A', classification_category=exp_domain.EXPLICIT_CLASSIFICATION)
        self._record_answer(
            'E', classification_category=exp_domain.EXPLICIT_CLASSIFICATION)
        self._run_answer_summaries_aggregator()

        with self.swap(feconf, 'STATE_ANSWER_STATS_MIN_FREQUENCY', 1):
            state_answers_stats = self._get_top_state_unresolved_answer_stats()

        self.assertEqual(
            state_answers_stats, [
                {'answer': 'C', 'frequency': 1}
            ])

    def test_get_top_state_answer_stats(self):
        self._record_answer('A')
        self._record_answer('B')
        self._record_answer('A')
        self._record_answer('A')
        self._record_answer('B')
        self._record_answer('C')
        self._run_answer_summaries_aggregator()

        with self.swap(feconf, 'STATE_ANSWER_STATS_MIN_FREQUENCY', 2):
            state_answers_stats = self._get_top_state_answer_stats()

        self.assertEqual(
            state_answers_stats, [
                {'answer': 'A', 'frequency': 3},
                {'answer': 'B', 'frequency': 2},
                # C is not included because min frequency is 2.
            ])

    def test_get_top_state_answer_stats_multi(self):
        self._record_answer('A', state_name='STATE A')
        self._record_answer('A', state_name='STATE A')
        self._record_answer('B', state_name='STATE A')
        self._record_answer(1, state_name='STATE B')
        self._record_answer(1, state_name='STATE B')
        self._record_answer(2, state_name='STATE B')
        self._record_answer('X', state_name='STATE C')
        self._record_answer('X', state_name='STATE C')
        self._record_answer('Y', state_name='STATE C')
        self._run_answer_summaries_aggregator()

        with self.swap(feconf, 'STATE_ANSWER_STATS_MIN_FREQUENCY', 1):
            state_answers_stats_multi = self._get_top_state_answer_stats_multi(
                state_names=['STATE A', 'STATE B'])

        self.assertEqual(sorted(state_answers_stats_multi), [
            'STATE A',
            'STATE B',
        ])
        self.assertEqual(state_answers_stats_multi['STATE A'], [
            {'answer': 'A', 'frequency': 2},
            {'answer': 'B', 'frequency': 1},
        ])
        self.assertEqual(state_answers_stats_multi['STATE B'], [
            {'answer': 1, 'frequency': 2},
            {'answer': 2, 'frequency': 1},
        ])
