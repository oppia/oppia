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

from __future__ import annotations

import types

from core import feconf
from core.domain import exp_domain
from core.domain import stats_domain
from core.platform import models
from core.tests import test_utils

from typing import List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import stats_models

(base_models, stats_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.STATISTICS
])


class StateCounterModelTests(test_utils.GenericTestBase):

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.StateCounterModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_state_counter_model_gets_created(self) -> None:
        # This tests whether get_or_create() can create the model.
        model_instance = stats_models.StateCounterModel.get_or_create(
            'exp_id1', 'state_name')

        self.assertEqual(model_instance.id, 'exp_id1.state_name')
        self.assertEqual(model_instance.first_entry_count, 0)
        self.assertEqual(model_instance.subsequent_entries_count, 0)
        self.assertEqual(model_instance.resolved_answer_count, 0)
        self.assertEqual(model_instance.active_answer_count, 0)

    def test_get_state_counter_model(self) -> None:
        # This tests whether get_or_create() can get/fetch the model when the
        # model is created by creating an instance.
        stats_models.StateCounterModel(id='exp_id1.state_name').put()

        model_instance = stats_models.StateCounterModel.get_or_create(
            'exp_id1', 'state_name')

        self.assertEqual(model_instance.id, 'exp_id1.state_name')
        self.assertEqual(model_instance.first_entry_count, 0)
        self.assertEqual(model_instance.subsequent_entries_count, 0)
        self.assertEqual(model_instance.resolved_answer_count, 0)
        self.assertEqual(model_instance.active_answer_count, 0)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.StateCounterModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'first_entry_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'subsequent_entries_count':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'resolved_answer_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'active_answer_count': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.StateCounterModel.get_export_policy(),
            expected_export_policy_dict
        )


class AnswerSubmittedEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the AnswerSubmittedEventLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.AnswerSubmittedEventLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_event_models(self) -> None:
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.AnswerSubmittedEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_spent_in_state_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'is_feedback_useful': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.AnswerSubmittedEventLogEntryModel.get_export_policy(),
            expected_export_policy_dict
        )


class ExplorationActualStartEventLogEntryModelUnitTests(
        test_utils.GenericTestBase):
    """Test the ExplorationActualStartEventLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.ExplorationActualStartEventLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_event_models(self) -> None:
        event_id = (
            stats_models.ExplorationActualStartEventLogEntryModel.create(
                'exp_id1', 1, 'state_name1', 'session_id1'))

        event_model = stats_models.ExplorationActualStartEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exp_id, 'exp_id1')
        self.assertEqual(event_model.exp_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.ExplorationActualStartEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.ExplorationActualStartEventLogEntryModel
                .get_export_policy(),
            expected_export_policy_dict
        )


class SolutionHitEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the SolutionHitEventLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.SolutionHitEventLogEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_event_models(self) -> None:
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.SolutionHitEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_spent_in_state_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.SolutionHitEventLogEntryModel.get_export_policy(),
            expected_export_policy_dict
        )


class StartExplorationEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the StartExplorationEventLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.StartExplorationEventLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_event_models(self) -> None:
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.StartExplorationEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'client_time_spent_in_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'params': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'play_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.StartExplorationEventLogEntryModel.get_export_policy(),
            expected_export_policy_dict
        )


class MaybeLeaveExplorationEventLogEntryModelUnitTests(
        test_utils.GenericTestBase):
    """Test the MaybeLeaveExplorationEventLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.MaybeLeaveExplorationEventLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_event_models(self) -> None:
        event_id = stats_models.MaybeLeaveExplorationEventLogEntryModel.create(
            'exp_id1', 1, 'state_name1', 'session_id1', 1.0, {},
            feconf.PLAY_TYPE_NORMAL)
        event_model = stats_models.MaybeLeaveExplorationEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exploration_id, 'exp_id1')
        self.assertEqual(event_model.exploration_version, 1)
        self.assertEqual(event_model.state_name, 'state_name1')
        self.assertEqual(event_model.session_id, 'session_id1')
        self.assertEqual(event_model.params, {})
        self.assertEqual(event_model.play_type, feconf.PLAY_TYPE_NORMAL)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.MaybeLeaveExplorationEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'client_time_spent_in_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'params': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'play_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.MaybeLeaveExplorationEventLogEntryModel
                .get_export_policy(),
            expected_export_policy_dict
        )


