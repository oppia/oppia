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
import json

from core.domain import feedback_domain
from core.domain import feedback_jobs_continuous_test
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(feedback_models, email_models) = models.Registry.import_models([
    models.NAMES.feedback, models.NAMES.email])
taskqueue_services = models.Registry.import_taskqueue_services()


class FeedbackServicesUnitTests(test_utils.GenericTestBase):
    """Test functions in feedback_services."""

    def test_feedback_ids(self):
        """Test various conventions for thread and message ids."""
        exp_id = '0'
        feedback_services.create_thread(
            'exploration', exp_id, 'a_state_name', None, 'a subject',
            'some text')
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            threadlist = feedback_services.get_all_threads(
                'exploration', exp_id, False)
        self.assertEqual(len(threadlist), 1)
        thread_id = threadlist[0].id

        messages = feedback_services.get_messages(thread_id)
        self.assertEqual(len(messages), 1)
        message_id = messages[0].message_id
        self.assertTrue(isinstance(message_id, int))

        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            threadlist = feedback_services.get_all_threads(
                'exploration', exp_id, False)
        self.assertEqual(len(threadlist), 1)
        thread_id = threadlist[0].id

        messages = feedback_services.get_messages(thread_id)
        self.assertEqual(len(messages), 1)
        message_id = messages[0].message_id
        self.assertTrue(isinstance(message_id, int))

        # Retrieve the message instance from the storage layer.
        datastore_id = feedback_models.FeedbackMessageModel.get_messages(
            thread_id)[0].id

        # The message id should be prefixed with the thread id and a full
        # stop, followed by the message id.
        self.assertEqual(
            datastore_id, '%s.%s' % (thread_id, message_id))

    def test_create_message_fails_if_invalid_thread_id(self):
        with self.assertRaises(
            feedback_models.FeedbackMessageModel.EntityNotFoundError
            ):
            feedback_services.create_message(
                'invalid_thread_id', 'user_id', None, None, 'Hello')

    def test_status_of_newly_created_thread_is_open(self):
        exp_id = '0'
        feedback_services.create_thread(
            'exploration', exp_id, 'a_state_name', None, 'a subject',
            'some text')
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            threadlist = feedback_services.get_all_threads(
                'exploration', exp_id, False)
        thread_status = threadlist[0].status
        self.assertEqual(thread_status, feedback_models.STATUS_CHOICES_OPEN)

        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            threadlist = feedback_services.get_all_threads(
                'exploration', exp_id, False)
        thread_status = threadlist[0].status
        self.assertEqual(thread_status, feedback_models.STATUS_CHOICES_OPEN)

    def test_get_exp_id_from_thread_id(self):
        thread_id = 'exp1.1234'
        self.assertEqual(
            feedback_services.get_exp_id_from_thread_id(thread_id), 'exp1')


