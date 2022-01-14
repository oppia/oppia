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

"""Tests for event handling."""

from __future__ import annotations

import importlib
import inspect
import logging
import re

from core import feconf
from core.domain import event_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(
    stats_models, exp_models, feedback_models,
    user_models
) = models.Registry.import_models([
    models.NAMES.statistics, models.NAMES.exploration, models.NAMES.feedback,
    models.NAMES.user
])

datastore_services = models.Registry.import_datastore_services()


class MockNumbersModel(datastore_services.Model):
    number = datastore_services.IntegerProperty()


class BaseEventHandlerTests(test_utils.GenericTestBase):

    def test_handle_event_raises_not_implemented_error(self):
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'Subclasses of BaseEventHandler should implement the '
                '_handle_event() method, using explicit arguments '
                '(no *args or **kwargs).')):
            event_services.BaseEventHandler.record()


class ExplorationActualStartEventHandlerTests(test_utils.GenericTestBase):

    def test_record_exploration_actual_start_events(self):
        all_models = (
            stats_models.ExplorationActualStartEventLogEntryModel.get_all())

        self.assertEqual(all_models.count(), 0)

        event_services.ExplorationActualStartEventHandler.record(
            'exp_id', 1, 'state_name', 'session_id')

        all_models = (
            stats_models.ExplorationActualStartEventLogEntryModel.get_all())

        self.assertEqual(all_models.count(), 1)

        model = all_models.get()

        self.assertEqual(model.exp_id, 'exp_id')
        self.assertEqual(model.state_name, 'state_name')
        self.assertEqual(model.session_id, 'session_id')
        self.assertEqual(model.exp_version, 1)


class SolutionHitEventHandlerTests(test_utils.GenericTestBase):

    def test_record_solution_hit_events(self):
        all_models = (
            stats_models.SolutionHitEventLogEntryModel.get_all())

        self.assertEqual(all_models.count(), 0)

        event_services.SolutionHitEventHandler.record(
            'exp_id', 1, 'state_name', 'session_id', 2.0)

        all_models = (
            stats_models.SolutionHitEventLogEntryModel.get_all())

        self.assertEqual(all_models.count(), 1)

        model = all_models.get()

        self.assertEqual(model.exp_id, 'exp_id')
        self.assertEqual(model.state_name, 'state_name')
        self.assertEqual(model.session_id, 'session_id')
        self.assertEqual(model.exp_version, 1)
        self.assertEqual(model.time_spent_in_state_secs, 2.0)


class StateHitEventHandlerTests(test_utils.GenericTestBase):

    def test_record_state_hit_events(self):
        all_models = (
            stats_models.StateHitEventLogEntryModel.get_all())

        self.assertEqual(all_models.count(), 0)

        event_services.StateHitEventHandler.record(
            'exp_id', 1, 'state_name', 'session_id', {},
            feconf.PLAY_TYPE_PLAYTEST)

        all_models = (
            stats_models.StateHitEventLogEntryModel.get_all())

        self.assertEqual(all_models.count(), 1)

        model = all_models.get()

        self.assertEqual(model.exploration_id, 'exp_id')
        self.assertEqual(model.state_name, 'state_name')
        self.assertEqual(model.session_id, 'session_id')
        self.assertEqual(model.exploration_version, 1)
        self.assertEqual(model.params, {})
        self.assertEqual(model.play_type, feconf.PLAY_TYPE_PLAYTEST)


class StateCompleteEventHandlerTests(test_utils.GenericTestBase):

    def test_record_state_complete_events(self):
        all_models = (
            stats_models.StateCompleteEventLogEntryModel.get_all())

        self.assertEqual(all_models.count(), 0)

        event_services.StateCompleteEventHandler.record(
            'exp_id', 1, 'state_name', 'session_id', 2.0)

        all_models = (
            stats_models.StateCompleteEventLogEntryModel.get_all())

        self.assertEqual(all_models.count(), 1)

        model = all_models.get()

        self.assertEqual(model.exp_id, 'exp_id')
        self.assertEqual(model.state_name, 'state_name')
        self.assertEqual(model.session_id, 'session_id')
        self.assertEqual(model.exp_version, 1)
        self.assertEqual(model.time_spent_in_state_secs, 2.0)


class LeaveForRefresherExpEventHandlerTests(test_utils.GenericTestBase):

    def test_record_leave_for_refresher_exploration_events(self):
        all_models = (
            stats_models.LeaveForRefresherExplorationEventLogEntryModel
            .get_all())

        self.assertEqual(all_models.count(), 0)

        event_services.LeaveForRefresherExpEventHandler.record(
            'exp_id', 'refresher_exp_id', 1, 'state_name', 'session_id', 2.0)

        all_models = (
            stats_models.LeaveForRefresherExplorationEventLogEntryModel
            .get_all())

        self.assertEqual(all_models.count(), 1)

        model = all_models.get()

        self.assertEqual(model.exp_id, 'exp_id')
        self.assertEqual(model.refresher_exp_id, 'refresher_exp_id')
        self.assertEqual(model.state_name, 'state_name')
        self.assertEqual(model.session_id, 'session_id')
        self.assertEqual(model.exp_version, 1)
        self.assertEqual(model.time_spent_in_state_secs, 2.0)