class CompleteExplorationEventLogEntryModelUnitTests(
        test_utils.GenericTestBase):
    """Test the CompleteExplorationEventLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.CompleteExplorationEventLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_event_models(self) -> None:
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.CompleteExplorationEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'client_time_spent_in_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'params': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'play_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.CompleteExplorationEventLogEntryModel
                .get_export_policy(),
            expected_export_policy_dict
        )


class RateExplorationEventLogEntryModelUnitTests(
        test_utils.GenericTestBase):
    """Test the RateExplorationEventLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.RateExplorationEventLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_event_models(self) -> None:
        event_id = stats_models.RateExplorationEventLogEntryModel.create(
            'exp_id', 'user_id', 2, 1
        )
        event_model = stats_models.RateExplorationEventLogEntryModel.get(
            event_id)

        self.assertEqual(event_model.exploration_id, 'exp_id')
        self.assertEqual(event_model.rating, 2)
        self.assertEqual(event_model.old_rating, 1)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.RateExplorationEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'rating': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'old_rating': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.RateExplorationEventLogEntryModel
                .get_export_policy(),
            expected_export_policy_dict
        )


class StateHitEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the StateHitEventLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.StateHitEventLogEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_event_models(self) -> None:
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.StateHitEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'params': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'play_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.StateHitEventLogEntryModel.get_export_policy(),
            expected_export_policy_dict
        )


class StateCompleteEventLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Test the StateCompleteEventLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.StateCompleteEventLogEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_event_models(self) -> None:
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.StateCompleteEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_spent_in_state_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.StateCompleteEventLogEntryModel.get_export_policy(),
            expected_export_policy_dict
        )


class LeaveForRefresherExplorationEventLogEntryModelUnitTests(
        test_utils.GenericTestBase):
    """Test the LeaveForRefresherExplorationEventLogEntryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.LeaveForRefresherExplorationEventLogEntryModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_event_models(self) -> None:
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

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.LeaveForRefresherExplorationEventLogEntryModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'refresher_exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'session_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'time_spent_in_state_secs':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'event_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.LeaveForRefresherExplorationEventLogEntryModel
                .get_export_policy(),
            expected_export_policy_dict
        )


class ExplorationStatsModelUnitTests(test_utils.GenericTestBase):
    """Test the ExplorationStatsModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.ExplorationStatsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_analytics_model(self) -> None:
        model_id = (
            stats_models.ExplorationStatsModel.create(
                'exp_id1', 1, 0, 0, 0, 0, 0, 0, {}))

        model = stats_models.ExplorationStatsModel.get_model(
            'exp_id1', 1)

        # Ruling out the possibility of None for mypy type checking.
        assert model is not None
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

    def test_create_analytics_model(self) -> None:
        model_id = stats_models.ExplorationStatsModel.create(
            'exp_id1', 1, 0, 0, 0, 0, 0, 0, {})
        fetched_model = stats_models.ExplorationStatsModel.get_model(
            'exp_id1', 1)

        # Ruling out the possibility of None for mypy type checking.
        assert fetched_model is not None
        self.assertEqual(fetched_model.id, model_id)
        self.assertEqual(fetched_model.exp_id, 'exp_id1')
        self.assertEqual(fetched_model.exp_version, 1)
        self.assertEqual(fetched_model.num_starts_v1, 0)
        self.assertEqual(fetched_model.num_actual_starts_v1, 0)
        self.assertEqual(fetched_model.num_completions_v1, 0)
        self.assertEqual(fetched_model.num_starts_v2, 0)
        self.assertEqual(fetched_model.num_actual_starts_v2, 0)
        self.assertEqual(fetched_model.num_completions_v2, 0)
        self.assertEqual(fetched_model.state_stats_mapping, {})

    def test_get_multi_stats_models(self) -> None:
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

        # Ruling out the possibility of None for mypy type checking.
        assert stat_models[0] is not None
        assert stat_models[1] is not None
        assert stat_models[2] is not None
        self.assertEqual(len(stat_models), 3)
        self.assertEqual(stat_models[0].exp_id, 'exp_id1')
        self.assertEqual(stat_models[0].exp_version, 1)
        self.assertEqual(stat_models[1].exp_id, 'exp_id1')
        self.assertEqual(stat_models[1].exp_version, 2)
        self.assertEqual(stat_models[2].exp_id, 'exp_id2')
        self.assertEqual(stat_models[2].exp_version, 1)

    def test_get_multi_versions(self) -> None:
        stats_models.ExplorationStatsModel.create(
            'exp_id1', 1, 0, 0, 0, 0, 0, 0, {})
        stats_models.ExplorationStatsModel.create(
            'exp_id1', 2, 0, 0, 0, 0, 0, 0, {})

        stat_models = stats_models.ExplorationStatsModel.get_multi_versions(
            'exp_id1', [1, 2]
        )

        assert stat_models[0] is not None
        assert stat_models[1] is not None
        self.assertEqual(len(stat_models), 2)
        self.assertEqual(stat_models[0].exp_id, 'exp_id1')
        self.assertEqual(stat_models[0].exp_version, 1)
        self.assertEqual(stat_models[1].exp_id, 'exp_id1')
        self.assertEqual(stat_models[1].exp_version, 2)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.ExplorationStatsModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_starts_v1': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_starts_v2': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_actual_starts_v1': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_actual_starts_v2': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_completions_v1': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_completions_v2': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_stats_mapping': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.ExplorationStatsModel.get_export_policy(),
            expected_export_policy_dict
        )