class SuggestionQueriesUnitTests(test_utils.GenericTestBase):
    """Test learner suggestion query functions in feedback_services."""

    THREAD_ID1 = 'exploration.exp_id1.1111'
    THREAD_ID2 = 'exploration.exp_id1.2222'
    THREAD_ID3 = 'exploration.exp_id1.3333'
    THREAD_ID4 = 'exploration.exp_id1.4444'
    THREAD_ID5 = 'exploration.exp_id1.5555'
    THREAD_ID6 = 'exploration.exp_id2.1111'
    EXP_ID1 = 'exp_id1'
    EXP_ID2 = 'exp_id2'
    USER_EMAIL = 'abc@xyz.com'
    USERNAME = 'user123'
    CURRENT_TIME_IN_MSEC = 12345678

    def _generate_thread_id(self, unused_entity_type, unused_entity_id):
        return self.THREAD_ID6

    def setUp(self):
        super(SuggestionQueriesUnitTests, self).setUp()
        # Register users.
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        user_services.create_new_user(self.user_id, self.USER_EMAIL)
        self.signup(self.USER_EMAIL, self.USERNAME)
        # Open thread with suggestion.
        thread1 = feedback_models.FeedbackThreadModel(
            id=self.THREAD_ID1, entity_type='exploration',
            entity_id=self.EXP_ID1, state_name='state_name',
            original_author_id=self.user_id, subject='SUGGESTION',
            has_suggestion=True)
        # Closed threads with suggestion.
        thread2 = feedback_models.FeedbackThreadModel(
            id=self.THREAD_ID2, entity_type='exploration',
            entity_id=self.EXP_ID1, state_name='state_name',
            original_author_id=self.user_id, subject='SUGGESTION',
            status=feedback_models.STATUS_CHOICES_FIXED, has_suggestion=True)
        thread3 = feedback_models.FeedbackThreadModel(
            id=self.THREAD_ID3, entity_type='exploration',
            entity_id=self.EXP_ID1, state_name='state_name',
            original_author_id=self.user_id, subject='SUGGESTION',
            status=feedback_models.STATUS_CHOICES_IGNORED, has_suggestion=True)
        # Closed thread without suggestion.
        thread4 = feedback_models.FeedbackThreadModel(
            id=self.THREAD_ID4, entity_type='exploration',
            entity_id=self.EXP_ID1, state_name='state_name',
            original_author_id=self.user_id, subject='NO SUGGESTION',
            status=feedback_models.STATUS_CHOICES_IGNORED)
        # Open thread without suggestion.
        thread5 = feedback_models.FeedbackThreadModel(
            id=self.THREAD_ID5, entity_type='exploration',
            entity_id=self.EXP_ID1, state_name='state_name',
            original_author_id=self.user_id, subject='NO SUGGESTION',
            status=feedback_models.STATUS_CHOICES_OPEN)

        for thread in [thread1, thread2, thread3, thread4, thread5]:
            thread.put()

    def test_create_and_get_suggestion(self):
        with self.swap(
            feedback_models.FeedbackThreadModel,
            'generate_new_thread_id', self._generate_thread_id):
            feedback_services.create_suggestion(
                self.EXP_ID2, self.user_id, 3, 'state_name', 'description', '')
        suggestion = feedback_services.get_suggestion(self.THREAD_ID6)
        thread = feedback_models.FeedbackThreadModel.get(self.THREAD_ID6)
        expected_suggestion_dict = {
            'exploration_id': self.EXP_ID2,
            'author_name': 'user123',
            'exploration_version': 3,
            'state_name': 'state_name',
            'description': 'description',
            'suggestion_html': ''
        }
        self.assertEqual(thread.status, feedback_models.STATUS_CHOICES_OPEN)
        self.assertDictEqual(expected_suggestion_dict, suggestion.to_dict())

    def test_get_open_threads_with_suggestions(self):
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            threads = feedback_services.get_open_threads(
                'exploration', self.EXP_ID1, True)
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0].id, self.THREAD_ID1)

    def test_get_open_threads_without_suggestions(self):
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            threads = feedback_services.get_open_threads(
                'exploration', self.EXP_ID1, False)
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0].id, self.THREAD_ID5)

    def test_get_closed_threads_with_suggestions(self):
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            threads = feedback_services.get_closed_threads(
                'exploration', self.EXP_ID1, True)
        self.assertEqual(len(threads), 2)
        self.assertEqual(threads[0].id, self.THREAD_ID2)
        self.assertEqual(threads[1].id, self.THREAD_ID3)

    def test_get_closed_threads_without_suggestions(self):
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            threads = feedback_services.get_closed_threads(
                'exploration', self.EXP_ID1, False)
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0].id, self.THREAD_ID4)

    def test_get_all_threads_with_suggestion(self):
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            threads = feedback_services.get_all_threads(
                'exploration', self.EXP_ID1, True)
        self.assertEqual(len(threads), 3)
        self.assertEqual(threads[0].id, self.THREAD_ID1)
        self.assertEqual(threads[1].id, self.THREAD_ID2)
        self.assertEqual(threads[2].id, self.THREAD_ID3)

    def test_get_all_threads_without_suggestion(self):
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            threads = feedback_services.get_all_threads(
                'exploration', self.EXP_ID1, False)
        self.assertEqual(len(threads), 2)
        self.assertEqual(threads[0].id, self.THREAD_ID4)
        self.assertEqual(threads[1].id, self.THREAD_ID5)


