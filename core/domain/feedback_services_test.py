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
import feconf

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
        thread_id = threadlist[0].get_thread_id()
        # The thread id should not have any full stops.
        self.assertNotIn('.', thread_id)

        messages = feedback_services.get_messages(exp_id, thread_id)
        self.assertEqual(len(messages), 1)
        message_id = messages[0].message_id
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
        thread_status = threadlist[0].status
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
    USER_EMAIL = 'abc@xyz.com'
    USERNAME = 'user123'
    CURRENT_TIME_IN_MSEC = 12345678

    def _generate_thread_id(self, unused_exp_id):
        return self.THREAD_ID1

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
                self.EXP_ID1, self.THREAD_ID4),
            exploration_id=self.EXP_ID1,
            state_name='state_name',
            original_author_id=self.user_id,
            subject='NO SUGGESTION',
            status=feedback_models.STATUS_CHOICES_IGNORED)
        # Open thread without suggestion.
        thread5 = feedback_models.FeedbackThreadModel(
            id=feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID1, self.THREAD_ID5),
            exploration_id=self.EXP_ID1,
            state_name='state_name',
            original_author_id=self.user_id,
            subject='NO SUGGESTION',
            status=feedback_models.STATUS_CHOICES_OPEN)

        for thread in [thread1, thread2, thread3, thread4, thread5]:
            thread.put()

    def test_create_and_get_suggestion(self):
        with self.swap(feedback_models.FeedbackThreadModel,
                       'generate_new_thread_id', self._generate_thread_id):
            feedback_services.create_suggestion(
                self.EXP_ID2, self.user_id, 3, 'state_name',
                'description', {'old_content': {}})
        suggestion = feedback_services.get_suggestion(
            self.EXP_ID2, self.THREAD_ID1)
        thread = feedback_models.FeedbackThreadModel.get(
            feedback_models.FeedbackThreadModel.generate_full_thread_id(
                self.EXP_ID2, self.THREAD_ID1))
        expected_suggestion_dict = {
            'exploration_id': self.EXP_ID2,
            'author_name': 'user123',
            'exploration_version': 3,
            'state_name': 'state_name',
            'description': 'description',
            'state_content': {'old_content': {}}
        }
        self.assertEqual(thread.status, feedback_models.STATUS_CHOICES_OPEN)
        self.assertDictEqual(expected_suggestion_dict, suggestion.to_dict())

    def test_get_open_threads_with_suggestions(self):
        threads = feedback_services.get_open_threads(self.EXP_ID1, True)
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0].id, self.EXP_ID1 + '.' + self.THREAD_ID1)

    def test_get_open_threads_without_suggestions(self):
        threads = feedback_services.get_open_threads(self.EXP_ID1, False)
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0].id, self.EXP_ID1 + '.' + self.THREAD_ID5)

    def test_get_closed_threads_with_suggestions(self):
        threads = feedback_services.get_closed_threads(self.EXP_ID1, True)
        self.assertEqual(len(threads), 2)
        self.assertEqual(threads[0].id, self.EXP_ID1 + '.' + self.THREAD_ID2)
        self.assertEqual(threads[1].id, self.EXP_ID1 + '.' + self.THREAD_ID3)

    def test_get_closed_threads_without_suggestions(self):
        threads = feedback_services.get_closed_threads(self.EXP_ID1, False)
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0].id, self.EXP_ID1 + '.' + self.THREAD_ID4)

    def test_get_all_threads_with_suggestion(self):
        threads = feedback_services.get_all_threads(self.EXP_ID1, True)
        self.assertEqual(len(threads), 3)
        self.assertEqual(threads[0].id, self.EXP_ID1 + '.' + self.THREAD_ID1)
        self.assertEqual(threads[1].id, self.EXP_ID1 + '.' + self.THREAD_ID2)
        self.assertEqual(threads[2].id, self.EXP_ID1 + '.' + self.THREAD_ID3)

    def test_get_all_threads_without_suggestion(self):
        threads = feedback_services.get_all_threads(self.EXP_ID1, False)
        self.assertEqual(len(threads), 2)
        self.assertEqual(threads[0].id, self.EXP_ID1 + '.' + self.THREAD_ID4)
        self.assertEqual(threads[1].id, self.EXP_ID1 + '.' + self.THREAD_ID5)


class FeedbackThreadUnitTests(test_utils.GenericTestBase):

    EXP_ID = '0'

    def setUp(self):
        super(FeedbackThreadUnitTests, self).setUp()

        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        user_services.get_or_create_user(self.viewer_id, self.VIEWER_EMAIL)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def test_get_all_threads(self):
        # Create an anonymous feedback thread
        expected_thread_dict = {
            'status': u'open',
            'state_name': u'a_state_name',
            'summary': None,
            'original_author_username': None,
            'subject': u'a subject'
        }
        feedback_services.create_thread(
            self.EXP_ID, expected_thread_dict['state_name'], None,
            expected_thread_dict['subject'], 'not used here')

        threads = feedback_services.get_all_threads(self.EXP_ID, False)
        self.assertEqual(1, len(threads))
        self.assertDictContainsSubset(expected_thread_dict,
                                      threads[0].to_dict())

        # Viewer creates feedback thread
        expected_thread_dict = {
            'status': u'open',
            'state_name': u'a_state_name_second',
            'summary': None,
            'original_author_username': self.VIEWER_USERNAME,
            'subject': u'a subject second'
        }
        feedback_services.create_thread(
            self.EXP_ID, expected_thread_dict['state_name'], self.viewer_id,
            expected_thread_dict['subject'], 'not used here')

        threads = feedback_services.get_all_threads(self.EXP_ID, False)
        self.assertEqual(2, len(threads))
        self.assertDictContainsSubset(expected_thread_dict,
                                      threads[1].to_dict())


class EmailsTaskqueueTests(test_utils.GenericTestBase):
    """Tests for tasks in emails taskqueue."""

    def test_create_new_task(self):
        user_id = 'user'
        feedback_services.enqueue_feedback_message_email_task(user_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(), 1)

        tasks = self.get_pending_tasks()
        self.assertEqual(
            tasks[0].url, feconf.FEEDBACK_MESSAGE_EMAIL_HANDLER_URL)
        self.process_and_flush_pending_tasks()
