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
from core.domain import feedback_jobs_continuous_test
from core.domain import feedback_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])
taskqueue_services = models.Registry.import_taskqueue_services()


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

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'

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

    def setUp(self):
        super(FeedbackThreadUnitTests, self).setUp()

        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        user_services.get_or_create_user(self.viewer_id, self.VIEWER_EMAIL)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

    def _run_computation(self):
        (feedback_jobs_continuous_test.ModifiedFeedbackAnalyticsAggregator.
         start_computation())
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
            1)
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                queue_name=taskqueue_services.QUEUE_NAME_DEFAULT),
            0)
        self.process_and_flush_pending_tasks()

    def test_get_all_threads(self):
        # Create an anonymous feedback thread
        feedback_services.create_thread(
            self.EXP_ID_1, self.EXPECTED_THREAD_DICT['state_name'], None,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')

        threads = feedback_services.get_all_threads(self.EXP_ID_1, False)
        self.assertEqual(1, len(threads))
        self.assertDictContainsSubset(self.EXPECTED_THREAD_DICT,
                                      threads[0].to_dict())

        self.EXPECTED_THREAD_DICT_VIEWER['original_author_username'] = (
            self.VIEWER_USERNAME)

        # Viewer creates feedback thread
        feedback_services.create_thread(
            self.EXP_ID_1, self.EXPECTED_THREAD_DICT_VIEWER['state_name'],
            self.viewer_id, self.EXPECTED_THREAD_DICT_VIEWER['subject'],
            'not used here')

        threads = feedback_services.get_all_threads(self.EXP_ID_1, False)
        self.assertEqual(2, len(threads))
        self.assertDictContainsSubset(self.EXPECTED_THREAD_DICT_VIEWER,
                                      threads[1].to_dict())

    def test_get_total_open_threads_before_job_run(self):
        self.assertEqual(feedback_services.get_total_open_threads(
            feedback_services.get_thread_analytics_multi([self.EXP_ID_1])), 0)

        feedback_services.create_thread(
            self.EXP_ID_1, self.EXPECTED_THREAD_DICT['state_name'], None,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')

        threads = feedback_services.get_all_threads(self.EXP_ID_1, False)
        self.assertEqual(1, len(threads))

        self.assertEqual(feedback_services.get_total_open_threads(
            feedback_services.get_thread_analytics_multi([self.EXP_ID_1])), 0)

    def test_get_total_open_threads_for_single_exploration(self):
        feedback_services.create_thread(
            self.EXP_ID_1, self.EXPECTED_THREAD_DICT['state_name'], None,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')

        threads = feedback_services.get_all_threads(self.EXP_ID_1, False)
        self.assertEqual(1, len(threads))

        self._run_computation()
        self.assertEqual(feedback_services.get_total_open_threads(
            feedback_services.get_thread_analytics_multi([self.EXP_ID_1])), 1)

    def test_get_total_open_threads_for_multiple_explorations(self):
        feedback_services.create_thread(
            self.EXP_ID_1, self.EXPECTED_THREAD_DICT['state_name'], None,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')
        feedback_services.create_thread(
            self.EXP_ID_2, self.EXPECTED_THREAD_DICT['state_name'], None,
            self.EXPECTED_THREAD_DICT['subject'], 'not used here')

        threads_exp_1 = feedback_services.get_all_threads(self.EXP_ID_1, False)
        self.assertEqual(1, len(threads_exp_1))
        threads_exp_2 = feedback_services.get_all_threads(self.EXP_ID_2, False)
        self.assertEqual(1, len(threads_exp_2))

        def _close_thread(exp_id, thread_id):
            thread = (feedback_models.FeedbackThreadModel.
                      get_by_exp_and_thread_id(exp_id, thread_id))
            thread.status = feedback_models.STATUS_CHOICES_FIXED
            thread.put()

        _close_thread(self.EXP_ID_1, threads_exp_1[0].get_thread_id())
        self.assertEqual(
            len(feedback_services.get_closed_threads(self.EXP_ID_1, False)), 1)
        self._run_computation()

        self.assertEqual(feedback_services.get_total_open_threads(
            feedback_services.get_thread_analytics_multi(
                [self.EXP_ID_1, self.EXP_ID_2])), 1)


class EmailsTaskqueueTests(test_utils.GenericTestBase):
    """Tests for tasks in emails taskqueue."""

    def test_create_new_task(self):
        user_id = 'user'
        feedback_services.enqueue_feedback_message_email_task(user_id)
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)

        tasks = self.get_pending_tasks()
        self.assertEqual(
            tasks[0].url, feconf.FEEDBACK_MESSAGE_EMAIL_HANDLER_URL)


class FeedbackMessageEmailTests(test_utils.GenericTestBase):
    """Tests for feedback message emails."""

    def setUp(self):
        super(FeedbackMessageEmailTests, self).setUp()
        self.signup('a@example.com', 'A')
        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, 'Title')
        self.thread_id = 'thread'
        self.message_id1 = 'msg1'
        self.message_id2 = 'msg2'
        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

    def test_send_feedback_message_email(self):
        feedback_services.add_message_to_email_buffer(
            self.user_id_a, self.exploration.id, self.thread_id,
            self.message_id1)
        self.assertEqual(self.count_jobs_in_taskqueue(), 1)

        expected_feedback_message_dict = {
            'exploration_id': self.exploration.id,
            'thread_id': self.thread_id,
            'message_id': self.message_id1
        }
        model = feedback_models.UnsentFeedbackEmailModel.get(self.editor_id)

        self.assertEqual(len(model.feedback_message_references), 1)
        self.assertDictEqual(
            model.feedback_message_references[0],
            expected_feedback_message_dict)
        self.assertEqual(model.retries, 0)

    def test_add_new_feedback_message(self):
        feedback_services.add_message_to_email_buffer(
            self.user_id_a, self.exploration.id, self.thread_id,
            self.message_id1)
        feedback_services.add_message_to_email_buffer(
            self.user_id_a, self.exploration.id, self.thread_id,
            self.message_id2)

        self.assertEqual(self.count_jobs_in_taskqueue(), 1)

        expected_feedback_message_dict1 = {
            'exploration_id': self.exploration.id,
            'thread_id': self.thread_id,
            'message_id': self.message_id1
        }
        expected_feedback_message_dict2 = {
            'exploration_id': self.exploration.id,
            'thread_id': self.thread_id,
            'message_id': self.message_id2
        }

        model = feedback_models.UnsentFeedbackEmailModel.get(self.editor_id)

        self.assertEqual(len(model.feedback_message_references), 2)
        self.assertDictEqual(
            model.feedback_message_references[0],
            expected_feedback_message_dict1)
        self.assertDictEqual(
            model.feedback_message_references[1],
            expected_feedback_message_dict2)
        self.assertEqual(model.retries, 0)

    def test_email_is_not_sent_if_recipient_has_declined_such_emails(self):
        user_services.update_email_preferences(
            self.editor_id, True, False, False)

        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                self.exploration.id, 'a_state_name', self.user_id_a,
                'a subject', 'some text')

            # Note: the job in the taskqueue represents the realtime
            # event emitted by create_thread().
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_emails_are_not_sent_for_anonymous_user(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                self.exploration.id, 'a_state_name', None, 'a subject',
                'some text')

            # Note: the job in the taskqueue represents the realtime
            # event emitted by create_thread().
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_emails_are_sent_for_registered_user(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                self.exploration.id, 'a_state_name', self.user_id_a,
                'a subject', 'some text')

            # There are two jobs in the taskqueue: one for the realtime even
            # associated with creating a thread, and one for sending the email.
            self.assertEqual(self.count_jobs_in_taskqueue(), 2)

            tasks = self.get_pending_tasks()
            self.assertEqual(
                tasks[0].url, feconf.FEEDBACK_MESSAGE_EMAIL_HANDLER_URL)
            self.process_and_flush_pending_tasks()

            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 1)

    def test_that_emails_are_not_sent_if_service_is_disabled(self):
        cannot_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', False)
        cannot_send_feedback_message_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', False)
        with cannot_send_emails_ctx, cannot_send_feedback_message_email_ctx:
            feedback_services.create_thread(
                self.exploration.id, 'a_state_name', self.user_id_a,
                'a subject', 'some text')

            # Note: the job in the taskqueue represents the realtime
            # event emitted by create_thread().
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_emails_are_not_sent_for_thread_status_changes(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                self.exploration.id, 'a_state_name', self.user_id_a,
                'a subject', '')

            # Note: the job in the taskqueue represents the realtime
            # event emitted by create_thread().
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)

    def test_that_email_are_not_sent_to_author_himself(self):
        with self.can_send_emails_ctx, self.can_send_feedback_email_ctx:
            feedback_services.create_thread(
                self.exploration.id, 'a_state_name', self.editor_id,
                'a subject', 'A message')

            # Note: the job in the taskqueue represents the realtime
            # event emitted by create_thread().
            self.assertEqual(self.count_jobs_in_taskqueue(), 1)
            self.process_and_flush_pending_tasks()
            messages = self.mail_stub.get_sent_messages(to=self.EDITOR_EMAIL)
            self.assertEqual(len(messages), 0)