class FeedbackThreadUnitTests(test_utils.GenericTestBase):

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'
    EXP_ID_3 = 'eid3'
    THREAD_ID = 'thread_id'

    EXPECTED_THREAD_DICT = {
        'status': u'open',
        'state_name': u'a_state_name',
        'summary': None,
        'original_author_username': None,
        'subject': u'a subject'
    }
    EXPECTED_THREAD_DICT_VIEWER = {
        'status': u'open',
        'state_name': u'a_state_name_second',
        'summary': None,
        'original_author_username': None,
        'subject': u'a subject second'
    }

    USER_EMAIL = 'user@example.com'
    USER_USERNAME = 'user'

    def setUp(self):
        super(FeedbackThreadUnitTests, self).setUp()

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_2, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')
        self.save_new_valid_exploration(
            self.EXP_ID_3, self.owner_id, title='Leaning tower of Pisa',
            category='Architecture', language_code='fi')

    def _get_all_messages_read(self, user_id, thread_id):
        feedback_thread_user_model = (
            feedback_models.FeedbackThreadUserModel.get(
                user_id, thread_id))

        return (
            feedback_thread_user_model.message_ids_read_by_user if
            feedback_thread_user_model else [])

    def _run_computation(self):
        (feedback_jobs_continuous_test.ModifiedFeedbackAnalyticsAggregator.
         start_computation())
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_CONTINUOUS_JOBS), 0)
        self.process_and_flush_pending_tasks()

    def test_get_threads_single_exploration(self):
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            threads = feedback_services.get_threads(
                'exploration', self.EXP_ID_1)
            self.assertEqual(len(threads), 0)
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1,
                self.EXPECTED_THREAD_DICT['state_name'], None,
                self.EXPECTED_THREAD_DICT['subject'], 'not used here')
            threads = feedback_services.get_threads(
                'exploration', self.EXP_ID_1)
        self.assertEqual(1, len(threads))
        self.assertDictContainsSubset(
            self.EXPECTED_THREAD_DICT, threads[0].to_dict())

    def test_get_all_threads(self):
        # Create an anonymous feedback thread.
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1,
                self.EXPECTED_THREAD_DICT['state_name'], None,
                self.EXPECTED_THREAD_DICT['subject'], 'not used here')

            threads = feedback_services.get_all_threads(
                'exploration', self.EXP_ID_1, False)
        self.assertEqual(1, len(threads))
        self.assertDictContainsSubset(
            self.EXPECTED_THREAD_DICT, threads[0].to_dict())

        self.EXPECTED_THREAD_DICT_VIEWER['original_author_username'] = (
            self.VIEWER_USERNAME)

        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            # Viewer creates feedback thread.
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1,
                self.EXPECTED_THREAD_DICT_VIEWER['state_name'],
                self.viewer_id, self.EXPECTED_THREAD_DICT_VIEWER['subject'],
                'not used here')

            threads = feedback_services.get_all_threads(
                'exploration', self.EXP_ID_1, False)
        self.assertEqual(2, len(threads))
        self.assertDictContainsSubset(
            self.EXPECTED_THREAD_DICT_VIEWER, threads[1].to_dict())

    def test_get_total_open_threads_before_job_run(self):
        self.assertEqual(feedback_services.get_total_open_threads(
            feedback_services.get_thread_analytics_multi([self.EXP_ID_1])), 0)


        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1,
                self.EXPECTED_THREAD_DICT['state_name'], None,
                self.EXPECTED_THREAD_DICT['subject'], 'not used here')

            threads = feedback_services.get_all_threads(
                'exploration', self.EXP_ID_1, False)
        self.assertEqual(1, len(threads))

        self.assertEqual(feedback_services.get_total_open_threads(
            feedback_services.get_thread_analytics_multi([self.EXP_ID_1])), 0)

    def test_get_total_open_threads_for_single_exploration(self):

        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1,
                self.EXPECTED_THREAD_DICT['state_name'], None,
                self.EXPECTED_THREAD_DICT['subject'], 'not used here')

            threads = feedback_services.get_all_threads(
                'exploration', self.EXP_ID_1, False)
        self.assertEqual(1, len(threads))

        self._run_computation()
        self.assertEqual(feedback_services.get_total_open_threads(
            feedback_services.get_thread_analytics_multi([self.EXP_ID_1])), 1)

    def test_get_total_open_threads_for_multiple_explorations(self):

        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1,
                self.EXPECTED_THREAD_DICT['state_name'], None,
                self.EXPECTED_THREAD_DICT['subject'], 'not used here')
            feedback_services.create_thread(
                'exploration', self.EXP_ID_2,
                self.EXPECTED_THREAD_DICT['state_name'], None,
                self.EXPECTED_THREAD_DICT['subject'], 'not used here')

            threads_exp_1 = feedback_services.get_all_threads(
                'exploration', self.EXP_ID_1, False)
            self.assertEqual(1, len(threads_exp_1))
            threads_exp_2 = feedback_services.get_all_threads(
                'exploration', self.EXP_ID_2, False)
            self.assertEqual(1, len(threads_exp_2))

        def _close_thread(thread_id):
            thread = feedback_models.FeedbackThreadModel.get_by_id(thread_id)
            thread.status = feedback_models.STATUS_CHOICES_FIXED
            thread.put()

        _close_thread(threads_exp_1[0].id)

        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            self.assertEqual(len(feedback_services.get_closed_threads(
                'exploration', self.EXP_ID_1, False)), 1)
            self._run_computation()

            self.assertEqual(feedback_services.get_total_open_threads(
                feedback_services.get_thread_analytics_multi(
                    [self.EXP_ID_1, self.EXP_ID_2])), 1)

    def test_get_thread_summaries(self):

        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1,
                self.EXPECTED_THREAD_DICT['state_name'], self.user_id,
                self.EXPECTED_THREAD_DICT['subject'], 'not used here')
            feedback_services.create_thread(
                'exploration', self.EXP_ID_2,
                self.EXPECTED_THREAD_DICT['state_name'], self.user_id,
                self.EXPECTED_THREAD_DICT['subject'], 'not used here')

            # The message count parameter is missing for this thread. The thread
            # summaries function should account for this and function
            # flawlessly.
            thread_3 = feedback_models.FeedbackThreadModel(
                id='exploration.' + self.EXP_ID_3 + '.' + self.THREAD_ID,
                exploration_id=self.EXP_ID_3,
                entity_type='exploration', entity_id=self.EXP_ID_3,
                state_name='state_name',
                original_author_id=self.user_id,
                subject='Feedback',
                status=feedback_models.STATUS_CHOICES_OPEN,
                has_suggestion=False)
            thread_3.put()
            feedback_services.create_message(
                'exploration.' + self.EXP_ID_3 + '.' + self.THREAD_ID,
                self.user_id, None, None, 'not used here')


            thread_ids = subscription_services.get_all_threads_subscribed_to(
                self.user_id)
            thread_ids.append(
                'exploration.' + self.EXP_ID_3 + '.' + self.THREAD_ID)
            thread_summaries, number_of_unread_threads = (
                feedback_services.get_thread_summaries(
                    self.user_id, thread_ids))
            exploration_titles = (
                ['Bridges in England', 'Sillat Suomi', 'Leaning tower of Pisa'])

            # Fetch the threads.
            threads = []
            threads.append(feedback_services.get_thread(thread_ids[0]))
            threads.append(feedback_services.get_thread(thread_ids[1]))
            threads.append(feedback_services.get_thread(
                'exploration.' + self.EXP_ID_3 + '.' + self.THREAD_ID))
            # Check if the number of unread messages match.
            self.assertEqual(number_of_unread_threads, 0)
            for index, thread in enumerate(threads):
                thread_summary = {
                    'status': thread.status,
                    'original_author_id': thread.original_author_id,
                    'last_updated': thread_summaries[index]['last_updated'],
                    'last_message_text': 'not used here',
                    'total_message_count': 1,
                    'last_message_read': True,
                    'second_last_message_read': None,
                    'author_last_message': user_services.get_username(
                        self.user_id),
                    'author_second_last_message': None,
                    'exploration_title': exploration_titles[index]
                }
                # Check if the summaries match.
                self.assertDictContainsSubset(
                    thread_summary, thread_summaries[index])

            feedback_services.create_message(
                threads[0].id, self.owner_id, None, None, 'editor message')
            _, number_of_unread_threads = (
                feedback_services.get_thread_summaries(self.user_id, thread_ids))

        # Check if the number of unread messages is equal to 1.
        self.assertEqual(number_of_unread_threads, 1)

    def test_update_messages_read_by_the_user(self):
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1,
                self.EXPECTED_THREAD_DICT['state_name'], self.user_id,
                self.EXPECTED_THREAD_DICT['subject'], 'not used here')
            threads = feedback_services.get_all_threads(
                'exploration', self.EXP_ID_1, False)
            thread_id = threads[0].id

        messages = feedback_services.get_messages(thread_id)
        message_ids = [message.message_id for message in messages]

        # The viewer has not read in messages yet.
        self.assertEqual(self._get_all_messages_read(
            self.viewer_id, thread_id), [])

        feedback_services.update_messages_read_by_the_user(
            self.viewer_id, thread_id, message_ids)

        # Check if the message is added to the read section of the viewer.
        self.assertEqual(self._get_all_messages_read(
            self.viewer_id, thread_id), message_ids)


