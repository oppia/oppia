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

import os

from core.domain import exp_services
from core.domain import stats_domain
from core.domain import stats_services
from core.platform import models
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
            stats_models.ExplorationStatsModel.create('exp_id1', 1, 0, 0, {}))

    def test_calls_to_stats_methods(self):
        """Test that calls are being made to the
        handle_stats_creation_for_new_exp_version and
        handle_stats_creation_for_new_exploration methods when an exploration is
        created or updated.
        """
        # Create exploration object in datastore.
        exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.save_new_exploration_from_yaml_and_assets(
                feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
                assets_list)
        exploration = exp_services.get_exploration_by_id(exp_id)

        # Now, there are two analytics model in datastore (one from setup
        # function).
        all_models = stats_models.ExplorationStatsModel.get_all()
        self.assertEqual(all_models.count(), 2)
        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(
            exploration_stats.state_stats_mapping.keys(), ['Home', 'End'])

        # Update exploration by adding a state.
        change_list = [{
            'cmd': 'add_state',
            'state_name': 'New state'
        }]
        exploration.add_states(['New state'])
        exploration.version += 1
        exp_services.update_exploration(
            feconf.SYSTEM_COMMITTER_ID, exp_id, change_list, '')

        # Now, there should be three analytics models in datastore (one from
        # setup function).
        all_models = stats_models.ExplorationStatsModel.get_all()
        self.assertEqual(all_models.count(), 3)
        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(
            exploration_stats.state_stats_mapping.keys(), [
                'Home', 'End', 'New state'])

    def test_handle_stats_creation_for_new_exploration(self):
        """Test the handle_stats_creation_for_new_exploration method."""
        # Create exploration object in datastore.
        exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list = []
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
            exp_services.save_new_exploration_from_yaml_and_assets(
                feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
                assets_list)
        exploration = exp_services.get_exploration_by_id(exp_id)

        stats_services.handle_stats_creation_for_new_exploration(exploration)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
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
        with self.swap(feconf, 'ENABLE_ML_CLASSIFIERS', True):
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
            exploration, change_list)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(
            exploration_stats.state_stats_mapping.keys(), [
                'Home', 'End', 'New state 2', 'New state'])
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
            exploration, change_list)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(
            exploration_stats.state_stats_mapping.keys(), [
                'Home', 'Renamed state', 'End', 'New state'])

        # Test deletion of states.
        exploration.delete_state('New state')
        exploration.version += 1
        change_list = [{
            'cmd': 'delete_state',
            'state_name': 'New state'
        }]
        stats_services.handle_stats_creation_for_new_exp_version(
            exploration, change_list)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        self.assertEqual(
            exploration_stats.state_stats_mapping.keys(), [
                'Home', 'End', 'Renamed state'])

    def test_get_exploration_stats_from_model(self):
        """Test the get_exploration_stats_from_model method."""
        model = stats_models.ExplorationStatsModel.get(self.stats_model_id)
        exploration_stats = stats_services.get_exploration_stats_from_model(
            model)
        self.assertEqual(exploration_stats.exp_id, 'exp_id1')
        self.assertEqual(exploration_stats.exp_version, 1)
        self.assertEqual(exploration_stats.num_actual_starts, 0)
        self.assertEqual(exploration_stats.num_completions, 0)
        self.assertEqual(exploration_stats.state_stats_mapping, {})

    def test_get_exploration_stats_by_id(self):
        """Test the get_exploration_stats_by_id method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        self.assertEqual(exploration_stats.exp_id, 'exp_id1')
        self.assertEqual(exploration_stats.exp_version, 1)
        self.assertEqual(exploration_stats.num_actual_starts, 0)
        self.assertEqual(exploration_stats.num_completions, 0)
        self.assertEqual(exploration_stats.state_stats_mapping, {})

    def test_create_stats_model(self):
        """Test the create_stats_model method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        exploration_stats.exp_version += 1
        model_id = stats_services.create_stats_model(exploration_stats)
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version+1)
        self.assertEqual(exploration_stats.exp_id, 'exp_id1')
        self.assertEqual(exploration_stats.exp_version, 2)
        self.assertEqual(exploration_stats.num_actual_starts, 0)
        self.assertEqual(exploration_stats.num_completions, 0)
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
        self.assertEqual(model.num_actual_starts, 0)
        self.assertEqual(model.num_completions, 0)
        self.assertEqual(
            model.state_stats_mapping, {
                'Home': {
                    'total_answers_count': 0,
                    'useful_feedback_count': 0,
                    'learners_answered_correctly': 0,
                    'total_hit_count': 0,
                    'first_hit_count': 0,
                    'total_solutions_triggered_count': 0
                }
            })
