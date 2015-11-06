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

"""Tests for feedback-related services."""

__author__ = 'Sean Lip'

from core.domain import feedback_services
from core.platform import models
(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])
from core.tests import test_utils


class FeedbackServicesUnitTests(test_utils.GenericTestBase):
    """Test functions in feedback_services."""

    def test_feedback_ids(self):
        """Test various conventions for thread and message ids."""
        EXP_ID = '0'
        feedback_services.create_thread(
            EXP_ID, 'a_state_name', None, 'a subject', 'some text')
        threadlist = feedback_services.get_threadlist(EXP_ID)
        self.assertEqual(len(threadlist), 1)
        thread_id = threadlist[0]['thread_id']
        # The thread id should be prefixed with the exploration id and a full
        # stop.
        self.assertTrue(thread_id.startswith('%s.' % EXP_ID))
        # The rest of the thread id should not have any full stops.
        self.assertNotIn('.', thread_id[len(EXP_ID) + 1:])

        messages = feedback_services.get_messages(threadlist[0]['thread_id'])
        self.assertEqual(len(messages), 1)
        message_id = messages[0]['message_id']
        self.assertTrue(isinstance(message_id, int))

        # Retrieve the message instance from the storage layer.
        datastore_id = feedback_models.FeedbackMessageModel.get_messages(
            thread_id)[0].id
        # The message id should be prefixed with the thread id and a full stop,
        # followed by the message id.
        self.assertEqual(
            datastore_id, '%s.%s' % (thread_id, message_id))

    def test_create_message_fails_if_invalid_thread_id(self):
        with self.assertRaises(
                feedback_models.FeedbackMessageModel.EntityNotFoundError):
            feedback_services.create_message(
                'invalid_thread_id', 'user_id', None, None, 'Hello')

    def test_status_of_newly_created_thread_is_open(self):
        EXP_ID = '0'
        feedback_services.create_thread(
            EXP_ID, 'a_state_name', None, 'a subject', 'some text')
        threadlist = feedback_services.get_threadlist(EXP_ID)
        thread_status = threadlist[0]['status']
        self.assertEqual(thread_status, feedback_models.STATUS_CHOICES_OPEN)