class TestEventHandler(event_services.BaseEventHandler):
    """Mock event class for processing events of type 'test_event'."""

    EVENT_TYPE = 'test_event'

    @classmethod
    def _handle_event(cls, number):
        MockNumbersModel(number=number).put()


class EventHandlerUnitTests(test_utils.GenericTestBase):
    """Test basic event handler operations."""

    def test_handle_event_method_is_called(self):
        self.assertEqual(MockNumbersModel.query().count(), 0)
        TestEventHandler.record(2)
        self.assertEqual(MockNumbersModel.query().count(), 1)
        self.assertEqual([
            numbers_model.number for numbers_model in MockNumbersModel.query()
        ], [2])


class StatsEventsHandlerUnitTests(test_utils.GenericTestBase):
    """Tests related to the stats events handler."""

    def test_stats_events_with_undefined_state_name_gets_logged(self):
        observed_log_messages = []

        def _mock_logging_function(msg, *args):
            """Mocks logging.error()."""
            observed_log_messages.append(msg % args)

        logging_swap = self.swap(logging, 'error', _mock_logging_function)
        with logging_swap:
            event_services.StatsEventsHandler.record(
                'eid1', 1, {
                    'num_starts': 1,
                    'num_actual_starts': 0,
                    'num_completions': 0,
                    'state_stats_mapping': {
                        'undefined': {}
                    }
                })
        self.process_and_flush_pending_tasks()

        self.assertEqual(len(observed_log_messages), 1)
        self.assertEqual(
            observed_log_messages,
            [
                'Aggregated stats contains an undefined state name: [\''
                'undefined\']'
            ]
        )


class EventHandlerNameTests(test_utils.GenericTestBase):

    def test_event_handler_names(self):
        """This function checks for duplicate event handlers."""

        all_python_files = self.get_all_python_files()
        all_event_handlers = []

        for file_name in all_python_files:
            if file_name.endswith('_test'):
                continue

            python_module = importlib.import_module(file_name)
            for name, clazz in inspect.getmembers(
                    python_module, predicate=inspect.isclass):
                all_base_classes = [base_class.__name__ for base_class in
                                    (inspect.getmro(clazz))]
                # Check that it is a subclass of 'BaseEventHandler'.
                if ('BaseEventHandler' in all_base_classes and
                        name != 'BaseEventHandler'):
                    # Event handler class should specify an event type.
                    self.assertIsNotNone(clazz.EVENT_TYPE)

                    all_event_handlers.append(name)

        expected_event_handlers = [
            'StatsEventsHandler', 'AnswerSubmissionEventHandler',
            'ExplorationActualStartEventHandler', 'SolutionHitEventHandler',
            'StartExplorationEventHandler', 'MaybeLeaveExplorationEventHandler',
            'CompleteExplorationEventHandler', 'RateExplorationEventHandler',
            'StateHitEventHandler', 'StateCompleteEventHandler',
            'LeaveForRefresherExpEventHandler',
            'FeedbackThreadCreatedEventHandler',
            'FeedbackThreadStatusChangedEventHandler'
        ]

        self.assertEqual(
            sorted(all_event_handlers), sorted(expected_event_handlers))


class UserStatsEventsFunctionsTests(test_utils.GenericTestBase):

    def setUp(self):
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.exploration = (
            self.save_new_valid_exploration('exp_id', self.admin_id))

    def test_average_ratings_of_users_exps_are_calculated_correctly(self):
        user_models.UserStatsModel(
            id=self.admin_id, average_ratings=None, num_ratings=0, total_plays=0
        ).put()

        admin_average_ratings = (
            user_services.get_dashboard_stats(self.admin_id)['average_ratings'])
        self.assertIsNone(admin_average_ratings)

        event_services.handle_exploration_rating('exp_id', 5, None)
        admin_average_ratings = (
            user_services.get_dashboard_stats(self.admin_id)['average_ratings'])
        self.assertEqual(admin_average_ratings, 5)

        event_services.handle_exploration_rating('exp_id', 1, None)
        admin_average_ratings = (
            user_services.get_dashboard_stats(self.admin_id)['average_ratings'])
        self.assertEqual(admin_average_ratings, 3)

        event_services.handle_exploration_rating('exp_id', 1, 5)
        admin_average_ratings = (
            user_services.get_dashboard_stats(self.admin_id)['average_ratings'])
        self.assertEqual(admin_average_ratings, 1)

    def test_total_plays_of_users_exps_are_calculated_correctly(self):
        admin_total_plays = (
            user_services.get_dashboard_stats(self.admin_id)['total_plays'])
        self.assertEqual(admin_total_plays, 0)

        event_services.handle_exploration_start('exp_id')
        admin_total_plays = (
            user_services.get_dashboard_stats(self.admin_id)['total_plays'])
        self.assertEqual(admin_total_plays, 1)

        event_services.handle_exploration_start('exp_id')
        admin_total_plays = (
            user_services.get_dashboard_stats(self.admin_id)['total_plays'])
        self.assertEqual(admin_total_plays, 2)
