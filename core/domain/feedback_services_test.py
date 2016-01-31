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

from core.domain import feedback_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import utils

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])


class FeedbackServicesUnitTests(test_utils.GenericTestBase):
    """Test functions in feedback_services."""

    def test_feedback_ids(self):
        """Test various conventions for thread and message ids."""
        exp_id = '0'
        feedback_services.create_thread(
            exp_id, 'a_state_name', None, 'a subject', 'some text')
        threadlist = feedback_services.get_all_threads(exp_id, False)
        self.assertEqual(len(threadlist), 1)
        thread_id = threadlist[0]['thread_id']
        # The thread id should not have any full stops.
        self.assertNotIn('.', thread_id)

        messages = feedback_services.get_messages(exp_id, thread_id)
        self.assertEqual(len(messages), 1)
        message_id = messages[0]['message_id']
        self.assertTrue(isinstance(message_id, int))

        # Retrieve the message instance from the storage layer.
        datastore_id = feedback_models.FeedbackMessageModel.get_messages(
            exp_id, thread_id)[0].id

        full_thread_id = (feedback_models.FeedbackThreadModel
                          .generate_full_thread_id(exp_id, thread_id))
        # The message id should be prefixed with the full thread id and a full
        # stop, followed by the message id.
        self.assertEqual(
            datastore_id, '%s.%s' % (full_thread_id, message_id))

    def test_create_message_fails_if_invalid_thread_id(self):
        exp_id = '0'
        with self.assertRaises(
            feedback_models.FeedbackMessageModel.EntityNotFoundError
            ):
            feedback_services.create_message(
                exp_id, 'invalid_thread_id', 'user_id', None, None, 'Hello')

    def test_status_of_newly_created_thread_is_open(self):
        exp_id = '0'
        feedback_services.create_thread(
            exp_id, 'a_state_name', None, 'a subject', 'some text')
        threadlist = feedback_services.get_all_threads(exp_id, False)
        thread_status = threadlist[0]['status']
        self.assertEqual(thread_status, feedback_models.STATUS_CHOICES_OPEN)


