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

from core.domain import exp_services
from core.domain import feedback_services
from core.platform import models
(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])
import test_utils


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

    def _generate_thread_id(self, exp_id):
        return '1234'

    def _create_suggestion_objects_for_tests(self):
        with self.swap(feedback_models.FeedbackThreadModel, 
                       'generate_new_thread_id', self._generate_thread_id):
            (feedback_services.
                create_suggestion('exp_id1', 'author_id', 3,
                                  'state_name', {'old_content': {}}))
        with self.swap(feedback_models.FeedbackThreadModel, 
                       'generate_new_thread_id', self._generate_thread_id):
            (feedback_services.
                create_suggestion('exp_id2', 'author_id', 3,
                                  'state_name', {'old_content': {}}))

    def test_create_and_get_suggestion(self):
        with self.swap(feedback_models.FeedbackThreadModel, 
                       'generate_new_thread_id', self._generate_thread_id):
            (feedback_services.
                create_suggestion('exploration_id', 'author_id', 3,
                                  'state_name', {'old_content': {}}))
            suggestion = feedback_services.get_suggestion(
                'exploration_id', '1234')
            thread = feedback_models.FeedbackThreadModel.get(
                'exploration_id.1234')
            self.assertEqual(thread.status, 
                             feedback_models.STATUS_CHOICES_OPEN)
            self.assertEqual(suggestion.exploration_id, 'exploration_id')
            self.assertEqual(suggestion.author_id, 'author_id')
            self.assertEqual(suggestion.exploration_version, 3)
            self.assertEqual(suggestion.state_name, 'state_name')
            self.assertEqual(suggestion.state_content, {'old_content': {}})
            self.assertEqual(suggestion.status, 
                         feedback_models.SUGGESTION_STATUS_NEW)

    def _get_pending_suggestion_threads(self, exploration_id):
        thread1 = feedback_models.FeedbackThreadModel(
            id='exp_id1.1234',
            exploration_id='exp_id1',
            state_name='state_name',
            original_author_id='author_id',
            subject='SUGGESTION',
            has_suggestion=True) 
        thread2 = feedback_models.FeedbackThreadModel(
            id='exp_id1.4567',
            exploration_id='exp_id1',
            state_name='state_name',
            original_author_id='author_id',
            subject='SUGGESTION',
            status=feedback_models.STATUS_CHOICES_FIXED,
            has_suggestion=True)
        thread3 = feedback_models.FeedbackThreadModel(
            id='exp_id1.6789',
            exploration_id='exp_id1',
            state_name='state_name',
            original_author_id='author_id',
            subject='SUGGESTION',
            status=feedback_models.STATUS_CHOICES_IGNORED,
            has_suggestion=True)
        return [thread1, thread2, thread3]

    def _get_suggestions(self, id):
        suggestion1 = feedback_models.SuggestionModel(
            id='exp_id1.1234',
            author_id='author_id',
            exploration_id='exp_id1',
            exploration_version=1,
            state_name='state_name',
            state_content={'old_content': {}},
            status='new')
        suggestion2 = feedback_models.SuggestionModel(
            id='exp_id1.4567',
            author_id='author_id',
            exploration_id='exp_id1',
            exploration_version=1,
            state_name='state_name',
            state_content={'old_content': {}},
            status='accepted')
        suggestion3 = feedback_models.SuggestionModel(
            id='exp_id1.6789',
            author_id='author_id',
            exploration_id='exp_id1',
            exploration_version=1,
            state_name='state_name',
            state_content={'old_content': {}},
            status='rejected')
        suggestions = [suggestion1, suggestion2, suggestion3]
        for suggestion in suggestions:
            if suggestion.id == id:
                return suggestion
        return None

    def test_get_suggestion_threads_get_only_pending(self):
        with self.swap(feedback_models.FeedbackThreadModel, 'get_threads',
                       self._get_pending_suggestion_threads):
            with self.swap(feedback_models.SuggestionModel, 'get',
                           self._get_suggestions):
                threads = feedback_services.get_suggestion_threads(
                    'exp_id1', True)
        self.assertEqual(len(threads), 1)
        self.assertEqual(threads[0].id, 'exp_id1.1234')

    def test_get_suggestion_threads_get_all_threads(self):
        with self.swap(feedback_models.FeedbackThreadModel, 'get_threads',
                       self._get_pending_suggestion_threads):
            with self.swap(feedback_models.SuggestionModel, 'get',
                           self._get_suggestions):
                threads = feedback_services.get_suggestion_threads(
                    'exp_id1', False)
        self.assertEqual(len(threads), 3)
        self.assertEqual(threads[0].id, 'exp_id1.1234')
        self.assertEqual(threads[1].id, 'exp_id1.4567')
        self.assertEqual(threads[2].id, 'exp_id1.6789')
    
    def _return_true(self, thread_id, exploration_id):
        return True
    
    def _return_false(self, thread_id, exploration_id):
        return False

    def _null_fn(self, user_id, exploration_id, change_list, commit_message):
        pass

    def test_accept_suggestion_valid_suggestion(self):
        self._create_suggestion_objects_for_tests()
        with self.swap(feedback_services, '_is_suggestion_valid', 
                       self._return_true):
            with self.swap(exp_services, 'update_exploration', self._null_fn):
                (feedback_services.accept_suggestion(
                    'user_id', 'change_list', '1234', 'exp_id1'))
            suggestion = feedback_services.get_suggestion(
                'exp_id1', '1234')
            thread = feedback_models.FeedbackThreadModel.get('exp_id1.1234')
            self.assertEqual(suggestion.status, 
                             feedback_models.SUGGESTION_STATUS_ACCEPTED)
            self.assertEqual(thread.status, 
                             feedback_models.STATUS_CHOICES_FIXED)

    def test_accept_suggestion_invalid_suggestion(self):
        self._create_suggestion_objects_for_tests()
        with self.swap(feedback_services, '_is_suggestion_valid', 
                       self._return_false):
            with self.assertRaisesRegexp(Exception, 'Suggestion Invalid'):
                (feedback_services.accept_suggestion(
                    'user_id', 'change_list', '1234', 'exp_id2'))
            suggestion = feedback_services.get_suggestion(
                'exp_id2', '1234')
            thread = feedback_models.FeedbackThreadModel.get('exp_id2.1234')
            self.assertEqual(suggestion.status, 
                             feedback_models.SUGGESTION_STATUS_REJECTED)
            self.assertEqual(thread.status, 
                             feedback_models.STATUS_CHOICES_IGNORED)

    def test_reject_suggestion(self):
        self._create_suggestion_objects_for_tests()
        feedback_services.reject_suggestion('1234', 'exp_id2')
        suggestion = feedback_services.get_suggestion(
            'exp_id2', '1234')
        thread = feedback_models.FeedbackThreadModel.get('exp_id2.1234')
        self.assertEqual(suggestion.status, 
                         feedback_models.SUGGESTION_STATUS_REJECTED)
        self.assertEqual(thread.status, 
                         feedback_models.STATUS_CHOICES_IGNORED)