class ExplorationIssuesModelUnitTests(test_utils.GenericTestBase):
    """Test the ExplorationIssuesModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.ExplorationIssuesModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_exp_issues_model(self) -> None:
        model_id = (
            stats_models.ExplorationIssuesModel.create(
                'exp_id1', 1, []))

        model = stats_models.ExplorationIssuesModel.get(model_id)

        self.assertEqual(model.id, model_id)
        self.assertEqual(model.exp_id, 'exp_id1')
        self.assertEqual(model.exp_version, 1)
        self.assertEqual(model.unresolved_issues, [])

    def test_get_exploration_issues_model(self) -> None:
        model_id = (
            stats_models.ExplorationIssuesModel.create(
                'exp_id1', 1, []))

        model = stats_models.ExplorationIssuesModel.get_model('exp_id1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert model is not None
        self.assertEqual(model.id, model_id)
        self.assertEqual(model.exp_id, 'exp_id1')
        self.assertEqual(model.exp_version, 1)
        self.assertEqual(model.unresolved_issues, [])

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.ExplorationIssuesModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'unresolved_issues': base_models.EXPORT_POLICY.NOT_APPLICABLE,
        }
        self.assertEqual(
            stats_models.ExplorationIssuesModel.get_export_policy(),
            expected_export_policy_dict
        )


class PlaythroughModelUnitTests(test_utils.GenericTestBase):
    """Test the PlaythroughModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.PlaythroughModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_playthrough_model(self) -> None:
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

    def test_create_raises_error_when_many_id_collisions_occur(self) -> None:
        # Swap dependent method get_by_id to simulate collision every time.
        get_by_id_swap = self.swap(
            stats_models.PlaythroughModel, 'get_by_id', types.MethodType(
                lambda _, __: True, stats_models.PlaythroughModel))

        assert_raises_regexp_context_manager = self.assertRaisesRegex(
            Exception, 'The id generator for PlaythroughModel is producing too '
            'many collisions.')

        with assert_raises_regexp_context_manager, get_by_id_swap:
            stats_models.PlaythroughModel.create(
                'exp_id1', 1, 'EarlyQuit', {}, [])

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.PlaythroughModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'issue_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'issue_customization_args': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'actions': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.PlaythroughModel.get_export_policy(),
            expected_export_policy_dict
        )


