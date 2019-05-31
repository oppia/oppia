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

import logging
import types

from core.domain import exp_domain
from core.platform import models
from core.tests import test_utils
import feconf

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


class AnswerSubmittedEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the AnswerSubmittedEventLogEntryModel class."""

    def test_create_and_get_event_models(self):
        event_id = (
            stats_models.AnswerSubmittedEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', 0.0, True))

        event_model = stats_models.AnswerSubmittedEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exp_id, 'exp_id1')
        self.assertEqual(event_model.exp_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')
        self.assertEqual(event_model.time_spent_in_state_secs, 0.0)
        self.assertEqual(event_model.is_feedback_useful, True)


class StateCounterModelTests(test_utils.GenericTestBase):

    def test_stat_model_gets_created(self):
        model_instance = stats_models.StateCounterModel.get_or_create(
            'exp_id1', 'state_name')
        model_instance.first_entry_count = 1
        model_instance.subsequent_entries_count = 2
        model_instance.resolved_answer_count = 3
        model_instance.active_answer_count = 4
        model_instance.put()

        self.assertEqual(model_instance.id, 'exp_id1.state_name')
        self.assertEqual(model_instance.first_entry_count, 1)
        self.assertEqual(model_instance.subsequent_entries_count, 2)
        self.assertEqual(model_instance.resolved_answer_count, 3)
        self.assertEqual(model_instance.active_answer_count, 4)

    def test_get_stat_model(self):
        model = stats_models.StateCounterModel(id='exp_id1.state_name')
        model.first_entry_count = 1
        model.subsequent_entries_count = 2
        model.resolved_answer_count = 3
        model.active_answer_count = 4
        model.put()

        model_instance = stats_models.StateCounterModel.get_or_create(
            'exp_id1', 'state_name')

        self.assertEqual(model_instance.id, 'exp_id1.state_name')
        self.assertEqual(model_instance.first_entry_count, 1)
        self.assertEqual(model_instance.subsequent_entries_count, 2)
        self.assertEqual(model_instance.resolved_answer_count, 3)
        self.assertEqual(model_instance.active_answer_count, 4)


class ExplorationAnnotationsModelTests(test_utils.GenericTestBase):

    def test_create_and_get_models(self):
        stats_models.ExplorationAnnotationsModel.create(
            'exp_id1', '1', 5, 4, {})

        model1 = stats_models.ExplorationAnnotationsModel.get('exp_id1:1')

        self.assertEqual(model1.exploration_id, 'exp_id1')
        self.assertEqual(model1.version, '1')
        self.assertEqual(model1.num_starts, 5)
        self.assertEqual(model1.num_completions, 4)
        self.assertEqual(model1.state_hit_counts, {})

    def test_get_versions(self):
        stats_models.ExplorationAnnotationsModel.create(
            'exp_id1', '1', 5, 4, {})
        stats_models.ExplorationAnnotationsModel.create(
            'exp_id1', '2', 5, 4, {})

        versions = stats_models.ExplorationAnnotationsModel.get_versions(
            'exp_id1')

        self.assertEqual(sorted(versions), ['1', '2'])

        # Test get_version for invalid exploration id.
        versions = stats_models.ExplorationAnnotationsModel.get_versions(
            'invalid_exp_id')

        self.assertEqual(versions, [])


class StateAnswersModelTests(test_utils.GenericTestBase):

    def test_shard_count_with_newly_added_shards(self):

        submitted_answer_list = [{'answer': 'value'}]

        stats_models.StateAnswersModel.insert_submitted_answers(
            'exp_id', 1, 'state_name', 'interaction_id',
            submitted_answer_list)

        model1 = stats_models.StateAnswersModel.get_master_model(
            'exp_id', 1, 'state_name')

        # Ensure we got the correct model.
        self.assertEqual(model1.exploration_id, 'exp_id')
        self.assertEqual(model1.exploration_version, 1)
        self.assertEqual(model1.state_name, 'state_name')
        self.assertEqual(model1.submitted_answer_list, submitted_answer_list)
        self.assertEqual(model1.shard_count, 0)

        # Use a smaller max answer list size so fewer answers are needed to
        # exceed a shard. This will increase the 'shard_count'.
        with self.swap(
            stats_models.StateAnswersModel, '_MAX_ANSWER_LIST_BYTE_SIZE', 1):
            stats_models.StateAnswersModel.insert_submitted_answers(
                'exp_id', 1, 'state_name', 'interaction_id',
                submitted_answer_list)

            model1 = stats_models.StateAnswersModel.get_master_model(
                'exp_id', 1, 'state_name')

            self.assertEqual(model1.shard_count, 1)

            stats_models.StateAnswersModel.insert_submitted_answers(
                'exp_id', 1, 'state_name', 'interaction_id',
                submitted_answer_list)

            model1 = stats_models.StateAnswersModel.get_master_model(
                'exp_id', 1, 'state_name')

            self.assertEqual(model1.shard_count, 2)

        # 'shard_count' will not increase as number of answers are less than
        # the max answer list size.
        stats_models.StateAnswersModel.insert_submitted_answers(
            'exp_id', 1, 'state_name', 'interaction_id',
            submitted_answer_list)

        model1 = stats_models.StateAnswersModel.get_master_model(
            'exp_id', 1, 'state_name')

        self.assertEqual(model1.shard_count, 2)


class StateAnswersCalcOutputModelTests(test_utils.GenericTestBase):

    def test_create_and_get_models(self):

        stats_models.StateAnswersCalcOutputModel.create_or_update(
            'exp_id', '1', 'state_name', '', 'calculation_id', '', {})

        model1 = stats_models.StateAnswersCalcOutputModel.get_model(
            'exp_id', '1', 'state_name', 'calculation_id')

        self.assertEqual(model1.exploration_id, 'exp_id')
        self.assertEqual(model1.exploration_version, '1')
        self.assertEqual(model1.state_name, 'state_name')
        self.assertEqual(model1.calculation_id, 'calculation_id')

        # Model with 'invalid_exp_id' does not exist.
        model1 = stats_models.StateAnswersCalcOutputModel.get_model(
            'invalid_exp_id', '1', 'state_name', 'calculation_id')

        self.assertIsNone(model1)

    def test_raise_exception_with_large_calculation_output(self):

        observed_log_messages = []

        def _mock_logging_function(msg, *_):
            """Mocks logging.exception."""
            observed_log_messages.append(msg)

        logging_swap = self.swap(logging, 'exception', _mock_logging_function)

        # This swaps ndb.model.put() to raise an Exception. It is required to
        # test against large values of calculation_output.
        put_swap = self.swap(
            stats_models.StateAnswersCalcOutputModel, 'put',
            lambda: (_ for _ in ()).throw(Exception()))

        with put_swap, logging_swap:
            stats_models.StateAnswersCalcOutputModel.create_or_update(
                'exp_id', '1', 'state_name', '', 'calculation_id', '', '')

            self.assertEqual(len(observed_log_messages), 1)
            self.assertEqual(
                observed_log_messages[0],
                (
                    'Failed to add calculation output for exploration ID '
                    'exp_id, version 1, state name state_name, and '
                    'calculation ID calculation_id'
                )
            )


class ExplorationActualStartEventLogEntryModelUnitTests(
        test_utils.GenericTestBase):
    """Test the ExplorationActualStartEventLogEntryModel class."""

    def test_create_and_get_event_models(self):
        event_id = (
            stats_models.ExplorationActualStartEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1'))

        event_model = stats_models.ExplorationActualStartEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exp_id, 'exp_id1')
        self.assertEqual(event_model.exp_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')


class SolutionHitEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the SolutionHitEventLogEntryModel class."""

    def test_create_and_get_event_models(self):
        event_id = (
            stats_models.SolutionHitEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', 0.0))

        event_model = stats_models.SolutionHitEventLogEntryModel.get(
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
            stats_models.StateHitEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', {},
                feconf.PLAY_TYPE_NORMAL))

        event_model = stats_models.StateHitEventLogEntryModel.get(
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
            stats_models.StateCompleteEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', 0.0))

        event_model = stats_models.StateCompleteEventLogEntryModel.get(
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
            stats_models.LeaveForRefresherExplorationEventLogEntryModel.create(
                'exp_id1', 'exp_id2', 1, 'state_name1', 'session_id1', 0.0))

        event_model = (
            stats_models.LeaveForRefresherExplorationEventLogEntryModel.get(
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
            stats_models.CompleteExplorationEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', 0.0, {},
                feconf.PLAY_TYPE_NORMAL))

        event_model = stats_models.CompleteExplorationEventLogEntryModel.get(
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
            stats_models.StartExplorationEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1', {},
                feconf.PLAY_TYPE_NORMAL))

        event_model = stats_models.StartExplorationEventLogEntryModel.get(
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
            stats_models.ExplorationStatsModel.create(
                'exp_id1', 1, 0, 0, 0, 0, 0, 0, {}))

        model = stats_models.ExplorationStatsModel.get_model(
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
        stats_models.ExplorationStatsModel.create(
            'exp_id1', 1, 0, 0, 0, 0, 0, 0, {})
        stats_models.ExplorationStatsModel.create(
            'exp_id1', 2, 0, 0, 0, 0, 0, 0, {})
        stats_models.ExplorationStatsModel.create(
            'exp_id2', 1, 0, 0, 0, 0, 0, 0, {})

        exp_version_reference_dicts = [
            exp_domain.ExpVersionReference('exp_id1', 1),
            exp_domain.ExpVersionReference('exp_id1', 2),
            exp_domain.ExpVersionReference('exp_id2', 1)]

        stat_models = stats_models.ExplorationStatsModel.get_multi_stats_models(
            exp_version_reference_dicts)

        self.assertEqual(len(stat_models), 3)
        self.assertEqual(stat_models[0].exp_id, 'exp_id1')
        self.assertEqual(stat_models[0].exp_version, 1)
        self.assertEqual(stat_models[1].exp_id, 'exp_id1')
        self.assertEqual(stat_models[1].exp_version, 2)
        self.assertEqual(stat_models[2].exp_id, 'exp_id2')
        self.assertEqual(stat_models[2].exp_version, 1)


class ExplorationIssuesModelUnitTests(test_utils.GenericTestBase):
    """Test the ExplorationIssuesModel class."""

    def test_create_and_get_exp_issues_model(self):
        model_id = (
            stats_models.ExplorationIssuesModel.create(
                'exp_id1', 1, []))

        model = stats_models.ExplorationIssuesModel.get(model_id)

        self.assertEqual(model.id, model_id)
        self.assertEqual(model.exp_id, 'exp_id1')
        self.assertEqual(model.exp_version, 1)
        self.assertEqual(model.unresolved_issues, [])


class PlaythroughModelUnitTests(test_utils.GenericTestBase):
    """Test the PlaythroughModel class."""

    def test_create_and_get_playthrough_model(self):
        model_id = (
            stats_models.PlaythroughModel.create(
                'exp_id1', 1, 'EarlyQuit', {}, []))

        model = stats_models.PlaythroughModel.get(model_id)

        self.assertEqual(model.id, model_id)
        self.assertEqual(model.exp_id, 'exp_id1')
        self.assertEqual(model.exp_version, 1)
        self.assertEqual(model.issue_type, 'EarlyQuit')
        self.assertEqual(model.issue_customization_args, {})
        self.assertEqual(model.actions, [])

    def test_delete_playthroughs_multi(self):
        model_id1 = (
            stats_models.PlaythroughModel.create(
                'exp_id1', 1, 'EarlyQuit', {}, []))
        model_id2 = (
            stats_models.PlaythroughModel.create(
                'exp_id1', 1, 'EarlyQuit', {}, []))

        instance_ids = [model_id1, model_id2]
        stats_models.PlaythroughModel.delete_playthroughs_multi(instance_ids)

        instances = stats_models.PlaythroughModel.get_multi(instance_ids)
        self.assertEqual(instances, [None, None])

    def test_raise_exception_by_mocking_collision(self):
        with self.assertRaisesRegexp(
            Exception, 'The id generator for PlaythroughModel is producing too '
            'many collisions.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                stats_models.PlaythroughModel, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    stats_models.PlaythroughModel)):
                stats_models.PlaythroughModel.create(
                    'exp_id1', 1, 'EarlyQuit', {}, [])