class SuggestionQueriesUnitTests(test_utils.GenericTestBase):
    """Test learner suggestion query functions in feedback_services."""

    THREAD_ID1 = '1111'
    THREAD_ID2 = '2222'
    THREAD_ID3 = '3333'
    THREAD_ID4 = '4444'
    THREAD_ID5 = '5555'
    EXP_ID1 = 'exp_id1'
    EXP_ID2 = 'exp_id2'
    EXP_ID3 = 'exp_id3'
    USER_EMAIL = 'abc@xyz.com'
    USERNAME = 'user123'
    CURRENT_TIME_IN_MSEC = 12345678

    def _generate_thread_id(self, unused_exp_id):
        return self.THREAD_ID1

    def _get_threads(self, unused_exploration_id):
        return self.threads

    def _get_thread_with_suggestions(self, unused_exploration_id):
        return self.threads_with_suggestions

    def _get_milliseconds(self, unused_time):
        return self.CURRENT_TIME_IN_MSEC

    def setUp(self):
        super(SuggestionQueriesUnitTests, self).setUp()
        # Register users.
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        user_services.get_or_create_user(self.user_id, self.USER_EMAIL)
        self.signup(self.USER_EMAIL, self.USERNAME)
        # Open thread with suggestion.
        thread1 = feedback_models.FeedbackThreadModel(
            id=feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID1, self.THREAD_ID1),
            exploration_id=self.EXP_ID1,
            state_name='state_name',
            original_author_id=self.user_id,
            subject='SUGGESTION',
            has_suggestion=True)
        # Closed threads with suggestion.
        thread2 = feedback_models.FeedbackThreadModel(
            id=feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID1, self.THREAD_ID2),
            exploration_id=self.EXP_ID1,
            state_name='state_name',
            original_author_id=self.user_id,
            subject='SUGGESTION',
            status=feedback_models.STATUS_CHOICES_FIXED,
            has_suggestion=True)
        thread3 = feedback_models.FeedbackThreadModel(
            id=feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID1, self.THREAD_ID3),
            exploration_id=self.EXP_ID1,
            state_name='state_name',
            original_author_id=self.user_id,
            subject='SUGGESTION',
            status=feedback_models.STATUS_CHOICES_IGNORED,
            has_suggestion=True)
        # Closed thread without suggestion.
        thread4 = feedback_models.FeedbackThreadModel(
            id=feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID2, self.THREAD_ID4),
            exploration_id=self.EXP_ID1,
            state_name='state_name',
            original_author_id=self.user_id,
            subject='NO SUGGESTION',
            status=feedback_models.STATUS_CHOICES_IGNORED)
        # Open thread without suggestion.
        thread5 = feedback_models.FeedbackThreadModel(
            id=feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID2, self.THREAD_ID5),
            exploration_id=self.EXP_ID1,
            state_name='state_name',
            original_author_id=self.user_id,
            subject='NO SUGGESTION',
            status=feedback_models.STATUS_CHOICES_OPEN)
        self.threads = [thread1, thread2, thread3, thread4, thread5]
        self.threads_with_suggestions = [thread1, thread2, thread3]

    def test_create_and_get_suggestion(self):
        with self.swap(feedback_models.FeedbackThreadModel,
                       'generate_new_thread_id', self._generate_thread_id):
            feedback_services.create_suggestion(
                self.EXP_ID3, self.user_id, 3, 'state_name',
                'description', {'old_content': {}})
        suggestion = feedback_services.get_suggestion(
            self.EXP_ID3, self.THREAD_ID1)
        thread = feedback_models.FeedbackThreadModel.get(
            feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID3, self.THREAD_ID1))
        self.assertEqual(thread.status, feedback_models.STATUS_CHOICES_OPEN)
        self.assertEqual(suggestion['exploration_id'], self.EXP_ID3)
        self.assertEqual(suggestion['author_name'], 'user123')
        self.assertEqual(suggestion['exploration_version'], 3)
        self.assertEqual(suggestion['state_name'], 'state_name')
        self.assertEqual(suggestion['description'], 'description')
        self.assertEqual(suggestion['state_content'], {'old_content': {}})

    def test_get_open_threads_with_suggestions(self):
        with self.swap(feedback_models.FeedbackThreadModel, 'get_threads',
                       self._get_threads):
            with self.swap(utils, 'get_time_in_millisecs',
                           self._get_milliseconds):
                threads = feedback_services.get_open_threads(
                    self.EXP_ID1, True)
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0]['thread_id'], self.THREAD_ID1)

    def test_get_open_threads_without_suggestions(self):
        with self.swap(feedback_models.FeedbackThreadModel, 'get_threads',
                       self._get_threads):
            with self.swap(utils, 'get_time_in_millisecs',
                           self._get_milliseconds):
                threads = feedback_services.get_open_threads(
                    self.EXP_ID1, False)
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0]['thread_id'], self.THREAD_ID5)

    def test_get_closed_threads_with_suggestions(self):
        with self.swap(feedback_models.FeedbackThreadModel, 'get_threads',
                       self._get_threads):
            with self.swap(utils, 'get_time_in_millisecs',
                           self._get_milliseconds):
                threads = feedback_services.get_closed_threads(
                    self.EXP_ID1, True)
        self.assertEqual(len(threads), 2)
        self.assertEqual(threads[0]['thread_id'], self.THREAD_ID2)
        self.assertEqual(threads[1]['thread_id'], self.THREAD_ID3)

    def test_get_closed_threads_without_suggestions(self):
        with self.swap(feedback_models.FeedbackThreadModel, 'get_threads',
                       self._get_threads):
            with self.swap(utils, 'get_time_in_millisecs',
                           self._get_milliseconds):
                threads = feedback_services.get_closed_threads(
                    self.EXP_ID1, False)
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0]['thread_id'], self.THREAD_ID4)

    def test_get_all_threads_with_suggestion(self):
        with self.swap(
            feedback_models.FeedbackThreadModel, 'get_threads',
            self._get_thread_with_suggestions):
            with self.swap(utils, 'get_time_in_millisecs',
                           self._get_milliseconds):
                threads = feedback_services.get_all_threads(
                    self.EXP_ID1, True)
        self.assertEqual(len(threads), 3)
        self.assertEqual(threads[0]['thread_id'], self.THREAD_ID1)
        self.assertEqual(threads[1]['thread_id'], self.THREAD_ID2)
        self.assertEqual(threads[2]['thread_id'], self.THREAD_ID3)

    def test_get_all_threads_without_suggestion(self):
        with self.swap(
            feedback_models.FeedbackThreadModel, 'get_threads',
            self._get_threads):
            with self.swap(utils, 'get_time_in_millisecs',
                           self._get_milliseconds):
                threads = feedback_services.get_all_threads(
                    self.EXP_ID2, False)
        self.assertEqual(len(threads), 2)
        self.assertEqual(threads[0]['thread_id'], self.THREAD_ID4)
        self.assertEqual(threads[1]['thread_id'], self.THREAD_ID5)