class LearnerAnswerDetailsModelUnitTests(test_utils.GenericTestBase):
    """Tests the LearnerAnswerDetailsModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.LearnerAnswerDetailsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_state_reference_for_exploration(self) -> None:
        exp_id_1 = 'expid1'
        state_name_1 = 'intro'
        state_reference_1 = (
            stats_models.LearnerAnswerDetailsModel.get_state_reference_for_exploration(exp_id_1, state_name_1)) # pylint: disable=line-too-long
        self.assertEqual(state_reference_1, 'expid1:intro')
        exp_id_2 = 'exp_id_2'
        state_name_2 = 'first state'
        state_reference_2 = (
            stats_models.LearnerAnswerDetailsModel.get_state_reference_for_exploration(exp_id_2, state_name_2)) # pylint: disable=line-too-long
        self.assertEqual(state_reference_2, 'exp_id_2:first state')
        exp_id_3 = 'exp id 1.2.3'
        state_name_3 = 'this_is first_state version 1.1'
        state_reference_3 = (
            stats_models.LearnerAnswerDetailsModel.get_state_reference_for_exploration(exp_id_3, state_name_3)) # pylint: disable=line-too-long
        self.assertEqual(
            state_reference_3, 'exp id 1.2.3:this_is first_state version 1.1')
        exp_id_4 = '123'
        state_name_4 = u'टेक्स्ट'
        state_reference_4 = (
            stats_models.LearnerAnswerDetailsModel.get_state_reference_for_exploration(exp_id_4, state_name_4)) # pylint: disable=line-too-long
        self.assertEqual(
            state_reference_4, '123:%s' % (state_name_4))
        exp_id_5 = '1234'
        state_name_5 = u'Klüft'
        state_reference_5 = (
            stats_models.LearnerAnswerDetailsModel.get_state_reference_for_exploration(exp_id_5, state_name_5)) # pylint: disable=line-too-long
        self.assertEqual(
            state_reference_5, '1234:%s' % (state_name_5))

    def test_get_state_reference_for_question(self) -> None:
        question_id_1 = 'first question'
        state_reference_1 = (
            stats_models.LearnerAnswerDetailsModel.get_state_reference_for_question(question_id_1)) # pylint: disable=line-too-long
        self.assertEqual(state_reference_1, 'first question')
        question_id_2 = 'first.question'
        state_reference_2 = (
            stats_models.LearnerAnswerDetailsModel.get_state_reference_for_question(question_id_2)) # pylint: disable=line-too-long
        self.assertEqual(state_reference_2, 'first.question')

    def test_get_instance_id(self) -> None:
        state_reference = 'exp_id:state_name'
        entity_type = feconf.ENTITY_TYPE_EXPLORATION
        expected_instance_id = 'exploration:exp_id:state_name'
        instance_id = stats_models.LearnerAnswerDetailsModel.get_instance_id(
            entity_type, state_reference)
        self.assertEqual(instance_id, expected_instance_id)

    def test_create_model_instance(self) -> None:
        # Test to create model instance for exploration state.
        state_reference = 'exp_id:state_name'
        entity_type = feconf.ENTITY_TYPE_EXPLORATION
        interaction_id = 'TextInput'
        learner_answer_info_list: List[stats_domain.LearnerAnswerInfo] = []
        learner_answer_info_schema_version = (
            feconf.CURRENT_LEARNER_ANSWER_INFO_SCHEMA_VERSION)
        accumulated_answer_info_json_size_bytes = 40000
        stats_models.LearnerAnswerDetailsModel.create_model_instance(
            entity_type, state_reference, interaction_id,
            learner_answer_info_list, learner_answer_info_schema_version,
            accumulated_answer_info_json_size_bytes)
        model_instance = (
            stats_models.LearnerAnswerDetailsModel.get_model_instance(
                feconf.ENTITY_TYPE_EXPLORATION, state_reference))
        # Ruling out the possibility of None for mypy type checking.
        assert model_instance is not None
        self.assertEqual(model_instance.id, 'exploration:exp_id:state_name')
        self.assertEqual(model_instance.state_reference, state_reference)
        self.assertEqual(
            model_instance.entity_type, feconf.ENTITY_TYPE_EXPLORATION)
        self.assertEqual(model_instance.learner_answer_info_list, [])

        # Test to create model instance for question state.
        state_reference = 'question_id'
        entity_type = feconf.ENTITY_TYPE_QUESTION
        interaction_id = 'TextInput'
        learner_answer_info_list_2: List[stats_domain.LearnerAnswerInfo] = []
        learner_answer_info_schema_version = (
            feconf.CURRENT_LEARNER_ANSWER_INFO_SCHEMA_VERSION)
        accumulated_answer_info_json_size_bytes = 40000
        stats_models.LearnerAnswerDetailsModel.create_model_instance(
            entity_type, state_reference, interaction_id,
            learner_answer_info_list_2, learner_answer_info_schema_version,
            accumulated_answer_info_json_size_bytes)
        model_instance = (
            stats_models.LearnerAnswerDetailsModel.get_model_instance(
                feconf.ENTITY_TYPE_QUESTION, state_reference))
        # Ruling out the possibility of None for mypy type checking.
        assert model_instance is not None
        self.assertEqual(model_instance.state_reference, state_reference)
        self.assertEqual(
            model_instance.entity_type, feconf.ENTITY_TYPE_QUESTION)
        self.assertEqual(model_instance.learner_answer_info_list, [])

    def test_get_model_instance_returns_none(self) -> None:
        model_instance = (
            stats_models.LearnerAnswerDetailsModel.get_model_instance(
                feconf.ENTITY_TYPE_QUESTION, 'expID:stateName'))
        self.assertEqual(model_instance, None)

    def test_save_and_get_model_instance_for_unicode_state_names(self) -> None:
        exp_id = '123'
        state_name = u'टेक्स्ट'
        state_reference = (
            stats_models.LearnerAnswerDetailsModel.get_state_reference_for_exploration(exp_id, state_name)) # pylint: disable=line-too-long
        self.assertEqual(
            state_reference, '123:%s' % (state_name))
        entity_type = feconf.ENTITY_TYPE_EXPLORATION
        interaction_id = 'TextInput'
        learner_answer_info_list: List[stats_domain.LearnerAnswerInfo] = []
        learner_answer_info_schema_version = (
            feconf.CURRENT_LEARNER_ANSWER_INFO_SCHEMA_VERSION)
        accumulated_answer_info_json_size_bytes = 40000
        stats_models.LearnerAnswerDetailsModel.create_model_instance(
            entity_type, state_reference, interaction_id,
            learner_answer_info_list, learner_answer_info_schema_version,
            accumulated_answer_info_json_size_bytes)
        model_instance = (
            stats_models.LearnerAnswerDetailsModel.get_model_instance(
                feconf.ENTITY_TYPE_EXPLORATION, state_reference))
        # Ruling out the possibility of None for mypy type checking.
        assert model_instance is not None
        self.assertNotEqual(model_instance, None)
        self.assertEqual(
            model_instance.state_reference, '123:%s' % (state_name))

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.LearnerAnswerDetailsModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_reference': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'entity_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'interaction_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'learner_answer_info_list':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'learner_answer_info_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'accumulated_answer_info_json_size_bytes':
                base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.LearnerAnswerDetailsModel.get_export_policy(),
            expected_export_policy_dict
        )


class ExplorationAnnotationsModelUnitTests(test_utils.GenericTestBase):
    """Tests the ExplorationAnnotationsModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.ExplorationAnnotationsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_and_get_models(self) -> None:
        stats_models.ExplorationAnnotationsModel.create(
            'exp_id1', '1', 5, 4, {})

        model1 = stats_models.ExplorationAnnotationsModel.get('exp_id1:1')

        self.assertEqual(model1.exploration_id, 'exp_id1')
        self.assertEqual(model1.version, '1')
        self.assertEqual(model1.num_starts, 5)
        self.assertEqual(model1.num_completions, 4)
        self.assertEqual(model1.state_hit_counts, {})

    def test_get_versions(self) -> None:
        stats_models.ExplorationAnnotationsModel.create(
            'exp_id1', '1', 5, 4, {})
        stats_models.ExplorationAnnotationsModel.create(
            'exp_id1', '2', 5, 4, {})

        versions = stats_models.ExplorationAnnotationsModel.get_versions(
            'exp_id1')

        self.assertEqual(sorted(versions), ['1', '2'])

    def test_get_version_for_invalid_exploration_id(self) -> None:
        versions = stats_models.ExplorationAnnotationsModel.get_versions(
            'invalid_exp_id')

        self.assertEqual(versions, [])

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.ExplorationAnnotationsModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_starts': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'num_completions': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_hit_counts': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.ExplorationAnnotationsModel.get_export_policy(),
            expected_export_policy_dict
        )


