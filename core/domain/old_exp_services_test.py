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

from constants import constants
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils

(feedback_models,) = models.Registry.import_models([models.NAMES.feedback])


# These are tests for the old suggestions framework. The services tested here
# add suggestions, list them and perform actions on them (like accepting and
# rejecting). The old suggestion framework is incompatible with the new feedback
# thread framework as the new models have ids of the form
# entity_type.entity_id.string. The old suggestion framework uses
# exploration_id.string as its id and also expects the id to match the thread
# linked to it, which is not possible in the new feedback framework. So these
# tests are deprecated, and can be deleted after successful migration to the new
# feedback framework.
class SuggestionActionUnitTests(test_utils.GenericTestBase):
    """Test learner suggestion action functions in exp_services."""
    EXP_ID1 = 'exp_id1'
    EXP_ID2 = 'exp_id2'
    THREAD_ID1 = EXP_ID1 + '.1111'
    THREAD_ID2 = EXP_ID2 + '.1111'
    USER_EMAIL = 'user@123.com'
    EDITOR_EMAIL = 'editor@123.com'
    USERNAME = 'user123'
    EDITOR_USERNAME = 'editor123'
    COMMIT_MESSAGE = 'commit message'
    EMPTY_COMMIT_MESSAGE = ' '

    def _generate_thread_id_1(self, unused_exp_id):
        return self.THREAD_ID1

    def _generate_thread_id_2(self, unused_exp_id):
        return self.THREAD_ID2

    def _return_true(self, unused_thread_id, unused_exploration_id=''):
        return True

    def _return_false(self, unused_thread_id, unused_exploration_id=''):
        return False

    def _check_commit_message(
            self, unused_user_id, unused_exploration_id, unused_change_list,
            commit_message, is_suggestion):
        self.assertTrue(is_suggestion)
        self.assertEqual(
            commit_message, 'Accepted suggestion by %s: %s' % (
                self.USERNAME, self.COMMIT_MESSAGE))

    def setUp(self):
        super(SuggestionActionUnitTests, self).setUp()
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        user_services.create_new_user(self.user_id, self.USER_EMAIL)
        user_services.create_new_user(self.editor_id, self.EDITOR_EMAIL)
        self.signup(self.USER_EMAIL, self.USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        exploration = self.save_new_valid_exploration(
            self.EXP_ID1, self.editor_id)
        self.save_new_valid_exploration(self.EXP_ID2, self.editor_id)
        self.initial_state_name = exploration.init_state_name
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(
                feedback_models.FeedbackThreadModel,
                'generate_new_thread_id', self._generate_thread_id_1):
                feedback_services.create_suggestion(
                    self.EXP_ID1, self.user_id, 3, self.initial_state_name,
                    'description', 'new text')
            with self.swap(
                feedback_models.FeedbackThreadModel,
                'generate_new_thread_id', self._generate_thread_id_2):
                feedback_services.create_suggestion(
                    self.EXP_ID2, self.user_id, 3, self.initial_state_name,
                    'description', 'new text')

    def test_accept_suggestion_valid_suggestion(self):
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(
                exp_services, '_is_suggestion_valid',
                self._return_true):
                with self.swap(
                    exp_services, 'update_exploration',
                    self._check_commit_message):
                    exp_services.accept_suggestion(
                        self.editor_id, self.THREAD_ID1, self.EXP_ID1,
                        self.COMMIT_MESSAGE, False)

            thread = feedback_models.FeedbackThreadModel.get(self.THREAD_ID1)
            thread_messages = feedback_services.get_messages(self.THREAD_ID1)
            last_message = thread_messages[len(thread_messages) - 1]
        self.assertEqual(thread.status, feedback_models.STATUS_CHOICES_FIXED)
        self.assertEqual(last_message.text, 'Suggestion accepted.')

    def test_accept_suggestion_invalid_suggestion(self):
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(
                exp_services, '_is_suggestion_valid',
                self._return_false):
                with self.assertRaisesRegexp(
                    Exception,
                    'Invalid suggestion: The state for which it was made '
                    'has been removed/renamed.'
                    ):
                    exp_services.accept_suggestion(
                        self.editor_id, self.THREAD_ID2, self.EXP_ID2,
                        self.COMMIT_MESSAGE, False)
            thread = feedback_models.FeedbackThreadModel.get(self.THREAD_ID2)
        self.assertEqual(thread.status, feedback_models.STATUS_CHOICES_OPEN)

    def test_accept_suggestion_empty_commit_message(self):
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.assertRaisesRegexp(
                Exception, 'Commit message cannot be empty.'):
                exp_services.accept_suggestion(
                    self.editor_id, self.THREAD_ID2, self.EXP_ID2,
                    self.EMPTY_COMMIT_MESSAGE, False)
            thread = feedback_models.FeedbackThreadModel.get(self.THREAD_ID2)
        self.assertEqual(thread.status, feedback_models.STATUS_CHOICES_OPEN)

    def test_accept_suggestion_that_has_already_been_handled(self):
        exception_message = 'Suggestion has already been accepted/rejected'
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(
                exp_services, '_is_suggestion_handled',
                self._return_true):
                with self.assertRaisesRegexp(Exception, exception_message):
                    exp_services.accept_suggestion(
                        self.editor_id, self.THREAD_ID2, self.EXP_ID2,
                        self.COMMIT_MESSAGE, False)

    def test_reject_suggestion(self):
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            exp_services.reject_suggestion(self.editor_id, self.THREAD_ID2)
            thread = feedback_models.FeedbackThreadModel.get(self.THREAD_ID2)
        self.assertEqual(
            thread.status,
            feedback_models.STATUS_CHOICES_IGNORED)

    def test_reject_suggestion_that_has_already_been_handled(self):
        exception_message = 'Suggestion has already been accepted/rejected'
        with self.swap(constants, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            with self.swap(
                exp_services, '_is_suggestion_handled',
                self._return_true):
                with self.assertRaisesRegexp(Exception, exception_message):
                    exp_services.reject_suggestion(
                        self.editor_id, self.THREAD_ID2)
