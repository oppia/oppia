# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for Feedback-related jobs."""

from __future__ import absolute_import # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import types

from core.domain import exp_domain
from core.domain import feedback_jobs_one_off
from core.domain import feedback_services
from core.domain import suggestion_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(email_models, feedback_models, suggestion_models, user_models) = (
    models.Registry.import_models([
        models.NAMES.email, models.NAMES.feedback, models.NAMES.suggestion,
        models.NAMES.user]))
taskqueue_services = models.Registry.import_taskqueue_services()


class FeedbackThreadCacheOneOffJobTest(test_utils.GenericTestBase):
    """Tests for one-off job to populate the caches of FeedbackThreads."""

    def setUp(self):
        super(FeedbackThreadCacheOneOffJobTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

    def _run_one_off_job(self):
        """Runs the one-off job under test and returns its output."""
        job_id = (
            feedback_jobs_one_off.FeedbackThreadCacheOneOffJob.create_new())
        feedback_jobs_one_off.FeedbackThreadCacheOneOffJob.enqueue(job_id)
        self.assertEqual(
            1,
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS))
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            0,
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS))
        job_output = (
            feedback_jobs_one_off.FeedbackThreadCacheOneOffJob.get_output(
                job_id))
        job_output_pairs = [ast.literal_eval(o) for o in job_output]
        return [(key, int(val)) for key, val in job_output_pairs]

    def _create_thread(self, author_id, text):
        """Helper wrapper for feedback_services.create_thread which only exposes
        arguments relevant to the cache.

        Args:
            author_id: str|None. ID of the user which created this thread, or
                None if the author was anonymous (not logged in).
            text: str. Content of the first message in the thread (allowed to be
                an empty string).

        Returns:
            str. The ID of the newly created thread.
        """
        return feedback_services.create_thread(
            'exploration', 'exp_id', author_id, 'subject', text)

    def _create_message(self, thread_id, author_id, text):
        """Helper wrapper for feedback_services.create_message which only
        exposes arguments relevant to the cache.

        Args:
            thread_id: str. ID of the thread to which this message should be
                appened to.
            author_id: str|None. ID of the user which created this message, or
                None if the author was anonymous (not logged in).
            text: str. Content of the first message in the thread (allowed to be
                an empty string).
        """
        feedback_services.create_message(thread_id, author_id, None, None, text)

    def test_cache_update_to_thread_with_1_message(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_cache_update_to_thread_with_2_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'second text')

    def test_cache_update_to_thread_with_1_empty_message(self):
        thread_id = self._create_thread(self.editor_id, '')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = 'Non-empty'
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, None)

    def test_cache_update_to_thread_with_2_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, '')
        self._create_message(thread_id, self.editor_id, '')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = 'Non-empty'
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, None)

    def test_cache_update_to_thread_with_empty_then_nonempty_messages(self):
        thread_id = self._create_thread(self.editor_id, '')
        self._create_message(thread_id, self.editor_id, 'first text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_cache_update_to_thread_with_nonempty_then_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, '')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_text = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_cache_update_to_thread_with_1_user_message(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_cache_update_to_thread_with_2_user_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_cache_update_to_thread_with_1_anon_message(self):
        thread_id = self._create_thread(None, 'first text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = self.editor_id
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_cache_update_to_thread_with_2_anon_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, None, 'second text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = self.editor_id
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_cache_update_to_thread_with_user_then_anon_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, None, 'second text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = self.editor_id
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_cache_update_to_thread_with_anon_then_user_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_cache_update_to_thread_with_user_then_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, None, '')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = None
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_cache_update_to_thread_with_anon_then_empty_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, self.editor_id, '')
        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        model.last_nonempty_message_author_id = self.editor_id
        model.put()

        self.assertEqual(self._run_one_off_job(), [('Updated', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_no_cache_update_to_thread_with_1_message(self):
        thread_id = self._create_thread(self.editor_id, 'first text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_no_cache_update_to_thread_with_2_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'second text')

    def test_no_cache_update_to_thread_with_1_empty_message(self):
        thread_id = self._create_thread(self.editor_id, '')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, None)

    def test_no_cache_update_to_thread_with_2_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, '')
        self._create_message(thread_id, self.editor_id, '')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, None)

    def test_no_cache_update_to_thread_with_empty_then_nonempty_messages(self):
        thread_id = self._create_thread(self.editor_id, '')
        self._create_message(thread_id, self.editor_id, 'first text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_no_cache_update_to_thread_with_nonempty_then_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, '')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_text, 'first text')

    def test_no_cache_update_to_thread_with_1_user_message(self):
        thread_id = self._create_thread(self.editor_id, 'first text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_no_cache_update_to_thread_with_2_user_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_no_cache_update_to_thread_with_1_anon_message(self):
        thread_id = self._create_thread(None, 'first text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_no_cache_update_to_thread_with_2_anon_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, None, 'second text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_no_cache_update_to_thread_with_user_then_anon_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, None, 'second text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)

    def test_no_cache_update_to_thread_with_anon_then_user_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, self.editor_id, 'second text')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_no_cache_update_to_thread_with_user_then_empty_messages(self):
        thread_id = self._create_thread(self.editor_id, 'first text')
        self._create_message(thread_id, None, '')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertEqual(model.last_nonempty_message_author_id, self.editor_id)

    def test_no_cache_update_to_thread_with_anon_then_empty_messages(self):
        thread_id = self._create_thread(None, 'first text')
        self._create_message(thread_id, self.editor_id, '')

        self.assertEqual(self._run_one_off_job(), [('Already up-to-date', 1)])

        model = feedback_models.GeneralFeedbackThreadModel.get_by_id(thread_id)
        self.assertIsNone(model.last_nonempty_message_author_id)



class FeedbackThreadIdRegenerateOneOffJobTest(test_utils.GenericTestBase):
    """Tests for one-off job to regenerate id for the FeedbackThread models."""

    def setUp(self):
        super(FeedbackThreadIdRegenerateOneOffJobTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.exp_id = 'exp_1'
        self.save_new_valid_exploration(
            self.exp_id, self.editor_id,
            title='New exploration',
            category='Maths',
            objective='Exploration objective')
        self.change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'Introduction',
            'new_value': {
                'content_id': 'content',
                'html': 'new suggestion content'
            }
        }

        def mock_generate_old_id(unused_cls, entity_type, entity_id):
            return '.'.join([
                entity_type, entity_id, utils.generate_random_string(6),
                utils.generate_random_string(6)])

        generate_id_swap = self.swap(
            feedback_models.GeneralFeedbackThreadModel,
            'generate_new_thread_id', types.MethodType(
                mock_generate_old_id,
                feedback_models.GeneralFeedbackThreadModel))

        with generate_id_swap:
            suggestion_services.create_suggestion(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id, 1,
                self.author_id, self.change, 'test description')

            feedback_services.create_thread(
                suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id, None,
                'Subject for the feedback', 'Nice lesson!')

    def _run_one_off_job(self):
        """Runs the one-off job under test and returns its output."""
        job_id = (
            feedback_jobs_one_off.FeedbackThreadIdRegenerateOneOffJob
            .create_new())
        feedback_jobs_one_off.FeedbackThreadIdRegenerateOneOffJob.enqueue(
            job_id)
        self.assertEqual(
            1, self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS))
        self.process_and_flush_pending_tasks()
        self.assertEqual(
            0, self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS))
        job_output = (
            feedback_jobs_one_off.FeedbackThreadIdRegenerateOneOffJob
            .get_output(job_id))
        job_output_pairs = [ast.literal_eval(o) for o in job_output]
        return [(key, int(val)) for key, val in job_output_pairs]

    def test_job_updates_old_thread_id_in_models(self):
        threads = feedback_services.get_threads(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id)

        self.assertEqual(len(threads), 2)

        if threads[0].has_suggestion:
            old_suggestion_thread = threads[0]
            old_feedback_thread = threads[1]
        else:
            old_suggestion_thread = threads[1]
            old_feedback_thread = threads[0]

        self.assertEqual(self._run_one_off_job(), [('SUCCESS', 2)])

        self.assertIsNone(
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                old_suggestion_thread.id))

        self.assertIsNone(
            feedback_models.GeneralFeedbackThreadModel.get_by_id(
                old_feedback_thread.id))

    def test_job_updates_only_old_thread_id_in_models(self):
        # Creating threads using new ID generation method.
        suggestion_services.create_suggestion(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id, 1,
            self.author_id, self.change, 'test description')

        feedback_services.create_thread(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id, None,
            'Subject for the feedback', 'Nice lesson!')

        threads = feedback_services.get_threads(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id)

        self.assertEqual(len(threads), 4)
        self.assertEqual(self._run_one_off_job(), [('SUCCESS', 2)])

    def test_job_correctly_replaces_suggestion_models(self):
        threads = feedback_services.get_threads(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id)
        self.assertEqual(len(threads), 2)

        old_suggestion_models = (
            suggestion_models.GeneralSuggestionModel
            .get_user_created_suggestions_of_suggestion_type(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                self.author_id))
        self.assertEqual(len(old_suggestion_models), 1)

        self.assertEqual(self._run_one_off_job(), [('SUCCESS', 2)])

        threads = feedback_services.get_threads(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id)
        self.assertEqual(len(threads), 2)

        if threads[0].has_suggestion:
            new_suggestion_thread = threads[0]
        else:
            new_suggestion_thread = threads[1]

        new_suggestion_models = (
            suggestion_models.GeneralSuggestionModel
            .get_user_created_suggestions_of_suggestion_type(
                suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
                self.author_id))
        self.assertEqual(len(new_suggestion_models), 1)
        self.assertEqual(new_suggestion_models[0].id, new_suggestion_thread.id)


        self.assertNotEqual(
            old_suggestion_models[0].id, new_suggestion_models[0].id)
        self.assertEqual(
            old_suggestion_models[0].to_dict(),
            new_suggestion_models[0].to_dict())

    def test_job_correctly_replaces_message_models(self):
        threads = feedback_services.get_threads(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id)

        self.assertEqual(len(threads), 2)

        if threads[0].has_suggestion:
            old_feedback_thread = threads[1]
        else:
            old_feedback_thread = threads[0]

        old_feedback_message_models = (
            feedback_models.GeneralFeedbackMessageModel.get_all_thread_messages(
                old_feedback_thread.id))
        self.assertEqual(len(old_feedback_message_models), 1)

        self.assertEqual(self._run_one_off_job(), [('SUCCESS', 2)])

        threads = feedback_services.get_threads(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id)

        self.assertEqual(len(threads), 2)

        if threads[0].has_suggestion:
            new_feedback_thread = threads[1]
        else:
            new_feedback_thread = threads[0]

        new_feedback_message_models = (
            feedback_models.GeneralFeedbackMessageModel.get_all_thread_messages(
                new_feedback_thread.id))
        self.assertEqual(len(new_feedback_message_models), 1)


        self.assertNotEqual(
            old_feedback_message_models[0].id,
            new_feedback_message_models[0].id)

        old_feedback_message_dict = old_feedback_message_models[0].to_dict()
        new_feedback_message_dict = new_feedback_message_models[0].to_dict()

        self.assertNotEqual(
            old_feedback_message_dict['thread_id'],
            new_feedback_message_dict['thread_id'])

        # Removing thread_id from the dict for comparing equality of other key
        # value pairs in the dict.
        del old_feedback_message_dict['thread_id']
        del new_feedback_message_dict['thread_id']

        self.assertEqual(
            old_feedback_message_dict, new_feedback_message_dict)

    def test_job_correctly_replaces_subscription_models(self):
        threads = feedback_services.get_threads(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id)
        self.assertEqual(len(threads), 2)

        old_suggestion_thread = threads[0 if threads[0].has_suggestion else 1]

        subscription_model = user_models.UserSubscriptionsModel.get_by_id(
            self.author_id)
        self.assertTrue(
            old_suggestion_thread.id in
            subscription_model.general_feedback_thread_ids)

        self.assertEqual(self._run_one_off_job(), [('SUCCESS', 2)])

        threads = feedback_services.get_threads(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id)
        self.assertEqual(len(threads), 2)

        new_suggestion_thread = threads[0 if threads[0].has_suggestion else 1]

        subscription_model = user_models.UserSubscriptionsModel.get_by_id(
            self.author_id)

        self.assertTrue(
            new_suggestion_thread.id in
            subscription_model.general_feedback_thread_ids)
        self.assertFalse(
            old_suggestion_thread.id in
            subscription_model.general_feedback_thread_ids)

    def test_job_correctly_replaces_feedback_email_reply_to_id_models(self):

        threads = feedback_services.get_threads(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id)
        self.assertEqual(len(threads), 2)

        old_suggestion_thread = threads[0 if threads[0].has_suggestion else 1]

        can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        can_send_feedback_email_ctx = self.swap(
            feconf, 'CAN_SEND_FEEDBACK_MESSAGE_EMAILS', True)

        with can_send_emails_ctx, can_send_feedback_email_ctx:
            feedback_services.create_message(
                old_suggestion_thread.id, self.editor_id, None, None,
                'Thanks for the feedback!')

        feedback_email_reply_to_id_models = (
            email_models.GeneralFeedbackEmailReplyToIdModel.get_by_thread_id(
                old_suggestion_thread.id))
        self.assertEqual(len(feedback_email_reply_to_id_models), 1)
        self.assertEqual(
            feedback_email_reply_to_id_models[0].id, '.'.join(
                [self.author_id, old_suggestion_thread.id]))

        self.assertEqual(self._run_one_off_job(), [('SUCCESS', 2)])

        threads = feedback_services.get_threads(
            suggestion_models.TARGET_TYPE_EXPLORATION, self.exp_id)
        self.assertEqual(len(threads), 2)

        new_suggestion_thread = threads[0 if threads[0].has_suggestion else 1]

        feedback_email_reply_to_id_models = (
            email_models.GeneralFeedbackEmailReplyToIdModel.get_by_thread_id(
                old_suggestion_thread.id))
        self.assertEqual(len(feedback_email_reply_to_id_models), 0)

        feedback_email_reply_to_id_models = (
            email_models.GeneralFeedbackEmailReplyToIdModel.get_by_thread_id(
                new_suggestion_thread.id))
        self.assertEqual(len(feedback_email_reply_to_id_models), 1)
        self.assertEqual(
            feedback_email_reply_to_id_models[0].id, '.'.join(
                [self.author_id, new_suggestion_thread.id]))
