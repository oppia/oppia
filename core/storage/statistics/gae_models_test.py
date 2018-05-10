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

"""Tests for Oppia statistics models."""

from core.domain import exp_domain
from core.platform import models
from core.tests import test_utils
import feconf

(stat_models,) = models.Registry.import_models([models.NAMES.statistics])


class AnswerSubmittedEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the AnswerSubmittedEventLogEntryModel class."""

    def test_create_and_get_event_models(self):
        event_id = (
            stat_models.AnswerSubmittedEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', 0.0, True))

        event_model = stat_models.AnswerSubmittedEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exp_id, 'exp_id1')
        self.assertEqual(event_model.exp_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')
        self.assertEqual(event_model.time_spent_in_state_secs, 0.0)
        self.assertEqual(event_model.is_feedback_useful, True)


class ExplorationActualStartEventLogEntryModelUnitTests(
        test_utils.GenericTestBase):
    """Test the ExplorationActualStartEventLogEntryModel class."""

    def test_create_and_get_event_models(self):
        event_id = (
            stat_models.ExplorationActualStartEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1'))

        event_model = stat_models.ExplorationActualStartEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exp_id, 'exp_id1')
        self.assertEqual(event_model.exp_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')


class SolutionHitEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the SolutionHitEventLogEntryModel class."""

    def test_create_and_get_event_models(self):
        event_id = (
            stat_models.SolutionHitEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', 0.0))

        event_model = stat_models.SolutionHitEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exp_id, 'exp_id1')
        self.assertEqual(event_model.exp_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')
        self.assertEqual(event_model.time_spent_in_state_secs, 0.0)


class StateHitEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the StateHitEventLogEntryModel class."""

    def test_create_and_get_event_models(self):
        event_id = (
            stat_models.StateHitEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', {},
                feconf.PLAY_TYPE_NORMAL))

        event_model = stat_models.StateHitEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exploration_id, 'exp_id1')
        self.assertEqual(event_model.exploration_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')
        self.assertEqual(event_model.play_type, feconf.PLAY_TYPE_NORMAL)


class StateCompleteEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the StateCompleteEventLogEntryModel class."""

    def test_create_and_get_event_models(self):
        event_id = (
            stat_models.StateCompleteEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', 0.0))

        event_model = stat_models.StateCompleteEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exp_id, 'exp_id1')
        self.assertEqual(event_model.exp_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')
        self.assertEqual(event_model.time_spent_in_state_secs, 0.0)


class LeaveForRefresherExplorationEventLogEntryModelUnitTests(
        test_utils.GenericTestBase):
    """Test the LeaveForRefresherExplorationEventLogEntryModel class."""

    def test_create_and_get_event_models(self):
        event_id = (
            stat_models.LeaveForRefresherExplorationEventLogEntryModel.create(
                'exp_id1', 'exp_id2', 1, 'state_name1', 'session_id1', 0.0))

        event_model = (
            stat_models.LeaveForRefresherExplorationEventLogEntryModel.get(
                event_id))

        self.assertEqual(event_model.exp_id, 'exp_id1')
        self.assertEqual(event_model.refresher_exp_id, 'exp_id2')
        self.assertEqual(event_model.exp_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')
        self.assertEqual(event_model.time_spent_in_state_secs, 0.0)
        self.assertEqual(
            event_model.event_schema_version,
            feconf.CURRENT_EVENT_MODELS_SCHEMA_VERSION)


class CompleteExplorationEventLogEntryModelUnitTests(
        test_utils.GenericTestBase):
    """Test the CompleteExplorationEventLogEntryModel class."""

    def test_create_and_get_event_models(self):
        event_id = (
            stat_models.CompleteExplorationEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', 0.0, {},
                feconf.PLAY_TYPE_NORMAL))

        event_model = stat_models.CompleteExplorationEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exploration_id, 'exp_id1')
        self.assertEqual(event_model.exploration_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')
        self.assertEqual(event_model.client_time_spent_in_secs, 0.0)
        self.assertEqual(event_model.params, {})
        self.assertEqual(event_model.play_type, feconf.PLAY_TYPE_NORMAL)


class StartExplorationEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the StartExplorationEventLogEntryModel class."""

    def test_create_and_get_event_models(self):
        event_id = (
            stat_models.StartExplorationEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', {},
                feconf.PLAY_TYPE_NORMAL))

        event_model = stat_models.StartExplorationEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exploration_id, 'exp_id1')
        self.assertEqual(event_model.exploration_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')
        self.assertEqual(event_model.params, {})
        self.assertEqual(event_model.play_type, feconf.PLAY_TYPE_NORMAL)


class ExplorationStatsModelUnitTests(test_utils.GenericTestBase):
    """Test the ExplorationStatsModel class."""

    def test_create_and_get_analytics_model(self):
        model_id = (
            stat_models.ExplorationStatsModel.create(
                'exp_id1', 1, 0, 0, 0, 0, 0, 0, {}))

        model = stat_models.ExplorationStatsModel.get_model(
            'exp_id1', 1)

        self.assertEqual(model.id, model_id)
        self.assertEqual(model.exp_id, 'exp_id1')
        self.assertEqual(model.exp_version, 1)
        self.assertEqual(model.num_starts_v1, 0)
        self.assertEqual(model.num_actual_starts_v1, 0)
        self.assertEqual(model.num_completions_v1, 0)
        self.assertEqual(model.num_starts_v2, 0)
        self.assertEqual(model.num_actual_starts_v2, 0)
        self.assertEqual(model.num_completions_v2, 0)
        self.assertEqual(model.state_stats_mapping, {})

    def test_get_multi_stats_models(self):
        stat_models.ExplorationStatsModel.create(
            'exp_id1', 1, 0, 0, 0, 0, 0, 0, {})
        stat_models.ExplorationStatsModel.create(
            'exp_id1', 2, 0, 0, 0, 0, 0, 0, {})
        stat_models.ExplorationStatsModel.create(
            'exp_id2', 1, 0, 0, 0, 0, 0, 0, {})

        exp_version_reference_dicts = [
            exp_domain.ExpVersionReference('exp_id1', 1),
            exp_domain.ExpVersionReference('exp_id1', 2),
            exp_domain.ExpVersionReference('exp_id2', 1)]

        stats_models = stat_models.ExplorationStatsModel.get_multi_stats_models(
            exp_version_reference_dicts)

        self.assertEqual(len(stats_models), 3)
        self.assertEqual(stats_models[0].exp_id, 'exp_id1')
        self.assertEqual(stats_models[0].exp_version, 1)
        self.assertEqual(stats_models[1].exp_id, 'exp_id1')
        self.assertEqual(stats_models[1].exp_version, 2)
        self.assertEqual(stats_models[2].exp_id, 'exp_id2')
        self.assertEqual(stats_models[2].exp_version, 1)


class ExplorationIssuesModelUnitTests(test_utils.GenericTestBase):
    """Test the ExplorationIssuesModel class."""

    def test_create_and_get_exp_issues_model(self):
        model_id = (
            stat_models.ExplorationIssuesModel.create(
                'exp_id1', []))

        model = stat_models.ExplorationIssuesModel.get(model_id)

        self.assertEqual(model.id, model_id)
        self.assertEqual(model.unresolved_issues, [])


class PlaythroughModelUnitTests(test_utils.GenericTestBase):
    """Test the PlaythroughModel class."""

    def test_create_and_get_playthrough_model(self):
        model_id = (
            stat_models.PlaythroughModel.create(
                'exp_id1', 1, 'EarlyQuit', {}, [], True))

        model = stat_models.PlaythroughModel.get(model_id)

        self.assertEqual(model.id, model_id)
        self.assertEqual(model.exp_id, 'exp_id1')
        self.assertEqual(model.exp_version, 1)
        self.assertEqual(model.issue_id, 'EarlyQuit')
        self.assertEqual(model.issue_customization_args, {})
        self.assertEqual(model.playthrough_actions, [])
        self.assertEqual(model.is_valid, True)
