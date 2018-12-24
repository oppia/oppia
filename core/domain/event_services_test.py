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

from core.domain import event_services
from core.platform import models
from core.tests import test_utils
import feconf

from google.appengine.ext import ndb

taskqueue_services = models.Registry.import_taskqueue_services()


class MockNumbersModel(ndb.Model):
    number = ndb.IntegerProperty()


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