class EmailsTaskqueueTests(test_utils.GenericTestBase):
    """Tests for tasks in emails taskqueue."""

    def test_create_new_batch_task(self):
        user_id = 'user'
        feedback_services.enqueue_feedback_message_batch_email_task(user_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_EMAILS),
            1)

        tasks = self.get_pending_tasks(taskqueue_services.QUEUE_NAME_EMAILS)
        self.assertEqual(
            tasks[0].url, feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS)

    def test_create_new_instant_task(self):
        user_id = 'user'
        reference_dict = {
            'entity_type': 'exploration',
            'entity_id': 'eid',
            'thread_id': 'tid',
            'message_id': 'mid'
        }
        reference = feedback_domain.FeedbackMessageReference(
            reference_dict['entity_type'], reference_dict['entity_id'],
            reference_dict['thread_id'], reference_dict['message_id'])

        feedback_services.enqueue_feedback_message_instant_email_task(
            user_id, reference)
        self.assertEqual(
            self.count_jobs_in_taskqueue(taskqueue_services.QUEUE_NAME_EMAILS),
            1)

        tasks = self.get_pending_tasks(taskqueue_services.QUEUE_NAME_EMAILS)
        payload = json.loads(tasks[0].payload)
        self.assertEqual(
            tasks[0].url, feconf.TASK_URL_INSTANT_FEEDBACK_EMAILS)
        self.assertDictEqual(payload['reference_dict'], reference_dict)


