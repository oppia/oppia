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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import importlib
import inspect
import os
import re

from core.domain import event_services
from core.platform import models
from core.tests import test_utils
import feconf

from google.appengine.ext import ndb

(stats_models, feedback_models) = models.Registry.import_models([
    models.NAMES.statistics, models.NAMES.feedback])

taskqueue_services = models.Registry.import_taskqueue_services()


class MockNumbersModel(ndb.Model):
    number = ndb.IntegerProperty()


class BaseEventHandlerTests(test_utils.GenericTestBase):

    def test_handle_event_raises_not_implemented_error(self):
        with self.assertRaisesRegexp(
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


class EventHandlerTaskQueueUnitTests(test_utils.GenericTestBase):
    """Test that events go into the correct queue."""

    def test_events_go_into_the_events_queue(self):
        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_EVENTS),
            0)

        event_services.CompleteExplorationEventHandler.record(
            'eid1', 1, 'sid1', 'session1', 100, {}, feconf.PLAY_TYPE_NORMAL)
        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_EVENTS),
            1)

        self.process_and_flush_pending_tasks()

        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_EVENTS),
            0)


class EventHandlerNameTests(test_utils.GenericTestBase):

    def _get_all_python_files(self):
        """Recursively collects all Python files in the core/ and extensions/
        directory.
        Returns:
            a list of Python files.
        """
        files_in_directory = []
        for directory, _, files in os.walk('.'):
            if not (directory.startswith('./core/') or
                    directory.startswith('./extensions/')):
                continue
            for file_name in files:
                if not file_name.endswith('.py'):
                    continue
                filepath = os.path.join(directory, file_name)
                # 'filepath' is in the form of './YYY/XXX.py', so we need to
                # extract YYY.XXX from the filepath so that it can be imported
                # as a module.
                module = filepath[2:-3].replace('/', '.')
                files_in_directory.append(module)
        return files_in_directory

    def test_event_handler_names(self):
        """This function checks for duplicate event handlers."""

        all_python_files = self._get_all_python_files()
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
