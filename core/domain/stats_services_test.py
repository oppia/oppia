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

"""Unit tests for core.domain.stats_services."""

from __future__ import annotations

import os

from core import feconf
from core import utils
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import question_services
from core.domain import stats_domain
from core.domain import stats_services
from core.platform import models
from core.tests import test_utils

from typing import Dict, Final, List, Optional, Tuple, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import stats_models

(stats_models,) = models.Registry.import_models([models.Names.STATISTICS])
datastore_services = models.Registry.import_datastore_services()


class StatisticsServicesTests(test_utils.GenericTestBase):
    """Test the helper functions and methods defined in the stats_services
    module.
    """

    def setUp(self) -> None:
        super().setUp()
        self.exp_id = 'exp_id1'
        self.exp_version = 1
        self.stats_model_id = (
            stats_models.ExplorationStatsModel.create(
                'exp_id1', 1, 0, 0, 0, 0, 0, 0, {}))
        stats_models.ExplorationIssuesModel.create(
            self.exp_id, self.exp_version, [])
        self.playthrough_id = stats_models.PlaythroughModel.create(
            'exp_id1', 1, 'EarlyQuit', {}, [])
        self.save_new_valid_exploration(
            self.exp_id, 'admin', title='Title 1', end_state_name='End',
            correctness_feedback_enabled=True)

    def test_raises_error_if_playthrough_model_fetched_with_invalid_id_and_strict(  # pylint: disable=line-too-long
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception,
            'No PlaythroughModel exists for the playthrough_id: invalid_id'
        ):
            stats_services.get_playthrough_models_by_ids(
                ['invalid_id'], strict=True
            )

    def test_get_exploration_stats_with_new_exp_id(self) -> None:
        exploration_stats = stats_services.get_exploration_stats(
            'new_exp_id', 1)

        self.assertEqual(exploration_stats.exp_version, 1)
        self.assertEqual(exploration_stats.exp_id, 'new_exp_id')
        self.assertEqual(exploration_stats.state_stats_mapping, {})

    def test_update_stats_method(self) -> None:
        """Test the update_stats method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        exploration_stats.state_stats_mapping = {
            'Home': stats_domain.StateStats.create_default(),
            '🙂': stats_domain.StateStats.create_default(),
        }
        stats_services.save_stats_model(exploration_stats)

        # Pass in exploration start event to stats model created in setup
        # function.
        aggregated_stats: stats_domain.AggregatedStatsDict = {
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
                },
                '🙂': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                },
            }
        }

        stats_services.update_stats('exp_id1', 1, aggregated_stats)
        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
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
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                '🙂'].total_hit_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                '🙂'].first_hit_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                '🙂'].total_answers_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                '🙂'].useful_feedback_count_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                '🙂'].num_completions_v2, 1)
        self.assertEqual(
            exploration_stats.state_stats_mapping[
                '🙂'].num_times_solution_viewed_v2, 1)

    def test_update_stats_throws_if_exp_version_is_not_latest(self) -> None:
        """Test the update_stats method."""
        aggregated_stats: stats_domain.AggregatedStatsDict = {
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
                },
            }
        }

        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 2)
        self.assertEqual(exploration_stats, None)

        stats_services.update_stats('exp_id1', 2, aggregated_stats)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 2)
        self.assertEqual(exploration_stats, None)

    def test_update_stats_throws_if_stats_model_is_missing_entirely(
        self
    ) -> None:
        """Test the update_stats method."""
        aggregated_stats: stats_domain.AggregatedStatsDict = {
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
                },
            }
        }
        stats_model = stats_models.ExplorationStatsModel.get_model('exp_id1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert stats_model is not None
        stats_model.delete()
        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 1)
        self.assertEqual(exploration_stats, None)

        with self.assertRaisesRegex(
            Exception,
            'ExplorationStatsModel id="exp_id1.1" does not exist'
        ):
            stats_services.update_stats('exp_id1', 1, aggregated_stats)

    def test_update_stats_throws_if_model_is_missing_state_stats(self) -> None:
        """Test the update_stats method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        exploration_stats.state_stats_mapping = {
            'Home': stats_domain.StateStats.create_default()
        }
        stats_services.save_stats_model(exploration_stats)

        aggregated_stats: stats_domain.AggregatedStatsDict = {
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
                },
                'Away from Home': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                },
            }
        }

        with self.assertRaisesRegex(Exception, 'does not exist'):
            stats_services.update_stats('exp_id1', 1, aggregated_stats)

    def test_update_stats_returns_if_state_name_is_undefined(self) -> None:
        """Tests that the update_stats returns if a state name is undefined."""
        # Here we use MyPy ignore because AggregatedStatsDict can only accept
        # Dict[str, int] but for testing purpose here we are providing str for
        # one of the value which causes MyPy to throw an error. Thus to avoid
        # the error, we used ignore here.
        aggregated_stats: stats_domain.AggregatedStatsDict = {
            'num_starts': '1',  # type: ignore[typeddict-item]
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'undefined': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                },
            }
        }

        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        self.assertEqual(exploration_stats.state_stats_mapping, {
            'End': stats_domain.StateStats.create_default(),
            'Introduction': stats_domain.StateStats.create_default()
        })

        stats_services.update_stats('exp_id1', 1, aggregated_stats)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        self.assertEqual(exploration_stats.state_stats_mapping, {
            'End': stats_domain.StateStats.create_default(),
            'Introduction': stats_domain.StateStats.create_default()
        })

    def test_update_stats_returns_if_aggregated_stats_type_is_invalid(
        self
    ) -> None:
        """Tests that the update_stats returns if a state name is undefined."""
        aggregated_stats: stats_domain.AggregatedStatsDict = {
            'num_starts': 1,
            'num_actual_starts': 1,
            'num_completions': 1,
            'state_stats_mapping': {
                'undefined': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                },
            }
        }

        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        self.assertEqual(exploration_stats.state_stats_mapping, {
            'End': stats_domain.StateStats.create_default(),
            'Introduction': stats_domain.StateStats.create_default()
        })

        stats_services.update_stats('exp_id1', 1, aggregated_stats)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        self.assertEqual(exploration_stats.state_stats_mapping, {
            'End': stats_domain.StateStats.create_default(),
            'Introduction': stats_domain.StateStats.create_default()
        })

    def test_update_stats_throws_if_model_is_using_unicode_state_name(
        self
    ) -> None:
        """Test the update_stats method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            'exp_id1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        exploration_stats.state_stats_mapping = {
            'Home': stats_domain.StateStats.create_default(),
            # No stats for '🙂'.
        }
        stats_services.save_stats_model(exploration_stats)

        aggregated_stats: stats_domain.AggregatedStatsDict = {
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
                },
                '🙂': {
                    'total_hit_count': 1,
                    'first_hit_count': 1,
                    'total_answers_count': 1,
                    'useful_feedback_count': 1,
                    'num_times_solution_viewed': 1,
                    'num_completions': 1
                },
            }
        }

        with self.assertRaisesRegex(Exception, 'does not exist'):
            stats_services.update_stats('exp_id1', 1, aggregated_stats)

    def test_calls_to_stats_methods(self) -> None:
        """Test that calls are being made to the
        get_stats_for_new_exp_version and
        get_stats_for_new_exploration methods when an exploration is
        created or updated.
        """
        # Initialize call counters.
        stats_for_new_exploration_log = test_utils.CallCounter(
            stats_services.get_stats_for_new_exploration)
        stats_for_new_exp_version_log = test_utils.CallCounter(
            stats_services.get_stats_for_new_exp_version)

        # Create exploration object in datastore.
        exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
        with self.swap(
            stats_services, 'get_stats_for_new_exploration',
            stats_for_new_exploration_log):
            exp_services.save_new_exploration_from_yaml_and_assets(
                feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
                assets_list)

        # Now, the stats creation for new explorations method will be called
        # once and stats creation for new exploration version won't be called.
        self.assertEqual(stats_for_new_exploration_log.times_called, 1)
        self.assertEqual(stats_for_new_exp_version_log.times_called, 0)

        # Update exploration by adding a state.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state'
        })]
        with self.swap(
            stats_services, 'get_stats_for_new_exp_version',
            stats_for_new_exp_version_log):
            exp_services.update_exploration(
                feconf.SYSTEM_COMMITTER_ID, exp_id, change_list, '')

        # Now, the stats creation for new explorations method will be called
        # once and stats creation for new exploration version will also be
        # called once.
        self.assertEqual(stats_for_new_exploration_log.times_called, 1)
        self.assertEqual(stats_for_new_exp_version_log.times_called, 1)

    def test_get_stats_for_new_exploration(self) -> None:
        """Test the get_stats_for_new_exploration method."""
        # Create exploration object in datastore.
        exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
            assets_list)
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        exploration_stats_for_new_exploration = (
            stats_services.get_stats_for_new_exploration(
                exploration.id,
                exploration.version,
                list(exploration.states.keys())
            )
        )
        stats_services.create_stats_model(
            exploration_stats_for_new_exploration
        )

        newly_created_exploration_stats = (
            stats_services.get_exploration_stats_by_id(
                exploration.id, exploration.version
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert newly_created_exploration_stats is not None
        self.assertEqual(newly_created_exploration_stats.exp_id, exp_id)
        self.assertEqual(newly_created_exploration_stats.exp_version, 1)
        self.assertEqual(newly_created_exploration_stats.num_starts_v1, 0)
        self.assertEqual(newly_created_exploration_stats.num_starts_v2, 0)
        self.assertEqual(
            newly_created_exploration_stats.num_actual_starts_v1, 0
        )
        self.assertEqual(
            newly_created_exploration_stats.num_actual_starts_v2, 0
        )
        self.assertEqual(newly_created_exploration_stats.num_completions_v1, 0)
        self.assertEqual(newly_created_exploration_stats.num_completions_v2, 0)
        self.assertEqual(
            list(newly_created_exploration_stats.state_stats_mapping.keys()),
            ['Home', 'End']
        )

    def test_revert_exploration_creates_stats(self) -> None:
        """Test that the revert_exploration method creates stats
        for the newest exploration version.
        """
        # Create exploration object in datastore.
        exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
            assets_list)
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        # Save stats for version 1.
        exploration_stats = stats_services.get_exploration_stats_by_id(
            exp_id, 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        exploration_stats.num_starts_v2 = 3
        exploration_stats.num_actual_starts_v2 = 2
        exploration_stats.num_completions_v2 = 1
        stats_services.save_stats_model(exploration_stats)

        # Update exploration to next version 2 and its stats.
        exp_services.update_exploration(
            'committer_id_v2', exploration.id, [], 'Updated')
        exploration_stats = stats_services.get_exploration_stats_by_id(
            exp_id, 2)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        exploration_stats.num_starts_v2 = 4
        exploration_stats.num_actual_starts_v2 = 3
        exploration_stats.num_completions_v2 = 2
        stats_services.save_stats_model(exploration_stats)

        # Revert to an older version.
        exp_services.revert_exploration(
            'committer_id_v3', exp_id, 2, 1)
        exploration_stats = stats_services.get_exploration_stats_by_id(
            exp_id, 3
        )
        assert exploration_stats is not None
        self.assertEqual(exploration_stats.num_starts_v2, 3)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 2)
        self.assertEqual(exploration_stats.num_completions_v2, 1)

    def test_get_stats_for_new_exp_creates_new_stats(self) -> None:
        new_stats = stats_services.get_stats_for_new_exp_version(
            'exp_id', 1, [], None, None)

        self.assertEqual(new_stats.exp_id, 'exp_id')
        self.assertEqual(new_stats.exp_version, 1)
        self.assertEqual(new_stats.state_stats_mapping, {})

    def test_raises_error_when_both_exp_diff_and_revert_are_none(self) -> None:
        # Create exploration object in datastore.
        exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
            assets_list)
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        # Test addition of states.
        exploration.add_states(['New state', 'New state 2'])
        exploration.version += 1
        with self.assertRaisesRegex(
            Exception,
            'ExplorationVersionsDiff cannot be None when the change'
        ):
            stats_services.get_stats_for_new_exp_version(
                exploration.id,
                exploration.version,
                list(exploration.states.keys()),
                None,
                None
            )

    def test_raises_error_when_both_exp_diff_and_revert_are_none_while_updating_exp_issue(  # pylint: disable=line-too-long
        self
    ) -> None:
        # Create exploration object in datastore.
        exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
            assets_list)
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        # Test addition of states.
        exploration.add_states(['New state', 'New state 2'])
        exploration.version += 1
        with self.assertRaisesRegex(
            Exception,
            'ExplorationVersionsDiff cannot be None when the change'
        ):
            stats_services.get_updated_exp_issues_models_for_new_exp_version(
                exploration, None, None
            )

    def test_get_stats_for_new_exp_version(self) -> None:
        """Test the get_stats_for_new_exp_version method."""
        # Create exploration object in datastore.
        exp_id = 'exp_id'
        test_exp_filepath = os.path.join(
            feconf.TESTS_DATA_DIR, 'string_classifier_test.yaml')
        yaml_content = utils.get_file_contents(test_exp_filepath)
        assets_list: List[Tuple[str, bytes]] = []
        exp_services.save_new_exploration_from_yaml_and_assets(
            feconf.SYSTEM_COMMITTER_ID, yaml_content, exp_id,
            assets_list)
        exploration = exp_fetchers.get_exploration_by_id(exp_id)

        # Test addition of states.
        exploration.add_states(['New state', 'New state 2'])
        exploration.version += 1
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state',
        }), exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state 2'
        })]
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        exploration_stats = stats_services.get_stats_for_new_exp_version(
            exploration.id,
            exploration.version,
            list(exploration.states.keys()),
            exp_versions_diff,
            None
        )
        stats_services.create_stats_model(exploration_stats)

        exploration_stats_with_none = (
            stats_services.get_exploration_stats_by_id(
                exploration.id, exploration.version
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats_with_none is not None
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
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state 2',
            'new_state_name': 'Renamed state'
        })]
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        exploration_stats = stats_services.get_stats_for_new_exp_version(
            exploration.id,
            exploration.version,
            list(exploration.states.keys()),
            exp_versions_diff,
            None
        )
        stats_services.create_stats_model(exploration_stats)

        exploration_stats_with_none = (
            stats_services.get_exploration_stats_by_id(
                exploration.id, exploration.version
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats_with_none is not None
        self.assertEqual(exploration_stats_with_none.exp_version, 3)
        self.assertEqual(
            set(exploration_stats_with_none.state_stats_mapping.keys()), set([
                'Home', 'End', 'Renamed state', 'New state']))

        # Test deletion of states.
        exploration.delete_state('New state')
        exploration.version += 1
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'New state'
        })]
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        exploration_stats = stats_services.get_stats_for_new_exp_version(
            exploration.id,
            exploration.version,
            list(exploration.states.keys()),
            exp_versions_diff,
            None
        )
        stats_services.create_stats_model(exploration_stats)

        exploration_stats_with_none = (
            stats_services.get_exploration_stats_by_id(
                exploration.id, exploration.version
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats_with_none is not None
        self.assertEqual(exploration_stats_with_none.exp_version, 4)
        self.assertEqual(
            set(exploration_stats_with_none.state_stats_mapping.keys()),
            set(['Home', 'Renamed state', 'End']))

        # Test addition, renaming and deletion of states.
        exploration.add_states(['New state 2'])
        exploration.rename_state('New state 2', 'Renamed state 2')
        exploration.delete_state('Renamed state 2')
        exploration.version += 1
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state 2'
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state 2',
            'new_state_name': 'Renamed state 2'
        }), exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'Renamed state 2'
        })]
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        exploration_stats = stats_services.get_stats_for_new_exp_version(
            exploration.id,
            exploration.version,
            list(exploration.states.keys()),
            exp_versions_diff,
            None
        )
        stats_services.create_stats_model(exploration_stats)

        exploration_stats_with_none = (
            stats_services.get_exploration_stats_by_id(
                exploration.id, exploration.version
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats_with_none is not None
        self.assertEqual(exploration_stats_with_none.exp_version, 5)
        self.assertEqual(
            set(exploration_stats_with_none.state_stats_mapping.keys()),
            set(['Home', 'End', 'Renamed state']))

        # Test addition and multiple renames.
        exploration.add_states(['New state 2'])
        exploration.rename_state('New state 2', 'New state 3')
        exploration.rename_state('New state 3', 'New state 4')
        exploration.version += 1
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state 2',
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state 2',
            'new_state_name': 'New state 3'
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state 3',
            'new_state_name': 'New state 4'
        })]
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        exploration_stats = stats_services.get_stats_for_new_exp_version(
            exploration.id,
            exploration.version,
            list(exploration.states.keys()),
            exp_versions_diff,
            None
        )
        stats_services.create_stats_model(exploration_stats)

        exploration_stats_with_none = (
            stats_services.get_exploration_stats_by_id(
                exploration.id, exploration.version
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats_with_none is not None
        self.assertEqual(exploration_stats_with_none.exp_version, 6)
        self.assertEqual(
            set(exploration_stats_with_none.state_stats_mapping.keys()),
            set(['Home', 'New state 4', 'Renamed state', 'End']))

        # Set some values for the the stats in the ExplorationStatsModel
        # instance.
        exploration_stats_model = stats_models.ExplorationStatsModel.get_model(
            exploration.id, exploration.version)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats_model is not None
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
        exploration_stats_model.update_timestamps()
        exploration_stats_model.put()

        # Test deletion, addition and rename.
        exploration.delete_state('New state 4')
        exploration.add_states(['New state'])
        exploration.rename_state('New state', 'New state 4')
        exploration.version += 1
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'New state 4'
        }), exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state',
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state',
            'new_state_name': 'New state 4'
        })]
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        exploration_stats = stats_services.get_stats_for_new_exp_version(
            exploration.id,
            exploration.version,
            list(exploration.states.keys()),
            exp_versions_diff,
            None
        )
        stats_services.create_stats_model(exploration_stats)

        exp_stats = stats_services.get_exploration_stats_by_id(
            exploration.id, exploration.version)
        # Ruling out the possibility of None for mypy type checking.
        assert exp_stats is not None
        self.assertEqual(exp_stats.exp_version, 7)
        self.assertEqual(
            set(exp_stats.state_stats_mapping.keys()),
            set(['Home', 'New state 4', 'Renamed state', 'End']))

        # Test the values of the stats carried over from the last version.
        self.assertEqual(exp_stats.num_actual_starts_v2, 5)
        self.assertEqual(exp_stats.num_completions_v2, 2)
        self.assertEqual(
            exp_stats.state_stats_mapping['Home'].total_hit_count_v2, 8)
        self.assertEqual(
            exp_stats.state_stats_mapping[
                'Renamed state'].first_hit_count_v2, 2)
        self.assertEqual(
            exp_stats.state_stats_mapping[
                'End'].useful_feedback_count_v2, 4)
        # State 'New state 4' has been deleted and recreated, so it should
        # now contain default values for stats instead of the values it
        # contained in the last version.
        self.assertEqual(
            exp_stats.state_stats_mapping[
                'New state 4'].total_answers_count_v2, 0)

        # Test reverts.
        exploration.version += 1
        exploration_stats_for_new_exp_version = (
            stats_services.get_stats_for_new_exp_version(
                exploration.id,
                exploration.version,
                list(exploration.states.keys()),
                None,
                5
            )
        )
        stats_services.create_stats_model(
            exploration_stats_for_new_exp_version
        )

        newly_created_exploration_stats = (
            stats_services.get_exploration_stats_by_id(
                exploration.id, exploration.version
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert newly_created_exploration_stats is not None
        self.assertEqual(newly_created_exploration_stats.exp_version, 8)
        self.assertEqual(
            set(newly_created_exploration_stats.state_stats_mapping.keys()),
            set(['Home', 'Renamed state', 'End']))

        self.assertEqual(
            newly_created_exploration_stats.num_actual_starts_v2, 0
        )
        self.assertEqual(newly_created_exploration_stats.num_completions_v2, 0)

        # Test state name swaps.
        exploration.add_states(['New state 5', 'New state 6'])
        exploration.version += 1
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state 5'
        }), exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'New state 6'
        })]
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        exploration_stats = stats_services.get_stats_for_new_exp_version(
            exploration.id,
            exploration.version,
            list(exploration.states.keys()),
            exp_versions_diff,
            None
        )
        stats_services.create_stats_model(exploration_stats)

        exploration.rename_state('New state 5', 'New state 7')
        exploration.rename_state('New state 6', 'New state 5')
        exploration.rename_state('New state 7', 'New state 6')
        exploration.version += 1
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state 5',
            'new_state_name': 'New state 7'
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state 6',
            'new_state_name': 'New state 5'
        }), exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'old_state_name': 'New state 7',
            'new_state_name': 'New state 6'
        })]
        exp_versions_diff = exp_domain.ExplorationVersionsDiff(change_list)
        exploration_stats = stats_services.get_stats_for_new_exp_version(
            exploration.id,
            exploration.version,
            list(exploration.states.keys()),
            exp_versions_diff,
            None
        )
        stats_services.create_stats_model(exploration_stats)

        exploration_stats_with_none = (
            stats_services.get_exploration_stats_by_id(
                exploration.id, exploration.version
            )
        )
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats_with_none is not None
        self.assertEqual(exploration_stats_with_none.exp_version, 10)
        self.assertEqual(
            set(exploration_stats_with_none.state_stats_mapping.keys()),
            set(['End', 'Home', 'New state 6', 'New state 5', 'Renamed state']))

    def test_get_exploration_stats_from_model(self) -> None:
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
        self.assertEqual(exploration_stats.state_stats_mapping, {
            'End': stats_domain.StateStats.create_default(),
            'Introduction': stats_domain.StateStats.create_default()
        })

    def test_get_playthrough_from_model(self) -> None:
        """Test the get_playthrough_from_model method."""
        model = stats_models.PlaythroughModel.get(self.playthrough_id)
        playthrough = stats_services.get_playthrough_from_model(model)
        self.assertEqual(playthrough.exp_id, 'exp_id1')
        self.assertEqual(playthrough.exp_version, 1)
        self.assertEqual(playthrough.issue_type, 'EarlyQuit')
        self.assertEqual(playthrough.issue_customization_args, {})
        self.assertEqual(playthrough.actions, [])

    def test_get_exploration_stats_by_id(self) -> None:
        """Test the get_exploration_stats_by_id method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        self.assertEqual(exploration_stats.exp_id, 'exp_id1')
        self.assertEqual(exploration_stats.exp_version, 1)
        self.assertEqual(exploration_stats.num_starts_v1, 0)
        self.assertEqual(exploration_stats.num_starts_v2, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v1, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 0)
        self.assertEqual(exploration_stats.num_completions_v1, 0)
        self.assertEqual(exploration_stats.num_completions_v2, 0)
        self.assertEqual(exploration_stats.state_stats_mapping, {
            'End': stats_domain.StateStats.create_default(),
            'Introduction': stats_domain.StateStats.create_default()
        })

    def test_create_stats_model(self) -> None:
        """Test the create method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        exploration_stats.exp_version += 1
        model_id = stats_services.create_stats_model(exploration_stats)
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version + 1)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        self.assertEqual(exploration_stats.exp_id, 'exp_id1')
        self.assertEqual(exploration_stats.exp_version, 2)
        self.assertEqual(exploration_stats.num_starts_v1, 0)
        self.assertEqual(exploration_stats.num_starts_v2, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v1, 0)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 0)
        self.assertEqual(exploration_stats.num_completions_v1, 0)
        self.assertEqual(exploration_stats.num_completions_v2, 0)
        self.assertEqual(exploration_stats.state_stats_mapping, {
            'End': stats_domain.StateStats.create_default(),
            'Introduction': stats_domain.StateStats.create_default()
        })

        # Test create method with different state_stats_mapping.
        exploration_stats.state_stats_mapping = {
            'Home': stats_domain.StateStats.create_default()
        }
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
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

    def test_save_stats_model(self) -> None:
        """Test the save_stats_model method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        exploration_stats.num_starts_v2 += 15
        exploration_stats.num_actual_starts_v2 += 5
        exploration_stats.num_completions_v2 += 2
        stats_services.save_stats_model(exploration_stats)

        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        self.assertEqual(exploration_stats.num_starts_v2, 15)
        self.assertEqual(exploration_stats.num_actual_starts_v2, 5)
        self.assertEqual(exploration_stats.num_completions_v2, 2)

    def test_get_exploration_stats_multi(self) -> None:
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

    def test_get_multiple_exploration_stats_by_version_with_invalid_exp_id(
        self
    ) -> None:
        exp_stats = stats_services.get_multiple_exploration_stats_by_version(
            'invalid_exp_id', [1])

        self.assertEqual(exp_stats, [None])

    def test_get_exploration_stats_multi_with_invalid_exp_id(self) -> None:
        exp_version_references = [
            exp_domain.ExpVersionReference('exp_id_1', 1),
            exp_domain.ExpVersionReference('exp_id_2', 2)]

        exploration_stats_models = (
            stats_models.ExplorationStatsModel.get_multi_stats_models(
                exp_version_references))

        self.assertEqual(exploration_stats_models, [None, None])

        exp_stats_list = stats_services.get_exploration_stats_multi(
            exp_version_references)

        self.assertEqual(len(exp_stats_list), 2)
        self.assertEqual(exp_stats_list[0].exp_id, 'exp_id_1')
        self.assertEqual(exp_stats_list[0].exp_version, 1)
        self.assertEqual(exp_stats_list[1].exp_id, 'exp_id_2')
        self.assertEqual(exp_stats_list[1].exp_version, 2)

    def test_get_updated_exp_issues_models_for_new_exp_version(self) -> None:
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        exp = self.save_new_valid_exploration('exp_id', admin_id)

        stats_models.ExplorationIssuesModel.delete_by_id(
            '%s.%s' % ('exp_id', 1))
        self.assertIsNone(
            stats_models.ExplorationIssuesModel.get(
                '%s.%s' % ('exp_id', 1), strict=False))

        exp.version += 1
        models_to_put = (
            stats_services.get_updated_exp_issues_models_for_new_exp_version(
                exp, exp_domain.ExplorationVersionsDiff([]), None
            )
        )
        datastore_services.update_timestamps_multi(models_to_put)
        datastore_services.put_multi(models_to_put)

        exploration_issues_model = (
            stats_models.ExplorationIssuesModel.get('%s.%s' % ('exp_id', 1)))
        self.assertEqual(exploration_issues_model.unresolved_issues, [])

    def test_raises_error_while_saving_stats_with_invalid_id(self) -> None:
        """Test the update_stats method."""
        exploration_stats = stats_services.get_exploration_stats_by_id(
            self.exp_id, self.exp_version)
        # Ruling out the possibility of None for mypy type checking.
        assert exploration_stats is not None
        exploration_stats.num_starts_v2 += 15
        exploration_stats.num_actual_starts_v2 += 5
        exploration_stats.num_completions_v2 += 2
        exploration_stats.exp_id = 'Invalid_id'
        with self.assertRaisesRegex(
            Exception, 'No exploration stats model exists'
        ):
            stats_services.save_stats_model(exploration_stats)


