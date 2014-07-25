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

__author__ = 'Sean Lip'

from core.domain import event_services
from core.tests import test_utils

from google.appengine.ext import ndb


class NumbersModel(ndb.Model):
    number = ndb.IntegerProperty()


class TestEventHandler(event_services.BaseEventHandler):
    """Mock event class for processing events of type 'test_event'."""

    EVENT_TYPE = 'test_event'

    @classmethod
    def _handle_event(cls, number):
        NumbersModel(number=number).put()


def dummy_listener(unused_event_type, number):
    # Due to pickling restrictions, listeners cannot be defined as inner
    # functions.
    assert number == 2


class EventHandlerUnitTests(test_utils.GenericTestBase):
    """Test basic event handler operations."""

    def test_handle_event_method_is_called(self):
        self.assertEqual(NumbersModel.query().count(), 0)
        TestEventHandler.record(2)
        self.assertEqual(NumbersModel.query().count(), 1)
        self.assertEqual([
            numbers_model.number for numbers_model in NumbersModel.query()
        ], [2])

    def test_event_listener_is_called(self):
        TestEventHandler.add_listener(dummy_listener)
        self.assertEqual(len(TestEventHandler._listeners), 1)

        TestEventHandler.record(2)

        # TODO(sll): Wrap the listener in a counter in order to ensure that
        # it is actually called.

        # Note that the listener will not actually be called until the task
        # queue is flushed.
        self.process_and_flush_pending_tasks()

        TestEventHandler.remove_listener(dummy_listener)
        self.assertEqual(TestEventHandler._listeners, [])