class StateAnswersModelUnitTests(test_utils.GenericTestBase):
    """Tests the StateAnswersModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.StateAnswersModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_shard_count_is_updated_when_data_overflows(self) -> None:

        submitted_answer_list: List[stats_domain.SubmittedAnswerDict] = [{
            'answer': 'value',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'rule_spec_str': 'rule spec str',
            'answer_str': 'answer str'
        }]

        stats_models.StateAnswersModel.insert_submitted_answers(
            'exp_id', 1, 'state_name', 'interaction_id',
            submitted_answer_list)

        model1 = stats_models.StateAnswersModel.get_master_model(
            'exp_id', 1, 'state_name')

        # Ruling out the possibility of None for mypy type checking.
        assert model1 is not None
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

            # Ruling out the possibility of None for mypy type checking.
            assert model1 is not None
            self.assertEqual(model1.shard_count, 1)

            stats_models.StateAnswersModel.insert_submitted_answers(
                'exp_id', 1, 'state_name', 'interaction_id',
                submitted_answer_list)

            model1 = stats_models.StateAnswersModel.get_master_model(
                'exp_id', 1, 'state_name')

            # Ruling out the possibility of None for mypy type checking.
            assert model1 is not None
            self.assertEqual(model1.shard_count, 2)

        # 'shard_count' will not increase as number of answers are less than
        # the max answer list size.
        stats_models.StateAnswersModel.insert_submitted_answers(
            'exp_id', 1, 'state_name', 'interaction_id',
            submitted_answer_list)

        model1 = stats_models.StateAnswersModel.get_master_model(
            'exp_id', 1, 'state_name')

        # Ruling out the possibility of None for mypy type checking.
        assert model1 is not None
        self.assertEqual(model1.shard_count, 2)

    def test_get_all_state_answer_models_of_a_single_shard(self) -> None:
        self.assertIsNone(stats_models.StateAnswersModel.get_all_models(
            'exp_id', 1, 'state_name'
        ))

        # The 'shard_count' will be zero since the number of answer lists
        # is less than _MAX_ANSWER_LIST_BYTE_SIZE.
        submitted_answer_list1: List[stats_domain.SubmittedAnswerDict] = [{
            'answer': 'value1',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'rule_spec_str': 'rule spec str',
            'answer_str': 'answer str'
        }]
        stats_models.StateAnswersModel.insert_submitted_answers(
            'exp_id', 1, 'state_name', 'interaction_id1',
            submitted_answer_list1)

        submitted_answer_list2: List[stats_domain.SubmittedAnswerDict] = [{
            'answer': 'value2',
            'interaction_id': 'TextInput',
            'answer_group_index': 0,
            'rule_spec_index': 1,
            'classification_categorization': (
                exp_domain.EXPLICIT_CLASSIFICATION),
            'params': {},
            'session_id': 'sess',
            'time_spent_in_sec': 10.5,
            'rule_spec_str': 'rule spec str',
            'answer_str': 'answer str'
        }]
        stats_models.StateAnswersModel.insert_submitted_answers(
            'exp_id', 1, 'state_name', 'interaction_id2',
            submitted_answer_list2)

        stat_answer_models = stats_models.StateAnswersModel.get_all_models(
            'exp_id', 1, 'state_name'
        )

        # Ruling out the possibility of None for mypy type checking.
        assert stat_answer_models is not None

        # Ensure we got the correct model.
        self.assertEqual(stat_answer_models[0].exploration_id, 'exp_id')
        self.assertEqual(stat_answer_models[0].exploration_version, 1)
        self.assertEqual(stat_answer_models[0].state_name, 'state_name')
        self.assertEqual(
            stat_answer_models[0].submitted_answer_list,
            submitted_answer_list1 + submitted_answer_list2
        )

    def test_get_all_state_answer_models_of_all_shards(self) -> None:
        # Use a smaller max answer list size so fewer answers are needed to
        # exceed a shard. This will increase the 'shard_count'.
        with self.swap(
            stats_models.StateAnswersModel, '_MAX_ANSWER_LIST_BYTE_SIZE', 1):
            submitted_answer_list1: List[stats_domain.SubmittedAnswerDict] = [{
                'answer': 'value1',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5,
                'rule_spec_str': 'rule spec str',
                'answer_str': 'answer str'
            }]
            stats_models.StateAnswersModel.insert_submitted_answers(
                'exp_id', 1, 'state_name', 'interaction_id1',
                submitted_answer_list1)

            submitted_answer_list2: List[stats_domain.SubmittedAnswerDict] = [{
                'answer': 'value2',
                'interaction_id': 'TextInput',
                'answer_group_index': 0,
                'rule_spec_index': 1,
                'classification_categorization': (
                    exp_domain.EXPLICIT_CLASSIFICATION),
                'params': {},
                'session_id': 'sess',
                'time_spent_in_sec': 10.5,
                'rule_spec_str': 'rule spec str',
                'answer_str': 'answer str'
            }]
            stats_models.StateAnswersModel.insert_submitted_answers(
                'exp_id', 1, 'state_name', 'interaction_id2',
                submitted_answer_list2)

            stat_answer_models = stats_models.StateAnswersModel.get_all_models(
                'exp_id', 1, 'state_name'
            )

            # Ruling out the possibility of None for mypy type checking.
            assert stat_answer_models is not None

            # Ensure we got the correct model.
            self.assertEqual(stat_answer_models[1].exploration_id, 'exp_id')
            self.assertEqual(stat_answer_models[1].exploration_version, 1)
            self.assertEqual(stat_answer_models[1].state_name, 'state_name')
            self.assertEqual(
                stat_answer_models[1].submitted_answer_list,
                submitted_answer_list1
            )

            self.assertEqual(stat_answer_models[2].exploration_id, 'exp_id')
            self.assertEqual(stat_answer_models[2].exploration_version, 1)
            self.assertEqual(stat_answer_models[2].state_name, 'state_name')
            self.assertEqual(
                stat_answer_models[2].submitted_answer_list,
                submitted_answer_list2
            )

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.StateAnswersModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'shard_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'interaction_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'shard_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'accumulated_answer_json_size_bytes':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'submitted_answer_list': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.StateAnswersModel.get_export_policy(),
            expected_export_policy_dict
        )


class StateAnswersCalcOutputModelUnitTests(test_utils.GenericTestBase):
    """Tests the StateAnswersCalcOutputModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            stats_models.StateAnswersCalcOutputModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            stats_models.StateAnswersCalcOutputModel
                .get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exploration_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'interaction_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'calculation_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'calculation_output_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'calculation_output': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            stats_models.StateAnswersCalcOutputModel.get_export_policy(),
            expected_export_policy_dict
        )