class ExplorationIssuesTests(test_utils.GenericTestBase):
    """Unit tests focused on services related to exploration issues."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exp = self.save_new_linear_exp_with_state_names_and_interactions(
            'exp_id', self.owner_id,
            ['A', 'B'], ['TextInput', 'EndExploration'])

    def _create_cst_playthrough(self, state_names: List[str]) -> str:
        """Creates a Cyclic State Transitions playthrough and returns its id.

        Args:
            state_names: list(str). The states of the cycle, where only the
                first and last values are the same. Requires at least 2 distinct
                values.

        Returns:
            str. The ID of the new playthrough.
        """
        issue_customization_args: (
            stats_domain.IssuesCustomizationArgsDictType
        ) = {'state_names': {'value': state_names}}
        actions: List[stats_domain.LearnerActionDict] = [{
            'action_type': 'ExplorationStart',
            'action_customization_args': {
                'state_name': {'value': state_names[0]},
            },
            'schema_version': stats_models.CURRENT_ACTION_SCHEMA_VERSION,
        }]
        actions.extend(
            {
                'action_type': 'AnswerSubmit',
                'action_customization_args': {
                    'state_name': {'value': state_name},
                    'dest_state_name': {'value': dest_state_name},
                    'interaction_id': {'value': 'TextInput'},
                    'submitted_answer': {'value': 'Foo!'},
                    'feedback': {'value': ''},
                    'time_spent_in_exp_in_msecs': {'value': 1000},
                },
                'schema_version': stats_models.CURRENT_ACTION_SCHEMA_VERSION,
            }
            for state_name, dest_state_name in zip(
                state_names[:-1], state_names[1:]))
        actions.append({
            'action_type': 'ExplorationQuit',
            'action_customization_args': {
                'state_name': {'value': state_names[-1]},
                'time_spent_in_state_in_msecs': {'value': 1000},
            },
            'schema_version': stats_models.CURRENT_ACTION_SCHEMA_VERSION,
        })
        return stats_models.PlaythroughModel.create(
            self.exp.id, self.exp.version, 'CyclicStateTransitions',
            issue_customization_args, actions)

    def _create_eq_playthrough(self, state_name: str) -> str:
        """Creates an Early Quit playthrough and returns its id.

        Args:
            state_name: str. The state the early quit occurred from.

        Returns:
            str. The ID of the new playthrough.
        """
        issue_customization_args: (
            stats_domain.IssuesCustomizationArgsDictType
        ) = {
            'state_name': {'value': state_name},
            'time_spent_in_exp_in_msecs': {'value': 200},
        }
        actions: List[stats_domain.LearnerActionDict] = [{
            'action_type': 'ExplorationStart',
            'action_customization_args': {'state_name': {'value': state_name}},
            'schema_version': stats_models.CURRENT_ACTION_SCHEMA_VERSION,
        }, {
            'action_type': 'ExplorationQuit',
            'action_customization_args': {
                'state_name': {'value': state_name},
                'time_spent_in_state_in_msecs': {'value': 1000},
            },
            'schema_version': stats_models.CURRENT_ACTION_SCHEMA_VERSION,
        }]
        return stats_models.PlaythroughModel.create(
            self.exp.id, self.exp.version, 'EarlyQuit',
            issue_customization_args, actions)

    def _create_mis_playthrough(
        self,
        state_name: str,
        num_times_answered_incorrectly: int
    ) -> str:
        """Creates a Multiple Incorrect Submissions playthrough and returns its
        id.

        Args:
            state_name: str. The state the answers were submitted to.
            num_times_answered_incorrectly: int. Number of times incorrect
                answers were submitted.

        Returns:
            str. The ID of the new playthrough.
        """
        issue_customization_args: (
            stats_domain.IssuesCustomizationArgsDictType
        ) = {
            'state_name': {'value': state_name},
            'num_times_answered_incorrectly': {
                'value': num_times_answered_incorrectly
            },
        }
        actions: List[stats_domain.LearnerActionDict] = [{
            'action_type': 'ExplorationStart',
            'action_customization_args': {'state_name': {'value': state_name}},
            'schema_version': stats_models.CURRENT_ACTION_SCHEMA_VERSION,
        }]
        actions.extend(
            {
                'action_type': 'AnswerSubmit',
                'action_customization_args': {
                    'state_name': {'value': state_name},
                    'dest_state_name': {'value': state_name},
                    'interaction_id': {'value': 'TextInput'},
                    'submitted_answer': {'value': 'Foo!'},
                    'feedback': {'value': ''},
                    'time_spent_in_exp_in_msecs': {'value': 1000},
                },
                'schema_version': stats_models.CURRENT_ACTION_SCHEMA_VERSION,
            }
            for _ in range(num_times_answered_incorrectly))
        actions.append({
            'action_type': 'ExplorationQuit',
            'action_customization_args': {
                'state_name': {'value': state_name},
                'time_spent_in_state_in_msecs': {'value': 1000},
            },
            'schema_version': stats_models.CURRENT_ACTION_SCHEMA_VERSION,
        })
        return stats_models.PlaythroughModel.create(
            self.exp.id, self.exp.version, 'MultipleIncorrectSubmissions',
            issue_customization_args, actions)

    def _create_cst_exp_issue(
        self, playthrough_ids: List[str], state_names: List[str]
    ) -> stats_domain.ExplorationIssue:
        """Returns a new Cyclic State Transitions issue domain object.

        Args:
            playthrough_ids: list(str). List of playthrough IDs demonstrating a
                Cyclic State Transitions issue.
            state_names: list(str). The states of the cycle, where only the
                first and last values are the same. Requires at least 2 distinct
                values.

        Returns:
            stats_domain.ExplorationIssue. The new issue.
        """
        issue_customization_args: Dict[
            str, Dict[str, Union[str, int, List[str]]]
        ] = {'state_names': {'value': state_names}}
        is_valid = True
        return stats_domain.ExplorationIssue(
            'CyclicStateTransitions', issue_customization_args, playthrough_ids,
            stats_models.CURRENT_ISSUE_SCHEMA_VERSION, is_valid)

    def _create_eq_exp_issue(
        self, playthrough_ids: List[str], state_name: str
    ) -> stats_domain.ExplorationIssue:
        """Returns a new Early Quit issue domain object.

        Args:
            playthrough_ids: list(str). List of playthrough IDs demonstrating an
                Early Quit issue.
            state_name: str. The state the early quit occurred from.

        Returns:
            stats_domain.ExplorationIssue. The new issue.
        """
        issue_customization_args: Dict[
            str, Dict[str, Union[str, int, List[str]]]
        ] = {
            'state_name': {'value': state_name},
            'time_spent_in_exp_in_msecs': {'value': 200},
        }
        is_valid = True
        return stats_domain.ExplorationIssue(
            'EarlyQuit', issue_customization_args, playthrough_ids,
            stats_models.CURRENT_ISSUE_SCHEMA_VERSION, is_valid)

    def _create_mis_exp_issue(
        self,
        playthrough_ids: List[str],
        state_name: str,
        num_times_answered_incorrectly: int
    ) -> stats_domain.ExplorationIssue:
        """Returns a new Multiple Incorrect Submissions issue domain object.

        Args:
            playthrough_ids: list(str). List of playthrough IDs demonstrating a
                Multiple Incorrect Submissions issue.
            state_name: str. The state the answers were submitted to.
            num_times_answered_incorrectly: int. Number of times incorrect
                answers were submitted.

        Returns:
            stats_domain.ExplorationIssue. The new issue.
        """
        issue_customization_args: Dict[
            str, Dict[str, Union[str, int, List[str]]]
        ] = {
            'state_name': {'value': state_name},
            'num_times_answered_incorrectly': {
                'value': num_times_answered_incorrectly
            },
        }
        is_valid = True
        return stats_domain.ExplorationIssue(
            'MultipleIncorrectSubmissions', issue_customization_args,
            playthrough_ids, stats_models.CURRENT_ISSUE_SCHEMA_VERSION,
            is_valid)

    def test_create_exp_issues_model(self) -> None:
        exp_issues = stats_domain.ExplorationIssues(
            self.exp.id, stats_models.CURRENT_ISSUE_SCHEMA_VERSION, [])

        stats_services.get_exp_issues_model_from_domain_object(exp_issues)

        exp_issues_model = stats_models.ExplorationIssuesModel.get_model(
            self.exp.id, self.exp.version)
        # Ruling out the possibility of None for mypy type checking.
        assert exp_issues_model is not None
        self.assertEqual(exp_issues_model.exp_id, self.exp.id)
        self.assertEqual(exp_issues_model.exp_version, self.exp.version)
        self.assertEqual(exp_issues_model.unresolved_issues, [])

    def test_get_exp_issues_creates_new_empty_exp_issues_when_missing(
        self
    ) -> None:
        exp_issues = (
            stats_services.get_exp_issues(self.exp.id, self.exp.version))
        self.assertEqual(exp_issues.exp_id, self.exp.id)
        self.assertEqual(exp_issues.unresolved_issues, [])

    def test_delete_playthroughs_multi(self) -> None:
        playthrough_ids = [
            self._create_eq_playthrough('A'),
            self._create_cst_playthrough(['A', 'B', 'A']),
            self._create_mis_playthrough('A', 3),
        ]

        stats_services.delete_playthroughs_multi(playthrough_ids)

        self.assertEqual(
            stats_models.PlaythroughModel.get_multi(playthrough_ids),
            [None, None, None])

    def test_save_exp_issues_model(self) -> None:
        eq_playthrough_ids = [self._create_eq_playthrough('A')]
        cst_playthrough_ids = [self._create_cst_playthrough(['A', 'B', 'A'])]
        mis_playthrough_ids = [self._create_mis_playthrough('A', 3)]
        stats_services.save_exp_issues_model(
            stats_domain.ExplorationIssues(self.exp.id, self.exp.version, [
                self._create_eq_exp_issue(eq_playthrough_ids, 'A'),
                self._create_mis_exp_issue(mis_playthrough_ids, 'A', 3),
                self._create_cst_exp_issue(cst_playthrough_ids, ['A', 'B', 'A'])
            ]))

        exp_issues = (
            stats_services.get_exp_issues(self.exp.id, self.exp.version))
        self.assertEqual(len(exp_issues.unresolved_issues), 3)
        self.assertEqual(
            exp_issues.unresolved_issues[0].playthrough_ids,
            eq_playthrough_ids)
        self.assertEqual(
            exp_issues.unresolved_issues[1].playthrough_ids,
            mis_playthrough_ids)
        self.assertEqual(
            exp_issues.unresolved_issues[2].playthrough_ids,
            cst_playthrough_ids)

    def test_cst_exp_issue_is_invalidated_when_state_is_deleted(self) -> None:
        stats_services.save_exp_issues_model(
            stats_domain.ExplorationIssues(self.exp.id, self.exp.version, [
                self._create_cst_exp_issue(
                    [self._create_cst_playthrough(['A', 'B', 'A'])],
                    ['A', 'B', 'A'])
            ]))

        exp_services.update_exploration(
            self.owner_id,
            self.exp.id,
            [
                exp_domain.ExplorationChange(
                    {'cmd': 'delete_state', 'state_name': 'B'})
            ],
            'change'
        )

        exp_issues = (
            stats_services.get_exp_issues(self.exp.id, self.exp.version + 1))
        self.assertEqual(len(exp_issues.unresolved_issues), 1)
        self.assertFalse(exp_issues.unresolved_issues[0].is_valid)

    def test_cst_exp_issue_is_updated_when_state_is_renamed(self) -> None:
        stats_services.save_exp_issues_model(
            stats_domain.ExplorationIssues(self.exp.id, self.exp.version, [
                self._create_cst_exp_issue(
                    [self._create_cst_playthrough(['A', 'B', 'A'])],
                    ['A', 'B', 'A'])
            ]))

        exp_services.update_exploration(
            self.owner_id,
            self.exp.id,
            [
                exp_domain.ExplorationChange({
                    'cmd': 'rename_state',
                    'old_state_name': 'A',
                    'new_state_name': 'Z',
                })
            ],
            'change'
        )

        exp_issues = (
            stats_services.get_exp_issues(self.exp.id, self.exp.version + 1))
        self.assertEqual(len(exp_issues.unresolved_issues), 1)

        exp_issue = exp_issues.unresolved_issues[0]
        self.assertTrue(exp_issue.is_valid)
        self.assertEqual(
            exp_issue.issue_customization_args['state_names']['value'],
            ['Z', 'B', 'Z'])
        self.assertEqual(len(exp_issue.playthrough_ids), 1)

        playthrough = stats_models.PlaythroughModel.get_by_id(
            exp_issue.playthrough_ids[0])
        self.assertEqual(
            playthrough.issue_customization_args['state_names']['value'],
            ['Z', 'B', 'Z'])
        self.assertEqual(len(playthrough.actions), 4)

        actions = playthrough.actions
        self.assertEqual(
            actions[0]['action_customization_args']['state_name']['value'],
            'Z')
        self.assertEqual(
            actions[1]['action_customization_args']['state_name']['value'],
            'Z')
        self.assertEqual(
            actions[2]['action_customization_args']['dest_state_name']['value'],
            'Z')
        self.assertEqual(
            actions[3]['action_customization_args']['state_name']['value'],
            'Z')

    def test_eq_exp_issue_is_invalidated_when_state_is_deleted(self) -> None:
        stats_services.save_exp_issues_model(
            stats_domain.ExplorationIssues(self.exp.id, self.exp.version, [
                self._create_eq_exp_issue(
                    [self._create_eq_playthrough('B')], 'B')
            ]))

        exp_services.update_exploration(
            self.owner_id,
            self.exp.id,
            [
                exp_domain.ExplorationChange(
                    {'cmd': 'delete_state', 'state_name': 'B'})
            ],
            'change'
        )

        exp_issues = (
            stats_services.get_exp_issues(self.exp.id, self.exp.version + 1))
        self.assertEqual(len(exp_issues.unresolved_issues), 1)
        self.assertFalse(exp_issues.unresolved_issues[0].is_valid)

    def test_eq_exp_issue_is_updated_when_state_is_renamed(self) -> None:
        stats_services.save_exp_issues_model(
            stats_domain.ExplorationIssues(self.exp.id, self.exp.version, [
                self._create_eq_exp_issue(
                    [self._create_eq_playthrough('A')], 'A')
            ]))

        exp_services.update_exploration(
            self.owner_id,
            self.exp.id,
            [
                exp_domain.ExplorationChange({
                    'cmd': 'rename_state',
                    'old_state_name': 'A',
                    'new_state_name': 'Z',
                })
            ],
            'change'
        )

        exp_issues = (
            stats_services.get_exp_issues(self.exp.id, self.exp.version + 1))
        self.assertEqual(len(exp_issues.unresolved_issues), 1)

        exp_issue = exp_issues.unresolved_issues[0]
        self.assertTrue(exp_issue.is_valid)
        self.assertEqual(
            exp_issue.issue_customization_args['state_name']['value'], 'Z')
        self.assertEqual(len(exp_issue.playthrough_ids), 1)

        playthrough = stats_models.PlaythroughModel.get_by_id(
            exp_issue.playthrough_ids[0])
        self.assertEqual(
            playthrough.issue_customization_args['state_name']['value'], 'Z')
        self.assertEqual(len(playthrough.actions), 2)

        actions = playthrough.actions
        self.assertEqual(
            actions[0]['action_customization_args']['state_name']['value'], 'Z')
        self.assertEqual(
            actions[1]['action_customization_args']['state_name']['value'], 'Z')

    def test_mis_exp_issue_is_invalidated_when_state_is_deleted(self) -> None:
        stats_services.save_exp_issues_model(
            stats_domain.ExplorationIssues(self.exp.id, self.exp.version, [
                self._create_mis_exp_issue(
                    [self._create_mis_playthrough('B', 2)], 'B', 2)
            ]))

        exp_services.update_exploration(
            self.owner_id,
            self.exp.id,
            [
                exp_domain.ExplorationChange(
                    {'cmd': 'delete_state', 'state_name': 'B'}),
            ],
            'Delete B'
        )

        exp_issues = (
            stats_services.get_exp_issues(self.exp.id, self.exp.version + 1))
        self.assertEqual(len(exp_issues.unresolved_issues), 1)
        self.assertFalse(exp_issues.unresolved_issues[0].is_valid)

    def test_mis_exp_issue_is_updated_when_state_is_renamed(self) -> None:
        stats_services.save_exp_issues_model(
            stats_domain.ExplorationIssues(self.exp.id, self.exp.version, [
                self._create_mis_exp_issue(
                    [self._create_mis_playthrough('A', 2)], 'A', 2)
            ]))

        exp_services.update_exploration(
            self.owner_id,
            self.exp.id,
            [
                exp_domain.ExplorationChange({
                    'cmd': 'rename_state',
                    'old_state_name': 'A',
                    'new_state_name': 'Z',
                })
            ],
            'change'
        )

        exp_issues = (
            stats_services.get_exp_issues(self.exp.id, self.exp.version + 1))
        self.assertEqual(len(exp_issues.unresolved_issues), 1)

        exp_issue = exp_issues.unresolved_issues[0]
        self.assertTrue(exp_issue.is_valid)
        self.assertEqual(
            exp_issue.issue_customization_args['state_name']['value'], 'Z')
        self.assertEqual(len(exp_issue.playthrough_ids), 1)

        playthrough = stats_models.PlaythroughModel.get_by_id(
            exp_issue.playthrough_ids[0])
        self.assertEqual(
            playthrough.issue_customization_args['state_name']['value'], 'Z')
        self.assertEqual(len(playthrough.actions), 4)

        actions = playthrough.actions
        self.assertEqual(
            actions[0]['action_customization_args']['state_name']['value'], 'Z')
        self.assertEqual(
            actions[1]['action_customization_args']['state_name']['value'], 'Z')
        self.assertEqual(
            actions[2]['action_customization_args']['state_name']['value'], 'Z')
        self.assertEqual(
            actions[3]['action_customization_args']['state_name']['value'], 'Z')

    def test_revert_exploration_recovers_exp_issues(self) -> None:
        stats_services.save_exp_issues_model(
            stats_domain.ExplorationIssues(self.exp.id, self.exp.version, [
                self._create_eq_exp_issue(
                    [self._create_eq_playthrough('B')], 'B'),
                self._create_cst_exp_issue(
                    [self._create_cst_playthrough(['A', 'B', 'A'])],
                    ['A', 'B', 'A']),
                self._create_mis_exp_issue(
                    [self._create_mis_playthrough('B', 3)], 'B', 3),
            ]))

        exp_services.update_exploration(
            self.owner_id,
            self.exp.id,
            [
                exp_domain.ExplorationChange(
                    {'cmd': 'delete_state', 'state_name': 'B'}),
            ],
            'commit'
        )

        exp_issues = (
            stats_services.get_exp_issues(self.exp.id, self.exp.version + 1))
        self.assertEqual(len(exp_issues.unresolved_issues), 3)
        self.assertFalse(exp_issues.unresolved_issues[0].is_valid)
        self.assertFalse(exp_issues.unresolved_issues[1].is_valid)
        self.assertFalse(exp_issues.unresolved_issues[2].is_valid)

        exp_services.revert_exploration(self.owner_id, self.exp.id, 2, 1)

        exp_issues = (
            stats_services.get_exp_issues(self.exp.id, self.exp.version + 2))
        self.assertEqual(len(exp_issues.unresolved_issues), 3)
        self.assertTrue(exp_issues.unresolved_issues[0].is_valid)
        self.assertTrue(exp_issues.unresolved_issues[1].is_valid)
        self.assertTrue(exp_issues.unresolved_issues[2].is_valid)

    def test_raises_error_while_saving_exp_issues_model_with_invalid_exp_id(
        self
    ) -> None:
        exp_issues = stats_domain.ExplorationIssues(
            self.exp.id,
            self.exp.version,
            [
                self._create_cst_exp_issue(
                    [self._create_cst_playthrough(['A', 'B', 'A'])],
                    ['A', 'B', 'A']
                )
            ]
        )
        exp_issues.exp_id = 'Invalid_id'
        with self.assertRaisesRegex(
            Exception, 'No ExplorationIssuesModel exists'
        ):
            stats_services.save_exp_issues_model(exp_issues)


class EventLogEntryTests(test_utils.GenericTestBase):
    """Test for the event log creation."""

    def test_create_events(self) -> None:
        """Basic test that makes sure there are no exceptions thrown."""
        event_services.StartExplorationEventHandler.record(
            'eid', 2, 'state', 'session', {}, feconf.PLAY_TYPE_NORMAL)
        event_services.MaybeLeaveExplorationEventHandler.record(
            'eid', 2, 'state', 'session', 27.2, {}, feconf.PLAY_TYPE_NORMAL)


class AnswerEventTests(test_utils.GenericTestBase):
    """Test recording new answer operations through events."""

    SESSION_ID: Final = 'SESSION_ID'
    TIME_SPENT: Final = 5.0
    PARAMS: Dict[str, str] = {}

    def test_record_answer(self) -> None:
        self.save_new_default_exploration('eid', 'fake@user.com')
        exp = exp_fetchers.get_exploration_by_id('eid')

        first_state_name = exp.init_state_name
        second_state_name = 'State 2'
        third_state_name = 'State 3'
        exp_services.update_exploration(
            'fake@user.com',
            'eid',
            [
                exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': first_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'TextInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': first_state_name,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'new_value': {
                        'placeholder': {
                            'value': {
                                'content_id': 'ca_placeholder_0',
                                'unicode_str': 'Enter here'
                            }
                        },
                        'rows': {'value': 1}
                    }
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': first_state_name,
                    'property_name':
                        exp_domain.STATE_PROPERTY_NEXT_CONTENT_ID_INDEX,
                    'new_value': 1
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': second_state_name,
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_ADD_STATE,
                    'state_name': third_state_name,
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': second_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'TextInput',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': second_state_name,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'new_value': {
                        'placeholder': {
                            'value': {
                                'content_id': 'ca_placeholder_0',
                                'unicode_str': 'Enter here'
                            }
                        },
                        'rows': {'value': 1}
                    }
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': second_state_name,
                    'property_name':
                        exp_domain.STATE_PROPERTY_NEXT_CONTENT_ID_INDEX,
                    'new_value': 1
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': third_state_name,
                    'property_name': exp_domain.STATE_PROPERTY_INTERACTION_ID,
                    'new_value': 'Continue',
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': third_state_name,
                    'property_name':
                        exp_domain.STATE_PROPERTY_INTERACTION_CUST_ARGS,
                    'new_value': {
                        'buttonText': {
                            'value': {
                                'content_id': 'ca_buttonText_1',
                                'unicode_str': 'Continue'
                            }
                        },
                    }
                }), exp_domain.ExplorationChange({
                    'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
                    'state_name': third_state_name,
                    'property_name':
                        exp_domain.STATE_PROPERTY_NEXT_CONTENT_ID_INDEX,
                    'new_value': 2
                })
            ],
            'Add new state'
        )
        exp = exp_fetchers.get_exploration_by_id('eid')

        exp_version = exp.version

        for state_name in [first_state_name, second_state_name]:
            state_answers = stats_services.get_state_answers(
                'eid', exp_version, state_name)
            self.assertEqual(state_answers, None)

        # Answer is a string.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 0, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, 'answer1')
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 0, 1,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid2', self.TIME_SPENT,
            self.PARAMS, 'answer1')
        # Answer is a dict.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 1, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, {'x': 1.0, 'y': 5.0})
        # Answer is a number.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 2, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, 10)
        # Answer is a list of dicts.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, first_state_name, 'TextInput', 3, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid1', self.TIME_SPENT,
            self.PARAMS, [{'a': 'some', 'b': 'text'}, {'a': 1.0, 'c': 2.0}])
        # Answer is a list.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, second_state_name, 'TextInput', 2, 0,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid3', self.TIME_SPENT,
            self.PARAMS, [2, 4, 8])
        # Answer is a unicode string.
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, second_state_name, 'TextInput', 1, 1,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid4', self.TIME_SPENT,
            self.PARAMS, self.UNICODE_TEST_STRING)
        # Answer is None (such as for Continue).
        event_services.AnswerSubmissionEventHandler.record(
            'eid', exp_version, third_state_name, 'Continue', 1, 1,
            exp_domain.EXPLICIT_CLASSIFICATION, 'sid5', self.TIME_SPENT,
            self.PARAMS, None)

        expected_submitted_answer_list1 = [{
            'answer': 'answer1', 'time_spent_in_sec': 5.0,
            'answer_group_index': 0, 'rule_spec_index': 0,
            'classification_categorization': 'explicit', 'session_id': 'sid1',
            'interaction_id': 'TextInput', 'params': {}, 'answer_str': None,
            'rule_spec_str': None
        }, {
            'answer': 'answer1', 'time_spent_in_sec': 5.0,
            'answer_group_index': 0, 'rule_spec_index': 1,
            'classification_categorization': 'explicit', 'session_id': 'sid2',
            'interaction_id': 'TextInput', 'params': {}, 'answer_str': None,
            'rule_spec_str': None
        }, {
            'answer': {'x': 1.0, 'y': 5.0}, 'time_spent_in_sec': 5.0,
            'answer_group_index': 1, 'rule_spec_index': 0,
            'classification_categorization': 'explicit', 'session_id': 'sid1',
            'interaction_id': 'TextInput', 'params': {}, 'answer_str': None,
            'rule_spec_str': None
        }, {
            'answer': 10, 'time_spent_in_sec': 5.0, 'answer_group_index': 2,
            'rule_spec_index': 0, 'classification_categorization': 'explicit',
            'session_id': 'sid1', 'interaction_id': 'TextInput', 'params': {},
            'answer_str': None, 'rule_spec_str': None
        }, {
            'answer': [{'a': 'some', 'b': 'text'}, {'a': 1.0, 'c': 2.0}],
            'time_spent_in_sec': 5.0, 'answer_group_index': 3,
            'rule_spec_index': 0, 'classification_categorization': 'explicit',
            'session_id': 'sid1', 'interaction_id': 'TextInput', 'params': {},
            'answer_str': None, 'rule_spec_str': None
        }]
        expected_submitted_answer_list2 = [{
            'answer': [2, 4, 8], 'time_spent_in_sec': 5.0,
            'answer_group_index': 2, 'rule_spec_index': 0,
            'classification_categorization': 'explicit', 'session_id': 'sid3',
            'interaction_id': 'TextInput', 'params': {}, 'answer_str': None,
            'rule_spec_str': None
        }, {
            'answer': self.UNICODE_TEST_STRING, 'time_spent_in_sec': 5.0,
            'answer_group_index': 1, 'rule_spec_index': 1,
            'classification_categorization': 'explicit', 'session_id': 'sid4',
            'interaction_id': 'TextInput', 'params': {}, 'answer_str': None,
            'rule_spec_str': None
        }]
        expected_submitted_answer_list3: List[
            Dict[str, Union[str, Optional[int], Dict[str, str], float]]
        ] = [{
            'answer': None, 'time_spent_in_sec': 5.0, 'answer_group_index': 1,
            'rule_spec_index': 1, 'classification_categorization': 'explicit',
            'session_id': 'sid5', 'interaction_id': 'Continue', 'params': {},
            'answer_str': None, 'rule_spec_str': None
        }]

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, first_state_name)
        # Ruling out the possibility of None for mypy type checking.
        assert state_answers is not None
        self.assertEqual(
            state_answers.get_submitted_answer_dict_list(),
            expected_submitted_answer_list1)

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, second_state_name)
        # Ruling out the possibility of None for mypy type checking.
        assert state_answers is not None
        self.assertEqual(
            state_answers.get_submitted_answer_dict_list(),
            expected_submitted_answer_list2)

        state_answers = stats_services.get_state_answers(
            'eid', exp_version, third_state_name)
        # Ruling out the possibility of None for mypy type checking.
        assert state_answers is not None
        self.assertEqual(
            state_answers.get_submitted_answer_dict_list(),
            expected_submitted_answer_list3)


class RecordAnswerTests(test_utils.GenericTestBase):
    """Tests for functionality related to recording and retrieving answers."""

    EXP_ID: Final = 'exp_id0'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')

    def test_record_answer_without_retrieving_it_first(self) -> None:
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
        # Ruling out the possibility of None for mypy type checking.
        assert state_answers is not None
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'first answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
        }])

    def test_record_and_retrieve_single_answer(self) -> None:
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
        # Ruling out the possibility of None for mypy type checking.
        assert state_answers is not None
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
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
        }])

    def test_record_and_retrieve_single_answer_with_preexisting_entry(
        self
    ) -> None:
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
        # Ruling out the possibility of None for mypy type checking.
        assert state_answers is not None
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': 'first answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
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
        # Ruling out the possibility of None for mypy type checking.
        assert state_answers is not None
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
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
        }, {
            'answer': 'some text',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
        }])

    def test_record_many_answers(self) -> None:
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
        # Ruling out the possibility of None for mypy type checking.
        assert state_answers is not None
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
            'params': {},
             'answer_str': None,
            'rule_spec_str': None
        }, {
            'answer': 'answer ccc',
            'time_spent_in_sec': 3.0,
            'answer_group_index': 1,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
        }, {
            'answer': 'answer bbbbb',
            'time_spent_in_sec': 7.5,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
        }])

    def test_record_answers_exceeding_one_shard(self) -> None:
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
            # Ruling out the possibility of None for mypy type checking.
            assert master_model is not None
            self.assertGreater(master_model.shard_count, 0)

            # The order of the answers returned depends on the size of the
            # answers.
            state_answers = stats_services.get_state_answers(
                self.EXP_ID, self.exploration.version,
                self.exploration.init_state_name)
            # Ruling out the possibility of None for mypy type checking.
            assert state_answers is not None
            self.assertEqual(state_answers.exploration_id, 'exp_id0')
            self.assertEqual(state_answers.exploration_version, 1)
            self.assertEqual(
                state_answers.state_name, feconf.DEFAULT_INIT_STATE_NAME)
            self.assertEqual(state_answers.interaction_id, 'TextInput')
            self.assertEqual(
                len(state_answers.get_submitted_answer_dict_list()), 600)

    def test_record_many_answers_with_preexisting_entry(self) -> None:
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
        # Ruling out the possibility of None for mypy type checking.
        assert state_answers is not None
        self.assertEqual(state_answers.get_submitted_answer_dict_list(), [{
            'answer': '1 answer',
            'time_spent_in_sec': 1.0,
            'answer_group_index': 0,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'a_session_id_val',
            'interaction_id': 'TextInput',
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
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
        # Ruling out the possibility of None for mypy type checking.
        assert state_answers is not None
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
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
        }, {
            'answer': 'answer aaa',
            'time_spent_in_sec': 10.0,
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
        }, {
            'answer': 'answer ccccc',
            'time_spent_in_sec': 3.0,
            'answer_group_index': 1,
            'rule_spec_index': 1,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
        }, {
            'answer': 'answer bbbbbbb',
            'time_spent_in_sec': 7.5,
            'answer_group_index': 1,
            'rule_spec_index': 0,
            'classification_categorization': 'explicit',
            'session_id': 'session_id_v',
            'interaction_id': 'TextInput',
            'params': {},
            'answer_str': None,
            'rule_spec_str': None
        }])


class SampleAnswerTests(test_utils.GenericTestBase):
    """Tests for functionality related to retrieving sample answers."""

    EXP_ID: Final = 'exp_id0'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')

    def test_at_most_100_answers_returned_even_if_there_are_lots(self) -> None:
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

    def test_exactly_100_answers_returned_if_main_shard_has_100_answers(
        self
    ) -> None:
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

    def test_all_answers_returned_if_main_shard_has_few_answers(self) -> None:
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

    def test_only_sample_answers_in_main_shard_returned(self) -> None:
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
        self.assertGreater(model.shard_count, 1)

        # Verify that the list of sample answers returned contains fewer than
        # 100 answers, although a total of 100 answers were submitted.
        sample_answers = stats_services.get_sample_answers(
            self.EXP_ID, self.exploration.version,
            self.exploration.init_state_name)
        self.assertLess(len(sample_answers), 100)

    def test_get_sample_answers_with_invalid_exp_id(self) -> None:
        sample_answers = stats_services.get_sample_answers(
            'invalid_exp_id', self.exploration.version,
            self.exploration.init_state_name)

        self.assertEqual(sample_answers, [])

    def test_raises_error_while_fetching_exp_issues_with_invalid_id_and_strict(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'No ExplorationIssues model found'
        ):
            stats_services.get_exp_issues('Invalid_id', 0, strict=True)


class LearnerAnswerDetailsServicesTest(test_utils.GenericTestBase):
    """Test for services related to learner answer details."""

    def setUp(self) -> None:
        super().setUp()
        self.exp_id = 'exp_id1'
        self.state_name = 'intro'
        self.question_id = 'q_id_1'
        self.interaction_id = 'TextInput'
        self.state_reference_exploration = (
            stats_models.LearnerAnswerDetailsModel.
            get_state_reference_for_exploration(
                self.exp_id, self.state_name))
        self.state_reference_question = (
            stats_models.LearnerAnswerDetailsModel.
            get_state_reference_for_question(
                self.question_id))
        self.learner_answer_details_model_exploration = (
            stats_models.LearnerAnswerDetailsModel.create_model_instance(
                feconf.ENTITY_TYPE_EXPLORATION,
                self.state_reference_exploration, self.interaction_id, [],
                feconf.CURRENT_LEARNER_ANSWER_INFO_SCHEMA_VERSION, 0))
        self.learner_answer_details_model_question = (
            stats_models.LearnerAnswerDetailsModel.create_model_instance(
                feconf.ENTITY_TYPE_QUESTION,
                self.state_reference_question, self.interaction_id, [],
                feconf.CURRENT_LEARNER_ANSWER_INFO_SCHEMA_VERSION, 0))

    def test_get_state_reference_for_exp_raises_error_for_fake_exp_id(
        self
    ) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.get_user_id_from_email(self.OWNER_EMAIL)
        with self.assertRaisesRegex(
            Exception, 'Entity .* not found'):
            stats_services.get_state_reference_for_exploration(
                'fake_exp', 'state_name')

    def test_get_state_reference_for_exp_raises_error_for_invalid_state_name(
        self
    ) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        exploration = self.save_new_default_exploration(
            self.exp_id, owner_id)
        self.assertEqual(list(exploration.states.keys()), ['Introduction'])
        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'No state with the given state name was found'):
            stats_services.get_state_reference_for_exploration(
                self.exp_id, 'state_name')

    def test_get_state_reference_for_exp_for_valid_exp_id_and_state_name(
        self
    ) -> None:
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        exploration = self.save_new_default_exploration(
            self.exp_id, owner_id)
        self.assertEqual(list(exploration.states.keys()), ['Introduction'])
        state_reference = (
            stats_services.get_state_reference_for_exploration(
                self.exp_id, 'Introduction'))
        self.assertEqual(state_reference, 'exp_id1:Introduction')

    def test_get_state_reference_for_question_with_invalid_question_id(
        self
    ) -> None:
        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'No question with the given question id exists'):
            stats_services.get_state_reference_for_question(
                'fake_question_id')

    def test_get_state_reference_for_question_with_valid_question_id(
        self
    ) -> None:
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        editor_id = self.get_user_id_from_email(
            self.EDITOR_EMAIL)
        question_id = question_services.get_new_question_id()
        question = self.save_new_question(
            question_id, editor_id,
            self._create_valid_question_data('ABC'), ['skill_1'])
        self.assertNotEqual(question, None)
        state_reference = (
            stats_services.get_state_reference_for_question(question_id))
        self.assertEqual(state_reference, question_id)

    def test_update_learner_answer_details(self) -> None:
        answer = 'This is my answer'
        answer_details = 'This is my answer details'
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_answer_details is not None
        self.assertEqual(
            len(learner_answer_details.learner_answer_info_list), 0)
        stats_services.record_learner_answer_info(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration,
            self.interaction_id, answer, answer_details)
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_answer_details is not None
        self.assertEqual(
            len(learner_answer_details.learner_answer_info_list), 1)

        answer = 'My answer'
        answer_details = 'My answer details'
        stats_services.record_learner_answer_info(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration,
            self.interaction_id, answer, answer_details)
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_answer_details is not None
        self.assertEqual(
            len(learner_answer_details.learner_answer_info_list), 2)

    def test_delete_learner_answer_info(self) -> None:
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_answer_details is not None
        self.assertEqual(
            len(learner_answer_details.learner_answer_info_list), 0)
        answer = 'This is my answer'
        answer_details = 'This is my answer details'
        stats_services.record_learner_answer_info(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration,
            self.interaction_id, answer, answer_details)
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_answer_details is not None
        self.assertEqual(
            len(learner_answer_details.learner_answer_info_list), 1)
        learner_answer_info_id = (
            learner_answer_details.learner_answer_info_list[0].id)
        stats_services.delete_learner_answer_info(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration,
            learner_answer_info_id)
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_answer_details is not None
        self.assertEqual(
            len(learner_answer_details.learner_answer_info_list), 0)

    def test_delete_learner_answer_info_with_invalid_input(self) -> None:
        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'No learner answer details found with the given state reference'):
            stats_services.delete_learner_answer_info(
                feconf.ENTITY_TYPE_EXPLORATION, 'expID:stateName', 'id_1')

    def test_delete_learner_answer_info_with_unknown_learner_answer_info_id(
        self
    ) -> None:
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_answer_details is not None
        self.assertEqual(
            len(learner_answer_details.learner_answer_info_list), 0)
        answer = 'This is my answer'
        answer_details = 'This is my answer details'
        stats_services.record_learner_answer_info(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration,
            self.interaction_id, answer, answer_details)
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_answer_details is not None
        self.assertEqual(
            len(learner_answer_details.learner_answer_info_list), 1)
        learner_answer_info_id = 'id_1'
        with self.assertRaisesRegex(
            Exception, 'Learner answer info with the given id not found'):
            stats_services.delete_learner_answer_info(
                feconf.ENTITY_TYPE_EXPLORATION,
                self.state_reference_exploration, learner_answer_info_id)

    def test_update_state_reference(self) -> None:
        new_state_reference = 'exp_id_2:state_name_2'
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_answer_details is not None
        self.assertNotEqual(
            learner_answer_details.state_reference, new_state_reference)
        stats_services.update_state_reference(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration,
            new_state_reference)
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, new_state_reference)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_answer_details is not None
        self.assertEqual(
            learner_answer_details.state_reference, new_state_reference)

    def test_new_learner_answer_details_is_created(self) -> None:
        state_reference = 'exp_id_2:state_name_2'
        interaction_id = 'GraphInput'
        answer = 'Hello World'
        answer_details = 'Hello Programmer'
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, state_reference)
        self.assertEqual(learner_answer_details, None)
        stats_services.record_learner_answer_info(
            feconf.ENTITY_TYPE_EXPLORATION, state_reference,
            interaction_id, answer, answer_details)
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, state_reference)
        # Ruling out the possibility of None for mypy type checking.
        assert learner_answer_details is not None
        self.assertNotEqual(learner_answer_details, None)
        self.assertEqual(
            learner_answer_details.state_reference, state_reference)
        self.assertEqual(learner_answer_details.interaction_id, interaction_id)
        self.assertEqual(
            len(learner_answer_details.learner_answer_info_list), 1)

    def test_update_with_invalid_input_raises_exception(self) -> None:
        with self.assertRaisesRegex(
            utils.InvalidInputException,
            'No learner answer details found with the given state reference'):
            stats_services.update_state_reference(
                feconf.ENTITY_TYPE_EXPLORATION, 'expID:stateName',
                'newexp:statename')

    def test_delete_learner_answer_details_for_exploration_state(self) -> None:
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration)
        self.assertNotEqual(learner_answer_details, None)
        stats_services.delete_learner_answer_details_for_exploration_state(
            self.exp_id, self.state_name)
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_EXPLORATION, self.state_reference_exploration)
        self.assertEqual(learner_answer_details, None)

    def test_delete_learner_answer_details_for_question_state(self) -> None:
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_QUESTION, self.state_reference_question)
        self.assertNotEqual(learner_answer_details, None)
        stats_services.delete_learner_answer_details_for_question_state(
            self.question_id)
        learner_answer_details = stats_services.get_learner_answer_details(
            feconf.ENTITY_TYPE_QUESTION, self.state_reference_question)
        self.assertEqual(learner_answer_details, None)