class FeedbackMessageEmailTests(test_utils.GenericTestBase):
    """Tests for feedback message emails."""

    def setUp(self):
        super(FeedbackMessageEmailTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.signup('b@example.com', 'B')
        self.user_id_b = self.get_user_id_from_email('b@example.com')
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, 'Title')
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_send_feedback_message_email(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.user_id_a, 'a subject', 'some text')
                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                messagelist = feedback_services.get_messages(thread_id)
                self.assertEqual(len(messagelist), 1)

                expected_feedback_message_dict = {
                    'entity_type': 'exploration',
                    'entity_id': self.exploration.id,
                    'thread_id': thread_id,
                    'message_id': messagelist[0].message_id
                }
                # There are two jobs in the taskqueue: one for the realtime
                # event associated with creating a thread, and one for sending
                # the email.
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EMAILS), 1)
                model = feedback_models.UnsentFeedbackEmailModel.get(
                    self.editor_id)

                self.assertEqual(len(model.feedback_message_references), 1)
                self.assertDictEqual(
                    model.feedback_message_references[0],
                    expected_feedback_message_dict)
                self.assertEqual(model.retries, 0)

    def test_add_new_feedback_message(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.user_id_a, 'a subject', 'some text')
                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                feedback_services.create_message(
                    thread_id, self.user_id_a, None, None, 'editor message')
                # There are two jobs in the taskqueue: one for the realtime
                # event associated with creating a thread, and one for sending
                # the email.
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EMAILS), 1)

                messagelist = feedback_services.get_messages(thread_id)
                self.assertEqual(len(messagelist), 2)

                expected_feedback_message_dict1 = {
                    'entity_type': 'exploration',
                    'entity_id': self.exploration.id,
                    'thread_id': thread_id,
                    'message_id': messagelist[0].message_id
                }
                expected_feedback_message_dict2 = {
                    'entity_type': 'exploration',
                    'entity_id': self.exploration.id,
                    'thread_id': thread_id,
                    'message_id': messagelist[1].message_id
                }

                model = feedback_models.UnsentFeedbackEmailModel.get(
                    self.editor_id)

                self.assertEqual(len(model.feedback_message_references), 2)
                self.assertDictEqual(
                    model.feedback_message_references[0],
                    expected_feedback_message_dict1)
                self.assertDictEqual(
                    model.feedback_message_references[1],
                    expected_feedback_message_dict2)
                self.assertEqual(model.retries, 0)

    def test_email_is_not_sent_recipient_has_muted_emails_globally(self):
        user_services.update_email_preferences(
            self.editor_id, True, False, False, False)

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.user_id_a, 'a subject', 'some text')

                # Note: the job in the taskqueue represents the realtime
                # event emitted by create_thread().
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.process_and_flush_pending_tasks()
                messages = self.mail_stub.get_sent_messages(
                    to=self.EDITOR_EMAIL)
                self.assertEqual(len(messages), 0)

    def test_email_is_not_sent_recipient_has_muted_this_exploration(self):
        user_services.set_email_preferences_for_exploration(
            self.editor_id, self.exploration.id,
            mute_feedback_notifications=True)

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.user_id_a, 'a subject', 'some text')

                # Note: the job in the taskqueue represents the realtime
                # event emitted by create_thread().
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.process_and_flush_pending_tasks()
                messages = self.mail_stub.get_sent_messages(
                    to=self.EDITOR_EMAIL)
                self.assertEqual(len(messages), 0)

    def test_that_emails_are_not_sent_for_anonymous_user(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name', None,
                    'a subject', 'some text')

                # Note: the job in the taskqueue represents the realtime
                # event emitted by create_thread().
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.process_and_flush_pending_tasks()
                messages = self.mail_stub.get_sent_messages(
                    to=self.EDITOR_EMAIL)
                self.assertEqual(len(messages), 0)

    def test_that_emails_are_sent_for_registered_user(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):

                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.user_id_a, 'a subject', 'some text')

                # There are two jobs in the taskqueue: one for the realtime
                # event associated with creating a thread, and one for sending
                # the email.
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EMAILS), 1)

                tasks = self.get_pending_tasks(
                    taskqueue_services.QUEUE_NAME_EMAILS)
                self.assertEqual(
                    tasks[0].url, feconf.TASK_URL_FEEDBACK_MESSAGE_EMAILS)
                self.process_and_flush_pending_tasks()

                messages = self.mail_stub.get_sent_messages(
                    to=self.EDITOR_EMAIL)
                self.assertEqual(len(messages), 1)

    def test_that_emails_are_not_sent_if_service_is_disabled(self):
        cannot_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        cannot_send_feedback_message_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', False)
        with cannot_send_emails_ctx, cannot_send_feedback_message_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.user_id_a, 'a subject', 'some text')

                # Note: the job in the taskqueue represents the realtime
                # event emitted by create_thread().
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.process_and_flush_pending_tasks()
                messages = self.mail_stub.get_sent_messages(
                    to=self.EDITOR_EMAIL)
                self.assertEqual(len(messages), 0)

    def test_that_emails_are_not_sent_for_thread_status_changes(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.user_id_a, 'a subject', '')

                # Note: the job in the taskqueue represents the realtime
                # event emitted by create_thread().
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.process_and_flush_pending_tasks()
                messages = self.mail_stub.get_sent_messages(
                    to=self.EDITOR_EMAIL)
                self.assertEqual(len(messages), 0)

    def test_that_email_are_not_sent_to_author_himself(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.editor_id, 'a subject', 'A message')

                # Note: the job in the taskqueue represents the realtime
                # event emitted by create_thread().
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.process_and_flush_pending_tasks()
                messages = self.mail_stub.get_sent_messages(
                    to=self.EDITOR_EMAIL)
                self.assertEqual(len(messages), 0)

    def test_that_email_is_sent_for_reply_on_feedback(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.user_id_a, 'a subject', 'A message')
                # There are two jobs in the taskqueue: one for the realtime
                # event associated with creating a thread, and one for sending
                # the email.
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EMAILS), 1)
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.process_and_flush_pending_tasks()

                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                feedback_services.create_message(
                    thread_id, self.editor_id, None, None, 'editor message')
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EMAILS), 1)
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 0)
                self.process_and_flush_pending_tasks()

    def test_that_email_is_sent_for_changing_status_of_thread(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                self.user_id_a, 'a subject', 'A message')
                # There are two jobs in the taskqueue: one for the realtime
                # event associated with creating a thread, and one for sending
                # the email.
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EMAILS), 1)
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.process_and_flush_pending_tasks()

                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                feedback_services.create_message(
                    thread_id, self.editor_id,
                    feedback_models.STATUS_CHOICES_FIXED, None, '')
                # There are two jobs in the taskqueue: one for the realtime event
                # associated with changing subject of thread, and one for sending
                # the email.
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EMAILS), 1)
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.process_and_flush_pending_tasks()

    def test_that_email_is_sent_for_each_feedback_message(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.user_id_a, 'a subject', 'A message')
                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id
                # There are two jobs in the taskqueue: one for the realtime
                # event associated with creating a thread, and one for sending
                # the email.
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EMAILS), 1)
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 1)
                self.process_and_flush_pending_tasks()

                feedback_services.create_message(
                    thread_id, self.editor_id, None, None, 'editor message')
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EMAILS), 1)
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 0)
                self.process_and_flush_pending_tasks()

                feedback_services.create_message(
                    thread_id, self.editor_id, None, None, 'editor message2')
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EMAILS), 1)
                self.assertEqual(
                    self.count_jobs_in_taskqueue(
                        taskqueue_services.QUEUE_NAME_EVENTS), 0)
                self.process_and_flush_pending_tasks()

    def test_that_reply_to_id_is_created(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.user_id_a, 'a subject', 'A message')
                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                feedback_services.create_message(
                    thread_id, self.user_id_b, None, None, 'user b message')
                # Check that reply_to id is created for user A.
                model = email_models.FeedbackEmailReplyToIdModel.get(
                    self.user_id_a, thread_id)
                cross_model = (
                    email_models.FeedbackEmailReplyToIdModel.get_by_reply_to_id(
                        model.reply_to_id))
                self.assertEqual(model, cross_model)
                self.assertEqual(cross_model.user_id, self.user_id_a)

                feedback_services.create_message(
                    thread_id, self.user_id_a, None, None, 'user a message')
                # Check that reply_to id is created for user B.
                model = email_models.FeedbackEmailReplyToIdModel.get(
                    self.user_id_b, thread_id)
                cross_model = (
                    email_models.FeedbackEmailReplyToIdModel.get_by_reply_to_id(
                        model.reply_to_id))
                self.assertEqual(model, cross_model)
                self.assertEqual(cross_model.user_id, self.user_id_b)


class FeedbackMessageBatchEmailHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(FeedbackMessageBatchEmailHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, 'Title')
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_that_emails_are_sent(self):
        expected_email_html_body = (
            'Hi editor,<br>'
            '<br>'
            'You\'ve received a new message on your Oppia explorations:<br>'
            '<ul>'
            '<li><a href="https://www.oppia.org/create/A#/feedback">Title</a>:'
            '<br>'
            '<ul><li>some text<br></li>'
            '</ul></li></ul>'
            'You can view and reply to your messages from your '
            '<a href="https://www.oppia.org/creator_dashboard">dashboard</a>.'
            '<br>'
            '<br>Thanks, and happy teaching!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi editor,\n'
            '\n'
            'You\'ve received a new message on your Oppia explorations:\n'
            '- Title:\n'
            '- some text\n'
            'You can view and reply to your messages from your dashboard.\n'
            '\n'
            'Thanks, and happy teaching!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.new_user_id, 'a subject', 'some text')

                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                messagelist = feedback_services.get_messages(thread_id)
                self.assertEqual(len(messagelist), 1)

                self.process_and_flush_pending_tasks()

                messages = self.mail_stub.get_sent_messages(
                    to=self.EDITOR_EMAIL)
                self.assertEqual(len(messages), 1)
                self.assertEqual(
                    messages[0].html.decode(),
                    expected_email_html_body)
                self.assertEqual(
                    messages[0].body.decode(),
                    expected_email_text_body)

    def test_that_correct_emails_are_sent_for_multiple_feedback(self):
        expected_email_html_body = (
            'Hi editor,<br>'
            '<br>'
            'You\'ve received 2 new messages on your Oppia explorations:<br>'
            '<ul>'
            '<li><a href="https://www.oppia.org/create/A#/feedback">Title</a>:'
            '<br>'
            '<ul><li>some text<br></li>'
            '<li>more text<br></li>'
            '</ul></li></ul>'
            'You can view and reply to your messages from your '
            '<a href="https://www.oppia.org/creator_dashboard">dashboard</a>.'
            '<br>'
            '<br>Thanks, and happy teaching!<br>'
            '<br>'
            'Best wishes,<br>'
            'The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi editor,\n'
            '\n'
            'You\'ve received 2 new messages on your Oppia explorations:\n'
            '- Title:\n'
            '- some text\n'
            '- more text\n'
            'You can view and reply to your messages from your dashboard.\n'
            '\n'
            'Thanks, and happy teaching!\n'
            '\n'
            'Best wishes,\n'
            'The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.new_user_id, 'a subject', 'some text')

                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                feedback_services.create_message(
                    thread_id, self.new_user_id,
                    feedback_models.STATUS_CHOICES_OPEN, 'subject', 'more text')

                messagelist = feedback_services.get_messages(thread_id)
                self.assertEqual(len(messagelist), 2)

                self.process_and_flush_pending_tasks()

                messages = self.mail_stub.get_sent_messages(
                    to=self.EDITOR_EMAIL)
                self.assertEqual(len(messages), 1)
                self.assertEqual(
                    messages[0].html.decode(),
                    expected_email_html_body)
                self.assertEqual(
                    messages[0].body.decode(),
                    expected_email_text_body)

    def test_that_emails_are_not_sent_if_already_seen(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.new_user_id, 'a subject', 'some text')

                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                self.login(self.EDITOR_EMAIL)
                csrf_token = self.get_csrf_token_from_response(
                    self.testapp.get('/create/%s' % self.exploration.id))
                self.post_json(
                    '%s/%s' % (
                        feconf.FEEDBACK_THREAD_VIEW_EVENT_URL, thread_id),
                    {'thread_id': thread_id}, csrf_token)

                self.process_and_flush_pending_tasks()
                messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
                self.assertEqual(len(messages), 0)


class SuggestionEmailHandlerTest(test_utils.GenericTestBase):

    def setUp(self):
        super(SuggestionEmailHandlerTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.editor = user_services.UserActionsInfo(self.editor_id)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, 'Title')
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_that_emails_are_sent(self):
        expected_email_html_body = (
            'Hi editor,<br>'
            'newuser has submitted a new suggestion for your Oppia '
            'exploration, '
            '<a href="https://www.oppia.org/create/A">"Title"</a>.<br>'
            'You can accept or reject this suggestion by visiting the '
            '<a href="https://www.oppia.org/create/A#/feedback">'
            'feedback page</a> '
            'for your exploration.<br>'
            '<br>'
            'Thanks!<br>'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi editor,\n'
            'newuser has submitted a new suggestion for your Oppia '
            'exploration, "Title".\n'
            'You can accept or reject this suggestion by visiting the '
            'feedback page for your exploration.\n'
            '\n'
            'Thanks!\n'
            '- The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_suggestion(
                self.exploration.id, self.new_user_id, self.exploration.version,
                'a state', 'simple description', {'type': 'text', 'value': ''})

            self.process_and_flush_pending_tasks()

            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                messages[0].html.decode(),
                expected_email_html_body)
            self.assertEqual(
                messages[0].body.decode(),
                expected_email_text_body)

    def test_email_is_not_sent_recipient_has_muted_this_exploration(self):
        user_services.set_email_preferences_for_exploration(
            self.editor_id, self.exploration.id,
            mute_suggestion_notifications=True)

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_suggestion(
                self.exploration.id, self.new_user_id, self.exploration.version,
                'state', 'description', {'type': 'text', 'value': 'text'})

            self.process_and_flush_pending_tasks()

            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_correct_email_is_sent_for_multiple_recipients(self):
        rights_manager.assign_role_for_exploration(
            self.editor, self.exploration.id, self.owner_id,
            rights_manager.ROLE_OWNER)

        expected_editor_email_html_body = (
            'Hi editor,<br>'
            'newuser has submitted a new suggestion for your Oppia '
            'exploration, '
            '<a href="https://www.oppia.org/create/A">"Title"</a>.<br>'
            'You can accept or reject this suggestion by visiting the '
            '<a href="https://www.oppia.org/create/A#/feedback">'
            'feedback page</a> '
            'for your exploration.<br>'
            '<br>'
            'Thanks!<br>'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_owner_email_html_body = (
            'Hi owner,<br>'
            'newuser has submitted a new suggestion for your Oppia '
            'exploration, '
            '<a href="https://www.oppia.org/create/A">"Title"</a>.<br>'
            'You can accept or reject this suggestion by visiting the '
            '<a href="https://www.oppia.org/create/A#/feedback">'
            'feedback page</a> '
            'for your exploration.<br>'
            '<br>'
            'Thanks!<br>'
            '- The Oppia Team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_editor_email_text_body = (
            'Hi editor,\n'
            'newuser has submitted a new suggestion for your Oppia '
            'exploration, "Title".\n'
            'You can accept or reject this suggestion by visiting the '
            'feedback page for your exploration.\n'
            '\n'
            'Thanks!\n'
            '- The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        expected_owner_email_text_body = (
            'Hi owner,\n'
            'newuser has submitted a new suggestion for your Oppia '
            'exploration, "Title".\n'
            'You can accept or reject this suggestion by visiting the '
            'feedback page for your exploration.\n'
            '\n'
            'Thanks!\n'
            '- The Oppia Team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_suggestion(
                self.exploration.id, self.new_user_id, self.exploration.version,
                'a state', 'simple description', {'type': 'text', 'value': ''})

            self.process_and_flush_pending_tasks()

            editor_messages = (
                self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL))
            self.assertEqual(len(editor_messages), 1)
            self.assertEqual(
                editor_messages[0].html.decode(),
                expected_editor_email_html_body)
            self.assertEqual(
                editor_messages[0].body.decode(),
                expected_editor_email_text_body)

            owner_messages = (
                self.mail_stub.get_sent_messages(to=self.OWNER_EMAIL))
            self.assertEqual(len(owner_messages), 1)
            self.assertEqual(
                owner_messages[0].html.decode(),
                expected_owner_email_html_body)
            self.assertEqual(
                owner_messages[0].body.decode(),
                expected_owner_email_text_body)


class FeedbackMessageInstantEmailHandlerTests(test_utils.GenericTestBase):

    def setUp(self):
        super(FeedbackMessageInstantEmailHandlerTests, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, 'Title')
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_that_emails_are_sent_for_feedback_message(self):
        expected_email_html_body = (
            'Hi newuser,<br><br>'
            'New update to thread "a subject" on '
            '<a href="https://www.oppia.org/create/A#/feedback">Title</a>:<br>'
            '<ul><li>editor: editor message<br></li></ul>'
            '(You received this message because you are a '
            'participant in this thread.)<br><br>'
            'Best wishes,<br>'
            'The Oppia team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi newuser,\n'
            '\n'
            'New update to thread "a subject" on Title:\n'
            '- editor: editor message\n'
            '(You received this message because you are a'
            ' participant in this thread.)\n'
            '\n'
            'Best wishes,\n'
            'The Oppia team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.new_user_id, 'a subject', 'some text')
                self.process_and_flush_pending_tasks()

                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                feedback_services.create_message(
                    thread_id, self.editor_id, None, None, 'editor message')
                self.process_and_flush_pending_tasks()

                messages = self.mail_stub.get_sent_messages(
                    to=self.NEW_USER_EMAIL)
                self.assertEqual(len(messages), 1)
                self.assertEqual(
                    messages[0].html.decode(),
                    expected_email_html_body)
                self.assertEqual(
                    messages[0].body.decode(),
                    expected_email_text_body)

    def test_that_emails_are_sent_for_status_change(self):
        expected_email_html_body = (
            'Hi newuser,<br><br>'
            'New update to thread "a subject" on '
            '<a href="https://www.oppia.org/create/A#/feedback">Title</a>:<br>'
            '<ul><li>editor: changed status from open to fixed<br></li></ul>'
            '(You received this message because you are a '
            'participant in this thread.)<br><br>'
            'Best wishes,<br>'
            'The Oppia team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body = (
            'Hi newuser,\n'
            '\n'
            'New update to thread "a subject" on Title:\n'
            '- editor: changed status from open to fixed\n'
            '(You received this message because you are a'
            ' participant in this thread.)\n'
            '\n'
            'Best wishes,\n'
            'The Oppia team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.new_user_id, 'a subject', 'some text')
                self.process_and_flush_pending_tasks()

                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                feedback_services.create_message(
                    thread_id, self.editor_id,
                    feedback_models.STATUS_CHOICES_FIXED, None, '')
                self.process_and_flush_pending_tasks()

                messages = self.mail_stub.get_sent_messages(
                    to=self.NEW_USER_EMAIL)
                self.assertEqual(len(messages), 1)
                self.assertEqual(
                    messages[0].html.decode(),
                    expected_email_html_body)
                self.assertEqual(
                    messages[0].body.decode(),
                    expected_email_text_body)

    def test_that_emails_are_sent_for_both_status_change_and_message(self):
        expected_email_html_body_message = (
            'Hi newuser,<br><br>'
            'New update to thread "a subject" on '
            '<a href="https://www.oppia.org/create/A#/feedback">Title</a>:<br>'
            '<ul><li>editor: editor message<br></li></ul>'
            '(You received this message because you are a '
            'participant in this thread.)<br><br>'
            'Best wishes,<br>'
            'The Oppia team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body_message = (
            'Hi newuser,\n'
            '\n'
            'New update to thread "a subject" on Title:\n'
            '- editor: editor message\n'
            '(You received this message because you are a'
            ' participant in this thread.)\n'
            '\n'
            'Best wishes,\n'
            'The Oppia team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')

        expected_email_html_body_status = (
            'Hi newuser,<br><br>'
            'New update to thread "a subject" on '
            '<a href="https://www.oppia.org/create/A#/feedback">Title</a>:<br>'
            '<ul><li>editor: changed status from open to fixed<br></li></ul>'
            '(You received this message because you are a '
            'participant in this thread.)<br><br>'
            'Best wishes,<br>'
            'The Oppia team<br>'
            '<br>'
            'You can change your email preferences via the '
            '<a href="https://www.example.com">Preferences</a> page.')

        expected_email_text_body_status = (
            'Hi newuser,\n'
            '\n'
            'New update to thread "a subject" on Title:\n'
            '- editor: changed status from open to fixed\n'
            '(You received this message because you are a'
            ' participant in this thread.)\n'
            '\n'
            'Best wishes,\n'
            'The Oppia team\n'
            '\n'
            'You can change your email preferences via the Preferences page.')
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    self.new_user_id, 'a subject', 'some text')
                self.process_and_flush_pending_tasks()

                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                feedback_services.create_message(
                    thread_id, self.editor_id,
                    feedback_models.STATUS_CHOICES_FIXED, None,
                    'editor message')
                self.process_and_flush_pending_tasks()

                messages = self.mail_stub.get_sent_messages(
                    to=self.NEW_USER_EMAIL)
                self.assertEqual(len(messages), 2)
                self.assertEqual(
                    messages[0].html.decode(),
                    expected_email_html_body_status)
                self.assertEqual(
                    messages[0].body.decode(),
                    expected_email_text_body_status)
                self.assertEqual(
                    messages[1].html.decode(),
                    expected_email_html_body_message)
                self.assertEqual(
                    messages[1].body.decode(),
                    expected_email_text_body_message)

    def test_that_emails_are_not_sent_to_anonymous_user(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', True):
                # Create thread as anonoymous user.
                feedback_services.create_thread(
                    'exploration', self.exploration.id, 'a_state_name',
                    None, 'a subject', 'some text')
                self.process_and_flush_pending_tasks()

                threadlist = feedback_services.get_all_threads(
                    'exploration', self.exploration.id, False)
                thread_id = threadlist[0].id

                feedback_services.create_message(
                    thread_id, self.editor_id,
                    feedback_models.STATUS_CHOICES_FIXED, None,
                    'editor message')
                self.process_and_flush_pending_tasks()

                messages = self.mail_stub.get_sent_messages()
                self.assertEqual(len(messages), 0)
